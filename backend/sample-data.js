// sample-data.js - Test data for the Mini CRM Platform
const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

require("./models"); // if this loads all schemas
const Customer = mongoose.model("Customer");
const User = mongoose.model("User");
const Campaign = mongoose.model("Campaign");
const Order = mongoose.model("Order");
const communicationLog= mongoose.model("CommunicationLog");

// Fixed sample users - removed custom id field, let MongoDB generate _id
const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    createdAt: new Date('2023-01-01T00:00:00Z')
  },
  {
    name: 'Marketing Manager',
    email: 'marketing@example.com',
    role: 'user', // Changed from 'manager' to match schema enum
    createdAt: new Date('2023-01-15T00:00:00Z')
  },
  {
    name: 'Campaign Specialist',
    email: 'campaigns@example.com',
    role: 'user',
    createdAt: new Date('2023-02-01T00:00:00Z')
  }
];

const sampleCustomers = [
  {
    id: 'cust_001',
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@example.com',
    totalSpends: 25000,
    visits: 8,
    lastVisit: new Date('2024-01-15T10:30:00Z'),
    createdAt: new Date('2023-06-15T08:00:00Z'),
    tags: ['vip', 'frequent-buyer']
  },
  {
    id: 'cust_002', 
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    totalSpends: 8500,
    visits: 3,
    lastVisit: new Date('2024-01-10T14:20:00Z'),
    createdAt: new Date('2023-08-20T12:00:00Z'),
    tags: ['regular']
  },
  {
    id: 'cust_003',
    name: 'Amit Patel',
    email: 'amit.patel@example.com', 
    totalSpends: 45000,
    visits: 12,
    lastVisit: new Date('2024-01-20T09:15:00Z'),
    createdAt: new Date('2023-04-10T16:30:00Z'),
    tags: ['vip', 'premium', 'frequent-buyer']
  },
  {
    id: 'cust_004',
    name: 'Sneha Reddy',
    email: 'sneha.reddy@example.com',
    totalSpends: 3200,
    visits: 2,
    lastVisit: new Date('2023-12-05T11:45:00Z'),
    createdAt: new Date('2023-11-01T09:00:00Z'), 
    tags: ['new-customer']
  },
  {
    id: 'cust_005',
    name: 'Vikram Singh',
    email: 'vikram.singh@example.com',
    totalSpends: 15600,
    visits: 6,
    lastVisit: new Date('2024-01-18T15:30:00Z'),
    createdAt: new Date('2023-07-12T14:15:00Z'),
    tags: ['premium', 'regular']
  },
  {
    id: 'cust_006',
    name: 'Meera Gupta',
    email: 'meera.gupta@example.com',
    totalSpends: 1200,
    visits: 1,
    lastVisit: new Date('2023-10-22T12:00:00Z'),
    createdAt: new Date('2023-10-22T12:00:00Z'),
    tags: ['new-customer', 'low-engagement']
  },
  {
    id: 'cust_007',
    name: 'Arjun Krishnan',
    email: 'arjun.krishnan@example.com',
    totalSpends: 32000,
    visits: 9,
    lastVisit: new Date('2024-01-22T13:45:00Z'),
    createdAt: new Date('2023-05-08T10:30:00Z'),
    tags: ['vip', 'premium']
  },
  {
    id: 'cust_008',
    name: 'Kavya Nair',
    email: 'kavya.nair@example.com',
    totalSpends: 7800,
    visits: 4,
    lastVisit: new Date('2023-11-30T16:20:00Z'),
    createdAt: new Date('2023-09-15T11:00:00Z'),
    tags: ['regular', 'inactive']
  },
  {
    id: 'cust_009',
    name: 'Rohit Agarwal',
    email: 'rohit.agarwal@example.com',
    totalSpends: 18900,
    visits: 7,
    lastVisit: new Date('2024-01-25T10:15:00Z'),
    createdAt: new Date('2023-03-22T15:45:00Z'),
    tags: ['premium', 'frequent-buyer']
  },
  {
    id: 'cust_010',
    name: 'Divya Iyer',
    email: 'divya.iyer@example.com',
    totalSpends: 950,
    visits: 1,
    lastVisit: new Date('2023-12-10T14:30:00Z'),
    createdAt: new Date('2023-12-10T14:30:00Z'),
    tags: ['new-customer']
  }
];

