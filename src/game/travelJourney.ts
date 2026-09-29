/**
 * 29u — Travel between places reads as a journey.
 * Distance comes from the map that already exists: atlas region hops, then
 * whether a place sits outside a settlement (road / march / treeline / fort).
 * More than a step puts the player on the ground between, moves the clock by
 * the distance, and gives that ground its own chips. The code writes no story
 * sentences — the writer narrates every leg from the ENGINE RESULT line.
 * 29w — each stretch rolls once for a chance meeting that fits the ground and the
 * area level. The roll picks a kind and level only; the writer names who or what.
 */

import type {
  GameState,
  JourneyTerrain,
  RoadEncounter,
  RoadEncounterKind,
  TimeOfDay,
  TravelJourney,
  WorldAtlasState,
} from './types';
import { resolveLocalAreaLevel, resolveThreatTier } from './placeAuthority';
import {
  hubsForBibleId,
  isLeaveSceneAction,
  matchHub,
  parseTravelDestination,
  resolveLeaveSceneDestination,
} from './outdoorHubs';
import { resolvePlace } from './places';
import { findSettlement } from './worldMapAuthority';

interface Endpoint {
  name: string;
  regionId?: string;
  /** A named place on the map (hub / settlement / region), not a room or a scene line. */
  mapped: boolean;
  outside: boolean;
  text: string;
  /** Threat tier of the place when the map knows it. */
  tier?: number;
  /** Ruin / graveyard / crypt / old battlefield. */
  haunted: boolean;
}

const OUTSIDE_KINDS = new Set(['landmark', 'ruin', 'fort', 'shore']);
const WILD_TEXT =
  /\b(forest|woods?|timber|pines?|treeline|trees|trail|road|track|march|marsh|reeds?|fen|bog|swamp|moor|hills?|mountains?|pass|ridge|wilds?|wilderness|steppe|dunes?)\b/i;
const HAUNT_TEXT =
  /\b(ruins?|ruined|graves?|graveyards?|cemeter(?:y|ies)|crypts?|tombs?|barrows?|ossuar(?:y|ies)|catacombs?|mausoleums?|battlefields?|battlegrounds?|haunted|undead)\b/i;

const TERRAIN_TESTS: Array<[JourneyTerrain, RegExp]> = [
  ['forest', /\b(forest|woods?|woodland|timber|pines?|treeline|trees)\b/i],
  ['marsh', /\b(marsh|reeds?|wetland|fen|bog|swamp|mire)\b/i],
  ['mountain', /\b(mountains?|pass|ridge|switchbacks?|highland|snowfields?|stair)\b/i],
  ['coast', /\b(coast(?:al)?|shore|sea|beach|tide|island|surf|reef)\b/i],
  ['streets', /\b(urban|city|streets?|district|ward|market|alley|metro)\b/i],
];

const GROUND_LABEL: Record<JourneyTerrain, string> = {
  forest: 'Forest path',
  marsh: 'Marsh track',
  mountain: 'Mountain pass',
  coast: 'Coast road',
  streets: 'Back streets',
  road: 'Open road',
};

/** Hours per leg on each kind of ground. A short step inside a place is STEP_HOURS. */
const LEG_HOURS: Record<JourneyTerrain, number> = {
  streets: 0.5,
  road: 2,
  coast: 2,
  forest: 3,
  marsh: 3,
  mountain: 4,
};
const STEP_HOURS = 0.25;
const MAX_LEGS = 4;

