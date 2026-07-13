import { useEffect, useRef, useState, useCallback } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useBroadcast } from "@/hooks/useBroadcast";

export function useGuessChat(
  channel: RealtimeChannel | null,
  opts: {
    userId: string | undefined;
    displayName: string;
    currentDrawer: string | null | undefined;
  },
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const userIdRef = useRef(opts.userId);
  useEffect(() => {
    userIdRef.current = opts.userId;
  });

  const prevDrawer = useRef(opts.currentDrawer);
  useEffect(() => {
    if (prevDrawer.current !== opts.currentDrawer) {
      prevDrawer.current = opts.currentDrawer;
      setMessages([]);
    }
  }, [opts.currentDrawer]);

  useBroadcast<ChatMessage>(channel, "chat_message", (payload) => {
    setMessages((prev) => [...prev, payload]);
  });

  useBroadcast<{ from: string }>(
    channel,
    "request_chat_snapshot",
    (payload) => {
      channel?.send({
        type: "broadcast",
        event: "chat_snapshot",
        payload: {
          to: payload.from,
          messages: messagesRef.current,
        },
      });
    },
  );

  useBroadcast<{ to: string; messages: ChatMessage[] }>(
    channel,
    "chat_snapshot",
    (payload) => {
      if (
        payload.to === userIdRef.current &&
        messagesRef.current.length === 0
      ) {
        setMessages(payload.messages);
      }
    },
  );

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !channel || !opts.userId) return;
      const msg: ChatMessage = {
        id: crypto.randomUUID(),
        userId: opts.userId,
        displayName: opts.displayName,
        text: trimmed,
      };
      channel.send({ type: "broadcast", event: "chat_message", payload: msg });
    },
    [channel, opts.userId, opts.displayName],
  );

  const requestSnapshot = useCallback(() => {
    channel?.send({
      type: "broadcast",
      event: "request_chat_snapshot",
      payload: { from: opts.userId },
    });
  }, [channel, opts.userId]);

  return { messages, sendMessage, requestSnapshot };
}
