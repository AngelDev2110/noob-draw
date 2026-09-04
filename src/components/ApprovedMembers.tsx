import { useAuth } from "@/context/AuthContext";
import {
  getApprovedMembers,
  removeMember,
  getRoomBySlug,
} from "@/services/rooms";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Users, UserMinus } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoaderBar } from "./ui/LoaderBar";

export function ApprovedMembers({
  room,
  className,
  onlineUserIds,
  isHost = false,
}: {
  room: Awaited<ReturnType<typeof getRoomBySlug>>;
  className?: string;
  onlineUserIds: Set<string>;
  isHost?: boolean;
}) {
  const { user } = useAuth() || {};
  const queryClient = useQueryClient();

  const {
    data: members,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["members", room?.id],
    queryFn: () => getApprovedMembers(room!.id),
    enabled: !!room && !!user,
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeMember(room!.id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", room?.id] });
    },
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
              {m.user_id === room?.created_by ? (
                <span className="text-xs font-semibold text-primary/60 bg-primary/10 px-2 py-0.5 rounded-full">
                  Host
                </span>
              ) : (
                isHost && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        aria-label={`Remove ${m.display_name ?? "Unknown"}`}
                        disabled={removeMutation.isPending}
                      >
                        <UserMinus className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Remove {m.display_name ?? "this player"}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          They&apos;ll be kicked out of the room and lose
                          their progress in the current game.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => removeMutation.mutate(m.user_id)}
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