function endpointFor(state: GameState, rawName: string): Endpoint {
  const name = (rawName ?? '').replace(/\s+/g, ' ').trim();
  const atlas = state.worldAtlas;
  const hub = matchHub(hubsForBibleId(state.campaignBibleId), name);
  const place = resolvePlace(state.places, hub?.name ?? name) ?? resolvePlace(state.places, name);
  const settlement = findSettlement(atlas, hub?.name ?? name) ?? findSettlement(atlas, name);
  const region = atlas?.regions.find(
    (r) => r.id === name.toLowerCase() || r.name.toLowerCase() === name.toLowerCase()
  );
  const text = [
    hub?.blurb,
    settlement?.blurb,
    settlement?.biome,
    place?.biome,
    place?.description,
    region?.blurb,
    ...(region?.tags ?? []),
  ]
    .filter(Boolean)
    .join(' ');
  const kind = settlement?.kind ?? place?.settlementKind;
  const outside =
    (hub?.threatTier ?? 0) >= 3
    || (!!kind && OUTSIDE_KINDS.has(kind))
    || WILD_TEXT.test(`${hub?.blurb ?? ''} ${settlement?.blurb ?? ''} ${place?.description ?? ''}`);
  const tier = hub?.threatTier ?? place?.threatTier ?? (kind && OUTSIDE_KINDS.has(kind) ? 2 : undefined);
  return {
    name,
    regionId: settlement?.regionId ?? place?.regionId ?? region?.id ?? atlas?.currentRegionId,
    mapped: !!(hub || settlement || region),
    outside,
    text,
    tier: typeof tier === 'number' && Number.isFinite(tier) ? tier : undefined,
    haunted: kind === 'ruin' || HAUNT_TEXT.test(text),
  };
}

/** Shortest region path on the atlas graph (inclusive), or null when unconnected. */
function regionPath(atlas: WorldAtlasState, fromId: string, toId: string): string[] | null {
  if (fromId === toId) return [fromId];
  const prev = new Map<string, string>([[fromId, '']]);
  const queue = [fromId];
  while (queue.length) {
    const at = queue.shift()!;
    const region = atlas.regions.find((r) => r.id === at);
    for (const next of region?.connections ?? []) {
      if (prev.has(next)) continue;
      prev.set(next, at);
      if (next === toId) {
        const path = [toId];
        let step = at;
        while (step) {
          path.unshift(step);
          step = prev.get(step) ?? '';
        }
        return path;
      }
      queue.push(next);
    }
  }
  return null;
}

function regionText(atlas: WorldAtlasState | null | undefined, id: string | undefined): string {
  const r = id ? atlas?.regions.find((x) => x.id === id) : undefined;
  return r ? `${r.blurb} ${(r.tags ?? []).join(' ')}` : '';
}

/** First wild terrain wins; plain ground between towns is road. */
export function terrainFromText(...texts: string[]): JourneyTerrain {
  const hay = texts.join(' ');
  for (const [terrain, re] of TERRAIN_TESTS) {
    if (re.test(hay)) return terrain;
  }
  return 'road';
}

export interface MapGap {
  /** Moves needed. 1 = a step (arrive this turn). 2+ = ground between first. */
  steps: number;
  terrain: JourneyTerrain;
  hoursPerLeg: number;
  /** Threat tier (1–4) of the country between: the wilder end, else the zone. */
  areaTier: number;
  haunted: boolean;
}

/** Distance between two places from the existing map (atlas regions, then place scale). */
export function mapGapBetween(state: GameState, from: string, to: string): MapGap {
  const a = endpointFor(state, from);
  const b = endpointFor(state, to);
  const known = [a.tier, b.tier].filter((t): t is number => typeof t === 'number');
  const areaTier = Math.max(1, Math.min(4, known.length ? Math.max(...known) : resolveThreatTier(state) ?? 1));
  if (!a.name || !b.name || a.name.toLowerCase() === b.name.toLowerCase()) {
    return { steps: 0, terrain: 'streets', hoursPerLeg: 0, areaTier, haunted: false };
  }
  const atlas = state.worldAtlas;
  const path =
    atlas && a.regionId && b.regionId ? regionPath(atlas, a.regionId, b.regionId) : null;
  const hops = path ? path.length - 1 : 0;
  let steps: number;
  let terrain: JourneyTerrain;
  const haunted =
    a.haunted || b.haunted || !!path?.slice(1, -1).some((id) => HAUNT_TEXT.test(regionText(atlas, id)));
  if (hops >= 1 && path) {
    steps = Math.min(MAX_LEGS, hops + 1);
    const between = path.slice(1, -1);
    terrain = between.length
      ? terrainFromText(...between.map((id) => regionText(atlas, id)))
      : terrainFromText(regionText(atlas, path[0]), regionText(atlas, path[1]), a.text, b.text);
  } else if (a.outside || b.outside) {
    steps = 2;
    terrain = terrainFromText(b.outside ? b.text : '', a.outside ? a.text : '');
  } else if (b.mapped) {
    steps = 2;
    terrain = 'streets';
  } else {
    steps = 1;
    terrain = 'streets';
  }
  return {
    steps,
    terrain,
    hoursPerLeg: steps <= 1 ? STEP_HOURS : LEG_HOURS[terrain],
    areaTier,
    haunted,
  };
}

