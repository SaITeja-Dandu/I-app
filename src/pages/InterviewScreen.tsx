/**
 * @file pages/InterviewScreen.tsx
 * @description Interview question display and answer submission with modern design
 */

import { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { Progress } from '../components/Progress';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { INTERVIEW_LENGTH } from '../utils/constants';
import type { InterviewSession } from '../types';

interface InterviewScreenProps {
  session: InterviewSession;
  onSubmitAnswer: (answer: string) => Promise<void>;
  isLoading?: boolean;
  isEvaluating?: boolean;
}

export const InterviewScreen: React.FC<InterviewScreenProps> = ({
  session,
  onSubmitAnswer,
  isLoading = false,
  isEvaluating = false,
}) => {
  const [error, setError] = useState<string>('');
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const currentQuestionIndex = session.questions.length - 1;
  const currentQuestion = session.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / INTERVIEW_LENGTH) * 100;
  const hasAnswer = currentAnswer.trim().length > 0;
  const isLastQuestion = currentQuestionIndex === INTERVIEW_LENGTH - 1;

  // Reset answer when question changes
  useEffect(() => {
    setCurrentAnswer('');
    setError('');
  }, [currentQuestionIndex, currentQuestion?.qText]);

  if (!currentQuestion) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleSubmit = async () => {
    setError('');
    if (!hasAnswer) {
      setError('Please provide an answer before continuing');
      return;
    }
    try {
      await onSubmitAnswer(currentAnswer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit answer');
    }
  };

  return (
    <div style={{ minHeight: '100vh', width: '100%', padding: '24px', background: '#f5f5f5' }}>
      <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111' }}>
              {session.role} • Question {currentQuestionIndex + 1}/{INTERVIEW_LENGTH}
            </h1>
            <Button variant="secondary" disabled={isEvaluating} size="sm">
              Exit Interview
            </Button>
          </div>
          <Progress value={progress} />
        </div>

        {/* Question Card */}
        <div style={{ background: 'white', padding: '32px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', gap: '16px' }}>
              <LoadingSpinner size="lg" />
              <p style={{ color: '#666', fontSize: '16px', fontWeight: '500' }}>Loading next question...</p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'inline-block', background: '#e0e7ff', color: '#0066cc', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
                  Question {currentQuestionIndex + 1}
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111', lineHeight: '1.4' }}>{currentQuestion.qText}</h2>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#666', marginBottom: '12px' }}>Your Answer</label>
                <textarea
                  placeholder="Share your thoughts and insights here. Be specific and provide examples when possible."
                  disabled={isEvaluating}
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    minHeight: '240px',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    transition: 'all 200ms'
                  }}
                />
                <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>{currentAnswer.length} characters</p>
              </div>

              {error && (
                <div style={{ marginBottom: '20px', padding: '16px', background: '#fee', border: '1px solid #fcc', borderRadius: '8px' }}>
                  <p style={{ color: '#c00', fontWeight: '600' }}>{error}</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                {isLastQuestion ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={!hasAnswer || isEvaluating}
                    variant="primary"
                    size="lg"
                    style={{ flex: 1 }}
                  >
                    {isEvaluating ? '⏳ Evaluating...' : '✅ Submit & Get Results'}
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleSubmit}
                      disabled={!hasAnswer || isEvaluating}
                      variant="primary"
                      size="lg"
                      style={{ flex: 1 }}
                    >
                      {isEvaluating ? '⏳ Evaluating...' : 'Next Question →'}
                    </Button>
                    <Button
                      disabled={isEvaluating}
                      variant="secondary"
                      size="lg"
                    >
                      Skip
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Tips */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#0066cc', marginBottom: '8px' }}>💡 Pro Tip</p>
            <p style={{ color: '#666', fontSize: '14px' }}>Use specific examples from your experience to provide comprehensive answers.</p>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#0066cc', marginBottom: '8px' }}>⏱️ Take Your Time</p>
            <p style={{ color: '#666', fontSize: '14px' }}>There's no time limit. Quality of answers matters more than speed.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewScreen;
