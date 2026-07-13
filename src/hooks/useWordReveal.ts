import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { REVEAL_INTERVAL } from "@/constants/game";
import { useBroadcast } from "@/hooks/useBroadcast";

function seededShuffle(length: number, seed: string): number[] {
  const indices = Array.from({ length }, (_, i) => i);
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }

  let seedValue = Math.abs(hash) || 1;
  function nextRandom() {
    seedValue = (seedValue * 9301 + 49297) % 233280;
    return Math.abs(seedValue) / 233280;
  }

  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

function getRevealedPositionsForTime(
  word: string,
  turnStartedAt: string,
  secondsElapsed: number,
): number[] {
  const maxReveals = Math.min(
    Math.floor(secondsElapsed / REVEAL_INTERVAL),
    Math.floor(word.length / 2),
  );
  const order = seededShuffle(word.length, word + turnStartedAt);
  return order.slice(0, maxReveals);
}

export function useWordReveal(
  channel: RealtimeChannel | null,
  opts: {
    isDrawer: boolean;
    myWord: string | undefined;
    turnStartedAt: string | null | undefined;
    isPlaying: boolean;
    currentDrawer: string | null | undefined;
    serverOffset: number;
  },
) {
  const [revealedLetters, setRevealedLetters] = useState<Map<number, string>>(
    new Map(),
  );

  const prevDrawer = useRef(opts.currentDrawer);

  const optsRef = useRef(opts);
  useEffect(() => {
    optsRef.current = opts;
  });

  useEffect(() => {
    if (prevDrawer.current !== opts.currentDrawer) {
      prevDrawer.current = opts.currentDrawer;
      setRevealedLetters(new Map());
    }
  }, [opts.currentDrawer]);

  useBroadcast<{ position: number; letter: string }>(
    channel,
    "letter_revealed",
    (payload) => {
      setRevealedLetters((prev) =>
        new Map(prev).set(payload.position, payload.letter),
      );
    },
  );

  useBroadcast(channel, "request_hints", () => {
    const o = optsRef.current;
    if (!o.isDrawer || !o.myWord || !o.turnStartedAt || !o.isPlaying) return;

    const word = o.myWord;
    const turnStartedAt = o.turnStartedAt;
    const secondsElapsed =
      (Date.now() + o.serverOffset - new Date(turnStartedAt).getTime()) / 1000;
    const positions = getRevealedPositionsForTime(
      word,
      turnStartedAt,
      secondsElapsed,
    );

    for (const position of positions) {
      channel?.send({
        type: "broadcast",
        event: "letter_revealed",
        payload: { position, letter: word[position] },
      });
    }
  });

  useEffect(() => {
    if (
      !opts.isDrawer ||
      !opts.myWord ||
      !opts.isPlaying ||
      !opts.turnStartedAt
    )
      return;

    const word = opts.myWord;
    const turnStartedAt = opts.turnStartedAt;
    const serverOffset = opts.serverOffset;
    let lastSentCount = 0;

    const interval = setInterval(() => {
      const secondsElapsed =
        (Date.now() + serverOffset - new Date(turnStartedAt).getTime()) / 1000;
      const positions = getRevealedPositionsForTime(
        word,
        turnStartedAt,
        secondsElapsed,
      );

      for (let i = lastSentCount; i < positions.length; i++) {
        channel?.send({
          type: "broadcast",
          event: "letter_revealed",
          payload: { position: positions[i], letter: word[positions[i]] },
        });
      }
      lastSentCount = positions.length;
    }, 1000);

    return () => clearInterval(interval);
  }, [
    channel,
    opts.isDrawer,
    opts.myWord,
    opts.isPlaying,
    opts.turnStartedAt,
    opts.serverOffset,
  ]);

  useEffect(() => {
    if (!channel) return;
    if (
      opts.isDrawer ||
      !opts.isPlaying ||
      !opts.turnStartedAt ||
      !opts.currentDrawer
    )
      return;

    let sent = false;
    const requestHints = () => {
      if (sent) return true;
      if (channel.state !== "joined") return false;
      channel.send({
        type: "broadcast",
        event: "request_hints",
        payload: {},
      });
      sent = true;
      return true;
    };

    if (requestHints()) return;

    const id = setInterval(() => {
      if (requestHints()) clearInterval(id);
    }, 300);
    return () => clearInterval(id);
  }, [
    channel,
    opts.isDrawer,
    opts.isPlaying,
    opts.turnStartedAt,
    opts.currentDrawer,
  ]);

  return { revealedLetters };
}
