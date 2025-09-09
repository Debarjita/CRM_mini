// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const redis = require('redis');
const Bull = require('bull');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Redis connection for queues
const redisClient = redis.createClient(process.env.REDIS_URL || 'redis://localhost:6379');
const campaignQueue = new Bull('campaign processing', process.env.REDIS_URL || 'redis://localhost:6379');
const deliveryQueue = new Bull('delivery processing', process.env.REDIS_URL || 'redis://localhost:6379');

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'crm-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(passport.initialize());
app.use(passport.session());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/minicrm', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Schemas
const customerSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: String,
  email: String,
  totalSpends: { type: Number, default: 0 },
  visits: { type: Number, default: 0 },
  lastVisit: Date,
  createdAt: { type: Date, default: Date.now },
  tags: [String]
});

const orderSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  customerId: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  items: [String]
});

const campaignSchema = new mongoose.Schema({
  name: String,
  userId: String,
  segmentRules: Object,
  message: String,
  audienceSize: Number,
  status: { type: String, default: 'PENDING' },
  createdAt: { type: Date, default: Date.now },
  stats: {
    sent: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    pending: { type: Number, default: 0 }
  }
});

const communicationLogSchema = new mongoose.Schema({
  campaignId: String,
  customerId: String,
  customerName: String,
  customerEmail: String,
  message: String,
  status: { type: String, default: 'PENDING' }, // PENDING, SENT, FAILED
  deliveryId: String,
  sentAt: Date,
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  googleId: String,
  email: String,
  name: String,
  avatar: String,
  createdAt: { type: Date, default: Date.now }
});

const Customer = mongoose.model('Customer', customerSchema);
const Order = mongoose.model('Order', orderSchema);
const Campaign = mongoose.model('Campaign', campaignSchema);
const CommunicationLog = mongoose.model('CommunicationLog', communicationLogSchema);
const User = mongoose.model('User', userSchema);

// Passport Google OAuth configuration
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = await User.create({
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        avatar: profile.photos[0].value
      });
    }
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Auth middleware
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
};

// Auth routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('http://localhost:3000/dashboard');
  }
);

