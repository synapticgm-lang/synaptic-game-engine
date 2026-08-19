import type { GameState, Settings } from './types';
import { createDefaultSettings, isPlayableSave } from './defaults';
import { syncContainerOccupancy } from './inventory';
import { applySaveRepair } from './saveMigration';
import { setActiveSubscriptionTier } from './subscriptionTiers';

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
    req.onsuccess = () => {
      void (async () => {
        try {
          const raw = req.result ?? null;
          if (!raw) {
            resolve(null);
            return;
          }
          const state = syncContainerOccupancy(raw);
          if (!isPlayableSave(state)) {
            resolve(null);
            return;
          }
          const repaired = applySaveRepair(state);
          if (repaired.dirty) {
            await saveGame(repaired.state);
          }
          resolve(repaired.state);
        } catch (e) {
          reject(e);
        }
      })();
    };
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

export async function deleteGame(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_GAME, 'readwrite');
    tx.objectStore(STORE_GAME).delete('current');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

const SETTINGS_KEY = 'tactical-litrpg-settings';

/** Older saves used visual/text — map to static/normal/excited. */
function migrateDiceAnimation(raw: unknown): Settings['diceAnimation'] {
  if (raw === 'static' || raw === 'normal' || raw === 'excited') return raw;
  if (raw === 'text') return 'static';
  if (raw === 'visual') return 'normal';
  return createDefaultSettings().diceAnimation;
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Settings>;
      const merged: Settings = {
        ...createDefaultSettings(),
        ...parsed,
        // Prefer user-saved keys only — never bake VITE_* provider secrets into the client bundle path.
        // Legacy text slot was geminiApiKey; migrate into openrouterApiKey.
        openrouterApiKey: parsed.openrouterApiKey?.trim() || parsed.geminiApiKey?.trim() || '',
        geminiApiKey: '',
        fluxApiKey: parsed.fluxApiKey?.trim() || parsed.imageApiKey?.trim() || '',
        imageApiKey: parsed.fluxApiKey?.trim() || parsed.imageApiKey?.trim() || '',
        aiProvider: 'openrouter',
        subscriptionTier: parsed.subscriptionTier === 'mid' || parsed.subscriptionTier === 'high' || parsed.subscriptionTier === 'admin'
          ? parsed.subscriptionTier
          : 'free',
        byokModeEnabled: !!parsed.byokModeEnabled,
        byokDisclaimerAccepted: !!parsed.byokDisclaimerAccepted,
        imageProvider: parsed.imageProvider === 'flux-direct' ? 'flux-direct' : 'flux',
        classicMemorableImages:
          parsed.classicMemorableImages ?? createDefaultSettings().classicMemorableImages,
        combatResolveMode:
          parsed.combatResolveMode === 'auto' || parsed.combatResolveMode === 'full'
            ? parsed.combatResolveMode
            : createDefaultSettings().combatResolveMode,
        diceAnimation: migrateDiceAnimation(parsed.diceAnimation),
      };
      try {
        setActiveSubscriptionTier(merged.subscriptionTier);
      } catch {
        /* ignore */
      }
      return merged;
    }
  } catch {
    /* ignore */
  }

  // Default for first-time load
  return {
    ...createDefaultSettings(),
    openrouterApiKey: '',
    fluxApiKey: '',
  };
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  try {
    setActiveSubscriptionTier(settings.subscriptionTier ?? 'free');
  } catch {
    /* ignore */
  }
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
        const imported = syncContainerOccupancy(parsed as GameState);
        if (!isPlayableSave(imported)) {
          reject(new Error('This save is from before the playtest wipe. Start a new game.'));
          return;
        }
        resolve(imported);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}