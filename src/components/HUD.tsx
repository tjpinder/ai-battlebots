'use client';

import { useGameStore } from '@/stores/gameStore';

export function HUD() {
  const { gameState, battleLog } = useGameStore();

  if (!gameState) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 text-gray-400">
        Waiting for battle to start...
      </div>
    );
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-4 w-80">
      {/* Battle Status */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400 text-sm">Battle Time</span>
          <span className="text-white font-mono text-lg">
            {formatTime(gameState.timeElapsed)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Status</span>
          <span
            className={`font-bold ${
              gameState.isRunning
                ? gameState.isPaused
                  ? 'text-yellow-400'
                  : 'text-green-400'
                : gameState.winner
                ? 'text-blue-400'
                : 'text-gray-400'
            }`}
          >
            {gameState.isRunning
              ? gameState.isPaused
                ? 'PAUSED'
                : 'FIGHTING'
              : gameState.winner
              ? 'VICTORY'
              : 'READY'}
          </span>
        </div>
      </div>

      {/* Bot Stats */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-white font-bold mb-3 text-center">Combatants</h3>
        <div className="space-y-4">
          {gameState.bots.map((bot) => (
            <div
              key={bot.id}
              className={`p-3 rounded-lg ${
                bot.isAlive
                  ? 'bg-gray-700'
                  : 'bg-red-900/30 border border-red-700'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span
                  className="font-bold"
                  style={{ color: bot.config.color }}
                >
                  {bot.config.name}
                </span>
                <span
                  className={`text-sm ${
                    bot.isAlive ? 'text-gray-400' : 'text-red-400'
                  }`}
                >
                  {bot.isAlive ? 'ALIVE' : 'DESTROYED'}
                </span>
              </div>

              {/* HP Bar */}
              <div className="relative h-4 bg-gray-900 rounded-full overflow-hidden">
                <div
                  className={`absolute left-0 top-0 h-full transition-all duration-200 ${
                    bot.hp / bot.maxHp > 0.5
                      ? 'bg-green-500'
                      : bot.hp / bot.maxHp > 0.25
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${(bot.hp / bot.maxHp) * 100}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow">
                  {Math.ceil(bot.hp)} / {bot.maxHp}
                </span>
              </div>

              {/* Quick Stats */}
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div className="text-gray-400">
                  Chassis:{' '}
                  <span className="text-white capitalize">
                    {bot.config.chassisId}
                  </span>
                </div>
                <div className="text-gray-400">
                  Weapons:{' '}
                  <span className="text-white">{bot.config.weaponIds.length}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Battle Log */}
      <div className="bg-gray-800 rounded-lg p-4 max-h-48 overflow-y-auto">
        <h3 className="text-white font-bold mb-2">Battle Log</h3>
        <div className="space-y-1 text-sm">
          {battleLog.slice(-10).map((log, index) => (
            <div key={index} className="text-gray-300">
              {log}
            </div>
          ))}
        </div>
      </div>

      {/* Winner Display */}
      {gameState.winner && (
        <div className="bg-gradient-to-r from-yellow-600 to-yellow-800 rounded-lg p-4 text-center">
          <div className="text-yellow-200 text-sm mb-1">WINNER</div>
          <div className="text-white text-2xl font-bold">
            {gameState.bots.find((b) => b.id === gameState.winner)?.config.name ||
              'Unknown'}
          </div>
        </div>
      )}
    </div>
  );
}
