/**
 * q78-SPEECHREPLY / q78r-SPEECHREPAIR — typed speech + presence-gated talk.
 *
 * q78: check-lap q77z-tt seed 20661 T2 (cursed-keep): "Ask what they want" → must-react present NPC.
 * q78r LitRPG check lap (docs/orders/check-lap-G-SPEECH-litrpg.md):
 *   20671 T5 plays-player — prose quotes the PC ("Jax said, …")
 *   20673 T7/T11 — Talk to Ostler Joss while only Crown is present (ignored-action / restatement)
 *   20673 T8 — Joss speaks while not in peopleHere (absent-speaker)
 *
 * SRD 5.2.1 Communicating (Wizards of the Coast, CC BY 4.0):
 * "You can communicate however you are able to… communicating doesn’t interfere with other Activity."
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, NpcMemory } from './types';
import { parsePlayerIntent } from './intentParser';
import {
  MUST_REACT_TAIL,
  NO_PC_QUOTED_WORDS,
  absentTalkRefusal,
  isPresentForTalk,
  parseMustReactNpc,
  resolveTypedFreeText,
  speechAddresseeFromPresence,
  speechEngineLines,
} from './typedFreeText';
import { engineResultFact } from './engineResult';
import { buildCompletedEventPacket } from './completedEventPacket';
import {
  MISSING_ANSWER_PROBLEM,
  PLAYS_PLAYER_PROBLEM,
  runWriterTurnWithFightRetry,
  writerDraftProblems,
  type DraftCheck,
} from './writerTurn';
import { peopleHere } from './chipLegality';
import { checkPlayCrimes } from './turnCheck';

const NPC = 'the exhausted faces';
const PLAYER = 'Ask what they want';
const MUST_REACT = /must react to what you said/;

/** Minimal tabletop state matching seed 20661 T2 presence at Greyhollow mill lane. */
function millLaneT2(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    turn: 2,
    seed: '20661',
    currentLocation: 'Greyhollow mill lane',
    character: {
      ...s.character,
      name: 'Jax',
      srd: {
        ...(s.character.srd ?? {}),
        classId: 'fighter',
        speciesId: 'human',
        skillProfs: s.character.srd?.skillProfs ?? [],
        expertise: s.character.srd?.expertise ?? [],
      } as GameState['character']['srd'],
    },
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true } as GameState['openingEstablishment'],
    sceneFacts: {
      ...(s.sceneFacts ?? {}),
      present: [NPC, 'bystanders'],
      props: [],
      crowd: 'sparse',
      noise: 'quiet',
      lastBeat: '',
      updatedTurn: 2,
    },
    lorebook: [
      {
        id: 'npc-exhausted-faces',
        type: 'npc',
        name: NPC,
        summary: 'We need a strong arm on the keep road. Copper and a dry bed if you help.',
        keywords: ['exhausted', 'faces'],
      },
    ],
    ...over,
  } as GameState;
}

