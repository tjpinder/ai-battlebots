'use client';

import Link from 'next/link';
import { usePlayerStore } from '@/stores/playerStore';

export default function Home() {
  const { playerName, stats, savedBots, getActiveBot, setPlayerName } =
    usePlayerStore();

  const activeBot = getActiveBot();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated background grid */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }}
          />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-16">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-6xl font-black mb-4 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
              AI BATTLEBOTS
            </h1>
            <p className="text-xl text-gray-400">
              Build. Fight. Dominate.
            </p>
          </div>

          {/* Player Stats Bar */}
          <div className="max-w-4xl mx-auto mb-12 bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl font-bold">
                  {playerName[0].toUpperCase()}
                </div>
                <div>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="bg-transparent text-white font-bold text-lg border-b border-transparent hover:border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                  <div className="text-sm text-gray-400">
                    Level {stats.level} {stats.currentRank}
                  </div>
                </div>
              </div>

              <div className="flex gap-6 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {stats.totalWins}
                  </div>
                  <div className="text-gray-500">Wins</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">
                    {stats.totalLosses}
                  </div>
                  <div className="text-gray-500">Losses</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {stats.credits}
                  </div>
                  <div className="text-gray-500">Credits</div>
                </div>
              </div>

              {/* XP Bar */}
              <div className="w-full sm:w-48">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>XP</span>
                  <span>
                    {stats.xp} / {stats.xpToNextLevel}
                  </span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                    style={{
                      width: `${(stats.xp / stats.xpToNextLevel) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Menu */}
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Battle */}
            <Link
              href="/battle"
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-red-600 to-orange-600 p-6 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-red-500/20"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="text-4xl mb-2">⚔️</div>
                <h2 className="text-2xl font-bold mb-2">Quick Battle</h2>
                <p className="text-white/70">
                  Jump into a fight with your current bot
                </p>
                {activeBot && (
                  <div className="mt-4 px-3 py-1 bg-black/30 rounded-lg inline-block">
                    Using: <span className="font-bold">{activeBot.name}</span>
                  </div>
                )}
              </div>
            </Link>

            {/* Garage */}
            <Link
              href="/garage"
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 p-6 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="text-4xl mb-2">🔧</div>
                <h2 className="text-2xl font-bold mb-2">Garage</h2>
                <p className="text-white/70">
                  Build and customize your battle bots
                </p>
                <div className="mt-4 px-3 py-1 bg-black/30 rounded-lg inline-block">
                  {savedBots.length} bot{savedBots.length !== 1 ? 's' : ''} saved
                </div>
              </div>
            </Link>

            {/* Tournament */}
            <Link
              href="/tournament"
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 p-6 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="text-4xl mb-2">🏆</div>
                <h2 className="text-2xl font-bold mb-2">Tournament</h2>
                <p className="text-white/70">
                  Compete in ranked battles and climb the ladder
                </p>
                <div className="mt-4 px-3 py-1 bg-black/30 rounded-lg inline-block">
                  Current Rank: <span className="font-bold">{stats.currentRank}</span>
                </div>
              </div>
            </Link>

            {/* Shop */}
            <Link
              href="/shop"
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 p-6 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="text-4xl mb-2">🛒</div>
                <h2 className="text-2xl font-bold mb-2">Shop</h2>
                <p className="text-white/70">
                  Buy new parts, weapons, and upgrades
                </p>
                <div className="mt-4 px-3 py-1 bg-black/30 rounded-lg inline-block">
                  {stats.credits} Credits available
                </div>
              </div>
            </Link>

            {/* Training */}
            <Link
              href="/training"
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-cyan-600 to-teal-600 p-6 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="text-4xl mb-2">🎯</div>
                <h2 className="text-2xl font-bold mb-2">Training</h2>
                <p className="text-white/70">
                  Practice against configurable AI
                </p>
                <div className="mt-4 px-3 py-1 bg-black/30 rounded-lg inline-block">
                  No stats affected
                </div>
              </div>
            </Link>

            {/* Leaderboard */}
            <Link
              href="/leaderboard"
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-600 to-yellow-600 p-6 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/20"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="text-4xl mb-2">📊</div>
                <h2 className="text-2xl font-bold mb-2">Leaderboard</h2>
                <p className="text-white/70">
                  View top players and rankings
                </p>
                <div className="mt-4 px-3 py-1 bg-black/30 rounded-lg inline-block">
                  See your rank
                </div>
              </div>
            </Link>

            {/* Replays */}
            <Link
              href="/replays"
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 p-6 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/20"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="text-4xl mb-2">🎬</div>
                <h2 className="text-2xl font-bold mb-2">Replays</h2>
                <p className="text-white/70">
                  Watch and analyze past battles
                </p>
                <div className="mt-4 px-3 py-1 bg-black/30 rounded-lg inline-block">
                  Debug your strategy
                </div>
              </div>
            </Link>

            {/* Arena - Async Battles */}
            <Link
              href="/arena"
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-pink-600 to-rose-600 p-6 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/20"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="text-4xl mb-2">🏟️</div>
                <h2 className="text-2xl font-bold mb-2">Arena</h2>
                <p className="text-white/70">
                  Battle with live commentary
                </p>
                <div className="mt-4 px-3 py-1 bg-black/30 rounded-lg inline-block">
                  Animated play-by-play
                </div>
              </div>
            </Link>
          </div>

          {/* Active Bot Display */}
          {activeBot && (
            <div className="max-w-4xl mx-auto mt-8 bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-bold mb-4 text-gray-300">Active Bot</h3>
              <div className="flex items-center gap-6">
                <div
                  className="w-20 h-20 rounded-lg flex items-center justify-center text-4xl"
                  style={{ backgroundColor: activeBot.color + '33' }}
                >
                  🤖
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold" style={{ color: activeBot.color }}>
                    {activeBot.name}
                  </div>
                  <div className="text-gray-400 capitalize">
                    {activeBot.chassisId} chassis • {activeBot.weaponIds.length} weapon
                    {activeBot.weaponIds.length !== 1 ? 's' : ''}
                  </div>
                  <div className="text-gray-500 text-sm mt-1">
                    AI: {activeBot.aiConfig.primaryBehavior}
                    {activeBot.aiConfig.secondaryBehavior &&
                      ` + ${activeBot.aiConfig.secondaryBehavior}`}
                  </div>
                </div>
                <Link
                  href="/garage"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Edit Bot
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-500 text-sm">
        AI Battlebots - Built with Next.js, PixiJS & Matter.js
      </footer>
    </div>
  );
}
