const express = require('express');
const router = express.Router();
const axios = require('axios');

// Only require auth if it exists (for production mode)
let verifyToken = (req, res, next) => next(); // Default: no auth
try {
  const auth = require('../middleware/auth');
  verifyToken = auth.verifyToken;
} catch (e) {
  console.log('⚠️  Auth middleware not available, running without authentication');
}

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const GROQ_API_KEY = process.env.GROQ_API_KEY || ''; // Set via environment variable

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

// NEW: OpenAI-powered proofread (for demo when Python service unavailable)
router.post('/proofread-cloud', async (req, res) => {
  try {
    const { text, mode = 'grammar' } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ 
        ok: false, 
        error: 'Missing or invalid text parameter' 
      });
    }

    if (!OPENAI_API_KEY) {
      return res.status(503).json({ 
        ok: false, 
        error: 'AI service not configured. Please set OPENAI_API_KEY environment variable.' 
      });
    }

    // Build prompt based on mode
    let systemPrompt = 'You are a professional editor and writing assistant.';
    let userPrompt = '';

    switch (mode) {
      case 'grammar':
        userPrompt = `Proofread the following text and return ONLY a JSON array of grammar and spelling errors. Each error should have: start (character position), end (character position), original (text with error), suggestion (corrected text), reason (brief explanation).

Example format:
[{"start": 0, "end": 5, "original": "teh", "suggestion": "the", "reason": "Spelling error"}]

If there are no errors, return an empty array: []

Text to proofread:
${text}`;
        break;

      case 'style':
        userPrompt = `Analyze the following text for style improvements and return ONLY a JSON array of suggestions. Each suggestion should have: start, end, original, suggestion, reason.

Focus on:
- Clarity and conciseness
- Active voice
- Word choice
- Sentence structure

Text to analyze:
${text}`;
        break;

      case 'rewrite':
        userPrompt = `Rewrite the following text to improve clarity, flow, and professionalism. Return ONLY a JSON object with one key 'rewrite' containing the improved text.

Example: {"rewrite": "improved text here"}

Text to rewrite:
${text}`;
        break;

      default:
        return res.status(400).json({ 
          ok: false, 
          error: 'Invalid mode. Use grammar, style, or rewrite' 
        });
    }

    console.log(`🤖 AI ${mode} request received, text length: ${text.length}`);

    // Call OpenAI API
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 1000,
      temperature: 0.3
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      }
    });

    const content = response.data?.choices?.[0]?.message?.content || '[]';
    
    console.log('✅ AI response received:', content.substring(0, 100) + '...');

    // Parse JSON response
    let result;
    try {
      result = JSON.parse(content);
      
      // Handle rewrite mode (single object) vs suggestions (array)
      if (mode === 'rewrite') {
        return res.json({ 
          ok: true, 
          rewrite: result.rewrite || text 
        });
      } else {
        // Ensure we have an array
        const suggestions = Array.isArray(result) ? result : [];
        return res.json({ 
          ok: true, 
          suggestions,
          count: suggestions.length 
        });
      }
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);
      return res.json({ 
        ok: true, 
        suggestions: [],
        count: 0,
        warning: 'AI returned invalid format'
      });
    }

  } catch (error) {
    console.error('❌ AI proofread error:', error.message);
    
    // Handle specific OpenAI errors
    if (error.response?.status === 429) {
      return res.status(429).json({ 
        ok: false, 
        error: 'Rate limit exceeded. Please wait a moment and try again.',
        retryAfter: 30 // seconds
      });
    }
    
    if (error.response?.status === 401) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Invalid OpenAI API key. Please check your OPENAI_API_KEY environment variable.'
      });
    }
    
    return res.status(500).json({ 
      ok: false, 
      error: `AI service error: ${error.message}` 
    });
  }
});

