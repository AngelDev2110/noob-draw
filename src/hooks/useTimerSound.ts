import { useEffect, useRef } from "react";
import { useSoundSettings } from "@/context/SoundSettingsContext";
import {
  playSound,
  stopSound,
  preloadSound,
  getSoundDuration,
} from "@/lib/sounds";

const URGENT_THRESHOLD = 15;

export function useTimerSound(
  secondsLeft: number | null,
  isPlaying: boolean,
  turnStartedAt: string | null | undefined,
) {
  const { soundEnabled } = useSoundSettings() || {};
  const playedForTurnRef = useRef<string | null>(null);

  useEffect(() => {
    if (isPlaying) preloadSound("timer");
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying || secondsLeft === null || !turnStartedAt) {
      stopSound("timer");
      return;
    }

    if (secondsLeft <= 0) {
      stopSound("timer");
      return;
    }

    const duration = getSoundDuration("timer");
    const threshold = duration
      ? Math.min(URGENT_THRESHOLD, Math.ceil(duration))
      : URGENT_THRESHOLD;

    if (
      secondsLeft <= threshold &&
      playedForTurnRef.current !== turnStartedAt
    ) {
      playedForTurnRef.current = turnStartedAt;
      if (soundEnabled) playSound("timer");
    }
  }, [secondsLeft, isPlaying, turnStartedAt, soundEnabled]);

  useEffect(() => {
    return () => stopSound("timer");
  }, []);
}
