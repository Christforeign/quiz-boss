import { useSyncExternalStore } from "react";

export type Player = {
  id: string;
  name: string;
  coins: number;
  xp: number;
  gamesPlayed: number;
  bestScore: number;
  referralClaimed: number;
  referredBy?: string;
};

const KEY = "quizboss-player";
const DEFAULT: Player = { id: "", name: "", coins: 0, xp: 0, gamesPlayed: 0, bestScore: 0, referralClaimed: 0 };

export const WITHDRAW_MIN_LEVEL = 5;
export const WITHDRAW_MIN_COINS = 500;
export const REFERRAL_BONUS = 50;
export const COINS_PER_CORRECT = 10;

let cache: Player | null = null;
const listeners = new Set<() => void>();

function read(): Player {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...DEFAULT, ...JSON.parse(raw) } : { ...DEFAULT };
  } catch {
    cache = { ...DEFAULT };
  }
  if (!cache!.id) {
    cache!.id = Math.random().toString(36).slice(2, 10);
    localStorage.setItem(KEY, JSON.stringify(cache));
  }
  return cache!;
}

export function updatePlayer(fn: (p: Player) => Partial<Player>) {
  const cur = read();
  cache = { ...cur, ...fn(cur) };
  localStorage.setItem(KEY, JSON.stringify(cache));
  listeners.forEach((l) => l());
}

export function getPlayer() {
  return read();
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
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}
export function xpForLevel(level: number) {
  return (level - 1) ** 2 * 100;
}
export function levelProgress(xp: number) {
  const lvl = levelFromXp(xp);
  const a = xpForLevel(lvl);
  const b = xpForLevel(lvl + 1);
  return { level: lvl, pct: Math.round(((xp - a) / (b - a)) * 100), toNext: b - xp };
}
