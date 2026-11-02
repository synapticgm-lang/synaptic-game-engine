/**
 * XP-D1 OPEN9 FIX 1 — filler family cap ≤2 at the same place (engine + autoplay).
 * Root: fillerOfferSceneKey used full fillerSceneKey (NPC intro / inventory) so Open/Search
 * reset every Talk; Open boxes and Search chapel returned forever. Place-keyed offer counts.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import {
  actionFamily,
  creditFillerOffers,
  fillerOfferExhausted,
  fillerOfferPlaceKey,
  isFillerNoProgressChip,
  rankChoices,
} from './choiceRanking';
import { enforceFillerFamilyCap, padChoicesToCount } from './choicePipeline';
import type { GameState } from './types';

const RUN_7501 =
  'C:/Users/littl/OneDrive/Documents/synapticgm/game/wt/XPWILDS4/scripts/fate-autoplay/runs/2026-11-02T21-40-52-120Z_inkbound-academy_cold-system_s7501/turns.jsonl';
const RUN_7502 =
  'C:/Users/littl/OneDrive/Documents/synapticgm/game/wt/XPWILDS4/scripts/fate-autoplay/runs/2026-11-02T21-46-22-799Z_cape-district-vigil_chilled-gm_s7502/turns.jsonl';

type Row = {
  turn: number;
  location?: string;
  offeredChoices?: string[];
  fatePick?: string;
  level?: number;
  engineMode?: string;
};

function base(mode: 'litrpg' | 'rpg', loc: string, level = 2): GameState {
  const s = createInitialState(undefined, mode) as GameState;
  return {
    ...s,
    engineMode: mode,
    turn: 10,
    currentLocation: loc,
    character: {
      ...s.character,
      name: 'Jax',
      level,
      xp: 0,
      xpToNext: 187,
      hp: 20,
      maxHp: 20,
    },
    sceneFacts: emptySceneFacts(10),
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax' },
      complete: true,
      sceneWritten: true,
    },
  } as GameState;
}

function loadRows(path: string): Row[] {
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8')
    .trim()
    .split(/\n/)
    .map((l) => JSON.parse(l) as Row);
}

/** Replay offered chips with live credit + place-keyed cap; return max same-place family streak. */
function replayMaxFamily(path: string, mode: 'litrpg' | 'rpg'): { max: number; fam: string; turn: number } {
  const rows = loadRows(path);
  if (!rows.length) return { max: 0, fam: '', turn: 0 };
  let state = base(mode, rows[0]?.location || 'Here', rows[0]?.level ?? 2);
  let max = 0;
  let fam = '';
  let at = 0;
  for (const row of rows) {
    const loc = row.location || state.currentLocation || 'Here';
    state = {
      ...state,
      currentLocation: loc,
      character: { ...state.character!, level: row.level ?? state.character!.level },
      turn: row.turn ?? state.turn,
      // Simulate Talk introducing NPCs — must NOT reset the place offer cap.
      npcMemories: [
        ...(state.npcMemories ?? []),
        {
          npcId: `npc:t${row.turn}`,
          npcName: `Visitor ${row.turn}`,
          introSpoken: true,
          met: true,
          facts: [],
          disposition: 'neutral',
        } as GameState['npcMemories'] extends (infer M)[] | undefined ? M : never,
      ],
    };
    const offered = row.offeredChoices ?? [];
    const ranked = rankChoices(state, offered).choices;
    const padded = padChoicesToCount(ranked, state, `At ${loc}.`, 3, offered[0] ?? '');
    const injected = Array.from(
      new Set([
        ...padded,
        ...offered.filter((c) => isFillerNoProgressChip(c)),
        'Open the bronze reward box',
        'Open the silver reward box',
        'Search the scene for signs',
        'Look around',
        'Check the door',
        'Walk on',
        'Leave the scene',
        'Say something…',
      ]),
    );
    const capped = enforceFillerFamilyCap(injected, state);
    const counts: Record<string, number> = {};
    for (const c of capped) {
      if (!isFillerNoProgressChip(c)) continue;
      const f = actionFamily(c);
      counts[f] = (counts[f] ?? 0) + 1;
      if ((counts[f] ?? 0) > max) {
        max = counts[f]!;
        fam = f;
        at = row.turn;
      }
    }
    state = creditFillerOffers(state, capped);
  }
  return { max, fam, turn: at };
}

