const mongoose = require('mongoose');
const { buildMongoQuery } = require('../utils/queryBuilder');

// Models
const Customer = mongoose.model('Customer');
const Order = mongoose.model('Order');
const Campaign = mongoose.model('Campaign');
const CommunicationLog = mongoose.model('CommunicationLog');

// Enhanced delivery status updates with batching
let deliveryUpdateBatch = [];
const BATCH_SIZE = 50;
const BATCH_TIMEOUT = 5000; // 5 seconds

function processQueues(campaignQueue, deliveryQueue) {
  
  // Process single customer ingestion
  campaignQueue.process('ingest-customer', async (job) => {
    const customerData = job.data;
    try {
      await Customer.findOneAndUpdate(
        { id: customerData.id },
        customerData,
        { upsert: true, new: true }
      );
      console.log(`✅ Processed customer: ${customerData.id}`);
    } catch (error) {
      console.error('❌ Customer ingestion failed:', error);
      throw error;
    }
  });

  // Process batch customer ingestion
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
      console.log(`✅ Processed batch of ${customers.length} customers`);
    } catch (error) {
      console.error('❌ Batch customer processing failed:', error);
      throw error;
    }
  });

  // Process order ingestion
  campaignQueue.process('ingest-order', async (job) => {
    const orderData = job.data;
    
    try {
      // Save order
      await Order.findOneAndUpdate(
        { id: orderData.id },
        orderData,
        { upsert: true, new: true }
      );
      
      // Update customer stats
      await Customer.findOneAndUpdate(
        { id: orderData.customerId },
        {
          $inc: { 
            totalSpends: orderData.amount,
            visits: 1
          },
          $set: { lastVisit: new Date() }
        }
      );
      
      console.log(`✅ Processed order: ${orderData.id}`);
    } catch (error) {
      console.error('❌ Order processing failed:', error);
      throw error;
    }
  });

  // Process campaign - FIXED with deliveryId generation
  campaignQueue.process('process-campaign', async (job) => {
    const { campaignId } = job.data;
    
    try {
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        throw new Error(`Campaign ${campaignId} not found`);
      }
      
      const query = buildMongoQuery(campaign.segmentRules);
      const customers = await Customer.find(query);
      
      console.log(`🚀 Processing campaign: ${campaign.name} for ${customers.length} customers`);
      
      // Update campaign status
      await Campaign.findByIdAndUpdate(campaignId, { 
        status: 'PROCESSING',
        stats: { 
          sent: 0, 
          failed: 0, 
          pending: customers.length 
        }
      });
      
      // Create communication logs and send messages
      for (const customer of customers) {
        // IMPORTANT FIX: Generate deliveryId BEFORE creating log
        const deliveryId = `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const personalizedMessage = campaign.message.replace('{name}', customer.name || 'Customer');
        
        // Create communication log WITH deliveryId
        const commLog = new CommunicationLog({
          campaignId: campaign._id,
          customerId: customer.id,
          customerName: customer.name,
          customerEmail: customer.email,
          message: personalizedMessage,
          deliveryId: deliveryId, // FIXED: Include deliveryId
          status: 'PENDING'
        });
        
        await commLog.save();
        
        // Simulate vendor API call with delay
        setTimeout(async () => {
          const success = Math.random() > 0.1; // 90% success rate
          
          try {
            // Call dummy vendor API with the SAME deliveryId
            const response = await fetch(`http://localhost:${process.env.PORT || 5000}/api/vendor/send`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                deliveryId: deliveryId, // Use the same deliveryId
                customerEmail: customer.email,
                message: personalizedMessage,
                simulate: success ? 'success' : 'failure'
              })
            });
            
            if (!response.ok) {
              console.error(`❌ Vendor API call failed for ${deliveryId}: ${response.status}`);
            }
          } catch (error) {
            console.error(`❌ Failed to call vendor API for ${deliveryId}:`, error);
          }
        }, Math.random() * 5000); // Random delay up to 5 seconds
      }
      
      console.log(`✅ Campaign ${campaign.name} processing initiated for ${customers.length} customers`);
      
    } catch (error) {
      console.error('❌ Campaign processing failed:', error);
      
      // Update campaign status to failed
      await Campaign.findByIdAndUpdate(campaignId, { 
        status: 'FAILED' 
      }).catch(console.error);
      
      throw error;
    }
  });

  // Process delivery status updates with batching
  deliveryQueue.process('update-delivery-status', async (job) => {
    const { deliveryId, status, timestamp } = job.data;
    
    if (!deliveryId || !status) {
      throw new Error('deliveryId and status are required');
    }
    
    deliveryUpdateBatch.push({ 
      deliveryId, 
      status: status.toUpperCase(), 
      timestamp: timestamp || new Date().toISOString() 
    });
    
    if (deliveryUpdateBatch.length >= BATCH_SIZE) {
      await processBatchUpdates();
    }
  });

  // Process delivery updates in batches every BATCH_TIMEOUT
  setInterval(async () => {
    if (deliveryUpdateBatch.length > 0) {
      await processBatchUpdates();
    }
  }, BATCH_TIMEOUT);

  console.log('✅ Queue processors initialized');
}

// Process batch delivery updates - IMPROVED with better error handling
async function processBatchUpdates() {
  if (deliveryUpdateBatch.length === 0) return;
  
  const batch = [...deliveryUpdateBatch];
  deliveryUpdateBatch = []; // Clear the batch
  
  try {
    console.log(`📊 Processing batch of ${batch.length} delivery updates`);
    
    // Update communication logs in bulk
    const bulkOps = batch.map(update => ({
      updateOne: {
        filter: { deliveryId: update.deliveryId },
        update: {
          $set: {
            status: update.status,
            sentAt: new Date(update.timestamp)
          }
        }
      }
    }));
    
    const bulkResult = await CommunicationLog.bulkWrite(bulkOps);
    console.log(`✅ Updated ${bulkResult.modifiedCount} communication logs`);
    
    // Update campaign stats - IMPROVED: Group by campaign for batch updates
    const campaignUpdates = new Map();
    
    for (const update of batch) {
      try {
        const log = await CommunicationLog.findOne({ deliveryId: update.deliveryId });
        if (log && log.campaignId) {
          const campaignId = log.campaignId.toString();
          
          if (!campaignUpdates.has(campaignId)) {
            campaignUpdates.set(campaignId, { sent: 0, failed: 0 });
          }
          
          const stats = campaignUpdates.get(campaignId);
          if (update.status === 'SENT') {
            stats.sent++;
          } else if (update.status === 'FAILED') {
            stats.failed++;
          }
        }
      } catch (logError) {
        console.error(`❌ Error processing update for ${update.deliveryId}:`, logError);
      }
    }
    
    // Batch update campaign stats
    const campaignUpdatePromises = Array.from(campaignUpdates.entries()).map(([campaignId, stats]) => {
      return Campaign.findByIdAndUpdate(campaignId, {
        $inc: {
          'stats.sent': stats.sent,
          'stats.failed': stats.failed,
          'stats.pending': -(stats.sent + stats.failed)
        }
      }).catch(error => {
        console.error(`❌ Failed to update campaign ${campaignId} stats:`, error);
      });
    });
    
    await Promise.all(campaignUpdatePromises);
    
    console.log(`✅ Updated stats for ${campaignUpdates.size} campaigns`);
    
  } catch (error) {
    console.error('❌ Batch delivery update failed:', error);
    
    
    // deliveryUpdateBatch.push(...batch);
  }
}

module.exports = { processQueues };