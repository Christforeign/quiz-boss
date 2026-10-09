import { Link, useRouterState } from "@tanstack/react-router";
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
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  addCoins,
  getPlayer,
  levelFromXp,
  usePlayer,
  useAuthSync,
  useSession,
  REFERRAL_BONUS,
} from "@/lib/player";
import { fetchDeposits, usePages, useSettings } from "@/lib/site";
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
      .then(({ error }) => {
        if (!error) addCoins(REFERRAL_BONUS, "Bonus de bienvenue", "reward", () => ({ referredBy: ref }));
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

export function AppShell({ children }: { children: React.ReactNode }) {
  const player = usePlayer();
  const path = useRouterState({ select: (s) => s.location.pathname });
  useReferralCapture();
  useNotificationPoller();
  useAuthSync();
  useDepositCreditSync();
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
              <Coins className="h-4 w-4" /> {player.coins} <span className="text-[11px] opacity-85">GDS</span>
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
  useEffect(() => {
    // Vignette ad script requested by owner (zone 11987279)
    if (!document.querySelector('script[data-zone="11987279"]')) {
      try {
        (function (s: HTMLScriptElement) {
          s.dataset.zone = "11987279";
          s.src = "https://n6wxm.com/vignette.min.js";
        })(
          [document.documentElement, document.body]
            .filter(Boolean)
            .pop()!
            .appendChild(document.createElement("script")),
        );
      } catch {
        // ignore ad-blocker errors
      }
    }

    if (!data) return;
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
    if (html && !document.getElementById("custom-head-script")) {
      const holder = document.createElement("div");
      holder.id = "custom-head-script";
      holder.style.display = "none";
      const tpl = document.createElement("template");
      tpl.innerHTML = html;
      tpl.content.childNodes.forEach((n) => {
        if (n instanceof HTMLScriptElement) {
          const sc = document.createElement("script");
          Array.from(n.attributes).forEach((a) => sc.setAttribute(a.name, a.value));
          sc.text = n.text;
          document.head.appendChild(sc);
        } else holder.appendChild(n.cloneNode(true));
      });
      document.body.appendChild(holder);
    }
  }, [data]);
}

function Footer() {
  const { data: pages } = usePages();
  const extra = (pages ?? []).filter(
    (p) => p.slug.startsWith("page-") && p.status !== "disabled" && p.title,
  );
  return (
    <footer className="mt-10 flex flex-wrap justify-center gap-x-4 gap-y-1 px-4 text-xs text-muted-foreground">
      {extra.map((p) => (
        <Link key={p.slug} to="/p/$slug" params={{ slug: p.slug }} className="hover:text-foreground">
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
