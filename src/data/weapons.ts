import { WeaponDefinition } from '@/game/types';

export const WEAPONS: Record<string, WeaponDefinition> = {
  // Spinners - continuous damage on contact
  miniSpinner: {
    id: 'miniSpinner',
    name: 'Mini Spinner',
    description: 'Small but deadly rotating blade.',
    type: 'spinner',
    baseDamage: 8,
    weight: 15,
    cooldown: 100, // Continuous
    tier: 1,
    cost: 0, // Starter
  },
  deathBlossom: {
    id: 'deathBlossom',
    name: 'Death Blossom',
    description: 'Full-body spinner. You ARE the weapon.',
    type: 'spinner',
    baseDamage: 15,
    weight: 30,
    cooldown: 100,
    tier: 2,
    cost: 800,
  },

  // Flippers - launch enemies
  basicFlipper: {
    id: 'basicFlipper',
    name: 'Basic Flipper',
    description: 'Pneumatic flipper. Send them flying!',
    type: 'flipper',
    baseDamage: 5,
    weight: 20,
    cooldown: 2000,
    tier: 1,
    cost: 0, // Starter
  },
  skyLauncher: {
    id: 'skyLauncher',
    name: 'Sky Launcher',
    description: 'Maximum lift. Touch the ceiling.',
    type: 'flipper',
    baseDamage: 8,
    weight: 35,
    cooldown: 2500,
    tier: 2,
    cost: 600,
  },

  // Hammers - overhead smash
  spikeHammer: {
    id: 'spikeHammer',
    name: 'Spike Hammer',
    description: 'Pneumatic spike. Precise and punishing.',
    type: 'hammer',
    baseDamage: 20,
    weight: 25,
    cooldown: 3000,
    tier: 1,
    cost: 0, // Starter
  },
  mjolnir: {
    id: 'mjolnir',
    name: 'Mjolnir',
    description: 'Legendary hammer. Worthy opponents only.',
    type: 'hammer',
    baseDamage: 35,
    weight: 45,
    cooldown: 4000,
    tier: 3,
    cost: 1500,
  },

  // Saws - front-mounted cutting
  buzzSaw: {
    id: 'buzzSaw',
    name: 'Buzz Saw',
    description: 'Horizontal cutting disc. Slice and dice.',
    type: 'saw',
    baseDamage: 12,
    weight: 20,
    cooldown: 500,
    tier: 1,
    cost: 200,
  },
  circularDoom: {
    id: 'circularDoom',
    name: 'Circular Doom',
    description: 'Massive vertical saw. Splits bots in half.',
    type: 'saw',
    baseDamage: 25,
    weight: 40,
    cooldown: 800,
    tier: 3,
    cost: 1200,
  },

  // Wedges - defensive, redirect enemies
  basicWedge: {
    id: 'basicWedge',
    name: 'Basic Wedge',
    description: 'Low-profile wedge. Get under them.',
    type: 'wedge',
    baseDamage: 3,
    weight: 10,
    cooldown: 0, // Passive
    tier: 1,
    cost: 0, // Starter
  },
  razorWedge: {
    id: 'razorWedge',
    name: 'Razor Wedge',
    description: 'Sharpened edges. Flip AND damage.',
    type: 'wedge',
    baseDamage: 8,
    weight: 15,
    cooldown: 0,
    tier: 2,
    cost: 400,
  },

  // Flamethrowers - area damage over time
  miniTorch: {
    id: 'miniTorch',
    name: 'Mini Torch',
    description: 'Compact flamethrower. Burns hot and fast.',
    type: 'flamethrower',
    baseDamage: 6,
    weight: 18,
    cooldown: 200,
    tier: 2,
    cost: 500,
  },
  inferno: {
    id: 'inferno',
    name: 'Inferno',
    description: 'Industrial flamethrower. Melt your enemies.',
    type: 'flamethrower',
    baseDamage: 12,
    weight: 35,
    cooldown: 150,
    tier: 3,
    cost: 1800,
  },

  // EMP - disables enemy movement temporarily
  shockPulse: {
    id: 'shockPulse',
    name: 'Shock Pulse',
    description: 'EMP burst. Briefly stuns opponents.',
    type: 'emp',
    baseDamage: 3,
    weight: 22,
    cooldown: 5000,
    tier: 2,
    cost: 700,
  },
  blackout: {
    id: 'blackout',
    name: 'Blackout',
    description: 'Massive EMP. Complete system shutdown.',
    type: 'emp',
    baseDamage: 5,
    weight: 40,
    cooldown: 8000,
    tier: 4,
    cost: 2500,
  },

  // Grapple - pulls enemies closer
  hookShot: {
    id: 'hookShot',
    name: 'Hook Shot',
    description: 'Grappling hook. Bring them to you.',
    type: 'grapple',
    baseDamage: 4,
    weight: 20,
    cooldown: 3000,
    tier: 2,
    cost: 600,
  },
  titanGrip: {
    id: 'titanGrip',
    name: 'Titan Grip',
    description: 'Industrial grabber. No escape.',
    type: 'grapple',
    baseDamage: 8,
    weight: 45,
    cooldown: 4000,
    tier: 3,
    cost: 1600,
  },

  // Drill - piercing damage, ignores some armor
  combatDrill: {
    id: 'combatDrill',
    name: 'Combat Drill',
    description: 'Armor-piercing drill. No defense.',
    type: 'drill',
    baseDamage: 18,
    weight: 28,
    cooldown: 1500,
    tier: 2,
    cost: 900,
  },
  coreBreaker: {
    id: 'coreBreaker',
    name: 'Core Breaker',
    description: 'Diamond-tipped mega drill. Unstoppable.',
    type: 'drill',
    baseDamage: 30,
    weight: 50,
    cooldown: 2000,
    tier: 4,
    cost: 2800,
  },

  // Plasma - high damage energy weapon
  plasmaBlaster: {
    id: 'plasmaBlaster',
    name: 'Plasma Blaster',
    description: 'Superheated plasma bolt. Devastating.',
    type: 'plasma',
    baseDamage: 22,
    weight: 25,
    cooldown: 2500,
    tier: 3,
    cost: 1400,
  },
  novaCore: {
    id: 'novaCore',
    name: 'Nova Core',
    description: 'Experimental plasma cannon. Obliteration.',
    type: 'plasma',
    baseDamage: 40,
    weight: 55,
    cooldown: 4000,
    tier: 4,
    cost: 3500,
  },
};

export const getWeaponById = (id: string): WeaponDefinition | undefined => {
  return WEAPONS[id];
};

export const getWeaponsByType = (type: WeaponDefinition['type']): WeaponDefinition[] => {
  return Object.values(WEAPONS).filter(w => w.type === type);
};

export const getWeaponsByTier = (tier: number): WeaponDefinition[] => {
  return Object.values(WEAPONS).filter(w => w.tier === tier);
};
