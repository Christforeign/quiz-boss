import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Share2, Swords, Timer, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, shareWhatsApp } from "@/lib/categories";
import { addCoins, consumeDuel, duelsLeft, FREE_DUELS_PER_DAY, SHARE_DUEL_BONUS, unlockDuelsByShare, usePlayer } from "@/lib/player";
import { sfx } from "@/lib/sound";
import { MuteButton } from "@/components/MuteButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/duel")({
  head: () => ({
    meta: [
      { title: "Duel entre amis — QuizBoss" },
      { name: "description", content: "Défie 1 à 3 amis sur le même écran : buzzer ou tour par tour, le plus rapide remporte la cagnotte de pièces." },
      { property: "og:title", content: "Mode Duel — QuizBoss" },
      { property: "og:description", content: "Buzzer, tour par tour et cagnotte de pièces virtuelles : qui est le plus rapide ?" },
    ],
  }),
  component: DuelPage,
});

type Q = { id: string; question: string; options: string[]; correct_index: number };
type Mode = "buzzer" | "tour";
type Setup = { names: string[]; mode: Mode; stake: number; category: string };

const COLORS = ["bg-grad-lime", "bg-grad-sunset", "bg-grad-ocean", "bg-grad-candy"];
const STAKES = [0, 10, 25, 50, 100];

function shuffle<T>(a: T[]) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j] as T, b[i] as T]; }
  return b;
}

function DuelPage() {
  const [setup, setSetup] = useState<Setup | null>(null);
  const [questions, setQuestions] = useState<Q[] | null>(null);
  const [gameKey, setGameKey] = useState(0);

  async function start(s: Setup) {
    let q = supabase.from("questions").select("id,question,options,correct_index");
    if (s.category !== "mix") q = q.eq("category", s.category);
    const { data } = await q;
    const count = s.mode === "tour" ? s.names.length * 3 : 8;
    const qs = shuffle((data ?? []) as Q[]).slice(0, count).map((x) => {
      const order = shuffle(x.options.map((_, i) => i));
      return { ...x, options: order.map((i) => x.options[i] as string), correct_index: order.indexOf(x.correct_index) };
    });
    if (qs.length < 3) return void toast.error("Pas assez de questions dans cette catégorie.");
    consumeDuel();
    if (s.stake > 0) addCoins(-s.stake, `Mise duel (${s.names.length} joueurs)`, "duel");
    setSetup(s); setQuestions(qs); setGameKey((k) => k + 1);
  }

  if (setup && questions) return <Game key={gameKey} setup={setup} questions={questions} onExit={() => { setSetup(null); setQuestions(null); }} />;
  return <SetupScreen onStart={start} />;
}

