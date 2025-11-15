/**
 * @file pages/FeedbackModal.tsx
 * @description Score display and feedback modal with modern design
 */

import { Button } from '../components/Button';
import { SCORE_RANGES } from '../utils/constants';
import type { QuestionFeedback } from '../types';

interface FeedbackModalProps {
  score: number;
  feedback: QuestionFeedback[];
  role: string;
  onRetake: () => void;
  onExit: () => void;
  isLoading?: boolean;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  score,
  feedback,
  role,
  onRetake,
  onExit,
  isLoading = false,
}) => {
  const scoreRange = Object.values(SCORE_RANGES).find((r) => score >= r.min) || SCORE_RANGES.POOR;

  const scoreParts = {
    integer: Math.floor(score),
    decimal: Math.round((score - Math.floor(score)) * 10),
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 50 }}>
      <div style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ background: 'white', padding: '48px', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ display: 'inline-block', background: '#e0e7ff', color: '#0066cc', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '600', marginBottom: '24px' }}>
              Interview Complete
            </div>

            <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '16px', color: '#111' }}>Your Score</h1>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
              <span style={{ fontSize: '72px', fontWeight: 'bold', color: scoreRange.color }}>
                {scoreParts.integer}
              </span>
              <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#999', marginTop: '24px' }}>.{scoreParts.decimal}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
              <div style={{ background: scoreRange.label === 'Excellent' ? '#dcfce7' : scoreRange.label === 'Good' ? '#dbeafe' : scoreRange.label === 'Fair' ? '#fef3c7' : '#fee2e2', color: scoreRange.color, padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '600' }}>
                {scoreRange.label}
              </div>
              <div style={{ background: '#f3f4f6', color: '#666', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '600' }}>
                {role}
              </div>
            </div>

            <div style={{ background: '#f0f9ff', padding: '32px', borderRadius: '8px', marginBottom: '48px' }}>
              <p style={{ color: '#666', fontSize: '16px', lineHeight: '1.6' }}>
                {scoreRange.label === 'Excellent'
                  ? 'Outstanding performance! You demonstrated strong expertise and clear communication.'
                  : scoreRange.label === 'Good'
                  ? 'Strong performance! Your answers showed good understanding and practical experience.'
                  : scoreRange.label === 'Fair'
                  ? 'Good effort! Focus on providing more specific examples and deeper technical insights.'
                  : 'Keep practicing! Try to expand your answers with concrete examples and details.'}
              </p>
            </div>
          </div>

          {/* Feedback */}
          {feedback && feedback.length > 0 && (
            <div style={{ marginBottom: '48px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111', marginBottom: '24px' }}>Question Feedback</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {feedback.map((item, index) => (
                  <div key={index} style={{ borderLeft: '4px solid #0066cc', paddingLeft: '24px', paddingTop: '16px', paddingBottom: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '12px' }}>
                      <p style={{ fontWeight: '600', color: '#111' }}>Q{index + 1}: {item.question.substring(0, 100)}...</p>
                      <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#0066cc' }}>{item.score.toFixed(1)}</span>
                    </div>
                    <p style={{ color: '#666', marginBottom: '16px' }}>{item.feedback}</p>
                    {item.improvements && item.improvements.length > 0 && (
                      <div style={{ background: 'white', padding: '16px', borderRadius: '8px' }}>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#666', marginBottom: '12px' }}>Areas to improve:</p>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {item.improvements.map((improvement: string, i: number) => (
                            <li key={i} style={{ display: 'flex', gap: '12px', fontSize: '14px', color: '#666' }}>
                              <span style={{ color: '#0066cc', fontWeight: 'bold' }}>•</span>
                              <span>{improvement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div style={{ background: '#f0f9ff', padding: '32px', borderRadius: '8px', marginBottom: '48px' }}>
            <h3 style={{ fontWeight: 'bold', color: '#111', marginBottom: '16px' }}>💡 Next Steps</h3>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: '#666' }}>
              <li style={{ display: 'flex', gap: '12px' }}>
                <span style={{ color: '#0066cc', fontWeight: 'bold' }}>1.</span>
                <span>Review the feedback above and identify your strongest areas</span>
              </li>
              <li style={{ display: 'flex', gap: '12px' }}>
                <span style={{ color: '#0066cc', fontWeight: 'bold' }}>2.</span>
                <span>Practice answers for the suggested improvement areas</span>
              </li>
              <li style={{ display: 'flex', gap: '12px' }}>
                <span style={{ color: '#0066cc', fontWeight: 'bold' }}>3.</span>
                <span>Take another interview when you're ready to see improvement</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>
            <Button
              onClick={onRetake}
              disabled={isLoading}
              variant="primary"
              size="lg"
              style={{ flex: 1 }}
            >
              {isLoading ? 'Loading...' : '→ Next Question'}
            </Button>
            <Button
              onClick={onExit}
              disabled={isLoading}
              variant="secondary"
              size="lg"
              style={{ flex: 1 }}
            >
              👋 Exit Interview
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
