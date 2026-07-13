import { useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

type Handler = (payload: unknown) => void;

const registry = new WeakMap<RealtimeChannel, Map<string, Set<Handler>>>();

function eventHandlers(channel: RealtimeChannel, event: string): Set<Handler> {
  let byEvent = registry.get(channel);
  if (!byEvent) {
    byEvent = new Map();
    registry.set(channel, byEvent);
  }
  let handlers = byEvent.get(event);
  if (!handlers) {
    handlers = new Set();
    byEvent.set(event, handlers);
    const current = handlers;
    channel.on("broadcast", { event }, ({ payload }) => {
      current.forEach((h) => h(payload));
    });
  }
  return handlers;
}

export function useBroadcast<T = Record<string, unknown>>(
  channel: RealtimeChannel | null,
  event: string,
  handler: (payload: T) => void,
) {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!channel) return;
    const fn: Handler = (payload) => handlerRef.current(payload as T);
    const handlers = eventHandlers(channel, event);
    handlers.add(fn);
    return () => {
      handlers.delete(fn);
    };
  }, [channel, event]);
}
