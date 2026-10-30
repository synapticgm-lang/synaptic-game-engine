/**
 * T10AO — RPG s9862 Overhang: kick+shout got canned "I need listeners"; sling+stare page was
 * only "The scout said nothing" twice (turn-ignored-action). Physical free text needs one
 * reaction owner with content, not ledger-need / silence×2.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, NpcMemory } from './types';
import { ensureSpokenAnswer } from './spokenAnswer';
import { emptySceneFacts } from './sceneFacts';
import { convertWriterCueFact } from './writerCueLines';
import { resolveTypedFreeText } from './typedFreeText';
import { checkActionFollowed } from './turnCheck';
import { writerEngineResult } from './travelJourney';

function mem(over: Partial<NpcMemory> & { npcName: string }): NpcMemory {
  return {
    npcId: over.npcId ?? `npc-${over.npcName.replace(/\s+/g, '-').toLowerCase()}`,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 1,
    met: true,
    present: true,
    aliases: [],
    introSpoken: true,
    ...over,
  } as NpcMemory;
}

function overhang(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'rpg') as GameState;
  return {
    ...s,
    engineMode: 'rpg',
    campaignBibleId: 'salt-road-heist',
    character: { ...s.character, name: 'Jax' },
    turn: 6,
    currentLocation: 'Overhang on the Cliff Path',
    sceneFacts: {
      ...emptySceneFacts(6),
      crowd: 'present',
      noise: 'quiet',
      present: ['the scout'],
      props: ['loose boulder', 'pack', 'knife'],
      lastBeat: 'people are present',
      crowdCount: 2,
    },
    npcMemories: [
      mem({
        npcName: 'the scout',
        roleHint: 'scout',
        need: 'listeners',
        goal: { motivation: 'Reputation', target: 'the news they carry' },
        location: 'Overhang on the Cliff Path',
        sheet: {
          job: 'scout',
          motive: 'Keep the road watched',
          fear: 'Ambush',
          speech: 'clipped',
          secret: '',
          place: 'road',
        },
      }),
    ],
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax' },
      complete: true,
      sceneWritten: true,
    },
    ...over,
  } as GameState;
}

/** Tabletop variation — steward at Keep Gate, same shapes. */
function keepGate(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    character: { ...s.character, name: 'Jax' },
    turn: 6,
    currentLocation: 'Keep Gate',
    sceneFacts: {
      ...emptySceneFacts(6),
      crowd: 'sparse',
      present: ['the steward'],
      props: [],
      lastBeat: 'gate',
      crowdCount: 1,
    },
    npcMemories: [
      mem({
        npcName: 'the steward',
        need: 'a buyer who pays',
        location: 'Keep Gate',
        sheet: {
          job: 'steward',
          motive: 'Hold the gate ledger',
          fear: 'Audit',
          speech: 'dry',
          secret: '',
          place: 'keep',
        },
      }),
    ],
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax' },
      complete: true,
      sceneWritten: true,
    },
    ...over,
  } as GameState;
}

