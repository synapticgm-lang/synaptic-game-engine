/**
 * M6 — steal, parley, fight cap 4, mid-visit proposal (offline, deterministic).
 *
 * SRD 5.2.1 quotes (Wizards of the Coast LLC, CC BY 4.0) live next to asserts.
 */
import { describe, expect, it, afterEach } from 'vitest';
import { RULE_GAPS, expectedFailGapIds, passedGapIds } from '../__tests__/replayBank/ruleGaps';
import { pinDice } from './seededRng';
import {
  isGuardedQuestItem,
  resolveParleyAttempt,
  resolveStealAttempt,
} from './stealParley';
import {
  evaluateMidVisitProposal,
  MID_VISIT_PROPOSAL_CAP,
  midVisitAcceptedCount,
} from './midVisitProposal';
import { FIGHT_CHIP_CAP, roundCombatChips, legalFightActionsThisRound } from './tabletop/combatChips';
import { enumerateLegalEdges } from './choiceEdge';
import { runTurnSpine } from './turnSpine';
import { buildCompletedEventPacket } from './completedEventPacket';
import { buildFactSheet } from './factSheet';
import { buildTurnLog, sliceState } from './turnLog';
import { SRD_MONSTERS, type StatBlock } from './rules/srdMonsters';
import type { ActiveEncounter, GameState, RoundCombatState } from './types';

afterEach(() => pinDice(null));

const block = (id: string): StatBlock => {
  const { match: _m, ...b } = SRD_MONSTERS.find((m) => m.id === id)!;
  return b;
};

function baseState(over: Partial<GameState> = {}): GameState {
  return {
    turn: 4,
    seed: 'm6-steal-parley',
    currentLocation: 'Greyhollow Inn',
    campaignBibleId: 'cursed-keep',
    engineMode: 'dnd',
    character: {
      name: 'Jax',
      hp: 10,
      maxHp: 12,
      xp: 0,
      level: 1,
      xpToNext: 300,
      gender: 'male',
      attributes: { STR: 10, DEX: 16, CON: 12, INT: 10, WIS: 12, CHA: 14 },
      conditions: [],
      srd: { speciesId: 'human', classId: 'rogue', skillProfs: ['Sleight of Hand', 'Persuasion'], expertise: [] },
    },
    inventory: [],
    gold: 5,
    sceneFacts: { present: ['Mara'], props: ['silver coin'], crowd: 'sparse', noise: 'quiet' },
    npcMemories: [
      {
        npcId: 'mara',
        npcName: 'Mara',
        disposition: 'neutral',
        facts: [],
        lastSeenTurn: 0,
      },
    ],
    ...over,
  } as GameState;
}

function banditEncounter(b: StatBlock): ActiveEncounter {
  return {
    name: b.name,
    level: 1,
    hp: b.hp,
    maxHp: b.hp,
    armorClass: b.ac,
    strength: b.scores.STR,
    dexterity: b.scores.DEX,
    constitution: b.scores.CON,
    xpReward: 25,
    goldReward: 5,
    cr: b.cr,
    phase: 'engaged',
    encounterId: 'bandit-1',
  };
}

function fightState(over: Partial<GameState> = {}): GameState {
  const b = block('bandit');
  return baseState({
    activeEncounter: banditEncounter(b),
    roundCombat: {
      encounterName: b.name,
      round: 1,
      pcInitiative: 20,
      foes: [{ id: 'f1', name: `${b.name} 1`, blockId: b.id, hp: b.hp, maxHp: b.hp, initiative: 5, conditions: [] }],
      pcConditions: [],
    } as RoundCombatState,
    ...over,
  });
}

describe('M6 rule-gap registry', () => {
  it('flips gap-parley and gap-steal to pass; no expected-fail gaps left', () => {
    expect(expectedFailGapIds()).toEqual([]);
    expect(passedGapIds()).toHaveLength(9);
    expect(RULE_GAPS.find((g) => g.id === 'gap-parley')!.expectedFail).toBe(false);
    expect(RULE_GAPS.find((g) => g.id === 'gap-steal')!.expectedFail).toBe(false);
  });
});

