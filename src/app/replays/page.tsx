'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ReplayViewer } from '@/components/ReplayViewer';
import { loadReplays, deleteReplay, ReplayData } from '@/game/replay/ReplaySystem';

export default function ReplaysPage() {
  const [replays, setReplays] = useState<ReplayData[]>([]);
  const [selectedReplay, setSelectedReplay] = useState<ReplayData | null>(null);

  useEffect(() => {
    setReplays(loadReplays());
  }, []);

  const handleDelete = (replayId: string) => {
    if (confirm('Are you sure you want to delete this replay?')) {
      deleteReplay(replayId);
      setReplays(loadReplays());
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 max-w-4xl mx-auto">
        <Link
          href="/"
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          Back to Menu
        </Link>
        <h1 className="text-3xl font-bold">Battle Replays</h1>
        <div className="w-32" /> {/* Spacer */}
      </div>

      <div className="max-w-4xl mx-auto">
        {replays.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">🎬</div>
            <h2 className="text-xl font-bold mb-2">No Replays Yet</h2>
            <p className="text-gray-400 mb-6">
              Battle replays are automatically saved after each match.
              <br />
              Head to the Battle arena and fight!
            </p>
            <Link
              href="/battle"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-colors"
            >
              Start a Battle
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-gray-400">
                {replays.length} replay{replays.length !== 1 ? 's' : ''} saved
              </p>
              <p className="text-xs text-gray-500">
                Replays are stored locally. Maximum 20 replays kept.
              </p>
            </div>

            {replays.map((replay) => {
              const winner = replay.bots.find(b => b.id === replay.winner);

              return (
                <div
                  key={replay.id}
                  className="bg-gray-800 rounded-xl p-4 hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Bot avatars */}
                      <div className="flex -space-x-2">
                        {replay.bots.map((bot) => (
                          <div
                            key={bot.id}
                            className="w-10 h-10 rounded-full border-2 border-gray-700 flex items-center justify-center"
                            style={{ backgroundColor: bot.color + '44' }}
                            title={bot.name}
                          >
                            <span className="text-lg">🤖</span>
                          </div>
                        ))}
                      </div>

                      {/* Match info */}
                      <div>
                        <div className="font-bold">
                          {replay.bots.map(b => b.name).join(' vs ')}
                        </div>
                        <div className="text-sm text-gray-400">
                          {formatDate(replay.createdAt)} • {formatDuration(replay.duration)}
                        </div>
                      </div>
                    </div>

                    {/* Result */}
                    <div className="text-right">
                      {winner ? (
                        <div>
                          <span className="text-yellow-400 font-bold">{winner.name}</span>
                          <span className="text-gray-400"> wins</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Draw</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => setSelectedReplay(replay)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      >
                        Watch
                      </button>
                      <button
                        onClick={() => handleDelete(replay.id)}
                        className="px-4 py-2 bg-red-600/30 hover:bg-red-600/50 text-red-300 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Bot details */}
                  <div className="mt-3 flex gap-4">
                    {replay.bots.map((bot) => (
                      <div key={bot.id} className="flex items-center gap-2 text-xs text-gray-400">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: bot.color }}
                        />
                        <span>{bot.name}</span>
                        <span className="text-gray-500">({bot.chassisId})</span>
                        {bot.hasScript && (
                          <span className="bg-purple-600 text-white px-1 rounded">Script</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Frame count */}
                  <div className="mt-2 text-xs text-gray-500">
                    {replay.frames.length} frames recorded
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Replay Viewer Modal */}
      {selectedReplay && (
        <ReplayViewer
          replay={selectedReplay}
          onClose={() => setSelectedReplay(null)}
        />
      )}
    </div>
  );
}
