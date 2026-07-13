import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { submitGuess, getMyGuessStatus } from "@/services/game";
import { useBroadcast } from "@/hooks/useBroadcast";

type Announcement = {
  id: string;
  displayName: string;
  points: number;
};

export function useCorrectGuess(
  channel: RealtimeChannel | null,
  opts: {
    roomId: string | undefined;
    userId: string | undefined;
    displayName: string;
    currentDrawer: string | null | undefined;
    isDrawer: boolean;
    isPlaying: boolean;
  },
) {
  const queryClient = useQueryClient();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [localRevealedWord, setLocalRevealedWord] = useState<string | null>(
    null,
  );

  const identityRef = useRef({
    userId: opts.userId,
    displayName: opts.displayName,
    roomId: opts.roomId,
  });
  useEffect(() => {
    identityRef.current = {
      userId: opts.userId,
      displayName: opts.displayName,
      roomId: opts.roomId,
    };
  });

  const prevDrawer = useRef(opts.currentDrawer);
  useEffect(() => {
    if (prevDrawer.current !== opts.currentDrawer) {
      prevDrawer.current = opts.currentDrawer;
      setLocalRevealedWord(null);
      setAnnouncement(null);
    }
  }, [opts.currentDrawer]);

  useBroadcast<{ displayName: string; points: number }>(
    channel,
    "correct_guess",
    (payload) => {
      setAnnouncement({
        id: crypto.randomUUID(),
        displayName: payload.displayName,
        points: payload.points,
      });
    },
  );

  const { data: guessStatus } = useQuery({
    queryKey: ["guessStatus", opts.roomId, opts.currentDrawer],
    queryFn: () => getMyGuessStatus(opts.roomId!),
    enabled: !!opts.roomId && opts.isPlaying && !opts.isDrawer,
  });

  const myRevealedWord =
    localRevealedWord ??
    (guessStatus?.already_guessed ? guessStatus.revealed_word : null);

  async function handleGuess(text: string) {
    const { userId, displayName, roomId } = identityRef.current;
    const result = await submitGuess(roomId!, text);
    if (result.correct) {
      setLocalRevealedWord(result.revealed_word);
      channel?.send({
        type: "broadcast",
        event: "correct_guess",
        payload: {
          userId: userId!,
          displayName: displayName ?? "Unknown",
          points: result.points_awarded,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["members", roomId] });
    }
    return result;
  }

  return { announcement, myRevealedWord, handleGuess };
}
