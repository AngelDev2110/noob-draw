import {
  getRoomBySlug,
  getMyMembership,
  requestToJoin,
} from "@/services/rooms";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { Card } from "@/components/ui/card";
import { LobbySkeleton } from "@/components/LobbySkeleton";
import { RoomErrorContent } from "@/components/RoomErrorContent";
import { RoomLobbyContent } from "@/components/RoomLobbyContent";
import { RoomJoinContent } from "@/components/RoomJoinContent";
import { useGameChannel } from "@/hooks/useGameChannel";
import {
  getGameState,
  startGame,
  getMyWord,
  submitGuess,
  getMyGuessStatus,
  checkAndAdvanceTurn,
  getRoundEndWord,
  getServerTime,
} from "@/services/game";
import { DrawingCanvas } from "./DrawingCanvas";
import { WordDisplay } from "./DisplayWord";
import { useWordReveal } from "@/hooks/useWordReveal";
import { useGuessChat } from "@/hooks/useGuessChat";
import { GuessChat } from "./GuessChat";
import { CorrectGuessOverlay } from "./CorrectGuessOverlay";
import { useCountdown } from "@/hooks/useCountDown";
import { CountdownTimer } from "./CountDownTimer";
import { RoundEndOverlay } from "./RoundEndOverlay";
import {
  TURN_DURATION,
  ROUND_END_DURATION,
  STALE_BUFFER,
} from "@/constants/game";

