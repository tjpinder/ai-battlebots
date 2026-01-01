'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePlayerStore } from '@/stores/playerStore';
import { CHASSIS } from '@/data/chassis';
import { WEAPONS } from '@/data/weapons';
import { ARMOR } from '@/data/armor';

type ShopTab = 'chassis' | 'weapons' | 'armor';

export default function ShopPage() {
  const {
    stats,
    unlockedChassis,
    unlockedWeapons,
    unlockedArmor,
    unlockChassis,
    unlockWeapon,
    unlockArmor,
    spendCredits,
  } = usePlayerStore();

  const [activeTab, setActiveTab] = useState<ShopTab>('chassis');
  const [purchaseMessage, setPurchaseMessage] = useState<string | null>(null);

  const handlePurchase = (
    type: 'chassis' | 'weapon' | 'armor',
    id: string,
    cost: number,
    name: string
  ) => {
    if (stats.credits < cost) {
      setPurchaseMessage(`Not enough credits! Need ${cost - stats.credits} more.`);
      setTimeout(() => setPurchaseMessage(null), 3000);
      return;
    }

    if (spendCredits(cost)) {
      if (type === 'chassis') {
        unlockChassis(id);
      } else if (type === 'weapon') {
        unlockWeapon(id);
      } else {
        unlockArmor(id);
      }
      setPurchaseMessage(`Purchased ${name}!`);
      setTimeout(() => setPurchaseMessage(null), 3000);
    }
  };

  const lockedChassis = Object.values(CHASSIS).filter(
    (c) => !unlockedChassis.includes(c.id) && c.cost > 0
  );

  const lockedWeapons = Object.values(WEAPONS).filter(
    (w) => !unlockedWeapons.includes(w.id) && w.cost > 0
  );

  const lockedArmor = Object.values(ARMOR).filter(
    (a) => !unlockedArmor.includes(a.id) && a.cost > 0
  );

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
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
          Shop
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-2xl">💰</span>
          <span className="text-2xl font-bold text-yellow-400">{stats.credits}</span>
          <span className="text-gray-400">Credits</span>
        </div>
      </div>

      {/* Purchase Message */}
      {purchaseMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-600 px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse">
          {purchaseMessage}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('chassis')}
            className={`px-6 py-3 rounded-lg font-bold transition-colors ${
              activeTab === 'chassis'
                ? 'bg-blue-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            🤖 Chassis ({lockedChassis.length})
          </button>
          <button
            onClick={() => setActiveTab('weapons')}
            className={`px-6 py-3 rounded-lg font-bold transition-colors ${
              activeTab === 'weapons'
                ? 'bg-red-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            ⚔️ Weapons ({lockedWeapons.length})
          </button>
          <button
            onClick={() => setActiveTab('armor')}
            className={`px-6 py-3 rounded-lg font-bold transition-colors ${
              activeTab === 'armor'
                ? 'bg-cyan-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            🛡️ Armor ({lockedArmor.length})
          </button>
        </div>

        {/* Chassis Tab */}
        {activeTab === 'chassis' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lockedChassis.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-400">
                <div className="text-4xl mb-4">🎉</div>
                <p>You've unlocked all chassis!</p>
              </div>
            ) : (
              lockedChassis.map((chassis) => (
                <div
                  key={chassis.id}
                  className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700"
                >
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold">{chassis.name}</h3>
                        <div className="text-sm text-white/70">Tier {chassis.tier}</div>
                      </div>
                      <div className="text-3xl">🤖</div>
                    </div>
                  </div>

                  <div className="p-4">
                    <p className="text-gray-300 text-sm mb-4">{chassis.description}</p>

                    <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                      <div className="bg-gray-700 rounded p-2">
                        <div className="text-gray-400">HP</div>
                        <div className="font-bold text-red-400">{chassis.baseHP}</div>
                      </div>
                      <div className="bg-gray-700 rounded p-2">
                        <div className="text-gray-400">Speed</div>
                        <div className="font-bold text-blue-400">{chassis.baseSpeed}</div>
                      </div>
                      <div className="bg-gray-700 rounded p-2">
                        <div className="text-gray-400">Weight</div>
                        <div className="font-bold text-gray-300">{chassis.weight}</div>
                      </div>
                      <div className="bg-gray-700 rounded p-2">
                        <div className="text-gray-400">Weapon Slots</div>
                        <div className="font-bold text-green-400">
                          {chassis.weaponSlots}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        handlePurchase('chassis', chassis.id, chassis.cost, chassis.name)
                      }
                      disabled={stats.credits < chassis.cost}
                      className={`w-full py-3 rounded-lg font-bold transition-colors ${
                        stats.credits >= chassis.cost
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <span className="mr-2">💰</span>
                      {chassis.cost} Credits
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Weapons Tab */}
        {activeTab === 'weapons' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lockedWeapons.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-400">
                <div className="text-4xl mb-4">🎉</div>
                <p>You've unlocked all weapons!</p>
              </div>
            ) : (
              lockedWeapons.map((weapon) => {
                const typeColors: Record<string, string> = {
                  spinner: 'from-red-600 to-orange-600',
                  flipper: 'from-green-600 to-teal-600',
                  hammer: 'from-gray-600 to-gray-500',
                  saw: 'from-yellow-600 to-amber-600',
                  wedge: 'from-purple-600 to-indigo-600',
                  flamethrower: 'from-orange-600 to-red-700',
                  emp: 'from-blue-500 to-cyan-500',
                  grapple: 'from-amber-700 to-yellow-600',
                  drill: 'from-stone-600 to-zinc-500',
                  plasma: 'from-fuchsia-600 to-purple-700',
                };

                const typeIcons: Record<string, string> = {
                  spinner: '🌀',
                  flipper: '⬆️',
                  hammer: '🔨',
                  saw: '🔪',
                  wedge: '📐',
                  flamethrower: '🔥',
                  emp: '⚡',
                  grapple: '🪝',
                  drill: '🔩',
                  plasma: '💫',
                };

                return (
                  <div
                    key={weapon.id}
                    className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700"
                  >
                    <div
                      className={`bg-gradient-to-r ${
                        typeColors[weapon.type] || 'from-gray-600 to-gray-500'
                      } p-4`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold">{weapon.name}</h3>
                          <div className="text-sm text-white/70 capitalize">
                            {weapon.type} • Tier {weapon.tier}
                          </div>
                        </div>
                        <div className="text-3xl">{typeIcons[weapon.type] || '⚔️'}</div>
                      </div>
                    </div>

                    <div className="p-4">
                      <p className="text-gray-300 text-sm mb-4">{weapon.description}</p>

                      <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
                        <div className="bg-gray-700 rounded p-2">
                          <div className="text-gray-400">Damage</div>
                          <div className="font-bold text-red-400">{weapon.baseDamage}</div>
                        </div>
                        <div className="bg-gray-700 rounded p-2">
                          <div className="text-gray-400">Weight</div>
                          <div className="font-bold text-gray-300">{weapon.weight}</div>
                        </div>
                        <div className="bg-gray-700 rounded p-2">
                          <div className="text-gray-400">Cooldown</div>
                          <div className="font-bold text-blue-400">
                            {weapon.cooldown / 1000}s
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          handlePurchase('weapon', weapon.id, weapon.cost, weapon.name)
                        }
                        disabled={stats.credits < weapon.cost}
                        className={`w-full py-3 rounded-lg font-bold transition-colors ${
                          stats.credits >= weapon.cost
                            ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <span className="mr-2">💰</span>
                        {weapon.cost} Credits
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Armor Tab */}
        {activeTab === 'armor' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lockedArmor.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-400">
                <div className="text-4xl mb-4">🎉</div>
                <p>You've unlocked all armor!</p>
              </div>
            ) : (
              lockedArmor.map((armor) => {
                const tierColors: Record<number, string> = {
                  1: 'from-gray-600 to-gray-500',
                  2: 'from-green-600 to-teal-600',
                  3: 'from-blue-600 to-purple-600',
                  4: 'from-amber-500 to-orange-600',
                };

                return (
                  <div
                    key={armor.id}
                    className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700"
                  >
                    <div
                      className={`bg-gradient-to-r ${
                        tierColors[armor.tier] || 'from-gray-600 to-gray-500'
                      } p-4`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold">{armor.name}</h3>
                          <div className="text-sm text-white/70">Tier {armor.tier}</div>
                        </div>
                        <div className="text-3xl">🛡️</div>
                      </div>
                    </div>

                    <div className="p-4">
                      <p className="text-gray-300 text-sm mb-4">{armor.description}</p>

                      <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                        <div className="bg-gray-700 rounded p-2">
                          <div className="text-gray-400">Damage Reduction</div>
                          <div className="font-bold text-cyan-400">
                            {Math.round(armor.damageReduction * 100)}%
                          </div>
                        </div>
                        <div className="bg-gray-700 rounded p-2">
                          <div className="text-gray-400">Weight</div>
                          <div className="font-bold text-gray-300">{armor.weight}</div>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          handlePurchase('armor', armor.id, armor.cost, armor.name)
                        }
                        disabled={stats.credits < armor.cost}
                        className={`w-full py-3 rounded-lg font-bold transition-colors ${
                          stats.credits >= armor.cost
                            ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <span className="mr-2">💰</span>
                        {armor.cost} Credits
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Already Owned Section */}
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4 text-gray-400">Already Owned</h2>
          <div className="flex flex-wrap gap-2">
            {unlockedChassis.map((id) => {
              const chassis = CHASSIS[id];
              return chassis ? (
                <div
                  key={id}
                  className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300"
                >
                  🤖 {chassis.name}
                </div>
              ) : null;
            })}
            {unlockedWeapons.map((id) => {
              const weapon = WEAPONS[id];
              return weapon ? (
                <div
                  key={id}
                  className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300"
                >
                  ⚔️ {weapon.name}
                </div>
              ) : null;
            })}
            {unlockedArmor.map((id) => {
              const armor = ARMOR[id];
              return armor ? (
                <div
                  key={id}
                  className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300"
                >
                  🛡️ {armor.name}
                </div>
              ) : null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
