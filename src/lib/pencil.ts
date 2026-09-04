const PENCIL_URL = "/sounds/pencil.mp3";

let pencilAudio: HTMLAudioElement | null = null;

function getPencilAudio(): HTMLAudioElement {
  if (!pencilAudio) {
    pencilAudio = new Audio(PENCIL_URL);
    pencilAudio.loop = true;
  }
  return pencilAudio;
}

/** Idempotent — safe to call repeatedly while a stroke is in progress. */
export function playPencilLoop() {
  const audio = getPencilAudio();
  if (audio.paused) {
    void audio.play().catch(() => {
      // Autoplay can be blocked before the user has interacted with the
      // page at all — safe to ignore.
    });
  }
}

export function stopPencilLoop() {
  if (!pencilAudio) return;
  pencilAudio.pause();
  pencilAudio.currentTime = 0;
}
