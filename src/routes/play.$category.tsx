import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Coins, Share2, RotateCcw, Timer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, shareWhatsApp } from "@/lib/categories";
import { COINS_PER_CORRECT, getPlayer, levelFromXp, updatePlayer } from "@/lib/player";
import { AdSlot, LocalBanner } from "@/components/Ads";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/play/$category")({
  head: ({ params }) => {
    const c = CATEGORIES.find((x) => x.id === params.category);
    const t = `${c?.label ?? "Quiz"} — QuizBoss`;
    return {
      meta: [
        { title: t },
        { name: "description", content: `Joue au quiz ${c?.label ?? ""} et gagne des pièces.` },
        { property: "og:title", content: t },
        { property: "og:description", content: `Relève le défi ${c?.label ?? ""} sur QuizBoss !` },
      ],
    };
  },
  component: Play,
});

const TIME = 15;
const ROUND = 10;

type Q = { id: string; question: string; options: string[]; correct_index: number; lang: string; image_url: string | null };

function shuffle<T>(a: T[]) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j] as T, b[i] as T];
  }
  return b;
}

function Play() {
  const { category } = Route.useParams();
  const cat = CATEGORIES.find((c) => c.id === category) ?? CATEGORIES[4];
  const [round, setRound] = useState(0);
  const { data, isLoading } = useQuery({
    queryKey: ["questions", category, round],
    staleTime: Infinity,
    queryFn: async () => {
      let q = supabase.from("questions").select("id,question,options,correct_index,lang,image_url");
      if (category !== "mix") q = q.eq("category", category);
      const { data } = await q;
      return shuffle((data ?? []) as Q[]).slice(0, ROUND).map((x) => {
        const order = shuffle(x.options.map((_, i) => i));
        return { ...x, options: order.map((i) => x.options[i] as string), correct_index: order.indexOf(x.correct_index) };
      });
    },
  });

  if (isLoading || !data) return <div className="py-20 text-center text-muted-foreground">Chargement des questions…</div>;
  if (data.length === 0) return <div className="py-20 text-center">Aucune question dans cette catégorie pour l'instant.</div>;
  return <Game key={round} questions={data} cat={cat} onReplay={() => setRound((r) => r + 1)} />;
}

