import { describe, expect, it } from 'vitest';
import {
  buildRevealVisibleText,
  revealDelayMs,
  splitIntoRevealChunks,
  stripXmlForReveal,
} from './streamReveal';

describe('streamReveal', () => {
  it('strips XML before splitting', () => {
    expect(stripXmlForReveal('<action>Hello.</action> World.')).toBe('Hello. World.');
  });

  it('splits on sentence boundaries', () => {
    const chunks = splitIntoRevealChunks('You enter the hall. Torches flicker.');
    expect(chunks).toEqual(['You enter the hall.', 'Torches flicker.']);
  });

  it('keeps quoted dialogue intact across punctuation', () => {
    const chunks = splitIntoRevealChunks('"Wait," she said. "Not yet."');
    expect(chunks.length).toBeGreaterThanOrEqual(1);
    expect(chunks.join(' ')).toContain('"Wait," she said.');
  });

  it('splits paragraph breaks', () => {
    const chunks = splitIntoRevealChunks('First line.\n\nSecond paragraph.');
    expect(chunks.some((c) => c.includes('Second paragraph'))).toBe(true);
    expect(chunks.some((c) => c.startsWith('\n\n'))).toBe(true);
  });

  it('first chunk delay is faster than later chunks', () => {
    const chunk = 'Word one two three four.';
    expect(revealDelayMs(0, chunk)).toBeLessThan(revealDelayMs(1, chunk));
  });

  it('buildRevealVisibleText accumulates chunks', () => {
    const chunks = ['One.', 'Two.', 'Three.'];
    expect(buildRevealVisibleText(chunks, 1)).toBe('One. Two.');
  });
});