const sampleOrders = [
  {
    id: 'order_001',
    customerId: 'cust_001',
    amount: 3500,
    date: new Date('2024-01-15T10:30:00Z'),
    items: ['Premium Headphones', 'Wireless Charger']
  },
  {
    id: 'order_002',
    customerId: 'cust_002', 
    amount: 1200,
    date: new Date('2024-01-10T14:20:00Z'),
    items: ['T-Shirt', 'Jeans']
  },
  {
    id: 'order_003',
    customerId: 'cust_003',
    amount: 8500,
    date: new Date('2024-01-20T09:15:00Z'),
    items: ['Laptop', 'Mouse', 'Laptop Bag']
  },
  {
    id: 'order_004',
    customerId: 'cust_001',
    amount: 2200,
    date: new Date('2024-01-05T16:45:00Z'),
    items: ['Smartphone Case', 'Screen Protector', 'Power Bank']
  },
  {
    id: 'order_005',
    customerId: 'cust_005',
    amount: 4800,
    date: new Date('2024-01-18T15:30:00Z'),
    items: ['Gaming Chair', 'Desk Lamp']
  },
  {
    id: 'order_006',
    customerId: 'cust_007',
    amount: 12000,
    date: new Date('2024-01-22T13:45:00Z'),
    items: ['Smart TV', 'Soundbar', 'TV Stand']
  },
  {
    id: 'order_007',
    customerId: 'cust_003',
    amount: 6700,
    date: new Date('2023-12-28T11:20:00Z'),
    items: ['Tablet', 'Tablet Cover', 'Stylus']
  },
  {
    id: 'order_008',
    customerId: 'cust_009',
    amount: 3200,
    date: new Date('2024-01-25T10:15:00Z'),
    items: ['Smartwatch', 'Watch Bands']
  }
];

// Updated sample campaigns to use actual user IDs after insertion
const createSampleCampaigns = (userIds) => [
  {
    name: 'Summer Sale VIP Customers',
    userId: userIds[0], // Use actual MongoDB ObjectId
    segmentRules: {
      operator: 'AND',
      conditions: [
        {
          field: 'totalSpends',
          operator: 'gte',
          value: 500
        },
        {
          field: 'visits',
          operator: 'gte',
          value: 5
        }
      ]
    },
    message: '🌞 Exclusive Summer Sale Alert! As one of our VIP customers, enjoy 25% off all premium items. Use code SUMMER25 at checkout. Valid until July 31st!',
    audienceSize: 152,
    status: 'COMPLETED',
    stats: {
      sent: 150,
      failed: 2,
      pending: 0
    },
    createdAt: new Date('2024-07-15T10:00:00Z')
  },
  {
    name: 'Win Back Inactive Customers',
    userId: userIds[0],
    segmentRules: {
      operator: 'AND',
      conditions: [
        {
          field: 'lastVisit',
          operator: 'lt',
          value: new Date('2024-06-01T00:00:00Z')
        },
        {
          field: 'totalSpends',
          operator: 'gte',
          value: 100
        }
      ]
    },
    message: 'We miss you! 💔 It\'s been a while since your last visit. Here\'s 30% off to welcome you back. Use code COMEBACK30. We have exciting new arrivals waiting for you!',
    audienceSize: 89,
    status: 'PROCESSING',
    stats: {
      sent: 45,
      failed: 1,
      pending: 43
    },
    createdAt: new Date('2024-08-20T14:30:00Z')
  },
  {
    name: 'New Customer Welcome Series',
    userId: userIds[1],
    segmentRules: {
      operator: 'AND',
      conditions: [
        {
          field: 'visits',
          operator: 'eq',
          value: 1
        },
        {
          field: 'createdAt',
          operator: 'gte',
          value: new Date('2024-08-01T00:00:00Z')
        }
      ]
    },
    message: 'Welcome to our family! 🎉 Thank you for your first purchase. Enjoy 15% off your next order with code WELCOME15. Plus, get free shipping on orders over $50!',
    audienceSize: 234,
    status: 'COMPLETED',
    stats: {
      sent: 230,
      failed: 4,
      pending: 0
    },
    createdAt: new Date('2024-08-25T09:15:00Z')
  },
  {
    name: 'High Value Birthday Campaign',
    userId: userIds[0],
    segmentRules: {
      operator: 'OR',
      conditions: [
        {
          field: 'totalSpends',
          operator: 'gte',
          value: 1000
        },
        {
          field: 'tags',
          operator: 'contains',
          value: 'birthday-month'
        }
      ]
    },
    message: '🎂 Happy Birthday Month! Celebrate with an exclusive 40% off your entire purchase. As a valued customer, you deserve the best. Code: BIRTHDAY40',
    audienceSize: 67,
    status: 'PENDING',
    stats: {
      sent: 0,
      failed: 0,
      pending: 67
    },
    createdAt: new Date('2024-09-01T16:45:00Z')
  },
  {
    name: 'Flash Sale - Limited Time',
    userId: userIds[1],
    segmentRules: {
      operator: 'AND',
      conditions: [
        {
          field: 'visits',
          operator: 'gte',
          value: 3
        },
        {
          field: 'lastVisit',
          operator: 'gte',
          value: new Date('2024-08-15T00:00:00Z')
        }
      ]
    },
    message: '⚡ FLASH SALE ALERT! 24 hours only - 50% off selected items! You\'ve been chosen for early access. Shop now before it\'s gone! No code needed.',
    audienceSize: 445,
    status: 'FAILED',
    stats: {
      sent: 203,
      failed: 242,
      pending: 0
    },
    createdAt: new Date('2024-08-30T11:20:00Z')
  }
];

