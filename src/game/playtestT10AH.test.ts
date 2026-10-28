/**
 * T10AH — ledger chrome out of story body; first-person convert; fight-end fallback;
 * internal ref / long-place possessive; unconscious act refuse (SRD 5.2.1).
 * Evidence: tabletop s9501 T20/T23/T98/T99/T124; LitRPG s9701 T12/T13/T16.
 */
import { describe, expect, it } from 'vitest';
import { clauseToThirdPerson, convertWriterCueFact } from './writerCueLines';
import { writerEngineResult, isBookForbiddenLedgerLine } from './travelJourney';
import { engineResultFact, isChromeReceipt, terminalFightOutcome } from './engineResult';
import { codedSceneMove } from './beatCommitGate';
import { scrubInternalRefIds, scrubLongPlacePossessive } from './proseWarden';
import { checkActionFollowed } from './turnCheck';
import { writerDraftProblems } from './writerTurn';
import { createInitialState } from './defaults';
import type { GameState } from './types';
import { parsePlayerIntent } from './intentParser';

function dnd(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    character: { ...s.character, name: 'Jax', hp: 12, maxHp: 12 },
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax' },
      complete: true,
      sceneWritten: true,
    },
    ...over,
  } as GameState;
}

describe('T10AH first-person → third (clauseToThirdPerson)', () => {
  it('curly I’m / I have / I’ll / I’ve / I’d do not become Jax’m / Jax have', () => {
    const curly = 'ask if he thinks I\u2019m just gonna hand it over';
    expect(clauseToThirdPerson(curly, 'Jax')).toMatch(/Jax asked if he thinks Jax was just gonna hand it over/i);
    expect(clauseToThirdPerson(curly, 'Jax')).not.toMatch(/Jax['\u2019]m/);

    const have = 'check the device charge to see how much time I have left';
    expect(clauseToThirdPerson(have, 'Jax')).toMatch(/Jax checked.*Jax had left/i);
    expect(clauseToThirdPerson(have, 'Jax')).not.toMatch(/\bJax have\b/);

    // Leading I'll / I've / I'd strip then past-tense the verb (hold→held); mid-clause keeps would/had.
    expect(clauseToThirdPerson("I'll hold the line", 'Jax')).toMatch(/Jax (?:would hold|held) the line/i);
    expect(clauseToThirdPerson("I've seen enough", 'Jax')).toMatch(/Jax (?:had )?seen enough/i);
    expect(clauseToThirdPerson("I'd rather wait", 'Jax')).toMatch(/Jax (?:would )?rather wait|Jax waited/i);
    expect(clauseToThirdPerson('if I\'ll stay', 'Jax')).toMatch(/Jax would stay/i);
    expect(clauseToThirdPerson('we hold the gate', 'Jax')).toMatch(/Jax held the gate/i);
    expect(clauseToThirdPerson('I am ready', 'Jax')).toMatch(/Jax was ready|Jax ready/i);
  });

  it('leading -ly adverb is not past-tensed (suddenly drop, not suddenlied)', () => {
    expect(clauseToThirdPerson('suddenly drop to the floor', 'Jax')).toMatch(
      /Jax suddenly dropped to the floor/i,
    );
    expect(clauseToThirdPerson('suddenly drop to the floor', 'Jax')).not.toMatch(/suddenlied/);
  });

  it('Must narrate block with curly I’m converts clean for the book', () => {
    const fact =
      'Must narrate: ask if he thinks I\u2019m just gonna hand it over. I check the device\'s charge level to see how much time I have left. The story must show this act.';
    const plain = convertWriterCueFact(fact, 'Jax');
    expect(plain).not.toMatch(/Jax['\u2019]m/);
    expect(plain).not.toMatch(/\bJax have\b/);
    expect(plain).toMatch(/Jax (?:was|asked)/i);
  });
});

describe('T10AH ledger chrome never paints as story', () => {
  it('Encounter budget / Combat status / Exhaustion are chrome receipts', () => {
    expect(isChromeReceipt('Encounter budget: 75 XP for level 1, alone — 1 × CR 1/4')).toBe(true);
    expect(isChromeReceipt('Combat status: Initiative — you 12')).toBe(true);
    expect(isChromeReceipt('Exhaustion: level 2 → 1')).toBe(true);
    expect(isBookForbiddenLedgerLine('Moved within the stone outline of a building that is gone: now on a few steps back')).toBe(true);
  });

  it('engineResultFact drops Encounter budget; Rest: HP stays becomes a rest sentence', () => {
    const fact = engineResultFact([
      'Encounter budget: 75 XP for level 1, alone — 1 × CR 1/4 (the camp\'s champion weakened from CR 1/2)',
      'Combat status: Initiative — you 12',
      'Fight: round 1 vs the camp\'s champion — the fight goes on',
      'You slip out of sight',
    ]);
    expect(fact).not.toMatch(/Encounter budget|Combat status/i);
    expect(fact).toMatch(/fight goes on|slip out of sight/i);

    const rest = writerEngineResult(
      'Rest: long rest, 8 hours after 6 hours awake (one long rest per 24 hours) — HP stays 12 (+14h, now night). Exhaustion: level 2 → 1. Must narrate: suddenly drop to the floor. The story must show this act.',
      'Jax',
    );
    expect(rest).not.toMatch(/^Rest:/);
    expect(rest).not.toMatch(/Exhaustion:/);
    expect(rest).not.toMatch(/HP stays/);
    expect(rest).toMatch(/long rest|suddenly dropped/i);
    expect(rest).not.toMatch(/suddenlied/);
  });
});

describe('T10AH fight-end coded fallback narrates the kill', () => {
  it('codedSceneMove uses the settled fight, not a vendor tarp', () => {
    const state = dnd({
      turn: 23,
      currentLocation: 'On the road between places',
      completedEvent: {
        engineResult:
          'Fight: VICTORY vs the camp\'s champion in 4 rounds. The fight is over: the camp\'s champion is down and cannot fight on.',
      } as GameState['completedEvent'],
    });
    expect(terminalFightOutcome(state.completedEvent?.engineResult)?.outcome).toBe('victory');
    const page = codedSceneMove(state);
    expect(page).toMatch(/camp's champion|went down|fight was over/i);
    expect(page).not.toMatch(/vendor under a patched tarp/i);
  });
});

describe('T10AH internal id + long place possessive', () => {
  it('bare t1 / gone\'s visitor scrub', () => {
    expect(scrubInternalRefIds('down on the floor inside t1 and could not fight on')).toMatch(
      /inside and could not fight on/i,
    );
    expect(scrubInternalRefIds('down on the floor inside t1 and could not fight on')).not.toMatch(/\bt1\b/);
    expect(
      scrubLongPlacePossessive(
        'stone outline of a building that is gone\'s other visitor',
      ),
    ).toMatch(/other visitor at the stone outline of a building that is gone/i);
    expect(
      scrubLongPlacePossessive(
        'stone outline of a building that is gone\'s other visitor',
      ),
    ).not.toMatch(/gone's/);
  });
});

describe('T10AH unconscious: prose refuse is correct; successful micro-act is not', () => {
  it('gate does not flag ignored shout when prose says it stayed locked (SRD Unconscious)', () => {
    const before = dnd({
      character: { ...dnd().character, name: 'Jax', hp: 0, maxHp: 12, conditions: ['Unconscious'] },
      deathSaves: { successes: 0, failures: 0 },
      sceneFacts: {
        crowd: 'present',
        noise: 'quiet',
        present: ['Agna Hollin'],
        props: [],
        lastBeat: '',
        updatedTurn: 98,
      },
    });
    const after = {
      ...before,
      completedEvent: {
        engineResult: 'Death save: d20 12 — success (1 success, 0 failures)',
      } as GameState['completedEvent'],
    };
    const prose =
      'Jax lay on the cold ground at Greyhollow Graveyard and could not stand or speak, so the shout that they were not dying here today stayed locked inside their chest. Agna Hollin crouched over Jax\'s unmoving body.';
    const r = checkActionFollowed(
      before,
      after,
      'I crawl toward my greatsword while shouting',
      prose,
      ['Fight for breath'],
    );
    expect(r.p0.filter((f) => f.kind === 'ignored-action')).toHaveLength(0);
  });

  it('writer draft rejects a lick that "worked" while unconscious', () => {
    const state = dnd({
      character: { ...dnd().character, name: 'Jax', hp: 0, conditions: ['Unconscious'] },
      deathSaves: { successes: 1, failures: 0 },
    });
    const bad =
      'Jax lay flat and still on the cold ground and could not move or speak, but their breathing held steady. Jax turned their eyes up toward Agna Hollin and tried to lick the dust off their cheek, and the small act worked.';
    const problems = writerDraftProblems(bad, {
      state,
      playerInput: 'I try to lick the dust off my cheek',
      intent: parsePlayerIntent('I try to lick the dust off my cheek', state),
      engineFact: 'You lie unconscious on the ground and cannot move, speak or act.',
      previousGm: '',
    });
    expect(problems.some((p) => /unconscious/i.test(p))).toBe(true);
  });
});