export function RoomView() {
  const { slug } = useParams({ from: "/rooms/$slug" });
  const { user } = useAuth() || {};
  const queryClient = useQueryClient();

  const {
    data: room,
    isLoading: isRoomLoading,
    isError: isRoomError,
  } = useQuery({
    queryKey: ["room", slug],
    queryFn: () => getRoomBySlug(slug),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: membership, isLoading: isMembershipLoading } = useQuery({
    queryKey: ["membership", room?.id],
    queryFn: () => getMyMembership(room!.id),
    enabled: !!room,
  });

  const isHost = user?.id === room?.created_by;

  const joinMutation = useMutation({
    mutationFn: () => requestToJoin(room!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membership", room?.id] });
    },
  });

  const { broadcastGameStarted, onlineUserIds, channel } = useGameChannel(
    room?.id,
  );

  const { data: gameState } = useQuery({
    queryKey: ["gameState", room?.id],
    queryFn: () => getGameState(room!.id),
    enabled: !!room,
  });

  const startGameMutation = useMutation({
    mutationFn: () => startGame(room!.id),
    onSuccess: () => {
      broadcastGameStarted();
    },
  });

  useEffect(() => {
    if (!room || !isHost) return;

    const ch = supabase
      .channel(`room-members-${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "room_members",
          filter: `room_id=eq.${room.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["pending", room.id] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [isHost, queryClient, room]);

  useEffect(() => {
    if (!room || !user || isHost) return;

    const ch = supabase
      .channel(`my-membership-${room.id}-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "room_members",
          filter: `room_id=eq.${room.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["membership", room.id] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [room, user, isHost, queryClient]);

  const isDrawer = gameState?.current_drawer === user?.id;

  const { data: myWord } = useQuery({
    queryKey: ["myWord", room?.id, gameState?.current_drawer],
    queryFn: () => getMyWord(room!.id),
    enabled: !!room && isDrawer && gameState?.status === "playing",
  });

  const [serverOffset, setServerOffset] = useState(0);

  useEffect(() => {
    getServerTime().then(setServerOffset);
  }, []);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const { revealedLetters } = useWordReveal(channel, {
    isDrawer,
    myWord,
    turnStartedAt: gameState?.turn_started_at,
    isPlaying: gameState?.status === "playing",
    currentDrawer: gameState?.current_drawer,
    serverOffset,
  });

  const { messages, sendMessage, requestSnapshot } = useGuessChat(channel, {
    userId: user?.id,
    displayName: user?.user_metadata?.display_name ?? "Unknown",
    currentDrawer: gameState?.current_drawer,
  });

  useEffect(() => {
    if (channel && gameState?.status === "playing") requestSnapshot();
  }, [channel, gameState?.status, requestSnapshot]);

  async function handleGuess(text: string) {
    const result = await submitGuess(room!.id, text);
    if (result.correct) {
      setMyRevealedWord(result.revealed_word);
      channel?.send({
        type: "broadcast",
        event: "correct_guess",
        payload: {
          userId: user!.id,
          displayName: user!.user_metadata?.display_name ?? "Unknown",
          points: result.points_awarded,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["members", room?.id] });
    }
    return result;
  }

  const [announcement, setAnnouncement] = useState<{
    id: string;
    displayName: string;
    points: number;
  } | null>(null);

  const [myRevealedWord, setMyRevealedWord] = useState<string | null>(null);

  useEffect(() => {
    if (!channel) return;
    channel.on("broadcast", { event: "correct_guess" }, ({ payload }) => {
      setAnnouncement({
        id: crypto.randomUUID(),
        displayName: payload.displayName,
        points: payload.points,
      });
    });
  }, [channel]);

  const [prevDrawerForReveal, setPrevDrawerForReveal] = useState(
    gameState?.current_drawer,
  );
  if (gameState?.current_drawer !== prevDrawerForReveal) {
    setPrevDrawerForReveal(gameState?.current_drawer);
    setMyRevealedWord(null);
    setAnnouncement(null);
  }

  const { data: guessStatus } = useQuery({
    queryKey: ["guessStatus", room?.id, gameState?.current_drawer],
    queryFn: () => getMyGuessStatus(room!.id),
    enabled: !!room && gameState?.status === "playing" && !isDrawer,
  });

  useEffect(() => {
    if (guessStatus?.already_guessed) {
      setMyRevealedWord(guessStatus.revealed_word);
    }
  }, [guessStatus]);

  useEffect(() => {
    if (!room || !channel) return;
    if (gameState?.status !== "playing" && gameState?.status !== "round_end")
      return;

    const interval = setInterval(async () => {
      const statusBefore = gameState?.status;
      await checkAndAdvanceTurn(room.id);
      const after = await getGameState(room.id);

      if (after.status !== statusBefore) {
        channel.send({ type: "broadcast", event: "turn_changed", payload: {} });
        queryClient.setQueryData(["gameState", room.id], after);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [room, channel, gameState?.status, queryClient]);

  const secondsLeft = useCountdown(
    gameState?.turn_started_at,
    TURN_DURATION,
    serverOffset,
  );

  const { data: roundEndWord } = useQuery({
    queryKey: ["roundEndWord", room?.id, gameState?.round_number],
    queryFn: () => getRoundEndWord(room!.id),
    enabled: !!room && gameState?.status === "round_end",
  });

  const roundEndSecondsLeft = useCountdown(
    gameState?.round_end_started_at,
    ROUND_END_DURATION,
    serverOffset,
  );

  function isTimestampFresh(
    startedAt: string | null | undefined,
    durationSeconds: number,
  ): boolean {
    if (!startedAt) return false;
    const elapsed = (now + serverOffset - new Date(startedAt).getTime()) / 1000;
    return elapsed < durationSeconds + STALE_BUFFER;
  }

  const isGameActive =
    (gameState?.status === "playing" &&
      isTimestampFresh(gameState.turn_started_at, TURN_DURATION)) ||
    (gameState?.status === "round_end" &&
      isTimestampFresh(gameState.round_end_started_at, ROUND_END_DURATION));

  if (isRoomError)
    return (
      <Card className="w-full max-w-sm">
        <RoomErrorContent />
      </Card>
    );

  if (isRoomLoading || isMembershipLoading)
    return (
      <Card className="w-full max-w-sm">
        <LobbySkeleton />
      </Card>
    );
  if (!room) return <div>Room not found</div>;

  if (isGameActive) {
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

  if (membership?.approved) {
    return (
      <Card className="w-full max-w-sm">
        <RoomLobbyContent
          onlineUserIds={onlineUserIds}
          room={room}
          user={user}
          isHost={isHost}
          startGameMutation={startGameMutation}
        />
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <RoomJoinContent
        user={user}
        membership={membership}
        joinMutation={joinMutation}
      />
    </Card>
  );
}
