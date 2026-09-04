import { Settings, Volume2, VolumeX, Music, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { useSoundSettings } from "@/context/SoundSettingsContext";

export function SoundSettingsButton() {
  const settings = useSoundSettings();
  if (!settings) return null;
  const {
    soundEnabled,
    musicEnabled,
    musicVolume,
    toggleSound,
    toggleMusic,
    setMusicVolume,
  } = settings;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="bg-card/95 text-muted-foreground hover:text-foreground"
          aria-label="Sound settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56">
        <p className="text-sm font-medium mb-3">Sound settings</p>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">
              Sound effects
            </span>
            <Button
              size="icon-sm"
              variant={soundEnabled ? "default" : "outline"}
              onClick={toggleSound}
              aria-pressed={soundEnabled}
              aria-label={
                soundEnabled ? "Disable sound effects" : "Enable sound effects"
              }
            >
              {soundEnabled ? (
                <Volume2 className="h-3.5 w-3.5" />
              ) : (
                <VolumeX className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Music</span>
              <Button
                size="icon-sm"
                variant={musicEnabled ? "default" : "outline"}
                onClick={toggleMusic}
                aria-pressed={musicEnabled}
                aria-label={musicEnabled ? "Disable music" : "Enable music"}
              >
                {musicEnabled ? (
                  <Music className="h-3.5 w-3.5" />
                ) : (
                  <Music2 className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={[musicVolume]}
              disabled={!musicEnabled}
              onValueChange={([v]) => setMusicVolume(v)}
              aria-label="Music volume"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
