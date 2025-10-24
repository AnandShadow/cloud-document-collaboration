# Quick Start Guide

Get CollabDocs up and running in 10 minutes!

## Prerequisites

Make sure you have installed:
- Node.js (v14 or higher)
- Python (v3.8 or higher)
- npm or yarn
- Git

## Step 1: Clone and Install (2 minutes)

```bash
# Clone the repository
git clone <your-repo-url>
cd EDP-PROJECT

# Install all dependencies
npm run install-all
```

## Step 2: Firebase Setup (3 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication, Firestore, and Storage
4. Download configuration:
   - Web app config → Copy to `frontend/.env`
   - Service account key → Save as `serviceAccountKey.json`

**Quick setup files:**

`frontend/.env`:
```env
REACT_APP_FIREBASE_API_KEY=your_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_DATABASE_URL=your_db_url
REACT_APP_API_URL=http://localhost:5000
```

`.env` (root):
```env
PORT=5000
NODE_ENV=development
FIREBASE_DATABASE_URL=your_db_url
GCS_BUCKET_NAME=your_bucket
```

## Step 3: Setup AI Service (2 minutes)

```bash
cd ai-service
pip install -r requirements.txt
python setup.py  # Downloads NLP models
cd ..
```

## Step 4: Start All Services (1 minute)

```bash
# Start everything at once
npm run dev
```

Or start individually in separate terminals:
```bash
# Terminal 1 - Frontend
cd frontend && npm start

# Terminal 2 - Backend
cd backend && npm run dev

# Terminal 3 - AI Service
cd ai-service && python app.py
```

## Step 5: Test It Out! (2 minutes)

1. Open http://localhost:3000
2. Register a new account
3. Create your first document
4. Try the AI analysis feature!

## 🎉 You're Ready!

### What to try:
- ✅ Create and edit documents
- ✅ Share with team members
- ✅ Use AI grammar checking
- ✅ Save and restore versions
- ✅ Add comments
- ✅ Try voice dictation

## 🆘 Quick Troubleshooting

**Port already in use:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill
```

**Firebase errors:**
- Double-check your `.env` files
- Ensure service account key is in the right location
- Check Firebase security rules

**AI service fails:**
- Make sure Python packages are installed
- Run `python setup.py` again
- Check if port 5001 is available

## 📚 Next Steps

- Read the full [README.md](README.md)
- Check [API Documentation](API_DOCUMENTATION.md)
- Review [Firebase Setup Guide](FIREBASE_SETUP.md)

## 💡 Tips

- Use `npm run dev` to run all services together
- Keep the backend and AI service running while developing
- Check browser console for errors
- Use Firebase Console to view data

Need help? Open an issue on GitHub!
