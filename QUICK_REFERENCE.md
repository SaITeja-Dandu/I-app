# ⚡ Intervuu - Quick Reference Guide

## 🎯 What This App Does

**Intervuu** is an interview prep + hiring marketplace where:
- **Candidates** practice mock interviews with AI or book sessions with real interviewers
- **Interviewers** earn money by conducting paid interviews + evaluating candidates
- **Everyone** tracks progress, leaves reviews, and manages schedules

---

## 🚀 Quick Start (Copy-Paste)

```bash
# 1. Install dependencies
npm install

# 2. Create .env file (ask for values)
cp .env.example .env.local

# 3. Fill in these 4 things in .env.local:
# - VITE_FIREBASE_API_KEY
# - VITE_FIREBASE_PROJECT_ID
# - VITE_FIREBASE_AUTH_DOMAIN
# - VITE_GEMINI_API_KEY

# 4. Start development
npm run dev

# Opens http://localhost:5173
```

---

## 🗂️ File Structure - The 80/20 Version

```
src/
├── App.tsx                    ← MAIN ROUTER (all navigation logic)
├── pages/                     ← Full-page screens (what users see)
│   ├── SetupScreen.tsx       (profile creation)
│   ├── LobbyScreen.tsx       (home dashboard)
│   ├── BookInterviewScreen.tsx  (schedule live)
│   └── SpeechInterviewScreen.tsx (the interview)
├── components/                ← Reusable buttons, cards, etc.
├── hooks/                     ← useAuth, useInterview
├── services/                  ← Database, AI, payments, etc.
│   ├── firebase.ts          (setup)
│   ├── firestore.ts         (database CRUD)
│   └── gemini-api.ts        (AI questions)
├── types/index.ts             ← All TypeScript interfaces
└── utils/                     ← Helpers, logging, errors
```

---

## 🔑 Three Critical Files

### 1. **src/App.tsx** (The Router)
- Controls what screen shows
- Initializes all services
- Manages global alert system
- Handles logout + screen transitions

**Key State**:
```typescript
screen: 'landing' | 'auth' | 'lobby' | 'interview' | ...
userProfile: UserProfile | null
currentSession: InterviewSession | null
```

### 2. **src/types/index.ts** (All Data Models)
- `UserProfile` - User info + role
- `InterviewSession` - Questions + scores
- `InterviewBooking` - Scheduled interviews
- `InterviewQuestion` - Q&A data

### 3. **src/hooks/useInterview.ts** (Interview Logic)
- `startInterview()` - Begin session
- `submitAnswer()` - Evaluate with AI
- `nextQuestion()` - Get next Q
- `finishInterview()` - Save results

---

## 📱 Main Screens (User Journeys)

### **Candidate Journey**
```
Landing Page
    ↓ (click Get Started)
Auth Screen (login)
    ↓
Setup Screen (enter role/skills)
    ↓
Lobby Screen (home)
    ├─ "Start Interview" → SpeechInterviewScreen → FeedbackModal
    ├─ "Book Interview" → BookInterviewScreen (schedule)
    ├─ "History" → InterviewHistoryScreen
    └─ "Saved" → SavedInterviewersScreen
```

### **Interviewer Journey**
```
Auth Screen
    ↓
Select "Interviewer"
    ↓
InterviewerSetupScreen (bio, rate, availability)
    ↓
InterviewerDashboard (home)
    ├─ View bookings
    ├─ Manage availability
    ├─ View earnings
    ├─ View analytics
    └─ Video calls when scheduled
```

---

## 🧠 Interview Execution (Core Flow)

```
User clicks "Start Interview"
    ↓ useInterview.startInterview()
Creates session, saves to Firestore
    ↓
Shows: "Introduce yourself..."
    ↓
User types answer, clicks "Submit"
    ↓ useInterview.submitAnswer()
Calls Gemini API (evaluates answer)
    ↓
Gemini returns: score (1-5) + feedback
    ↓
Shows feedback to user
    ↓ useInterview.nextQuestion()
Gemini generates next question
    ↓
Repeat until 5 questions done
    ↓ useInterview.finishInterview()
Calculates average score, saves to Firestore
    ↓
Shows FeedbackModal with results
```

---

## 🔌 Services (What They Do)

| Service | Job |
|---------|-----|
| **firebase.ts** | Init Firebase Auth + Firestore |
| **firestore.ts** | Read/write database (users, interviews, etc) |
| **gemini-api.ts** | Generate questions + evaluate answers |
| **booking.ts** | Create/manage interview bookings |
| **payment.ts** | Process Stripe payments |
| **messaging.ts** | Send/receive messages |
| **availability.ts** | Manage interviewer schedules |
| **rating.ts** | Save reviews + ratings |
| **analytics.ts** | Track performance stats |
| **video-conferencing.ts** | Setup video calls |
| **notifications.ts** | Send notifications |
| **reminder-scheduler.ts** | Automated reminders |

