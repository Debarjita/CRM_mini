// test-data.js - Testing utilities and sample data for the Mini CRM Platform
const mongoose = require('mongoose');
require('dotenv').config();

// Import models (assuming models are in a separate file)
require('./models');
const Customer = mongoose.model('Customer');
const User = mongoose.model('User');
const Campaign = mongoose.model('Campaign');
const Order = mongoose.model('Order');
const CommunicationLog = mongoose.model('CommunicationLog');

// Import sample data from sample-data.js
const { sampleCustomers, sampleOrders, connectDB, seedDatabase } = require('./sample-data');

// Sample segment rules for testing
const sampleSegmentRules = [
  {
    name: 'High Value Customers',
    rules: {
      operator: 'AND',
      conditions: [
        { field: 'totalSpends', operator: '>', value: '15000' },
        { field: 'visits', operator: '>=', value: '5' }
      ]
    },
    description: 'Customers who have spent more than ₹15,000 and visited at least 5 times'
  },
  {
    name: 'Inactive Premium Customers',
    rules: {
      operator: 'AND', 
      conditions: [
        { field: 'totalSpends', operator: '>', value: '10000' },
        { field: 'lastVisit', operator: 'inactive_days', value: '60' }
      ]
    },
    description: 'Premium customers who haven\'t visited in the last 60 days'
  },
  {
    name: 'New Low-Engagement Customers',
    rules: {
      operator: 'AND',
      conditions: [
        { field: 'visits', operator: '<=', value: '2' },
        { field: 'totalSpends', operator: '<', value: '5000' }
      ]
    },
    description: 'Customers with 2 or fewer visits and low spending'
  },
  {
    name: 'Frequent Shoppers',
    rules: {
      operator: 'AND',
      conditions: [
        { field: 'visits', operator: '>=', value: '6' },
        { field: 'lastVisit', operator: 'inactive_days', value: '30' }
      ]
    },
    description: 'Customers with 6+ visits who are still active in the last 30 days'
  }
];

// Sample campaign messages
const sampleCampaignMessages = [
  {
    segment: 'High Value Customers',
    messages: [
      'Hi {name}, thank you for being our valued customer! Enjoy exclusive 25% off on premium products.',
      'Dear {name}, as our VIP customer, you get early access to our new collection with 20% off.',
      '{name}, your loyalty means everything! Here\'s a special 30% discount just for you.'
    ]
  },
  {
    segment: 'Inactive Premium Customers',
    messages: [
      'Hi {name}, we miss you! Come back with 20% off your next purchase.',
      'Hey {name}, it\'s been a while! Here\'s a special 25% discount to welcome you back.',
      '{name}, your favorite items are waiting! Get 30% off this week only.'
    ]
  },
  {
    segment: 'New Low-Engagement Customers',
    messages: [
      'Welcome back {name}! Discover more with 15% off on your next order.',
      'Hi {name}, explore our bestsellers with this special 18% discount.',
      '{name}, don\'t miss out! Get 20% off on orders above ₹2000.'
    ]
  },
  {
    segment: 'Frequent Shoppers',
    messages: [
      'Hi {name}, you\'re amazing! Here\'s 15% off as a token of appreciation.',
      'Dear {name}, keep shopping and save more! 12% off on your next purchase.',
      '{name}, thanks for being a loyal customer! Enjoy 18% off today.'
    ]
  }
];

// AI test prompts for segment generation
const aiTestPrompts = [
  'Customers who spent over ₹20,000 and visited more than 5 times',
  'People who haven\'t shopped in 90 days but previously spent over ₹10,000',
  'New customers with only 1-2 visits and spending less than ₹3,000',
  'Active customers who visited in the last 30 days and spent over ₹5,000',
  'Premium customers with high spending but low visit frequency',
  'Customers who made their first purchase in the last 3 months',
  'Inactive users who haven\'t visited in 6 months but had high engagement before'
];

