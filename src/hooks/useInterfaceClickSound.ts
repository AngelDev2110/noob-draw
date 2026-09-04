import { useEffect } from "react";
import { useSoundSettings } from "@/context/SoundSettingsContext";
import { playSound } from "@/lib/sounds";

const INTERACTIVE_SELECTOR = 'button, [role="button"], a[href]';

export function useInterfaceClickSound() {
  const { soundEnabled } = useSoundSettings() || {};

  useEffect(() => {
    if (!soundEnabled) return;

    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest(INTERACTIVE_SELECTOR)) {
        playSound("interface");
      }
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [soundEnabled]);
}
