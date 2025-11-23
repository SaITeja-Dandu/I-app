# 📚 Intervuu - Complete Project Understanding

## 🎯 Project Overview

**Intervuu** is a comprehensive **interview preparation and hiring platform** that connects job seekers with expert interview coaches and recruiters. It's built as a marketplace where users can practice mock interviews, apply to real jobs, and receive professional feedback.

### Core Purpose
- **For Candidates**: Practice mock interviews with AI evaluation, book sessions with expert interviewers, and track interview performance
- **For Interviewers**: Flexible scheduling, earnings tracking, and performance analytics
- **For Recruiters**: AI-powered talent discovery and application management

---

## 🏗️ Architecture Overview

### Tech Stack

#### **Frontend**
- **Framework**: React 19.2 + TypeScript (strict mode)
- **Styling**: TailwindCSS v4 with PostCSS
- **Build Tool**: Vite (ultra-fast bundling)
- **State**: React Hooks + Context API
- **HTTP Client**: Axios with retry logic
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Form Validation**: Zod schemas
- **Logging**: Pino (structured logging)
- **Testing**: Vitest + React Testing Library + Jest

#### **Backend**
- **Runtime**: Node.js + Express.js
- **Database**: Firebase Firestore (real-time)
- **Authentication**: Firebase Auth (anonymous + custom tokens)
- **AI Engine**: Google Gemini 2.5 Flash API
- **Payments**: Stripe integration
- **Hosting**: Vercel (serverless functions)
- **Video Conferencing**: Daily.co / Zoom integration ready

#### **Infrastructure**
- **Database**: Firestore (NoSQL, real-time updates)
- **Cloud Storage**: Firebase Storage (PDFs, resumes, videos)
- **Security**: Firebase Security Rules
- **Logging**: Pino + structured JSON logs
- **Rate Limiting**: Express rate limiter
- **Error Handling**: Centralized error management with Sentry readiness

---

## 📁 Project Structure

