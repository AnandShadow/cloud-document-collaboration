# 🚀 Vercel Deployment Guide

## ✅ Fixed Issues:
1. ✅ Added `vercel.json` configuration
2. ✅ Fixed `package.json` build script
3. ✅ Configured static HTML + Node.js backend routing

## 📋 Next Steps:

### 1. **Add Environment Variables in Vercel Dashboard**

Go to: https://vercel.com/anandshadows-projects/cloud-document-collaboration-git-main/settings/environment-variables

Add these variables:

```bash
# Groq API (Required for AI features)
GROQ_API_KEY=your_groq_key_here

# OpenAI API (Optional - fallback)
OPENAI_API_KEY=your_openai_key_here

# Environment
NODE_ENV=production
PORT=5000
```

**How to add:**
1. Click "Environment Variables" tab
2. Name: `GROQ_API_KEY`
3. Value: `your_groq_key_here` (get from https://console.groq.com/keys)
4. Environment: Check all (Production, Preview, Development)
5. Click "Save"

### 2. **Redeploy**

After adding environment variables:
1. Go to Deployments tab
2. Click "⟳ Redeploy" on latest deployment
3. Click "Redeploy" to confirm

### 3. **Your Live URLs**

Once deployed:
```
Frontend: https://cloud-document-collaboration-git-main-anandshadows-projects.vercel.app
Backend:  https://cloud-document-collaboration-git-main-anandshadows-projects.vercel.app/api
```

---

## 🐛 Troubleshooting:

### If build still fails:
1. Check Vercel build logs for specific error
2. Ensure `backend/package.json` exists with dependencies
3. Verify Node.js version (should be 18.x or 20.x)

### If API doesn't work:
1. Add environment variables (GROQ_API_KEY, etc.)
2. Check Function Logs in Vercel dashboard
3. Ensure CORS is configured for your domain

### If Socket.IO doesn't connect:
Vercel serverless functions have limitations with WebSockets.

**Alternative for real-time:**
- Use **Railway** or **Render** for backend (free tier)
- Deploy frontend on Vercel (static HTML)
- Point frontend to Railway backend URL

---

## 🎯 Alternative Deployment (Recommended for Socket.IO):

### **Option 1: Vercel (Frontend) + Railway (Backend)**

**Frontend on Vercel:**
```bash
# Keep current Vercel setup
# Just deploy demo.html as static site
```

**Backend on Railway:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy backend
cd backend
railway init
railway up
```

Railway provides:
- ✅ Free $5/month credit
- ✅ Full WebSocket support (Socket.IO works!)
- ✅ Persistent connections
- ✅ Custom domains

**Update demo.html:**
```javascript
// Change API_URL to Railway backend
const API_URL = 'https://your-app.railway.app';
```

### **Option 2: All-in-One on Railway**

Deploy everything on Railway:
```bash
railway init
railway up
```

Cost: $5/month credit (usually enough for small apps)

---

## ✨ Quick Fix for Current Deploy:

Since Vercel has WebSocket limitations, the best approach is:

1. **Keep Vercel for frontend** (demo.html - super fast CDN)
2. **Deploy backend to Railway** (Socket.IO works perfectly)
3. **Update API_URL** in demo.html to point to Railway

**Want me to set up Railway deployment for you?**

---

## 📊 Deployment Status:

- ✅ Repository: Connected to Vercel
- ✅ Configuration: vercel.json created
- ✅ Build script: Fixed
- ⏳ Environment variables: **Need to add in Vercel dashboard**
- ⏳ Redeploy: After adding env vars

---

**Check your Vercel dashboard now - deployment should be in progress!**

https://vercel.com/anandshadows-projects/cloud-document-collaboration-git-main
