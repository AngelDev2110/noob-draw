export function WordDisplay({
  isDrawer,
  word,
  wordLength,
  revealedLetters,
  revealedWord,
}: {
  isDrawer: boolean;
  word?: string;
  wordLength?: number | null;
  revealedLetters?: Map<number, string>;
  revealedWord?: string | null;
}) {
  function buildMask(length: number, revealed?: Map<number, string>): string {
    return Array.from({ length }, (_, i) => revealed?.get(i) ?? "_").join(" ");
  }

  if (isDrawer && word) {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">
          Draw this:
        </span>
        <span className="text-2xl font-bold tracking-[0.3em] text-primary">
          {word.toUpperCase()}
        </span>
      </div>
    );
  }

  if (!isDrawer && wordLength) {
    if (revealedWord) {
      return (
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            You got it!
          </span>
          <span className="text-2xl font-bold tracking-[0.3em] text-primary">
            {revealedWord.toUpperCase()}
          </span>
        </div>
      );
    }

    const mask = buildMask(wordLength, revealedLetters);
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">
          Guess the word
        </span>
        <span className="text-2xl font-bold tracking-[0.3em] text-foreground">
          {mask.toUpperCase()}
        </span>
      </div>
    );
  }

  return null;
}
