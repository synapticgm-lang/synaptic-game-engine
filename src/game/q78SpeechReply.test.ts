/**
 * q78-SPEECHREPLY — typed speech to a present NPC must force a writer reaction.
 * Replay shape: check-lap q77z-tt seed 20661 T2 (cursed-keep chilled-gm):
 *   scripts/fate-autoplay/runs/2026-10-20T15-01-33-943Z_cursed-keep_chilled-gm_s20661
 * Player typed "Ask what they want"; present "the exhausted faces"; prose ignored the ask (P0).
 *
 * SRD 5.2.1 Communicating (Wizards of the Coast, CC BY 4.0):
 * "You can communicate however you are able to… communicating doesn’t interfere with other Activity."
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState } from './types';
import { parsePlayerIntent } from './intentParser';
import {
  MUST_REACT_TAIL,
  parseMustReactNpc,
  resolveTypedFreeText,
  speechAddresseeFromPresence,
  speechEngineLines,
} from './typedFreeText';
import { engineResultFact } from './engineResult';
import { buildCompletedEventPacket } from './completedEventPacket';
import {
  MISSING_ANSWER_PROBLEM,
  runWriterTurnWithFightRetry,
  writerDraftProblems,
  type DraftCheck,
} from './writerTurn';

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
      crowd: 'few',
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

function draftCheck(state: GameState, engineFact: string): DraftCheck {
  return {
    state,
    playerInput: PLAYER,
    intent: parsePlayerIntent(PLAYER, state),
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
    expect(parseMustReactNpc(typed.engineResult)).toBe(NPC);

    const speechLines = speechEngineLines(typed);
    const engineFact = engineResultFact(speechLines, 'dnd');
    expect(engineFact).toMatch(/must react to what you said/);
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