```
e:\I-app/
│
├── 📄 Root Configuration Files
│   ├── package.json                 # Frontend dependencies + scripts
│   ├── vite.config.ts              # Vite build configuration
│   ├── tsconfig.json               # TypeScript base config
│   ├── tsconfig.app.json           # App-specific TypeScript
│   ├── tsconfig.test.json          # Test TypeScript settings
│   ├── tailwind.config.ts          # TailwindCSS theming
│   ├── eslint.config.js            # Code linting rules
│   ├── jest.config.js              # Jest test configuration
│   ├── postcss.config.cjs          # PostCSS processing
│   └── .env.example                # Environment variables template
│
├── 🌐 Firebase Configuration
│   ├── firebase.json               # Firebase hosting config
│   ├── firestore.indexes.json      # Database indexes
│   ├── firestore.rules             # Security rules for Firestore
│   ├── storage.rules               # Security rules for Cloud Storage
│   ├── SECURITY_RULES.md           # Documentation of security
│   └── BRAND_GUIDELINES.md         # Design guidelines
│
├── 🔧 Backend (Node.js + Express)
│   └── backend/
│       ├── package.json            # Backend dependencies
│       ├── tsconfig.json           # Backend TypeScript config
│       ├── src/
│       │   ├── server.ts           # Main Express server
│       │   ├── config/
│       │   │   ├── firebase.ts     # Firebase Admin SDK
│       │   │   └── stripe.ts       # Stripe configuration
│       │   ├── routes/
│       │   │   ├── booking.routes.ts    # Interview booking endpoints
│       │   │   ├── payment.routes.ts    # Payment processing
│       │   │   ├── user.routes.ts       # User management
│       │   │   └── availability.routes.ts  # Availability management
│       │   ├── controllers/        # Request handlers
│       │   ├── middleware/
│       │   │   ├── error-handler.ts     # Centralized error handling
│       │   │   ├── auth.ts              # Authentication middleware
│       │   │   └── request-validator.ts # Request validation
│       │   └── validators/         # Zod validation schemas
│
├── 📱 Frontend (React + TypeScript)
│   ├── src/
│   │   ├── main.tsx                # React entry point
│   │   ├── App.tsx                 # Main application component (complex routing)
│   │   ├── App.css                 # App-level styles
│   │   ├── index.css               # Global styles + animations
│   │   │
│   │   ├── 🧩 components/          # Reusable UI components
│   │   │   ├── Alert.tsx           # Toast notifications
│   │   │   ├── Button.tsx          # Styled button with variants
│   │   │   ├── Input.tsx           # Form input field
│   │   │   ├── Textarea.tsx        # Multi-line text input
│   │   │   ├── Card.tsx            # Container component
│   │   │   ├── Badge.tsx           # Skill/tag badges
│   │   │   ├── Progress.tsx        # Progress bar
│   │   │   ├── LoadingSpinner.tsx  # Loading indicator
│   │   │   ├── Logo.tsx            # Brand logo
│   │   │   ├── ErrorBoundary.tsx   # Error catching wrapper
│   │   │   ├── NotificationBell.tsx # Real-time notifications
│   │   │   ├── FileUploader.tsx    # Resume/file upload
│   │   │   ├── FileList.tsx        # File listing
│   │   │   ├── MessageThread.tsx   # Message conversation
│   │   │   ├── ConversationList.tsx # List of conversations
│   │   │   ├── VideoMeetingInfo.tsx # Meeting details display
│   │   │   ├── FavoriteButton.tsx  # Add to favorites
│   │   │   ├── FavoriteInterviewers.tsx # Saved interviewers
│   │   │   ├── InterviewHistory.tsx # Interview records
│   │   │   ├── InterviewerReviews.tsx # Interviewer ratings
│   │   │   ├── EarningsDashboard.tsx # Revenue tracking
│   │   │   ├── AnalyticsDashboard.tsx # Performance metrics
│   │   │   ├── PaymentCheckout.tsx # Stripe integration
│   │   │   ├── PreferencesSettings.tsx # User settings
│   │   │   └── ...
│   │   │
│   │   ├── 📄 pages/               # Full-page screen components
│   │   │   ├── AuthScreen.tsx            # Login/signup
│   │   │   ├── LandingPage.tsx           # Marketing homepage
│   │   │   ├── WelcomeScreen.tsx         # Onboarding screen
│   │   │   ├── UserTypeScreen.tsx        # Role selection
│   │   │   ├── SetupScreen.tsx           # Profile creation
│   │   │   ├── InterviewerSetupScreen.tsx # Interviewer profile
│   │   │   ├── LobbyScreen.tsx           # Home dashboard
│   │   │   ├── BookInterviewScreen.tsx   # Schedule interview
│   │   │   ├── SpeechInterviewScreen.tsx # Interview execution
│   │   │   ├── FeedbackModal.tsx         # Results & feedback
│   │   │   ├── CandidateDashboardScreen.tsx # Candidate home
│   │   │   ├── InterviewerDashboardScreen.tsx # Interviewer home
│   │   │   ├── InterviewerAvailabilityScreen.tsx # Scheduling
│   │   │   ├── InterviewerEarningsScreen.tsx # Revenue dashboard
│   │   │   ├── InterviewerAnalyticsScreen.tsx # Performance stats
│   │   │   ├── SubmitReviewScreen.tsx    # Leave feedback
│   │   │   ├── SavedInterviewersScreen.tsx # Favorites
│   │   │   ├── InterviewHistoryScreen.tsx # Past sessions
│   │   │   ├── MessagingScreen.tsx       # Direct messaging
│   │   │   ├── SettingsScreen.tsx        # Preferences
│   │   │   ├── FileManagementScreen.tsx  # Upload/manage files
│   │   │   └── ResumeScannerPage.tsx     # AI resume parser
│   │   │
│   │   ├── 🪝 hooks/               # Custom React hooks (encapsulate logic)
│   │   │   ├── useAuth.ts               # Authentication state + logout
│   │   │   ├── useInterview.ts          # Interview session management
│   │   │   └── ... (other custom hooks can be added)
│   │   │
│   │   ├── 🔌 services/            # Core business logic & API calls
│   │   │   ├── firebase.ts              # Firebase/Firestore initialization
│   │   │   ├── firestore.ts            # Database CRUD operations
│   │   │   ├── gemini-api.ts           # AI question generation & evaluation
│   │   │   ├── interview-questions.ts  # Question bank management
│   │   │   ├── interviewer.ts          # Interviewer profile management
│   │   │   ├── booking.ts              # Interview booking logic
│   │   │   ├── availability.ts         # Schedule management
│   │   │   ├── rating.ts               # Review/rating system
│   │   │   ├── messaging.ts            # Chat/messaging
│   │   │   ├── favorites.ts            # Saved interviewers
│   │   │   ├── payment.ts              # Stripe integration
│   │   │   ├── video-conferencing.ts   # Video call setup
│   │   │   ├── notifications.ts        # Push notifications
│   │   │   ├── analytics.ts            # Performance tracking
│   │   │   ├── resume-analyzer.ts      # Resume parsing with Mammoth
│   │   │   ├── speech.ts               # Speech recognition
│   │   │   ├── file-storage.ts         # Cloud file management
│   │   │   ├── preferences.ts          # User preferences
│   │   │   └── reminder-scheduler.ts   # Automated reminders
│   │   │
│   │   ├── 📚 types/               # TypeScript interfaces
│   │   │   └── index.ts                # All type definitions
│   │   │
│   │   ├── 🛠️ utils/               # Helper functions & utilities
│   │   │   ├── logger.ts               # Structured logging with Pino
│   │   │   ├── error-handler.ts        # Error normalization
│   │   │   ├── retry.ts                # Exponential backoff logic
│   │   │   ├── validation.ts           # Zod schema validators
│   │   │   └── constants.ts            # App-wide constants
│   │   │
│   │   └── __tests__/              # Unit & integration tests
│   │       └── (test files)
│   │
│   ├── index.html                  # HTML entry point
│   └── assets/                     # Static images/media
│
├── 🌐 API Routes (Vercel Serverless)
│   └── api/
│       ├── firebaseAdmin.ts        # Firebase Admin initialization
│       └── auth/
│           ├── login.ts            # Email/password login
│           └── signup.ts           # User registration
│
├── 🖥️ Development Scripts
│   ├── scripts/
│   │   ├── start-dev.mjs           # Concurrent dev server launcher
│   │   └── deploy-storage-rules.sh # Firebase deployment
│   │
│   ├── server/
│   │   └── dev-server.mjs          # Local dev API server
│   │
│   ├── deploy-rules.sh             # Linux deployment script
│   └── deploy-rules.bat            # Windows deployment script
│
├── 🧪 Testing
│   ├── tests/
│   │   └── security-rules.test.ts  # Firestore rules tests
│   └── jest.config.js              # Jest configuration
│
├── 📖 Documentation
│   ├── README.md                   # Project overview
│   ├── GETTING_STARTED.md          # Setup instructions
│   ├── SECURITY_RULES.md           # Security documentation
│   └── BRAND_GUIDELINES.md         # Design guidelines
│
└── 🔐 Secrets (NOT in git)
    └── secrets/
        └── service-account.json    # Firebase service account key
```

