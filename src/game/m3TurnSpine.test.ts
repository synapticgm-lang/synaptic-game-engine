/**
 * M3 — engine-first turn spine + SRD rule gaps (offline, deterministic, no paid AI).
 *
 * SRD 5.2.1 quotes (Wizards of the Coast LLC, CC BY 4.0) live next to each assert.
 */
import { describe, expect, it } from 'vitest';
import { RULE_GAPS, passedGapIds, expectedFailGapIds } from '../__tests__/replayBank/ruleGaps';
import { slotOfStep, trySpendSlot, freshEconomy, notDoneReason } from './actionEconomy';
import { carryingCapacityLb } from './rules/encumbrance';
import { srdSaleCp } from './rules/coins';
import { playRound, type PcProfile } from './rules/roundCombat';
import { SRD_MONSTERS, type StatBlock } from './rules/srdMonsters';
import { applyRestHeal } from './recoveryRules';
import { FIGHT_CHIP_CAP, roundCombatChips, capFightChips, legalFightActionsThisRound } from './tabletop/combatChips';
import { runTurnSpine } from './turnSpine';
import { resolveTypedFreeText } from './typedFreeText';
import { buildCompletedEventPacket } from './completedEventPacket';
import { buildFactSheet } from './factSheet';
import { buildTurnLog, sliceState } from './turnLog';
import type { ActiveEncounter, GameState, RoundCombatState } from './types';
import type { IntentStep } from './intentParser';

const block = (id: string): StatBlock => {
  const { match: _m, ...b } = SRD_MONSTERS.find((m) => m.id === id)!;
  return b;
};
const always = (v: number) => () => v;
const d20 = (n: number) => always((n - 0.5) / 20);

const pc = (over: Partial<PcProfile> = {}): PcProfile => ({
  name: 'Jax',
  ac: 16,
  hp: 12,
  maxHp: 12,
  speed: 30,
  initiativeMod: 1,
  saves: { STR: 5, DEX: 1, CON: 4, INT: -1, WIS: 1, CHA: 0 },
  stealth: 1,
  species: 'human',
  weapon: { name: 'Greatsword', toHit: 5, dice: '2d6', mod: 3, type: 'slashing', ranged: false },
  conditions: [],
  ...over,
});

const fight = (b: StatBlock, n = 1, over: Partial<RoundCombatState> = {}) => ({
  combat: {
    encounterName: b.name,
    round: 1,
    pcInitiative: 20,
    foes: Array.from({ length: n }, (_, i) => ({
      id: `f${i + 1}`,
      name: `${b.name} ${i + 1}`,
      blockId: b.id,
      hp: b.hp,
      maxHp: b.hp,
      initiative: 5,
      conditions: [],
    })),
    pcConditions: [],
    ...over,
  } as RoundCombatState,
  blocks: Object.fromEntries(Array.from({ length: n }, (_, i) => [`f${i + 1}`, b])),
});

function baseState(over: Partial<GameState> = {}): GameState {
  return {
    turn: 4,
    currentLocation: 'Greyhollow Inn',
    campaignBibleId: 'cursed-keep',
    engineMode: 'dnd',
    character: {
      name: 'Jax',
      hp: 6,
      maxHp: 12,
      xp: 0,
      level: 1,
      xpToNext: 300,
      gender: 'male',
      attributes: { STR: 15, DEX: 14, CON: 13, INT: 10, WIS: 12, CHA: 8 },
      conditions: [],
      srd: { speciesId: 'human', classId: 'fighter', skillProfs: [], expertise: [] },
    },
    inventory: [
      { id: 'i1', name: 'Longsword', equipped: true, quantity: 1, slot: 'main-hand' },
      { id: 'i2', name: 'Torch', equipped: false, quantity: 1 },
    ],
    gold: 5,
    hitDiceSpent: 0,
    sceneFacts: { present: [], props: [], lastAddressee: null },
    ...over,
  } as GameState;
}

/** Real ActiveEncounter from the bandit StatBlock (same required fields as s77RootC / ttT1a fixtures). */
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
  const f = fight(b);
  return baseState({
    activeEncounter: banditEncounter(b),
    roundCombat: f.combat,
    ...over,
  });
}

