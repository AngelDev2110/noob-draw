import {
  getRoomBySlug,
  getMyMembership,
  requestToJoin,
} from "@/services/rooms";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { LobbySkeleton } from "@/components/LobbySkeleton";
import { RoomErrorContent } from "@/components/RoomErrorContent";
import { RoomLobbyContent } from "@/components/RoomLobbyContent";
import { RoomJoinContent } from "@/components/RoomJoinContent";
import { GameView } from "@/components/GameView";
import { GameOverView } from "@/components/GameOverView";
import { useGameChannel } from "@/hooks/useGameChannel";
import { useServerClock } from "@/hooks/useServerClock";
import { useRoomMembershipRealtime } from "@/hooks/useRoomMembershipRealtime";
import { getGameState, startGame } from "@/services/game";
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

  useRoomMembershipRealtime(room, user, isHost);

  const { serverOffset, now } = useServerClock();

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

  if (isGameActive && gameState) {
    return (
      <GameView
        room={room}
        user={user}
        channel={channel}
        gameState={gameState}
        serverOffset={serverOffset}
        onlineUserIds={onlineUserIds}
      />
    );
  }

  if (gameState?.status === "finished" && membership?.approved) {
    return (
      <Card className="w-full max-w-md">
        <GameOverView
          room={room}
          user={user}
          isHost={isHost}
          onlineUserIds={onlineUserIds}
          startGameMutation={startGameMutation}
        />
      </Card>
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
