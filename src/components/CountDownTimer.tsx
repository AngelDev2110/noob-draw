export function CountdownTimer({
  secondsLeft,
}: {
  secondsLeft: number | null;
}) {
  if (secondsLeft === null) return null;

  const isUrgent = secondsLeft <= 15;

  return (
    <div
      className={`flex items-center justify-center h-10 w-10 rounded-full font-bold text-sm border-2 transition-colors ${
        isUrgent
          ? "border-destructive text-destructive bg-destructive/10 animate-pulse"
          : "border-primary text-primary bg-primary/10"
      }`}
    >
      {secondsLeft}
    </div>
  );
}
