const soundUrls = {
  interface: "/sounds/interface.wav",
  success: "/sounds/success.wav",
  timer: "/sounds/timer.wav",
} as const;

export type SoundName = keyof typeof soundUrls;

const audioCache = new Map<SoundName, HTMLAudioElement>();

function getAudio(name: SoundName): HTMLAudioElement {
  let audio = audioCache.get(name);
  if (!audio) {
    audio = new Audio(soundUrls[name]);
    audio.preload = "auto";
    audioCache.set(name, audio);
  }
  return audio;
}

export function preloadSound(name: SoundName) {
  getAudio(name);
}

export function getSoundDuration(name: SoundName): number | null {
  const audio = audioCache.get(name);
  if (!audio || !Number.isFinite(audio.duration)) return null;
  return audio.duration;
}

export function playSound(name: SoundName) {
  const audio = getAudio(name);
  audio.currentTime = 0;
  void audio.play().catch(() => {
    // Autoplay can be blocked before the user has interacted with the
    // page at all — safe to ignore.
  });
}

export function stopSound(name: SoundName) {
  const audio = audioCache.get(name);
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}
