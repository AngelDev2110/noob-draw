import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

export function useGameChannel(roomId: string | undefined) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room-game-${roomId}`, {
        config: {
          broadcast: {
            self: true,
          },
        },
      })
      .on("broadcast", { event: "game_started" }, () => {
        queryClient.invalidateQueries({ queryKey: ["gameState", roomId] });
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, queryClient]);

  function broadcastGameStarted() {
    channelRef.current?.send({
      type: "broadcast",
      event: "game_started",
      payload: {},
    });
  }

  return { broadcastGameStarted };
}
