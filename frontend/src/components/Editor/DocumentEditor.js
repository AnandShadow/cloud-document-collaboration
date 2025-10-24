import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { ref, onValue, set, push } from 'firebase/database';
import { database } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import io from 'socket.io-client';
import './DocumentEditor.css';

const socket = io('http://localhost:5000');

const DocumentEditor = () => {
  const { documentId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const quillRef = useRef(null);

  const [document, setDocument] = useState(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showAI, setShowAI] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Quill modules configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ]
  };

  useEffect(() => {
    if (!documentId) return;

    // Fetch document data
    fetchDocument();

    // Join document room for real-time collaboration
    socket.emit('join-document', { documentId, userId: currentUser.uid, userName: currentUser.displayName });

    // Listen for document changes
    socket.on('document-change', (data) => {
      if (data.userId !== currentUser.uid) {
        setContent(data.content);
      }
    });

    // Listen for active users
    socket.on('active-users', (users) => {
      setActiveUsers(users.filter(user => user.userId !== currentUser.uid));
    });

    // Listen for comments
    const commentsRef = ref(database, `documents/${documentId}/comments`);
    onValue(commentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const commentsList = Object.entries(data).map(([id, comment]) => ({
          id,
          ...comment
        }));
        setComments(commentsList.sort((a, b) => b.timestamp - a.timestamp));
      }
    });

    return () => {
      socket.emit('leave-document', { documentId, userId: currentUser.uid });
      socket.off('document-change');
      socket.off('active-users');
    };
  }, [documentId, currentUser]);

  const fetchDocument = async () => {
    try {
      const token = await currentUser.getIdToken();
      const response = await axios.get(`/api/documents/${documentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocument(response.data);
      setTitle(response.data.title);
      setContent(response.data.content || '');
    } catch (error) {
      console.error('Error fetching document:', error);
    }
  };

  const handleContentChange = (value) => {
    setContent(value);
    socket.emit('document-change', {
      documentId,
      userId: currentUser.uid,
      content: value
    });
  };

  const saveDocument = async () => {
    try {
      setSaving(true);
      const token = await currentUser.getIdToken();
      await axios.put(
        `/api/documents/${documentId}`,
        { title, content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Save version
      await axios.post(
        `/api/documents/${documentId}/versions`,
        { content, title },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSaving(false);
      alert('Document saved successfully!');
    } catch (error) {
      console.error('Error saving document:', error);
      setSaving(false);
      alert('Failed to save document');
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;

    try {
      const commentsRef = ref(database, `documents/${documentId}/comments`);
      const newCommentRef = push(commentsRef);
      await set(newCommentRef, {
        text: newComment,
        author: currentUser.displayName || currentUser.email,
        authorId: currentUser.uid,
        timestamp: Date.now()
      });
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const analyzeWithAI = async () => {
    try {
      setIsAnalyzing(true);
      setShowAI(true);
      const token = await currentUser.getIdToken();
      
      // Strip HTML tags for analysis
      const plainText = content.replace(/<[^>]*>/g, '');
      
      const response = await axios.post(
        '/api/ai/analyze',
        { text: plainText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setAiSuggestions(response.data.suggestions);
      setIsAnalyzing(false);
    } catch (error) {
      console.error('Error analyzing document:', error);
      setIsAnalyzing(false);
    }
  };

  const startVoiceDictation = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice dictation is not supported in your browser');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        const newContent = content + finalTranscript;
        setContent(newContent);
        handleContentChange(newContent);
      }
    };

    recognition.start();
    setTimeout(() => recognition.stop(), 30000); // Stop after 30 seconds
  };

  return (
    <div className="document-editor">
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            ← Back
          </button>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="title-input"
            placeholder="Document Title"
          />
        </div>
        <div className="navbar-menu">
          <button onClick={saveDocument} disabled={saving}>
            {saving ? 'Saving...' : '💾 Save'}
          </button>
          <button onClick={() => navigate(`/document/${documentId}/history`)}>
            📜 History
          </button>
          <button onClick={analyzeWithAI}>
            🤖 AI Analyze
          </button>
          <button onClick={startVoiceDictation}>
            🎤 Voice
          </button>
          <button onClick={() => setShowComments(!showComments)}>
            💬 Comments ({comments.length})
          </button>
        </div>
      </nav>

      <div className="editor-container">
        <div className="editor-main">
          {activeUsers.length > 0 && (
            <div className="active-users">
              <span>👥 Active users: </span>
              {activeUsers.map((user, index) => (
                <span key={index} className="user-badge">{user.userName}</span>
              ))}
            </div>
          )}

          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={content}
            onChange={handleContentChange}
            modules={modules}
            placeholder="Start typing your document..."
          />
        </div>

        {showComments && (
          <div className="comments-sidebar">
            <h3>Comments</h3>
            <div className="comments-list">
              {comments.map((comment) => (
                <div key={comment.id} className="comment">
                  <div className="comment-author">{comment.author}</div>
                  <div className="comment-text">{comment.text}</div>
                  <div className="comment-time">
                    {new Date(comment.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
            <div className="comment-input">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
              />
              <button onClick={addComment} className="btn btn-primary">
                Post Comment
              </button>
            </div>
          </div>
        )}

        {showAI && (
          <div className="ai-sidebar">
            <div className="ai-header">
              <h3>🤖 AI Suggestions</h3>
              <button onClick={() => setShowAI(false)} className="close-btn">×</button>
            </div>
            {isAnalyzing ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p>Analyzing your document...</p>
              </div>
            ) : (
              <div className="suggestions-list">
                {aiSuggestions.length === 0 ? (
                  <p>No suggestions at this time.</p>
                ) : (
                  aiSuggestions.map((suggestion, index) => (
                    <div key={index} className="suggestion">
                      <div className="suggestion-type">{suggestion.type}</div>
                      <div className="suggestion-text">{suggestion.message}</div>
                      {suggestion.replacement && (
                        <div className="suggestion-replacement">
                          Suggested: <strong>{suggestion.replacement}</strong>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentEditor;
