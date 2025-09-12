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

// IMPORTANT: Put specific routes BEFORE parameterized routes
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

// Get all campaigns for authenticated user
router.get('/', requireAuth, async (req, res) => {
  try {
    console.log('Campaign request user:', req.user);
    
    const userId = req.user.id || req.user.email;
    
    const campaigns = await Campaign.find({ 
      $or: [
        { userId: userId },
        { userId: req.user.email },
        { userEmail: req.user.email }
      ]
    }).sort({ createdAt: -1 });
    
    console.log(`Found ${campaigns.length} campaigns for user ${userId}`);
    res.json(campaigns);
  } catch (error) {
    console.error('Campaign fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Real-time campaign monitoring - FIXED VERSION
router.get('/:id/realtime', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('=== REALTIME DEBUG ===');
    console.log('Raw id parameter:', id);
    console.log('id type:', typeof id);
    console.log('id length:', id.length);
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('❌ Invalid ObjectId format:', id);
      return res.status(400).json({ 
        error: 'Invalid campaign ID format',
        received: id,
        expected: 'Valid MongoDB ObjectId (24 character hex string)'
      });
    }
    
    console.log('✅ Valid ObjectId format');
    
    // Find campaign with proper ObjectId conversion
    const campaign = await Campaign.findById(new mongoose.Types.ObjectId(id));
    
    if (!campaign) {
      console.log('❌ Campaign not found with id:', id);
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    console.log('✅ Campaign found:', campaign.name);
    
    // Check if user owns this campaign
    const userId = req.user.id || req.user.email;
    const campaignUserId = campaign.userId || campaign.userEmail;
    
    if (campaignUserId !== userId && campaign.userId !== req.user.email) {
      console.log('❌ User does not own campaign');
      console.log('Campaign userId:', campaignUserId);
      console.log('Request userId:', userId);
      return res.status(403).json({ error: 'Access denied to this campaign' });
    }
    
    console.log('✅ User owns campaign');
    
    // Get recent logs
    const recentLogs = await CommunicationLog.find({ campaignId: id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    console.log('✅ Found', recentLogs.length, 'recent logs');
    
    // Get status counts
    const statusCounts = await CommunicationLog.aggregate([
      { $match: { campaignId: id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('✅ Status counts:', statusCounts);
    
    // Get hourly stats
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
    
    console.log('✅ Hourly stats calculated');
    
    const response = {
      campaign,
      recentActivity: recentLogs,
      statusDistribution: statusCounts,
      hourlyTrends: hourlyStats,
      realTimeStats: {
        deliveryRate: calculateCampaignDeliveryRate(statusCounts),
        avgDeliveryTime: calculateAvgDeliveryTime(recentLogs),
        estimatedCompletion: estimateCompletionTime(campaign, statusCounts)
      }
    };
    
    console.log('✅ Sending response');
    res.json(response);
    
  } catch (error) {
    console.error('❌ Realtime endpoint error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Create new campaign
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, segmentRules, message } = req.body;
    
    // Calculate audience size
    const query = buildMongoQuery(segmentRules);
    const audienceSize = await Customer.countDocuments(query);
    
    const userId = req.user.id || req.user.email;
    
    const campaign = new Campaign({
      name,
      userId: userId,
      userEmail: req.user.email,
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
    console.error('Campaign creation error:', error);
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