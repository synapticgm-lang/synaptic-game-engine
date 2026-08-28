import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { HUD_BUILD_STAMP } from '../components/Hud';

const panel = readFileSync(resolve(__dirname, '../components/CenterPanel.tsx'), 'utf8');

describe('playtest29g — hide text is action box, hide options is chips', () => {
  it('stamp is 2026-08-29g and Mid writer stays OFF', () => {
    expect(BUILD_STAMP).toBe('2026-08-29g');
    expect(HUD_BUILD_STAMP).toBe('2026-08-29g');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('Hide text gates the action box, not the story; Hide options gates chips only', () => {
    expect(panel).toContain('{!hideText && (');
    expect(panel).toContain('hidden={hideOptions}');
    expect(panel).toContain("title={hideText ? 'Show the action box' : 'Hide the action box'}");
    expect(panel).toContain("title={hideOptions ? 'Show choice buttons' : 'Hide choice buttons'}");
    expect(panel).not.toContain('HiddenStoryRestore');
    expect(panel).not.toContain('showTurnAsk={!hideOptions');
    expect(panel).not.toContain('Story hidden — tap to show');
  });
});
