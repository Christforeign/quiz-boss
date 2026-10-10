// @ts-nocheck
import type { Session, User } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

const SEED_QUESTIONS: AnyRecord[] = [
  {
    id: "q-1",
    category: "musique",
    question: 'Quel artiste a chanté "Blinding Lights" ?',
    options: ["The Weeknd", "Drake", "Bruno Mars", "Ed Sheeran"],
    correct_index: 0,
    lang: "fr",
    difficulty: 1,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "q-2",
    category: "musique",
    question: 'Quel groupe haïtien est célèbre pour le compas "Ou se tout pou mwen" ?',
    options: ["Tabou Combo", "Carimi", "Kassav", "T-Vice"],
    correct_index: 1,
    lang: "fr",
    difficulty: 1,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "q-3",
    category: "musique",
    question: "Sur TikTok, combien de secondes durait la vidéo maximale au lancement ?",
    options: ["15 s", "60 s", "3 min", "10 min"],
    correct_index: 0,
    lang: "fr",
    difficulty: 1,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "q-4",
    category: "musique",
    question: 'Ki chantè ki rele "Queen of Haitian music" ?',
    options: ["Rutshelle Guillaume", "Fabienne Denis", "Emeline Michel", "Tifane"],
    correct_index: 2,
    lang: "ht",
    difficulty: 1,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "q-5",
    category: "musique",
    question: 'Which artist released the album "Renaissance" in 2022?',
    options: ["Rihanna", "Beyoncé", "Adele", "Dua Lipa"],
    correct_index: 1,
    lang: "en",
    difficulty: 1,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "q-6",
    category: "musique",
    question: "Quel instrument est central dans le rara haïtien ?",
    options: ["Vaksin", "Violon", "Harpe", "Saxophone"],
    correct_index: 0,
    lang: "fr",
    difficulty: 2,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "q-7",
    category: "musique",
    question: 'Quelle danse TikTok a rendu "Renegade" populaire ?',
    options: [
      "Une chorégraphie de Jalaiah Harmon",
      "Un défi de cuisine",
      "Un sketch",
      "Un tuto maquillage",
    ],
    correct_index: 0,
    lang: "fr",
    difficulty: 2,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "q-8",
    category: "musique",
    question: 'Qui a chanté "Calm Down" avec Selena Gomez ?',
    options: ["Burna Boy", "Rema", "Wizkid", "Davido"],
    correct_index: 1,
    lang: "fr",
    difficulty: 1,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "q-9",
    category: "geographie",
    question: "Quelle est la capitale d'Haïti ?",
    options: ["Cap-Haïtien", "Port-au-Prince", "Jacmel", "Les Cayes"],
    correct_index: 1,
    lang: "fr",
    difficulty: 1,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "q-10",
    category: "geographie",
    question: "Quel est le plus long fleuve du monde ?",
    options: ["Amazone", "Nil", "Yangtsé", "Mississippi"],
    correct_index: 1,
    lang: "fr",
    difficulty: 1,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "q-11",
    category: "geographie",
    question: "Ki pi wo mòn an Ayiti ?",
    options: ["Pic la Selle", "Pic Macaya", "Mòn Pele", "Mòn Kabrit"],
    correct_index: 0,
    lang: "ht",
    difficulty: 1,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "q-12",
    category: "geographie",
    question: "Which country has the most population in 2024?",
    options: ["China", "India", "USA", "Indonesia"],
    correct_index: 1,
    lang: "en",
    difficulty: 1,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "q-13",
    category: "geographie",
    question: "Avec quel pays Haïti partage-t-il l'île ?",
    options: ["Cuba", "Jamaïque", "République dominicaine", "Porto Rico"],
    correct_index: 2,
    lang: "fr",
    difficulty: 1,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "q-14",
    category: "geographie",
    question: "Quelle est la capitale du Canada ?",
    options: ["Toronto", "Montréal", "Ottawa", "Vancouver"],
    correct_index: 2,
    lang: "fr",
    difficulty: 1,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "q-15",
    category: "geographie",
    question: "Quel océan est le plus grand ?",
    options: ["Atlantique", "Indien", "Arctique", "Pacifique"],
    correct_index: 3,
    lang: "fr",
    difficulty: 1,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "q-16",
    category: "geographie",
    question: "Dans quel pays se trouve Machu Picchu ?",
    options: ["Pérou", "Bolivie", "Chili", "Mexique"],
    correct_index: 0,
    lang: "fr",
    difficulty: 2,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "q-17",
    category: "culture",
    question: "En quelle année Haïti a proclamé son indépendance ?",
    options: ["1791", "1804", "1825", "1915"],
    correct_index: 1,
    lang: "fr",
    difficulty: 1,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "q-18",
    category: "culture",
    question: "Qui a peint la Joconde ?",
    options: ["Michel-Ange", "Picasso", "Léonard de Vinci", "Raphaël"],
    correct_index: 2,
    lang: "fr",
    difficulty: 1,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "q-19",
    category: "culture",
    question: "Konbyen jou ki genyen nan yon ane bisèkstil ?",
    options: ["364", "365", "366", "367"],
    correct_index: 2,
    lang: "ht",
    difficulty: 1,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "q-20",
    category: "culture",
    question: "What is the chemical symbol for gold?",
    options: ["Go", "Gd", "Au", "Ag"],
    correct_index: 2,
    lang: "en",
    difficulty: 1,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "q-21",
    category: "culture",
    question: "Quel est le plat traditionnel haïtien du 1er janvier ?",
    options: ["Griot", "Soup joumou", "Diri djon djon", "Lalo"],
    correct_index: 1,
    lang: "fr",
    difficulty: 1,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "q-22",
    category: "culture",
    question: "Combien de continents compte-t-on généralement ?",
    options: ["5", "6", "7", "8"],
    correct_index: 2,
    lang: "fr",
    difficulty: 1,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "q-23",
    category: "culture",
    question: 'Qui a écrit "Gouverneurs de la rosée" ?',
    options: ["Jacques Roumain", "Dany Laferrière", "Frankétienne", "Jacques Stephen Alexis"],
    correct_index: 0,
    lang: "fr",
    difficulty: 2,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "q-24",
    category: "culture",
    question: "Quelle planète est surnommée la planète rouge ?",
    options: ["Vénus", "Mars", "Jupiter", "Saturne"],
    correct_index: 1,
    lang: "fr",
    difficulty: 1,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "q-25",
    category: "cinema",
    question: "Qui joue Iron Man dans le MCU ?",
    options: ["Chris Evans", "Robert Downey Jr.", "Chris Hemsworth", "Mark Ruffalo"],
    correct_index: 1,
    lang: "fr",
    difficulty: 1,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "q-26",
    category: "cinema",
    question: 'Dans quelle série trouve-t-on "Winter is coming" ?',
    options: ["The Witcher", "Vikings", "Game of Thrones", "The Crown"],
    correct_index: 2,
    lang: "fr",
    difficulty: 1,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "q-27",
    category: "cinema",
    question: "Which film won Best Picture at the 2020 Oscars?",
    options: ["1917", "Joker", "Parasite", "Ford v Ferrari"],
    correct_index: 2,
    lang: "en",
    difficulty: 2,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "q-28",
    category: "cinema",
    question: "Quelle série Netflix coréenne met en scène des jeux mortels ?",
    options: ["Kingdom", "Squid Game", "All of Us Are Dead", "Sweet Home"],
    correct_index: 1,
    lang: "fr",
    difficulty: 1,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "q-29",
    category: "cinema",
    question: "Ki fim Disney ki gen yon lyon ki rele Simba ?",
    options: ["Le Roi Lion", "Aladdin", "Tarzan", "Moana"],
    correct_index: 0,
    lang: "ht",
    difficulty: 1,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "q-30",
    category: "cinema",
    question: 'Qui a réalisé "Titanic" ?',
    options: ["Steven Spielberg", "James Cameron", "Christopher Nolan", "Ridley Scott"],
    correct_index: 1,
    lang: "fr",
    difficulty: 1,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "q-31",
    category: "cinema",
    question: 'Dans "La Casa de Papel", quel est le surnom du cerveau ?',
    options: ["Le Professeur", "Berlin", "Tokyo", "Rio"],
    correct_index: 0,
    lang: "fr",
    difficulty: 1,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "q-32",
    category: "cinema",
    question: 'Quel personnage dit "Je s\'appelle Groot" ?',
    options: ["Rocket", "Groot", "Drax", "Star-Lord"],
    correct_index: 1,
    lang: "fr",
    difficulty: 1,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "q-33",
    category: "informatique",
    question: "Que signifie l'acronyme HTML ?",
    options: [
      "HyperText Markup Language",
      "HighTech Modern Language",
      "HyperTransfer Machine Link",
      "Home Tool Markup Language",
    ],
    correct_index: 0,
    lang: "fr",
    difficulty: 1,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "q-34",
    category: "informatique",
    question: "Quel système d'exploitation mobile est développé par Google ?",
    options: ["iOS", "Android", "Windows Phone", "Symbian"],
    correct_index: 1,
    lang: "fr",
    difficulty: 1,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "q-35",
    category: "informatique",
    question: "Combien d'octets contient un kilo-octet (binaire / KiB) ?",
    options: ["100", "512", "1000", "1024"],
    correct_index: 3,
    lang: "fr",
    difficulty: 1,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "q-36",
    category: "informatique",
    question: "Quel langage est principalement exécuté dans les navigateurs web ?",
    options: ["Python", "JavaScript", "C++", "Rust"],
    correct_index: 1,
    lang: "fr",
    difficulty: 1,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "q-37",
    category: "informatique",
    question: "Qu'est-ce qu'une adresse IP ?",
    options: [
      "Un identifiant réseau d'appareil",
      "Un câble internet",
      "Un antivirus",
      "Un type d'écran",
    ],
    correct_index: 0,
    lang: "fr",
    difficulty: 1,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "q-38",
    category: "informatique",
    question: "Qui est le cofondateur de Microsoft avec Paul Allen ?",
    options: ["Steve Jobs", "Bill Gates", "Elon Musk", "Jeff Bezos"],
    correct_index: 1,
    lang: "fr",
    difficulty: 1,
    image_url: null,
    created_at: "2026-01-01T00:00:00Z",
  },
];

