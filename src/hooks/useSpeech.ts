'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { SpeechService } from '@/game/audio/SpeechService';

export function useSpeech() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const initAttempted = useRef(false);

  // Initialize on first use
  const initialize = useCallback(async () => {
    if (initAttempted.current || isInitializing) return;
    initAttempted.current = true;
    setIsInitializing(true);

    try {
      const success = await SpeechService.initialize();
      setIsEnabled(success);
    } catch (error) {
      console.error('Failed to initialize speech:', error);
      setIsEnabled(false);
    } finally {
      setIsInitializing(false);
    }
  }, [isInitializing]);

  // Auto-initialize when hook is used
  useEffect(() => {
    initialize();
  }, [initialize]);

  const speak = useCallback((text: string, speaker: 'chuck' | 'frank' | 'both') => {
    if (isEnabled && !isMuted) {
      SpeechService.speak(text, speaker);
    }
  }, [isEnabled, isMuted]);

  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    SpeechService.setMuted(newMuted);
  }, [isMuted]);

  const stop = useCallback(() => {
    SpeechService.stop();
  }, []);

  return {
    isEnabled,
    isMuted,
    isInitializing,
    speak,
    toggleMute,
    stop,
  };
}
