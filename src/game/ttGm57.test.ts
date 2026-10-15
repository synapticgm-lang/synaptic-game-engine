/**
 * Order G-m57 — a site objective opens the interior from the quest record (targetSpot 'door'),
 * not from ENTER_ACTION / INTERIOR_CUE word lists. Talk never enters. Persists on the dungeon card.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, Quest } from './types';
import { TABLETOP_MAIN_SPINES, tabletopSpineToStarterQuest } from '@/data/quests/tabletopMainSpines';
import { maybeEnterInteriorDungeon, objectiveOpensInterior } from './enterInterior';
import { placeTabletopQuestTargets, applyTabletopQuestTurn } from './tabletopQuestProgress';
import { targetSpot } from './questTargets';
import { parkDungeonCard } from './dungeonCard';
import { storyChip } from './choiceRanking';

function ck(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    turn: 9,
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true },
    activeEncounter: null,
    ...over,
  } as GameState;
}

function spineQuest(spineId: string, done: number): Quest {
  const seed = tabletopSpineToStarterQuest(TABLETOP_MAIN_SPINES.find((x) => x.spineId === spineId)!);
  return {
    id: seed.id,
    name: seed.title,
    description: seed.description,
    status: 'active',
    revealed: true,
    type: 'main',
    location: seed.location,
    objectives: seed.objectives.map((d, i) => {
      const { people, ...rest } = seed.objectiveAnchors?.[i] ?? {};
      return { id: `${seed.id}-obj-${i + 1}`, description: d, completed: i < done, ...rest, ...(people?.length ? { people } : {}) };
    }),
  } as Quest;
}

describe('G-m57 site objective opens the interior', () => {
  it('targetSpot is door at the gate; taking the inside-step chip opens the keep (not ENTER_ACTION)', () => {
    const raw = ck({
      quests: [spineQuest('ck-spine-scholars-folly', 2)],
      currentLocation: 'Keep Gate',
      npcMemories: [{ npcId: 'silas', npcName: 'Silas', location: 'Keep Gate', disposition: 'neutral', facts: [], lastSeenTurn: 0, roleHint: 'quest-patron', aliases: [], met: true, present: true }],
    } as Partial<GameState>);
    const s = placeTabletopQuestTargets(raw);
    const step = s.quests![0]!.objectives![2]!;
    expect(targetSpot(s, step)).toBe('door');
    const chip = storyChip(s);
    expect(chip).toBe('Recover the lost survey journals');
    expect(objectiveOpensInterior(s, chip!)).toBe(true);
    // No enter word — the quest record alone opens.
    expect(/\benter\b/i.test(chip!)).toBe(false);
    const inside = maybeEnterInteriorDungeon(s, chip!);
    expect(inside.activeDungeon).toBeTruthy();
    expect(inside.activeDungeon!.siteName ?? inside.activeDungeon!.dungeonName).toMatch(/Keep Gate/i);
    expect(inside.currentLocation).toMatch(/^Keep Gate [—–] /);
  });

  it('a talk chip at the site never opens the interior (m57 fix-1)', () => {
    const s = ck({
      currentLocation: 'Keep Gate',
      quests: [spineQuest('ck-spine-scholars-folly', 2)],
    } as Partial<GameState>);
    expect(objectiveOpensInterior(s, 'Ask what they want')).toBe(false);
    expect(maybeEnterInteriorDungeon(s, 'Ask what they want').activeDungeon).toBeFalsy();
  });

  it('examine / look around at the gate does not open; enter move does', () => {
    const s = placeTabletopQuestTargets(ck({
      quests: [spineQuest('ck-spine-scholars-folly', 2)],
      currentLocation: 'Keep Gate',
    } as Partial<GameState>));
    expect(objectiveOpensInterior(s, 'Examine the keep gate')).toBe(false);
    expect(objectiveOpensInterior(s, 'Look around')).toBe(false);
    expect(maybeEnterInteriorDungeon(s, 'Look around').activeDungeon).toBeFalsy();
    const entered = maybeEnterInteriorDungeon(s, 'Enter the keep');
    expect(entered.activeDungeon).toBeTruthy();
  });

  it('opening persists across park and re-open (same card, not reseeded)', () => {
    const s = placeTabletopQuestTargets(ck({
      quests: [spineQuest('ck-spine-scholars-folly', 2)],
      currentLocation: 'Keep Gate',
    } as Partial<GameState>));
    const chip = storyChip(s)!;
    const inside = maybeEnterInteriorDungeon(s, chip);
    const roomId = inside.quests![0]!.objectives![2]!.target!.nodeId!;
    const walked = {
      ...inside,
      activeDungeon: { ...inside.activeDungeon!, currentNodeId: roomId, visitedNodeIds: [...(inside.activeDungeon!.visitedNodeIds ?? []), roomId] },
    };
    const parked = parkDungeonCard(walked);
    expect(parked.activeDungeon).toBeFalsy();
    const place = (parked.places ?? []).find((p) => /Keep Gate/i.test(p.name));
    expect(place?.dungeonCard).toBeTruthy();
    expect(place!.dungeonCard!.nodes.some((n) => n.id === roomId)).toBe(true);
    const again = maybeEnterInteriorDungeon({ ...parked, currentLocation: 'Keep Gate' }, chip);
    expect(again.activeDungeon!.nodes.map((n) => n.id).sort()).toEqual(place!.dungeonCard!.nodes.map((n) => n.id).sort());
  });

  it('LitRPG door-step Clear the infestation at the undercroft enters; Wait does not', () => {
    const quest = {
      id: 'sp-spine-test',
      name: 'The Crown’s Meat Shield',
      status: 'active',
      revealed: true,
      location: 'Cathedral Undercroft',
      objectives: [{
        id: 'o1',
        description: 'Clear the infestation in the cathedral’s lower crypts to prove your baseline stats.',
        completed: false,
        place: 'Cathedral Undercroft',
        room: 'inside',
      }],
    } as unknown as Quest;
    const base = createInitialState(undefined, 'litrpg') as GameState;
    const s = {
      ...base,
      engineMode: 'litrpg' as const,
      campaignBibleId: 'summoned-pact',
      turn: 5,
      openingEstablishment: { ...(base.openingEstablishment ?? {}), complete: true },
      currentLocation: 'Cathedral Undercroft',
      quests: [quest],
    } as GameState;
    expect(maybeEnterInteriorDungeon(s, 'Clear the infestation').activeDungeon).toBeTruthy();
    expect(maybeEnterInteriorDungeon(s, 'Wait and watch').activeDungeon).toBeFalsy();
  });

  it('the inside step still ticks only in its room, not at the door (L1 / questtargets)', () => {
    const s = placeTabletopQuestTargets(ck({
      quests: [spineQuest('ck-spine-scholars-folly', 2)],
      currentLocation: 'Keep Gate',
    } as Partial<GameState>));
    const chip = storyChip(s)!;
    const inside = maybeEnterInteriorDungeon(s, chip);
    const atDoor = applyTabletopQuestTurn(inside, chip, 'Keep Gate').state;
    expect(atDoor.quests![0]!.status).toBe('active');
    const room = atDoor.quests![0]!.objectives![2]!.target!.nodeId!;
    const there = { ...atDoor, activeDungeon: { ...atDoor.activeDungeon!, currentNodeId: room } };
    const turn = applyTabletopQuestTurn(there, chip, there.currentLocation);
    expect(turn.state.quests![0]!.status).toBe('completed');
  });
});
