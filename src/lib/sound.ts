import { useSyncExternalStore } from "react";

const KEY = "quizboss-muted";
let muted: boolean | null = null;
const subs = new Set<() => void>();
let ctx: AudioContext | null = null;

function isMuted() {
  if (muted === null) muted = typeof localStorage !== "undefined" && localStorage.getItem(KEY) === "1";
  return muted;
}

export function toggleMute() {
  muted = !isMuted();
  localStorage.setItem(KEY, muted ? "1" : "0");
  subs.forEach((s) => s());
}

export function useMuted() {
  return useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, isMuted, () => false);
}

function ac() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", vol = 0.18, endFreq?: number) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + start;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const sfx = {
  correct() { if (isMuted()) return; tone(660, 0, 0.12, "triangle"); tone(990, 0.1, 0.2, "triangle"); },
  wrong() { if (isMuted()) return; tone(220, 0, 0.35, "sawtooth", 0.12, 110); },
  tick(urgent = false) { if (isMuted()) return; tone(urgent ? 1400 : 1000, 0, 0.05, "square", 0.06); },
  buzz() { if (isMuted()) return; tone(440, 0, 0.18, "square", 0.12, 520); },
  win() { if (isMuted()) return; [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.13, 0.3, "triangle", 0.2)); },
  lose() { if (isMuted()) return; [392, 330, 262].forEach((f, i) => tone(f, i * 0.2, 0.35, "sine", 0.18)); },
};
