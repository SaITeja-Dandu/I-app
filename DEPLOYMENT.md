# Production Deployment Guide

## Pre-Deployment Checklist

### Security
- [ ] Review Firebase security rules (move from test to production mode)
- [ ] Enable HTTPS only (Firebase handles this automatically)
- [ ] Remove all hardcoded secrets
- [ ] Review environment variable configuration
- [ ] Enable API key restrictions in Google Cloud Console

### Performance
- [ ] Run `npm run build` and verify bundle size
- [ ] Enable gzip compression on hosting
- [ ] Configure CDN cache headers
- [ ] Implement lazy loading for components
- [ ] Set up error tracking (Sentry/LogRocket)

### Reliability
- [ ] Set up monitoring and alerts
- [ ] Configure backup strategy for Firestore
- [ ] Test database recovery procedures
- [ ] Implement health checks
- [ ] Set up automated testing in CI/CD

### Compliance
- [ ] Review data privacy (GDPR/CCPA)
- [ ] Implement cookie consent if needed
- [ ] Add terms of service
- [ ] Document data retention policies
- [ ] Set up audit logging

## Firebase Firestore Security Rules

Update these rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/users/{userId} {
      // Only authenticated users can read/write their own profile
      match /profile/settings {
        allow read, write: if request.auth.uid == userId && request.auth != null;
      }
      // Only authenticated users can read/write their own interviews
      match /interviews/{document=**} {
        allow read, write: if request.auth.uid == userId && request.auth != null;
        
        // Validate interview data structure
        allow create: if request.resource.data.keys().hasAll(['role', 'skills', 'date', 'score', 'status']) &&
                       request.resource.data.score >= 0 && request.resource.data.score <= 5;
      }
    }
  }
}
```

## Environment Variables for Production

```bash
# Firebase (get from Firebase Console)
VITE_FIREBASE_API_KEY=your_production_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123def456

# Gemini API (from Google AI Studio)
VITE_GEMINI_API_KEY=your_production_gemini_key

# App Configuration
VITE_APP_ID=interview-navigator-prod
NODE_ENV=production
```

## Deployment Platforms

### Netlify
```bash
# Connect GitHub repo, set build command and publish directory
Build command: npm run build
Publish directory: dist

# Set environment variables in Netlify dashboard
```

### Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

### Firebase Hosting
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Deploy
npm run build
firebase deploy

# Configure hosting in firebase.json
```

## Monitoring & Observability

### Error Tracking Setup
```javascript
// Add to main.tsx for production
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
  tracesSampleRate: 0.1,
});
```

### Analytics Setup
```javascript
// Add Google Analytics
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
```

## Performance Optimization

### Build Analysis
```bash
# Analyze bundle size
npm run build -- --analyze

# Optimize large dependencies
npm install webpack-bundle-analyzer --save-dev
```

### Image Optimization
- Use WebP format where possible
- Implement lazy loading
- Compress all assets

## Scaling Considerations

### Firestore
- Current setup handles ~1000 concurrent users
- For larger scale, consider sharding
- Monitor Firestore read/write metrics

### Gemini API
- Current rate limit: Default quotas
- Request caching to reduce API calls
- Implement queue system for peak loads

### Frontend
- Consider implementing service workers for offline support
- Implement request debouncing
- Cache API responses with React Query

## CI/CD Pipeline

Example GitHub Actions workflow:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
      - name: Deploy
        run: npm run deploy
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          VITE_GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
```

## Post-Deployment

- [ ] Monitor error logs for first 24 hours
- [ ] Check performance metrics
- [ ] Verify all features work in production
- [ ] Get feedback from early users
- [ ] Plan for scaling if needed

## Support & Maintenance

- Weekly: Monitor error rates and user feedback
- Monthly: Review performance metrics
- Quarterly: Security audit and dependency updates
- Annually: Full infrastructure review

For questions or issues, check the main README.md or GitHub Issues.
