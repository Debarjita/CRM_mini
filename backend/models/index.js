const mongoose = require('mongoose');

// Customer Schema with indexes for performance
const customerSchema = new mongoose.Schema({
  id: { 
    type: String, 
    unique: true, 
    required: true,
    index: true // Index for fast lookups
  },
  name: { 
    type: String,
    trim: true,
    maxlength: 200
  },
  email: { 
    type: String,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email) {
        return !email || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
      },
      message: 'Invalid email format'
    }
  },
  totalSpends: { 
    type: Number, 
    default: 0,
    min: 0,
    index: true // Index for spending-based queries
  },
  visits: { 
    type: Number, 
    default: 0,
    min: 0,
    index: true // Index for visit-based queries
  },
  lastVisit: { 
    type: Date,
    index: true // Index for date-based queries
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }]
}, {
  timestamps: true,
  collection: 'customers'
});

// Compound indexes for common queries
customerSchema.index({ totalSpends: 1, visits: 1 });
customerSchema.index({ lastVisit: 1, totalSpends: 1 });
customerSchema.index({ email: 1 }, { sparse: true }); // Sparse index for optional emails

// Order Schema with indexes
const orderSchema = new mongoose.Schema({
  id: { 
    type: String, 
    unique: true, 
    required: true,
    index: true
  },
  customerId: { 
    type: String, 
    required: true,
    index: true // Index for customer lookups
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0
  },
  date: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  items: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  collection: 'orders'
});

// Compound index for customer orders by date
orderSchema.index({ customerId: 1, date: -1 });

// Campaign Schema
const campaignSchema = new mongoose.Schema({
  name: { 
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  userId: { 
    type: String,
    required: true,
    index: true // Index for user's campaigns
  },
  segmentRules: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    validate: {
      validator: function(rules) {
        return rules && 
               typeof rules === 'object' && 
               ['AND', 'OR'].includes(rules.operator) &&
               Array.isArray(rules.conditions) &&
               rules.conditions.length > 0;
      },
      message: 'Invalid segment rules format'
    }
  },
  message: { 
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  audienceSize: { 
    type: Number,
    default: 0,
    min: 0
  },
  status: { 
    type: String, 
    default: 'PENDING',
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
    index: true
  },
  stats: {
    sent: { type: Number, default: 0, min: 0 },
    failed: { type: Number, default: 0, min: 0 },
    pending: { type: Number, default: 0, min: 0 }
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  collection: 'campaigns'
});

// Compound index for user campaigns by date
campaignSchema.index({ userId: 1, createdAt: -1 });
campaignSchema.index({ status: 1, createdAt: -1 });

// Communication Log Schema with critical indexes
const communicationLogSchema = new mongoose.Schema({
  campaignId: { 
    type: String,
    required: true,
    index: true // Index for campaign lookups
  },
  customerId: { 
    type: String,
    required: true,
    index: true
  },
  customerName: String,
  customerEmail: String,
  message: { 
    type: String,
    required: true
  },
  status: { 
    type: String, 
    default: 'PENDING',
    enum: ['PENDING', 'SENT', 'FAILED'],
    index: true // Index for status queries
  },
  deliveryId: { 
    type: String,
    index: true, // CRITICAL: Index for delivery receipt lookups
    sparse: true
  },
  sentAt: { 
    type: Date,
    index: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  collection: 'communication_logs'
});

// Compound indexes for common queries
communicationLogSchema.index({ campaignId: 1, status: 1 });
communicationLogSchema.index({ campaignId: 1, createdAt: -1 });
communicationLogSchema.index({ deliveryId: 1 }, { sparse: true }); // Unique sparse index

// User Schema for authentication
const userSchema = new mongoose.Schema({
  googleId: { 
    type: String,
    unique: true,
    sparse: true
  },
  email: { 
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
      },
      message: 'Invalid email format'
    }
  },
  name: { 
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  avatar: String,
  role: {
    type: String,
    default: 'user',
    enum: ['user', 'admin']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Indexes for user lookups

userSchema.index({ email: 1 });

// Pre-save hooks for validation and data processing
customerSchema.pre('save', function(next) {
  // Ensure totalSpends and visits are non-negative
  if (this.totalSpends < 0) this.totalSpends = 0;
  if (this.visits < 0) this.visits = 0;
  next();
});

orderSchema.pre('save', function(next) {
  // Ensure amount is non-negative
  if (this.amount < 0) this.amount = 0;
  next();
});

campaignSchema.pre('save', function(next) {
  // Ensure stats are non-negative
  if (this.stats.sent < 0) this.stats.sent = 0;
  if (this.stats.failed < 0) this.stats.failed = 0;
  if (this.stats.pending < 0) this.stats.pending = 0;
  next();
});

// Static methods for common queries
customerSchema.statics.findBySpendingRange = function(min, max) {
  return this.find({ 
    totalSpends: { $gte: min, $lte: max } 
  });
};

customerSchema.statics.findInactiveCustomers = function(days) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return this.find({ 
    lastVisit: { $lt: cutoff } 
  });
};

campaignSchema.statics.findByUser = function(userId, limit = 50) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

communicationLogSchema.statics.findByCampaign = function(campaignId, status = null) {
  const query = { campaignId };
  if (status) query.status = status;
  return this.find(query).sort({ createdAt: -1 });
};

// Create and export models
const Customer = mongoose.model('Customer', customerSchema);
const Order = mongoose.model('Order', orderSchema);
const Campaign = mongoose.model('Campaign', campaignSchema);
const CommunicationLog = mongoose.model('CommunicationLog', communicationLogSchema);
const User = mongoose.model('User', userSchema);



module.exports = {
  Customer,
  Order,
  Campaign,
  CommunicationLog,
  User
};