// Sample segment rules for different customer segments
const sampleSegmentRules = [
  {
    name: 'VIP Customers',
    rules: {
      operator: 'AND',
      conditions: [
        { field: 'totalSpends', operator: 'gte', value: 10000 },
        { field: 'visits', operator: 'gte', value: 5 }
      ]
    }
  },
  {
    name: 'New Customers',
    rules: {
      operator: 'AND',
      conditions: [
        { field: 'visits', operator: 'lte', value: 2 },
        { field: 'createdAt', operator: 'gte', value: new Date('2024-01-01') }
      ]
    }
  },
  {
    name: 'Inactive Customers',
    rules: {
      operator: 'AND',
      conditions: [
        { field: 'lastVisit', operator: 'lt', value: new Date('2023-12-01') },
        { field: 'totalSpends', operator: 'gte', value: 100 }
      ]
    }
  },
  {
    name: 'High Value Recent',
    rules: {
      operator: 'AND',
      conditions: [
        { field: 'totalSpends', operator: 'gte', value: 5000 },
        { field: 'lastVisit', operator: 'gte', value: new Date('2024-01-01') }
      ]
    }
  },
  {
    name: 'Frequent Buyers',
    rules: {
      operator: 'AND',
      conditions: [
        { field: 'visits', operator: 'gte', value: 10 },
        { field: 'tags', operator: 'contains', value: 'frequent-buyer' }
      ]
    }
  }
];

// Sample campaign messages for different scenarios
const sampleCampaignMessages = [
  {
    type: 'welcome',
    subject: 'Welcome to our family!',
    content: 'Thank you for joining us! Enjoy 15% off your next purchase with code WELCOME15.'
  },
  {
    type: 'sale',
    subject: 'Exclusive Sale Alert!',
    content: '🔥 Limited time offer! Get up to 50% off selected items. Shop now before it\'s gone!'
  },
  {
    type: 'winback',
    subject: 'We miss you!',
    content: 'It\'s been a while since your last visit. Here\'s 20% off to welcome you back!'
  },
  {
    type: 'birthday',
    subject: 'Happy Birthday!',
    content: '🎉 Celebrate your special day with 25% off everything! Code: BIRTHDAY25'
  },
  {
    type: 'vip',
    subject: 'VIP Exclusive Offer',
    content: 'As our valued VIP customer, enjoy early access to our premium collection with 30% off!'
  },
  {
    type: 'reminder',
    subject: 'Don\'t forget your cart!',
    content: 'You left some amazing items in your cart. Complete your purchase and get free shipping!'
  }
];

