import { useEffect, useState } from "react";
import { getServerTime } from "@/services/game";

export function useServerClock() {
  const [serverOffset, setServerOffset] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    getServerTime().then(setServerOffset);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return { serverOffset, now };
}
