import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const SETTING_KEYS = [
  { key: "whatsapp_support", label: "Numéro WhatsApp support (ex: 50937000000)" },
  { key: "whatsapp_channel", label: "Lien de la chaîne WhatsApp officielle" },
  { key: "deposit_min_amount", label: "Montant minimum de dépôt en GDS (défaut: 25)" },
  { key: "deposit_instructions", label: "Instructions générales affichées sur la page de dépôt" },
  { key: "withdraw_min_amount", label: "Montant minimum de retrait en GDS (défaut: 100)" },
  { key: "withdraw_min_level", label: "Niveau minimum requis pour retirer (défaut: 1)" },
  {
    key: "monetag_meta",
    label:
      "Jeton de validation Monetag <meta name='monetag'> (défaut: 59029dc25ef25e3de878e23f259217d6)",
  },
  {
    key: "monetag_vignette_zone",
    label: "Zone ID Monetag Vignette Banner (défaut: 11987279)",
  },
  {
    key: "monetag_inpage_script",
    label: "Script Monetag In-Page Push (In-Push) ou Bannière à injecter dans <head>",
  },
  { key: "adsense_client", label: "ID éditeur AdSense (ca-pub-… optionnel)" },
  { key: "adsense_slot", label: "ID de bloc d'annonce AdSense (optionnel)" },
  { key: "head_script", label: "Autre code HTML / Script personnalisé dans <head> (optionnel)" },
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
    staleTime: 30 * 1000,
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("key,value");
      return Object.fromEntries((data ?? []).map((r) => [r.key, r.value ?? ""])) as Record<
        string,
        string
      >;
    },
  });
}

export function usePages() {
  return useQuery({
    queryKey: ["custom_pages"],
    queryFn: async () => (await supabase.from("custom_pages").select("*")).data ?? [],
  });
}

/** Upload a file to private storage and return a long-lived signed URL. */
export async function uploadMedia(file: File, folder: string) {
  try {
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("media")
      .upload(path, file, { contentType: file.type });
    if (error) throw error;
    const { data, error: e2 } = await supabase.storage
      .from("media")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (e2 || !data) throw e2 ?? new Error("URL error");
    return data.signedUrl;
  } catch {
    return await compressImageToDataUrl(file, 1000, 0.8);
  }
}

export async function uploadPaymentProof(file: File): Promise<string> {
  return uploadMedia(file, "deposits");
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

/* ---------- Méthodes de Paiement & Retrait Modifiables ---------- */

export type PaymentMethodConfig = {
  id: string;
  name: string;
  receiverAccount: string;
  receiverName: string;
  accountLabel: string;
  instructions: string;
  forDeposit: boolean;
  forWithdrawal: boolean;
  active: boolean;
};

export const DEFAULT_PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: "moncash",
    name: "MonCash",
    receiverAccount: "+509 3700-0000",
    receiverName: "QuizBoss Haïti",
    accountLabel: "Ton numéro MonCash",
    instructions:
      "Envoie le montant via MonCash puis joins la capture d'écran et le numéro de transaction.",
    forDeposit: true,
    forWithdrawal: true,
    active: true,
  },
  {
    id: "natcash",
    name: "Natcash",
    receiverAccount: "+509 4000-0000",
    receiverName: "QuizBoss Haïti",
    accountLabel: "Ton numéro Natcash",
    instructions:
      "Effectue le transfert Natcash puis indique la référence de transaction et la capture d'écran.",
    forDeposit: true,
    forWithdrawal: true,
    active: true,
  },
  {
    id: "paypal",
    name: "PayPal",
    receiverAccount: "paiement@quizboss.app",
    receiverName: "QuizBoss",
    accountLabel: "Ton adresse email PayPal",
    instructions: "Envoie le montant sur notre adresse PayPal puis joins la capture du reçu.",
    forDeposit: true,
    forWithdrawal: true,
    active: true,
  },
  {
    id: "virement",
    name: "Virement Bancaire",
    receiverAccount: "Sogebank / Unibank",
    receiverName: "QuizBoss",
    accountLabel: "Nom de ta banque & N° de compte / IBAN",
    instructions: "Effectue le virement bancaire puis téléverse la photo ou capture du bordereau.",
    forDeposit: true,
    forWithdrawal: true,
    active: true,
  },
];

