const express = require('express');
const mongoose = require('mongoose');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Models
const Customer = mongoose.model('Customer');
const Campaign = mongoose.model('Campaign');
const Order = mongoose.model('Order');
const CommunicationLog = mongoose.model('CommunicationLog');

// Dashboard analytics
router.get('/dashboard', requireAuth, async (req, res) => {
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

// Customer segmentation analysis
router.get('/segments/analysis', requireAuth, async (req, res) => {
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

// Campaign performance metrics
router.get('/campaigns/performance', requireAuth, async (req, res) => {
  try {
    const { campaignId, period } = req.query;
    
    let dateFilter = {};
    if (period) {
      const days = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      dateFilter.createdAt = { $gte: startDate };
    }
    
    let matchFilter = { ...dateFilter };
    if (campaignId) {
      matchFilter.campaignId = campaignId;
    }
    
    const performanceData = await CommunicationLog.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          sent: { $sum: { $cond: [{ $eq: ['$_id.status', 'SENT'] }, '$count', 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$_id.status', 'FAILED'] }, '$count', 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$_id.status', 'PENDING'] }, '$count', 0] } }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    res.json({ performanceData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Revenue analytics
router.get('/revenue', requireAuth, async (req, res) => {
  try {
    const { period } = req.query;
    
    let dateFilter = {};
    if (period) {
      const days = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      dateFilter.date = { $gte: startDate };
    }
    
    const revenueData = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          totalRevenue: { $sum: '$amount' },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: '$amount' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    const totalRevenue = revenueData.reduce((sum, day) => sum + day.totalRevenue, 0);
    const totalOrders = revenueData.reduce((sum, day) => sum + day.orderCount, 0);
    
    res.json({
      revenueData,
      summary: {
        totalRevenue,
        totalOrders,
        avgOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
function calculateDeliveryRate(deliveryStats) {
  const sent = deliveryStats.find(s => s._id === 'SENT')?.count || 0;
  const failed = deliveryStats.find(s => s._id === 'FAILED')?.count || 0;
  return sent + failed > 0 ? ((sent / (sent + failed)) * 100).toFixed(1) : 0;
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

module.exports = router;