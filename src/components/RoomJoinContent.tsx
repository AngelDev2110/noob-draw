import type { User } from "@supabase/supabase-js";
import type { UseMutationResult } from "@tanstack/react-query";
import { getMyMembership, requestToJoin } from "@/services/rooms";
import { CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UsernameField } from "@/components/UsernameField";
import { SendHorizonal, LoaderCircle, Timer } from "lucide-react";

export function RoomJoinContent({
  user,
  membership,
  joinMutation,
}: {
  user: User | null | undefined;
  membership: Awaited<ReturnType<typeof getMyMembership>> | undefined;
  joinMutation: UseMutationResult<
    Awaited<ReturnType<typeof requestToJoin>>,
    Error,
    void
  >;
}) {
  return (
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
  );
}
