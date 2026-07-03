import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function RoomErrorContent() {
  return (
    <CardContent>
      <p>
        We couldn't fetch the room data 😢, maybe{" "}
        <span className="font-bold">reloading the page</span> will solve our
        problems!!{" "}
        <span className="text-xs text-muted-foreground">(We hope so)</span>
      </p>

      <Button
        className="mt-3 w-full"
        onClick={() => window.location.reload()}
      >
        Reload
      </Button>
    </CardContent>
  );
}
