import { describe, expect, it } from 'vitest';
import { formatWorldCanonForPrompt, worldEraForState } from './visualCanon';

describe('world era for pictures', () => {
  it('does not treat Summoned Pact as an Earth street', () => {
    const state = {
      engineMode: 'litrpg' as const,
      currentLocation: 'The Sevenfold Circle under Valespire Cathedral',
      campaignPremise: 'You were an ordinary person on Earth. A ritual pulled you through.',
      campaignArchetype: 'isekai' as const,
      campaignBibleId: 'summoned-pact',
    };
    expect(worldEraForState(state)).toBe('other_world_summon');
    const canon = formatWorldCanonForPrompt(state);
    expect(canon).toMatch(/OTHER-WORLD SUMMON/);
    expect(canon).not.toMatch(/Modern street, store, or alley/);
    expect(canon).toMatch(/Do not draw Earth streets/);
  });

  it('keeps System Integration on modern Earth', () => {
    const state = {
      engineMode: 'litrpg' as const,
      currentLocation: 'A cracked city street',
      campaignPremise: 'Integration Protocol Active.',
      campaignArchetype: 'system_apocalypse' as const,
      campaignBibleId: 'system-integration',
    };
    expect(worldEraForState(state)).toBe('modern_earth');
    expect(formatWorldCanonForPrompt(state)).toMatch(/INTEGRATION EARTH/);
  });
});
