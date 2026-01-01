'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePlayerStore } from '@/stores/playerStore';
import { CHASSIS, getChassisById } from '@/data/chassis';
import { WEAPONS, getWeaponById } from '@/data/weapons';
import { ARMOR, getArmorById } from '@/data/armor';
import { BotConfig, BehaviorType } from '@/game/types';
import { ScriptEditor } from '@/components/ScriptEditor';
import { ShareBotModal } from '@/components/ShareBotModal';
import { DEFAULT_BOT_SCRIPT } from '@/game/scripting/BotScript';

const BEHAVIOR_TYPES: BehaviorType[] = ['aggressive', 'defensive', 'flanker', 'ram', 'reactive'];

type AIMode = 'behavior' | 'script';
type ShareMode = 'export' | 'import' | null;

const BOT_COLORS = [
  '#4488ff', '#ff4444', '#44ff44', '#ffff44', '#ff44ff', '#44ffff',
  '#ff8844', '#8844ff', '#44ff88', '#ff4488', '#88ff44', '#4488ff',
];

export default function GaragePage() {
  const {
    savedBots,
    activeBotId,
    unlockedChassis,
    unlockedWeapons,
    unlockedArmor,
    saveBot,
    deleteBot,
    setActiveBot,
    stats,
  } = usePlayerStore();

  const [selectedBotId, setSelectedBotId] = useState<string | null>(activeBotId);
  const [editingBot, setEditingBot] = useState<BotConfig | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [aiMode, setAiMode] = useState<AIMode>('behavior');
  const [shareMode, setShareMode] = useState<ShareMode>(null);

  // Load selected bot for editing
  useEffect(() => {
    if (selectedBotId) {
      const bot = savedBots.find(b => b.id === selectedBotId);
      if (bot) {
        setEditingBot({ ...bot });
        setIsCreatingNew(false);
        // Set AI mode based on whether bot has a script
        setAiMode(bot.script ? 'script' : 'behavior');
      }
    }
  }, [selectedBotId, savedBots]);

  const handleCreateNew = () => {
    const newBot: BotConfig = {
      id: `bot-${Date.now()}`,
      name: 'New Bot',
      chassisId: 'brawler',
      weaponIds: ['miniSpinner'],
      armorId: null,
      aiConfig: {
        primaryBehavior: 'aggressive',
        secondaryBehavior: null,
        aggression: 50,
        engagementDistance: 100,
      },
      color: BOT_COLORS[Math.floor(Math.random() * BOT_COLORS.length)],
    };
    setEditingBot(newBot);
    setIsCreatingNew(true);
    setSelectedBotId(null);
  };

  const handleSave = () => {
    if (!editingBot) return;
    saveBot(editingBot);
    setIsCreatingNew(false);
    setSelectedBotId(editingBot.id);
  };

  const handleDelete = () => {
    if (!selectedBotId || savedBots.length <= 1) return;
    deleteBot(selectedBotId);
    setSelectedBotId(savedBots[0]?.id || null);
    setEditingBot(null);
  };

  const handleSetActive = () => {
    if (editingBot) {
      setActiveBot(editingBot.id);
    }
  };

  const updateBot = (updates: Partial<BotConfig>) => {
    if (!editingBot) return;
    setEditingBot({ ...editingBot, ...updates });
  };

  const updateAIConfig = (updates: Partial<BotConfig['aiConfig']>) => {
    if (!editingBot) return;
    setEditingBot({
      ...editingBot,
      aiConfig: { ...editingBot.aiConfig, ...updates },
    });
  };

  const handleImportBot = (importedBot: BotConfig) => {
    saveBot(importedBot);
    setSelectedBotId(importedBot.id);
    setShareMode(null);
  };

  const toggleWeapon = (weaponId: string) => {
    if (!editingBot) return;
    const chassis = getChassisById(editingBot.chassisId);
    if (!chassis) return;

    const currentWeapons = [...editingBot.weaponIds];
    const index = currentWeapons.indexOf(weaponId);

    if (index >= 0) {
      // Remove weapon
      currentWeapons.splice(index, 1);
    } else if (currentWeapons.length < chassis.weaponSlots) {
      // Add weapon if slots available
      currentWeapons.push(weaponId);
    }

    updateBot({ weaponIds: currentWeapons });
  };

  const selectedChassis = editingBot ? getChassisById(editingBot.chassisId) : null;

  // Calculate bot stats
  const getBotStats = () => {
    if (!editingBot || !selectedChassis) return null;

    let totalWeight = selectedChassis.weight;
    let totalDamage = 0;
    let damageReduction = 0;

    for (const weaponId of editingBot.weaponIds) {
      const weapon = getWeaponById(weaponId);
      if (weapon) {
        totalWeight += weapon.weight;
        totalDamage += weapon.baseDamage;
      }
    }

    if (editingBot.armorId) {
      const armor = getArmorById(editingBot.armorId);
      if (armor) {
        totalWeight += armor.weight;
        damageReduction = armor.damageReduction;
      }
    }

    return {
      hp: selectedChassis.baseHP,
      speed: Math.round(selectedChassis.baseSpeed * (100 / totalWeight) * 10) / 10,
      weight: totalWeight,
      damage: totalDamage,
      damageReduction: Math.round(damageReduction * 100),
    };
  };

  const botStats = getBotStats();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Link
          href="/"
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          Back to Menu
        </Link>
        <h1 className="text-3xl font-bold">Garage</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShareMode('import')}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm"
          >
            Import Bot
          </button>
          <div className="text-yellow-400">{stats.credits} Credits</div>
        </div>
      </div>

      <div className="flex gap-6 max-w-7xl mx-auto">
        {/* Bot List */}
        <div className="w-64 bg-gray-800 rounded-xl p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold">Your Bots</h2>
            <button
              onClick={handleCreateNew}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors"
            >
              + New
            </button>
          </div>

          <div className="space-y-2">
            {savedBots.map((bot) => (
              <button
                key={bot.id}
                onClick={() => setSelectedBotId(bot.id)}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  selectedBotId === bot.id
                    ? 'bg-blue-600'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                    style={{ backgroundColor: bot.color + '44' }}
                  >
                    🤖
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate" style={{ color: bot.color }}>
                      {bot.name}
                    </div>
                    <div className="text-xs text-gray-400 capitalize">
                      {bot.chassisId}
                    </div>
                  </div>
                  {activeBotId === bot.id && (
                    <div className="text-green-400 text-xs">ACTIVE</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bot Editor */}
        {editingBot ? (
          <div className="flex-1 bg-gray-800 rounded-xl p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <input
                  type="text"
                  value={editingBot.name}
                  onChange={(e) => updateBot({ name: e.target.value })}
                  className="bg-transparent text-3xl font-bold border-b-2 border-transparent hover:border-gray-600 focus:border-blue-500 focus:outline-none"
                  style={{ color: editingBot.color }}
                />
                <div className="text-gray-400 mt-1">
                  {isCreatingNew ? 'New Bot' : 'Editing'}
                </div>
              </div>
              <div className="flex gap-2">
                {!isCreatingNew && (
                  <button
                    onClick={() => setShareMode('export')}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                  >
                    Share
                  </button>
                )}
                {!isCreatingNew && activeBotId !== editingBot.id && (
                  <button
                    onClick={handleSetActive}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                  >
                    Set Active
                  </button>
                )}
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Save
                </button>
                {!isCreatingNew && savedBots.length > 1 && (
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Left Column - Parts */}
              <div className="space-y-6">
                {/* Color Picker */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="font-bold mb-3">Color</h3>
                  <div className="flex flex-wrap gap-2">
                    {BOT_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => updateBot({ color })}
                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                          editingBot.color === color
                            ? 'border-white scale-110'
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Chassis Selection */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="font-bold mb-3">Chassis</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(CHASSIS).map((chassis) => {
                      const isUnlocked = unlockedChassis.includes(chassis.id);
                      const isSelected = editingBot.chassisId === chassis.id;

                      return (
                        <button
                          key={chassis.id}
                          onClick={() => {
                            if (isUnlocked) {
                              updateBot({ chassisId: chassis.id, weaponIds: [] });
                            }
                          }}
                          disabled={!isUnlocked}
                          className={`p-3 rounded-lg text-left transition-colors ${
                            isSelected
                              ? 'bg-blue-600 border-2 border-blue-400'
                              : isUnlocked
                              ? 'bg-gray-600 hover:bg-gray-500'
                              : 'bg-gray-800 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="font-bold text-sm">{chassis.name}</div>
                          <div className="text-xs text-gray-300 mt-1">
                            HP: {chassis.baseHP} | Speed: {chassis.baseSpeed}
                          </div>
                          <div className="text-xs text-gray-400">
                            {chassis.weaponSlots} weapon slot{chassis.weaponSlots > 1 ? 's' : ''}
                          </div>
                          {!isUnlocked && (
                            <div className="text-xs text-yellow-400 mt-1">
                              🔒 {chassis.cost} credits
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Weapons Selection */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="font-bold mb-3">
                    Weapons ({editingBot.weaponIds.length}/{selectedChassis?.weaponSlots || 0})
                  </h3>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {Object.values(WEAPONS).map((weapon) => {
                      const isUnlocked = unlockedWeapons.includes(weapon.id);
                      const isEquipped = editingBot.weaponIds.includes(weapon.id);
                      const canEquip =
                        isUnlocked &&
                        (isEquipped ||
                          editingBot.weaponIds.length < (selectedChassis?.weaponSlots || 0));

                      return (
                        <button
                          key={weapon.id}
                          onClick={() => {
                            if (isUnlocked) toggleWeapon(weapon.id);
                          }}
                          disabled={!canEquip && !isEquipped}
                          className={`p-2 rounded-lg text-left transition-colors ${
                            isEquipped
                              ? 'bg-green-600 border-2 border-green-400'
                              : canEquip
                              ? 'bg-gray-600 hover:bg-gray-500'
                              : 'bg-gray-800 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="font-bold text-xs">{weapon.name}</div>
                          <div className="text-xs text-gray-300">
                            DMG: {weapon.baseDamage} | {weapon.type}
                          </div>
                          {!isUnlocked && (
                            <div className="text-xs text-yellow-400">
                              🔒 {weapon.cost}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Armor Selection */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="font-bold mb-3">🛡️ Armor</h3>
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                    <button
                      onClick={() => updateBot({ armorId: null })}
                      className={`p-2 rounded-lg text-left transition-colors ${
                        editingBot.armorId === null
                          ? 'bg-blue-600 border-2 border-blue-400'
                          : 'bg-gray-600 hover:bg-gray-500'
                      }`}
                    >
                      <div className="font-bold text-xs">No Armor</div>
                      <div className="text-xs text-gray-300">Lighter & faster</div>
                    </button>
                    {Object.values(ARMOR).map((armor) => {
                      const isUnlocked = unlockedArmor.includes(armor.id);
                      const isEquipped = editingBot.armorId === armor.id;

                      return (
                        <button
                          key={armor.id}
                          onClick={() => {
                            if (isUnlocked) updateBot({ armorId: armor.id });
                          }}
                          disabled={!isUnlocked}
                          className={`p-2 rounded-lg text-left transition-colors ${
                            isEquipped
                              ? 'bg-cyan-600 border-2 border-cyan-400'
                              : isUnlocked
                              ? 'bg-gray-600 hover:bg-gray-500'
                              : 'bg-gray-800 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="font-bold text-xs">{armor.name}</div>
                          <div className="text-xs text-gray-300">
                            -{Math.round(armor.damageReduction * 100)}% DMG | +{armor.weight}kg
                          </div>
                          {!isUnlocked && (
                            <div className="text-xs text-yellow-400">
                              🔒 {armor.cost}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column - AI & Stats */}
              <div className="space-y-6">
                {/* Bot Stats */}
                {botStats && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="font-bold mb-3">Stats</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>HP</span>
                          <span>{botStats.hp}</span>
                        </div>
                        <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-500"
                            style={{ width: `${(botStats.hp / 200) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Speed</span>
                          <span>{botStats.speed}</span>
                        </div>
                        <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500"
                            style={{ width: `${(botStats.speed / 12) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Damage</span>
                          <span>{botStats.damage}</span>
                        </div>
                        <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-500"
                            style={{ width: `${(botStats.damage / 50) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Weight</span>
                          <span>{botStats.weight}</span>
                        </div>
                        <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gray-400"
                            style={{ width: `${(botStats.weight / 300) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Armor</span>
                          <span>{botStats.damageReduction}%</span>
                        </div>
                        <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-500"
                            style={{ width: `${(botStats.damageReduction / 40) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Mode Toggle */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="font-bold mb-3">AI Control Mode</h3>
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => {
                        setAiMode('behavior');
                        updateBot({ script: undefined });
                      }}
                      className={`flex-1 py-2 px-4 rounded-lg font-bold transition-colors ${
                        aiMode === 'behavior'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                      }`}
                    >
                      Behavior Presets
                    </button>
                    <button
                      onClick={() => {
                        setAiMode('script');
                        if (!editingBot.script) {
                          updateBot({ script: DEFAULT_BOT_SCRIPT });
                        }
                      }}
                      className={`flex-1 py-2 px-4 rounded-lg font-bold transition-colors ${
                        aiMode === 'script'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                      }`}
                    >
                      Custom Script
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">
                    {aiMode === 'behavior'
                      ? 'Use pre-built behavior modules to control your bot.'
                      : 'Write custom scripts using the scripting language for full control.'}
                  </p>
                </div>

                {/* AI Configuration - Behavior Mode */}
                {aiMode === 'behavior' && (
                  <>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h3 className="font-bold mb-3">AI Behavior</h3>

                      <div className="space-y-4">
                        {/* Primary Behavior */}
                        <div>
                          <label className="text-sm text-gray-400 block mb-2">
                            Primary Behavior
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {BEHAVIOR_TYPES.map((behavior) => (
                              <button
                                key={behavior}
                                onClick={() => updateAIConfig({ primaryBehavior: behavior })}
                                className={`p-2 rounded text-xs capitalize transition-colors ${
                                  editingBot.aiConfig.primaryBehavior === behavior
                                    ? 'bg-blue-600'
                                    : 'bg-gray-600 hover:bg-gray-500'
                                }`}
                              >
                                {behavior}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Secondary Behavior */}
                        <div>
                          <label className="text-sm text-gray-400 block mb-2">
                            Secondary Behavior (Optional)
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              onClick={() => updateAIConfig({ secondaryBehavior: null })}
                              className={`p-2 rounded text-xs transition-colors ${
                                editingBot.aiConfig.secondaryBehavior === null
                                  ? 'bg-blue-600'
                                  : 'bg-gray-600 hover:bg-gray-500'
                              }`}
                            >
                              None
                            </button>
                            {BEHAVIOR_TYPES.filter(
                              (b) => b !== editingBot.aiConfig.primaryBehavior
                            ).map((behavior) => (
                              <button
                                key={behavior}
                                onClick={() => updateAIConfig({ secondaryBehavior: behavior })}
                                className={`p-2 rounded text-xs capitalize transition-colors ${
                                  editingBot.aiConfig.secondaryBehavior === behavior
                                    ? 'bg-blue-600'
                                    : 'bg-gray-600 hover:bg-gray-500'
                                }`}
                              >
                                {behavior}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Aggression Slider */}
                        <div>
                          <label className="text-sm text-gray-400 block mb-2">
                            Aggression: {editingBot.aiConfig.aggression}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={editingBot.aiConfig.aggression}
                            onChange={(e) =>
                              updateAIConfig({ aggression: parseInt(e.target.value) })
                            }
                            className="w-full accent-red-500"
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Cautious</span>
                            <span>Reckless</span>
                          </div>
                        </div>

                        {/* Engagement Distance */}
                        <div>
                          <label className="text-sm text-gray-400 block mb-2">
                            Engagement Distance: {editingBot.aiConfig.engagementDistance}px
                          </label>
                          <input
                            type="range"
                            min="50"
                            max="200"
                            value={editingBot.aiConfig.engagementDistance}
                            onChange={(e) =>
                              updateAIConfig({ engagementDistance: parseInt(e.target.value) })
                            }
                            className="w-full accent-blue-500"
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Close</span>
                            <span>Far</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Behavior Descriptions */}
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h3 className="font-bold mb-3">Behavior Guide</h3>
                      <div className="space-y-2 text-xs text-gray-300">
                        <div>
                          <span className="text-red-400 font-bold">Aggressive:</span> Rush
                          enemy, maximize weapon contact
                        </div>
                        <div>
                          <span className="text-blue-400 font-bold">Defensive:</span> Keep
                          distance, wait for openings
                        </div>
                        <div>
                          <span className="text-yellow-400 font-bold">Flanker:</span> Circle
                          around, attack from sides
                        </div>
                        <div>
                          <span className="text-orange-400 font-bold">Ram:</span> Build
                          momentum, use weight as weapon
                        </div>
                        <div>
                          <span className="text-purple-400 font-bold">Reactive:</span>{' '}
                          Counter based on enemy behavior
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* AI Configuration - Script Mode */}
                {aiMode === 'script' && (
                  <ScriptEditor
                    script={editingBot.script || DEFAULT_BOT_SCRIPT}
                    onChange={(script) => updateBot({ script })}
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-gray-800 rounded-xl p-6 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-4">🤖</div>
              <p>Select a bot to edit or create a new one</p>
            </div>
          </div>
        )}
      </div>

      {/* Share/Import Modal */}
      {shareMode && (
        <ShareBotModal
          bot={shareMode === 'export' ? editingBot : null}
          mode={shareMode}
          onImport={handleImportBot}
          onClose={() => setShareMode(null)}
        />
      )}
    </div>
  );
}
