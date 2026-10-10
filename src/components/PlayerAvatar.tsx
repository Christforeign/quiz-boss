import { useRef, useState } from "react";
import { Camera, Check, Sparkles, Trash2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { levelFromXp, updatePlayer, usePlayer, useSession } from "@/lib/player";
import { PRESET_AVATARS, registerPlayerInDirectory, uploadProfilePhoto } from "@/lib/site";
import { sfx } from "@/lib/sound";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const GRADS = ["bg-grad-lime", "bg-grad-sunset", "bg-grad-ocean", "bg-grad-candy"];

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function PlayerAvatar({
  name,
  avatarUrl,
  size = "md",
  online,
  className = "",
}: {
  name?: string;
  avatarUrl?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  online?: boolean;
  className?: string;
}) {
  const cleanName = (name || "Joueur").trim();
  const initials = cleanName.slice(0, 2).toUpperCase();
  const grad = GRADS[hashCode(cleanName) % GRADS.length];

  const dims = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-lg",
    xl: "h-20 w-20 text-2xl",
  }[size];

  const dotDims = {
    xs: "h-2 w-2 -bottom-0.5 -right-0.5",
    sm: "h-2.5 w-2.5 -bottom-0.5 -right-0.5",
    md: "h-3 w-3 bottom-0 right-0",
    lg: "h-3.5 w-3.5 bottom-0 right-0",
    xl: "h-4 w-4 bottom-0.5 right-0.5",
  }[size];

  return (
    <div className={`relative inline-flex shrink-0 select-none ${dims} ${className}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={cleanName}
          className="h-full w-full rounded-full border border-primary/40 object-cover shadow-sm"
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center rounded-full border border-white/20 font-extrabold text-secondary-foreground shadow-sm ${grad}`}
        >
          {initials}
        </div>
      )}
      {online !== undefined && (
        <span
          title={online ? "En ligne" : "Hors ligne"}
          className={`absolute rounded-full ring-2 ring-card ${dotDims} ${
            online ? "bg-success" : "bg-muted-foreground/50"
          }`}
        />
      )}
    </div>
  );
}

export function PlayerProfileEditor({
  onSaved,
  compact = false,
}: {
  onSaved?: (newName: string, newAvatar?: string) => void;
  compact?: boolean;
}) {
  const p = usePlayer();
  const session = useSession();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const defaultDisplay = p.name?.trim() || `Joueur_${p.id.slice(0, 4)}`;
  const [nameInput, setNameInput] = useState(p.name || "");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(p.avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const previewName = nameInput.trim() || defaultDisplay;
  const lvl = levelFromXp(p.xp);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      return void toast.error("Sélectionne une image (JPG, PNG, WebP…)");
    }
    setUploading(true);
    try {
      const dataUrl = await uploadProfilePhoto(file);
      setAvatarUrl(dataUrl);
      sfx.click();
      toast.success("Photo prête ! Clique sur Enregistrer pour publier ton profil.");
    } catch {
      toast.error("Impossible de charger cette photo.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSaveProfile = async () => {
    const clean = nameInput.trim().slice(0, 24) || defaultDisplay;
    if (clean.length < 2) {
      return void toast.error("Ton nom doit contenir au moins 2 caractères.");
    }
    setSaving(true);
    sfx.coin();

    updatePlayer(() => ({
      name: clean,
      avatarUrl: avatarUrl || undefined,
    }));

    if (session) {
      try {
        await supabase.auth.updateUser({
          data: {
            display_name: clean,
            avatar_url: avatarUrl || null,
          },
        });
      } catch {
        // ignore
      }
    }

    await registerPlayerInDirectory({
      id: p.id,
      pseudo: clean,
      level: lvl,
      avatarUrl: avatarUrl || undefined,
    });

    try {
      const ch = supabase.channel("quizboss-duel-lobby");
      ch.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          ch.send({
            type: "broadcast",
            event: "room-updated",
            payload: { ts: Date.now() },
          }).finally(() => {
            setTimeout(() => supabase.removeChannel(ch), 600);
          });
        }
      });
    } catch {
      // ignore
    }

    setSaving(false);
    toast.success(
      `✅ Profil mis à jour : "${clean}" apparaît maintenant dans Joueurs disponibles !`,
    );
    onSaved?.(clean, avatarUrl);
  };

  return (
    <div className="space-y-3 rounded-2xl border border-primary/30 bg-background/60 p-3.5">
      {/* Aperçu en direct tel qu'il apparaît dans Joueurs disponibles */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <PlayerAvatar name={previewName} avatarUrl={avatarUrl} size="md" online={true} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <b className="truncate text-sm">{previewName}</b>
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                Niv. {lvl}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              <UserCheck className="mr-1 inline h-3 w-3 text-success" />
              Aperçu en direct dans « Joueurs disponibles »
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="h-8 text-xs font-bold"
          >
            <Camera className="h-3.5 w-3.5 text-primary" />
            {uploading ? "Chargement…" : "Photo"}
          </Button>
          {avatarUrl && (
            <button
              type="button"
              onClick={() => setAvatarUrl(undefined)}
              title="Supprimer la photo"
              className="rounded-lg bg-destructive/15 p-1.5 text-destructive hover:bg-destructive/25"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Champ de modification du nom affiché */}
      <div className="space-y-1">
        <label className="text-xs font-extrabold text-foreground">
          ✏️ Comment ton nom apparaît dans « Joueurs disponibles » :
        </label>
        <div className="flex gap-2">
          <Input
            placeholder="Ton nom / pseudo public (ex: BossHaiti, King509…)"
            value={nameInput}
            maxLength={24}
            onChange={(e) => setNameInput(e.target.value)}
          />
          <Button
            type="button"
            disabled={saving}
            onClick={handleSaveProfile}
            className="shrink-0 font-extrabold"
          >
            <Check className="h-4 w-4" />
            {saving ? "…" : "Enregistrer"}
          </Button>
        </div>
      </div>

      {/* Avatars rapides au choix ou photo perso */}
      {!compact && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1 font-bold">
              <Sparkles className="h-3 w-3 text-accent" /> Ou choisis un avatar rapide :
            </span>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="font-bold text-primary hover:underline"
            >
              + Importer ma propre photo
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_AVATARS.map((av) => {
              const active = avatarUrl === av.url;
              return (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => {
                    sfx.click();
                    setAvatarUrl(av.url);
                  }}
                  title={av.label}
                  className={`flex items-center gap-1.5 rounded-full border p-1 pr-2.5 text-[11px] font-bold transition-all ${
                    active
                      ? "border-primary bg-primary/20 text-primary scale-105"
                      : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  <img src={av.url} alt={av.label} className="h-6 w-6 rounded-full object-cover" />
                  {av.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
