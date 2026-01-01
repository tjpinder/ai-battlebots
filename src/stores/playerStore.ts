import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BotConfig } from '@/game/types';

interface PlayerStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalWins: number;
  totalLosses: number;
  totalDamageDealt: number;
  currentRank: string;
  credits: number;
}

interface PlayerStore {
  // Player info
  playerName: string;
  stats: PlayerStats;

  // Inventory
  unlockedChassis: string[];
  unlockedWeapons: string[];
  unlockedArmor: string[];

  // Saved bots
  savedBots: BotConfig[];
  activeBotId: string | null;

  // Actions
  setPlayerName: (name: string) => void;
  addXp: (amount: number) => void;
  addCredits: (amount: number) => void;
  spendCredits: (amount: number) => boolean;
  recordWin: () => void;
  recordLoss: () => void;
  addDamageDealt: (amount: number) => void;

  // Inventory management
  unlockChassis: (id: string) => void;
  unlockWeapon: (id: string) => void;
  unlockArmor: (id: string) => void;

  // Bot management
  saveBot: (bot: BotConfig) => void;
  deleteBot: (id: string) => void;
  setActiveBot: (id: string | null) => void;
  getActiveBot: () => BotConfig | null;

  // Reset
  resetProgress: () => void;
}

const calculateXpToNextLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

const initialStats: PlayerStats = {
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  totalWins: 0,
  totalLosses: 0,
  totalDamageDealt: 0,
  currentRank: 'Bronze',
  credits: 500, // Starting credits
};

// Starter unlocks
const starterChassis = ['scout', 'brawler', 'tank'];
const starterWeapons = ['miniSpinner', 'basicFlipper', 'spikeHammer', 'basicWedge'];
const starterArmor: string[] = ['basicPlating'];

// Default starter bot
const starterBot: BotConfig = {
  id: 'starter-bot',
  name: 'Rookie Bot',
  chassisId: 'brawler',
  weaponIds: ['miniSpinner'],
  armorId: null,
  aiConfig: {
    primaryBehavior: 'aggressive',
    secondaryBehavior: null,
    aggression: 50,
    engagementDistance: 100,
  },
  color: '#4488ff',
};

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      playerName: 'Player',
      stats: initialStats,
      unlockedChassis: starterChassis,
      unlockedWeapons: starterWeapons,
      unlockedArmor: starterArmor,
      savedBots: [starterBot],
      activeBotId: 'starter-bot',

      setPlayerName: (name) => set({ playerName: name }),

      addXp: (amount) =>
        set((state) => {
          let newXp = state.stats.xp + amount;
          let newLevel = state.stats.level;
          let newXpToNext = state.stats.xpToNextLevel;

          // Level up check
          while (newXp >= newXpToNext) {
            newXp -= newXpToNext;
            newLevel++;
            newXpToNext = calculateXpToNextLevel(newLevel);
          }

          // Update rank based on level
          let newRank = state.stats.currentRank;
          if (newLevel >= 20) newRank = 'Champion';
          else if (newLevel >= 15) newRank = 'Platinum';
          else if (newLevel >= 10) newRank = 'Gold';
          else if (newLevel >= 5) newRank = 'Silver';

          return {
            stats: {
              ...state.stats,
              xp: newXp,
              level: newLevel,
              xpToNextLevel: newXpToNext,
              currentRank: newRank,
            },
          };
        }),

      addCredits: (amount) =>
        set((state) => ({
          stats: { ...state.stats, credits: state.stats.credits + amount },
        })),

      spendCredits: (amount) => {
        const { stats } = get();
        if (stats.credits >= amount) {
          set({ stats: { ...stats, credits: stats.credits - amount } });
          return true;
        }
        return false;
      },

      recordWin: () =>
        set((state) => ({
          stats: { ...state.stats, totalWins: state.stats.totalWins + 1 },
        })),

      recordLoss: () =>
        set((state) => ({
          stats: { ...state.stats, totalLosses: state.stats.totalLosses + 1 },
        })),

      addDamageDealt: (amount) =>
        set((state) => ({
          stats: {
            ...state.stats,
            totalDamageDealt: state.stats.totalDamageDealt + amount,
          },
        })),

      unlockChassis: (id) =>
        set((state) => ({
          unlockedChassis: state.unlockedChassis.includes(id)
            ? state.unlockedChassis
            : [...state.unlockedChassis, id],
        })),

      unlockWeapon: (id) =>
        set((state) => ({
          unlockedWeapons: state.unlockedWeapons.includes(id)
            ? state.unlockedWeapons
            : [...state.unlockedWeapons, id],
        })),

      unlockArmor: (id) =>
        set((state) => ({
          unlockedArmor: state.unlockedArmor.includes(id)
            ? state.unlockedArmor
            : [...state.unlockedArmor, id],
        })),

      saveBot: (bot) =>
        set((state) => {
          const existingIndex = state.savedBots.findIndex((b) => b.id === bot.id);
          if (existingIndex >= 0) {
            const newBots = [...state.savedBots];
            newBots[existingIndex] = bot;
            return { savedBots: newBots };
          }
          return { savedBots: [...state.savedBots, bot] };
        }),

      deleteBot: (id) =>
        set((state) => ({
          savedBots: state.savedBots.filter((b) => b.id !== id),
          activeBotId: state.activeBotId === id ? null : state.activeBotId,
        })),

      setActiveBot: (id) => set({ activeBotId: id }),

      getActiveBot: () => {
        const { savedBots, activeBotId } = get();
        return savedBots.find((b) => b.id === activeBotId) || null;
      },

      resetProgress: () =>
        set({
          playerName: 'Player',
          stats: initialStats,
          unlockedChassis: starterChassis,
          unlockedWeapons: starterWeapons,
          unlockedArmor: starterArmor,
          savedBots: [starterBot],
          activeBotId: 'starter-bot',
        }),
    }),
    {
      name: 'battlebots-player-storage',
    }
  )
);
