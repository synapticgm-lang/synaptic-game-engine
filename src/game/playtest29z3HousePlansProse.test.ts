/**
 * 29z3 — building plans read like a packed house map (shared walls, doors, stairs, a way out, windows);
 * open ground stays one floor; chips follow the scene; tester P0s catch broken prose and ignored
 * actions; painted names survive the warden. No live GM call.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import {
  GRAND_LAYOUTS,
  RUIN_LAYOUTS,
  SHED_LAYOUTS,
  buildInteriorFloorPlan,
  isRooflessPlace,
  type ActiveDungeonState,
  type InteriorRoomSpec,
} from './mapEngine';
import { INSIDE_TEMPLATES, VEHICLE_TEMPLATES } from './placeTemplates';
import { exteriorDoor, floorPlanIssues, packFloorRooms, windowMarks } from './floorPlan';
import { scrubSlotGlue } from './slotGlue';
import { renderTokenBeat } from './tokenProse';
import type { LedgerRef } from './completedEventPacket';
import { formatWriterFacingEvent, buildCompletedEventPacket } from './completedEventPacket';
import { chipProblem, legalChips } from './chipLegality';
import { brokenProse, checkActionFollowed, checkChosenChip, checkPlayerTurn } from './turnCheck';
import type { GameState, LogEntry } from './types';

function base(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    seed: 'z3',
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    currentLocation: 'Lowmarket',
    worldAtlas: null,
    activeEncounter: null,
    activeDungeon: null,
    journey: null,
    quests: [],
    places: [],
    npcMemories: [],
    companions: [],
    turn: 8,
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true } as GameState['openingEstablishment'],
    ...over,
    sceneFacts: {
      ...s.sceneFacts!,
      crowd: 'none',
      present: [],
      crowdCount: 0,
      ...(over.sceneFacts ?? {}),
    },
  };
}

const gm = (turn: number, content: string): LogEntry => ({ id: `g${turn}`, turn, role: 'gm', content, timestamp: turn });

function mapOf(layout: InteriorRoomSpec[]): ActiveDungeonState {
  return {
    blueprintId: 'interior-plan',
    dungeonName: 'T',
    tier: 4,
    currentZLevel: 0,
    currentNodeId: layout[0]!.id,
    visitedNodeIds: [],
    clearedNodeIds: [],
    nodes: layout.map((s) => ({
      id: s.id,
      name: s.label,
      description: '',
      connections: s.links,
      coordinates: { x: s.x, y: s.y },
      footprint: { w: s.w, h: s.h },
      zLevel: s.z,
      isSecret: !!s.isSecret,
      tags: s.entry ? ['entry'] : [],
    })),
  } as ActiveDungeonState;
}

function symLinks(layout: InteriorRoomSpec[]): InteriorRoomSpec[] {
  const out = layout.map((r) => ({ ...r, links: [...r.links] }));
  for (const r of out) {
    for (const t of r.links) {
      const o = out.find((x) => x.id === t);
      if (o && !o.links.includes(r.id)) o.links.push(r.id);
    }
  }
  return out;
}

describe('29z3 — stamp', () => {
  it('HUD/BUILD are 2026-10-07b, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-10-07b');
    expect(BUILD_STAMP).toBe('2026-10-07b');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });
});

describe('29z3 — house plans', () => {
  const all: Array<[string, InteriorRoomSpec[]]> = [
    ...SHED_LAYOUTS.map((l, i) => [`shed-${i}`, l] as [string, InteriorRoomSpec[]]),
    ...RUIN_LAYOUTS.map((l, i) => [`ruin-${i}`, l] as [string, InteriorRoomSpec[]]),
    ...GRAND_LAYOUTS.map((l, i) => [`grand-${i}`, l] as [string, InteriorRoomSpec[]]),
    ...INSIDE_TEMPLATES.map((t) => [t.id, t.layout!] as [string, InteriorRoomSpec[]]),
    ...VEHICLE_TEMPLATES.map((t) => [t.id, t.layout!] as [string, InteriorRoomSpec[]]),
  ];

  it.each(all)('%s packs to shared walls with doors, stairs, a way out and windows', (id, raw) => {
    const layout = symLinks(raw);
    const links = layout.flatMap((r) => r.links.map((t) => [r.id, t] as [string, string]));
    const packed = packFloorRooms(layout, links) as InteriorRoomSpec[];
    expect(floorPlanIssues(mapOf(packed), { building: true, minRooms: id.startsWith('veh-') ? 1 : 2 })).toEqual([]);
  });

  it('a floating room, a gap and a blank plan are named issues', () => {
    const rooms: InteriorRoomSpec[] = [
      { id: 'a', label: 'Hall', x: 0, y: 0, z: 0, w: 1, h: 1, links: ['b'], entry: true },
      { id: 'b', label: 'Loft', x: 3, y: 0, z: 0, w: 1, h: 1, links: ['a'] },
    ];
    const issues = floorPlanIssues(mapOf(rooms), { building: true });
    expect(issues.some((i) => /floating-room|room-sized-gap|door-off-wall/.test(i))).toBe(true);
    expect(floorPlanIssues({ ...mapOf(rooms), nodes: [] }, { building: true })[0]).toMatch(/blank/);
  });

  it('built plans across seeds have no issues, a front door and windows', () => {
    for (const place of ['an old manor house', 'the cathedral nave', 'a narrow shop', 'a half-collapsed ruin', 'a farmhouse']) {
      for (let i = 0; i < 12; i++) {
        const plan = buildInteriorFloorPlan(place, [], undefined, `z3-${place}-${i}`);
        expect(floorPlanIssues(plan, { building: true, minRooms: 1 }), `${place} #${i}`).toEqual([]);
        expect(exteriorDoor(plan), `${place} #${i}`).toBeTruthy();
        expect(windowMarks(plan, 0).length, `${place} #${i}`).toBeGreaterThan(0);
      }
    }
  });

  it('a roofless place stays one floor unless a basement is established', () => {
    expect(isRooflessPlace('the foundation outline of a mill')).toBe(true);
    expect(isRooflessPlace('an old manor house')).toBe(false);
    for (let i = 0; i < 12; i++) {
      const plan = buildInteriorFloorPlan('the burnt-out husk of a farmhouse', [], undefined, `z3-husk-${i}`);
      expect(plan.nodes.every((n) => (n.zLevel ?? 0) === 0)).toBe(true);
    }
  });
});

describe('29z3 — prose glue', () => {
  it('a name followed by a plain verb is not turned into "the <verb>"', () => {
    const out = scrubSlotGlue('Oskar tracked the prints to the Oskar tracked line.', ['Oskar']);
    expect(out).not.toMatch(/Oskar the tracked/);
    expect(scrubSlotGlue('She waved to the Oskar quickly.', ['Oskar'])).not.toMatch(/the quickly/);
  });

  it('a line with a token the ledger cannot paint is dropped, not painted blank', () => {
    const refs: LedgerRef[] = [{ tok: 't1', id: 'place:lowmarket', display: 'Lowmarket', klass: 'place' }];
    const text = renderTokenBeat(
      {
        refs: [{ tok: 't1', id: 'place:lowmarket', use: 'place' }],
        lines: [
          { fn: 'place', text: 'Rain ran down the stalls of @t1 all morning long.' },
          { fn: 'react', text: 'The @t9 stepped out from the crowd and waved.' },
        ],
      } as Parameters<typeof renderTokenBeat>[0],
      refs
    );
    expect(text).toMatch(/Lowmarket/);
    expect(text).not.toMatch(/The\s+stepped/);
  });

  it('the writer packet asks for the player action to be carried out and a road meeting to be shown', () => {
    const s = base({
      log: [gm(7, 'You walked on.'), { id: 'p8', turn: 8, role: 'player', content: 'Walk on', timestamp: 8 } as LogEntry],
      journey: {
        from: 'Lowmarket',
        to: 'West Wall',
        ground: 'Open Road',
        terrain: 'road',
        legsTotal: 3,
        legsDone: 1,
        hoursPerLeg: 1,
        startedTurn: 7,
        encounter: { kind: 'traveler', level: 1, stretch: 1, dangerous: false },
      } as GameState['journey'],
      currentLocation: 'Open Road',
    });
    const text = formatWriterFacingEvent(buildCompletedEventPacket(s, 'Walk on'));
    expect(text).toMatch(/ACTION: this beat carries out the PLAYER line/);
    expect(text).toMatch(/On this stretch: a traveler/);
  });
});

describe('29z3 — chips follow the scene', () => {
  it('a talk chip with nobody here is not offered', () => {
    const s = base();
    expect(chipProblem(s, 'Talk to Nell')?.kind).toBe('ghost-chip');
    expect(legalChips(s, ['Talk to Nell', 'Look around'])).toEqual(['Look around']);
  });

  it('a vertical chip on open ground is impossible', () => {
    const s = base({
      currentLocation: 'Open Road',
      journey: {
        from: 'Lowmarket',
        to: 'West Wall',
        ground: 'Open Road',
        terrain: 'road',
        legsTotal: 3,
        legsDone: 1,
        hoursPerLeg: 1,
        startedTurn: 7,
      } as GameState['journey'],
    });
    expect(chipProblem(s, 'Climb to the upper floor')?.kind).toBe('impossible-chip');
    expect(chipProblem(s, 'Go down to the basement')?.kind).toBe('impossible-chip');
  });

  it('a chosen road-meeting chip needs someone in the prose before it', () => {
    const j = {
      from: 'Lowmarket',
      to: 'West Wall',
      ground: 'Open Road',
      terrain: 'road',
      legsTotal: 3,
      legsDone: 1,
      hoursPerLeg: 1,
      startedTurn: 7,
      encounter: { kind: 'traveler', level: 1, stretch: 1, dangerous: false },
    } as GameState['journey'];
    const quiet = base({ journey: j, currentLocation: 'Open Road', log: [gm(7, 'Wind bent the grass along the road.')] });
    expect(checkChosenChip(quiet, 'Greet the traveler').map((f) => f.kind)).toEqual(['unrelated-chip']);
    const seen = base({ journey: j, currentLocation: 'Open Road', log: [gm(7, 'A traveler with a heavy pack came up the road.')] });
    expect(checkChosenChip(seen, 'Greet the traveler')).toEqual([]);
  });
});

describe('29z3 — tester P0s', () => {
  it('broken prose shapes are P0; plain lines are not', () => {
    expect(brokenProse('The stepped out of the dark.').map((f) => f.kind)).toEqual(['broken-prose']);
    expect(brokenProse('Mara lifted your lantern toward the door.', 'Mara').map((f) => f.kind)).toEqual(['broken-prose']);
    expect(brokenProse('Mara lifted her lantern toward the door.', 'Mara')).toEqual([]);
    expect(brokenProse('You stepped out of the dark.')).toEqual([]);
  });

  it('an attack with no blow and a travel that never left are ignored actions', () => {
    const fight = base({
      activeEncounter: { name: 'Ash Wolf', hp: 10, maxHp: 10 } as GameState['activeEncounter'],
    });
    const noBlow = checkActionFollowed(fight, fight, 'Press the attack', 'The wind moved through the grass. The sky was grey.');
    expect(noBlow.p0.map((f) => f.kind)).toContain('ignored-action');
    const blow = checkActionFollowed(fight, fight, 'Press the attack', 'Your blade struck the Ash Wolf across the shoulder.');
    expect(blow.p0.map((f) => f.kind)).not.toContain('ignored-action');
    const stay = base();
    const res = checkActionFollowed(stay, stay, 'Travel toward West Wall', 'You looked around Lowmarket.');
    expect(res.p0.map((f) => f.kind)).toContain('ignored-action');
  });

  it('a broken floor plan on the drawn map is a P0 the turn it appears', () => {
    const bad: InteriorRoomSpec[] = [
      { id: 'a', label: 'Hall', x: 0, y: 0, z: 0, w: 1, h: 1, links: [], entry: true },
      { id: 'b', label: 'Attic', x: 0, y: 0, z: 1, w: 1, h: 1, links: [] },
    ];
    const before = base({ currentLocation: 'an old manor house' });
    const after = base({ currentLocation: 'an old manor house', activeDungeon: mapOf(bad) });
    const res = checkPlayerTurn(before, after, { offeredChoices: [], playerInput: 'Wait', gmText: 'You waited.' });
    expect(res.p0.map((f) => f.kind)).toContain('bad-floor-plan');
  });
});
