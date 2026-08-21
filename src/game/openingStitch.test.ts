import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { resolveOpeningPrompts } from './openingEstablishment';
import { summonedPact } from '@/data/campaigns/summonedPact';
import {
  applyOpeningContract,
  ensureStarterLookCharacter,
  stitchOpeningContinue,
  stitchOpeningScene,
} from './openingStitch';

describe('openingStitch', () => {
  it('stitches a unique instant page from seed without waiting on a writer', () => {
    const base = createInitialState('The Summoned Pact', 'litrpg');
    const a = {
      ...base,
      seed: 'seed-alpha',
      campaignBibleId: 'summoned-pact',
      currentLocation: 'a roadside shrine circle',
      openingEstablishment: {
        pending: [
          {
            id: 'name',
            kind: 'name' as const,
            question: 'Your blue panel waits on a designation. What name should it show?',
          },
        ],
        answers: {},
        complete: false,
        registrar: { voice: 'inworld' as const, label: 'THE CIRCLE', startLine: 'Light.' },
        sceneWritten: false,
        mode: 'weave' as const,
        pickedHookFallback:
          'Light, then quiet rural stone. One priest, one mistake. You are on your back in a roadside shrine circle. A blue panel hangs.',
        aloneArrival: false,
      },
    };
    const b = { ...a, seed: 'seed-beta' };
    const textA = stitchOpeningScene(a);
    const textB = stitchOpeningScene(b);
    expect(textA.length).toBeGreaterThan(60);
    expect(textA).toMatch(/panel|shrine|stone/i);
    expect(textA).toMatch(/designation|name/i);
    // Different seeds → different spice lines (banks)
    expect(textA).not.toBe(textB);
  });

  it('drops Earth-origin covers and varies ask lines', () => {
    const raw = resolveOpeningPrompts(summonedPact, 'litrpg');
    const contracted = applyOpeningContract(raw, summonedPact, true, 'seed-x');
    expect(contracted.some((p) => p.kind === 'location')).toBe(false);
    expect(contracted.find((p) => p.kind === 'name')?.question).toMatch(/panel/i);
    expect(contracted.find((p) => p.kind === 'name')?.question).not.toMatch(/someone in the scene/i);
  });

  it('seeds everyday look so the doll is not empty shoulders', () => {
    const c = ensureStarterLookCharacter({
      ...createInitialState('x', 'litrpg').character,
      appearance: '',
    });
    expect(c.appearance).toMatch(/everyday street clothes/i);
  });

  it('continues after covers locally with locked look', () => {
    const base = createInitialState('The Summoned Pact', 'litrpg');
    const state = {
      ...base,
      seed: 'cont-1',
      campaignBibleId: 'summoned-pact',
      currentLocation: 'a half-collapsed ruin',
      character: { ...base.character, name: 'Jax', appearance: 'Travel clothes' },
      openingEstablishment: {
        pending: [],
        answers: { name: 'Jax', wear: 'Travel clothes', pockets: 'A bag with everyday stuff' },
        complete: true,
        registrar: { voice: 'inworld' as const, label: 'THE CIRCLE', startLine: 'Light.' },
        sceneWritten: true,
        mode: 'weave' as const,
        aloneArrival: true,
        pickedHook: 'Alone in a half-collapsed ruin.',
      },
    };
    const text = stitchOpeningContinue(state);
    expect(text).toMatch(/Jax/);
    expect(text).toMatch(/Travel clothes/);
    expect(text).toMatch(/half-collapsed ruin/i);
    expect(text).not.toMatch(/Sevenfold/i);
    expect(text).not.toMatch(/Nothing reset/i);
    expect(text).not.toMatch(/anyone listening/i);
    expect(text).toMatch(/1\.\s*Get your bearings/i);
    expect(text).not.toMatch(/Pellane wanted you/i);
  });

  it('continue prefers answers.where over a stale cathedral currentLocation', () => {
    const base = createInitialState('The Summoned Pact', 'litrpg');
    const state = {
      ...base,
      seed: 'cont-2',
      campaignBibleId: 'summoned-pact',
      currentLocation: 'The Sevenfold Circle under Valespire Cathedral',
      character: { ...base.character, name: 'Jax', appearance: 'everyday street clothes' },
      openingEstablishment: {
        pending: [],
        answers: {
          name: 'Jax',
          where: 'Pellane war camp beyond Valespire walls',
          wear: 'everyday street clothes',
          pockets: 'A bag with everyday stuff',
        },
        complete: true,
        registrar: { voice: 'inworld' as const, label: 'THE CIRCLE', startLine: 'Light.' },
        sceneWritten: true,
        mode: 'weave' as const,
        aloneArrival: false,
      },
    };
    const text = stitchOpeningContinue(state);
    expect(text).toMatch(/war camp/i);
    expect(text).not.toMatch(/Sevenfold/i);
  });
});
