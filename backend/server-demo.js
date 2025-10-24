const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory storage for demo
const documents = new Map();
const users = new Map();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mode: 'DEMO MODE - No Firebase'
  });
});

// Demo auth endpoints
app.post('/api/auth/register', (req, res) => {
  const { email, password, displayName } = req.body;
  const userId = Date.now().toString();
  users.set(email, { userId, email, displayName, password });
  res.json({ 
    success: true, 
    user: { userId, email, displayName },
    token: 'demo-token-' + userId
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.get(email);
  if (user && user.password === password) {
    res.json({ 
      success: true, 
      user: { userId: user.userId, email: user.email, displayName: user.displayName },
      token: 'demo-token-' + user.userId
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Demo document endpoints
app.get('/api/documents', (req, res) => {
  const docArray = Array.from(documents.values());
  res.json({ documents: docArray });
});

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

app.get('/api/documents/:id', (req, res) => {
  const doc = documents.get(req.params.id);
  if (doc) {
    res.json({ document: doc });
  } else {
    res.status(404).json({ error: 'Document not found' });
  }
});

app.put('/api/documents/:id', (req, res) => {
  const doc = documents.get(req.params.id);
  if (doc) {
    doc.content = req.body.content || doc.content;
    doc.title = req.body.title || doc.title;
    doc.updatedAt = new Date().toISOString();
    documents.set(req.params.id, doc);
    res.json({ success: true, document: doc });
  } else {
    res.status(404).json({ error: 'Document not found' });
  }
});

app.delete('/api/documents/:id', (req, res) => {
  if (documents.has(req.params.id)) {
    documents.delete(req.params.id);
    res.json({ success: true, message: 'Document deleted' });
  } else {
    res.status(404).json({ error: 'Document not found' });
  }
});

// Mock AI endpoints
app.post('/api/ai/analyze', (req, res) => {
  res.json({
    grammar: { errors: [], suggestions: [] },
    sentiment: { score: 0, label: 'neutral' },
    readability: { score: 70, level: 'Good' },
    statistics: { words: 100, sentences: 5, characters: 500 }
  });
});

app.post('/api/ai/grammar', (req, res) => {
  res.json({ corrections: [] });
});

app.post('/api/ai/recommend', (req, res) => {
  res.json({ keywords: [], entities: [], suggestions: [] });
});

// Socket.IO for real-time collaboration
const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-document', ({ documentId, userId, userName }) => {
    console.log(`User ${userName} joined document ${documentId}`);
    socket.join(documentId);
    
    if (!activeUsers.has(documentId)) {
      activeUsers.set(documentId, new Set());
    }
    activeUsers.get(documentId).add({ userId, userName, socketId: socket.id });
    
    io.to(documentId).emit('user-joined', { userId, userName });
    io.to(documentId).emit('active-users', Array.from(activeUsers.get(documentId) || []));
  });

  socket.on('document-change', ({ documentId, content, delta, userId }) => {
    socket.to(documentId).emit('document-update', { content, delta, userId });
  });

  socket.on('leave-document', ({ documentId, userId }) => {
    socket.leave(documentId);
    if (activeUsers.has(documentId)) {
      const users = activeUsers.get(documentId);
      activeUsers.set(documentId, new Set([...users].filter(u => u.socketId !== socket.id)));
      io.to(documentId).emit('user-left', { userId });
      io.to(documentId).emit('active-users', Array.from(activeUsers.get(documentId) || []));
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    activeUsers.forEach((users, documentId) => {
      const user = [...users].find(u => u.socketId === socket.id);
      if (user) {
        activeUsers.set(documentId, new Set([...users].filter(u => u.socketId !== socket.id)));
        io.to(documentId).emit('user-left', { userId: user.userId });
        io.to(documentId).emit('active-users', Array.from(activeUsers.get(documentId) || []));
      }
    });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

const PORT = process.env.PORT || 5000;
http.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🚀 CollabDocs Backend Server');
  console.log('='.repeat(50));
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}`);
  console.log(`⚠️  MODE: DEMO (In-memory storage, no Firebase)`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log('='.repeat(50));
});
