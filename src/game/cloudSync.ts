import type { ArtStylePreset, GameState, SaveSlotInfo, Settings } from './types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export type CloudSaveBundle = {
  state: GameState;
  visualMode: Settings['visualMode'] | null;
  artStylePreset: ArtStylePreset | null;
  updatedAtMs: number;
};

function slotFromState(state: GameState, source: 'local' | 'cloud', updatedAtMs?: number): SaveSlotInfo {
  const character = state.character ?? {};
  return {
    saveId: state.saveId,
    storyName: state.storyName ?? 'Campaign',
    characterName: String(character.name ?? 'Adventurer'),
    lastUpdated: updatedAtMs ?? state.lastUpdated ?? 0,
    turn: state.turn ?? 0,
    level: Number(character.level ?? 1),
    source,
  };
}

export function gameStateToLocalSlot(state: GameState | null): SaveSlotInfo | null {
  if (!state?.saveId) return null;
  return slotFromState(state, 'local');
}

/**
 * Load the newest game_saves row for the signed-in user (Supabase SSOT — not Google Drive).
 */
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

  const state = data.game_state as GameState;
  if (!state || typeof state !== 'object' || !state.saveId) return null;

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
    characterName: String(character.name ?? 'Adventurer'),
    lastUpdated: Number.isFinite(updatedAtMs) ? updatedAtMs : 0,
    turn: state?.turn ?? row.turn ?? 0,
    level: Number(character.level ?? 1),
    source: 'cloud',
  };
}

/** All cloud campaigns for the signed-in user, newest first. */
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

  return data
    .filter((row) => row.save_id)
    .map((row) => slotFromCloudRow(row));
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
  }

  return { ok: true, deleted: deletedIds.length };
}

/**
 * Upsert the current campaign to Supabase game_saves (+ characters sheet snapshot)
 * and mirror a row into game_sessions for Admin GameOps.
 * IndexedDB remains the local cache; this is best-effort cloud SSOT for signed-in users.
 */
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

  const character = state.character ?? {};
  const charName = String(character.name ?? 'Adventurer');

  const { data: charRow, error: charError } = await supabase
    .from('characters')
    .upsert(
      {
        user_id: userId,
        name: charName,
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
      game_state: { ...state, pendingTurn: null },
      turn: state.turn ?? 0,
      campaign_bible_id: state.campaignBibleId ?? null,
      campaign_premise: state.campaignPremise ?? null,
      current_location: state.currentLocation ?? null,
      timeline: state.timeline ?? [],
      npc_memories: state.npcMemories ?? [],
      location_sheet: state.locationSheet ?? null,
      ledger_version: 1,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,save_id' },
  );

  if (saveError) {
    return { ok: false, error: saveError.message };
  }

  const sessionPayload = {
    player_id: userId,
    player_name: charName,
    campaign: state.storyName ?? 'Campaign',
    campaign_slug: (state.storyName ?? 'campaign').toLowerCase().replace(/\s+/g, '-').slice(0, 64),
    engine_mode: state.engineMode ?? 'litrpg',
    ai_status: 'Active',
    game_state: state,
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

  return { ok: true };
}
