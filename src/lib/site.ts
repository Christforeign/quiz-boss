import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const SETTING_KEYS = [
  {
    key: "site_bgm_url",
    label: "🎵 Lien (URL MP3/Audio) de la chanson de fond du site (quand on ne joue pas)",
  },
  {
    key: "site_bgm_credit",
    label:
      "🎵 Crédits & Artiste de la musique (ex: Maître Gims — Tous droits réservés au propriétaire)",
  },
  {
    key: "monetag_meta",
    label:
      "Jeton de validation Monetag <meta name='monetag'> (défaut: 59029dc25ef25e3de878e23f259217d6)",
  },
  {
    key: "monetag_vignette_enabled",
    label: "Activer Fonction Pub 1 : Vignette Banner (true / false, défaut: true)",
  },
  {
    key: "monetag_vignette_zone",
    label:
      "Fonction Pub 1 (Vignette) — Zone ID, Lien URL ou Script (défaut: 11987279 / n6wxm.com/vignette.min.js)",
  },
  {
    key: "monetag_inpage_enabled",
    label: "Activer Fonction Pub 2 : In-Page Push / In-Push (true / false, défaut: true)",
  },
  {
    key: "monetag_inpage_script",
    label: "Fonction Pub 2 (In-Page Push / In-Push) — Zone ID, Lien URL, Code JS ou <script>",
  },
  {
    key: "monetag_postgame_enabled",
    label:
      "Afficher automatiquement la pub Monetag après chaque Quiz et chaque Duel (true / false, défaut: true)",
  },
  {
    key: "monetag_rewarded_url",
    label:
      "🎬 Pub Monetag pour Débloquer 1 Duel Gratuit — Lien Direct (Smartlink), Zone ID ou Script (optionnel : utilise Vignette/In-Push par défaut)",
  },
  { key: "whatsapp_support", label: "Numéro WhatsApp support (ex: 50937000000)" },
  { key: "whatsapp_channel", label: "Lien de la chaîne WhatsApp officielle" },
  { key: "deposit_min_amount", label: "Montant minimum de dépôt en GDS (défaut: 25)" },
  { key: "deposit_instructions", label: "Instructions générales affichées sur la page de dépôt" },
  { key: "withdraw_min_amount", label: "Montant minimum de retrait en GDS (défaut: 100)" },
  { key: "withdraw_min_level", label: "Niveau minimum requis pour retirer (défaut: 1)" },
  { key: "adsense_client", label: "ID éditeur AdSense (ca-pub-… optionnel)" },
  { key: "adsense_slot", label: "ID de bloc d'annonce AdSense (optionnel)" },
  {
    key: "head_script",
    label: "Code <head> libre (accepte URL, lien, <meta>, <script>, HTML ou JS)",
  },
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
    staleTime: 0,
    refetchInterval: 6000,
    refetchOnWindowFocus: true,
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
    staleTime: 0,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    queryFn: async () => (await supabase.from("custom_pages").select("*")).data ?? [],
  });
}

/** Notifie en temps réel tous les utilisateurs connectés qu'une modification Admin a eu lieu. */
export async function broadcastAdminUpdate() {
  try {
    await supabase.from("app_settings").upsert({
      key: "site_last_updated_at",
      value: String(Date.now()),
      updated_at: new Date().toISOString(),
    });
  } catch {
    // ignore
  }
  try {
    const ch = supabase.channel("quizboss-global-sync");
    ch.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        ch.send({
          type: "broadcast",
          event: "admin-sync",
          payload: { ts: Date.now() },
        }).finally(() => {
          setTimeout(() => supabase.removeChannel(ch), 800);
        });
      }
    });
  } catch {
    // ignore
  }
}

/** Upload a file (image or audio) to private storage and return a long-lived signed URL. */
export async function uploadMedia(file: File, folder: string) {
  try {
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
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
    if (file.type.startsWith("audio/") || /\.(mp3|m4a|wav|ogg|aac)$/i.test(file.name)) {
      return await readFileAsDataUrl(file);
    }
    return await compressImageToDataUrl(file, 900, 0.78);
  }
}