---

## 🔄 Application Data Flow

### 1. **Authentication Flow**
```
User lands on app
    ↓
Firebase initializes + checks localStorage for token
    ↓
If authenticated → Load user profile from Firestore
If not → Show landing page → Click "Get Started" → Show login screen
    ↓
User signs in anonymously or with email/password
    ↓
Firebase creates user document in Firestore
    ↓
App redirects to profile setup (SetupScreen)
```

### 2. **Interview Flow**
```
User clicks "Start Interview"
    ↓
useInterview hook initializes interview session
    ↓
First question: "Introduce Yourself" (custom)
    ↓
Show SpeechInterviewScreen with question
    ↓
User types/records answer → Click "Submit"
    ↓
Gemini API evaluates answer (scores 1-5, gives feedback)
    ↓
Display feedback to user
    ↓
Next question generated by Gemini API
    ↓
Repeat until 5 questions completed
    ↓
Session saved to Firestore with all scores/feedback
    ↓
Show FeedbackModal with overall performance
```

### 3. **Booking Flow (Live Interviews)**
```
Candidate clicks "Book Interview"
    ↓
See list of available interviewers (filtered by availability)
    ↓
Select interviewer → Choose time slot
    ↓
Create booking in Firestore (status: "pending")
    ↓
Interviewer receives notification
    ↓
Interviewer accepts booking (status: "accepted")
    ↓
Meeting link generated (Daily.co or Zoom)
    ↓
24-hour reminder sent to both parties
    ↓
1-hour reminder sent to both parties
    ↓
Interview starts → Video call opens
    ↓
After interview → Both can leave ratings/reviews
```

