import type { GameState, SaveSlotInfo } from './types';
import { isPlayableSave } from './defaults';
import { displayAdventurerName } from './pcNameAuthority';

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const SAVE_FILENAME = 'litrpg_save_active.json';
const MANIFEST_FILENAME = 'litrpg_save_manifest.json';

export interface CloudSave {
  saveId: string;
  storyName: string;
  engineMode: GameState['engineMode'];
  lastUpdated: number;
  characterName: string;
  timestamp: number;
  version: number;
  character: GameState['character'];
  dungeon: {
    turn: number;
    seed: string;
    log: GameState['log'];
    rolls: GameState['rolls'];
    pendingImagePrompt?: string | null;
  };
  journal: {
    inventory: GameState['inventory'];
    containers: GameState['containers'];
    companions: GameState['companions'];
    quests: GameState['quests'];
    shrines: GameState['shrines'];
    bestiary: GameState['bestiary'];
    relationships: GameState['relationships'];
  };
  rawState: GameState;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  error?: string;
}

interface DriveFile {
  id: string;
  name: string;
  modifiedTime?: string;
}

interface FileListResponse {
  files: DriveFile[];
}

let accessToken: string | null = null;
let tokenExpiry = 0;

const TOKEN_STORAGE_KEY = 'tactical-litrpg-drive-token';

export function setAccessToken(token: string | null, expiresIn?: number): void {
  accessToken = token;
  tokenExpiry = token ? Date.now() + (expiresIn ?? 3600) * 1000 - 60000 : 0;
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({ token, expiry: tokenExpiry }));
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function hasAccessToken(): boolean {
  return !!accessToken && Date.now() < tokenExpiry;
}

export function tryRestoreToken(): boolean {
  if (accessToken && Date.now() < tokenExpiry) return true;
  try {
    const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) return false;
    const stored = JSON.parse(raw) as { token: string; expiry: number };
    if (Date.now() < stored.expiry) {
      accessToken = stored.token;
      tokenExpiry = stored.expiry;
      return true;
    }
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  return false;
}

function authHeaders(): HeadersInit {
  if (!accessToken) throw new Error('Not signed in to Google.');
  return { Authorization: `Bearer ${accessToken}` };
}

async function findSaveFileId(): Promise<string | null> {
  const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name%3D'${SAVE_FILENAME}'`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error('Drive list failed: ' + res.status);
  const data = (await res.json()) as FileListResponse;
  return data.files?.length ? data.files[0].id : null;
}

export function buildCloudSave(state: GameState): CloudSave {
  return {
    saveId: state.saveId,
    storyName: state.storyName,
    engineMode: state.engineMode,
    lastUpdated: state.lastUpdated,
    characterName: displayAdventurerName(state.character.name),
    timestamp: Date.now(),
    version: state.version,
    character: state.character,
    dungeon: {
      turn: state.turn,
      seed: state.seed,
      log: state.log,
      rolls: state.rolls,
      pendingImagePrompt: state.pendingImagePrompt ?? null,
    },
    journal: {
      inventory: state.inventory,
      containers: state.containers,
      companions: state.companions,
      quests: state.quests,
      shrines: state.shrines,
      bestiary: state.bestiary,
      relationships: state.relationships,
    },
    rawState: state,
  };
}

export async function syncToDrive(state: GameState): Promise<number> {
  if (!accessToken) throw new Error('Not signed in to Google.');
  const payload = buildCloudSave(state);
  const content = JSON.stringify(payload, null, 2);
  const existingId = await findSaveFileId();

  let res: Response;
  if (existingId) {
    res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=media`, {
      method: 'PATCH',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: content,
    });
  } else {
    const metadata = { name: SAVE_FILENAME, parents: ['appDataFolder'], mimeType: 'application/json' };
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([content], { type: 'application/json' }));
    res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    });
  }
  if (!res.ok) throw new Error('Drive upload failed: ' + res.status);

  await updateManifest(payload.timestamp);
  return payload.timestamp;
}

async function updateManifest(timestamp: number): Promise<void> {
  const manifest = { lastSync: timestamp, filename: SAVE_FILENAME };
  const content = JSON.stringify(manifest, null, 2);
  const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name%3D'${MANIFEST_FILENAME}'`;
  const listRes = await fetch(url, { headers: authHeaders() });
  const list = (await listRes.json()) as FileListResponse;
  const existingId = list.files?.length ? list.files[0].id : null;

  let res: Response;
  if (existingId) {
    res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=media`, {
      method: 'PATCH',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: content,
    });
  } else {
    const metadata = { name: MANIFEST_FILENAME, parents: ['appDataFolder'], mimeType: 'application/json' };
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([content], { type: 'application/json' }));
    res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    });
  }
  if (!res.ok) throw new Error('Manifest update failed: ' + res.status);
}

export async function fetchCloudSave(): Promise<CloudSave | null> {
  if (!accessToken) throw new Error('Not signed in to Google.');
  const fileId = await findSaveFileId();
  if (!fileId) return null;
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Drive download failed: ' + res.status);
  const cloud = (await res.json()) as CloudSave;
  if (!isPlayableSave(cloud.rawState) && (cloud.version ?? 0) < 2) return null;
  return cloud;
}

export function cloudSaveToLocal(cloud: CloudSave): GameState {
  return cloud.rawState ?? {
    version: cloud.version,
    saveId: cloud.saveId,
    storyName: cloud.storyName,
    engineMode: cloud.engineMode ?? 'litrpg',
    lastUpdated: cloud.lastUpdated,
    character: cloud.character,
    inventory: cloud.journal.inventory,
    containers: cloud.journal.containers,
    companions: cloud.journal.companions,
    quests: cloud.journal.quests,
    shrines: cloud.journal.shrines,
    bestiary: cloud.journal.bestiary,
    relationships: cloud.journal.relationships,
    log: cloud.dungeon.log,
    rolls: cloud.dungeon.rolls,
    turn: cloud.dungeon.turn,
    seed: cloud.dungeon.seed,
    pendingImagePrompt: cloud.dungeon.pendingImagePrompt ?? null,
  };
}

export async function fetchCloudTimestamp(): Promise<number | null> {
  if (!accessToken) return null;
  try {
    const cloud = await fetchCloudSave();
    return cloud?.timestamp ?? null;
  } catch {
    return null;
  }
}

export async function fetchUserBirthDate(): Promise<string | null> {
  if (!accessToken) return null;
  try {
    const res = await fetch('https://people.googleapis.com/v1/people/me?personFields=birthdays', {
      headers: authHeaders(),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { birthdays?: Array<{ date?: { year?: number; month?: number; day?: number } }> };
    const bd = data.birthdays?.[0]?.date;
    if (!bd?.year) return null;
    return `${bd.year}-${String(bd.month ?? 1).padStart(2, '0')}-${String(bd.day ?? 1).padStart(2, '0')}`;
  } catch {
    return null;
  }
}

export function calculateAge(birthDate: string): number {
  const b = new Date(birthDate);
  if (Number.isNaN(b.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age -= 1;
  return age;
}

export async function fetchCloudSaveSlot(): Promise<SaveSlotInfo | null> {
  if (!accessToken) return null;
  try {
    const cloud = await fetchCloudSave();
    if (!cloud) return null;
    return {
      saveId: cloud.saveId,
      storyName: cloud.storyName,
      characterName: cloud.characterName,
      lastUpdated: cloud.lastUpdated,
      turn: cloud.dungeon.turn,
      level: cloud.character.level,
      source: 'cloud',
    };
  } catch {
    return null;
  }
}