const SEED_QUOTES: AnyRecord[] = [
  {
    id: "qt-1",
    kind: "quote",
    content:
      "Le succès n'est pas final, l'échec n'est pas fatal : c'est le courage de continuer qui compte.",
    author: "Winston Churchill",
    emoji: "🔥",
    theme: "sunset",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "qt-2",
    kind: "quote",
    content: "Piti piti zwazo fè nich li.",
    author: "Pwovèb ayisyen",
    emoji: "🐦",
    theme: "ocean",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "qt-3",
    kind: "motivation",
    content: "Chaque matin est une nouvelle chance de devenir la meilleure version de toi-même.",
    author: null,
    emoji: "☀️",
    theme: "lime",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "qt-4",
    kind: "quote",
    content: "Dèyè mòn gen mòn.",
    author: "Pwovèb ayisyen",
    emoji: "⛰️",
    theme: "night",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "qt-5",
    kind: "motivation",
    content: "Ne compare pas ton chapitre 1 au chapitre 20 de quelqu'un d'autre.",
    author: null,
    emoji: "📖",
    theme: "candy",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "qt-6",
    kind: "quote",
    content: "The best way to predict the future is to create it.",
    author: "Peter Drucker",
    emoji: "🚀",
    theme: "ocean",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "qt-7",
    kind: "sticker",
    content: "Boss mode activé 😎",
    author: null,
    emoji: "😎",
    theme: "candy",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "qt-8",
    kind: "sticker",
    content: "Pa janm bay legen 💪",
    author: null,
    emoji: "💪",
    theme: "lime",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "qt-9",
    kind: "motivation",
    content: "Discipline > motivation. Fais-le même quand tu n'en as pas envie.",
    author: null,
    emoji: "⚡",
    theme: "night",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "qt-10",
    kind: "sticker",
    content: "Bon nwit fanmi ❤️",
    author: null,
    emoji: "🌙",
    theme: "sunset",
    created_at: "2026-01-01T00:00:00Z",
  },
];

