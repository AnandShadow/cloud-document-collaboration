import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const token = await currentUser.getIdToken();
      const response = await axios.get('/api/documents', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const createDocument = async () => {
    if (!newDocTitle.trim()) return;

    try {
      const token = await currentUser.getIdToken();
      const response = await axios.post(
        '/api/documents',
        { title: newDocTitle },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDocuments([...documents, response.data]);
      setNewDocTitle('');
      setShowModal(false);
    } catch (error) {
      console.error('Error creating document:', error);
    }
  };

  const deleteDocument = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      const token = await currentUser.getIdToken();
      await axios.delete(`/api/documents/${docId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(documents.filter(doc => doc.id !== docId));
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const openDocument = (docId) => {
    navigate(`/document/${docId}`);
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <nav className="navbar">
        <h1>📝 CollabDocs</h1>
        <div className="navbar-menu">
          <span>Welcome, {currentUser.displayName || currentUser.email}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2>My Documents</h2>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + New Document
          </button>
        </div>

        <div className="documents-grid">
          {documents.length === 0 ? (
            <div className="no-documents">
              <p>No documents yet. Create your first document to get started!</p>
            </div>
          ) : (
            documents.map((doc) => (
              <div key={doc.id} className="document-card">
                <div className="document-header">
                  <h3>{doc.title}</h3>
                  <button
                    className="delete-btn"
                    onClick={() => deleteDocument(doc.id)}
                  >
                    🗑️
                  </button>
                </div>
                <p className="document-meta">
                  Last modified: {new Date(doc.updatedAt).toLocaleDateString()}
                </p>
                <p className="document-meta">
                  Created by: {doc.owner}
                </p>
                <button
                  className="btn btn-secondary"
                  onClick={() => openDocument(doc.id)}
                >
                  Open Document
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Document</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <div className="form-group">
              <label>Document Title</label>
              <input
                type="text"
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                placeholder="Enter document title"
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={createDocument}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
