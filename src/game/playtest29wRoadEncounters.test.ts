/**
 * 29w — chance encounters on the road. Each stretch rolls once; the kind fits the
 * ground and the level follows the area. No live GM call. Mid writer OFF.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { compileChoices } from './choiceCompiler';
import { resolveLocalAreaLevel } from './placeAuthority';
import {
  commitTravel,
  encounterPool,
  journeyPads,
  mapGapBetween,
  roadEncounterLevel,
  rollRoadEncounter,
  UNDERWAY_HERE,
  type StretchContext,
} from './travelJourney';
import type { GameState } from './types';

function keepState(seed: string, level = 1): GameState {
  const s = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s,
    seed,
    campaignBibleId: 'cursed-keep',
    currentLocation: 'Greyhollow Inn',
    worldAtlas: null,
    activeEncounter: null,
    journey: null,
    character: { ...s.character, level },
    sceneFacts: s.sceneFacts ? { ...s.sceneFacts, pendingEncounter: undefined } : s.sceneFacts,
  };
}

function ctx(over: Partial<StretchContext>): StretchContext {
  return { terrain: 'road', haunted: false, areaTier: 1, stretch: 1, legsTotal: 2, quietStretches: 0, ...over };
}

function tripsTo(dest: string, n = 200) {
  return Array.from({ length: n }, (_, i) => commitTravel(keepState(`seed-${i}`), `Travel toward ${dest}`));
}

describe('29w stamps', () => {
  it('HUD and BUILD are 2026-10-14e and Mid writer stays OFF', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-10-15u');
    expect(BUILD_STAMP).toBe('2026-10-15u');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });
});

describe('29w — a stretch is a chance, not a guaranteed meeting', () => {
  it('one stretch can have no encounter: Walk on, a travel job, Turn back', () => {
    expect(rollRoadEncounter(ctx({}), 1, 0.99, 0)).toBeNull();
    const quiet = tripsTo('Blackspine Treeline').find((t) => t.state.journey && !t.state.journey.encounter);
    expect(quiet).toBeDefined();
    const pads = compileChoices(quiet!.state, ['Look around']).choices;
    expect(pads[0]).toBe('Walk on');
    expect(pads[pads.length - 1]).toBe('Turn back toward Greyhollow Inn');
    expect(pads.every((p) => /^(Walk on|Travel on|Keep lookout|Lead the way|Forage as you go|Turn back toward Greyhollow Inn)$/.test(p))).toBe(true);
    expect(quiet!.receipt).toMatch(/quiet stretch/);
  });

  it('not every step, and not so rare a long trip never meets one', () => {
    const trips = tripsTo('Blackspine Treeline');
    const met = trips.filter((t) => t.state.journey?.encounter).length / trips.length;
    // tt-travel: a d6 meeting check each watch (1 in 6; 2 in 6 on dangerous or haunted ground).
    expect(met).toBeGreaterThan(0.08);
    expect(met).toBeLessThan(0.4);
    expect(rollRoadEncounter(ctx({}), 1, 0.1, 0)).not.toBeNull();
    expect(rollRoadEncounter(ctx({}), 1, 0.2, 0)).toBeNull();
    expect(rollRoadEncounter(ctx({ haunted: true }), 1, 0.3, 0)).not.toBeNull();
  });
});

describe('29w — the kind fits the ground', () => {
  it('a forest chance is wildlife, not town thugs', () => {
    const forest = ctx({ terrain: 'forest', areaTier: 2 });
    expect(encounterPool(forest)).not.toContain('thugs');
    expect(encounterPool(forest)).not.toContain('traveler');
    expect(rollRoadEncounter(forest, 4, 0, 0)?.kind).toBe('wildlife');
    const hit = tripsTo('Blackspine Treeline').find((t) => t.state.journey?.encounter?.kind === 'wildlife');
    expect(hit).toBeDefined();
    expect(journeyPads(hit!.state)).toContain('Deal with the animal in the trees');
    expect(hit!.receipt).toMatch(/chance meeting: wildlife \(level \d+\)/);
  });

  it('a ruin or graveyard chance can be undead', () => {
    expect(mapGapBetween(keepState('x'), 'Greyhollow Inn', 'Greyhollow Graveyard').haunted).toBe(true);
    const hit = tripsTo('Greyhollow Graveyard').find((t) => t.state.journey?.encounter?.kind === 'undead');
    expect(hit).toBeDefined();
    expect(journeyPads(hit!.state)).toContain('Face the dead');
  });

  it('a road may meet a traveler, a meeting, thugs or a camp; a camp can sit at the edge of wilds', () => {
    expect(encounterPool(ctx({ terrain: 'road' }))).toEqual(
      expect.arrayContaining(['traveler', 'meeting', 'thugs', 'camp'])
    );
    expect(encounterPool(ctx({ terrain: 'forest', stretch: 1, legsTotal: 4 }))).toContain('camp');
    expect(encounterPool(ctx({ terrain: 'forest', stretch: 2, legsTotal: 4 }))).not.toContain('camp');
  });

  it('villains and monsters only where the area would have one', () => {
    const village = encounterPool(ctx({ terrain: 'road', areaTier: 1 }));
    expect(village).not.toContain('monster');
    expect(village).not.toContain('villain');
    expect(encounterPool(ctx({ terrain: 'road', areaTier: 3 }))).toEqual(
      expect.arrayContaining(['monster', 'villain'])
    );
    const highWild = rollRoadEncounter(ctx({ terrain: 'forest', areaTier: 4 }), 7, 0, 0);
    expect(highWild?.dangerous).toBe(true);
  });
});

describe('29w — level follows the area (treasure rule)', () => {
  it('a higher-tier area gives a higher encounter level, same as treasure', () => {
    const s = keepState('lvl', 1);
    expect(roadEncounterLevel(s, 1)).toBeLessThan(roadEncounterLevel(s, 2));
    const treasure = (tier: number) => resolveLocalAreaLevel({ ...s, locationSheet: null, places: [], threatTier: tier }).level;
    // Lap 53: ordinary ground meets the player at most one level above them; dangerous ground (tier 3+) is the treasure level.
    expect(roadEncounterLevel(s, 2)).toBe(Math.min(treasure(2), 2));
    expect(roadEncounterLevel(s, 3)).toBe(treasure(3));
    const hit = tripsTo('Blackspine Treeline').find((t) => t.state.journey?.encounter);
    expect(hit!.state.journey!.encounter!.level).toBe(roadEncounterLevel(hit!.state, 2));
  });
});

describe('29w — deal with it by chips, then the road continues', () => {
  it('an encounter chip keeps HERE on the ground; Walk on carries on', () => {
    const peaceful = (t: { state: GameState }) => {
      const k = t.state.journey?.encounter?.kind;
      return k === 'traveler' || k === 'meeting' || k === 'wildlife' || k === 'camp';
    };
    const hit = (tripsTo('Greyhollow Graveyard').find(peaceful) ?? tripsTo('Blackspine Treeline').find(peaceful))!;
    const chip = journeyPads(hit.state).slice(1, -1).find((c) => !/^face\b/i.test(c))!;
    const dealt = commitTravel(hit.state, chip);
    expect(dealt.arrived).toBe(false);
    expect(dealt.state.currentLocation).toBe(UNDERWAY_HERE);
    expect(dealt.receipt).toMatch(/chance meeting/);
    const on = commitTravel(dealt.state, 'Walk on');
    expect(on.arrived).toBe(true);
    expect(on.state.currentLocation).toBe('Greyhollow Graveyard');
  });
});
