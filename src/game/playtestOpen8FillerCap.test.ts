/**
 * XP-D1 OPEN8 FIX 2 — Search/Read/Analyze/Open/Look family offer cap ≤2.
 * Root: creditFillerOffers was never called on the live/Fate path; within-pad Open×2
 * also needed a running count. Replay real 7401/7402 offered chips + injection paths.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import {
  actionFamily,
  creditFillerOffers,
  fillerOfferExhausted,
  isFillerNoProgressChip,
  rankChoices,
} from './choiceRanking';
import { enforceFillerFamilyCap, padChoicesToCount } from './choicePipeline';
import type { GameState } from './types';

const RUN_7401 =
  'C:/Users/littl/OneDrive/Documents/synapticgm/game/wt/XPWILDS3/scripts/fate-autoplay/runs/2026-11-02T19-30-46-409Z_ascending-spire_cold-system_s7401/turns.jsonl';
const RUN_7402 =
  'C:/Users/littl/OneDrive/Documents/synapticgm/game/wt/XPWILDS3/scripts/fate-autoplay/runs/2026-11-02T20-20-49-263Z_twin-lanterns_chilled-gm_s7402/turns.jsonl';

type Row = {
  turn: number;
  location?: string;
  offeredChoices?: string[];
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

/** Replay offered chips with live credit + cap; return max same-scene family count. */
function replayMaxFamily(path: string, mode: 'litrpg' | 'rpg'): { max: number; fam: string; turn: number } {
  const rows = loadRows(path);
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
    };
    const offered = row.offeredChoices ?? [];
    const ranked = rankChoices(state, offered).choices;
    const padded = padChoicesToCount(ranked, state, `At ${loc}.`, 3, offered[0] ?? '');
    // Injection paths: journey Study, Open boxes, Check/Look, free-input restore.
    const injected = Array.from(
      new Set([
        ...padded,
        ...offered.filter((c) => isFillerNoProgressChip(c)),
        'Study the signs',
        'Open the bronze reward box',
        'Open the silver reward box',
        'Look around',
        'Check the door',
        'Say something…',
        'Do something else…',
        'Walk on',
      ]),
    );
    const capped = enforceFillerFamilyCap(injected, state);
    const fillers = capped.filter((c) => isFillerNoProgressChip(c));
    const counts: Record<string, number> = {};
    for (const c of fillers) {
      const f = actionFamily(c);
      counts[f] = (counts[f] ?? 0) + 1;
      if (counts[f]! > max) {
        max = counts[f]!;
        fam = f;
        at = row.turn;
      }
    }
    state = creditFillerOffers(state, capped);
  }
  return { max, fam, turn: at };
}

describe('OPEN8 — filler family cap ≤2 (credit wired + within-pad)', () => {
  it('within one pad: at most 2 Open/Search chips when counts are fresh', () => {
    const state = base('litrpg', 'Ranking Board');
    const kept = enforceFillerFamilyCap(
      [
        'Walk on',
        'Open the bronze reward box',
        'Open the silver reward box',
        'Open the gold reward box',
        'Hunt the wildlife nearby',
        'Say something…',
      ],
      state,
    );
    expect(kept.filter((c) => /^open\b/i.test(c))).toHaveLength(2);
    expect(kept).toContain('Hunt the wildlife nearby');
    expect(kept).toContain('Walk on');
  });

  it('after 2 credits, third offer of the family is dropped (all injection labels)', () => {
    let state = base('litrpg', 'On the road between places');
    state = creditFillerOffers(state, ['Open the bronze reward box', 'Read the signs of the threat signs']);
    expect(fillerOfferExhausted(state, 'Open the silver reward box')).toBe(true);
    expect(fillerOfferExhausted(state, 'Search Ranking Board for signs')).toBe(true);
    expect(fillerOfferExhausted(state, 'Analyze Marshal Kade')).toBe(true);
    expect(fillerOfferExhausted(state, 'Look around')).toBe(false); // look is own family until credited as look
    const kept = enforceFillerFamilyCap(
      [
        'Walk on',
        'Open the silver reward box',
        'Search Ranking Board for signs',
        'Study the signs',
        'Look around',
        'Check the door',
        'Gather herbs and resources nearby',
      ],
      state,
    );
    expect(kept.some((c) => isFillerNoProgressChip(c) && actionFamily(c) === 'search')).toBe(false);
    expect(kept).toContain('Walk on');
    expect(kept).toContain('Gather herbs and resources nearby');
  });

  it('Look family is capped at 2 across credits', () => {
    let state = base('rpg', 'Twin Lanterns stable');
    state = creditFillerOffers(state, ['Look around', 'Look over the stalls']);
    expect(fillerOfferExhausted(state, 'Look around')).toBe(true);
    const kept = enforceFillerFamilyCap(['Look around', 'Talk to Ashin', 'Leave the scene'], state);
    expect(kept).not.toContain('Look around');
    expect(kept).toContain('Talk to Ashin');
  });

  it('replay 7401 offered chips: max same-scene family ≤2 after credit+cap', () => {
    if (!existsSync(RUN_7401)) return;
    const { max, fam, turn } = replayMaxFamily(RUN_7401, 'litrpg');
    expect(max, `7401 fam=${fam} @T${turn}`).toBeLessThanOrEqual(2);
  }, 30_000);

  it('replay 7402 offered chips: max same-scene family ≤2 after credit+cap', () => {
    if (!existsSync(RUN_7402)) return;
    const { max, fam, turn } = replayMaxFamily(RUN_7402, 'rpg');
    expect(max, `7402 fam=${fam} @T${turn}`).toBeLessThanOrEqual(2);
  }, 30_000);

  it('dead scene still keeps Leave / Walk / quest-shaped chip when fillers drop', () => {
    let state = base('litrpg', 'Ranking Board');
    state = creditFillerOffers(state, [
      'Search Ranking Board for signs',
      'Read the signs of the threat signs',
    ]);
    const kept = enforceFillerFamilyCap(
      [
        'Search Ranking Board for signs',
        'Open the bronze reward box',
        'Walk on',
        'Leave the scene',
        'Honour the promise: System bounty: Sickness spreads',
      ],
      state,
    );
    expect(kept.some((c) => /walk on|leave the scene|honour the promise/i.test(c))).toBe(true);
  });
});
