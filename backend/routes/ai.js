const express = require('express');
const router = express.Router();
const axios = require('axios');
const { verifyToken } = require('../middleware/auth');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

// Analyze document with AI
router.post('/analyze', verifyToken, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'No text provided' });
    }

    // Call Python AI service
    const response = await axios.post(`${AI_SERVICE_URL}/analyze`, { text });

    res.json(response.data);
  } catch (error) {
    console.error('Error calling AI service:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'AI service is unavailable',
        suggestions: []
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to analyze document',
      suggestions: []
    });
  }
});

// Get grammar suggestions
router.post('/grammar', verifyToken, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const response = await axios.post(`${AI_SERVICE_URL}/grammar`, { text });

    res.json(response.data);
  } catch (error) {
    console.error('Error calling AI grammar service:', error.message);
    res.status(500).json({ 
      error: 'Failed to check grammar',
      suggestions: []
    });
  }
});

// Get content recommendations
router.post('/recommend', verifyToken, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const response = await axios.post(`${AI_SERVICE_URL}/recommend`, { text });

    res.json(response.data);
  } catch (error) {
    console.error('Error calling AI recommendation service:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate recommendations',
      recommendations: []
    });
  }
});

// Summarize document
router.post('/summarize', verifyToken, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const response = await axios.post(`${AI_SERVICE_URL}/summarize`, { text });

    res.json(response.data);
  } catch (error) {
    console.error('Error calling AI summarization service:', error.message);
    res.status(500).json({ 
      error: 'Failed to summarize document',
      summary: ''
    });
  }
});

module.exports = router;
