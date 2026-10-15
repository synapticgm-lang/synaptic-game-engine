/**
 * tt-travel — the travel day (gm-travel-practice gaps 1–5): Travel on, a meeting check each watch with intent
 * first, travel jobs, weather / rations / forced march / exhaustion / getting lost, named stops, night camp and
 * arrival. Tabletop numbers are SRD 5.2.1 as written; the GM calls are named in rules/travelDay.ts.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { compileChoices } from './choiceCompiler';
import { resolveCheckContext, skillCheckMods } from './checkMath';
import { pcCombatProfile } from './tabletop/roundFight';
import { DEFAULT_HOUSE_RULES } from './rules/houseRules';
import {
  eatRation,
  encounterDistanceFt,
  extendedTravelDc,
  makeRouteStops,
  maxTravelPace,
  meetingOn,
  minEncounterDistanceFt,
  needsNavigation,
  paceOnGround,
  routeKey,
  weatherFor,
  weatherRuleOf,
  WATCH_HOURS,
} from './rules/travelDay';
import {
  commitTravel,
  dayIsSpent,
  hostileShare,
  journeyPads,
  pickMeetingKind,
  roadHoursToday,
  roadMeetingFact,
  rollRoadEncounter,
  travelBeatFact,
  UNDERWAY_HERE,
  worldClock,
  type StretchContext,
} from './travelJourney';
import { replayPreFeature, setReplayTape } from './replaySeam';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { EngineMode, GameState, Item, RoadEncounter, TravelJourney } from './types';

function keepState(seed: string, mode: EngineMode = 'dnd'): GameState {
  const s = createInitialState(undefined, mode) as GameState;
  return {
    ...s,
    seed,
    engineMode: mode,
    campaignBibleId: 'cursed-keep',
    currentLocation: 'Greyhollow Inn',
    worldAtlas: null,
    activeEncounter: null,
    journey: null,
    sceneFacts: s.sceneFacts ? { ...s.sceneFacts, pendingEncounter: undefined } : s.sceneFacts,
  };
}

/** A trip into the trees, started (first stretch walked). */
function onTrip(seed: string, mode: EngineMode = 'dnd') {
  return commitTravel(keepState(seed, mode), 'Travel toward Blackspine Treeline');
}

/** A started trip with no meeting live, day nearly spent (`roadHours` on the world clock's day, default 8). */
function quietEvening(seed: string, over: Partial<TravelJourney> & { roadHours?: number } = {}, inventory?: Item[]): GameState {
  const { roadHours = 8, ...journeyOver } = over;
  for (let i = 0; i < 200; i++) {
    const t = onTrip(`${seed}-${i}`);
    const j = t.state.journey;
    if (!j || j.encounter || j.legsDone >= j.legsTotal) continue;
    return {
      ...t.state,
      ...(inventory ? { inventory } : {}),
      roadDay: { since: worldClock(t.state), hours: roadHours },
      journey: { ...j, ...journeyOver },
    };
  }
  throw new Error('no quiet trip');
}

/** Camp until the night passes unbroken (a hostile watch meeting breaks some camps). */
function campUnbroken(seed: string, over: Partial<TravelJourney> = {}, inventory?: Item[], character?: Partial<GameState['character']>, extra: Partial<GameState> = {}) {
  for (let i = 0; i < 60; i++) {
    const s = { ...quietEvening(`${seed}-${i}`, over, inventory), ...extra };
    const ready = character ? { ...s, character: { ...s.character, ...character } } : s;
    const c = commitTravel(ready, 'Make camp');
    if (c.event === 'camp') return { before: ready, camp: c };
  }
  throw new Error('every camp broken');
}

const rations = (days: number): Item[] => [{ id: 'r', name: `Rations (${days} days)`, rarity: 'Common', quantity: 1 }];

