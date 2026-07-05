export function WordDisplay({
  isDrawer,
  word,
  wordLength,
}: {
  isDrawer: boolean;
  word?: string;
  wordLength?: number | null;
}) {
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
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">
          Guess the word
        </span>
        <span className="text-2xl font-bold tracking-[0.3em] text-foreground">
          {"_ ".repeat(wordLength).trim()}
        </span>
      </div>
    );
  }

  return null;
}
