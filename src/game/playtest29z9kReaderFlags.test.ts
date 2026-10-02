/**
 * 29z9k — reading level + swearing / violence-detail switches ride the existing writer packet.
 * Read from Kid Mode / cursing / violence settings; Kid Mode forces child with both off. No live GM call.
 */
import { describe, expect, it } from 'vitest';
import { createDefaultSettings, createInitialState } from './defaults';
import { buildCompletedEventPacket, formatReaderLine, formatWriterFacingEvent, readerFlags } from './completedEventPacket';
import { readFileSync } from 'node:fs';
import type { GameState, Settings } from './types';

const adult = (over: Partial<Settings> = {}): Settings => ({ ...createDefaultSettings(), contentMode: 'adult', ...over });

describe('29z9k reader flags', () => {
  it('Kid Mode forces child, swearing off, violence detail off', () => {
    expect(readerFlags(adult({ contentMode: 'kid', readingLevel: 'standard', cursingLevel: 'strong', violenceLevel: 'graphic' })))
      .toEqual({ level: 'child', swearing: false, violenceDetail: false });
  });

  it('adult keeps its own switches; plain is a reading level, not a content rule', () => {
    expect(readerFlags(adult({ readingLevel: 'plain', cursingLevel: 'strong', violenceLevel: 'mild' })))
      .toEqual({ level: 'plain', swearing: true, violenceDetail: false });
    expect(readerFlags(adult({ readingLevel: 'standard', cursingLevel: 'none', violenceLevel: 'graphic' })))
      .toEqual({ level: 'standard', swearing: false, violenceDetail: true });
    expect(readerFlags(adult({ readingLevel: 'child' })).level).toBe('standard');
    expect(readerFlags(adult({ readingLevel: undefined })).level).toBe('standard');
  });

  it('the writer-facing event carries the reader line; edge prints the same line', () => {
    const s = { ...(createInitialState(undefined, 'litrpg') as GameState), currentLocation: 'Cathedral Close', turn: 4 };
    const reader = readerFlags(adult({ readingLevel: 'plain', cursingLevel: 'none', violenceLevel: 'mild' }));
    const writer = formatWriterFacingEvent(buildCompletedEventPacket(s, 'Attack the thug', { reader }));
    expect(writer).toContain('READER: plain — write for a reader aged about 9 to 11');
    expect(writer).toContain('Swearing: off');
    expect(writer).toContain('Violence detail: off (fights still happen');
    expect(formatWriterFacingEvent(buildCompletedEventPacket(s, 'Attack the thug'))).not.toContain('READER:');
    const edge = readFileSync('supabase/functions/_shared/gm/completedEventPacket.ts', 'utf8');
    expect(edge).toContain('if (packet.reader) lines.push(formatReaderLine(packet.reader));');
    for (const r of [reader, readerFlags(adult({ contentMode: 'kid' })), readerFlags(adult({ cursingLevel: 'strong', violenceLevel: 'graphic' }))]) {
      for (const part of formatReaderLine(r).split(/(?<=\.) (?=[A-Z])/)) {
        expect(edge).toContain(part.replace(/^READER: /, '').replace(/\.$/, ''));
      }
    }
  });
});
