const express = require('express');
const mongoose = require('mongoose');
const Bull = require('bull');

const router = express.Router();

// Models
const Customer = mongoose.model('Customer');
const Order = mongoose.model('Order');

// Queue
const campaignQueue = new Bull('campaign processing', process.env.REDIS_URL || 'redis://localhost:6379');

// Single customer ingestion
router.post('/', async (req, res) => {
  try {
    const customerData = req.body;
    
    // Add to queue for async processing
    await campaignQueue.add('ingest-customer', customerData);
    
    res.status(202).json({ 
      message: 'Customer data queued for processing',
      id: customerData.id 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Batch customer ingestion
router.post('/batch', async (req, res) => {
  try {
    const { customers } = req.body;
    
    if (!Array.isArray(customers) || customers.length === 0) {
      return res.status(400).json({ error: 'Invalid customers array' });
    }
    
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

// Order ingestion
router.post('/orders', async (req, res) => {
  try {
    const orderData = req.body;
    
    // Add to queue for async processing
    await campaignQueue.add('ingest-order', orderData);
    
    res.status(202).json({ 
      message: 'Order data queued for processing',
      id: orderData.id 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all customers in the database 
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get customer statistics
router.get('/stats', async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const totalOrders = await Order.countDocuments();
    
    const spendingStats = await Customer.aggregate([
      {
        $group: {
          _id: null,
          avgSpend: { $avg: '$totalSpends' },
          maxSpend: { $max: '$totalSpends' },
          minSpend: { $min: '$totalSpends' },
          totalSpend: { $sum: '$totalSpends' }
        }
      }
    ]);
    
    res.json({
      totalCustomers,
      totalOrders,
      spendingStats: spendingStats[0] || {
        avgSpend: 0,
        maxSpend: 0,
        minSpend: 0,
        totalSpend: 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;