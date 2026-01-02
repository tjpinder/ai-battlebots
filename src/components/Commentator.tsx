'use client';

import { useState, useEffect, useRef } from 'react';

export interface CommentaryEvent {
  timestamp: number;
  type: 'start' | 'big_hit' | 'low_hp' | 'comeback' | 'finish' | 'pit_fall' | 'wall_slam' | 'banter';
  message: string;
  speaker: 'chuck' | 'frank' | 'both';
  excitement: number; // 1-10
}

interface CommentatorProps {
  commentary: CommentaryEvent[];
  isPlaying: boolean;
  playbackSpeed?: number;
  onComplete?: () => void;
}

// The two commentator personalities
const COMMENTATORS = {
  chuck: {
    name: 'Chuck Sterling',
    title: 'Play-by-Play',
    color: '#3b82f6',
    silhouette: '👤',
  },
  frank: {
    name: 'Frank "The Tank" Mulligan',
    title: 'Color Commentary',
    color: '#f59e0b',
    silhouette: '👥',
  },
};

export function Commentator({
  commentary,
  isPlaying,
  playbackSpeed = 1,
  onComplete,
}: CommentatorProps) {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [visibleMessages, setVisibleMessages] = useState<CommentaryEvent[]>([]);
  const [activeSpeaker, setActiveSpeaker] = useState<'chuck' | 'frank' | 'both' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastLengthRef = useRef(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleMessages]);

  useEffect(() => {
    if (!isPlaying || commentary.length === 0) {
      return;
    }

    startTimeRef.current = Date.now();
    let lastIndex = -1;

    const playbackLoop = () => {
      const elapsed = (Date.now() - (startTimeRef.current || 0)) * playbackSpeed;

      // Find next event
      let newIndex = lastIndex;
      for (let i = lastIndex + 1; i < commentary.length; i++) {
        if (commentary[i].timestamp <= elapsed) {
          newIndex = i;
        } else {
          break;
        }
      }

      if (newIndex > lastIndex) {
        const newEvents = commentary.slice(lastIndex + 1, newIndex + 1);
        setVisibleMessages(prev => [...prev, ...newEvents]);
        setCurrentIndex(newIndex);
        lastIndex = newIndex;

        // Animate speaker
        const latestEvent = newEvents[newEvents.length - 1];
        setActiveSpeaker(latestEvent.speaker);
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 600);
      }

      if (lastIndex >= commentary.length - 1) {
        onComplete?.();
        return;
      }

      animationRef.current = requestAnimationFrame(playbackLoop);
    };

    animationRef.current = requestAnimationFrame(playbackLoop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, commentary, playbackSpeed, onComplete]);

  // For live commentary: detect new events and append them
  useEffect(() => {
    // If commentary was reset (empty array), clear everything
    if (commentary.length === 0) {
      if (lastLengthRef.current > 0) {
        setCurrentIndex(-1);
        setVisibleMessages([]);
        setActiveSpeaker(null);
      }
      lastLengthRef.current = 0;
      return;
    }

    // If new events were added, append them immediately (live mode)
    if (commentary.length > lastLengthRef.current) {
      const newEvents = commentary.slice(lastLengthRef.current);
      setVisibleMessages(prev => [...prev, ...newEvents]);
      setCurrentIndex(commentary.length - 1);

      // Animate the latest speaker
      const latestEvent = newEvents[newEvents.length - 1];
      setActiveSpeaker(latestEvent.speaker);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
    }

    lastLengthRef.current = commentary.length;
  }, [commentary]);

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden border-2 border-yellow-600/50">
      {/* Channel Header - "The Ocho" style */}
      <div className="bg-gradient-to-r from-red-800 via-red-700 to-red-800 px-4 py-2 flex items-center justify-between border-b-2 border-yellow-500">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-500 text-black font-black px-2 py-0.5 text-sm rounded">
            BB8
          </div>
          <span className="font-bold text-white tracking-wide">
            BATTLEBOT CHAMPIONSHIP SERIES
          </span>
        </div>
        {isPlaying && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-red-300 uppercase tracking-wider">
              Live from the Thunderdome
            </span>
          </div>
        )}
      </div>

      {/* Commentary Feed */}
      <div className="h-48 overflow-y-auto p-3 space-y-2 bg-gray-800/50">
        {visibleMessages.length === 0 ? (
          <div className="text-gray-500 text-center py-8 italic">
            {isPlaying ? '"And here... we... GO!"' : 'Waiting for the action to begin...'}
          </div>
        ) : (
          visibleMessages.map((event, idx) => (
            <CommentaryBubble
              key={idx}
              event={event}
              isLatest={idx === visibleMessages.length - 1}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* MST3K-style Silhouettes at Bottom */}
      <div className="relative h-24 bg-gradient-to-t from-black via-gray-900 to-transparent">
        {/* Screen glow effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent pointer-events-none" />

        {/* Commentator Silhouettes */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between items-end px-8">
          {/* Chuck - Left */}
          <div
            className={`transition-all duration-300 ${
              activeSpeaker === 'chuck' || activeSpeaker === 'both'
                ? 'scale-110 translate-y-[-4px]'
                : 'scale-100'
            }`}
          >
            <div className="relative">
              {/* Speech indicator */}
              {(activeSpeaker === 'chuck' || activeSpeaker === 'both') && isAnimating && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="w-1.5 h-3 bg-blue-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 100}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              {/* Silhouette */}
              <svg viewBox="0 0 60 80" className="w-16 h-20 fill-black">
                <ellipse cx="30" cy="18" rx="14" ry="16" />
                <path d="M10 80 L15 45 L30 50 L45 45 L50 80 Z" />
                <rect x="22" y="32" width="16" height="15" rx="2" />
              </svg>
              <div className={`absolute bottom-0 left-0 right-0 text-center text-xs font-bold transition-colors ${
                activeSpeaker === 'chuck' ? 'text-blue-400' : 'text-gray-600'
              }`}>
                CHUCK
              </div>
            </div>
          </div>

          {/* Center - Logo/Stats */}
          <div className="text-center mb-4">
            <div className="text-yellow-500 text-xs font-bold tracking-widest">
              THE OCHO PRESENTS
            </div>
            <div className="text-white/60 text-[10px]">
              "If it's almost a sport, we've got it here."
            </div>
          </div>

          {/* Frank - Right */}
          <div
            className={`transition-all duration-300 ${
              activeSpeaker === 'frank' || activeSpeaker === 'both'
                ? 'scale-110 translate-y-[-4px]'
                : 'scale-100'
            }`}
          >
            <div className="relative">
              {/* Speech indicator */}
              {(activeSpeaker === 'frank' || activeSpeaker === 'both') && isAnimating && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="w-1.5 h-3 bg-yellow-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 100}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              {/* Silhouette - slightly larger/different shape */}
              <svg viewBox="0 0 60 80" className="w-16 h-20 fill-black">
                <ellipse cx="30" cy="16" rx="15" ry="14" />
                <path d="M8 80 L12 42 L30 48 L48 42 L52 80 Z" />
                <rect x="20" y="28" width="20" height="16" rx="2" />
              </svg>
              <div className={`absolute bottom-0 left-0 right-0 text-center text-xs font-bold transition-colors ${
                activeSpeaker === 'frank' ? 'text-yellow-400' : 'text-gray-600'
              }`}>
                FRANK
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommentaryBubble({ event, isLatest }: { event: CommentaryEvent; isLatest: boolean }) {
  const speaker = COMMENTATORS[event.speaker === 'both' ? 'chuck' : event.speaker];
  const isBoth = event.speaker === 'both';

  return (
    <div className={`flex items-start gap-2 ${isLatest ? 'animate-fade-in' : ''}`}>
      {/* Speaker indicator */}
      <div
        className={`w-1 self-stretch rounded-full ${
          event.speaker === 'chuck' ? 'bg-blue-500' :
          event.speaker === 'frank' ? 'bg-yellow-500' :
          'bg-gradient-to-b from-blue-500 to-yellow-500'
        }`}
      />

      <div className="flex-1">
        {/* Speaker name */}
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className="text-xs font-bold uppercase tracking-wide"
            style={{ color: isBoth ? '#fff' : speaker.color }}
          >
            {isBoth ? 'CHUCK & FRANK' : speaker.name}
          </span>
          {event.excitement >= 8 && (
            <span className="text-xs text-red-400 animate-pulse">
              {'🔥'.repeat(Math.min(3, event.excitement - 7))}
            </span>
          )}
        </div>

        {/* Message */}
        <div className={`text-sm ${
          event.excitement >= 8 ? 'text-white font-medium' :
          event.excitement >= 5 ? 'text-gray-200' :
          'text-gray-400'
        }`}>
          {event.message}
        </div>
      </div>

      {/* Timestamp */}
      <div className="text-[10px] text-gray-600 tabular-nums">
        {(event.timestamp / 1000).toFixed(1)}s
      </div>
    </div>
  );
}

// Instant playback version
export function CommentaryFeed({ commentary }: { commentary: CommentaryEvent[] }) {
  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden border-2 border-yellow-600/50">
      <div className="bg-gradient-to-r from-red-800 via-red-700 to-red-800 px-4 py-2 border-b-2 border-yellow-500">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-500 text-black font-black px-2 py-0.5 text-sm rounded">
            BB8
          </div>
          <span className="font-bold text-white">FULL COMMENTARY LOG</span>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto p-3 space-y-2">
        {commentary.map((event, idx) => (
          <CommentaryBubble key={idx} event={event} isLatest={false} />
        ))}
      </div>
    </div>
  );
}
