/**
 * tt-fix-6 — one test per item of the tt-diagnose-7 fix round.
 */
import { describe, expect, it } from 'vitest';
import { newGameState } from './newGameTestState';
import { deedXp } from './xpRules';
import { houseRulesFromSettings } from './rules/houseRules';
import { srdBreakAwayCheck } from './engineFight';
import { formatEncounterClearedStatus, type EncounterClearedReceipt } from './encounterTerminalFsm';
import { statusLinesForVerbosity } from './systemLog';
import { handedWriterText, type CompletedEventPacket } from './completedEventPacket';
import { lineHasUnhandedFind, handedCountText } from './tokenProse';
import { applyCommittedNarrative } from './sceneFacts';
import { tabletopStepKind } from './tabletopQuestProgress';
import { withMissingFightFacts } from './beatCommitGate';
import { engineResultFact, terminalFightOutcome, terminalOutcomeSentence } from './engineResult';
import { hasOpenAsk } from './questGiver';
import { checkRepeatChips } from './turnCheck';
import { backedAnswerFacts } from './writerTurn';
import type { ActiveEncounter, GameState, Quest } from './types';

const tabletop = (): GameState => newGameState('cursed-keep', { engineMode: 'dnd' });

describe('tt-fix-6 item 1 — tabletop follows SRD 5.2.1', () => {
  it('deeds pay no tabletop XP and progression is always SRD XP', () => {
    expect(deedXp('dnd', 'capstone').amount).toBe(0);
    expect(deedXp('rpg', 'first').amount).toBe(0);
    expect(houseRulesFromSettings({ ttProgression: 'milestone' } as never).progression).toBe('xp');
  });

  it('escape is a contest, parley is Influence at DC max(15, INT)', () => {
    const enc = { id: 'e1', name: 'Goblin', hp: 7, maxHp: 7 } as unknown as ActiveEncounter;
    const flee = srdBreakAwayCheck(tabletop(), enc, true, () => 0.5);
    // VR1-b: shared formatResultLine from CheckResultRecord (contest vs foe total as DC).
    expect(flee.line).toMatch(/^d20 \d+ [+−] \d+ \(DEX\) = -?\d+ vs DC \d+ — (?:success|failure)$/);
    expect(flee.record.spec?.kind).toBe('contest');
    expect(flee.ok).toBe(false);
    const parley = srdBreakAwayCheck(tabletop(), enc, false, () => 0.5);
    expect(parley.line).toMatch(/vs DC 15 —/);
  });
});

describe('tt-fix-6 item 3 — the line gate reads what the writer was handed', () => {
  it('handed text carries the engine result and the player line; a named find passes', () => {
    const state = tabletop();
    const packet = { engineResult: 'Search check: success — found: rope', playerInput: 'Search the cart' } as unknown as CompletedEventPacket;
    const handed = handedWriterText(state, packet);
    expect(handed).toMatch(/ENGINE RESULT: Search check: success — found: rope/);
    expect(lineHasUnhandedFind('You found a coil of rope under the seat.', handedCountText(state, packet))).toBe(false);
  });

  it('the running clock owns time of day; prose words do not move it', () => {
    const state = { ...tabletop(), worldHour: 22 } as GameState;
    state.sceneFacts = { ...(state.sceneFacts ?? {}), timeOfDay: 'night' } as GameState['sceneFacts'];
    const facts = applyCommittedNarrative(state, 'The morning sun rose over the wall.', 3);
    expect(facts.timeOfDay).toBe('night');
  });
});

describe('tt-fix-6 item 4 — the step verb decides what ticks it', () => {
  it('talk / move / look', () => {
    expect(tabletopStepKind('Speak with Oskar about his daughter')).toBe('talk');
    expect(tabletopStepKind('Escort Lina back to the village')).toBe('move');
    expect(tabletopStepKind('Travel toward the keep gate')).toBe('move');
    expect(tabletopStepKind('Search the great hall for tracks')).toBe('look');
  });
});

describe('tt-fix-6 item 5 — a missed fight fact is added, the beat is kept', () => {
  it('keeps the writer prose; the outcome is the engine combat-log line (q31-RCR1)', () => {
    const receipts = ['Fight: VICTORY vs Goblin in 2 rounds. The fight is over: Goblin is down and cannot fight on.'];
    const state = { ...tabletop(), completedEvent: { engineResult: engineResultFact(receipts) } } as unknown as GameState;
    const prose = 'Jax swung at the goblin by the gate.';
    const out = withMissingFightFacts(state, prose, { who: 'Jax', him: 'them' });
    expect(out).toBe(prose);
    expect(out).not.toMatch(/went down and did not get up/);
    expect(
      terminalOutcomeSentence(terminalFightOutcome(engineResultFact(receipts))!, { who: 'Jax', him: 'them' })
    ).toMatch(/^The Goblin went down and did not get up/);
  });
});

describe('tt-fix-6 item 6 — offers need an open ask; props come from the engine', () => {
  it('no ask, no offer; an active quest giver has one', () => {
    const state = tabletop();
    expect(hasOpenAsk(state, 'Nobody Atall')).toBe(false);
    const quest = { id: 'q1', name: 'Find Lina', status: 'active', giver: 'Nobody Atall', objectives: [] } as unknown as Quest;
    expect(hasOpenAsk({ ...state, quests: [...(state.quests ?? []), quest] }, 'Nobody Atall')).toBe(true);
  });

  it('a chest in the prose is not a prop', () => {
    const facts = applyCommittedNarrative(tabletop(), 'A wooden chest sat under a blue panel by the cracked street.', 2);
    expect((facts.props ?? []).join(' ')).not.toMatch(/wooden chest|blue panel|cracked street/);
  });
});

describe('tt-fix-6 item 7 — STATUS chrome', () => {
  it('a defeat reads lost and stays in core STATUS', () => {
    const line = formatEncounterClearedStatus({
      encounterId: 'e1', outcome: 'defeat', turn: 4, resolutionReason: 'pc down',
      engagedTurnCount: 2, failedFleeCount: 0, failedParleyCount: 0, name: 'Goblin',
    } as EncounterClearedReceipt);
    expect(line).toMatch(/lost/);
    expect(line).not.toMatch(/defeated/);
    expect(statusLinesForVerbosity([line], 'core')).toEqual([line]);
  });
});

describe('tt-fix-6 item 8 — tool fixes', () => {
  it('fight round chips are no repeat', () => {
    expect(checkRepeatChips(['Attack the goblin'], 'Attack the goblin', ['Attack the goblin'])).toEqual([]);
    expect(checkRepeatChips(['Attack the goblin'], 'Attack the goblin')).toHaveLength(1);
  });
});

describe('tt-fix-6 item 9 — answer facts come from lore and quest text', () => {
  it('reads a bible NPC lore card and never offers a raw motive', () => {
    const base = tabletop();
    const state: GameState = {
      ...base,
      lorebook: [
        ...(base.lorebook ?? []),
        { id: 'l-x', name: 'Hedda Marsh', type: 'npc', keywords: ['Hedda'], summary: 'Hedda keeps the ferry. Her brother vanished at the ford.' },
      ],
      npcMemories: [
        ...(base.npcMemories ?? []),
        { npcName: 'Hedda Marsh', sheet: { motive: 'Revenge' } } as never,
      ],
    } as GameState;
    const facts = backedAnswerFacts(state, 'Hedda Marsh');
    expect(facts.join(' ')).toMatch(/brother vanished at the ford/);
    expect(facts.join(' ')).not.toMatch(/wants revenge/);
  });
});