const SEED_BANNERS: AnyRecord[] = [
  {
    id: "b-1",
    title: "Gagne 2x plus de pièces ce week-end !",
    body: "Joue au Mix Aléatoire et double tes gains.",
    image_url: null,
    link_url: "/play/mix",
    placement: "home",
    active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "b-2",
    title: "Invite tes amis",
    body: "+50 pièces pour chaque ami invité.",
    image_url: null,
    link_url: "/invite",
    placement: "result",
    active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
];

const SEED_EMBEDS: AnyRecord[] = [
  {
    id: "em-1",
    title: "2048",
    url: "https://play2048.co/",
    description: "Le célèbre jeu de puzzle",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "em-2",
    title: "Wikipedia FR",
    url: "https://fr.wikipedia.org/wiki/Haïti",
    description: "Apprends plus sur Haïti",
    created_at: "2026-01-01T00:00:00Z",
  },
];

type StoreTables = {
  questions: AnyRecord[];
  quotes: AnyRecord[];
  banners: AnyRecord[];
  embeds: AnyRecord[];
  notifications: AnyRecord[];
  push_subscribers: AnyRecord[];
  withdrawals: AnyRecord[];
  referrals: AnyRecord[];
  profiles: AnyRecord[];
  sticker_packs: AnyRecord[];
  stickers: AnyRecord[];
  custom_pages: AnyRecord[];
  app_settings: AnyRecord[];
  user_roles: AnyRecord[];
};

const STORAGE_KEY = "quizboss-mock-db-v1";
const SESSION_KEY = "quizboss-mock-session-v1";

function createDefaultStore(): StoreTables {
  return {
    questions: [...SEED_QUESTIONS],
    quotes: [...SEED_QUOTES],
    banners: [...SEED_BANNERS],
    embeds: [...SEED_EMBEDS],
    notifications: [],
    push_subscribers: [],
    withdrawals: [],
    referrals: [],
    profiles: [],
    sticker_packs: [],
    stickers: [],
    custom_pages: [],
    app_settings: [],
    user_roles: [],
  };
}

let memoryStore: StoreTables | null = null;

function getStore(): StoreTables {
  if (memoryStore) return memoryStore;
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        memoryStore = { ...createDefaultStore(), ...JSON.parse(raw) };
        return memoryStore!;
      }
    } catch {
      // ignore storage errors
    }
  }
  memoryStore = createDefaultStore();
  return memoryStore;
}

