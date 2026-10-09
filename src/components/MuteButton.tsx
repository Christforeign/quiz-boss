import { Volume2, VolumeX } from "lucide-react";
import { sfx, toggleMute, useMuted } from "@/lib/sound";

export function MuteButton() {
  const muted = useMuted();
  return (
    <button
      type="button"
      onClick={() => {
        toggleMute();
        setTimeout(() => sfx.click(), 20);
      }}
      title={muted ? "Activer les effets sonores" : "Couper le son"}
      aria-label={muted ? "Activer le son" : "Couper le son"}
      className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform active:scale-90 ${
        muted ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary"
      }`}
    >
      {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
    </button>
  );
}
