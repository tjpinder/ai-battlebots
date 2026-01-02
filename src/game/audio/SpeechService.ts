import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

// Voice configurations for our commentators
const VOICE_CONFIG = {
  chuck: {
    name: 'en-US-DavisNeural', // Confident, energetic sportscaster
    style: 'excited',
    rate: '+10%',
    pitch: '+5%',
  },
  frank: {
    name: 'en-US-JasonNeural', // Casual, gruff character voice
    style: 'cheerful',
    rate: '+5%',
    pitch: '-10%',
  },
};

class SpeechServiceClass {
  private synthesizer: sdk.SpeechSynthesizer | null = null;
  private audioContext: AudioContext | null = null;
  private isInitialized: boolean = false;
  private isMuted: boolean = false;
  private volume: number = 1.0;
  private speechQueue: Array<{ text: string; speaker: 'chuck' | 'frank' }> = [];
  private isSpeaking: boolean = false;
  private enabled: boolean = true;

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    const key = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY;
    const region = process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION;

    if (!key || !region) {
      console.warn('Azure Speech credentials not configured. Voice commentary disabled.');
      this.enabled = false;
      return false;
    }

    try {
      const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
      speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

      // Use default speaker output
      const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();
      this.synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

      this.isInitialized = true;
      console.log('Azure Speech Service initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize Azure Speech:', error);
      this.enabled = false;
      return false;
    }
  }

  private buildSSML(text: string, speaker: 'chuck' | 'frank'): string {
    const config = VOICE_CONFIG[speaker];

    // Build SSML for expressive speech
    return `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"
             xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">
        <voice name="${config.name}">
          <mstts:express-as style="${config.style}">
            <prosody rate="${config.rate}" pitch="${config.pitch}">
              ${this.escapeXml(text)}
            </prosody>
          </mstts:express-as>
        </voice>
      </speak>
    `.trim();
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  async speak(text: string, speaker: 'chuck' | 'frank' | 'both'): Promise<void> {
    if (!this.enabled || this.isMuted || !text) return;

    // For 'both', just use chuck's voice
    const actualSpeaker = speaker === 'both' ? 'chuck' : speaker;

    // Add to queue
    this.speechQueue.push({ text, speaker: actualSpeaker });

    // Process queue if not already speaking
    if (!this.isSpeaking) {
      await this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isSpeaking || this.speechQueue.length === 0) return;

    this.isSpeaking = true;

    while (this.speechQueue.length > 0) {
      const item = this.speechQueue.shift();
      if (!item) break;

      await this.speakImmediate(item.text, item.speaker);
    }

    this.isSpeaking = false;
  }

  private async speakImmediate(text: string, speaker: 'chuck' | 'frank'): Promise<void> {
    if (!this.synthesizer || !this.enabled) return;

    return new Promise((resolve) => {
      const ssml = this.buildSSML(text, speaker);

      this.synthesizer!.speakSsmlAsync(
        ssml,
        (result) => {
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            // Successfully synthesized
          } else if (result.reason === sdk.ResultReason.Canceled) {
            const cancellation = sdk.CancellationDetails.fromResult(result);
            console.warn('Speech synthesis canceled:', cancellation.reason);
          }
          resolve();
        },
        (error) => {
          console.error('Speech synthesis error:', error);
          resolve();
        }
      );
    });
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.stop();
    }
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  getVolume(): number {
    return this.volume;
  }

  stop(): void {
    this.speechQueue = [];
    // Note: Azure SDK doesn't have a clean way to stop mid-speech
    // The current utterance will complete, but queue is cleared
  }

  isEnabled(): boolean {
    return this.enabled && this.isInitialized;
  }

  destroy(): void {
    if (this.synthesizer) {
      this.synthesizer.close();
      this.synthesizer = null;
    }
    this.isInitialized = false;
  }
}

// Singleton instance
export const SpeechService = new SpeechServiceClass();
