# 📝 CollabDocs - Cloud-Based Collaboration Platform

A comprehensive cloud-based collaboration tool featuring real-time document editing, AI-assisted proofreading, version control, and secure cloud storage.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-green.svg)
![Python](https://img.shields.io/badge/python-%3E%3D3.8-blue.svg)

## � Latest Updates (v2.0)

### ✨ New Features Added:
- **🔗 Real-Time Collaboration** - Live text sync, cursor tracking, user presence indicators
- **📥 Document Download** - Export to 6 formats (Word, PDF, Text, HTML, Markdown, JSON)
- **🤖 Enhanced AI** - 3 FREE providers (Groq, LanguageTool, OpenAI), 6 error types, styling suggestions
- **📱 Share Documents** - Shareable links with Email/WhatsApp/Slack integration

**📚 See detailed guides:**
- `REAL_TIME_TEST_GUIDE.md` - Real-time collaboration testing
- `DOWNLOAD_FEATURE_GUIDE.md` - Download functionality
- `AI_INTEGRATION_GUIDE.md` - AI setup and usage

**🚀 Quick Start:**
```bash
cd backend
npm install
$env:GROQ_API_KEY="your_key_here"  # Get free at console.groq.com/keys
node server-demo.js
# Open demo.html in browser
```

## �🌟 Features

### Real-Time Collaboration
- ✅ Multi-user simultaneous editing
- ✅ Live cursor tracking and active user display
- ✅ Instant synchronization using Socket.IO
- ✅ Real-time commenting system

### AI-Powered Assistance
- 🤖 Grammar and spelling correction
- 🤖 Style and tone analysis
- 🤖 Content recommendations
- 🤖 Document summarization
- 🤖 Keyword extraction
- 🤖 Sentiment analysis

### Version Control
- 📜 Full document history tracking
- 📜 Visual diff viewer
- 📜 One-click version restoration
- 📜 Automatic version snapshots

### Security & Access Control
- 🔒 Firebase Authentication
- 🔒 Role-based permissions (Owner, Editor, Viewer)
- 🔒 Secure document sharing
- 🔒 Google Cloud Storage integration

### Additional Features
- 🎤 Voice dictation support
- 📎 File attachment capability
- 🎨 Rich text editor with formatting
- 📊 Document statistics and analytics

## 🏗️ Architecture

```
┌─────────────────┐
│   React.js      │  Frontend - Document Editor UI
│   (Port 3000)   │  
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Node.js       │  Backend API Server
│   Express.js    │  Real-time WebSocket
│   (Port 5000)   │  
└────────┬────────┘
         │
         ├──────────────────┐
         ▼                  ▼
┌─────────────────┐  ┌──────────────┐
│   Python NLP    │  │   Firebase   │
│   AI Service    │  │   Firestore  │
│   (Port 5001)   │  │   Auth       │
└─────────────────┘  │   Storage    │
                     └──────────────┘
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 14.0.0
- **Python** >= 3.8
- **npm** or **yarn**
- **Firebase Account**
- **Google Cloud Account** (for storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd EDP-PROJECT
   ```

2. **Install dependencies for all services**
   ```bash
   npm run install-all
   ```

   Or install individually:
   ```bash
   # Root dependencies
   npm install

   # Frontend dependencies
   cd frontend
   npm install

   # Backend dependencies
   cd ../backend
   npm install

   # AI Service dependencies
   cd ../ai-service
   pip install -r requirements.txt
   python setup.py  # Download NLP models
   ```

3. **Configure Firebase**
   - Follow the detailed guide in `FIREBASE_SETUP.md`
   - Download service account key and place as `serviceAccountKey.json`
   - Update environment variables

4. **Set up environment variables**
   ```bash
   # Copy example files
   cp .env.example .env
   cp frontend/.env.example frontend/.env
   
   # Edit .env files with your credentials
   ```

5. **Start all services**
   ```bash
   # Development mode (runs all services concurrently)
   npm run dev
   ```

   Or start individually:
   ```bash
   # Terminal 1 - Frontend
   cd frontend
   npm start

   # Terminal 2 - Backend
   cd backend
   npm run dev

   # Terminal 3 - AI Service
   cd ai-service
   python app.py
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - AI Service: http://localhost:5001

## 📁 Project Structure

```
EDP-PROJECT/
├── frontend/                 # React.js frontend
│   ├── public/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── Auth/        # Login, Register
│   │   │   ├── Dashboard/   # Document list
│   │   │   ├── Editor/      # Real-time editor
│   │   │   └── Version/     # Version history
│   │   ├── context/         # React Context (Auth)
│   │   ├── firebase.js      # Firebase config
│   │   └── App.js           # Main app component
│   └── package.json
│
├── backend/                  # Node.js backend
│   ├── config/              # Configuration files
│   │   ├── firebase.js      # Firebase Admin
│   │   └── gcs.js           # Google Cloud Storage
│   ├── middleware/          # Express middleware
│   │   └── auth.js          # Authentication
│   ├── routes/              # API routes
│   │   ├── auth.js          # Auth endpoints
│   │   ├── documents.js     # Document CRUD
│   │   └── ai.js            # AI integration
│   ├── server.js            # Express server
│   └── package.json
│
├── ai-service/              # Python AI service
│   ├── app.py              # Flask application
│   ├── setup.py            # NLP model setup
│   └── requirements.txt
│
├── .env.example            # Environment template
├── .gitignore
├── package.json            # Root package config
├── FIREBASE_SETUP.md       # Firebase guide
└── README.md              # This file
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `GET /api/auth/profile/:uid` - Get user profile
- `PUT /api/auth/role/:uid` - Update user role

### Documents
- `GET /api/documents` - List all user documents
- `GET /api/documents/:id` - Get specific document
- `POST /api/documents` - Create new document
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document
- `POST /api/documents/:id/share` - Share document
- `POST /api/documents/:id/upload` - Upload attachment

### Versions
- `GET /api/documents/:id/versions` - Get version history
- `POST /api/documents/:id/versions` - Save new version
- `POST /api/documents/:id/restore` - Restore version

### AI Services
- `POST /api/ai/analyze` - Comprehensive text analysis
- `POST /api/ai/grammar` - Grammar check
- `POST /api/ai/recommend` - Content recommendations
- `POST /api/ai/summarize` - Text summarization

## 🎯 Usage Guide

### Creating a Document
1. Log in to your account
2. Click "New Document" on dashboard
3. Enter document title
4. Start editing!

### Real-Time Collaboration
1. Open a document
2. Click "Share" to invite collaborators
3. Multiple users can edit simultaneously
4. See active users in real-time

### AI Analysis
1. Open a document
2. Click "🤖 AI Analyze" button
3. Review grammar, style, and content suggestions
4. Apply recommendations as needed

### Version Control
1. Save versions as you edit
2. Click "📜 History" to view all versions
3. Use "View Diff" to compare versions
4. Restore previous versions with one click

### Voice Dictation
1. Click "🎤 Voice" button
2. Allow microphone access
3. Speak your content
4. Text appears in editor automatically

## 🔐 Security Considerations

- Never commit `serviceAccountKey.json` or `.env` files
- Use environment variables for all secrets
- Implement proper Firebase security rules
- Enable rate limiting in production
- Use HTTPS in production
- Regularly update dependencies

## 🚢 Deployment

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy the build folder
```

### Backend (Heroku/Railway)
```bash
# Ensure environment variables are set
git push heroku main
```

### AI Service (Google Cloud Run/AWS Lambda)
```bash
cd ai-service
# Create requirements.txt
# Deploy using platform CLI
```

## 🛠️ Tech Stack

### Frontend
- **React.js** - UI framework
- **React Router** - Navigation
- **React Quill** - Rich text editor
- **Socket.IO Client** - Real-time communication
- **Firebase SDK** - Authentication & Database
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **Socket.IO** - WebSocket server
- **Firebase Admin** - Backend Firebase integration
- **Google Cloud Storage** - File storage
- **Helmet** - Security headers
- **Express Rate Limit** - API protection

### AI Service
- **Python Flask** - API framework
- **spaCy** - NLP processing
- **NLTK** - Natural language toolkit
- **TextBlob** - Sentiment analysis
- **Language Tool** - Grammar checking
- **Gensim** - Text summarization

### Cloud Services
- **Firebase Authentication** - User management
- **Cloud Firestore** - Document database
- **Firebase Realtime Database** - Live comments
- **Google Cloud Storage** - File storage

## 🧪 Testing

```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
npm test

# AI Service tests
cd ai-service
pytest
```

## 📊 Performance Optimization

- Implement lazy loading for components
- Use React.memo for expensive components
- Enable Firebase persistence
- Implement debouncing for real-time updates
- Use CDN for static assets
- Enable gzip compression

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Firebase for backend infrastructure
- spaCy for NLP capabilities
- React community for amazing libraries
- All contributors and supporters

## 📧 Contact & Support

For questions and support, please open an issue in the repository.

---

**Built with ❤️ to solve remote collaboration challenges**
