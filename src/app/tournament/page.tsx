'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { BattleCanvas } from '@/components/BattleCanvas';
import { HUD } from '@/components/HUD';
import { useGameStore } from '@/stores/gameStore';
import { usePlayerStore } from '@/stores/playerStore';
import { ARENAS } from '@/data/arenas';
import { BotConfig, BehaviorType } from '@/game/types';

// Tournament bracket opponents - increasingly difficult
const TOURNAMENT_OPPONENTS: BotConfig[][] = [
  // Round 1 - Easy
  [
    {
      id: 'tourney-1',
      name: 'Rust Bucket',
      chassisId: 'scout',
      weaponIds: ['basicWedge'],
      armorId: null,
      aiConfig: {
        primaryBehavior: 'aggressive',
        secondaryBehavior: null,
        aggression: 40,
        engagementDistance: 100,
      },
      color: '#8B4513',
    },
  ],
  // Round 2 - Medium
  [
    {
      id: 'tourney-2',
      name: 'Steel Fang',
      chassisId: 'brawler',
      weaponIds: ['miniSpinner', 'basicFlipper'],
      armorId: null,
      aiConfig: {
        primaryBehavior: 'flanker',
        secondaryBehavior: 'aggressive',
        aggression: 60,
        engagementDistance: 80,
      },
      color: '#4169E1',
    },
  ],
  // Round 3 - Hard
  [
    {
      id: 'tourney-3',
      name: 'Devastator',
      chassisId: 'tank',
      weaponIds: ['spikeHammer', 'buzzSaw'],
      armorId: null,
      aiConfig: {
        primaryBehavior: 'ram',
        secondaryBehavior: 'defensive',
        aggression: 80,
        engagementDistance: 60,
      },
      color: '#DC143C',
    },
  ],
  // Championship - Boss
  [
    {
      id: 'tourney-champion',
      name: 'OMEGA DESTROYER',
      chassisId: 'juggernaut',
      weaponIds: ['deathBlossom', 'mjolnir'],
      armorId: null,
      aiConfig: {
        primaryBehavior: 'aggressive',
        secondaryBehavior: 'reactive',
        aggression: 95,
        engagementDistance: 50,
      },
      color: '#FFD700',
    },
  ],
];

const ROUND_NAMES = ['Round 1', 'Semi-Finals', 'Finals', 'Championship'];
const ROUND_REWARDS = [
  { xp: 75, credits: 150 },
  { xp: 100, credits: 250 },
  { xp: 150, credits: 400 },
  { xp: 300, credits: 1000 },
];