describe('T10AO physical free text — one reaction, no ambient need dump (s9862)', () => {
  it('T5: kick + shout does not dump scout ledger "I need listeners"', () => {
    const state = overhang({ turn: 5 });
    const act =
      'I kick the loose boulder off the ledge and shout, "Let\'s move before they come back!"';
    const draft =
      'Jax drove their boot into the loose boulder on the ledge and sent it tumbling down the rock face toward the road. Jax said, "Let\'s move before they come back." Down below, the boulder rolled to a stop on the empty dirt track.';
    const out = ensureSpokenAnswer(draft, state, act);
    expect(out.prose).not.toMatch(/I need listeners/i);
    expect(out.prose).toMatch(/scout/i);
    expect(out.prose).toMatch(/["\u201c].+["\u201d]|Keep the road watched/i);
  });

  it('T6: compound sling+stare — one silence/react owner, not "said nothing" twice', () => {
    const fact =
      'Must narrate: I sling my pack over one shoulder. The story must show this act. Speech event: you address the scout. NPC reaction slot open for the scout. Must narrate: grip the hilt of my knife while staring down at Jax. The story must show this act. Speech event: you address the scout. NPC reaction slot open for the scout.';
    const plain = convertWriterCueFact(fact, 'Jax');
    expect(plain).toMatch(/sling|pack|shoulder/i);
    expect(plain).toMatch(/grip|knife|staring/i);
    expect((plain.match(/\bsaid nothing\b/gi) ?? []).length).toBeLessThan(2);

    const state = overhang();
    const act =
      'I sling my pack over one shoulder and grip the hilt of my knife while staring down at Jax.';
    const silenceOnly = 'The scout said nothing. The scout said nothing.';
    const out = ensureSpokenAnswer(silenceOnly, state, act);
    expect((out.prose.match(/\bsaid nothing\b/gi) ?? []).length).toBe(0);
    expect(out.prose).toMatch(/scout/i);
    expect(out.prose).toMatch(/["\u201c].+["\u201d]|Keep the road watched/i);

    const followed = checkActionFollowed(state, state, act, out.prose);
    expect(followed.p0.filter((f) => f.kind === 'ignored-action')).toHaveLength(0);
  });

  it('resolveTypedFreeText dedupes reaction slots across compound physical clauses', () => {
    const state = overhang();
    const act =
      'I sling my pack over one shoulder and grip the hilt of my knife while staring down at Jax.';
    const typed = resolveTypedFreeText(state, act);
    const slots = typed.engineResult.match(/NPC reaction slot open for the scout/gi) ?? [];
    expect(slots.length).toBe(1);
    // T10RC7 — object half-clause stays on the writer fact; convert never restates the act.
    expect(typed.engineResult).toMatch(/already shown/i);
    expect(typed.engineResult).toMatch(/pack|shoulder|knife|grip|sling/i);
    const book = writerEngineResult(typed.engineResult, 'Jax');
    expect((book.match(/\bsaid nothing\b/gi) ?? []).length).toBeLessThan(2);
    expect(book).not.toMatch(/sling(?:ed|ing)? (?:my|their) pack/i);
  });

  it('tabletop steward: ambient shout skips need dump; named threat still uses ledger', () => {
    const state = keepGate();
    const shout =
      'I kick the loose stone off the step and shout, "Clear the gate before they close it!"';
    const shoutOut = ensureSpokenAnswer(
      'Jax kicked the loose stone off the step. Jax said, "Clear the gate before they close it!"',
      state,
      shout,
    );
    expect(shoutOut.prose).not.toMatch(/I need a buyer who pays/i);

    const threat =
      'I toss the pouch at the steward\'s feet. "Check your books, or I\'ll check them for you."';
    const threatOut = ensureSpokenAnswer(
      'Jax tossed the pouch at the steward\'s feet. Jax said, "Check your books, or I\'ll check them for you."',
      state,
      threat,
    );
    // T10RC1 — ledger need still lands as a grammatical indirect sentence, never "I need …" telegram.
    expect(threatOut.prose).toMatch(/made clear(?: that)? they needed a buyer who pays|buyer who pays/i);
    expect(threatOut.prose).not.toMatch(/I need a buyer who pays/i);
  });

  it('LitRPG engineer: silence-only page after a free act gets one content reply', () => {
    const s = createInitialState(undefined, 'litrpg') as GameState;
    const state = {
      ...s,
      engineMode: 'litrpg' as const,
      campaignBibleId: 'summoned-pact',
      character: { ...s.character, name: 'Jax' },
      turn: 4,
      currentLocation: 'Contract Hall',
      sceneFacts: {
        ...emptySceneFacts(4),
        present: ['the engineer'],
        crowd: 'present',
        crowdCount: 1,
        props: [],
        lastBeat: '',
        updatedTurn: 4,
      },
      npcMemories: [
        mem({
          npcName: 'the engineer',
          need: 'a clean spark-rail',
          location: 'Contract Hall',
          sheet: {
            job: 'engineer',
            motive: 'Keep the hall running',
            fear: 'Shutdown',
            speech: 'flat',
            secret: '',
            place: 'hall',
          },
        }),
      ],
      openingEstablishment: {
        pending: [],
        answers: { name: 'Jax' },
        complete: true,
        sceneWritten: true,
      },
    } as GameState;
    const act = 'I sling my pack and stare at the spark-lamp while the engineer waits.';
    const out = ensureSpokenAnswer('The engineer said nothing. The engineer said nothing.', state, act);
    expect((out.prose.match(/\bsaid nothing\b/gi) ?? []).length).toBe(0);
    expect(out.prose).toMatch(/engineer/i);
    expect(out.prose).toMatch(/["\u201c].+["\u201d]|Keep the hall running|spark-rail/i);
  });
});
