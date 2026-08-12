import type { Settings } from './types';
import { buildImagePromptModifier } from './imagePromptModifier';
import { fetchComicPanel } from '@/services/openRouterService';
import { debugLogger } from './debugLogger';

const DB_NAME = 'GameEngineAssetsDB';
const STORE = 'backgrounds';
const DB_VERSION = 1;

export interface BgEntry {
  key: string;
  dataUrl: string;
  prompt: string;
  genre: string;
  createdAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function bgGet(key: string): Promise<BgEntry | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function bgPut(entry: BgEntry): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function bgList(): Promise<BgEntry[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror = () => reject(req.error);
  });
}

export async function bgDelete(key: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function modeFromSettings(settings: Settings): 'kid' | 'adult' | 'unrestricted' {
  if (settings.contentMode === 'kid') return 'kid';
  if (settings.contentMode === 'adult') return 'adult';
  return 'unrestricted';
}

export async function generateBgWithOpenRouter(
  prompt: string,
  settings: Settings
): Promise<string> {
  const apiKey = settings.openrouterApiKey || settings.geminiApiKey;
  if (!apiKey) throw new Error('No OpenRouter API key configured for background generation.');

  const modifier = buildImagePromptModifier(settings);
  const finalPrompt = `${prompt}\n\nSTYLE DIRECTIVE: ${modifier}`;

  debugLogger.record('API_REQUEST', 'Background image generation via OpenRouter', {
    prompt: finalPrompt.slice(0, 200),
    mode: modeFromSettings(settings),
    style: settings.artStylePreset ?? 'western'
  });

  const dataUrl = await fetchComicPanel(
    finalPrompt,
    modeFromSettings(settings),
    settings.artStylePreset ?? 'western',
    apiKey
  );

  debugLogger.record('API_RESPONSE', 'Background image generated via OpenRouter', {
    hasImage: !!dataUrl,
    length: dataUrl?.length ?? 0
  });

  return dataUrl;
}

export async function generateBgWithCustom(
  prompt: string,
  settings: Settings
): Promise<string> {
  return generateBgWithOpenRouter(prompt, settings);
}
