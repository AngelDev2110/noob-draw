import { useEffect, useState } from "react";

export function useCountdown(
  turnStartedAt: string | null | undefined,
  durationSeconds: number,
  serverOffset: number = 0,
) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!turnStartedAt) return;

    function tick() {
      const elapsed =
        (Date.now() + serverOffset - new Date(turnStartedAt!).getTime()) / 1000;
      setSecondsLeft(Math.max(0, Math.ceil(durationSeconds - elapsed)));
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [turnStartedAt, durationSeconds, serverOffset]);

  return turnStartedAt ? secondsLeft : null;
}
