/**
 * tt-fix-16 — playability roots from lap 20:
 * 1. a forced march that reaches Exhaustion 6 stops there: death is on the writer's facts, nothing is rolled after it,
 *    and the push-on pad names the hour and what a failed save costs (lap 20 N6, N10);
 * 2. Help them settles the plea: the writer is told what the help was, and food comes out of the pack (lap 20 N7);
 * 3. a flee falls back into a room with no live foe first; a foe in the room fled into meets the player (lap 20 N9).
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { commitTravel, journeyPads, travelBeatFact, worldClock } from './travelJourney';
import { tabletopStepChip } from './tabletopQuestProgress';
import { maybeEnterInteriorDungeon } from './enterInterior';
import { advanceDungeonCard } from './dungeonCard';
import { TABLETOP_MAIN_SPINES, tabletopSpineToStarterQuest } from '@/data/quests/tabletopMainSpines';
import type { GameState, Item, Quest, RoadEncounter } from './types';

function keepState(seed: string, over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s,
    seed,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    currentLocation: 'Greyhollow Inn',
    worldAtlas: null,
    activeEncounter: null,
    journey: null,
    turn: 9,
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true },
    sceneFacts: s.sceneFacts ? { ...s.sceneFacts, pendingEncounter: undefined } : s.sceneFacts,
    ...over,
  } as GameState;
}

/** A started trip with no meeting live and `roadHours` already walked today. */
function quietTrip(seed: string, roadHours: number, over: Partial<GameState> = {}): GameState {
  for (let i = 0; i < 200; i++) {
    const t = commitTravel(keepState(`${seed}-${i}`, over), 'Travel toward Blackspine Treeline');
    const j = t.state.journey;
    if (!j || j.encounter || j.legsDone >= j.legsTotal - 1) continue;
    return { ...t.state, roadDay: { since: worldClock(t.state), hours: roadHours } };
  }
  throw new Error('no quiet trip');
}

describe('1 — the forced march stops at death', () => {
  it('Exhaustion 6 is death on the facts, and no save, weather or navigation is rolled after it (lap 20 F T14)', () => {
    let died: ReturnType<typeof commitTravel> | null = null;
    for (let i = 0; i < 80 && !died; i++) {
      const s = quietTrip(`march-${i}`, 10);
      const worn = { ...s, character: { ...s.character, exhaustion: 5 } };
      const push = journeyPads(worn)[1]!;
      expect(push).toMatch(/^Push on into the \w+, but one failed save now kills you$/);
      const out = commitTravel(worn, push);
      if (out.state.deathSaves?.dead) died = out;
    }
    expect(died).not.toBeNull();
    const extra = died!.extra ?? [];
    const death = extra.findIndex((l) => /, death$/.test(l));
    expect(death).toBe(extra.length - 1);
    expect(extra.some((l) => /^(?:Weather|Navigation|Lost):/.test(l))).toBe(false);
    expect(travelBeatFact(died!.state)).toMatch(/You are dead\./);
    expect(died!.receipt).toMatch(/you died on the road/);
  });

  it('a push-on pad below the last level names the hour, not "the night"', () => {
    const s = quietTrip('noon', 8, { worldHour: 10 });
    const at = { ...s, worldHour: 10 };
    expect(journeyPads(at)[1]).toBe('Push on into the morning, but each failed save wears you down more');
  });
});

describe('2 — Help them settles the plea', () => {
  function plea(want: string, inventory: Item[]): GameState {
    const s = quietTrip('plea', 2);
    const encounter: RoadEncounter = { kind: 'plea', level: 1, stretch: s.journey!.legsDone, dangerous: false, want };
    return { ...s, inventory, journey: { ...s.journey!, encounter } };
  }

  it('the writer is told what the help was (lap 20 A T6)', () => {
    const out = commitTravel(plea('a child is lost and asks the way home', []), 'Help them');
    expect(travelBeatFact(out.state)).toBe('You showed the lost child the way home.');
    expect(out.state.journey!.encounter!.engaged).toBe(true);
  });

  it('food comes out of the pack; with none, the pilgrim goes on hungry (lap 20 D T12)', () => {
    const fed = commitTravel(plea('a pilgrim asks for food', [{ id: 'r', name: 'Rations (3 days)', rarity: 'Common', quantity: 1 }]), 'Help them');
    expect(fed.state.inventory!.some((it) => /Rations \(2 days\)/.test(it.name))).toBe(true);
    expect(travelBeatFact(fed.state)).toMatch(/gave the pilgrim a day of your rations/);
    const empty = commitTravel(plea('a pilgrim asks for food', []), 'Help them');
    expect(travelBeatFact(empty.state)).toMatch(/no food to give the pilgrim/);
    expect(empty.state.journey!.encounter!.engaged).toBe(false);
    expect(empty.receipt).toMatch(/passed by someone in need/);
  });
});

describe('3 — a flee lands in a room, and that room\'s foe is there', () => {
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
    const s = keepState('flee', { quests: [quest], currentLocation: 'Keep Gate', turn: 11 } as Partial<GameState>);
    return maybeEnterInteriorDungeon(s, tabletopStepChip(s)!);
  }

  it('fleeing into the room of a foe got away from earlier meets it (lap 20 A T16)', () => {
    const s = insideKeep();
    const d = s.activeDungeon!;
    const start = d.nodes.find((n) => n.id === d.currentNodeId)!;
    const room = start.connections.map((id) => d.nodes.find((n) => n.id === id)!).find((n) => n.hidden?.mobs?.length)!;
    const mob = room.hidden!.mobs[0]!;
    const parked = { ...mob, id: `${mob.id}-parked`, name: 'Parked Rat', spawned: true, hpRemaining: 2 };
    const inRoom: GameState = {
      ...s,
      currentLocation: `${d.dungeonName} — ${room.name}`,
      activeDungeon: {
        ...d,
        currentNodeId: room.id,
        visitedNodeIds: Array.from(new Set([...d.visitedNodeIds, start.id, room.id])),
        nodes: d.nodes.map((n) => {
          if (n.id === room.id) return { ...n, hidden: { ...n.hidden!, mobs: n.hidden!.mobs.map((m) => ({ ...m, spawned: true })) } };
          if (n.id === start.id) return { ...n, hidden: { ...(n.hidden ?? { mobs: [] }), mobs: [...(n.hidden?.mobs ?? []), parked] } };
          return n;
        }),
      } as GameState['activeDungeon'],
    };
    const out = advanceDungeonCard(inRoom, 'Flee', [`Encounter cleared: ${mob.name} — escaped`]);
    expect(out.receipts.some((r) => r.startsWith(`Dungeon: you fell back into ${start.name}`))).toBe(true);
    expect(out.state.activeEncounter?.name).toBe('Parked Rat');
    expect(out.state.activeEncounter?.hp).toBe(2);
  });
});
