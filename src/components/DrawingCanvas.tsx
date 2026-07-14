import { useRef, useState, useEffect, useCallback } from "react";
import { Eraser, Trash2 } from "lucide-react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useCanvasSync } from "@/hooks/useCanvasSync";
import type { getGameState } from "@/services/game";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
const COLORS = [
  "#1a1a1a",
  "#e8620a",
  "#e11d48",
  "#f59e0b",
  "#16a34a",
  "#2563eb",
  "#7c3aed",
  "#db2777",
];
const WIDTHS = [3, 6, 12];
const ERASER_WIDTH = 24;

function applyStrokeStyle(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.lineWidth = stroke.width;
  if (stroke.tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(0,0,0,1)";
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = stroke.color;
  }
}

function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  w: number,
  h: number,
) {
  if (!stroke.points || stroke.points.length < 2) return;
  applyStrokeStyle(ctx, stroke);
  ctx.beginPath();
  const first = stroke.points[0];
  ctx.moveTo(first.x * w, first.y * h);
  for (const p of stroke.points.slice(1)) {
    ctx.lineTo(p.x * w, p.y * h);
  }
  ctx.stroke();
}

export function DrawingCanvas({
  isDrawer,
  channel,
  gameState,
}: {
  isDrawer: boolean;
  channel: RealtimeChannel | null;
  gameState: Awaited<ReturnType<typeof getGameState>>;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentStroke = useRef<Stroke | null>(null);
  const strokesRef = useRef<Stroke[]>([]);

  const remoteStroke = useRef<Stroke | null>(null);

  const canvasSync = useCanvasSync(channel, {
    onRemoteBatch: (meta, points) => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;

      if (!remoteStroke.current) {
        remoteStroke.current = { ...meta, points: [...points] };
      } else {
        remoteStroke.current.points.push(...points);
      }

      const all = remoteStroke.current.points;
      applyStrokeStyle(ctx, remoteStroke.current);
      ctx.beginPath();
      const startIdx = Math.max(1, all.length - points.length);
      ctx.moveTo(
        all[startIdx - 1].x * canvas.width,
        all[startIdx - 1].y * canvas.height,
      );
      for (let i = startIdx; i < all.length; i++) {
        ctx.lineTo(all[i].x * canvas.width, all[i].y * canvas.height);
      }
      ctx.stroke();
    },
    onRemoteStrokeEnd: () => {
      if (!remoteStroke.current) return;
      const finished = remoteStroke.current;
      remoteStroke.current = null;
      setStrokes((prev) => [...prev, finished]);
    },
    onRemoteClear: () => {
      remoteStroke.current = null;
      setStrokes([]);
    },
    onSnapshotRequest: () => {
      if (isDrawer) canvasSync.sendSnapshot(strokesRef.current);
    },
    onSnapshot: (incoming) => {
      if (!isDrawer) setStrokes(incoming);
    },
  });

  const [strokes, setStrokes] = useState<Stroke[]>([]);

  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(COLORS[0]);
  const [width, setWidth] = useState(WIDTHS[1]);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  useEffect(() => {
    strokesRef.current = strokes;
  }, [strokes]);

  // Wipe the board when the turn (drawer) changes. DrawingCanvas isn't
  // remounted between turns, so the previous drawing must be cleared explicitly.
  const prevDrawer = useRef(gameState.current_drawer);
  useEffect(() => {
    if (prevDrawer.current !== gameState.current_drawer) {
      prevDrawer.current = gameState.current_drawer;
      currentStroke.current = null;
      remoteStroke.current = null;
      setStrokes([]);
    }
  }, [gameState.current_drawer]);

  function getNormalizedPoint(
    event: React.PointerEvent<HTMLCanvasElement>,
  ): Point {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    };
  }

  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const stroke of strokesRef.current) {
      drawStroke(ctx, stroke, canvas.width, canvas.height);
    }

    if (remoteStroke.current) {
      drawStroke(ctx, remoteStroke.current, canvas.width, canvas.height);
    }
  }, []);

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const point = getNormalizedPoint(event);
    const meta = {
      tool,
      color,
      width: tool === "eraser" ? ERASER_WIDTH : width,
    };
    currentStroke.current = { ...meta, points: [point] };
    canvasSync.startBroadcastStroke(meta);
    canvasSync.addBroadcastPoint(point);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const stroke = currentStroke.current;
    if (!stroke) return;
    const point = getNormalizedPoint(event);
    const prev = stroke.points[stroke.points.length - 1];
    stroke.points.push(point);

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    applyStrokeStyle(ctx, stroke);
    ctx.beginPath();
    ctx.moveTo(prev.x * canvas.width, prev.y * canvas.height);
    ctx.lineTo(point.x * canvas.width, point.y * canvas.height);
    ctx.stroke();

    canvasSync.addBroadcastPoint(point);
  }

  function handlePointerUp() {
    const stroke = currentStroke.current;
    if (!stroke) return;
    currentStroke.current = null;
    setStrokes((prev) => [...prev, stroke]);

    canvasSync.endBroadcastStroke();
  }

  function handleClearAll() {
    currentStroke.current = null;
    setStrokes([]);
    canvasSync.broadcastClear();
    setClearConfirmOpen(false);
  }

  useEffect(() => {
    redrawAll();
  }, [strokes, redrawAll]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      redrawAll();
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(parent);
    return () => observer.disconnect();
  }, [redrawAll]);

  useEffect(() => {
    if (channel && !isDrawer && gameState?.status === "playing") {
      canvasSync.requestSnapshot();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, isDrawer, gameState?.status]);

  return (
    <div className="flex flex-col gap-3 w-full max-w-2xl mx-auto">
      <div className="aspect-4/3 w-full rounded-lg overflow-hidden border">
        <canvas
          ref={canvasRef}
          className={`w-full h-full touch-none bg-white ${isDrawer ? "cursor-crosshair" : ""}`}
          onPointerDown={isDrawer ? handlePointerDown : undefined}
          onPointerMove={isDrawer ? handlePointerMove : undefined}
          onPointerUp={isDrawer ? handlePointerUp : undefined}
          onPointerLeave={isDrawer ? handlePointerUp : undefined}
        />
      </div>
      {isDrawer && (
        <div className="flex items-center gap-3 flex-wrap p-2 rounded-xl border bg-card">
          <div className="flex gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  setTool("pen");
                }}
                className={`h-7 w-7 rounded-full transition-all ${
                  color === c && tool === "pen"
                    ? "ring-2 ring-foreground ring-offset-2 ring-offset-card scale-105"
                    : "hover:scale-110"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="h-6 w-px bg-border" />

          <div className="flex gap-1">
            {WIDTHS.map((w) => (
              <button
                key={w}
                onClick={() => {
                  setWidth(w);
                  setTool("pen");
                }}
                className={`flex items-center justify-center h-9 w-9 rounded-lg transition-colors ${
                  width === w && tool === "pen"
                    ? "bg-primary/15 text-primary"
                    : "hover:bg-muted"
                }`}
              >
                <span
                  className="rounded-full bg-current"
                  style={{ width: w + 2, height: w + 2 }}
                />
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-border" />

          <div className="flex gap-1 ml-auto">
            <button
              onClick={() => setTool("eraser")}
              className={`flex items-center justify-center h-9 w-9 rounded-lg transition-colors ${
                tool === "eraser"
                  ? "bg-primary/15 text-primary"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              <Eraser className="h-4 w-4" />
            </button>
            <Popover
              open={clearConfirmOpen}
              onOpenChange={setClearConfirmOpen}
            >
              <PopoverTrigger asChild>
                <button className="flex items-center justify-center h-9 w-9 rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64">
                <p className="text-sm">
                  Clear the whole drawing? This can&apos;t be undone.
                </p>
                <div className="mt-3 flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setClearConfirmOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleClearAll}
                  >
                    Clear all
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}
    </div>
  );
}
