import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { UserType } from '../types';

interface AuthScreenProps {
  onSelectUserType?: (type: UserType) => void;
  onBackToLanding?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSelectUserType, onBackToLanding }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [userType, setUserType] = useState<UserType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { signup, login } = useAuth();

  const getErrorMessage = (error: any): string => {
    const errorMessage = error?.message || '';
    
    // Map Firebase error codes to user-friendly messages
    if (errorMessage.includes('EMAIL_EXISTS') || errorMessage.includes('email-already-in-use')) {
      return 'This email is already registered. Please login instead.';
    }
    if (errorMessage.includes('INVALID_EMAIL')) {
      return 'Please enter a valid email address.';
    }
    if (errorMessage.includes('WEAK_PASSWORD')) {
      return 'Password should be at least 6 characters long.';
    }
    if (errorMessage.includes('INVALID_LOGIN_CREDENTIALS') || errorMessage.includes('INVALID_PASSWORD')) {
      return 'Invalid email or password. Please check and try again.';
    }
    if (errorMessage.includes('USER_NOT_FOUND')) {
      return 'No account found with this email. Please sign up first.';
    }
    if (errorMessage.includes('TOO_MANY_ATTEMPTS')) {
      return 'Too many failed attempts. Please try again later.';
    }
    if (errorMessage.includes('PASSWORD_LOGIN_DISABLED')) {
      return 'Email/Password authentication is not enabled. Please contact support.';
    }
    
    return errorMessage || 'Authentication failed. Please try again.';
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (mode === 'signup' && password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    if (mode === 'signup' && !userType) {
      setError('Please select whether you are a candidate or interviewer');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        await signup(email, password);
        // Pass user type to parent for profile creation
        if (onSelectUserType && userType) {
          onSelectUserType(userType);
        }
      } else {
        await login(email, password);
      }
      // Success - navigation will be handled by App.tsx
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-0 right-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-6000"></div>
      </div>

      {/* Main Card */}
      <div className="relative w-full max-w-md">
        {/* Back Button */}
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium"
          >
            <span className="text-xl">←</span>
            <span>Back to Home</span>
          </button>
        )}

        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
            <span className="text-3xl">🎯</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            InterviewAI
          </h1>
          <p className="text-gray-600 text-sm">
            Master your interviews with AI-powered practice
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Toggle Buttons */}
          <div className="flex gap-2 mb-8 p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => {
                setMode('login');
                setError(null);
                setConfirm('');
              }}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Welcome Text */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-sm text-gray-600">
              {mode === 'login' 
                ? 'Sign in to continue your interview journey' 
                : 'Start your journey to interview success'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-5">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span>📧</span> Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-300 bg-white/50"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span>🔒</span> Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-300 bg-white/50"
                />
              </div>
            </div>

            {/* Confirm Password (Signup only) */}
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <span>✓</span> Confirm Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-300 bg-white/50"
                  />
                </div>
              </div>
            )}

            {/* User Type Selection (Signup only) */}
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <span>👤</span> I am a...
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUserType('candidate')}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                      userType === 'candidate'
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 bg-white/50 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">🎯</div>
                    <div className="text-sm font-semibold text-gray-900">Candidate</div>
                    <div className="text-xs text-gray-600 mt-1">Practice interviews</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType('interviewer')}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                      userType === 'interviewer'
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : 'border-gray-200 bg-white/50 hover:border-purple-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">💼</div>
                    <div className="text-sm font-semibold text-gray-900">Interviewer</div>
                    <div className="text-xs text-gray-600 mt-1">Conduct interviews</div>
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-xl animate-shake">
                <span className="text-red-500 text-lg">⚠️</span>
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-6 rounded-xl font-semibold text-white shadow-lg transition-all duration-300 ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {mode === 'login' ? '🚀 Sign In' : '✨ Create Account'}
                </span>
              )}
            </button>
          </form>

          {/* Additional Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setError(null);
                  setConfirm('');
                }}
                className="text-blue-600 hover:text-purple-600 font-semibold transition-colors"
              >
                {mode === 'login' ? 'Sign up here' : 'Login here'}
              </button>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="text-2xl mb-2">🎯</div>
            <p className="text-xs font-semibold text-gray-700">AI-Powered</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="text-2xl mb-2">📊</div>
            <p className="text-xs font-semibold text-gray-700">Analytics</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="text-2xl mb-2">⚡</div>
            <p className="text-xs font-semibold text-gray-700">Fast Results</p>
          </div>
        </div>
      </div>

      {/* Custom CSS animations */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-6000 {
          animation-delay: 6s;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
      `}</style>
    </div>
  );
};

export default AuthScreen;