function saveStore() {
  if (typeof window !== "undefined" && memoryStore) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryStore));
    } catch {
      // ignore storage errors
    }
  }
}

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
}

function getPrimaryKey(table: string): string {
  if (table === "custom_pages") return "slug";
  if (table === "app_settings") return "key";
  return "id";
}

function createQueryBuilder(table: keyof StoreTables) {
  let operation: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  let selectColumns = "*";
  let selectOpts: { count?: string; head?: boolean } | undefined;
  let payload: AnyRecord | AnyRecord[] | null = null;
  const filters: Array<(row: AnyRecord) => boolean> = [];
  let orderBy: { col: string; ascending: boolean } | null = null;
  let limitCount: number | null = null;
  let singleMode: "none" | "single" | "maybeSingle" = "none";

  const execute = async () => {
    const store = getStore();
    const rows = store[table] ?? [];
    const pk = getPrimaryKey(table);

    if (operation === "insert") {
      const items = Array.isArray(payload) ? payload : [payload ?? {}];
      const inserted: AnyRecord[] = [];
      for (const item of items) {
        const record: AnyRecord = {
          ...(pk === "id" ? { id: item.id ?? makeId() } : {}),
          created_at: item.created_at ?? new Date().toISOString(),
          ...item,
        };
        if (table === "questions" && record.difficulty === undefined) record.difficulty = 1;
        if (table === "withdrawals" && record.status === undefined) record.status = "pending";
        rows.push(record);
        inserted.push(record);
      }
      store[table] = rows;
      saveStore();
      return {
        data: singleMode !== "none" ? (inserted[0] ?? null) : inserted,
        error: null,
        count: inserted.length,
      };
    }

    if (operation === "upsert") {
      const items = Array.isArray(payload) ? payload : [payload ?? {}];
      const upserted: AnyRecord[] = [];
      for (const item of items) {
        const keyVal = item[pk] ?? makeId();
        const existingIdx = rows.findIndex((r) => r[pk] === keyVal);
        if (existingIdx >= 0) {
          rows[existingIdx] = { ...rows[existingIdx], ...item };
          upserted.push(rows[existingIdx]);
        } else {
          const record = { [pk]: keyVal, created_at: new Date().toISOString(), ...item };
          rows.push(record);
          upserted.push(record);
        }
      }
      store[table] = rows;
      saveStore();
      return {
        data: singleMode !== "none" ? (upserted[0] ?? null) : upserted,
        error: null,
        count: upserted.length,
      };
    }

    if (operation === "update") {
      const updated: AnyRecord[] = [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!;
        if (filters.every((fn) => fn(row))) {
          rows[i] = { ...row, ...(payload as AnyRecord) };
          updated.push(rows[i]!);
        }
      }
      store[table] = rows;
      saveStore();
      return {
        data: singleMode !== "none" ? (updated[0] ?? null) : updated,
        error: null,
        count: updated.length,
      };
    }

    if (operation === "delete") {
      const remaining = rows.filter((row) => !filters.every((fn) => fn(row)));
      const deletedCount = rows.length - remaining.length;
      store[table] = remaining;
      saveStore();
      return { data: null, error: null, count: deletedCount };
    }

    // SELECT
    let result = rows.filter((row) => filters.every((fn) => fn(row))).map((r) => ({ ...r }));

    if (table === "sticker_packs" && selectColumns.includes("stickers(")) {
      result = result.map((pack) => ({
        ...pack,
        stickers: store.stickers.filter((s) => s.pack_id === pack.id),
      }));
    }

    if (orderBy) {
      const { col, ascending } = orderBy;
      result.sort((a, b) => {
        const va = a[col] ?? "";
        const vb = b[col] ?? "";
        if (va < vb) return ascending ? -1 : 1;
        if (va > vb) return ascending ? 1 : -1;
        return 0;
      });
    }

    const totalCount = result.length;

    if (limitCount !== null) {
      result = result.slice(0, limitCount);
    }

    if (selectOpts?.head) {
      return { data: null, error: null, count: totalCount };
    }

    if (singleMode === "maybeSingle" || singleMode === "single") {
      return { data: result[0] ?? null, error: null, count: totalCount };
    }

    return { data: result, error: null, count: totalCount };
  };

  const builder = {
    select(columns = "*", opts?: { count?: string; head?: boolean }) {
      operation = "select";
      selectColumns = columns;
      selectOpts = opts;
      return builder;
    },
    insert(values: AnyRecord | AnyRecord[]) {
      operation = "insert";
      payload = values;
      return builder;
    },
    update(values: AnyRecord) {
      operation = "update";
      payload = values;
      return builder;
    },
    upsert(values: AnyRecord | AnyRecord[]) {
      operation = "upsert";
      payload = values;
      return builder;
    },
    delete() {
      operation = "delete";
      return builder;
    },
    eq(col: string, val: unknown) {
      filters.push((row) => row[col] === val);
      return builder;
    },
    neq(col: string, val: unknown) {
      filters.push((row) => row[col] !== val);
      return builder;
    },
    order(col: string, opts?: { ascending?: boolean }) {
      orderBy = { col, ascending: opts?.ascending ?? true };
      return builder;
    },
    limit(n: number) {
      limitCount = n;
      return builder;
    },
    maybeSingle() {
      singleMode = "maybeSingle";
      return builder;
    },
    single() {
      singleMode = "single";
      return builder;
    },
    // Thenable support so `await supabase.from(...)` works directly
    then<TResult1 = AnyRecord, TResult2 = never>(
      onfulfilled?:
        | ((value: {
            data: AnyRecord;
            error: null;
            count: number;
          }) => TResult1 | PromiseLike<TResult1>)
        | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ): Promise<TResult1 | TResult2> {
      return execute().then(onfulfilled, onrejected);
    },
  };

  return builder;
}

