import { createContext, useContext, useState } from "react";

const STORAGE_KEY = "soundSettings";

type Settings = {
  soundEnabled: boolean;
  musicEnabled: boolean;
  musicVolume: number;
};

const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  musicEnabled: true,
  musicVolume: 0.5,
};

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: Settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore (private browsing / storage disabled)
  }
}

const SoundSettingsContext = createContext<
  | (Settings & {
      toggleSound: () => void;
      toggleMusic: () => void;
      setMusicVolume: (volume: number) => void;
    })
  | null
>(null);

export function SoundSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  function toggleSound() {
    setSettings((prev) => {
      const next = { ...prev, soundEnabled: !prev.soundEnabled };
      saveSettings(next);
      return next;
    });
  }

  function toggleMusic() {
    setSettings((prev) => {
      const next = { ...prev, musicEnabled: !prev.musicEnabled };
      saveSettings(next);
      return next;
    });
  }

  function setMusicVolume(volume: number) {
    setSettings((prev) => {
      const next = { ...prev, musicVolume: volume };
      saveSettings(next);
      return next;
    });
  }

  return (
    <SoundSettingsContext.Provider
      value={{ ...settings, toggleSound, toggleMusic, setMusicVolume }}
    >
      {children}
    </SoundSettingsContext.Provider>
  );
}

export const useSoundSettings = () => useContext(SoundSettingsContext);
