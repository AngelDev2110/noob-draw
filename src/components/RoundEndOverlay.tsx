import { Scoreboard } from "./Scoreboard";

export function RoundEndOverlay({
  word,
  secondsLeft,
  roomId,
  currentUserId,
  onlineUserIds,
}: {
  word: string | undefined;
  secondsLeft: number | null;
  roomId: string;
  currentUserId?: string;
  onlineUserIds?: Set<string>;
}) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-background/90 backdrop-blur-sm rounded-lg p-4">
      <span className="text-xs text-muted-foreground uppercase tracking-wide">
        The word was
      </span>
      <span className="text-4xl font-extrabold text-primary tracking-wide">
        {word?.toUpperCase() ?? "…"}
      </span>
      <span className="text-sm text-muted-foreground">
        Next round in {secondsLeft ?? "…"}s
      </span>
      <div className="mt-2 w-full max-w-xs">
        <Scoreboard
          roomId={roomId}
          currentUserId={currentUserId}
          onlineUserIds={onlineUserIds}
          variant="compact"
        />
      </div>
    </div>
  );
}
