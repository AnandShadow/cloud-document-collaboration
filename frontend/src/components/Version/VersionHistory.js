import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import ReactDiffViewer from 'react-diff-viewer';
import './VersionHistory.css';

const VersionHistory = () => {
  const { documentId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [currentContent, setCurrentContent] = useState('');
  const [showDiff, setShowDiff] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVersions();
  }, [documentId]);

  const fetchVersions = async () => {
    try {
      const token = await currentUser.getIdToken();
      
      // Fetch current document
      const docResponse = await axios.get(`/api/documents/${documentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentContent(docResponse.data.content || '');

      // Fetch version history
      const versionsResponse = await axios.get(`/api/documents/${documentId}/versions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVersions(versionsResponse.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching versions:', error);
      setLoading(false);
    }
  };

  const viewVersion = (version) => {
    setSelectedVersion(version);
    setShowDiff(true);
  };

  const restoreVersion = async (versionId) => {
    if (!window.confirm('Are you sure you want to restore this version? Current content will be replaced.')) {
      return;
    }

    try {
      const token = await currentUser.getIdToken();
      await axios.post(
        `/api/documents/${documentId}/restore`,
        { versionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Version restored successfully!');
      navigate(`/document/${documentId}`);
    } catch (error) {
      console.error('Error restoring version:', error);
      alert('Failed to restore version');
    }
  };

  const stripHtml = (html) => {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="version-history">
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate(`/document/${documentId}`)} className="back-btn">
            ← Back to Editor
          </button>
          <h2>Version History</h2>
        </div>
      </nav>

      <div className="history-container">
        <div className="versions-list">
          <h3>Available Versions</h3>
          {versions.length === 0 ? (
            <p className="no-versions">No version history available</p>
          ) : (
            versions.map((version) => (
              <div key={version.id} className="version-item">
                <div className="version-info">
                  <div className="version-date">
                    {new Date(version.createdAt).toLocaleString()}
                  </div>
                  <div className="version-author">
                    By: {version.author}
                  </div>
                  {version.title && (
                    <div className="version-title">
                      Title: {version.title}
                    </div>
                  )}
                </div>
                <div className="version-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => viewVersion(version)}
                  >
                    View Diff
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => restoreVersion(version.id)}
                  >
                    Restore
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {showDiff && selectedVersion && (
          <div className="diff-viewer">
            <div className="diff-header">
              <h3>Comparing: Current vs {new Date(selectedVersion.createdAt).toLocaleString()}</h3>
              <button className="close-btn" onClick={() => setShowDiff(false)}>×</button>
            </div>
            <div className="diff-content">
              <ReactDiffViewer
                oldValue={stripHtml(selectedVersion.content || '')}
                newValue={stripHtml(currentContent)}
                splitView={true}
                leftTitle={`Version (${new Date(selectedVersion.createdAt).toLocaleDateString()})`}
                rightTitle="Current"
                showDiffOnly={false}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VersionHistory;