---

## 💾 Database (Firestore Collections)

```
firestore/
├── users/{uid}
│   └── profile data, role, email, resume
├── interviews/{sessionId}
│   └── questions, answers, scores, feedback
├── bookings/{bookingId}
│   └── candidate, interviewer, time, status, payment
├── messages/{conversationId}/messages/{msgId}
│   └── sender, text, timestamp
├── ratings/{ratingId}
│   └── score, review, bookingId
├── notifications/{userId}/{notificationId}
│   └── type, message, read status
└── availability/{interviewerId}/slots/{slotId}
    └── dayOfWeek, startTime, endTime, timezone
```

---

## 🎨 Key Components

### **Layout Components**
- `Card.tsx` - Container box
- `Button.tsx` - Clickable button
- `Input.tsx` - Text field
- `Alert.tsx` - Toast notification

### **Interview Components**
- `SpeechInterviewScreen.tsx` - Interview interface
- `FeedbackModal.tsx` - Results display
- `LoadingSpinner.tsx` - Loading indicator

### **Feature Components**
- `FileUploader.tsx` - Resume upload
- `MessageThread.tsx` - Chat UI
- `NotificationBell.tsx` - Alerts
- `PaymentCheckout.tsx` - Stripe form

---

## 🛠️ Common Tasks

### **Add New Page**
1. Create `src/pages/NewScreen.tsx`
2. Export component
3. Add to `App.tsx` lazy imports
4. Add screen type to `type AppScreen`
5. Add case in `renderContent()`

### **Call Firestore**
```typescript
import { getFirestoreService } from '../services/firestore';

const fs = getFirestoreService();
const data = await fs.getUserProfile(userId);
await fs.saveUserProfile(userId, data);
```

### **Call Gemini API**
```typescript
import { geminiApiService } from '../services/gemini-api';

const question = await geminiApiService.generateQuestion(
  role, skills, [], 0, 5
);
const evaluation = await geminiApiService.evaluateAnswer(
  question.question, userAnswer, role
);
```

### **Show Alert**
```typescript
showAlert({
  message: 'Success!',
  type: 'success'
  // or 'error' | 'warning' | 'info'
});
```

### **Navigate to Screen**
```typescript
setScreen('lobby');
// or any screen type from AppScreen
```

---

## 🔐 Authentication

**Current**: Anonymous login (no email required)
- User signs in → Firebase creates UID
- UID used as Firestore document ID
- Profile stored at `users/{uid}`

**Feature**: Email/password coming (see `api/auth/`)

---

## 💰 Payment Flow

1. Candidate books interview (booking created)
2. Candidate pays via Stripe checkout
3. Payment processed → Booking confirmed
4. Interviewer earnings calculated
5. After interview → Withdraw earnings

---

## 📊 Key Metrics

### **For Candidates**
- Interview score (average 1-5)
- Number of interviews taken
- Performance trends
- Favorite interviewers

### **For Interviewers**
- Total earnings
- Number of interviews done
- Average rating
- Acceptance rate

---

## ⚠️ Common Issues

### "Firebase not initialized"
**Fix**: Check `.env.local` has all VITE_ variables

### "Gemini rate limited"
**Fix**: Auto-retry with exponential backoff (built-in)

### "Port 5173 in use"
**Fix**: `npm run dev -- --port 3000`

### "Module not found"
**Fix**: `rm -rf node_modules && npm install`

---

## 🚀 Deploy

### **Frontend** (Vercel)
```bash
npm run build
# Deploy dist/ folder
```

### **Backend** (api/)
```bash
# Vercel auto-deploys api/ as serverless functions
# Set env vars in Vercel dashboard
```

### **Database**
- Firestore auto-deployed
- Rules in `firestore.rules`

---

## 📚 External APIs

### **Gemini 2.5 Flash**
- Generate interview questions
- Evaluate answers
- Score 1-5 + feedback

### **Firebase Auth + Firestore**
- User authentication
- Real-time database
- Cloud storage

### **Stripe**
- Payment processing
- Payout to interviewers

### **Daily.co** (Optional)
- Video conferencing
- Recording
- Meeting links

---

## 🎯 Architecture Decision

This app uses a **service + hook + component** pattern:

```
User clicks button (Component)
  ↓
Calls hook (useInterview, useAuth)
  ↓
Hook calls service (firestore, gemini)
  ↓
Service makes API call
  ↓
Result updates state
  ↓
Component re-renders
```

This keeps logic separated + testable.

---

## 📖 More Help

- `README.md` - Project overview
- `GETTING_STARTED.md` - Setup guide
- `SECURITY_RULES.md` - Firestore rules
- `PROJECT_UNDERSTANDING.md` - Deep dive
- `src/types/index.ts` - All types

---

**Happy coding! 🚀**
