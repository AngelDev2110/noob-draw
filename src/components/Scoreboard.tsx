import { useQuery } from "@tanstack/react-query";
import { Crown, Medal } from "lucide-react";
import { getScoreboard } from "@/services/game";
import { cn } from "@/lib/utils";
import { LoaderBar } from "./ui/LoaderBar";

export function Scoreboard({
  roomId,
  currentUserId,
  onlineUserIds,
  variant = "compact",
  className,
}: {
  roomId: string;
  currentUserId?: string;
  onlineUserIds?: Set<string>;
  variant?: "compact" | "full";
  className?: string;
}) {
  const {
    data: players,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["scoreboard", roomId],
    queryFn: () => getScoreboard(roomId),
    enabled: !!roomId,
  });

  const ranked = [...(players ?? [])].sort((a, b) => b.score - a.score);

  return (
    <div className={cn("w-full", className)}>
      <LoaderBar isLoading={isLoading || isFetching} />
      <div className="flex flex-col gap-2 max-h-64 overflow-auto">
        {ranked.map((player, index) => {
          const isMe = player.user_id === currentUserId;
          const isWinner = variant === "full" && index === 0;
          const isOnline = onlineUserIds?.has(player.user_id) ?? false;

          return (
            <div
              key={player.user_id}
              className={cn(
                "flex items-center gap-3 rounded-lg bg-muted/50 p-2",
                isMe && "border border-primary/30 bg-primary/10",
                isWinner && "bg-primary/10 p-3",
              )}
            >
              <div className="flex w-6 shrink-0 items-center justify-center">
                <RankIndicator rank={index} />
              </div>

              <div className="relative shrink-0">
                <div
                  className={cn(
                    "flex items-center justify-center rounded-full bg-primary/15",
                    isWinner ? "h-10 w-10" : "h-8 w-8",
                  )}
                >
                  <span
                    className={cn(
                      "font-semibold text-primary",
                      isWinner ? "text-sm" : "text-xs",
                    )}
                  >
                    {player.display_name?.charAt(0).toUpperCase() ?? "?"}
                  </span>
                </div>
                {onlineUserIds && (
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card",
                      isOnline ? "bg-green-500" : "bg-muted-foreground/40",
                    )}
                  />
                )}
              </div>

              <span
                className={cn(
                  "flex-1 truncate font-medium",
                  isWinner ? "text-base" : "text-sm",
                )}
              >
                {player.display_name ?? "Unknown"}
                {isMe && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    (you)
                  </span>
                )}
              </span>

              <span
                className={cn(
                  "shrink-0 rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary",
                  isWinner ? "text-sm" : "text-xs",
                )}
              >
                {player.score} pts
              </span>
            </div>
          );
        })}

        {ranked.length === 0 && !isLoading && (
          <p className="py-2 text-center text-sm text-muted-foreground">
            No scores yet
          </p>
        )}
      </div>
    </div>
  );
}

function RankIndicator({ rank }: { rank: number }) {
  const rankConfigs: Record<number, React.ReactNode> = {
    0: <Crown className="h-4 w-4 text-yellow-500" />,
    1: <Medal className="h-4 w-4 text-zinc-400" />,
    2: <Medal className="h-4 w-4 text-amber-700" />,
  };
  return (
    rankConfigs[rank] || (
      <span className="text-xs font-semibold text-muted-foreground">
        {rank + 1}
      </span>
    )
  );
}
