const DB_NAME = "yandex-music-mod-lyrics";
const DB_VERSION = 1;
const CACHE_STORE = "cache";
const CUSTOM_STORE = "custom";

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface CacheEntry {
  key: string;
  text: string;
  expiresAt: number;
}

export interface CustomLyricsEntry {
  trackId: string;
  title: string;
  artists: string;
  text: string;
  updatedAt: number;
}

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(CACHE_STORE)) {
          db.createObjectStore(CACHE_STORE, { keyPath: "key" });
        }
        if (!db.objectStoreNames.contains(CUSTOM_STORE)) {
          db.createObjectStore(CUSTOM_STORE, { keyPath: "trackId" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn("[Lyrics] IndexedDB is unavailable:", request.error);
        resolve(null);
      };
      request.onblocked = () => resolve(null);
    } catch (error) {
      console.warn("[Lyrics] Failed to open IndexedDB:", error);
      resolve(null);
    }
  });

  return dbPromise;
}

async function runRequest<T>(
  storeName: string,
  mode: IDBTransactionMode,
  createRequest: (store: IDBObjectStore) => IDBRequest,
): Promise<T | null> {
  const db = await openDb();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction(storeName, mode);
      const request = createRequest(transaction.objectStore(storeName));
      request.onsuccess = () => resolve(request.result as T);
      request.onerror = () => {
        console.warn("[Lyrics] IndexedDB request failed:", request.error);
        resolve(null);
      };
    } catch (error) {
      console.warn("[Lyrics] IndexedDB transaction failed:", error);
      resolve(null);
    }
  });
}

export async function getCachedLyrics(key: string): Promise<string | null> {
  const entry = await runRequest<CacheEntry>(CACHE_STORE, "readonly", (store) => store.get(key));
  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    void runRequest(CACHE_STORE, "readwrite", (store) => store.delete(key));
    return null;
  }

  return entry.text;
}

export async function setCachedLyrics(key: string, text: string): Promise<void> {
  const entry: CacheEntry = { key, text, expiresAt: Date.now() + CACHE_TTL_MS };
  await runRequest(CACHE_STORE, "readwrite", (store) => store.put(entry));
}

export async function getCustomLyrics(trackId: string): Promise<CustomLyricsEntry | null> {
  return runRequest<CustomLyricsEntry>(CUSTOM_STORE, "readonly", (store) => store.get(trackId));
}

export async function setCustomLyrics(entry: Omit<CustomLyricsEntry, "updatedAt">): Promise<void> {
  await runRequest(CUSTOM_STORE, "readwrite", (store) =>
    store.put({ ...entry, updatedAt: Date.now() } satisfies CustomLyricsEntry),
  );
}

export async function deleteCustomLyrics(trackId: string): Promise<void> {
  await runRequest(CUSTOM_STORE, "readwrite", (store) => store.delete(trackId));
}

export async function listCustomLyrics(): Promise<CustomLyricsEntry[]> {
  const entries = await runRequest<CustomLyricsEntry[]>(CUSTOM_STORE, "readonly", (store) => store.getAll());
  if (!entries) return [];

  return entries.sort((a, b) => b.updatedAt - a.updatedAt);
}
