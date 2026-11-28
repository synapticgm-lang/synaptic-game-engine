import { describe, expect, it } from 'vitest';
import {
  redecodeWin1252AsUtf8,
  repairCampaignStoryName,
  splitStoryNameAndDate,
} from './storySave';
import { formatCampaignStoryName } from '@/data/campaigns';
import type { GameState } from './types';

/** Classic Windows-1252 mojibake of UTF-8 em dash (E2 80 94). */
const MOJIBAKE_EM_DASH = '\u00e2\u20ac\u201d';

describe('campaign storyName encoding', () => {
  it('re-decodes Windows-1252 mojibake of a UTF-8 em dash', () => {
    const mangled = `The Summoned Pact ${MOJIBAKE_EM_DASH} 17 Oct 2026`;
    expect(redecodeWin1252AsUtf8(mangled)).toBe('The Summoned Pact — 17 Oct 2026');
  });

  it('leaves a correct UTF-8 title unchanged (fatal re-decode fails)', () => {
    expect(redecodeWin1252AsUtf8('The Summoned Pact — 17 Oct 2026')).toBeNull();
  });

  it('splits a dated title into name + startedAt', () => {
    const { title, startedAt } = splitStoryNameAndDate('The Summoned Pact — 17 Oct 2026');
    expect(title).toBe('The Summoned Pact');
    expect(startedAt).toBe(Date.parse('17 Oct 2026'));
  });

  it('repairs an old save once: clean title + storyStartedAt', () => {
    const mangled = `The Summoned Pact ${MOJIBAKE_EM_DASH} 17 Oct 2026`;
    const state = {
      storyName: mangled,
      lastUpdated: 1_700_000_000_000,
    } as GameState;
    const repaired = repairCampaignStoryName(state);
    expect(repaired.storyName).toBe('The Summoned Pact');
    expect(repaired.storyStartedAt).toBe(Date.parse('17 Oct 2026'));
    expect(repairCampaignStoryName(repaired)).toBe(repaired);
  });

  it('formatCampaignStoryName no longer bakes the date into the name', () => {
    expect(formatCampaignStoryName('The Summoned Pact', new Date('2026-10-17T12:00:00Z'))).toBe(
      'The Summoned Pact',
    );
  });
});
