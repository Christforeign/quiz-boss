import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Share2,
  Swords,
  Timer,
  Users,
  Globe,
  Smartphone,
  Copy,
  Coins,
  Trophy,
  Plus,
  Play,
  Sparkles,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, shareWhatsApp } from "@/lib/categories";
import {
  addCoins,
  consumeDuel,
  duelsLeft,
  FREE_DUELS_PER_DAY,
  SHARE_DUEL_BONUS,
  unlockDuelsByShare,
  usePlayer,
} from "@/lib/player";
import {
  calculateDuelPot,
  listDuelRooms,
  saveDuelRoom,
  type DuelRoom,
} from "@/lib/site";
import { sfx, useQuizBgm } from "@/lib/sound";
import { MuteButton } from "@/components/MuteButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { difficultyBadge, mergeWithHardQuestions, type QuizQuestion } from "@/lib/hardQuestions";

export const Route = createFileRoute("/duel")({
  head: () => ({
    meta: [
      { title: "Duel Multijoueur (2 à 4 joueurs) — QuizBoss" },
      {
        name: "description",
        content:
          "Affronte 2 à 4 joueurs en duel quiz ! Mise 25 GDS chacun, le gagnant remporte 45 GDS.",
      },
      { property: "og:title", content: "Duel Multijoueur GDS — QuizBoss" },
      {
        property: "og:description",
        content: "2 à 4 joueurs · Mise dès 25 GDS · Le plus rapide remporte la cagnotte !",
      },
    ],
  }),
  component: DuelPage,
});

type Mode = "online" | "buzzer" | "tour";
type Setup = {
  names: string[];
  mode: Mode;
  stake: number;
  category: string;
  roomCode?: string;
};

const COLORS = ["bg-grad-lime", "bg-grad-sunset", "bg-grad-ocean", "bg-grad-candy"];
const STAKES = [25, 50, 100, 250, 500, 0];
const RIVAL_NAMES = [
  "Jean-Marc 🇭🇹",
  "StephyQueen",
  "KevBoss_509",
  "Nadia_Quiz",
  "JuniorGonaives",
  "Mika_Pro",
  "Daphnée_HT",
  "AlexCapHaitien",
];

function shuffle<T>(a: T[]) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j] as T, b[i] as T];
  }
  return b;
}

function DuelPage() {
  const [setup, setSetup] = useState<Setup | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [gameKey, setGameKey] = useState(0);

  async function start(s: Setup) {
    let q = supabase
      .from("questions")
      .select("id,category,question,options,correct_index,lang,image_url,difficulty");
    if (s.category !== "mix") q = q.eq("category", s.category);
    const { data } = await q;
    const merged = mergeWithHardQuestions((data ?? []) as QuizQuestion[], s.category);

    // En duel avec mise, privilégier des questions plus corsées (difficulté >= 2)
    const hardPool = s.stake >= 25 ? merged.filter((x) => (x.difficulty ?? 1) >= 2) : merged;
    const sourcePool = hardPool.length >= 10 ? hardPool : merged;

    const count = s.mode === "tour" ? s.names.length * 3 : 10;
    const qs = shuffle(sourcePool)
      .slice(0, count)
      .sort((a, b) => (a.difficulty ?? 1) - (b.difficulty ?? 1))
      .map((x) => {
        const order = shuffle(x.options.map((_, i) => i));
        return {
          ...x,
          options: order.map((i) => x.options[i] as string),
          correct_index: order.indexOf(x.correct_index),
        };
      });

    if (qs.length < 3) return void toast.error("Pas assez de questions dans cette catégorie.");
    consumeDuel();
    if (s.stake > 0) {
      addCoins(
        -s.stake,
        `Mise Duel (${s.names.length} joueurs · ${s.stake} GDS/joueur)`,
        "duel",
      );
    }
    sfx.start();
    setSetup(s);
    setQuestions(qs);
    setGameKey((k) => k + 1);
  }

  if (setup && questions) {
    return (
      <Game
        key={gameKey}
        setup={setup}
        questions={questions}
        onExit={() => {
          setSetup(null);
          setQuestions(null);
        }}
      />
    );
  }
  return <SetupScreen onStart={start} />;
}