// Performance test data generator
const generateLargeCustomerDataset = (count = 1000) => {
  const customers = [];
  const names = ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Meera', 'Arjun', 'Kavya', 'Rohit', 'Divya'];
  const surnames = ['Kumar', 'Sharma', 'Patel', 'Reddy', 'Singh', 'Gupta', 'Agarwal', 'Nair', 'Krishnan', 'Iyer'];
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'company.com', 'business.in'];
  const tags = [['new-customer'], ['regular'], ['premium'], ['vip'], ['frequent-buyer'], ['inactive'], ['high-value']];
  
  for (let i = 0; i < count; i++) {
    const name = names[Math.floor(Math.random() * names.length)];
    const surname = surnames[Math.floor(Math.random() * surnames.length)];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const email = `${name.toLowerCase()}.${surname.toLowerCase()}${i}@${domain}`;
    
    // Generate realistic spending patterns
    const spendingTier = Math.random();
    let totalSpends, visits;
    
    if (spendingTier < 0.1) { // 10% high spenders
      totalSpends = Math.floor(Math.random() * 40000) + 15000; // ₹15k-55k
      visits = Math.floor(Math.random() * 15) + 5; // 5-20 visits
    } else if (spendingTier < 0.3) { // 20% medium spenders  
      totalSpends = Math.floor(Math.random() * 10000) + 5000; // ₹5k-15k
      visits = Math.floor(Math.random() * 8) + 2; // 2-10 visits
    } else { // 70% low spenders
      totalSpends = Math.floor(Math.random() * 5000) + 500; // ₹500-5k
      visits = Math.floor(Math.random() * 4) + 1; // 1-5 visits
    }
    
    // Generate last visit date (some recent, some old)
    const daysAgo = Math.floor(Math.random() * 180); // 0-180 days ago
    const lastVisit = new Date();
    lastVisit.setDate(lastVisit.getDate() - daysAgo);
    
    // Created date (1-12 months ago)
    const createdMonthsAgo = Math.floor(Math.random() * 12) + 1;
    const createdAt = new Date();
    createdAt.setMonth(createdAt.getMonth() - createdMonthsAgo);
    
    customers.push({
      id: `cust_${String(i + 1).padStart(6, '0')}`,
      name: `${name} ${surname}`,
      email,
      totalSpends,
      visits,
      lastVisit,
      createdAt,
      tags: tags[Math.floor(Math.random() * tags.length)]
    });
  }
  
  return customers;
};

// API testing utilities
const testDataIngestion = async (baseUrl = 'http://localhost:5000') => {
  console.log('🧪 Testing data ingestion APIs...');
  
  try {
    // Test single customer ingestion
    const customerResponse = await fetch(`${baseUrl}/api/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sampleCustomers[0])
    });
    
    if (customerResponse.ok) {
      console.log('✅ Customer ingestion API working');
    }
    
    // Test batch customer ingestion
    const batchResponse = await fetch(`${baseUrl}/api/customers/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customers: sampleCustomers.slice(1, 4) })
    });
    
    if (batchResponse.ok) {
      console.log('✅ Batch customer ingestion API working');
    }
    
    // Test order ingestion
    const orderResponse = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sampleOrders[0])
    });
    
    if (orderResponse.ok) {
      console.log('✅ Order ingestion API working');
    }
    
    console.log('🎉 Data ingestion testing completed!');
  } catch (error) {
    console.error('❌ Data ingestion testing failed:', error);
  }
};

