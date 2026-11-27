/**
 * waitNewGmBeat must not treat late thumbs on the previous beat as a new story.
 * Live 27 Nov LitRPG T5: feedbacks 4→5, gmStoryCount 5→5, identical West Wall prose.
 */
import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

async function load(rel: string) {
  return import(/* @vite-ignore */ pathToFileURL(resolve(rel)).href);
}

const arrival =
  'Omar Shaw stood at the West Wall in Dreweleigh Hollow. Dreweleigh Hollow was gone from their back.';

describe('gmBeatAdvanced (waitNewGmBeat gate)', () => {
  it('is false when only feedbacks grow and lastGm is unchanged (T5 false success)', async () => {
    const { gmBeatAdvanced } = await load('scripts/ai-player-browser/gameTab.mjs');
    const prev = { lastGm: arrival, gmStoryCount: 5, feedbacks: 4 };
    const snap = { lastGm: arrival, gmStoryCount: 5, feedbacks: 5 };
    expect(gmBeatAdvanced(prev, snap)).toBe(false);
  });

  it('is true when gmStoryCount grows', async () => {
    const { gmBeatAdvanced } = await load('scripts/ai-player-browser/gameTab.mjs');
    const prev = { lastGm: 'Earlier beat.', gmStoryCount: 4, feedbacks: 4 };
    const snap = { lastGm: arrival, gmStoryCount: 5, feedbacks: 4 };
    expect(gmBeatAdvanced(prev, snap)).toBe(true);
  });

  it('is true when lastGm body changes at the same count', async () => {
    const { gmBeatAdvanced } = await load('scripts/ai-player-browser/gameTab.mjs');
    const prev = { lastGm: arrival, gmStoryCount: 5, feedbacks: 5 };
    const snap = {
      lastGm: 'Omar Shaw looked along the West Wall. Cold stone, no new doors.',
      gmStoryCount: 5,
      feedbacks: 5,
    };
    expect(gmBeatAdvanced(prev, snap)).toBe(true);
  });
});
