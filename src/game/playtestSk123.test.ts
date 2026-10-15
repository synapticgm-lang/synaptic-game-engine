/**
 * q31-SK123 — SK-1 hidden ranks every skill counts; SK-2 distinct skills per dangling pair;
 * SK-3 individual stealth everywhere.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { ActiveDungeonState } from './mapEngine';
import { isDoorLockedFor, moveToNode } from './mapEngine';
import { openSeededLootable } from './looseItems';
import {
  allGates,
  gateOpenFor,
  grantLevelSkills,
  skillGateBlockedLine,
} from './skillGates';
import { skillRankOf } from './skillRanks';
import { clampSystemHousing, hidesPart, type SystemPartId, SYSTEM_PART_IDS } from './systemHousing';
import type { GameState } from './types';
import { ALL_DISTINCT_SKILLS, DISTINCT_PAIRS, matchBaseSkill, skillByJob } from './rules/librarySkills';
import { individualStealth } from './rules/roundCombat';

const SKILLS_OFF = clampSystemHousing({
  housing: 'worn_device',
  parts: Object.fromEntries(SYSTEM_PART_IDS.map((p) => [p, false])) as Record<SystemPartId, boolean>,
});

function dungeon(): ActiveDungeonState {
  const hidden = (over: Record<string, unknown> = {}) => ({ traps: [], lootables: [], secrets: [], mobs: [], ...over });
  return {
    blueprintId: 'bp-sk123',
    dungeonName: 'Skill Cellar',
    tier: 4,
    dangerTier: 1,
    currentZLevel: 0,
    currentNodeId: 'a',
    visitedNodeIds: ['a'],
    clearedNodeIds: [],
    nodes: [
      {
        id: 'a',
        name: 'Entry',
        description: 'Entry.',
        connections: ['b'],
        hidden: hidden({
          lootables: [
            { id: 'safe1', label: 'iron safe', opened: false, loot: { rarity: 'common', qty: 1, gold: 5, grade: 2 }, lock: { skill: 'thievery', rank: 1 } },
          ],
        }),
      },
      {
        id: 'b',
        name: 'Climb Shaft',
        description: 'A shaft.',
        connections: ['a'],
        hidden: hidden({ doorLock: { skill: 'athletics', rank: 1 } }),
      },
    ],
  } as unknown as ActiveDungeonState;
}

function base(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    seed: 'sk123',
    engineMode: 'litrpg',
    systemHousing: SKILLS_OFF,
    currentLocation: 'Skill Cellar',
    activeEncounter: null,
    activeDungeon: dungeon(),
    companions: [],
    turn: 8,
    character: { ...s.character, name: 'Rook', level: 1, skills: {}, skillsGrantedThrough: 1 },
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true } as GameState['openingEstablishment'],
    ...over,
  };
}

describe('SK-1: hidden ranks, every skill counts', () => {
  it('skills off: housing hides skills, but thievery and athletics ranks both change gate results', () => {
    const s = base();
    expect(hidesPart(s.systemHousing, 'skills')).toBe(true);
    const thieveryGate = allGates(s).find((g) => g.lock.skill === 'thievery')!;
    const athleticsGate = allGates(s).find((g) => g.lock.skill === 'athletics')!;
    expect(gateOpenFor(s, thieveryGate)).toBe(false);
    expect(gateOpenFor(s, athleticsGate)).toBe(false);

    const withThievery = { ...s, character: { ...s.character, skills: { thievery: 1 } } };
    expect(gateOpenFor(withThievery, thieveryGate)).toBe(true);
    expect(gateOpenFor(withThievery, athleticsGate)).toBe(false);
    expect(skillRankOf(withThievery.character, 'thievery')).toBe(1);

    const withAthletics = { ...s, character: { ...s.character, skills: { athletics: 1 } } };
    expect(gateOpenFor(withAthletics, athleticsGate)).toBe(true);
    expect(gateOpenFor(withAthletics, thieveryGate)).toBe(false);
    expect(isDoorLockedFor(withAthletics.activeDungeon!, 'b', { athletics: 1 })).toBe(false);
    expect(moveToNode(withAthletics.activeDungeon!, 'b', { athletics: 1 }).currentNodeId).toBe('b');
  });

  it('skills off: lock receipts and level-up grants print no skill numbers', () => {
    const s = base();
    const shut = openSeededLootable(s, 'Open the iron safe');
    expect(shut.receipts.join(' ')).toMatch(/iron safe is locked; it stays shut/);
    expect(shut.receipts.join(' ')).not.toMatch(/Thievery|Athletics|rank|\(you have/);
    expect(skillGateBlockedLine('The door', { skill: 'athletics', rank: 1 }, s)).toBe(
      'The door is locked; it stays shut.',
    );

    const leveled = { ...s, character: { ...s.character, level: 2 } };
    const { state, receipts } = grantLevelSkills(leveled, 1);
    expect(state.character.skills?.thievery ?? state.character.skills?.athletics ?? 0).toBeGreaterThanOrEqual(1);
    expect(receipts).toEqual([]);
  });
});

describe('SK-2: two distinct skills per dangling name pair', () => {
  it('every overlapping pair skill has a non-empty job', () => {
    for (const skill of ALL_DISTINCT_SKILLS) {
      expect(skill.job.trim().length, skill.name).toBeGreaterThan(0);
    }
    expect(DISTINCT_PAIRS).toHaveLength(2);
  });

  it('Athletics / Brawling: climb and punch never swap', () => {
    expect(skillByJob('climb the wall')?.id).toBe('athletics');
    expect(skillByJob('swim the channel')?.id).toBe('athletics');
    expect(skillByJob('jump the ditch')?.id).toBe('athletics');
    expect(skillByJob('grapple the guard')?.id).toBe('brawling');
    expect(skillByJob('punch the thug')?.id).toBe('brawling');
    const s = base();
    expect(matchBaseSkill(s, 'climb the cliff')?.identity.id).toBe('athletics');
    expect(matchBaseSkill(s, 'punch the bandit')?.identity.id).toBe('brawling');
  });

  it('Endurance Stride / Long Stride: march and single stride never swap', () => {
    expect(skillByJob('march all day with a pack')?.id).toBe('endurance_stride');
    expect(skillByJob('long stride across the gap')?.id).toBe('long_stride');
    expect(skillByJob('leap the chasm')?.id).toBe('long_stride');
    const s = base();
    expect(matchBaseSkill(s, 'keep the pace on the road')?.identity.id).toBe('endurance_stride');
    expect(matchBaseSkill(s, 'cover ground with a long stride')?.identity.id).toBe('long_stride');
  });
});

describe('SK-3: stealth is individual everywhere', () => {
  it('TT: stealth 14 vs Passive Perception 12 and 15 is noticed (seen by the second)', () => {
    const r = individualStealth(
      [{ name: 'Jax', stealthTotal: 14 }],
      [
        { name: 'Guard A', passivePerception: 12 },
        { name: 'Guard B', passivePerception: 15 },
      ],
    );
    expect(r.rows).toHaveLength(2);
    expect(r.rows[0]).toMatchObject({ seen: false, perception: 12 });
    expect(r.rows[1]).toMatchObject({ seen: true, perception: 15 });
    expect(r.noticed).toBe(true);
  });

  it('LR: player succeeds and companion fails — noticed; two rolls', () => {
    const r = individualStealth(
      [
        { name: 'Rook', stealthTotal: 16 },
        { name: 'Mara', stealthTotal: 9 },
      ],
      [{ name: 'Sentry', passivePerception: 12 }],
    );
    expect(r.rows).toHaveLength(2);
    expect(r.rows.find((x) => x.sneaker === 'Rook')?.seen).toBe(false);
    expect(r.rows.find((x) => x.sneaker === 'Mara')?.seen).toBe(true);
    expect(r.noticed).toBe(true);
  });
});
