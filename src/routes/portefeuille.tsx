import { createFileRoute, Link } from "@tanstack/react-router";
import { Coins, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { levelFromXp, usePlayer, WITHDRAW_MIN_COINS, WITHDRAW_MIN_LEVEL, type Tx } from "@/lib/player";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/portefeuille")({
  head: () => ({
    meta: [
      { title: "Mon portefeuille — QuizBoss" },
      { name: "description", content: "Ton solde de pièces virtuelles QuizBoss et l'historique de tes gains et dépenses." },
      { property: "og:title", content: "Portefeuille de pièces — QuizBoss" },
      { property: "og:description", content: "Suis tes gains en parties solo, duels et récompenses." },
    ],
  }),
  component: Wallet,
});

const KIND: Record<Tx["kind"], string> = { solo: "🎯 Solo", duel: "⚔️ Duel", reward: "🎁 Récompense", spend: "💸 Dépense" };

function Wallet() {
  const p = usePlayer();
  const history = p.history ?? [];
  const earned = history.filter((h) => h.amount > 0).reduce((a, h) => a + h.amount, 0);
  const spent = history.filter((h) => h.amount < 0).reduce((a, h) => a - h.amount, 0);
  const lvl = levelFromXp(p.xp);
  return (
    <div className="space-y-5 py-2 animate-pop">
      <div className="rounded-3xl bg-grad-lime p-6 text-secondary-foreground shadow-xl">
        <p className="text-sm font-semibold opacity-90">Solde de pièces virtuelles</p>
        <p className="mt-1 flex items-center gap-2 text-5xl font-extrabold"><Coins className="h-10 w-10" /> {p.coins}</p>
        <p className="mt-2 text-xs opacity-80">Monnaie fictive de divertissement, gagnée en jouant.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card p-4"><p className="flex items-center gap-1 text-sm text-muted-foreground"><ArrowDownLeft className="h-4 w-4 text-success" /> Gagné</p><p className="text-2xl font-extrabold">{earned}</p></div>
        <div className="rounded-2xl bg-card p-4"><p className="flex items-center gap-1 text-sm text-muted-foreground"><ArrowUpRight className="h-4 w-4 text-destructive" /> Dépensé</p><p className="text-2xl font-extrabold">{spent}</p></div>
      </div>
      <div className="rounded-2xl bg-card p-4 text-sm">
        Demandes débloquées au <b>niveau {WITHDRAW_MIN_LEVEL}</b> avec <b>{WITHDRAW_MIN_COINS} pièces</b> minimum. Tu es niveau {lvl}.
        <Button asChild size="sm" variant="secondary" className="mt-3 w-full"><Link to="/retrait">Voir les demandes</Link></Button>
      </div>
      <section>
        <h2 className="mb-2 text-lg font-extrabold">Historique</h2>
        {history.length === 0 ? (
          <p className="rounded-2xl bg-card p-6 text-center text-muted-foreground">Aucune opération pour l'instant. Lance une partie !</p>
        ) : (
          <ul className="space-y-2">
            {history.map((h, i) => (
              <li key={i} className="flex items-center justify-between gap-3 rounded-2xl bg-card p-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{h.label}</p>
                  <p className="text-xs text-muted-foreground">{KIND[h.kind]} · {new Date(h.t).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</p>
                </div>
                <span className={`shrink-0 font-extrabold ${h.amount >= 0 ? "text-success" : "text-destructive"}`}>{h.amount >= 0 ? "+" : ""}{h.amount}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
