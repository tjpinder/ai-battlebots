'use client';

import { useEffect, useRef, useState } from 'react';
import { GameEngine } from '@/game/engine/GameEngine';
import { SoundManager } from '@/game/engine/SoundManager';
import { useGameStore } from '@/stores/gameStore';
import { ArenaConfig, BotConfig } from '@/game/types';
import { saveReplay, ReplayData } from '@/game/replay/ReplaySystem';
import { ReplayViewer } from './ReplayViewer';
import { Commentator, CommentaryEvent } from './Commentator';
import { LiveCommentaryGenerator } from '@/game/commentary/LiveCommentaryGenerator';

interface BattleCanvasProps {
  arena: ArenaConfig;
  bots: BotConfig[];
  onBattleEnd?: (winnerId: string | null) => void;
  autoStart?: boolean;
}

export function BattleCanvas({
  arena,
  bots,
  onBattleEnd,
  autoStart = true,
}: BattleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const { setGameState, setInitialized, addDamageEvent, addBattleLog } =
    useGameStore();
  const [lastReplay, setLastReplay] = useState<ReplayData | null>(null);
  const [showReplayViewer, setShowReplayViewer] = useState(false);
  const [commentaryEvents, setCommentaryEvents] = useState<CommentaryEvent[]>([]);
  const [isCommentaryPlaying, setIsCommentaryPlaying] = useState(false);
  const commentaryRef = useRef<LiveCommentaryGenerator | null>(null);
  const battleStartTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!canvasRef.current || engineRef.current) return;

    let mounted = true;

    const initGame = async () => {
      if (!canvasRef.current) return;

      const engine = new GameEngine();
      engineRef.current = engine;

      // Initialize live commentary generator
      const commentary = new LiveCommentaryGenerator();
      commentaryRef.current = commentary;

      // Set up commentary callback to update React state
      commentary.setCommentaryCallback((event) => {
        if (!mounted) return;
        setCommentaryEvents(prev => [...prev, event]);
      });

      await engine.initialize(canvasRef.current, arena.width, arena.height);

      if (!mounted) {
        engine.destroy();
        return;
      }

      engine.setupArena(arena);

      // Add bots at opposite corners
      const positions = [
        { x: arena.width * 0.25, y: arena.height * 0.5 },
        { x: arena.width * 0.75, y: arena.height * 0.5 },
      ];

      bots.forEach((botConfig, index) => {
        const pos = positions[index % positions.length];
        engine.addBot(botConfig, pos);
        addBattleLog(`${botConfig.name} enters the arena!`);
      });

      // Set up state change handler
      engine.setOnStateChange((state) => {
        if (!mounted) return;
        setGameState(state);

        // Update commentary with state (for low HP detection, banter, etc.)
        const currentTime = Date.now() - battleStartTimeRef.current;
        commentaryRef.current?.onStateUpdate(state, currentTime);

        if (!state.isRunning && state.winner !== undefined) {
          const winner = bots.find((b) => b.id === state.winner);
          if (winner) {
            addBattleLog(`${winner.name} WINS!`);
            // Trigger end commentary
            commentaryRef.current?.onBattleEnd(winner.name, currentTime);
          } else if (state.winner === null) {
            addBattleLog('DRAW!');
          }

          commentaryRef.current?.onBattleEnd('Nobody', currentTime);

          // Stop commentary playback indicator
          setIsCommentaryPlaying(false);

          // Stop recording and save replay
          if (engine.isCurrentlyRecording()) {
            const replay = engine.stopRecording();
            if (replay) {
              saveReplay(replay);
              setLastReplay(replay);
              addBattleLog('Battle replay saved!');
            }
          }

          onBattleEnd?.(state.winner);
        }
      });

      // Set up damage event handler
      engine.setOnDamageEvent((event) => {
        if (!mounted) return;
        addDamageEvent(event);

        // Feed damage to commentary generator with bot names
        const currentTime = Date.now() - battleStartTimeRef.current;
        const attacker = bots.find((b) => b.id === event.attackerId);
        const target = bots.find((b) => b.id === event.targetId);
        commentaryRef.current?.onDamage(event, currentTime, attacker?.name, target?.name);

        if (attacker && target && event.damage > 5) {
          addBattleLog(
            `${attacker.name} hits ${target.name} for ${Math.floor(event.damage)} damage!`
          );
        }
      });

      setInitialized(true);

      if (autoStart) {
        engine.startRecording();
        engine.start();
        addBattleLog('FIGHT!');
        SoundManager.resume();
        SoundManager.play('battleStart');

        // Start live commentary
        battleStartTimeRef.current = Date.now();
        setCommentaryEvents([]);
        setIsCommentaryPlaying(true);
        commentaryRef.current?.reset();
        if (bots.length >= 2) {
          commentaryRef.current?.onBattleStart(bots[0].name, bots[1].name);
        }
      }
    };

    initGame();

    return () => {
      mounted = false;
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
      commentaryRef.current = null;
      setInitialized(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arena.id, bots.map(b => b.id).join(',')]);

  const handleStart = () => {
    const engine = engineRef.current;
    if (!engine) return;

    engine.startRecording();
    engine.start();
    SoundManager.resume();
    SoundManager.play('battleStart');
    addBattleLog('FIGHT!');
    setLastReplay(null);

    // Start live commentary
    battleStartTimeRef.current = Date.now();
    setCommentaryEvents([]);
    setIsCommentaryPlaying(true);
    commentaryRef.current?.reset();
    if (bots.length >= 2) {
      commentaryRef.current?.onBattleStart(bots[0].name, bots[1].name);
    }
  };

  const handlePause = () => {
    const engine = engineRef.current;
    if (!engine) return;

    const state = engine.getState();
    if (state.isPaused) {
      engine.resume();
      addBattleLog('Battle resumed');
    } else {
      engine.pause();
      addBattleLog('Battle paused');
    }
  };

  const handleReset = () => {
    const engine = engineRef.current;
    if (!engine) return;

    engine.reset();
    engine.setupArena(arena);

    const positions = [
      { x: arena.width * 0.25, y: arena.height * 0.5 },
      { x: arena.width * 0.75, y: arena.height * 0.5 },
    ];

    bots.forEach((botConfig, index) => {
      const pos = positions[index % positions.length];
      engine.addBot(botConfig, pos);
    });

    // Reset commentary
    setCommentaryEvents([]);
    setIsCommentaryPlaying(false);
    commentaryRef.current?.reset();

    addBattleLog('Arena reset');
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Live Commentary Panel */}
      <div className="w-full max-w-2xl">
        <Commentator
          commentary={commentaryEvents}
          isPlaying={isCommentaryPlaying}
          playbackSpeed={1}
          onComplete={() => setIsCommentaryPlaying(false)}
          enableVoice={true}
        />
      </div>

      <canvas
        ref={canvasRef}
        className="border-4 border-gray-700 rounded-lg shadow-2xl"
        style={{ imageRendering: 'pixelated' }}
      />
      <div className="flex gap-4">
        <button
          onClick={handleStart}
          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
        >
          Start
        </button>
        <button
          onClick={handlePause}
          className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg transition-colors"
        >
          Pause/Resume
        </button>
        <button
          onClick={handleReset}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
        >
          Reset
        </button>
        {lastReplay && (
          <button
            onClick={() => setShowReplayViewer(true)}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors"
          >
            Watch Replay
          </button>
        )}
      </div>

      {/* Replay Viewer Modal */}
      {showReplayViewer && lastReplay && (
        <ReplayViewer
          replay={lastReplay}
          onClose={() => setShowReplayViewer(false)}
        />
      )}
    </div>
  );
}
