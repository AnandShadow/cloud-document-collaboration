# Troubleshooting Guide

Common issues and their solutions when working with CollabDocs.

## Installation Issues

### npm install fails

**Problem:** Package installation errors

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Try using npm ci instead
npm ci
```

### Python package installation fails

**Problem:** pip install errors

**Solutions:**
```bash
# Upgrade pip
python -m pip install --upgrade pip

# Use virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Install with verbose output
pip install -r requirements.txt -v
```

## Firebase Issues

### "Firebase app not initialized"

**Problem:** Firebase configuration not loaded

**Solutions:**
1. Check `.env` file exists in frontend folder
2. Verify all REACT_APP_ variables are set
3. Restart development server
4. Check browser console for specific errors

### "Permission denied" errors

**Problem:** Firebase security rules blocking access

**Solutions:**
1. Go to Firebase Console → Firestore → Rules
2. For development, use test mode rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
3. Remember to implement proper rules for production!

### Authentication not working

**Problem:** Cannot sign in or register

**Solutions:**
1. Enable Email/Password in Firebase Console → Authentication
2. Check browser console for CORS errors
3. Verify Firebase configuration in `.env`
4. Clear browser cache and cookies
5. Check Network tab for failed requests

## Backend Issues

### "Error: ECONNREFUSED" when calling API

**Problem:** Backend server not running

**Solutions:**
```bash
# Check if backend is running
netstat -ano | findstr :5000  # Windows
lsof -i :5000  # Mac/Linux

# Start backend
cd backend
npm run dev
```

### "Service account key not found"

**Problem:** Firebase Admin SDK can't find credentials

**Solutions:**
1. Download service account key from Firebase Console
2. Save as `serviceAccountKey.json` in project root
3. Check path in `backend/config/firebase.js`
4. Verify file is not in `.gitignore` location

### Socket.IO connection fails

**Problem:** Real-time features not working

**Solutions:**
1. Check CORS configuration in `backend/server.js`
2. Verify frontend is connecting to correct URL
3. Check browser console for WebSocket errors
4. Ensure firewall allows WebSocket connections

## AI Service Issues

### "AI service is unavailable"

**Problem:** Python AI service not running or crashed

**Solutions:**
```bash
# Check if service is running
netstat -ano | findstr :5001  # Windows
lsof -i :5001  # Mac/Linux

# Restart AI service
cd ai-service
python app.py
```

### "spaCy model not found"

**Problem:** NLP models not downloaded

**Solutions:**
```bash
# Download models manually
python -m spacy download en_core_web_sm

# Or run setup script
python setup.py
```

### "Module not found" errors

**Problem:** Python dependencies missing

**Solutions:**
```bash
# Reinstall requirements
pip install -r requirements.txt

# Check Python version (must be 3.8+)
python --version

# Use virtual environment
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Frontend Issues

### "Module not found" in React

**Problem:** Missing dependencies

**Solutions:**
```bash
cd frontend
npm install
# Or for specific package
npm install <package-name>
```

### Quill editor not loading

**Problem:** React Quill issues

**Solutions:**
1. Check if `react-quill` is installed
2. Import CSS: `import 'react-quill/dist/quill.snow.css'`
3. Clear browser cache
4. Check browser console for errors

### Real-time updates not working

**Problem:** Socket.IO not connecting

**Solutions:**
1. Check backend Socket.IO server is running
2. Verify Socket.IO client URL in `DocumentEditor.js`
3. Check browser console for connection errors
4. Try different browser

## Database Issues

### Documents not saving

**Problem:** Firestore write errors

**Solutions:**
1. Check Firestore rules
2. Verify user is authenticated
3. Check browser console for errors
4. Verify quota limits in Firebase Console

### Version history not loading

**Problem:** Cannot fetch versions

**Solutions:**
1. Check Firestore subcollection structure
2. Verify user has read permissions
3. Check backend routes are working
4. Test API endpoint directly

## Performance Issues

### Slow document loading

**Solutions:**
1. Enable Firestore persistence
2. Implement pagination for document list
3. Optimize Firestore queries
4. Use indexes for complex queries

### High memory usage

**Solutions:**
1. Limit number of active connections
2. Implement cleanup for old Socket.IO connections
3. Optimize React components with React.memo
4. Check for memory leaks in browser DevTools

## Deployment Issues

### Build fails

**Problem:** Production build errors

**Solutions:**
```bash
# Check for unused imports
npm run build

# Fix ESLint errors
npm run lint

# Check environment variables
# Make sure all required vars are set
```

### CORS errors in production

**Problem:** Cross-origin requests blocked

**Solutions:**
1. Update CORS configuration in backend
2. Set correct FRONTEND_URL in backend `.env`
3. Add domain to Firebase authorized domains
4. Check server CORS headers

### Environment variables not working

**Problem:** Config not loading in production

**Solutions:**
1. Ensure variables are set in hosting platform
2. For React, must start with `REACT_APP_`
3. Rebuild after changing environment variables
4. Check build logs for missing variables

## Common Error Messages

### "Cannot read property of undefined"

**Cause:** Trying to access property of null/undefined object

**Fix:** Add optional chaining or null checks
```javascript
// Instead of
user.displayName

// Use
user?.displayName || 'Anonymous'
```

### "Network Error"

**Cause:** Cannot reach API endpoint

**Fix:**
1. Check API URL is correct
2. Ensure backend is running
3. Check network connectivity
4. Verify CORS settings

### "Token expired"

**Cause:** Firebase auth token expired

**Fix:**
```javascript
// Refresh token
const token = await firebase.auth().currentUser.getIdToken(true);
```

## Debug Mode

### Enable detailed logging

**Backend:**
```javascript
// In server.js
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});
```

**Frontend:**
```javascript
// In App.js
console.log('Current user:', currentUser);
console.log('Environment:', process.env);
```

**AI Service:**
```python
# In app.py
app.config['DEBUG'] = True
```

## Still Having Issues?

1. **Check logs:**
   - Browser console (F12)
   - Backend terminal output
   - AI service terminal output

2. **Test components individually:**
   - Test backend API with Postman
   - Test AI service with curl
   - Test Firebase connection

3. **Search existing issues:**
   - Check GitHub issues
   - Search error messages online

4. **Ask for help:**
   - Open a GitHub issue
   - Provide error logs
   - Include steps to reproduce

## Useful Commands

```bash
# Check ports in use
netstat -ano | findstr :3000  # Windows
lsof -i :3000  # Mac/Linux

# Kill process on port
taskkill /PID <PID> /F  # Windows
kill -9 <PID>  # Mac/Linux

# View logs
# Backend
npm run dev

# Check npm version
npm --version
node --version

# Check Python version
python --version
pip --version

# Test API endpoint
curl http://localhost:5000/health

# Test AI service
curl http://localhost:5001/health
```

## Prevention Tips

1. **Always check `.env` files are configured**
2. **Run all services before testing**
3. **Keep dependencies updated**
4. **Use version control effectively**
5. **Test in incognito mode to rule out cache issues**
6. **Read error messages carefully**
7. **Check Firebase quotas regularly**

Need more help? Open an issue with:
- Error message
- Steps to reproduce
- System information
- Relevant code snippets
