'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePlayerStore } from '@/stores/playerStore';

interface LeaderboardEntry {
  id: string;
  name: string;
  rank: string;
  wins: number;
  losses: number;
  winRate: number;
  level: number;
  isPlayer: boolean;
  botName?: string;
}

// Simulated AI opponents for the leaderboard
const AI_OPPONENTS: Omit<LeaderboardEntry, 'winRate'>[] = [
  { id: 'ai-1', name: 'DeathMachine_99', rank: 'Champion', wins: 487, losses: 52, level: 50, isPlayer: false, botName: 'Obliterator' },
  { id: 'ai-2', name: 'SpinToWin', rank: 'Champion', wins: 423, losses: 89, level: 47, isPlayer: false, botName: 'Cyclone' },
  { id: 'ai-3', name: 'FlipMaster', rank: 'Platinum', wins: 312, losses: 98, level: 42, isPlayer: false, botName: 'Sky Launcher' },
  { id: 'ai-4', name: 'HammerTime', rank: 'Platinum', wins: 289, losses: 124, level: 38, isPlayer: false, botName: 'Thor Jr' },
  { id: 'ai-5', name: 'BotDestroyer', rank: 'Platinum', wins: 256, losses: 112, level: 35, isPlayer: false, botName: 'Nemesis' },
  { id: 'ai-6', name: 'RobotWars_Fan', rank: 'Gold', wins: 198, losses: 156, level: 28, isPlayer: false, botName: 'Tribute' },
  { id: 'ai-7', name: 'ArenaKing', rank: 'Gold', wins: 187, losses: 143, level: 26, isPlayer: false, botName: 'Monarch' },
  { id: 'ai-8', name: 'MechMayhem', rank: 'Gold', wins: 165, losses: 134, level: 24, isPlayer: false, botName: 'Chaos' },
  { id: 'ai-9', name: 'BattleBotPro', rank: 'Silver', wins: 134, losses: 98, level: 20, isPlayer: false, botName: 'Champion' },
  { id: 'ai-10', name: 'IronClash', rank: 'Silver', wins: 112, losses: 89, level: 18, isPlayer: false, botName: 'Ironside' },
  { id: 'ai-11', name: 'SawBladeX', rank: 'Silver', wins: 98, losses: 112, level: 15, isPlayer: false, botName: 'Ripper' },
  { id: 'ai-12', name: 'FlameBot', rank: 'Bronze', wins: 76, losses: 87, level: 12, isPlayer: false, botName: 'Inferno' },
  { id: 'ai-13', name: 'NewChallenger', rank: 'Bronze', wins: 45, losses: 67, level: 8, isPlayer: false, botName: 'Rookie' },
  { id: 'ai-14', name: 'FirstTimer', rank: 'Bronze', wins: 23, losses: 34, level: 5, isPlayer: false, botName: 'Starter' },
  { id: 'ai-15', name: 'JustStarted', rank: 'Bronze', wins: 12, losses: 28, level: 3, isPlayer: false, botName: 'Beginner' },
];

type SortKey = 'rank' | 'wins' | 'winRate' | 'level';

const RANK_ORDER = ['Champion', 'Platinum', 'Gold', 'Silver', 'Bronze'];

