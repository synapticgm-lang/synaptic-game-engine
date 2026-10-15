/**
 * tt-fix-12 — one block per item:
 * 1. a kill pays from a CR and its XP line reaches STATUS (Order E.3: no "XP: none" for an engine-made foe);
 * 2. on the road the journey's meeting is who is there: no place local is handed to the writer;
 * 3. walking back into the room of a foe the player got away from starts the fight again.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { ActiveEncounter, GameState, Quest } from './types';
import { payEncounterXp } from './engineFight';
import { formatArcStatusReceipts, type ArcDirectorResult } from './arcDirector';
import { storyMinorRoles } from './closedScenePerson';
import { formatWriterInfoLayer } from './writerInfoLayer';
import { tabletopStepChip } from './tabletopQuestProgress';
import { maybeEnterInteriorDungeon } from './enterInterior';
import { advanceDungeonCard } from './dungeonCard';
import { TABLETOP_MAIN_SPINES, tabletopSpineToStarterQuest } from '@/data/quests/tabletopMainSpines';

function ck(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    turn: 11,
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true },
    activeEncounter: null,
    ...over,
  } as GameState;
}

describe('1 — no XP is said on STATUS', () => {
  // Order E.3: an engine-made foe with no card CR and no SRD block pays at the SRD budget CR for its level.
  it('a kill with no card CR pays the SRD budget CR for its level and STATUS shows it (lap 16 F T11, T21)', () => {
    const s = ck();
    const bats = { name: 'Pale Bat Swarm', hp: 0, maxHp: 13, level: 1, source: 'dungeon room', count: 1 } as unknown as ActiveEncounter;
    const paid = payEncounterXp(s, bats, 'defeated Pale Bat Swarm');
    expect(paid.receipts[0]).toMatch(/^XP Gained: 50 \(defeated Pale Bat Swarm — CR 1\/4 = 50 XP/);
    expect(formatArcStatusReceipts({ state: s, systemReceipts: paid.receipts } as unknown as ArcDirectorResult)).toContain(paid.receipts[0]);
  });

  it('a paid kill still shows XP Gained', () => {
    const s = ck();
    const spider = { name: 'Cave Spider', hp: 0, maxHp: 13, level: 1, source: 'dungeon room', count: 1, cr: '1/4' } as unknown as ActiveEncounter;
    const paid = payEncounterXp(s, spider, 'defeated Cave Spider');
    expect(paid.receipts[0]).toMatch(/^XP Gained: 50 /);
    expect(formatArcStatusReceipts({ state: s, systemReceipts: paid.receipts } as unknown as ArcDirectorResult)).toContain(paid.receipts[0]);
  });
});

describe('2 — the road has no place local', () => {
  const road = (journey: Record<string, unknown> | null) =>
    ck({
      currentLocation: 'On the road between places',
      journey,
      sceneFacts: { present: [], props: [], lastBeat: '', updatedTurn: 10 },
    } as unknown as Partial<GameState>);

  it('a quiet stretch hands the writer no unnamed traveller (lap 16 A T5, C T6, D T13)', () => {
    const s = road({ from: 'Greyhollow Graveyard', to: 'Greyhollow Inn', legsDone: 1, legsTotal: 2, ground: 'Back streets', terrain: 'streets', hoursPerLeg: 0.5 });
    expect(storyMinorRoles(s)).toEqual([]);
    expect(formatWriterInfoLayer(s)).not.toMatch(/Unnamed local/);
  });

  it('a named lane with no journey still has its local', () => {
    expect(storyMinorRoles(ck({ currentLocation: 'Greyhollow mill lane' }))).toEqual(['traveler']);
  });
});

describe('3 — a foe the player got away from is still in its room', () => {
  function insideKeep(): GameState {
    const seed = tabletopSpineToStarterQuest(TABLETOP_MAIN_SPINES.find((x) => x.spineId === 'ck-spine-barred-oak')!);
    const quest = {
      id: seed.id,
      name: seed.title,
      status: 'active',
      revealed: true,
      type: 'main',
      location: seed.location,
      objectives: seed.objectives.map((d, i) => {
        const { people, ...rest } = seed.objectiveAnchors?.[i] ?? {};
        return { id: `${seed.id}-obj-${i + 1}`, description: d, completed: i < 2, ...rest, ...(people?.length ? { people } : {}) };
      }),
    } as Quest;
    const s = ck({ quests: [quest], currentLocation: 'Keep Gate' } as Partial<GameState>);
    return maybeEnterInteriorDungeon(s, tabletopStepChip(s)!);
  }

  it('walking back in spawns the parked foe (lap 16 E T18)', () => {
    const s = insideKeep();
    const d = s.activeDungeon!;
    const here = d.nodes.find((n) => n.id === d.currentNodeId)!;
    const room = here.connections.map((id) => d.nodes.find((n) => n.id === id)!).find((n) => n.hidden?.mobs?.length)!;
    expect(room).toBeTruthy();
    const mob = room.hidden!.mobs[0]!;
    const parked: GameState = {
      ...s,
      activeDungeon: {
        ...d,
        visitedNodeIds: Array.from(new Set([...d.visitedNodeIds, room.id])),
        nodes: d.nodes.map((n) =>
          n.id === room.id ? { ...n, hidden: { ...n.hidden!, mobs: n.hidden!.mobs.map((m) => (m.id === mob.id ? { ...m, spawned: true, hpRemaining: 6 } : m)) } } : n
        ),
      },
    };
    const back = advanceDungeonCard(parked, `Go to the ${room.name}`);
    expect(back.state.activeEncounter?.name).toBe(mob.name);
    expect(back.state.activeEncounter?.hp).toBe(6);
    const stay = advanceDungeonCard(back.state.activeDungeon ? { ...back.state, activeEncounter: null } : back.state, 'Wait and listen');
    expect(stay.state.activeEncounter).toBeNull();
  });
});
