const express = require('express');
const router = express.Router();

// Import individual route modules
const authRoutes = require('./authRoutes');
const campaignRoutes = require('./campaignRoutes');
const customerRoutes = require('./customerRoutes');
const aiRoutes = require('./aiRoutes');
const analyticsRoutes = require('./analyticsRoutes');

// Use route modules
router.use('/auth', authRoutes);
router.use('/api/campaigns', campaignRoutes);
router.use('/api/customers', customerRoutes);
router.use('/api/ai', aiRoutes);
router.use('/api/analytics', analyticsRoutes);

module.exports = router;