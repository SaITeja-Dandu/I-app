/**
 * @file pages/WelcomeScreen.tsx
 * @description Welcome/Onboarding screen for new users
 */

import { useState } from 'react';

interface WelcomeScreenProps {
  onComplete: () => void;
  userEmail?: string;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onComplete,
  userEmail,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: '🎯',
      title: 'AI-Powered Interview Practice',
      description: 'Get personalized interview questions tailored to your role and experience level. Practice with our AI that adapts to your responses.',
      features: ['Role-specific questions', 'Real-time feedback', 'Performance tracking']
    },
    {
      icon: '📊',
      title: 'Instant Performance Analytics',
      description: 'Receive detailed feedback on your answers with actionable improvement suggestions and scoring breakdown.',
      features: ['Detailed scoring', 'Improvement tips', 'Progress tracking']
    },
    {
      icon: '🚀',
      title: 'Ready to Excel?',
      description: "Let's set up your profile and start your journey to interview mastery. It only takes 2 minutes!",
      features: ['Quick setup', 'Resume analysis', 'Start practicing']
    }
  ];

  const currentStepData = steps[currentStep];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative w-full max-w-2xl">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 border border-white/20">
          {/* Progress Indicator */}
          <div className="flex justify-center gap-2 mb-8">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'w-12 bg-gradient-to-r from-blue-600 to-purple-600'
                    : index < currentStep
                    ? 'w-8 bg-green-500'
                    : 'w-8 bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Step Content */}
          <div className="text-center mb-8">
            <div className="text-6xl md:text-7xl mb-6 animate-bounce-slow">
              {currentStepData.icon}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {currentStepData.title}
            </h2>
            <p className="text-gray-600 text-lg mb-8 max-w-xl mx-auto">
              {currentStepData.description}
            </p>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {currentStepData.features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100"
                >
                  <div className="text-2xl mb-2">✓</div>
                  <p className="text-sm font-semibold text-gray-700">{feature}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center gap-4">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-6 py-3 rounded-xl font-semibold text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back
              </button>
            )}
            <div className="flex-1"></div>
            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-8 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={onComplete}
                className="px-8 py-3 rounded-xl font-semibold bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Get Started 🚀
              </button>
            )}
          </div>

          {/* Skip Option */}
          {currentStep < steps.length - 1 && (
            <div className="text-center mt-6">
              <button
                onClick={onComplete}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Skip tutorial →
              </button>
            </div>
          )}
        </div>

        {/* User Info */}
        {userEmail && (
          <div className="text-center mt-6 text-sm text-gray-600">
            Logged in as <span className="font-semibold">{userEmail}</span>
          </div>
        )}
      </div>

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
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default WelcomeScreen;
