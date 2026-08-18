import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { splashPlateLabel, splashUnavailableLine } from '@/game/memorableMoments';
import { playerFacingImageFailLine } from '@/game/visualCanon';

const SPLASH_FILES = [
  'src/components/CenterPanel.tsx',
  'src/components/comic/ComicGrid.tsx',
  'src/game/memorableMoments.ts',
  'src/game/visualCanon.ts',
];

const BANNED = [
  /Milestone image unavailable/i,
  /✦\s*MILESTONE/i,
  /['"`]\s*MILESTONE\s*['"`]/,
];

describe('player-facing splash copy', () => {
  it('does not ship Milestone labels in splash UI files', () => {
    for (const file of SPLASH_FILES) {
      const text = readFileSync(file, 'utf8');
      for (const re of BANNED) {
        expect(text, `${file} still has ${re}`).not.toMatch(re);
      }
    }
  });

  it('never shows Milestone on a failed opening plate', () => {
    expect(splashPlateLabel({ splashTitle: '✦ MILESTONE ✦', turn: 0 })).toBe('Chapter One');
    expect(splashUnavailableLine({ splashTitle: '✦ MILESTONE ✦', turn: 0 })).not.toMatch(/milestone/i);
    expect(playerFacingImageFailLine(new Error('Milestone image unavailable'))).not.toMatch(/milestone/i);
  });
});