const SLOT_START: Record<Exclude<TimeOfDay, 'unknown'>, number> = {
  dawn: 5,
  morning: 8,
  midday: 12,
  afternoon: 14,
  dusk: 18,
  evening: 19.5,
  night: 22,
};

export function timeOfDayForHour(hour: number): Exclude<TimeOfDay, 'unknown'> {
  const h = ((hour % 24) + 24) % 24;
  if (h >= 5 && h < 7) return 'dawn';
  if (h >= 7 && h < 11) return 'morning';
  if (h >= 11 && h < 13) return 'midday';
  if (h >= 13 && h < 17.5) return 'afternoon';
  if (h >= 17.5 && h < 19.5) return 'dusk';
  if (h >= 19.5 && h < 21.5) return 'evening';
  return 'night';
}

function currentHour(state: GameState): number {
  if (typeof state.worldHour === 'number') return state.worldHour;
  const slot = state.sceneFacts?.timeOfDay;
  return slot && slot !== 'unknown' ? SLOT_START[slot] : 9;
}

function formatSpan(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
}

/** Move the clock; timeOfDay follows the hour. Returns the chrome fragment. */
export function advanceClock(state: GameState, hours: number): { state: GameState; note: string } {
  const hour = (currentHour(state) + hours) % 24;
  const slot = timeOfDayForHour(hour);
  const sceneFacts = state.sceneFacts ? { ...state.sceneFacts, timeOfDay: slot } : state.sceneFacts;
  return {
    state: { ...state, worldHour: hour, sceneFacts },
    note: `+${formatSpan(hours)}, now ${slot}`,
  };
}

export function isJourneyUnderway(state: Pick<GameState, 'journey'>): boolean {
  return !!state.journey && state.journey.legsDone < state.journey.legsTotal;
}

const WALK_ON = /^(?:walk on|keep (?:walking|going)|press on|carry on|continue (?:on|along|walking|the journey))\b/i;
const TURN_BACK = /^(?:turn back|go back|head back)\b/i;

const TALK_PAD: Record<JourneyTerrain, string> = {
  forest: 'Talk to whoever is on the path',
  marsh: 'Talk to whoever is on the track',
  mountain: 'Talk to whoever is on the pass',
  coast: 'Talk to a traveler on the coast road',
  streets: 'Talk to someone in the street',
  road: 'Talk to a traveler on the road',
};

const LIVES_PAD: Record<JourneyTerrain, string> = {
  forest: 'Deal with the animal in the trees',
  marsh: 'Deal with what moves in the reeds',
  mountain: 'Deal with the animal on the rocks',
  coast: 'Deal with what comes up from the shore',
  streets: 'Deal with the strays in the alley',
  road: 'Deal with what lurks by the roadside',
};

