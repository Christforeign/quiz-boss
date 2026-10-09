import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Coins, Share2, RotateCcw, Timer, Heart, Shield, Zap, Sparkles, Flame, Skull } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, shareWhatsApp } from "@/lib/categories";
import { addCoins, COINS_PER_CORRECT, getPlayer, levelFromXp, usePlayer } from "@/lib/player";
import { sfx, useQuizBgm } from "@/lib/sound";
import { MuteButton } from "@/components/MuteButton";
import { AdSlot, LocalBanner } from "@/components/Ads";
import { Button } from "@/components/ui/button";
import { difficultyBadge, mergeWithHardQuestions, type QuizQuestion } from "@/lib/hardQuestions";

export const Route = createFileRoute("/play/$category")({
  head: ({ params }) => {
    const c = CATEGORIES.find((x) => x.id === params.category);
    const t = `${c?.label ?? "Quiz"} — QuizBoss`;
    return {
      meta: [
        { title: t },
        { name: "description", content: `Joue au quiz ${c?.label ?? ""} et gagne des GDS.` },
        { property: "og:title", content: t },
        { property: "og:description", content: `Relève le défi ${c?.label ?? ""} sur QuizBoss !` },
      ],
    };
  },
  component: Play,
});

type QuizModeId = "normal" | "hard" | "boss";

const QUIZ_MODES: Record<
  QuizModeId,
  {
    id: QuizModeId;
    label: string;
    sub: string;
    rounds: number;
    baseTime: number;
    minTime: number;
    lives: number;
    coinsPerCorrect: number;
    xpMultiplier: number;
    minDifficulty: number;
  }
