import { useEffect, useSyncExternalStore } from "react";

const KEY = "quizboss-muted";
let muted: boolean | null = null;
const subs = new Set<() => void>();
let ctx: AudioContext | null = null;
let bgmTimer: ReturnType<typeof setInterval> | null = null;
let bgmStep = 0;

function isMuted() {
  if (muted === null)
    muted = typeof localStorage !== "undefined" && localStorage.getItem(KEY) === "1";
  return muted;
}

export function toggleMute() {
  muted = !isMuted();
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(KEY, muted ? "1" : "0");
  }
  if (muted) stopBgm();
  subs.forEach((s) => s());
}

export function useMuted() {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    isMuted,
    () => false,
  );
}

function ac() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function tone(
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType = "sine",
  vol = 0.18,
  endFreq?: number,
) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + start;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(Math.max(20, freq), t);
  if (endFreq) o.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.025);
}

function noiseBurst(start: number, dur: number, vol = 0.06) {
  const c = ac();
  if (!c) return;
  const bufferSize = Math.floor(c.sampleRate * dur);
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
  }
  const noise = c.createBufferSource();
  noise.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1800;
  const g = c.createGain();
  const t = c.currentTime + start;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  noise.connect(filter).connect(g).connect(c.destination);
  noise.start(t);
}

export const sfx = {
  /** Subtle UI tap */
  click() {
    if (isMuted()) return;
    tone(720, 0, 0.04, "sine", 0.08, 480);
  },

  /** Energetic match start fanfare */
  start() {
    if (isMuted()) return;
    tone(440, 0, 0.1, "triangle", 0.15);
    tone(554.37, 0.1, 0.1, "triangle", 0.15);
    tone(659.25, 0.2, 0.12, "triangle", 0.18);
    tone(880, 0.32, 0.28, "sawtooth", 0.14, 920);
    tone(440, 0.32, 0.28, "triangle", 0.14);
  },

  /** Correct answer chord that pitches up with combo streak */
  correct(streak = 1) {
    if (isMuted()) return;
    const mult = Math.min(1.6, 1 + Math.max(0, streak - 1) * 0.07);
    tone(523.25 * mult, 0, 0.1, "triangle", 0.18);
    tone(659.25 * mult, 0.07, 0.12, "triangle", 0.2);
    tone(783.99 * mult, 0.14, 0.22, "triangle", 0.22);
    tone(1046.5 * mult, 0.21, 0.28, "sine", 0.18);
  },

  /** Special combo streak sound (3x, 5x, etc.) */
  combo() {
    if (isMuted()) return;
    [587.33, 739.99, 880, 1174.66, 1479.98].forEach((f, i) => {
      tone(f, i * 0.055, 0.18, "triangle", 0.18);
    });
    noiseBurst(0.15, 0.12, 0.05);
  },

  /** Wrong answer / mistake buzzer + sub-bass drop */
  wrong() {
    if (isMuted()) return;
    tone(240, 0, 0.2, "sawtooth", 0.15, 160);
    tone(175, 0.15, 0.35, "sawtooth", 0.16, 95);
    tone(110, 0, 0.4, "sine", 0.2, 55);
  },

  /** Timer tick + tense heartbeat when urgent */
  tick(urgent = false) {
    if (isMuted()) return;
    if (urgent) {
      tone(1480, 0, 0.045, "square", 0.09, 980);
      tone(95, 0, 0.09, "sine", 0.22, 55);
      tone(85, 0.12, 0.08, "sine", 0.16, 50);
    } else {
      tone(1050, 0, 0.035, "triangle", 0.07, 800);
    }
  },

  /** Time expired horn */
  timeout() {
    if (isMuted()) return;
    tone(311.13, 0, 0.22, "sawtooth", 0.16, 277.18);
    tone(233.08, 0.2, 0.45, "sawtooth", 0.18, 155.56);
    noiseBurst(0, 0.2, 0.06);
  },

  /** Coin / GDS reward chime */
  coin() {
    if (isMuted()) return;
    tone(987.77, 0, 0.08, "sine", 0.2);
    tone(1318.51, 0.075, 0.32, "sine", 0.22);
    tone(2637.02, 0.08, 0.18, "triangle", 0.08);
  },

  /** Joker / Power-up activation sweep */
  powerup() {
    if (isMuted()) return;
    tone(330, 0, 0.28, "sine", 0.18, 1320);
    tone(440, 0.06, 0.28, "triangle", 0.15, 1760);
  },

  /** Duel buzzer */
  buzz() {
    if (isMuted()) return;
    tone(440, 0, 0.08, "square", 0.15, 660);
    tone(880, 0.06, 0.18, "sawtooth", 0.14, 990);
    noiseBurst(0, 0.06, 0.04);
  },

  /** Level-up epic fanfare */
  levelUp() {
    if (isMuted()) return;
    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    const times = [0, 0.1, 0.2, 0.3, 0.45, 0.57];
    const durs = [0.1, 0.1, 0.1, 0.14, 0.11, 0.45];
    notes.forEach((f, i) => {
      tone(f, times[i]!, durs[i]!, "triangle", 0.22);
      tone(f * 0.5, times[i]!, durs[i]!, "sine", 0.14);
    });
  },

  /** Victory melody */
  win() {
    if (isMuted()) return;
    [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) => {
      tone(f, i * 0.11, 0.32, "triangle", 0.22);
      tone(f * 0.5, i * 0.11, 0.32, "sine", 0.12);
    });
    sfx.coin();
  },

  /** Defeat / Game over melody */
  lose() {
    if (isMuted()) return;
    [392, 369.99, 349.23, 311.13].forEach((f, i) => {
      tone(f, i * 0.18, 0.35, "sawtooth", 0.13);
      tone(f * 0.5, i * 0.18, 0.38, "sine", 0.16);
    });
  },
};

const BASS_LINE = [110, 110, 130.81, 146.83, 110, 110, 164.81, 146.83];

export function startBgm(intense = false) {
  stopBgm();
  if (isMuted()) return;
  bgmStep = 0;
  const intervalMs = intense ? 240 : 300;
  bgmTimer = setInterval(() => {
    if (isMuted()) return;
    const note = BASS_LINE[bgmStep % BASS_LINE.length]!;
    tone(note * (intense ? 1.12 : 1), 0, 0.14, "triangle", 0.045);
    if (bgmStep % 2 === 1) {
      tone(note * 2, 0, 0.06, "sine", 0.025);
    }
    bgmStep++;
  }, intervalMs);
}

export function stopBgm() {
  if (bgmTimer) {
    clearInterval(bgmTimer);
    bgmTimer = null;
  }
}

export function useQuizBgm(active: boolean, intense = false) {
  const isAudioMuted = useMuted();
  useEffect(() => {
    if (active && !isAudioMuted) {
      startBgm(intense);
    } else {
      stopBgm();
    }
    return () => stopBgm();
  }, [active, intense, isAudioMuted]);
}
