const express = require('express');
const router = express.Router();
const { auth, db } = require('../config/firebase');

// Register endpoint (handled by Firebase on client, this is for additional user data)
router.post('/register', async (req, res) => {
  try {
    const { uid, email, displayName, role } = req.body;
    
    await db.collection('users').doc(uid).set({
      email,
      displayName,
      role: role || 'editor', // Default role
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    res.status(201).json({ message: 'User profile created' });
  } catch (error) {
    console.error('Error creating user profile:', error);
    res.status(500).json({ error: 'Failed to create user profile' });
  }
});

// Get user profile
router.get('/profile/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(userDoc.data());
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update user role (admin only)
router.put('/role/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const { role } = req.body;

    if (!['admin', 'editor', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    await db.collection('users').doc(uid).update({
      role,
      updatedAt: new Date().toISOString()
    });

    res.json({ message: 'User role updated' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

module.exports = router;
