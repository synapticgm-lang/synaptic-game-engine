/**
 * Batch 12a — NPC first-meet ledger on existing owners.
 * Mid writer OFF. No live GM. No T50. No SNAPSHOT/CRAFT pile.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { emptySceneFacts } from './sceneFacts';
import { harvestNarrativeIntoLedger } from './narrativeHarvest';
import { compileChoices } from './choiceCompiler';
import { applyProseWarden } from './proseWarden';
import { recordCirclingTurn } from './choiceRanking';
import {
  applySocialLedgerTurn,
  hasMetBefore,
  rememberPlayerName,
  scrubNpcIntroRepeat,
  upsertHarvestedNpcMemory,
} from './npcMemory';
import { applyLedgerDeficit } from './openingEstablishment';
import { newGameState, rosterRecord } from './newGameTestState';
import type { GameState, NpcMemory } from './types';

function greyhollow(partial: Partial<GameState> = {}): GameState {
  const state = newGameState('cursed-keep', { npcId: 'ck-npc-1', engineMode: 'dnd' });
  return {
    ...state,
    bibleId: 'cursed-keep',
    campaignBibleId: 'cursed-keep',
    currentLocation: 'Greyhollow Church',
    turn: 8,
    character: { ...state.character, name: 'Jax' },
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax', where: 'Greyhollow Church' },
      complete: true,
      aloneArrival: false,
    },
    sceneFacts: {
      ...emptySceneFacts(8),
      present: ['Father Aldous'],
    },
    ...partial,
  };
}

/** Bible roster Aldous after one in-play meet. */
function metAldous(turn: number, playerName?: string): NpcMemory[] {
  return upsertHarvestedNpcMemory([rosterRecord(greyhollow(), 'Father Aldous')], 'Father Aldous', turn, playerName);
}

describe('playtest12a — NPC memory first-meet', () => {
  it('HUD/BUILD are 12a, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toMatch(/^2026-09-/);
    expect(BUILD_STAMP).toMatch(/^2026-09-/);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('first harvest marks stranger + intro; later meet becomes acquaintance', () => {
    const turnAt = (state: GameState, turn: number, input: string, place = state.currentLocation, present?: string[]) =>
      recordCirclingTurn(
        {
          ...state,
          turn,
          currentLocation: place,
          sceneFacts: present ? { ...state.sceneFacts!, present } : state.sceneFacts,
        },
        input,
        []
      );
    const aldousOf = (s: GameState) => s.npcMemories?.find((n) => /aldous/i.test(n.npcName));

    const first = harvestNarrativeIntoLedger(
      turnAt(greyhollow({ turn: 2 }), 2, 'Look around'),
      'Father Aldous waits by the font. I am Father Aldous, keeper of this church.',
      2
    );
    const memory = aldousOf(first);
    expect(memory).toBeTruthy();
    expect(hasMetBefore(first, 'Aldous')).toBe(true);
    expect(memory?.met).toBe(true);
    expect(memory?.introSpoken).toBe(true);
    expect(memory?.meetCount ?? 0).toBe(0);
    expect(memory?.relationshipStatus).toBe('stranger');
    expect(memory?.completedTopics).toContain('intro');
    expect(memory?.knownPlayerName).toBeUndefined();
    expect(memory?.facts.filter((f) => /Introduced in play/i.test(f))).toHaveLength(1);

    const sameVisit = harvestNarrativeIntoLedger(
      turnAt(first, 3, 'Wait'),
      'Father Aldous nods toward the nave.',
      3
    );
    expect(aldousOf(sameVisit)?.meetCount ?? 0).toBe(0);
    expect(aldousOf(sameVisit)?.relationshipStatus).toBe('stranger');

    let back = turnAt(sameVisit, 4, 'Travel toward Greyhollow Square', 'Greyhollow Square', []);
    back = turnAt(back, 5, 'Travel toward Greyhollow Church', 'Greyhollow Church', ['Father Aldous']);
    const second = harvestNarrativeIntoLedger(back, 'Father Aldous nods toward the nave.', 5);
    const again = aldousOf(second);
    expect(again?.meetCount).toBe(1);
    expect(again?.relationshipStatus).toBe('acquaintance');
    expect(again?.knownPlayerName).toBeUndefined();
    expect(again?.facts.filter((f) => /Introduced in play/i.test(f))).toHaveLength(1);

    const named = applySocialLedgerTurn({
      state: second,
      playerAction: 'I tell him, "My name is Jax."',
      turn: 5,
      talkTopics: [],
      gmText: 'Father Aldous listened and nodded once.',
    });
    expect(aldousOf(named)?.knownPlayerName).toBe('Jax');
  });

  it('rememberPlayerName writes the locked name onto harvested CAST', () => {
    const seeded = greyhollow({ npcMemories: metAldous(1) });
    const next = rememberPlayerName(seeded, 'Jax');
    expect(next.npcMemories?.[0]?.knownPlayerName).toBe('Jax');
    expect(next.npcMemories?.[0]?.facts.some((f) => /Knows the player as Jax/i.test(f))).toBe(true);
  });

  it('applyLedgerDeficit copies a new name onto existing memories', () => {
    const state = greyhollow({
      character: { ...greyhollow().character, name: 'Unknown Survivor' },
      openingEstablishment: {
        pending: [],
        answers: {},
        complete: true,
        aloneArrival: false,
      },
      npcMemories: metAldous(1),
    });
    const next = applyLedgerDeficit(state, 'My name is Jax.');
    expect(next.character.name).toMatch(/Jax/i);
    expect(next.npcMemories?.[0]?.knownPlayerName).toBe('Jax');
  });

  it('warden strips a second self-intro and keeps the rest of the beat', () => {
    const memories = metAldous(2, 'Jax');
    const raw =
      'I am Father Aldous, priest of Greyhollow. The nave still smells of wet stone. He waits for your answer.';
    const cleaned = scrubNpcIntroRepeat(raw, memories);
    expect(cleaned).not.toMatch(/I am Father Aldous/i);
    expect(cleaned).toMatch(/wet stone/i);
    expect(applyProseWarden(raw, { npcMemories: memories })).not.toMatch(/I am Father Aldous/i);
  });

  it('does not empty the beat when the whole paragraph is a re-intro', () => {
    const memories = metAldous(2);
    const raw = 'I am Father Aldous.';
    expect(scrubNpcIntroRepeat(raw, memories)).toBe(raw);
  });

  it('starves who/name pads after opening complete + hasMetBefore', () => {
    const state = harvestNarrativeIntoLedger(
      greyhollow(),
      'Father Aldous stands at the altar.',
      8
    );
    const compiled = compileChoices(state, [
      'Ask who he is',
      'Ask him his name',
      'Wait and watch',
    ]);
    expect(compiled.choices.some((c) => /ask who he is/i.test(c))).toBe(false);
    expect(compiled.choices.some((c) => /ask him his name/i.test(c))).toBe(false);
    expect(compiled.notes.some((n) => /Met-before intro drop/i.test(n))).toBe(true);
  });

  it('keeps Who chips during unfinished covers', () => {
    const state = greyhollow({
      openingEstablishment: {
        pending: [{ id: 'who', kind: 'name', question: 'What may we call you?' }],
        answers: {},
        complete: false,
        aloneArrival: false,
      },
      npcMemories: metAldous(1),
    });
    const compiled = compileChoices(state, ['Ask who he is', 'Wait and watch']);
    expect(compiled.choices.some((c) => /ask who he is/i.test(c))).toBe(true);
  });
});
