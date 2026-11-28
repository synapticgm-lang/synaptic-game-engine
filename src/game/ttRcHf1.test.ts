/**
 * Order RC-HF1 — System / setup chips live on the System row; scene pad is finalOptions only.
 * (Was: fold System chips into resolveOfferedChoices — that mixed setup into the scene row.)
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { resolveOfferedChoices } from './playTranscript';
import { openBoxChip, rewardBoxItem, settleRewardBox } from './rules/achievements';
import { systemPromptPad } from './rules/abilityPoints';
import { classChip, classOfferPad, CLASS_QUICK_START_CHIP } from './rules/characterClass';
import { sceneOptionCount } from './finalOptions';
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

describe('RC-HF1 setup row vs scene pad', () => {
  it('HF1-a: box chips are on the System row only; scene pad is exact count without them', () => {
    const state = litrpgWithBoxes(3);
    const box = openBoxChip('Bronze');
    expect(promptRow(state)).toContain(box);
    const offered = resolveOfferedChoices(state);
    expect(offered).not.toContain(box);
    expect(offered).toHaveLength(sceneOptionCount(state.engineMode));
  });

  it('HF1-b: opening a box removes exactly one; System chip gone when none left', () => {
    let state = litrpgWithBoxes(2);
    const box = openBoxChip('Bronze');
    expect(promptRow(state)).toContain(box);
    expect(resolveOfferedChoices(state)).not.toContain(box);

    const first = settleRewardBox(state, box);
    expect(first.settled).toBe(true);
    state = first.state;
    const left = (state.inventory ?? []).filter((i) => /Bronze Reward Box/i.test(i.name));
    expect(left).toHaveLength(1);
    expect(promptRow(state)).toContain(box);
    expect(resolveOfferedChoices(state)).not.toContain(box);

    const second = settleRewardBox(state, box);
    expect(second.settled).toBe(true);
    state = second.state;
    expect((state.inventory ?? []).filter((i) => /Bronze Reward Box/i.test(i.name))).toHaveLength(0);
    expect(promptRow(state)).not.toContain(box);
    expect(resolveOfferedChoices(state)).not.toContain(box);
  });

  it('HF1-c: class offer owns the System row; scene pad has no class chips', () => {
    const state = litrpgWithBoxes(3);
    state.character = { ...state.character, classId: undefined };
    state.classOffer = { turn: state.turn ?? 10, choices: ['fighter', 'rogue', 'wizard'] };
    const classPads = classOfferPad(state)!;
    expect(classPads.some((c) => c === classChip('fighter') || c === CLASS_QUICK_START_CHIP)).toBe(true);

    const prompt = promptRow(state);
    const offered = resolveOfferedChoices(state);
    expect(prompt).toEqual(classPads);
    expect(prompt).not.toContain(openBoxChip('Bronze'));
    for (const c of classPads) expect(offered).not.toContain(c);
    expect(offered).toHaveLength(sceneOptionCount(state.engineMode));
    expect(prompt.every((c) => !/^Open the .+ Reward Box$/i.test(c))).toBe(true);
  });
});
