import { createFileRoute } from "@tanstack/react-router";
import { getRoomBySlug, getMyMembership } from "@/services/rooms";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/rooms/$slug")({
  component: RouteComponent,
});

function RouteComponent() {
  const { slug } = Route.useParams();
  const { user } = useAuth() || {};

  const {
    data: room,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["room", slug],
    queryFn: () => getRoomBySlug(slug),
    staleTime: 1000 * 60 * 5,
  });

  const { data: membership } = useQuery({
    queryKey: ["membership", room?.id],
    queryFn: () => getMyMembership(room!.id),
    enabled: !!room,
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error fetching room</div>;
  if (!room) return <div>Room not found</div>;

  const isHost = user?.id === room.created_by;

  if (isHost) return <div>Host view: {room.slug}</div>;
  if (membership?.approved) return <div>Inside the room: {room.slug}</div>;
  if (membership) return <div>Waiting for approval...</div>;
  return <div>{/* visitante nuevo: botón para solicitar unirse */}</div>;
}
