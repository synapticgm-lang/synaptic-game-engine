import { describe, expect, it } from 'vitest';
import { scrubInventedProperNouns } from './narrativeScrub';
import type { GameState, NpcMemory } from './types';

const INN = 'Greyhollow Inn';

function person(npcId: string, npcName: string): NpcMemory {
  return { npcId, npcName, disposition: 'neutral', facts: [], lastSeenTurn: 8, met: true, location: INN };
}

/** The t10-29z8j T9 room: Oskar (roster) and the two townsfolk at the inn. */
function inn(): GameState {
  return {
    turn: 8,
    currentLocation: INN,
    campaignBibleId: 'cursed-keep',
    character: { name: 'Jax' },
    npcMemories: [
      person('ck-oskar', 'Oskar the Woodcutter'),
      person('town-edda-merrow', 'Edda Merrow'),
      person('town-tilde-fenwick', 'Tilde Fenwick'),
    ],
    openingEstablishment: { pending: [], answers: {}, complete: true, sceneWritten: true },
    sceneFacts: { present: [] },
    inventory: [],
    log: [],
  } as unknown as GameState;
}

const scrub = (line: string) => scrubInventedProperNouns(line, inn(), '');

describe('warden: a doubled person name comes out once', () => {
  it('a full name repeated back to back collapses to one copy', () => {
    const out = scrub('Oskar the Woodcutter Oskar the Woodcutter shifted at the far table.');
    expect(out.text).toBe('Oskar the Woodcutter shifted at the far table.');
    expect(out.stripped).toEqual([]);
  });

  it('a name plus the same name again collapses to the full name once, with no stand-in', () => {
    const out = scrub('Edda Merrow Edda kept her hands folded and her gaze on the middle distance.');
    expect(out.text).toBe('Edda Merrow kept her hands folded and her gaze on the middle distance.');
    expect(out.text).not.toMatch(/Oskar/);
    expect(out.stripped).toEqual([]);
  });

  it('works for any known person, including a possessive after the repeat', () => {
    expect(scrub("Tilde Fenwick Fenwick lifted Tilde Fenwick Tilde's cup.").text).toBe("Tilde Fenwick lifted Tilde Fenwick's cup.");
  });

  it('a normal single name is unchanged', () => {
    const line = 'Edda Merrow kept her hands folded and her gaze on the middle distance.';
    expect(scrub(line).text).toBe(line);
  });

  it('a sentence with two different people is unchanged', () => {
    for (const line of [
      'Edda Merrow and Tilde Fenwick did not lift their cups again.',
      'Edda Merrow watched Tilde Fenwick drink, and Oskar the Woodcutter said nothing.',
    ]) {
      expect(scrub(line).text).toBe(line);
    }
  });
});