> = {
  normal: {
    id: "normal",
    label: "Classique ⚡",
    sub: "10 questions progressives · 4 vies · +3 GDS/réponse",
    rounds: 10,
    baseTime: 18,
    minTime: 7,
    lives: 4,
    coinsPerCorrect: COINS_PER_CORRECT,
    xpMultiplier: 1,
    minDifficulty: 1,
  },
  hard: {
    id: "hard",
    label: "Difficile 🔥",
    sub: "12 questions corsées · Chrono 13s · 3 vies · +5 GDS/réponse",
    rounds: 12,
    baseTime: 13,
    minTime: 6,
    lives: 3,
    coinsPerCorrect: 5,
    xpMultiplier: 1.5,
    minDifficulty: 2,
  },
  boss: {
    id: "boss",
    label: "Mode BOSS 💀",
    sub: "15 questions Expert · Chrono 10s · 2 vies · +8 GDS/réponse",
    rounds: 15,
    baseTime: 10,
    minTime: 5,
    lives: 2,
    coinsPerCorrect: 8,
    xpMultiplier: 2.2,
    minDifficulty: 3,
  },
};

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
  const cat = CATEGORIES.find((c) => c.id === category) ?? CATEGORIES.find((c) => c.id === "mix")!;
  const [mode, setMode] = useState<QuizModeId>("hard");
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["questions", category, mode, round],
    staleTime: Infinity,
    queryFn: async () => {
      let q = supabase
        .from("questions")
        .select("id,category,question,options,correct_index,lang,image_url,difficulty");
      if (category !== "mix") q = q.eq("category", category);
      const { data: rows } = await q;
      const merged = mergeWithHardQuestions((rows ?? []) as QuizQuestion[], category);
      const cfg = QUIZ_MODES[mode];

      // Prioritise higher difficulty questions for Hard and Boss modes
      const filtered = merged.filter((x) => (x.difficulty ?? 1) >= cfg.minDifficulty);
      const pool = filtered.length >= cfg.rounds ? filtered : merged;

      return shuffle(pool)
        .slice(0, cfg.rounds)
        .sort((a, b) => (a.difficulty ?? 1) - (b.difficulty ?? 1))
        .map((x) => {
          const order = shuffle(x.options.map((_, i) => i));
          return {
            ...x,
            options: order.map((i) => x.options[i] as string),
            correct_index: order.indexOf(x.correct_index),
          };
        });
    },
  });

  if (isLoading || !data) {
    return <div className="py-20 text-center text-muted-foreground">Chargement du défi…</div>;
  }
  if (data.length === 0) {
    return <div className="py-20 text-center">Aucune question dans cette catégorie pour l'instant.</div>;
  }

  if (!started) {
    const cfg = QUIZ_MODES[mode];
    return (
      <div className="space-y-5 py-3 animate-pop">
        <div className={`${cat.grad} relative overflow-hidden rounded-3xl p-6 text-secondary-foreground shadow-xl`}>
          <span className="absolute right-4 top-3 text-6xl opacity-90">{cat.emoji}</span>
          <p className="text-xs font-extrabold uppercase tracking-widest opacity-80">Prêt pour le défi ?</p>
          <h1 className="mt-1 text-3xl font-extrabold">{cat.label}</h1>
          <p className="mt-2 text-sm font-semibold opacity-95">
            Choisis ton niveau d'intensité : plus le mode est dur, plus tu gagnes de GDS et d'XP !
          </p>
        </div>

        <div className="space-y-2.5">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
            Sélectionne la difficulté
          </h2>
          {(Object.keys(QUIZ_MODES) as QuizModeId[]).map((mKey) => {
            const m = QUIZ_MODES[mKey];
            const active = mode === mKey;
            return (
              <button
                key={mKey}
                type="button"
                onClick={() => {
                  sfx.click();
                  setMode(mKey);
                }}
                className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                  active
                    ? "border-primary bg-primary/15 shadow-glow"
                    : "border-border bg-card hover:bg-muted/60"
                }`}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-background/50 text-xl">
                  {mKey === "boss" ? (
                    <Skull className="h-6 w-6 text-destructive" />
                  ) : mKey === "hard" ? (
                    <Flame className="h-6 w-6 text-secondary" />
                  ) : (
                    <Zap className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold">{m.label}</span>
                    <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-bold text-accent">
                      +{m.coinsPerCorrect} GDS / rép.
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{m.sub}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl bg-card p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-bold text-foreground">🛠️ Jokers tactiques disponibles en partie :</p>
          <p>• 🎯 <b>50/50</b> : Élimine 2 mauvaises réponses instantanément</p>
          <p>• ⏱️ <b>+6s Chrono</b> : Ajoute 6 secondes au compte à rebours</p>
          <p>• 🛡️ <b>Bouclier</b> : Protège ta vie ❤️ et ton combo 🔥 en cas d'erreur</p>
        </div>

        <Button
          size="lg"
          className="w-full text-base font-extrabold"
          onClick={() => {
            sfx.start();
            setStarted(true);
          }}
        >
          Lancer en {cfg.label} ({cfg.rounds} questions)
        </Button>
      </div>
    );
  }

  return (
    <Game
      key={`${mode}-${round}`}
      questions={data}
      cat={cat}
      modeConfig={QUIZ_MODES[mode]}
      onReplay={() => {
        sfx.start();
        setRound((r) => r + 1);
      }}
      onChangeMode={() => setStarted(false)}
    />
  );
}

function Game({
  questions,
  cat,
  modeConfig,
  onReplay,
  onChangeMode,
}: {
  questions: QuizQuestion[];
  cat: (typeof CATEGORIES)[number];
  modeConfig: (typeof QUIZ_MODES)[QuizModeId];
  onReplay: () => void;
  onChangeMode: () => void;
}) {
  const player = usePlayer();
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [lives, setLives] = useState(modeConfig.lives);
  const [limit, setLimit] = useState(modeConfig.baseTime);
  const [time, setTime] = useState(modeConfig.baseTime);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [gain, setGain] = useState<{ coins: number; xp: number }>({ coins: 0, xp: 0 });
  const [floater, setFloater] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Jokers state
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const [shieldActive, setShieldActive] = useState(false);
  const [used5050, setUsed5050] = useState(false);
  const [usedTime, setUsedTime] = useState(false);
  const [usedShield, setUsedShield] = useState(false);

  const startLevel = useRef(levelFromXp(getPlayer().xp));
  const q = questions[idx]!;

  useQuizBgm(!done, modeConfig.id === "boss" || streak >= 3);

  const timeForNext = (nextStreak: number, nextIdx: number) =>
    Math.max(
      modeConfig.minTime,
      modeConfig.baseTime - Math.floor(nextStreak * 1.5) - Math.floor(nextIdx / 3),
    );

  useEffect(() => {
    if (picked !== null || done) return;
    if (time <= 0) {
      sfx.timeout();
      answer(-1);
      return;
    }
    if (time <= 5) sfx.tick(time <= 3);
    const t = setTimeout(() => setTime((x) => x - 1), 1000);
    return () => clearTimeout(t);
  });

  function useJoker5050() {
    if (picked !== null || hiddenOptions.length > 0) return;
    if (used5050 && player.coins < 5) {
      return void toast.error("Il faut 5 GDS pour réutiliser le joker 50/50");
    }
    if (used5050) addCoins(-5, "Joker 50/50 en quiz", "spend");
    sfx.powerup();
    setUsed5050(true);
    const wrongIndices = q.options
      .map((_, i) => i)
      .filter((i) => i !== q.correct_index);
    setHiddenOptions(shuffle(wrongIndices).slice(0, 2));
  }

  function useJokerTime() {
    if (picked !== null) return;
    if (usedTime && player.coins < 5) {
      return void toast.error("Il faut 5 GDS pour réutiliser +6s Chrono");
    }
    if (usedTime) addCoins(-5, "Joker +6s Chrono", "spend");
    sfx.powerup();
    setUsedTime(true);
    setTime((t) => Math.min(limit + 6, t + 6));
  }

  function useJokerShield() {
    if (picked !== null || shieldActive) return;
    if (usedShield && player.coins < 8) {
      return void toast.error("Il faut 8 GDS pour réutiliser le Bouclier");
    }
    if (usedShield) addCoins(-8, "Joker Bouclier", "spend");
    sfx.powerup();
    setUsedShield(true);
    setShieldActive(true);
    toast.success("🛡️ Bouclier activé pour cette question !");
  }

  function answer(i: number) {
    if (picked !== null) return;
    setPicked(i);
    const ok = i === q.correct_index;

    if (ok) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setBestStreak((b) => Math.max(b, nextStreak));
      sfx.correct(nextStreak);
      if (nextStreak === 3 || nextStreak === 5 || nextStreak === 8) {
        setTimeout(() => sfx.combo(), 180);
      }
      const comboMult = nextStreak >= 5 ? 2 : nextStreak >= 3 ? 1.5 : 1;
      const pts = Math.round((60 + time * 4 + (q.difficulty - 1) * 20) * comboMult);
      const speedBonus = time >= limit * 0.6 ? 2 : time >= limit * 0.35 ? 1 : 0;
      const comboCoinBonus = nextStreak >= 4 ? 2 : nextStreak >= 2 ? 1 : 0;
      const coins = modeConfig.coinsPerCorrect + speedBonus + comboCoinBonus;
      const xpGain = Math.round((10 + Math.floor(time / 2) + q.difficulty * 3) * modeConfig.xpMultiplier);

      setScore((s) => s + pts);
      setCorrect((c) => c + 1);
      setGain((g) => ({ coins: g.coins + coins, xp: g.xp + xpGain }));
      setFloater(`+${coins} GDS ${comboMult > 1 ? `🔥x${comboMult}` : "🪙"}`);
      setShieldActive(false);

      setTimeout(() => {
        if (idx + 1 >= questions.length) setDone(true);
        else advance(nextStreak);
      }, 1350);
    } else {
      if (i !== -1) sfx.wrong();
      if (shieldActive) {
        toast("🛡️ Ton bouclier a absorbé l'erreur !");
        setShieldActive(false);
        setFloater("🛡️ Protégé");
        setTimeout(() => {
          if (idx + 1 >= questions.length) setDone(true);
          else advance(streak);
        }, 1400);
        return;
      }

      const nextLives = lives - 1;
      setLives(nextLives);
      setStreak(0);
      if (modeConfig.id === "boss") {
        setScore((s) => Math.max(0, s - 40));
      }
      setGain((g) => ({ ...g, xp: g.xp + 2 }));
      setFloater("−1 ❤️");

      setTimeout(() => {
        if (nextLives <= 0 || idx + 1 >= questions.length) {
          setDone(true);
        } else {
          advance(0);
        }
      }, 1400);
    }
  }

  function advance(nextStreak: number) {
    const l = timeForNext(nextStreak, idx + 1);
    setIdx((x) => x + 1);
    setPicked(null);
    setHiddenOptions([]);
    setLimit(l);
    setTime(l);
    setFloater(null);
  }

  useEffect(() => {
    if (!done) return;
    const survived = lives > 0 && correct >= Math.ceil(questions.length * 0.5);
    if (survived) sfx.win();
    else sfx.lose();

    const perfectBonus = correct === questions.length ? 15 : 0;
    const totalCoins = gain.coins + perfectBonus;

    addCoins(
      totalCoins,
      `Quiz ${modeConfig.label} · ${cat.label} (${correct}/${questions.length})`,
      "solo",
      (p) => ({
        xp: p.xp + gain.xp,
        gamesPlayed: p.gamesPlayed + 1,
        bestScore: Math.max(p.bestScore, score),
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  if (done) {
    const p = getPlayer();
    const lvl = levelFromXp(p.xp);
    const ko = lives <= 0;
    const perfectBonus = correct === questions.length ? 15 : 0;
    const link = `${window.location.origin}/?ref=${p.id}`;
    const text = `🔥 J'ai fait ${score} pts (${correct}/${questions.length}) en mode ${modeConfig.label} (${cat.label}) sur QuizBoss ! Niveau ${lvl} 🏆\nTu peux me battre ? 👉 ${link}`;
    return (
      <div className="space-y-5 py-4 animate-pop">
        <div className={`${cat.grad} rounded-3xl p-6 text-center text-secondary-foreground shadow-xl`}>
          <p className="text-6xl">{ko ? "💀" : correct >= questions.length * 0.75 ? "🏆" : "🎉"}</p>
          <p className="mt-1 text-xs font-extrabold uppercase tracking-widest opacity-85">
            {ko ? "Plus de vies — K.O. !" : modeConfig.label}
          </p>
          <h1 className="mt-1 text-4xl font-extrabold">{score} pts</h1>
          <p className="font-semibold">
            {correct} / {questions.length} bonnes réponses · Série max : 🔥 x{bestStreak}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm font-bold">
            <span className="rounded-full bg-background/25 px-3 py-1">
              +{gain.coins + perfectBonus} GDS
            </span>
            <span className="rounded-full bg-background/25 px-3 py-1">+{gain.xp} XP</span>
            {perfectBonus > 0 && (
              <span className="rounded-full bg-accent px-3 py-1 text-accent-foreground">
                Sans-faute +{perfectBonus} GDS !
              </span>
            )}
          </div>
          {lvl > startLevel.current && (
            <p className="mt-3 text-lg font-extrabold">⬆️ Niveau {lvl} atteint !</p>
          )}
          {lvl === startLevel.current && (
            <p className="mt-3 text-sm opacity-90">Niveau actuel : {lvl}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button
            size="lg"
            className="bg-success text-primary-foreground hover:bg-success/90"
            onClick={() => shareWhatsApp(text)}
          >
            <Share2 /> WhatsApp
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={async () => {
              if (navigator.share) await navigator.share({ text }).catch(() => {});
              else {
                await navigator.clipboard.writeText(text);
                toast.success("Score copié !");
              }
            }}
          >
            <Share2 /> Partager
          </Button>
          <Button size="lg" onClick={onReplay}>
            <RotateCcw /> Rejouer
          </Button>
          <Button size="lg" variant="outline" onClick={onChangeMode}>
            Difficulté / Mode
          </Button>
          <Button size="lg" variant="secondary" className="col-span-2" asChild>
            <Link to="/">Toutes les catégories</Link>
          </Button>
        </div>
        <LocalBanner placement="result" />
        <AdSlot slot="result" />
      </div>
    );
  }

  const pct = (time / limit) * 100;
  const diff = difficultyBadge(q.difficulty ?? 1);

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center justify-between text-xs font-bold">
        <span className="flex items-center gap-1.5">
          <span>{cat.emoji}</span>
          <span className="truncate max-w-[120px]">{cat.label}</span>
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] text-primary">
            {modeConfig.label}
          </span>
        </span>
        <span className="flex items-center gap-2 text-muted-foreground">
          <span className="flex items-center gap-0.5 text-destructive" title="Vies restantes">
            {Array.from({ length: modeConfig.lives }).map((_, i) => (
              <Heart
                key={i}
                className={`h-4 w-4 ${i < lives ? "fill-destructive text-destructive" : " opacity-25"}`}
              />
            ))}
          </span>
          {streak >= 2 && (
            <span className="rounded-full bg-accent/20 px-2 py-0.5 text-accent animate-pulse">
              🔥 x{streak}
            </span>
          )}
          <span>
            {idx + 1}/{questions.length}
          </span>
          <MuteButton />
        </span>
      </div>

      <div className="flex gap-1">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i < idx ? "bg-primary" : i === idx ? "bg-primary/60" : "bg-muted"
            }`}
          />
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Timer className={`h-5 w-5 ${time <= 5 ? "text-destructive animate-bounce" : "text-primary"}`} />
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              time <= 5 ? "bg-destructive" : "bg-grad-lime"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={`w-7 text-right font-extrabold tabular-nums ${time <= 5 ? "text-destructive" : ""}`}>
          {time}s
        </span>
        <span className="flex items-center gap-1 font-bold text-accent">
          <Coins className="h-4 w-4" />
          {score}
        </span>
      </div>

      {/* Jokers / Power-ups bar */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          disabled={picked !== null || hiddenOptions.length > 0}
          onClick={useJoker5050}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card/80 px-2 py-1.5 text-xs font-bold transition-transform active:scale-95 disabled:opacity-40"
        >
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          50/50{" "}
          <span className="text-[10px] text-muted-foreground">
            {used5050 ? "(5 GDS)" : "(Gratuit)"}
          </span>
        </button>
        <button
          type="button"
          disabled={picked !== null}
          onClick={useJokerTime}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card/80 px-2 py-1.5 text-xs font-bold transition-transform active:scale-95 disabled:opacity-40"
        >
          <Timer className="h-3.5 w-3.5 text-primary" />
          +6s{" "}
          <span className="text-[10px] text-muted-foreground">
            {usedTime ? "(5 GDS)" : "(Gratuit)"}
          </span>
        </button>
        <button
          type="button"
          disabled={picked !== null || shieldActive}
          onClick={useJokerShield}
          className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-1.5 text-xs font-bold transition-transform active:scale-95 disabled:opacity-40 ${
            shieldActive
              ? "border-primary bg-primary/20 text-primary"
              : "border-border bg-card/80"
          }`}
        >
          <Shield className="h-3.5 w-3.5 text-success" />
          Bouclier{" "}
          <span className="text-[10px] text-muted-foreground">
            {shieldActive ? "Actif" : usedShield ? "(8 GDS)" : "(Gratuit)"}
          </span>
        </button>
      </div>

      <div key={q.id} className="relative rounded-3xl bg-card p-6 animate-pop">
        {floater && (
          <span className="absolute right-6 top-4 text-xl font-extrabold text-accent animate-float-up">
            {floater}
          </span>
        )}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {q.lang === "ht" ? "Kreyòl" : q.lang === "en" ? "English" : "Français"}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${diff.cls}`}>
            {diff.label}
          </span>
        </div>
        {q.image_url && (
          <img
            src={q.image_url}
            alt=""
            className="mt-3 max-h-56 w-full rounded-2xl bg-muted object-contain"
          />
        )}
        <h2 className="mt-2.5 text-xl font-bold leading-snug">{q.question}</h2>
      </div>

      <div className="grid gap-3">
        {q.options.map((o, i) => {
          const isHidden = hiddenOptions.includes(i);
          if (isHidden) {
            return (
              <div
                key={i}
                className="flex items-center gap-3 rounded-2xl border border-dashed border-border/40 bg-card/20 p-4 text-left text-sm text-muted-foreground/30 line-through"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background/10 font-bold">
                  {"ABCD"[i]}
                </span>
                Option éliminée (50/50)
              </div>
            );
          }

          const state =
            picked === null
              ? "idle"
              : i === q.correct_index
                ? "right"
                : i === picked
                  ? "wrong"
                  : "dim";
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
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background/30 font-bold">
                {"ABCD"[i]}
              </span>
              {o}
            </button>
          );
        })}
      </div>
      {picked !== null && idx % 3 === 2 && (
        <AdSlot slot="between-questions" className="animate-pop" />
      )}
    </div>
  );
}
