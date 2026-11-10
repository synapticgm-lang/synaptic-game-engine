/**
 * The turn asks a model only for spans the code marked UNSURE, and only when
 * SGM_UNSURE_FACT_CHECK=on. A clean page makes no call. No live model.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  applyFactGate,
  factCheckDefault,
  isFactCheckEnabled,
  makeUnsureFactChecker,
} from './factGate';
import type { FactSheet } from './factSheet';
import type { FactSpan } from './factGate';

function sheet(): FactSheet {
  return {
    turn: 3,
    place: { name: 'Valespire Bathhouse', exits: ['street'], features: ['cold plunge', 'furnace', 'cloak'] },
    present: [{ name: 'Mira' }],
    openLedger: [],
    gear: { worn: [], carrying: ['Bag'], inHand: 'nothing' },
    beat: {
      verb: 'spoke',
      outcome: 'spoke',
      engineResult: 'Mira answered.',
      steps: [{ outcome: 'moved', detail: 'No move this turn: at the bathhouse. Do not narrate leaving.' }],
    },
    player: { typed: 'hello Mira', claimsNotTrue: [] },
    quests: [],
    recent: [],
    settingsSlot: null,
  };
}

const trade = 'Mira stays by the door. Folks there trade in things they should not.';

describe('turn fact model', () => {
  it('keeps the hosted candidate check off unless SGM_FACT_CHECK=on', () => {
    expect(factCheckDefault(undefined, false)).toBe(false);
    expect(factCheckDefault(undefined, true)).toBe(false);
    expect(factCheckDefault('off', false)).toBe(false);
    expect(factCheckDefault('on', false)).toBe(true);
    const previous = process.env.SGM_FACT_CHECK;
    delete process.env.SGM_FACT_CHECK;
    try {
      expect(isFactCheckEnabled()).toBe(false);
    } finally {
      if (previous === undefined) delete process.env.SGM_FACT_CHECK;
      else process.env.SGM_FACT_CHECK = previous;
    }
  });

  it('makes no call for an empty unsure list, and sends only those spans when asked', async () => {
    const seen: string[] = [];
    const check = makeUnsureFactChecker(sheet(), async (payload) => {
      seen.push(payload);
      return '[{"n":1,"verdict":"keep"}]';
    });
    expect(await check([])).toEqual([]);
    expect(seen).toEqual([]);
    const span: FactSpan = {
      id: 's2',
      text: 'Folks there trade in things they should not.',
      verdict: 'UNSURE',
      route: 'candidate',
      reason: 'world claim',
    };
    expect(await check([span])).toEqual([{ id: 's2', verdict: 'allowed' }]);
    expect(seen).toHaveLength(1);
    expect(seen[0]).toContain('Folks there trade');
    expect(seen[0]).not.toContain('Mira stays');
  });

  it('does not call a model when code already decided every span', async () => {
    let calls = 0;
    const out = await applyFactGate({
      prose: 'Steam curls off the cold plunge.',
      sheet: sheet(),
      factCheckEnabled: false,
      factCheck: async () => {
        calls += 1;
        return [];
      },
      unsureCheckEnabled: true,
      unsureCheck: makeUnsureFactChecker(sheet(), async () => {
        calls += 1;
        return '[]';
      }),
    });
    expect(calls).toBe(0);
    expect(out.prose).toMatch(/Steam curls/);
  });

  it('sends only the unsure span when the flag is on, and none when it is off', async () => {
    let payload = '';
    const on = await applyFactGate({
      prose: trade,
      sheet: sheet(),
      factCheckEnabled: false,
      unsureCheckEnabled: true,
      unsureCheck: makeUnsureFactChecker(sheet(), async (body) => {
        payload = body;
        return '[{"n":1,"verdict":"keep"}]';
      }),
    });
    expect(payload).toContain('trade');
    expect(payload).not.toContain('Mira stays');
    expect(on.prose).toMatch(/trade/i);
    expect(on.prose).toContain('Mira stays by the door');

    let offCalls = 0;
    const off = await applyFactGate({
      prose: trade,
      sheet: sheet(),
      factCheckEnabled: false,
      unsureCheck: makeUnsureFactChecker(sheet(), async () => {
        offCalls += 1;
        return '[{"n":1,"verdict":"keep"}]';
      }),
    });
    expect(offCalls).toBe(0);
    expect(off.prose).not.toMatch(/trade/i);
    expect(off.prose).toContain('Mira stays by the door');
  });

  it('drops the unsure span when the model reply is empty or throws', async () => {
    const empty = await applyFactGate({
      prose: trade,
      sheet: sheet(),
      factCheckEnabled: false,
      unsureCheckEnabled: true,
      unsureCheck: makeUnsureFactChecker(sheet(), async () => ''),
    });
    expect(empty.prose).not.toMatch(/trade/i);
    expect(empty.prose).toContain('Mira stays by the door');

    const thrown = await applyFactGate({
      prose: trade,
      sheet: sheet(),
      factCheckEnabled: false,
      unsureCheckEnabled: true,
      unsureCheck: makeUnsureFactChecker(sheet(), async () => {
        throw new Error('checker down');
      }),
    });
    expect(thrown.prose).not.toMatch(/trade/i);
    expect(thrown.prose).toContain('Mira stays by the door');
  });

  it('live and Fate publish the engine page without a clause check, and call a model only for unsure spans', () => {
    const live = readFileSync(resolve(__dirname, './useGame.ts'), 'utf8');
    const fate = readFileSync(resolve(__dirname, './fateAutoplay.ts'), 'utf8');
    for (const source of [live, fate]) {
      expect(source).not.toContain('checkAndRepairProse');
      expect(source).not.toContain('storyAfterClauseCheck');
      expect(source).not.toContain('isFactCheckEnabled');
      expect(source).not.toContain('makeHostedFactChecker');
      expect(source).toContain('isUnsureFactCheckEnabled');
      expect(source).toContain('makeUnsureFactChecker');
      expect(source).toContain('pageWhenClauseWithheld');
      expect(source).toContain('factCheckEnabled: false');
    }
  });
});
