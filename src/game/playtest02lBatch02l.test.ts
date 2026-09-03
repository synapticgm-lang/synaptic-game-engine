/**
 * Batch 02l — shared 3×T50 locks: charter sale-replay + mid-game panel chrome.
 * Mid writer OFF.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { isAloneArrivalOpening } from './openingEstablishment';
import { recordPyoaBranchChoice, isPyoaCharterClosed, initPyoaBranchLedger } from './pyoaBranchLedger';
import { isFactClosedViolation } from './beatCommitGate';
import { scrubDestroyedPyoaItems } from './proseWarden';
import { rewriteChromePersonClauses, isPolityFactionOrPlaceToken } from './chromeAuthority';
import { canHarvestAsNamedPerson } from './entityRegistry';
import { harvestNarrativeIntoLedger } from './narrativeHarvest';
import { emptySceneFacts } from './sceneFacts';
import type { GameState } from './types';

describe('Batch 02l stamps', () => {
  it('HUD and BUILD are 2026-09-02l and Mid writer stays OFF', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-09-02l');
    expect(BUILD_STAMP).toBe('2026-09-02l');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });
});

describe('Batch 02l — Lock C: charter sale closes the topic', () => {
  function pyoaState(): GameState {
    const state = createInitialState(undefined, 'pyoa') as GameState;
    return {
      ...state,
      engineMode: 'pyoa',
      bibleId: 'thornferry-road',
      campaignBibleId: 'thornferry-road',
      inventory: [{ id: 'mc', name: 'Millstone Charter', rarity: 'Common', quantity: 1 }],
      pyoaBranchLedger: initPyoaBranchLedger(),
    };
  }

  it('sells the charter into destroyedItems and strips kit', () => {
    const after = recordPyoaBranchChoice(pyoaState(), 'Sell the charter to Pell');
    expect(isPyoaCharterClosed(after)).toBe(true);
    expect(after.inventory?.some((i) => /charter/i.test(i.name))).toBe(false);
  });

  it('rejects clerk-takes / pack-still-has replay after sale', () => {
    const after = recordPyoaBranchChoice(pyoaState(), 'Sell the charter to Pell');
    expect(
      isFactClosedViolation(after, 'The rain eases as the clerk takes the charter from your hands.')
    ).toBe(true);
    expect(
      isFactClosedViolation(after, 'The charter is in your pack, sealed paper heavier than its weight.')
    ).toBe(true);
    expect(isFactClosedViolation(after, 'The road east is wet. Wren keeps pace.')).toBe(false);
  });

  it('scrubs sale-replay prose', () => {
    const out = scrubDestroyedPyoaItems(
      'The clerk takes the charter from your hands. Pell offers you the charter again.',
      ['millstone-charter']
    );
    expect(out).not.toMatch(/takes the charter from your hands/i);
    expect(out).not.toMatch(/offers you the charter/i);
  });
});

describe('Batch 02l — chrome: alone-opening dies after covers; panel is not an actor', () => {
  it('isAloneArrivalOpening is false once opening is complete', () => {
    const state = createInitialState(undefined, 'litrpg') as GameState;
    state.openingEstablishment = {
      ...(state.openingEstablishment ?? {}),
      complete: true,
      aloneArrival: true,
    };
    expect(isAloneArrivalOpening(state)).toBe(false);
  });

  it('rewrites panel-as-actor agency', () => {
    const charge = rewriteChromePersonClauses("the panel doesn't charge toward you.", ['Brother Tam']);
    expect(charge).not.toMatch(/panel doesn/i);
    const step = rewriteChromePersonClauses(
      'the panel takes one deliberate step out of the alley.',
      ['Brother Tam']
    );
    expect(step).not.toMatch(/takes one deliberate step/i);
  });
});

describe('Batch 02l — Lock B: Thornferry Road is a place, not CAST', () => {
  it('denies harvest of Thornferry / Thornferry Road', () => {
    expect(isPolityFactionOrPlaceToken('Thornferry Road')).toBe(true);
    expect(canHarvestAsNamedPerson('Thornferry', 'thornferry-road')).toBe(false);
    expect(canHarvestAsNamedPerson('Thornferry Road', 'thornferry-road')).toBe(false);
  });

  it('does not add Thornferry Road to present[]', () => {
    let state = createInitialState(undefined, 'pyoa') as GameState;
    state = {
      ...state,
      engineMode: 'pyoa',
      bibleId: 'thornferry-road',
      campaignBibleId: 'thornferry-road',
      sceneFacts: { ...emptySceneFacts(6), present: ['Wren'] },
    };
    const next = harvestNarrativeIntoLedger(
      state,
      'On the near bank, the Thornferry Road crouches by a canvas pack.',
      6
    );
    expect(next.sceneFacts?.present ?? []).toContain('Wren');
    expect(next.sceneFacts?.present?.some((p) => /thornferry/i.test(p))).toBe(false);
  });
});