describe('XP-D1 OPEN9 filler family cap', () => {
  it('Open shares search family; within-pad Open×3 keeps ≤2', () => {
    // OPEN3 pin — Open stays on search; OPEN9 place-keyed cap owns the streak.
    expect(actionFamily('Open the bronze reward box')).toBe('search');
    expect(actionFamily('Search the scene for signs')).toBe('search');
    // OPEN9 — place noun "watch" must not reclassify Search as wait.
    expect(actionFamily('Search a Cape District chapel watch for signs')).toBe('search');
    const state = base('litrpg', 'Living Ink Atelier');
    const kept = enforceFillerFamilyCap(
      [
        'Walk on',
        'Open the bronze reward box',
        'Open the silver reward box',
        'Open the gold reward box',
        'Leave the scene',
      ],
      state
    );
    expect(kept.filter((c) => /^open\b/i.test(c))).toHaveLength(2);
    expect(kept).toContain('Walk on');
    expect(kept).toContain('Leave the scene');
  });

  it('NPC intro at the same place does not reset Open offer cap', () => {
    let state = base('litrpg', 'Living Ink Atelier');
    state = creditFillerOffers(state, ['Open the bronze reward box', 'Open the silver reward box']);
    expect(fillerOfferExhausted(state, 'Open the gold reward box')).toBe(true);
    expect(fillerOfferPlaceKey(state)).toBe('living ink atelier');
    // Meeting someone must not clear the place offer key.
    state = {
      ...state,
      npcMemories: [
        {
          npcId: 'npc:oda',
          npcName: 'Oda Hask',
          introSpoken: true,
          met: true,
          facts: ['said hello'],
          disposition: 'friendly',
        } as GameState['npcMemories'] extends (infer M)[] | undefined ? M : never,
      ],
    };
    expect(fillerOfferExhausted(state, 'Open the bronze reward box')).toBe(true);
    const kept = enforceFillerFamilyCap(
      ['Open the bronze reward box', 'Talk to Oda Hask', 'Walk on'],
      state
    );
    expect(kept.some((c) => /^open\b/i.test(c))).toBe(false);
    expect(kept).toContain('Walk on');
  });

  it('injection paths (pad + Open + Search + Look + System) still cap ≤2', () => {
    let state = base('rpg', 'a Cape District chapel watch');
    state = creditFillerOffers(state, [
      'Search a Cape District chapel watch for signs',
      'Search the scene for signs',
    ]);
    expect(actionFamily('Check the pews')).toBe('search');
    expect(isFillerNoProgressChip('Check the pews')).toBe(true);
    expect(state.circling?.fillerOfferCounts?.['fam:search']).toBeGreaterThanOrEqual(2);
    expect(fillerOfferExhausted(state, 'Check the pews')).toBe(true);
    const kept = enforceFillerFamilyCap(
      [
        'Search a Cape District chapel watch for signs',
        'Look around',
        'Check the pews',
        'Talk to Beacon',
        'Leave the scene',
        'Say something…',
      ],
      state
    );
    // Cap is ≤2 total for the family at this place — after 2 credits, zero more Search/Check.
    expect(kept.filter((c) => isFillerNoProgressChip(c) && actionFamily(c) === 'search')).toHaveLength(0);
    expect(kept).toContain('Leave the scene');
  });

  it('replay 7501 LitRPG offered chips: max same-place family ≤2', () => {
    if (!existsSync(RUN_7501)) return;
    const { max } = replayMaxFamily(RUN_7501, 'litrpg');
    expect(max).toBeLessThanOrEqual(2);
  });

  it('replay 7502 Story RPG offered chips: max same-place family ≤2', () => {
    if (!existsSync(RUN_7502)) return;
    const { max } = replayMaxFamily(RUN_7502, 'rpg');
    expect(max).toBeLessThanOrEqual(2);
  });
});
