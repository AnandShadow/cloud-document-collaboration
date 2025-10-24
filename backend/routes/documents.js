const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { bucket } = require('../config/gcs');
const { verifyToken, checkRole } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

// Get all documents for a user
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    
    const documentsRef = db.collection('documents');
    const snapshot = await documentsRef
      .where('collaborators', 'array-contains', userId)
      .orderBy('updatedAt', 'desc')
      .get();

    const documents = [];
    snapshot.forEach(doc => {
      documents.push({ id: doc.id, ...doc.data() });
    });

    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Get a specific document
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection('documents').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const data = doc.data();
    
    // Check if user has access
    if (!data.collaborators.includes(req.user.uid)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ id: doc.id, ...data });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// Create a new document
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.uid;
    const userEmail = req.user.email;

    const newDoc = {
      title: title || 'Untitled Document',
      content: content || '',
      owner: userEmail,
      ownerId: userId,
      collaborators: [userId],
      permissions: {
        [userId]: 'owner'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await db.collection('documents').add(newDoc);

    res.status(201).json({ id: docRef.id, ...newDoc });
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
});

// Update a document
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    
    const docRef = db.collection('documents').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const data = doc.data();
    const userPermission = data.permissions[req.user.uid];

    // Check if user has edit permission
    if (!['owner', 'editor'].includes(userPermission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    await docRef.update({
      title: title || data.title,
      content: content !== undefined ? content : data.content,
      updatedAt: new Date().toISOString()
    });

    res.json({ message: 'Document updated successfully' });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// Delete a document
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection('documents').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const data = doc.data();

    // Only owner can delete
    if (data.ownerId !== req.user.uid) {
      return res.status(403).json({ error: 'Only owner can delete document' });
    }

    await docRef.delete();
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Share document with other users
router.post('/:id/share', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, permission } = req.body; // permission: 'editor' or 'viewer'

    if (!['editor', 'viewer'].includes(permission)) {
      return res.status(400).json({ error: 'Invalid permission type' });
    }

    const docRef = db.collection('documents').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const data = doc.data();

    // Only owner can share
    if (data.ownerId !== req.user.uid) {
      return res.status(403).json({ error: 'Only owner can share document' });
    }

    const updatedCollaborators = [...new Set([...data.collaborators, userId])];
    const updatedPermissions = { ...data.permissions, [userId]: permission };

    await docRef.update({
      collaborators: updatedCollaborators,
      permissions: updatedPermissions,
      updatedAt: new Date().toISOString()
    });

    res.json({ message: 'Document shared successfully' });
  } catch (error) {
    console.error('Error sharing document:', error);
    res.status(500).json({ error: 'Failed to share document' });
  }
});

// Save version
router.post('/:id/versions', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, title } = req.body;

    const versionData = {
      documentId: id,
      content,
      title,
      author: req.user.email,
      authorId: req.user.uid,
      createdAt: new Date().toISOString()
    };

    const versionRef = await db
      .collection('documents')
      .doc(id)
      .collection('versions')
      .add(versionData);

    res.status(201).json({ id: versionRef.id, ...versionData });
  } catch (error) {
    console.error('Error saving version:', error);
    res.status(500).json({ error: 'Failed to save version' });
  }
});

// Get version history
router.get('/:id/versions', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const versionsRef = db
      .collection('documents')
      .doc(id)
      .collection('versions');
    
    const snapshot = await versionsRef.orderBy('createdAt', 'desc').get();

    const versions = [];
    snapshot.forEach(doc => {
      versions.push({ id: doc.id, ...doc.data() });
    });

    res.json(versions);
  } catch (error) {
    console.error('Error fetching versions:', error);
    res.status(500).json({ error: 'Failed to fetch versions' });
  }
});

// Restore a version
router.post('/:id/restore', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { versionId } = req.body;

    const versionRef = db
      .collection('documents')
      .doc(id)
      .collection('versions')
      .doc(versionId);
    
    const version = await versionRef.get();

    if (!version.exists) {
      return res.status(404).json({ error: 'Version not found' });
    }

    const versionData = version.data();
    
    // Update document with version content
    await db.collection('documents').doc(id).update({
      content: versionData.content,
      title: versionData.title,
      updatedAt: new Date().toISOString()
    });

    res.json({ message: 'Version restored successfully' });
  } catch (error) {
    console.error('Error restoring version:', error);
    res.status(500).json({ error: 'Failed to restore version' });
  }
});

// Upload file attachment
router.post('/:id/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { id } = req.params;
    const filename = `${id}/${uuidv4()}-${req.file.originalname}`;
    const file = bucket.file(filename);

    await file.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype
      }
    });

    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    res.json({ url: publicUrl, filename: req.file.originalname });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

module.exports = router;