describe('tt-travel — SRD terrain and pace', () => {
  it('pace never beats the ground; a good road is a step faster', () => {
    expect(maxTravelPace('mountain')).toBe('slow');
    expect(maxTravelPace('forest')).toBe('normal');
    expect(maxTravelPace('road')).toBe('fast');
    expect(paceOnGround('fast', 'marsh')).toBe('slow');
    expect(paceOnGround('fast', 'forest')).toBe('normal');
    expect(paceOnGround('slow', 'road')).toBe('slow');
  });

  it('encounter distance follows the SRD dice for the ground', () => {
    const lo = encounterDistanceFt('forest', () => 0);
    const hi = encounterDistanceFt('forest', () => 0.999);
    expect(lo).toBe(minEncounterDistanceFt('forest'));
    expect(lo).toBe(20);
    expect(hi).toBe(160);
  });

  it('Extended Travel DC is 10 + hours past 8', () => {
    expect(extendedTravelDc(1)).toBe(11);
    expect(extendedTravelDc(3)).toBe(13);
  });
});

describe('tt-travel — the meeting check (gap 2)', () => {
  it('a d6 per watch: 1 in 6, 2 in 6 on dangerous ground; about one in three hostile', () => {
    expect(meetingOn(false)).toBe(1);
    expect(meetingOn(true)).toBe(2);
    expect(hostileShare(DEFAULT_HOUSE_RULES)).toBeCloseTo(1 / 3, 5);
    const pool = ['traveler', 'meeting', 'plea', 'camp', 'signs', 'thugs'] as const;
    expect(pickMeetingKind([...pool], 0.1, DEFAULT_HOUSE_RULES)).not.toBe('thugs');
    expect(pickMeetingKind([...pool], 0.9, DEFAULT_HOUSE_RULES)).toBe('thugs');
  });

  it('the writer gets what the meeting wants before any fight', () => {
    const enc: RoadEncounter = { kind: 'thugs', level: 1, stretch: 1, dangerous: false, want: 'a toll for the road', distanceFt: 60 };
    const j = { ...(onTrip('want').state.journey as TravelJourney), encounter: enc };
    const fact = roadMeetingFact(j);
    expect(fact).toMatch(/wants: a toll for the road/);
    expect(fact).not.toMatch(/what do you do/i);
  });
});

describe('tt-travel — weather, jobs and getting lost (gaps 3–4)', () => {
  it('weather is a d20 a day; heavy rain and fog hide the way and blunt Perception, wind spoils ranged shots', () => {
    expect(weatherFor(1)).toBe('clear');
    expect(weatherFor(17)).toBe('heavy rain');
    expect(weatherFor(19)).toBe('strong wind');
    expect(weatherFor(20)).toBe('fog');
    expect(weatherRuleOf('heavy rain').perception).toBe('disadvantage');
    expect(weatherRuleOf('strong wind').rangedWeapons).toBe('disadvantage');
    expect(needsNavigation('road', 'clear')).toBe(false);
    expect(needsNavigation('road', 'fog')).toBe(true);
    expect(needsNavigation('forest', 'clear')).toBe(true);
  });

  it('tabletop rolls the day: weather and the guide\'s Survival check on the dice line', () => {
    const t = onTrip('jobs');
    const j = t.state.journey!;
    expect(j.weather).toBeTruthy();
    expect(j.jobs?.guide).toBe('you');
    expect(j.jobResults?.guide).toBeTypeOf('boolean');
    expect((t.extra ?? []).some((l) => /^Weather: /.test(l))).toBe(true);
    expect((t.extra ?? []).some((l) => /Navigation: Wisdom \(Survival\)/.test(l))).toBe(true);
  });

  it('a failed guide loses the way: the trip runs a stretch longer', () => {
    const lost = Array.from({ length: 80 }, (_, i) => onTrip(`lost-${i}`)).find((t) => t.state.journey?.lost);
    expect(lost).toBeDefined();
    const j = lost!.state.journey!;
    expect(j.lostLegs).toBe(1);
    expect(travelBeatFact(lost!.state)).toMatch(/lost the way/);
  });

  it('a job chip is offered and taken by the travel engine, never a second check', () => {
    const s = quietEvening('chip', { roadHours: 0 });
    const pads = journeyPads(s);
    const job = pads.find((p) => /^(Keep lookout|Forage as you go|Lead the way)$/.test(p));
    expect(job).toBeDefined();
    expect(resolveCheckContext(s, { kind: 'other' } as never, job!).autoSucceed).toBe(true);
    const took = commitTravel(s, job!);
    expect(took.handled).toBe(true);
    expect(took.state.currentLocation).toBe(UNDERWAY_HERE);
  });

  it('story RPG companions take their own jobs: no job chip and no dice lines', () => {
    const t = onTrip('rpg-jobs', 'rpg');
    expect((t.extra ?? []).some((l) => /Wisdom \(Survival\)|Weather:/.test(l))).toBe(false);
    const j = t.state.journey;
    if (j && !j.encounter) {
      expect(journeyPads(t.state).some((p) => /^(Keep lookout|Forage as you go|Lead the way)$/.test(p))).toBe(false);
    }
  });
});

