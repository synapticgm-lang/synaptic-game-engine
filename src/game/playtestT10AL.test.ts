/**
 * T10AL — tabletop NPC reply was a duplicated stock fragment "a buyer who pays"
 * (cursed-keep s9841 T8–T11): not a sentence, appended twice, replayed every turn,
 * plus "robe. and Jax said nothing." splice from answered-that-look.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, NpcMemory } from './types';
import { ensureSpokenAnswer, stripSpeakerSilence } from './spokenAnswer';
import { stripUnauthorizedNpcSpeech } from './intentParser';
import { emptySceneFacts } from './sceneFacts';
import { lastResortStoryBody } from './completedEventPacket';
import { sealPostWriterProse, normalizeCommittedProse } from './writerTurn';

function mem(over: Partial<NpcMemory> & { npcName: string }): NpcMemory {
  return {
    npcId: over.npcId ?? `town-${over.npcName.replace(/\s+/g, '-').toLowerCase()}`,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 1,
    met: true,
    present: true,
    aliases: [],
    need: 'a buyer who pays',
    roleHint: 'informant',
    introSpoken: true,
    ...over,
  } as NpcMemory;
}

function well(over: Partial<GameState> = {}): GameState {
  const aldous = mem({ npcName: 'Father Aldous' });
  return {
    ...(createInitialState(undefined, 'dnd') as GameState),
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    character: {
      ...(createInitialState(undefined, 'dnd') as GameState).character,
      name: 'Jax',
    },
    turn: 9,
    currentLocation: 'Midnight Well',
    sceneFacts: {
      ...emptySceneFacts(),
      present: ['Father Aldous'],
      crowd: 'sparse',
      crowdCount: 1,
      updatedTurn: 9,
      lastBeat: 'well',
    },
    npcMemories: [aldous],
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax' },
      complete: true,
      sceneWritten: true,
    },
    ...over,
  } as GameState;
}

describe('T10AL buyer fragment / double / replay / answered-look splice (s9841)', () => {
  it('T9: ledger need is spoken as a sentence, not the bare fragment', () => {
    const state = well();
    const ask =
      'I wipe the mud off my finger onto the ground and look Father Aldous dead in the eye. "Pays for what exactly? Your silence or your sins?"';
    const draft =
      'Jax wiped the mud off their finger onto the ground. Jax said, "Pays for what exactly? Your silence or your sins?" Father Aldous said nothing.';
    const out = ensureSpokenAnswer(draft, state, ask);
    expect(out.answer.status).toBe('added');
    expect(out.prose).toMatch(/Father Aldous said,\s*["\u201c]I need a buyer who pays\.?["\u201d]/i);
    expect(out.prose).not.toMatch(/said,\s*["\u201c]a buyer who pays["\u201d]/i);
    expect((out.prose.match(/Father Aldous said/gi) ?? []).length).toBe(1);
  });

  it('T9 last-resort + seal does not double the reply', () => {
    const fact =
      'Must narrate: I wipe the mud off my finger onto the ground. The story must show this act. Speech event: you address Father Aldous. NPC reaction slot open for Father Aldous. PC says exactly: "Pays for what exactly? Your silence or your sins?" (do not rewrite).';
    const state = well({
      completedEvent: { engineResult: fact } as GameState['completedEvent'],
    });
    const ask =
      'I wipe the mud off my finger onto the ground and look Father Aldous dead in the eye. "Pays for what exactly? Your silence or your sins?"';
    const painted = lastResortStoryBody(state, undefined, ask);
    const sealed = sealPostWriterProse(state, painted.prose, ask);
    expect((sealed.prose.match(/buyer who pays/gi) ?? []).length).toBe(1);
    expect((sealed.prose.match(/Father Aldous said/gi) ?? []).length).toBe(1);
    expect(sealed.prose).toMatch(/I need a buyer who pays/i);
  });

  it('T10: already-told need becomes ask-back, not a verbatim replay', () => {
    const state = well({
      turn: 10,
      log: [
        {
          id: 'g1',
          turn: 9,
          role: 'gm',
          content:
            'Jax wiped the mud. Jax said, "Pays for what?" Father Aldous said, "I need a buyer who pays."',
          timestamp: 1,
        },
      ],
      npcMemories: [
        mem({
          npcName: 'Father Aldous',
          said: [{ topic: 'want', turn: 9, line: 'I need a buyer who pays.' }],
        }),
      ],
    });
    const ask =
      'I step back from Father Aldous and scan the dark tree line. "Who is this buyer, and do they know about the rope?"';
    const draft =
      'Jax stepped back from Father Aldous. Jax said, "Who is this buyer, and do they know about the rope?" Father Aldous said nothing.';
    const out = ensureSpokenAnswer(draft, state, ask);
    expect(out.prose).toMatch(/Father Aldous said,\s*["\u201c]/i);
    expect(out.prose).not.toMatch(/["\u201c]a buyer who pays["\u201d]/i);
    expect(out.prose).not.toMatch(/I need a buyer who pays/i);
    expect(out.prose).toMatch(/already told you|Ask me who/i);
    expect((out.prose.match(/Father Aldous said/gi) ?? []).length).toBe(1);
  });

  it('T11 variation: collapse adjacent duplicate said-lines', () => {
    const state = well({ turn: 11 });
    const ask = 'I stare at Father Aldous. "A buyer who pays, huh? Let\'s see if that coin is clean."';
    const doubled =
      'Jax stared at Father Aldous. Jax said, "A buyer who pays, huh? Let\'s see if that coin is clean." Father Aldous said, "I need a buyer who pays." Father Aldous said, "I need a buyer who pays."';
    const out = ensureSpokenAnswer(doubled, state, ask);
    expect((out.prose.match(/I need a buyer who pays/gi) ?? []).length).toBe(1);
    expect((out.prose.match(/Father Aldous said/gi) ?? []).length).toBe(1);
  });

  it('T8: "answered that look" is not rewritten into "and Jax said nothing"', () => {
    const draft =
      'Jax wet one finger in the mud at the well\'s edge and drew a rude mark across the clean cloth of Father Aldous\'s robe. Father Aldous only looked down at the smear, and Jax answered that look with a smirk. Father Aldous said, "If that rope was cut by accident, I guess gravity\'s been working overtime lately." Father Aldous was silent and did not bother to wipe anything away.';
    const ask =
      'I dip my finger in the wet mud, draw a rude symbol on Father Aldous\'s pristine robe, and smirk. "If that rope was cut by accident, I guess gravity\'s been working overtime lately."';
    const stripped = stripUnauthorizedNpcSpeech(draft, ask, 'Jax');
    expect(stripped).toMatch(/answered that look/i);
    expect(stripped).not.toMatch(/\band Jax said nothing\b/i);
    expect(stripped).not.toMatch(/robe\.\s+and Jax said nothing/i);

    const state = well({ turn: 8 });
    const normalized = normalizeCommittedProse(draft, {
      state,
      playerInput: ask,
      intent: { kind: 'talk', label: 'Talk' } as never,
      engineFact:
        'Must narrate: I dip my finger in the wet mud. Speech event: you address Father Aldous. NPC reaction slot open for Father Aldous. PC says exactly: "If that rope was cut by accident, I guess gravity\'s been working overtime lately." (do not rewrite).',
      previousGm: '',
    });
    expect(normalized).not.toMatch(/\band Jax said nothing\b/i);
    const spoken = ensureSpokenAnswer(normalized, state, ask);
    expect(spoken.prose).not.toMatch(/\band Jax said nothing\b/i);
    expect((spoken.prose.match(/Father Aldous said/gi) ?? []).length).toBeLessThanOrEqual(2);
  });

  it('stripSpeakerSilence still clears content-free NPC silence before a real exchange', () => {
    const cleaned = stripSpeakerSilence(
      'Jax asked. Father Aldous said nothing at all.',
      { label: 'Father Aldous' },
    );
    expect(cleaned).not.toMatch(/said nothing/i);
  });
});
