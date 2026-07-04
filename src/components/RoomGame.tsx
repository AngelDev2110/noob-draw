import { useRef, useState, useEffect, useCallback } from "react";
import { Eraser, Trash2 } from "lucide-react";

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

export function RoomGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentStroke = useRef<Stroke | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);

  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(COLORS[0]);
  const [width, setWidth] = useState(WIDTHS[1]);

  useEffect(() => {
    strokesRef.current = strokes;
  }, [strokes]);

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
  }, []);

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const point = getNormalizedPoint(event);
    currentStroke.current = {
      tool,
      color,
      width: tool === "eraser" ? ERASER_WIDTH : width,
      points: [point],
    };
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
  }

  function handlePointerUp() {
    const stroke = currentStroke.current;
    if (!stroke) return;
    currentStroke.current = null;
    setStrokes((prev) => [...prev, stroke]);
  }

  function handleClearAll() {
    currentStroke.current = null;
    setStrokes([]);
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

  return (
    <div className="flex flex-col gap-3 w-full max-w-2xl mx-auto">
      <div className="aspect-4/3 w-full rounded-lg overflow-hidden border">
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none bg-white cursor-crosshair"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>

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
          <button
            onClick={handleClearAll}
            className="flex items-center justify-center h-9 w-9 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
