import { useEffect } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useBroadcast } from "@/hooks/useBroadcast";
import { useSoundSettings } from "@/context/SoundSettingsContext";
import { playPencilLoop, stopPencilLoop } from "@/lib/pencil";

export function usePencilSound(
  channel: RealtimeChannel | null,
  isPlaying: boolean,
) {
  const { soundEnabled } = useSoundSettings() || {};

  useBroadcast(channel, "stroke_batch", () => {
    if (soundEnabled && isPlaying) playPencilLoop();
  });

  useBroadcast(channel, "stroke_end", () => {
    stopPencilLoop();
  });

  useEffect(() => {
    if (!soundEnabled) stopPencilLoop();
  }, [soundEnabled]);

  useEffect(() => {
    if (!isPlaying) stopPencilLoop();
  }, [isPlaying]);

  useEffect(() => stopPencilLoop, []);
}