// FREE AI OPTION 1: Groq API (Ultra-fast, free tier - 14K requests/day)
// Enhanced to check: grammar, style, formatting, tone, AND suggest font/color/size
router.post('/proofread-groq', async (req, res) => {
  try {
    const { text, mode = 'comprehensive' } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ 
        ok: false, 
        error: 'Missing or invalid text parameter' 
      });
    }

    if (!GROQ_API_KEY) {
      return res.status(503).json({ 
        ok: false, 
        error: 'Groq API not configured. Please set GROQ_API_KEY environment variable.' 
      });
    }

    console.log(`🚀 Groq AI ${mode} analysis, text length: ${text.length}`);

    // Enhanced comprehensive analysis prompt
    const prompt = `Analyze this text comprehensively and return ONLY valid JSON with multiple types of suggestions:

1. **Grammar & Spelling Errors** - Fix typos, grammar mistakes
2. **Style Improvements** - Better word choice, clarity, conciseness
3. **Formatting Suggestions** - Font size, color, emphasis for better readability
4. **Tone Analysis** - Professional, casual, formal recommendations

Return JSON format:
{
  "errors": [
    {
      "type": "grammar|spelling|style|formatting|tone",
      "start": 0,
      "end": 5,
      "original": "text with issue",
      "suggestion": "corrected text",
      "reason": "explanation",
      "severity": "high|medium|low",
      "formatting": {
        "fontSize": "16px",
        "color": "#2563eb",
        "fontWeight": "bold",
        "fontStyle": "italic"
      }
    }
  ],
  "overallTone": "professional|casual|formal|technical",
  "readabilityScore": 85,
  "suggestions": {
    "headingFont": "18px bold #1e40af",
    "bodyFont": "14px normal #374151",
    "emphasisColor": "#dc2626",
    "linkColor": "#2563eb"
  }
}

Text to analyze: "${text}"

Return ONLY the JSON, no markdown or extra text.`;

    // Call Groq API (ultra-fast Llama 3.1 70B)
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.1-70b-versatile',
      messages: [
        { role: 'system', content: 'You are an expert editor and design consultant. Analyze text for grammar, style, formatting, and suggest visual improvements. Always return valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.3
    }, {
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const content = response.data?.choices?.[0]?.message?.content || '{"errors":[]}';
    console.log('✅ Groq response received:', content.substring(0, 150));

    // Parse JSON response
    let result;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(cleanContent);
      
      // Convert to our suggestion format
      const suggestions = (result.errors || []).map(err => ({
        type: err.type || 'grammar',
        start: err.start || 0,
        end: err.end || 0,
        original: err.original || '',
        suggestion: err.suggestion || '',
        reason: err.reason || 'Improvement suggested',
        severity: err.severity || 'medium',
        formatting: err.formatting || null
      }));

      return res.json({ 
        ok: true, 
        suggestions,
        count: suggestions.length,
        overallTone: result.overallTone || 'neutral',
        readabilityScore: result.readabilityScore || 75,
        styleRecommendations: result.suggestions || {},
        provider: 'Groq (Free - Comprehensive Analysis)'
      });
      
    } catch (parseError) {
      console.error('❌ Failed to parse Groq response:', parseError);
      return res.json({ 
        ok: true, 
        suggestions: [],
        count: 0,
        warning: 'AI returned invalid format'
      });
    }

  } catch (error) {
    console.error('❌ Groq error:', error.message);
    
    if (error.response?.status === 429) {
      return res.status(429).json({ 
        ok: false, 
        error: 'Groq rate limit exceeded. Please wait a moment.',
        retryAfter: 10
      });
    }
    
    if (error.response?.status === 401) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Invalid Groq API key.'
      });
    }
    
    return res.status(500).json({ 
      ok: false, 
      error: `Groq AI error: ${error.message}` 
    });
  }
});

// FREE AI OPTION 2: LanguageTool (Completely free, no API key needed)
// Enhanced to provide styling suggestions based on error types
router.post('/proofread-languagetool', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ 
        ok: false, 
        error: 'Missing or invalid text parameter' 
      });
    }

    console.log(`📝 LanguageTool comprehensive check, text length: ${text.length}`);

    // Call public LanguageTool API (free, no key needed)
    const response = await axios.post(
      'https://api.languagetool.org/v2/check',
      new URLSearchParams({
        text: text,
        language: 'en-US',
        enabledOnly: 'false'
      }),
      {
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      }
    );

    const matches = response.data.matches || [];
    console.log(`✅ LanguageTool found ${matches.length} issues`);
    
    // Enhanced: Convert to comprehensive suggestion format with styling
    const suggestions = matches.slice(0, 20).map(match => {
      const category = match.rule?.category?.name || 'Grammar';
      const issueType = match.rule?.issueType || 'misspelling';
      
      // Determine severity and styling based on error type
      let severity = 'medium';
      let formatting = null;
      
      if (issueType === 'misspelling' || category.includes('Spell')) {
        severity = 'high';
        formatting = {
          color: '#dc2626', // Red for spelling errors
          textDecoration: 'underline wavy #dc2626',
          fontSize: 'inherit',
          fontWeight: 'normal'
        };
      } else if (category.includes('Grammar')) {
        severity = 'high';
        formatting = {
          color: '#ea580c', // Orange for grammar
          textDecoration: 'underline wavy #ea580c',
          fontSize: 'inherit',
          fontWeight: 'normal'
        };
      } else if (category.includes('Style') || category.includes('Redundancy')) {
        severity = 'medium';
        formatting = {
          color: '#2563eb', // Blue for style
          backgroundColor: '#dbeafe',
          fontSize: 'inherit',
          fontStyle: 'italic'
        };
      } else if (category.includes('Punctuation')) {
        severity = 'low';
        formatting = {
          color: '#65a30d', // Green for punctuation
          fontSize: 'inherit'
        };
      }
      
      return {
        type: issueType,
        start: match.offset,
        end: match.offset + match.length,
        original: text.substring(match.offset, match.offset + match.length),
        suggestion: match.replacements[0]?.value || '',
        reason: match.message,
        category: category,
        severity: severity,
        formatting: formatting
      };
    });

    // Analyze overall document style
    const hasLongSentences = text.split('.').some(s => s.split(' ').length > 20);
    const hasShortParagraphs = text.split('\n\n').every(p => p.length < 200);
    
    const styleRecommendations = {
      headingFont: '20px bold #1e293b',
      bodyFont: '16px normal #475569',
      emphasisColor: '#dc2626',
      linkColor: '#2563eb',
      suggestionColor: '#10b981',
      sentenceComplexity: hasLongSentences ? 'Consider breaking long sentences' : 'Good',
      paragraphLength: hasShortParagraphs ? 'Good readability' : 'Consider shorter paragraphs'
    };

    return res.json({ 
      ok: true, 
      suggestions,
      count: suggestions.length,
      overallTone: 'neutral',
      readabilityScore: 100 - (matches.length * 2), // Simple score
      styleRecommendations,
      provider: 'LanguageTool (Free - Grammar + Style + Format)'
    });

  } catch (error) {
    console.error('❌ LanguageTool error:', error.message);
    return res.status(500).json({ 
      ok: false, 
      error: `LanguageTool error: ${error.message}` 
    });
  }
});

module.exports = router;
