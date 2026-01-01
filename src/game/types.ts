// Core game types for AI Battlebots

export interface Vector2 {
  x: number;
  y: number;
}

export interface ChassisDefinition {
  id: string;
  name: string;
  description: string;
  baseHP: number;
  baseSpeed: number;
  weight: number;
  size: number; // radius
  weaponSlots: number;
  tier: number;
  cost: number;
}

export interface WeaponDefinition {
  id: string;
  name: string;
  description: string;
  type: 'spinner' | 'flipper' | 'hammer' | 'saw' | 'wedge' | 'flamethrower' | 'emp' | 'grapple' | 'drill' | 'plasma';
  baseDamage: number;
  weight: number;
  cooldown: number; // ms between activations
  tier: number;
  cost: number;
}

export interface ArmorDefinition {
  id: string;
  name: string;
  description: string;
  damageReduction: number; // percentage 0-1
  weight: number;
  tier: number;
  cost: number;
}

export interface BotConfig {
  id: string;
  name: string;
  chassisId: string;
  weaponIds: string[];
  armorId: string | null;
  aiConfig: AIConfig;
  color: string;
  script?: string; // Custom bot script (if undefined, uses aiConfig behaviors)
}

export interface AIConfig {
  primaryBehavior: BehaviorType;
  secondaryBehavior: BehaviorType | null;
  aggression: number; // 0-100
  engagementDistance: number; // preferred distance to target
}

export type BehaviorType = 'aggressive' | 'defensive' | 'flanker' | 'ram' | 'reactive';

export interface BotState {
  id: string;
  config: BotConfig;
  position: Vector2;
  velocity: Vector2;
  angle: number;
  angularVelocity: number;
  hp: number;
  maxHp: number;
  isAlive: boolean;
  weaponCooldowns: Record<string, number>;
}

export interface ArenaConfig {
  id: string;
  name: string;
  width: number;
  height: number;
  wallThickness: number;
  hazards: HazardConfig[];
  backgroundColor: number;
}

export interface HazardConfig {
  type: 'pit' | 'spike' | 'wall';
  position: Vector2;
  size: Vector2;
  damage?: number;
}

export interface GameState {
  arena: ArenaConfig;
  bots: BotState[];
  isRunning: boolean;
  isPaused: boolean;
  winner: string | null;
  timeElapsed: number;
}

export interface DamageEvent {
  attackerId: string;
  targetId: string;
  damage: number;
  knockback: Vector2;
  weaponType: string;
  timestamp: number;
}

export interface CollisionEvent {
  bodyAId: string;
  bodyBId: string;
  velocity: number;
  normal: Vector2;
}
