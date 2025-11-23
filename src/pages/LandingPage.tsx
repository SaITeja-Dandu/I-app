/**
 * @file pages/LandingPage.tsx
 * @description Professional landing page for Intervuu platform
 */

import { Logo } from '../components/Logo';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-6000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="px-6 py-2 bg-white/70 backdrop-blur-lg border-b border-white/20 shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Logo size="medium" variant="horizontal" />
            <button
              onClick={onGetStarted}
              className="px-6 py-2 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              Get Started
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="px-6 py-20 md:py-32 text-center">
          <div className="max-w-5xl mx-auto">
            <div className="inline-block mb-6 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full border border-blue-200">
              <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                🎯 Complete Interview & Hiring Platform
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                From Practice to Placement
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Practice with expert coaches, apply to real jobs, and connect with recruiters—all in one platform. Your complete interview journey starts here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={onGetStarted}
                className="px-8 py-4 rounded-xl text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-2xl hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                🚀 Start Your Journey
              </button>
              <button className="px-8 py-4 rounded-xl text-lg font-semibold bg-white/80 text-gray-700 border-2 border-gray-200 hover:border-blue-300 transition-all duration-300">
                Learn More
              </button>
            </div>
            <p className="mt-6 text-sm text-gray-500">No credit card required • 5 minutes setup</p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="px-6 py-12 bg-white/60 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">10K+</div>
              <p className="text-gray-600 font-medium">Mock Interviews Completed</p>
            </div>
            <div>
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">500+</div>
              <p className="text-gray-600 font-medium">Expert Interview Coaches</p>
            </div>
            <div>
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">1000+</div>
              <p className="text-gray-600 font-medium">Jobs Posted Monthly</p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Complete Interview Ecosystem
                </span>
              </h2>
              <p className="text-xl text-gray-600">Everything you need from preparation to placement</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: '??', title: 'AI-Powered Evaluation', desc: 'Get instant, detailed feedback on your technical answers from our advanced AI interviewer.' },
                { icon: '??', title: 'Track Your Progress', desc: 'Monitor your improvement over time with detailed analytics and performance metrics.' },
                { icon: '??', title: 'Personalized Questions', desc: 'Get tailored questions based on your role and skills. Practice exactly what you need.' },
                { icon: '??', title: 'Real-Time Scoring', desc: 'Understand exactly how you performed with comprehensive scoring and improvement tips.' },
                { icon: '??', title: 'Practice Anywhere', desc: 'Fully responsive design works seamlessly on desktop, tablet, and mobile devices.' },
                { icon: '?', title: 'Instant Setup', desc: 'Get started in seconds. No downloads or complex setup required. Just practice.' },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  <div className="text-5xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold mb-3 text-gray-800">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="px-6 py-20 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  How It Works
                </span>
              </h2>
              <p className="text-xl text-gray-600">Get started in 4 simple steps</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { num: '1', title: 'Set Your Profile', desc: 'Tell us your role and skills' },
                { num: '2', title: 'Start Interview', desc: 'Answer AI-generated questions' },
                { num: '3', title: 'Get Feedback', desc: 'Receive detailed analysis and tips' },
                { num: '4', title: 'Track Progress', desc: 'Monitor your improvement' },
              ].map((step, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg">
                    {step.num}
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-gray-800">{step.title}</h3>
                  <p className="text-gray-600">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="px-6 py-20 text-center">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 md:p-16 shadow-2xl">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Ace Your Interview?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of professionals who have improved their interview performance with InterviewAI.
            </p>
            <button
              onClick={onGetStarted}
              className="px-10 py-4 rounded-xl text-lg font-bold bg-white text-blue-600 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              ?? Start Free Practice Now
            </button>
            <p className="mt-6 text-white/80 text-sm">Free forever � No credit card needed</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-8 bg-white/60 backdrop-blur-sm border-t border-gray-200 text-center">
          <p className="text-gray-600 text-sm">
            � 2024 InterviewAI. All rights reserved. Practice interviews � Master your skills � Land your dream job.
          </p>
        </div>
      </div>

    </div>
  );
};

export default LandingPage;
