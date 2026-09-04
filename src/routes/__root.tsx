import { Outlet, createRootRoute } from "@tanstack/react-router";
import { AuthProvider } from "@/context/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeToggle } from "@/components/ThemeToggle";

const queryClient = new QueryClient();

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <main className="relative flex items-center justify-center min-h-screen bg-radial from-background to-primary/30 p-4">
          <div className="fixed top-4 left-4 z-50">
            <ThemeToggle />
          </div>
          <Outlet />
        </main>
      </AuthProvider>
    </QueryClientProvider>
  );
}
