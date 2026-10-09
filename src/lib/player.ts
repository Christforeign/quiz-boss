import { useEffect, useSyncExternalStore } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { sfx } from "@/lib/sound";

export type Player = {
  id: string;
  name: string;
  coins: number;
  xp: number;
  gamesPlayed: number;
  bestScore: number;
  referralClaimed: number;
  referredBy?: string;
  history?: Tx[];
  duelDay?: string;
  duelsUsed?: number;
  duelBonus?: number;
  creditedDeposits?: string[];
};

export type Tx = {
  t: number;
  label: string;
  amount: number;
  kind: "solo" | "duel" | "reward" | "spend" | "deposit";
};

export const FREE_DUELS_PER_DAY = 5;
export const SHARE_DUEL_BONUS = 3;

const KEY = "quizboss-player";
const DEFAULT: Player = {
  id: "",
  name: "",
  coins: 50, // Bonus de départ pour tester les duels à 25 GDS
  xp: 0,
  gamesPlayed: 0,
  bestScore: 0,
  referralClaimed: 0,
};

export const WITHDRAW_MIN_LEVEL = 5;
export const WITHDRAW_MIN_COINS = 100;
export const DEPOSIT_MIN_COINS = 25;
export const REFERRAL_BONUS = 50;
export const COINS_PER_CORRECT = 3;
const XP_CURVE = 250; // XP needed grows quadratically: level n needs (n-1)^2 * XP_CURVE

let cache: Player | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function read(): Player {
  if (typeof window === "undefined") return DEFAULT;
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? { ...DEFAULT, ...JSON.parse(raw) } : { ...DEFAULT };
  } catch {
    cache = { ...DEFAULT };
  }
  if (!cache!.id) {
    cache!.id = Math.random().toString(36).slice(2, 10);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(cache));
    } catch {
      // ignore
    }
  }
  return cache!;
}

/* ---------- account sync ---------- */
let session: Session | null = null;
let pushTimer: ReturnType<typeof setTimeout> | undefined;

function pushProfile() {
  if (!session) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    const p = read();
    await supabase
      .from("profiles")
      .update({
        coins: p.coins,
        xp: p.xp,
        games_played: p.gamesPlayed,
        best_score: p.bestScore,
        referral_claimed: p.referralClaimed,
        device_id: p.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session!.user.id);
  }, 600);
}

function setLocal(next: Player) {
  cache = next;
  localStorage.setItem(KEY, JSON.stringify(cache));
  emit();
}

export function updatePlayer(fn: (p: Player) => Partial<Player>) {
  const cur = read();
  const prevLvl = levelFromXp(cur.xp);
  const next = { ...cur, ...fn(cur) };
  const nextLvl = levelFromXp(next.xp);
  setLocal(next);
  if (nextLvl > prevLvl) {
    setTimeout(() => sfx.levelUp(), 150);
  }
  pushProfile();
}

/** Change the coin/GDS balance and log it in the wallet history. */
export function addCoins(
  amount: number,
  label: string,
  kind: Tx["kind"],
  extra: (p: Player) => Partial<Player> = () => ({}),
) {
  if (amount > 0) {
    sfx.coin();
  }
  updatePlayer((p) => ({
    ...extra(p),
    coins: Math.max(0, p.coins + amount),
    history: [{ t: Date.now(), label, amount, kind }, ...(p.history ?? [])].slice(0, 100),
  }));
}

const today = () => new Date().toISOString().slice(0, 10);
export function duelsLeft(p: Player) {
  if (p.duelDay !== today()) return FREE_DUELS_PER_DAY;
  return Math.max(0, FREE_DUELS_PER_DAY + (p.duelBonus ?? 0) - (p.duelsUsed ?? 0));
}
export function consumeDuel() {
  updatePlayer((p) =>
    p.duelDay !== today()
      ? { duelDay: today(), duelsUsed: 1, duelBonus: 0 }
      : { duelsUsed: (p.duelsUsed ?? 0) + 1 },
  );
}
export function unlockDuelsByShare() {
  updatePlayer((p) =>
    p.duelDay !== today()
      ? { duelDay: today(), duelsUsed: 0, duelBonus: SHARE_DUEL_BONUS }
      : { duelBonus: (p.duelBonus ?? 0) + SHARE_DUEL_BONUS },
  );
}

export function getPlayer() {
  return read();
}

async function loadProfile(s: Session) {
  const { data } = await supabase.from("profiles").select("*").eq("id", s.user.id).maybeSingle();
  const local = read();
  if (!data) return;
  const fresh = data.xp === 0 && data.games_played === 0 && data.coins === 0;
  if (fresh && (local.xp > 0 || local.coins > 0)) {
    // First sign-in on this device: keep the guest progress and save it to the account.
    setLocal({ ...local, name: data.display_name ?? "" });
    pushProfile();
  } else {
    setLocal({
      ...local,
      name: data.display_name ?? "",
      coins: data.coins,
      xp: data.xp,
      gamesPlayed: data.games_played,
      bestScore: data.best_score,
      referralClaimed: data.referral_claimed,
      id: data.device_id || local.id,
    });
  }
}

let authReady = false;
export function useAuthSync() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      session = data.session;
      authReady = true;
      emit();
      if (session) loadProfile(session);
    });
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      const wasUser = session?.user.id;
      session = s;
      emit();
      if (event === "SIGNED_OUT") {
        setLocal({ ...DEFAULT, id: Math.random().toString(36).slice(2, 10) });
      } else if (s && s.user.id !== wasUser) {
        loadProfile(s);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);
}

export function useSession() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => (authReady ? session : undefined),
    () => undefined,
  );
}

export function usePlayer(): Player {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => DEFAULT,
  );
}

export function levelFromXp(xp: number) {
  return Math.floor(Math.sqrt(xp / XP_CURVE)) + 1;
}
export function xpForLevel(level: number) {
  return (level - 1) ** 2 * XP_CURVE;
}
export function levelProgress(xp: number) {
  const lvl = levelFromXp(xp);
  const a = xpForLevel(lvl);
  const b = xpForLevel(lvl + 1);
  return { level: lvl, pct: Math.round(((xp - a) / (b - a)) * 100), toNext: b - xp };
}
