import { useAuth } from "@/context/AuthContext";
import {
  getPendingMembers,
  approveMember,
  getRoomBySlug,
} from "@/services/rooms";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoaderBar } from "./ui/LoaderBar";

export function PendingMembers({
  room,
  className,
}: {
  room: Awaited<ReturnType<typeof getRoomBySlug>>;
  className?: string;
}) {
  const queryClient = useQueryClient();
  const { user } = useAuth() || {};

  const {
    data: pending,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["pending", room?.id],
    queryFn: () => getPendingMembers(room!.id),
    enabled: !!room && user?.id === room.created_by,
  });

  const approveMutation = useMutation({
    mutationFn: (userId: string) => approveMember(room!.id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending", room?.id] });
      queryClient.invalidateQueries({ queryKey: ["members", room?.id] });
    },
  });

  if (!pending || pending.length === 0) {
    return (
      <Card className={cn("w-full max-w-sm", className)}>
        <LoaderBar isLoading={isLoading} className="-mt-4" />
        <CardContent className="flex flex-col items-center gap-2 py-2 text-center">
          <Clock className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No one waiting to join yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full max-w-sm", className)}>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Waiting to join
          <span className="ml-auto bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
            {pending.length}
          </span>
        </CardTitle>
        <LoaderBar
          isLoading={isLoading || isFetching || approveMutation.isPending}
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-2 pt-0 max-h-24 overflow-auto">
        {pending.map((p) => (
          <div
            key={p.user_id}
            className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
          >
            <span className="flex-1 text-sm font-medium truncate">
              {p.display_name ?? "Unknown"}
            </span>
            <Button
              size="sm"
              variant="secondary"
              className="shrink-0 gap-1.5"
              onClick={() => approveMutation.mutate(p.user_id)}
              disabled={approveMutation.isPending}
            >
              <UserCheck className="h-3.5 w-3.5" />
              Let in
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
