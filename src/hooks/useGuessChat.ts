import { useEffect, useRef, useState, useCallback } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

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

  const prevDrawer = useRef(opts.currentDrawer);
  useEffect(() => {
    if (prevDrawer.current !== opts.currentDrawer) {
      prevDrawer.current = opts.currentDrawer;
      setMessages([]);
    }
  }, [opts.currentDrawer]);

  useEffect(() => {
    if (!channel) return;

    channel
      .on("broadcast", { event: "chat_message" }, ({ payload }) => {
        setMessages((prev) => [...prev, payload as ChatMessage]);
      })
      .on("broadcast", { event: "request_chat_snapshot" }, ({ payload }) => {
        channel.send({
          type: "broadcast",
          event: "chat_snapshot",
          payload: {
            to: payload.from,
            messages: messagesRef.current,
          },
        });
      })
      .on("broadcast", { event: "chat_snapshot" }, ({ payload }) => {
        if (payload.to === opts.userId && messagesRef.current.length === 0) {
          setMessages(payload.messages as ChatMessage[]);
        }
      });
  }, [channel, opts.userId]);

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