describe('tt-travel — exhaustion (SRD 5.2.1)', () => {
  it('−2 per level on D20 Tests and −5 ft Speed per level, in checks and in the fight', () => {
    const s = keepState('tired');
    const tired = { ...s, character: { ...s.character, exhaustion: 2 } };
    expect(skillCheckMods(tired, 'WIS', 'perception').some((m) => m.value === -4)).toBe(true);
    const fresh = pcCombatProfile(s);
    const worn = pcCombatProfile(tired);
    if (fresh && worn) {
      expect(worn.initiativeMod).toBe(fresh.initiativeMod - 4);
      expect(worn.weapon.toHit).toBe(fresh.weapon.toHit - 4);
      expect(worn.speed).toBe(Math.max(0, fresh.speed - 10));
    }
  });

  it('pushing past 8 hours calls for Constitution saves (Extended Travel)', () => {
    const s = quietEvening('march', { roadHours: 8 });
    expect(dayIsSpent(s, s.journey!)).toBe(true);
    const [camp, push] = journeyPads(s);
    expect(camp).toBe('Make camp');
    expect(push).toMatch(/^Push on into the \w+, but each failed save wears you down more$/);
    const pushed = commitTravel(s, push!);
    expect((pushed.extra ?? []).some((l) => /Extended Travel: Constitution save/.test(l))).toBe(true);
  });
});

describe('tt-travel — camp, rations and rest (gap 5)', () => {
  it('a night camp eats a day of rations and takes the long rest', () => {
    const { camp } = campUnbroken('ration', {}, rations(3));
    expect(camp.state.inventory?.some((it) => /Rations \(2 days\)/.test(it.name))).toBe(true);
    expect((camp.extra ?? []).some((l) => /^Rations: 1 day eaten/.test(l))).toBe(true);
    expect((camp.extra ?? []).some((l) => /^Rest: long rest/.test(l))).toBe(true);
    expect(camp.state.journey?.day).toBe(2);
    expect(roadHoursToday(camp.state)).toBe(0);
  });

  it('a long rest removes one Exhaustion level when fed', () => {
    const { camp } = campUnbroken('rested', {}, rations(2), { exhaustion: 2 });
    expect(camp.state.character.exhaustion).toBe(1);
  });

  it('the fifth day without food adds a level, and the rest cannot remove it', () => {
    const { camp } = campUnbroken('starve', {}, [], { exhaustion: 0 }, { daysWithoutFood: 4 });
    expect(camp.state.daysWithoutFood).toBe(5);
    expect((camp.extra ?? []).some((l) => /^Malnutrition: Exhaustion: level 0 → 1/.test(l))).toBe(true);
    expect(camp.state.character.exhaustion).toBe(1);
  });

  it('eatRation reads quantity or the days in the name', () => {
    const a = eatRation([{ id: 'a', name: 'Rations', quantity: 2, rarity: 'Common' }]);
    expect(a.ate).toBe('Rations');
    expect(a.left).toBe(1);
    const none = eatRation([]);
    expect(none.ate).toBeNull();
  });
});

