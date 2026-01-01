import { ChassisDefinition } from '@/game/types';

export const CHASSIS: Record<string, ChassisDefinition> = {
  scout: {
    id: 'scout',
    name: 'Scout',
    description: 'Lightning fast but fragile. Perfect for hit-and-run tactics.',
    baseHP: 60,
    baseSpeed: 8,
    weight: 50,
    size: 25,
    weaponSlots: 1,
    tier: 1,
    cost: 0, // Starter
  },
  brawler: {
    id: 'brawler',
    name: 'Brawler',
    description: 'Well-balanced fighter. Good for beginners.',
    baseHP: 100,
    baseSpeed: 5,
    weight: 100,
    size: 35,
    weaponSlots: 2,
    tier: 1,
    cost: 0, // Starter
  },
  tank: {
    id: 'tank',
    name: 'Tank',
    description: 'Slow but incredibly durable. A walking fortress.',
    baseHP: 150,
    baseSpeed: 3,
    weight: 180,
    size: 45,
    weaponSlots: 2,
    tier: 1,
    cost: 0, // Starter
  },
  phantom: {
    id: 'phantom',
    name: 'Phantom',
    description: 'Ultra-light speed demon. Glass cannon extraordinaire.',
    baseHP: 40,
    baseSpeed: 12,
    weight: 30,
    size: 20,
    weaponSlots: 1,
    tier: 2,
    cost: 500,
  },
  juggernaut: {
    id: 'juggernaut',
    name: 'Juggernaut',
    description: 'Massive heavy. Unstoppable force meets immovable object.',
    baseHP: 200,
    baseSpeed: 2,
    weight: 250,
    size: 55,
    weaponSlots: 2,
    tier: 3,
    cost: 1500,
  },
  striker: {
    id: 'striker',
    name: 'Striker',
    description: 'Optimized combat platform. The professional\'s choice.',
    baseHP: 120,
    baseSpeed: 6,
    weight: 120,
    size: 40,
    weaponSlots: 2,
    tier: 3,
    cost: 2000,
  },
};

export const getChassisById = (id: string): ChassisDefinition | undefined => {
  return CHASSIS[id];
};

export const getChassisByTier = (tier: number): ChassisDefinition[] => {
  return Object.values(CHASSIS).filter(c => c.tier === tier);
};
