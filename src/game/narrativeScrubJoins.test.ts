import { describe, expect, it } from 'vitest';
import { scrubInventedProperNouns } from './narrativeScrub';
import { applyGovernanceToProse } from './qualityGovernance';
import { createInitialState } from './defaults';
import type { GameState } from './types';

/** t10-29z8f salt-road T6–T7: the muscle is the only person, and "Back streets" is not yet HERE. */
function saltAlley(): GameState {
  const state = createInitialState();
  state.campaignBibleId = 'salt-road-heist';
  state.currentLocation = 'Safehouse Alley';
  state.character = { ...state.character, name: 'Jax' };
  state.openingEstablishment = { pending: [], answers: {}, complete: true, sceneWritten: true } as never;
  state.sceneFacts = { props: [], present: ['the muscle'], crowd: 'present', noise: 'quiet', lastBeat: '', updatedTurn: 6 };
  return state;
}

/** t10-29z8f cursed-keep T11: Father Aldous at the church. */
function church(): GameState {
  const state = createInitialState();
  state.campaignBibleId = 'cursed-keep';
  state.currentLocation = 'Greyhollow Church';
  state.character = { ...state.character, name: 'Jax' };
  state.openingEstablishment = { pending: [], answers: {}, complete: true, sceneWritten: true } as never;
  state.sceneFacts = { props: [], present: ['Father Aldous'], crowd: 'present', noise: 'quiet', lastBeat: '', updatedTurn: 10 };
  return state;
}

describe('warden: sentence words are not names', () => {
  it('a sentence-start article is not part of a name ("The Back streets" kept, not "the muscle streets")', () => {
    const line = 'The Back streets narrowed to a single muddy lane, walled in by shuttered shops.';
    const out = scrubInventedProperNouns(line, saltAlley(), '');
    expect(out.text).toBe(line);
    expect(out.stripped).toEqual([]);
  });

  it('a contraction is not part of a name ("Then I\'ll not press" kept, not "the not press")', () => {
    const line = 'Father Aldous nodded slowly at the refusal and said, "Then I\'ll not press a closed hand, Jax."';
    const out = scrubInventedProperNouns(line, church(), '');
    expect(out.text).toBe(line);
    expect(out.stripped).not.toContain("Then I'll");
  });

  it('an unknown name that is not a known person is left as written, not swapped for someone present', () => {
    const line = 'The Crimson Hand watched from the rafters.';
    const out = scrubInventedProperNouns(line, church(), '');
    expect(out.text).toBe(line);
    expect(out.stripped).not.toContain('Crimson Hand');
  });
});

describe('governance: pronouns are never rewritten', () => {
  it('"could see them" stays when one person is present (not "could see the muscle")', () => {
    const line =
      'Jax kept their hands open and low, palms turned out where the muscle could see them, and let their voice drop.';
    expect(applyGovernanceToProse(saltAlley(), line).prose).toBe(line);
  });
});
