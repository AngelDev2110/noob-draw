import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase";
import type { User } from "@supabase/supabase-js";
import type { getRoomBySlug } from "@/services/rooms";

export function useRoomMembershipRealtime(
  room: Awaited<ReturnType<typeof getRoomBySlug>> | undefined,
  user: User | null | undefined,
  isHost: boolean,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!room || !isHost) return;

    const ch = supabase
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
      supabase.removeChannel(ch);
    };
  }, [isHost, queryClient, room]);

  useEffect(() => {
    if (!room || !user || isHost) return;

    const ch = supabase
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
      supabase.removeChannel(ch);
    };
  }, [room, user, isHost, queryClient]);
}