describe('tt-travel — Travel on, stops and arrival (gaps 1 and 5)', () => {
  it('Travel on walks stretch after stretch and stops on an event, the day spent, or arrival', () => {
    const s = quietEvening('on', { roadHours: 0 });
    const on = commitTravel(s, 'Travel on');
    expect(on.handled).toBe(true);
    expect((on.extra ?? [])[0]).toMatch(/^Travel on: \d+ stretch(es)?, \+/);
    const j = on.state.journey;
    const stopped = on.arrived || !!on.event || !j || !!j.encounter || dayIsSpent(on.state, j);
    expect(stopped).toBe(true);
  });

  it('named stops are made once per route and are the same either way', () => {
    expect(routeKey('Greyhollow Inn', 'Blackspine Treeline')).toBe(routeKey('Blackspine Treeline', 'Greyhollow Inn'));
    const stops = makeRouteStops('forest', 4, () => 0.2);
    expect(stops.length).toBe(2);
    expect(stops.every((st) => st.name.length > 0)).toBe(true);
    expect(makeRouteStops('road', 1, () => 0.2)).toEqual([]);
  });

  it('the beat facts live only for the turn they were made', () => {
    const t = onTrip('beat');
    const turn = t.state.turn ?? 0;
    if (travelBeatFact(t.state)) {
      expect(travelBeatFact({ ...t.state, turn: turn + 1 })).toBe('');
    }
  });

  it('chips after a quiet stretch are only engine chips (no question, no list)', () => {
    const s = quietEvening('pads', { roadHours: 0 });
    const pads = compileChoices(s, ['Look around']).choices;
    expect(pads.every((p) => !/\?$/.test(p))).toBe(true);
  });
});

describe('tt-travel — the SRD meeting roll pinned (live and new play)', () => {
  const ground = (over: Partial<StretchContext> = {}): StretchContext => ({
    terrain: 'road',
    haunted: false,
    areaTier: 1,
    stretch: 1,
    legsTotal: 4,
    quietStretches: 0,
    ...over,
  });
  const face = (n: number) => (n - 1) / 6 + 0.01;
  const roll = (ctx: StretchContext, d6: number) => rollRoadEncounter(ctx, 1, face(d6), 0.5, 1, DEFAULT_HOUSE_RULES);

  it('one d6 per watch: a meeting on a 1, never on 2–6 on ordinary ground', () => {
    expect(WATCH_HOURS).toBe(4);
    expect(roll(ground(), 1)).not.toBeNull();
    for (const d6 of [2, 3, 4, 5, 6]) expect(roll(ground(), d6)).toBeNull();
  });

  it('the threshold is 1–2 on dangerous or haunted ground, and quiet watches never force a meeting', () => {
    for (const ctx of [ground({ areaTier: 3 }), ground({ terrain: 'forest', haunted: true })]) {
      expect(roll(ctx, 1)).not.toBeNull();
      expect(roll(ctx, 2)).not.toBeNull();
      for (const d6 of [3, 4, 5, 6]) expect(roll(ctx, d6)).toBeNull();
    }
    expect(roll(ground({ quietStretches: 9 }), 6)).toBeNull();
  });

  it('the same seed gives the same meetings; other seeds differ', () => {
    const meet = (seed: string) => {
      const j = onTrip(seed).state.journey;
      return JSON.stringify(j?.encounter ?? null);
    };
    const seeds = Array.from({ length: 40 }, (_, i) => `srd-roll-${i}`);
    const first = seeds.map(meet);
    expect(seeds.map(meet)).toEqual(first);
    expect(new Set(first).size).toBeGreaterThan(1);
  });

  it('live play does not use the replay seam', () => {
    expect(replayPreFeature()).toBe(false);
    const src = (f: string) => readFileSync(join(__dirname, f), 'utf8');
    for (const f of ['useGame.ts', 'fateAutoplay.ts']) expect(src(f)).not.toMatch(/setReplayTape|replayPreFeature/);
    const seeds = Array.from({ length: 40 }, (_, i) => `seam-${i}`);
    const live = seeds.map((s) => JSON.stringify(onTrip(s).state.journey?.encounter ?? null));
    setReplayTape('2026-10-13n');
    let replayed: string[];
    try {
      replayed = seeds.map((s) => JSON.stringify(onTrip(s).state.journey?.encounter ?? null));
    } finally {
      setReplayTape(null);
    }
    expect(replayed).not.toEqual(live);
    expect(seeds.map((s) => JSON.stringify(onTrip(s).state.journey?.encounter ?? null))).toEqual(live);
  });
});
