import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ExternalLink, Film, Gift, Loader2, Play, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { unlockOneDuelByAd } from "@/lib/player";
import { triggerRewardedMonetagAd, useSettings } from "@/lib/site";
import { sfx } from "@/lib/sound";
import { AdSlot } from "@/components/Ads";
import { Button } from "@/components/ui/button";

const AD_WATCH_SECONDS = 7;

export function MonetagRewardModal({
  open,
  onClose,
  onUnlocked,
  actionLabel,
}: {
  open: boolean;
  onClose: () => void;
  /** Appelé une fois la pub regardée et la partie gratuite débloquée */
  onUnlocked?: () => void;
  /** Texte du bouton principal après déblocage (ex: "Lancer mon Duel Gratuit") */
  actionLabel?: string;
}) {
  const { data: settings } = useSettings();
  const [secondsLeft, setSecondsLeft] = useState(AD_WATCH_SECONDS);
  const [unlocked, setUnlocked] = useState(false);
  const [directLinkUrl, setDirectLinkUrl] = useState<string | undefined>(undefined);
  const [sessionCount, setSessionCount] = useState(0);
  const rewardedRef = useRef(false);

  const clickedAtRef = useRef<number | null>(null);
  const [waitingReturn, setWaitingReturn] = useState(false);

  useEffect(() => {
    if (!open) return;
    rewardedRef.current = false;
    clickedAtRef.current = null;
    setWaitingReturn(false);
    setUnlocked(false);
    setSecondsLeft(AD_WATCH_SECONDS);
    setDirectLinkUrl(triggerRewardedMonetagAd(settings).directLinkUrl);
  }, [open, sessionCount, settings]);

  // Détecte le retour du joueur sur le site après avoir ouvert la pub
  useEffect(() => {
    if (!open) return;
    const check = () => {
      if (document.visibilityState !== "visible" || clickedAtRef.current == null) return;
      if (Date.now() - clickedAtRef.current >= 3000) handleInstantUnlockViaLink();
    };
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => {
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
    };
  });

  // Filet de sécurité : déblocage après le compte à rebours une fois le lien cliqué
  useEffect(() => {
    if (!open || unlocked || !waitingReturn) return;
    if (secondsLeft <= 0) return handleInstantUnlockViaLink();
    const t = setTimeout(() => setSecondsLeft((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [open, secondsLeft, unlocked, waitingReturn]);

  if (!open) return null;

  const progressPct = Math.min(
    100,
    Math.round(((AD_WATCH_SECONDS - secondsLeft) / AD_WATCH_SECONDS) * 100),
  );

  function handleInstantUnlockViaLink() {
    if (!rewardedRef.current) {
      rewardedRef.current = true;
      unlockOneDuelByAd();
      setUnlocked(true);
      setSecondsLeft(0);
      toast.success("🎁 +1 Partie Duel Gratuite débloquée !");
    }
  }

  function handleConfirmContinue() {
    sfx.click();
    if (onUnlocked) {
      onUnlocked();
    } else {
      onClose();
    }
  }

  function handleWatchAnotherAd() {
    sfx.click();
    setSessionCount((c) => c + 1);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-pop">
      <div className="relative w-full max-w-md space-y-4 rounded-3xl border-2 border-primary bg-card p-5 shadow-2xl">
        {/* En-tête */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-grad-candy text-secondary-foreground shadow-glow">
              <Film className="h-6 w-6" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-primary">
                <Sparkles className="h-3 w-3" /> Accès Sponsorisé · Duel Gratuit
              </span>
              <h3 className="mt-0.5 text-lg font-extrabold leading-tight">
                {unlocked
                  ? "🎉 Partie Duel Gratuite Débloquée !"
                  : "🎬 Déblocage de ta Partie Gratuite"}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-full bg-muted p-1.5 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Zone d'affichage de l'annonce sponsorisée */}
        <div className="space-y-3 rounded-2xl border border-border bg-background/70 p-4">
          {!unlocked ? (
            <div className="space-y-3 text-center">
              <p className="text-sm font-extrabold">
                {waitingReturn
                  ? "Reviens ici après la pub : ta partie se débloque automatiquement ✅"
                  : "Touche le bouton, regarde la pub puis reviens sur QuizBoss."}
              </p>
              <a
                href={directLinkUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                onClick={() => {
                  sfx.click();
                  clickedAtRef.current = Date.now();
                  setWaitingReturn(true);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-grad-lime py-4 text-base font-extrabold text-primary-foreground shadow-glow active:scale-95"
              >
                <ExternalLink className="h-5 w-5" /> 🎬 Regarder la pub & débloquer
              </a>
              {waitingReturn && (
                <p className="text-xs text-muted-foreground">
                  Déblocage automatique dans {secondsLeft}s…
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2 py-2 text-center animate-pop">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/20 text-success">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <p className="text-base font-extrabold text-success">
                +1 Partie Duel Gratuite ajoutée à ton compte !
              </p>
              <p className="text-xs text-muted-foreground">
                Ta partie gratuite est prête. Tu peux lancer ton Duel dès maintenant ou débloquer
                une partie supplémentaire !
              </p>
            </div>
          )}

          {/* Emplacement bannière / flyer sponsorisé */}
          <AdSlot slot="duel-bottom" />
        </div>

        {/* Boutons d'action */}
        {!unlocked ? null        ) : (
          <div className="space-y-2">
            <Button
              size="lg"
              onClick={handleConfirmContinue}
              className="w-full bg-success text-base font-extrabold text-primary-foreground shadow-glow hover:bg-success/90"
            >
              <Play className="h-5 w-5" />
              {actionLabel || "🎁 Utiliser ma Partie Duel Gratuite maintenant"}
            </Button>

            <button
              type="button"
              onClick={handleWatchAnotherAd}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 py-2 text-xs font-extrabold text-primary hover:bg-primary/20"
            >
              <Gift className="h-3.5 w-3.5" /> Débloquer +1 Duel Gratuit supplémentaire
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
