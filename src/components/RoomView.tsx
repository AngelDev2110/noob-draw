import {
  getRoomBySlug,
  getMyMembership,
  requestToJoin,
} from "@/services/rooms";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Card } from "@/components/ui/card";
import { LobbySkeleton } from "@/components/LobbySkeleton";
import { RoomErrorContent } from "@/components/RoomErrorContent";
import { RoomLobbyContent } from "@/components/RoomLobbyContent";
import { RoomJoinContent } from "@/components/RoomJoinContent";
import { useGameChannel } from "@/hooks/useGameChannel";
import { getGameState, startGame, getMyWord } from "@/services/game";
import { DrawingCanvas } from "./DrawingCanvas";
import { WordDisplay } from "./DisplayWord";
import { useWordReveal } from "@/hooks/useWordReveal";
import { useGuessChat } from "@/hooks/useGuessChat";
import { GuessChat } from "./GuessChat";

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

  const { revealedLetters } = useWordReveal(channel, {
    isDrawer,
    myWord,
    turnStartedAt: gameState?.turn_started_at,
    isPlaying: gameState?.status === "playing",
    currentDrawer: gameState?.current_drawer,
  });

  const { messages, sendMessage, requestSnapshot } = useGuessChat(channel, {
    userId: user?.id,
    displayName: user?.user_metadata?.display_name ?? "Unknown",
    currentDrawer: gameState?.current_drawer,
  });

  useEffect(() => {
    if (channel && gameState?.status === "playing") requestSnapshot();
  }, [channel, gameState?.status, requestSnapshot]);

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

  if (gameState?.status === "playing") {
    return (
      <div className="flex flex-col lg:flex-row gap-3 w-full max-w-6xl mx-auto">
        <div className="flex flex-col gap-3 flex-1">
          <WordDisplay
            isDrawer={isDrawer}
            word={myWord}
            wordLength={gameState.word_length}
            revealedLetters={revealedLetters}
          />
          <DrawingCanvas
            isDrawer={isDrawer}
            channel={channel}
            gameState={gameState}
          />
        </div>
        <div className="w-100 h-64 lg:h-auto">
          <GuessChat
            messages={messages}
            onSend={sendMessage}
            disabled={isDrawer}
          />
        </div>
      </div>
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
