import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/context/AuthContext";
import type { RealtimeChannel } from "@supabase/supabase-js";

export function useGameChannel(roomId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth() || {};
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [visibleUserIds, setVisibleUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!roomId || !user) return;

    function trackPresence(ch: RealtimeChannel) {
      return ch.track({
        user_id: user!.id,
        display_name: user!.user_metadata?.display_name ?? "Unknown",
        visible: document.visibilityState === "visible",
      });
    }

    const _channel = supabase
      .channel(`room-game-${roomId}`, {
        config: { broadcast: { self: true } },
      })
      .on("broadcast", { event: "game_started" }, () => {
        queryClient.invalidateQueries({ queryKey: ["gameState", roomId] });
      })
      .on("presence", { event: "sync" }, () => {
        const state = _channel.presenceState<{
          user_id: string;
          visible?: boolean;
        }>();
        const entries = Object.values(state).flat();
        setOnlineUserIds(new Set(entries.map((e) => e.user_id)));
        setVisibleUserIds(
          new Set(entries.filter((e) => e.visible).map((e) => e.user_id)),
        );
      })
      .on("broadcast", { event: "turn_changed" }, () => {
        queryClient.invalidateQueries({ queryKey: ["gameState", roomId] });
        queryClient.invalidateQueries({ queryKey: ["scoreboard", roomId] });
      })
      .on("broadcast", { event: "returned_to_lobby" }, () => {
        queryClient.invalidateQueries({ queryKey: ["gameState", roomId] });
        queryClient.invalidateQueries({ queryKey: ["scoreboard", roomId] });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await trackPresence(_channel);
          setChannel(_channel);
        }
      });

    function handleVisibilityChange() {
      if (_channel.state === "joined") trackPresence(_channel);
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      supabase.removeChannel(_channel);
      _channel.untrack({ user_id: user.id });
      setChannel(null);
      setOnlineUserIds(new Set());
      setVisibleUserIds(new Set());
    };
  }, [roomId, user, queryClient]);

  function broadcastGameStarted() {
    channel?.send({
      type: "broadcast",
      event: "game_started",
      payload: {},
    });
  }

  function broadcastReturnToLobby() {
    channel?.send({
      type: "broadcast",
      event: "returned_to_lobby",
      payload: {},
    });
  }

  return {
    broadcastGameStarted,
    broadcastReturnToLobby,
    onlineUserIds,
    visibleUserIds,
    channel,
  };
}