// Function to generate sample communication logs with actual campaign IDs
const generateSampleCommunicationLogs = (insertedCampaigns) => {
  const campaigns = Array.isArray(insertedCampaigns) ? insertedCampaigns : [insertedCampaigns];
  
  return [
    // Logs for first campaign (Summer Sale VIP)
    {
      campaignId: campaigns[0]._id.toString(),
      customerId: 'cust_001',
      customerName: 'John Smith',
      customerEmail: 'john.smith@email.com',
      message: '🌞 Exclusive Summer Sale Alert! As one of our VIP customers, enjoy 25% off all premium items. Use code SUMMER25 at checkout. Valid until July 31st!',
      status: 'SENT',
      deliveryId: 'del_12345_001',
      sentAt: new Date('2024-07-15T10:15:00Z'),
      createdAt: new Date('2024-07-15T10:00:00Z')
    },
    {
      campaignId: campaigns[0]._id.toString(),
      customerId: 'cust_003',
      customerName: 'Emily Johnson',
      customerEmail: 'emily.johnson@email.com',
      message: '🌞 Exclusive Summer Sale Alert! As one of our VIP customers, enjoy 25% off all premium items. Use code SUMMER25 at checkout. Valid until July 31st!',
      status: 'SENT',
      deliveryId: 'del_12345_002',
      sentAt: new Date('2024-07-15T10:16:00Z'),
      createdAt: new Date('2024-07-15T10:00:00Z')
    },
    {
      campaignId: campaigns[0]._id.toString(),
      customerId: 'cust_005',
      customerName: 'Michael Davis',
      customerEmail: 'michael.davis@email.com',
      message: '🌞 Exclusive Summer Sale Alert! As one of our VIP customers, enjoy 25% off all premium items. Use code SUMMER25 at checkout. Valid until July 31st!',
      status: 'FAILED',
      deliveryId: null,
      sentAt: null,
      createdAt: new Date('2024-07-15T10:00:00Z')
    },

    // Logs for second campaign (Win Back Inactive)
    {
      campaignId: campaigns[1]._id.toString(),
      customerId: 'cust_002',
      customerName: 'Sarah Wilson',
      customerEmail: 'sarah.wilson@email.com',
      message: 'We miss you! 💔 It\'s been a while since your last visit. Here\'s 30% off to welcome you back. Use code COMEBACK30. We have exciting new arrivals waiting for you!',
      status: 'SENT',
      deliveryId: 'del_12346_001',
      sentAt: new Date('2024-08-20T14:45:00Z'),
      createdAt: new Date('2024-08-20T14:30:00Z')
    },
    {
      campaignId: campaigns[1]._id.toString(),
      customerId: 'cust_004',
      customerName: 'Robert Brown',
      customerEmail: 'robert.brown@email.com',
      message: 'We miss you! 💔 It\'s been a while since your last visit. Here\'s 30% off to welcome you back. Use code COMEBACK30. We have exciting new arrivals waiting for you!',
      status: 'PENDING',
      deliveryId: null,
      sentAt: null,
      createdAt: new Date('2024-08-20T14:30:00Z')
    },

    // Logs for third campaign (New Customer Welcome)
    {
      campaignId: campaigns[2]._id.toString(),
      customerId: 'cust_006',
      customerName: 'Lisa Anderson',
      customerEmail: 'lisa.anderson@email.com',
      message: 'Welcome to our family! 🎉 Thank you for your first purchase. Enjoy 15% off your next order with code WELCOME15. Plus, get free shipping on orders over $50!',
      status: 'SENT',
      deliveryId: 'del_12347_001',
      sentAt: new Date('2024-08-25T09:30:00Z'),
      createdAt: new Date('2024-08-25T09:15:00Z')
    },
    {
      campaignId: campaigns[2]._id.toString(),
      customerId: 'cust_007',
      customerName: 'David Thompson',
      customerEmail: 'david.thompson@email.com',
      message: 'Welcome to our family! 🎉 Thank you for your first purchase. Enjoy 15% off your next order with code WELCOME15. Plus, get free shipping on orders over $50!',
      status: 'SENT',
      deliveryId: 'del_12347_002',
      sentAt: new Date('2024-08-25T09:31:00Z'),
      createdAt: new Date('2024-08-25T09:15:00Z')
    },

    // Logs for fourth campaign (Birthday Campaign - pending)
    {
      campaignId: campaigns[3]._id.toString(),
      customerId: 'cust_001',
      customerName: 'John Smith',
      customerEmail: 'john.smith@email.com',
      message: '🎂 Happy Birthday Month! Celebrate with an exclusive 40% off your entire purchase. As a valued customer, you deserve the best. Code: BIRTHDAY40',
      status: 'PENDING',
      deliveryId: null,
      sentAt: null,
      createdAt: new Date('2024-09-01T16:45:00Z')
    },
    {
      campaignId: campaigns[3]._id.toString(),
      customerId: 'cust_008',
      customerName: 'Jessica Martinez',
      customerEmail: 'jessica.martinez@email.com',
      message: '🎂 Happy Birthday Month! Celebrate with an exclusive 40% off your entire purchase. As a valued customer, you deserve the best. Code: BIRTHDAY40',
      status: 'PENDING',
      deliveryId: null,
      sentAt: null,
      createdAt: new Date('2024-09-01T16:45:00Z')
    },

    // Logs for fifth campaign (Flash Sale - mixed results)
    {
      campaignId: campaigns[4]._id.toString(),
      customerId: 'cust_009',
      customerName: 'Chris Lee',
      customerEmail: 'chris.lee@email.com',
      message: '⚡ FLASH SALE ALERT! 24 hours only - 50% off selected items! You\'ve been chosen for early access. Shop now before it\'s gone! No code needed.',
      status: 'SENT',
      deliveryId: 'del_12348_001',
      sentAt: new Date('2024-08-30T11:35:00Z'),
      createdAt: new Date('2024-08-30T11:20:00Z')
    },
    {
      campaignId: campaigns[4]._id.toString(),
      customerId: 'cust_010',
      customerName: 'Amanda Taylor',
      customerEmail: 'amanda.taylor@email.com',
      message: '⚡ FLASH SALE ALERT! 24 hours only - 50% off selected items! You\'ve been chosen for early access. Shop now before it\'s gone! No code needed.',
      status: 'FAILED',
      deliveryId: null,
      sentAt: null,
      createdAt: new Date('2024-08-30T11:20:00Z')
    }
  ];
};

