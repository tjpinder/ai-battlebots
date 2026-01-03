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
  private speechConfig: sdk.SpeechConfig | null = null;
  private audioContext: AudioContext | null = null;
  private isInitialized: boolean = false;
  private isMuted: boolean = false;
  private volume: number = 1.0;
  private speechQueue: Array<{ text: string; speaker: 'chuck' | 'frank' }> = [];
  private isSpeaking: boolean = false;
  private enabled: boolean = true;
  private gainNode: GainNode | null = null;
  private currentSource: AudioBufferSourceNode | null = null;

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
      this.speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
      // Use WAV format - widely supported by Web Audio API
      this.speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Riff16Khz16BitMonoPcm;

      // Initialize Web Audio API
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = this.volume;

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
    if (!this.speechConfig || !this.audioContext || !this.gainNode || !this.enabled) return;

    // Resume audio context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    return new Promise((resolve) => {
      const ssml = this.buildSSML(text, speaker);

      // Create a synthesizer without audio output - we'll handle playback ourselves
      const synthesizer = new sdk.SpeechSynthesizer(this.speechConfig!, undefined as unknown as sdk.AudioConfig);

      synthesizer.speakSsmlAsync(
        ssml,
        async (result) => {
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted && result.audioData) {
            try {
              // Decode the WAV audio data
              const audioBuffer = await this.audioContext!.decodeAudioData(result.audioData.slice(0));

              // Play through Web Audio API
              await this.playAudioBuffer(audioBuffer);
            } catch (error) {
              console.error('Failed to decode/play audio:', error);
            }
          } else if (result.reason === sdk.ResultReason.Canceled) {
            const cancellation = sdk.CancellationDetails.fromResult(result);
            console.warn('Speech synthesis canceled:', cancellation.reason, cancellation.errorDetails);
          }
          synthesizer.close();
          resolve();
        },
        (error) => {
          console.error('Speech synthesis error:', error);
          synthesizer.close();
          resolve();
        }
      );
    });
  }

  private playAudioBuffer(audioBuffer: AudioBuffer): Promise<void> {
    return new Promise((resolve) => {
      if (!this.audioContext || !this.gainNode) {
        resolve();
        return;
      }

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.gainNode);

      this.currentSource = source;

      source.onended = () => {
        this.currentSource = null;
        resolve();
      };

      source.start(0);
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
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume;
    }
  }

  getVolume(): number {
    return this.volume;
  }

  stop(): void {
    this.speechQueue = [];
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {
        // Already stopped
      }
      this.currentSource = null;
    }
  }

  isEnabled(): boolean {
    return this.enabled && this.isInitialized;
  }

  destroy(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.gainNode = null;
    this.speechConfig = null;
    this.isInitialized = false;
  }
}

// Singleton instance
export const SpeechService = new SpeechServiceClass();
