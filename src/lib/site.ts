import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const SETTING_KEYS = [
  { key: "whatsapp_support", label: "Numéro WhatsApp support (ex: 50937000000)" },
  { key: "whatsapp_channel", label: "Lien de la chaîne WhatsApp officielle" },
  { key: "deposit_moncash_number", label: "💳 Dépôt MonCash — Numéro de réception (ex: +509 3700-0000)" },
  { key: "deposit_moncash_name", label: "💳 Dépôt MonCash — Nom du compte bénéficiaire" },
  { key: "deposit_natcash_number", label: "💳 Dépôt Natcash — Numéro de réception (ex: +509 4000-0000)" },
  { key: "deposit_natcash_name", label: "💳 Dépôt Natcash — Nom du compte bénéficiaire" },
  { key: "deposit_paypal_email", label: "💳 Dépôt PayPal — Email ou lien PayPal.me" },
  { key: "deposit_bank_info", label: "💳 Dépôt Virement — Coordonnées bancaires (Banque, Nom, N° compte)" },
  { key: "deposit_min_amount", label: "💳 Dépôt — Montant minimum en GDS (défaut: 25)" },
  { key: "deposit_instructions", label: "💳 Dépôt — Instructions affichées aux joueurs" },
  { key: "withdraw_min_amount", label: "💸 Retrait — Montant minimum en GDS (défaut: 100)" },
  { key: "withdraw_min_level", label: "💸 Retrait — Niveau minimum requis (défaut: 5)" },
  { key: "adsense_client", label: "ID éditeur AdSense (ca-pub-…)" },
  { key: "adsense_slot", label: "ID de bloc d'annonce AdSense (optionnel)" },
  { key: "head_script", label: "Script personnalisé (HTML collé dans la page : bannière, pixel, régie…)" },
] as const;

export const PAGE_SLOTS = [
  { slug: "page-1", label: "Page libre 1" },
  { slug: "page-2", label: "Page libre 2" },
  { slug: "page-3", label: "Page libre 3" },
  { slug: "page-4", label: "Page libre 4" },
  { slug: "page-5", label: "Page libre 5" },
  { slug: "conditions", label: "Conditions d'utilisation" },
  { slug: "faq", label: "FAQ" },
] as const;

export const PAGE_STATUS = [
  { id: "active", label: "Active" },
  { id: "coming_soon", label: "Bientôt disponible" },
  { id: "maintenance", label: "Maintenance en cours" },
  { id: "disabled", label: "Désactivée" },
] as const;

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("key,value");
      return Object.fromEntries((data ?? []).map((r) => [r.key, r.value ?? ""])) as Record<string, string>;
    },
  });
}

export function usePages() {
  return useQuery({
    queryKey: ["custom_pages"],
    queryFn: async () => (await supabase.from("custom_pages").select("*")).data ?? [],
  });
}

/** Admin-only: upload a file to private storage and return a long-lived signed URL. */
export async function uploadMedia(file: File, folder: string) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
  if (error) throw error;
  const { data, error: e2 } = await supabase.storage.from("media").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (e2 || !data) throw e2 ?? new Error("URL error");
  return data.signedUrl;
}

/**
 * Upload d'une preuve de paiement (capture d'écran / reçu) par un joueur :
 * Essaie d'abord le bucket Supabase `media`, et compresse automatiquement en Data URL
 * si les règles RLS du bucket bloquent les utilisateurs non-admin.
 */
export async function uploadPaymentProof(file: File): Promise<string> {
  try {
    return await uploadMedia(file, "deposits");
  } catch {
    return await compressImageToDataUrl(file, 900, 0.78);
  }
}

function compressImageToDataUrl(file: File, maxDim = 900, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Impossible de lire l'image"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(String(reader.result));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        const ctx = c.getContext("2d");
        if (!ctx) return resolve(String(reader.result));
        ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/* ---------- Système de Dépôts Manuels (avec preuve de paiement) ---------- */

export type DepositRequest = {
  id: string;
  player_id: string;
  user_id: string | null;
  full_name: string;
  sender_account: string;
  method: string;
  amount: number;
  transaction_ref: string;
  proof_url: string | null;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

const LOCAL_DEPOSITS_KEY = "quizboss-deposits-v1";
const SETTINGS_DEPOSITS_KEY = "deposits_ledger_json";

function readLocalDeposits(): DepositRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_DEPOSITS_KEY);
    return raw ? (JSON.parse(raw) as DepositRequest[]) : [];
  } catch {
    return [];
  }
}