// Generate large dataset functions
const generateLargeCustomerDataset = (count) => {
  const customers = [];
  const tags = ['vip', 'regular', 'premium', 'new-customer', 'inactive', 'frequent-buyer'];
  
  for (let i = 1; i <= count; i++) {
    customers.push({
      id: `perf_cust_${i}`,
      name: `Performance Customer ${i}`,
      email: `perf.customer.${i}@example.com`,
      totalSpends: Math.floor(Math.random() * 50000),
      visits: Math.floor(Math.random() * 20) + 1,
      lastVisit: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - Math.random() * 730 * 24 * 60 * 60 * 1000),
      tags: [tags[Math.floor(Math.random() * tags.length)]]
    });
  }
  
  return customers;
};

const generateLargeCommunicationLogsDataset = (count, insertedCampaigns) => {
  const logs = [];
  const statuses = ['SENT', 'PENDING', 'FAILED'];
  const campaignIds = insertedCampaigns.map(c => c._id.toString());
  
  for (let i = 0; i < count; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const campaignId = campaignIds[Math.floor(Math.random() * campaignIds.length)];
    const customerId = `perf_cust_${Math.floor(Math.random() * 5000) + 1}`;
    
    const createdAt = new Date();
    createdAt.setMonth(createdAt.getMonth() - Math.floor(Math.random() * 6));
    
    const log = {
      campaignId,
      customerId,
      customerName: `Performance Customer ${i + 1}`,
      customerEmail: `perf.customer.${i + 1}@example.com`,
      message: `Performance test message for customer ${i + 1}`,
      status,
      deliveryId: status === 'SENT' ? `perf_del_${i + 1}` : null,
      sentAt: status === 'SENT' ? new Date(createdAt.getTime() + Math.random() * 3600000) : null,
      createdAt
    };
    
    logs.push(log);
  }
  
  return logs;
};

