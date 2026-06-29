import { Outlet, createRootRoute } from "@tanstack/react-router";
import { AuthProvider } from "@/context/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <main className="flex items-center justify-center min-h-screen bg-radial from-background to-primary/30 p-4">
          <Outlet />
        </main>
      </AuthProvider>
    </QueryClientProvider>
  );
}
