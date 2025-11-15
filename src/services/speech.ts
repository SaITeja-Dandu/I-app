/**
 * @file services/speech.ts
 * @description Speech recognition and synthesis service with realistic voices
 */

import { ElevenLabsClient } from 'elevenlabs';
import { createLogger } from '../utils/logger';

const logger = createLogger('speech');

// ElevenLabs API configuration
const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
// Available voices: 
// - 'JBFqnCBsd6RMkjVY5Cd5' - Professional Male
// - '21m00Tcm4TlvDq8ikWAM' - George (Deep, mature male)
// - 'EXAVITQu4vr4xnSDxMaL' - Bella (Professional female)
// - 'XrExE9yKIg1WjnnlVkGv' - Elli (Young female)
// - 'TxGEqnHWrfWFTfGW9XjX' - James (British male)
// - 'MF3mGyEYCHXYVTw9XA0e' - Gigi (Friendly female)
const ELEVENLABS_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Professional Female voice

let elevenLabsClient: ElevenLabsClient | null = null;

// Initialize ElevenLabs client if API key is available
if (ELEVENLABS_API_KEY && ELEVENLABS_API_KEY !== 'your_elevenlabs_api_key_here') {
  try {
    elevenLabsClient = new ElevenLabsClient({
      apiKey: ELEVENLABS_API_KEY,
    });
    logger.info('ElevenLabs client initialized successfully');
  } catch (error) {
    logger.error({ error }, 'Failed to initialize ElevenLabs client');
  }
}

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
   * Speak text aloud using ElevenLabs API for realistic voice
   */
  public async speak(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Cancel any ongoing playback
        this.cancelSpeech();

        if (elevenLabsClient) {
          // Use ElevenLabs API
          this.speakWithElevenLabs(text, resolve, reject);
        } else {
          // Fallback to browser TTS
          logger.warn('ElevenLabs API key not configured, using browser speech');
          this.speakWithBrowserTTS(text, resolve, reject);
        }
      } catch (error) {
        logger.error({ error }, 'Failed to speak');
        reject(error);
      }
    });
  }

  /**
   * Speak using ElevenLabs SDK
   */
  private async speakWithElevenLabs(
    text: string,
    resolve: () => void,
    reject: (error: Error) => void
  ): Promise<void> {
    try {
      if (!elevenLabsClient) {
        throw new Error('ElevenLabs client not initialized');
      }

      logger.info(`Converting text to speech with ElevenLabs (${text.substring(0, 50)}...)`);

      const audio = await elevenLabsClient.textToSpeech.convert(
        ELEVENLABS_VOICE_ID,
        {
          text,
          model_id: 'eleven_multilingual_v2',
          output_format: 'mp3_44100_128',
        }
      );

      // Handle different response types from ElevenLabs SDK
      let audioBlob: Blob;
      
      if (audio instanceof Blob) {
        audioBlob = audio;
      } else if (audio instanceof ArrayBuffer) {
        audioBlob = new Blob([audio], { type: 'audio/mpeg' });
      } else if (audio instanceof ReadableStream) {
        // Convert stream to blob
        const reader = audio.getReader();
        const chunks: Uint8Array[] = [];
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
        
        const concatenated = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          concatenated.set(chunk, offset);
          offset += chunk.length;
        }
        
        audioBlob = new Blob([concatenated], { type: 'audio/mpeg' });
      } else {
        throw new Error(`Unexpected response type from ElevenLabs API: ${typeof audio}`);
      }

      // Convert blob to URL and play
      const audioUrl = URL.createObjectURL(audioBlob);
      this.currentAudio = new Audio(audioUrl);

      this.currentAudio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        logger.info('Speech playback ended');
        resolve();
      };

      this.currentAudio.onerror = (event: any) => {
        URL.revokeObjectURL(audioUrl);
        logger.error({ error: event }, 'Audio playback error');
        reject(new Error('Audio playback failed'));
      };

      this.currentAudio.play().catch((error) => {
        logger.error({ error }, 'Failed to play audio');
        reject(error);
      });
    } catch (error) {
      logger.error({ error }, 'ElevenLabs API call failed');
      // Fallback to browser TTS
      this.speakWithBrowserTTS(text, resolve, reject);
    }
  }

  /**
   * Fallback: Speak using browser's native text-to-speech
   */
  private speakWithBrowserTTS(
    text: string,
    resolve: () => void,
    reject: (error: Error) => void
  ): void {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onend = () => {
        logger.info('Browser TTS ended');
        resolve();
      };

      utterance.onerror = (event) => {
        logger.error({ error: event }, 'Browser TTS error');
        reject(new Error(`Speech error: ${event.error}`));
      };

      window.speechSynthesis.speak(utterance);
    } catch (error) {
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