function Game({ questions, cat, onReplay }: { questions: Q[]; cat: (typeof CATEGORIES)[number]; onReplay: () => void }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [time, setTime] = useState(TIME);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [gain, setGain] = useState<{ coins: number; xp: number }>({ coins: 0, xp: 0 });
  const [floater, setFloater] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const startLevel = useRef(levelFromXp(getPlayer().xp));
  const q = questions[idx]!;

  useEffect(() => {
    if (picked !== null || done) return;
    if (time <= 0) { answer(-1); return; }
    const t = setTimeout(() => setTime((x) => x - 1), 1000);
    return () => clearTimeout(t);
  });

  function answer(i: number) {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.correct_index) {
      const pts = 50 + time * 3;
      const coins = COINS_PER_CORRECT + (time >= 10 ? 1 : 0);
      setScore((s) => s + pts);
      setCorrect((c) => c + 1);
      setGain((g) => ({ coins: g.coins + coins, xp: g.xp + 8 + Math.floor(time / 3) }));
      setFloater(`+${coins} 🪙`);
    } else {
      setGain((g) => ({ ...g, xp: g.xp + 1 }));
      setFloater(null);
    }
    setTimeout(() => {
      if (idx + 1 >= questions.length) finish();
      else { setIdx((x) => x + 1); setPicked(null); setTime(TIME); setFloater(null); }
    }, 1400);
  }

  function finish() {
    setDone(true);
  }

  useEffect(() => {
    if (!done) return;
    updatePlayer((p) => ({
      coins: p.coins + gain.coins,
      xp: p.xp + gain.xp,
      gamesPlayed: p.gamesPlayed + 1,
      bestScore: Math.max(p.bestScore, score),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  if (done) {
    const p = getPlayer();
    const lvl = levelFromXp(p.xp);
    const link = `${window.location.origin}/?ref=${p.id}`;
    const text = `🔥 J'ai fait ${score} pts (${correct}/${questions.length}) en ${cat.label} sur QuizBoss ! Niveau ${lvl} 🏆\nTu peux me battre ? 👉 ${link}`;
    return (
      <div className="space-y-5 py-4 animate-pop">
        <div className={`${cat.grad} rounded-3xl p-6 text-center text-secondary-foreground shadow-xl`}>
          <p className="text-6xl">{correct >= 8 ? "🏆" : correct >= 5 ? "🎉" : "💪"}</p>
          <h1 className="mt-2 text-4xl font-extrabold">{score} pts</h1>
          <p className="font-semibold">{correct} / {questions.length} bonnes réponses</p>
          <div className="mt-4 flex justify-center gap-3 text-sm font-bold">
            <span className="rounded-full bg-background/25 px-3 py-1">+{gain.coins} pièces</span>
            <span className="rounded-full bg-background/25 px-3 py-1">+{gain.xp} XP</span>
          </div>
          {lvl > startLevel.current && <p className="mt-3 text-lg font-extrabold">⬆️ Niveau {lvl} atteint !</p>}
          {lvl === startLevel.current && <p className="mt-3 text-sm opacity-90">Niveau actuel : {lvl}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button size="lg" className="bg-success text-primary-foreground hover:bg-success/90" onClick={() => shareWhatsApp(text)}>
            <Share2 /> WhatsApp
          </Button>
          <Button size="lg" variant="secondary" onClick={async () => {
            if (navigator.share) await navigator.share({ text }).catch(() => {});
            else { await navigator.clipboard.writeText(text); }
          }}>
            <Share2 /> Partager
          </Button>
          <Button size="lg" onClick={onReplay}><RotateCcw /> Rejouer</Button>
          <Button size="lg" variant="outline" asChild><Link to="/">Catégories</Link></Button>
        </div>
        <LocalBanner placement="result" />
        <AdSlot slot="result" />
      </div>
    );
  }

  const pct = (time / TIME) * 100;
  return (
    <div className="space-y-5 py-2">
      <div className="flex items-center justify-between text-sm font-bold">
        <span>{cat.emoji} {cat.label}</span>
        <span className="text-muted-foreground">{idx + 1}/{questions.length}</span>
      </div>
      <div className="flex gap-1">
        {questions.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i < idx ? "bg-primary" : i === idx ? "bg-primary/60" : "bg-muted"}`} />
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Timer className={`h-5 w-5 ${time <= 5 ? "text-destructive" : "text-primary"}`} />
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div className={`h-full transition-all duration-1000 ease-linear ${time <= 5 ? "bg-destructive" : "bg-grad-lime"}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="w-6 text-right font-bold tabular-nums">{time}</span>
        <span className="flex items-center gap-1 font-bold text-accent"><Coins className="h-4 w-4" />{score}</span>
      </div>

      <div key={q.id} className="relative rounded-3xl bg-card p-6 animate-pop">
        {floater && <span className="absolute right-6 top-4 text-xl font-extrabold text-accent animate-float-up">{floater}</span>}
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{q.lang === "ht" ? "Kreyòl" : q.lang === "en" ? "English" : "Français"}</span>
        {q.image_url && <img src={q.image_url} alt="" className="mt-3 max-h-56 w-full rounded-2xl object-contain bg-muted" />}
        <h2 className="mt-2 text-xl font-bold leading-snug">{q.question}</h2>
      </div>

      <div className="grid gap-3">
        {q.options.map((o, i) => {
          const state = picked === null ? "idle" : i === q.correct_index ? "right" : i === picked ? "wrong" : "dim";
          const cls = {
            idle: "bg-card hover:bg-muted active:scale-[0.98]",
            right: "bg-success text-primary-foreground scale-[1.02]",
            wrong: "bg-destructive text-destructive-foreground animate-pulse",
            dim: "bg-card opacity-50",
          }[state];
          return (
            <button
              key={i}
              disabled={picked !== null}
              onClick={() => answer(i)}
              style={{ animationDelay: `${i * 50}ms` }}
              className={`flex items-center gap-3 rounded-2xl border border-border p-4 text-left font-semibold transition-all animate-pop ${cls}`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background/30 font-bold">{"ABCD"[i]}</span>
              {o}
            </button>
          );
        })}
      </div>
      {picked !== null && idx % 3 === 2 && <AdSlot slot="between-questions" className="animate-pop" />}
    </div>
  );
}
