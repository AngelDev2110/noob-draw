import { useInterfaceClickSound } from "@/hooks/useInterfaceClickSound";
import { useBackgroundMusic } from "@/hooks/useBackgroundMusic";

export function GlobalSoundEffects() {
  useInterfaceClickSound();
  useBackgroundMusic();
  return null;
}
