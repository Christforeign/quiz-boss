import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Home, Sparkles, Globe, Wallet, UserPlus, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getPlayer, levelFromXp, updatePlayer, usePlayer, REFERRAL_BONUS } from "@/lib/player";
import { NotificationPrompt } from "./NotificationPrompt";

const NAV = [
  { to: "/", label: "Jouer", icon: Home },
  { to: "/statuts", label: "Statuts", icon: Sparkles },
  { to: "/explorer", label: "Explorer", icon: Globe },
  { to: "/retrait", label: "Retrait", icon: Wallet },
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
        if (!error) updatePlayer((x) => ({ referredBy: ref, coins: x.coins + REFERRAL_BONUS }));
      });
  }, []);
}

function useNotificationPoller() {
  useEffect(() => {
    const check = async () => {
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
      const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(1);
      const n = data?.[0];
      if (!n) return;
      const last = localStorage.getItem("quizboss-last-notif");
      if (last === n.id) return;
      localStorage.setItem("quizboss-last-notif", n.id);
      if (!last) return; // don't replay old ones on first subscribe
      const notif = new Notification(n.title, { body: n.body, icon: "/icon-192.png" });
      notif.onclick = () => { window.focus(); if (n.url) window.location.href = n.url; };
    };
    check();
    const t = setInterval(check, 60000);
    return () => clearInterval(t);
  }, []);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const player = usePlayer();
  const path = useRouterState({ select: (s) => s.location.pathname });
  useReferralCapture();
  useNotificationPoller();
  const isAdmin = path.startsWith("/admin");

  return (
    <div className="mx-auto min-h-screen max-w-2xl pb-28">
      <header className="sticky top-0 z-30 flex items-center gap-3 bg-background/80 px-4 py-3 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2">
          <img src="/icon-192.png" alt="" width={32} height={32} className="h-8 w-8" />
          <span className="font-display text-xl font-extrabold">Quiz<span className="text-primary">Boss</span></span>
        </Link>
        {!isAdmin && (
          <div className="ml-auto flex items-center gap-2 text-sm font-bold">
            <span className="flex items-center gap-1 rounded-full bg-accent/15 px-3 py-1 text-accent">
              <Coins className="h-4 w-4" /> {player.coins}
            </span>
            <span className="rounded-full bg-primary/15 px-3 py-1 text-primary">Niv. {levelFromXp(player.xp)}</span>
          </div>
        )}
      </header>
      {!isAdmin && <NotificationPrompt />}
      <main className="px-4">{children}</main>
      {!isAdmin && (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/90 backdrop-blur-lg">
          <div className="mx-auto flex max-w-2xl justify-around px-2 py-2">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                className="flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors"
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
