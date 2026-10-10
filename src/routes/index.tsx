import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy, Zap, Wallet, Swords, Flame } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { levelProgress, usePlayer } from "@/lib/player";
import { AdSlot, LocalBanner } from "@/components/Ads";
import { sfx } from "@/lib/sound";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QuizBoss — Joue, gagne des GDS, affronte en Duel" },
      {
        name: "description",
        content:
          "Quiz gamifié en français, créole et anglais : musique, géographie, cinéma, tech. Duel multijoueur 2 à 4 joueurs et retraits MonCash/Natcash.",
      },
      { property: "og:title", content: "QuizBoss — Le quiz qui récompense" },
      {
        property: "og:description",
        content: "Quiz Solo Boss Mode & Duel Multijoueur (Mise 25 GDS → Gagne 45 GDS).",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const p = usePlayer();
  const prog = levelProgress(p.xp);
  return (
    <div className="space-y-6 pb-6">
      <section className="relative overflow-hidden rounded-3xl bg-card p-6 animate-pop">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
        <p className="text-sm font-semibold text-muted-foreground">Bienvenue, champion 👋</p>
        <h1 className="mt-1 text-3xl font-extrabold leading-tight">
          Réponds vite. <span className="text-primary">Gagne gros.</span>
        </h1>
        <div className="mt-5">
          <div className="mb-1 flex justify-between text-xs font-semibold">
            <span className="flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-primary" /> Niveau {prog.level}
            </span>
            <span className="text-muted-foreground">
              {prog.toNext} XP avant niv. {prog.level + 1}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-grad-lime transition-all duration-700"
              style={{ width: `${prog.pct}%` }}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
          <span className="flex items-center gap-1">
            <Trophy className="h-4 w-4 text-accent" /> Record : <b>{p.bestScore}</b>
          </span>
          <span>
            Parties : <b>{p.gamesPlayed}</b>
          </span>
          <Link
            to="/portefeuille"
            onClick={() => sfx.click()}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-extrabold text-primary hover:bg-primary/25"
          >
            <Wallet className="h-3.5 w-3.5" /> + Déposer / Retirer GDS
          </Link>
        </div>
      </section>

      <Link
        to="/duel"
        onClick={() => sfx.click()}
        className="flex items-center gap-4 rounded-3xl bg-grad-candy p-5 text-secondary-foreground shadow-lg transition-transform active:scale-95"
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-background/20 text-3xl">
          <Swords className="h-8 w-8" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-lg font-extrabold">Duel Multijoueur (2 à 4J)</span>
            <span className="rounded-full bg-background/25 px-2 py-0.5 text-[10px] font-extrabold uppercase">
              En ligne & Local
            </span>
          </span>
          <span className="mt-0.5 block text-xs font-semibold opacity-95">
            Mise dès 25 GDS chacun → Le gagnant remporte 45 GDS !
          </span>
        </span>
      </Link>

      <LocalBanner placement="home" />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-extrabold">Choisis ta catégorie</h2>
          <span className="flex items-center gap-1 text-xs font-bold text-secondary">
            <Flame className="h-3.5 w-3.5" /> Modes Difficile & BOSS inclus
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map((c, i) => (
            <Link
              key={c.id}
              to="/play/$category"
              params={{ category: c.id }}
              onClick={() => sfx.click()}
              style={{ animationDelay: `${i * 60}ms` }}
              className={`${c.grad} group relative flex flex-col justify-end overflow-hidden rounded-2xl p-4 text-secondary-foreground shadow-lg transition-transform animate-pop hover:-translate-y-1 active:scale-95 ${
                c.id === "mix" ? "col-span-2 aspect-[3/1]" : "aspect-[4/3]"
              }`}
            >
              <span className="absolute right-3 top-2 text-5xl transition-transform group-hover:scale-125 group-hover:rotate-12">
                {c.emoji}
              </span>
              <span className="text-lg font-extrabold leading-tight drop-shadow">{c.label}</span>
              <span className="text-xs font-semibold opacity-90">
                5 Difficultés · Classique → Légende 👑
              </span>
            </Link>
          ))}
        </div>
      </section>

      <AdSlot slot="home-bottom" />
    </div>
  );
}
