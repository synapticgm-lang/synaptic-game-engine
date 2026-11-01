/**
 * T10TABFIGHT — safer first tabletop fight: telegraph triad, weaker L1 foe, no ghost stabilise chip.
 *
 * SRD 5.2.1 XP Budget per Character (WotC, CC BY 4.0): level 1 Low/Moderate/High = 50/75/100.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { ActiveEncounter, Character, GameState, HouseRules, SceneFacts } from './types';
import {
  BACK_OFF_CHIP,
  FIGHT_CHIP,
  FIRST_FIGHT_OPTIONS,
  FIRST_FIGHT_TALK_CHIP,
  FIRST_FIGHT_WARNING,
  firstFightChoiceSet,
  firstFightStatBlock,
  mapFirstFightIntent,
  openFirstFightGate,
  resolveFirstFightChoice,
  softenFirstFightEncounter,
} from './rules/firstFightChoice';
import { choiceCountLimitOf, DEFAULT_HOUSE_RULES } from './rules/houseRules';
import { crToXp, encounterXpBudget } from './xpRules';
import { roundCombatChips, stabiliseHelpers } from './tabletop/combatChips';
import { applyTabletopSheet, resolveSheet } from './tabletop/characterBuild';
import { tickEncounterTerminal } from './encounterTerminalFsm';
import { engineChips } from './choicePipeline';
import { startDying } from './rules/death';

/** Halfling Rogue (Criminal) — same picks as PREGENS owner, built through resolveSheet. */
function rogueSheet() {
  return resolveSheet({
    classId: 'rogue',
    speciesId: 'halfling',
    backgroundId: 'criminal',
    method: 'point-buy',
    baseScores: { STR: 8, DEX: 15, CON: 14, INT: 10, WIS: 12, CHA: 10 },
    kitId: 'A',
    source: 'build',
  });
}

type BaseOver = Omit<Partial<GameState>, 'character' | 'sceneFacts' | 'houseRules'> & {
  character?: Partial<Character>;
  sceneFacts?: Partial<SceneFacts>;
  houseRules?: Partial<HouseRules>;
};

function baseState(over: BaseOver = {}): GameState {
  const s0 = createInitialState(undefined, 'dnd');
  const applied = applyTabletopSheet(
    {
      ...s0,
      seed: 't10tabfight',
      engineMode: 'dnd',
      turn: 19,
      houseRules: { ...DEFAULT_HOUSE_RULES, choiceCountLimit: 3 },
    },
    rogueSheet(),
  );
  const { character: charOver, sceneFacts: factsOver, houseRules: rulesOver, ...rest } = over;
  const sceneFacts: SceneFacts = {
    crowd: 'none',
    noise: 'quiet',
    present: [],
    props: [],
    lastBeat: '',
    updatedTurn: 19,
    ...(applied.sceneFacts ?? {}),
    ...factsOver,
  };
  return {
    ...applied,
    companions: [],
    arcDirector: { ...(applied.arcDirector ?? {}), encounterClearedReceipts: [] },
    log: [],
    ...rest,
    character: {
      ...applied.character,
      name: 'Jax',
      level: 1,
      hp: 10,
      maxHp: 10,
      ...charOver,
      srd: charOver?.srd ?? applied.character.srd,
    },
    sceneFacts,
    houseRules: { ...DEFAULT_HOUSE_RULES, choiceCountLimit: 3, ...rulesOver },
  };
}

const stalker: ActiveEncounter = {
  name: 'Wilds Stalker',
  level: 1,
  hp: 11,
  maxHp: 11,
  armorClass: 12,
  strength: 12,
  dexterity: 15,
  constitution: 12,
  xpReward: 50,
  goldReward: 0,
};

