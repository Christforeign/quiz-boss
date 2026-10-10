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
  MessageCircle,
  Megaphone,
  X,
  Music,
  Pause,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { addCoins, getPlayer, levelFromXp, usePlayer, useAuthSync, useSession } from "@/lib/player";
import {
  fetchDeposits,
  injectSmartSnippet,
  registerPlayerInDirectory,
  setRealtimePresencePlayers,
  usePages,
  useSettings,
  type RegisteredPlayer,
} from "@/lib/site";
import { toggleSiteMusic, useIsGameActive, useSiteBgm, useSiteMusicPlaying } from "@/lib/sound";
import { NotificationPrompt } from "./NotificationPrompt";
import { MuteButton } from "./MuteButton";

const NAV = [
  { to: "/", label: "Jouer", icon: Home },
  { to: "/statuts", label: "Statuts", icon: Sparkles },
  { to: "/duel", label: "Duel", icon: Swords },
  { to: "/portefeuille", label: "Wallet", icon: Wallet },
  { to: "/retrait", label: "Retrait", icon: Coins },
  { to: "/explorer", label: "Explorer", icon: Globe },
  { to: "/invite", label: "Inviter", icon: UserPlus },
] as const;

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

function useNotificationPoller() {
  useEffect(() => {
    const check = async () => {
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);
      const n = data?.[0];
      if (!n) return;
      const last = localStorage.getItem("quizboss-last-notif");
      if (last === n.id) return;
      localStorage.setItem("quizboss-last-notif", n.id);
      if (!last) return; // don't replay old ones on first subscribe
      const notif = new Notification(n.title, { body: n.body, icon: "/icon-192.png" });
      notif.onclick = () => {
        window.focus();
        if (n.url) window.location.href = n.url;
      };
    };
    check();
    const t = setInterval(check, 60000);
    return () => clearInterval(t);
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

function useGlobalPresenceSync() {
  const player = usePlayer();
  const navigate = useNavigate();

  useEffect(() => {
    if (!player.id) return;
    const myPseudo = player.name?.trim() || `Joueur_${player.id.slice(0, 4)}`;
    if (player.name?.trim()) {
      registerPlayerInDirectory({
        id: player.id,
        pseudo: player.name.trim(),
        level: levelFromXp(player.xp),
      });
    }

    const ch = supabase.channel("quizboss-duel-lobby", {
      config: { presence: { key: player.id } },
    });

    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState<{
        id: string;
        pseudo: string;
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
              level: item.level || 1,
              online: true,
              updatedAt: item.updatedAt || new Date().toISOString(),
            });
          }
        }
      }
      setRealtimePresencePlayers(onlineList);
    })
      .on("broadcast", { event: "duel-challenge" }, ({ payload }) => {
        if (!payload) return;
        const isForMe =
          payload.targetId === player.id ||
          (payload.targetPseudo && payload.targetPseudo.toLowerCase() === myPseudo.toLowerCase());
        if (isForMe && payload.hostId !== player.id) {
          toast(`⚔️ ${payload.hostName} te défie en Duel (${payload.stake} GDS) !`, {
            description: `Chambre ${payload.roomCode} · ${payload.maxPlayers} joueurs`,
            duration: 12000,
            action: {
              label: "Rejoindre",
              onClick: () => {
                navigate({ to: "/duel", search: { room: payload.roomCode } as never });
              },
            },
          });
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await ch.track({
            id: player.id,
            pseudo: myPseudo,
            level: levelFromXp(player.xp),
            updatedAt: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(ch);
    };
  }, [player.id, player.name, player.xp, navigate]);
}

function SiteMusicBar() {
  const { data: settings } = useSettings();
  const inGame = useIsGameActive();
  const isPlaying = useSiteMusicPlaying();
  const songUrl = settings?.["site_bgm_url"]?.trim();
  const songCredit = settings?.["site_bgm_credit"]?.trim();

  useSiteBgm(songUrl);

  if (!songUrl || inGame) return null;

  return (
    <div className="mx-auto mb-2 px-4">
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-primary/25 bg-card/85 px-3 py-1.5 text-xs backdrop-blur-md">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={toggleSiteMusic}
            aria-label={isPlaying ? "Mettre la musique en pause" : "Écouter la musique du site"}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-90"
          >
            {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </button>
          <Music
            className={`h-3.5 w-3.5 shrink-0 text-primary ${isPlaying ? "animate-spin" : ""}`}
          />
          <span className="truncate font-semibold text-muted-foreground">
            {songCredit ? (
              <>
                <b className="text-foreground">{songCredit}</b>
              </>
            ) : (
              "Ambiance musicale QuizBoss"
            )}
          </span>
        </div>
        <span className="shrink-0 text-[10px] font-bold text-primary">
          {isPlaying ? "En écoute" : "Cliquer ▶"}
        </span>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const player = usePlayer();
  const path = useRouterState({ select: (s) => s.location.pathname });
  useReferralCapture();
  useNotificationPoller();
  useAuthSync();
  useDepositCreditSync();
  useRealtimeAdminSync();
  useGlobalPresenceSync();
  useInjectedScripts();
  const session = useSession();
  const isAdmin = path.startsWith("/admin");

  return (
    <div className="mx-auto min-h-screen max-w-2xl pb-28">
      <header className="sticky top-0 z-30 flex items-center gap-2 bg-background/80 px-4 py-3 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2">
          <img src="/icon-192.png" alt="" width={32} height={32} className="h-8 w-8" />
          <span className="font-display text-xl font-extrabold">
            Quiz<span className="text-primary">Boss</span>
          </span>
        </Link>
        {!isAdmin && (
          <div className="ml-auto flex items-center gap-1.5 text-sm font-bold">
            <Link
              to="/portefeuille"
              aria-label="Mon portefeuille"
              className="flex items-center gap-1 rounded-full bg-accent/15 px-3 py-1 text-accent transition-transform active:scale-95"
            >
              <Coins className="h-4 w-4" /> {player.coins}{" "}
              <span className="text-[11px] opacity-85">GDS</span>
            </Link>
            <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs text-primary">
              Niv. {levelFromXp(player.xp)}
            </span>
            <MuteButton />
            <Link
              to="/auth"
              aria-label="Mon compte"
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                session ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              <UserRound className="h-4 w-4" />
            </Link>
          </div>
        )}
      </header>
      {!isAdmin && <SiteMusicBar />}
      {!isAdmin && <NotificationPrompt />}
      <main className="px-4">{children}</main>
      {!isAdmin && <Footer />}
      {!isAdmin && <WhatsAppFab />}
      {!isAdmin && (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/90 backdrop-blur-lg">
          <div className="mx-auto flex max-w-2xl justify-around px-1 py-2">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                className="flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-semibold text-muted-foreground transition-colors"
                activeProps={{ className: "text-primary bg-primary/10" }}
              >
                <Icon className="h-5 w-5" />
                {label}
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
    // Supprimer l'ancien script Monetag All-in-One (quge5.com / zone 228397)
    document
      .querySelectorAll('script[src*="quge5.com"], script[data-zone="228397"]')
      .forEach((el) => el.remove());

    if (!data) return;

    // 1. Jeton de validation <meta name="monetag">
    const monetagToken = data["monetag_meta"]?.trim() || "59029dc25ef25e3de878e23f259217d6";
    let metaEl = document.querySelector('meta[name="monetag"]') as HTMLMetaElement | null;
    if (!metaEl) {
      metaEl = document.createElement("meta");
      metaEl.name = "monetag";
      document.head.appendChild(metaEl);
    }
    metaEl.content = monetagToken;

    // 2. Fonction Pub 2 : In-Page Push (In-Push) — non-intrusive
    const inpageEnabled = (data["monetag_inpage_enabled"] ?? "true") !== "false";
    const inpageScript = data["monetag_inpage_script"]?.trim();
    if (inpageEnabled && inpageScript && !inGame) {
      injectSmartSnippet(
        inpageScript,
        "monetag-inpage-script",
        "https://n6wxm.com/vignette.min.js",
      );
    }

    // 3. Fonction Pub 1 : Vignette Banner — uniquement hors partie active pour ne jamais gêner les boutons de quiz/duel
    const vignetteEnabled = (data["monetag_vignette_enabled"] ?? "true") !== "false";
    const vignetteZone = data["monetag_vignette_zone"]?.trim() || "11987279";
    if (vignetteEnabled && vignetteZone && !inGame) {
      injectSmartSnippet(
        vignetteZone,
        "monetag-vignette-script",
        "https://n6wxm.com/vignette.min.js",
      );
    }

    // 4. Google AdSense (si configuré)
    const client = data["adsense_client"]?.trim();
    if (client && !document.getElementById("adsense-loader")) {
      const sc = document.createElement("script");
      sc.id = "adsense-loader";
      sc.async = true;
      sc.crossOrigin = "anonymous";
      sc.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
      document.head.appendChild(sc);
    }

    // 5. Code <head> libre (URL, lien, <meta>, <script>, HTML ou JS)
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

function WhatsAppFab() {
  const { data } = useSettings();
  const [open, setOpen] = useState(false);
  const support = data?.["whatsapp_support"]?.replace(/\D/g, "");
  const channel = data?.["whatsapp_channel"]?.trim();
  if (!support && !channel) return null;
  return (
    <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-2">
      {open && (
        <div className="flex flex-col gap-2 animate-pop">
          {support && (
            <a
              href={`https://wa.me/${support}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-semibold shadow-lg"
            >
              <MessageCircle className="h-4 w-4 text-success" /> Support
            </a>
          )}
          {channel && (
            <a
              href={channel}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-semibold shadow-lg"
            >
              <Megaphone className="h-4 w-4 text-success" /> Chaîne officielle
            </a>
          )}
        </div>
      )}
      <button
        aria-label="WhatsApp"
        onClick={() => setOpen(!open)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-success text-primary-foreground shadow-xl transition-transform active:scale-90"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