const FIXED_ENCOUNTER_PADS: Partial<Record<RoadEncounterKind, string[]>> = {
  meeting: ['Greet whoever is coming'],
  thugs: ['Face the thugs', 'Talk your way past the thugs'],
  camp: ['Approach the camp', 'Skirt around the camp'],
  undead: ['Face the dead', 'Slip past the dead'],
  monster: ['Face the creature', 'Hide from the creature'],
  villain: ['Face whoever blocks the way', 'Talk to whoever blocks the way'],
};

function encounterPads(enc: RoadEncounter, terrain: JourneyTerrain): string[] {
  if (enc.kind === 'wildlife') return [LIVES_PAD[terrain]];
  if (enc.kind === 'traveler') return [TALK_PAD[terrain]];
  return FIXED_ENCOUNTER_PADS[enc.kind] ?? [];
}

/** Chips for the ground between: walk on, this stretch's chance meeting (if any), turn back. */
export function journeyPads(state: Pick<GameState, 'journey'>): string[] {
  const j = state.journey;
  if (!j || !isJourneyUnderway(state)) return [];
  const met = j.encounter ? encounterPads(j.encounter, j.terrain) : [];
  return ['Walk on', ...met, `Turn back toward ${j.from}`];
}

export function isJourneyPad(choice: string): boolean {
  const t = (choice ?? '').trim().toLowerCase();
  const known = [
    ...Object.values(TALK_PAD),
    ...Object.values(LIVES_PAD),
    ...Object.values(FIXED_ENCOUNTER_PADS).flat(),
  ];
  return WALK_ON.test(t) || /^turn back toward\s+\S/i.test(t) || known.some((p) => p.toLowerCase() === t);
}

/** Base chance a stretch has a meeting; each quiet stretch in a row adds QUIET_STEP. */
const ENCOUNTER_CHANCE = 0.4;
const QUIET_STEP = 0.25;
/** After this many quiet stretches in a row the next one always has a meeting. */
const MAX_QUIET = 2;

export interface StretchContext {
  terrain: JourneyTerrain;
  haunted: boolean;
  areaTier: number;
  /** Leg index being walked (1-based). */
  stretch: number;
  legsTotal: number;
  quietStretches: number;
}

/** Kinds that fit the ground. Monsters and villains only where the area is dangerous (tier 3+). */
export function encounterPool(ctx: StretchContext): RoadEncounterKind[] {
  const high = ctx.areaTier >= 3;
  const edgeOfWilds = ctx.stretch <= 1 || ctx.stretch >= ctx.legsTotal - 1;
  const pool: RoadEncounterKind[] = [];
  if (ctx.haunted) pool.push('undead', 'undead', 'undead');
  if (ctx.terrain === 'forest' || ctx.terrain === 'marsh' || ctx.terrain === 'mountain') {
    pool.push('wildlife', 'wildlife');
    if (edgeOfWilds && ctx.terrain !== 'mountain') pool.push('camp');
    if (high) pool.push('monster');
  } else if (ctx.terrain === 'road' || ctx.terrain === 'coast') {
    pool.push('traveler', 'meeting', 'thugs', 'camp');
    if (high) pool.push('villain', 'monster');
  } else {
    pool.push('traveler', 'meeting', 'thugs');
    if (high) pool.push('villain');
  }
  return pool;
}

/**
 * One roll per stretch. `chanceRoll` and `kindRoll` are in [0, 1).
 * Returns null for a quiet stretch.
 */
export function rollRoadEncounter(
  ctx: StretchContext,
  level: number,
  chanceRoll: number,
  kindRoll: number
): RoadEncounter | null {
  const chance = ctx.quietStretches >= MAX_QUIET ? 1 : ENCOUNTER_CHANCE + QUIET_STEP * ctx.quietStretches;
  if (chanceRoll >= chance) return null;
  const pool = encounterPool(ctx);
  if (!pool.length) return null;
  const kind = pool[Math.min(pool.length - 1, Math.floor(kindRoll * pool.length))];
  return { kind, level, stretch: ctx.stretch, dangerous: ctx.areaTier >= 3 };
}

