/**
 * 29z3 — people remember the player from their info sheet; Fallout-style skill gates on doors
 * and safes use the existing check skills; each level-up changes what the player can do.
 * Tester P0s catch a forgotten sheet, a level-up that changes nothing, and a lock opened with no skill.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { ActiveDungeonState } from './mapEngine';
import { isDoorLockedFor, moveToNode } from './mapEngine';
import { skillRankOf, skillRanksOf } from './skillRanks';
import {
  canDoKeys,
  gateChipProblem,
  gateFactLines,
  grantLevelSkills,
  lockedContainerBlocksGain,
  locksOpenedWithoutSkill,
} from './skillGates';
import { openSeededLootable } from './looseItems';
import { chipProblem } from './chipLegality';
import { buildCompletedEventPacket, formatWriterFacingEvent } from './completedEventPacket';
import { formatWriterInfoLayer } from './writerInfoLayer';
import { sheetMemoryLine } from './npcRecords';
import { checkLevelUpChanges, checkPlayerTurn, checkSheetMemory } from './turnCheck';
import type { GameState, NpcMemory } from './types';

function dungeon(): ActiveDungeonState {
  const hidden = (over: Record<string, unknown> = {}) => ({ traps: [], lootables: [], secrets: [], mobs: [], ...over });
  return {
    blueprintId: 'bp-test',
    dungeonName: 'Test Cellar',
    tier: 4,
    dangerTier: 1,
    currentZLevel: 0,
    currentNodeId: 'a',
    visitedNodeIds: ['a'],
    clearedNodeIds: [],
    nodes: [
      {
        id: 'a',
        name: 'Entry Hall',
        description: 'A low hall.',
        connections: ['b', 'c'],
        hidden: hidden({
          lootables: [
            { id: 'safe1', label: 'iron safe', opened: false, loot: { rarity: 'common', qty: 1, gold: 5, grade: 2 }, lock: { skill: 'thievery', rank: 1 } },
          ],
        }),
      },
      {
        id: 'b',
        name: 'Store Room',
        description: 'Shelves.',
        connections: ['a'],
        hidden: hidden({ doorLock: { skill: 'athletics', rank: 1 } }),
      },
      { id: 'c', name: 'Passage', description: 'A passage.', connections: ['a'], hidden: hidden() },
    ],
  } as unknown as ActiveDungeonState;
}

function base(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    seed: 'z3g',
    engineMode: 'litrpg',
    currentLocation: 'Test Cellar',
    activeEncounter: null,
    activeDungeon: dungeon(),
    quests: [],
    npcMemories: [],
    companions: [],
    turn: 12,
    character: { ...s.character, name: 'Rook', level: 1, skills: undefined, skillsGrantedThrough: undefined },
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true } as GameState['openingEstablishment'],
    ...over,
  };
}

const metSheet: NpcMemory = {
  npcId: 'n1',
  npcName: 'Mara Quell',
  disposition: 'friendly',
  facts: ['Sold the player a lantern'],
  lastSeenTurn: 6,
  introSpoken: true,
  meetCount: 2,
  knownPlayerName: 'Rook',
  location: 'Test Cellar',
} as NpcMemory;

describe('29z3 info-sheet memory', () => {
  it('sheet line says who they met, the name they know and what they remember', () => {
    const line = sheetMemoryLine(metSheet, 'Rook');
    expect(line).toMatch(/Mara Quell has met Rook before \(2 times\)/);
    expect(line).toMatch(/knows them as Rook/);
    expect(line).toMatch(/Sold the player a lantern/);
    expect(line).toMatch(/no introducing themselves again/);
    expect(sheetMemoryLine({ ...metSheet, introSpoken: false, meetCount: 0, met: false } as NpcMemory, 'Rook')).toBe('');
  });

  it('the writer packet and info layer carry the sheet of people here', () => {
    const s = base({ npcMemories: [metSheet] });
    const packet = formatWriterFacingEvent(buildCompletedEventPacket(s, 'Talk to Mara Quell'));
    expect(packet).toMatch(/INFO SHEETS/);
    expect(packet).toMatch(/Mara Quell has met Rook before/);
    expect(formatWriterInfoLayer(s)).toMatch(/Mara Quell has met Rook before/);
  });

  it('tester P0s a person with a sheet who acts as if they never met the player', () => {
    const s = base({ npcMemories: [metSheet] });
    expect(checkSheetMemory(s, 'Mara Quell smiles. "I am Mara Quell, keeper of this cellar."')[0]?.kind).toBe('sheet-forgotten');
    expect(checkSheetMemory(s, 'Mara Quell squints. "And what is your name, traveler?"')[0]?.kind).toBe('sheet-forgotten');
    expect(checkSheetMemory(s, 'Mara Quell frowns as if she has never seen you before.')[0]?.kind).toBe('sheet-forgotten');
    expect(checkSheetMemory(s, 'Mara Quell nods. "Back again, Rook. The lantern holding up?"')).toEqual([]);
    const fresh = base({ npcMemories: [{ ...metSheet, introSpoken: false, meetCount: 0 } as NpcMemory] });
    expect(checkSheetMemory(fresh, 'Mara Quell smiles. "I am Mara Quell, keeper of this cellar."')).toEqual([]);
  });
});

describe('29z3 skill gates on doors and safes', () => {
  it('ranks come from the existing check skills; granted ranks win', () => {
    const s = base();
    expect(skillRankOf(s.character, 'thievery')).toBe(0);
    expect(skillRankOf({ ...s.character, skills: { thievery: 2 } }, 'thievery')).toBe(2);
  });

  it('a locked door stays shut until the rank is there', () => {
    const d = dungeon();
    expect(isDoorLockedFor(d, 'b', { athletics: 0 })).toBe(true);
    expect(moveToNode(d, 'b', { athletics: 0 }).currentNodeId).toBe('a');
    const moved = moveToNode(d, 'b', { athletics: 1 });
    expect(moved.currentNodeId).toBe('b');
    expect(moved.nodes.find((n) => n.id === 'b')?.tags).toContain('door-opened');
    expect(isDoorLockedFor(moved, 'b', { athletics: 0 })).toBe(false);
  });

  it('a locked safe stays shut without the skill and opens with it', () => {
    const shut = openSeededLootable(base(), 'Open the iron safe');
    expect(shut.receipts.join(' ')).toMatch(/iron safe is locked\. It needs Thievery 1 \(you have 0\); it stays shut/);
    expect(shut.state.activeDungeon?.nodes[0]?.hidden?.lootables[0]?.opened).toBe(false);
    expect(shut.state.skillGateTries?.[0]?.skill).toBe('thievery');
    const s = base();
    const open = openSeededLootable({ ...s, character: { ...s.character, skills: { thievery: 1 } } }, 'Open the iron safe');
    expect(open.state.activeDungeon?.nodes[0]?.hidden?.lootables[0]?.opened).toBe(true);
    expect(open.receipts.join(' ')).toMatch(/Thievery 1 opened the lock/);
  });

  it('GM loot from a locked safe is blocked; chips that open it are illegal', () => {
    const s = base();
    expect(lockedContainerBlocksGain(s, 'I loot the iron safe')).toBe('iron safe');
    expect(gateChipProblem(s, 'Open the iron safe')).toMatch(/needs Thievery 1/);
    expect(gateChipProblem(s, 'Force the door to Store Room')).toMatch(/needs Athletics 1/);
    expect(chipProblem(s, 'Open the iron safe')).toBeTruthy();
    const skilled = { ...s, character: { ...s.character, skills: { thievery: 1 } } };
    expect(gateChipProblem(skilled, 'Open the iron safe')).toBeNull();
  });

  it('the writer is told which locks stay shut', () => {
    const lines = gateFactLines(base());
    expect(lines.join(' ')).toMatch(/iron safe is locked \(needs Thievery 1\); the player lacks it/);
    expect(lines.join(' ')).toMatch(/door to Store Room is locked \(needs Athletics 1\)/);
  });
});

describe('29z3 level-up changes what the player can do', () => {
  it('a level grants a rank toward the lock the player tried, with a receipt', () => {
    const tried = openSeededLootable(base(), 'Open the iron safe').state;
    const leveled = { ...tried, character: { ...tried.character, level: 2 } };
    const { state, receipts } = grantLevelSkills(leveled, 1);
    expect(state.character.skills?.thievery).toBe(1);
    expect(receipts[0]).toMatch(/^Level 2: Thievery rank 1 — you can now pick locks and crack safes/);
    expect(receipts.join(' ')).toMatch(/Now within reach: the iron safe/);
    expect(grantLevelSkills(state, 1).receipts).toEqual([]);
  });

  it('every level gained grants one rank', () => {
    const s = base();
    const { state, receipts } = grantLevelSkills({ ...s, character: { ...s.character, level: 4 } }, 1);
    expect(receipts.filter((r) => /^Level \d/.test(r))).toHaveLength(3);
    expect(state.character.skillsGrantedThrough).toBe(4);
  });

  it('tester P0s a level-up that changes nothing and passes one that grants a rank', () => {
    const before = base();
    const hollow = { ...before, character: { ...before.character, level: 2, skills: skillRanksOf(before.character) } };
    const blank = { ...before, character: { ...before.character, skills: skillRanksOf(before.character) } };
    expect(checkLevelUpChanges(blank, hollow)[0]?.kind).toBe('levelup-no-change');
    const granted = grantLevelSkills({ ...before, character: { ...before.character, level: 2 } }, 1).state;
    expect(checkLevelUpChanges(before, granted)).toEqual([]);
    expect(canDoKeys(granted).some((k) => !canDoKeys(before).includes(k))).toBe(true);
  });

  it('tester P0s a lock that opened with no skill', () => {
    const before = base();
    const d = dungeon();
    const safe = d.nodes[0]!.hidden!.lootables[0]!;
    safe.opened = true;
    d.currentNodeId = 'b';
    const after = { ...before, activeDungeon: d };
    const found = locksOpenedWithoutSkill(before, after);
    expect(found.join(' ')).toMatch(/iron safe opened without Thievery 1/);
    expect(found.join(' ')).toMatch(/door to Store Room opened without Athletics 1/);
    const row = checkPlayerTurn(before, after, { playerInput: 'Open the iron safe', gmText: 'The safe swings open.' } as never);
    expect(row.p0.some((f) => f.kind === 'lock-without-skill')).toBe(true);
  });
});