export default function TournamentPage() {
  const { clearBattle } = useGameStore();
  const { stats, addXp, addCredits, recordWin, recordLoss, getActiveBot } =
    usePlayerStore();

  const [currentRound, setCurrentRound] = useState(0);
  const [battleKey, setBattleKey] = useState(0);
  const [tournamentState, setTournamentState] = useState<
    'lobby' | 'fighting' | 'victory' | 'defeat' | 'champion'
  >('lobby');
  const [roundResult, setRoundResult] = useState<{
    won: boolean;
    xp: number;
    credits: number;
  } | null>(null);

  const playerBot = getActiveBot();

  const handleBattleEnd = useCallback(
    (winnerId: string | null) => {
      if (!playerBot) return;

      const rewards = ROUND_REWARDS[currentRound];

      if (winnerId === playerBot.id) {
        recordWin();
        addXp(rewards.xp);
        addCredits(rewards.credits);
        setRoundResult({ won: true, xp: rewards.xp, credits: rewards.credits });

        if (currentRound >= TOURNAMENT_OPPONENTS.length - 1) {
          setTournamentState('champion');
        } else {
          setTournamentState('victory');
        }
      } else {
        recordLoss();
        addXp(Math.floor(rewards.xp / 4)); // Consolation XP
        setRoundResult({
          won: false,
          xp: Math.floor(rewards.xp / 4),
          credits: 0,
        });
        setTournamentState('defeat');
      }
    },
    [playerBot, currentRound, recordWin, recordLoss, addXp, addCredits]
  );

  const startTournament = () => {
    setCurrentRound(0);
    clearBattle();
    setTournamentState('fighting');
    setBattleKey((k) => k + 1);
  };

  const nextRound = () => {
    setCurrentRound((r) => r + 1);
    clearBattle();
    setTournamentState('fighting');
    setBattleKey((k) => k + 1);
    setRoundResult(null);
  };

  const backToLobby = () => {
    setTournamentState('lobby');
    setCurrentRound(0);
    setRoundResult(null);
    clearBattle();
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
            href="/garage"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Go to Garage
          </Link>
        </div>
      </div>
    );
  }

  const currentOpponent = TOURNAMENT_OPPONENTS[currentRound]?.[0];
  const arena = ARENAS.thunderdome; // Tournament always uses the big arena

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
        <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
          Tournament Mode
        </h1>
        <div className="text-right">
          <div className="text-sm text-gray-400">Current Rank</div>
          <div className="text-xl font-bold text-purple-400">{stats.currentRank}</div>
        </div>
      </div>

      {/* Lobby State */}
      {tournamentState === 'lobby' && (
        <div className="max-w-4xl mx-auto">
          {/* Tournament Bracket */}
          <div className="bg-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-center mb-6">Tournament Bracket</h2>

            <div className="grid grid-cols-4 gap-4">
              {TOURNAMENT_OPPONENTS.map((opponents, round) => (
                <div key={round} className="text-center">
                  <div className="text-sm text-gray-400 mb-2">{ROUND_NAMES[round]}</div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-3xl mb-2">
                      {round === 3 ? '👑' : '🤖'}
                    </div>
                    <div
                      className="font-bold"
                      style={{ color: opponents[0].color }}
                    >
                      {opponents[0].name}
                    </div>
                    <div className="text-xs text-gray-400 capitalize mt-1">
                      {opponents[0].chassisId}
                    </div>
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="text-yellow-400">
                      +{ROUND_REWARDS[round].credits}
                    </span>
                    <span className="text-gray-500 mx-1">|</span>
                    <span className="text-blue-400">
                      +{ROUND_REWARDS[round].xp} XP
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Your Bot */}
          <div className="bg-gray-800 rounded-xl p-6 mb-6">
            <h3 className="font-bold mb-4 text-gray-300">Your Fighter</h3>
            <div className="flex items-center gap-6">
              <div
                className="w-20 h-20 rounded-lg flex items-center justify-center text-4xl"
                style={{ backgroundColor: playerBot.color + '33' }}
              >
                🤖
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold" style={{ color: playerBot.color }}>
                  {playerBot.name}
                </div>
                <div className="text-gray-400 capitalize">
                  {playerBot.chassisId} • {playerBot.weaponIds.length} weapons
                </div>
              </div>
              <Link
                href="/garage"
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
              >
                Change Bot
              </Link>
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={startTournament}
            className="w-full py-6 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 rounded-xl font-bold text-2xl text-black transition-all hover:scale-105"
          >
            🏆 ENTER TOURNAMENT
          </button>
        </div>
      )}

      {/* Fighting State */}
      {tournamentState === 'fighting' && currentOpponent && (
        <div>
          {/* Round Header */}
          <div className="text-center mb-4">
            <div className="text-sm text-gray-400">{ROUND_NAMES[currentRound]}</div>
            <div className="text-xl font-bold">
              <span style={{ color: playerBot.color }}>{playerBot.name}</span>
              <span className="mx-4 text-gray-500">VS</span>
              <span style={{ color: currentOpponent.color }}>
                {currentOpponent.name}
              </span>
            </div>
          </div>

          <div className="flex justify-center gap-8">
            <BattleCanvas
              key={battleKey}
              arena={arena}
              bots={[playerBot, currentOpponent]}
              onBattleEnd={handleBattleEnd}
              autoStart={true}
            />
            <HUD />
          </div>
        </div>
      )}

      {/* Victory State */}
      {tournamentState === 'victory' && roundResult && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-8 text-center max-w-md">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-4xl font-bold text-green-400 mb-4">VICTORY!</h2>
            <p className="text-gray-300 mb-4">
              You defeated {currentOpponent?.name} and advance to the next round!
            </p>
            <div className="space-y-2 mb-6">
              <p className="text-blue-400">+{roundResult.xp} XP</p>
              <p className="text-yellow-400">+{roundResult.credits} Credits</p>
            </div>
            <button
              onClick={nextRound}
              className="w-full py-4 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-xl transition-colors"
            >
              Next Round →
            </button>
          </div>
        </div>
      )}

      {/* Defeat State */}
      {tournamentState === 'defeat' && roundResult && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-8 text-center max-w-md">
            <div className="text-6xl mb-4">💥</div>
            <h2 className="text-4xl font-bold text-red-400 mb-4">DEFEATED</h2>
            <p className="text-gray-300 mb-4">
              {currentOpponent?.name} was too strong this time.
            </p>
            <div className="space-y-2 mb-6">
              <p className="text-blue-400">+{roundResult.xp} XP (Consolation)</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={startTournament}
                className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 rounded-lg font-bold transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={backToLobby}
                className="flex-1 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg font-bold transition-colors"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Champion State */}
      {tournamentState === 'champion' && roundResult && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gradient-to-b from-yellow-900 to-gray-800 rounded-xl p-8 text-center max-w-md border-4 border-yellow-500">
            <div className="text-8xl mb-4">👑</div>
            <h2 className="text-4xl font-bold text-yellow-400 mb-4">
              TOURNAMENT CHAMPION!
            </h2>
            <p className="text-gray-300 mb-4">
              You've defeated all opponents and claimed the championship!
            </p>
            <div className="space-y-2 mb-6">
              <p className="text-blue-400 text-xl">+{roundResult.xp} XP</p>
              <p className="text-yellow-400 text-xl">+{roundResult.credits} Credits</p>
            </div>
            <button
              onClick={backToLobby}
              className="w-full py-4 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg font-bold text-xl transition-colors"
            >
              🏆 Claim Victory
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