/** Encounter level from the area tier by the treasure rule (tier → level, clamped to party ±3). */
export function roadEncounterLevel(state: GameState, areaTier: number): number {
  return resolveLocalAreaLevel({
    ...state,
    activeDungeon: null,
    locationSheet: null,
    places: [],
    threatTier: areaTier,
  }).level;
}

function hashUnit(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 0x100000000;
}

/** Roll this stretch (seed-stable for the save, trip and leg). */
function rollStretch(state: GameState, j: TravelJourney): TravelJourney {
  const key = `${state.seed ?? ''}|${j.from}|${j.to}|${j.startedTurn}|${j.legsDone}`;
  const areaTier = j.areaTier ?? 1;
  const quiet = j.quietStretches ?? 0;
  const encounter = rollRoadEncounter(
    {
      terrain: j.terrain,
      haunted: !!j.haunted,
      areaTier,
      stretch: j.legsDone,
      legsTotal: j.legsTotal,
      quietStretches: quiet,
    },
    roadEncounterLevel(state, areaTier),
    hashUnit(`${key}|chance`),
    hashUnit(`${key}|kind`)
  );
  return { ...j, encounter, quietStretches: encounter ? 0 : quiet + 1 };
}

const ENCOUNTER_LABEL: Record<RoadEncounterKind, string> = {
  wildlife: 'wildlife',
  traveler: 'a traveler',
  meeting: 'someone on the way',
  thugs: 'thugs',
  camp: 'a camp',
  undead: 'the restless dead',
  monster: 'a monster',
  villain: 'a villain',
};

/** Receipt fragment for this stretch (chrome + ENGINE RESULT; the writer names who or what). */
function encounterNote(j: TravelJourney): string {
  const e = j.encounter;
  if (!e) return '; quiet stretch';
  const label = e.kind === 'wildlife' && e.dangerous ? 'dangerous wildlife' : ENCOUNTER_LABEL[e.kind];
  return `; chance meeting: ${label} (level ${e.level})`;
}

export interface TravelCommit {
  state: GameState;
  /** This turn's travel owned HERE (moved, started, advanced, or stayed on the ground). */
  handled: boolean;
  /** Arrived at a destination this turn. */
  arrived: boolean;
  /** STATUS + ENGINE RESULT line (chrome, not prose). */
  receipt?: string;
}

function arrive(state: GameState, dest: string, hours: number, from: string): TravelCommit {
  const clock = advanceClock({ ...state, currentLocation: dest, journey: null }, hours);
  return {
    state: clock.state,
    handled: true,
    arrived: true,
    receipt: `Travel: ${from} to ${dest} — ${clock.note}`,
  };
}

function startJourney(state: GameState, from: string, to: string, gap: MapGap): TravelCommit {
  const journey = rollStretch(state, {
    from,
    to,
    ground: GROUND_LABEL[gap.terrain],
    terrain: gap.terrain,
    legsTotal: gap.steps,
    legsDone: 1,
    hoursPerLeg: gap.hoursPerLeg,
    startedTurn: state.turn ?? 0,
    areaTier: gap.areaTier,
    haunted: gap.haunted,
    quietStretches: 0,
  });
  const clock = advanceClock({ ...state, currentLocation: journey.ground, journey }, gap.hoursPerLeg);
  return {
    state: clock.state,
    handled: true,
    arrived: false,
    receipt: `Travel: ${journey.ground.toLowerCase()} between ${from} and ${to} — leg 1 of ${journey.legsTotal - 1} — ${clock.note}; ${to} still ahead${encounterNote(journey)}`,
  };
}

function goTo(state: GameState, from: string, dest: string): TravelCommit {
  const gap = mapGapBetween(state, from, dest);
  if (gap.steps <= 0) return { state, handled: false, arrived: false };
  if (gap.steps === 1) return arrive(state, dest, gap.hoursPerLeg, from);
  return startJourney(state, from, dest, gap);
}

