import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Home,
  Sparkles,
  Globe,
  Wallet,
  UserPlus,
  Coins,
  Swords,
  UserRound,
  X,
  Music,
  Pause,
  Play,
  SkipForward,
  Bell,
  BellRing,
  VolumeX,
  ListMusic,
  Menu,
  HelpCircle,
  FileText,
  ChevronRight,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { AudioLibraryModal } from "./AudioLibraryModal";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { addCoins, getPlayer, levelFromXp, usePlayer, useAuthSync, useSession } from "@/lib/player";
import {
  calculateDuelPot,
  fetchDeposits,
  injectSmartSnippet,
  removeIntrusiveMonetag,
  isRoomOpen,
  MONETAG_INPAGE_DEFAULT,
  MONETAG_DIRECT_LINK_DEFAULT,
  listDuelRooms,
  registerNotificationServiceWorker,
  registerPlayerInDirectory,
  requestCrossPlatformNotificationPermission,
  setRealtimePresencePlayers,
  triggerCrossPlatformNotification,
  usePages,
  useSettings,
  type DuelRoom,
  type RegisteredPlayer,
} from "@/lib/site";
import {
  nextSiteMusicTrack,
  sfx,
  toggleSiteMusic,
  toggleSiteMusicDisabled,
  useCurrentSiteTrack,
  useIsGameActive,
  useSiteBgm,
  useSiteMusicDisabled,
  useSiteMusicPlaying,
} from "@/lib/sound";
import { NotificationPrompt } from "./NotificationPrompt";
import { MuteButton } from "./MuteButton";
import { SupportWidget } from "./SupportWidget";
import { PlayerAvatar } from "./PlayerAvatar";
import { Button } from "./ui/button";

const NAV = [
  { to: "/", label: "Jouer", icon: Home },
  { to: "/duel", label: "Duel", icon: Swords },
  { to: "/explorer", label: "Explorer", icon: Globe },
  { to: "/statuts", label: "Statuts", icon: Sparkles },
  { to: "/portefeuille", label: "Wallet", icon: Wallet },
] as const;

type SiteNotifItem = {
  id: string;
  title: string;
  body: string;
  url: string | null;
  created_at: string;
};

function useReferralCapture() {
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    const p = getPlayer();
    if (!ref || p.referredBy || ref === p.id || p.gamesPlayed > 0) return;
    supabase
      .from("referrals")
      .insert({ referrer_id: ref, invitee_device: p.id })
      .then(() => {
        // Referral recorded for bonus duels & XP
      });
  }, []);
}

function useDepositCreditSync() {
  const session = useSession();
  useEffect(() => {
    const syncApproved = async () => {
      const p = getPlayer();
      const all = await fetchDeposits();
      const mine = all.filter(
        (d) =>
          d.status === "approved" &&
          (d.player_id === p.id || (session?.user.id && d.user_id === session.user.id)),
      );
      const credited = new Set(p.creditedDeposits ?? []);
      for (const dep of mine) {
        if (!credited.has(dep.id)) {
          credited.add(dep.id);
          addCoins(
            dep.amount,
            `Dépôt validé (${dep.method} · #${dep.transaction_ref})`,
            "deposit",
            () => ({ creditedDeposits: Array.from(credited) }),
          );
          toast.success(`🎉 Dépôt de +${dep.amount} GDS validé et crédité sur ton portefeuille !`);
          triggerCrossPlatformNotification(
            "🎉 Dépôt validé !",
            `+${dep.amount} GDS ont été crédités sur ton portefeuille QuizBoss.`,
            "/portefeuille",
            `dep-${dep.id}`,
          );
        }
      }
    };
    syncApproved();
    const t = setInterval(syncApproved, 10000);
    return () => clearInterval(t);
  }, [session?.user.id]);
}

