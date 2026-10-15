/**
 * tt-fix-15 — one world clock and one repair request:
 * 1. road hours are the waking day's on the world clock, not each journey's; Extended Travel past 8 reads them;
 * 2. dropped token lines go into the turn's one repair request; whatever still fails leaves the page;
 * 3. SRD long rest at most once per 24 hours on the same clock;
 * 4. the camp's span comes from the clock;
 * 5. the gate reads a word's role ("their breath evening out" is a verb; "higher than a man could reach" is no one).
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { commitTravel, roadHoursToday, timeOfDayForHour, worldClock } from './travelJourney';
import { applyCampRest } from './recoveryRules';
import { lineHasWrongTimeOfDay } from './tokenProse';
import { repairRejectedSentences, type DraftCheck, type WriterTurnResult } from './writerTurn';
import { parsePlayerIntent } from './intentParser';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { GameState } from './types';

function keepState(seed: string, extra: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s,
    seed,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    currentLocation: 'Greyhollow Inn',
    worldAtlas: null,
    activeEncounter: null,
    journey: null,
    sceneFacts: s.sceneFacts ? { ...s.sceneFacts, pendingEncounter: undefined } : s.sceneFacts,
    ...extra,
  };
}

describe('1 — one road day on the world clock', () => {
  it('a new journey adds to the hours already walked today, and the hours past 8 roll the CON save', () => {
    const s = keepState('day', { worldHour: 9 });
    const tired = { ...s, roadDay: { since: worldClock(s), hours: 7 } };
    const out = commitTravel(tired, 'Travel toward Blackspine Treeline');
    const leg = out.state.journey!.hoursPerLeg;
    expect(roadHoursToday(out.state)).toBe(7 + leg);
    expect((out.extra ?? []).some((l) => /^Extended Travel: Constitution save/.test(l))).toBe(true);
    const fresh = commitTravel(s, 'Travel toward Blackspine Treeline');
    expect(roadHoursToday(fresh.state)).toBe(fresh.state.journey!.hoursPerLeg);
    expect((fresh.extra ?? []).some((l) => /^Extended Travel/.test(l))).toBe(false);
  });

  it('a day 24 hours gone no longer counts', () => {
    const s = keepState('gone', { worldHour: 9, worldDay: 3 });
    expect(roadHoursToday({ ...s, roadDay: { since: worldClock(s) - 25, hours: 8 } })).toBe(0);
  });
});

describe('2 — one repair request holds every dropped line; a failed one leaves the page', () => {
  const state = keepState('rep', {
    turn: 6,
    currentLocation: 'Keep Gate',
    character: { ...createInitialState(undefined, 'dnd').character, name: 'Jax' },
    openingEstablishment: { pending: [], answers: {}, complete: true },
  } as Partial<GameState>);
  const check: DraftCheck = { state, playerInput: 'Look around', intent: parsePlayerIntent('Look around', state), engineFact: '', previousGm: '' };
  const prose = 'Jax looked along the wall. The wind rose.';
  const turn = {
    prose,
    dropped: [
      { sentence: 'A dragon roared overhead.', reason: 'bad', after: 'Jax looked along the wall.' },
      { sentence: 'Three guards marched past.', reason: 'bad', after: 'The wind rose.' },
    ],
  } as unknown as WriterTurnResult;
  const run = async (reply: string) => {
    const asked: string[] = [];
    const out = await repairRejectedSentences(turn, {
      packet: { pc: state.character } as never,
      check,
      repair: async (r) => (asked.push(r), reply),
    });
    return { out, asked };
  };

  it('both dropped lines go in one request; passing rewrites go back after the line they followed', async () => {
    const { out, asked } = await run('Jax listened to the wind.\nThe gate stayed shut.');
    expect(asked).toHaveLength(1);
    expect(asked[0]).toContain('A dragon roared overhead.');
    expect(asked[0]).toContain('Three guards marched past.');
    expect(out.prose).toBe('Jax looked along the wall. Jax listened to the wind. The wind rose. The gate stayed shut.');
  });

  it('an empty or unchanged reply adds nothing; the dropped lines stay off the page', async () => {
    for (const reply of ['', 'A dragon roared overhead.\nThree guards marched past.']) {
      const { out } = await run(reply);
      expect(out.prose).toBe(prose);
      expect(out.repairs?.every((r) => !!r.bug)).toBe(true);
    }
  });
});

describe('3 — one long rest per 24 hours', () => {
  it('a second long rest too soon waits awake until 24 hours after the first began', () => {
    const s = keepState('rest', { worldHour: 20 });
    const hurt = (g: GameState) => ({ ...g, character: { ...g.character, hp: 1 } });
    const first = applyCampRest(hurt(s));
    const start = worldClock(s);
    expect(first.state.lastLongRestAt).toBe(start);
    expect(first.receipt).not.toMatch(/awake/);
    const second = applyCampRest(hurt(first.state));
    expect(second.receipt).toMatch(/awake \(one long rest per 24 hours\)/);
    expect(second.state.lastLongRestAt).toBe(start + 24);
    expect(worldClock(second.state)).toBe(worldClock(first.state) + 24);
  });
});

describe('4 — the camp is named from the clock', () => {
  it.each([10, 21])('camp made at hour %i says when it began', (hour) => {
    for (let i = 0; i < 200; i++) {
      const t = commitTravel(keepState(`camp-${hour}-${i}`, { worldHour: hour }), 'Travel toward Blackspine Treeline');
      const j = t.state.journey;
      if (!j || j.encounter || j.legsDone >= j.legsTotal) continue;
      const at = { ...t.state, worldHour: hour, roadDay: { since: worldClock(t.state), hours: 8 } };
      const c = commitTravel(at, 'Make camp');
      if (c.event !== 'camp') continue;
      expect(c.receipt).toContain(`camped from ${timeOfDayForHour(hour)} until`);
      return;
    }
    throw new Error('no quiet camp found');
  });
});

describe('5 — a word is read by its role in the sentence', () => {
  const midday = '\u0000clock\u0000midday';
  it('"their breath evening out" is a verb, not the evening', () => {
    expect(lineHasWrongTimeOfDay('Their breath evening out, they slept against the wall.', midday)).toBe(false);
    expect(lineHasWrongTimeOfDay('The evening air was cold on the stones.', midday)).toBe(true);
    expect(lineHasWrongTimeOfDay('Morning light sat pale on the stones.', midday)).toBe(true);
  });

  it('"a man" as the standard of a comparison or a might-be brings nobody on', async () => {
    const { checkTurn } = (await import(/* @vite-ignore */ pathToFileURL(resolve('scripts/factCheck.mjs')).href)) as {
      checkTurn: (row: unknown, packet: string, page: string) => Array<{ kind: string }>;
    };
    const packet = 'ENGINE RESULT (required fact): Look: the hall is empty.\nREADER: plain\nThe player character is Jax: write that name plainly.';
    const kinds = (gmText: string) => checkTurn({ turn: 4, gmText }, packet, '').map((f) => f.kind);
    expect(kinds('The shelf ran higher than a man could reach.')).not.toContain('person');
    expect(kinds('A man stood by the door.')).toContain('person');
  });
});
