import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  choicesSpeechLine,
  effectiveTtsRate,
  effectiveTtsVolume,
  liveRegionPoliteness,
  withChoicesSpeech,
} from './accessibility';



describe('ACC-1c: read-aloud and screen reader', () => {
  it('user rate multiplies the pack rate and is clamped', () => {
    expect(effectiveTtsRate(1.2, 1.5)).toBe(1.8);
    expect(effectiveTtsRate(1, 5)).toBe(1.6);
    expect(effectiveTtsRate(1, undefined)).toBe(1);
    expect(effectiveTtsVolume(2)).toBe(1);
    expect(effectiveTtsVolume(0.4)).toBe(0.4);
  });
  it('choices are spoken after the beat only when enabled', () => {
    const sp = { kind: 'single' as const, text: 'The door creaks.' };
    expect(withChoicesSpeech(sp, ['Open it', 'Leave'], false)).toBe(sp);
    expect(withChoicesSpeech(sp, ['Open it', 'Leave'], true)).toEqual({
      kind: 'sequence',
      texts: ['The door creaks.', 'Your choices: Open it. Leave.'],
    });
    expect(choicesSpeechLine([])).toBeNull();
  });
  it('live region is polite, and silent while TTS reads aloud', () => {
    expect(liveRegionPoliteness(false)).toBe('polite');
    expect(liveRegionPoliteness(true)).toBe('off');
    const center = readFileSync(resolve(__dirname, '../components/CenterPanel.tsx'), 'utf8');
    expect(center).toMatch(/aria-live=\{liveRegionPoliteness\(/);
  });
  it('useVoice applies rate and volume from settings', () => {
    const v = readFileSync(resolve(__dirname, 'useVoice.ts'), 'utf8');
    expect(v).toMatch(/effectiveTtsRate\(/);
    expect(v).toMatch(/u\.volume = preferred\.volume/);
  });
});
