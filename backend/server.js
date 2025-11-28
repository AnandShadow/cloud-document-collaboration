const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: '*',
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

  socket.on('join-document', ({ documentId, userId, userName, userColor }) => {
    socket.join(documentId);

    if (!activeUsers.has(documentId)) {
      activeUsers.set(documentId, new Set());
    }

    // Remove existing entry for this socket if any (to avoid duplicates)
    const existingUsers = activeUsers.get(documentId);
    for (const user of existingUsers) {
      if (user.socketId === socket.id) {
        existingUsers.delete(user);
        break;
      }
    }

    const newUser = {
      socketId: socket.id,
      userId: userId || socket.id,
      userName: userName || 'Anonymous',
      userColor: userColor || '#3b82f6'
    };

    activeUsers.get(documentId).add(newUser);

    // Broadcast active users to everyone in the document
    const users = Array.from(activeUsers.get(documentId));
    io.to(documentId).emit('active-users', { users });

    // Notify others that user joined
    socket.to(documentId).emit('user-joined', {
      userId: newUser.userId,
      userName: newUser.userName,
      userColor: newUser.userColor,
      users: users
    });

    console.log(`User ${userName} joined document ${documentId}`);
  });

  socket.on('document-change', ({ documentId, content, delta, userName }) => {
    // Broadcast the change to all other users in the document
    socket.to(documentId).emit('document-update', {
      content,
      delta,
      userId: socket.id,
      userName: userName || 'Anonymous',
      timestamp: Date.now()
    });
  });

  socket.on('cursor-move', ({ documentId, range, userName, userColor }) => {
    socket.to(documentId).emit('cursor-update', {
      userId: socket.id,
      userName: userName || 'Anonymous',
      userColor: userColor || '#3b82f6',
      range: range,
      timestamp: Date.now()
    });
  });

  socket.on('typing-start', ({ documentId, userName }) => {
    socket.to(documentId).emit('user-typing', {
      userId: socket.id,
      userName: userName || 'Anonymous',
      isTyping: true
    });
  });

  socket.on('typing-stop', ({ documentId }) => {
    socket.to(documentId).emit('user-typing', {
      userId: socket.id,
      isTyping: false
    });
  });

  socket.on('leave-document', ({ documentId, userId }) => {
    socket.leave(documentId);

    if (activeUsers.has(documentId)) {
      const users = activeUsers.get(documentId);
      let removedUser = null;

      for (const user of users) {
        if (user.socketId === socket.id) {
          users.delete(user);
          removedUser = user;
          break;
        }
      }

      const updatedUsers = Array.from(users);

      if (updatedUsers.length === 0) {
        activeUsers.delete(documentId);
      } else {
        io.to(documentId).emit('active-users', { users: updatedUsers });

        if (removedUser) {
          socket.to(documentId).emit('user-left', {
            userId: userId || socket.id,
            userName: removedUser.userName,
            users: updatedUsers
          });
        }
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // Remove user from all documents
    activeUsers.forEach((users, documentId) => {
      let removedUser = null;
      for (const user of users) {
        if (user.socketId === socket.id) {
          users.delete(user);
          removedUser = user;
          break;
        }
      }

      const updatedUsers = Array.from(users);

      if (updatedUsers.length === 0) {
        activeUsers.delete(documentId);
      } else {
        io.to(documentId).emit('active-users', { users: updatedUsers });

        if (removedUser) {
          io.to(documentId).emit('user-left', {
            userId: removedUser.userId,
            userName: removedUser.userName,
            users: updatedUsers
          });
        }
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

http.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = { app, io };
