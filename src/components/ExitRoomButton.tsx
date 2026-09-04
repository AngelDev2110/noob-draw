import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { leaveRoom } from "@/services/rooms";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

export function ExitRoomButton({ roomId }: { roomId: string | undefined }) {
  const navigate = useNavigate();
  const leaveMutation = useMutation({
    mutationFn: () => leaveRoom(roomId!),
  });

  function handleExit() {
    if (roomId) leaveMutation.mutate();
    navigate({ to: "/" });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground bg-card/95 hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Exit
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave this room?</AlertDialogTitle>
          <AlertDialogDescription>
            You&apos;ll lose your progress in the current game.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleExit}>Exit</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
