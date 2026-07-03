import { createFileRoute } from "@tanstack/react-router";
import { RoomView } from "@/components/RoomView";

export const Route = createFileRoute("/rooms/$slug")({
  component: RoomView,
});
