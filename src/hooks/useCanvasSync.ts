import { useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

type Point = { x: number; y: number };
type Tool = "pen" | "eraser";
export type Stroke = {
  tool: Tool;
  color: string;
  width: number;
  points: Point[];
};

const BATCH_INTERVAL = 80;

export function useCanvasSync(
  channel: RealtimeChannel | null,
  handlers: {
    onRemoteBatch: (meta: Omit<Stroke, "points">, points: Point[]) => void;
    onRemoteStrokeEnd: () => void;
    onRemoteClear: () => void;
    onSnapshotRequest: () => void;
    onSnapshot: (strokes: Stroke[]) => void;
  },
) {
  const pendingPoints = useRef<Point[]>([]);
  const batchTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeStrokeMeta = useRef<Omit<Stroke, "points"> | null>(null);
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!channel) return;

    channel
      .on("broadcast", { event: "stroke_batch" }, ({ payload }) => {
        handlersRef.current.onRemoteBatch(payload.meta, payload.points);
      })
      .on("broadcast", { event: "stroke_end" }, () => {
        handlersRef.current.onRemoteStrokeEnd();
      })
      .on("broadcast", { event: "clear_all" }, () => {
        handlersRef.current.onRemoteClear();
      })
      .on("broadcast", { event: "request_snapshot" }, () => {
        handlersRef.current.onSnapshotRequest();
      })
      .on("broadcast", { event: "snapshot" }, ({ payload }) => {
        handlersRef.current.onSnapshot(payload.strokes);
      });
  }, [channel]);

  // ---- (drawer) ----
  function startBroadcastStroke(meta: Omit<Stroke, "points">) {
    activeStrokeMeta.current = meta;
    pendingPoints.current = [];
    batchTimer.current = setInterval(flushBatch, BATCH_INTERVAL);
  }

  function addBroadcastPoint(point: Point) {
    pendingPoints.current.push(point);
  }

  function flushBatch() {
    if (
      !channel ||
      !activeStrokeMeta.current ||
      pendingPoints.current.length === 0
    )
      return;
    const points = pendingPoints.current;
    pendingPoints.current = [];
    channel.send({
      type: "broadcast",
      event: "stroke_batch",
      payload: { meta: activeStrokeMeta.current, points },
    });
  }

  function endBroadcastStroke() {
    flushBatch();
    if (batchTimer.current) {
      clearInterval(batchTimer.current);
      batchTimer.current = null;
    }
    activeStrokeMeta.current = null;
    channel?.send({ type: "broadcast", event: "stroke_end", payload: {} });
  }

  function broadcastClear() {
    channel?.send({ type: "broadcast", event: "clear_all", payload: {} });
  }

  function requestSnapshot() {
    channel?.send({
      type: "broadcast",
      event: "request_snapshot",
      payload: {},
    });
  }

  function sendSnapshot(strokes: Stroke[]) {
    channel?.send({
      type: "broadcast",
      event: "snapshot",
      payload: { strokes },
    });
  }

  return {
    startBroadcastStroke,
    addBroadcastPoint,
    endBroadcastStroke,
    broadcastClear,
    requestSnapshot,
    sendSnapshot,
  };
}
