import { BotState, GameState, Vector2 } from '@/game/types';

// Frame data captured every game tick
export interface ReplayFrame {
  timestamp: number;
  bots: BotSnapshot[];
  events: GameEvent[];
}

export interface BotSnapshot {
  id: string;
  position: Vector2;
  velocity: Vector2;
  angle: number;
  hp: number;
  maxHp: number;
  isAlive: boolean;
  currentAction?: string; // For scripted bots, what action they're executing
  matchedRule?: string; // For scripted bots, which rule matched
}

export interface GameEvent {
  type: 'damage' | 'collision' | 'weapon_fire' | 'death' | 'action_change';
  timestamp: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export interface ReplayData {
  id: string;
  createdAt: number;
  duration: number;
  arena: string;
  bots: ReplayBotInfo[];
  frames: ReplayFrame[];
  winner: string | null;
  frameRate: number; // frames per second used during recording
}

export interface ReplayBotInfo {
  id: string;
  name: string;
  color: string;
  chassisId: string;
  weaponIds: string[];
  armorId: string | null;
  hasScript: boolean;
}

export class ReplayRecorder {
  private frames: ReplayFrame[] = [];
  private currentEvents: GameEvent[] = [];
  private startTime: number = 0;
  private isRecording: boolean = false;
  private frameRate: number = 60;
  private lastFrameTime: number = 0;
  private minFrameInterval: number;

  constructor(frameRate: number = 60) {
    this.frameRate = frameRate;
    this.minFrameInterval = 1000 / frameRate;
  }

  start(): void {
    this.frames = [];
    this.currentEvents = [];
    this.startTime = Date.now();
    this.lastFrameTime = 0;
    this.isRecording = true;
  }

  stop(): void {
    this.isRecording = false;
  }

  recordEvent(event: Omit<GameEvent, 'timestamp'>): void {
    if (!this.isRecording) return;

    this.currentEvents.push({
      ...event,
      timestamp: Date.now() - this.startTime,
    });
  }

  recordFrame(bots: BotState[], actionInfo?: Map<string, { action: string; rule?: string }>): void {
    if (!this.isRecording) return;

    const now = Date.now();
    const elapsed = now - this.startTime;

    // Throttle frame recording to target framerate
    if (elapsed - this.lastFrameTime < this.minFrameInterval) {
      return;
    }
    this.lastFrameTime = elapsed;

    const botSnapshots: BotSnapshot[] = bots.map((bot) => {
      const info = actionInfo?.get(bot.id);
      return {
        id: bot.id,
        position: { ...bot.position },
        velocity: { ...bot.velocity },
        angle: bot.angle,
        hp: bot.hp,
        maxHp: bot.maxHp,
        isAlive: bot.isAlive,
        currentAction: info?.action,
        matchedRule: info?.rule,
      };
    });

    this.frames.push({
      timestamp: elapsed,
      bots: botSnapshots,
      events: [...this.currentEvents],
    });

    this.currentEvents = [];
  }

  finalize(
    arenaId: string,
    botConfigs: ReplayBotInfo[],
    winner: string | null
  ): ReplayData {
    const duration = this.frames.length > 0
      ? this.frames[this.frames.length - 1].timestamp
      : 0;

    return {
      id: `replay-${Date.now()}`,
      createdAt: this.startTime,
      duration,
      arena: arenaId,
      bots: botConfigs,
      frames: this.frames,
      winner,
      frameRate: this.frameRate,
    };
  }

  getFrameCount(): number {
    return this.frames.length;
  }
}

export class ReplayPlayer {
  private replay: ReplayData;
  private currentFrameIndex: number = 0;
  private isPlaying: boolean = false;
  private playbackSpeed: number = 1;
  private lastUpdateTime: number = 0;
  private accumulatedTime: number = 0;
  private onFrameChange?: (frame: ReplayFrame, index: number) => void;
  private onPlaybackEnd?: () => void;
  private animationFrameId: number | null = null;

  constructor(replay: ReplayData) {
    this.replay = replay;
  }

  setOnFrameChange(callback: (frame: ReplayFrame, index: number) => void): void {
    this.onFrameChange = callback;
  }

  setOnPlaybackEnd(callback: () => void): void {
    this.onPlaybackEnd = callback;
  }

  play(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.lastUpdateTime = performance.now();
    this.tick();
  }

