import { Outlet, createRootRoute } from "@tanstack/react-router";
import { AuthProvider } from "@/context/AuthContext";
import { SoundSettingsProvider } from "@/context/SoundSettingsContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SoundSettingsButton } from "@/components/SoundSettingsButton";
import { GlobalSoundEffects } from "@/components/GlobalSoundEffects";

const queryClient = new QueryClient();

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SoundSettingsProvider>
          <GlobalSoundEffects />
          <main className="relative flex items-center justify-center min-h-screen bg-radial from-background to-primary/30 p-4">
            <div className="fixed top-4 left-4 z-50 flex gap-2">
              <ThemeToggle />
              <SoundSettingsButton />
            </div>
            <Outlet />
          </main>
        </SoundSettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