const PAYMENT_METHODS_SETTINGS_KEY = "payment_methods_json";
const LOCAL_PAYMENT_METHODS_KEY = "quizboss-payment-methods-v1";

export async function fetchPaymentMethods(): Promise<PaymentMethodConfig[]> {
  try {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", PAYMENT_METHODS_SETTINGS_KEY)
      .maybeSingle();
    if (data?.value) {
      const parsed = JSON.parse(data.value) as PaymentMethodConfig[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(LOCAL_PAYMENT_METHODS_KEY, JSON.stringify(parsed));
        }
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(LOCAL_PAYMENT_METHODS_KEY);
      if (raw) return JSON.parse(raw) as PaymentMethodConfig[];
    } catch {
      // ignore
    }
  }
  return DEFAULT_PAYMENT_METHODS;
}

export async function savePaymentMethods(methods: PaymentMethodConfig[]): Promise<void> {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LOCAL_PAYMENT_METHODS_KEY, JSON.stringify(methods));
  }
  await supabase.from("app_settings").upsert({
    key: PAYMENT_METHODS_SETTINGS_KEY,
    value: JSON.stringify(methods),
    updated_at: new Date().toISOString(),
  });
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: ["payment_methods"],
    staleTime: 30 * 1000,
    queryFn: fetchPaymentMethods,
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
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", SETTINGS_DEPOSITS_KEY)
      .maybeSingle();
    if (data?.value) {
      const remote = JSON.parse(data.value) as DepositRequest[];
      const map = new Map<string, DepositRequest>();
      for (const d of [...local, ...remote]) map.set(d.id, d);
      const merged = Array.from(map.values()).sort((a, b) =>
        a.created_at < b.created_at ? 1 : -1,
      );
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
    // ignore
  }
}

