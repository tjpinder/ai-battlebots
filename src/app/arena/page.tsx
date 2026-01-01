'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePlayerStore } from '@/stores/playerStore';
import { Commentator, CommentaryFeed, CommentaryEvent } from '@/components/Commentator';
import { BotConfig } from '@/game/types';

interface BotState {
  id: string;
  hp: number;
  maxHp: number;
  isAlive: boolean;
  position: { x: number; y: number };
  finalAction?: string;
}

interface BattleResult {
  battleId: string;
  status: string;
  playerBot: { id: string; name: string; color: string };
  opponentBot: { id: string; name: string; color: string };
  arenaId: string;
  result: {
    winner: string | null;
    winnerName: string;
    playerWon: boolean;
    duration: number;
    frameCount: number;
    finalStates: BotState[];
    commentary?: CommentaryEvent[];
  };
  createdAt: string;
  completedAt: string;
}

// Predefined opponents for async battles
const ARENA_OPPONENTS = [
  {
    id: 'arena-crusher',
    name: 'The Crusher',
    chassisId: 'heavyweight',
    weaponIds: ['crushingHammer', 'basicWedge'],
    armorId: 'titaniumShell',
    aiConfig: { primaryBehavior: 'ram', secondaryBehavior: 'aggressive', aggression: 85, engagementDistance: 70 },
    color: '#cc4444',
    script: `WHEN distance_to_enemy < 80 DO attack
WHEN i_am_heavier DO ram
WHEN my_hp_percent < 20 DO retreat
DEFAULT approach`,
    difficulty: 'Hard',
    description: 'A massive heavyweight with devastating hammer strikes',
  },
  {
    id: 'arena-phantom',
    name: 'Phantom',
    chassisId: 'speedster',
    weaponIds: ['buzzer'],
    armorId: null,
    aiConfig: { primaryBehavior: 'flanker', secondaryBehavior: 'defensive', aggression: 70, engagementDistance: 90 },
    color: '#aa44ff',
    script: `WHEN i_am_faster DO circle_right
WHEN distance_to_enemy < 50 DO attack
WHEN my_hp_percent < 30 DO flee_to_center
DEFAULT flank`,
    difficulty: 'Medium',
    description: 'Lightning fast with hit-and-run tactics',
  },
  {
    id: 'arena-fortress',
    name: 'Fortress',
    chassisId: 'tank',
    weaponIds: ['heavySpinner', 'basicWedge'],
    armorId: 'compositePlating',
    aiConfig: { primaryBehavior: 'defensive', secondaryBehavior: 'reactive', aggression: 25, engagementDistance: 150 },
    color: '#4488aa',
    script: `WHEN my_hp_percent < 15 DO retreat
WHEN enemy_hp_percent < 25 DO attack
WHEN distance_to_enemy < 100 DO circle_left
DEFAULT approach`,
    difficulty: 'Medium',
    description: 'Heavy armor and patient defensive strategy',
  },
  {
    id: 'arena-berserker',
    name: 'Berserker',
    chassisId: 'brawler',
    weaponIds: ['powerFlipper', 'miniSpinner'],
    armorId: 'steelPlating',
    aiConfig: { primaryBehavior: 'aggressive', secondaryBehavior: 'ram', aggression: 95, engagementDistance: 50 },
    color: '#ff6644',
    script: `WHEN distance_to_enemy < 60 DO attack
WHEN distance_to_enemy < 120 DO ram
DEFAULT attack`,
    difficulty: 'Hard',
    description: 'Relentless aggression with no retreat',
  },
  {
    id: 'arena-technician',
    name: 'The Technician',
    chassisId: 'scout',
    weaponIds: ['basicFlipper', 'miniSpinner'],
    armorId: 'lightPlating',
    aiConfig: { primaryBehavior: 'reactive', secondaryBehavior: 'flanker', aggression: 50, engagementDistance: 100 },
    color: '#44cc88',
    script: `WHEN enemy_hp_percent < my_hp_percent AND distance_to_enemy < 80 DO attack
WHEN my_hp_percent < 40 DO flee_to_center
WHEN distance_to_enemy > 150 DO approach
DEFAULT circle_right`,
    difficulty: 'Easy',
    description: 'Smart positioning and calculated strikes',
  },
];

const ARENA_OPTIONS = [
  { id: 'basicPit', name: 'The Pit', description: 'Central pit hazard - avoid the center!' },
  { id: 'warzone', name: 'Warzone', description: 'Multiple spike hazards around the arena' },
  { id: 'thunderdome', name: 'Thunderdome', description: 'Pure combat - no hazards, just skill' },
];

// API configuration - use relative URL for Azure Static Web Apps linked API
const API_BASE_URL = '/api';

