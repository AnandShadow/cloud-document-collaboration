const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});
app.use('/api/', limiter);

// Import routes
const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const aiRoutes = require('./routes/ai');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.IO for real-time collaboration
const activeUsers = new Map(); // documentId -> Set of users

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-document', ({ documentId, userId, userName }) => {
    socket.join(documentId);
    
    if (!activeUsers.has(documentId)) {
      activeUsers.set(documentId, new Set());
    }
    
    activeUsers.get(documentId).add({ socketId: socket.id, userId, userName });
    
    // Broadcast active users to everyone in the document
    const users = Array.from(activeUsers.get(documentId));
    io.to(documentId).emit('active-users', users);
    
    console.log(`User ${userName} joined document ${documentId}`);
  });

  socket.on('document-change', ({ documentId, userId, content }) => {
    // Broadcast the change to all other users in the document
    socket.to(documentId).emit('document-change', { userId, content });
  });

  socket.on('leave-document', ({ documentId, userId }) => {
    socket.leave(documentId);
    
    if (activeUsers.has(documentId)) {
      const users = activeUsers.get(documentId);
      const updatedUsers = Array.from(users).filter(u => u.socketId !== socket.id);
      
      if (updatedUsers.length === 0) {
        activeUsers.delete(documentId);
      } else {
        activeUsers.set(documentId, new Set(updatedUsers));
        io.to(documentId).emit('active-users', updatedUsers);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove user from all documents
    activeUsers.forEach((users, documentId) => {
      const updatedUsers = Array.from(users).filter(u => u.socketId !== socket.id);
      
      if (updatedUsers.length === 0) {
        activeUsers.delete(documentId);
      } else {
        activeUsers.set(documentId, new Set(updatedUsers));
        io.to(documentId).emit('active-users', updatedUsers);
      }
    });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = { app, io };