function stepAlong(state: GameState, j: TravelJourney): TravelCommit {
  const legsDone = j.legsDone + 1;
  if (legsDone >= j.legsTotal) return arrive(state, j.to, j.hoursPerLeg, j.ground.toLowerCase());
  const journey = rollStretch(state, { ...j, legsDone });
  const clock = advanceClock({ ...state, currentLocation: j.ground, journey }, j.hoursPerLeg);
  return {
    state: clock.state,
    handled: true,
    arrived: false,
    receipt: `Travel: ${j.ground.toLowerCase()} between ${j.from} and ${j.to} — leg ${legsDone} of ${j.legsTotal - 1} — ${clock.note}; ${j.to} still ahead${encounterNote(journey)}`,
  };
}

/** Leaving a mapped place heads to another mapped place, never back into the room you came out of. */
function leaveDestination(state: GameState, here: string): string | null {
  const dest = resolveLeaveSceneDestination(state);
  if (!dest || !endpointFor(state, here).mapped || endpointFor(state, dest).mapped) return dest;
  const hubs = hubsForBibleId(state.campaignBibleId);
  const key = here.toLowerCase();
  return hubs.find((h) => h.name.toLowerCase() !== key && !key.includes(h.name.toLowerCase()))?.name ?? dest;
}

/**
 * Before the writer: an exit from one outdoor place to another.
 * A step arrives this turn; more than a step starts (or advances) the ground between.
 * While underway every other action stays on that ground.
 */
export function commitTravel(state: GameState, raw: string): TravelCommit {
  const input = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (!input || state.activeEncounter) return { state, handled: false, arrived: false };
  const j = state.journey;
  if (j && isJourneyUnderway(state)) {
    const named = parseTravelDestination(input, state.campaignBibleId);
    const namedTo = named && named.name.toLowerCase() === j.to.toLowerCase();
    const namedFrom = named && named.name.toLowerCase() === j.from.toLowerCase();
    if (WALK_ON.test(input) || namedTo) return stepAlong(state, j);
    if (TURN_BACK.test(input) || namedFrom || isLeaveSceneAction(input)) {
      const back: TravelJourney = {
        ...j,
        from: j.to,
        to: j.from,
        legsDone: j.legsTotal - j.legsDone,
      };
      return stepAlong({ ...state, journey: back }, back);
    }
    if (named) return goTo({ ...state, journey: null }, j.ground, named.name);
    return {
      state: { ...state, currentLocation: j.ground },
      handled: true,
      arrived: false,
      receipt: `Travel: still on the ${j.ground.toLowerCase()} between ${j.from} and ${j.to}; ${j.to} still ahead${j.encounter ? encounterNote(j) : ''}`,
    };
  }
  const here = (state.currentLocation ?? '').replace(/\s+/g, ' ').trim();
  const hub = parseTravelDestination(input, state.campaignBibleId);
  const dest = hub?.name ?? (isLeaveSceneAction(input) ? leaveDestination(state, here) : null);
  if (!dest || dest.toLowerCase() === here.toLowerCase()) {
    return { state: state.journey ? { ...state, journey: null } : state, handled: false, arrived: false };
  }
  return goTo({ ...state, journey: null }, here, dest);
}

/** After the writer: the clock owns time of day on a travel turn (prose cannot rewind it). */
export function pinClockTimeOfDay<F extends { timeOfDay?: TimeOfDay } | undefined>(
  facts: F,
  state: Pick<GameState, 'worldHour'>
): F {
  if (!facts || typeof state.worldHour !== 'number') return facts;
  return { ...facts, timeOfDay: timeOfDayForHour(state.worldHour) };
}

/** Ground chips replace the pad while underway (a live fight keeps its own pads). */
export function withJourneyPads(state: GameState, choices: string[]): string[] {
  if (!isJourneyUnderway(state)) return choices;
  if (state.activeEncounter || state.sceneFacts?.pendingEncounter) return choices;
  return journeyPads(state);
}
