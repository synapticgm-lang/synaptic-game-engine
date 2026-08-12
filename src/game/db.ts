import type { GameState, Settings } from './types';
import { createDefaultSettings } from './defaults';

const DB_NAME = 'tactical-litrpg';
const DB_VERSION = 1;
const STORE_GAME = 'game';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_GAME)) db.createObjectStore(STORE_GAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export async function loadGame(): Promise<GameState | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_GAME, 'readonly');
    const req = tx.objectStore(STORE_GAME).get('current');
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function saveGame(state: GameState): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_GAME, 'readwrite');
    tx.objectStore(STORE_GAME).put(state, 'current');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

const SETTINGS_KEY = 'tactical-litrpg-settings';

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Settings>;
      return { 
        ...createDefaultSettings(), 
        ...parsed,
        // Prefer user-saved keys only — never bake VITE_* provider secrets into the client bundle path.
        openrouterApiKey: parsed.openrouterApiKey?.trim() ? parsed.openrouterApiKey : '',
      };
    }
  } catch {
    /* ignore */
  }
  
  // Default for first-time load
  return {
    ...createDefaultSettings(),
    openrouterApiKey: '',
  };
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function exportSave(state: GameState): void {
  const payload = {
    version: state.version,
    saveId: state.saveId,
    storyName: state.storyName,
    engineMode: state.engineMode,
    gmStrictness: state.gmStrictness ?? 'standard',
    character: state.character,
    inventory: state.inventory,
    lorebook: state.lorebook ?? [],
    gold: state.gold ?? 0,
    log: state.log,
    rolls: state.rolls,
    turn: state.turn,
    seed: state.seed,
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ttrpg_adventure_save.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importSave(file: File): Promise<GameState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (!parsed || typeof parsed !== 'object') {
          reject(new Error('Invalid save file: not an object'));
          return;
        }
        if (!parsed.character || typeof parsed.character !== 'object') {
          reject(new Error('Invalid save file: missing character data'));
          return;
        }
        if (!Array.isArray(parsed.log)) {
          reject(new Error('Invalid save file: missing narrative log'));
          return;
        }
        resolve(parsed as GameState);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}