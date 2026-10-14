// Bibliothèque audio gérée via IndexedDB (capacité de stockage de plusieurs centaines de Mo, évite l'erreur "espace insuffisant" de localStorage)

export type StoredTrack = {
  id: string;
  title: string;
  artist: string;
  url?: string;
  blob?: Blob;
  duration?: string;
  isCustom?: boolean;
  createdAt: number;
};

const DB_NAME = "quizboss_audio_library";
const DB_VERSION = 1;
const STORE_NAME = "tracks";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB non disponible"));
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** 5 morceaux intégrés par défaut dans la bibliothèque musicale de QuizBoss */
export const DEFAULT_LIBRARY_TRACKS: StoredTrack[] = [
  {
    id: "default-afro-compas",
    title: "Afro-Compas Groove 🇭🇹",
    artist: "Ambiance QuizBoss · Rythme Compas & Afro",
    duration: "Boucle",
    createdAt: 1,
  },
  {
    id: "default-caraibes-chill",
    title: "Caraïbes Lofi Chill 🌴",
    artist: "Ambiance QuizBoss · Détente & Concentration",
    duration: "Boucle",
    createdAt: 2,
  },
  {
    id: "default-boss-wave",
    title: "Electro Boss Synthwave ⚡",
    artist: "Ambiance QuizBoss · Énergie & Défi",
    duration: "Boucle",
    createdAt: 3,
  },
  {
    id: "default-urban-night",
    title: "Urban Night Melodies 🌙",
    artist: "Ambiance QuizBoss · Mélodie Nocturne",
    duration: "Boucle",
    createdAt: 4,
  },
  {
    id: "default-konpa-zouk",
    title: "Konpa & Zouk Vibes 🎶",
    artist: "Ambiance QuizBoss · Soleil & Fête",
    duration: "Boucle",
    createdAt: 5,
  },
];

/** Récupère toutes les musiques personnalisées enregistrées dans IndexedDB */
export async function getCustomStoredTracks(): Promise<StoredTrack[]> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const results = (req.result as StoredTrack[]) || [];
        resolve(results);
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/** Enregistre un nouveau son dans IndexedDB sans limite de quota localStorage */
export async function saveTrackToLibrary(track: {
  title: string;
  artist?: string;
  file?: File | Blob;
  url?: string;
}): Promise<StoredTrack> {
  const db = await openDb();
  const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const item: StoredTrack = {
    id,
    title: track.title.trim() || "Ma Chanson",
    artist: track.artist?.trim() || "Chanson personnalisée",
    blob: track.file,
    url: track.url?.trim() || undefined,
    isCustom: true,
    createdAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(item);
    req.onsuccess = () => resolve(item);
    req.onerror = () => reject(req.error ?? new Error("Impossible d'enregistrer le fichier audio"));
  });
}

/** Supprime un son de la bibliothèque IndexedDB */
export async function removeTrackFromLibrary(id: string): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // ignore
  }
}
