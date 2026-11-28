/**
 * Order RC-HF1 — one offered list (System / origin chips fold into resolveOfferedChoices).
 * Acceptance: docs/orders/acceptance-tests-new-orders.md § RC-HF1.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { resolveOfferedChoices } from './playTranscript';
import { pickFateChoice, mulberry32 } from './fatePick';
import { openBoxChip, rewardBoxItem, settleRewardBox } from './rules/achievements';
import { systemPromptPad } from './rules/abilityPoints';
import { classChip, classOfferPad, CLASS_QUICK_START_CHIP } from './rules/characterClass';
import type { GameState, Item, LogEntry } from './types';

const promptRow = (s: GameState) => systemPromptPad(s, classOfferPad(s))?.chips ?? [];

function bronzeBoxes(n: number): Item[] {
  const def = { key: 'achv:first-kill', name: 'First Kill', tier: 'Bronze' as const, earned: () => true };
  return Array.from({ length: n }, (_, i) => {
    const box = rewardBoxItem(def);
    return { ...box, id: `${box.id}:${i}` };
  });
}

function litrpgWithBoxes(n: number): GameState {
  const state = createInitialState('The Summoned Pact', 'litrpg');
  state.campaignBibleId = 'summoned-pact';
  state.seed = 'hf1-boxes';
  state.currentLocation = 'Lowmarket';
  state.turn = 10;
  state.openingEstablishment = {
    ...(state.openingEstablishment ?? { pending: [], answers: {}, complete: false }),
    complete: true,
    pending: [],
  };
  state.character = { ...state.character, classId: 'fighter', name: 'Jax' };
  state.classOffer = null;
  state.activeEncounter = null;
  state.roundCombat = null;
  state.inventory = [...(state.inventory ?? []), ...bronzeBoxes(n)];
  state.choices = ['Look around', 'Wait and listen', 'Travel toward West Wall'];
  state.log = [
    { id: 'g1', turn: 10, role: 'gm', content: 'Lowmarket stalls hum under the awnings.', timestamp: 1 },
  ] as LogEntry[];
  return state;
}

describe('RC-HF1 one offered list', () => {
  it('HF1-a: box chips are in resolveOfferedChoices; fate does not mash them for one seed', () => {
    const state = litrpgWithBoxes(3);
    const box = openBoxChip('Bronze');
    expect(promptRow(state)).toContain(box);
    const offered = resolveOfferedChoices(state);
    expect(offered).toContain(box);
    expect(offered.length).toBeGreaterThan(1);

    // One seeded fate path: not three box opens in a row (old systemPad force).
    const rng = mulberry32(42);
    const picks = [0, 1, 2].map(() => pickFateChoice(offered, rng));
    expect(picks.every((p) => p === box)).toBe(false);

    // Across 100 seeds the box share ≈ 1/N (uniform Fate weights).
    let boxHits = 0;
    const trials = 100;
    for (let s = 0; s < trials; s++) {
      if (pickFateChoice(offered, mulberry32(1000 + s)) === box) boxHits++;
    }
    const share = 1 / offered.length;
    expect(boxHits / trials).toBeGreaterThan(share * 0.35);
    expect(boxHits / trials).toBeLessThan(share * 2.5 + 0.05);
  });

  it('HF1-b: opening a box removes exactly one; chip gone when none left', () => {
    let state = litrpgWithBoxes(2);
    const box = openBoxChip('Bronze');
    expect(resolveOfferedChoices(state)).toContain(box);

    const first = settleRewardBox(state, box);
    expect(first.settled).toBe(true);
    state = first.state;
    const left = (state.inventory ?? []).filter((i) => /Bronze Reward Box/i.test(i.name));
    expect(left).toHaveLength(1);
    expect(resolveOfferedChoices(state)).toContain(box);

    const second = settleRewardBox(state, box);
    expect(second.settled).toBe(true);
    state = second.state;
    expect((state.inventory ?? []).filter((i) => /Bronze Reward Box/i.test(i.name))).toHaveLength(0);
    expect(resolveOfferedChoices(state)).not.toContain(box);
    expect(promptRow(state)).not.toContain(box);
  });

  it('HF1-c: class offer and box open are not the same System row (no mash)', () => {
    const state = litrpgWithBoxes(3);
    state.character = { ...state.character, classId: undefined };
    state.classOffer = { turn: state.turn ?? 10, choices: ['fighter', 'rogue', 'wizard'] };
    const classPads = classOfferPad(state)!;
    expect(classPads.some((c) => c === classChip('fighter') || c === CLASS_QUICK_START_CHIP)).toBe(true);

    const prompt = promptRow(state);
    const offered = resolveOfferedChoices(state);
    // Class offer wins the System row; box chip is not forced alongside it.
    expect(prompt).toEqual(classPads);
    expect(prompt).not.toContain(openBoxChip('Bronze'));
    for (const c of classPads) expect(offered).toContain(c);
    // Opening a box while the class row is up is not a System-row pick.
    expect(prompt.every((c) => !/^Open the .+ Reward Box$/i.test(c))).toBe(true);
  });
});