describe('M3 rule-gap registry', () => {
  // M6 flipped gap-parley / gap-steal — all nine now pass.
  it('all nine rule gaps pass after M6 (parley/steal included)', () => {
    expect(passedGapIds()).toHaveLength(9);
    expect(expectedFailGapIds()).toEqual([]);
    for (const id of passedGapIds()) {
      expect(RULE_GAPS.find((g) => g.id === id)!.expectedFail).toBe(false);
    }
  });
});

describe('M3 gap-nat20 / gap-nat1 (shared roundCombat)', () => {
  // SRD 5.2.1: "If the d20 roll for an attack is a 20, the attack hits regardless of any
  // modifiers or the target's AC. This is called a Critical Hit..." / "...a 1, the attack misses..."
  it('natural 20 hits and crits; natural 1 misses regardless of mods', () => {
    const b = block('bandit');
    const crit = playRound({ pc: pc(), combat: fight(b).combat, blocks: fight(b).blocks, action: 'attack', rng: d20(20) });
    const atk = crit.events.find((e) => e.k === 'attack' && e.pc)!;
    expect(atk).toMatchObject({ kept: 20, hit: true, crit: true });
    expect(atk.k === 'attack' && atk.damage!.dice.length).toBeGreaterThanOrEqual(2);

    const miss = playRound({
      pc: pc({ weapon: { ...pc().weapon, toHit: 30 } }),
      combat: fight(b).combat,
      blocks: fight(b).blocks,
      action: 'attack',
      rng: d20(1),
    });
    expect(miss.events.find((e) => e.k === 'attack' && e.pc)).toMatchObject({ hit: false, nat1: true });
  });
});

describe('M3 gap-oa-on-flee (shared roundCombat)', () => {
  // SRD 5.2.1 Opportunity Attacks: leave reach without Disengage → one Reaction attack.
  it('Flee draws opportunity attacks; Disengage does not', () => {
    const b = block('bandit');
    const flee = playRound({
      pc: pc({ hp: 40, maxHp: 40 }),
      combat: fight(b, 2).combat,
      blocks: fight(b, 2).blocks,
      action: 'flee',
      rng: d20(15),
    });
    expect(flee.outcome).toBe('escaped');
    expect(flee.events.filter((e) => e.k === 'attack' && e.opportunity)).toHaveLength(2);

    const dis = playRound({
      pc: pc(),
      combat: fight(b).combat,
      blocks: fight(b).blocks,
      action: 'disengage',
      rng: d20(10),
    });
    expect(dis.events.filter((e) => e.k === 'attack' && e.opportunity)).toHaveLength(0);
  });
});

describe('M3 gap-short-rest-hit-dice (recoveryRules)', () => {
  // SRD 5.2.1 Short Rest: spend Hit Dice (die + CON) at end of rest.
  it('short rest spends a Hit Die and regains HP', () => {
    const s = baseState({ character: { ...baseState().character!, hp: 4, maxHp: 12 } });
    const r = applyRestHeal(s, 'Take a short rest');
    expect(r.receipt).toBeTruthy();
    expect(r.state.hitDiceSpent).toBe(1);
    expect(r.state.character.hp).toBeGreaterThan(4);
    expect(r.dieLine || r.receipt || '').toMatch(/Hit Die|short rest/i);
  });
});

describe('M3 gap-sell-half (coins.srdSaleCp)', () => {
  // SRD 5.2.1 Selling Treasure: equipment typically sells for half cost.
  it('arms and armor sell for half list price in copper', () => {
    // Crowbar 2 gp = 200 cp → half 100; Shortsword 10 gp = 1000 cp → half 500.
    expect(srdSaleCp('Crowbar', 1)).toBe(100);
    expect(srdSaleCp('Shortsword', 1)).toBe(500);
    expect(srdSaleCp('Dagger', 1)).toBe(100);
  });
});

describe('M3 gap-str-x15 (encumbrance)', () => {
  // SRD 5.2.1: "Your carrying capacity is your Strength score multiplied by 15."
  it('carrying capacity is Strength × 15 lb', () => {
    expect(carryingCapacityLb(15)).toBe(225);
    expect(carryingCapacityLb(8)).toBe(120);
    expect(carryingCapacityLb(0)).toBe(0);
  });
});

