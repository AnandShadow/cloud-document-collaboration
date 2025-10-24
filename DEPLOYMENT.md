# Deployment Guide

This guide covers deploying the CollabDocs platform to production environments.

## 🚀 Deployment Options

### Frontend Deployment

#### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Build the frontend**
   ```bash
   cd frontend
   npm run build
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Configure Environment Variables**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all `REACT_APP_*` variables from `.env`

#### Option 2: Netlify

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build and Deploy**
   ```bash
   cd frontend
   npm run build
   netlify deploy --prod --dir=build
   ```

3. **Environment Variables**
   - Add in Netlify Dashboard → Site Settings → Build & Deploy → Environment

#### Option 3: Firebase Hosting

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Initialize Firebase Hosting**
   ```bash
   cd frontend
   firebase init hosting
   ```

3. **Build and Deploy**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

---

### Backend Deployment

#### Option 1: Heroku

1. **Create Heroku App**
   ```bash
   heroku create collabdocs-api
   ```

2. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set PORT=5000
   heroku config:set FIREBASE_DATABASE_URL=your_url
   heroku config:set GCS_BUCKET_NAME=your_bucket
   # ... add all other variables
   ```

3. **Add Service Account Key**
   ```bash
   # Upload serviceAccountKey.json as base64
   cat serviceAccountKey.json | base64 > serviceAccountKey.b64
   heroku config:set SERVICE_ACCOUNT_KEY=$(cat serviceAccountKey.b64)
   ```

4. **Create Procfile**
   ```
   web: node backend/server.js
   ```

5. **Deploy**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

#### Option 2: Railway

1. **Connect GitHub Repository**
   - Go to [Railway](https://railway.app)
   - Click "New Project" → "Deploy from GitHub"
   - Select your repository

2. **Configure**
   - Set root directory to `backend`
   - Add environment variables in settings
   - Deploy automatically on push

#### Option 3: Google Cloud Run

1. **Create Dockerfile** (backend/)
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   
   EXPOSE 5000
   
   CMD ["node", "server.js"]
   ```

2. **Build and Deploy**
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/collabdocs-api
   gcloud run deploy collabdocs-api \
     --image gcr.io/PROJECT_ID/collabdocs-api \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

---

### AI Service Deployment

#### Option 1: Google Cloud Run

1. **Create Dockerfile** (ai-service/)
   ```dockerfile
   FROM python:3.9-slim
   
   WORKDIR /app
   
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   RUN python -m spacy download en_core_web_sm
   
   COPY . .
   
   EXPOSE 5001
   
   CMD ["gunicorn", "--bind", "0.0.0.0:5001", "--workers", "2", "app:app"]
   ```

2. **Deploy**
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/collabdocs-ai
   gcloud run deploy collabdocs-ai \
     --image gcr.io/PROJECT_ID/collabdocs-ai \
     --platform managed \
     --region us-central1 \
     --memory 2Gi \
     --allow-unauthenticated
   ```

#### Option 2: AWS Lambda (with Zappa)

1. **Install Zappa**
   ```bash
   pip install zappa
   ```

2. **Initialize Zappa**
   ```bash
   zappa init
   ```

3. **Deploy**
   ```bash
   zappa deploy production
   ```

#### Option 3: Heroku

1. **Create Procfile** (ai-service/)
   ```
   web: gunicorn app:app
   ```

2. **Deploy**
   ```bash
   git subtree push --prefix ai-service heroku-ai main
   ```

---

## 🔧 Production Configuration

### Environment Variables Checklist

#### Frontend (.env.production)
```env
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
REACT_APP_FIREBASE_DATABASE_URL=
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_AI_SERVICE_URL=https://ai.yourdomain.com
```

#### Backend
```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://yourdomain.com
FIREBASE_DATABASE_URL=
GCS_BUCKET_NAME=
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### AI Service
```env
AI_SERVICE_PORT=5001
FLASK_ENV=production
```

---

## 🔒 Security Checklist

- [ ] Enable HTTPS on all services
- [ ] Set secure CORS origins
- [ ] Enable rate limiting
- [ ] Use environment variables for secrets
- [ ] Enable Firebase security rules
- [ ] Configure proper IAM roles
- [ ] Enable Cloud Storage bucket policies
- [ ] Set up monitoring and alerts
- [ ] Enable DDoS protection
- [ ] Implement input validation
- [ ] Use helmet.js for security headers
- [ ] Enable CSRF protection

---

## 📊 Monitoring & Logging

### Google Cloud Monitoring

```bash
# Enable Cloud Monitoring
gcloud services enable monitoring.googleapis.com

# View logs
gcloud logging read "resource.type=cloud_run_revision"
```

### Application Monitoring

1. **Set up Error Tracking**
   - Use Sentry or similar service
   - Add to frontend and backend

2. **Performance Monitoring**
   - Enable Firebase Performance Monitoring
   - Use Google Analytics

3. **Uptime Monitoring**
   - Set up health check endpoints
   - Use UptimeRobot or similar

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./frontend

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
          heroku_app_name: "collabdocs-api"
          heroku_email: ${{ secrets.HEROKU_EMAIL }}

  deploy-ai:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Google Cloud Run
        uses: google-github-actions/deploy-cloudrun@v0
        with:
          service: collabdocs-ai
          image: gcr.io/${{ secrets.GCP_PROJECT_ID }}/collabdocs-ai
```

---

## 🧪 Pre-Deployment Testing

```bash
# Run all tests
npm test

# Check build
cd frontend && npm run build
cd ../backend && npm start

# Load testing
npm install -g artillery
artillery quick --count 10 --num 100 http://localhost:5000/health
```

---

## 📝 Post-Deployment Checklist

- [ ] Verify all services are running
- [ ] Test user registration and login
- [ ] Create a test document
- [ ] Test real-time collaboration
- [ ] Verify AI features work
- [ ] Test version control
- [ ] Check mobile responsiveness
- [ ] Verify email notifications (if implemented)
- [ ] Test file uploads
- [ ] Check performance metrics
- [ ] Set up backup strategy
- [ ] Document rollback procedures

---

## 🔙 Rollback Procedures

### Vercel
```bash
vercel rollback <deployment-url>
```

### Heroku
```bash
heroku releases:rollback v123
```

### Google Cloud Run
```bash
gcloud run services update-traffic collabdocs-api \
  --to-revisions=<previous-revision>=100
```

---

## 💾 Backup Strategy

### Database Backup (Firestore)
```bash
gcloud firestore export gs://backup-bucket/$(date +%Y%m%d)
```

### Automated Backups
- Enable daily Firestore exports
- Set up Cloud Storage versioning
- Implement backup monitoring

---

## 🌐 Custom Domain Setup

1. **Configure DNS**
   - Point A record to your server IP
   - Add CNAME for subdomains

2. **SSL Certificate**
   - Use Let's Encrypt
   - Or use platform-provided SSL

3. **Update Environment Variables**
   - Update CORS settings
   - Update Firebase authorized domains

---

## 📞 Support & Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check FRONTEND_URL in backend .env
   - Verify Firebase authorized domains

2. **Authentication Fails**
   - Verify Firebase configuration
   - Check service account key

3. **AI Service Unavailable**
   - Increase memory allocation
   - Check Python dependencies

4. **Slow Performance**
   - Enable CDN
   - Optimize database queries
   - Implement caching

---

## 📈 Scaling Considerations

- Use Redis for session management
- Implement database connection pooling
- Enable auto-scaling on cloud platforms
- Use CDN for static assets
- Implement caching strategies
- Consider database sharding for large scale

---

**Deployment Complete! 🎉**
