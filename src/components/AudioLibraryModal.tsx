import { useState, useEffect } from "react";
import { Music, Plus, Play, Pause, Trash2, Upload, Check, Disc3, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getAvailableTracks,
  getCurrentTrack,
  reloadCustomTracks,
  selectTrackById,
  toggleSiteMusic,
  useCurrentSiteTrack,
  useSiteMusicPlaying,
} from "@/lib/sound";
import {
  saveTrackToLibrary,
  removeTrackFromLibrary,
  getCustomStoredTracks,
  type StoredTrack,
} from "@/lib/audioLibrary";

export function AudioLibraryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const currentTrack = useCurrentSiteTrack();
  const isPlaying = useSiteMusicPlaying();
  const [customList, setCustomList] = useState<StoredTrack[]>([]);
  const [addingNew, setAddingNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newArtist, setNewArtist] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const refreshList = async () => {
    const list = await getCustomStoredTracks();
    setCustomList(list);
  };

  useEffect(() => {
    if (open) {
      refreshList();
    }
  }, [open]);

  const allTracks = getAvailableTracks();

  async function handleAddSong() {
    if (!newTitle.trim()) {
      return void toast.error("Veuillez donner un titre à la musique.");
    }
    if (!selectedFile && !newUrl.trim()) {
      return void toast.error("Sélectionnez un fichier audio ou collez un lien audio MP3.");
    }

    setIsSaving(true);
    try {
      const saved = await saveTrackToLibrary({
        title: newTitle.trim(),
        artist: newArtist.trim() || "Musique personnelle",
        file: selectedFile || undefined,
        url: newUrl.trim() || undefined,
      });

      await reloadCustomTracks();
      await refreshList();
      selectTrackById(saved.id);

      toast.success(`🎵 "${saved.title}" ajoutée à ta bibliothèque et activée !`);
      setAddingNew(false);
      setNewTitle("");
      setNewArtist("");
      setNewUrl("");
      setSelectedFile(null);
    } catch (err) {
      toast.error((err as Error).message || "Erreur lors de l'ajout");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteSong(id: string, title: string) {
    try {
      await removeTrackFromLibrary(id);
      await reloadCustomTracks();
      await refreshList();
      toast.success(`"${title}" retirée de la bibliothèque`);
    } catch {
      toast.error("Impossible de supprimer la musique");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto p-5 rounded-3xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Disc3 className="h-5 w-5 animate-spin" />
            <DialogTitle className="text-lg font-extrabold">Bibliothèque Musicale</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Choisis la chanson de fond du site ou ajoute tes propres musiques préférées sans limite
            d'espace.
          </DialogDescription>
        </DialogHeader>

        {/* Formulaire d'ajout rapide d'une musique */}
        {addingNew ? (
          <div className="space-y-3 rounded-2xl border border-primary/40 bg-card p-4 animate-pop">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-primary flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Ajouter une chanson à ma bibliothèque
              </span>
              <button
                type="button"
                onClick={() => setAddingNew(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Annuler
              </button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Titre de la chanson</Label>
              <Input
                placeholder="Ex: Mon Morceau Favori"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Artiste / Crédits (optionnel)</Label>
              <Input
                placeholder="Ex: Artiste préféré"
                value={newArtist}
                onChange={(e) => setNewArtist(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <Upload className="h-3.5 w-3.5 text-primary" /> Fichier audio (MP3, M4A, WAV, OGG)
              </Label>
              <Input
                type="file"
                accept="audio/*,.mp3,.m4a,.wav,.ogg"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setSelectedFile(f);
                    if (!newTitle) {
                      setNewTitle(f.name.replace(/\.[^.]+$/, ""));
                    }
                  }
                }}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Ou lien direct audio (URL .mp3)</Label>
              <Input
                placeholder="https://.../audio.mp3"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <Button
              className="w-full font-extrabold text-xs"
              disabled={isSaving}
              onClick={handleAddSong}
            >
              {isSaving ? "Enregistrement…" : "Enregistrer dans ma bibliothèque"}
            </Button>
          </div>
        ) : (
          <Button
            variant="secondary"
            className="w-full font-extrabold text-xs border border-dashed border-primary/50"
            onClick={() => setAddingNew(true)}
          >
            <Plus className="h-3.5 w-3.5" /> + Ajouter une musique à ma bibliothèque
          </Button>
        )}

        {/* Liste des musiques disponibles (5 intégrées + musiques de l'utilisateur) */}
        <div className="space-y-2 mt-2">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
            Morceaux disponibles ({allTracks.length})
          </p>

          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {allTracks.map((t) => {
              const isSelected = currentTrack.id === t.id;
              const isCustom = customList.some((c) => c.id === t.id);

              return (
                <div
                  key={t.id}
                  className={`flex items-center justify-between rounded-2xl border p-3 text-xs transition-all ${
                    isSelected
                      ? "border-primary bg-primary/15 shadow-sm"
                      : "border-border bg-card/60 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          toggleSiteMusic();
                        } else {
                          selectTrackById(t.id);
                        }
                      }}
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-transform active:scale-95 ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                      title={isSelected && isPlaying ? "Pause" : "Jouer"}
                    >
                      {isSelected && isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </button>
                    <div className="min-w-0 truncate">
                      <div className="flex items-center gap-1.5">
                        <b className="truncate text-foreground">{t.title}</b>
                        {isSelected && (
                          <span className="rounded-full bg-primary/20 px-1.5 py-0.2 text-[9px] font-extrabold text-primary shrink-0">
                            En cours
                          </span>
                        )}
                      </div>
                      <p className="truncate text-[10px] text-muted-foreground mt-0.5">
                        {t.credit}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {!isSelected && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => selectTrackById(t.id)}
                        className="h-7 px-2 text-[11px] font-bold"
                      >
                        Activer
                      </Button>
                    )}
                    {isCustom && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSong(t.id, t.title)}
                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-lg"
                        title="Supprimer ce morceau"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
