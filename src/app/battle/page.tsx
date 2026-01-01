'use client';

import { useState, useCallback } from 'react';
import { BattleCanvas } from '@/components/BattleCanvas';
import { HUD } from '@/components/HUD';
import { useGameStore } from '@/stores/gameStore';
import { usePlayerStore } from '@/stores/playerStore';
import { ARENAS } from '@/data/arenas';
import { BotConfig } from '@/game/types';
import Link from 'next/link';

// Sample enemy bots for quick battle
const ENEMY_BOTS: BotConfig[] = [
  {
    id: 'enemy-spinner',
    name: 'Spin Master',
    chassisId: 'brawler',
    weaponIds: ['miniSpinner', 'miniSpinner'],
    armorId: null,
    aiConfig: {
      primaryBehavior: 'aggressive',
      secondaryBehavior: 'ram',
      aggression: 75,
      engagementDistance: 80,
    },
    color: '#ff4444',
  },
  {
    id: 'enemy-tank',
    name: 'Iron Wall',
    chassisId: 'tank',
    weaponIds: ['basicWedge', 'spikeHammer'],
    armorId: null,
    aiConfig: {
      primaryBehavior: 'defensive',
      secondaryBehavior: 'reactive',
      aggression: 30,
      engagementDistance: 120,
    },
    color: '#888888',
  },
  {
    id: 'enemy-speed',
    name: 'Lightning',
    chassisId: 'scout',
    weaponIds: ['basicFlipper'],
    armorId: null,
    aiConfig: {
      primaryBehavior: 'flanker',
      secondaryBehavior: 'aggressive',
      aggression: 90,
      engagementDistance: 60,
    },
    color: '#ffff44',
  },
];

export default function BattlePage() {
  const { clearBattle } = useGameStore();
  const { stats, addXp, addCredits, recordWin, recordLoss, getActiveBot } =
    usePlayerStore();

  const [battleKey, setBattleKey] = useState(0);
  const [selectedArena, setSelectedArena] = useState('basicPit');
  const [selectedEnemy, setSelectedEnemy] = useState(0);
  const [battleResult, setBattleResult] = useState<'win' | 'lose' | null>(null);

  const playerBot = getActiveBot();

  const handleBattleEnd = useCallback(
    (winnerId: string | null) => {
      if (!playerBot) return;

      if (winnerId === playerBot.id) {
        setBattleResult('win');
        recordWin();
        addXp(50);
        addCredits(100);
      } else {
        setBattleResult('lose');
        recordLoss();
        addXp(10); // Consolation XP
      }
    },
    [playerBot, recordWin, recordLoss, addXp, addCredits]
  );

  const handleNewBattle = () => {
    clearBattle();
    setBattleResult(null);
    setBattleKey((k) => k + 1);
  };

  if (!playerBot) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Bot Selected</h1>
          <p className="text-gray-400 mb-4">
            You need to create or select a bot first.
          </p>
          <Link
            href="/"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Go to Menu
          </Link>
        </div>
      </div>
    );
  }

  const arena = ARENAS[selectedArena];
  const enemy = ENEMY_BOTS[selectedEnemy];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <Link
          href="/"
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          Back to Menu
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-gray-400">Level {stats.level}</span>
          <span className="text-yellow-400">{stats.credits} Credits</span>
          <span className="text-blue-400">{stats.currentRank}</span>
        </div>
      </div>

      {/* Battle Setup (shown before battle) */}
      {battleResult === null && battleKey === 0 && (
        <div className="max-w-2xl mx-auto mb-8 space-y-4">
          <h2 className="text-xl font-bold text-center mb-4">Battle Setup</h2>

          {/* Arena Selection */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="font-bold mb-2">Select Arena</h3>
            <div className="flex gap-2 flex-wrap">
              {Object.values(ARENAS).map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelectedArena(a.id)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedArena === a.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {a.name}
                </button>
              ))}
            </div>
          </div>

          {/* Enemy Selection */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="font-bold mb-2">Select Opponent</h3>
            <div className="grid grid-cols-3 gap-2">
              {ENEMY_BOTS.map((bot, index) => (
                <button
                  key={bot.id}
                  onClick={() => setSelectedEnemy(index)}
                  className={`p-3 rounded-lg transition-colors text-left ${
                    selectedEnemy === index
                      ? 'bg-red-600/30 border-2 border-red-500'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <div
                    className="font-bold"
                    style={{ color: bot.color }}
                  >
                    {bot.name}
                  </div>
                  <div className="text-xs text-gray-400 capitalize">
                    {bot.chassisId} chassis
                  </div>
                  <div className="text-xs text-gray-500">
                    Style: {bot.aiConfig.primaryBehavior}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Start Battle Button */}
          <button
            onClick={handleNewBattle}
            className="w-full py-4 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-xl transition-colors"
          >
            START BATTLE!
          </button>
        </div>
      )}

      {/* Battle Area */}
      {battleKey > 0 && (
        <div className="flex justify-center gap-8">
          <BattleCanvas
            key={battleKey}
            arena={arena}
            bots={[playerBot, enemy]}
            onBattleEnd={handleBattleEnd}
            autoStart={true}
          />
          <HUD />
        </div>
      )}

      {/* Battle Result Modal */}
      {battleResult && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-8 text-center max-w-md">
            <h2
              className={`text-4xl font-bold mb-4 ${
                battleResult === 'win' ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {battleResult === 'win' ? 'VICTORY!' : 'DEFEAT'}
            </h2>
            <div className="space-y-2 mb-6 text-gray-300">
              {battleResult === 'win' ? (
                <>
                  <p>+50 XP</p>
                  <p>+100 Credits</p>
                </>
              ) : (
                <p>+10 XP (Consolation)</p>
              )}
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleNewBattle}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                Battle Again
              </button>
              <Link
                href="/"
                className="px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
              >
                Main Menu
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
