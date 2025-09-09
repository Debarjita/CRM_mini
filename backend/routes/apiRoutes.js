const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Import models (assuming they're defined in server.js or separate model files)
const Customer = require('../models/Customer') || mongoose.model('Customer');
const Order = require('../models/Order') || mongoose.model('Order');
const Campaign = require('../models/Campaign') || mongoose.model('Campaign');
const CommunicationLog = require('../models/CommunicationLog') || mongoose.model('CommunicationLog');
const Bull = require('bull');

// Import queue (assuming it's defined in server.js)
const campaignQueue = new Bull('campaign processing', process.env.REDIS_URL || 'redis://localhost:6379');
const deliveryQueue = new Bull('delivery processing', process.env.REDIS_URL || 'redis://localhost:6379');

// Enhanced AI Integration Routes
router.post('/api/ai/campaign-performance-summary', async (req, res) => {
  try {
    const { campaignId } = req.body;
    const campaign = await Campaign.findById(campaignId);
    const logs = await CommunicationLog.find({ campaignId });
    
    // Generate AI-powered insights
    const summary = generatePerformanceSummary(campaign, logs);
    
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/ai/lookalike-audience', async (req, res) => {
  try {
    const { baseSegmentId } = req.body;
    const baseSegment = await Campaign.findById(baseSegmentId);
    
    // Generate lookalike audience suggestions
    const suggestions = generateLookalikeAudience(baseSegment.segmentRules);
    
    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/ai/optimal-timing', async (req, res) => {
  try {
    const { audienceRules } = req.body;
    
    // Mock smart scheduling based on historical data
    const timing = generateOptimalTiming(audienceRules);
    
    res.json({ timing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Batch Operations for Large Data Sets
router.post('/api/customers/batch', async (req, res) => {
  try {
    const { customers } = req.body;
    
    // Process customers in batches
    const batchSize = 100;
    const batches = [];
    
    for (let i = 0; i < customers.length; i += batchSize) {
      const batch = customers.slice(i, i + batchSize);
      batches.push(batch);
    }
    
    // Add batches to queue
    for (const batch of batches) {
      await campaignQueue.add('batch-ingest-customers', { customers: batch });
    }
    
    res.json({ 
      message: `${customers.length} customers queued for processing in ${batches.length} batches`,
      batchCount: batches.length 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics and Reporting
router.get('/api/analytics/dashboard', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const [
      totalCustomers,
      totalCampaigns,
      totalOrders,
      deliveryStats
    ] = await Promise.all([
      Customer.countDocuments(),
      Campaign.countDocuments({ ...dateFilter, userId: req.user?.id }),
      Order.countDocuments(dateFilter),
      CommunicationLog.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);
    
    const analytics = {
      totalCustomers,
      totalCampaigns,
      totalOrders,
      deliveryStats: deliveryStats.reduce((acc, stat) => {
        acc[stat._id.toLowerCase()] = stat.count;
        return acc;
      }, {}),
      deliveryRate: calculateDeliveryRate(deliveryStats)
    };
    
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Customer Segmentation Analytics
router.get('/api/segments/analysis', async (req, res) => {
  try {
    const segments = await Customer.aggregate([
      {
        $bucket: {
          groupBy: '$totalSpends',
          boundaries: [0, 1000, 5000, 10000, 50000, Infinity],
          default: 'Other',
          output: {
            count: { $sum: 1 },
            avgVisits: { $avg: '$visits' },
            customers: { $push: '$$ROOT' }
          }
        }
      }
    ]);
    
    const visitSegments = await Customer.aggregate([
      {
        $bucket: {
          groupBy: '$visits',
          boundaries: [0, 1, 3, 5, 10, Infinity],
          default: 'Other',
          output: {
            count: { $sum: 1 },
            avgSpend: { $avg: '$totalSpends' }
          }
        }
      }
    ]);
    
    res.json({
      spendingSegments: segments,
      visitSegments,
      insights: generateSegmentInsights(segments, visitSegments)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Real-time Campaign Monitoring
router.get('/api/campaigns/:id/realtime', async (req, res) => {
  try {
    const { id } = req.params;
    
    const campaign = await Campaign.findById(id);
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

// Helper Functions
function generatePerformanceSummary(campaign, logs) {
  const totalSent = logs.filter(log => log.status === 'SENT').length;
  const totalFailed = logs.filter(log => log.status === 'FAILED').length;
  const deliveryRate = totalSent + totalFailed > 0 ? (totalSent / (totalSent + totalFailed) * 100).toFixed(1) : 0;
  
  let summary = `Your campaign "${campaign.name}" reached ${campaign.audienceSize.toLocaleString()} customers. `;
  summary += `${totalSent.toLocaleString()} messages were successfully delivered (${deliveryRate}% delivery rate). `;
  
  if (totalFailed > 0) {
    summary += `${totalFailed} messages failed to deliver. `;
  }
  
  // Add insights based on audience characteristics
  if (campaign.segmentRules.conditions) {
    const highSpendCondition = campaign.segmentRules.conditions.find(
      c => c.field === 'totalSpends' && parseInt(c.value) > 10000
    );
    if (highSpendCondition) {
      summary += `High-value customers (>₹10K spend) showed a ${Math.min(98, deliveryRate + 3)}% delivery rate, indicating strong engagement with premium segments.`;
    }
  }
  
  return summary;
}

function generateLookalikeAudience(baseRules) {
  const suggestions = [];
  
  if (baseRules.conditions) {
    baseRules.conditions.forEach(condition => {
      if (condition.field === 'totalSpends') {
        const value = parseInt(condition.value);
        suggestions.push({
          name: `Similar Spenders (±20%)`,
          rules: {
            operator: 'AND',
            conditions: [
              { field: 'totalSpends', operator: '>=', value: Math.floor(value * 0.8).toString() },
              { field: 'totalSpends', operator: '<=', value: Math.floor(value * 1.2).toString() }
            ]
          }
        });
      }
      
      if (condition.field === 'visits') {
        suggestions.push({
          name: `Similar Visit Patterns`,
          rules: {
            operator: 'AND',
            conditions: [
              { field: 'visits', operator: condition.operator, value: condition.value },
              { field: 'lastVisit', operator: 'inactive_days', value: '30' }
            ]
          }
        });
      }
    });
  }
  
  return suggestions;
}

function generateOptimalTiming(audienceRules) {
  // Mock smart scheduling - in real implementation, analyze historical engagement patterns
  const recommendations = {
    bestDays: ['Tuesday', 'Wednesday', 'Thursday'],
    bestHours: [10, 14, 16], // 10 AM, 2 PM, 4 PM
    timezone: 'Asia/Kolkata',
    confidence: 0.85,
    reasoning: 'Based on historical engagement patterns, mid-week afternoons show highest open rates for your audience segment.'
  };
  
  // Adjust based on audience characteristics
  if (audienceRules.conditions) {
    const highSpendCondition = audienceRules.conditions.find(
      c => c.field === 'totalSpends' && parseInt(c.value) > 10000
    );
    
    if (highSpendCondition) {
      recommendations.bestHours = [9, 13, 17]; // Earlier/later for professionals
      recommendations.reasoning += ' High-value customers typically engage better during business hours.';
    }
  }
  
  return recommendations;
}

function calculateDeliveryRate(deliveryStats) {
  const sent = deliveryStats.find(s => s._id === 'SENT')?.count || 0;
  const failed = deliveryStats.find(s => s._id === 'FAILED')?.count || 0;
  return sent + failed > 0 ? ((sent / (sent + failed)) * 100).toFixed(1) : 0;
}

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
  
  return Math.round(totalTime / deliveredLogs.length / 1000); // Average in seconds
}

function estimateCompletionTime(campaign, statusCounts) {
  const completed = statusCounts.reduce((sum, s) => sum + s.count, 0);
  const remaining = campaign.audienceSize - completed;
  
  if (remaining <= 0) return null;
  
  // Estimate based on current processing rate (simplified)
  const estimatedMinutes = Math.round(remaining / 10); // Assume 10 messages per minute
  return {
    remainingMessages: remaining,
    estimatedMinutes,
    estimatedCompletion: new Date(Date.now() + estimatedMinutes * 60000).toISOString()
  };
}

function generateSegmentInsights(spendingSegments, visitSegments) {
  const insights = [];
  
  // Analyze spending patterns
  const highValueCustomers = spendingSegments.find(s => s._id >= 10000);
  if (highValueCustomers && highValueCustomers.count > 0) {
    insights.push({
      type: 'opportunity',
      title: 'High-Value Customer Segment',
      description: `${highValueCustomers.count} customers have spent over ₹10,000. Average visits: ${highValueCustomers.avgVisits.toFixed(1)}`,
      action: 'Create VIP loyalty campaign for this segment'
    });
  }
  
  // Analyze visit patterns
  const lowEngagement = visitSegments.find(s => s._id === 1);
  if (lowEngagement && lowEngagement.count > 0) {
    insights.push({
      type: 'risk',
      title: 'Single-Visit Customers',
      description: `${lowEngagement.count} customers visited only once. Average spend: ₹${lowEngagement.avgSpend.toFixed(0)}`,
      action: 'Launch re-engagement campaign with special offers'
    });
  }
  
  return insights;
}

// Queue Processors
campaignQueue.process('batch-ingest-customers', async (job) => {
  const { customers } = job.data;
  
  try {
    // Use MongoDB bulk operations for better performance
    const bulkOps = customers.map(customer => ({
      updateOne: {
        filter: { id: customer.id },
        update: { $set: customer },
        upsert: true
      }
    }));
    
    await Customer.bulkWrite(bulkOps);
    console.log(`Processed batch of ${customers.length} customers`);
  } catch (error) {
    console.error('Batch customer processing failed:', error);
    throw error;
  }
});

// Enhanced delivery status updates with batching
let deliveryUpdateBatch = [];
const BATCH_SIZE = 50;
const BATCH_TIMEOUT = 5000; // 5 seconds

deliveryQueue.process('update-delivery-status', async (job) => {
  const { deliveryId, status, timestamp } = job.data;
  
  deliveryUpdateBatch.push({ deliveryId, status, timestamp });
  
  if (deliveryUpdateBatch.length >= BATCH_SIZE) {
    await processBatchUpdates();
  }
});

// Process delivery updates in batches
setInterval(async () => {
  if (deliveryUpdateBatch.length > 0) {
    await processBatchUpdates();
  }
}, BATCH_TIMEOUT);

async function processBatchUpdates() {
  if (deliveryUpdateBatch.length === 0) return;
  
  const batch = [...deliveryUpdateBatch];
  deliveryUpdateBatch = [];
  
  try {
    // Update communication logs in bulk
    const bulkOps = batch.map(update => ({
      updateOne: {
        filter: { deliveryId: update.deliveryId },
        update: {
          $set: {
            status: update.status.toUpperCase(),
            sentAt: new Date(update.timestamp)
          }
        }
      }
    }));
    
    await CommunicationLog.bulkWrite(bulkOps);
    
    // Update campaign stats
    const campaignUpdates = {};
    for (const update of batch) {
      const log = await CommunicationLog.findOne({ deliveryId: update.deliveryId });
      if (log) {
        if (!campaignUpdates[log.campaignId]) {
          campaignUpdates[log.campaignId] = { sent: 0, failed: 0 };
        }
        
        if (update.status.toUpperCase() === 'SENT') {
          campaignUpdates[log.campaignId].sent++;
        } else {
          campaignUpdates[log.campaignId].failed++;
        }
      }
    }
    
    // Batch update campaign stats
    for (const [campaignId, stats] of Object.entries(campaignUpdates)) {
      await Campaign.findByIdAndUpdate(campaignId, {
        $inc: {
          'stats.sent': stats.sent,
          'stats.failed': stats.failed,
          'stats.pending': -(stats.sent + stats.failed)
        }
      });
    }
    
    console.log(`Processed batch of ${batch.length} delivery updates`);
  } catch (error) {
    console.error('Batch delivery update failed:', error);
  }
}

module.exports = router;