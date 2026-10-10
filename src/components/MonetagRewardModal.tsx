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

  // Démarrer la pub Monetag à l'ouverture
  useEffect(() => {
    if (!open) return;
    rewardedRef.current = false;
    setUnlocked(false);
    setSecondsLeft(AD_WATCH_SECONDS);

    const res = triggerRewardedMonetagAd(settings);
    setDirectLinkUrl(res.directLinkUrl);
  }, [open, sessionCount, settings]);

  // Compte à rebours de visionnage de l'annonce sponsorisée
  useEffect(() => {
    if (!open || unlocked) return;
    if (secondsLeft <= 0) {
      if (!rewardedRef.current) {
        rewardedRef.current = true;
        unlockOneDuelByAd();
        setUnlocked(true);
        toast.success("🎁 +1 Partie Duel Gratuite débloquée !");
      }
      return;
    }
    const timer = setTimeout(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [open, secondsLeft, unlocked]);

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
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Loader2 className="h-7 w-7 animate-spin" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-extrabold">
                  Annonce sponsorisée en cours… ({secondsLeft}s)
                </p>
                <p className="text-xs text-muted-foreground">
                  Patiente quelques secondes : ta partie Duel Gratuite se débloque automatiquement à
                  la fin du compte à rebours.
                </p>
              </div>

              {/* Barre de progression */}
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-grad-lime transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              {directLinkUrl && (
                <div className="overflow-hidden rounded-xl border border-border bg-muted">
                  <iframe
                    key={sessionCount}
                    src={directLinkUrl}
                    title="Annonce sponsorisée"
                    className="h-64 w-full"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
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
        {!unlocked ? (
          <Button disabled size="lg" className="w-full font-extrabold">
            <Loader2 className="h-4 w-4 animate-spin" /> Déblocage de la partie gratuite dans{" "}
            {secondsLeft}s…
          </Button>
        ) : (
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
