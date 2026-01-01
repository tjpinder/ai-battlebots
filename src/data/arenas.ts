import { ArenaConfig } from '@/game/types';

export const ARENAS: Record<string, ArenaConfig> = {
  // Starter arena - no hazards
  basicPit: {
    id: 'basicPit',
    name: 'The Pit',
    width: 800,
    height: 600,
    wallThickness: 20,
    hazards: [],
    backgroundColor: 0x1a1a2e,
  },

  // Center pit arena
  warzone: {
    id: 'warzone',
    name: 'Warzone',
    width: 900,
    height: 700,
    wallThickness: 25,
    hazards: [
      {
        type: 'pit',
        position: { x: 450, y: 350 },
        size: { x: 100, y: 100 },
      },
    ],
    backgroundColor: 0x0f0f23,
  },

  // Four corner pits + center spikes
  thunderdome: {
    id: 'thunderdome',
    name: 'Thunderdome',
    width: 1000,
    height: 800,
    wallThickness: 30,
    hazards: [
      {
        type: 'pit',
        position: { x: 200, y: 200 },
        size: { x: 60, y: 60 },
      },
      {
        type: 'pit',
        position: { x: 800, y: 200 },
        size: { x: 60, y: 60 },
      },
      {
        type: 'pit',
        position: { x: 200, y: 600 },
        size: { x: 60, y: 60 },
      },
      {
        type: 'pit',
        position: { x: 800, y: 600 },
        size: { x: 60, y: 60 },
      },
      {
        type: 'spike',
        position: { x: 500, y: 400 },
        size: { x: 100, y: 100 },
        damage: 5,
      },
    ],
    backgroundColor: 0x16213e,
  },

  // Narrow corridor with spikes on sides
  gauntlet: {
    id: 'gauntlet',
    name: 'The Gauntlet',
    width: 1200,
    height: 500,
    wallThickness: 25,
    hazards: [
      // Top spike strips
      { type: 'spike', position: { x: 300, y: 100 }, size: { x: 150, y: 40 }, damage: 3 },
      { type: 'spike', position: { x: 600, y: 100 }, size: { x: 150, y: 40 }, damage: 3 },
      { type: 'spike', position: { x: 900, y: 100 }, size: { x: 150, y: 40 }, damage: 3 },
      // Bottom spike strips
      { type: 'spike', position: { x: 300, y: 400 }, size: { x: 150, y: 40 }, damage: 3 },
      { type: 'spike', position: { x: 600, y: 400 }, size: { x: 150, y: 40 }, damage: 3 },
      { type: 'spike', position: { x: 900, y: 400 }, size: { x: 150, y: 40 }, damage: 3 },
      // Center pit
      { type: 'pit', position: { x: 600, y: 250 }, size: { x: 80, y: 80 } },
    ],
    backgroundColor: 0x1a0a0a,
  },

  // Ring of fire - center safe, edges deadly
  inferno: {
    id: 'inferno',
    name: 'Inferno Ring',
    width: 900,
    height: 900,
    wallThickness: 30,
    hazards: [
      // Ring of spikes around edge
      { type: 'spike', position: { x: 150, y: 150 }, size: { x: 80, y: 80 }, damage: 4 },
      { type: 'spike', position: { x: 450, y: 100 }, size: { x: 100, y: 60 }, damage: 4 },
      { type: 'spike', position: { x: 750, y: 150 }, size: { x: 80, y: 80 }, damage: 4 },
      { type: 'spike', position: { x: 100, y: 450 }, size: { x: 60, y: 100 }, damage: 4 },
      { type: 'spike', position: { x: 800, y: 450 }, size: { x: 60, y: 100 }, damage: 4 },
      { type: 'spike', position: { x: 150, y: 750 }, size: { x: 80, y: 80 }, damage: 4 },
      { type: 'spike', position: { x: 450, y: 800 }, size: { x: 100, y: 60 }, damage: 4 },
      { type: 'spike', position: { x: 750, y: 750 }, size: { x: 80, y: 80 }, damage: 4 },
    ],
    backgroundColor: 0x2a1010,
  },

  // Pit maze
  abyss: {
    id: 'abyss',
    name: 'The Abyss',
    width: 1000,
    height: 800,
    wallThickness: 25,
    hazards: [
      // Many small pits
      { type: 'pit', position: { x: 250, y: 200 }, size: { x: 70, y: 70 } },
      { type: 'pit', position: { x: 500, y: 200 }, size: { x: 70, y: 70 } },
      { type: 'pit', position: { x: 750, y: 200 }, size: { x: 70, y: 70 } },
      { type: 'pit', position: { x: 375, y: 400 }, size: { x: 70, y: 70 } },
      { type: 'pit', position: { x: 625, y: 400 }, size: { x: 70, y: 70 } },
      { type: 'pit', position: { x: 250, y: 600 }, size: { x: 70, y: 70 } },
      { type: 'pit', position: { x: 500, y: 600 }, size: { x: 70, y: 70 } },
      { type: 'pit', position: { x: 750, y: 600 }, size: { x: 70, y: 70 } },
    ],
    backgroundColor: 0x050510,
  },

  // Large arena for tournaments
  colosseum: {
    id: 'colosseum',
    name: 'The Colosseum',
    width: 1200,
    height: 900,
    wallThickness: 35,
    hazards: [
      // Corner pits
      { type: 'pit', position: { x: 150, y: 150 }, size: { x: 80, y: 80 } },
      { type: 'pit', position: { x: 1050, y: 150 }, size: { x: 80, y: 80 } },
      { type: 'pit', position: { x: 150, y: 750 }, size: { x: 80, y: 80 } },
      { type: 'pit', position: { x: 1050, y: 750 }, size: { x: 80, y: 80 } },
      // Center hazard cluster
      { type: 'spike', position: { x: 550, y: 400 }, size: { x: 60, y: 60 }, damage: 5 },
      { type: 'spike', position: { x: 650, y: 400 }, size: { x: 60, y: 60 }, damage: 5 },
      { type: 'spike', position: { x: 550, y: 500 }, size: { x: 60, y: 60 }, damage: 5 },
      { type: 'spike', position: { x: 650, y: 500 }, size: { x: 60, y: 60 }, damage: 5 },
      // Side pits
      { type: 'pit', position: { x: 600, y: 150 }, size: { x: 100, y: 60 } },
      { type: 'pit', position: { x: 600, y: 750 }, size: { x: 100, y: 60 } },
    ],
    backgroundColor: 0x15151f,
  },

  // Tiny arena - close quarters combat
  cage: {
    id: 'cage',
    name: 'The Cage',
    width: 500,
    height: 500,
    wallThickness: 20,
    hazards: [
      { type: 'spike', position: { x: 250, y: 250 }, size: { x: 50, y: 50 }, damage: 6 },
    ],
    backgroundColor: 0x1a1a1a,
  },

  // Premium arena - complex layout
  oblivion: {
    id: 'oblivion',
    name: 'Oblivion',
    width: 1100,
    height: 850,
    wallThickness: 30,
    hazards: [
      // Outer ring of pits
      { type: 'pit', position: { x: 200, y: 200 }, size: { x: 50, y: 50 } },
      { type: 'pit', position: { x: 550, y: 120 }, size: { x: 50, y: 50 } },
      { type: 'pit', position: { x: 900, y: 200 }, size: { x: 50, y: 50 } },
      { type: 'pit', position: { x: 200, y: 650 }, size: { x: 50, y: 50 } },
      { type: 'pit', position: { x: 550, y: 730 }, size: { x: 50, y: 50 } },
      { type: 'pit', position: { x: 900, y: 650 }, size: { x: 50, y: 50 } },
      // Inner spike cross
      { type: 'spike', position: { x: 550, y: 425 }, size: { x: 120, y: 40 }, damage: 4 },
      { type: 'spike', position: { x: 550, y: 425 }, size: { x: 40, y: 120 }, damage: 4 },
      // Corner danger zones
      { type: 'spike', position: { x: 150, y: 425 }, size: { x: 40, y: 150 }, damage: 3 },
      { type: 'spike', position: { x: 950, y: 425 }, size: { x: 40, y: 150 }, damage: 3 },
    ],
    backgroundColor: 0x0a0a15,
  },
};

export const getArenaById = (id: string): ArenaConfig | undefined => {
  return ARENAS[id];
};

// Arena unlock costs (0 = free)
export const ARENA_COSTS: Record<string, number> = {
  basicPit: 0,
  warzone: 0,
  thunderdome: 0,
  gauntlet: 500,
  inferno: 750,
  abyss: 1000,
  colosseum: 1500,
  cage: 300,
  oblivion: 2500,
};