export async function uploadPaymentProof(file: File): Promise<string> {
  return uploadMedia(file, "deposits");
}

/**
 * Compresse et recadre une photo de profil en carré 160x160 ultra-léger
 * pour une synchronisation instantanée entre tous les joueurs du site.
 */
export async function uploadProfilePhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Impossible de lire la photo"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(String(reader.result));
      img.onload = () => {
        const size = 160;
        const c = document.createElement("canvas");
        c.width = size;
        c.height = size;
        const ctx = c.getContext("2d");
        if (!ctx) return resolve(String(reader.result));
        const minSide = Math.min(img.width, img.height);
        const sx = Math.floor((img.width - minSide) / 2);
        const sy = Math.floor((img.height - minSide) / 2);
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        resolve(c.toDataURL("image/jpeg", 0.78));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function makeSvgAvatar(bg1: string, bg2: string, emoji: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${bg1}"/><stop offset="100%" stop-color="${bg2}"/></linearGradient></defs><rect width="120" height="120" rx="60" fill="url(#g)"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-size="60">${emoji}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const PRESET_AVATARS = [
  { id: "crown", label: "Boss", url: makeSvgAvatar("#f59e0b", "#ef4444", "👑") },
  { id: "lion", label: "Lion", url: makeSvgAvatar("#8b5cf6", "#ec4899", "🦁") },
  { id: "bolt", label: "Éclair", url: makeSvgAvatar("#10b981", "#059669", "⚡") },
  { id: "fire", label: "Flamme", url: makeSvgAvatar("#f97316", "#dc2626", "🔥") },
  { id: "dj", label: "Vibes", url: makeSvgAvatar("#3b82f6", "#6366f1", "🎧") },
  { id: "gem", label: "Diamant", url: makeSvgAvatar("#06b6d4", "#2563eb", "💎") },
  { id: "queen", label: "Queen", url: makeSvgAvatar("#ec4899", "#9333ea", "👸🏾") },
  { id: "king", label: "King", url: makeSvgAvatar("#14b8a6", "#0f766e", "🥷🏾") },
] as const;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Impossible de lire le fichier"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
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

/* ---------- Injection universelle de Script / URL / Lien / Code <head> & Monetag ---------- */

const injectedFingerprints = new Map<string, string>();

/**
 * Injecte et exécute proprement tout format collé dans l'Admin :
 * - Zone ID Monetag (ex: "11987279")
 * - URL directe de script (ex: "https://n6wxm.com/vignette.min.js")
 * - Code JS brut (ex: "(function(s){s.dataset.zone='11987279'...})(...)")
 * - Code HTML complet (<script>...</script>, <meta ...>, <link ...>, <iframe>...)
 */
export function injectSmartSnippet(
  rawInput: string,
  holderId: string,
  defaultDomain = "https://n6wxm.com/vignette.min.js",
) {
  if (typeof document === "undefined") return;
  const trimmed = rawInput.trim();

  // Supprimer l'ancien script All-in-One intrusif s'il était présent
  if (trimmed.includes("quge5.com") || trimmed.includes("228397")) return;

  const prev = injectedFingerprints.get(holderId);
  if (prev === trimmed && document.getElementById(holderId)) return;
  injectedFingerprints.set(holderId, trimmed);

  // Nettoyer l'ancien conteneur s'il existait pour appliquer la mise à jour immédiatement
  document.getElementById(holderId)?.remove();
  document.querySelectorAll(`[data-holder="${holderId}"]`).forEach((el) => el.remove());

  if (!trimmed) return;

  const holder = document.createElement("div");
  holder.id = holderId;
  holder.style.display = "none";
  document.body.appendChild(holder);

  // Cas 1 : Zone ID numérique pur (ex: "11987279")
  if (/^\d{4,12}$/.test(trimmed)) {
    const s = document.createElement("script");
    s.dataset.zone = trimmed;
    s.dataset.holder = holderId;
    s.src = defaultDomain;
    s.async = true;
    document.body.appendChild(s);
    return;
  }

  // Cas 2 : URL directe (https://... ou //...)
  if (/^(https?:)?\/\/[^\s<>"]+$/i.test(trimmed)) {
    const s = document.createElement("script");
    s.src = trimmed;
    s.async = true;
    s.dataset.holder = holderId;
    const zoneMatch = trimmed.match(/[?&]zone=(\d+)/i);
    if (zoneMatch?.[1]) s.dataset.zone = zoneMatch[1];
    document.head.appendChild(s);
    return;
  }

  // Cas 3 : Contient des balises HTML (<script>, <meta>, <link>, <iframe>...)
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    const tpl = document.createElement("template");
    tpl.innerHTML = trimmed;
    tpl.content.childNodes.forEach((node) => {
      if (node instanceof HTMLScriptElement) {
        const sc = document.createElement("script");
        Array.from(node.attributes).forEach((a) => sc.setAttribute(a.name, a.value));
        sc.dataset.holder = holderId;
        if (node.textContent) sc.text = node.textContent;
        document.head.appendChild(sc);
      } else if (node instanceof HTMLMetaElement || node instanceof HTMLLinkElement) {
        const clone = node.cloneNode(true) as HTMLElement;
        clone.setAttribute("data-holder", holderId);
        document.head.appendChild(clone);
      } else {
        holder.appendChild(node.cloneNode(true));
      }
    });
    return;
  }

  // Cas 4 : Code JavaScript brut sans balise <script> (ex: (function(s){...})(...))
  const sc = document.createElement("script");
  sc.dataset.holder = holderId;
  sc.text = trimmed;
  document.head.appendChild(sc);
}

/**
 * Déclenche la publicité Monetag (Vignette + In-Page Push) à la fin d'un Quiz ou d'un Duel,
 * sans gêner les boutons pendant la partie.
 */
export function triggerPostGameMonetagAd(settings?: Record<string, string>) {
  if (typeof document === "undefined") return;
  const postGameEnabled = (settings?.["monetag_postgame_enabled"] ?? "true") !== "false";
  if (!postGameEnabled) return;

  const vignetteEnabled = (settings?.["monetag_vignette_enabled"] ?? "true") !== "false";
  const vignetteInput = settings?.["monetag_vignette_zone"]?.trim() || "11987279";

  if (vignetteEnabled && vignetteInput) {
    // Réinjecter / rafraîchir le script Vignette à la fin de la partie pour déclencher l'affichage post-jeu
    injectedFingerprints.delete("monetag-postgame-vignette");
    injectSmartSnippet(
      vignetteInput,
      "monetag-postgame-vignette",
      "https://n6wxm.com/vignette.min.js",
    );
  }

  const inpageEnabled = (settings?.["monetag_inpage_enabled"] ?? "true") !== "false";
  const inpageInput = settings?.["monetag_inpage_script"]?.trim();
  if (inpageEnabled && inpageInput) {
    injectSmartSnippet(inpageInput, "monetag-inpage-script", "https://n6wxm.com/vignette.min.js");
  }
}

/**
 * Déclenche une publicité Monetag récompensée (Vignette + In-Push + Smartlink/Zone dédié)
 * lorsqu'un joueur regarde une pub pour débloquer 1 Partie Duel Gratuite.
 */
export function triggerRewardedMonetagAd(settings?: Record<string, string>): {
  directLinkUrl?: string;
} {
  if (typeof document === "undefined") return {};

  const vignetteInput = settings?.["monetag_vignette_zone"]?.trim() || "11987279";
  if (vignetteInput) {
    injectedFingerprints.delete("monetag-rewarded-vignette");
    injectSmartSnippet(
      vignetteInput,
      "monetag-rewarded-vignette",
      "https://n6wxm.com/vignette.min.js",
    );
  }

  const inpageInput = settings?.["monetag_inpage_script"]?.trim();
  if (inpageInput) {
    injectedFingerprints.delete("monetag-rewarded-inpage");
    injectSmartSnippet(inpageInput, "monetag-rewarded-inpage", "https://n6wxm.com/vignette.min.js");
  }

  const rewardedInput = settings?.["monetag_rewarded_url"]?.trim();
  if (rewardedInput) {
    // Si c'est un lien web pur (Direct Link / Smartlink Monetag), le retourner pour l'afficher/ouvrir
    if (
      /^https?:\/\/[^\s<>"]+$/i.test(rewardedInput) &&
      !/\.js(\?|$)/i.test(rewardedInput)
    ) {
      return { directLinkUrl: rewardedInput };
    }
    injectedFingerprints.delete("monetag-rewarded-custom");
    injectSmartSnippet(
      rewardedInput,
      "monetag-rewarded-custom",
      "https://n6wxm.com/vignette.min.js",
    );
  }

  return {};
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
  await broadcastAdminUpdate();
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: ["payment_methods"],
    staleTime: 0,
    refetchInterval: 6000,
    refetchOnWindowFocus: true,
    queryFn: fetchPaymentMethods,
  });
}

/* ---------- Système de Dépôts Manuels (avec preuve de paiement & sync multi-appareils) ---------- */

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
  const map = new Map<string, DepositRequest>();
  for (const d of readLocalDeposits()) {
    map.set(d.id, d);
  }

  try {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", SETTINGS_DEPOSITS_KEY)
      .maybeSingle();
    if (data?.value) {
      const remote = JSON.parse(data.value) as DepositRequest[];
      for (const d of remote) map.set(d.id, d);
    }
  } catch {
    // ignore
  }

  // Lire aussi les dépôts soumis par les joueurs via la table withdrawals (préfixe DEPOT:)
  try {
    const { data: wRows } = await supabase
      .from("withdrawals")
      .select("*")
      .like("method", "DEPOT:%")
      .order("created_at", { ascending: false });
    for (const w of wRows ?? []) {
      let meta: {
        transaction_ref?: string;
        proof_url?: string | null;
        notes?: string | null;
        user_id?: string | null;
      } = {};
      try {
        meta = JSON.parse(w.contact || "{}");
      } catch {
        meta = { transaction_ref: w.contact };
      }
      const existing = map.get(w.id);
      map.set(w.id, {
        id: w.id,
        player_id: w.player_id,
        user_id: w.user_id ?? meta.user_id ?? existing?.user_id ?? null,
        full_name: w.full_name,
        sender_account: w.account,
        method: w.method.replace(/^DEPOT:/, ""),
        amount: w.amount,
        transaction_ref: meta.transaction_ref ?? existing?.transaction_ref ?? "",
        proof_url: meta.proof_url ?? existing?.proof_url ?? null,
        notes: meta.notes ?? existing?.notes ?? null,
        status: (w.status as DepositRequest["status"]) || existing?.status || "pending",
        created_at: w.created_at,
      });
    }
  } catch {
    // ignore if non-admin
  }

  const merged = Array.from(map.values()).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  writeLocalDeposits(merged);
  return merged;
}