  pause(): void {
    this.isPlaying = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  stop(): void {
    this.pause();
    this.currentFrameIndex = 0;
    this.accumulatedTime = 0;
    this.emitFrame();
  }

  setPlaybackSpeed(speed: number): void {
    this.playbackSpeed = Math.max(0.25, Math.min(4, speed));
  }

  getPlaybackSpeed(): number {
    return this.playbackSpeed;
  }

  seekToFrame(index: number): void {
    this.currentFrameIndex = Math.max(0, Math.min(index, this.replay.frames.length - 1));
    this.accumulatedTime = this.replay.frames[this.currentFrameIndex]?.timestamp || 0;
    this.emitFrame();
  }

  seekToTime(timeMs: number): void {
    // Find the frame closest to the target time
    let targetIndex = 0;
    for (let i = 0; i < this.replay.frames.length; i++) {
      if (this.replay.frames[i].timestamp <= timeMs) {
        targetIndex = i;
      } else {
        break;
      }
    }
    this.seekToFrame(targetIndex);
  }

  stepForward(): void {
    if (this.currentFrameIndex < this.replay.frames.length - 1) {
      this.currentFrameIndex++;
      this.accumulatedTime = this.replay.frames[this.currentFrameIndex].timestamp;
      this.emitFrame();
    }
  }

  stepBackward(): void {
    if (this.currentFrameIndex > 0) {
      this.currentFrameIndex--;
      this.accumulatedTime = this.replay.frames[this.currentFrameIndex].timestamp;
      this.emitFrame();
    }
  }

  getCurrentFrame(): ReplayFrame | null {
    return this.replay.frames[this.currentFrameIndex] || null;
  }

  getCurrentFrameIndex(): number {
    return this.currentFrameIndex;
  }

  getTotalFrames(): number {
    return this.replay.frames.length;
  }

  getDuration(): number {
    return this.replay.duration;
  }

  getCurrentTime(): number {
    return this.accumulatedTime;
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  getReplayData(): ReplayData {
    return this.replay;
  }

  private tick = (): void => {
    if (!this.isPlaying) return;

    const now = performance.now();
    const deltaTime = (now - this.lastUpdateTime) * this.playbackSpeed;
    this.lastUpdateTime = now;
    this.accumulatedTime += deltaTime;

    // Find the frame that corresponds to current accumulated time
    while (
      this.currentFrameIndex < this.replay.frames.length - 1 &&
      this.replay.frames[this.currentFrameIndex + 1].timestamp <= this.accumulatedTime
    ) {
      this.currentFrameIndex++;
    }

    this.emitFrame();

    // Check if we've reached the end
    if (this.currentFrameIndex >= this.replay.frames.length - 1) {
      this.pause();
      this.onPlaybackEnd?.();
      return;
    }

    this.animationFrameId = requestAnimationFrame(this.tick);
  };

  private emitFrame(): void {
    const frame = this.replay.frames[this.currentFrameIndex];
    if (frame && this.onFrameChange) {
      this.onFrameChange(frame, this.currentFrameIndex);
    }
  }

  destroy(): void {
    this.pause();
    this.onFrameChange = undefined;
    this.onPlaybackEnd = undefined;
  }
}

// Local storage for replays
const REPLAY_STORAGE_KEY = 'ai-battlebots-replays';
const MAX_STORED_REPLAYS = 20;

export function saveReplay(replay: ReplayData): void {
  const replays = loadReplays();

  // Add new replay at the beginning
  replays.unshift(replay);

  // Keep only the latest replays
  while (replays.length > MAX_STORED_REPLAYS) {
    replays.pop();
  }

  try {
    localStorage.setItem(REPLAY_STORAGE_KEY, JSON.stringify(replays));
  } catch (e) {
    // Storage full - remove oldest replays
    console.warn('Storage full, removing old replays');
    while (replays.length > 5) {
      replays.pop();
    }
    try {
      localStorage.setItem(REPLAY_STORAGE_KEY, JSON.stringify(replays));
    } catch {
      console.error('Failed to save replay');
    }
  }
}

export function loadReplays(): ReplayData[] {
  try {
    const data = localStorage.getItem(REPLAY_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load replays:', e);
  }
  return [];
}

export function deleteReplay(replayId: string): void {
  const replays = loadReplays();
  const filtered = replays.filter(r => r.id !== replayId);
  localStorage.setItem(REPLAY_STORAGE_KEY, JSON.stringify(filtered));
}

export function getReplayById(replayId: string): ReplayData | null {
  const replays = loadReplays();
  return replays.find(r => r.id === replayId) || null;
}
