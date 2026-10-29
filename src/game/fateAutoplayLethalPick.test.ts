import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { avoidRepeatLethalPick, isLethalChipLabel } from './fateAutoplay';
import { commitTravel, journeyPads, worldClock } from './travelJourney';
import type { GameState } from './types';

const lethal = 'Push on into the night, but one failed save now kills you';
const soft = 'Push on into the evening, but each failed save wears you down more';

function spentPushState(exhaustion: number): GameState {
  const base = createInitialState(undefined, 'dnd') as GameState;
  for (let i = 0; i < 200; i++) {
    const s = {
      ...base,
      seed: `lethal-pick-${exhaustion}-${i}`,
      engineMode: 'dnd' as const,
      campaignBibleId: 'cursed-keep',
      currentLocation: 'Greyhollow Inn',
      worldAtlas: null,
      activeEncounter: null,
      journey: null,
      turn: 9,
      openingEstablishment: { ...(base.openingEstablishment ?? {}), complete: true },
      character: { ...base.character, exhaustion },
      sceneFacts: base.sceneFacts ? { ...base.sceneFacts, pendingEncounter: undefined } : base.sceneFacts,
    } as GameState;
    const t = commitTravel(s, 'Travel toward Blackspine Treeline');
    const j = t.state.journey;
    if (!j || j.encounter || j.legsDone >= j.legsTotal - 1) continue;
    return { ...t.state, roadDay: { since: worldClock(t.state), hours: 10 } };
  }
  throw new Error('no quiet trip');
}

describe('autoplay picker: lethal-labelled chip is not picked twice in a row (harness behaviour)', () => {
  it('detects lethal labels', () => {
    expect(isLethalChipLabel(lethal)).toBe(true);
    expect(isLethalChipLabel('Make camp')).toBe(false);
  });
  it('first lethal pick stands', () => {
    expect(avoidRepeatLethalPick(['Make camp', lethal], lethal, () => 0.1, false)).toBe(lethal);
  });
  it('second lethal pick in a row is swapped for a safe chip', () => {
    expect(avoidRepeatLethalPick(['Make camp', lethal], lethal, () => 0.1, true)).toBe('Make camp');
  });
  it('kept when it is the only option', () => {
    expect(avoidRepeatLethalPick([lethal], lethal, () => 0.1, true)).toBe(lethal);
  });
  it('non-lethal pick is untouched', () => {
    expect(avoidRepeatLethalPick(['Make camp', lethal], 'Make camp', () => 0.9, true)).toBe('Make camp');
  });
});

describe('T10RC4 harness lethal avoid uses engine march prediction (not soft-label miss)', () => {
  it('soft Push-on at exhaustion 3 is march-risk; second pick swaps to Make camp', () => {
    const s = spentPushState(3);
    const push = journeyPads(s).find((p) => /Push on/i.test(p))!;
    expect(push).toMatch(/each failed save wears you down more/);
    expect(isLethalChipLabel(soft)).toBe(false); // regex alone still misses soft
    expect(isLethalChipLabel(push, s)).toBe(true); // engine prediction catches it
    expect(avoidRepeatLethalPick(['Make camp', push], push, () => 0.1, true, s)).toBe('Make camp');
  });
});
