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

  it('does not stack a second name-ask when the hook already asked', () => {
    const base = createInitialState('The Summoned Pact', 'litrpg');
    const state = {
      ...base,
      seed: 'already-named',
      campaignBibleId: 'summoned-pact',
      openingEstablishment: {
        pending: [
          {
            id: 'name',
            kind: 'name' as const,
            question: 'They will not move until you give them something to write. What name?',
          },
        ],
        answers: {},
        complete: false,
        registrar: { voice: 'inworld' as const, label: 'THE CIRCLE', startLine: 'Light.' },
        sceneWritten: false,
        mode: 'weave' as const,
        pickedHookFallback:
          'Light, then three other people on neighboring rings. A mass summon. What name do they write?',
        aloneArrival: false,
      },
    };
    const text = stitchOpeningScene(state);
    expect(text).toMatch(/what name/i);
    expect(text.match(/what name/gi)?.length).toBe(1);
  });

  it('adds an unused card beat so a known hook is not only spice + name-ask', () => {
    const base = createInitialState('The Summoned Pact', 'litrpg');
    const state = {
      ...base,
      seed: 'mass-summon-extra',
      campaignBibleId: 'summoned-pact',
      openingEstablishment: {
        pending: [
          {
            id: 'name',
            kind: 'name' as const,
            question: 'They will not move until you give them something to write. What name?',
          },
        ],
        answers: {},
        complete: false,
        registrar: { voice: 'inworld' as const, label: 'THE CIRCLE', startLine: 'Light.' },
        sceneWritten: false,
        mode: 'weave' as const,
        pickedHookFallback:
          'Light, then three other people on neighboring rings. A mass summon. The room is already arguing who is Pactborn, who is Marked, and who was extra. A blue panel hangs at eye level — private, yours. Your Earth clothes are still on you.',
        aloneArrival: false,
      },
    };
    const text = stitchOpeningScene(state);
    expect(text).toMatch(/kit crate|not a solo hero|yours, not theirs/i);
    expect(text).toMatch(/what name/i);
  });

  it('continues after covers locally without rehashing locked name/look/kit', () => {
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
    expect(text).toMatch(/half-collapsed ruin/i);
    expect(text).not.toMatch(/Sevenfold/i);
    expect(text).not.toMatch(/Nothing reset/i);
    expect(text).not.toMatch(/anyone listening/i);
    expect(text).not.toMatch(/still HERE|same place, same light/i);
    expect(text).not.toMatch(/panel has you as Jax/i);
    expect(text).not.toMatch(/You are wearing Travel clothes/i);
    expect(text).not.toMatch(/On you: A bag/i);
    expect(text).not.toMatch(/quiet after the light is too clean|road, if there is one/i);
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
