const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const redis = require('redis');
const Bull = require('bull');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Import models
require('./models');

// Import routes
const routes = require('./routes');
const { processQueues } = require('./queues/processors');

// Redis connection for queues
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Handle Redis connection
redisClient.on('error', (err) => {
  console.log('Redis Client Error', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

// Connect to Redis
redisClient.connect().catch(console.error);

// Bull queues with Redis URL
const campaignQueue = new Bull('campaign processing', process.env.REDIS_URL || 'redis://localhost:6379');
const deliveryQueue = new Bull('delivery processing', process.env.REDIS_URL || 'redis://localhost:6379');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://crmmini-production.up.railway.app', // Add your Railway domain
      undefined // Allow requests with no origin (like Railway health checks)
    ];
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex');

if (process.env.SESSION_SECRET === 'your_super_secret_session_key_here_change_this_in_production') {
  console.warn('⚠️  WARNING: Please change the default SESSION_SECRET in production!');
}

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/minicrm',
    ttl: 24 * 60 * 60 // 1 day
  }),
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/minicrm', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.connection.on('connected', () => {
  console.log('✅ Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

// Passport Google OAuth configuration
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn('⚠️  WARNING: Google OAuth credentials not configured. Authentication will not work.');
} else {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const User = mongoose.model('User');
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
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const User = mongoose.model('User');
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/', routes);

// Delivery Receipt API (webhook endpoint)
app.post('/api/delivery-receipt', async (req, res) => {
  try {
    const { deliveryId, status, timestamp } = req.body;
    
    if (!deliveryId || !status) {
      return res.status(400).json({ error: 'deliveryId and status are required' });
    }
    
    // Add to delivery queue for batch processing
    await deliveryQueue.add('update-delivery-status', {
      deliveryId,
      status,
      timestamp: timestamp || new Date().toISOString()
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delivery receipt error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Dummy Vendor API (simulates external service)
app.post('/api/vendor/send', async (req, res) => {
  const { deliveryId, customerEmail, message, simulate } = req.body;
  
  // Simulate processing delay
  setTimeout(async () => {
    const status = simulate === 'success' ? 'SENT' : 'FAILED';
    
    // Call back to delivery receipt API
    try {
      await fetch(`http://localhost:${PORT}/api/delivery-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryId,
          status,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to send delivery receipt:', error);
    }
  }, 1000 + Math.random() * 3000);
  
  res.json({ success: true, deliveryId });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validation Error', 
      details: error.message 
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({ 
      error: 'Invalid ID format' 
    });
  }
  
  if (error.code === 11000) {
    return res.status(400).json({ 
      error: 'Duplicate entry',
      details: 'A record with this identifier already exists'
    });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: error.message })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize queue processors
processQueues(campaignQueue, deliveryQueue);



// Trust proxy for production (when behind reverse proxy/load balancer)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  
  // Log configuration warnings
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.includes('change_this')) {
      console.error('❌ CRITICAL: Set a secure SESSION_SECRET in production!');
    }
    if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('localhost')) {
      console.warn('⚠️  WARNING: Consider using a production MongoDB instance');
    }
  }

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    mongoose.connection.close();
    redisClient.quit();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    mongoose.connection.close();
    redisClient.quit();
    process.exit(0);
  });
});
  
});

module.exports = app;