describe('M3 gap-cap-4 (combatChips one cap)', () => {
  it('fight buttons never exceed 4 and are engine-legal', () => {
    const s = fightState();
    const chips = roundCombatChips(s);
    expect(chips).toBeTruthy();
    expect(chips!.length).toBeGreaterThan(0);
    expect(chips!.length).toBeLessThanOrEqual(FIGHT_CHIP_CAP);
    const legal = new Set(legalFightActionsThisRound(s).map((c) => c.toLowerCase()));
    for (const c of chips!) {
      expect(legal.has(c.toLowerCase())).toBe(true);
    }
    expect(capFightChips(['a', 'b', 'c', 'd', 'e', 'f'], 4)).toHaveLength(4);
  });
});

describe('M3 action economy on the spine', () => {
  // SRD 5.2.1 Combat Your Turn: one Action per round; speech free.
  it('multi-step fight message marks extra Actions not done; free text never rejected', () => {
    const s = fightState();
    // Two mechanical attack steps in one message.
    const steps: IntentStep[] = [
      { action: 'attack', target: 'Bandit', clause: 'I attack the Bandit' },
      { action: 'attack', target: 'Bandit', clause: 'I swing again at the Bandit' },
    ];
    expect(slotOfStep(steps[0]!)).toBe('action');
    let eco = freshEconomy();
    const first = trySpendSlot(eco, 'action', true);
    expect(first.ok).toBe(true);
    eco = first.ok ? first.used : eco;
    const second = trySpendSlot(eco, 'action', true);
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.reason).toBe(notDoneReason('action'));

    const typed = resolveTypedFreeText(s, 'I attack the Bandit then I attack the Bandit again');
    expect(typed.stepResults?.length).toBeGreaterThanOrEqual(1);
    // Never a rejection / Refused line.
    expect(typed.engineResult).not.toMatch(/Refused:/i);
    const spine = runTurnSpine(s, 'I shout at the Bandit: watch yourself!');
    expect(spine.stepResults.some((r) => r.done && r.economySlot === 'speech')).toBe(true);
    expect(spine.engineResult).not.toMatch(/Refused:/i);
  });

  it('FactSheet beat.steps and TurnLog record step results + economy', () => {
    const s = fightState();
    const spine = runTurnSpine(s, 'I shout at the Bandit: hold!');
    const packet = buildCompletedEventPacket(spine.state, 'I shout at the Bandit: hold!', {
      readerStepResults: spine.readerStepResults,
      engineResult: spine.engineResult,
    });
    const sheet = buildFactSheet(spine.state, packet, 'I shout at the Bandit: hold!');
    expect(sheet.beat.steps.length).toBeGreaterThan(0);
    const log = buildTurnLog({
      turn: 4,
      input: 'I shout at the Bandit: hold!',
      parsedIntent: {
        kind: 'talk',
        label: 'Speech',
        stepResults: spine.readerStepResults.map((r) => ({
          tried: r.tried,
          done: r.done,
          reason: r.reason,
        })),
      },
      engineBeats: spine.readerStepResults.map((r) => (r.done ? `done: ${r.tried}` : `not done: ${r.tried}`)),
      diceRolls: spine.diceRolls,
      stateBefore: sliceState(s),
      stateAfter: sliceState(spine.state),
      factSheet: sheet,
      finalProse: 'You shout.',
      chipsOffered: roundCombatChips(s) ?? [],
      latencyMs: 1,
    });
    expect(log.parsedIntent?.stepResults?.length).toBeGreaterThan(0);
    expect(log.chipsOffered.length).toBeLessThanOrEqual(FIGHT_CHIP_CAP);
  });

  it('Fate and live share runTurnSpine (same entry)', () => {
    const s = fightState();
    const a = runTurnSpine(s, 'Wait');
    const b = runTurnSpine(s, 'Wait');
    expect(a.engineResult).toBe(b.engineResult);
    expect(a.readerStepResults.map((r) => r.reason)).toEqual(b.readerStepResults.map((r) => r.reason));
  });
});
