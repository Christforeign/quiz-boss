import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Copy, Gift, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { addCoins, REFERRAL_BONUS, updatePlayer, usePlayer } from "@/lib/player";
import { shareWhatsApp } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useHydrated } from "@tanstack/react-router";

export const Route = createFileRoute("/invite")({
  head: () => ({
    meta: [
      { title: "Invite tes amis — QuizBoss" },
      { name: "description", content: `Partage ton lien personnel et gagne ${REFERRAL_BONUS} pièces par ami invité.` },
      { property: "og:title", content: "Rejoins-moi sur QuizBoss !" },
      { property: "og:description", content: "Quiz, pièces et récompenses — viens jouer avec moi." },
    ],
  }),
  component: Invite,
});

function Invite() {
  const p = usePlayer();
  const hydrated = useHydrated();
  const link = hydrated && p.id ? `${window.location.origin}/?ref=${p.id}` : "";
  const { data: count = 0 } = useQuery({
    queryKey: ["referrals", p.id],
    enabled: !!p.id,
    queryFn: async () => {
      const { count } = await supabase.from("referrals").select("*", { count: "exact", head: true }).eq("referrer_id", p.id);
      return count ?? 0;
    },
  });
  const pending = Math.max(0, count - p.referralClaimed);
  const text = `🎮 Viens jouer à QuizBoss avec moi ! Quiz musique, géo, cinéma… et gagne des pièces 🪙\nTon bonus de bienvenue : ${REFERRAL_BONUS} pièces 👉 ${link}`;

  return (
    <div className="space-y-5 pb-6">
      <div className="rounded-3xl bg-grad-candy p-6 text-secondary-foreground animate-pop">
        <Gift className="h-10 w-10" />
        <h1 className="mt-2 text-3xl font-extrabold">Invite & gagne</h1>
        <p className="font-semibold">+{REFERRAL_BONUS} pièces pour toi et ton ami à chaque inscription.</p>
      </div>
      <div className="rounded-2xl bg-card p-4">
        <p className="mb-2 text-sm font-semibold text-muted-foreground">Ton lien personnel</p>
        <div className="flex gap-2">
          <code className="flex-1 truncate rounded-lg bg-muted px-3 py-2 text-sm">{link || "…"}</code>
          <Button size="icon" variant="secondary" onClick={() => { navigator.clipboard.writeText(link); toast.success("Lien copié"); }}><Copy /></Button>
        </div>
        <Button size="lg" className="mt-3 w-full bg-success text-primary-foreground hover:bg-success/90" onClick={() => shareWhatsApp(text)}>
          <Share2 /> Partager sur WhatsApp
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card p-4 text-center"><p className="text-3xl font-extrabold text-primary">{count}</p><p className="text-sm text-muted-foreground">amis invités</p></div>
        <div className="rounded-2xl bg-card p-4 text-center"><p className="text-3xl font-extrabold text-accent">{pending * REFERRAL_BONUS}</p><p className="text-sm text-muted-foreground">pièces à récupérer</p></div>
      </div>
      <Button size="lg" className="w-full" disabled={pending === 0}
        onClick={() => { addCoins(pending * REFERRAL_BONUS, "Bonus de parrainage", "reward", () => ({ referralClaimed: count })); toast.success(`+${pending * REFERRAL_BONUS} pièces !`); }}>
        Récupérer mes bonus
      </Button>
    </div>
  );
}
