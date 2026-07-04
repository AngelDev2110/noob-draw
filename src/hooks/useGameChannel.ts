import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/context/AuthContext";
import type { RealtimeChannel } from "@supabase/supabase-js";

export function useGameChannel(roomId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth() || {};
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!roomId || !user) return;

    const channel = supabase
      .channel(`room-game-${roomId}`, {
        config: { broadcast: { self: true } },
      })
      .on("broadcast", { event: "game_started" }, () => {
        queryClient.invalidateQueries({ queryKey: ["gameState", roomId] });
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ user_id: string }>();
        const ids = new Set(
          Object.values(state).flatMap((entries) =>
            entries.map((e) => e.user_id),
          ),
        );
        setOnlineUserIds(ids);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: user.id,
            display_name: user.user_metadata?.display_name ?? "Unknown",
          });
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channel.untrack({ user_id: user.id });
      channelRef.current = null;
      setOnlineUserIds(new Set());
    };
  }, [roomId, user, queryClient]);

  function broadcastGameStarted() {
    channelRef.current?.send({
      type: "broadcast",
      event: "game_started",
      payload: {},
    });
  }

  return { broadcastGameStarted, onlineUserIds };
}