describe('M6 steal (Sleight of Hand vs Passive Perception)', () => {
  // SRD 5.2.1: Dexterity (Sleight of Hand); Passive Perception = 10 + Wisdom (Perception) mod.
  it('success takes unnoticed and writes ledger + FactSheet / TurnLog', () => {
    pinDice(() => 0.99); // d20 → 20
    const s = baseState();
    const r = resolveStealAttempt(s, 'I steal the silver coin from Mara', {
      action: 'take',
      target: 'silver coin',
      addressee: 'Mara',
      clause: 'I steal the silver coin from Mara',
    });
    expect(r.taken).toBe(true);
    expect(r.noticed).toBe(false);
    expect(r.state.inventory?.some((i) => /silver coin/i.test(i.name))).toBe(true);
    expect(r.state.stateTxLog?.some((t) => /Stole/i.test(t.summary))).toBe(true);

    const spine = runTurnSpine(
      { ...s, seed: 'm6-steal-ok' },
      'I steal the silver coin from Mara',
    );
    // Re-pin for spine path
    pinDice(() => 0.99);
    const spine2 = runTurnSpine(s, 'I steal the silver coin from Mara');
    expect(spine2.engineResult).toMatch(/Took|unnoticed|Steal/i);
    const packet = buildCompletedEventPacket(spine2.state, 'I steal the silver coin from Mara', {
      readerStepResults: spine2.readerStepResults,
      engineResult: spine2.engineResult,
    });
    const sheet = buildFactSheet(spine2.state, packet, 'I steal the silver coin from Mara');
    expect(sheet.beat.steps.length).toBeGreaterThan(0);
    const log = buildTurnLog({
      turn: 4,
      input: 'I steal the silver coin from Mara',
      parsedIntent: {
        kind: 'search',
        label: 'Steal',
        stepResults: spine2.readerStepResults.map((x) => ({
          tried: x.tried,
          done: x.done,
          reason: x.reason,
        })),
      },
      engineBeats: [spine2.engineResult],
      diceRolls: spine2.diceRolls,
      stateBefore: sliceState(s),
      stateAfter: sliceState(spine2.state),
      factSheet: sheet,
      finalProse: 'You lift the coin.',
      chipsOffered: [],
      latencyMs: 1,
    });
    expect(log.parsedIntent?.stepResults?.some((x) => x.done)).toBe(true);
    void spine;
  });

  it('failure is noticed, not taken, and nudges persona cheated', () => {
    pinDice(() => 0.01); // d20 → 1
    const s = baseState();
    const r = resolveStealAttempt(s, 'I steal the silver coin from Mara', {
      action: 'take',
      target: 'silver coin',
      addressee: 'Mara',
      clause: 'I steal the silver coin from Mara',
    });
    expect(r.taken).toBe(false);
    expect(r.noticed).toBe(true);
    expect(r.state.inventory ?? []).toHaveLength(0);
    expect(r.state.personaNudges?.some((n) => n.tag === 'cheated')).toBe(true);
  });

  it('guarded quest item while guardian lives resolves as attempt, never silently granted', () => {
    pinDice(() => 0.99);
    const b = block('bandit');
    const s = fightState({
      sceneFacts: {
        present: [b.name],
        props: ['lost reliquary'],
        crowd: 'none',
        noise: 'quiet',
      },
      quests: [
        {
          id: 'q-relic',
          name: 'The Lost Reliquary',
          description: 'Recover the lost reliquary',
          status: 'active',
          type: 'main',
          revealed: true,
          objectives: [{ id: 'o1', description: 'Take the lost reliquary', completed: false }],
        },
      ],
    });
    expect(isGuardedQuestItem(s, 'lost reliquary')).toBe(true);
    const r = resolveStealAttempt(s, 'I steal the lost reliquary from the Bandit', {
      action: 'take',
      target: 'lost reliquary',
      addressee: b.name,
      clause: 'I steal the lost reliquary from the Bandit',
    });
    expect(r.guardedHold).toBe(true);
    expect(r.taken).toBe(false);
    expect(r.state.inventory?.some((i) => /reliquary/i.test(i.name))).toBeFalsy();
    expect(r.facts.join(' ')).toMatch(/guardian|holds|not taken/i);
    // Free text never refused — attempt always resolved.
    expect(r.receipts.join(' ')).toMatch(/Steal check|Sleight/i);
  });
});

describe('M6 parley (social Influence + M5 DC)', () => {
  // SRD 5.2.1 Ability Checks (CHA): Persuasion/Intimidation/Deception vs DC.
  it('success ends the fight; failure does not', () => {
    pinDice(() => 0.99);
    const win = resolveParleyAttempt(fightState(), 'I parley with the Bandit: stand down', {
      action: 'persuade',
      tone: 'friendly',
      addressee: 'Bandit',
      clause: 'I parley with the Bandit: stand down',
    });
    expect(win.success).toBe(true);
    expect(win.endedFight).toBe(true);
    expect(!win.state.activeEncounter || win.state.activeEncounter.phase === 'terminal').toBe(true);

    pinDice(() => 0.01);
    const lose = resolveParleyAttempt(fightState(), 'I parley with the Bandit: stand down', {
      action: 'persuade',
      tone: 'friendly',
      addressee: 'Bandit',
      clause: 'I parley with the Bandit: stand down',
    });
    expect(lose.success).toBe(false);
    expect(lose.endedFight).toBe(false);
    expect(lose.state.activeEncounter?.phase).not.toBe('terminal');
  });

  it('spine free speech in fights is never rejected', () => {
    const s = fightState();
    const spine = runTurnSpine(s, 'I shout at the Bandit: watch yourself!');
    expect(spine.engineResult).not.toMatch(/Refused:/i);
    expect(spine.stepResults.some((r) => r.economySlot === 'speech' || r.done)).toBe(true);
  });
});