### 4. **State Management**
```
useAuth hook
  ├─ userId (string | null)
  ├─ isAuthReady (boolean)
  ├─ error (ApiError | null)
  └─ logout() function

useInterview hook
  ├─ currentSession (InterviewSession | null)
  ├─ isLoading (boolean)
  ├─ error (ApiError | null)
  ├─ startInterview()
  ├─ submitAnswer()
  ├─ nextQuestion()
  ├─ finishInterview()
  └─ abandonInterview()

App component state
  ├─ screen (AppScreen type)
  ├─ userProfile (UserProfile | null)
  ├─ interviewHistory (InterviewSession[])
  ├─ alert (AlertState | null)
  └─ ... (other screen-specific state)
```

---

## 🎯 Key Components Deep Dive

### **App.tsx** (Main Router)
- **Purpose**: Central hub managing all screen navigation
- **Key Features**:
  - Complex routing logic based on auth state + user profile
  - Firebase initialization + all service initialization
  - Global error boundary
  - Header with navigation buttons
  - Alert/notification system
  - Screen types: landing, auth, welcome, setup, lobby, interview, dashboard, etc.

### **useAuth.ts** (Authentication Hook)
- **Purpose**: Manage user authentication state
- **Features**:
  - Subscribe to Firebase auth state changes
  - Expose userId + isAuthReady
  - Logout function
  - Error handling for auth failures

### **useInterview.ts** (Interview Management Hook)
- **Purpose**: Handle entire interview session lifecycle
- **Functions**:
  - `startInterview()`: Initialize session, save to Firestore
  - `submitAnswer()`: Send answer to Gemini for evaluation
  - `nextQuestion()`: Fetch next question from Gemini
  - `finishInterview()`: Calculate final score, save session
  - `abandonInterview()`: Cancel session without saving

### **gemini-api.ts** (AI Service)
- **Purpose**: Communicate with Google Gemini API
- **Key Methods**:
  - `generateQuestion()`: Create interview questions based on role/skills
  - `evaluateAnswer()`: Score and feedback answers
  - Built-in retry logic with exponential backoff
  - Timeout handling for API calls

### **firestore.ts** (Database Service)
- **Purpose**: Manage all Firestore database operations
- **Collections**:
  - `users/` - User profiles + interviewer details
  - `interviews/` - Interview sessions + scores
  - `bookings/` - Live interview bookings
  - `messages/` - Chat messages
  - `ratings/` - Reviews + ratings
  - `notifications/` - User notifications
  - `availability/` - Interviewer time slots
  - `earnings/` - Payment records

---

## 🔐 Data Models (TypeScript Types)

### **UserProfile**
```typescript
{
  id: string
  uid: string (Firebase UID)
  userType: 'candidate' | 'interviewer'
  role: string (e.g., "Senior React Developer")
  skills: string[]
  email: string
  resumeUrl: string
  createdAt: Date
  updatedAt: Date
  
  // Type-specific profiles
  interviewerProfile?: {
    yearsOfExperience: number
    specializations: string[]
    bio: string
    hourlyRate: number
    availability: TimeSlot[]
    rating: number (1-5)
    verified: boolean
  }
  
  candidateProfile?: {
    targetRoles: string[]
    experienceLevel: 'entry' | 'mid' | 'senior'
    timezone: string
  }
}
```

