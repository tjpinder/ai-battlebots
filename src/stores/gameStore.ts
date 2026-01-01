import { create } from 'zustand';
import { GameState, BotConfig, DamageEvent } from '@/game/types';

interface GameStore {
  // Game state
  gameState: GameState | null;
  isInitialized: boolean;

  // Battle history
  damageEvents: DamageEvent[];
  battleLog: string[];

  // Actions
  setGameState: (state: GameState) => void;
  setInitialized: (initialized: boolean) => void;
  addDamageEvent: (event: DamageEvent) => void;
  addBattleLog: (message: string) => void;
  clearBattle: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: null,
  isInitialized: false,
  damageEvents: [],
  battleLog: [],

  setGameState: (state) => set({ gameState: state }),

  setInitialized: (initialized) => set({ isInitialized: initialized }),

  addDamageEvent: (event) =>
    set((state) => ({
      damageEvents: [...state.damageEvents, event],
    })),

  addBattleLog: (message) =>
    set((state) => ({
      battleLog: [...state.battleLog.slice(-49), message], // Keep last 50
    })),

  clearBattle: () =>
    set({
      gameState: null,
      damageEvents: [],
      battleLog: [],
    }),
}));