export default function LeaderboardPage() {
  const { playerName, stats, getActiveBot } = usePlayerStore();
  const [sortBy, setSortBy] = useState<SortKey>('wins');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const activeBot = getActiveBot();

  useEffect(() => {
    // Create player entry
    const playerEntry: LeaderboardEntry = {
      id: 'player',
      name: playerName,
      rank: stats.currentRank,
      wins: stats.totalWins,
      losses: stats.totalLosses,
      winRate: stats.totalWins + stats.totalLosses > 0
        ? Math.round((stats.totalWins / (stats.totalWins + stats.totalLosses)) * 100)
        : 0,
      level: stats.level,
      isPlayer: true,
      botName: activeBot?.name,
    };

    // Add win rate to AI opponents
    const aiWithWinRate: LeaderboardEntry[] = AI_OPPONENTS.map((ai) => ({
      ...ai,
      winRate: Math.round((ai.wins / (ai.wins + ai.losses)) * 100),
    }));

    // Combine and sort
    const combined = [playerEntry, ...aiWithWinRate];
    setLeaderboard(combined);
  }, [playerName, stats, activeBot]);

  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    switch (sortBy) {
      case 'rank':
        const rankDiff = RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank);
        if (rankDiff !== 0) return rankDiff;
        return b.wins - a.wins;
      case 'wins':
        return b.wins - a.wins;
      case 'winRate':
        return b.winRate - a.winRate;
      case 'level':
        return b.level - a.level;
      default:
        return 0;
    }
  });

  const playerRank = sortedLeaderboard.findIndex((e) => e.isPlayer) + 1;

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'Champion':
        return 'text-yellow-400';
      case 'Platinum':
        return 'text-cyan-400';
      case 'Gold':
        return 'text-amber-400';
      case 'Silver':
        return 'text-gray-300';
      case 'Bronze':
        return 'text-orange-600';
      default:
        return 'text-gray-400';
    }
  };

  const getRankBadge = (rank: string) => {
    switch (rank) {
      case 'Champion':
        return '👑';
      case 'Platinum':
        return '💎';
      case 'Gold':
        return '🥇';
      case 'Silver':
        return '🥈';
      case 'Bronze':
        return '🥉';
      default:
        return '🎮';
    }
  };

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
        <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
          Leaderboard
        </h1>
        <div className="text-gray-400 text-sm">
          Your Rank: #{playerRank}
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Player Summary Card */}
        <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-xl p-6 mb-6 border border-blue-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold">
                {playerName[0].toUpperCase()}
              </div>
              <div>
                <div className="text-2xl font-bold">{playerName}</div>
                <div className={`flex items-center gap-2 ${getRankColor(stats.currentRank)}`}>
                  <span>{getRankBadge(stats.currentRank)}</span>
                  <span className="font-bold">{stats.currentRank}</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400">Level {stats.level}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-green-400">{stats.totalWins}</div>
                <div className="text-sm text-gray-500">Wins</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-400">{stats.totalLosses}</div>
                <div className="text-sm text-gray-500">Losses</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-400">
                  {stats.totalWins + stats.totalLosses > 0
                    ? Math.round((stats.totalWins / (stats.totalWins + stats.totalLosses)) * 100)
                    : 0}%
                </div>
                <div className="text-sm text-gray-500">Win Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex gap-2 mb-4">
          <span className="text-gray-400 py-2">Sort by:</span>
          {[
            { key: 'wins', label: 'Wins' },
            { key: 'winRate', label: 'Win Rate' },
            { key: 'level', label: 'Level' },
            { key: 'rank', label: 'Rank' },
          ].map((option) => (
            <button
              key={option.key}
              onClick={() => setSortBy(option.key as SortKey)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                sortBy === option.key
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Leaderboard Table */}
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-gray-700 font-bold text-sm text-gray-300">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-4">Player</div>
            <div className="col-span-2 text-center">Rank</div>
            <div className="col-span-1 text-center">Lvl</div>
            <div className="col-span-2 text-center">W/L</div>
            <div className="col-span-2 text-center">Win %</div>
          </div>

          {/* Table Rows */}
          {sortedLeaderboard.map((entry, index) => (
            <div
              key={entry.id}
              className={`grid grid-cols-12 gap-4 p-4 items-center transition-colors ${
                entry.isPlayer
                  ? 'bg-blue-900/30 border-l-4 border-blue-500'
                  : index % 2 === 0
                  ? 'bg-gray-800'
                  : 'bg-gray-750'
              } ${index < sortedLeaderboard.length - 1 ? 'border-b border-gray-700' : ''}`}
            >
              {/* Position */}
              <div className="col-span-1 text-center">
                {index === 0 && (
                  <span className="text-2xl">🏆</span>
                )}
                {index === 1 && (
                  <span className="text-xl">🥈</span>
                )}
                {index === 2 && (
                  <span className="text-xl">🥉</span>
                )}
                {index > 2 && (
                  <span className="text-gray-400 font-bold">{index + 1}</span>
                )}
              </div>

              {/* Player Info */}
              <div className="col-span-4">
                <div className={`font-bold ${entry.isPlayer ? 'text-blue-400' : 'text-white'}`}>
                  {entry.name}
                  {entry.isPlayer && <span className="ml-2 text-xs text-blue-300">(You)</span>}
                </div>
                {entry.botName && (
                  <div className="text-sm text-gray-500">
                    🤖 {entry.botName}
                  </div>
                )}
              </div>

              {/* Rank */}
              <div className={`col-span-2 text-center font-bold ${getRankColor(entry.rank)}`}>
                <span className="mr-1">{getRankBadge(entry.rank)}</span>
                {entry.rank}
              </div>

              {/* Level */}
              <div className="col-span-1 text-center text-gray-300">
                {entry.level}
              </div>

              {/* Win/Loss */}
              <div className="col-span-2 text-center">
                <span className="text-green-400">{entry.wins}</span>
                <span className="text-gray-500 mx-1">/</span>
                <span className="text-red-400">{entry.losses}</span>
              </div>

              {/* Win Rate */}
              <div className="col-span-2 text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        entry.winRate >= 70
                          ? 'bg-green-500'
                          : entry.winRate >= 50
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${entry.winRate}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-300">{entry.winRate}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Summary */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-xl p-6 text-center">
            <div className="text-4xl mb-2">📊</div>
            <div className="text-2xl font-bold text-blue-400">
              {sortedLeaderboard.length}
            </div>
            <div className="text-gray-500">Total Players</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 text-center">
            <div className="text-4xl mb-2">⚔️</div>
            <div className="text-2xl font-bold text-amber-400">
              {sortedLeaderboard.reduce((sum, e) => sum + e.wins + e.losses, 0)}
            </div>
            <div className="text-gray-500">Total Battles</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 text-center">
            <div className="text-4xl mb-2">🎯</div>
            <div className="text-2xl font-bold text-green-400">
              {Math.round(
                sortedLeaderboard.reduce((sum, e) => sum + e.winRate, 0) /
                  sortedLeaderboard.length
              )}%
            </div>
            <div className="text-gray-500">Avg Win Rate</div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 mb-4">
            Climb the ranks by winning battles in Tournament mode!
          </p>
          <Link
            href="/tournament"
            className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-bold transition-all hover:scale-105"
          >
            🏆 Enter Tournament
          </Link>
        </div>
      </div>
    </div>
  );
}