function SetupScreen({ onStart }: { onStart: (s: Setup) => void }) {
  const p = usePlayer();
  const [n, setN] = useState(2);
  const [names, setNames] = useState<string[]>(["", "", "", ""]);
  const [mode, setMode] = useState<Mode>("buzzer");
  const [stake, setStake] = useState(10);
  const [category, setCategory] = useState("mix");
  const left = duelsLeft(p);

  const finalNames = names.slice(0, n).map((x, i) => x.trim() || (i === 0 ? p.name || "Moi" : `Joueur ${i + 1}`));

  return (
    <div className="space-y-5 py-2 animate-pop">
      <div className="rounded-3xl bg-grad-candy p-6 text-secondary-foreground shadow-xl">
        <Swords className="h-8 w-8" />
        <h1 className="mt-2 text-3xl font-extrabold">Duel entre amis</h1>
        <p className="text-sm font-semibold opacity-90">Jouez sur le même téléphone. Le plus rapide remporte la cagnotte de pièces virtuelles.</p>
        <p className="mt-3 inline-block rounded-full bg-background/25 px-3 py-1 text-xs font-bold">{left} duel{left > 1 ? "s" : ""} gratuit{left > 1 ? "s" : ""} restant{left > 1 ? "s" : ""} aujourd'hui</p>
      </div>

      <section className="space-y-2">
        <h2 className="flex items-center gap-2 font-bold"><Users className="h-4 w-4" /> Joueurs</h2>
        <div className="grid grid-cols-3 gap-2">
          {[2, 3, 4].map((k) => (
            <Button key={k} variant={n === k ? "default" : "secondary"} onClick={() => setN(k)}>{k} joueurs</Button>
          ))}
        </div>
        {Array.from({ length: n }).map((_, i) => (
          <Input key={i} placeholder={i === 0 ? `${p.name || "Moi"} (ton portefeuille)` : `Joueur ${i + 1}`} value={names[i]} maxLength={16}
            onChange={(e) => setNames(names.map((x, j) => (j === i ? e.target.value : x)))} />
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="font-bold">Mode de jeu</h2>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setMode("buzzer")} className={`rounded-2xl border p-3 text-left ${mode === "buzzer" ? "border-primary bg-primary/10" : "border-border bg-card"}`}>
            <b>🔔 Buzzer</b><p className="text-xs text-muted-foreground">Le premier qui buzze répond. Faux = −50.</p>
          </button>
          <button onClick={() => setMode("tour")} className={`rounded-2xl border p-3 text-left ${mode === "tour" ? "border-primary bg-primary/10" : "border-border bg-card"}`}>
            <b>🔄 Tour par tour</b><p className="text-xs text-muted-foreground">Chacun son tour. Plus tu réponds vite, plus tu marques.</p>
          </button>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-bold">Catégorie</h2>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Button key={c.id} size="sm" variant={category === c.id ? "default" : "secondary"} onClick={() => setCategory(c.id)}>{c.emoji} {c.label}</Button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-bold">Ta mise (pièces virtuelles)</h2>
        <div className="flex flex-wrap gap-2">
          {STAKES.map((s) => (
            <Button key={s} size="sm" disabled={s > p.coins} variant={stake === s ? "default" : "secondary"} onClick={() => setStake(s)}>{s === 0 ? "Sans mise" : `${s} 🪙`}</Button>
          ))}
        </div>
        {stake > 0 && <p className="text-sm text-muted-foreground">Cagnotte : <b className="text-accent">{stake * n} pièces</b> · si tu gagnes, elles vont dans ton portefeuille.</p>}
      </section>

      {left > 0 ? (
        <Button size="lg" className="w-full" disabled={stake > p.coins} onClick={() => onStart({ names: finalNames, mode, stake, category })}>
          <Swords /> Lancer le duel
        </Button>
      ) : (
        <div className="space-y-2 rounded-2xl bg-card p-4 text-center">
          <p className="font-semibold">Tu as utilisé tes {FREE_DUELS_PER_DAY} duels gratuits du jour.</p>
          <Button size="lg" className="w-full bg-success text-primary-foreground hover:bg-success/90" onClick={() => {
            shareWhatsApp(`⚔️ Je te défie en duel sur QuizBoss ! Qui est le plus rapide ? 👉 ${window.location.origin}/duel?ref=${p.id}`);
            unlockDuelsByShare();
            toast.success(`+${SHARE_DUEL_BONUS} duels débloqués !`);
          }}>
            <Share2 /> Partager sur WhatsApp (+{SHARE_DUEL_BONUS} duels)
          </Button>
        </div>
      )}
    </div>
  );
}

function Game({ setup, questions, onExit }: { setup: Setup; questions: Q[]; onExit: () => void }) {
  const { names, mode, stake } = setup;
  const TIME = mode === "buzzer" ? 12 : 15;
  const [idx, setIdx] = useState(0);
  const [scores, setScores] = useState<number[]>(names.map(() => 0));
  const [buzzed, setBuzzed] = useState<number | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [time, setTime] = useState(TIME);
  const [done, setDone] = useState(false);
  const q = questions[idx]!;
  const turnPlayer = mode === "tour" ? idx % names.length : buzzed;
  const canAnswer = mode === "tour" || buzzed !== null;

  useEffect(() => {
    if (done || picked !== null) return;
    if (time <= 0) { resolve(-1); return; }
    if (time <= 4) sfx.tick(time <= 2);
    const t = setTimeout(() => setTime((x) => x - 1), 1000);
    return () => clearTimeout(t);
  });

  function next() {
    if (idx + 1 >= questions.length) { setDone(true); return; }
    setIdx((x) => x + 1); setBuzzed(null); setPicked(null); setTime(TIME);
  }

  function resolve(i: number) {
    if (picked !== null) return;
    setPicked(i);
    const who = turnPlayer;
    if (who !== null && who !== undefined) {
      const ok = i === q.correct_index;
      if (ok) sfx.correct(); else sfx.wrong();
      const delta = ok ? (mode === "buzzer" ? 100 + time * 5 : 50 + time * 10) : mode === "buzzer" ? -50 : 0;
      setScores((s) => s.map((v, j) => (j === who ? v + delta : v)));
    } else sfx.wrong();
    setTimeout(next, 1400);
  }

  useEffect(() => {
    if (!done) return;
    const top = Math.max(...scores);
    const winners = scores.map((s, i) => (s === top ? i : -1)).filter((i) => i >= 0);
    if (winners.length === 1 && winners[0] === 0) {
      sfx.win();
      if (stake > 0) addCoins(stake * names.length, `Duel gagné · cagnotte (${names.length} joueurs)`, "duel");
    } else if (winners.includes(0)) {
      sfx.win();
      if (stake > 0) addCoins(stake, "Duel à égalité · mise remboursée", "duel");
    } else sfx.lose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  if (done) {
    const ranking = names.map((n, i) => ({ n, s: scores[i]!, i })).sort((a, b) => b.s - a.s);
    const champ = ranking[0]!;
    const text = `⚔️ Duel QuizBoss : ${champ.n} gagne avec ${champ.s} pts ! ${ranking.slice(1).map((r) => `${r.n} ${r.s}`).join(" · ")}\nViens nous défier 👉 ${window.location.origin}/duel`;
    return (
      <div className="space-y-4 py-4 animate-pop">
        <div className="rounded-3xl bg-grad-candy p-6 text-center text-secondary-foreground shadow-xl">
          <p className="text-6xl">🏆</p>
          <h1 className="mt-2 text-3xl font-extrabold">{champ.n} gagne !</h1>
          {stake > 0 && <p className="font-semibold">Cagnotte : {stake * names.length} pièces virtuelles</p>}
        </div>
        <div className="space-y-2">
          {ranking.map((r, k) => (
            <div key={r.i} className="flex items-center justify-between rounded-2xl bg-card p-4 font-bold">
              <span>{["🥇", "🥈", "🥉", "4️⃣"][k]} {r.n}</span><span className="text-accent">{r.s} pts</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button size="lg" className="bg-success text-primary-foreground hover:bg-success/90" onClick={() => shareWhatsApp(text)}><Share2 /> WhatsApp</Button>
          <Button size="lg" onClick={onExit}><Swords /> Nouveau duel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center justify-between text-sm font-bold">
        <span>⚔️ {mode === "buzzer" ? "Buzzer" : "Tour par tour"} {stake > 0 && <span className="text-accent">· {stake * names.length} 🪙</span>}</span>
        <span className="flex items-center gap-2 text-muted-foreground">{idx + 1}/{questions.length}<MuteButton /></span>
      </div>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${names.length}, minmax(0, 1fr))` }}>
        {names.map((n, i) => (
          <div key={i} className={`rounded-xl p-2 text-center text-xs font-bold text-secondary-foreground ${COLORS[i]} ${turnPlayer === i ? "ring-2 ring-foreground" : "opacity-80"}`}>
            <p className="truncate">{n}</p><p className="text-base">{scores[i]}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Timer className={`h-5 w-5 ${time <= 4 ? "text-destructive" : "text-primary"}`} />
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div className={`h-full transition-all duration-1000 ease-linear ${time <= 4 ? "bg-destructive" : "bg-grad-lime"}`} style={{ width: `${(time / TIME) * 100}%` }} />
        </div>
        <span className="w-6 text-right font-bold tabular-nums">{time}</span>
      </div>
      <div key={q.id} className="rounded-3xl bg-card p-5 animate-pop">
        {turnPlayer !== null && turnPlayer !== undefined && <p className="text-xs font-bold uppercase tracking-widest text-primary">À toi : {names[turnPlayer]}</p>}
        <h2 className="mt-1 text-lg font-bold leading-snug">{q.question}</h2>
      </div>

      {canAnswer ? (
        <div className="grid gap-2">
          {q.options.map((o, i) => {
            const st = picked === null ? "bg-card hover:bg-muted" : i === q.correct_index ? "bg-success text-primary-foreground" : i === picked ? "bg-destructive text-destructive-foreground" : "bg-card opacity-50";
            return (
              <button key={i} disabled={picked !== null} onClick={() => resolve(i)} className={`flex items-center gap-3 rounded-2xl border border-border p-3 text-left font-semibold transition-all ${st}`}>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-background/30 font-bold">{"ABCD"[i]}</span>{o}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {names.map((n, i) => (
            <button key={i} onClick={() => { sfx.buzz(); setBuzzed(i); }} className={`${COLORS[i]} aspect-[4/3] rounded-3xl text-xl font-extrabold text-secondary-foreground shadow-lg transition-transform active:scale-90`}>
              🔔<br />{n}
            </button>
          ))}
          <p className="col-span-2 text-center text-xs text-muted-foreground">Lisez la question, puis buzzez le plus vite possible !</p>
        </div>
      )}
    </div>
  );
}
