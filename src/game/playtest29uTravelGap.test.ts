/**
 * 29u — travel across a mapped gap is a journey, not one leave-and-reach stitch.
 * No live GM call. Mid writer OFF.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { getWorldOutlineById } from '@/data/worldOutlines';
import { instantiateWorldAtlas } from './worldAtlas';
import { compileChoices } from './choiceCompiler';
import { enforceCameraOnProse } from './travelAuthority';
import { commitTravel, journeyPads, mapGapBetween, UNDERWAY_HERE } from './travelJourney';
import type { GameState } from './types';

function coastState(): GameState {
  const s = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s,
    campaignBibleId: 'shattered-coast',
    currentLocation: 'Saltmar',
    worldAtlas: instantiateWorldAtlas(getWorldOutlineById('shatter-coast')!),
    activeEncounter: null,
    journey: null,
    sceneFacts: s.sceneFacts ? { ...s.sceneFacts, timeOfDay: 'morning', pendingEncounter: undefined } : s.sceneFacts,
  };
}

function keepState(): GameState {
  const s = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s,
    campaignBibleId: 'cursed-keep',
    currentLocation: 'Greyhollow Inn',
    worldAtlas: null,
    activeEncounter: null,
    journey: null,
  };
}

describe('29u stamps', () => {
  it('HUD and BUILD are 2026-10-06c and Mid writer stays OFF', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-10-06c');
    expect(BUILD_STAMP).toBe('2026-10-06c');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });
});

describe('29u — mapped gap is not one stitch', () => {
  it('two towns a region apart do not arrive this turn; HERE is the ground between', () => {
    const s = coastState();
    expect(mapGapBetween(s, 'Saltmar', 'Brinewatch').steps).toBeGreaterThan(1);
    const t = commitTravel(s, 'Travel toward Brinewatch');
    expect(t.handled).toBe(true);
    expect(t.arrived).toBe(false);
    expect(t.state.currentLocation).not.toBe('Brinewatch');
    expect(t.state.currentLocation).not.toBe(t.state.journey?.ground);
    expect(t.state.currentLocation).toBe(UNDERWAY_HERE);
    expect(t.state.journey?.to).toBe('Brinewatch');
    const body = 'Salt wind. Gulls over the track.';
    const prose = enforceCameraOnProse(body, t.state, 'Travel toward Brinewatch', 'Saltmar');
    expect(prose).toBe(body);
    expect(prose).not.toMatch(/You leave|and reach/i);
  });

  it('walking on reaches the far place on a later turn', () => {
    const first = commitTravel(coastState(), 'Travel toward Brinewatch');
    const second = commitTravel(first.state, 'Walk on');
    expect(second.arrived).toBe(true);
    expect(second.state.currentLocation).toBe('Brinewatch');
    expect(second.state.journey).toBeNull();
  });
});

describe('29u — time moves with distance', () => {
  it('a leg across the gap moves the clock and shows it', () => {
    const s = coastState();
    const t = commitTravel(s, 'Travel toward Brinewatch');
    expect(typeof t.state.worldHour).toBe('number');
    expect(t.state.worldHour).toBeGreaterThan(8);
    expect(t.receipt).toMatch(/^Travel:.*\+\d/);
    expect(t.receipt).toMatch(/now \w+/);
  });

  it('a short step costs less time than a forest gap', () => {
    const coast = coastState();
    const step = mapGapBetween(coast, 'Lower Ward', 'Middle Ward');
    const forest = mapGapBetween(keepState(), 'Greyhollow Inn', 'Blackspine Treeline');
    expect(step.hoursPerLeg * step.steps).toBeLessThan(forest.hoursPerLeg * forest.steps);
  });
});

describe('29u — the ground has its own chips', () => {
  it('in-between place offers chips that are not an arrival', () => {
    const t = commitTravel(coastState(), 'Travel toward Brinewatch');
    const pads = compileChoices(t.state, ['Travel toward Brinewatch', 'Look around']).choices;
    expect(pads).toContain('Walk on');
    expect(pads).toContain('Turn back toward Saltmar');
    expect(pads.some((p) => /arrive|reach|travel toward/i.test(p))).toBe(false);
  });

  it('a forest gap is forest ground (29w: the animal chip is a chance, not every stretch)', () => {
    const t = commitTravel(keepState(), 'Travel toward Blackspine Treeline');
    expect(t.arrived).toBe(false);
    expect(t.state.journey?.terrain).toBe('forest');
    const pads = journeyPads(t.state);
    expect(pads.some((p) => /animal/i.test(p))).toBe(t.state.journey?.encounter?.kind === 'wildlife');
  });

  it('turning back leaves the ground toward where you came from', () => {
    const t = commitTravel(keepState(), 'Travel toward Blackspine Treeline');
    const back = commitTravel(t.state, 'Turn back toward Greyhollow Inn');
    expect(back.arrived).toBe(true);
    expect(back.state.currentLocation).toBe('Greyhollow Inn');
  });
});
