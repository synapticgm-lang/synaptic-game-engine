import { describe, expect, it } from 'vitest';
import { avoidRepeatLethalPick, isLethalChipLabel } from './fateAutoplay';

const lethal = 'Push on into the night, but one failed save now kills you';
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
