# 📋 Vercel Deployment Checklist

## Pre-Deployment (Local)

- [ ] All TypeScript errors resolved: `npm run build` works
- [ ] No console errors in dev: `npm run dev`
- [ ] Backend can start: `npm run dev:api` works
- [ ] Frontend API calls work with backend
- [ ] Firebase credentials are correct
- [ ] All environment variables documented in `.env.example`

## GitHub Preparation

- [ ] Code committed: `git add . && git commit -m "Ready for Vercel"`
- [ ] Pushed to main branch: `git push origin main`
- [ ] No uncommitted changes: `git status` is clean

## Vercel Dashboard Setup

- [ ] Project imported from GitHub
- [ ] Build settings configured:
  - Build Command: `npm run build && cd backend && npm install && npm run build`
  - Install Command: `npm install && cd backend && npm install`
  - Output Directory: `dist`
  - Node Version: 20.x LTS

## Environment Variables in Vercel

### Production Environment
- [ ] `VITE_FIREBASE_API_KEY`
- [ ] `VITE_FIREBASE_AUTH_DOMAIN`
- [ ] `VITE_FIREBASE_PROJECT_ID`
- [ ] `VITE_FIREBASE_STORAGE_BUCKET`
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `VITE_FIREBASE_APP_ID`
- [ ] `VITE_APP_ID`
- [ ] `VITE_BACKEND_URL=https://your-app.vercel.app/api`
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` (if using payments)
- [ ] `FIREBASE_ADMIN_SDK_KEY` (base64 encoded)
- [ ] `STRIPE_SECRET_KEY` (if using payments)
- [ ] `ALLOWED_ORIGINS=https://your-app.vercel.app`

## Post-Deployment Tests

- [ ] Visit deployed URL: `https://your-app.vercel.app`
- [ ] Firebase authentication works (signup/login)
- [ ] Can create profile and save to Firestore
- [ ] Can navigate between screens
- [ ] API calls reach backend (check Network tab)
- [ ] No CORS errors in console
- [ ] No Firebase configuration errors
- [ ] Responsive design works on mobile

## Monitoring

- [ ] Vercel Analytics enabled
- [ ] Error tracking setup (optional: Sentry)
- [ ] Regularly check Vercel function logs
- [ ] Monitor Firestore usage in Firebase Console

## Custom Domain (Optional)

- [ ] Domain added to Vercel
- [ ] DNS configured
- [ ] SSL certificate auto-issued
- [ ] Update Firebase OAuth redirect URLs with new domain

## Rollback Plan

- [ ] Know how to rollback: `vercel rollback`
- [ ] Keep previous deployment URL for testing
- [ ] Update database rules if needed

## Continuous Deployment

- [ ] GitHub Actions (if configured)
- [ ] Auto-deploy on push to main
- [ ] Manual deploy option in Vercel dashboard

---

## Quick Deployment Commands

```bash
# Option 1: Via Vercel CLI
vercel --prod

# Option 2: Via GitHub (automatic after push)
git push origin main

# Option 3: Manual deployment via Vercel Dashboard
# 1. Go to vercel.com
# 2. Select project
# 3. Click "Redeploy"
```

## Troubleshooting Command

```bash
# View deployment logs
vercel logs <deployment-url> --follow

# View function logs
vercel logs <deployment-url> --follow --type=function
```

## Success Indicators ✅

- [ ] Vercel shows "Ready" status
- [ ] No build errors
- [ ] Website loads without errors
- [ ] Firestore/Firebase operations work
- [ ] Backend API responding to requests
- [ ] All features tested and working
