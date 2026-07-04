import { useAuth } from "@/context/AuthContext";
import { getApprovedMembers, getRoomBySlug } from "@/services/rooms";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoaderBar } from "./ui/LoaderBar";

export function ApprovedMembers({
  room,
  className,
  onlineUserIds,
}: {
  room: Awaited<ReturnType<typeof getRoomBySlug>>;
  className?: string;
  onlineUserIds: Set<string>;
}) {
  const { user } = useAuth() || {};

  const {
    data: members,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["members", room?.id],
    queryFn: () => getApprovedMembers(room!.id),
    enabled: !!room && !!user,
  });

  if (!members || members.length === 0) {
    return (
      <Card className={cn("w-full max-w-sm", className)}>
        <LoaderBar isLoading={isLoading} className="-mt-4" />
        <CardContent className="flex flex-col items-center gap-2 py-2 text-center">
          <Users className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No one in the room yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full max-w-sm", className)}>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
          <Users className="h-4 w-4" />
          In the room
          <span className="ml-auto bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
            {members.length}
          </span>
        </CardTitle>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          {members.filter((m) => onlineUserIds.has(m.user_id)).length} online
          now
        </div>
        <LoaderBar isLoading={isLoading || isFetching} />
      </CardHeader>
      <CardContent className="flex flex-col gap-2 pt-0 max-h-48 overflow-auto">
        {members.map((m) => {
          const isOnline = onlineUserIds.has(m.user_id);

          return (
            <div
              key={m.user_id}
              className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
            >
              <div className="relative shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary">
                    {m.display_name?.charAt(0).toUpperCase() ?? "?"}
                  </span>
                </div>
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card",
                    isOnline ? "bg-green-500" : "bg-muted-foreground/40",
                  )}
                />
              </div>
              <span className="flex-1 text-sm font-medium truncate">
                {m.display_name ?? "Unknown"}
              </span>
              {m.user_id === room?.created_by && (
                <span className="text-xs font-semibold text-primary/60 bg-primary/10 px-2 py-0.5 rounded-full">
                  Host
                </span>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
