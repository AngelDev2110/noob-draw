import type { User } from "@supabase/supabase-js";
import type { UseMutationResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { getApprovedMembers, getRoomBySlug } from "@/services/rooms";
import { startGame } from "@/services/game";
import { CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RoomSlug } from "@/components/RoomSlug";
import { ApprovedMembers } from "@/components/ApprovedMembers";
import { PendingMembers } from "@/components/PendingMembers";
import { GamepadDirectional } from "lucide-react";

export function RoomLobbyContent({
  room,
  user,
  isHost,
  startGameMutation,
  onlineUserIds,
}: {
  room: Awaited<ReturnType<typeof getRoomBySlug>>;
  user: User | null | undefined;
  isHost: boolean;
  startGameMutation: UseMutationResult<
    Awaited<ReturnType<typeof startGame>>,
    Error,
    void
  >;
  onlineUserIds: Set<string>;
}) {
  const { data: approvedMembers } = useQuery({
    queryKey: ["members", room?.id],
    queryFn: () => getApprovedMembers(room!.id),
    enabled: !!room && isHost,
  });

  return (
    <CardContent>
      <CardTitle className="text-base mb-4">
        Hey,{" "}
        <span className="font-bold text-primary">
          {user?.user_metadata.display_name}
        </span>
        !
      </CardTitle>

      <RoomSlug slug={room.slug} />
      <ApprovedMembers
        className="mt-4"
        room={room}
        onlineUserIds={onlineUserIds}
      />
      {isHost && (
        <div>
          <PendingMembers className="mt-4" room={room} />
          <Button
            size={"lg"}
            className="mt-4 w-full"
            onClick={() => startGameMutation.mutate()}
            disabled={
              startGameMutation.isPending || (approvedMembers?.length ?? 0) < 2
            }
          >
            {startGameMutation.isPending ? "Starting..." : "Start"}{" "}
            <GamepadDirectional />
          </Button>
        </div>
      )}
    </CardContent>
  );
}
