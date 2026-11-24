export interface StoredBackground {
  id: "current";
  name: string;
  mimeType: string;
  dataUrl: string;
  updatedAt: number;
}

const DB_NAME = "yandex-music-mod-backgrounds";
const DB_VERSION = 1;
const STORE_NAME = "images";
const RECORD_ID = "current";

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDatabase(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn("[Backgrounds] IndexedDB is unavailable:", request.error);
        resolve(null);
      };
      request.onblocked = () => resolve(null);
    } catch (error) {
      console.warn("[Backgrounds] Failed to open IndexedDB:", error);
      resolve(null);
    }
  });

  return dbPromise;
}

async function withStore<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T | null> {
  const db = await openDatabase();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction(STORE_NAME, mode);
      const request = action(transaction.objectStore(STORE_NAME));
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => {
        console.warn("[Backgrounds] IndexedDB request failed:", request.error);
        resolve(null);
      };
    } catch (error) {
      console.warn("[Backgrounds] IndexedDB transaction failed:", error);
      resolve(null);
    }
  });
}

export async function getBackgroundImage(): Promise<StoredBackground | null> {
  return withStore<StoredBackground>("readonly", (store) => store.get(RECORD_ID));
}

export async function saveBackgroundImage(image: Omit<StoredBackground, "id" | "updatedAt">): Promise<boolean> {
  const record: StoredBackground = {
    id: RECORD_ID,
    ...image,
    updatedAt: Date.now(),
  };

  const saved = await withStore<IDBValidKey>("readwrite", (store) => store.put(record));
  return saved !== null;
}

export async function deleteBackgroundImage(): Promise<void> {
  await withStore<undefined>("readwrite", (store) => store.delete(RECORD_ID));
}
