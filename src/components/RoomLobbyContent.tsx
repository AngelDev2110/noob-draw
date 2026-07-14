import type { User } from "@supabase/supabase-js";
import type { UseMutationResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import {
  getApprovedMembers,
  getRoomBySlug,
  updateRoomLanguage,
} from "@/services/rooms";
import { startGame } from "@/services/game";
import { CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RoomSlug } from "@/components/RoomSlug";
import { ApprovedMembers } from "@/components/ApprovedMembers";
import { PendingMembers } from "@/components/PendingMembers";
import { GamepadDirectional } from "lucide-react";

const ROOM_LANGUAGES = ["en", "es"] as const;

export function RoomLobbyContent({
  room,
  user,
  isHost,
  startGameMutation,
  updateLanguageMutation,
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
  updateLanguageMutation: UseMutationResult<
    Awaited<ReturnType<typeof updateRoomLanguage>>,
    Error,
    string
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
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Word language:
            </span>
            <div className="flex gap-1">
              {ROOM_LANGUAGES.map((lang) => (
                <Button
                  key={lang}
                  size="sm"
                  variant={room.language === lang ? "default" : "outline"}
                  disabled={
                    updateLanguageMutation.isPending ||
                    startGameMutation.isPending
                  }
                  onClick={() => updateLanguageMutation.mutate(lang)}
                >
                  {lang.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
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