### **InterviewSession**
```typescript
{
  id: string
  userId: string
  bookingId?: string (for live interviews)
  role: string
  skills: string[]
  date: Date
  score: number
  duration: number (seconds)
  status: 'in-progress' | 'completed' | 'abandoned'
  
  questions: InterviewQuestion[]
    ├─ qText: string
    ├─ isCoding: boolean
    ├─ answerText: string
    ├─ feedback: string
    ├─ score: number (1-5)
    └─ improvementSuggestions: string[]
}
```

### **InterviewBooking**
```typescript
{
  id: string
  candidateId: string
  interviewerId: string
  type: 'ai' | 'live'
  scheduledDateTime: Date
  durationMinutes: 30 | 45 | 60
  status: 'pending' | 'accepted' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled'
  role: string
  skills: string[]
  difficulty: 'basic' | 'intermediate' | 'advanced'
  meetingLink: string
  paymentStatus: 'pending' | 'completed' | 'refunded'
  interviewerEarnings: number
}
```

---

## 🔄 Service Architecture

### **Service Pattern**
Each service follows a singleton pattern:
```typescript
// Create instance
const service = new SomeService();

// Export singleton
export const someService = service;

// Use in components
import { someService } from '../services/some.ts';
await someService.someMethod();
```

### **Core Services**

| Service | Purpose |
|---------|---------|
| `firebase.ts` | Initialize Firebase Auth & Firestore |
| `firestore.ts` | Database CRUD operations |
| `gemini-api.ts` | AI question generation & evaluation |
| `booking.ts` | Interview booking logic |
| `payment.ts` | Stripe payment processing |
| `video-conferencing.ts` | Video call setup (Daily.co) |
| `messaging.ts` | Real-time chat messages |
| `notifications.ts` | Push notifications |
| `analytics.ts` | Performance tracking |
| `availability.ts` | Schedule management |
| `rating.ts` | Review system |
| `favorites.ts` | Save/manage favorite interviewers |
| `resume-analyzer.ts` | Parse resumes (Mammoth) |
| `reminder-scheduler.ts` | Automated reminders |

---

## 🚀 User Journey

### **Candidate Flow**
1. **Landing Page** → Click "Get Started"
2. **Auth Screen** → Sign in (anonymous or email)
3. **Welcome Screen** → Introduction
4. **Setup Screen** → Enter role, skills, experience
5. **Lobby Screen** → Home dashboard
   - "Start New Interview" → Practice with AI
   - "Book Interview" → Schedule with human
   - View history, favorites, settings
6. **SpeechInterviewScreen** → Answer 5 questions
7. **FeedbackModal** → See results + feedback

### **Interviewer Flow**
1. **Auth Screen** → Sign in
2. **User Type Screen** → Select "Interviewer"
3. **InterviewerSetupScreen** → Add bio, rate, availability
4. **InterviewerDashboard** → Home
   - View upcoming bookings
   - Manage availability
   - View earnings
   - See analytics
   - View messages
5. **Video interview** → Join meeting when scheduled
6. Submit feedback/rating

---

## 🛡️ Security

### **Firebase Security Rules**
```
firestore.rules:
  - Users can only read/write their own profile
  - Bookings owned by candidate/interviewer can be read by each other
  - Ratings public (read-only), write only by authorized users
  - Messages private between participants
  - Analytics read-only for owner

storage.rules:
  - Users can upload to their folder only
  - Files private unless explicitly shared
```

### **Backend Security**
- Rate limiting on API endpoints
- CORS configured for allowed origins
- Helmet.js for security headers
- Input validation with Zod
- Firebase Admin SDK for server verification
- Stripe webhook signature verification

---

## 🚀 Deployment

### **Frontend**
- Deploy to **Firebase Hosting** or **Vercel**
- Environment variables in `.env.production`
- Static assets cached with versioning

