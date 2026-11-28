/**
 * Live salt-road-heist T4 (Inspect the immediate surroundings) printed writer-instruction
 * wording as the GM story: "The newcomer — the player's act (already shown in UI) is settled: …"
 * Root cause: formatWriterFacingEvent glued those instructions into the ENGINE RESULT content slot.
 * Offline structural pin — no paid AI.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { buildCompletedEventPacket, formatWriterFacingEvent } from './completedEventPacket';
import { pcPov, pcStorySubject } from './narrativePov';
import { writerEngineResult } from './travelJourney';
import type { GameState } from './types';

/** ENGINE RESULT content slot from writer-facing text (value after the label). */
function engineResultContentSlot(facing: string): string | null {
  const line = facing.split(/\r?\n/).find((l) => l.startsWith('ENGINE RESULT:'));
  if (!line) return null;
  return line.slice('ENGINE RESULT:'.length).trim();
}

function inspectSurroundingsState(): GameState {
  const s = createInitialState('', 'rpg') as GameState;
  const base = {
    ...s,
    character: { ...s.character, name: '' },
    currentLocation: 'Haskhaven Road',
    turn: 4,
    campaignId: 'salt-road-heist',
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true },
    sceneFacts: {
      ...(s.sceneFacts ?? {}),
      present: [],
    },
  } as GameState;
  return base;
}

describe('writer instruction never enters ENGINE RESULT content slot', () => {
  it('Inspect surroundings at Haskhaven Road: content slot equals settled fact only', () => {
    const state = inspectSurroundingsState();
    const act = 'Inspect the immediate surroundings';
    // Live T4 settled fact after convert, plus T10ECHO already-shown cues on the same engine string.
    const engineResult = [
      'Travel: walked to Haskhaven Road at a careful pace.',
      'Must narrate: [already shown; do not restate — write the consequence].',
      'The story must show the consequence and something new — do not restate the player act.',
    ].join(' ');
    const packet = {
      ...buildCompletedEventPacket(state, act, { engineResult }),
      engineResult,
      playerAction: act,
      location: 'Haskhaven Road',
      verb: 'inspected' as const,
      outcome: 'found nothing new',
    };
    const facing = formatWriterFacingEvent(packet);
    const subject = pcStorySubject(pcPov(packet.pc));
    const settled = writerEngineResult(engineResult, subject);

    expect(settled.length).toBeGreaterThan(0);
    expect(engineResultContentSlot(facing)).toBe(settled);
    // Instruction section still owns the already-shown / consequence rails.
    expect(facing).toMatch(/^PLAYER: \(already shown in UI/m);
    expect(facing).toMatch(/^ACTION: write the consequence/m);
  });
});
