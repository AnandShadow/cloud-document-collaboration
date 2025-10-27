const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const passport = require('passport');
const cookieParser = require('cookie-parser');
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
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Mount Auth routes (COMMENTED OUT FOR DEMO MODE - No GitHub OAuth required)
// const authRoutes = require('./routes/auth');
// app.use('/auth', authRoutes);
console.log('⚠️  Auth routes disabled for DEMO MODE');

// Mount AI routes
const aiRoutes = require('./routes/ai');
app.use('/api/ai', aiRoutes);

// Mount Advanced AI routes
const aiAdvancedRoutes = require('./routes/ai-advanced');
app.use(aiAdvancedRoutes);

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
const userColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  socket.on('join-document', ({ documentId, userId, userName, userColor }) => {
    console.log(`👤 User ${userName} (${socket.id}) joined document ${documentId}`);
    socket.join(documentId);
    
    // Assign random color if not provided
    if (!userColor) {
      userColor = userColors[Math.floor(Math.random() * userColors.length)];
    }
    
    // Store user info
    if (!activeUsers.has(documentId)) {
      activeUsers.set(documentId, new Map());
    }
    activeUsers.get(documentId).set(socket.id, { 
      userId: userId || socket.id, 
      userName: userName || 'Anonymous', 
      socketId: socket.id,
      userColor: userColor,
      isTyping: false
    });
    
    // Get all users in this document
    const users = Array.from(activeUsers.get(documentId).values());
    
    // Notify others that user joined
    socket.to(documentId).emit('user-joined', { 
      userId: userId || socket.id, 
      userName: userName || 'Anonymous',
      userColor: userColor,
      users: users
    });
    
    // Send current users list to the new user
    socket.emit('active-users', { users: users });
    
    console.log(`📊 Active users in ${documentId}:`, users.length);
  });

  socket.on('document-change', ({ documentId, content, delta, userName }) => {
    console.log(`📝 Document update in ${documentId} by ${userName}`);
    
    // Broadcast to all other users in the room
    socket.to(documentId).emit('document-update', { 
      content, 
      delta, 
      userId: socket.id,
      userName: userName || 'Anonymous',
      timestamp: Date.now(),
      changeRange: delta ? { index: delta.ops?.[0]?.retain || 0, length: delta.ops?.length || 1 } : null
    });
  });

  socket.on('cursor-move', ({ documentId, range, userName, userColor }) => {
    console.log(`🖱️ Cursor move in ${documentId} by ${userName}`);
    
    // Broadcast cursor position to others
    socket.to(documentId).emit('cursor-update', {
      userId: socket.id,
      userName: userName || 'Anonymous',
      userColor: userColor || '#3b82f6',
      range: range,
      timestamp: Date.now()
    });
  });

  socket.on('typing-start', ({ documentId, userName }) => {
    console.log(`⌨️ ${userName} started typing in ${documentId}`);
    
    if (activeUsers.has(documentId) && activeUsers.get(documentId).has(socket.id)) {
      const user = activeUsers.get(documentId).get(socket.id);
      user.isTyping = true;
    }
    
    socket.to(documentId).emit('user-typing', {
      userId: socket.id,
      userName: userName || 'Anonymous',
      isTyping: true
    });
  });

  socket.on('typing-stop', ({ documentId }) => {
    if (activeUsers.has(documentId) && activeUsers.get(documentId).has(socket.id)) {
      const user = activeUsers.get(documentId).get(socket.id);
      user.isTyping = false;
    }
    
    socket.to(documentId).emit('user-typing', {
      userId: socket.id,
      isTyping: false
    });
  });

  socket.on('leave-document', ({ documentId, userId }) => {
    console.log(`👋 User ${userId} left document ${documentId}`);
    socket.leave(documentId);
    
    if (activeUsers.has(documentId)) {
      const users = activeUsers.get(documentId);
      const user = users.get(socket.id);
      users.delete(socket.id);
      
      // Notify others
      socket.to(documentId).emit('user-left', { 
        userId: userId || socket.id,
        userName: user?.userName || 'Anonymous',
        users: Array.from(users.values())
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
    
    // Remove user from all documents they were in
    activeUsers.forEach((users, documentId) => {
      if (users.has(socket.id)) {
        const user = users.get(socket.id);
        users.delete(socket.id);
        
        // Notify others in the document
        io.to(documentId).emit('user-left', { 
          userId: user.userId,
          userName: user.userName,
          users: Array.from(users.values())
        });
        
        console.log(`📊 Users remaining in ${documentId}:`, users.size);
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
