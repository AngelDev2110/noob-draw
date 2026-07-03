import type { User } from "@supabase/supabase-js";
import { getRoomBySlug } from "@/services/rooms";
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
}: {
  room: Awaited<ReturnType<typeof getRoomBySlug>>;
  user: User | null | undefined;
  isHost: boolean;
}) {
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
  );
}
