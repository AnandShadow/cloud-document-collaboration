# Firebase Configuration Guide

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter your project name
4. Enable Google Analytics (optional)
5. Click "Create Project"

## Step 2: Enable Firebase Services

### Authentication
1. In Firebase Console, go to "Authentication"
2. Click "Get Started"
3. Enable "Email/Password" sign-in method

### Realtime Database
1. Go to "Realtime Database"
2. Click "Create Database"
3. Choose location
4. Start in "Test mode" (configure rules later)

### Cloud Firestore
1. Go to "Cloud Firestore"
2. Click "Create Database"
3. Choose location
4. Start in "Test mode"

### Storage
1. Go to "Storage"
2. Click "Get Started"
3. Start in "Test mode"

## Step 3: Get Configuration Keys

### For Frontend (Web App)
1. Go to Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click the web icon (</>)
4. Register your app
5. Copy the configuration object

Create `frontend/.env` file:
```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
```

### For Backend (Admin SDK)
1. Go to Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. Rename it to `serviceAccountKey.json`
5. Place it in the project root directory

⚠️ **IMPORTANT**: Add `serviceAccountKey.json` to `.gitignore` - Never commit this file!

## Step 4: Google Cloud Storage Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Enable "Cloud Storage API"
4. Create a storage bucket or use the Firebase default bucket

Update your `.env` file:
```
GCS_BUCKET_NAME=your_project.appspot.com
```

## Step 5: Security Rules

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Documents collection
    match /documents/{documentId} {
      allow read: if request.auth != null && 
                    request.auth.uid in resource.data.collaborators;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
                              request.auth.uid == resource.data.ownerId;
      
      // Versions subcollection
      match /versions/{versionId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null;
      }
    }
  }
}
```

### Realtime Database Rules
```json
{
  "rules": {
    "documents": {
      "$documentId": {
        "comments": {
          ".read": "auth != null",
          ".write": "auth != null"
        }
      }
    }
  }
}
```

### Storage Rules
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{documentId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## Step 6: Environment Variables

Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

## Troubleshooting

### Error: "Firebase App not initialized"
- Make sure you've added the configuration to `.env`
- Restart your development server

### Error: "Permission denied"
- Check your Firestore/Database security rules
- Ensure user is authenticated

### Error: "Service account key not found"
- Download the service account key from Firebase Console
- Place it in the correct location
- Check file name matches configuration

## Testing

After configuration, test the connection:

1. Start the backend server
2. Check the console for "Firebase initialized successfully"
3. Try creating a test user in the authentication tab