export async function createDepositRequest(
  req: Omit<DepositRequest, "id" | "status" | "created_at">,
): Promise<DepositRequest> {
  const current = await fetchDeposits();
  const item: DepositRequest = {
    ...req,
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `dep-${Date.now()}`,
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

  if (status === "approved" && target && (target as DepositRequest).user_id) {
    const uid = (target as DepositRequest).user_id!;
    const amt = (target as DepositRequest).amount;
    try {
      const { data: prof } = await supabase
        .from("profiles")
        .select("coins")
        .eq("id", uid)
        .maybeSingle();
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
 * - Plus le montant misé est élevé, plus le site prélève une commission élevée.
 */
export function calculateDuelPot(stake: number, playerCount: number): DuelPotBreakdown {
  const count = Math.min(4, Math.max(2, playerCount));
  const cleanStake = Math.max(0, Math.round(stake));
  const totalPot = cleanStake * count;
  if (cleanStake === 0) {
    return {
      stake: 0,
      playerCount: count,
      totalPot: 0,
      commissionPct: 0,
      siteFee: 0,
      winnerPayout: 0,
    };
  }

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

/* ---------- Annuaire de tous les comptes (Pseudos) & Défis Duel ---------- */

export type RegisteredPlayer = {
  id: string;
  pseudo: string;
  level: number;
  online?: boolean;
  updatedAt: string;
};

const INITIAL_COMMUNITY_PLAYERS: RegisteredPlayer[] = [
  {
    id: "usr-ht-1",
    pseudo: "JeanMarc_509",
    level: 7,
    online: true,
    updatedAt: "2026-10-09T10:00:00Z",
  },
  {
    id: "usr-ht-2",
    pseudo: "StephyQueen",
    level: 5,
    online: true,
    updatedAt: "2026-10-09T10:00:00Z",
  },
  {
    id: "usr-ht-3",
    pseudo: "KevBoss_HT",
    level: 9,
    online: true,
    updatedAt: "2026-10-09T10:00:00Z",
  },
  {
    id: "usr-ht-4",
    pseudo: "Nadia_PaP",
    level: 4,
    online: true,
    updatedAt: "2026-10-09T10:00:00Z",
  },
  {
    id: "usr-ht-5",
    pseudo: "JuniorGonaives",
    level: 6,
    online: true,
    updatedAt: "2026-10-09T10:00:00Z",
  },
  {
    id: "usr-ht-6",
    pseudo: "Mika_CapHaitien",
    level: 8,
    online: true,
    updatedAt: "2026-10-09T10:00:00Z",
  },
  {
    id: "usr-ht-7",
    pseudo: "Daphnee_Jacmel",
    level: 3,
    online: false,
    updatedAt: "2026-10-09T09:30:00Z",
  },
  {
    id: "usr-ht-8",
    pseudo: "Alex_Cayes",
    level: 5,
    online: true,
    updatedAt: "2026-10-09T10:00:00Z",
  },
  {
    id: "usr-ht-9",
    pseudo: "Woodley_Pro",
    level: 11,
    online: true,
    updatedAt: "2026-10-09T10:00:00Z",
  },
  {
    id: "usr-ht-10",
    pseudo: "ashley_quiz",
    level: 4,
    online: false,
    updatedAt: "2026-10-09T09:15:00Z",
  },
];

const PLAYERS_DIR_SETTINGS_KEY = "players_directory_json";
const LOCAL_PLAYERS_DIR_KEY = "quizboss-players-dir-v1";

export async function fetchAllRegisteredPlayers(): Promise<RegisteredPlayer[]> {
  const map = new Map<string, RegisteredPlayer>();
  for (const p of INITIAL_COMMUNITY_PLAYERS) {
    map.set(p.id, p);
  }

  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(LOCAL_PLAYERS_DIR_KEY);
      if (raw) {
        for (const p of JSON.parse(raw) as RegisteredPlayer[]) {
          if (p.pseudo?.trim()) map.set(p.id, p);
        }
      }
    } catch {
      // ignore
    }
  }

  try {
    const { data: profs } = await supabase.from("profiles").select("id,display_name,xp,updated_at");
    for (const pr of profs ?? []) {
      if (pr.display_name?.trim()) {
        const lvl = Math.floor(Math.sqrt((pr.xp ?? 0) / 250)) + 1;
        map.set(pr.id, {
          id: pr.id,
          pseudo: pr.display_name.trim(),
          level: lvl,
          online: true,
          updatedAt: pr.updated_at ?? new Date().toISOString(),
        });
      }
    }
  } catch {
    // ignore RLS restriction
  }

  try {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", PLAYERS_DIR_SETTINGS_KEY)
      .maybeSingle();
    if (data?.value) {
      for (const p of JSON.parse(data.value) as RegisteredPlayer[]) {
        if (p.pseudo?.trim()) map.set(p.id, p);
      }
    }
  } catch {
    // ignore
  }

  return Array.from(map.values());
}

export async function registerPlayerInDirectory(player: {
  id: string;
  pseudo: string;
  level: number;
}) {
  if (!player.pseudo.trim()) return;
  const all = await fetchAllRegisteredPlayers();
  const entry: RegisteredPlayer = {
    id: player.id,
    pseudo: player.pseudo.trim(),
    level: player.level,
    online: true,
    updatedAt: new Date().toISOString(),
  };
  const filtered = all.filter((x) => x.id !== player.id);
  const next = [entry, ...filtered].slice(0, 150);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LOCAL_PLAYERS_DIR_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }
  try {
    await supabase.from("app_settings").upsert({
      key: PLAYERS_DIR_SETTINGS_KEY,
      value: JSON.stringify(next),
      updated_at: new Date().toISOString(),
    });
  } catch {
    // ignore
  }
}

/* ---------- Salons Multijoueurs User vs User (Chambre Libre & Chambre Privée, 2 à 4 joueurs) ---------- */

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
  visibility: "public" | "private"; // Chambre libre vs Chambre privée
  invitedPseudos?: string[];
  status: "waiting" | "playing" | "finished";
  players: DuelParticipant[];
  questionIds: string[];
  createdAt: string;
};

const LOCAL_ROOMS_KEY = "quizboss-duel-rooms-v2";
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
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", SETTINGS_ROOMS_KEY)
      .maybeSingle();
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
