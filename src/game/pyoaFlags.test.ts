import { afterEach, describe, expect, it } from 'vitest';
import {
  pyoaCondHolds,
  resolvePyoaPage,
  type PyoaCond,
  type PyoaPageVariant,
} from './pyoaCond';
import {
  authoredPageText,
  ensurePyoaSpine,
  installPyoaTestSpineNodes,
  legalSpineExits,
  spineChoiceLabels,
  type PyoaSpineNode,
  type PyoaSpineState,
} from './pyoaSpine';
import { createInitialState } from './defaults';
import type { GameState } from './types';

describe('pyoaCondHolds', () => {
  it('matches equal, array, _, true, not, any, and AND of keys', () => {
    const flags = { cover: 'tailor', cabal: 'known', faceKnown: 'yes' };

    expect(pyoaCondHolds({ cover: 'tailor' }, flags)).toBe(true);
    expect(pyoaCondHolds({ cover: 'livery' }, flags)).toBe(false);
    expect(pyoaCondHolds({ cover: ['tailor', 'livery'] }, flags)).toBe(true);
    expect(pyoaCondHolds({ cover: ['mask', 'livery'] }, flags)).toBe(false);

    expect(pyoaCondHolds({ vault: '_' }, flags)).toBe(true);
    expect(pyoaCondHolds({ faceKnown: '_' }, flags)).toBe(false);
    expect(pyoaCondHolds({ vault: true }, flags)).toBe(false);
    expect(pyoaCondHolds({ cabal: true }, flags)).toBe(true);

    expect(pyoaCondHolds({ not: { faceKnown: 'yes' } }, flags)).toBe(false);
    expect(pyoaCondHolds({ not: { faceKnown: 'no' } }, flags)).toBe(true);

    expect(
      pyoaCondHolds({ any: [{ cover: 'mask' }, { cover: 'tailor' }] } as PyoaCond, flags)
    ).toBe(true);
    expect(
      pyoaCondHolds({ any: [{ cover: 'mask' }, { cover: 'livery' }] } as PyoaCond, flags)
    ).toBe(false);

    expect(pyoaCondHolds({ cover: 'tailor', cabal: 'known' }, flags)).toBe(true);
    expect(pyoaCondHolds({ cover: 'tailor', cabal: 'secret' }, flags)).toBe(false);
    expect(pyoaCondHolds(null, flags)).toBe(true);
    expect(pyoaCondHolds(undefined, flags)).toBe(true);
  });
});

describe('resolvePyoaPage', () => {
  const base = 'The hall is quiet.';
  const variants: PyoaPageVariant[] = [
    { when: { cover: 'tailor' }, before: 'You still wear the tailor cover.' },
    { when: { cabal: 'known' }, after: 'The cabal mark burns on your palm.' },
    { when: { vault: 'open' }, replace: 'The vault stands open and empty.' },
    { when: { cover: 'tailor', vault: 'open' }, after: 'Cloth dust floats in the draught.' },
  ];

  it('returns base text when nothing matches', () => {
    expect(resolvePyoaPage(base, variants, {})).toBe(base);
    expect(resolvePyoaPage(base, undefined, {})).toBe(base);
  });

  it('applies before/after in order and replace before before/after', () => {
    expect(resolvePyoaPage(base, variants, { cover: 'tailor' })).toBe(
      'You still wear the tailor cover.\n\nThe hall is quiet.'
    );
    expect(resolvePyoaPage(base, variants, { cabal: 'known' })).toBe(
      'The hall is quiet.\n\nThe cabal mark burns on your palm.'
    );
    expect(resolvePyoaPage(base, variants, { vault: 'open' })).toBe(
      'The vault stands open and empty.'
    );
    expect(resolvePyoaPage(base, variants, { cover: 'tailor', vault: 'open' })).toBe(
      [
        'You still wear the tailor cover.',
        'The vault stands open and empty.',
        'Cloth dust floats in the draught.',
      ].join('\n\n')
    );
  });
});