async function saveDepositsLedger(list: DepositRequest[]) {
  writeLocalDeposits(list);
  try {
    await supabase.from("app_settings").upsert({
      key: SETTINGS_DEPOSITS_KEY,
      value: JSON.stringify(list.slice(0, 150)),
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
  let newId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `dep-${Date.now()}`;

  // Insérer aussi dans withdrawals (autorisé en INSERT pour tous les joueurs anon/authenticated)
  try {
    const contactPayload = JSON.stringify({
      transaction_ref: req.transaction_ref,
      proof_url: req.proof_url,
      notes: req.notes,
      user_id: req.user_id,
    });
    const { data: inserted } = await supabase
      .from("withdrawals")
      .insert({
        player_id: req.player_id,
        user_id: req.user_id,
        full_name: req.full_name,
        contact: contactPayload,
        method: `DEPOT:${req.method}`,
        account: req.sender_account,
        amount: req.amount,
        level: 1,
        status: "pending",
      })
      .select("id")
      .maybeSingle();
    if (inserted?.id) newId = inserted.id;
  } catch {
    // ignore
  }

  const item: DepositRequest = {
    ...req,
    id: newId,
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
  try {
    await supabase.from("withdrawals").update({ status }).eq("id", id);
  } catch {
    // ignore
  }

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
  await broadcastAdminUpdate();
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

/* ---------- Annuaire des VRAIS Comptes Joueurs (Zéro faux joueurs / bots) ---------- */

export type RegisteredPlayer = {
  id: string;
  pseudo: string;
  avatarUrl?: string;
  level: number;
  coins?: number;
  xp?: number;
  gamesPlayed?: number;
  online?: boolean;
  updatedAt: string;
};

const LEGACY_FAKE_PSEUDOS = new Set([
  "jeanmarc_509",
  "stephyqueen",
  "kevboss_ht",
  "nadia_pap",
  "juniorgonaives",
  "mika_caphaitien",
  "daphnee_jacmel",
  "alex_cayes",
  "woodley_pro",
  "ashley_quiz",
]);

function isFakeLegacyPlayer(p: { id?: string; pseudo?: string }) {
  if (!p.pseudo?.trim()) return true;
  if (p.id?.startsWith("usr-ht-")) return true;
  if (LEGACY_FAKE_PSEUDOS.has(p.pseudo.trim().toLowerCase())) return true;
  return false;
}

const PLAYERS_DIR_SETTINGS_KEY = "players_directory_json";
const LOCAL_PLAYERS_DIR_KEY = "quizboss-real-players-dir-v2";

// Cache mémoire des joueurs connectés en direct via Supabase Realtime Presence
let realtimePresencePlayers: RegisteredPlayer[] = [];

export function setRealtimePresencePlayers(list: RegisteredPlayer[]) {
  realtimePresencePlayers = list.filter((p) => !isFakeLegacyPlayer(p));
}

export async function fetchAllRegisteredPlayers(): Promise<RegisteredPlayer[]> {
  const map = new Map<string, RegisteredPlayer>();

  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(LOCAL_PLAYERS_DIR_KEY);
      if (raw) {
        for (const p of JSON.parse(raw) as RegisteredPlayer[]) {
          if (!isFakeLegacyPlayer(p)) map.set(p.id, { ...p, online: false });
        }
      }
    } catch {
      // ignore
    }
  }

  try {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", PLAYERS_DIR_SETTINGS_KEY)
      .maybeSingle();
    if (data?.value) {
      for (const p of JSON.parse(data.value) as RegisteredPlayer[]) {
        if (!isFakeLegacyPlayer(p)) {
          map.set(p.id, { ...p, online: false });
        }
      }
    }
  } catch {
    // ignore
  }

  try {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id,display_name,coins,xp,games_played,device_id,updated_at")
      .order("updated_at", { ascending: false });
    for (const pr of profs ?? []) {
      const pseudo = pr.display_name?.trim();
      if (pseudo && !isFakeLegacyPlayer({ id: pr.id, pseudo })) {
        const lvl = Math.floor(Math.sqrt((pr.xp ?? 0) / 250)) + 1;
        const key = pr.device_id || pr.id;
        map.set(key, {
          id: key,
          pseudo,
          level: lvl,
          coins: pr.coins ?? 0,
          xp: pr.xp ?? 0,
          gamesPlayed: pr.games_played ?? 0,
          online: Date.now() - new Date(pr.updated_at).getTime() < 10 * 60 * 1000,
          updatedAt: pr.updated_at ?? new Date().toISOString(),
        });
      }
    }
  } catch {
    // ignore RLS restriction for non-admin
  }

  // Marquer en ligne les vrais joueurs connectés via Supabase Realtime Presence
  for (const rp of realtimePresencePlayers) {
    if (!isFakeLegacyPlayer(rp)) {
      const prev = map.get(rp.id);
      map.set(rp.id, {
        ...prev,
        ...rp,
        avatarUrl: rp.avatarUrl || prev?.avatarUrl,
        online: true,
      });
    }
  }

  // Lire aussi l'annuaire cross-user depuis public.referrals (accessible en SELECT/INSERT à tous les joueurs)
  try {
    const { data: refPlayers } = await supabase
      .from("referrals")
      .select("invitee_device, created_at")
      .eq("referrer_id", "QB_PLAYER")
      .order("created_at", { ascending: false })
      .limit(120);
    for (const row of refPlayers ?? []) {
      try {
        const parsed = JSON.parse(row.invitee_device) as RegisteredPlayer;
        if (parsed?.id && parsed?.pseudo && !isFakeLegacyPlayer(parsed)) {
          const prev = map.get(parsed.id);
          const isRecent =
            Date.now() - new Date(row.created_at || parsed.updatedAt).getTime() < 15 * 60 * 1000;
          if (!prev || prev.updatedAt < parsed.updatedAt) {
            map.set(parsed.id, {
              ...prev,
              ...parsed,
              avatarUrl: parsed.avatarUrl || prev?.avatarUrl,
              online: Boolean(prev?.online || isRecent),
            });
          } else if (parsed.avatarUrl && !prev.avatarUrl) {
            map.set(parsed.id, {
              ...prev,
              avatarUrl: parsed.avatarUrl,
            });
          }
        }
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }

  return Array.from(map.values()).sort((a, b) => {
    if (Boolean(a.online) !== Boolean(b.online)) return a.online ? -1 : 1;
    return a.updatedAt < b.updatedAt ? 1 : -1;
  });
}

let lastPlayerDirPushKey = "";

export async function registerPlayerInDirectory(player: {
  id: string;
  pseudo: string;
  level: number;
  avatarUrl?: string;
}) {
  const cleanPseudo = player.pseudo.trim();
  if (!cleanPseudo || isFakeLegacyPlayer({ id: player.id, pseudo: cleanPseudo })) return;
  const avatarSig = player.avatarUrl ? player.avatarUrl.slice(-32) : "";
  const pushKey = `${player.id}:${cleanPseudo}:${player.level}:${avatarSig}`;
  const all = await fetchAllRegisteredPlayers();
  const existing = all.find((x) => x.id === player.id);
  const finalAvatar = player.avatarUrl !== undefined ? player.avatarUrl : existing?.avatarUrl;
  const entry: RegisteredPlayer = {
    id: player.id,
    pseudo: cleanPseudo,
    avatarUrl: finalAvatar,
    level: player.level,
    online: true,
    updatedAt: new Date().toISOString(),
  };
  const filtered = all.filter((x) => x.id !== player.id && !isFakeLegacyPlayer(x));
  const next = [entry, ...filtered].slice(0, 200);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LOCAL_PLAYERS_DIR_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }
  if (lastPlayerDirPushKey !== pushKey) {
    lastPlayerDirPushKey = pushKey;
    try {
      await supabase.from("referrals").insert({
        referrer_id: "QB_PLAYER",
        invitee_device: JSON.stringify({
          ...entry,
          _uid: `${player.id}-${Date.now()}`,
        }),
      });
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

/* ---------- Salons Multijoueurs & Défis en direct (2 à 4 joueurs) ---------- */

export type DuelParticipant = {
  id: string;
  name: string;
  avatarUrl?: string;
  score: number;
  finished: boolean;
};

export type DuelRoomQuestion = {
  id: string;
  category: string;
  question: string;
  options: string[];
  correct_index: number;
  lang: string;
  image_url: string | null;
  difficulty: number;
};

export type DuelRoom = {
  code: string;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  category: string;
  stake: number;
  maxPlayers: number; // 2..4
  visibility: "public" | "private";
  targetPseudo?: string;
  invitedPseudos?: string[];
  status: "waiting" | "playing" | "finished";
  players: DuelParticipant[];
  questionIds: string[];
  questions?: DuelRoomQuestion[];
  createdAt: string;
  updatedAt?: string;
};

const LOCAL_ROOMS_KEY = "quizboss-duel-rooms-v4";
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
  const map = new Map<string, DuelRoom>();
  const now = Date.now();
  const MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2h

  const mergeRoom = (r: DuelRoom) => {
    if (!r?.code) return;
    const age = now - new Date(r.updatedAt || r.createdAt).getTime();
    if (age > MAX_AGE_MS) return;
    const existing = map.get(r.code);
    if (!existing) {
      map.set(r.code, r);
      return;
    }
    const existingTs = new Date(existing.updatedAt || existing.createdAt).getTime();
    const newTs = new Date(r.updatedAt || r.createdAt).getTime();
    if (
      newTs >= existingTs ||
      r.players.length > existing.players.length ||
      (r.status === "playing" && existing.status === "waiting")
    ) {
      map.set(r.code, {
        ...existing,
        ...r,
        questions: r.questions?.length ? r.questions : existing.questions,
      });
    }
  };

  for (const r of readLocalRooms()) mergeRoom(r);

  // 1. Lire depuis public.referrals (accessible à tous les joueurs sur Android, iOS, Windows, Mac)
  try {
    const { data: refRows } = await supabase
      .from("referrals")
      .select("invitee_device, created_at")
      .eq("referrer_id", "QB_ROOM")
      .order("created_at", { ascending: false })
      .limit(60);
    for (const row of refRows ?? []) {
      try {
        const parsed = JSON.parse(row.invitee_device) as DuelRoom;
        mergeRoom(parsed);
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }

  // 2. Lire aussi depuis app_settings si disponible
  try {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", SETTINGS_ROOMS_KEY)
      .maybeSingle();
    if (data?.value) {
      const remote = JSON.parse(data.value) as DuelRoom[];
      for (const r of remote) mergeRoom(r);
    }
  } catch {
    // ignore
  }

  const merged = Array.from(map.values()).sort((a, b) =>
    (a.updatedAt || a.createdAt) < (b.updatedAt || b.createdAt) ? 1 : -1,
  );
  writeLocalRooms(merged);
  return merged;
}

export async function saveDuelRoom(room: DuelRoom): Promise<DuelRoom> {
  const stamped: DuelRoom = {
    ...room,
    updatedAt: new Date().toISOString(),
  };
  const rooms = await listDuelRooms();
  const idx = rooms.findIndex((r) => r.code === stamped.code);
  if (idx >= 0) rooms[idx] = stamped;
  else rooms.unshift(stamped);
  const trimmed = rooms.slice(0, 40);
  writeLocalRooms(trimmed);

  // Persister dans public.referrals (autorisé en INSERT et SELECT pour TOUS les utilisateurs du site)
  try {
    await supabase.from("referrals").insert({
      referrer_id: "QB_ROOM",
      invitee_device: JSON.stringify({
        ...stamped,
        _uid: `${stamped.code}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      }),
    });
  } catch {
    // ignore
  }

  try {
    await supabase.from("app_settings").upsert({
      key: SETTINGS_ROOMS_KEY,
      value: JSON.stringify(trimmed),
      updated_at: new Date().toISOString(),
    });
  } catch {
    // ignore
  }

  try {
    const ch = supabase.channel("quizboss-duel-lobby");
    ch.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        ch.send({
          type: "broadcast",
          event: "room-updated",
          payload: { room: stamped },
        }).finally(() => {
          setTimeout(() => supabase.removeChannel(ch), 600);
        });
      }
    });
  } catch {
    // ignore
  }
  return stamped;
}

/* ---------- Notifications Système Cross-Platform (Android, iOS, Windows, Mac) ---------- */

export function registerNotificationServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

export async function requestCrossPlatformNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || typeof Notification === "undefined") return false;
  registerNotificationServiceWorker();
  if (Notification.permission === "granted") return true;
  const res = await Notification.requestPermission();
  return res === "granted";
}

export async function triggerCrossPlatformNotification(
  title: string,
  body: string,
  url = "/",
  tag?: string,
) {
  if (typeof window === "undefined" || typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;

  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && "showNotification" in reg) {
        await reg.showNotification(title, {
          body,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          tag: tag || `qb-${Date.now()}`,
          data: { url },
        });
        return;
      }
    }
  } catch {
    // fallback to standard Notification constructor
  }

  try {
    const notif = new Notification(title, {
      body,
      icon: "/icon-192.png",
      tag: tag || `qb-${Date.now()}`,
    });
    notif.onclick = () => {
      window.focus();
      if (url) window.location.href = url;
    };
  } catch {
    // ignore
  }
}

/* ---------- Widget Support en Direct (User <-> Admin temps réel) ---------- */

export type SupportMessage = {
  id: string;
  threadId: string; // player.id
  playerName: string;
  contact?: string;
  sender: "user" | "admin";
  text: string;
  createdAt: string;
};

const LOCAL_SUPPORT_KEY = "quizboss-support-msgs-v1";
const SETTINGS_SUPPORT_KEY = "support_messages_json";

function readLocalSupportMessages(): SupportMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_SUPPORT_KEY);
    return raw ? (JSON.parse(raw) as SupportMessage[]) : [];
  } catch {
    return [];
  }
}

function writeLocalSupportMessages(list: SupportMessage[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_SUPPORT_KEY, JSON.stringify(list.slice(-300)));
  } catch {
    // ignore
  }
}

export async function fetchSupportMessages(): Promise<SupportMessage[]> {
  const map = new Map<string, SupportMessage>();
  for (const m of readLocalSupportMessages()) {
    if (m?.id) map.set(m.id, m);
  }

  try {
    const { data: refRows } = await supabase
      .from("referrals")
      .select("invitee_device, created_at")
      .eq("referrer_id", "QB_SUPPORT")
      .order("created_at", { ascending: false })
      .limit(200);
    for (const row of refRows ?? []) {
      try {
        const parsed = JSON.parse(row.invitee_device) as SupportMessage;
        if (parsed?.id && parsed?.threadId && parsed?.text) {
          map.set(parsed.id, parsed);
        }
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }

  try {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", SETTINGS_SUPPORT_KEY)
      .maybeSingle();
    if (data?.value) {
      for (const m of JSON.parse(data.value) as SupportMessage[]) {
        if (m?.id) map.set(m.id, m);
      }
    }
  } catch {
    // ignore
  }

  const sorted = Array.from(map.values()).sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
  writeLocalSupportMessages(sorted);
  return sorted;
}

export async function sendSupportMessage(input: {
  threadId: string;
  playerName: string;
  contact?: string;
  sender: "user" | "admin";
  text: string;
}): Promise<SupportMessage> {
  const msg: SupportMessage = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `sup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    threadId: input.threadId,
    playerName: input.playerName.trim() || `Joueur_${input.threadId.slice(0, 4)}`,
    contact: input.contact?.trim() || undefined,
    sender: input.sender,
    text: input.text.trim(),
    createdAt: new Date().toISOString(),
  };

  const current = await fetchSupportMessages();
  const next = [...current, msg].slice(-250);
  writeLocalSupportMessages(next);

  // 1. Insérer dans public.referrals (accessible en lecture/écriture pour le joueur ET l'admin)
  try {
    await supabase.from("referrals").insert({
      referrer_id: "QB_SUPPORT",
      invitee_device: JSON.stringify(msg),
    });
  } catch {
    // ignore
  }

  // 2. Sauvegarder aussi dans app_settings si Admin
  try {
    await supabase.from("app_settings").upsert({
      key: SETTINGS_SUPPORT_KEY,
      value: JSON.stringify(next),
      updated_at: new Date().toISOString(),
    });
  } catch {
    // ignore
  }

  // 3. Diffuser en temps réel via Supabase Broadcast
  try {
    const ch = supabase.channel("quizboss-support");
    ch.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        ch.send({
          type: "broadcast",
          event: "support-msg",
          payload: { message: msg },
        }).finally(() => {
          setTimeout(() => supabase.removeChannel(ch), 600);
        });
      }
    });
  } catch {
    // ignore
  }

  return msg;
}