type AuthChangeCallback = (event: string, session: Session | null) => void;
const authListeners = new Set<AuthChangeCallback>();
let currentSession: Session | null = null;
let sessionLoaded = false;

function getStoredSession(): Session | null {
  if (sessionLoaded) return currentSession;
  sessionLoaded = true;
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (raw) {
        currentSession = JSON.parse(raw) as Session;
      }
    } catch {
      // ignore
    }
  }
  return currentSession;
}

function setStoredSession(s: Session | null, event: string) {
  currentSession = s;
  sessionLoaded = true;
  if (typeof window !== "undefined") {
    try {
      if (s) window.localStorage.setItem(SESSION_KEY, JSON.stringify(s));
      else window.localStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
  }
  authListeners.forEach((cb) => cb(event, s));
}

function buildMockSession(email: string, displayName?: string): Session {
  const store = getStore();
  const userId = `user-${email.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
  const now = new Date().toISOString();

  // Ensure profile exists
  let profile = store.profiles.find((p) => p.id === userId);
  if (!profile) {
    profile = {
      id: userId,
      display_name: displayName || email.split("@")[0] || "Joueur",
      coins: 0,
      xp: 0,
      games_played: 0,
      best_score: 0,
      referral_claimed: 0,
      device_id: null,
      updated_at: now,
    };
    store.profiles.push(profile);
  }

  // First registered user becomes admin (mirrors SQL trigger on_auth_user_created_role)
  if (!store.user_roles.some((r) => r.role === "admin")) {
    store.user_roles.push({ id: makeId(), user_id: userId, role: "admin" });
  }
  saveStore();

  const user: User = {
    id: userId,
    app_metadata: {},
    user_metadata: { display_name: profile.display_name },
    aud: "authenticated",
    created_at: now,
    email,
  };

  return {
    access_token: "mock.jwt.token",
    refresh_token: "mock-refresh-token",
    expires_in: 3600 * 24 * 30,
    expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 30,
    token_type: "bearer",
    user,
  };
}

const uploadedBlobUrls = new Map<string, string>();

export function createMockSupabaseClient() {
  console.warn(
    "[AI Studio] Supabase env vars not configured — using in-memory/localStorage mock client.",
  );

  const makeChannel = () => {
    const ch: AnyRecord = {
      on: () => ch,
      subscribe: (cb?: (status: string) => void) => {
        try {
          cb?.("CLOSED");
        } catch {
          /* ignore */
        }
        return ch;
      },
      track: async () => "ok",
      untrack: async () => "ok",
      send: async () => "ok",
      presenceState: () => ({}),
      unsubscribe: async () => "ok",
    };
    return ch;
  };

  return {
    channel: (_name: string, _opts?: unknown) => makeChannel() as any,
    removeChannel: async (_ch: unknown) => "ok",
    removeAllChannels: async () => [],
    from(table: keyof StoreTables) {
      return createQueryBuilder(table);
    },
    rpc: async (fn: string, args?: AnyRecord) => {
      const store = getStore();
      if (fn === "has_role") {
        const userId = args?.["_user_id"];
        const role = args?.["_role"];
        const found = store.user_roles.some((r) => r.user_id === userId && r.role === role);
        return { data: found, error: null };
      }
      return { data: null, error: null };
    },
    auth: {
      getSession: async () => {
        return { data: { session: getStoredSession() }, error: null };
      },
      onAuthStateChange: (callback: AuthChangeCallback) => {
        authListeners.add(callback);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                authListeners.delete(callback);
              },
            },
          },
        };
      },
      signInWithPassword: async ({ email }: { email: string; password?: string }) => {
        const session = buildMockSession(email);
        setStoredSession(session, "SIGNED_IN");
        return { data: { session, user: session.user }, error: null };
      },
      signUp: async ({
        email,
        options,
      }: {
        email: string;
        password?: string;
        options?: { data?: { display_name?: string } };
      }) => {
        const session = buildMockSession(email, options?.data?.display_name);
        setStoredSession(session, "SIGNED_IN");
        return { data: { session, user: session.user }, error: null };
      },
      signOut: async () => {
        setStoredSession(null, "SIGNED_OUT");
        return { error: null };
      },
      getClaims: async () => {
        const session = getStoredSession();
        return {
          data: {
            claims: {
              sub: session?.user.id ?? "mock-user-id",
            },
          },
          error: null,
        };
      },
    },
    storage: {
      from: (_bucket: string) => ({
        upload: async (path: string, file: File | Blob) => {
          if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
            uploadedBlobUrls.set(path, URL.createObjectURL(file));
          }
          return { data: { path }, error: null };
        },
        createSignedUrl: async (path: string) => {
          return {
            data: { signedUrl: uploadedBlobUrls.get(path) ?? `/${path}` },
            error: null,
          };
        },
      }),
    },
  };
}
