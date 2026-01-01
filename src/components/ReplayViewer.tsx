'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { ReplayPlayer, ReplayData, ReplayFrame } from '@/game/replay/ReplaySystem';
import { getChassisById } from '@/data/chassis';

interface ReplayViewerProps {
  replay: ReplayData;
  onClose: () => void;
}

export function ReplayViewer({ replay, onClose }: ReplayViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<Application | null>(null);
  const playerRef = useRef<ReplayPlayer | null>(null);
  const botGraphicsRef = useRef<Map<string, Graphics>>(new Map());
  const containerRef = useRef<Container | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedBot, setSelectedBot] = useState<string | null>(null);
  const [currentFrame, setCurrentFrame] = useState<ReplayFrame | null>(null);

  // Initialize PixiJS and replay player
  useEffect(() => {
    if (!canvasRef.current) return;

    const initApp = async () => {
      const app = new Application();
      await app.init({
        canvas: canvasRef.current!,
        width: 800,
        height: 600,
        backgroundColor: 0x1a1a2e,
        antialias: true,
      });

      appRef.current = app;

      // Create container for bots
      const container = new Container();
      app.stage.addChild(container);
      containerRef.current = container;

      // Draw arena background
      const arenaGraphics = new Graphics();
      arenaGraphics.rect(0, 0, 800, 600);
      arenaGraphics.fill({ color: 0x1a1a2e });

      // Grid lines
      arenaGraphics.setStrokeStyle({ width: 1, color: 0x2a2a3e });
      for (let x = 0; x < 800; x += 50) {
        arenaGraphics.moveTo(x, 0);
        arenaGraphics.lineTo(x, 600);
        arenaGraphics.stroke();
      }
      for (let y = 0; y < 600; y += 50) {
        arenaGraphics.moveTo(0, y);
        arenaGraphics.lineTo(800, y);
        arenaGraphics.stroke();
      }

      // Walls
      arenaGraphics.rect(0, 0, 800, 20);
      arenaGraphics.fill({ color: 0x4a4a5a });
      arenaGraphics.rect(0, 580, 800, 20);
      arenaGraphics.fill({ color: 0x4a4a5a });
      arenaGraphics.rect(0, 0, 20, 600);
      arenaGraphics.fill({ color: 0x4a4a5a });
      arenaGraphics.rect(780, 0, 20, 600);
      arenaGraphics.fill({ color: 0x4a4a5a });

      container.addChild(arenaGraphics);

      // Create bot graphics
      const botGraphics = new Map<string, Graphics>();
      for (const botInfo of replay.bots) {
        const graphics = new Graphics();
        container.addChild(graphics);
        botGraphics.set(botInfo.id, graphics);
      }
      botGraphicsRef.current = botGraphics;

      // Create replay player
      const player = new ReplayPlayer(replay);
      playerRef.current = player;

      player.setOnFrameChange((frame, index) => {
        setCurrentFrame(frame);
        setCurrentTime(frame.timestamp);
        renderFrame(frame);
      });

      player.setOnPlaybackEnd(() => {
        setIsPlaying(false);
      });

      // Render first frame
      if (replay.frames.length > 0) {
        setCurrentFrame(replay.frames[0]);
        renderFrame(replay.frames[0]);
      }
    };

    initApp();

    return () => {
      playerRef.current?.destroy();
      if (appRef.current) {
        try {
          appRef.current.destroy(true);
        } catch {
          // Ignore
        }
      }
    };
  }, [replay]);

  const renderFrame = useCallback((frame: ReplayFrame) => {
    for (const botSnapshot of frame.bots) {
      const graphics = botGraphicsRef.current.get(botSnapshot.id);
      if (!graphics) continue;

      const botInfo = replay.bots.find(b => b.id === botSnapshot.id);
      if (!botInfo) continue;

      const chassis = getChassisById(botInfo.chassisId);
      const size = chassis?.size || 25;
      const color = parseInt(botInfo.color.replace('#', ''), 16);

      graphics.clear();

      if (!botSnapshot.isAlive) {
        // Dead bot - show wreckage
        graphics.circle(botSnapshot.position.x, botSnapshot.position.y, size * 0.8);
        graphics.fill({ color: 0x333333 });
        graphics.circle(botSnapshot.position.x, botSnapshot.position.y, size * 0.5);
        graphics.stroke({ width: 2, color: 0x555555 });
      } else {
        // Alive bot
        graphics.circle(botSnapshot.position.x, botSnapshot.position.y, size);
        graphics.fill({ color: color });

        // Direction indicator
        const dirX = Math.cos(botSnapshot.angle) * size * 0.8;
        const dirY = Math.sin(botSnapshot.angle) * size * 0.8;
        graphics.moveTo(botSnapshot.position.x, botSnapshot.position.y);
        graphics.lineTo(botSnapshot.position.x + dirX, botSnapshot.position.y + dirY);
        graphics.stroke({ width: 3, color: 0xffffff });

        // HP bar background
        graphics.rect(
          botSnapshot.position.x - size,
          botSnapshot.position.y - size - 12,
          size * 2,
          6
        );
        graphics.fill({ color: 0x333333 });

        // HP bar fill
        const hpPercent = botSnapshot.hp / botSnapshot.maxHp;
        const hpColor = hpPercent > 0.5 ? 0x44ff44 : hpPercent > 0.25 ? 0xffff44 : 0xff4444;
        graphics.rect(
          botSnapshot.position.x - size,
          botSnapshot.position.y - size - 12,
          size * 2 * hpPercent,
          6
        );
        graphics.fill({ color: hpColor });

        // Selection indicator
        if (selectedBot === botSnapshot.id) {
          graphics.circle(botSnapshot.position.x, botSnapshot.position.y, size + 5);
          graphics.stroke({ width: 2, color: 0xffff00 });
        }
      }
    }
  }, [replay, selectedBot]);

  // Update rendering when selected bot changes
  useEffect(() => {
    if (currentFrame) {
      renderFrame(currentFrame);
    }
  }, [selectedBot, currentFrame, renderFrame]);

  const togglePlayback = () => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pause();
      setIsPlaying(false);
    } else {
      playerRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!playerRef.current) return;
    const time = parseInt(e.target.value);
    playerRef.current.seekToTime(time);
    setCurrentTime(time);
  };

  const handleSpeedChange = (speed: number) => {
    if (!playerRef.current) return;
    playerRef.current.setPlaybackSpeed(speed);
    setPlaybackSpeed(speed);
  };

  const stepForward = () => {
    playerRef.current?.stepForward();
  };

  const stepBackward = () => {
    playerRef.current?.stepBackward();
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const remainingMs = ms % 1000;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}.${Math.floor(remainingMs / 100)}`;
  };

  const selectedBotInfo = replay.bots.find(b => b.id === selectedBot);
  const selectedBotSnapshot = currentFrame?.bots.find(b => b.id === selectedBot);

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl overflow-hidden max-w-6xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-700 border-b border-gray-600">
          <div className="flex items-center gap-3">
            <span className="text-lg">🎬</span>
            <span className="font-bold">Battle Replay</span>
            <span className="text-sm text-gray-400">
              {new Date(replay.createdAt).toLocaleDateString()}{' '}
              {new Date(replay.createdAt).toLocaleTimeString()}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
          >
            Close
          </button>
        </div>

        <div className="flex">
          {/* Canvas */}
          <div className="relative">
            <canvas ref={canvasRef} className="block" />

            {/* Overlay for winner */}
            {replay.winner && currentTime >= replay.duration - 100 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center">
                  <div className="text-4xl font-bold text-yellow-400">
                    {replay.bots.find(b => b.id === replay.winner)?.name || 'Unknown'} Wins!
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Side Panel */}
          <div className="w-64 bg-gray-750 border-l border-gray-600 p-4">
            <h3 className="font-bold mb-3">Bots</h3>
            <div className="space-y-2 mb-6">
              {replay.bots.map((bot) => {
                const snapshot = currentFrame?.bots.find(b => b.id === bot.id);
                return (
                  <button
                    key={bot.id}
                    onClick={() => setSelectedBot(selectedBot === bot.id ? null : bot.id)}
                    className={`w-full p-2 rounded text-left transition-colors ${
                      selectedBot === bot.id
                        ? 'bg-blue-600'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: bot.color }}
                      />
                      <span className="font-bold text-sm">{bot.name}</span>
                      {bot.hasScript && (
                        <span className="text-xs bg-purple-600 px-1 rounded">Script</span>
                      )}
                    </div>
                    {snapshot && (
                      <div className="mt-1 text-xs text-gray-300">
                        {snapshot.isAlive ? (
                          <>HP: {Math.round(snapshot.hp)}/{snapshot.maxHp}</>
                        ) : (
                          <span className="text-red-400">Destroyed</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Bot Details */}
            {selectedBotInfo && selectedBotSnapshot && (
              <div className="bg-gray-700 rounded p-3">
                <h4 className="font-bold text-sm mb-2" style={{ color: selectedBotInfo.color }}>
                  {selectedBotInfo.name}
                </h4>
                <div className="space-y-1 text-xs text-gray-300">
                  <div>HP: {Math.round(selectedBotSnapshot.hp)}/{selectedBotSnapshot.maxHp}</div>
                  <div>
                    Position: ({Math.round(selectedBotSnapshot.position.x)},{' '}
                    {Math.round(selectedBotSnapshot.position.y)})
                  </div>
                  <div>Angle: {Math.round((selectedBotSnapshot.angle * 180) / Math.PI)}°</div>
                  {selectedBotSnapshot.currentAction && (
                    <div className="mt-2 p-2 bg-gray-800 rounded">
                      <div className="text-purple-400 font-bold">
                        Action: {selectedBotSnapshot.currentAction}
                      </div>
                      {selectedBotSnapshot.matchedRule && (
                        <div className="text-gray-400 text-xs mt-1">
                          Rule: {selectedBotSnapshot.matchedRule}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Frame Events */}
            {currentFrame && currentFrame.events.length > 0 && (
              <div className="mt-4">
                <h4 className="font-bold text-sm mb-2">Events</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {currentFrame.events.map((event, i) => (
                    <div key={i} className="text-xs bg-gray-700 p-1 rounded">
                      {event.type === 'damage' && (
                        <span className="text-red-400">
                          💥 {Math.round((event.data as { damage: number }).damage)} damage
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Playback Controls */}
        <div className="px-4 py-3 bg-gray-700 border-t border-gray-600">
          <div className="flex items-center gap-4">
            {/* Step back */}
            <button
              onClick={stepBackward}
              className="p-2 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
              title="Step Back"
            >
              ⏮️
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlayback}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>

            {/* Step forward */}
            <button
              onClick={stepForward}
              className="p-2 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
              title="Step Forward"
            >
              ⏭️
            </button>

            {/* Time display */}
            <span className="text-sm font-mono w-24">
              {formatTime(currentTime)} / {formatTime(replay.duration)}
            </span>

            {/* Seek bar */}
            <input
              type="range"
              min={0}
              max={replay.duration}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1"
            />

            {/* Speed controls */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Speed:</span>
              {[0.5, 1, 2, 4].map((speed) => (
                <button
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    playbackSpeed === speed
                      ? 'bg-blue-600'
                      : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>

            {/* Frame counter */}
            <span className="text-xs text-gray-400">
              Frame: {playerRef.current?.getCurrentFrameIndex() || 0}/{replay.frames.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