export default function ArenaPage() {
  const { stats, getActiveBot, recordWin, recordLoss, addXp, addCredits } = usePlayerStore();
  const [selectedOpponent, setSelectedOpponent] = useState(0);
  const [selectedArena, setSelectedArena] = useState('basicPit');
  const [battleState, setBattleState] = useState<'idle' | 'loading' | 'result'>('idle');
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCommentaryPlaying, setIsCommentaryPlaying] = useState(false);
  const [showInstantResults, setShowInstantResults] = useState(false);

  const playerBot = getActiveBot();
  const opponent = ARENA_OPPONENTS[selectedOpponent];

  async function queueBattle() {
    if (!playerBot) return;

    setBattleState('loading');
    setError(null);
    setBattleResult(null);
    setShowInstantResults(false);
    setIsCommentaryPlaying(false);

    try {
      const response = await fetch(`${API_BASE_URL}/battles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerBot: {
            ...playerBot,
            script: playerBot.script || `WHEN distance_to_enemy < 80 DO attack
WHEN my_hp_percent < 25 DO retreat
DEFAULT approach`,
          },
          opponentType: 'specific',
          opponentBot: {
            id: opponent.id,
            name: opponent.name,
            chassisId: opponent.chassisId,
            weaponIds: opponent.weaponIds,
            armorId: opponent.armorId,
            aiConfig: opponent.aiConfig,
            color: opponent.color,
            script: opponent.script,
          },
          arenaId: selectedArena,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Battle failed');
      }

      const result = await response.json() as BattleResult;
      setBattleResult(result);
      setBattleState('result');

      // Update player stats
      if (result.result.playerWon) {
        recordWin();
        addXp(75); // More XP for arena battles
        addCredits(150);
      } else {
        recordLoss();
        addXp(15);
      }

      // Start commentary playback after a short delay
      setTimeout(() => {
        setIsCommentaryPlaying(true);
      }, 500);
    } catch (err: any) {
      console.error('Battle error:', err);
      setError(err.message || 'Failed to run battle');
      setBattleState('idle');
    }
  }

  function resetBattle() {
    setBattleState('idle');
    setBattleResult(null);
    setError(null);
    setIsCommentaryPlaying(false);
    setShowInstantResults(false);
  }

  if (!playerBot) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Bot Selected</h1>
          <p className="text-gray-400 mb-4">You need to create or select a bot first.</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900/20 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800/80 border-b border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link
            href="/"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            ← Back
          </Link>
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            BATTLE ARENA
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">Level {stats.level}</span>
            <span className="text-yellow-400">{stats.credits} Credits</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Idle State - Setup */}
        {battleState === 'idle' && (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Your Bot */}
            <div className="bg-gray-800/60 rounded-xl p-6 border border-gray-700">
              <h2 className="text-lg font-bold text-blue-400 mb-4">YOUR BOT</h2>
              <div className="flex items-center gap-4">
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
                  <div className="text-gray-400 capitalize">
                    {playerBot.chassisId} • {playerBot.weaponIds.length} weapon(s)
                  </div>
                </div>
                <Link
                  href="/garage"
                  className="ml-auto px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
                >
                  Change Bot
                </Link>
              </div>
            </div>

            {/* Arena Selection */}
            <div className="bg-gray-800/60 rounded-xl p-6 border border-gray-700">
              <h2 className="text-lg font-bold text-purple-400 mb-4">SELECT ARENA</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {ARENA_OPTIONS.map((arena) => (
                  <button
                    key={arena.id}
                    onClick={() => setSelectedArena(arena.id)}
                    className={`p-4 rounded-lg text-left transition-all ${
                      selectedArena === arena.id
                        ? 'bg-purple-600/30 border-2 border-purple-500 scale-[1.02]'
                        : 'bg-gray-700/50 border border-gray-600 hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-bold">{arena.name}</div>
                    <div className="text-sm text-gray-400">{arena.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Opponent Selection */}
            <div className="bg-gray-800/60 rounded-xl p-6 border border-gray-700">
              <h2 className="text-lg font-bold text-red-400 mb-4">CHOOSE OPPONENT</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ARENA_OPPONENTS.map((opp, idx) => (
                  <button
                    key={opp.id}
                    onClick={() => setSelectedOpponent(idx)}
                    className={`p-4 rounded-lg text-left transition-all ${
                      selectedOpponent === idx
                        ? 'bg-red-600/20 border-2 border-red-500 scale-[1.02]'
                        : 'bg-gray-700/50 border border-gray-600 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                        style={{ backgroundColor: opp.color + '33' }}
                      >
                        🤖
                      </div>
                      <div>
                        <div className="font-bold" style={{ color: opp.color }}>
                          {opp.name}
                        </div>
                        <div
                          className={`text-xs px-2 py-0.5 rounded inline-block ${
                            opp.difficulty === 'Hard'
                              ? 'bg-red-500/30 text-red-300'
                              : opp.difficulty === 'Medium'
                              ? 'bg-yellow-500/30 text-yellow-300'
                              : 'bg-green-500/30 text-green-300'
                          }`}
                        >
                          {opp.difficulty}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">{opp.description}</div>
                    <div className="text-xs text-gray-500 mt-2 capitalize">
                      {opp.chassisId} • {opp.aiConfig.primaryBehavior}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-300">
                {error}
              </div>
            )}

            {/* Start Battle Button */}
            <button
              onClick={queueBattle}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-bold text-2xl transition-all hover:scale-[1.02] shadow-lg shadow-purple-500/25"
            >
              ⚔️ START ARENA BATTLE
            </button>
          </div>
        )}

        {/* Loading State */}
        {battleState === 'loading' && (
          <div className="max-w-md mx-auto text-center py-20">
            <div className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-2">Battle in Progress...</h2>
            <p className="text-gray-400">
              {playerBot.name} vs {opponent.name}
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Running simulation on the arena server
            </p>
          </div>
        )}

        {/* Result State */}
        {battleState === 'result' && battleResult && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Result Banner */}
            <div
              className={`rounded-xl p-8 text-center ${
                battleResult.result.playerWon
                  ? 'bg-gradient-to-r from-green-600/30 to-emerald-600/30 border border-green-500'
                  : 'bg-gradient-to-r from-red-600/30 to-orange-600/30 border border-red-500'
              }`}
            >
              <h2
                className={`text-5xl font-black mb-2 ${
                  battleResult.result.playerWon ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {battleResult.result.playerWon ? 'VICTORY!' : 'DEFEAT'}
              </h2>
              <p className="text-xl text-gray-300">
                {battleResult.result.winnerName} wins!
              </p>
              <div className="mt-4 flex justify-center gap-8 text-sm">
                <div>
                  <div className="text-gray-400">Duration</div>
                  <div className="font-bold">{(battleResult.result.duration / 1000).toFixed(1)}s</div>
                </div>
                <div>
                  <div className="text-gray-400">Frames</div>
                  <div className="font-bold">{battleResult.result.frameCount}</div>
                </div>
              </div>
              <div className="mt-4 text-lg">
                {battleResult.result.playerWon ? (
                  <span className="text-green-300">+75 XP • +150 Credits</span>
                ) : (
                  <span className="text-red-300">+15 XP</span>
                )}
              </div>
            </div>

            {/* Bot Final States */}
            <div className="grid grid-cols-2 gap-4">
              {battleResult.result.finalStates.map((state) => {
                const isPlayer = state.id === battleResult.playerBot.id;
                const botInfo = isPlayer ? battleResult.playerBot : battleResult.opponentBot;
                return (
                  <div
                    key={state.id}
                    className={`bg-gray-800/60 rounded-xl p-4 border ${
                      state.isAlive ? 'border-green-500/50' : 'border-red-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                        style={{ backgroundColor: botInfo.color + '33' }}
                      >
                        {state.isAlive ? '🤖' : '💀'}
                      </div>
                      <div>
                        <div className="font-bold" style={{ color: botInfo.color }}>
                          {botInfo.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {isPlayer ? 'Your Bot' : 'Opponent'}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>HP</span>
                          <span>
                            {state.hp}/{state.maxHp}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              state.hp / state.maxHp > 0.5
                                ? 'bg-green-500'
                                : state.hp / state.maxHp > 0.25
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${(state.hp / state.maxHp) * 100}%` }}
                          />
                        </div>
                      </div>
                      {state.finalAction && (
                        <div className="text-xs text-gray-500">
                          Last action: <span className="text-gray-300">{state.finalAction}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Commentary Toggle */}
            {battleResult.result.commentary && battleResult.result.commentary.length > 0 && (
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => {
                    setShowInstantResults(false);
                    setIsCommentaryPlaying(true);
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    !showInstantResults
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  🎬 Animated Playback
                </button>
                <button
                  onClick={() => {
                    setIsCommentaryPlaying(false);
                    setShowInstantResults(true);
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    showInstantResults
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  📋 Full Log
                </button>
              </div>
            )}

            {/* Commentary Display */}
            {battleResult.result.commentary && battleResult.result.commentary.length > 0 && (
              showInstantResults ? (
                <CommentaryFeed commentary={battleResult.result.commentary} />
              ) : (
                <Commentator
                  commentary={battleResult.result.commentary}
                  isPlaying={isCommentaryPlaying}
                  playbackSpeed={2}
                  onComplete={() => setIsCommentaryPlaying(false)}
                />
              )
            )}

            {/* Actions */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={queueBattle}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold transition-colors"
              >
                Rematch
              </button>
              <button
                onClick={resetBattle}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Choose New Opponent
              </button>
              <Link
                href="/"
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Main Menu
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
