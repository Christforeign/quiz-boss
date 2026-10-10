import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
  Play,
  Wallet,
  Lock,
  Unlock,
  Search,
  UserCheck,
  Gift,
  BellRing,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, shareWhatsApp } from "@/lib/categories";
import {
  addCoins,
  consumeDuel,
  duelsLeft,
  FREE_DUELS_PER_DAY,
  levelFromXp,
  SHARE_DUEL_BONUS,
  unlockDuelsByShare,
  updatePlayer,
  usePlayer,
} from "@/lib/player";
import {
  calculateDuelPot,
  fetchAllRegisteredPlayers,
  listDuelRooms,
  registerPlayerInDirectory,
  saveDuelRoom,
  triggerPostGameMonetagAd,
  useSettings,
  type DuelRoom,
  type RegisteredPlayer,
} from "@/lib/site";
import { sfx, useQuizBgm } from "@/lib/sound";
import { MuteButton } from "@/components/MuteButton";
import { AdSlot, LocalBanner } from "@/components/Ads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { difficultyBadge, type QuizQuestion } from "@/lib/hardQuestions";
import { markQuestionsSeen, selectCatalogQuestions } from "@/lib/infiniteQuizCatalog";

export const Route = createFileRoute("/duel")({
  head: () => ({
    meta: [
      { title: "Duel Multijoueur (2 à 4 vrais joueurs) — QuizBoss" },
      {
        name: "description",
        content:
          "Affronte 2 à 4 vrais joueurs en duel quiz ! Clique sur le buzzer pour répondre. Mise 25 GDS chacun, le gagnant remporte 45 GDS.",
      },
      { property: "og:title", content: "Duel Multijoueur GDS — QuizBoss" },
      {
        property: "og:description",
        content: "Duel en temps réel entre vrais joueurs du site · 2 à 4 joueurs.",
      },
    ],
  }),
  component: DuelPage,
});

type Mode = "online" | "buzzer" | "tour";
type Setup = {
  names: string[];
  playerIds?: string[];
  myPlayerIndex: number;
  mode: Mode;
  stake: number;
  category: string;
  roomCode?: string;
  presetQuestions?: QuizQuestion[];
};

const COLORS = ["bg-grad-lime", "bg-grad-sunset", "bg-grad-ocean", "bg-grad-candy"];
const STAKES = [25, 50, 100, 250, 500, 1000, 0];

function shuffle<T>(a: T[]) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j] as T, b[i] as T];
  }
  return b;
}

async function buildDuelQuestions(
  category: string,
  stake: number,
  count: number,
): Promise<QuizQuestion[]> {
  let q = supabase
    .from("questions")
    .select("id,category,question,options,correct_index,lang,image_url,difficulty");
  if (category !== "mix") q = q.eq("category", category);
  const { data } = await q;
  const minDiff = stake >= 25 ? 2 : 1;
  const pool = selectCatalogQuestions((data ?? []) as QuizQuestion[], category, minDiff);

  return shuffle(pool)
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
}

