/**
 * Session-isolated comic panel image cache.
 *
 * Every lookup/write is namespaced by the active GameState.saveId so one player's
 * (or one campaign's) generated artwork can never be served into another session.
 * There is no global/unscoped key space for comic assets.
 */

const DB_NAME = 'SynapticGMSessionImageCache';
const STORE = 'panel-images';
const DB_VERSION = 1;
const MAX_MEMORY_ENTRIES = 64;

export interface SessionImageCacheEntry {
  /** Compound key: `${saveId}::${promptHash}` */
  key: string;
  saveId: string;
  promptHash: string;
  imageUrl: string;
  promptKind: string;
  createdAt: number;
}

let activeSaveId: string | null = null;
const memoryCache = new Map<string, SessionImageCacheEntry>();

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable in this environment.'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'key' });
        store.createIndex('saveId', 'saveId', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Failed to open session image cache.'));
  });
}

/** Stable, sync fingerprint for prompt payload parts. */
export function hashImageCacheParts(parts: Array<string | null | undefined>): string {
  const input = parts.map((part) => (part ?? '').trim()).join('\u0001');
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function compoundKey(saveId: string, promptHash: string): string {
  return `${saveId}::${promptHash}`;
}

function assertBoundSaveId(saveId: string): void {
  if (!saveId.trim()) {
    throw new Error('sessionImageCache requires a non-empty GameState.saveId.');
  }
  if (activeSaveId && activeSaveId !== saveId) {
    // Hard isolation: never read/write against a stale session binding.
    throw new Error(`sessionImageCache is bound to "${activeSaveId}", refused access for "${saveId}".`);
  }
}

function remember(entry: SessionImageCacheEntry): void {
  memoryCache.delete(entry.key);
  memoryCache.set(entry.key, entry);
  while (memoryCache.size > MAX_MEMORY_ENTRIES) {
    const oldest = memoryCache.keys().next().value;
    if (oldest === undefined) break;
    memoryCache.delete(oldest);
  }
}

/**
 * Bind the cache to the player's current local game session (GameState.saveId).
 * Switching sessions clears the in-memory layer so prior artwork cannot leak into UI.
 */
export function bindSessionImageCache(saveId: string): void {
  const next = saveId.trim();
  if (!next) return;
  if (activeSaveId === next) return;
  activeSaveId = next;
  memoryCache.clear();
}

export function getActiveSessionImageCacheId(): string | null {
  return activeSaveId;
}

export async function getSessionCachedImage(
  saveId: string,
  promptHash: string
): Promise<string | null> {
  assertBoundSaveId(saveId);
  bindSessionImageCache(saveId);
  const key = compoundKey(saveId, promptHash);

  const memoryHit = memoryCache.get(key);
  if (memoryHit && memoryHit.saveId === saveId) {
    // Refresh LRU order.
    remember(memoryHit);
    return memoryHit.imageUrl;
  }

  try {
    const db = await openDb();
    const entry = await new Promise<SessionImageCacheEntry | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve((req.result as SessionImageCacheEntry | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
    if (!entry || entry.saveId !== saveId) return null;
    remember(entry);
    return entry.imageUrl;
  } catch {
    // Cache misses must never break the image queue.
    return null;
  }
}

export async function putSessionCachedImage(params: {
  saveId: string;
  promptHash: string;
  imageUrl: string;
  promptKind: string;
}): Promise<void> {
  const { saveId, promptHash, imageUrl, promptKind } = params;
  if (!imageUrl) return;
  assertBoundSaveId(saveId);
  bindSessionImageCache(saveId);

  const entry: SessionImageCacheEntry = {
    key: compoundKey(saveId, promptHash),
    saveId,
    promptHash,
    imageUrl,
    promptKind,
    createdAt: Date.now(),
  };
  remember(entry);

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Persistence is best-effort; the in-memory hit still accelerates retries this session.
  }
}

/** Drop all persisted + memory entries for one saveId (e.g. when wiping a campaign). */
export async function clearSessionImageCache(saveId: string): Promise<void> {
  const target = saveId.trim();
  if (!target) return;

  for (const [key, entry] of [...memoryCache.entries()]) {
    if (entry.saveId === target) memoryCache.delete(key);
  }
  if (activeSaveId === target) {
    // Keep the binding, but the memory layer is empty for this session.
  }

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const index = store.index('saveId');
      const req = index.openCursor(IDBKeyRange.only(target));
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) return;
        cursor.delete();
        cursor.continue();
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore storage cleanup failures.
  }
}