function SetupScreen({ onStart }: { onStart: (s: Setup) => void }) {
  const p = usePlayer();
  const [n, setN] = useState(2); // Minimum 2, Maximum 4
  const [names, setNames] = useState<string[]>(["", "", "", ""]);
  const [mode, setMode] = useState<Mode>("online");
  const [stake, setStake] = useState(25);
  const [customStake, setCustomStake] = useState("");
  const [category, setCategory] = useState("mix");

  // Online Room & Matchmaking states
  const [rooms, setRooms] = useState<DuelRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<DuelRoom | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [matchmaking, setMatchmaking] = useState(false);

  const left = duelsLeft(p);
  const pot = calculateDuelPot(stake, n);

  useEffect(() => {
    listDuelRooms().then(setRooms);
    const params = new URLSearchParams(window.location.search);
    const rCode = params.get("room")?.toUpperCase();
    if (rCode) {
      setJoinCodeInput(rCode);
    }
  }, []);

  // Poll active room when waiting for players
  useEffect(() => {
    if (!activeRoom) return;
    const t = setInterval(async () => {
      const list = await listDuelRooms();
      const found = list.find((r) => r.code === activeRoom.code);
      if (found) {
        setActiveRoom(found);
        if (found.status === "playing") {
          clearInterval(t);
          onStart({
            names: found.players.map((pl) => pl.name),
            mode: "online",
            stake: found.stake,
            category: found.category,
            roomCode: found.code,
          });
        }
      }
    }, 2500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoom?.code]);

  const myDisplayName = names[0]?.trim() || p.name || "Moi";

  async function handleCreateRoom() {
    if (stake > p.coins) {
      return void toast.error("Solde GDS insuffisant pour cette mise. Recharge ton Wallet !");
    }
    sfx.click();
    const code = "QB" + Math.random().toString(36).substring(2, 6).toUpperCase();
    const room: DuelRoom = {
      code,
      hostId: p.id,
      hostName: myDisplayName,
      category,
      stake,
      maxPlayers: n,
      status: "waiting",
      players: [{ id: p.id, name: myDisplayName, score: 0, finished: false }],
      questionIds: [],
      createdAt: new Date().toISOString(),
    };
    await saveDuelRoom(room);
    setActiveRoom(room);
    setRooms(await listDuelRooms());
    toast.success(`Salon ${code} créé ! Invite tes adversaires ou lance le matchmaking.`);
  }

  async function handleJoinRoom(codeRaw?: string) {
    const code = (codeRaw ?? joinCodeInput).trim().toUpperCase();
    if (!code) return void toast.error("Entre un code de salon");
    const list = await listDuelRooms();
    const room = list.find((r) => r.code === code);
    if (!room) return void toast.error("Salon introuvable");
    if (room.stake > p.coins) {
      return void toast.error(`Ce salon demande une mise de ${room.stake} GDS.`);
    }
    if (!room.players.some((pl) => pl.id === p.id)) {
      if (room.players.length >= room.maxPlayers) {
        return void toast.error("Ce salon est complet (4/4)");
      }
      room.players.push({ id: p.id, name: myDisplayName, score: 0, finished: false });
      await saveDuelRoom(room);
    }
    setN(room.maxPlayers);
    setStake(room.stake);
    setCategory(room.category);
    setActiveRoom({ ...room });
    toast.success(`Tu as rejoint le salon ${code} !`);
  }

  async function handleFillAndStartRoom() {
    if (!activeRoom) return;
    const updated = { ...activeRoom, players: [...activeRoom.players] };
    const availRivals = shuffle(RIVAL_NAMES);
    let rIdx = 0;
    while (updated.players.length < updated.maxPlayers) {
      updated.players.push({
        id: `rival-${rIdx}`,
        name: availRivals[rIdx % availRivals.length]!,
        score: 0,
        finished: false,
        isBot: true,
      });
      rIdx++;
    }
    updated.status = "playing";
    await saveDuelRoom(updated);
    setActiveRoom(null);
    onStart({
      names: updated.players.map((pl) => pl.name),
      mode: "online",
      stake: updated.stake,
      category: updated.category,
      roomCode: updated.code,
    });
  }

  function handleQuickMatchmaking() {
    if (stake > p.coins) {
      return void toast.error("Solde GDS insuffisant. Recharge ton portefeuille !");
    }
    sfx.click();
    setMatchmaking(true);
    setTimeout(() => {
      const rivals = shuffle(RIVAL_NAMES).slice(0, n - 1);
      const matchPlayers = [myDisplayName, ...rivals];
      setMatchmaking(false);
      onStart({
        names: matchPlayers,
        mode: "online",
        stake,
        category,
      });
    }, 1500);
  }

  const finalLocalNames = names
    .slice(0, n)
    .map((x, i) => x.trim() || (i === 0 ? p.name || "Moi" : `Joueur ${i + 1}`));

  return (
    <div className="space-y-5 py-2 animate-pop">
      {/* Hero Banner with exact 25 GDS -> 45 GDS / 5 GDS site breakdown */}
      <div className="rounded-3xl bg-grad-candy p-6 text-secondary-foreground shadow-xl">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background/25 px-3 py-1 text-xs font-extrabold uppercase tracking-wider">
            <Swords className="h-3.5 w-3.5" /> Multijoueur 2 à 4 Joueurs
          </span>
          <span className="rounded-full bg-background/25 px-3 py-1 text-xs font-bold">
            Solde : {p.coins} GDS
          </span>
        </div>
        <h1 className="mt-3 text-3xl font-extrabold">Duel User vs User</h1>
        <p className="mt-1 text-sm font-semibold opacity-95">
          Affronte de 2 à 4 joueurs en quiz ! Exemple : à <b>25 GDS</b> chacun (2 joueurs = 50 GDS), le gagnant remporte <b>45 GDS</b> et le site prend <b>5 GDS</b>.
        </p>
      </div>

      {/* Active Waiting Room Modal/Card */}
      {activeRoom && (
        <div className="space-y-4 rounded-3xl border-2 border-primary bg-card p-5 shadow-glow animate-pop">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                Salon Multijoueur en attente
              </span>
              <h2 className="text-2xl font-extrabold">Code : {activeRoom.code}</h2>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                const url = `${window.location.origin}/duel?room=${activeRoom.code}`;
                navigator.clipboard.writeText(url);
                toast.success("Lien du salon copié !");
              }}
            >
              <Copy className="h-4 w-4" /> Copier lien
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: activeRoom.maxPlayers }).map((_, i) => {
              const pl = activeRoom.players[i];
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-bold ${
                    pl ? "border-primary/50 bg-primary/10 text-foreground" : "border-dashed border-border text-muted-foreground"
                  }`}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-background text-xs">
                    {i + 1}
                  </span>
                  <span className="truncate">{pl ? pl.name : "En attente d'un joueur…"}</span>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl bg-muted/60 p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span>Mise par joueur :</span>
              <b>{activeRoom.stake} GDS</b>
            </div>
            <div className="flex justify-between">
              <span>Cagnotte totale ({activeRoom.maxPlayers} joueurs) :</span>
              <b>{calculateDuelPot(activeRoom.stake, activeRoom.maxPlayers).totalPot} GDS</b>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Frais plateforme ({calculateDuelPot(activeRoom.stake, activeRoom.maxPlayers).commissionPct}%) :</span>
              <span>-{calculateDuelPot(activeRoom.stake, activeRoom.maxPlayers).siteFee} GDS</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-accent pt-1 border-t border-border">
              <span>🏆 Gain net du gagnant :</span>
              <span>{calculateDuelPot(activeRoom.stake, activeRoom.maxPlayers).winnerPayout} GDS</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              className="bg-success text-primary-foreground hover:bg-success/90"
              onClick={() => {
                const url = `${window.location.origin}/duel?room=${activeRoom.code}`;
                const winPot = calculateDuelPot(activeRoom.stake, activeRoom.maxPlayers).winnerPayout;
                shareWhatsApp(
                  `⚔️ Rejoins mon salon Duel sur QuizBoss (Code: ${activeRoom.code}) !\nMise: ${activeRoom.stake} GDS · Le gagnant remporte ${winPot} GDS 🏆\n👉 ${url}`,
                );
              }}
            >
              <Share2 className="h-4 w-4" /> Inviter WhatsApp
            </Button>
            <Button onClick={handleFillAndStartRoom}>
              <Play className="h-4 w-4" /> Lancer le match ({activeRoom.maxPlayers}J)
            </Button>
          </div>
          <button
            type="button"
            onClick={() => setActiveRoom(null)}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Quitter le salon
          </button>
        </div>
      )}

      {/* 1. Nombre de joueurs : Minimum 2, Maximum 4 */}
      <section className="space-y-2 rounded-2xl bg-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-extrabold">
            <Users className="h-4 w-4 text-primary" /> 1. Nombre de joueurs (Min 2 · Max 4)
          </h2>
          <span className="text-xs font-bold text-primary">{n} joueurs</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[2, 3, 4].map((k) => (
            <Button
              key={k}
              variant={n === k ? "default" : "secondary"}
              onClick={() => {
                sfx.click();
                setN(k);
              }}
              className="font-extrabold"
            >
              {k} Joueurs
            </Button>
          ))}
        </div>
      </section>

      {/* 2. Mise en GDS & Calculateur automatique de commission progressive */}
      <section className="space-y-3 rounded-2xl bg-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-extrabold">
            <Coins className="h-4 w-4 text-accent" /> 2. Mise par joueur (en GDS)
          </h2>
          <Link to="/portefeuille" className="text-xs font-bold text-primary hover:underline">
            + Déposer des GDS
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {STAKES.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={stake === s && !customStake ? "default" : "secondary"}
              onClick={() => {
                sfx.click();
                setStake(s);
                setCustomStake("");
              }}
              className="font-bold"
            >
              {s === 0 ? "Entraînement (0 GDS)" : `${s} GDS`}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={25}
            step={5}
            placeholder="Autre mise (ex: 75, 150, 300 GDS…)"
            value={customStake}
            onChange={(e) => {
              const v = e.target.value;
              setCustomStake(v);
              const parsed = parseInt(v, 10);
              if (!isNaN(parsed) && parsed >= 25) {
                setStake(parsed);
              }
            }}
          />
        </div>

        {/* Répartition transparente de la cagnotte */}
        <div className="rounded-2xl border border-primary/30 bg-background/60 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Mise de chaque joueur ({n} joueurs) :</span>
            <b className="text-foreground">
              {pot.stake} GDS × {pot.playerCount} = {pot.totalPot} GDS
            </b>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Commission du site ({pot.commissionPct}% progressif) :</span>
            <b className="text-destructive">−{pot.siteFee} GDS</b>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-2">
            <span className="flex items-center gap-1.5 text-sm font-extrabold">
              <Trophy className="h-4 w-4 text-accent" /> Gain du Gagnant :
            </span>
            <span className="text-xl font-extrabold text-accent">{pot.winnerPayout} GDS</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            💡 Plus la mise et le nombre de joueurs sont élevés, plus la cagnotte grimpe (commission plateforme progressive de 10% à 18%).
          </p>
        </div>

        {stake > p.coins && (
          <div className="flex items-center justify-between rounded-xl bg-destructive/15 p-3 text-xs">
            <span className="font-semibold text-destructive">
              Ton solde ({p.coins} GDS) est inférieur à la mise de {stake} GDS.
            </span>
            <Button size="sm" variant="secondary" asChild>
              <Link to="/portefeuille">
                <Wallet className="h-3.5 w-3.5" /> Recharger
              </Link>
            </Button>
          </div>
        )}
      </section>

      {/* 3. Mode de Confrontation */}
      <section className="space-y-2 rounded-2xl bg-card p-4">
        <h2 className="font-extrabold">3. Mode d'affrontement</h2>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => {
              sfx.click();
              setMode("online");
            }}
            className={`rounded-2xl border p-3 text-left transition-all ${
              mode === "online" ? "border-primary bg-primary/15 shadow-glow" : "border-border bg-background/40"
            }`}
          >
            <Globe className="h-4 w-4 text-primary mb-1" />
            <b className="block text-xs">En ligne (User vs User)</b>
            <p className="text-[10px] text-muted-foreground">Salon ou Matchmaking 2–4J</p>
          </button>
          <button
            type="button"
            onClick={() => {
              sfx.click();
              setMode("buzzer");
            }}
            className={`rounded-2xl border p-3 text-left transition-all ${
              mode === "buzzer" ? "border-primary bg-primary/15 shadow-glow" : "border-border bg-background/40"
            }`}
          >
            <Smartphone className="h-4 w-4 text-accent mb-1" />
            <b className="block text-xs">Buzzer Local</b>
            <p className="text-[10px] text-muted-foreground">Même écran · Le plus rapide</p>
          </button>
          <button
            type="button"
            onClick={() => {
              sfx.click();
              setMode("tour");
            }}
            className={`rounded-2xl border p-3 text-left transition-all ${
              mode === "tour" ? "border-primary bg-primary/15 shadow-glow" : "border-border bg-background/40"
            }`}
          >
            <Users className="h-4 w-4 text-secondary mb-1" />
            <b className="block text-xs">Tour par tour</b>
            <p className="text-[10px] text-muted-foreground">Chacun son tour</p>
          </button>
        </div>

        {mode === "online" ? (
          <div className="mt-3 space-y-2">
            <Input
              placeholder="Ton pseudo de joueur (ex: BossHaiti)"
              value={names[0]}
              maxLength={18}
              onChange={(e) => setNames([e.target.value, names[1] ?? "", names[2] ?? "", names[3] ?? ""])}
            />
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {Array.from({ length: n }).map((_, i) => (
              <Input
                key={i}
                placeholder={i === 0 ? `${p.name || "Moi"} (ton portefeuille)` : `Joueur ${i + 1}`}
                value={names[i]}
                maxLength={16}
                onChange={(e) => setNames(names.map((x, j) => (j === i ? e.target.value : x)))}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. Catégorie */}
      <section className="space-y-2 rounded-2xl bg-card p-4">
        <h2 className="font-extrabold">4. Catégorie du Quiz</h2>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Button
              key={c.id}
              size="sm"
              variant={category === c.id ? "default" : "secondary"}
              onClick={() => {
                sfx.click();
                setCategory(c.id);
              }}
            >
              {c.emoji} {c.label}
            </Button>
          ))}
        </div>
      </section>

      {/* Boutons d'action selon le mode */}
      {left <= 0 && stake === 0 ? (
        <div className="space-y-2 rounded-2xl bg-card p-4 text-center">
          <p className="font-semibold">
            Tu as utilisé tes {FREE_DUELS_PER_DAY} duels d'entraînement gratuits du jour.
          </p>
          <Button
            size="lg"
            className="w-full bg-success text-primary-foreground hover:bg-success/90"
            onClick={() => {
              shareWhatsApp(
                `⚔️ Je te défie en duel sur QuizBoss ! Mise 25 GDS et gagne 45 GDS 👉 ${window.location.origin}/duel?ref=${p.id}`,
              );
              unlockDuelsByShare();
              toast.success(`+${SHARE_DUEL_BONUS} duels débloqués !`);
            }}
          >
            <Share2 /> Partager sur WhatsApp (+{SHARE_DUEL_BONUS} duels)
          </Button>
        </div>
      ) : mode === "online" ? (
        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full text-base font-extrabold shadow-glow"
            disabled={stake > p.coins || matchmaking}
            onClick={handleQuickMatchmaking}
          >
            <Swords className="h-5 w-5" />
            {matchmaking
              ? `Recherche de ${n - 1} adversaire(s)…`
              : `Match Rapide (${n} Joueurs · Gain ${pot.winnerPayout} GDS)`}
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              disabled={stake > p.coins}
              onClick={handleCreateRoom}
              className="font-bold"
            >
              <Plus className="h-4 w-4" /> Créer un Salon privé
            </Button>
            <div className="flex gap-1">
              <Input
                placeholder="Code ex: QB1234"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                className="uppercase font-mono text-xs"
              />
              <Button variant="outline" onClick={() => handleJoinRoom()}>
                Rejoindre
              </Button>
            </div>
          </div>

          {rooms.filter((r) => r.status === "waiting").length > 0 && (
            <div className="rounded-2xl bg-card p-4 space-y-2">
              <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                Salons publics ouverts
              </p>
              {rooms
                .filter((r) => r.status === "waiting")
                .slice(0, 4)
                .map((r) => {
                  const rPot = calculateDuelPot(r.stake, r.maxPlayers);
                  return (
                    <div
                      key={r.code}
                      className="flex items-center justify-between rounded-xl border border-border bg-background/40 p-2.5 text-xs"
                    >
                      <div>
                        <b className="font-mono text-primary">{r.code}</b> · Hôte : <b>{r.hostName}</b>
                        <p className="text-muted-foreground">
                          {r.players.length}/{r.maxPlayers} joueurs · Mise {r.stake} GDS → Gain{" "}
                          <b className="text-accent">{rPot.winnerPayout} GDS</b>
                        </p>
                      </div>
                      <Button size="sm" onClick={() => handleJoinRoom(r.code)}>
                        Rejoindre
                      </Button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      ) : (
        <Button
          size="lg"
          className="w-full text-base font-extrabold"
          disabled={stake > p.coins}
          onClick={() =>
            onStart({
              names: finalLocalNames,
              mode,
              stake,
              category,
            })
          }
        >
          <Swords /> Lancer le duel local ({n} joueurs · Gain {pot.winnerPayout} GDS)
        </Button>
      )}
    </div>
  );
}

function Game({
  setup,
  questions,
  onExit,
}: {
  setup: Setup;
  questions: QuizQuestion[];
  onExit: () => void;
}) {
  const { names, mode, stake } = setup;
  const pot = calculateDuelPot(stake, names.length);
  const TIME = mode === "online" ? 12 : mode === "buzzer" ? 12 : 14;
  const [idx, setIdx] = useState(0);
  const [scores, setScores] = useState<number[]>(names.map(() => 0));
  const [buzzed, setBuzzed] = useState<number | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [time, setTime] = useState(TIME);
  const [done, setDone] = useState(false);

  const q = questions[idx]!;
  const turnPlayer = mode === "tour" ? idx % names.length : mode === "online" ? 0 : buzzed;
  const canAnswer = mode === "online" || mode === "tour" || buzzed !== null;

  useQuizBgm(!done, true);

  useEffect(() => {
    if (done || picked !== null) return;
    if (time <= 0) {
      sfx.timeout();
      resolve(-1);
      return;
    }
    if (time <= 4) sfx.tick(time <= 2);
    const t = setTimeout(() => setTime((x) => x - 1), 1000);
    return () => clearTimeout(t);
  });

  function next() {
    if (idx + 1 >= questions.length) {
      setDone(true);
      return;
    }
    setIdx((x) => x + 1);
    setBuzzed(null);
    setPicked(null);
    setTime(TIME);
  }

  function resolve(i: number) {
    if (picked !== null) return;
    setPicked(i);

    if (mode === "online") {
      const ok = i === q.correct_index;
      if (ok) sfx.correct(2);
      else if (i !== -1) sfx.wrong();
      const myDelta = ok ? 80 + time * 8 + (q.difficulty ?? 1) * 15 : 0;

      // Simulate rival players' answers in real-time competitive range
      setScores((prev) =>
        prev.map((val, pIndex) => {
          if (pIndex === 0) return val + myDelta;
          // Rival accuracy depends slightly on question difficulty
          const rivalHitChance = Math.max(0.42, 0.78 - ((q.difficulty ?? 1) - 1) * 0.08);
          const rivalOk = Math.random() < rivalHitChance;
          if (!rivalOk) return val;
          const rivalSpeed = Math.max(2, Math.floor(Math.random() * (TIME - 2)));
          return val + 80 + rivalSpeed * 7 + (q.difficulty ?? 1) * 12;
        }),
      );
      setTimeout(next, 1400);
      return;
    }

    const who = turnPlayer;
    if (who !== null && who !== undefined) {
      const ok = i === q.correct_index;
      if (ok) sfx.correct(2);
      else if (i !== -1) sfx.wrong();
      const delta = ok
        ? mode === "buzzer"
          ? 100 + time * 5
          : 50 + time * 10
        : mode === "buzzer"
          ? -50
          : 0;
      setScores((s) => s.map((v, j) => (j === who ? v + delta : v)));
    } else {
      sfx.wrong();
    }
    setTimeout(next, 1400);
  }

  useEffect(() => {
    if (!done) return;
    const top = Math.max(...scores);
    const winners = scores.map((s, i) => (s === top ? i : -1)).filter((i) => i >= 0);
    if (winners.length === 1 && winners[0] === 0) {
      sfx.win();
      if (stake > 0) {
        addCoins(
          pot.winnerPayout,
          `Victoire Duel (${names.length}J · Pot ${pot.totalPot} GDS − ${pot.siteFee} GDS site)`,
          "duel",
          (p) => ({ xp: p.xp + 60, gamesPlayed: p.gamesPlayed + 1 }),
        );
      }
    } else if (winners.includes(0)) {
      sfx.win();
      if (stake > 0) {
        const splitPayout = Math.floor(pot.winnerPayout / winners.length);
        addCoins(splitPayout, `Duel ex-aequo · Gain partagé (${splitPayout} GDS)`, "duel");
      }
    } else {
      sfx.lose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  if (done) {
    const ranking = names
      .map((n, i) => ({ n, s: scores[i]!, i }))
      .sort((a, b) => b.s - a.s);
    const champ = ranking[0]!;
    const iWon = champ.i === 0;
    const text = `⚔️ Duel QuizBoss (${names.length} joueurs) : ${champ.n} remporte ${pot.winnerPayout} GDS avec ${champ.s} pts ! ${ranking
      .slice(1)
      .map((r) => `${r.n} (${r.s} pts)`)
      .join(" · ")}\nViens nous défier 👉 ${window.location.origin}/duel`;

    return (
      <div className="space-y-4 py-4 animate-pop">
        <div className="rounded-3xl bg-grad-candy p-6 text-center text-secondary-foreground shadow-xl">
          <p className="text-6xl">{iWon ? "🏆" : "⚔️"}</p>
          <h1 className="mt-2 text-3xl font-extrabold">{champ.n} gagne le duel !</h1>
          {stake > 0 && (
            <div className="mt-3 inline-flex flex-col rounded-2xl bg-background/25 px-4 py-2 text-xs font-bold">
              <span>Pot total : {pot.totalPot} GDS ({stake} GDS × {names.length})</span>
              <span>Commission plateforme : −{pot.siteFee} GDS</span>
              <span className="mt-1 text-base font-extrabold text-accent">
                Gain remporté : +{pot.winnerPayout} GDS
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {ranking.map((r, k) => (
            <div
              key={r.i}
              className={`flex items-center justify-between rounded-2xl p-4 font-bold ${
                k === 0 ? "border border-accent bg-accent/15" : "bg-card"
              }`}
            >
              <span>
                {["🥇", "🥈", "🥉", "4️⃣"][k]} {r.n}
              </span>
              <div className="flex items-center gap-3">
                {k === 0 && stake > 0 && (
                  <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs text-accent-foreground">
                    +{pot.winnerPayout} GDS
                  </span>
                )}
                <span className="text-accent">{r.s} pts</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            size="lg"
            className="bg-success text-primary-foreground hover:bg-success/90"
            onClick={() => shareWhatsApp(text)}
          >
            <Share2 /> WhatsApp
          </Button>
          <Button size="lg" onClick={onExit}>
            <Swords /> Nouveau duel
          </Button>
        </div>
      </div>
    );
  }

  const diff = difficultyBadge(q.difficulty ?? 2);

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center justify-between text-xs font-bold">
        <span className="flex items-center gap-1.5">
          <span>
            ⚔️{" "}
            {mode === "online"
              ? "Duel En Ligne"
              : mode === "buzzer"
                ? "Buzzer"
                : "Tour par tour"}
          </span>
          {stake > 0 && (
            <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-accent">
              Gain : {pot.winnerPayout} GDS
            </span>
          )}
        </span>
        <span className="flex items-center gap-2 text-muted-foreground">
          {idx + 1}/{questions.length}
          <MuteButton />
        </span>
      </div>

      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${names.length}, minmax(0, 1fr))` }}
      >
        {names.map((n, i) => (
          <div
            key={i}
            className={`rounded-xl p-2 text-center text-xs font-bold text-secondary-foreground ${
              COLORS[i % COLORS.length]
            } ${turnPlayer === i || mode === "online" ? "ring-2 ring-foreground" : "opacity-80"}`}
          >
            <p className="truncate">{n}</p>
            <p className="text-base font-extrabold">{scores[i]}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Timer className={`h-5 w-5 ${time <= 4 ? "text-destructive animate-bounce" : "text-primary"}`} />
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              time <= 4 ? "bg-destructive" : "bg-grad-lime"
            }`}
            style={{ width: `${(time / TIME) * 100}%` }}
          />
        </div>
        <span className="w-7 text-right font-extrabold tabular-nums">{time}s</span>
      </div>

      <div key={q.id} className="rounded-3xl bg-card p-5 animate-pop">
        <div className="flex items-center justify-between">
          {mode !== "online" && turnPlayer !== null && turnPlayer !== undefined ? (
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              À toi : {names[turnPlayer]}
            </p>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Question {idx + 1} · Réponds le plus vite !
            </span>
          )}
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${diff.cls}`}>
            {diff.label}
          </span>
        </div>
        <h2 className="mt-2 text-lg font-bold leading-snug">{q.question}</h2>
      </div>

      {canAnswer ? (
        <div className="grid gap-2.5">
          {q.options.map((o, i) => {
            const st =
              picked === null
                ? "bg-card hover:bg-muted active:scale-[0.98]"
                : i === q.correct_index
                  ? "bg-success text-primary-foreground"
                  : i === picked
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-card opacity-50";
            return (
              <button
                key={i}
                disabled={picked !== null}
                onClick={() => resolve(i)}
                className={`flex items-center gap-3 rounded-2xl border border-border p-3.5 text-left font-semibold transition-all ${st}`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-background/30 font-bold">
                  {"ABCD"[i]}
                </span>
                {o}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {names.map((n, i) => (
            <button
              key={i}
              onClick={() => {
                sfx.buzz();
                setBuzzed(i);
              }}
              className={`${
                COLORS[i % COLORS.length]
              } aspect-[4/3] rounded-3xl text-xl font-extrabold text-secondary-foreground shadow-lg transition-transform active:scale-90`}
            >
              🔔
              <br />
              {n}
            </button>
          ))}
          <p className="col-span-2 text-center text-xs text-muted-foreground">
            Lisez la question, puis buzzez le plus vite possible !
          </p>
        </div>
      )}
    </div>
  );
}
