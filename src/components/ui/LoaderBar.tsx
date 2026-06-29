import { cn } from "@/lib/utils";

export function LoaderBar({
  isLoading,
  className,
}: {
  isLoading: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full h-0.5 bg-muted overflow-hidden rounded-full transition-opacity duration-200",
        isLoading ? "opacity-100" : "opacity-0",
        className,
      )}
    >
      <div className="h-full w-2/5 bg-primary rounded-full animate-loading" />
    </div>
  );
}
