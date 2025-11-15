# Getting Started - Interview Navigator

Welcome to the Interview Navigator! This guide will help you set up and run the application locally.

## ✅ What's Included

This is a **production-ready** application with:

- **Frontend**: React 18 with TypeScript (strict mode)
- **Styling**: TailwindCSS v4 with dark mode support
- **Backend**: Firebase (Auth + Firestore)
- **AI**: Google Gemini API for question generation and evaluation
- **State Management**: React Hooks + Context API
- **Testing**: Vitest + React Testing Library setup
- **Code Quality**: ESLint, Prettier, TypeScript compiler
- **Logging**: Structured logging with Pino
- **Error Handling**: Error boundaries + centralized error management
- **Validation**: Zod schemas for API responses
- **Retry Logic**: Exponential backoff for rate limits

## 📋 Prerequisites

- Node.js 18.0 or higher
- npm 9.0 or higher
- A Firebase project (free tier works great)
- A Google Gemini API key

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
cd e:\I-app
npm install
```

### 2. Create Environment File
```bash
cp .env.example .env.local
```

### 3. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (or use existing)
3. Enable:
   - **Authentication** → Select "Anonymous"
   - **Firestore Database** → Start in "Test Mode"
4. Copy your config to `.env.local`:

```env
VITE_FIREBASE_API_KEY=abc123...
VITE_FIREBASE_AUTH_DOMAIN=yourproject.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=yourproject
VITE_FIREBASE_STORAGE_BUCKET=yourproject.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:xyz
```

### 4. Configure Gemini API

1. Go to [Google AI Studio](https://aistudio.google.com)
2. Click "Create API Key"
3. Copy to `.env.local`:

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

### 5. Start Development Server
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📁 Project Structure

```
e:\I-app/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Alert.tsx       # Toast notifications
│   │   ├── Button.tsx      # Reusable button
│   │   ├── LoadingSpinner.tsx
│   │   └── ErrorBoundary.tsx
│   │
│   ├── pages/              # Screen components
│   │   ├── SetupScreen.tsx     # Profile setup
│   │   ├── LobbyScreen.tsx     # Home page
│   │   ├── InterviewScreen.tsx # Interview
│   │   └── FeedbackModal.tsx   # Results
│   │
│   ├── services/           # API & Database
│   │   ├── firebase.ts     # Firebase init
│   │   ├── firestore.ts    # Database ops
│   │   └── gemini-api.ts   # AI integration
│   │
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts      # Authentication
│   │   └── useInterview.ts # Interview state
│   │
│   ├── types/              # TypeScript interfaces
│   │   └── index.ts
│   │
│   ├── utils/              # Helper utilities
│   │   ├── logger.ts       # Pino logging
│   │   ├── retry.ts        # Exponential backoff
│   │   ├── validation.ts   # Zod schemas
│   │   ├── error-handler.ts
│   │   └── constants.ts
│   │
│   ├── App.tsx             # Main component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
│
├── .env.example            # Environment template
├── .env.local              # Your secrets (git ignored)
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript config
├── tailwind.config.ts      # Tailwind configuration
├── eslint.config.js        # Linting rules
├── README.md               # Project overview
└── DEPLOYMENT.md           # Production guide
```

## 🎯 Usage Guide

### Setting Up Your Profile

1. On first load, enter your:
   - **Target Role** - e.g., "Senior React Developer"
   - **Key Skills** - e.g., "React, TypeScript, Node.js"
   - **Email** (optional)

2. Click "Save Profile & Continue"

### Starting an Interview

1. From the Lobby screen, click "Start New Interview"
2. You'll get 5 AI-generated questions
3. Each question is either:
   - 💡 **Conceptual** - Theoretical knowledge
   - 💻 **Coding** - Implementation-focused

### Answering Questions

1. Read the question carefully
2. Type your detailed answer in the text area
3. Click "Submit Answer"
4. The AI will:
   - Score your answer (1-5)
   - Provide feedback
   - Give improvement suggestions

### Viewing History

- All your interviews are saved automatically
- See scores, dates, and key metrics
- Track your progress over time

## 🛠️ Available Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Interactive test UI
npm run test:ui

# Test coverage report
npm run test:coverage

# Check code quality
npm run lint

# Fix linting issues
npm run lint -- --fix
```

## 🧪 Running Tests

```bash
# Run all tests
npm run test

# Watch mode
npm run test -- --watch

# UI mode (visual dashboard)
npm run test:ui

# Coverage report
npm run test:coverage
```

## 📊 Monitoring Development

### TypeScript Compilation
```bash
# Check for type errors
npx tsc --noEmit
```

### Bundle Size
```bash
# Analyze what's in the bundle
npm run build -- --analyze
```

### Performance
The dev server includes hot module replacement (HMR) for instant feedback.

## 🐛 Troubleshooting

### "Firebase configuration is missing"
**Solution**: Check your `.env.local` file has all Firebase variables set correctly.

```bash
# Verify environment is loaded
npm run dev -- --debug
```

### "Gemini API rate limited"
**Solution**: The app has built-in retry logic with exponential backoff. It will:
- Wait 1-2 seconds for first retry
- Double the wait time each time
- Max out at 30 seconds

### "Port 5173 is already in use"
**Solution**: 
```bash
# Use a different port
npm run dev -- --port 3000
```

### "Module not found errors"
**Solution**: Reinstall dependencies
```bash
rm -r node_modules package-lock.json
npm install
```

### "TypeScript errors"
**Solution**: The project uses strict TypeScript. Errors must be fixed before building:
```bash
npx tsc --noEmit
```

## 💡 Development Tips

### Hot Reload
Changes to any file instantly reload in the browser (except env variables).

### Browser DevTools
- React DevTools extension recommended
- Check Network tab for API calls
- Use Console for debugging

### Logging
All API calls and errors are logged to console with structured format:
```javascript
logger.info({ userId, sessionId }, 'Interview started');
logger.error({ error }, 'API call failed');
```

## 🔒 Security Notes

- **Never commit `.env.local`** - It contains API keys
- API keys are restricted to domain in Google Cloud Console
- Firebase rules prevent unauthorized database access
- All validation happens server-side for real deployments

## 🎨 Customization

### Change App Colors
Edit `tailwind.config.ts`:
```javascript
theme: {
  extend: {
    colors: {
      primary: '#your-color',
    }
  }
}
```

### Add New Question Types
Edit `src/services/gemini-api.ts` and add prompts.

### Modify Interview Length
In `src/utils/constants.ts`:
```typescript
export const INTERVIEW_LENGTH = 10; // Was 5
```

## 📚 Learn More

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Gemini API Docs](https://ai.google.dev)
- [TailwindCSS](https://tailwindcss.com)
- [Vite Guide](https://vitejs.dev/guide)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run `npm run lint && npm run test`
4. Submit a pull request

## 📞 Support

- Check README.md for overview
- See DEPLOYMENT.md for production setup
- Review error messages in browser console
- Check service logs in Firebase Console

## ✨ Next Steps

1. ✅ Complete setup
2. 🎯 Try an interview
3. 📊 Review your results
4. 🚀 Deploy to production (see DEPLOYMENT.md)

---

**Congratulations! You're ready to start using Interview Navigator!** 🎉

Need help? Check the logs or review the documentation files.
