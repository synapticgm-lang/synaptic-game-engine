/**
 * tt-build-questtargets — one block per item:
 * 1. a quest's targets are placed when it is made; steps inside a place go into rooms of that place's dungeon card,
 *    and quests that share a dungeon share the card;
 * 2. a step ticks only on the engine's find / meet at the target, never from a chip or an arrival;
 * 3. a dungeon holding an unfound target is never closed or reset: leaving keeps its state for the return;
 * 4. the quest log has no cap.
 * q31-L1 / RC-2: find/meet uses parsePlayerIntent + actionMatchesObjective (no SEARCH_VERB/TALK_VERB lists);
 * LitRPG places and ticks on the same path.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, Quest } from './types';
import type { GameEvent } from './parser';
import { applyTabletopQuestTurn, placeTabletopQuestTargets } from './tabletopQuestProgress';
import { actionMatchesObjective, findQuestTargets } from './questTargets';
import { openDungeonCard, parkDungeonCard } from './dungeonCard';
import { maybeAutoCloseDungeon } from './dungeonLifecycle';
import { applyStructuralEvents } from './structuralEvents';
import { TABLETOP_MAIN_SPINES, tabletopSpineToStarterQuest } from '@/data/quests/tabletopMainSpines';
import { parsePlayerIntent } from './intentParser';

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

const plea: Quest = {
  id: 'ck-quest-1',
  name: "The Woodcutter's Plea",
  description: 'Lina is missing.',
  status: 'active',
  revealed: true,
  type: 'side',
  location: 'Greyhollow Inn',
  objectives: [
    { id: 'p1', description: 'Speak with Oskar at the Greyhollow Inn', completed: true },
    { id: 'p2', description: "Search the keep's ground floor for signs of Lina", completed: false, place: 'Keep Gate', room: 'inside' },
    { id: 'p3', description: 'Discover the sealed crack in the great hall floor', completed: false, place: 'Keep Gate', room: 'hall' },
  ],
} as Quest;

const silas = { npcId: 'silas', npcName: 'Silas Thorne', disposition: 'neutral', facts: [], lastSeenTurn: 3, aliases: [], location: 'Greyhollow Inn' } as unknown as NonNullable<GameState['npcMemories']>[number];

const keepCard = (s: GameState) => s.places!.find((p) => p.name === 'Keep Gate')!.dungeonCard!;

describe('1 — targets placed when the quest is made', () => {
  it('every open step gets a target; inside steps of two quests land in rooms of the one Keep Gate card', () => {
    const s = placeTabletopQuestTargets(ck({ quests: [spineQuest('ck-spine-scholars-folly', 1), plea], currentLocation: 'Greyhollow Inn', npcMemories: [silas] } as Partial<GameState>));
    const folly = s.quests![0]!.objectives!;
    expect(folly[1]!.target).toMatchObject({ kind: 'person', name: 'Silas Thorne' });
    const inside = [folly[2]!, ...s.quests![1]!.objectives!.slice(1)].map((o) => o.target!);
    expect(s.places!.filter((p) => p.name === 'Keep Gate' && p.dungeonCard)).toHaveLength(1);
    const card = keepCard(s);
    for (const t of inside) {
      expect(t.place).toBe(card.siteName ?? card.dungeonName);
      expect(card.nodes.some((n) => n.id === t.nodeId)).toBe(true);
      expect(t.nodeId).not.toBe('r0');
    }
    // Placement is once: a second pass changes nothing.
    expect(placeTabletopQuestTargets(s)).toBe(s);
  });
});

describe('2 — a step ticks only on find / meet', () => {
  it('a chip away from the target or an arrival ticks nothing; searching the target room finds it', () => {
    const base = ck({ quests: [plea], currentLocation: 'Greyhollow Inn' } as Partial<GameState>);
    const away = applyTabletopQuestTurn(base, "Search the keep's ground floor for signs of Lina", 'Greyhollow Inn').state;
    expect(away.quests![0]!.objectives![1]!.completed).toBe(false);
    const arrived = applyTabletopQuestTurn({ ...away, currentLocation: 'Keep Gate' }, 'Travel toward Keep Gate', 'Greyhollow Inn').state;
    expect(arrived.quests![0]!.objectives!.map((o) => o.completed)).toEqual([true, false, false]);
    const inside = openDungeonCard(arrived, 'Keep Gate');
    expect(applyTabletopQuestTurn(inside, 'Search the room', inside.currentLocation).state.quests![0]!.objectives![1]!.completed).toBe(false);
    const t = inside.quests![0]!.objectives![1]!.target!;
    const there = { ...inside, activeDungeon: { ...inside.activeDungeon!, currentNodeId: t.nodeId! } };
    const found = applyTabletopQuestTurn(there, 'Search the room', there.currentLocation).state.quests![0]!.objectives![1]!;
    expect(found.completed).toBe(true);
    expect(found.target!.foundTurn).toBe(9);
  });

  it('q31-L1/RC-2: examine the altar ticks via intent class without a verb word list', () => {
    expect(parsePlayerIntent('Examine the altar').kind).toBe('observe');
    const step = {
      id: 'altar',
      description: 'Examine the altar',
      completed: false,
      verb: 'Examine',
      object: 'the altar',
      target: { kind: 'item' as const, name: 'the altar', place: 'Keep Gate' },
    };
    expect(actionMatchesObjective(step, 'Examine the altar')).toBe(true);
    expect(actionMatchesObjective(step, 'Look around')).toBe(true);
    expect(actionMatchesObjective(step, 'Talk to Oskar')).toBe(false);
    const at = ck({
      quests: [{ ...plea, objectives: [plea.objectives![0]!, step, plea.objectives![2]!] }],
      currentLocation: 'Keep Gate',
    } as Partial<GameState>);
    const ticked = findQuestTargets(at, 'Examine the altar');
    expect(ticked.state.quests![0]!.objectives![1]!.completed).toBe(true);
    expect(ticked.receipts[0]).toMatch(/Examine the altar/);
  });

  it('q31-L1: LitRPG places a one-step spine target and ticks on find at the pin', () => {
    const q: Quest = {
      id: 'sp-spine-alone-ruin-tether',
      name: 'Echoes of a Dead Summoner',
      description: 'Retrieve the research.',
      status: 'active',
      revealed: true,
      type: 'main',
      location: 'Collapsed Mage Tower',
      objectives: [
        {
          id: 'o1',
          description: "Find the mage's hidden vault key amidst the rubble of their destroyed sanctum.",
          completed: false,
        },
      ],
    } as Quest;
    const base = createInitialState(undefined, 'litrpg') as GameState;
    const s = {
      ...base,
      engineMode: 'litrpg' as const,
      campaignBibleId: 'summoned-pact',
      turn: 5,
      openingEstablishment: { ...(base.openingEstablishment ?? {}), complete: true },
      activeEncounter: null,
      quests: [q],
      currentLocation: 'Collapsed Mage Tower',
    } as GameState;
    const placed = placeTabletopQuestTargets(s);
    expect(placed.quests![0]!.objectives![0]!.target).toMatchObject({
      kind: 'item',
      place: 'Collapsed Mage Tower',
    });
    const miss = applyTabletopQuestTurn(placed, 'Wait', 'Collapsed Mage Tower').state;
    expect(miss.quests![0]!.objectives![0]!.completed).toBe(false);
    const found = applyTabletopQuestTurn(placed, 'Search the rubble', 'Collapsed Mage Tower').state;
    expect(found.quests![0]!.objectives![0]!.completed).toBe(true);
    expect(found.quests![0]!.objectives![0]!.target!.foundTurn).toBe(5);
  });
});

describe('3 — a dungeon holding an unfound target keeps its state', () => {
  it('leaving parks the card with rooms cleared and the target unfound; it never auto-closes and reopens as left', () => {
    const placed = placeTabletopQuestTargets(ck({ quests: [plea], currentLocation: 'Keep Gate' } as Partial<GameState>));
    const inside = openDungeonCard(placed, 'Keep Gate');
    const d = inside.activeDungeon!;
    const room = d.nodes.find((n) => n.id !== 'r0')!.id;
    const worked = { ...inside, activeDungeon: { ...d, visitedNodeIds: ['r0', room], clearedNodeIds: [room] } } as GameState;
    expect(maybeAutoCloseDungeon(worked).activeDungeon).toBe(worked.activeDungeon);
    for (const left of [
      parkDungeonCard(worked, { toSite: true }),
      applyStructuralEvents(worked, [{ type: 'dungeon-exit' } as GameEvent]).state,
    ]) {
      expect(left.activeDungeon ?? null).toBeNull();
      expect(keepCard(left).clearedNodeIds).toEqual([room]);
      expect(left.quests![0]!.objectives![1]!.target!.foundTurn).toBeUndefined();
      const back = openDungeonCard(left, 'Keep Gate');
      expect(back.activeDungeon!.clearedNodeIds).toEqual([room]);
      expect(back.activeDungeon!.visitedNodeIds).toEqual(['r0', room]);
      expect(back.activeDungeon!.nodes.map((n) => n.id)).toEqual(d.nodes.map((n) => n.id));
    }
  });

  it('a writer dungeon-load inside the card never replaces it', () => {
    const inside = openDungeonCard(placeTabletopQuestTargets(ck({ quests: [plea], currentLocation: 'Keep Gate' } as Partial<GameState>)), 'Keep Gate');
    const out = applyStructuralEvents(inside, [{ type: 'dungeon-load', dungeonName: 'Somewhere Else' } as GameEvent]).state;
    expect(out.activeDungeon).toBe(inside.activeDungeon);
  });
});

describe('4 — the quest log has no cap', () => {
  it('thirty open quests all stay and all get targets', () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ ...plea, id: `q${i}`, name: `Quest ${i}` }));
    const s = applyTabletopQuestTurn(ck({ quests: many, currentLocation: 'Greyhollow Inn' } as Partial<GameState>), 'Wait', 'Greyhollow Inn').state;
    expect(s.quests).toHaveLength(30);
    expect(s.quests!.every((q) => q.objectives![2]!.target?.nodeId)).toBe(true);
  });
});
