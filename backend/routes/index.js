const express = require('express');
const router = express.Router();

// Import individual route modules with error handling
try {
  console.log('Loading authRoutes...');
  const authRoutes = require('./authRoutes');
  router.use('/auth', authRoutes);
  console.log('✓ authRoutes loaded');
} catch (error) {
  console.error('✗ Failed to load authRoutes:', error.message);
}

try {
  console.log('Loading campaignRoutes...');
  const campaignRoutes = require('./campaignRoutes');
  router.use('/api/campaigns', campaignRoutes);
  console.log('✓ campaignRoutes loaded');
} catch (error) {
  console.error('✗ Failed to load campaignRoutes:', error.message);
}

try {
  console.log('Loading customerRoutes...');
  const customerRoutes = require('./customerRoutes');
  router.use('/api/customers', customerRoutes);
  console.log('✓ customerRoutes loaded');
} catch (error) {
  console.error('✗ Failed to load customerRoutes:', error.message);
}

try {
  console.log('Loading aiRoutes...');
  const aiRoutes = require('./aiRoutes');
  router.use('/api/ai', aiRoutes);
  console.log('✓ aiRoutes loaded');
} catch (error) {
  console.error('✗ Failed to load aiRoutes:', error.message);
}

try {
  console.log('Loading analyticsRoutes...');
  const analyticsRoutes = require('./analyticsRoutes');
  router.use('/api/analytics', analyticsRoutes);
  console.log('✓ analyticsRoutes loaded');
} catch (error) {
  console.error('✗ Failed to load analyticsRoutes:', error.message);
}

module.exports = router;