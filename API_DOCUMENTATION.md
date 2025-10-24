# API Documentation

## Base URLs

- **Backend API**: `http://localhost:5000/api`
- **AI Service**: `http://localhost:5001`

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

Get the token from Firebase Authentication after user login.

---

## Authentication Endpoints

### Register User Profile
Create additional user profile data after Firebase registration.

**Endpoint**: `POST /api/auth/register`

**Request Body**:
```json
{
  "uid": "firebase-user-id",
  "email": "user@example.com",
  "displayName": "John Doe",
  "role": "editor"
}
```

**Response** (201):
```json
{
  "message": "User profile created"
}
```

### Get User Profile
Retrieve user profile information.

**Endpoint**: `GET /api/auth/profile/:uid`

**Response** (200):
```json
{
  "email": "user@example.com",
  "displayName": "John Doe",
  "role": "editor",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Update User Role
Update user's role (admin only).

**Endpoint**: `PUT /api/auth/role/:uid`

**Request Body**:
```json
{
  "role": "admin"
}
```

**Roles**: `admin`, `editor`, `viewer`

---

## Document Endpoints

### List Documents
Get all documents accessible to the current user.

**Endpoint**: `GET /api/documents`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
[
  {
    "id": "doc123",
    "title": "Project Proposal",
    "content": "<p>Document content...</p>",
    "owner": "user@example.com",
    "ownerId": "user-id",
    "collaborators": ["user-id-1", "user-id-2"],
    "permissions": {
      "user-id-1": "owner",
      "user-id-2": "editor"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
]
```

### Get Document
Retrieve a specific document.

**Endpoint**: `GET /api/documents/:id`

**Headers**: `Authorization: Bearer <token>`

**Response** (200): Same as single document object above

**Error Responses**:
- `404`: Document not found
- `403`: Access denied

### Create Document
Create a new document.

**Endpoint**: `POST /api/documents`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "title": "New Document",
  "content": "<p>Initial content</p>"
}
```

**Response** (201):
```json
{
  "id": "doc123",
  "title": "New Document",
  "content": "<p>Initial content</p>",
  "owner": "user@example.com",
  "ownerId": "user-id",
  "collaborators": ["user-id"],
  "permissions": {
    "user-id": "owner"
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Update Document
Update document content or title.

**Endpoint**: `PUT /api/documents/:id`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "title": "Updated Title",
  "content": "<p>Updated content</p>"
}
```

**Permissions Required**: `owner` or `editor`

**Response** (200):
```json
{
  "message": "Document updated successfully"
}
```

### Delete Document
Delete a document (owner only).

**Endpoint**: `DELETE /api/documents/:id`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "message": "Document deleted successfully"
}
```

### Share Document
Share document with another user.

**Endpoint**: `POST /api/documents/:id/share`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "userId": "user-id-to-share-with",
  "permission": "editor"
}
```

**Permissions**: `editor` or `viewer`

**Response** (200):
```json
{
  "message": "Document shared successfully"
}
```

### Upload Attachment
Upload a file attachment to a document.

**Endpoint**: `POST /api/documents/:id/upload`

**Headers**: 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Form Data**:
- `file`: File to upload

**Response** (200):
```json
{
  "url": "https://storage.googleapis.com/bucket/path/to/file.pdf",
  "filename": "file.pdf"
}
```

---

## Version Control Endpoints

### Save Version
Create a version snapshot of the document.

**Endpoint**: `POST /api/documents/:id/versions`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "content": "<p>Document content at this version</p>",
  "title": "Document Title"
}
```

**Response** (201):
```json
{
  "id": "version123",
  "documentId": "doc123",
  "content": "<p>Document content at this version</p>",
  "title": "Document Title",
  "author": "user@example.com",
  "authorId": "user-id",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Get Version History
Retrieve all versions of a document.

**Endpoint**: `GET /api/documents/:id/versions`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
[
  {
    "id": "version123",
    "documentId": "doc123",
    "content": "<p>Content</p>",
    "title": "Title",
    "author": "user@example.com",
    "authorId": "user-id",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Restore Version
Restore a previous version of the document.

**Endpoint**: `POST /api/documents/:id/restore`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "versionId": "version123"
}
```

**Response** (200):
```json
{
  "message": "Version restored successfully"
}
```

---

