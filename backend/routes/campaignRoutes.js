const express = require('express');
const mongoose = require('mongoose');
const Bull = require('bull');
const { requireAuth } = require('../middleware/auth');
const { buildMongoQuery } = require('../utils/queryBuilder');

const router = express.Router();

// Models
const Campaign = mongoose.model('Campaign');
const Customer = mongoose.model('Customer');
const CommunicationLog = mongoose.model('CommunicationLog');

// Queue
const campaignQueue = new Bull('campaign processing', process.env.REDIS_URL || 'redis://localhost:6379');

// Get all campaigns for authenticated user
router.get('/', requireAuth, async (req, res) => {
  try {
    const campaigns = await Campaign.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Preview audience size based on rules given by user
router.get('/preview', requireAuth, async (req, res) => {
  try {
    const { rules } = req.query;
    const parsedRules = JSON.parse(rules);
    
    const query = buildMongoQuery(parsedRules);
    const count = await Customer.countDocuments(query);
    
    res.json({ audienceSize: count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new campaign
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, segmentRules, message } = req.body;
    
    // Calculate audience size
    const query = buildMongoQuery(segmentRules);
    const audienceSize = await Customer.countDocuments(query);
    
    const campaign = new Campaign({
      name,
      userId: req.user.id,
      segmentRules,
      message,
      audienceSize,
      stats: { pending: audienceSize }
    });
    
    await campaign.save();
    
    // Add campaign to processing queue
    await campaignQueue.add('process-campaign', { campaignId: campaign._id });
    
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Real-time campaign monitoring
router.get('/:id/realtime', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const campaign = await Campaign.findById(id);
    if (!campaign || campaign.userId !== req.user.id) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    const recentLogs = await CommunicationLog.find({ campaignId: id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    const statusCounts = await CommunicationLog.aggregate([
      { $match: { campaignId: id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const hourlyStats = await CommunicationLog.aggregate([
      { $match: { campaignId: id, sentAt: { $exists: true } } },
      {
        $group: {
          _id: {
            hour: { $hour: '$sentAt' },
            date: { $dateToString: { format: '%Y-%m-%d', date: '$sentAt' } }
          },
          sent: { $sum: { $cond: [{ $eq: ['$status', 'SENT'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] } }
        }
      },
      { $sort: { '_id.date': -1, '_id.hour': -1 } },
      { $limit: 24 }
    ]);
    
    res.json({
      campaign,
      recentActivity: recentLogs,
      statusDistribution: statusCounts,
      hourlyTrends: hourlyStats,
      realTimeStats: {
        deliveryRate: calculateCampaignDeliveryRate(statusCounts),
        avgDeliveryTime: calculateAvgDeliveryTime(recentLogs),
        estimatedCompletion: estimateCompletionTime(campaign, statusCounts)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
function calculateCampaignDeliveryRate(statusCounts) {
  const sent = statusCounts.find(s => s._id === 'SENT')?.count || 0;
  const failed = statusCounts.find(s => s._id === 'FAILED')?.count || 0;
  return sent + failed > 0 ? ((sent / (sent + failed)) * 100).toFixed(1) : 0;
}

function calculateAvgDeliveryTime(logs) {
  const deliveredLogs = logs.filter(log => log.sentAt && log.createdAt);
  if (deliveredLogs.length === 0) return null;
  
  const totalTime = deliveredLogs.reduce((sum, log) => {
    return sum + (new Date(log.sentAt) - new Date(log.createdAt));
  }, 0);
  
  return Math.round(totalTime / deliveredLogs.length / 1000);
}

function estimateCompletionTime(campaign, statusCounts) {
  const completed = statusCounts.reduce((sum, s) => sum + s.count, 0);
  const remaining = campaign.audienceSize - completed;
  
  if (remaining <= 0) return null;
  
  const estimatedMinutes = Math.round(remaining / 10);
  return {
    remainingMessages: remaining,
    estimatedMinutes,
    estimatedCompletion: new Date(Date.now() + estimatedMinutes * 60000).toISOString()
  };
}

module.exports = router;