# 🚀 Vercel Deployment Guide - Intervuu

## Deployment Steps

### Step 1: Prepare Environment Variables

Create a `.env.production` file in your project root with:

```env
# Firebase
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_APP_ID=your_app_id

# Backend (for development)
BACKEND_URL=https://your-app.vercel.app/api

# Stripe (if using payments)
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key

# Backend Firebase Admin
FIREBASE_ADMIN_SDK_KEY=your_firebase_admin_sdk_json_base64_encoded
```

### Step 2: Add Vercel Config

The `vercel.json` file is already created in the root directory.

### Step 3: Update Vite Config for Production

The vite.config.ts needs an update for production API calls:

```typescript
// In vite.config.ts
server: {
  proxy: {
    '/api': {
      target: process.env.NODE_ENV === 'production' 
        ? 'https://your-app.vercel.app'
        : 'http://localhost:3001',
      changeOrigin: true,
      secure: false,
    },
  },
}
```

### Step 4: Deploy to Vercel

#### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (from project root)
vercel --prod
```

#### Option B: GitHub Integration (Easiest)

1. Push code to GitHub:
   ```bash
   git add .
   git commit -m "Add Vercel configuration and API handlers"
   git push origin main
   ```

2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. In "Environment Variables" section, add:
   - All Firebase variables
   - Stripe keys
   - Firebase Admin SDK
6. Click "Deploy"

### Step 5: Configure Vercel Project Settings

In Vercel Dashboard:

1. **Settings → Build & Development Settings**
   - Build Command: `npm run build && cd backend && npm install && npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install && cd backend && npm install`

2. **Settings → Environment Variables**
   - Add all `.env` variables (select "Production" for prod deploy)

3. **Settings → Functions**
   - Memory: 1024 MB (for heavy Firebase operations)
   - Timeout: 60 seconds

4. **Settings → Domains**
   - Add your custom domain if needed

### Step 6: Update Frontend API Calls

In your React app, update API calls to use the production URL:

```typescript
// In your services/api calls
const API_BASE = process.env.VITE_BACKEND_URL || '/api';

// Example:
const response = await fetch(`${API_BASE}/auth/login`, {
  method: 'POST',
  body: JSON.stringify(data),
});
```

### Step 7: Update Firebase Security Rules

In Firebase Console:
1. Go to **Cloud Firestore → Rules**
2. Update rules to allow requests from your Vercel domain:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Step 8: Configure CORS for Firebase Storage

In your Firebase project, configure CORS for your Vercel domain.

Create a `cors.json` file and run:

```bash
gsutil cors set cors.json gs://your-firebase-storage-bucket
```

### Step 9: Monitor Deployment

Check Vercel Dashboard for:
- ✅ Build logs
- ✅ Function logs
- ✅ Error tracking

View logs:
```bash
vercel logs <deployment-url>
```

### Step 10: Test in Production

1. Visit: `https://your-app.vercel.app`
2. Test login/signup
3. Test API calls in browser DevTools Console
4. Check Vercel function logs for errors

## Troubleshooting

### Issue: "API calls not reaching backend"
**Solution**: Ensure `VITE_BACKEND_URL` is set correctly in Vercel env vars

### Issue: "Firebase auth failing"
**Solution**: Check Firebase security rules and CORS settings

### Issue: "Build failing"
**Solution**: Check build logs in Vercel Dashboard
```bash
vercel logs <url> --follow
```

### Issue: "Functions timeout"
**Solution**: Increase timeout in Vercel settings (up to 60 seconds on Pro plan)

## Development vs Production

### Local Development
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
npm run dev:api
```

### Production (Vercel)
- Frontend: Automatically served by Vercel
- Backend: Runs as Vercel Functions (serverless)

## Environment Variables Checklist

- [ ] `VITE_FIREBASE_*` variables set in Vercel
- [ ] `VITE_BACKEND_URL` points to your Vercel domain
- [ ] Firebase Admin SDK key base64 encoded
- [ ] Stripe keys configured (if using payments)
- [ ] CORS origins updated in backend
- [ ] Firebase CORS configured for storage bucket

## Post-Deployment

1. **Monitor Analytics**: Check Vercel Analytics dashboard
2. **Set up Error Tracking**: Use Sentry or similar
3. **Enable Edge Caching**: Configure Vercel caching headers
4. **Set up CI/CD**: Automatic deployments on push

## Rollback

If something breaks:
```bash
vercel rollback
```

Or select a previous deployment in Vercel Dashboard

---

**Need Help?**
- Vercel Docs: https://vercel.com/docs
- Firebase Docs: https://firebase.google.com/docs
- Check Vercel logs: `vercel logs <url> --follow`
