/**
 * @file services/speech.ts
 * @description Speech recognition and synthesis service with realistic voices
 * Uses Google Text-to-Speech API (free tier) with browser TTS fallback
 */

import { createLogger } from '../utils/logger';

const logger = createLogger('speech');

declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export class SpeechService {
  private recognition: any = null;
  private isListening = false;
  private currentAudio: HTMLAudioElement | null = null;
  private isSpeaking = false;

  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.language = 'en-US';
  }

  /**
   * Speak text aloud using realistic voice
   */
  public async speak(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // If already speaking, cancel the previous speech and start new one
        if (this.isSpeaking) {
          window.speechSynthesis.cancel();
          this.isSpeaking = false;
        }

        this.isSpeaking = true;
        this.speakWithBrowserTTS(text, resolve, reject);
      } catch (error) {
        this.isSpeaking = false;
        logger.error({ error }, 'Failed to speak');
        reject(error);
      }
    });
  }

  /**
   * Speak using browser's native text-to-speech (Web Speech API)
   * This is completely free and works offline
   * Modern browsers have realistic voices built-in
   */
  private speakWithBrowserTTS(
    text: string,
    resolve: () => void,
    reject: (error: Error) => void
  ): void {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Get available voices - voices may not be loaded initially, so load them
      let voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        // Voices not loaded yet, wait for them
        window.speechSynthesis.onvoiceschanged = () => {
          voices = window.speechSynthesis.getVoices();
        };
      }
      
      // Prefer voices that sound natural and human-like
      let selectedVoice = voices.find(v => v.name.includes('Google UK English Female')) ||  // Natural sounding
                         voices.find(v => v.name.includes('Google US English Female')) ||   // Natural female
                         voices.find(v => v.name.includes('Samantha')) ||                   // Natural sounding
                         voices.find(v => v.name.includes('Victoria')) ||                   // Natural female
                         voices.find(v => v.lang === 'en-US' && !v.name.includes('Google')) || // Any US voice
                         voices.find(v => v.lang === 'en-US') ||                             // Fallback to US
                         voices[0];                                                           // Last resort
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      // Configure for natural human speech
      utterance.rate = 0.95;       // Natural pace, slightly slower for clarity
      utterance.pitch = 1.0;       // Natural pitch
      utterance.volume = 1.0;      // Full volume

      utterance.onstart = () => {
        logger.info('Speech started');
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        logger.info('Speech playback ended');
        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        // Only treat as error if it's not "interrupted" (which can happen on cancel)
        if (event.error !== 'interrupted') {
          logger.error({ error: event.error }, 'Speech error');
          reject(new Error(`Speech error: ${event.error}`));
        } else {
          logger.info('Speech was cancelled');
          resolve(); // Treat interruption as successful cancellation
        }
      };

      // Cancel any pending utterances and speak
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      this.isSpeaking = false;
      logger.error({ error }, 'Browser TTS failed');
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Start listening for user's speech
   */
  public startListening(
    onResult: (result: SpeechRecognitionResult) => void,
    onError?: (error: string) => void,
    onEnd?: () => void
  ): void {
    if (!this.recognition) {
      const error = 'Speech recognition not supported';
      logger.error(error);
      onError?.(error);
      return;
    }

    try {
      this.isListening = true;

      this.recognition.onstart = () => {
        logger.info('Listening started');
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        onResult({
          transcript: finalTranscript || interimTranscript,
          confidence: event.results[event.results.length - 1]?.[0]?.confidence || 0,
          isFinal: finalTranscript.length > 0,
        });
      };

      this.recognition.onerror = (event: any) => {
        logger.error({ error: event.error }, 'Recognition error');
        onError?.(event.error);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        logger.info('Listening ended');
        onEnd?.();
      };

      this.recognition.start();
    } catch (error) {
      logger.error({ error }, 'Failed to start listening');
      onError?.(String(error));
    }
  }

  /**
   * Stop listening for speech
   */
  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * Check if speech recognition is supported
   */
  public isSupported(): boolean {
    return !!this.recognition;
  }

  /**
   * Check if currently listening
   */
  public getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Cancel ongoing speech and listening
   */
  public cancelSpeech(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.stopListening();
  }
}

// Export singleton instance
export const speechService = new SpeechService();
