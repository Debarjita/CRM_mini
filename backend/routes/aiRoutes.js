const express = require('express');
const mongoose = require('mongoose');
const { requireAuth } = require('../middleware/auth');
const aiService = require('../services/aiService');

const router = express.Router();

// Models
const Campaign = mongoose.model('Campaign');
const CommunicationLog = mongoose.model('CommunicationLog');

// Convert text description to segment rules
router.post('/segment-from-text', requireAuth, async (req, res) => {
  try {
    const { description } = req.body;
    
    if (!description || description.trim().length === 0) {
      return res.status(400).json({ error: 'Description is required' });
    }
    
    const rules = aiService.convertTextToRules(description);
    
    res.json({ rules });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate message suggestions
router.post('/message-suggestions', requireAuth, async (req, res) => {
  try {
    const { objective, audienceSize } = req.body;
    
    const suggestions = aiService.generateMessageSuggestions(objective, audienceSize);
    
    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate campaign performance summary
router.post('/campaign-performance-summary', requireAuth, async (req, res) => {
  try {
    const { campaignId } = req.body;
    
    console.log('=== PERFORMANCE SUMMARY DEBUG ===');
    console.log('Received campaignId:', campaignId);
    console.log('campaignId type:', typeof campaignId);
    console.log('Request body:', req.body);
    
    if (!campaignId) {
      return res.status(400).json({ error: 'Campaign ID is required' });
    }
    
    // Check if campaignId is a Postman variable that wasn't resolved
    if (campaignId.includes('{{') || campaignId.includes('}}')) {
      return res.status(400).json({ 
        error: 'Invalid campaign ID format. Postman variable not resolved.',
        received: campaignId,
        help: 'Make sure your Postman environment has a campaignId variable set with an actual ObjectId value'
      });
    }
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({ 
        error: 'Invalid campaign ID format',
        received: campaignId,
        expected: 'Valid MongoDB ObjectId (24 character hex string)'
      });
    }
    
    console.log('✅ Valid ObjectId format');
    
    // Find campaign with proper user validation
    const userId = req.user.id || req.user.email;
    const campaign = await Campaign.findById(new mongoose.Types.ObjectId(campaignId));
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Check ownership - handle both session and token users
    const campaignUserId = campaign.userId || campaign.userEmail;
    if (campaignUserId !== userId && campaign.userId !== req.user.email) {
      return res.status(403).json({ error: 'Access denied to this campaign' });
    }
    
    console.log('✅ Campaign found and user validated');
    
    // Get communication logs
    const logs = await CommunicationLog.find({ campaignId });
    console.log('✅ Found', logs.length, 'communication logs');
    
    const summary = aiService.generatePerformanceSummary(campaign, logs);
    
    res.json({ summary });
  } catch (error) {
    console.error('❌ Performance summary error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Generate lookalike audience suggestions
router.post('/lookalike-audience', requireAuth, async (req, res) => {
  try {
    const { baseSegmentId } = req.body;
    
    console.log('=== LOOKALIKE AUDIENCE DEBUG ===');
    console.log('Received baseSegmentId:', baseSegmentId);
    console.log('baseSegmentId type:', typeof baseSegmentId);
    console.log('Request body:', req.body);
    
    if (!baseSegmentId) {
      return res.status(400).json({ error: 'Base segment ID is required' });
    }
    
    // Check if baseSegmentId is a Postman variable that wasn't resolved
    if (baseSegmentId.includes('{{') || baseSegmentId.includes('}}')) {
      return res.status(400).json({ 
        error: 'Invalid base segment ID format. Postman variable not resolved.',
        received: baseSegmentId,
        help: 'Make sure your Postman environment has a campaignId variable set with an actual ObjectId value'
      });
    }
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(baseSegmentId)) {
      return res.status(400).json({ 
        error: 'Invalid base segment ID format',
        received: baseSegmentId,
        expected: 'Valid MongoDB ObjectId (24 character hex string)'
      });
    }
    
    console.log('✅ Valid ObjectId format');
    
    // Find campaign with proper user validation
    const userId = req.user.id || req.user.email;
    const baseSegment = await Campaign.findById(new mongoose.Types.ObjectId(baseSegmentId));
    
    if (!baseSegment) {
      return res.status(404).json({ error: 'Base segment not found' });
    }
    
    // Check ownership - handle both session and token users
    const segmentUserId = baseSegment.userId || baseSegment.userEmail;
    if (segmentUserId !== userId && baseSegment.userId !== req.user.email) {
      return res.status(403).json({ error: 'Access denied to this segment' });
    }
    
    console.log('✅ Base segment found and user validated');
    
    const suggestions = aiService.generateLookalikeAudience(baseSegment.segmentRules);
    
    res.json({ suggestions });
  } catch (error) {
    console.error('❌ Lookalike audience error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Generate optimal timing recommendations
router.post('/optimal-timing', requireAuth, async (req, res) => {
  try {
    const { audienceRules } = req.body;
    
    if (!audienceRules) {
      return res.status(400).json({ error: 'Audience rules are required' });
    }
    
    const timing = aiService.generateOptimalTiming(audienceRules);
    
    res.json({ timing });
  } catch (error) {
    console.error('❌ Optimal timing error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;