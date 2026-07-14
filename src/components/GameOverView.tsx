import type { User } from "@supabase/supabase-js";
import type { UseMutationResult } from "@tanstack/react-query";
import { Trophy, GamepadDirectional } from "lucide-react";
import type { getRoomBySlug } from "@/services/rooms";
import type { startGame } from "@/services/game";
import { CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scoreboard } from "@/components/Scoreboard";

export function GameOverView({
  room,
  user,
  isHost,
  onlineUserIds,
  startGameMutation,
}: {
  room: Awaited<ReturnType<typeof getRoomBySlug>>;
  user: User | null | undefined;
  isHost: boolean;
  onlineUserIds: Set<string>;
  startGameMutation: UseMutationResult<
    Awaited<ReturnType<typeof startGame>>,
    Error,
    void
  >;
}) {
  return (
    <CardContent className="flex flex-col items-center gap-4">
      <div className="flex flex-col items-center gap-1 text-center">
        <Trophy className="h-10 w-10 text-yellow-500" />
        <CardTitle className="text-xl">Game over</CardTitle>
        <p className="text-sm text-muted-foreground">Final standings</p>
      </div>

      <Scoreboard
        className="w-full"
        roomId={room.id}
        currentUserId={user?.id}
        onlineUserIds={onlineUserIds}
        variant="full"
      />

      {isHost ? (
        <Button
          size="lg"
          className="w-full"
          onClick={() => startGameMutation.mutate()}
          disabled={startGameMutation.isPending}
        >
          {startGameMutation.isPending ? "Starting..." : "Play again"}{" "}
          <GamepadDirectional />
        </Button>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          Waiting for the host to start a new game…
        </p>
      )}
    </CardContent>
  );
}