### **Backend**
- Deploy to **Vercel Serverless Functions** (api/*)
- Or run as Docker container
- Environment variables in hosting platform

### **Database**
- Firebase Firestore (auto-scaling)
- Indexes created automatically based on queries
- Backups enabled

---

## 🔧 Development Commands

```bash
# Installation
npm install

# Development
npm run dev              # Start Vite dev server + watch
npm run dev:all         # Frontend + backend + API server

# Building
npm run build           # Production build
npm run preview         # Preview production build

# Testing
npm run test            # Run tests
npm run test:ui         # Interactive test UI

# Code Quality
npm run lint            # Check for issues
npm run lint -- --fix   # Auto-fix issues
```

---

## 📊 Key Metrics & Features

### **For Candidates**
✅ Practice unlimited AI interviews
✅ Track performance metrics
✅ Save favorite interviewers
✅ Schedule live 1:1 sessions
✅ Upload resume for analysis
✅ View detailed feedback

### **For Interviewers**
✅ Flexible availability management
✅ Track earnings in real-time
✅ View performance analytics
✅ Message candidates
✅ Rate and review candidates
✅ Set hourly rate + specializations

### **Platform Features**
✅ Real-time notifications
✅ Video conferencing integration
✅ Payment processing (Stripe)
✅ Automated reminders
✅ AI-powered question generation
✅ Structured feedback system
✅ Rating/review system
✅ File management (resumes, certificates)

---

## 🎨 UI/UX

### **Design System**
- **Colors**: Gradient mesh background (blue/purple)
- **Animations**: Framer Motion for smooth transitions
- **Responsive**: Mobile-first TailwindCSS
- **Components**: 25+ reusable components
- **Accessibility**: ARIA labels, keyboard navigation

### **Key Screens**
- **Landing Page**: Marketing homepage
- **Auth Screen**: Login/signup form
- **LobbyScreen**: Home dashboard for candidates
- **BookInterviewScreen**: Schedule with interviewers
- **SpeechInterviewScreen**: Interview UI with Q&A
- **FeedbackModal**: Results modal
- **InterviewerDashboard**: Stats for interviewers
- **MessagingScreen**: Chat interface

---

## 🐛 Error Handling

### **Error Strategy**
- Try-catch in all async functions
- Centralized error handler `handleError()`
- Error boundaries in React components
- User-friendly error messages
- Structured error logging
- Retry logic with exponential backoff

### **Error Types**
- `AUTH_FAILED` - Authentication errors
- `API_ERROR` - API call failures
- `VALIDATION_ERROR` - Input validation
- `NOT_FOUND` - Resource not found
- `PERMISSION_DENIED` - Authorization
- `NETWORK_ERROR` - Connection issues

---

## 📚 Dependencies Overview

### **Key Libraries**
- **react** (19.2) - UI framework
- **typescript** (5.9) - Type safety
- **firebase** (12.6) - Backend-as-a-service
- **axios** (1.13) - HTTP client
- **zod** (4.1) - Schema validation
- **framer-motion** (12.23) - Animations
- **lucide-react** (0.553) - Icons
- **pino** (10.1) - Logging
- **tailwindcss** (4.1) - Styling
- **vite** (7.2) - Build tool
- **pdfjs-dist** (5.4) - PDF viewing
- **mammoth** (1.11) - Word doc parsing

---

## 🎯 Next Steps to Understand Code

1. **Start with `src/App.tsx`** - Understand main routing
2. **Read `src/types/index.ts`** - Know all data types
3. **Review `src/hooks/useAuth.ts`** - Authentication flow
4. **Explore `src/hooks/useInterview.ts`** - Interview logic
5. **Check `src/services/firebase.ts`** - Firebase setup
6. **Understand `src/services/gemini-api.ts`** - AI integration
7. **Study page components** - UI/UX patterns
8. **Review backend** - API endpoints

---

**Version**: 1.0.0  
**Last Updated**: November 23, 2025  
**Status**: Production Ready ✅
