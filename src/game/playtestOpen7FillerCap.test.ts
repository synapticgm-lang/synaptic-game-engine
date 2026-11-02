/**
 * XP-D1 OPEN7 — Search/Read/Analyze/Open family offer cap ≤2 at pipeline end.
 * Replays OPEN4 chipstreams + real attempt-6 streams (7301–7307).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { resolve } from 'path';
import {
  actionFamily,
  creditFillerOffers,
  fillerOfferExhausted,
  isFillerNoProgressChip,
  rankChoices,
} from './choiceRanking';
import { enforceFillerFamilyCap, padChoicesToCount } from './choicePipeline';
import type { GameState } from './types';

const OPEN4 = resolve(__dirname, '../__tests__/fixtures/xp-open4-chipstreams');
const OPEN6 = resolve(__dirname, '../__tests__/fixtures/xp-open6-chipstreams');

type Row = { turn: number; location: string; offeredChoices: string[]; level?: number };

function loadRows(dir: string, file: string): Row[] {
  return readFileSync(resolve(dir, file), 'utf8')
    .trim()
    .split(/\n/)
    .map((l) => JSON.parse(l) as Row);
}

function maxSameStateFamilyRun(rows: Row[], withJourney = false): number {
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
    const onRoad = /on the road between places/i.test(row.location ?? '');
    state = {
      ...state,
      turn: row.turn,
      currentLocation: row.location,
      character: { ...state.character, level: row.level ?? state.character.level },
      journey:
        withJourney && onRoad
          ? ({
              from: 'A',
              to: 'B',
              leg: 1,
              legs: 2,
              terrain: 'road',
              encounter: { kind: 'signs', level: 2, life: 'fresh' },
            } as unknown as GameState['journey'])
          : undefined,
    } as GameState;
    const ranked = rankChoices(state, row.offeredChoices ?? []);
    const shown = ranked.choices.filter((c) => {
      if (!isFillerNoProgressChip(c)) return true;
      return !fillerOfferExhausted(state, c);
    });
    const padded = padChoicesToCount(shown, state, `At ${row.location}.`, 3, row.offeredChoices?.[0] ?? '');
    // Also force-include any journey-style filler that was on the live offer (Study the signs)
    // then run the final cap — mirrors roadOwnsPad + enforceFillerFamilyCap.
    const withLive = enforceFillerFamilyCap(
      Array.from(new Set([...padded, ...(row.offeredChoices ?? []).filter((c) => isFillerNoProgressChip(c))])),
      state
    );
    const famsThisTurn = new Set(
      withLive.filter((c) => isFillerNoProgressChip(c)).map((c) => actionFamily(c))
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
    state = creditFillerOffers(state, withLive);
  }
  return max;
}

describe('OPEN7 filler family cap ≤2', () => {
  if (existsSync(OPEN4)) {
    const open4Files = readdirSync(OPEN4).filter((f) => f.endsWith('.jsonl'));
    for (const file of open4Files) {
      it(`OPEN4 stream ${file}: max same-state filler family ≤2`, () => {
        expect(maxSameStateFamilyRun(loadRows(OPEN4, file))).toBeLessThanOrEqual(2);
      });
    }
  }

  if (existsSync(OPEN6)) {
    const open6Files = readdirSync(OPEN6).filter((f) => f.endsWith('.jsonl'));
    for (const file of open6Files) {
      it(`OPEN6 live stream ${file}: max same-state filler family ≤2 (journey-aware)`, () => {
        expect(maxSameStateFamilyRun(loadRows(OPEN6, file), true)).toBeLessThanOrEqual(2);
      });
    }
  }

  it('enforceFillerFamilyCap drops Study the signs after 2 credits on a journey', () => {
    let state = {
      engineMode: 'litrpg',
      turn: 40,
      currentLocation: 'On the road between places',
      character: { name: 'Jax', level: 2, xp: 0, xpToNext: 187, hp: 20, maxHp: 20 },
      openingEstablishment: { complete: true },
      circling: { stale: {} },
      journey: { from: 'A', to: 'B', leg: 1, legs: 2, terrain: 'road' },
      materials: [],
      inventory: [],
      log: [],
      quests: [],
    } as unknown as GameState;
    const chip = 'Study the signs';
    state = creditFillerOffers(state, [chip]);
    state = creditFillerOffers(state, [chip]);
    const kept = enforceFillerFamilyCap(['Walk on', chip, 'Hunt the wildlife nearby'], state);
    expect(kept).toContain('Walk on');
    expect(kept).toContain('Hunt the wildlife nearby');
    expect(kept).not.toContain(chip);
  });
});