app.get('/auth/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

app.post('/auth/logout', (req, res) => {
  req.logout(() => {
    res.json({ success: true });
  });
});

// Data Ingestion APIs
app.post('/api/customers', async (req, res) => {
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

app.post('/api/orders', async (req, res) => {
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

// Campaign APIs
app.get('/api/customers/preview', requireAuth, async (req, res) => {
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

app.post('/api/campaigns', requireAuth, async (req, res) => {
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

app.get('/api/campaigns', requireAuth, async (req, res) => {
  try {
    const campaigns = await Campaign.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI-powered features
app.post('/api/ai/segment-from-text', requireAuth, async (req, res) => {
  try {
    const { description } = req.body;
    
    // Mock AI conversion (in real implementation, call OpenAI API)
    const rules = convertTextToRules(description);
    
    res.json({ rules });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/message-suggestions', requireAuth, async (req, res) => {
  try {
    const { objective, audienceSize } = req.body;
    
    // Mock AI message generation
    const suggestions = generateMessageSuggestions(objective, audienceSize);
    
    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delivery Receipt API
app.post('/api/delivery-receipt', async (req, res) => {
  try {
    const { deliveryId, status, timestamp } = req.body;
    
    // Add to delivery queue for batch processing
    await deliveryQueue.add('update-delivery-status', {
      deliveryId,
      status,
      timestamp
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Queue processors
campaignQueue.process('ingest-customer', async (job) => {
  const customerData = job.data;
  await Customer.findOneAndUpdate(
    { id: customerData.id },
    customerData,
    { upsert: true, new: true }
  );
});

campaignQueue.process('ingest-order', async (job) => {
  const orderData = job.data;
  
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
});

campaignQueue.process('process-campaign', async (job) => {
  const { campaignId } = job.data;
  const campaign = await Campaign.findById(campaignId);
  
  if (!campaign) return;
  
  const query = buildMongoQuery(campaign.segmentRules);
  const customers = await Customer.find(query);
  
  // Create communication logs and send messages
  for (const customer of customers) {
    const personalizedMessage = campaign.message.replace('{name}', customer.name);
    
    const commLog = new CommunicationLog({
      campaignId: campaign._id,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      message: personalizedMessage
    });
    
    await commLog.save();
    
    // Simulate vendor API call
    setTimeout(async () => {
      const success = Math.random() > 0.1; // 90% success rate
      const deliveryId = `del_${Date.now()}_${Math.random()}`;
      
      // Call dummy vendor API
      await fetch('http://localhost:5000/api/vendor/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryId,
          customerEmail: customer.email,
          message: personalizedMessage,
          simulate: success ? 'success' : 'failure'
        })
      });
    }, Math.random() * 5000);
  }
  
  await Campaign.findByIdAndUpdate(campaignId, { status: 'PROCESSING' });
});

// Batch delivery status updates
deliveryQueue.process('update-delivery-status', async (job) => {
  const { deliveryId, status, timestamp } = job.data;
  
  await CommunicationLog.findOneAndUpdate(
    { deliveryId },
    {
      status: status.toUpperCase(),
      sentAt: new Date(timestamp)
    }
  );
  
  // Update campaign stats
  const log = await CommunicationLog.findOne({ deliveryId });
  if (log) {
    const statusField = status.toLowerCase() === 'sent' ? 'sent' : 'failed';
    await Campaign.findByIdAndUpdate(log.campaignId, {
      $inc: {
        [`stats.${statusField}`]: 1,
        'stats.pending': -1
      }
    });
  }
});

// Dummy Vendor API (simulates external service)
app.post('/api/vendor/send', async (req, res) => {
  const { deliveryId, customerEmail, message, simulate } = req.body;
  
  // Simulate processing delay
  setTimeout(async () => {
    const status = simulate === 'success' ? 'SENT' : 'FAILED';
    
    // Call back to delivery receipt API
    await fetch('http://localhost:5000/api/delivery-receipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deliveryId,
        status,
        timestamp: new Date().toISOString()
      })
    });
  }, 1000 + Math.random() * 3000);
  
  res.json({ success: true, deliveryId });
});

// Helper functions
function buildMongoQuery(rules) {
  if (!rules || !rules.conditions) return {};
  
  const conditions = rules.conditions.map(condition => {
    const { field, operator, value } = condition;
    
    switch (operator) {
      case '>': return { [field]: { $gt: parseFloat(value) } };
      case '<': return { [field]: { $lt: parseFloat(value) } };
      case '>=': return { [field]: { $gte: parseFloat(value) } };
      case '<=': return { [field]: { $lte: parseFloat(value) } };
      case '=': return { [field]: value };
      case 'contains': return { [field]: { $regex: value, $options: 'i' } };
      case 'inactive_days': 
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - parseInt(value));
        return { lastVisit: { $lt: cutoff } };
      default: return {};
    }
  });
  
  return rules.operator === 'AND' ? { $and: conditions } : { $or: conditions };
}

function convertTextToRules(description) {
  // Mock AI text-to-rules conversion
  const rules = {
    operator: 'AND',
    conditions: []
  };
  
  if (description.includes('spent') && description.includes('10000')) {
    rules.conditions.push({
      field: 'totalSpends',
      operator: '>',
      value: '10000'
    });
  }
  
  if (description.includes('visits') && description.includes('3')) {
    rules.conditions.push({
      field: 'visits',
      operator: '<',
      value: '3'
    });
  }
  
  if (description.includes('inactive') && description.includes('90')) {
    rules.conditions.push({
      field: 'lastVisit',
      operator: 'inactive_days',
      value: '90'
    });
  }
  
  return rules;
}

function generateMessageSuggestions(objective, audienceSize) {
  const suggestions = [];
  
  if (objective.includes('inactive')) {
    suggestions.push(
      "Hi {name}, we miss you! Come back with 20% off your next purchase.",
      "Hey {name}, it's been a while! Here's a special 15% discount just for you.",
      "{name}, your favorite items are waiting! Get 25% off this week only."
    );
  } else if (objective.includes('high value')) {
    suggestions.push(
      "Hi {name}, thank you for being a valued customer! Enjoy VIP early access.",
      "{name}, as our premium customer, here's an exclusive 30% discount.",
      "Dear {name}, you deserve the best! Check out our new premium collection."
    );
  } else {
    suggestions.push(
      "Hi {name}, don't miss out on our latest offers!",
      "Hey {name}, something special is waiting for you!",
      "{name}, great deals are here! Shop now and save big."
    );
  }
  
  return suggestions;
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;