// Database seeding script
const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('🌱 Starting database seeding...');
    
    // Clear existing data
    await Customer.deleteMany({});
    await Order.deleteMany({});
    await Campaign.deleteMany({});
    await communicationLog.deleteMany({});
    await User.deleteMany({});
    console.log('✅ Cleared existing data');
    
    // Insert sample users first and get their IDs
    const insertedUsers = await User.insertMany(sampleUsers);
    console.log(`✅ Inserted ${sampleUsers.length} sample users`);
    
    // Extract user IDs for campaigns
    const userIds = insertedUsers.map(user => user._id.toString());
    
    // Insert sample customers
    await Customer.insertMany(sampleCustomers);
    console.log(`✅ Inserted ${sampleCustomers.length} sample customers`);
    
    // Insert sample orders
    await Order.insertMany(sampleOrders);
    console.log(`✅ Inserted ${sampleOrders.length} sample orders`);
    
    // Create and insert sample campaigns with actual user IDs
    const sampleCampaigns = createSampleCampaigns(userIds);
    const insertedCampaigns = await Campaign.insertMany(sampleCampaigns);
    console.log(`✅ Inserted ${sampleCampaigns.length} sample campaigns`);
    
    // Generate and insert communication logs with actual campaign IDs
    const communicationLogsData = generateSampleCommunicationLogs(insertedCampaigns);
    await communicationLog.insertMany(communicationLogsData);
    console.log(`✅ Inserted ${communicationLogsData.length} sample communication logs`);
    
    // Generate and insert large dataset for performance testing
    if (process.env.SEED_LARGE_DATASET === 'true') {
      console.log('🔄 Generating large dataset for performance testing...');
      
      const largeCustomerDataset = generateLargeCustomerDataset(5000);
      await Customer.insertMany(largeCustomerDataset);
      console.log(`✅ Inserted ${largeCustomerDataset.length} customers for performance testing`);
      
      const largeCommunicationLogs = generateLargeCommunicationLogsDataset(10000, insertedCampaigns);
      await communicationLog.insertMany(largeCommunicationLogs);
      console.log(`✅ Inserted ${largeCommunicationLogs.length} communication logs for performance testing`);
    }
    
    // Display seeding summary
    const counts = {
      users: await User.countDocuments(),
      customers: await Customer.countDocuments(),
      orders: await Order.countDocuments(),
      campaigns: await Campaign.countDocuments(),
      communicationLogs: await communicationLog.countDocuments()
    };
    
    console.log('📊 Database Summary:');
    console.log(`   👥 Users: ${counts.users}`);
    console.log(`   🛒 Customers: ${counts.customers}`);
    console.log(`   📦 Orders: ${counts.orders}`);
    console.log(`   📢 Campaigns: ${counts.campaigns}`);
    console.log(`   📧 Communication Logs: ${counts.communicationLogs}`);
    
    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
};

// Export all utilities
module.exports = {
  sampleUsers,
  sampleCustomers,
  sampleOrders,
  createSampleCampaigns,
  generateSampleCommunicationLogs,
  sampleSegmentRules,
  sampleCampaignMessages,
  generateLargeCustomerDataset,
  generateLargeCommunicationLogsDataset,
  seedDatabase,
  connectDB
};

// Command line execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('seed')) {
    seedDatabase()
      .then(() => {
        console.log('Seeding completed. Exiting...');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Seeding failed:', error);
        process.exit(1);
      });
  } else {
    console.log('Usage: node sample-data.js seed');
    console.log('Add SEED_LARGE_DATASET=true environment variable for large dataset');
  }
}