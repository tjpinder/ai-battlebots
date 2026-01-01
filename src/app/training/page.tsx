'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { BattleCanvas } from '@/components/BattleCanvas';
import { HUD } from '@/components/HUD';
import { useGameStore } from '@/stores/gameStore';
import { usePlayerStore } from '@/stores/playerStore';
import { ARENAS } from '@/data/arenas';
import { CHASSIS } from '@/data/chassis';
import { WEAPONS } from '@/data/weapons';
import { BotConfig, BehaviorType } from '@/game/types';

const BEHAVIOR_TYPES: BehaviorType[] = ['aggressive', 'defensive', 'flanker', 'ram', 'reactive'];

export default function TrainingPage() {
  const { clearBattle } = useGameStore();
  const { getActiveBot } = usePlayerStore();

  const [battleKey, setBattleKey] = useState(0);
  const [isTraining, setIsTraining] = useState(false);
  const [selectedArena, setSelectedArena] = useState('basicPit');

  // Training dummy configuration
  const [dummyConfig, setDummyConfig] = useState({
    chassisId: 'brawler',
    weaponIds: ['miniSpinner'] as string[],
    behavior: 'aggressive' as BehaviorType,
    aggression: 50,
    isStationary: false,
    infiniteHP: false,
  });

  const playerBot = getActiveBot();

  const createDummyBot = (): BotConfig => ({
    id: 'training-dummy',
    name: dummyConfig.isStationary ? 'Training Dummy' : 'Sparring Partner',
    chassisId: dummyConfig.chassisId,
    weaponIds: dummyConfig.weaponIds,
    armorId: null,
    aiConfig: {
      primaryBehavior: dummyConfig.isStationary ? 'defensive' : dummyConfig.behavior,
      secondaryBehavior: null,
      aggression: dummyConfig.isStationary ? 0 : dummyConfig.aggression,
      engagementDistance: 100,
    },
    color: '#888888',
  });

  const handleBattleEnd = useCallback(() => {
    // In training mode, battles don't count for stats
    // Just allow restart
  }, []);

  const startTraining = () => {
    clearBattle();
    setIsTraining(true);
    setBattleKey((k) => k + 1);
  };

  const stopTraining = () => {
    setIsTraining(false);
    clearBattle();
  };

  const toggleWeapon = (weaponId: string) => {
    const currentWeapons = [...dummyConfig.weaponIds];
    const index = currentWeapons.indexOf(weaponId);
    const chassis = CHASSIS[dummyConfig.chassisId];

    if (index >= 0) {
      currentWeapons.splice(index, 1);
    } else if (currentWeapons.length < chassis.weaponSlots) {
      currentWeapons.push(weaponId);
    }

    setDummyConfig({ ...dummyConfig, weaponIds: currentWeapons });
  };

  if (!playerBot) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Bot Selected</h1>
          <p className="text-gray-400 mb-4">Create a bot first to start training.</p>
          <Link
            href="/garage"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Go to Garage
          </Link>
        </div>
      </div>
    );
  }

  const arena = ARENAS[selectedArena];
  const dummyBot = createDummyBot();

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
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Training Mode
        </h1>
        <div className="text-gray-400 text-sm">
          No XP or credits earned
        </div>
      </div>

      {!isTraining ? (
        <div className="max-w-4xl mx-auto">
          {/* Training Setup */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Arena Selection */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Arena</h2>
              <div className="grid grid-cols-1 gap-2">
                {Object.values(ARENAS).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSelectedArena(a.id)}
                    className={`p-3 rounded-lg text-left transition-colors ${
                      selectedArena === a.id
                        ? 'bg-blue-600 border-2 border-blue-400'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <div className="font-bold">{a.name}</div>
                    <div className="text-sm text-gray-400">
                      {a.width}x{a.height} • {a.hazards.length} hazards
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Your Bot */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Your Bot</h2>
              <div className="flex items-center gap-4 p-4 bg-gray-700 rounded-lg">
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl"
                  style={{ backgroundColor: playerBot.color + '33' }}
                >
                  🤖
                </div>
                <div>
                  <div className="text-xl font-bold" style={{ color: playerBot.color }}>
                    {playerBot.name}
                  </div>
                  <div className="text-gray-400 capitalize text-sm">
                    {playerBot.chassisId} • {playerBot.weaponIds.length} weapons
                  </div>
                </div>
              </div>
              <Link
                href="/garage"
                className="mt-4 block text-center px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
              >
                Change Bot
              </Link>
            </div>
          </div>

          {/* Training Dummy Configuration */}
          <div className="bg-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Training Partner Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dummy Type */}
              <div>
                <h3 className="font-bold mb-3 text-gray-300">Mode</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDummyConfig({ ...dummyConfig, isStationary: false })}
                    className={`p-3 rounded-lg transition-colors ${
                      !dummyConfig.isStationary
                        ? 'bg-blue-600'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <div className="font-bold">Active</div>
                    <div className="text-xs text-gray-300">Fights back</div>
                  </button>
                  <button
                    onClick={() => setDummyConfig({ ...dummyConfig, isStationary: true })}
                    className={`p-3 rounded-lg transition-colors ${
                      dummyConfig.isStationary
                        ? 'bg-blue-600'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <div className="font-bold">Passive</div>
                    <div className="text-xs text-gray-300">Standing target</div>
                  </button>
                </div>
              </div>

              {/* Chassis Selection */}
              <div>
                <h3 className="font-bold mb-3 text-gray-300">Chassis</h3>
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(CHASSIS)
                    .filter((c) => c.tier <= 2)
                    .map((chassis) => (
                      <button
                        key={chassis.id}
                        onClick={() =>
                          setDummyConfig({
                            ...dummyConfig,
                            chassisId: chassis.id,
                            weaponIds: dummyConfig.weaponIds.slice(0, chassis.weaponSlots),
                          })
                        }
                        className={`p-2 rounded-lg text-xs transition-colors ${
                          dummyConfig.chassisId === chassis.id
                            ? 'bg-blue-600'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        {chassis.name}
                      </button>
                    ))}
                </div>
              </div>

              {/* AI Behavior (only for active mode) */}
              {!dummyConfig.isStationary && (
                <div>
                  <h3 className="font-bold mb-3 text-gray-300">AI Behavior</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {BEHAVIOR_TYPES.map((behavior) => (
                      <button
                        key={behavior}
                        onClick={() =>
                          setDummyConfig({ ...dummyConfig, behavior })
                        }
                        className={`p-2 rounded-lg text-xs capitalize transition-colors ${
                          dummyConfig.behavior === behavior
                            ? 'bg-blue-600'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        {behavior}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Aggression Slider (only for active mode) */}
              {!dummyConfig.isStationary && (
                <div>
                  <h3 className="font-bold mb-3 text-gray-300">
                    Aggression: {dummyConfig.aggression}%
                  </h3>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={dummyConfig.aggression}
                    onChange={(e) =>
                      setDummyConfig({
                        ...dummyConfig,
                        aggression: parseInt(e.target.value),
                      })
                    }
                    className="w-full accent-red-500"
                  />
                </div>
              )}
            </div>

            {/* Weapons */}
            <div className="mt-6">
              <h3 className="font-bold mb-3 text-gray-300">
                Weapons ({dummyConfig.weaponIds.length}/
                {CHASSIS[dummyConfig.chassisId].weaponSlots})
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {Object.values(WEAPONS)
                  .filter((w) => w.tier <= 2)
                  .map((weapon) => (
                    <button
                      key={weapon.id}
                      onClick={() => toggleWeapon(weapon.id)}
                      className={`p-2 rounded-lg text-xs transition-colors ${
                        dummyConfig.weaponIds.includes(weapon.id)
                          ? 'bg-green-600'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      {weapon.name}
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={startTraining}
            className="w-full py-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl font-bold text-2xl transition-all hover:scale-105"
          >
            🎯 START TRAINING
          </button>

          {/* Tips */}
          <div className="mt-8 bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h3 className="font-bold mb-3">Training Tips</h3>
            <ul className="text-gray-400 text-sm space-y-2">
              <li>• Use <span className="text-cyan-400">Passive mode</span> to test weapon damage without getting hit</li>
              <li>• Practice against <span className="text-cyan-400">different AI behaviors</span> to learn counters</li>
              <li>• Try <span className="text-cyan-400">hazardous arenas</span> to learn pit and spike positions</li>
              <li>• Adjust <span className="text-cyan-400">aggression</span> to simulate different skill levels</li>
              <li>• Training doesn't affect your stats - experiment freely!</li>
            </ul>
          </div>
        </div>
      ) : (
        <div>
          {/* Training Header */}
          <div className="text-center mb-4">
            <div className="text-sm text-cyan-400">Training Session</div>
            <div className="text-xl font-bold">
              <span style={{ color: playerBot.color }}>{playerBot.name}</span>
              <span className="mx-4 text-gray-500">VS</span>
              <span className="text-gray-400">{dummyBot.name}</span>
            </div>
          </div>

          {/* Battle Area */}
          <div className="flex justify-center gap-8">
            <div className="flex flex-col items-center gap-4">
              <BattleCanvas
                key={battleKey}
                arena={arena}
                bots={[playerBot, dummyBot]}
                onBattleEnd={handleBattleEnd}
                autoStart={true}
              />
              <div className="flex gap-4">
                <button
                  onClick={startTraining}
                  className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-bold transition-colors"
                >
                  Restart
                </button>
                <button
                  onClick={stopTraining}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg font-bold transition-colors"
                >
                  End Training
                </button>
              </div>
            </div>
            <HUD />
          </div>
        </div>
      )}
    </div>
  );
}
