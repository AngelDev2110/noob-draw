import type { User } from "@supabase/supabase-js";
import { CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Field, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createRoomSlug } from "@/utils/rooms";
import { createRoomWithHost } from "@/services/rooms";
import { useNavigate } from "@tanstack/react-router";
import { UsernameField } from "./UsernameField";
import { ArrowBigRight } from "lucide-react";
import { LoaderCircle, Plus } from "lucide-react";

export function HomeFormContent(props: { user: User | null }) {
  const { user } = props;

  const navigate = useNavigate();

  const [joinSlug, setJoinSlug] = useState("");

  const createRoomMutation = useMutation({
    mutationFn: async () => {
      const slug = createRoomSlug();
      await createRoomWithHost(slug);
      return slug;
    },
    onSuccess: (slug) => {
      navigate({ to: "/rooms/$slug", params: { slug } });
    },
    onError: () => {
      console.error("Error creating room");
    },
  });

  function handleJoinRoom() {
    const trimmedSlug = joinSlug.trim().split("/").at(-1) ?? joinSlug.trim();
    if (!trimmedSlug) return;
    navigate({ to: "/rooms/$slug", params: { slug: trimmedSlug } });
  }

  return (
    <>
      <CardHeader>
        <CardTitle className="text-base">
          {user?.user_metadata?.display_name ? (
            <p>
              Welcome,{" "}
              <span className="font-bold text-primary">
                {user.user_metadata.display_name}
              </span>
              !
            </p>
          ) : (
            "What should we call you?!"
          )}
        </CardTitle>
        <CardDescription>
          {user?.user_metadata?.display_name ? (
            "You can change your nickname or create/join a room below."
          ) : (
            <p>
              <span className="text-primary">Set your nickname</span> before
              creating or joining a room. Your name will be visible to other
              players
            </p>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <UsernameField />

        <Button
          onClick={() => createRoomMutation.mutate()}
          disabled={
            createRoomMutation.isPending || !user?.user_metadata?.display_name
          }
          className="w-full"
        >
          {createRoomMutation.isPending ? (
            <>
              Creating Room
              <LoaderCircle className="animate-spin" />
            </>
          ) : (
            <>
              Create Room
              <Plus />
            </>
          )}
        </Button>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">or join one</span>
          <Separator className="flex-1" />
        </div>

        <div className="flex gap-2">
          <Field>
            <FieldLabel htmlFor="join-room">Room Code</FieldLabel>
            <div className="flex gap-2">
              <Input
                id="join-room"
                maxLength={8}
                placeholder="e.g. 1a2b3c4d"
                value={joinSlug}
                onChange={(e) => setJoinSlug(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
              />
              <Button
                variant="secondary"
                onClick={handleJoinRoom}
                disabled={
                  joinSlug.trim().length < 8 ||
                  !user?.user_metadata?.display_name
                }
              >
                <ArrowBigRight />
              </Button>
            </div>
          </Field>
        </div>
      </CardContent>
    </>
  );
}
