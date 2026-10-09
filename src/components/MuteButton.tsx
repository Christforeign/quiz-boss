import { Volume2, VolumeX } from "lucide-react";
import { toggleMute, useMuted } from "@/lib/sound";

export function MuteButton() {
  const muted = useMuted();
  return (
    <button
      type="button"
      onClick={toggleMute}
      aria-label={muted ? "Activer le son" : "Couper le son"}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground transition-transform active:scale-90"
    >
      {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
    </button>
  );
}
