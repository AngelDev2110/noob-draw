const MUSIC_URL = "/sounds/background.mp3";

let musicAudio: HTMLAudioElement | null = null;

function getMusicAudio(): HTMLAudioElement {
  if (!musicAudio) {
    musicAudio = new Audio(MUSIC_URL);
    musicAudio.loop = true;
  }
  return musicAudio;
}

export function playMusic(volume: number) {
  const audio = getMusicAudio();
  audio.volume = volume;
  void audio.play().catch(() => {
    // Autoplay is blocked until the page has had a user gesture — the
    // caller retries this once that happens.
  });
}

export function pauseMusic() {
  musicAudio?.pause();
}

export function setMusicVolume(volume: number) {
  if (musicAudio) musicAudio.volume = volume;
}
