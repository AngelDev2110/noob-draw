import { useEffect, useState, useRef } from "react";
import confetti from "canvas-confetti";

type Announcement = {
  id: string;
  displayName: string;
  points: number;
  drawerPoints: number;
};

export function CorrectGuessOverlay({
  announcement,
}: {
  announcement: Announcement | null;
}) {
  const [visible, setVisible] = useState(false);
  const lastId = useRef<string | null>(null);

  useEffect(() => {
    if (!announcement || announcement.id === lastId.current) return;
    lastId.current = announcement.id;

    setVisible(true);
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 },
      zIndex: 100,
    });

    const timer = setTimeout(() => setVisible(false), 1800);
    return () => clearTimeout(timer);
  }, [announcement]);

  if (!announcement) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`flex flex-col items-center gap-2 transition-all duration-300 ${
          visible ? "scale-100" : "scale-90"
        }`}
      >
        <span className="text-5xl font-extrabold text-primary drop-shadow-lg">
          {announcement.displayName} got it! 🎉
        </span>
        <span className="text-2xl font-bold text-foreground bg-card/90 px-4 py-1 rounded-full">
          +{announcement.points} points
        </span>
        {announcement.drawerPoints > 0 && (
          <span className="text-sm font-semibold text-muted-foreground bg-card/70 px-3 py-0.5 rounded-full">
            🎨 Drawer +{announcement.drawerPoints} points
          </span>
        )}
      </div>
    </div>
  );
}