function writeLocalDeposits(list: DepositRequest[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_DEPOSITS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export async function fetchDeposits(): Promise<DepositRequest[]> {
  const local = readLocalDeposits();
  try {
    const { data } = await supabase.from("app_settings").select("value").eq("key", SETTINGS_DEPOSITS_KEY).maybeSingle();
    if (data?.value) {
      const remote = JSON.parse(data.value) as DepositRequest[];
      const map = new Map<string, DepositRequest>();
      for (const d of [...local, ...remote]) map.set(d.id, d);
      const merged = Array.from(map.values()).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      writeLocalDeposits(merged);
      return merged;
    }
  } catch {
    // fallback to local
  }
  return local.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

async function saveDepositsLedger(list: DepositRequest[]) {
  writeLocalDeposits(list);
  try {
    await supabase.from("app_settings").upsert({
      key: SETTINGS_DEPOSITS_KEY,
      value: JSON.stringify(list.slice(0, 200)),
      updated_at: new Date().toISOString(),
    });
  } catch {
    // ignore if non-admin cannot write to app_settings
  }
}

export async function createDepositRequest(
  req: Omit<DepositRequest, "id" | "status" | "created_at">,
): Promise<DepositRequest> {
  const current = await fetchDeposits();
  const item: DepositRequest = {
    ...req,
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `dep-${Date.now()}`,
    status: "pending",
    created_at: new Date().toISOString(),
  };
  const next = [item, ...current];
  await saveDepositsLedger(next);
  return item;
}

export async function updateDepositStatus(
  id: string,
  status: "approved" | "rejected",
): Promise<DepositRequest | null> {
  const current = await fetchDeposits();
  let target: DepositRequest | null = null;
  const next = current.map((d) => {
    if (d.id === id) {
      target = { ...d, status };
      return target;
    }
    return d;
  });
  await saveDepositsLedger(next);

  // Si l'admin valide et que le joueur a un compte Supabase, créditer aussi son profil en base
  if (status === "approved" && target && (target as DepositRequest).user_id) {
    const uid = (target as DepositRequest).user_id!;
    const amt = (target as DepositRequest).amount;
    try {
      const { data: prof } = await supabase.from("profiles").select("coins").eq("id", uid).maybeSingle();
      if (prof) {
        await supabase
          .from("profiles")
          .update({ coins: (prof.coins ?? 0) + amt, updated_at: new Date().toISOString() })
          .eq("id", uid);
      }
    } catch {
      // ignore
    }
  }
  return target;
}

/* ---------- Calcul de la Cagnotte & Commission progressive des Duels (en GDS) ---------- */

export type DuelPotBreakdown = {
  stake: number;
  playerCount: number;
  totalPot: number;
  commissionPct: number;
  siteFee: number;
  winnerPayout: number;
};

/**
 * Calcule la cagnotte et la commission du site pour un duel de 2 à 4 joueurs :
 * - À 25 GDS × 2 joueurs = 50 GDS total → le site prend 5 GDS (10%), le gagnant obtient 45 GDS.
 * - Plus le montant misé est élevé, plus le pourcentage et le montant prélevés par le site augmentent.
 */
export function calculateDuelPot(stake: number, playerCount: number): DuelPotBreakdown {
  const count = Math.min(4, Math.max(2, playerCount));
  const cleanStake = Math.max(0, Math.round(stake));
  const totalPot = cleanStake * count;
  if (cleanStake === 0) {
    return { stake: 0, playerCount: count, totalPot: 0, commissionPct: 0, siteFee: 0, winnerPayout: 0 };
  }

  // Barème progressif : tant le montant est haut, tant le site prend plus
  let commissionPct = 10;
  if (cleanStake >= 500) commissionPct = 18;
  else if (cleanStake >= 250) commissionPct = 15;
  else if (cleanStake >= 100) commissionPct = 14;
  else if (cleanStake >= 50) commissionPct = 12;
  else commissionPct = 10; // 25 GDS -> 10% (sur 50 GDS = 5 GDS site, 45 GDS gagnant)

  const siteFee = Math.max(1, Math.round((totalPot * commissionPct) / 100));
  const winnerPayout = Math.max(0, totalPot - siteFee);

  return {
    stake: cleanStake,
    playerCount: count,
    totalPot,
    commissionPct,
    siteFee,
    winnerPayout,
  };
}

/* ---------- Salons Multijoueurs User vs User (2 à 4 joueurs) ---------- */

export type DuelParticipant = {
  id: string;
  name: string;
  score: number;
  finished: boolean;
  isBot?: boolean;
};

export type DuelRoom = {
  code: string;
  hostId: string;
  hostName: string;
  category: string;
  stake: number;
  maxPlayers: number; // 2..4
  status: "waiting" | "playing" | "finished";
  players: DuelParticipant[];
  questionIds: string[];
  createdAt: string;
};

const LOCAL_ROOMS_KEY = "quizboss-duel-rooms-v1";
const SETTINGS_ROOMS_KEY = "duel_rooms_active_json";

function readLocalRooms(): DuelRoom[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_ROOMS_KEY);
    return raw ? (JSON.parse(raw) as DuelRoom[]) : [];
  } catch {
    return [];
  }
}

function writeLocalRooms(rooms: DuelRoom[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_ROOMS_KEY, JSON.stringify(rooms.slice(0, 50)));
  } catch {
    // ignore
  }
}

export async function listDuelRooms(): Promise<DuelRoom[]> {
  const local = readLocalRooms();
  try {
    const { data } = await supabase.from("app_settings").select("value").eq("key", SETTINGS_ROOMS_KEY).maybeSingle();
    if (data?.value) {
      const remote = JSON.parse(data.value) as DuelRoom[];
      const map = new Map<string, DuelRoom>();
      for (const r of [...local, ...remote]) map.set(r.code, r);
      const merged = Array.from(map.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      writeLocalRooms(merged);
      return merged;
    }
  } catch {
    // ignore
  }
  return local;
}

export async function saveDuelRoom(room: DuelRoom): Promise<DuelRoom> {
  const rooms = await listDuelRooms();
  const idx = rooms.findIndex((r) => r.code === room.code);
  if (idx >= 0) rooms[idx] = room;
  else rooms.unshift(room);
  const trimmed = rooms.slice(0, 40);
  writeLocalRooms(trimmed);
  try {
    await supabase.from("app_settings").upsert({
      key: SETTINGS_ROOMS_KEY,
      value: JSON.stringify(trimmed),
      updated_at: new Date().toISOString(),
    });
  } catch {
    // ignore
  }
  return room;
}
