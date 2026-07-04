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
import { getGameState, startGame } from "@/services/game";
import { RoomGame } from "./RoomGame";

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
    staleTime: 1000 * 60 * 5,
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

  const { broadcastGameStarted } = useGameChannel(room?.id);

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
    const channel = supabase
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
      supabase.removeChannel(channel);
    };
  }, [isHost, queryClient, room]);

  useEffect(() => {
    if (!room || !user || isHost) return;
    const channel = supabase
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
      supabase.removeChannel(channel);
    };
  }, [room, user, isHost, queryClient]);

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
    return <RoomGame />;
  }

  if (membership?.approved) {
    return (
      <Card className="w-full max-w-sm">
        <RoomLobbyContent
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
