import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy, Zap } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { levelProgress, usePlayer } from "@/lib/player";
import { AdSlot, LocalBanner } from "@/components/Ads";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QuizBoss — Joue, gagne des pièces, monte de niveau" },
      { name: "description", content: "Quiz gamifié en français, créole et anglais : musique, géographie, cinéma. Gagne des pièces et de l'XP." },
      { property: "og:title", content: "QuizBoss — Le quiz qui récompense" },
      { property: "og:description", content: "Musique & TikTok, Géographie, Cinéma… Gagne des pièces à chaque bonne réponse." },
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
            <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-primary" /> Niveau {prog.level}</span>
            <span className="text-muted-foreground">{prog.toNext} XP avant niv. {prog.level + 1}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-grad-lime transition-all duration-700" style={{ width: `${prog.pct}%` }} />
          </div>
        </div>
        <div className="mt-4 flex gap-4 text-sm">
          <span className="flex items-center gap-1"><Trophy className="h-4 w-4 text-accent" /> Record : <b>{p.bestScore}</b></span>
          <span>Parties : <b>{p.gamesPlayed}</b></span>
        </div>
      </section>

      <LocalBanner placement="home" />

      <section>
        <h2 className="mb-3 text-xl font-extrabold">Choisis ta catégorie</h2>
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map((c, i) => (
            <Link
              key={c.id}
              to="/play/$category"
              params={{ category: c.id }}
              style={{ animationDelay: `${i * 60}ms` }}
              className={`${c.grad} group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl p-4 text-secondary-foreground shadow-lg transition-transform animate-pop hover:-translate-y-1 active:scale-95 ${c.id === "mix" ? "col-span-2 aspect-[3/1]" : ""}`}
            >
              <span className="absolute right-3 top-2 text-5xl transition-transform group-hover:scale-125 group-hover:rotate-12">{c.emoji}</span>
              <span className="text-lg font-extrabold leading-tight drop-shadow">{c.label}</span>
              <span className="text-xs font-semibold opacity-90">10 questions · 15 s</span>
            </Link>
          ))}
        </div>
      </section>

      <AdSlot slot="home-bottom" />
    </div>
  );
}
