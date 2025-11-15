/**
 * @file pages/LandingPage.tsx
 * @description Professional landing page for InterviewAI
 */

import { Button } from '../components/Button';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div style={{ minHeight: '100vh', width: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Navigation */}
      <nav style={{ padding: 'clamp(16px, 3vw, 24px)', background: 'rgba(0, 0, 0, 0.1)', backdropFilter: 'blur(10px)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 'bold', color: 'white' }}>
            🎯 InterviewAI
          </div>
          <Button onClick={onGetStarted} variant="outline" size="md" style={{ borderColor: 'white', color: 'white' }}>
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div style={{ padding: 'clamp(40px, 10vw, 80px) clamp(20px, 5vw, 40px)', textAlign: 'center', color: 'white' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(32px, 10vw, 56px)', fontWeight: 'bold', marginBottom: '20px', lineHeight: 1.2 }}>
            Master Technical Interviews with AI-Powered Practice
          </h1>
          <p style={{ fontSize: 'clamp(16px, 4vw, 20px)', marginBottom: '40px', opacity: 0.9, lineHeight: 1.6 }}>
            Get real-time feedback, personalized questions, and expert guidance to ace your next interview. Practice anywhere, anytime.
          </p>
          <Button onClick={onGetStarted} variant="primary" size="lg" style={{ background: 'white', color: '#667eea', fontWeight: 'bold' }}>
            🚀 Start Your Free Interview
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div style={{ padding: 'clamp(40px, 8vw, 60px) clamp(20px, 5vw, 40px)', background: 'rgba(255, 255, 255, 0.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px, 7vw, 40px)', fontWeight: 'bold', color: 'white', marginBottom: '40px', textAlign: 'center' }}>
            Why Choose InterviewAI?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: 'clamp(20px, 4vw, 30px)' }}>
            {/* Feature 1 */}
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: 'clamp(24px, 5vw, 32px)', borderRadius: '12px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>🎤</div>
              <h3 style={{ fontSize: 'clamp(18px, 4vw, 20px)', fontWeight: 'bold', color: 'white', marginBottom: '12px' }}>
                AI-Powered Evaluation
              </h3>
              <p style={{ fontSize: 'clamp(14px, 3vw, 16px)', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.5 }}>
                Get instant, detailed feedback on your technical answers from our advanced AI interviewer.
              </p>
            </div>

            {/* Feature 2 */}
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: 'clamp(24px, 5vw, 32px)', borderRadius: '12px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>📊</div>
              <h3 style={{ fontSize: 'clamp(18px, 4vw, 20px)', fontWeight: 'bold', color: 'white', marginBottom: '12px' }}>
                Track Your Progress
              </h3>
              <p style={{ fontSize: 'clamp(14px, 3vw, 16px)', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.5 }}>
                Monitor your improvement over time with detailed analytics and performance metrics.
              </p>
            </div>

            {/* Feature 3 */}
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: 'clamp(24px, 5vw, 32px)', borderRadius: '12px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>💡</div>
              <h3 style={{ fontSize: 'clamp(18px, 4vw, 20px)', fontWeight: 'bold', color: 'white', marginBottom: '12px' }}>
                Personalized Questions
              </h3>
              <p style={{ fontSize: 'clamp(14px, 3vw, 16px)', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.5 }}>
                Get tailored questions based on your role and skills. Practice exactly what you need.
              </p>
            </div>

            {/* Feature 4 */}
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: 'clamp(24px, 5vw, 32px)', borderRadius: '12px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>🎯</div>
              <h3 style={{ fontSize: 'clamp(18px, 4vw, 20px)', fontWeight: 'bold', color: 'white', marginBottom: '12px' }}>
                Real-Time Scoring
              </h3>
              <p style={{ fontSize: 'clamp(14px, 3vw, 16px)', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.5 }}>
                Understand exactly how you performed with comprehensive scoring and improvement tips.
              </p>
            </div>

            {/* Feature 5 */}
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: 'clamp(24px, 5vw, 32px)', borderRadius: '12px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>🌐</div>
              <h3 style={{ fontSize: 'clamp(18px, 4vw, 20px)', fontWeight: 'bold', color: 'white', marginBottom: '12px' }}>
                Practice Anywhere
              </h3>
              <p style={{ fontSize: 'clamp(14px, 3vw, 16px)', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.5 }}>
                Fully responsive design works seamlessly on desktop, tablet, and mobile devices.
              </p>
            </div>

            {/* Feature 6 */}
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: 'clamp(24px, 5vw, 32px)', borderRadius: '12px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚡</div>
              <h3 style={{ fontSize: 'clamp(18px, 4vw, 20px)', fontWeight: 'bold', color: 'white', marginBottom: '12px' }}>
                Instant Setup
              </h3>
              <p style={{ fontSize: 'clamp(14px, 3vw, 16px)', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.5 }}>
                Get started in seconds. No downloads or complex setup required. Just practice.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div style={{ padding: 'clamp(40px, 8vw, 60px) clamp(20px, 5vw, 40px)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px, 7vw, 40px)', fontWeight: 'bold', color: 'white', marginBottom: '40px', textAlign: 'center' }}>
            How It Works
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px, 100%), 1fr))', gap: 'clamp(24px, 4vw, 32px)', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '48px', marginBottom: '16px', color: '#FFD700' }}>1</div>
              <h3 style={{ fontSize: 'clamp(16px, 4vw, 18px)', fontWeight: 'bold', color: 'white', marginBottom: '12px' }}>
                Set Your Profile
              </h3>
              <p style={{ fontSize: 'clamp(14px, 3vw, 15px)', color: 'rgba(255, 255, 255, 0.8)' }}>
                Tell us your role and skills
              </p>
            </div>
            <div>
              <div style={{ fontSize: '48px', marginBottom: '16px', color: '#FFD700' }}>2</div>
              <h3 style={{ fontSize: 'clamp(16px, 4vw, 18px)', fontWeight: 'bold', color: 'white', marginBottom: '12px' }}>
                Start Interview
              </h3>
              <p style={{ fontSize: 'clamp(14px, 3vw, 15px)', color: 'rgba(255, 255, 255, 0.8)' }}>
                Answer AI-generated questions
              </p>
            </div>
            <div>
              <div style={{ fontSize: '48px', marginBottom: '16px', color: '#FFD700' }}>3</div>
              <h3 style={{ fontSize: 'clamp(16px, 4vw, 18px)', fontWeight: 'bold', color: 'white', marginBottom: '12px' }}>
                Get Feedback
              </h3>
              <p style={{ fontSize: 'clamp(14px, 3vw, 15px)', color: 'rgba(255, 255, 255, 0.8)' }}>
                Receive detailed analysis and tips
              </p>
            </div>
            <div>
              <div style={{ fontSize: '48px', marginBottom: '16px', color: '#FFD700' }}>4</div>
              <h3 style={{ fontSize: 'clamp(16px, 4vw, 18px)', fontWeight: 'bold', color: 'white', marginBottom: '12px' }}>
                Track Progress
              </h3>
              <p style={{ fontSize: 'clamp(14px, 3vw, 15px)', color: 'rgba(255, 255, 255, 0.8)' }}>
                Monitor your improvement
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{ padding: 'clamp(40px, 8vw, 60px) clamp(20px, 5vw, 40px)', textAlign: 'center', color: 'white' }}>
        <h2 style={{ fontSize: 'clamp(28px, 7vw, 40px)', fontWeight: 'bold', marginBottom: '20px' }}>
          Ready to Ace Your Interview?
        </h2>
        <p style={{ fontSize: 'clamp(14px, 4vw, 18px)', marginBottom: '30px', opacity: 0.9 }}>
          Join thousands of professionals who have improved their interview performance with InterviewAI.
        </p>
        <Button onClick={onGetStarted} variant="primary" size="lg" style={{ background: 'white', color: '#667eea', fontWeight: 'bold' }}>
          🚀 Start Free Practice Now
        </Button>
      </div>

      {/* Footer */}
      <div style={{ padding: 'clamp(24px, 4vw, 32px)', background: 'rgba(0, 0, 0, 0.2)', textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)', fontSize: 'clamp(12px, 3vw, 14px)' }}>
        <p>© 2024 InterviewAI. All rights reserved. Practice interviews. Master your skills. Land your dream job.</p>
      </div>
    </div>
  );
};

export default LandingPage;
