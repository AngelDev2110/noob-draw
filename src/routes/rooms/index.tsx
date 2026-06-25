import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/rooms/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Please select a room!</div>;
}
