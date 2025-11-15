/**
 * @file pages/SelfIntroScreen.tsx
 * @description Screen for user to record self-introduction before interview
 */

import { useState, useRef } from 'react';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { speechService } from '../services/speech';
import { createLogger } from '../utils/logger';

const logger = createLogger('self-intro-screen');

interface SelfIntroScreenProps {
  role: string;
  onIntroComplete: (transcript: string, feedback: string) => void;
  onSkip?: () => void;
}

export const SelfIntroScreen: React.FC<SelfIntroScreenProps> = ({ role, onIntroComplete, onSkip }) => {
  const [stage, setStage] = useState<'record' | 'feedback' | 'complete'>('record');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const recordingStartTime = useRef<number | null>(null);

  const startRecording = () => {
    if (!speechService.isSupported()) {
      setError('Speech recognition not supported in your browser');
      return;
    }

    setIsListening(true);
    setTranscript('');
    setInterimTranscript('');
    setError('');
    recordingStartTime.current = Date.now();

    speechService.startListening(
      (result) => {
        if (result.isFinal) {
          setTranscript((prev) => prev + result.transcript);
        } else {
          setInterimTranscript(result.transcript);
        }
      },
      (err) => {
        setError(`Recording error: ${err}`);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
        setInterimTranscript('');
      }
    );
  };

  const stopRecording = () => {
    speechService.stopListening();
    setIsListening(false);
  };

  const generateFeedback = async () => {
    if (!transcript.trim()) {
      setError('Please record your introduction first');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const fullTranscript = transcript + interimTranscript;
      const duration = recordingStartTime.current ? Math.round((Date.now() - recordingStartTime.current) / 1000) : 0;

      // Generate feedback based on introduction
      const feedbackItems: string[] = [];

      // Length feedback
      if (duration < 30) {
        feedbackItems.push('⚠️ Your introduction was quite brief. Try to provide more detail (aim for 1-2 minutes)');
      } else if (duration > 300) {
        feedbackItems.push('⚠️ Your introduction was lengthy. Try to be more concise (target 1-2 minutes)');
      } else {
        feedbackItems.push('✓ Good introduction length');
      }

      // Content feedback
      const lowerTranscript = fullTranscript.toLowerCase();
      
      if (lowerTranscript.includes('name') || lowerTranscript.includes('i am') || lowerTranscript.includes("i'm")) {
        feedbackItems.push('✓ Good opening with personal introduction');
      } else {
        feedbackItems.push('→ Consider starting with your name and current role');
      }

      if (lowerTranscript.includes('experience') || lowerTranscript.includes('worked') || lowerTranscript.includes('years')) {
        feedbackItems.push('✓ Good mention of experience');
      } else {
        feedbackItems.push('→ Mention your relevant experience and years in the field');
      }

      if (lowerTranscript.includes('skill') || lowerTranscript.includes('expertise') || lowerTranscript.includes('speciali')) {
        feedbackItems.push('✓ Good mention of skills');
      } else {
        feedbackItems.push('→ Highlight your key technical skills and areas of expertise');
      }

      if (lowerTranscript.includes('passion') || lowerTranscript.includes('interested') || lowerTranscript.includes('excited')) {
        feedbackItems.push('✓ Good expression of enthusiasm');
      } else {
        feedbackItems.push('→ Show enthusiasm for the role and technology');
      }

      if (lowerTranscript.includes('goal') || lowerTranscript.includes('looking') || lowerTranscript.includes('opportunity')) {
        feedbackItems.push('✓ Good mention of goals');
      } else {
        feedbackItems.push('→ Mention your career goals or what you\'re looking for');
      }

      // Fluency feedback
      const wordCount = fullTranscript.split(/\s+/).length;
      if (wordCount > 0) {
        const speed = Math.round(wordCount / (duration / 60));
        if (speed < 100) {
          feedbackItems.push('→ Speak a bit faster - you seemed a bit slow');
        } else if (speed > 180) {
          feedbackItems.push('→ Slow down slightly - you were speaking quite fast');
        } else {
          feedbackItems.push('✓ Good speaking pace');
        }
      }

      const generatedFeedback = feedbackItems.join('\n');
      setFeedback(generatedFeedback);
      setStage('feedback');

      logger.info('Feedback generated for self-introduction');
    } catch (err) {
      setError('Failed to generate feedback. Please try again.');
      logger.error({ error: err }, 'Feedback generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    const fullTranscript = transcript + interimTranscript;
    if (!fullTranscript.trim()) {
      setError('Please record your introduction');
      return;
    }
    onIntroComplete(fullTranscript, feedback);
  };

  if (stage === 'record') {
    return (
      <div style={{ minHeight: '100vh', width: '100%', background: '#f5f5f5', padding: 'clamp(20px, 5vw, 40px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: '600px', width: '100%', background: 'white', padding: 'clamp(24px, 5vw, 40px)', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h1 style={{ fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: 'bold', color: '#111', marginBottom: '12px', textAlign: 'center' }}>
            📝 Introduce Yourself
          </h1>
          <p style={{ fontSize: 'clamp(14px, 4vw, 16px)', color: '#666', textAlign: 'center', marginBottom: '32px', lineHeight: 1.6 }}>
            Record a brief introduction for the {role} position. Tell us about yourself, your experience, and why you're interested in this role.
          </p>

          {/* Recording Area */}
          <div style={{
            background: isListening ? '#fff5f5' : '#f9f9f9',
            border: isListening ? '2px solid #ef4444' : '2px solid #e5e7eb',
            padding: 'clamp(24px, 5vw, 32px)',
            borderRadius: '8px',
            textAlign: 'center',
            marginBottom: '24px',
            transition: 'all 200ms'
          }}>
            {isListening ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '48px' }}>🎤</div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '30px' }}>
                  {[1, 2, 3, 4, 5].map((bar) => (
                    <div
                      key={bar}
                      style={{
                        width: '4px',
                        background: '#ef4444',
                        borderRadius: '2px',
                        animation: `soundWave 0.4s ease-in-out ${bar * 0.1}s infinite`,
                        height: `${15 + bar * 3}px`,
                      }}
                    />
                  ))}
                </div>
                <p style={{ fontSize: 'clamp(14px, 4vw, 16px)', fontWeight: '600', color: '#ef4444' }}>
                  Recording...
                </p>
              </div>
            ) : transcript || interimTranscript ? (
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: 'clamp(13px, 3vw, 14px)', color: '#666', marginBottom: '12px' }}>
                  Your introduction:
                </p>
                <div style={{
                  background: 'white',
                  padding: '16px',
                  borderRadius: '6px',
                  minHeight: '100px',
                  fontSize: 'clamp(13px, 3vw, 14px)',
                  lineHeight: 1.6,
                  color: '#333'
                }}>
                  {transcript}
                  {interimTranscript && (
                    <span style={{ color: '#999', fontStyle: 'italic' }}>
                      {interimTranscript}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '40px' }}>🎙️</div>
                <p style={{ fontSize: 'clamp(14px, 4vw, 16px)', color: '#666' }}>
                  Ready to record your introduction
                </p>
              </div>
            )}
          </div>

          {error && (
            <div style={{ background: '#fee', border: '1px solid #fcc', padding: '12px', borderRadius: '6px', color: '#c00', fontSize: 'clamp(12px, 3vw, 13px)', marginBottom: '24px' }}>
              {error}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {!isListening ? (
              <>
                <Button onClick={startRecording} variant="primary" size="lg" style={{ flex: 1, minWidth: '120px' }}>
                  🎤 Start Recording
                </Button>
                {(transcript || interimTranscript) && (
                  <Button onClick={() => { setTranscript(''); setInterimTranscript(''); }} variant="outline" size="lg" style={{ flex: 1, minWidth: '120px' }}>
                    🔄 Clear
                  </Button>
                )}
              </>
            ) : (
              <Button onClick={stopRecording} variant="danger" size="lg" style={{ flex: 1, minWidth: '120px' }}>
                ⏹️ Stop Recording
              </Button>
            )}
          </div>

          {!isListening && (transcript || interimTranscript) && !loading && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Button onClick={generateFeedback} variant="primary" size="lg" style={{ flex: 1, minWidth: '120px' }} disabled={loading}>
                ✨ Get Feedback
              </Button>
              {onSkip && (
                <Button onClick={onSkip} variant="secondary" size="lg" style={{ flex: 1, minWidth: '120px' }}>
                  Skip
                </Button>
              )}
            </div>
          )}

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <LoadingSpinner message="Generating feedback..." size="md" />
            </div>
          )}

          <style>{`
            @keyframes soundWave {
              0%, 100% {
                transform: scaleY(1);
              }
              50% {
                transform: scaleY(1.5);
              }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (stage === 'feedback') {
    return (
      <div style={{ minHeight: '100vh', width: '100%', background: '#f5f5f5', padding: 'clamp(20px, 5vw, 40px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: '700px', width: '100%', background: 'white', padding: 'clamp(24px, 5vw, 40px)', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h1 style={{ fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: 'bold', color: '#111', marginBottom: '24px', textAlign: 'center' }}>
            💡 Feedback on Your Introduction
          </h1>

          {/* Your Introduction */}
          <div style={{ background: '#f9f9f9', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
            <p style={{ fontSize: 'clamp(12px, 3vw, 13px)', color: '#666', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase' }}>
              Your Introduction:
            </p>
            <p style={{ fontSize: 'clamp(13px, 3vw, 14px)', lineHeight: 1.6, color: '#333' }}>
              {transcript + interimTranscript}
            </p>
          </div>

          {/* Feedback */}
          <div style={{ background: '#f0f4ff', padding: 'clamp(16px, 4vw, 20px)', borderRadius: '8px', marginBottom: '24px' }}>
            <p style={{ fontSize: 'clamp(12px, 3vw, 13px)', color: '#0066cc', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase' }}>
              Areas to Improve:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {feedback.split('\n').map((item, i) => (
                <p key={i} style={{ fontSize: 'clamp(13px, 3vw, 14px)', lineHeight: 1.5, color: '#333' }}>
                  {item}
                </p>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button onClick={() => setStage('record')} variant="outline" size="lg" style={{ flex: 1, minWidth: '120px' }}>
              🔄 Re-record
            </Button>
            <Button onClick={handleComplete} variant="primary" size="lg" style={{ flex: 1, minWidth: '120px' }}>
              ✓ Continue to Interview
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SelfIntroScreen;
