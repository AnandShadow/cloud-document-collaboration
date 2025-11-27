// Vercel serverless API
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// In-memory storage for demo
const documents = new Map();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'CollabDocs API is running on Vercel' });
});

// Get all documents
app.get('/api/documents', (req, res) => {
  const docArray = Array.from(documents.values());
  res.json({ documents: docArray });
});

// Create document
app.post('/api/documents', (req, res) => {
  const { title, content } = req.body;
  const docId = Date.now().toString();
  const doc = {
    id: docId,
    title: title || 'Untitled Document',
    content: content || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    owner: 'demo-user',
    collaborators: []
  };
  documents.set(docId, doc);
  res.json({ success: true, document: doc });
});

// Get single document
app.get('/api/documents/:id', (req, res) => {
  const doc = documents.get(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }
  res.json({ document: doc });
});

// Update document
app.put('/api/documents/:id', (req, res) => {
  const doc = documents.get(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }
  doc.title = req.body.title || doc.title;
  doc.content = req.body.content || doc.content;
  doc.updatedAt = new Date().toISOString();
  documents.set(req.params.id, doc);
  res.json({ success: true, document: doc });
});

// Delete document
app.delete('/api/documents/:id', (req, res) => {
  documents.delete(req.params.id);
  res.json({ success: true });
});

// AI endpoints
app.post('/api/ai/advanced', async (req, res) => {
  try {
    const { task, content, tone } = req.body;

    // Simple mock responses for demo
    const responses = {
      generate: 'This is AI-generated content based on your input.',
      rewrite: content ? `Rewritten: ${content}` : 'Please provide content to rewrite.',
      improve: content ? `Improved version: ${content}` : 'Please provide content to improve.',
      expand: content ? `Expanded content: ${content}\n\nAdditional details and context...` : 'Please provide content to expand.',
      summarize: content ? `Summary: ${content.substring(0, 100)}...` : 'Please provide content to summarize.',
      alternatives: content ? `Alternative 1: ${content}\nAlternative 2: Similar approach\nAlternative 3: Different perspective` : 'Provide content for alternatives.',
      tone: content ? `Changed to ${tone || 'professional'} tone: ${content}` : 'Please provide content.',
      complete: content ? `${content} [AI completion...]` : 'Please provide content to complete.'
    };

    res.json({
      success: true,
      result: responses[task] || 'Task completed successfully.',
      provider: 'demo'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/analyze', async (req, res) => {
  try {
    const { content } = req.body;
    res.json({
      success: true,
      result: `Analysis of content (${content?.length || 0} characters): Professional tone detected.`,
      provider: 'demo'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Proofread endpoints (Mock implementation for demo)
const handleProofread = (req, res) => {
  // Return a success response with no issues found to avoid breaking document with invalid indices
  res.json({
    ok: true,
    provider: 'Demo AI',
    readabilityScore: 85,
    overallTone: 'Professional',
    suggestions: [],
    styleRecommendations: {
      headingFont: 'Inter, sans-serif',
      bodyFont: 'Inter, sans-serif',
      emphasisColor: '#2563EB',
      sentenceComplexity: 'Good mix of sentence lengths',
      paragraphLength: 'Well-structured paragraphs'
    }
  });
};

app.post('/api/ai/proofread-groq', handleProofread);
app.post('/api/ai/proofread-languagetool', handleProofread);
app.post('/api/ai/proofread-cloud', handleProofread);

// Mock Auth endpoints
app.get('/auth/user', (req, res) => {
  res.json({ authenticated: false });
});

app.post('/auth/logout', (req, res) => {
  res.json({ success: true });
});

app.get('/auth/github', (req, res) => {
  res.redirect('/');
});

module.exports = app;