## AI Service Endpoints

### Comprehensive Analysis
Analyze text for grammar, style, tone, and readability.

**Endpoint**: `POST /api/ai/analyze`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "text": "Your document text here..."
}
```

**Response** (200):
```json
{
  "suggestions": [
    {
      "type": "Grammar",
      "message": "Possible spelling mistake found",
      "replacement": "correct",
      "context": "...incorect word...",
      "offset": 10,
      "length": 8
    },
    {
      "type": "Style",
      "message": "Consider using active voice",
      "replacement": null
    }
  ],
  "sentiment": {
    "polarity": 0.5,
    "subjectivity": 0.6
  },
  "stats": {
    "word_count": 150,
    "sentence_count": 8,
    "avg_sentence_length": 18.75
  }
}
```

### Grammar Check
Check grammar and spelling only.

**Endpoint**: `POST /api/ai/grammar`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "text": "Your text here..."
}
```

**Response** (200):
```json
{
  "suggestions": [
    {
      "message": "Possible spelling mistake",
      "replacements": ["correct", "correction", "corrected"],
      "context": "...incorect word...",
      "offset": 10,
      "length": 8,
      "rule": "MORFOLOGIK_RULE_EN_US",
      "category": "TYPOS"
    }
  ]
}
```

### Content Recommendations
Get keyword extraction and content suggestions.

**Endpoint**: `POST /api/ai/recommend`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "text": "Your document text..."
}
```

**Response** (200):
```json
{
  "recommendations": [
    {
      "type": "Structure",
      "message": "Consider expanding your content..."
    }
  ],
  "key_phrases": [
    "cloud computing",
    "machine learning",
    "data analysis"
  ],
  "entities": [
    {
      "text": "Google",
      "label": "ORG"
    },
    {
      "text": "New York",
      "label": "GPE"
    }
  ],
  "keywords": [
    "technology",
    "innovation",
    "development"
  ]
}
```

### Summarize Document
Generate a summary of the document.

**Endpoint**: `POST /api/ai/summarize`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "text": "Your long document text..."
}
```

**Response** (200):
```json
{
  "summary": "This is a concise summary of the document...",
  "original_length": 500,
  "summary_length": 150
}
```

---

## WebSocket Events (Socket.IO)

### Client → Server Events

#### Join Document
```javascript
socket.emit('join-document', {
  documentId: 'doc123',
  userId: 'user-id',
  userName: 'John Doe'
});
```

#### Document Change
```javascript
socket.emit('document-change', {
  documentId: 'doc123',
  userId: 'user-id',
  content: '<p>Updated content</p>'
});
```

#### Leave Document
```javascript
socket.emit('leave-document', {
  documentId: 'doc123',
  userId: 'user-id'
});
```

### Server → Client Events

#### Active Users
```javascript
socket.on('active-users', (users) => {
  // users = [{ socketId, userId, userName }, ...]
});
```

#### Document Change
```javascript
socket.on('document-change', ({ userId, content }) => {
  // Update editor with new content
});
```

---

## Error Responses

### Standard Error Format
```json
{
  "error": "Error message description"
}
```

### Common HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error
- `503`: Service Unavailable

---

## Rate Limiting

- **Window**: 15 minutes
- **Max Requests**: 100 per window
- **Headers**: Rate limit info included in response headers

---

## Best Practices

1. **Always include Authorization header** for protected endpoints
2. **Handle token expiration** - Refresh Firebase token as needed
3. **Implement retry logic** for failed requests
4. **Debounce real-time updates** to avoid excessive API calls
5. **Validate input** on client side before sending
6. **Handle errors gracefully** with user-friendly messages

---

## Example Usage (JavaScript)

```javascript
// Get documents
const token = await firebase.auth().currentUser.getIdToken();

const response = await axios.get('http://localhost:5000/api/documents', {
  headers: { Authorization: `Bearer ${token}` }
});

// Create document
const newDoc = await axios.post(
  'http://localhost:5000/api/documents',
  { title: 'New Doc', content: '<p>Content</p>' },
  { headers: { Authorization: `Bearer ${token}` } }
);

// AI Analysis
const analysis = await axios.post(
  'http://localhost:5000/api/ai/analyze',
  { text: 'Document text...' },
  { headers: { Authorization: `Bearer ${token}` } }
);
```
