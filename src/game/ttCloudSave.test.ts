/**
 * q59-CLOUDSAVE — scene keys must be JSON, not U+0000, so game_saves jsonb accepts the row.
 * Tabletop only. SRD 5.2.1 is not in this path (cooldown identity, not a check).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, NpcMemory } from './types';

const { mockSupabase } = vi.hoisted(() => {
  const callsRef: { table: string; op: string; payload?: unknown }[] = [];
  function builder(table: string) {
    return {
      upsert(payload: unknown) {
        callsRef.push({ table, op: 'upsert', payload });
        const done = Promise.resolve({ data: { id: 'char-1' }, error: null });
        return {
          select: () => ({ maybeSingle: () => done }),
          then: (a: (v: { data: { id: string }; error: null }) => unknown, b?: (e: unknown) => unknown) =>
            done.then(a, b),
        };
      },
      select() {
        return {
          eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
        };
      },
      insert(payload: unknown) {
        callsRef.push({ table, op: 'insert', payload });
        return Promise.resolve({ error: null });
      },
      update() {
        return { eq: async () => ({ error: null }) };
      },
    };
  }
  const mockSupabase = {
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'user-1' } }, error: null })) },
    from: vi.fn((table: string) => builder(table)),
    __calls: callsRef,
  };
  return { mockSupabase };
});

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: mockSupabase,
}));

import { firstNulPath, syncGameToCloud } from './cloudSync';
import {
  applyOptionCooldown,
  computeOptionSceneKey,
  isOptionRepeat,
  normalizeOfferedActionKeys,
  optionSceneKeyString,
  stampRecentOfferedActions,
  type OptionCooldownChip,
} from './sceneAffordances';

function npc(id: string, name: string, location: string): NpcMemory {
  return {
    npcId: id,
    npcName: name,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 1,
    met: true,
    present: true,
    location,
  };
}

function tableScene(place: string, people: NpcMemory[]): GameState {
  const s = createInitialState('Cloud save', 'dnd');
  return {
    ...s,
    campaignBibleId: 'cursed-keep',
    engineMode: 'dnd',
    currentLocation: place,
    turn: 2,
    activeSituation: null,
    npcMemories: people,
    sceneFacts: {
      crowd: people.length ? 'present' : 'none',
      noise: 'quiet',
      present: [],
      props: [],
      lastBeat: '',
      updatedTurn: 2,
    },
    openingEstablishment: {
      ...(s.openingEstablishment as object),
      complete: true,
      coversPending: [],
    } as unknown as GameState['openingEstablishment'],
  };
}

function jsonHasNul(value: unknown): boolean {
  const json = JSON.stringify(value);
  return json.includes('\u0000') || json.includes('\\u0000');
}

describe('q59-CLOUDSAVE', () => {
  beforeEach(() => {
    mockSupabase.__calls.length = 0;
  });

  it('pad stamp writes a scene key with no U+0000', () => {
    const place = 'Greyhollow yard';
    const state = tableScene(place, [npc('npc-bram', 'Bram', place), npc('npc-nia', 'Nia', place)]);
    const pad: OptionCooldownChip[] = [
      { label: 'Talk to Bram', actionId: 'npc:npc-bram:talk', kind: 'affordance', slotKind: 'person', entityId: 'npc-bram' },
      { label: 'Talk to Nia', actionId: 'npc:npc-nia:talk', kind: 'affordance', slotKind: 'person', entityId: 'npc-nia' },
    ];
    const cooled = applyOptionCooldown(state, pad);
    const ids: string[] = [];
    for (let i = 0; i < cooled.length; i++) {
      const id = cooled[i]!.actionId;
      if (id && cooled[i]!.kind !== 'free-input') ids.push(id);
    }
    const stamped = stampRecentOfferedActions(state, ids);
    expect(firstNulPath(stamped)).toBeNull();
    expect(jsonHasNul(stamped)).toBe(false);
    const key = stamped.recentOfferedActions?.[stamped.recentOfferedActions.length - 1]?.sceneKey ?? '';
    expect(key).toBe(optionSceneKeyString(computeOptionSceneKey(stamped)));
    const parsed = JSON.parse(key) as [string, string[], number];
    expect(parsed[1]?.length).toBe(2);
  });

  it('repeat holds in the same scene and clears when place, people, or eventSeq change', () => {
    const place = 'Greyhollow yard';
    let s = tableScene(place, [npc('npc-bram', 'Bram', place)]);
    const actionId = 'object:brush:inspect';
    for (let t = 1; t <= 4; t++) {
      s = { ...stampRecentOfferedActions({ ...s, turn: t }, [actionId]), turn: t };
    }
    expect(isOptionRepeat(s, actionId)).toBe(false);
    s = { ...stampRecentOfferedActions({ ...s, turn: 5 }, [actionId]), turn: 5 };
    expect(isOptionRepeat(s, actionId)).toBe(true);
    expect(isOptionRepeat({ ...s, currentLocation: 'the road' }, actionId)).toBe(false);
    const left = (s.npcMemories ?? []).map((m) => ({ ...m, location: 'the road' }));
    expect(isOptionRepeat({ ...s, npcMemories: left }, actionId)).toBe(false);
    expect(
      isOptionRepeat(
        { ...s, optionSceneKey: { placeId: place, presentIds: ['npc-bram'], eventSeq: 3 } },
        actionId,
      ),
    ).toBe(false);
  });

  it('legacy NUL keys normalize to the live scene key', () => {
    const arena = 'the blood-sand arena of Valespire';
    const low = 'Lowmarket';
    const legacyArena = `${arena}\u0000role:the-blood-sand\u00000`;
    const legacyLow = `${low}\u0000\u00000`;
    const arenaState = tableScene(arena, [npc('role:the-blood-sand', 'the blood-sand', arena)]);
    const lowState = tableScene(low, []);
    const actionId = 'object:sand:inspect';
    const rows = (key: string) => {
      const out: NonNullable<GameState['recentOfferedActions']> = [];
      for (let t = 1; t <= 5; t++) out.push({ turn: t, sceneKey: key, actionIds: [actionId] });
      return out;
    };
    const arenaFixed = normalizeOfferedActionKeys({
      ...arenaState,
      turn: 6,
      recentOfferedActions: rows(legacyArena),
    });
    const lowFixed = normalizeOfferedActionKeys({
      ...lowState,
      turn: 6,
      recentOfferedActions: rows(legacyLow),
    });
    expect(arenaFixed.recentOfferedActions?.[0]?.sceneKey).toBe(
      optionSceneKeyString(computeOptionSceneKey(arenaFixed)),
    );
    expect(lowFixed.recentOfferedActions?.[0]?.sceneKey).toBe(
      optionSceneKeyString(computeOptionSceneKey(lowFixed)),
    );
    expect(jsonHasNul(arenaFixed)).toBe(false);
    expect(jsonHasNul(lowFixed)).toBe(false);
    expect(isOptionRepeat(arenaFixed, actionId)).toBe(true);
    expect(isOptionRepeat(lowFixed, actionId)).toBe(true);
    expect(isOptionRepeat({ ...arenaFixed, currentLocation: 'the road' }, actionId)).toBe(false);
  });

  it('sync upserts a clean state once and refuses a planted NUL', async () => {
    const place = 'Greyhollow yard';
    const clean = tableScene(place, []);
    const ok = await syncGameToCloud(clean);
    expect(ok).toEqual({ ok: true });
    const saves = mockSupabase.__calls.filter((c) => c.table === 'game_saves' && c.op === 'upsert');
    expect(saves.length).toBe(1);
    expect(jsonHasNul(saves[0]?.payload)).toBe(false);
    mockSupabase.__calls.length = 0;
    const planted = { ...clean, campaignPremise: 'gate\u0000line' };
    const blocked = await syncGameToCloud(planted);
    expect(blocked.ok).toBe(false);
    expect(blocked.error).toContain('NUL in game_state at campaignPremise');
    expect(mockSupabase.__calls.filter((c) => c.table === 'game_saves').length).toBe(0);
  });

  it('a legacy save syncs after load normalisation', async () => {
    const low = 'Lowmarket';
    const legacy = tableScene(low, []);
    legacy.recentOfferedActions = [
      { turn: 2, sceneKey: `${low}\u0000\u00000`, actionIds: ['object:sand:inspect'] },
      {
        turn: 2,
        sceneKey: `the blood-sand arena of Valespire\u0000role:the-blood-sand\u00000`,
        actionIds: ['object:sand:inspect'],
      },
    ];
    const loaded = normalizeOfferedActionKeys(legacy);
    expect(firstNulPath(loaded)).toBeNull();
    mockSupabase.__calls.length = 0;
    const res = await syncGameToCloud(loaded);
    expect(res).toEqual({ ok: true });
    const saves = mockSupabase.__calls.filter((c) => c.table === 'game_saves' && c.op === 'upsert');
    expect(saves.length).toBe(1);
    expect(jsonHasNul(saves[0]?.payload)).toBe(false);
  });
});
