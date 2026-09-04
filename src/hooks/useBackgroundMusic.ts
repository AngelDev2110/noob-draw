import { useEffect, useRef } from "react";
import { useSoundSettings } from "@/context/SoundSettingsContext";
import { playMusic, pauseMusic, setMusicVolume } from "@/lib/music";

export function useBackgroundMusic() {
  const settings = useSoundSettings();
  const musicEnabled = settings?.musicEnabled ?? true;
  const musicVolume = settings?.musicVolume ?? 0.5;

  const volumeRef = useRef(musicVolume);
  useEffect(() => {
    volumeRef.current = musicVolume;
  }, [musicVolume]);

  useEffect(() => {
    if (!musicEnabled) {
      pauseMusic();
      return;
    }

    playMusic(volumeRef.current);

    // Browsers block audio autoplay until the page has had a user
    // gesture — retry once that happens.
    function retry() {
      playMusic(volumeRef.current);
    }
    document.addEventListener("click", retry, { once: true });
    document.addEventListener("keydown", retry, { once: true });
    return () => {
      document.removeEventListener("click", retry);
      document.removeEventListener("keydown", retry);
    };
  }, [musicEnabled]);

  useEffect(() => {
    setMusicVolume(musicVolume);
  }, [musicVolume]);
}
