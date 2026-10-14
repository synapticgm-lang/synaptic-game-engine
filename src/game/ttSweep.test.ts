import { describe, expect, it } from 'vitest';
import { pickEarthPlace } from './openingEstablishment';
import { LIBRARY_ENTRIES } from './rules/librarySkills';
import { parseSkillEntries } from './schemas';

describe('tt-sweep', () => {
  it('the opening place pick repeats for the same save and turn', () => {
    const a = { seed: 's150', saveId: 'x', turn: 0 };
    expect(pickEarthPlace(a)).toBe(pickEarthPlace({ ...a }));
    const seen = new Set(Array.from({ length: 40 }, (_, i) => pickEarthPlace({ ...a, seed: `s${i}` })));
    expect(seen.size).toBeGreaterThan(1);
  });

  it('the skill library loads through the zod schema', () => {
    expect(LIBRARY_ENTRIES.length).toBeGreaterThan(100);
    expect(() => parseSkillEntries([{ identity: { id: 'Bad Id' } }])).toThrow();
  });
});
