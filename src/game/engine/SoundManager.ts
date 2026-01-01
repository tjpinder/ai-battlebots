// Sound Manager using Web Audio API for synthesized sounds
// No external audio files needed - all sounds are generated

type SoundType =
  | 'collision'
  | 'wallHit'
  | 'spinnerHit'
  | 'hammerHit'
  | 'flipperHit'
  | 'sawHit'
  | 'explosion'
  | 'victory'
  | 'defeat'
  | 'battleStart'
  | 'menuClick'
  | 'purchase'
  | 'levelUp';

class SoundManagerClass {
  private audioContext: AudioContext | null = null;
  private masterVolume = 0.5;
  private soundEnabled = true;
  private musicEnabled = true;

  private getContext(): AudioContext | null {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn('Web Audio API not supported');
        return null;
      }
    }
    return this.audioContext;
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.3,
    attack: number = 0.01,
    decay: number = 0.1
  ): void {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    // ADSR envelope
    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume * this.masterVolume, now + attack);
    gainNode.gain.linearRampToValueAtTime(volume * this.masterVolume * 0.7, now + attack + decay);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);

    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  private playNoise(duration: number, volume: number = 0.2): void {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    noise.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(volume * this.masterVolume, now);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);

    noise.start(now);
    noise.stop(now + duration);
  }

  play(sound: SoundType): void {
    if (!this.soundEnabled) return;

    switch (sound) {
      case 'collision':
        // Metal clang
        this.playTone(200, 0.15, 'triangle', 0.4);
        this.playTone(350, 0.1, 'square', 0.2);
        this.playNoise(0.08, 0.3);
        break;

      case 'wallHit':
        // Thud with metallic ring
        this.playTone(150, 0.12, 'triangle', 0.3);
        this.playNoise(0.05, 0.2);
        break;

      case 'spinnerHit':
        // Grinding metal
        this.playTone(800, 0.08, 'sawtooth', 0.15);
        this.playTone(1200, 0.06, 'sawtooth', 0.1);
        this.playNoise(0.1, 0.2);
        break;

      case 'hammerHit':
        // Heavy impact
        this.playTone(80, 0.2, 'triangle', 0.5);
        this.playTone(120, 0.15, 'square', 0.3);
        this.playNoise(0.1, 0.4);
        break;

      case 'flipperHit':
        // Pneumatic whoosh
        this.playTone(400, 0.1, 'sine', 0.2);
        this.playTone(600, 0.15, 'sine', 0.15);
        this.playNoise(0.08, 0.15);
        break;

      case 'sawHit':
        // Buzzing cut
        this.playTone(600, 0.12, 'sawtooth', 0.2);
        this.playTone(900, 0.08, 'sawtooth', 0.15);
        break;

      case 'explosion':
        // Big boom
        this.playTone(60, 0.4, 'triangle', 0.6);
        this.playTone(40, 0.5, 'sine', 0.4);
        this.playNoise(0.3, 0.5);
        setTimeout(() => this.playNoise(0.2, 0.3), 100);
        break;

      case 'victory':
        // Triumphant fanfare
        this.playTone(523, 0.2, 'sine', 0.3); // C
        setTimeout(() => this.playTone(659, 0.2, 'sine', 0.3), 150); // E
        setTimeout(() => this.playTone(784, 0.3, 'sine', 0.4), 300); // G
        setTimeout(() => this.playTone(1047, 0.5, 'sine', 0.5), 500); // High C
        break;

      case 'defeat':
        // Sad descending tones
        this.playTone(400, 0.3, 'sine', 0.3);
        setTimeout(() => this.playTone(350, 0.3, 'sine', 0.25), 200);
        setTimeout(() => this.playTone(300, 0.4, 'sine', 0.2), 400);
        setTimeout(() => this.playTone(200, 0.5, 'sine', 0.15), 600);
        break;

      case 'battleStart':
        // Epic horn
        this.playTone(220, 0.15, 'sawtooth', 0.3);
        this.playTone(330, 0.15, 'sawtooth', 0.25);
        this.playTone(440, 0.3, 'sawtooth', 0.35);
        break;

      case 'menuClick':
        // UI click
        this.playTone(800, 0.05, 'sine', 0.2);
        break;

      case 'purchase':
        // Cash register cha-ching
        this.playTone(1200, 0.08, 'sine', 0.3);
        setTimeout(() => this.playTone(1500, 0.1, 'sine', 0.35), 80);
        break;

      case 'levelUp':
        // Ascending celebration
        this.playTone(440, 0.1, 'sine', 0.3);
        setTimeout(() => this.playTone(550, 0.1, 'sine', 0.3), 100);
        setTimeout(() => this.playTone(660, 0.1, 'sine', 0.3), 200);
        setTimeout(() => this.playTone(880, 0.2, 'sine', 0.4), 300);
        break;
    }
  }

  setVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  getVolume(): number {
    return this.masterVolume;
  }

  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
  }

  isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
  }

  isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  // Resume audio context (needed after user interaction on some browsers)
  resume(): void {
    const ctx = this.getContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  }
}

// Singleton export
export const SoundManager = new SoundManagerClass();
