/**
 * @file pages/UserTypeScreen.tsx
 * @description Screen for selecting user type (Candidate or Interviewer)
 */

import { useState } from 'react';
import { Button } from '../components/Button';
import type { UserType } from '../types';

interface UserTypeScreenProps {
  onSelectType: (type: UserType) => void;
  userEmail?: string;
}

export const UserTypeScreen: React.FC<UserTypeScreenProps> = ({
  onSelectType,
  userEmail,
}) => {
  const [selectedType, setSelectedType] = useState<UserType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async () => {
    if (!selectedType) return;
    
    setIsSubmitting(true);
    await onSelectType(selectedType);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-4 py-12 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-5xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-block mb-4 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full border border-blue-200">
              <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ✨ Welcome to Intervuu
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Choose Your Path
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Are you looking to practice interviews or conduct them? Select the option that best describes your goals.
            </p>
            {userEmail && (
              <p className="text-sm text-gray-500 mt-2">
                Signed in as: <span className="font-semibold">{userEmail}</span>
              </p>
            )}
          </div>

          {/* Type Selection Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Candidate Card */}
            <button
              onClick={() => setSelectedType('candidate')}
              className={`group relative bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border-2 transition-all duration-300 text-left ${
                selectedType === 'candidate'
                  ? 'border-blue-500 scale-105 shadow-2xl'
                  : 'border-white/20 hover:border-blue-300 hover:scale-102'
              }`}
            >
              {/* Selected Badge */}
              {selectedType === 'candidate' && (
                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                  ✓
                </div>
              )}

              {/* Icon */}
              <div className="text-6xl mb-6">🎯</div>

              {/* Title */}
              <h2 className="text-2xl font-bold mb-3 text-gray-800">
                I'm a Candidate
              </h2>

              {/* Description */}
              <p className="text-gray-600 mb-6 leading-relaxed">
                Practice and improve your interview skills with AI-powered mock interviews and connect with real interviewers for personalized feedback.
              </p>

              {/* Features List */}
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-green-500 font-bold mt-0.5">✓</span>
                  <span className="text-sm text-gray-700">Unlimited AI practice interviews</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 font-bold mt-0.5">✓</span>
                  <span className="text-sm text-gray-700">Book live interviews with experts</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 font-bold mt-0.5">✓</span>
                  <span className="text-sm text-gray-700">Get detailed feedback and scores</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 font-bold mt-0.5">✓</span>
                  <span className="text-sm text-gray-700">Track your progress over time</span>
                </div>
              </div>

              {/* Gradient Overlay on Hover */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 transition-opacity ${
                selectedType === 'candidate' ? 'opacity-100' : 'group-hover:opacity-100'
              }`}></div>
            </button>

            {/* Interviewer Card */}
            <button
              onClick={() => setSelectedType('interviewer')}
              className={`group relative bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border-2 transition-all duration-300 text-left ${
                selectedType === 'interviewer'
                  ? 'border-purple-500 scale-105 shadow-2xl'
                  : 'border-white/20 hover:border-purple-300 hover:scale-102'
              }`}
            >
              {/* Selected Badge */}
              {selectedType === 'interviewer' && (
                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                  ✓
                </div>
              )}

              {/* Icon */}
              <div className="text-6xl mb-6">👨‍💼</div>

              {/* Title */}
              <h2 className="text-2xl font-bold mb-3 text-gray-800">
                I'm an Interviewer
              </h2>

              {/* Description */}
              <p className="text-gray-600 mb-6 leading-relaxed">
                Share your expertise by conducting mock interviews, help candidates improve their skills, and earn money while making an impact.
              </p>

              {/* Features List */}
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-green-500 font-bold mt-0.5">✓</span>
                  <span className="text-sm text-gray-700">Set your own schedule and availability</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 font-bold mt-0.5">✓</span>
                  <span className="text-sm text-gray-700">Choose candidates that match your expertise</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 font-bold mt-0.5">✓</span>
                  <span className="text-sm text-gray-700">Earn money for your time and knowledge</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 font-bold mt-0.5">✓</span>
                  <span className="text-sm text-gray-700">Build your reputation with ratings</span>
                </div>
              </div>

              {/* Gradient Overlay on Hover */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600/5 to-pink-600/5 opacity-0 transition-opacity ${
                selectedType === 'interviewer' ? 'opacity-100' : 'group-hover:opacity-100'
              }`}></div>
            </button>
          </div>

          {/* Continue Button */}
          <div className="text-center">
            <Button
              onClick={handleContinue}
              disabled={!selectedType || isSubmitting}
              variant="primary"
              size="lg"
              className="min-w-[200px]"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block animate-spin mr-2">⏳</span>
                  Setting up...
                </>
              ) : (
                <>
                  Continue <span className="ml-2">→</span>
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500 mt-4">
              Don't worry, you can change this later in settings
            </p>
          </div>

          {/* Info Banner */}
          <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-start gap-4">
              <div className="text-3xl">💡</div>
              <div>
                <h3 className="font-bold text-gray-800 mb-2">Not sure which to choose?</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  <strong>Choose Candidate</strong> if you're preparing for job interviews and want to practice your skills.
                  <br />
                  <strong>Choose Interviewer</strong> if you have professional experience and want to help others while earning money.
                  <br />
                  <span className="text-gray-500 italic">You can always create a second account for the other role later.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
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
      `}</style>
    </div>
  );
};

export default UserTypeScreen;
