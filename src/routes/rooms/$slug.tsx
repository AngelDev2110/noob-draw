import { createFileRoute } from "@tanstack/react-router";
import {
  getRoomBySlug,
  getMyMembership,
  requestToJoin,
} from "@/services/rooms";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { UsernameField } from "@/components/UsernameField";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { LobbySkeleton } from "@/components/LobbySkeleton";
import { RoomSlug } from "@/components/RoomSlug";
import { PendingMembers } from "@/components/PendingMembers";
import { ApprovedMembers } from "@/components/ApprovedMembers";
import { GamepadDirectional } from "lucide-react";
import { SendHorizonal, LoaderCircle, Timer } from "lucide-react";

export const Route = createFileRoute("/rooms/$slug")({
  component: RouteComponent,
});

function RouteComponent() {
  const { slug } = Route.useParams();
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
        <CardContent>
          <p>
            We couldn't fetch the room data 😢, maybe{" "}
            <span className="font-bold">reloading the page</span> will solve our
            problems!!{" "}
            <span className="text-xs text-muted-foreground">(We hope so)</span>
          </p>

          <Button
            className="mt-3 w-full"
            onClick={() => window.location.reload()}
          >
            Reload
          </Button>
        </CardContent>
      </Card>
    );

  if (isRoomLoading || isMembershipLoading)
    return (
      <Card className="w-full max-w-sm">
        <LobbySkeleton />
      </Card>
    );
  if (!room) return <div>Room not found</div>;

  if (membership?.approved) {
    return (
      <Card className="w-full max-w-sm">
        <CardContent>
          <CardTitle className="text-base mb-4">
            Hey,{" "}
            <span className="font-bold text-primary">
              {user?.user_metadata.display_name}
            </span>
            !
          </CardTitle>

          <RoomSlug slug={room.slug} />
          <ApprovedMembers className="mt-4" room={room} />
          {isHost && (
            <div>
              <PendingMembers className="mt-4" room={room} />
              <Button size={"lg"} className="mt-4 w-full">
                Start <GamepadDirectional />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardContent>
        <CardTitle className="text-base">
          {user?.user_metadata?.display_name ? (
            <p>
              Hey,{" "}
              <span className="font-bold text-primary">
                {user.user_metadata.display_name}
              </span>
              !
            </p>
          ) : (
            "What should we call you?!"
          )}
        </CardTitle>
        <CardDescription className="mb-4">
          {user?.user_metadata?.display_name ? (
            "You can change your nickname below."
          ) : (
            <p>
              <span className="text-primary">Set your nickname</span> before
              creating or joining a room. Your name will be visible to other
              players
            </p>
          )}
        </CardDescription>
        <UsernameField />

        <Button
          className="mt-3 w-full"
          onClick={() => joinMutation.mutate()}
          disabled={
            joinMutation.isPending ||
            !user?.user_metadata?.display_name ||
            !!membership
          }
        >
          {joinMutation.isPending ? (
            <>
              <span> Sending</span>
              <LoaderCircle className="animate-spin" />
            </>
          ) : membership ? (
            <>
              <span>Waiting for approval</span>
              <Timer className="animate-pulse" />
            </>
          ) : (
            <>
              <span>Ask to join the room</span>
              <SendHorizonal />
            </>
          )}
        </Button>

        {membership && !membership.approved && (
          <p className="text-xs text-muted-foreground mt-1 text-center">
            <span className="font-bold">Note:</span> Tell your friend to approve
            your request!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
