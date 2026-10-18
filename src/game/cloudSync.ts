import type { ArtStylePreset, GameState, LogEntry, SaveSlotInfo, Settings } from './types';
import { isPlayableSave } from './defaults';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { flushPlaytimeToProfile } from './playtime';
import { ingestCampaignPlatesMany } from './playerProfile';
import { displayAdventurerName } from './pcNameAuthority';
import { normalizeOfferedActionKeys } from './sceneAffordances';
export function firstNulPath(value: unknown): string | null {
  const stack: { v: unknown; path: string }[] = [{ v: value, path: '' }];
  const seen = new Set<object>();
  while (stack.length) {
    const cur = stack.pop()!;
    if (typeof cur.v === 'string') {
      if (cur.v.includes('\u0000')) return cur.path || '$';
      continue;
    }
    if (!cur.v || typeof cur.v !== 'object') continue;
    if (seen.has(cur.v)) continue;
    seen.add(cur.v);
    if (Array.isArray(cur.v)) {
      for (let i = cur.v.length - 1; i >= 0; i--) {
        stack.push({ v: cur.v[i], path: `${cur.path}[${i}]` });
      }
      continue;
    }
    const keys = Object.keys(cur.v as Record<string, unknown>);
    for (let i = keys.length - 1; i >= 0; i--) {
      const k = keys[i]!;
      const child = (cur.v as Record<string, unknown>)[k];
      stack.push({ v: child, path: cur.path ? `${cur.path}.${k}` : k });
    }
  }
  return null;
}
export type CloudSaveBundle = {
  state: GameState;
  visualMode: Settings['visualMode'] | null;
  artStylePreset: ArtStylePreset | null;
  updatedAtMs: number;
};
export function gameStateToLocalSlot(state: GameState | null): SaveSlotInfo | null {
  if (!state?.saveId) return null;
  const character = state.character ?? {};
  return {
    saveId: state.saveId,
    storyName: state.storyName ?? 'Campaign',
    characterName: displayAdventurerName(character.name),
    lastUpdated: state.lastUpdated ?? 0,
    turn: state.turn ?? 0,
    level: Number(character.level ?? 1),
    source: 'local',
  };
}
export async function fetchLatestCloudSave(): Promise<CloudSaveBundle | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return null;
  const { data, error } = await supabase
    .from('game_saves')
    .select('game_state, visual_mode, art_style_preset, updated_at, turn, save_id')
    .eq('user_id', authData.user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data?.game_state) return null;
  const state = normalizeOfferedActionKeys(data.game_state as GameState);
  if (!isPlayableSave(state)) return null;
  const updatedAtMs = data.updated_at ? Date.parse(String(data.updated_at)) : (state.lastUpdated ?? 0);
  return {
    state: {
      ...state,
      lastUpdated: Number.isFinite(updatedAtMs) ? updatedAtMs : (state.lastUpdated ?? Date.now()),
    },
    visualMode: (data.visual_mode as Settings['visualMode'] | null) ?? null,
    artStylePreset: (data.art_style_preset as ArtStylePreset | null) ?? null,
    updatedAtMs: Number.isFinite(updatedAtMs) ? updatedAtMs : 0,
  };
}
export async function fetchSupabaseSaveSlot(): Promise<SaveSlotInfo | null> {
  const slots = await fetchAllCloudSaveSlots();
  return slots[0] ?? null;
}
function slotFromCloudRow(row: {
  save_id: string;
  story_name: string | null;
  turn: number | null;
  updated_at: string | null;
  game_state: unknown;
}): SaveSlotInfo {
  const state = row.game_state && typeof row.game_state === 'object' ? (row.game_state as GameState) : null;
  const character = state?.character ?? {};
  const updatedAtMs = row.updated_at ? Date.parse(String(row.updated_at)) : (state?.lastUpdated ?? 0);
  return {
    saveId: state?.saveId || row.save_id,
    storyName: state?.storyName ?? row.story_name ?? 'Campaign',
    characterName: displayAdventurerName(character.name),
    lastUpdated: Number.isFinite(updatedAtMs) ? updatedAtMs : 0,
    turn: state?.turn ?? row.turn ?? 0,
    level: Number(character.level ?? 1),
    source: 'cloud',
  };
}
export async function fetchAllCloudSaveSlots(): Promise<SaveSlotInfo[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return [];
  const { data, error } = await supabase
    .from('game_saves')
    .select('save_id, story_name, turn, updated_at, game_state')
    .eq('user_id', authData.user.id)
    .order('updated_at', { ascending: false })
    .limit(50);
  if (error || !data?.length) return [];
  for (let i = 0; i < data.length; i++) {
    const row = data[i]!;
    if (row.game_state && typeof row.game_state === 'object') {
      row.game_state = normalizeOfferedActionKeys(row.game_state as GameState);
    }
  }
  const playable = data.filter((row) => row.save_id && isPlayableSave(row.game_state as GameState));
  ingestCampaignPlatesMany(playable.map((row) => row.game_state as GameState));
  return playable.map((row) => slotFromCloudRow(row));
}
export async function deleteCloudSave(saveId: string): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Supabase not configured' };
  }
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return { ok: false, error: 'Not signed in' };
  }
  const trimmed = saveId.trim();
  if (!trimmed) return { ok: false, error: 'Missing saveId' };
  const { error: saveError } = await supabase
    .from('game_saves')
    .delete()
    .eq('user_id', authData.user.id)
    .eq('save_id', trimmed);
  if (saveError) {
    return { ok: false, error: saveError.message };
  }
  await supabase.from('game_sessions').delete().eq('save_id', trimmed);
  await supabase.from('characters').delete().eq('user_id', authData.user.id).eq('name', runRowName(trimmed));
  return { ok: true };
}
export async function deleteCloudSavesExcept(
  keepSaveId?: string | null,
): Promise<{ ok: boolean; deleted: number; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, deleted: 0, error: 'Supabase not configured' };
  }
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return { ok: false, deleted: 0, error: 'Not signed in' };
  }
  const keep = keepSaveId?.trim() ?? '';
  let query = supabase.from('game_saves').delete().eq('user_id', authData.user.id);
  if (keep) query = query.neq('save_id', keep);
  const { data, error } = await query.select('save_id');
  if (error) {
    return { ok: false, deleted: 0, error: error.message };
  }
  const deletedIds = (data ?? []).map((row) => String(row.save_id)).filter(Boolean);
  if (deletedIds.length) {
    await supabase.from('game_sessions').delete().in('save_id', deletedIds);
    await supabase.from('characters').delete().eq('user_id', authData.user.id).in('name', deletedIds.map(runRowName));
  }
  return { ok: true, deleted: deletedIds.length };
}
const LIBRARY_ROW = 'sheet:';
const RUN_ROW = 'run:';
export function runRowName(saveId: string): string {
  return `${RUN_ROW}${saveId}`;
}
export async function saveLibrarySheetToCloud(sheet: { id: string; name: string }): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return false;
  const { error } = await supabase.from('characters').upsert(
    {
      user_id: authData.user.id,
      name: `${LIBRARY_ROW}${sheet.id}`,
      class_title: sheet.name,
      sheet: { library: sheet },
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,name' },
  );
  return !error;
}
export async function deleteLibrarySheetFromCloud(id: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return false;
  const { error } = await supabase.from('characters').delete().eq('user_id', authData.user.id).eq('name', `${LIBRARY_ROW}${id}`);
  return !error;
}
export async function fetchLibrarySheetsFromCloud(): Promise<unknown[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return [];
  const { data, error } = await supabase
    .from('characters')
    .select('sheet')
    .eq('user_id', authData.user.id)
    .like('name', `${LIBRARY_ROW}%`);
  if (error || !data) return [];
  return data.map((row) => (row.sheet as { library?: unknown } | null)?.library).filter(Boolean);
}
export async function syncGameToCloud(
  state: GameState,
  settings?: Settings,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Supabase not configured' };
  }
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return { ok: false, error: 'Not signed in' };
  }
  const userId = authData.user.id;
  const saveId = state.saveId?.trim();
  if (!saveId) {
    return { ok: false, error: 'Missing saveId' };
  }
  const sent = normalizeOfferedActionKeys({ ...state, pendingTurn: null });
  const nulAt = firstNulPath(sent);
  if (nulAt) {
    return { ok: false, error: `NUL in game_state at ${nulAt}` };
  }
  const character = sent.character ?? {};
  const charName = String(character.name ?? 'Adventurer');
  const { data: charRow, error: charError } = await supabase
    .from('characters')
    .upsert(
      {
        user_id: userId,
        name: runRowName(saveId),
        class_title: character.classTitle ?? character.class ?? null,
        appearance: character.appearance ?? null,
        bio: character.bio ?? null,
        sheet: character,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,name' },
    )
    .select('id')
    .maybeSingle();
  if (charError) {
    return { ok: false, error: charError.message };
  }
  const characterId = charRow?.id ?? null;
  const { error: saveError } = await supabase.from('game_saves').upsert(
    {
      user_id: userId,
      save_id: saveId,
      story_name: state.storyName ?? null,
      engine_mode: state.engineMode ?? 'litrpg',
      visual_mode: settings?.visualMode ?? null,
      art_style_preset: settings?.artStylePreset ?? null,
      character_id: characterId,
      game_state: sent,
      turn: sent.turn ?? 0,
      campaign_bible_id: sent.campaignBibleId ?? null,
      campaign_premise: sent.campaignPremise ?? null,
      current_location: sent.currentLocation ?? null,
      timeline: sent.timeline ?? [],
      npc_memories: sent.npcMemories ?? [],
      location_sheet: sent.locationSheet ?? null,
      ledger_version: 1,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,save_id' },
  );
  if (saveError) {
    return { ok: false, error: saveError.message };
  }
  const sessionLog = Array.isArray(sent.log) ? sent.log : [];
  let lastPrompt: string | null = null;
  for (let i = sessionLog.length - 1; i >= 0; i--) {
    const entry = sessionLog[i] as LogEntry | undefined;
    if (entry?.role === 'player' && typeof entry.content === 'string' && entry.content.trim()) {
      lastPrompt = entry.content.replace(/\s+/g, ' ').trim().slice(0, 400);
      break;
    }
  }
  const sessionPayload = {
    player_id: userId,
    player_name: charName,
    campaign: sent.storyName ?? 'Campaign',
    campaign_slug: (sent.storyName ?? 'campaign').toLowerCase().replace(/\s+/g, '-').slice(0, 64),
    engine_mode: sent.engineMode ?? 'litrpg',
    ai_status: 'Active',
    game_state: sent,
    last_prompt: lastPrompt,
    save_id: saveId,
    updated_at: new Date().toISOString(),
    last_turn_at: new Date().toISOString(),
  };
  const { data: existingSession } = await supabase
    .from('game_sessions')
    .select('id')
    .eq('save_id', saveId)
    .maybeSingle();
  if (existingSession?.id) {
    await supabase.from('game_sessions').update(sessionPayload).eq('id', existingSession.id);
  } else {
    await supabase.from('game_sessions').insert(sessionPayload);
  }
  void flushPlaytimeToProfile(userId);
  return { ok: true };
}