function DuelPage() {
  const [setup, setSetup] = useState<Setup | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [gameKey, setGameKey] = useState(0);

  async function start(s: Setup) {
    const count = s.mode === "tour" ? s.names.length * 3 : 10;
    const qs =
      s.presetQuestions && s.presetQuestions.length >= 3
        ? s.presetQuestions
        : await buildDuelQuestions(s.category, s.stake, count);

    if (qs.length < 3) return void toast.error("Pas assez de questions dans cette catégorie.");
    markQuestionsSeen(qs.map((item) => item.id));
    if (s.stake === 0) {
      consumeDuel();
    } else if (s.stake > 0) {
      addCoins(-s.stake, `Mise Duel (${s.names.length} joueurs · ${s.stake} GDS/joueur)`, "duel");
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
  const [names, setNames] = useState<string[]>([p.name || "", "", "", ""]);
  const [mode, setMode] = useState<Mode>("online");
  const [stake, setStake] = useState(25);
  const [customStake, setCustomStake] = useState("");
  const [category, setCategory] = useState("mix");

  // Salons en ligne & Annuaire des VRAIS utilisateurs uniquement
  const [rooms, setRooms] = useState<DuelRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<DuelRoom | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [registeredPlayers, setRegisteredPlayers] = useState<RegisteredPlayer[]>([]);
  const [playerSearch, setPlayerSearch] = useState("");
  const [selectedRivals, setSelectedRivals] = useState<string[]>([]);
  const [startingRoom, setStartingRoom] = useState(false);

  const left = duelsLeft(p);
  const pot = calculateDuelPot(stake, n);
  const myDisplayName = names[0]?.trim() || p.name || `Joueur_${p.id.slice(0, 4)}`;

  useEffect(() => {
    const refreshLobby = async () => {
      const [rList, pList] = await Promise.all([listDuelRooms(), fetchAllRegisteredPlayers()]);
      setRooms(rList);
      setRegisteredPlayers(pList);
    };
    refreshLobby();
    const interval = setInterval(refreshLobby, 4000);

    if (p.name?.trim()) {
      registerPlayerInDirectory({
        id: p.id,
        pseudo: p.name.trim(),
        level: levelFromXp(p.xp),
      });
    }
    const params = new URLSearchParams(window.location.search);
    const rCode = params.get("room")?.toUpperCase();
    if (rCode) {
      setJoinCodeInput(rCode);
    }

    const ch = supabase
      .channel("quizboss-duel-lobby-view")
      .on("broadcast", { event: "room-updated" }, () => {
        refreshLobby();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(ch);
    };
  }, [p.id, p.name, p.xp]);

  // Synchronisation en temps réel de la chambre active (aucun bot, uniquement vrais joueurs)
  useEffect(() => {
    if (!activeRoom) return;
    const roomChannel = supabase
      .channel(`quizboss-room-${activeRoom.code}`)
      .on("broadcast", { event: "room-sync" }, ({ payload }) => {
        if (payload?.room) {
          setActiveRoom(payload.room as DuelRoom);
        }
      })
      .on("broadcast", { event: "room-start" }, ({ payload }) => {
        if (!payload?.room) return;
        const startedRoom = payload.room as DuelRoom;
        const myIdx = Math.max(
          0,
          startedRoom.players.findIndex((pl) => pl.id === p.id || pl.name === myDisplayName),
        );
        setActiveRoom(null);
        onStart({
          names: startedRoom.players.map((pl) => pl.name),
          playerIds: startedRoom.players.map((pl) => pl.id),
          myPlayerIndex: myIdx,
          mode: "online",
          stake: startedRoom.stake,
          category: startedRoom.category,
          roomCode: startedRoom.code,
          presetQuestions: payload.questions as QuizQuestion[] | undefined,
        });
      })
      .subscribe();

    const pollTimer = setInterval(async () => {
      const list = await listDuelRooms();
      const found = list.find((r) => r.code === activeRoom.code);
      if (found) {
        setActiveRoom(found);
        if (found.status === "playing" && found.players.length >= 2) {
          clearInterval(pollTimer);
          const myIdx = Math.max(
            0,
            found.players.findIndex((pl) => pl.id === p.id || pl.name === myDisplayName),
          );
          setActiveRoom(null);
          onStart({
            names: found.players.map((pl) => pl.name),
            playerIds: found.players.map((pl) => pl.id),
            myPlayerIndex: myIdx,
            mode: "online",
            stake: found.stake,
            category: found.category,
            roomCode: found.code,
          });
        }
      }
    }, 2000);

    return () => {
      clearInterval(pollTimer);
      supabase.removeChannel(roomChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoom?.code, p.id, myDisplayName]);

  async function saveMyPseudo(newPseudo: string) {
    setNames([newPseudo, names[1] ?? "", names[2] ?? "", names[3] ?? ""]);
    if (newPseudo.trim().length >= 2) {
      updatePlayer(() => ({ name: newPseudo.trim() }));
      await registerPlayerInDirectory({
        id: p.id,
        pseudo: newPseudo.trim(),
        level: levelFromXp(p.xp),
      });
      setRegisteredPlayers(await fetchAllRegisteredPlayers());
    }
  }

  async function handleCreateRoom(visibility: "public" | "private", targetPseudo?: string) {
    if (stake === 0 && left <= 0) {
      return void toast.error(
        "Tu as déjà utilisé ta partie multijoueur gratuite du jour. Partage sur WhatsApp ou mise en GDS !",
      );
    }
    if (stake > p.coins) {
      return void toast.error(
        "Solde GDS insuffisant pour cette mise. Effectue un dépôt dans ton Wallet !",
      );
    }
    sfx.click();
    const code = "QB" + Math.random().toString(36).substring(2, 6).toUpperCase();
    const invited = targetPseudo
      ? Array.from(new Set([targetPseudo, ...selectedRivals]))
      : selectedRivals;

    const room: DuelRoom = {
      code,
      hostId: p.id,
      hostName: myDisplayName,
      category,
      stake,
      maxPlayers: n,
      visibility,
      invitedPseudos: invited,
      status: "waiting",
      players: [{ id: p.id, name: myDisplayName, score: 0, finished: false }],
      questionIds: [],
      createdAt: new Date().toISOString(),
    };
    await saveDuelRoom(room);
    setActiveRoom(room);
    setRooms(await listDuelRooms());

    // Envoyer une invitation en direct aux vrais joueurs ciblés
    if (invited.length > 0) {
      try {
        const ch = supabase.channel("quizboss-duel-lobby");
        ch.subscribe((status) => {
          if (status === "SUBSCRIBED") {
            invited.forEach((pseudo) => {
              ch.send({
                type: "broadcast",
                event: "duel-challenge",
                payload: {
                  roomCode: code,
                  hostId: p.id,
                  hostName: myDisplayName,
                  targetPseudo: pseudo,
                  stake,
                  maxPlayers: n,
                },
              });
            });
            setTimeout(() => supabase.removeChannel(ch), 800);
          }
        });
      } catch {
        // ignore
      }
    }

    toast.success(
      targetPseudo
        ? `Défi envoyé à ${targetPseudo} ! En attente qu'il/elle rejoigne la chambre ${code}.`
        : visibility === "public"
          ? `Chambre libre ${code} ouverte aux vrais joueurs du site !`
          : `Chambre privée ${code} créée ! Partage le code à tes amis.`,
    );
  }

  async function handleJoinRoom(codeRaw?: string) {
    const code = (codeRaw ?? joinCodeInput).trim().toUpperCase();
    if (!code) return void toast.error("Entre un code de chambre");
    const list = await listDuelRooms();
    const room = list.find((r) => r.code === code);
    if (!room) return void toast.error("Chambre introuvable");
    if (room.stake === 0 && left <= 0) {
      return void toast.error("Partie gratuite déjà utilisée aujourd'hui.");
    }
    if (room.stake > p.coins) {
      return void toast.error(`Cette chambre demande une mise de ${room.stake} GDS.`);
    }
    if (!room.players.some((pl) => pl.id === p.id)) {
      if (room.players.length >= room.maxPlayers) {
        return void toast.error("Cette chambre est déjà complète");
      }
      room.players.push({ id: p.id, name: myDisplayName, score: 0, finished: false });
      await saveDuelRoom(room);

      try {
        const roomChannel = supabase.channel(`quizboss-room-${room.code}`);
        roomChannel.subscribe((status) => {
          if (status === "SUBSCRIBED") {
            roomChannel
              .send({
                type: "broadcast",
                event: "room-sync",
                payload: { room },
              })
              .finally(() => {
                setTimeout(() => supabase.removeChannel(roomChannel), 600);
              });
          }
        });
      } catch {
        // ignore
      }
    }
    setN(room.maxPlayers);
    setStake(room.stake);
    setCategory(room.category);
    setActiveRoom({ ...room });
    toast.success(`Tu as rejoint la chambre ${code} avec ${room.hostName} !`);
  }

  async function handleStartRealRoom() {
    if (!activeRoom) return;
    if (activeRoom.players.length < 2) {
      return void toast.error(
        "Il faut au minimum 2 vrais joueurs dans la chambre pour lancer le duel ! Invite un joueur ou attends qu'il rejoigne.",
      );
    }
    setStartingRoom(true);
    const qs = await buildDuelQuestions(activeRoom.category, activeRoom.stake, 10);
    const updated: DuelRoom = {
      ...activeRoom,
      maxPlayers: activeRoom.players.length,
      status: "playing",
      questionIds: qs.map((q) => q.id),
    };
    await saveDuelRoom(updated);

    try {
      const roomChannel = supabase.channel(`quizboss-room-${updated.code}`);
      roomChannel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          roomChannel
            .send({
              type: "broadcast",
              event: "room-start",
              payload: { room: updated, questions: qs },
            })
            .finally(() => {
              setTimeout(() => supabase.removeChannel(roomChannel), 800);
            });
        }
      });
    } catch {
      // ignore
    }

    const myIdx = Math.max(
      0,
      updated.players.findIndex((pl) => pl.id === p.id || pl.name === myDisplayName),
    );
    setStartingRoom(false);
    setActiveRoom(null);
    onStart({
      names: updated.players.map((pl) => pl.name),
      playerIds: updated.players.map((pl) => pl.id),
      myPlayerIndex: myIdx,
      mode: "online",
      stake: updated.stake,
      category: updated.category,
      roomCode: updated.code,
      presetQuestions: qs,
    });
  }

  function handleSelectPlayer(targetPseudo: string) {
    sfx.click();
    if (!selectedRivals.includes(targetPseudo)) {
      const nextRivals = [...selectedRivals, targetPseudo].slice(0, n - 1);
      setSelectedRivals(nextRivals);
      toast.success(`${targetPseudo} sélectionné (${nextRivals.length}/${n - 1})`);
    } else {
      setSelectedRivals(selectedRivals.filter((x) => x !== targetPseudo));
    }
  }

  const finalLocalNames = names
    .slice(0, n)
    .map((x, i) => x.trim() || (i === 0 ? myDisplayName : `Joueur ${i + 1}`));

  const otherPlayers = registeredPlayers.filter(
    (rp) =>
      rp.id !== p.id &&
      rp.pseudo.toLowerCase() !== myDisplayName.toLowerCase() &&
      rp.pseudo.toLowerCase().includes(playerSearch.trim().toLowerCase()),
  );

  return (
    <div className="space-y-5 py-2 animate-pop">
      {/* Hero Banner */}
      <div className="rounded-3xl bg-grad-candy p-6 text-secondary-foreground shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background/25 px-3 py-1 text-xs font-extrabold uppercase tracking-wider">
            <Swords className="h-3.5 w-3.5" /> Duel 100% Vrais Joueurs (2 à 4)
          </span>
          <span className="rounded-full bg-background/25 px-3 py-1 text-xs font-extrabold">
            Solde : {p.coins} GDS
          </span>
        </div>
        <h1 className="mt-3 text-3xl font-extrabold">Duel User vs User</h1>
        <p className="mt-1 text-xs font-semibold opacity-95">
          Affronte uniquement les <b>vrais joueurs</b> du site ! Dès que la question s'affiche, le
          joueur qui connaît la réponse <b>clique sur le bouton Buzzer</b> et choisit sa réponse :
          les autres perdent ! Si aucun joueur ne répond, la manche est <b>nulle</b>.
        </p>

        {/* Partie Multijoueur Gratuite */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-background/20 px-3.5 py-2 text-xs">
          <span className="flex items-center gap-1.5 font-extrabold">
            <Gift className="h-4 w-4" />
            {left > 0
              ? `🎁 Tu as ${left} partie multijoueur gratuite disponible !`
              : "Partie gratuite du jour utilisée (partage sur WhatsApp pour +3 parties gratuites)"}
          </span>
          {left > 0 && stake !== 0 && (
            <button
              type="button"
              onClick={() => {
                sfx.click();
                setStake(0);
                setCustomStake("");
                toast.success("🎁 Mode Partie Multijoueur Gratuite (0 GDS) activé !");
              }}
              className="rounded-full bg-background px-3 py-1 font-extrabold text-foreground shadow transition-transform active:scale-95"
            >
              Jouer ma partie gratuite
            </button>
          )}
        </div>
      </div>

      {/* Chambre active (Libre ou Privée — attente des vrais joueurs) */}
      {activeRoom && (
        <div className="space-y-4 rounded-3xl border-2 border-primary bg-card p-5 shadow-glow animate-pop">
          <div className="flex items-center justify-between">
            <div>
              <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-primary">
                {activeRoom.visibility === "private" ? (
                  <>
                    <Lock className="h-3.5 w-3.5" /> Chambre Privée (Vrais joueurs)
                  </>
                ) : (
                  <>
                    <Unlock className="h-3.5 w-3.5" /> Chambre Libre (Vrais joueurs)
                  </>
                )}
              </span>
              <h2 className="text-2xl font-extrabold">Code : {activeRoom.code}</h2>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                const url = `${window.location.origin}/duel?room=${activeRoom.code}`;
                navigator.clipboard.writeText(url);
                toast.success("Lien de la chambre copié !");
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
                    pl
                      ? "border-primary/50 bg-primary/10 text-foreground"
                      : "border-dashed border-border text-muted-foreground animate-pulse"
                  }`}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-background text-xs">
                    {i + 1}
                  </span>
                  <span className="truncate">
                    {pl ? `${pl.name} ✓` : "En attente d'un vrai joueur…"}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl bg-muted/60 p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span>Mise par joueur :</span>
              <b>
                {activeRoom.stake === 0 ? "🎁 Partie Gratuite (0 GDS)" : `${activeRoom.stake} GDS`}
              </b>
            </div>
            <div className="flex justify-between">
              <span>Joueurs connectés dans la chambre :</span>
              <b>
                {activeRoom.players.length} / {activeRoom.maxPlayers} vrais joueurs
              </b>
            </div>
            {activeRoom.stake > 0 && (
              <>
                <div className="flex justify-between text-muted-foreground">
                  <span>
                    Frais plateforme (
                    {
                      calculateDuelPot(activeRoom.stake, Math.max(2, activeRoom.players.length))
                        .commissionPct
                    }
                    %) :
                  </span>
                  <span>
                    −
                    {
                      calculateDuelPot(activeRoom.stake, Math.max(2, activeRoom.players.length))
                        .siteFee
                    }{" "}
                    GDS
                  </span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-accent pt-1 border-t border-border">
                  <span>🏆 Gain net du gagnant :</span>
                  <span>
                    {
                      calculateDuelPot(activeRoom.stake, Math.max(2, activeRoom.players.length))
                        .winnerPayout
                    }{" "}
                    GDS
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              className="bg-success text-primary-foreground hover:bg-success/90"
              onClick={() => {
                const url = `${window.location.origin}/duel?room=${activeRoom.code}`;
                const winPot = calculateDuelPot(
                  activeRoom.stake,
                  activeRoom.maxPlayers,
                ).winnerPayout;
                shareWhatsApp(
                  `⚔️ Rejoins ma chambre Duel sur QuizBoss (Code: ${activeRoom.code}) !\n${
                    activeRoom.stake > 0
                      ? `Mise: ${activeRoom.stake} GDS · Le gagnant remporte ${winPot} GDS 🏆`
                      : "🎁 Partie Multijoueur Gratuite !"
                  }\n👉 ${url}`,
                );
              }}
            >
              <Share2 className="h-4 w-4" /> Inviter WhatsApp
            </Button>
            <Button
              disabled={activeRoom.players.length < 2 || startingRoom}
              onClick={handleStartRealRoom}
            >
              <Play className="h-4 w-4" />
              {activeRoom.players.length < 2
                ? `Attente joueurs (${activeRoom.players.length}/2 min)`
                : startingRoom
                  ? "Lancement…"
                  : `Démarrer (${activeRoom.players.length} joueurs)`}
            </Button>
          </div>
          <button
            type="button"
            onClick={() => setActiveRoom(null)}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Quitter / Fermer la chambre
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
                setSelectedRivals((prev) => prev.slice(0, k - 1));
              }}
              className="font-extrabold"
            >
              {k} Joueurs
            </Button>
          ))}
        </div>
      </section>

      {/* 2. Mise en GDS : Choix affiché OU saisie manuelle OU Partie Gratuite */}
      <section className="space-y-3 rounded-2xl bg-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-extrabold">
            <Coins className="h-4 w-4 text-accent" /> 2. Mise par joueur (Choisir ou saisir)
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
              {s === 0 ? `🎁 0 GDS (${left} Gratuite)` : `${s} GDS`}
            </Button>
          ))}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-muted-foreground">
            Ou saisir une mise manuelle (minimum 25 GDS) :
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={25}
              placeholder="Saisis ton montant en GDS (ex: 35, 75, 150, 400…)"
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
            {customStake && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCustomStake("");
                  setStake(25);
                }}
              >
                25 GDS
              </Button>
            )}
          </div>
        </div>

        {/* Répartition de la cagnotte */}
        <div className="rounded-2xl border border-primary/30 bg-background/60 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Total misé ({n} joueurs) :</span>
            <b className="text-foreground">
              {pot.stake === 0
                ? "🎁 Partie Multijoueur Gratuite (0 GDS)"
                : `${pot.stake} GDS × ${pot.playerCount} = ${pot.totalPot} GDS`}
            </b>
          </div>
          {pot.stake > 0 && (
            <>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Frais du site ({pot.commissionPct}%) :</span>
                <b className="text-destructive">−{pot.siteFee} GDS</b>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2">
                <span className="flex items-center gap-1.5 text-sm font-extrabold">
                  <Trophy className="h-4 w-4 text-accent" /> Gain échangeable du Gagnant :
                </span>
                <span className="text-xl font-extrabold text-accent">{pot.winnerPayout} GDS</span>
              </div>
            </>
          )}
        </div>

        {stake > p.coins && (
          <div className="flex items-center justify-between rounded-xl bg-destructive/15 p-3 text-xs">
            <span className="font-semibold text-destructive">
              Ton solde échangeable ({p.coins} GDS) est inférieur à la mise de {stake} GDS.
            </span>
            <Button size="sm" variant="secondary" asChild>
              <Link to="/portefeuille">
                <Wallet className="h-3.5 w-3.5" /> Déposer
              </Link>
            </Button>
          </div>
        )}
      </section>

      {/* 3. Mode & Pseudo */}
      <section className="space-y-3 rounded-2xl bg-card p-4">
        <h2 className="font-extrabold">3. Ton Pseudo & Mode de jeu</h2>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => {
              sfx.click();
              setMode("online");
            }}
            className={`rounded-2xl border p-3 text-left transition-all ${
              mode === "online"
                ? "border-primary bg-primary/15 shadow-glow"
                : "border-border bg-background/40"
            }`}
          >
            <Globe className="mb-1 h-4 w-4 text-primary" />
            <b className="block text-xs">En Ligne</b>
            <p className="text-[10px] text-muted-foreground">Vrais joueurs du site</p>
          </button>
          <button
            type="button"
            onClick={() => {
              sfx.click();
              setMode("buzzer");
            }}
            className={`rounded-2xl border p-3 text-left transition-all ${
              mode === "buzzer"
                ? "border-primary bg-primary/15 shadow-glow"
                : "border-border bg-background/40"
            }`}
          >
            <Smartphone className="mb-1 h-4 w-4 text-accent" />
            <b className="block text-xs">Buzzer Local</b>
            <p className="text-[10px] text-muted-foreground">Même téléphone (2-4J)</p>
          </button>
          <button
            type="button"
            onClick={() => {
              sfx.click();
              setMode("tour");
            }}
            className={`rounded-2xl border p-3 text-left transition-all ${
              mode === "tour"
                ? "border-primary bg-primary/15 shadow-glow"
                : "border-border bg-background/40"
            }`}
          >
            <Users className="mb-1 h-4 w-4 text-secondary" />
            <b className="block text-xs">Tour par tour</b>
            <p className="text-[10px] text-muted-foreground">Chacun son tour</p>
          </button>
        </div>

        {mode === "online" ? (
          <div className="space-y-2">
            <Input
              placeholder="Ton pseudo public (ex: BossHaiti)"
              value={names[0]}
              maxLength={20}
              onChange={(e) => saveMyPseudo(e.target.value)}
            />
          </div>
        ) : (
          <div className="space-y-2">
            {Array.from({ length: n }).map((_, i) => (
              <Input
                key={i}
                placeholder={
                  i === 0 ? `${myDisplayName} (ton portefeuille)` : `Pseudo Joueur ${i + 1}`
                }
                value={names[i]}
                maxLength={18}
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

      {/* 5. Annuaire des VRAIS Comptes Joueurs (Pseudos) & Chambres Libres / Privées */}
      {mode === "online" && (
        <section className="space-y-4 rounded-2xl bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-extrabold">
              <UserCheck className="h-4 w-4 text-primary" /> 5. Vrais Joueurs inscrits & Chambres
            </h2>
            <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary">
              {otherPlayers.length} vrai{otherPlayers.length > 1 ? "s" : ""} joueur
              {otherPlayers.length > 1 ? "s" : ""}
            </span>
          </div>

          {/* Barre de recherche de pseudo */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher le pseudo d'un vrai joueur du site…"
              value={playerSearch}
              onChange={(e) => setPlayerSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {selectedRivals.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-primary/10 p-2.5 text-xs">
              <span className="font-bold text-primary">Joueurs invités :</span>
              {selectedRivals.map((rv) => (
                <span
                  key={rv}
                  className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 font-extrabold text-primary-foreground"
                >
                  {rv}
                  <button type="button" onClick={() => handleSelectPlayer(rv)}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Liste des VRAIS comptes joueurs uniquement (aucun bot) */}
          {otherPlayers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-background/40 p-4 text-center text-xs text-muted-foreground">
              <p className="font-bold text-foreground">
                Aucun autre vrai joueur détecté pour l'instant.
              </p>
              <p className="mt-1">
                Crée une <b>Chambre Libre</b> ou <b>Chambre Privée</b> ci-dessous et partage le lien
                à tes amis sur WhatsApp pour vous affronter en direct !
              </p>
            </div>
          ) : (
            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {otherPlayers.map((rp) => {
                const isSelected = selectedRivals.includes(rp.pseudo);
                return (
                  <div
                    key={rp.id}
                    className={`flex items-center justify-between rounded-xl border p-2.5 text-xs transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/15"
                        : "border-border bg-background/40 hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                          rp.online ? "bg-success" : "bg-muted-foreground/50"
                        }`}
                        title={rp.online ? "En ligne" : "Hors ligne"}
                      />
                      <div className="truncate">
                        <b className="text-sm">{rp.pseudo}</b>
                        <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                          Niv. {rp.level}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        variant={isSelected ? "default" : "secondary"}
                        onClick={() => handleSelectPlayer(rp.pseudo)}
                        className="h-7 px-2.5 text-xs font-bold"
                      >
                        {isSelected ? "Invité ✓" : "+ Inviter"}
                      </Button>
                      <Button
                        size="sm"
                        disabled={stake > p.coins}
                        onClick={() => handleCreateRoom("public", rp.pseudo)}
                        className="h-7 px-2.5 text-xs font-extrabold"
                      >
                        <Swords className="h-3 w-3" /> Défier
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Boutons Chambre Libre / Chambre Privée / Rejoindre par code */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              variant="secondary"
              disabled={stake > p.coins}
              onClick={() => handleCreateRoom("public")}
              className="font-bold text-xs"
            >
              <Unlock className="h-4 w-4 text-success" /> Créer Chambre Libre
            </Button>
            <Button
              variant="secondary"
              disabled={stake > p.coins}
              onClick={() => handleCreateRoom("private")}
              className="font-bold text-xs"
            >
              <Lock className="h-4 w-4 text-accent" /> Créer Chambre Privée
            </Button>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Entrer code chambre (ex: QB1234)"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              className="uppercase font-mono text-xs"
            />
            <Button variant="outline" onClick={() => handleJoinRoom()}>
              Rejoindre
            </Button>
          </div>

          {/* Liste des Chambres Libres ouvertes */}
          {rooms.filter((r) => r.status === "waiting" && r.visibility !== "private").length > 0 && (
            <div className="space-y-2 border-t border-border pt-3">
              <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                Chambres Libres ouvertes (
                {rooms.filter((r) => r.status === "waiting" && r.visibility !== "private").length})
              </p>
              {rooms
                .filter((r) => r.status === "waiting" && r.visibility !== "private")
                .slice(0, 6)
                .map((r) => {
                  const rPot = calculateDuelPot(r.stake, r.maxPlayers);
                  return (
                    <div
                      key={r.code}
                      className="flex items-center justify-between rounded-xl border border-border bg-background/40 p-2.5 text-xs"
                    >
                      <div>
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-primary">
                          <Unlock className="h-3 w-3" /> {r.code}
                        </span>{" "}
                        · Hôte : <b>{r.hostName}</b>
                        <p className="text-muted-foreground">
                          {r.players.length}/{r.maxPlayers} vrais joueurs ·{" "}
                          {r.stake === 0 ? (
                            <b className="text-primary">🎁 Partie Gratuite</b>
                          ) : (
                            <>
                              Mise {r.stake} GDS → Gain{" "}
                              <b className="text-accent">{rPot.winnerPayout} GDS</b>
                            </>
                          )}
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
        </section>
      )}

      {/* Bouton principal de lancement */}
      {left <= 0 && stake === 0 ? (
        <div className="space-y-2 rounded-2xl bg-card p-4 text-center">
          <p className="font-semibold">
            Tu as utilisé ta {FREE_DUELS_PER_DAY} partie multijoueur gratuite du jour.
          </p>
          <Button
            size="lg"
            className="w-full bg-success text-primary-foreground hover:bg-success/90"
            onClick={() => {
              shareWhatsApp(
                `⚔️ Je te défie en duel sur QuizBoss ! Mise 25 GDS et gagne 45 GDS 👉 ${window.location.origin}/duel?ref=${p.id}`,
              );
              unlockDuelsByShare();
              toast.success(`+${SHARE_DUEL_BONUS} parties gratuites débloquées !`);
            }}
          >
            <Share2 /> Partager sur WhatsApp (+{SHARE_DUEL_BONUS} parties gratuites)
          </Button>
        </div>
      ) : mode === "online" ? (
        <Button
          size="lg"
          className="w-full text-base font-extrabold shadow-glow"
          disabled={stake > p.coins}
          onClick={() => handleCreateRoom("public")}
        >
          <Swords className="h-5 w-5" />
          {stake === 0
            ? `Ouvrir un Salon Multijoueur Gratuit (${n} Joueurs)`
            : `Ouvrir un Salon Duel (${n} Joueurs · Gain ${pot.winnerPayout} GDS)`}
        </Button>
      ) : (
        <Button
          size="lg"
          className="w-full text-base font-extrabold"
          disabled={stake > p.coins}
          onClick={() =>
            onStart({
              names: finalLocalNames,
              myPlayerIndex: 0,
              mode,
              stake,
              category,
            })
          }
        >
          <Swords /> Lancer le duel local ({n} joueurs ·{" "}
          {stake === 0 ? "Partie Gratuite" : `Gain ${pot.winnerPayout} GDS`})
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
  const { names, myPlayerIndex, mode, stake, roomCode } = setup;
  const { data: settings } = useSettings();
  const pot = calculateDuelPot(stake, names.length);
  const QUESTION_TIME = 12;
  const CHOOSE_TIME = 7;

  const [idx, setIdx] = useState(0);
  const [scores, setScores] = useState<number[]>(names.map(() => 0));
  const [buzzed, setBuzzed] = useState<number | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [roundOutcome, setRoundOutcome] = useState<string | null>(null);
  const [time, setTime] = useState(QUESTION_TIME);
  const [done, setDone] = useState(false);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const q = questions[idx]!;

  // En mode Tour par tour, c'est le tour d'un joueur précis ; en mode En Ligne et Buzzer,
  // IL FAUT CLIQUER SUR LE BOUTON BUZZER pour déverrouiller les réponses !
  const activeResponder = mode === "tour" ? idx % names.length : buzzed;
  const canClickOptions =
    picked === null &&
    (mode === "tour" ||
      (mode === "buzzer" && buzzed !== null) ||
      (mode === "online" && buzzed === myPlayerIndex));

  useQuizBgm(!done, true);

  // Synchronisation temps réel des clics Buzzer & Réponses entre les vrais joueurs de la chambre
  useEffect(() => {
    if (mode !== "online" || !roomCode) return;
    const ch = supabase
      .channel(`quizboss-match-${roomCode}`)
      .on("broadcast", { event: "player-buzz" }, ({ payload }) => {
        if (!payload || payload.qIdx !== idx) return;
        sfx.buzz();
        setBuzzed((prev) => {
          if (prev !== null) return prev;
          setTime(CHOOSE_TIME);
          return payload.playerIndex as number;
        });
      })
      .on("broadcast", { event: "player-answer" }, ({ payload }) => {
        if (!payload || payload.qIdx !== idx) return;
        applyAnswerResolution(payload.playerIndex as number, payload.optionIndex as number);
      })
      .subscribe();

    channelRef.current = ch;
    return () => {
      supabase.removeChannel(ch);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, roomCode, idx]);

  useEffect(() => {
    if (done || picked !== null) return;
    if (time <= 0) {
      sfx.timeout();
      if (buzzed !== null) {
        // Un joueur avait buzzé mais n'a pas choisi à temps -> il perd la manche
        applyAnswerResolution(buzzed, -2);
      } else {
        // Aucun joueur n'a répondu -> Manche NULLE (0 point pour tout le monde, que ce soit 2, 3 ou 4 joueurs)
        applyNoAnswerNullRound();
      }
      return;
    }
    if (time <= 4) sfx.tick(time <= 2);
    const t = setTimeout(() => setTime((x) => x - 1), 1000);
    return () => clearTimeout(t);
  });

  function nextQuestion() {
    if (idx + 1 >= questions.length) {
      setDone(true);
      return;
    }
    setIdx((x) => x + 1);
    setBuzzed(null);
    setPicked(null);
    setRoundOutcome(null);
    setTime(QUESTION_TIME);
  }

  function handlePressBuzzer(playerIdx: number) {
    if (buzzed !== null || picked !== null) return;
    sfx.buzz();
    setBuzzed(playerIdx);
    setTime(CHOOSE_TIME);
    if (mode === "online" && channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "player-buzz",
        payload: { qIdx: idx, playerIndex: playerIdx },
      });
    }
  }

  function applyNoAnswerNullRound() {
    if (picked !== null) return;
    setPicked(-1);
    setRoundOutcome(
      `⏱️ Aucun joueur n'a répondu ! Manche NULLE (0 pt pour les ${names.length} joueurs).`,
    );
    setTimeout(nextQuestion, 1700);
  }

  function applyAnswerResolution(who: number, optionIdx: number) {
    setPicked((prev) => {
      if (prev !== null) return prev;
      const ok = optionIdx === q.correct_index;
      if (ok) {
        sfx.correct(2);
        const pts = 100 + time * 5;
        setScores((s) => s.map((v, j) => (j === who ? v + pts : v)));
        setRoundOutcome(
          `✅ ${names[who]} trouve la bonne réponse (+${pts} pts) ! Les autres perdent la manche.`,
        );
      } else {
        sfx.wrong();
        // Si le joueur qui a cliqué se trompe (ou ne choisit pas à temps), les autres ne gagnent pas car ils n'ont pas choisi :
        // tous perdent cette question (0 pt) et on passe à la question suivante.
        setRoundOutcome(
          optionIdx === -2
            ? `⏱️ ${names[who]} a cliqué sans répondre ! Tous perdent cette question (0 pt), question suivante…`
            : `❌ Mauvaise réponse de ${names[who]} ! Tous perdent cette question (0 pt), on passe à la suivante…`,
        );
      }
      setTimeout(nextQuestion, 1750);
      return optionIdx;
    });
  }

  function handlePickOption(optionIdx: number) {
    if (picked !== null) return;
    const who = activeResponder ?? myPlayerIndex;
    if (mode === "online" && channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "player-answer",
        payload: { qIdx: idx, playerIndex: who, optionIndex: optionIdx },
      });
    }
    applyAnswerResolution(who, optionIdx);
  }

  useEffect(() => {
    if (!done) return;
    const top = Math.max(...scores);
    const winners = scores.map((s, i) => (s === top ? i : -1)).filter((i) => i >= 0);

    // Si aucun joueur n'a marqué (top <= 0) ou égalité -> MATCH NUL (2, 3 ou 4 joueurs)
    const isNullMatch = top <= 0 || winners.length !== 1;

    if (isNullMatch) {
      sfx.timeout();
      if (stake > 0) {
        addCoins(
          stake,
          `Match Nul (${names.length} joueurs) · Mise de ${stake} GDS remboursée`,
          "duel",
        );
      }
    } else if (winners[0] === myPlayerIndex) {
      sfx.win();
      if (stake > 0) {
        addCoins(
          pot.winnerPayout,
          `Gain Duel (${names.length}J · Pot ${pot.totalPot} GDS − ${pot.siteFee} GDS site)`,
          "duel",
          (p) => ({ xp: p.xp + 60, gamesPlayed: p.gamesPlayed + 1 }),
        );
      }
    } else {
      sfx.lose();
    }

    // Déclencher la fonction publicité Monetag après le Duel
    triggerPostGameMonetagAd(settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  if (done) {
    const ranking = names.map((n, i) => ({ n, s: scores[i]!, i })).sort((a, b) => b.s - a.s);
    const top = Math.max(...scores);
    const winners = scores.map((s, i) => (s === top ? i : -1)).filter((i) => i >= 0);
    const isNullMatch = top <= 0 || winners.length !== 1;
    const champ = ranking[0]!;
    const iWon = !isNullMatch && champ.i === myPlayerIndex;

    const text = isNullMatch
      ? `🤝 Match Nul en Duel (${names.length} joueurs) sur QuizBoss ! Viens nous départager 👉 ${window.location.origin}/duel`
      : `⚔️ Duel QuizBoss (${names.length} joueurs) : ${champ.n} remporte ${pot.winnerPayout} GDS avec ${champ.s} pts ! 👉 ${window.location.origin}/duel`;

    return (
      <div className="space-y-4 py-4 animate-pop">
        <div className="rounded-3xl bg-grad-candy p-6 text-center text-secondary-foreground shadow-xl">
          <p className="text-6xl">{isNullMatch ? "🤝" : iWon ? "🏆" : "⚔️"}</p>
          <h1 className="mt-2 text-3xl font-extrabold">
            {isNullMatch ? `Match Nul (${names.length} joueurs) !` : `${champ.n} gagne le duel !`}
          </h1>
          <p className="mt-1 text-xs font-semibold opacity-95">
            {isNullMatch
              ? "Aucun joueur n'a pris l'avantage — la partie est déclarée nulle."
              : `${champ.n} remporte la victoire face aux autres joueurs !`}
          </p>
          {stake > 0 && (
            <div className="mt-3 inline-flex flex-col rounded-2xl bg-background/25 px-4 py-2 text-xs font-bold">
              {isNullMatch ? (
                <span className="text-sm font-extrabold">
                  🔄 Match Nul : ta mise de {stake} GDS a été remboursée.
                </span>
              ) : (
                <>
                  <span>
                    Pot total : {pot.totalPot} GDS ({stake} GDS × {names.length})
                  </span>
                  <span>Frais plateforme : −{pot.siteFee} GDS</span>
                  <span className="mt-1 text-base font-extrabold text-accent">
                    Gain échangeable du gagnant : +{pot.winnerPayout} GDS
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          {ranking.map((r, k) => (
            <div
              key={r.i}
              className={`flex items-center justify-between rounded-2xl p-4 font-bold ${
                !isNullMatch && k === 0 ? "border border-accent bg-accent/15" : "bg-card"
              }`}
            >
              <span>
                {isNullMatch ? "🤝" : ["🥇", "🥈", "🥉", "4️⃣"][k]} {r.n}
              </span>
              <div className="flex items-center gap-3">
                {!isNullMatch && k === 0 && stake > 0 && (
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

        {/* Publicité après le Duel */}
        <LocalBanner placement="result" />
        <AdSlot slot="result" />
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
              ? `Duel En Ligne (${names.length}J)`
              : mode === "buzzer"
                ? `Buzzer (${names.length}J)`
                : "Tour par tour"}
          </span>
          {stake > 0 ? (
            <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-accent">
              Gain : {pot.winnerPayout} GDS
            </span>
          ) : (
            <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-primary">
              🎁 Partie Gratuite
            </span>
          )}
        </span>
        <span className="flex items-center gap-2 text-muted-foreground">
          {idx + 1}/{questions.length}
          <MuteButton />
        </span>
      </div>

      {/* Scores des 2 à 4 joueurs */}
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${names.length}, minmax(0, 1fr))` }}
      >
        {names.map((n, i) => (
          <div
            key={i}
            className={`rounded-xl p-2 text-center text-xs font-bold text-secondary-foreground transition-all ${
              COLORS[i % COLORS.length]
            } ${activeResponder === i ? "ring-2 ring-foreground scale-[1.03]" : "opacity-80"}`}
          >
            <p className="truncate">
              {n} {activeResponder === i ? "🔔" : ""}
            </p>
            <p className="text-base font-extrabold">{scores[i]}</p>
          </div>
        ))}
      </div>

      {/* Barre de temps */}
      <div className="flex items-center gap-3">
        <Timer
          className={`h-5 w-5 ${time <= 4 ? "text-destructive animate-bounce" : "text-primary"}`}
        />
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              time <= 4 ? "bg-destructive" : "bg-grad-lime"
            }`}
            style={{
              width: `${(time / (buzzed !== null ? CHOOSE_TIME : QUESTION_TIME)) * 100}%`,
            }}
          />
        </div>
        <span className="w-7 text-right font-extrabold tabular-nums">{time}s</span>
      </div>

      {/* Question Card */}
      <div key={q.id} className="rounded-3xl bg-card p-5 animate-pop">
        <div className="flex items-center justify-between">
          {activeResponder !== null && activeResponder !== undefined ? (
            <p className="text-xs font-extrabold uppercase tracking-widest text-primary">
              ⚡ {names[activeResponder]} a la main — Choisis la réponse !
            </p>
          ) : (
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-accent">
              🔔 Clique sur le bouton Buzzer si tu connais la réponse !
            </span>
          )}
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${diff.cls}`}>
            {diff.label}
          </span>
        </div>
        <h2 className="mt-2 text-lg font-bold leading-snug">{q.question}</h2>
        <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
          <AlertCircle className="h-3.5 w-3.5 text-primary" />
          Si personne ne répond avant 0s, la manche est <b>nulle (0 pt)</b>.
        </p>
      </div>

      {/* Message de résolution de la manche */}
      {roundOutcome && (
        <div className="rounded-2xl border border-primary/40 bg-primary/15 p-3 text-center text-xs font-extrabold text-foreground animate-pop">
          {roundOutcome}
        </div>
      )}

      {/* BOUTON BUZZER OBLIGATOIRE AVANT DE POUVOIR CHOISIR UNE RÉPONSE */}
      {mode === "online" && buzzed === null && picked === null && (
        <button
          type="button"
          onClick={() => handlePressBuzzer(myPlayerIndex)}
          className="flex w-full items-center justify-center gap-2 rounded-3xl bg-grad-lime py-4 text-base font-extrabold text-primary-foreground shadow-glow transition-transform active:scale-95 animate-pulse"
        >
          <BellRing className="h-6 w-6" />
          🔔 JE CONNAIS LA RÉPONSE ! (CLIQUER POUR CHOISIR)
        </button>
      )}

      {mode === "online" && buzzed !== null && buzzed !== myPlayerIndex && picked === null && (
        <div className="rounded-2xl border border-accent/40 bg-accent/15 p-4 text-center text-sm font-extrabold text-accent">
          ⚡ {names[buzzed]} a cliqué en premier et choisit sa réponse…
        </div>
      )}

      {mode === "buzzer" && buzzed === null && picked === null && (
        <div className="grid grid-cols-2 gap-3">
          {names.map((n, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handlePressBuzzer(i)}
              className={`${
                COLORS[i % COLORS.length]
              } flex flex-col items-center justify-center rounded-3xl p-4 text-base font-extrabold text-secondary-foreground shadow-lg transition-transform active:scale-90`}
            >
              <span className="text-2xl">🔔</span>
              <span className="mt-1 truncate max-w-full">{n}</span>
              <span className="text-[10px] opacity-90">Je connais la réponse !</span>
            </button>
          ))}
        </div>
      )}

      {/* Les 4 propositions A, B, C, D (verrouillées tant qu'on n'a pas cliqué sur le bouton Buzzer) */}
      <div className="grid gap-2.5">
        {q.options.map((o, i) => {
          const st =
            picked === null
              ? canClickOptions
                ? "border-primary bg-card hover:bg-primary/15 active:scale-[0.98]"
                : "border-border/50 bg-card/50 opacity-65 cursor-not-allowed"
              : i === q.correct_index
                ? "bg-success text-primary-foreground"
                : i === picked
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-card opacity-50";
          return (
            <button
              key={i}
              type="button"
              disabled={!canClickOptions}
              onClick={() => handlePickOption(i)}
              className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left font-semibold transition-all ${st}`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-background/30 font-bold">
                {"ABCD"[i]}
              </span>
              <span className="flex-1">{o}</span>
              {!canClickOptions && picked === null && (
                <span className="text-[10px] font-bold text-muted-foreground">
                  {buzzed === null ? "Clique 🔔 d'abord" : "Verrouillé"}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
