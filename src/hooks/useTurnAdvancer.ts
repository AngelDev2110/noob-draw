import { useEffect } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { checkAndAdvanceTurn, getGameState } from "@/services/game";

export function useTurnAdvancer(
  roomId: string | undefined,
  channel: RealtimeChannel | null,
  status: string | undefined,
  enabled: boolean,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !roomId || !channel) return;
    if (status !== "playing" && status !== "round_end") return;

    const interval = setInterval(async () => {
      await checkAndAdvanceTurn(roomId);
      const after = await getGameState(roomId);

      if (after.status !== status) {
        channel.send({ type: "broadcast", event: "turn_changed", payload: {} });
        queryClient.setQueryData(["gameState", roomId], after);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [enabled, roomId, channel, status, queryClient]);
}
