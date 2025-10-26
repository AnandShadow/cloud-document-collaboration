# 🚂 Railway Backend Deployment Guide

## 🎯 Why Railway for Backend?

Vercel **doesn't support WebSockets** (Socket.IO) due to serverless limitations.
Railway provides:
- ✅ Full WebSocket/Socket.IO support
- ✅ FREE $5/month credit (enough for small apps)
- ✅ Persistent server connections
- ✅ Easy deployment

---

## 📋 Step-by-Step Deployment:

### **Step 1: Install Railway CLI**

```bash
npm install -g @railway/cli
```

### **Step 2: Login to Railway**

```bash
railway login
```

This will open your browser to authenticate.

### **Step 3: Navigate to Backend Directory**

```bash
cd backend
```

### **Step 4: Initialize Railway Project**

```bash
railway init
```

Follow prompts:
- Project name: `collabdocs-backend`
- Select "Empty project"

### **Step 5: Add Environment Variables**

```bash
# Add Groq API key
railway variables set GROQ_API_KEY="your_groq_key_here"

# Add OpenAI key (optional)
railway variables set OPENAI_API_KEY="your_openai_key_here"

# Set Node environment
railway variables set NODE_ENV="production"

# Set port
railway variables set PORT="5000"
```

### **Step 6: Deploy!**

```bash
railway up
```

Wait 2-3 minutes for deployment to complete.

### **Step 7: Get Your Backend URL**

```bash
railway domain
```

This will show your backend URL, like:
```
https://collabdocs-backend-production.up.railway.app
```

### **Step 8: Update demo.html**

Replace this line in `demo.html`:

**From:**
```javascript
: 'https://your-backend.railway.app'; // TODO: Replace with your Railway URL
```

**To:**
```javascript
: 'https://collabdocs-backend-production.up.railway.app'; // Your actual Railway URL
```

### **Step 9: Commit and Push**

```bash
git add demo.html
git commit -m "Update API URL to Railway backend"
git push origin main
```

Vercel will auto-deploy the frontend with the new backend URL!

---

## 🎯 Alternative: One-Command Railway Setup

```bash
cd backend
railway login
railway init
railway up
railway domain
```

Then update `demo.html` with the domain shown.

---

## ✅ Verify Deployment:

### **Test Backend:**
```bash
curl https://your-backend.railway.app/health
```

Should return:
```json
{
  "status": "OK",
  "timestamp": "2025-10-26T...",
  "mode": "DEMO MODE - No Firebase"
}
```

### **Test WebSocket:**
Open browser console on your Vercel app:
```javascript
console.log('API URL:', API_URL);
```

Should show Railway URL, not localhost.

---

## 🐛 Troubleshooting:

### Railway deployment failed:
```bash
# Check logs
railway logs

# Redeploy
railway up --detach
```

### Can't connect to backend:
1. Check Railway domain is set: `railway domain`
2. Verify environment variables: `railway variables`
3. Check logs: `railway logs`
4. Ensure PORT is set to 5000

### CORS errors:
Update `backend/server-demo.js`:
```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://cloud-document-collaboration-git-main-anandshadows-projects.vercel.app',
    'https://*.vercel.app'
  ],
  credentials: true
}));
```

---

## 💰 Railway Pricing:

- **FREE $5/month credit** (starter plan)
- Usage-based pricing after free credit
- Typical small app: **~$2-3/month** (under free credit!)
- Can pause services when not in use

---

## 🚀 Quick Commands Reference:

```bash
# Deploy
railway up

# Check status
railway status

# View logs
railway logs

# Open dashboard
railway open

# Add environment variable
railway variables set KEY="value"

# Get domain
railway domain

# Link to existing project
railway link
```

---

## ✨ Your Final Architecture:

```
┌─────────────────────────┐
│   Vercel (Frontend)     │
│   demo.html (Static)    │
│   FREE - Global CDN     │
└───────────┬─────────────┘
            │ HTTPS
            ▼
┌─────────────────────────┐
│   Railway (Backend)     │
│   Node.js + Express     │
│   Socket.IO (WebSocket) │
│   $0-5/month            │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Firebase              │
│   Auth + Firestore      │
│   FREE tier             │
└─────────────────────────┘
```

**Total Cost: $0-5/month** (Railway free credit covers it!)

---

## 🎉 After Deployment:

Your app will be live at:
- **Frontend:** https://cloud-document-collaboration-git-main-anandshadows-projects.vercel.app
- **Backend:** https://collabdocs-backend-production.up.railway.app

Real-time collaboration will work perfectly! ✨

---

**Ready to deploy? Run these commands now:**

```bash
cd backend
railway login
railway init
railway up
railway domain
# Copy the domain shown
# Update demo.html with that domain
# Push to GitHub
```

Done! 🚀
