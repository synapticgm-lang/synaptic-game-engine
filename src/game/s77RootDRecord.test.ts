/**
 * s77 Root D — the writer's record of the past is the story and the engine's receipts, not warden chrome.
 * Warden / gate / cooldown notes stay off LAST and FACTS, the packet carries the opening sentence of the
 * last two committed beats, and a body-swap note is not logged when the writer's draft was kept.
 */
import { describe, expect, it } from 'vitest';
import { buildNewGameState, stampOpening } from './fateAutoplay';
import { buildCompletedEventPacket, formatWriterFacingEvent } from './completedEventPacket';
import { buildInfoSheet } from './infoSheet';
import { commitTravel, writerTravelFact } from './travelJourney';
import { notesForCommittedBody, repairRejectedBeat } from './beatCommitGate';
import { writerWordsGuard } from './writerWords';
import type { GameState, LogEntry } from './types';

const INFIRMARY = 'the cathedral infirmary';
const T6 = 'Jax left the cathedral infirmary behind and took the narrow back streets that cut west across the city. Washing hung between the upper windows.';
const T11 = 'Jax left the cathedral infirmary behind and walked the narrow back streets alone. A cart had lost a wheel at the corner.';

function seed77(): GameState {
  const { state } = buildNewGameState({ bibleId: 'summoned-pact', characterName: 'Jax', seed: 77, personality: 'cold-system' });
  const s = stampOpening(state);
  return {
    ...s,
    currentLocation: INFIRMARY,
    openingEstablishment: { ...s.openingEstablishment!, complete: true },
  } as GameState;
}

const gm = (turn: number, content: string, systemLog: string[] = []): LogEntry => ({
  id: `gm-${turn}`,
  turn,
  role: 'gm',
  content,
  timestamp: 0,
  systemLog,
});
const player = (turn: number, content: string): LogEntry => ({ id: `p-${turn}`, turn, role: 'player', content, timestamp: 0 });

describe('s77 Root D: the record is the story, not warden chrome', () => {
  it('LAST shows the engine receipt and FACTS carries no Warden or Commit gate line', () => {
    const base = seed77();
    const travel = commitTravel({ ...base, turn: 12 }, 'Travel toward Lowmarket');
    expect(travel.receipt).toBeTruthy();
    const receipt = travel.receipt!;

    const state: GameState = {
      ...base,
      turn: 14,
      log: [
        ...(base.log ?? []),
        player(11, 'Turn back'),
        gm(12, 'Jax turned back toward the infirmary.', [
          'Warden: Prose may invent unestablished entity: quest still waited under',
          'Commit gate: last-resort body',
        ]),
        player(12, 'Travel toward Lowmarket'),
        gm(13, T11, ['XP Gained: 5 (bearings)', receipt]),
        player(13, 'Inspect the immediate surroundings'),
        gm(14, 'The street held still.', ['Warden: Cooldown removed 2 pad(s)']),
      ],
    } as GameState;

    const sheet = buildInfoSheet(state);
    const last13 = sheet.last.find((l) => l.startsWith('T12 Travel toward Lowmarket'));
    expect(last13).toContain(`→ ${writerTravelFact(receipt)!.slice(0, 40)}`);
    expect(last13).not.toMatch(/Travel:|leg \d of \d|\+\d+ min/);
    const last14 = sheet.last.find((l) => l.startsWith('T13 Inspect'));
    expect(last14).toMatch(/no engine result$/);
    for (const row of [...sheet.last, ...sheet.facts]) {
      expect(row).not.toMatch(/Warden:|Commit gate:|Cooldown removed/);
    }
  });

  it('the packet for the T14 travel replay prints the T6 and T11 opening sentences as recorded fact', () => {
    const base = seed77();
    const state: GameState = {
      ...base,
      turn: 13,
      log: [
        ...(base.log ?? []),
        player(5, 'Travel toward Lowmarket'),
        gm(6, T6),
        player(10, 'Travel toward Lowmarket'),
        gm(11, T11),
      ],
    } as GameState;
    const packet = buildCompletedEventPacket(state, 'Travel toward Lowmarket');
    expect(packet.infoSheet).toBeTruthy();
    const prompt = formatWriterFacingEvent(packet);
    expect(prompt).toContain('ALREADY ON THE PAGE');
    expect(prompt).toContain('- Jax left the cathedral infirmary behind and took the narrow back streets that cut west across the city.');
    expect(prompt).toContain('- Jax left the cathedral infirmary behind and walked the narrow back streets alone.');
    expect(prompt).not.toContain('Washing hung between the upper windows.');
  });

  it('when the writer-words guard keeps the draft, no "last-resort body" note is logged', () => {
    const base = seed77();
    const draft = 'Antiseptic fog fills the room.';
    const state: GameState = {
      ...base,
      turn: 6,
      log: [...(base.log ?? []), player(5, 'Wait'), gm(5, draft)],
    } as GameState;
    const repaired = repairRejectedBeat(state, draft, ['atmosphere-only']);
    expect(repaired.repaired).toBe(true);
    expect(repaired.notes.some((n) => /last-resort body|packet stitch/.test(n))).toBe(true);
    const notes = ['Commit gate: atmosphere-only', ...repaired.notes];

    const words = writerWordsGuard(true);
    const committed = words.step('applyGovernanceToProse', draft, repaired.prose);
    expect(committed).toBe(draft);
    const logged = notesForCommittedBody(notes, committed === repaired.prose);
    expect(logged).toContain('Commit gate: atmosphere-only');
    expect(logged.some((n) => /last-resort body|packet stitch/.test(n))).toBe(false);

    const free = writerWordsGuard(false);
    const swapped = free.step('applyGovernanceToProse', draft, repaired.prose);
    expect(notesForCommittedBody(notes, swapped === repaired.prose)).toEqual(notes);
  });
});