describe('M6 fight options cap 4', () => {
  it('engine + choiceEdge fight pads never exceed 4; Flee folded into Disengage and move', () => {
    const s = fightState();
    const chips = roundCombatChips(s)!;
    expect(chips.length).toBeGreaterThan(0);
    expect(chips.length).toBeLessThanOrEqual(FIGHT_CHIP_CAP);
    expect(chips.some((c) => /^flee$/i.test(c))).toBe(false);
    expect(chips.some((c) => /disengage/i.test(c))).toBe(true);
    const legal = new Set(legalFightActionsThisRound(s).map((c) => c.toLowerCase()));
    for (const c of chips) expect(legal.has(c.toLowerCase())).toBe(true);

    const edges = enumerateLegalEdges(s);
    expect(edges.length).toBeLessThanOrEqual(FIGHT_CHIP_CAP);
    expect(edges.some((e) => /try to flee/i.test(e.label))).toBe(false);
  });
});

describe('M6 mid-visit quest proposal', () => {
  it('accepts a valid proposal and rejects a contradicting one', () => {
    let s = baseState({
      placeVisitLog: {
        placeId: 'greyhollow-inn',
        placeName: 'Greyhollow Inn',
        sinceTurn: 1,
        events: [],
      },
    });
    const ok = evaluateMidVisitProposal(s, {
      kind: 'side',
      title: 'Fetch the cellar key',
      summary: 'The innkeep needs the spare cellar key from the yard.',
      genreTags: ['fantasy', 'medieval'],
    });
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      s = ok.state;
      expect(s.quests?.some((q) => q.id.startsWith('mid-'))).toBe(true);
      expect(s.stateTxLog?.some((t) => t.kind === 'quest_reveal')).toBe(true);
    }

    const contra = evaluateMidVisitProposal(s, {
      kind: 'quest',
      title: 'Fetch the cellar key',
      summary: 'Repeat of a finished job.',
    });
    // Same title already active is not "decided/done" — mark completed then contradict.
    const doneState: GameState = {
      ...s,
      quests: (s.quests ?? []).map((q) =>
        /cellar key/i.test(q.name) ? { ...q, status: 'completed' as const } : q,
      ),
    };
    const contra2 = evaluateMidVisitProposal(doneState, {
      kind: 'quest',
      title: 'Fetch the cellar key',
      summary: 'Do it again.',
    });
    expect(contra2.ok).toBe(false);
    if (!contra2.ok) expect(contra2.reason).toBe('contradiction');
    void contra;

  });

  it('enforces the per-place mid-visit proposal cap', () => {
    let filled = baseState({
      currentLocation: 'West Wall',
      placeVisitLog: {
        placeId: 'west-wall',
        placeName: 'West Wall',
        sinceTurn: 1,
        events: [],
      },
      quests: [],
      questGen: { lastTurn: 0, unboundLog: [] },
    });
    expect(midVisitAcceptedCount(filled, 'West Wall')).toBe(0);
    for (let i = 0; i < MID_VISIT_PROPOSAL_CAP; i++) {
      const r = evaluateMidVisitProposal(filled, {
        kind: 'hook',
        title: `Wall errand ${i}`,
        summary: `Side hook ${i} on the west wall.`,
        place: 'West Wall',
        genreTags: ['fantasy'],
      });
      expect(r.ok, !r.ok ? `${r.reason}: ${r.detail}` : 'ok').toBe(true);
      if (r.ok) filled = r.state;
    }
    expect(midVisitAcceptedCount(filled, 'West Wall')).toBe(MID_VISIT_PROPOSAL_CAP);
    const capped = evaluateMidVisitProposal(filled, {
      kind: 'hook',
      title: 'One more wall tale',
      summary: 'Should hit the cap.',
      place: 'West Wall',
      genreTags: ['fantasy'],
    });
    expect(capped.ok).toBe(false);
    if (!capped.ok) expect(capped.reason).toBe('cap');
  });
});
