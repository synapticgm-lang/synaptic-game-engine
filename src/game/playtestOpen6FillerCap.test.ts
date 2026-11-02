/**
 * XP-D1 OPEN6 — Search/Read/Analyze/Open family offer cap ≤2 on every path,
 * including affordance rebuild. Replay OPEN4 + OPEN5 chip streams.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';
import {
  actionFamily,
  creditFillerOffers,
  fillerOfferExhausted,
  isFillerNoProgressChip,
  rankChoices,
} from './choiceRanking';
import { padChoicesToCount } from './choicePipeline';
import type { GameState } from './types';

const OPEN4 = resolve(__dirname, '../__tests__/fixtures/xp-open4-chipstreams');
const OPEN5 = resolve(__dirname, '../__tests__/fixtures/xp-open5-chipstreams');

type Row = { turn: number; location: string; offeredChoices: string[]; level?: number };

function loadRows(dir: string, file: string): Row[] {
  return readFileSync(resolve(dir, file), 'utf8')
    .trim()
    .split(/\n/)
    .map((l) => JSON.parse(l) as Row);
}

/** Replay offered chips through credit+filter; return max consecutive turns a filler family was offered without a place change. */
function maxSameStateFamilyRun(rows: Row[]): number {
  let max = 0;
  const streak = new Map<string, number>();
  let lastPlace = '';
  let state = {
    engineMode: 'litrpg',
    turn: 0,
    currentLocation: rows[0]?.location ?? 'Here',
    character: { name: 'Jax', level: 2, xp: 0, xpToNext: 187, hp: 20, maxHp: 20 },
    openingEstablishment: { complete: true },
    circling: { stale: {} },
    quests: [],
    materials: [],
    inventory: [],
    log: [],
  } as unknown as GameState;

  for (const row of rows) {
    const place = (row.location ?? '').toLowerCase();
    if (place !== lastPlace) {
      streak.clear();
      lastPlace = place;
    }
    state = {
      ...state,
      turn: row.turn,
      currentLocation: row.location,
      character: { ...state.character, level: row.level ?? state.character.level },
    };
    const ranked = rankChoices(state, row.offeredChoices ?? []);
    const shown = ranked.choices.filter((c) => {
      if (!isFillerNoProgressChip(c)) return true;
      return !fillerOfferExhausted(state, c);
    });
    const padded = padChoicesToCount(shown, state, `At ${row.location}.`, 3, row.offeredChoices?.[0] ?? '');
    const famsThisTurn = new Set(
      padded.filter((c) => isFillerNoProgressChip(c)).map((c) => actionFamily(c))
    );
    for (const [fam, n] of [...streak.entries()]) {
      if (!famsThisTurn.has(fam)) streak.delete(fam);
      else {
        const next = n + 1;
        streak.set(fam, next);
        max = Math.max(max, next);
      }
    }
    for (const fam of famsThisTurn) {
      if (!streak.has(fam)) {
        streak.set(fam, 1);
        max = Math.max(max, 1);
      }
    }
    state = creditFillerOffers(state, padded);
  }
  return max;
}

describe('OPEN6 filler family cap ≤2', () => {
  const open4Files = readdirSync(OPEN4).filter((f) => f.endsWith('.jsonl'));
  for (const file of open4Files) {
    it(`OPEN4 stream ${file}: max same-state filler family offers ≤2 after credit+filter`, () => {
      const max = maxSameStateFamilyRun(loadRows(OPEN4, file));
      expect(max).toBeLessThanOrEqual(2);
    });
  }

  const open5Files = readdirSync(OPEN5).filter((f) => f.endsWith('.jsonl'));
  for (const file of open5Files) {
    it(`OPEN5 stream ${file}: max same-state filler family offers ≤2 after credit+filter`, () => {
      const max = maxSameStateFamilyRun(loadRows(OPEN5, file));
      expect(max).toBeLessThanOrEqual(2);
    });
  }

  it('affordance rebuild drops a blocked Analyze family after 2 credits', () => {
    let state = {
      engineMode: 'litrpg',
      turn: 10,
      currentLocation: 'Kitchen Saint Alley',
      character: { name: 'Jax', level: 3, xp: 0, xpToNext: 200, hp: 20, maxHp: 20 },
      openingEstablishment: { complete: true },
      circling: { stale: {} },
      materials: [],
      inventory: [],
      log: [{ id: 'g1', role: 'gm', content: 'Hobb waits in the alley.', timestamp: 0 }],
      places: [{ id: 'p', name: 'Kitchen Saint Alley', sceneLedger: { present: ['Hobb Barrow'] } }],
    } as unknown as GameState;
    const a = 'Analyze Hobb Barrow';
    const b = 'Read Hobb Barrow';
    state = creditFillerOffers(state, [a]);
    state = creditFillerOffers(state, [b]);
    expect(fillerOfferExhausted(state, 'Analyze Osric Marl')).toBe(true);
    const padded = padChoicesToCount(
      [a, b, 'Look around', 'Travel toward Contract Hall'],
      state,
      'Hobb waits in the alley.',
      3,
      'Look around'
    );
    expect(padded.some((c) => /^analyze\b/i.test(c) || /^read\b/i.test(c))).toBe(false);
  });
});