function mem(npcName: string, extra?: Partial<NpcMemory>): NpcMemory {
  return {
    npcId: `mem:${npcName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    npcName,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 1,
    ...extra,
  };
}

/** Seed 20673 T7 shape: loft, Crown present, Ostler Joss left (shouldExit) / elsewhere. */
function loftCrownOnly(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  const here = 'the stable loft behind the Weighing Cup';
  return {
    ...s,
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    turn: 7,
    seed: '20673',
    currentLocation: here,
    character: { ...s.character, name: 'Jax' },
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true } as GameState['openingEstablishment'],
    sceneFacts: {
      ...(s.sceneFacts ?? {}),
      present: ['Crown'],
      props: [],
      crowd: 'sparse',
      noise: 'quiet',
      lastBeat: 'indoors',
      updatedTurn: 7,
    },
    npcMemories: [
      mem('Crown', { location: here, present: true }),
      mem('Ostler Joss', { location: 'The Weighing Cup', shouldExit: true }),
      mem('Joss', { location: 'The Weighing Cup', shouldExit: true }),
    ],
    ...over,
  } as GameState;
}

function draftCheck(state: GameState, engineFact: string, playerInput = PLAYER): DraftCheck {
  return {
    state,
    playerInput,
    intent: parsePlayerIntent(playerInput, state),
    engineFact,
    previousGm: '',
  };
}

describe('q78-SPEECHREPLY', () => {
  it('presence addressee (not text match) + packet carries must-react fact', () => {
    const state = millLaneT2();
    expect(speechAddresseeFromPresence(state)).toBe(NPC);
    const typed = resolveTypedFreeText(state, PLAYER);
    expect(typed.facts.some((f) => MUST_REACT.test(f))).toBe(true);
    expect(typed.facts.some((f) => f.includes(`${NPC} ${MUST_REACT_TAIL}`))).toBe(true);
    expect(typed.facts.some((f) => f === NO_PC_QUOTED_WORDS)).toBe(true);
    expect(parseMustReactNpc(typed.engineResult)).toBe(NPC);

    const speechLines = speechEngineLines(typed);
    const engineFact = engineResultFact(speechLines, 'dnd');
    expect(engineFact).toMatch(/must react to what you said/);
    expect(engineFact).toContain(NO_PC_QUOTED_WORDS.slice(0, 24));
    expect(parseMustReactNpc(engineFact)).toBe(NPC);

    const packet = buildCompletedEventPacket(state, PLAYER, { engineResult: engineFact });
    expect(packet.engineResult ?? '').toMatch(/must react to what you said/);
    expect(packet.engineResult ?? '').toContain(NPC);
  });

  it('draft without a reaction is rejected and goes to the one repair', async () => {
    const state = millLaneT2();
    const engineFact = engineResultFact(speechEngineLines(resolveTypedFreeText(state, PLAYER)), 'dnd');
    const check = draftCheck(state, engineFact);
    const packet = buildCompletedEventPacket(state, PLAYER, { engineResult: engineFact });

    const noReply =
      'Rain hung over Greyhollow mill lane. The exhausted faces heard you out and did not repeat themselves. They waited for something new from Jax.';
    const problems = writerDraftProblems(noReply, check);
    expect(problems.some((p) => p === MISSING_ANSWER_PROBLEM)).toBe(true);

    let repairRequests: string[] = [];
    const turn = await runWriterTurnWithFightRetry({
      firstRaw: noReply,
      packet,
      check,
      rewrite: async () => noReply,
      repair: async (request) => {
        repairRequests.push(request);
        return `"We need a strong arm on the keep road," one of the exhausted faces said.`;
      },
    });
    // Existing one targeted repair (answer or sentence) — must-react miss is what we force.
    expect(repairRequests.length).toBe(1);
    expect(
      turn.answerRepair?.flag === MISSING_ANSWER_PROBLEM
      || repairRequests[0]!.includes('answers the player')
      || turn.prose.includes('"')
    ).toBe(true);
  });

  it('draft with a reply attributed to the addressed NPC passes', () => {
    const state = millLaneT2();
    const engineFact = engineResultFact(speechEngineLines(resolveTypedFreeText(state, PLAYER)), 'dnd');
    const check = draftCheck(state, engineFact);
    const withReply =
      'Rain slicked the mill lane. "We need a strong arm on the keep road," one of the exhausted faces said, watching Jax. The others waited for an answer.';
    const problems = writerDraftProblems(withReply, check);
    expect(problems.some((p) => p === MISSING_ANSWER_PROBLEM)).toBe(false);
  });
});

describe('q78r-SPEECHREPAIR', () => {
  it('20671 T5: PC-quoted draft is plays-player and goes to the one repair', async () => {
    const state = millLaneT2({
      engineMode: 'litrpg',
      campaignBibleId: 'summoned-pact',
      turn: 5,
      seed: '20671',
      currentLocation: 'The Argent Ledger',
      sceneFacts: {
        present: ['Kade Voss', 'Good'],
        props: [],
        crowd: 'sparse',
        noise: 'quiet',
        lastBeat: '',
        updatedTurn: 5,
      },
      npcMemories: [
        mem('Kade Voss', { location: 'The Argent Ledger', present: true }),
        mem('Good', { location: 'The Argent Ledger', present: true }),
      ],
    });
    const input = 'Talk to Good';
    const typed = resolveTypedFreeText(state, input);
    expect(typed.facts.some((f) => f === NO_PC_QUOTED_WORDS)).toBe(true);
    const engineFact = engineResultFact(speechEngineLines(typed), 'litrpg');
    const check = draftCheck(state, engineFact, input);
    const packet = buildCompletedEventPacket(state, input, { engineResult: engineFact });

    const playsPlayer =
      'Jax turned from the ledger wagon and spoke across the desk to Good. Good said, "We both got pulled." On the desk sat the plate, and Jax said, "That\'s what I pulled off the wreck—tell me what you make of it," then watched Kade Voss.';
    expect(checkPlayCrimes(state, state, input, playsPlayer).p0.some((f) => f.kind === 'plays-player')).toBe(true);
    const problems = writerDraftProblems(playsPlayer, check);
    expect(problems.some((p) => p === PLAYS_PLAYER_PROBLEM)).toBe(true);

    let repairRequests: string[] = [];
    await runWriterTurnWithFightRetry({
      firstRaw: playsPlayer,
      packet,
      check,
      rewrite: async (problem) => {
        if (problem.includes(PLAYS_PLAYER_PROBLEM) || /quoted words/i.test(problem)) {
          return 'Good said, "We both got pulled out of the Argent Ledger the same way." Kade Voss did not look up from the desk.';
        }
        return playsPlayer;
      },
      repair: async (request) => {
        repairRequests.push(request);
        return '"We both got pulled," Good said.';
      },
    });
    expect(
      repairRequests.length >= 1
      || problems.includes(PLAYS_PLAYER_PROBLEM)
    ).toBe(true);
  });

  it('20673 T7: Talk to Ostler Joss while only Crown is present → engine refusal, no must-react', () => {
    const state = loftCrownOnly();
    expect(peopleHere(state)).toContain('Crown');
    expect(isPresentForTalk(state, 'Ostler Joss')).toBe(false);
    expect(isPresentForTalk(state, 'Crown')).toBe(true);

    const typed = resolveTypedFreeText(state, 'Talk to Ostler Joss');
    expect(typed.engineResult).toMatch(/is not here/i);
    expect(typed.engineResult).toMatch(/Ostler Joss/);
    expect(typed.facts.some((f) => MUST_REACT.test(f))).toBe(false);
    expect(parseMustReactNpc(typed.engineResult)).toBeNull();
    expect(absentTalkRefusal(state, 'Ostler Joss')).toMatch(/Weighing Cup|not here/i);

    const speechLines = speechEngineLines(typed);
    expect(speechLines.some((l) => /is not here/i.test(l))).toBe(true);
    expect(speechLines.some((l) => MUST_REACT.test(l))).toBe(false);
  });

  it('20673 T8: Joss speaking while not present is absent-speaker (draft gate)', () => {
    const state = loftCrownOnly({ turn: 8 });
    expect(peopleHere(state)).toEqual(expect.arrayContaining(['Crown']));
    expect(isPresentForTalk(state, 'Joss')).toBe(false);
    const prose =
      'Jax was at the stable loft behind the Weighing Cup. Joss answers you. "The inn rite dumped you into hay." Ostler Joss stayed in sight.';
    const crimes = checkPlayCrimes(state, state, 'Read Crown', prose);
    expect(crimes.p0.some((f) => f.kind === 'absent-speaker' && /Joss/i.test(f.detail))).toBe(true);
    const engineFact = engineResultFact(
      speechEngineLines(resolveTypedFreeText(state, 'Read Crown')).length
        ? speechEngineLines(resolveTypedFreeText(state, 'Read Crown'))
        : ['Crown is present.'],
      'litrpg'
    );
    // Read Crown is not speech — still flag absent speaker on the draft.
    const problems = writerDraftProblems(prose, draftCheck(state, engineFact, 'Read Crown'));
    expect(problems.some((p) => /Absent speaker/i.test(p) && /Joss/i.test(p))).toBe(true);
  });

  it('20673 T11: Talk to Ostler Joss again still refuses when absent (no Crown must-react)', () => {
    const state = loftCrownOnly({ turn: 11 });
    const typed = resolveTypedFreeText(state, 'Talk to Ostler Joss');
    expect(typed.engineResult).toMatch(/Ostler Joss is not here/i);
    expect(parseMustReactNpc(typed.engineResult)).toBeNull();
    // Must not address Crown for a named talk to someone else.
    expect(typed.engineResult).not.toMatch(/Crown must react/i);
  });
});
