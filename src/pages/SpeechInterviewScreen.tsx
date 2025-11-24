/**
 * @file pages/SpeechInterviewScreen.tsx
 * @description Interview screen with speech recognition and text-to-speech
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { INTERVIEW_LENGTH } from '../utils/constants';
import { speechService } from '../services/speech';
import type { InterviewSession } from '../types';

interface SpeechInterviewScreenProps {
  session: InterviewSession;
  onSubmitAnswer: (answer: string) => Promise<void>;
  onExit?: () => void;
}

export const SpeechInterviewScreen: React.FC<SpeechInterviewScreenProps> = ({
  session,
  onSubmitAnswer,
  onExit,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [isQuestionPlaying, setIsQuestionPlaying] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const questionPlayedRef = useRef<boolean>(false);

  const currentQuestionIndex = session.questions.length - 1;
  const currentQuestion = session.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / INTERVIEW_LENGTH) * 100;
  const isLastQuestion = currentQuestionIndex === INTERVIEW_LENGTH - 1;
  const isCodingQuestion = currentQuestion?.isCoding;

  // Initialize camera on component mount
  useEffect(() => {
    if (!currentQuestion) {
      return; // Don't attach camera until we have a question (and video is rendered)
    }

    let isMounted = true;

    const waitForVideoElement = async (timeout = 1000): Promise<boolean> => {
      const start = Date.now();
      while (isMounted && !videoRef.current && Date.now() - start < timeout) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      return Boolean(videoRef.current);
    };

    const attachCamera = async () => {
      try {
        const hasVideoEl = await waitForVideoElement(1000);
        if (!hasVideoEl) {
          setError('Video element not found');
          return;
        }

        if (!videoRef.current) {
          setError('Video element not found');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        videoRef.current.srcObject = stream;
        videoRef.current.load(); // Load the new stream

        // Add stream event listeners
        stream.addEventListener('inactive', () => {
          setIsCameraReady(false);
          setError('Camera disconnected, reconnecting...');
          // Try to reconnect after a short delay
          setTimeout(() => {
            if (isMounted) attachCamera();
          }, 1000);
        });

        // Add track event listeners
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.addEventListener('ended', () => {
            setIsCameraReady(false);
            setError('Camera track ended, reconnecting...');
            // Try to reconnect after a short delay
            setTimeout(() => {
              if (isMounted) attachCamera();
            }, 1000);
          });
        }

        // Explicitly play the video
        try {
          await videoRef.current.play();

          // Check if video has dimensions
          if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
            setError('Camera not providing video feed');
            return;
          }
        } catch (playError) {
          // Video play failed - continue anyway
        }

        setIsCameraReady(true);
      } catch (err) {
        setError('Camera not available');
      }
    };

    attachCamera();

    return () => {
      isMounted = false;
      // Stop all speech and listening when component unmounts or question changes
      speechService.cancelSpeech();
      speechService.stopListening();
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [currentQuestion]);

  // Cleanup on component unmount (when exiting interview)
  useEffect(() => {
    return () => {
      // Stop all speech and audio
      speechService.cancelSpeech();
      speechService.stopListening();
      // Stop all camera tracks
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  // Reset when question changes
  useEffect(() => {
    setTranscript('');
    setInterimTranscript('');
    setError('');
    setIsListening(false);
    // Reset flag when question index changes
    questionPlayedRef.current = false;
    speechService.cancelSpeech();
  }, [currentQuestionIndex]);

  // Play question on load - only play once per question
  useEffect(() => {
    // Skip if already played or conditions not met
    if (questionPlayedRef.current) {
      return;
    }

    if (!currentQuestion || isCodingQuestion || isQuestionPlaying) {
      return;
    }

    questionPlayedRef.current = true;
    playQuestion();
  }, [currentQuestionIndex]);

  const playQuestion = async () => {
    try {
      // Cancel any previous speech before starting new one
      speechService.cancelSpeech();
      setIsQuestionPlaying(true);
      setError('');
      await speechService.speak(currentQuestion.qText);
      // Auto-start listening after question finishes
      setTimeout(() => {
        startListening();
      }, 500);
    } catch (err) {
      setError('Failed to play question. Please try again.');
    } finally {
      setIsQuestionPlaying(false);
    }
  };

  const startListening = () => {
    if (!speechService.isSupported()) {
      setError('Speech recognition not supported in your browser');
      return;
    }

    setIsListening(true);
    setTranscript('');
    setInterimTranscript('');
    setError('');

    speechService.startListening(
      (result) => {
        if (result.isFinal) {
          setTranscript((prev) => prev + result.transcript);
        } else {
          setInterimTranscript(result.transcript);
        }
      },
      (err) => {
        setError(`Listening error: ${err}`);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
        setInterimTranscript('');
      }
    );
  };

  const stopListening = () => {
    speechService.stopListening();
    setIsListening(false);
  };

  const handleSubmit = async () => {
    const finalAnswer = transcript + interimTranscript;
    if (!finalAnswer.trim()) {
      setError('Please provide an answer before continuing');
      return;
    }

    stopListening();
    setError('');

    try {
      await onSubmitAnswer(finalAnswer);
      setTranscript('');
      setInterimTranscript('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit answer');
    }
  };

  if (!currentQuestion) {
    return (
      <div style={{ minHeight: '100vh', width: '100%', background: '#f8f9fa' }}>
        {/* Professional Header */}
        <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0066cc' }}>Intervuu</div>
              <div style={{ height: '24px', width: '1px', background: '#e5e7eb' }}></div>
              <div style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>{session.role}</div>
            </div>
          </div>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '600px' }}>
              <LoadingSpinner size="lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const finalAnswer = transcript + interimTranscript;
  const hasAnswer = finalAnswer.trim().length > 0;

  return (
    <div style={{ minHeight: '100vh', width: '100%', background: '#f8f9fa' }}>
      {/* Sticky Professional Header */}
      <div style={{ 
        position: 'sticky', 
        top: 0, 
        background: 'white', 
        borderBottom: '1px solid #e5e7eb', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        zIndex: 50
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: 'clamp(12px, 3vw, 16px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '200px' }}>
            <div style={{ fontSize: 'clamp(18px, 5vw, 24px)', fontWeight: 'bold', color: '#0066cc', letterSpacing: '-0.5px' }}>Intervuu</div>
            <div style={{ height: '24px', width: '1px', background: '#e5e7eb' }}></div>
            <div style={{ fontSize: 'clamp(12px, 3vw, 14px)', color: '#666', fontWeight: '500' }}>{session.role}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(12px, 3vw, 24px)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f0f4ff', padding: '8px 12px', borderRadius: '20px', border: '1px solid #d0deff' }}>
              <span style={{ fontSize: 'clamp(10px, 2.5vw, 12px)', fontWeight: '600', color: '#0066cc' }}>Q {currentQuestionIndex + 1}/{INTERVIEW_LENGTH}</span>
              <div style={{ width: '50px', height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: '#0066cc', transition: 'width 0.3s ease' }}></div>
              </div>
            </div>
            <Button variant="danger" onClick={() => {
              // Stop all speech/audio before exiting
              speechService.cancelSpeech();
              speechService.stopListening();
              setIsListening(false);
              if (videoRef.current?.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
              }
              onExit?.();
            }} disabled={false} size="sm">
              Exit
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: 'clamp(16px, 4vw, 24px)' }}>
        <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
          {/* Video Interview Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: '16px', marginBottom: '24px', minHeight: 'clamp(300px, 60vw, 600px)' }}>
            {/* AI Interviewer (Left) */}
          <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'white', position: 'relative' }}>
              {/* Professional Interviewer Avatar */}
              <div style={{ marginBottom: '20px', position: 'relative' }}>
                <svg width="100" height="100" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ maxWidth: 'clamp(80px, 15vw, 120px)', height: 'auto' }}>
                  {/* Background circle */}
                  <circle cx="60" cy="60" r="60" fill="rgba(255,255,255,0.1)"/>
                  
                  {/* Face */}
                  <circle cx="60" cy="50" r="25" fill="#FDBCB4"/>
                  
                  {/* Eyes */}
                  <circle cx="52" cy="45" r="2.5" fill="#2D3748"/>
                  <circle cx="68" cy="45" r="2.5" fill="#2D3748"/>
                  
                  {/* Eyebrows */}
                  <path d="M48 40 Q52 38 56 40" stroke="#2D3748" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                  <path d="M64 40 Q68 38 72 40" stroke="#2D3748" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                  
                  {/* Nose */}
                  <ellipse cx="60" cy="50" rx="1" ry="2" fill="#E8A085"/>
                  
                  {/* Mouth - smiling */}
                  <path d="M55 58 Q60 62 65 58" stroke="#2D3748" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                  
                  {/* Hair */}
                  <path d="M40 35 Q45 25 55 30 Q60 20 70 25 Q75 30 80 35 Q75 32 70 35 Q65 32 60 35 Q55 32 50 35 Q45 32 40 35" fill="#2D3748"/>
                  
                  {/* Shirt/Blazer */}
                  <path d="M35 75 Q40 70 50 72 Q60 70 70 72 Q80 70 85 75 L85 95 Q80 100 70 98 Q60 100 50 98 Q40 100 35 95 Z" fill="#4A5568"/>
                  
                  {/* Shirt collar */}
                  <path d="M50 72 Q60 70 70 72 L68 78 Q60 76 52 78 Z" fill="#2D3748"/>
                  
                  {/* Tie */}
                  <path d="M58 78 Q60 85 62 78 Q64 85 66 78" fill="#E53E3E" stroke="#C53030" strokeWidth="1"/>
                </svg>
                
                {/* Professional badge */}
                <div style={{ 
                  position: 'absolute', 
                  bottom: '-5px', 
                  right: '-5px', 
                  background: '#FFD700', 
                  borderRadius: '50%', 
                  width: '24px', 
                  height: '24px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#2D3748',
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  👔
                </div>
              </div>

              <div style={{ textAlign: 'center', maxWidth: '80%' }}>
                <p style={{ fontSize: 'clamp(14px, 4vw, 18px)', fontWeight: 'bold', marginBottom: '8px' }}>Sarah Chen</p>
                <p style={{ fontSize: 'clamp(12px, 3vw, 14px)', opacity: 0.9, marginBottom: '4px' }}>Senior Technical Interviewer</p>
                <p style={{ fontSize: 'clamp(10px, 2.5vw, 12px)', opacity: 0.7 }}>
                  {isQuestionPlaying ? 'Speaking...' : 'Ready to ask'}
                </p>
              </div>
              
              {isQuestionPlaying && (
                <div style={{ marginTop: '20px', display: 'flex', gap: '8px', alignItems: 'flex-end', height: '40px' }}>
                  {[1, 2, 3, 4].map((bar) => (
                    <div
                      key={bar}
                      style={{
                        width: '4px',
                        background: 'white',
                        borderRadius: '2px',
                        animation: `soundWave 0.4s ease-in-out ${bar * 0.1}s infinite`,
                        height: `${20 + bar * 5}px`,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Question Captions */}
              {isQuestionPlaying && currentQuestion && (
                <div style={{
                  position: 'absolute',
                  bottom: '20px',
                  left: '20px',
                  right: '20px',
                  background: 'rgba(0, 0, 0, 0.8)',
                  color: 'white',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  lineHeight: '1.4',
                  textAlign: 'center',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  maxHeight: '80px',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {currentQuestion.qText}
                </div>
              )}
            </div>
          </div>

          {/* User Video (Right) */}
          <div style={{ background: '#000', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', border: '4px solid #fff' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
                display: 'block',
                backgroundColor: '#000',
                borderRadius: '0px',
              }}
            />
            {!isCameraReady && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#999', padding: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: '48px', marginBottom: '12px' }}>📹</p>
                <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Camera not available</p>
                <p style={{ fontSize: '12px', marginBottom: '12px' }}>Proceeding without video</p>
                {error && (
                  <p style={{ fontSize: '11px', color: '#f87171', maxWidth: '280px', margin: '0 auto', lineHeight: '1.4' }}>
                    {error}
                  </p>
                )}
              </div>
            )}

            {/* Answer Captions */}
            {isListening && (transcript || interimTranscript) && (
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                right: '20px',
                background: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                lineHeight: '1.4',
                textAlign: 'center',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                maxHeight: '80px',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical'
              }}>
                {transcript + interimTranscript || 'Listening...'}
              </div>
            )}

            {isListening && isCameraReady && (
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                background: 'rgba(220, 38, 38, 0.9)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '600',
                zIndex: 10,
              }}>
                <div style={{ width: '8px', height: '8px', background: '#fff', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
                Recording
              </div>
            )}
          </div>
        </div>

        {/* Controls Section */}
        <div style={{ background: 'white', padding: 'clamp(16px, 4vw, 24px)', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {!isCodingQuestion && (
            <>
              {!isListening ? (
                <Button onClick={startListening} variant="primary" size="lg" disabled={false || isQuestionPlaying}>
                  🎤 Start Speaking
                </Button>
              ) : (
                <Button onClick={stopListening} variant="secondary" size="lg">
                  ⏹️ Stop Recording
                </Button>
              )}
            </>
          )}

          {!isQuestionPlaying && (
            <Button onClick={playQuestion} variant="outline" size="lg" disabled={isQuestionPlaying}>
              🔊 Replay Question
            </Button>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!hasAnswer || false || isListening || isQuestionPlaying}
            variant="primary"
            size="lg"
          >
            {false ? '⏳ Evaluating...' : isLastQuestion ? '✅ Submit & Get Results' : 'Next Question →'}
          </Button>
        </div>
      </div>
    </div>

    {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
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
  );
};

export default SpeechInterviewScreen;
