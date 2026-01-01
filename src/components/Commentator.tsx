'use client';

import { useState, useEffect, useRef } from 'react';

export interface CommentaryEvent {
  timestamp: number;
  type: 'start' | 'big_hit' | 'low_hp' | 'comeback' | 'finish' | 'pit_fall' | 'wall_slam';
  message: string;
  excitement: number; // 1-10
}

interface CommentatorProps {
  commentary: CommentaryEvent[];
  isPlaying: boolean;
  playbackSpeed?: number; // 1 = real-time, 2 = 2x speed, etc.
  onComplete?: () => void;
}

const COMMENTATOR_EXPRESSIONS = {
  neutral: '😐',
  happy: '😄',
  excited: '🤩',
  shocked: '😱',
  sad: '😢',
  angry: '😠',
};

function getExpression(event: CommentaryEvent): keyof typeof COMMENTATOR_EXPRESSIONS {
  switch (event.type) {
    case 'start':
      return 'happy';
    case 'big_hit':
      return event.excitement > 7 ? 'excited' : 'happy';
    case 'low_hp':
      return 'shocked';
    case 'pit_fall':
      return 'shocked';
    case 'wall_slam':
      return 'angry';
    case 'finish':
      return event.excitement >= 8 ? 'excited' : 'happy';
    default:
      return 'neutral';
  }
}

function getExcitementColor(excitement: number): string {
  if (excitement >= 9) return 'text-red-400';
  if (excitement >= 7) return 'text-orange-400';
  if (excitement >= 5) return 'text-yellow-400';
  return 'text-gray-300';
}

export function Commentator({
  commentary,
  isPlaying,
  playbackSpeed = 1,
  onComplete,
}: CommentatorProps) {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [visibleMessages, setVisibleMessages] = useState<CommentaryEvent[]>([]);
  const [expression, setExpression] = useState<keyof typeof COMMENTATOR_EXPRESSIONS>('neutral');
  const [isAnimating, setIsAnimating] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleMessages]);

  // Playback logic
  useEffect(() => {
    if (!isPlaying || commentary.length === 0) {
      return;
    }

    startTimeRef.current = Date.now();
    setCurrentIndex(-1);
    setVisibleMessages([]);
    setExpression('neutral');

    const playbackLoop = () => {
      const elapsed = (Date.now() - (startTimeRef.current || 0)) * playbackSpeed;

      // Find all events that should have played by now
      const eventsToShow = commentary.filter(
        (event, idx) => event.timestamp <= elapsed && idx > currentIndex
      );

      if (eventsToShow.length > 0) {
        const latestEvent = eventsToShow[eventsToShow.length - 1];
        const newIndex = commentary.indexOf(latestEvent);

        setCurrentIndex(newIndex);
        setVisibleMessages(prev => [...prev, ...eventsToShow]);

        // Animate commentator
        setExpression(getExpression(latestEvent));
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 500);
      }

      // Check if we're done
      if (currentIndex >= commentary.length - 1) {
        onComplete?.();
        return;
      }

      // Continue loop
      requestAnimationFrame(playbackLoop);
    };

    const animationId = requestAnimationFrame(playbackLoop);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, commentary, playbackSpeed, onComplete, currentIndex]);

  // Reset when commentary changes
  useEffect(() => {
    setCurrentIndex(-1);
    setVisibleMessages([]);
    setExpression('neutral');
  }, [commentary]);

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
      {/* Commentator Box */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-4 flex items-center gap-4">
        {/* Animated Commentator Avatar */}
        <div
          className={`w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center text-3xl transition-transform duration-200 ${
            isAnimating ? 'scale-110' : 'scale-100'
          }`}
        >
          {COMMENTATOR_EXPRESSIONS[expression]}
        </div>

        {/* Commentator Info */}
        <div className="flex-1">
          <div className="font-bold text-white flex items-center gap-2">
            <span>BATTLEBOT ARENA</span>
            {isPlaying && (
              <span className="px-2 py-0.5 bg-red-500 text-xs rounded animate-pulse">
                LIVE
              </span>
            )}
          </div>
          <div className="text-purple-300 text-sm">
            Your commentators: Bot & Botty
          </div>
        </div>

        {/* Sound Visualizer (decorative) */}
        <div className="flex items-end gap-0.5 h-8">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-1 bg-green-400 rounded-t transition-all duration-150 ${
                isAnimating ? 'animate-bounce' : ''
              }`}
              style={{
                height: isAnimating ? `${20 + Math.random() * 60}%` : '20%',
                animationDelay: `${i * 50}ms`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Message Feed */}
      <div className="h-64 overflow-y-auto p-4 space-y-3">
        {visibleMessages.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            {isPlaying ? 'Starting commentary...' : 'Commentary will appear here'}
          </div>
        ) : (
          visibleMessages.map((event, idx) => (
            <CommentaryMessage key={idx} event={event} isLatest={idx === visibleMessages.length - 1} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

function CommentaryMessage({ event, isLatest }: { event: CommentaryEvent; isLatest: boolean }) {
  const typeIcons: Record<CommentaryEvent['type'], string> = {
    start: '🎬',
    big_hit: '💥',
    low_hp: '⚠️',
    comeback: '🔥',
    finish: '🏆',
    pit_fall: '🕳️',
    wall_slam: '💢',
  };

  return (
    <div
      className={`flex items-start gap-3 ${
        isLatest ? 'animate-fade-in' : ''
      }`}
    >
      <div className="text-xl">{typeIcons[event.type]}</div>
      <div className="flex-1">
        <div className={`font-medium ${getExcitementColor(event.excitement)}`}>
          {event.message}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          {(event.timestamp / 1000).toFixed(1)}s
          {event.excitement >= 8 && (
            <span className="ml-2 text-yellow-400">
              {'!'.repeat(event.excitement - 7)}
            </span>
          )}
        </div>
      </div>
      {/* Excitement meter */}
      <div className="flex gap-0.5">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className={`w-1 h-4 rounded ${
              i < event.excitement ? 'bg-yellow-400' : 'bg-gray-700'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// Instant playback - shows all messages immediately
export function CommentaryFeed({ commentary }: { commentary: CommentaryEvent[] }) {
  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-3 flex items-center gap-3">
        <div className="text-2xl">🎙️</div>
        <div className="font-bold text-white">Battle Commentary</div>
      </div>
      <div className="max-h-80 overflow-y-auto p-4 space-y-3">
        {commentary.map((event, idx) => (
          <CommentaryMessage key={idx} event={event} isLatest={false} />
        ))}
      </div>
    </div>
  );
}
