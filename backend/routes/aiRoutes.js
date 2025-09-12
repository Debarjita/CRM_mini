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
    
    if (!campaignId) {
      return res.status(400).json({ error: 'Campaign ID is required' });
    }
    
    const campaign = await Campaign.findById(campaignId);
    if (!campaign || campaign.userId !== req.user.id) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    const logs = await CommunicationLog.find({ campaignId });
    
    const summary = aiService.generatePerformanceSummary(campaign, logs);
    
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate lookalike audience suggestions
router.post('/lookalike-audience', requireAuth, async (req, res) => {
  try {
    const { baseSegmentId } = req.body;
    
    if (!baseSegmentId) {
      return res.status(400).json({ error: 'Base segment ID is required' });
    }
    
    const baseSegment = await Campaign.findById(baseSegmentId);
    if (!baseSegment || baseSegment.userId !== req.user.id) {
      return res.status(404).json({ error: 'Base segment not found' });
    }
    
    const suggestions = aiService.generateLookalikeAudience(baseSegment.segmentRules);
    
    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate optimal timing recommendations
router.post('/optimal-timing', requireAuth, async (req, res) => {
  try {
    const { audienceRules } = req.body;
    
    const timing = aiService.generateOptimalTiming(audienceRules);
    
    res.json({ timing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;