function useRealtimeAdminSync() {
  const qc = useQueryClient();
  const { data: settings } = useSettings();
  const lastUpdatedStamp = settings?.["site_last_updated_at"];

  useEffect(() => {
    if (!lastUpdatedStamp) return;
    qc.invalidateQueries({ queryKey: ["payment_methods"] });
    qc.invalidateQueries({ queryKey: ["banners"] });
    qc.invalidateQueries({ queryKey: ["custom_pages"] });
    qc.invalidateQueries({ queryKey: ["questions"] });
    qc.invalidateQueries({ queryKey: ["quotes"] });
    qc.invalidateQueries({ queryKey: ["sticker-packs"] });
  }, [lastUpdatedStamp, qc]);

  useEffect(() => {
    const ch = supabase
      .channel("quizboss-global-sync")
      .on("broadcast", { event: "admin-sync" }, () => {
        qc.invalidateQueries();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);
}

function SiteMusicBar() {
  const { data: settings } = useSettings();
  const isPlaying = useSiteMusicPlaying();
  const isDisabled = useSiteMusicDisabled();
  const track = useCurrentSiteTrack();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const songUrl = settings?.["site_bgm_url"]?.trim();
  const songCredit = settings?.["site_bgm_credit"]?.trim();

  useSiteBgm(songUrl, songCredit);

  return (
    <>
      <div className="mx-auto mb-2 px-4">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-primary/25 bg-card/90 px-3 py-1.5 text-xs backdrop-blur-md">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => {
                sfx.click();
                toggleSiteMusic();
              }}
              title={isPlaying ? "Poser la musique" : "Lire la musique"}
              aria-label={isPlaying ? "Mettre la musique en pause" : "Écouter la musique"}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-90"
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>
            <Music
              className={`h-3.5 w-3.5 shrink-0 text-primary ${isPlaying ? "animate-spin" : ""}`}
            />
            <div className="min-w-0 truncate">
              <span className="font-extrabold text-foreground">
                {isDisabled ? "Musique désactivée" : track.title}
              </span>
              {!isDisabled && (
                <span className="ml-1.5 text-[10px] text-muted-foreground">· {track.credit}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                sfx.click();
                setLibraryOpen(true);
              }}
              title="Ouvrir la bibliothèque de musiques (5+ musiques ou ajouter la tienne)"
              className="inline-flex items-center gap-1 rounded-lg bg-primary/20 px-2 py-1 text-[10px] font-extrabold text-primary hover:bg-primary/30 transition-transform active:scale-95"
            >
              <ListMusic className="h-3 w-3" /> Bibliothèque 🎵
            </button>
            <button
              type="button"
              onClick={() => {
                sfx.click();
                toggleSiteMusic();
              }}
              className="rounded-lg bg-muted px-2 py-1 text-[10px] font-bold hover:bg-muted/80"
            >
              {isPlaying ? "⏸ Poser" : "▶ Lire"}
            </button>
            <button
              type="button"
              onClick={() => {
                sfx.click();
                nextSiteMusicTrack();
              }}
              title="Changer de son / musique"
              className="inline-flex items-center gap-1 rounded-lg bg-primary/15 px-2 py-1 text-[10px] font-bold text-primary hover:bg-primary/25"
            >
              <SkipForward className="h-3 w-3" /> Suivant
            </button>
            <button
              type="button"
              onClick={() => {
                sfx.click();
                toggleSiteMusicDisabled();
              }}
              title={isDisabled ? "Réactiver la musique" : "Désactiver la musique"}
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold ${
                isDisabled
                  ? "bg-accent/20 text-accent"
                  : "bg-destructive/15 text-destructive hover:bg-destructive/25"
              }`}
            >
              <VolumeX className="h-3 w-3" /> {isDisabled ? "Activer" : "Off"}
            </button>
          </div>
        </div>
      </div>
      <AudioLibraryModal open={libraryOpen} onClose={() => setLibraryOpen(false)} />
    </>
  );
}

function SponsorStrip() {
  const { data: settings } = useSettings();
  const url = settings?.["monetag_rewarded_url"]?.trim() || MONETAG_DIRECT_LINK_DEFAULT;
  return (
    <div className="mx-auto mb-3 px-4">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="flex items-center justify-between gap-2 rounded-xl border border-accent/40 bg-card/80 px-3 py-2 text-xs"
      >
        <span className="truncate font-bold">🎁 Offre du jour sponsorisée — découvre-la</span>
        <span className="shrink-0 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-extrabold uppercase text-accent">
          Pub
        </span>
      </a>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const inGameBanner = useIsGameActive();
  const player = usePlayer();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const inGame = useIsGameActive();

  useReferralCapture();
  useAuthSync();
  useDepositCreditSync();
  useRealtimeAdminSync();
  useInjectedScripts();

  const session = useSession();
  const isAdmin = path.startsWith("/admin");

  const [openRooms, setOpenRooms] = useState<DuelRoom[]>([]);
  const [siteNotifs, setSiteNotifs] = useState<SiteNotifItem[]>([]);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);
  const [dismissedRoomCodes, setDismissedRoomCodes] = useState<string[]>([]);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default",
  );

  const { data: customPagesData } = usePages();
  const extraPages = (customPagesData ?? []).filter(
    (p) => p.slug.startsWith("page-") && p.status !== "disabled" && p.title,
  );

  const myPseudo = player.name?.trim() || `Joueur_${player.id.slice(0, 4)}`;

  // Synchronisation globale : Présence, Défis Duel dans toute l'App, et Notifications OS (Android, iOS, Windows, Mac)
  useEffect(() => {
    registerNotificationServiceWorker();
    if (!player.id) return;

    if (player.name?.trim() || player.avatarUrl) {
      registerPlayerInDirectory({
        id: player.id,
        pseudo: myPseudo,
        level: levelFromXp(player.xp),
        avatarUrl: player.avatarUrl,
      });
    }

    const seenChallengeRooms = new Set<string>(
      JSON.parse(localStorage.getItem("quizboss-seen-duel-notifs") || "[]") as string[],
    );

    const markRoomNotified = (code: string) => {
      seenChallengeRooms.add(code);
      localStorage.setItem(
        "quizboss-seen-duel-notifs",
        JSON.stringify(Array.from(seenChallengeRooms).slice(-100)),
      );
    };

    const syncGlobalRoomsAndNotifs = async () => {
      const rooms = await listDuelRooms();
      const waitingOthers = rooms.filter(
        (r) =>
          isRoomOpen(r) &&
          r.hostId !== player.id &&
          ((r.visibility === "public" && !r.targetPseudo && !r.invitedPseudos?.length) ||
            r.targetPseudo?.toLowerCase() === myPseudo.toLowerCase() ||
            r.invitedPseudos?.some((ip) => ip.toLowerCase() === myPseudo.toLowerCase())),
      );
      setOpenRooms(waitingOthers);

      // Si un défi vient d'être lancé (pour moi ou en chambre ouverte), envoyer une notification Android/iOS/Windows/Mac
      for (const r of waitingOthers) {
        if (!seenChallengeRooms.has(r.code)) {
          markRoomNotified(r.code);
          const isDirectForMe =
            r.targetPseudo?.toLowerCase() === myPseudo.toLowerCase() ||
            r.invitedPseudos?.some((ip) => ip.toLowerCase() === myPseudo.toLowerCase());
          const pot = calculateDuelPot(r.stake, r.maxPlayers);
          sfx.buzz();
          triggerCrossPlatformNotification(
            isDirectForMe
              ? `⚔️ ${r.hostName} te défie en Duel !`
              : `🔥 Défi Duel lancé par ${r.hostName}`,
            r.stake > 0
              ? `Mise : ${r.stake} GDS · Gagne ${pot.winnerPayout} GDS (${r.maxPlayers} joueurs)`
              : `Partie Multijoueur Gratuite (${r.maxPlayers} joueurs) · Clique pour rejoindre !`,
            `/duel?room=${r.code}&accept=1`,
            `duel-${r.code}`,
          );
        }
      }

      // Si j'ai moi-même créé une chambre et qu'un joueur a accepté (status === "playing") pendant que je suis sur une autre page, lancer automatiquement !
      if (!inGame && !path.startsWith("/duel")) {
        const myStartedRoom = rooms.find(
          (r) =>
            r.hostId === player.id &&
            r.status === "playing" &&
            r.players.length >= 2 &&
            Date.now() - new Date(r.updatedAt || r.createdAt).getTime() < 45000,
        );
        if (myStartedRoom && !seenChallengeRooms.has(`started-${myStartedRoom.code}`)) {
          markRoomNotified(`started-${myStartedRoom.code}`);
          sfx.start();
          toast.success(`⚔️ Ton défi ${myStartedRoom.code} a été accepté ! Le duel commence !`);
          navigate({
            to: "/duel",
            search: { room: myStartedRoom.code, accept: "1" } as never,
          });
        }
      }

      // Notifications générales du site (table notifications)
      const { data: nRows } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(12);
      if (nRows) {
        setSiteNotifs(nRows);
        const latest = nRows[0];
        if (latest) {
          const lastId = localStorage.getItem("quizboss-last-notif");
          if (lastId !== latest.id) {
            localStorage.setItem("quizboss-last-notif", latest.id);
            if (lastId) {
              triggerCrossPlatformNotification(
                latest.title,
                latest.body,
                latest.url || "/",
                `notif-${latest.id}`,
              );
            }
          }
        }
      }
    };

    syncGlobalRoomsAndNotifs();
    const poll = setInterval(syncGlobalRoomsAndNotifs, 3500);

    const ch = supabase.channel("quizboss-duel-lobby", {
      config: { presence: { key: player.id } },
    });

    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState<{
        id: string;
        pseudo: string;
        avatarUrl?: string;
        level: number;
        updatedAt: string;
      }>();
      const onlineList: RegisteredPlayer[] = [];
      for (const entries of Object.values(state)) {
        for (const item of entries) {
          if (item.id && item.pseudo) {
            onlineList.push({
              id: item.id,
              pseudo: item.pseudo,
              avatarUrl: item.avatarUrl,
              level: item.level || 1,
              online: true,
              updatedAt: item.updatedAt || new Date().toISOString(),
            });
          }
        }
      }
      setRealtimePresencePlayers(onlineList);
    })
      .on("broadcast", { event: "room-updated" }, () => {
        syncGlobalRoomsAndNotifs();
      })
      .on("broadcast", { event: "duel-challenge" }, ({ payload }) => {
        syncGlobalRoomsAndNotifs();
        if (!payload || payload.hostId === player.id) return;
        const isDirect =
          payload.targetId === player.id ||
          (payload.targetPseudo && payload.targetPseudo.toLowerCase() === myPseudo.toLowerCase());
        // Défi destiné à quelqu'un d'autre : on ne montre rien
        if (payload.targetPseudo && !isDirect) return;
        const pot = calculateDuelPot(payload.stake || 0, payload.maxPlayers || 2);
        sfx.buzz();
        triggerCrossPlatformNotification(
          isDirect
            ? `⚔️ ${payload.hostName} te défie en Duel !`
            : `🔥 Nouveau Défi Duel de ${payload.hostName} !`,
          payload.stake > 0
            ? `Mise : ${payload.stake} GDS · Gain : ${pot.winnerPayout} GDS`
            : `Partie Multijoueur Gratuite (${payload.maxPlayers} joueurs)`,
          `/duel?room=${payload.roomCode}&accept=1`,
          `duel-${payload.roomCode}`,
        );
        toast(
          isDirect
            ? `⚔️ ${payload.hostName} te défie en Duel (${payload.stake} GDS) !`
            : `🔥 ${payload.hostName} a lancé un défi Duel (${payload.stake} GDS) !`,
          {
            description: `Chambre ${payload.roomCode} · ${payload.maxPlayers} joueurs · Clique sur Accepter pour lancer le jeu !`,
            duration: isDirect ? 60000 : 180000,
            action: {
              label: "⚡ Accepter",
              onClick: () => {
                navigate({
                  to: "/duel",
                  search: { room: payload.roomCode, accept: "1" } as never,
                });
              },
            },
          },
        );
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await ch.track({
            id: player.id,
            pseudo: myPseudo,
            avatarUrl: player.avatarUrl,
            level: levelFromXp(player.xp),
            updatedAt: new Date().toISOString(),
          });
        }
      });

    return () => {
      clearInterval(poll);
      supabase.removeChannel(ch);
    };
  }, [player.id, player.name, player.avatarUrl, player.xp, myPseudo, inGame, path, navigate]);

  const visibleChallenges = openRooms.filter((r) => !dismissedRoomCodes.includes(r.code));
  const totalBadgeCount = visibleChallenges.length + (siteNotifs.length > 0 ? 1 : 0);

  const handleEnableOsNotifications = async () => {
    const ok = await requestCrossPlatformNotificationPermission();
    setNotifPerm(typeof Notification !== "undefined" ? Notification.permission : "default");
    if (ok) {
      try {
        await supabase.from("push_subscribers").insert({ device_id: player.id });
      } catch {
        // ignore
      }
      toast.success("Notifications activées pour Android, iOS, Windows & Mac 🔔");
      triggerCrossPlatformNotification(
        "🔔 Notifications QuizBoss actives !",
        "Tu recevras désormais tous les défis Duel et alertes en direct sur ton appareil.",
        "/duel",
      );
    } else {
      toast.error("Autorise les notifications dans les réglages de ton navigateur.");
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-2xl w-full overflow-x-hidden pb-28">
      <header className="sticky top-0 z-30 flex items-center gap-2 bg-background/80 px-3 sm:px-4 py-2.5 backdrop-blur-md border-b border-border/40">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src="/icon-192.png" alt="" width={32} height={32} className="h-8 w-8" />
          <span className="font-display text-xl font-extrabold tracking-tight">
            Quiz<span className="text-primary">Boss</span>
          </span>
        </Link>
        {!isAdmin && (
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2 text-sm font-bold">
            <Link
              to="/portefeuille"
              aria-label="Mon portefeuille"
              className="flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-accent transition-transform active:scale-95"
            >
              <Coins className="h-4 w-4" /> {player.coins}{" "}
              <span className="text-[11px] opacity-85">GDS</span>
            </Link>
            <span className="rounded-full bg-primary/15 px-2 py-1 text-xs text-primary font-bold">
              Niv. {levelFromXp(player.xp)}
            </span>

            {/* Bouton Centre de Notifications & Défis */}
            <button
              type="button"
              onClick={() => {
                sfx.click();
                setNotifDrawerOpen((v) => !v);
              }}
              aria-label="Notifications et Défis"
              title="Notifications & Défis Duel"
              className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary transition-transform active:scale-90 cursor-pointer hover:bg-primary/25"
            >
              {visibleChallenges.length > 0 ? (
                <BellRing className="h-4 w-4 animate-bounce text-accent" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
              {totalBadgeCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-extrabold text-destructive-foreground">
                  {visibleChallenges.length > 0 ? visibleChallenges.length : "•"}
                </span>
              )}
            </button>

            {/* Bouton Menu Burger 3 barres */}
            <button
              type="button"
              onClick={() => {
                sfx.click();
                setMenuDrawerOpen(true);
              }}
              aria-label="Ouvrir le menu principal"
              title="Menu principal"
              className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow transition-transform active:scale-90 hover:opacity-90 cursor-pointer"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        )}
      </header>

      {/* Menu Latéral 3 Barres (Drawer / Sheet fluide) */}
      {!isAdmin && (
        <Sheet open={menuDrawerOpen} onOpenChange={setMenuDrawerOpen}>
          <SheetContent
            side="right"
            className="flex w-[85vw] max-w-sm flex-col p-0 z-50 bg-card border-l border-border"
          >
            {/* Header du tiroir */}
            <SheetHeader className="border-b border-border/80 bg-muted/40 p-4 text-left">
              <div className="flex items-center gap-2.5">
                <img src="/icon-192.png" alt="" width={32} height={32} className="h-8 w-8" />
                <div>
                  <SheetTitle className="font-display text-lg font-extrabold leading-tight">
                    Quiz<span className="text-primary">Boss</span>
                  </SheetTitle>
                  <p className="text-[10px] font-semibold text-muted-foreground">
                    Menu & Navigation
                  </p>
                </div>
              </div>
            </SheetHeader>

            {/* Carte Profil & Solde dans le tiroir */}
            <div className="border-b border-border/60 bg-primary/5 p-4">
              <div className="flex items-center gap-3">
                <PlayerAvatar name={myPseudo} avatarUrl={player.avatarUrl} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-extrabold text-foreground">{myPseudo}</p>
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-extrabold text-primary shrink-0">
                      Niv. {levelFromXp(player.xp)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Link
                      to="/portefeuille"
                      onClick={() => setMenuDrawerOpen(false)}
                      className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-extrabold text-accent hover:bg-accent/30 transition-colors"
                    >
                      <Coins className="h-3.5 w-3.5" /> {player.coins} GDS
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Liens principaux du tiroir */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 text-xs font-bold">
              {/* Actions & Finance */}
              <div className="space-y-1">
                <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Gestion & Gains
                </p>
                <Link
                  to="/retrait"
                  onClick={() => setMenuDrawerOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-foreground hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/15 text-success">
                      <Coins className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-extrabold text-sm">Retrait de gains</p>
                      <p className="text-[10px] text-muted-foreground font-normal">
                        Convertis tes pièces en argent réel
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>

                <Link
                  to="/portefeuille"
                  onClick={() => setMenuDrawerOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-foreground hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
                      <Wallet className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-extrabold text-sm">Mon Portefeuille</p>
                      <p className="text-[10px] text-muted-foreground font-normal">
                        Dépôts, transactions & solde
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>

                <Link
                  to="/explorer"
                  onClick={() => setMenuDrawerOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-foreground hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <Globe className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-extrabold text-sm">Explorer</p>
                      <p className="text-[10px] text-muted-foreground font-normal">
                        Classements & communauté
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>

                <Link
                  to="/invite"
                  onClick={() => setMenuDrawerOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-foreground hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/15 text-pink-500">
                      <UserPlus className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-extrabold text-sm">Inviter des amis</p>
                      <p className="text-[10px] text-muted-foreground font-normal">
                        Gagne des pièces en parrainant
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>

                <Link
                  to="/auth"
                  onClick={() => setMenuDrawerOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-foreground hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/15 text-purple-500">
                      <UserRound className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-extrabold text-sm">
                        {session ? "Mon Compte & Profil" : "Connexion / Inscription"}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-normal">
                        Sauvegarde ta progression & retraits
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </div>

              {/* Pages personnalisées actives (page-1 à page-5) */}
              {extraPages.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-border/60">
                  <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    Pages QuizBoss
                  </p>
                  {extraPages.map((p) => (
                    <Link
                      key={p.slug}
                      to="/p/$slug"
                      params={{ slug: p.slug }}
                      onClick={() => setMenuDrawerOpen(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-2 text-foreground hover:bg-muted/80 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="font-extrabold">{p.title}</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              )}

              {/* Assistance & Légal */}
              <div className="space-y-1 pt-2 border-t border-border/60">
                <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Aide & Légal
                </p>
                <Link
                  to="/faq"
                  onClick={() => setMenuDrawerOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-foreground hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    <span>Foire aux Questions (FAQ)</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>

                <Link
                  to="/conditions"
                  onClick={() => setMenuDrawerOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-foreground hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>Conditions d'utilisation</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              </div>
            </div>

            {/* Pied du tiroir */}
            <div className="border-t border-border bg-muted/30 p-3 flex items-center justify-between text-xs">
              <span className="text-[11px] text-muted-foreground font-semibold">
                QuizBoss © 2026
              </span>
              <MuteButton />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Tiroir / Centre de Notifications (Android, iOS, Windows, Mac + Défis en direct) */}
      {!isAdmin && notifDrawerOpen && (
        <div className="mx-4 mb-3 rounded-3xl border border-primary/30 bg-card p-4 shadow-2xl animate-pop">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <div className="flex items-center gap-2">
              <BellRing className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-extrabold">Notifications & Défis en direct</h3>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                sfx.click();
                setNotifDrawerOpen(false);
              }}
              className="rounded-full p-1 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Option d'activation Notifications OS (Android, iOS, Windows, Mac) */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-muted/60 p-3 text-xs">
            <div>
              <p className="font-extrabold">
                📱 Notifications Android, iOS, Windows & Mac :{" "}
                <span className={notifPerm === "granted" ? "text-success" : "text-accent"}>
                  {notifPerm === "granted" ? "Activées ✅" : "Non activées"}
                </span>
              </p>
              <p className="text-[11px] text-muted-foreground">
                Reçois une alerte directe sur ton téléphone ou PC dès qu'un joueur te défie.
              </p>
            </div>
            {notifPerm !== "granted" && (
              <Button size="sm" onClick={handleEnableOsNotifications}>
                Activer 🔔
              </Button>
            )}
          </div>

          {/* Défis Duel en attente */}
          <div className="mt-3 space-y-2">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
              ⚔️ Défis Duel actifs ({openRooms.length})
            </p>
            {openRooms.length === 0 ? (
              <p className="rounded-xl bg-background/40 p-2.5 text-xs text-muted-foreground">
                Aucun défi en attente pour le moment. Lance un défi dans l'onglet Duel !
              </p>
            ) : (
              openRooms.slice(0, 5).map((r) => {
                const pot = calculateDuelPot(r.stake, r.maxPlayers);
                const isForMe =
                  r.targetPseudo?.toLowerCase() === myPseudo.toLowerCase() ||
                  r.invitedPseudos?.some((ip) => ip.toLowerCase() === myPseudo.toLowerCase());
                return (
                  <div
                    key={r.code}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-primary/30 bg-primary/10 p-3 text-xs"
                  >
                    <div>
                      <p className="font-extrabold text-foreground">
                        {isForMe
                          ? `⚔️ ${r.hostName} te défie personnellement !`
                          : `🔥 Défi ouvert par ${r.hostName}`}{" "}
                        <span className="font-mono text-primary">({r.code})</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {r.players.length}/{r.maxPlayers} joueurs ·{" "}
                        {r.stake === 0
                          ? "🎁 Partie Gratuite"
                          : `Mise ${r.stake} GDS → Gain ${pot.winnerPayout} GDS`}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setNotifDrawerOpen(false);
                        navigate({
                          to: "/duel",
                          search: { room: r.code, accept: "1" } as never,
                        });
                      }}
                    >
                      ⚡ Accepter ({r.stake} GDS)
                    </Button>
                  </div>
                );
              })
            )}
          </div>

          {/* Dernières annonces du site */}
          {siteNotifs.length > 0 && (
            <div className="mt-3 space-y-1.5 border-t border-border pt-2.5">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                📢 Annonces QuizBoss
              </p>
              {siteNotifs.slice(0, 3).map((n) => (
                <div key={n.id} className="rounded-xl bg-background/50 p-2.5 text-xs">
                  <p className="font-bold">{n.title}</p>
                  <p className="text-muted-foreground">{n.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!isAdmin && <SiteMusicBar />}
      {!isAdmin && <NotificationPrompt />}

      {/* Bannière globale en direct quand un joueur lance un défi Duel (visible dans toute l'App) */}
      {!isAdmin && !inGame && visibleChallenges.length > 0 && (
        <div className="mx-4 mb-3 space-y-2">
          {visibleChallenges.slice(0, 2).map((r) => {
            const pot = calculateDuelPot(r.stake, r.maxPlayers);
            const isDirect =
              r.targetPseudo?.toLowerCase() === myPseudo.toLowerCase() ||
              r.invitedPseudos?.some((ip) => ip.toLowerCase() === myPseudo.toLowerCase());
            return (
              <div
                key={r.code}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-accent bg-grad-candy p-3.5 text-xs text-secondary-foreground shadow-lg animate-pop"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-sm font-extrabold">
                    <Swords className="h-4 w-4 shrink-0" />
                    {isDirect
                      ? `${r.hostName} te défie en Duel !`
                      : `${r.hostName} a lancé un Défi Duel (${r.players.length}/${r.maxPlayers} joueurs)`}
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold opacity-95">
                    {r.stake === 0
                      ? `🎁 Partie Gratuite · Chambre ${r.code}`
                      : `Mise : ${r.stake} GDS chacun · Le gagnant remporte ${pot.winnerPayout} GDS !`}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => {
                      sfx.click();
                      navigate({
                        to: "/duel",
                        search: { room: r.code, accept: "1" } as never,
                      });
                    }}
                    className="bg-background font-extrabold text-foreground hover:bg-background/90"
                  >
                    ⚡ Accepter {r.stake > 0 ? `(${r.stake} GDS)` : ""}
                  </Button>
                  <button
                    type="button"
                    aria-label="Ignorer ce défi"
                    onClick={(e) => {
                      e.stopPropagation();
                      sfx.click();
                      setDismissedRoomCodes((prev) => [...prev, r.code]);
                    }}
                    className="rounded-full bg-background/20 p-1.5 hover:bg-background/30 active:scale-90 transition-transform cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isAdmin && !inGameBanner && <SponsorStrip />}
      <main className="px-3 sm:px-4">{children}</main>
      {!isAdmin && <Footer />}
      {!isAdmin && <SupportWidget />}
      {!isAdmin && (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-lg pb-safe">
          <div className="mx-auto grid grid-cols-5 items-center justify-around max-w-2xl px-1 py-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                className="flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 min-h-[44px] text-[10px] font-bold text-muted-foreground transition-colors hover:text-foreground active:scale-95"
                activeProps={{ className: "text-primary bg-primary/10 font-extrabold" }}
              >
                <Icon className="h-5 w-5" />
                <span className="truncate max-w-[62px] text-center">{label}</span>
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}

function useInjectedScripts() {
  const { data } = useSettings();
  const inGame = useIsGameActive();

  useEffect(() => {
    document
      .querySelectorAll('script[src*="quge5.com"], script[data-zone="228397"]')
      .forEach((el) => el.remove());

    if (!data) return;

    const monetagToken = data["monetag_meta"]?.trim() || "59029dc25ef25e3de878e23f259217d6";
    let metaEl = document.querySelector('meta[name="monetag"]') as HTMLMetaElement | null;
    if (!metaEl) {
      metaEl = document.createElement("meta");
      metaEl.name = "monetag";
      document.head.appendChild(metaEl);
    }
    metaEl.content = monetagToken;

    removeIntrusiveMonetag();
    const inpageEnabled = (data["monetag_inpage_enabled"] ?? "true") !== "false";
    const inpageScript = data["monetag_inpage_script"]?.trim() || MONETAG_INPAGE_DEFAULT;
    if (inpageEnabled && !inGame) {
      injectSmartSnippet(inpageScript, "monetag-inpage-script", "https://nap5k.com/tag.min.js");
    }

    const client = data["adsense_client"]?.trim();
    if (client && !document.getElementById("adsense-loader")) {
      const sc = document.createElement("script");
      sc.id = "adsense-loader";
      sc.async = true;
      sc.crossOrigin = "anonymous";
      sc.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
      document.head.appendChild(sc);
    }

    const html = data["head_script"]?.trim();
    if (html) {
      injectSmartSnippet(html, "custom-head-script");
    }
  }, [data, inGame]);
}

function Footer() {
  const { data: pages } = usePages();
  const extra = (pages ?? []).filter(
    (p) => p.slug.startsWith("page-") && p.status !== "disabled" && p.title,
  );
  return (
    <footer className="mt-10 flex flex-wrap justify-center gap-x-4 gap-y-1 px-4 text-xs text-muted-foreground">
      {extra.map((p) => (
        <Link
          key={p.slug}
          to="/p/$slug"
          params={{ slug: p.slug }}
          className="hover:text-foreground"
        >
          {p.title}
        </Link>
      ))}
      <Link to="/faq" className="hover:text-foreground">
        FAQ
      </Link>
      <Link to="/conditions" className="hover:text-foreground">
        Conditions d'utilisation
      </Link>
    </footer>
  );
}