const testCampaignCreation = async (baseUrl = 'http://localhost:5000') => {
  console.log('🧪 Testing campaign creation...');
  
  try {
    // Test audience preview
    const previewResponse = await fetch(
      `${baseUrl}/api/campaign/preview?rules=${encodeURIComponent(JSON.stringify(sampleSegmentRules[0].rules))}`,
      { credentials: 'include' }
    );
    
    if (previewResponse.ok) {
      const previewData = await previewResponse.json();
      console.log(`✅ Audience preview: ${previewData.audienceSize} customers`);
    } else {
      console.log(`❌ Audience preview failed: ${previewResponse.status} ${previewResponse.statusText}`);
      const errorText = await previewResponse.text();
      console.log(`   Error: ${errorText}`);
      return;
    }
    
    // Test campaign creation
    const campaignData = {
      name: sampleSegmentRules[0].name,
      segmentRules: sampleSegmentRules[0].rules,
      message: sampleCampaignMessages[0].messages[0]
    };
    
    const campaignResponse = await fetch(`${baseUrl}/api/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(campaignData)
    });
    
    if (campaignResponse.ok) {
      const campaign = await campaignResponse.json();
      console.log(`✅ Campaign created: ${campaign.name} (ID: ${campaign._id})`);
      return campaign._id;
    }
    
 } catch (error) {
    console.error('❌ Campaign creation testing failed:', error.message);
  }
};

const testAIFeatures = async (baseUrl = 'http://localhost:5000') => {
  console.log('🧪 Testing AI features...');
  
  try {
    // Test text to segment rules
    const segmentResponse = await fetch(`${baseUrl}/api/ai/segment-from-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ description: aiTestPrompts[0] })
    });
    
    if (segmentResponse.ok) {
      const segmentData = await segmentResponse.json();
      console.log('✅ AI segment generation working');
      console.log('   Generated rules:', JSON.stringify(segmentData.rules, null, 2));
    }
    
    // Test message suggestions
    const messageResponse = await fetch(`${baseUrl}/api/ai/message-suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ 
        objective: 'bring back high-value customers',
        audienceSize: 250 
      })
    });
    
    if (messageResponse.ok) {
      const messageData = await messageResponse.json();
      console.log('✅ AI message suggestions working');
      console.log('   Suggestions:', messageData.suggestions);
    }
    
  } catch (error) {
    console.error('❌ AI features testing failed:', error);
  }
};

// Performance benchmarking
const benchmarkPerformance = async (baseUrl = 'http://localhost:5000') => {
  console.log('⚡ Running performance benchmarks...');
  
  const benchmarks = {
    singleCustomerIngestion: async () => {
      const start = Date.now();
      const promises = [];
      
      for (let i = 0; i < 100; i++) {
        promises.push(
          fetch(`${baseUrl}/api/customers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...sampleCustomers[0],
              id: `bench_cust_${i}`,
              email: `bench${i}@example.com`
            })
          })
        );
      }
      
      await Promise.all(promises);
      const duration = Date.now() - start;
      console.log(`✅ 100 single customer requests: ${duration}ms (${(duration/100).toFixed(2)}ms avg)`);
    },
    
    batchCustomerIngestion: async () => {
      const start = Date.now();
      const batchSize = 100;
      const totalCustomers = 1000;
      const promises = [];
      
      for (let i = 0; i < totalCustomers; i += batchSize) {
        const batch = generateLargeCustomerDataset(batchSize).map((c, idx) => ({
          ...c,
          id: `batch_cust_${i + idx}`,
          email: `batch${i + idx}@example.com`
        }));
        
        promises.push(
          fetch(`${baseUrl}/api/customers/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customers: batch })
          })
        );
      }
      
      await Promise.all(promises);
      const duration = Date.now() - start;
      console.log(`✅ ${totalCustomers} customers in batches: ${duration}ms (${(totalCustomers/(duration/1000)).toFixed(0)} customers/sec)`);
    },
    
    audiencePreview: async () => {
      const start = Date.now();
      const promises = [];
      
      // Test different segment complexities
      for (const segmentRule of sampleSegmentRules) {
        promises.push(
          fetch(`${baseUrl}/api/customers/preview?rules=${encodeURIComponent(JSON.stringify(segmentRule.rules))}`, {
            credentials: 'include'
          })
        );
      }
      
      await Promise.all(promises);
      const duration = Date.now() - start;
      console.log(`✅ ${sampleSegmentRules.length} audience previews: ${duration}ms (${(duration/sampleSegmentRules.length).toFixed(2)}ms avg)`);
    }
  };
  
  try {
    await benchmarks.singleCustomerIngestion();
    await benchmarks.batchCustomerIngestion();
    await benchmarks.audiencePreview();
    console.log('🎉 Performance benchmarks completed!');
  } catch (error) {
    console.error('❌ Performance benchmarking failed:', error);
  }
};

// Export all utilities and data
module.exports = {
  sampleSegmentRules,
  sampleCampaignMessages,
  aiTestPrompts,
  generateLargeCustomerDataset,
  testDataIngestion,
  testCampaignCreation,
  testAIFeatures,
  benchmarkPerformance,
  seedDatabase,
  connectDB
};

// CLI usage
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'seed':
      seedDatabase();
      break;
    case 'test':
      (async () => {
        await testDataIngestion();
        await testCampaignCreation();
        await testAIFeatures();
      })();
      break;
    case 'benchmark':
      benchmarkPerformance();
      break;
    case 'generate':
      const count = parseInt(process.argv[3]) || 1000;
      const customers = generateLargeCustomerDataset(count);
      console.log(`Generated ${customers.length} test customers`);
      console.log('Sample:', JSON.stringify(customers.slice(0, 2), null, 2));
      break;
    default:
      console.log(`
Usage: node test-data.js <command>

Commands:
  seed      - Seed database with sample data
  test      - Run API tests with sample data
  benchmark - Run performance benchmarks  
  generate <count> - Generate test customer data

Examples:
  node test-data.js seed
  node test-data.js test
  node test-data.js generate 5000
      `);
  }
}