export function RoundEndOverlay({
  word,
  secondsLeft,
}: {
  word: string | undefined;
  secondsLeft: number | null;
}) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-background/90 backdrop-blur-sm rounded-lg">
      <span className="text-xs text-muted-foreground uppercase tracking-wide">
        The word was
      </span>
      <span className="text-4xl font-extrabold text-primary tracking-wide">
        {word?.toUpperCase() ?? "…"}
      </span>
      <span className="text-sm text-muted-foreground">
        Next round in {secondsLeft ?? "…"}s
      </span>
    </div>
  );
}