describe('legalSpineExits flag gating', () => {
  const SYNTH_END: PyoaSpineNode = {
    id: 'synth-end',
    stake: 'Ending.',
    endingId: 'synth:end',
    page: 'The book closes.',
    exits: [],
  };

  const SYNTH_HALL: PyoaSpineNode = {
    id: 'synth-hall',
    stake: 'Synthetic hall for flag gating.',
    page: 'Base hall text.',
    variants: [{ when: { cover: 'tailor' }, after: 'Your needle kit shows under the cuff.' }],
    exits: [
      {
        id: 'always-door',
        label: 'Take the open door',
        to: 'synth-end',
        action: 'pyoa:always-door',
      },
      {
        id: 'tailor-only',
        label: 'Flash the tailor papers',
        to: 'synth-end',
        action: 'pyoa:tailor-only',
        when: { cover: 'tailor' },
      },
      {
        id: 'cabal-only',
        label: 'Speak the cabal word',
        to: 'synth-end',
        action: 'pyoa:cabal-only',
        when: { cabal: 'known' },
      },
    ],
  };

  const ALL_GATED: PyoaSpineNode = {
    id: 'synth-trapped',
    stake: 'All exits gated.',
    page: 'No free door.',
    exits: [
      {
        id: 'a',
        label: 'Need cover A',
        to: 'synth-end',
        action: 'pyoa:a',
        when: { cover: 'a' },
      },
      {
        id: 'b',
        label: 'Need cover B',
        to: 'synth-end',
        action: 'pyoa:b',
        when: { cover: 'b' },
      },
    ],
  };

  let dispose: (() => void) | undefined;
  afterEach(() => {
    dispose?.();
    dispose = undefined;
  });

  function synthState(
    nodeId: string,
    flags: Record<string, string | boolean> = {}
  ): GameState {
    const spine: PyoaSpineState = {
      bibleId: 'umbra-protocol',
      currentNodeId: nodeId,
      visited: [nodeId],
      flags,
      delayCount: 0,
      endingId: null,
    };
    let state = createInitialState(undefined, 'pyoa') as GameState;
    state = {
      ...state,
      engineMode: 'pyoa',
      campaignBibleId: 'umbra-protocol',
      pyoaSpine: spine,
    };
    return ensurePyoaSpine(state);
  }

  it('gates exits by when and keeps spineChoiceLabels in sync', () => {
    dispose = installPyoaTestSpineNodes([SYNTH_HALL, SYNTH_END]);

    const empty = synthState('synth-hall', {});
    expect(legalSpineExits(empty).map((e) => e.id)).toEqual(['always-door']);
    expect(spineChoiceLabels(empty)).toEqual(['Take the open door']);
    expect(authoredPageText(empty)).toBe('Base hall text.');

    const tailor = synthState('synth-hall', { cover: 'tailor' });
    expect(legalSpineExits(tailor).map((e) => e.id).sort()).toEqual(
      ['always-door', 'tailor-only'].sort()
    );
    expect(spineChoiceLabels(tailor).sort()).toEqual(
      ['Flash the tailor papers', 'Take the open door'].sort()
    );
    expect(authoredPageText(tailor)).toBe(
      'Base hall text.\n\nYour needle kit shows under the cuff.'
    );

    const both = synthState('synth-hall', { cover: 'tailor', cabal: 'known' });
    expect(legalSpineExits(both).map((e) => e.id).sort()).toEqual(
      ['always-door', 'cabal-only', 'tailor-only'].sort()
    );
  });

  it('never dead-ends: falls back to ungated, then all exits', () => {
    dispose = installPyoaTestSpineNodes([ALL_GATED, SYNTH_HALL, SYNTH_END]);

    // Every exit has `when` and none hold → offer all (never a dead end).
    expect(legalSpineExits(synthState('synth-trapped', {})).map((e) => e.id).sort()).toEqual([
      'a',
      'b',
    ]);

    // Gated exits fail, ungated remains → only the free exit.
    expect(legalSpineExits(synthState('synth-hall', {})).map((e) => e.id)).toEqual([
      'always-door',
    ]);
  });
});
