/**
 * T10TURNS — cut writer calls / input tokens: section budget + retry-cause pins.
 * Offline only — no paid AI.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { buildCompletedEventPacket, formatWriterFacingEvent } from './completedEventPacket';
import {
  FACT_SHEET_WRITER_CHAR_BUDGET,
  buildFactSheet,
  formatFactSheetForWriter,
} from './factSheet';
import { parsePlayerIntent } from './intentParser';
import { runWriterTurnWithFightRetry } from './writerTurn';
import type { GameState } from './types';

function talkState(): GameState {
  const s = createInitialState('Jax', 'litrpg') as GameState;
  const base = {
    ...s,
    character: { ...s.character, name: 'Jax' },
    currentLocation: 'Valespire Bathhouse',
    turn: 6,
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true },
    sceneFacts: {
      ...(s.sceneFacts ?? {}),
      present: ['Mira the Apothecary'],
    },
  } as GameState;
  return {
    ...base,
    completedEvent: buildCompletedEventPacket(base, 'Ask Mira what she wants'),
  };
}

describe('T10TURNS section budget', () => {
  it('writer-leaf FactSheet stays under the char budget (no ENGINE RESULT / Recent timeline dup)', () => {
    const state = talkState();
    const packet = state.completedEvent!;
    const sheet = buildFactSheet(state, packet, 'Ask Mira what she wants');
    // Force timeline + engine result so the trim is load-bearing.
    sheet.recent = [
      'T5 Look around → The bathhouse steam hung low.',
      'T4 Ask Mira → Mira answered curtly.',
      'T3 Walk in → Jax reached the bathhouse.',
    ];
    sheet.beat.engineResult =
      'Speech event: you address Mira the Apothecary. NPC reaction slot open for Mira the Apothecary.';
    const leaf = formatFactSheetForWriter(sheet, { writerLeaf: true });
    expect(leaf.length).toBeLessThanOrEqual(FACT_SHEET_WRITER_CHAR_BUDGET);
    expect(leaf).not.toMatch(/^ENGINE RESULT:/m);
    expect(leaf).not.toMatch(/Recent timeline:/);
    const full = formatFactSheetForWriter(sheet);
    expect(full).toMatch(/^ENGINE RESULT:/m);
    expect(full).toMatch(/Recent timeline:/);
    expect(full.length).toBeGreaterThan(leaf.length);
  });

  it('formatWriterFacingEvent does not paste the player act into PLAYER/ACTION', () => {
    const state = talkState();
    const packet = {
      ...state.completedEvent!,
      engineResult:
        'Speech event: you address Mira the Apothecary. NPC reaction slot open for Mira the Apothecary.',
    };
    const text = formatWriterFacingEvent(packet);
    expect(text).toMatch(/PLAYER: \(already shown in UI/);
    expect(text).not.toMatch(/PLAYER: Ask Mira/);
    expect(text).toMatch(/ACTION: write the consequence/);
    expect(text).not.toMatch(/ACTION: this beat carries out the PLAYER line/);
    expect(text).toMatch(/WORLD FACTS \(this turn\):/);
    // Leaf owns the long ENGINE RESULT once; WORLD FACTS must not duplicate the short form.
    expect(text).toMatch(/ENGINE RESULT \(required fact/);
    expect(text).not.toMatch(/^ENGINE RESULT:/m);
  });
});

describe('T10TURNS soft answer-family (no blocking rewrite)', () => {
  it('after answer-repair miss, soft answer-family alone does not call rewrite', async () => {
    const state = talkState();
    const draft =
      'Jax stood by the cold plunge and waited for a reply that did not come. '
      + 'Steam curled off the furnace stones and the hall stayed quiet.';
    let rewrites = 0;
    const turn = await runWriterTurnWithFightRetry({
      firstRaw: draft,
      packet: state.completedEvent!,
      check: {
        state,
        playerInput: 'Ask Mira what she wants',
        intent: parsePlayerIntent('Ask Mira what she wants', state),
        engineFact: state.completedEvent?.engineResult ?? '',
        previousGm: '',
      },
      rewrite: async () => {
        rewrites += 1;
        return draft;
      },
      repair: async () => '',
    });
    expect(rewrites).toBe(0);
    expect(turn.draftRetry).toBeUndefined();
    expect(turn.path).not.toBe('last-resort');
    expect(turn.prose.replace(/\s+/g, ' ')).toMatch(/cold plunge|furnace|steam/i);
  });
});
