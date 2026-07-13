import { useEffect } from "react";
import type { User, RealtimeChannel } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { getGameState, getMyWord, getRoundEndWord } from "@/services/game";
import type { getRoomBySlug } from "@/services/rooms";
import { DrawingCanvas } from "./DrawingCanvas";
import { WordDisplay } from "./DisplayWord";
import { GuessChat } from "./GuessChat";
import { CorrectGuessOverlay } from "./CorrectGuessOverlay";
import { CountdownTimer } from "./CountDownTimer";
import { RoundEndOverlay } from "./RoundEndOverlay";
import { useWordReveal } from "@/hooks/useWordReveal";
import { useGuessChat } from "@/hooks/useGuessChat";
import { useCountdown } from "@/hooks/useCountDown";
import { useCorrectGuess } from "@/hooks/useCorrectGuess";
import { useTurnAdvancer } from "@/hooks/useTurnAdvancer";
import { TURN_DURATION, ROUND_END_DURATION } from "@/constants/game";

type Room = Awaited<ReturnType<typeof getRoomBySlug>>;
type GameState = Awaited<ReturnType<typeof getGameState>>;

export function GameView({
  room,
  user,
  channel,
  gameState,
  serverOffset,
  onlineUserIds,
}: {
  room: Room;
  user: User | null | undefined;
  channel: RealtimeChannel | null;
  gameState: GameState;
  serverOffset: number;
  onlineUserIds: Set<string>;
}) {
  const isDrawer = gameState.current_drawer === user?.id;
  const isPlaying = gameState.status === "playing";
  const displayName = user?.user_metadata?.display_name ?? "Unknown";

  const { data: myWord } = useQuery({
    queryKey: ["myWord", room.id, gameState.current_drawer],
    queryFn: () => getMyWord(room.id),
    enabled: isDrawer && isPlaying,
  });

  const { revealedLetters } = useWordReveal(channel, {
    isDrawer,
    myWord,
    turnStartedAt: gameState.turn_started_at,
    isPlaying,
    currentDrawer: gameState.current_drawer,
    serverOffset,
  });

  const { messages, sendMessage, requestSnapshot } = useGuessChat(channel, {
    userId: user?.id,
    displayName,
    currentDrawer: gameState.current_drawer,
  });

  useEffect(() => {
    if (channel && isPlaying) requestSnapshot();
  }, [channel, isPlaying, requestSnapshot]);

  const { announcement, myRevealedWord, handleGuess } = useCorrectGuess(
    channel,
    {
      roomId: room.id,
      userId: user?.id,
      displayName,
      currentDrawer: gameState.current_drawer,
      isDrawer,
      isPlaying,
    },
  );

  const leaderId = [...onlineUserIds].sort()[0];
  const isLeader = !!user?.id && leaderId === user.id;
  useTurnAdvancer(room.id, channel, gameState.status, isLeader);

  const secondsLeft = useCountdown(
    gameState.turn_started_at,
    TURN_DURATION,
    serverOffset,
  );

  const roundEndSecondsLeft = useCountdown(
    gameState.round_end_started_at,
    ROUND_END_DURATION,
    serverOffset,
  );

  const { data: roundEndWord } = useQuery({
    queryKey: ["roundEndWord", room.id, gameState.round_number],
    queryFn: () => getRoundEndWord(room.id),
    enabled: gameState.status === "round_end",
  });

  return (
    <>
      <CorrectGuessOverlay announcement={announcement} />
      <div className="flex flex-col lg:flex-row gap-3 w-full max-w-6xl mx-auto">
        <div className="flex flex-col gap-3 flex-1">
          <div className="flex items-center justify-between">
            <div></div>
            <WordDisplay
              isDrawer={isDrawer}
              word={myWord}
              wordLength={gameState.word_length}
              revealedLetters={revealedLetters}
              revealedWord={myRevealedWord}
            />
            <CountdownTimer secondsLeft={secondsLeft} />
          </div>
          <div className="relative">
            <DrawingCanvas
              isDrawer={isDrawer && gameState.status === "playing"}
              channel={channel}
              gameState={gameState}
            />
            {gameState.status === "round_end" && (
              <RoundEndOverlay
                word={roundEndWord}
                secondsLeft={roundEndSecondsLeft}
              />
            )}
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-2xl h-64 lg:flex-1 lg:h-auto">
          <div className="h-full lg:absolute lg:inset-0">
            <GuessChat
              onGuess={handleGuess}
              messages={messages}
              onSend={sendMessage}
              disabled={isDrawer || gameState.status === "round_end"}
            />
          </div>
        </div>
      </div>
    </>
  );
}