describe('T10TABFIGHT first-fight triad', () => {
  it('s9511-shaped: warning + three options ≤ choiceCountLimit', () => {
    const gated = openFirstFightGate(baseState(), stalker);
    const set = firstFightChoiceSet(gated);
    expect(set.active).toBe(true);
    expect(set.warning).toBe(FIRST_FIGHT_WARNING);
    expect(set.options).toEqual([...FIRST_FIGHT_OPTIONS]);
    expect(set.options.length).toBeLessThanOrEqual(choiceCountLimitOf(gated));
    const chips = engineChips(gated).map((c) => c.label);
    expect(chips).toEqual(set.options);
  });

  it('property: first-fight option set never exceeds choiceCountLimit (2..6)', () => {
    for (const limit of [2, 3, 4, 5, 6]) {
      const gated = openFirstFightGate(
        baseState({ houseRules: { ...DEFAULT_HOUSE_RULES, choiceCountLimit: limit } }),
        stalker,
      );
      const set = firstFightChoiceSet(gated);
      expect(set.options.length).toBeLessThanOrEqual(limit);
      expect(set.options.length).toBe(Math.min(limit, FIRST_FIGHT_OPTIONS.length));
    }
  });

  it('free text maps onto the same triad; Fight / Back off / Talk resolve', () => {
    expect(mapFirstFightIntent('attack the beast')).toBe('fight');
    expect(mapFirstFightIntent('run away')).toBe('back off');
    expect(mapFirstFightIntent('talk to it')).toBe('talk');
    const gated = openFirstFightGate(baseState(), stalker);
    const softName = softenFirstFightEncounter(stalker, gated).name;
    const fought = resolveFirstFightChoice(gated, FIGHT_CHIP);
    expect(fought.handled).toBe(true);
    expect(fought.state.activeEncounter?.name).toBeTruthy();
    expect(fought.state.pendingFirstFight).toBeNull();
    const backed = resolveFirstFightChoice(gated, BACK_OFF_CHIP);
    expect(backed.state.activeEncounter).toBeNull();
    expect(backed.state.sceneFacts?.pendingEncounter).toBeUndefined();
    const talked = resolveFirstFightChoice(gated, FIRST_FIGHT_TALK_CHIP);
    expect(talked.state.activeEncounter).toBeNull();
    expect(talked.state.sceneFacts?.present?.some((n) => n.toLowerCase() === softName.toLowerCase())).toBe(true);
  });

  it('weaker first foe: Wilds Stalker softens into Easy/Medium SRD CR (≤ Moderate 75 XP)', () => {
    const s = baseState();
    const soft = softenFirstFightEncounter(stalker, s);
    const block = firstFightStatBlock(soft, s);
    const medium = encounterXpBudget(1, 1, 1);
    const easy = encounterXpBudget(1, 1, 0);
    expect(medium).toBe(75);
    expect(easy).toBe(50);
    expect(crToXp(block.cr)).toBeLessThanOrEqual(medium);
    expect(crToXp(block.cr)).toBeLessThanOrEqual(easy);
    expect(crToXp(block.cr)).toBeLessThanOrEqual(25);
  });
});

describe('T10TABFIGHT no ghost Ask-foe stabilise', () => {
  it('after defeat, Ask Wilds Stalker to stabilise you is not offered', () => {
    const live = baseState({
      activeEncounter: stalker,
      sceneFacts: {
        crowd: 'sparse',
        noise: 'shouting',
        present: ['Wilds Stalker'],
        props: [],
        lastBeat: 'the beast dropped them flat',
        updatedTurn: 20,
      },
      character: {
        name: 'Jax',
        level: 1,
        hp: 0,
        maxHp: 10,
      },
    });
    const cleared = tickEncounterTerminal(live, 'wait', { playerDead: true });
    const dying = startDying({
      ...cleared.state,
      character: { ...cleared.state.character, hp: 0 },
    });
    expect(stabiliseHelpers(dying)).not.toContain('Wilds Stalker');
    const chips = roundCombatChips(dying) ?? [];
    expect(chips.some((c) => /Wilds Stalker/i.test(c))).toBe(false);
    expect(chips).toContain('Fight for breath');
  });
});
