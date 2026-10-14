/**
 * 29u — Travel between places reads as a journey.
 * Distance comes from the map that already exists: atlas region hops, then
 * whether a place sits outside a settlement (road / march / treeline / fort).
 * More than a step puts the player on the ground between, moves the clock by
 * the distance, and gives that ground its own chips. The code writes no story
 * sentences — the writer narrates every leg from the ENGINE RESULT line.
 * 29w — each stretch rolls once for a chance meeting that fits the ground and the
 * area level. The roll picks a kind and level only; the writer names who or what.
 * 29x — a hostile meeting can be a rare spawn (a little tougher, slightly better loot),
 * a camp can hold a mini-boss, and facing either opens a live fight on activeEncounter
 * that the combat engine resolves. Everything stays at the area level.
 * tt-travel — a day on the road (rules/travelDay, SRD 5.2.1 travel rules): one meeting check per watch, about one in
 * three meetings hostile and each showing what it wants, daily weather and travel jobs, named stops and finds,
 * Extended Travel and rations (tabletop), a night camp with watches and companion talk, "Travel on" through quiet
 * stretches, and an arrival with a first sight and a hook.
 */

import type {
  ActiveEncounter,
  GameState,
  HouseRules,
  JourneyTerrain,
  RoadEncounter,
  RoadEncounterKind,
  RouteStop,
  TimeOfDay,
  TravelJob,
  TravelJourney,
  WorldAtlasState,
} from './types';
import { resolveLocalAreaLevel, resolveThreatTier } from './placeAuthority';
import { DEFAULT_HOUSE_RULES, houseRulesOf, pillarCopies } from './rules/houseRules';
import { hoursAtPace, paceCheckAdv, paceTag } from './rules/travelPace';
import {
  CAMP_CHIP,
  CAMP_WATCHES,
  EXHAUSTION_DEATH,
  FIND_FACT,
  JOB_CHIP,
  MEETING_WANT,
  PUSH_ON_CHIP,
  STARVE_DAYS,
  TRAVEL_DAY_HOURS,
  TRAVEL_JOB,
  TRAVEL_JOBS,
  TRAVEL_ON_CHIP,
  WATCH_HOURS,
  eatRation,
  encounterDistanceFt,
  exhaustionD20,
  exhaustionLevel,
  extendedTravelDc,
  gainExhaustion,
  makeRouteStops,
  meetingOn,
  minEncounterDistanceFt,
  needsNavigation,
  routeKey,
  terrainRow,
  travelEngineChip,
  weatherFor,
  weatherRuleOf,
} from './rules/travelDay';
import { modeProfile } from './rules/modeProfile';
import { combineAdv, formatCheckRecord, proficiencyBonus, resolveCheckRecord, type CheckMod, type CheckResultRecord } from './checkRules';
import { skillCheckMods } from './checkMath';
import { applyCampRest } from './recoveryRules';
import { sidekickOf } from './rules/sidekick';
import { recruitedCompanions, settleCampTalk } from './rules/companions';
import { rollLoot } from './lootTableRegistry';
import { discoveryXpAmount } from './discoveryXpLedger';
import { applyCharacterXpGain } from './characterXp';
import { hidesPart } from './systemHousing';
import { deriveTabletopSheet } from './tabletop/characterBuild';
import { blockWithinXp, statBlockForEncounter } from './rules/srdMonsters';
import { encounterXpBudget, foesWithinBudget } from './xpRules';
import {
  hubsForBibleId,
  isLeaveSceneAction,
  matchHub,
  parseTravelDestination,
  resolveLeaveSceneDestination,
} from './outdoorHubs';
import { dungeonRoomPlace, resolvePlace } from './places';
import { findSettlement } from './worldMapAuthority';
import { engineAllowsCombat } from './beatContract';
import { initEncounterTerminal } from './encounterTerminalFsm';
import { buildHereSpot, withinPlaceSpot } from './hereSpot';
import { presentNpcRecords } from './npcRecords';
import { UNDERWAY_HERE, underwayHereLabel } from './locationName';

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

export { UNDERWAY_HERE };

const ROAD_LABELS = new Set([...Object.values(GROUND_LABEL), UNDERWAY_HERE].map((l) => l.toLowerCase()));

/** Every route name the engine hands the writer: the ground labels, this trip's HERE words, its two ends. */
export function routeNames(state: Pick<GameState, 'journey'>): string[] {
  return [
    ...Object.values(GROUND_LABEL),
    UNDERWAY_HERE,
    underwayHereLabel(state) ?? '',
    state.journey?.ground ?? '',
    state.journey?.from ?? '',
    state.journey?.to ?? '',
  ].filter((n) => !!n.trim());
}

const tidy = (s: string | undefined | null) => (s ?? '').replace(/\s+/g, ' ').trim();

/** A road label or the underway HERE: journey state, never a place. */
export function isRoadLabel(name: string | undefined | null): boolean {
  return ROAD_LABELS.has(tidy(name).toLowerCase());
}

/** A road label, or the trip's own HERE words while underway: never a place card or a place ref. */
export function isTripHere(state: Pick<GameState, 'journey'>, name: string | undefined | null): boolean {
  if (isRoadLabel(name)) return true;
  const trip = underwayHereLabel(state);
  return !!trip && tidy(name).toLowerCase() === trip.toLowerCase();
}

/** The last real place on the trip: its origin, else the last visited place card that is not a road. */
function journeyOrigin(state: Pick<GameState, 'journey' | 'places' | 'currentLocation'>): string {
  const from = tidy(state.journey?.from);
  if (from && !isRoadLabel(from)) return from;
  const visited = (state.places ?? [])
    .filter((p) => tidy(p.name) && !isRoadLabel(p.name) && typeof p.lastVisitedTurn === 'number')
    .sort((a, b) => (b.lastVisitedTurn ?? 0) - (a.lastVisitedTurn ?? 0));
  if (visited[0]) return tidy(visited[0].name);
  const here = tidy(state.currentLocation);
  return isRoadLabel(here) ? '' : here;
}

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

/** A step of the ground between places (walk on / turn back), not a task in the scene. */
export function isJourneyStepLine(input: string): boolean {
  const t = (input ?? '').trim();
  return WALK_ON.test(t) || TURN_BACK.test(t);
}

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
  signs: ['Study the signs'],
  plea: ['Help them', 'Pass them by'],
  lair: ['Scout the lair', 'Give the lair a wide berth'],
};

const CHAMPION_PAD = "Face the camp's champion";

/** The chip that opens a live fight for this meeting (null = no fight on offer). */
function fightPad(enc: RoadEncounter): string | null {
  if (enc.kind === 'camp') return enc.miniBoss ? CHAMPION_PAD : null;
  return FIGHT_KINDS.has(enc.kind) ? FIXED_ENCOUNTER_PADS[enc.kind]![0]! : null;
}

/** The meeting is over: fought and won or talked down, fled past, or the fight against it was lost. */
export function roadMeetingOver(enc: RoadEncounter): boolean {
  return !!enc.engaged || !!enc.escaped || !!enc.lost;
}

function encounterPads(enc: RoadEncounter, terrain: JourneyTerrain): string[] {
  if (roadMeetingOver(enc)) return [];
  if (enc.kind === 'wildlife') return [LIVES_PAD[terrain]];
  if (enc.kind === 'traveler') return [TALK_PAD[terrain]];
  if (enc.kind === 'camp' && enc.miniBoss) return ['Approach the camp', CHAMPION_PAD, 'Skirt around the camp'].map(withFailCost);
  return (FIXED_ENCOUNTER_PADS[enc.kind] ?? []).map(withFailCost);
}

/** TT32 — a chip that runs a check says what a failure costs: the meeting forces the fight. */
const FAIL_COST: Record<string, string> = {
  'hide from the creature': ', but fail and it attacks',
};
const FAIL_COST_TAIL = /,\s*but fail and (?:they|it) attacks?$/i;

function withFailCost(pad: string): string {
  const key = pad.toLowerCase();
  if (!MEETING_MOVE.has(key)) return pad;
  return `${pad}${FAIL_COST[key] ?? ', but fail and they attack'}`;
}

/** A meeting chip without its failure-cost tail ("Talk your way past the thugs"). */
export function meetingMoveBase(chip: string): string {
  return (chip ?? '').replace(/\s+/g, ' ').trim().replace(FAIL_COST_TAIL, '');
}

const TURN_BACK_REST_TURNS = 4;

/**
 * Chips for the ground between: walk on, this stretch's chance meeting (if any), turn back.
 * Turn back rests for a few turns after a bounce between the same places (the circling memory's
 * short return), unless the way on is blocked.
 */
export function journeyPads(
  state: Pick<GameState, 'journey' | 'places' | 'currentLocation'> & Partial<Pick<GameState, 'circling' | 'turn' | 'engineMode'>>
): string[] {
  const j = state.journey;
  if (!j || !isJourneyUnderway(state)) return [];
  const met = j.encounter ? encounterPads(j.encounter, j.terrain) : [];
  const spent = dayIsSpent(j);
  const forward = laneBlocked(j.encounter)
    ? []
    : spent
      ? [CAMP_CHIP, PUSH_ON_CHIP]
      : ['Walk on', ...(canTravelOn(j) ? [TRAVEL_ON_CHIP] : [])];
  const job = spent || (j.encounter && !roadMeetingOver(j.encounter)) ? null : jobChip(state, j);
  const origin = journeyOrigin(state);
  const bounced = state.circling?.shortReturnTurn;
  const rested = forward.length > 0 && bounced != null && (state.turn ?? 0) - bounced < TURN_BACK_REST_TURNS;
  return [...forward, ...met, ...(job ? [job] : []), ...(origin && !rested ? [`Turn back toward ${origin}`] : [])];
}

export function isJourneyPad(choice: string): boolean {
  const t = meetingMoveBase(choice).toLowerCase();
  const known = [
    ...Object.values(TALK_PAD),
    ...Object.values(LIVES_PAD),
    ...Object.values(FIXED_ENCOUNTER_PADS).flat(),
    CHAMPION_PAD,
  ];
  return WALK_ON.test(t) || /^turn back toward\s+\S/i.test(t) || !!travelEngineChip(t) || known.some((p) => p.toLowerCase() === t);
}

/** Meetings that can be faced as a fight. */
const FIGHT_KINDS = new Set<RoadEncounterKind>(['thugs', 'undead', 'monster', 'villain']);

/** A hostile meeting still standing in the lane. Walk on is not a free pass past it; a flee that got clear is. */
function laneBlocked(enc: RoadEncounter | null | undefined): boolean {
  return !!enc && !roadMeetingOver(enc) && FIGHT_KINDS.has(enc.kind);
}
/** Share of hostile meetings that are a rare spawn (uncommon, not every meeting). */
export const RARE_SPAWN_CHANCE = 0.12;
/** Share of camps that hold a mini-boss. */
export const CAMP_MINI_BOSS_CHANCE = 0.5;

export interface StretchContext {
  terrain: JourneyTerrain;
  haunted: boolean;
  areaTier: number;
  /** Leg index being walked (1-based). */
  stretch: number;
  legsTotal: number;
  quietStretches: number;
}

/** The area tier from which the ground is dangerous. */
const DANGEROUS_TIER = 3;

/** Kinds that fit the ground. Monsters and villains only where the area is dangerous (tier 3+). */
export function encounterPool(ctx: StretchContext): RoadEncounterKind[] {
  const high = ctx.areaTier >= DANGEROUS_TIER;
  const edgeOfWilds = ctx.stretch <= 1 || ctx.stretch >= ctx.legsTotal - 1;
  const pool: RoadEncounterKind[] = [];
  if (ctx.haunted) pool.push('undead', 'undead', 'undead', 'signs');
  if (ctx.terrain === 'forest' || ctx.terrain === 'marsh' || ctx.terrain === 'mountain') {
    pool.push('wildlife', 'wildlife', 'signs', 'lair');
    if (edgeOfWilds && ctx.terrain !== 'mountain') pool.push('camp');
    if (high) pool.push('monster');
  } else if (ctx.terrain === 'road' || ctx.terrain === 'coast') {
    pool.push('traveler', 'meeting', 'plea', 'camp', 'signs', 'thugs');
    if (high) pool.push('villain', 'monster');
  } else {
    pool.push('traveler', 'meeting', 'plea', 'thugs');
    if (high) pool.push('villain');
  }
  return pool;
}

const SOCIAL_KINDS = new Set<RoadEncounterKind>(['traveler', 'meeting']);

/**
 * The pool with each kind repeated by its pillar slider (Combat for fights, Social for people who talk,
 * Exploration for wildlife and camps), in the same order. At 50/50/50 the pick is the unweighted pool's.
 */
export function weightedEncounterPool(pool: RoadEncounterKind[], rules: Pick<HouseRules, 'combatFrequency' | 'socialRoleplay' | 'worldBuilding'>): RoadEncounterKind[] {
  const copies = (k: RoadEncounterKind) =>
    pillarCopies(FIGHT_KINDS.has(k) ? rules.combatFrequency : SOCIAL_KINDS.has(k) ? rules.socialRoleplay : rules.worldBuilding);
  const out = pool.flatMap((k) => Array<RoadEncounterKind>(copies(k)).fill(k));
  return out.length ? out : pool;
}

type PillarRules = Pick<HouseRules, 'combatFrequency' | 'socialRoleplay' | 'worldBuilding'>;

/**
 * Share of meetings that are hostile (GM call, tuned by the pillar sliders): Combat against the average of Social
 * and Exploration, counted twice. At 50/50/50 one meeting in three is hostile, two in three are not.
 */
export function hostileShare(rules: PillarRules): number {
  const hostile = pillarCopies(rules.combatFrequency);
  const other = (pillarCopies(rules.socialRoleplay) + pillarCopies(rules.worldBuilding)) / 2;
  return hostile + 2 * other > 0 ? hostile / (hostile + 2 * other) : 0;
}

const at = (n: number, roll: number) => Math.min(n - 1, Math.max(0, Math.floor(roll * n)));

/** Hostile or not first (by `hostileShare`), then the kind inside that group by the sliders. */
export function pickMeetingKind(pool: RoadEncounterKind[], kindRoll: number, rules: PillarRules): RoadEncounterKind | null {
  const weighted = weightedEncounterPool(pool, rules);
  const hostile = weighted.filter((k) => FIGHT_KINDS.has(k));
  const other = weighted.filter((k) => !FIGHT_KINDS.has(k));
  if (!hostile.length || !other.length) {
    const only = hostile.length ? hostile : other;
    return only.length ? only[at(only.length, kindRoll)]! : null;
  }
  const calm = 1 - hostileShare(rules);
  if (kindRoll < calm) return other[at(other.length, kindRoll / calm)]!;
  return hostile[at(hostile.length, (kindRoll - calm) / (1 - calm))]!;
}

/**
 * One meeting check (a watch on the road or at camp). `chanceRoll`, `kindRoll` and `spawnRoll` are in [0, 1).
 * The check is a d6: a meeting on 1, or on 1–2 on dangerous or haunted ground (`meetingOn`).
 * `spawnRoll` decides a rare spawn (hostile kinds) or a camp mini-boss; 1 = neither.
 * Returns null for a quiet watch.
 */
export function rollRoadEncounter(
  ctx: StretchContext,
  level: number,
  chanceRoll: number,
  kindRoll: number,
  spawnRoll = 1,
  rules: PillarRules = DEFAULT_HOUSE_RULES
): RoadEncounter | null {
  if (chanceRoll >= meetingOn(ctx.haunted || ctx.areaTier >= DANGEROUS_TIER) / 6) return null;
  const kind = pickMeetingKind(encounterPool(ctx), kindRoll, rules);
  if (!kind) return null;
  const enc: RoadEncounter = { kind, level, stretch: ctx.stretch, dangerous: ctx.areaTier >= DANGEROUS_TIER };
  if (FIGHT_KINDS.has(kind) && spawnRoll < RARE_SPAWN_CHANCE) enc.rare = true;
  if (kind === 'camp' && spawnRoll < CAMP_MINI_BOSS_CHANCE) enc.miniBoss = true;
  return enc;
}

let replayRecordedMeetings = false;

/**
 * Replay bank only (`replayRun`): a saved tape keeps the meetings it recorded under the roll it was made with
 * (a chance on every stretch, sure after 2 quiet stretches, the old kind pool, no camp-watch meetings).
 * Live play (`useGame`) and new fate-autoplay runs never set this; they use the d6 per watch.
 */
export function setReplayRecordedMeetings(on: boolean): void {
  replayRecordedMeetings = on;
}

export function replayKeepsRecordedMeetings(): boolean {
  return replayRecordedMeetings;
}

const RECORDED_CHANCE = 0.4;
const RECORDED_QUIET_STEP = 0.25;
const RECORDED_MAX_QUIET = 2;

function recordedTapePool(ctx: StretchContext): RoadEncounterKind[] {
  const high = ctx.areaTier >= DANGEROUS_TIER;
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

function recordedTapeMeeting(
  ctx: StretchContext,
  level: number,
  chanceRoll: number,
  kindRoll: number,
  spawnRoll: number,
  rules: PillarRules
): RoadEncounter | null {
  const chance = ctx.quietStretches >= RECORDED_MAX_QUIET ? 1 : RECORDED_CHANCE + RECORDED_QUIET_STEP * ctx.quietStretches;
  if (chanceRoll >= chance) return null;
  const pool = weightedEncounterPool(recordedTapePool(ctx), rules);
  if (!pool.length) return null;
  const kind = pool[at(pool.length, kindRoll)]!;
  const enc: RoadEncounter = { kind, level, stretch: ctx.stretch, dangerous: ctx.areaTier >= DANGEROUS_TIER };
  if (FIGHT_KINDS.has(kind) && spawnRoll < RARE_SPAWN_CHANCE) enc.rare = true;
  if (kind === 'camp' && spawnRoll < CAMP_MINI_BOSS_CHANCE) enc.miniBoss = true;
  return enc;
}

const FOE_NAME: Partial<Record<RoadEncounterKind, string>> = {
  thugs: 'the thugs',
  undead: 'the restless dead',
  monster: 'the creature',
  camp: "the camp's champion",
};

/**
 * The live foe for a faced meeting, at the area level. A rare spawn is a little tougher than the
 * ordinary foe on that ground; a camp mini-boss is a level higher with about twice the HP. The name is
 * a concrete short name. A villain is not the chip phrase. The chips may still say face or talk.
 */
const VILLAIN_NAMES = ['Rook Vale', 'Sarn Holt', 'Mara Quinn', 'Bren Tull'];

function concreteRoadFoeName(enc: RoadEncounter): string {
  if (enc.kind !== 'villain') return FOE_NAME[enc.kind] ?? 'the foe';
  const n = Math.abs(enc.stretch * 7 + Math.round(enc.level) * 3) % VILLAIN_NAMES.length;
  return VILLAIN_NAMES[n]!;
}

export function roadFoe(enc: RoadEncounter): ActiveEncounter {
  const lvl = Math.max(1, Math.round(enc.level));
  const boss = enc.kind === 'camp' && !!enc.miniBoss;
  const level = boss ? lvl + 1 : lvl;
  const hp = 10 + level * 4;
  const ac = 10 + Math.min(5, Math.ceil(level / 2));
  const xp = 20 + level * 5;
  const gold = 3 + level * 2;
  const mult = boss ? 2.2 : enc.rare ? 1.25 : 1;
  const maxHp = Math.round(hp * mult);
  const step = boss ? 3 : enc.rare ? 1 : 0;
  return {
    name: concreteRoadFoeName(enc),
    level,
    hp: maxHp,
    maxHp,
    armorClass: ac + (boss ? 2 : step),
    strength: 10 + level + step,
    dexterity: 10 + (boss ? 2 : 0),
    constitution: 10 + level + step,
    xpReward: Math.round(xp * (boss ? 2 : enc.rare ? 1.25 : 1)),
    goldReward: Math.round(gold * (boss ? 2 : enc.rare ? 1.5 : 1)),
    source: boss ? 'road-camp-elite' : enc.rare ? 'road-rare-spawn' : 'road-encounter',
    ...(enc.count && enc.count > 1 ? { count: enc.count } : {}),
  };
}

/**
 * Encounter level from the area tier by the treasure rule (tier â†’ level, clamped to party Â±3).
 * Ordinary ground (below the dangerous tier) meets the player at most one level above them.
 */
export function roadEncounterLevel(state: GameState, areaTier: number): number {
  const area = resolveLocalAreaLevel({
    ...state,
    activeDungeon: null,
    locationSheet: null,
    places: [],
    journey: null,
    threatTier: areaTier,
  });
  return areaTier >= DANGEROUS_TIER ? area.level : Math.min(area.level, area.partyLevel + 1);
}

function hashUnit(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 0x100000000;
}

function seededRng(key: string): () => number {
  let i = 0;
  return () => hashUnit(`${key}|r${i++}`);
}

/** Seed for this trip (the save, both ends, the turn it set out). */
function tripKey(state: GameState, j: TravelJourney): string {
  return `${state.seed ?? ''}|${j.from}|${j.to}|${j.startedTurn}`;
}

function stretchContext(j: TravelJourney): StretchContext {
  return {
    terrain: j.terrain,
    haunted: !!j.haunted,
    areaTier: j.areaTier ?? 1,
    stretch: j.legsDone,
    legsTotal: j.legsTotal,
    quietStretches: j.quietStretches ?? 0,
  };
}

/** One meeting check at `key`, sized and dressed (what it wants, how far off, whether it caught the party unseen). */
function meetingCheck(state: GameState, j: TravelJourney, key: string, unwatched: boolean): RoadEncounter | null {
  const areaTier = j.areaTier ?? 1;
  const encounter = rollRoadEncounter(
    stretchContext(j),
    roadEncounterLevel(state, areaTier),
    hashUnit(`${key}|chance`),
    hashUnit(`${key}|kind`),
    engineAllowsCombat(state) ? hashUnit(`${key}|spawn`) : 1,
    houseRulesOf(state)
  );
  if (!encounter) return null;
  sizeMeeting(state, encounter, key);
  const want = MEETING_WANT[encounter.kind]?.[at(MEETING_WANT[encounter.kind]!.length, hashUnit(`${key}|want`))];
  if (want) encounter.want = want;
  encounter.distanceFt = unwatched ? minEncounterDistanceFt(j.terrain) : encounterDistanceFt(j.terrain, seededRng(`${key}|distance`));
  if (unwatched && FIGHT_KINDS.has(encounter.kind)) encounter.surprisesParty = true;
  return encounter;
}

/**
 * This stretch's meeting check (seed-stable for the save, trip and leg). One check per watch: at set-out and once
 * 4 hours have passed on the road since the last one (`check`); otherwise the stretch is quiet. A look-out who
 * failed today's roll lets a hostile meeting get close unseen (SRD: the party is surprised).
 */
function rollStretch(state: GameState, j: TravelJourney, check = true): TravelJourney {
  const quiet = j.quietStretches ?? 0;
  if (replayRecordedMeetings) {
    const key = `${tripKey(state, j)}|${j.legsDone}`;
    const areaTier = j.areaTier ?? 1;
    const encounter = recordedTapeMeeting(
      stretchContext(j),
      roadEncounterLevel(state, areaTier),
      hashUnit(`${key}|chance`),
      hashUnit(`${key}|kind`),
      engineAllowsCombat(state) ? hashUnit(`${key}|spawn`) : 1,
      houseRulesOf(state)
    );
    if (encounter) sizeMeeting(state, encounter, key);
    return { ...j, encounter, quietStretches: encounter ? 0 : quiet + 1, hoursSinceCheck: 0 };
  }
  if (!check) return { ...j, encounter: null, quietStretches: quiet + 1 };
  const key = `${tripKey(state, j)}|${j.legsDone}`;
  const encounter = meetingCheck(state, j, key, j.jobResults?.lookout === false);
  return { ...j, encounter, quietStretches: encounter ? 0 : quiet + 1, hoursSinceCheck: 0 };
}

/** Meetings that stand as a group: the engine rolls how many (tabletop: no bigger than the SRD 5.2.1 budget). */
function sizeMeeting(state: GameState, encounter: RoadEncounter, key: string): void {
  if (GROUP_KINDS.has(encounter.kind)) {
    encounter.count = 2 + Math.floor(hashUnit(`${key}|count`) * 3);
    if (state.engineMode === 'dnd') {
      // Tabletop: the group is no bigger than the SRD 5.2.1 budget for this party (the fight fits the same budget).
      const band = { easy: 0, normal: 1, hard: 2, deadly: 2 }[houseRulesOf(state).encounterDifficulty] as 0 | 1 | 2;
      const party = 1 + ((state.companions ?? []).length ? 1 : 0);
      const budget = encounterXpBudget(state.character?.level || 1, party, band);
      const block = blockWithinXp(statBlockForEncounter(roadFoe(encounter)), budget);
      encounter.count = foesWithinBudget(block.cr, encounter.count, budget);
      if (encounter.count < 2) delete encounter.count;
    }
  }
}

/** Meetings that stand as a group: the engine rolls how many. */
const GROUP_KINDS = new Set<RoadEncounterKind>(['thugs', 'undead']);
const COUNT_WORD = ['', 'one', 'two', 'three', 'four'];

/** The rolled headcount, as the receipt and the writer fact both print it. */
function meetingCount(e: RoadEncounter): string {
  const n = e.count && COUNT_WORD[e.count];
  return n ? `, ${n} of them` : '';
}

const ENCOUNTER_LABEL: Record<RoadEncounterKind, string> = {
  wildlife: 'wildlife',
  traveler: 'a traveler',
  meeting: 'a stranger',
  thugs: 'thugs',
  camp: 'a camp',
  undead: 'the restless dead',
  monster: 'a monster',
  villain: 'a villain',
  signs: 'signs on the way',
  plea: 'someone in need',
  lair: 'a lair',
};

/** The ledger label of a road meeting: the writer's ref, the speaker it may name and the turn check all read this one. */
export function roadMeetingLabel(kind: RoadEncounterKind): string {
  return ENCOUNTER_LABEL[kind];
}

/** The stretch already has a life: what the meeting is doing there before the player arrives. */
const ENCOUNTER_LIFE: Record<RoadEncounterKind, string> = {
  wildlife: 'going about its own day',
  traveler: 'on their own errand',
  meeting: 'on their own errand',
  thugs: 'working this stretch',
  camp: 'camped here for its own reason',
  undead: 'bound to this ground',
  monster: 'hunting its own ground',
  villain: 'here on their own business',
  signs: 'left by whatever passed this way',
  plea: 'in trouble on the road',
  lair: 'off to one side of the way',
};

/** What is seen, not who: signs and a lair are the scene, not a meeting with anyone. */
const SCENE_KINDS = new Set<RoadEncounterKind>(['signs', 'lair']);
/** What the meeting wants (or, for signs, a plea or a lair, what is seen), as the writer and the receipt both say it. */
function meetingWant(e: RoadEncounter): string {
  if (!e.want) return '';
  return SCENE_KINDS.has(e.kind) || e.kind === 'plea' ? e.want : `wants: ${e.want}`;
}

/**
 * Writer fact: the meeting on this stretch is on the page before any chip meets it.
 * Who or what only: the meeting's reason for being here is STATUS chrome, so no one recites it.
 */
export function roadMeetingFact(j: TravelJourney | null | undefined): string {
  const e = j?.encounter;
  if (!e || roadMeetingOver(e)) return '';
  const base = e.kind === 'wildlife' && e.dangerous ? 'dangerous wildlife' : ENCOUNTER_LABEL[e.kind];
  const want = meetingWant(e);
  if (SCENE_KINDS.has(e.kind)) {
    return `On this stretch: ${want || base}. Show it plainly in the story, so the next choice can meet it.`;
  }
  const near = e.surprisesParty ? ' It was not seen until it was close.' : '';
  const intent = !want ? '' : e.kind === 'plea' ? ` ${want.charAt(0).toUpperCase()}${want.slice(1)}.` : ` What it ${want}.`;
  return `On this stretch: ${base}${meetingCount(e)}.${intent}${near} Show it plainly in the story (seen or heard, not named as a list), what it wants before any blow, so the next choice can meet it.`;
}

const TIME_SLOT = '(dawn|morning|midday|afternoon|dusk|evening|night)';

/**
 * tt-fix-4 — a travel receipt as the writer is handed it: the destination and a plain time fact.
 * Legs, spans, "still ahead" and the chance-meeting note stay on STATUS (the meeting reaches the writer
 * through `roadMeetingFact`). Null when the receipt is not a travel receipt.
 */
export function writerTravelFact(receipt: string): string | null {
  const r = (receipt ?? '').replace(/\s+/g, ' ').trim().replace(/\.$/, '');
  if (!/^Travel:/i.test(r)) return null;
  const slot = r.match(new RegExp(`\\bnow ${TIME_SLOT}\\b`, 'i'))?.[1] ?? r.match(new RegExp(`\\(${TIME_SLOT}\\)`, 'i'))?.[1];
  const passed = /\+\s*\d/.test(r);
  const time = slot
    ? passed ? ` Some time passed on the way; it is now ${slot}.` : ` It is ${slot}.`
    : passed ? ' Some time passed on the way.' : '';
  const to =
    r.match(/;\s*([^;]+?) still ahead\b/)?.[1]
    ?? r.match(/\bbetween .+? and (.+?)(?: at a \w+ pace)?(?: \(| —|;|$)/)?.[1];
  if (to && /the way on is blocked/i.test(r)) return `Still on the way to ${to}; the way on is blocked.${time}`;
  if (to && /^Travel: still on\b/i.test(r)) return `Still on the way to ${to}, not there yet.${time}`;
  if (to) return `On the way to ${to}, not there yet.${time}`;
  const dest = r.match(/^Travel: .* to (.+?)(?: at a \w+ pace)?(?: — |$)/)?.[1];
  return dest ? `Arrived at ${dest}.${time}` : null;
}

/** The engine fact with every travel receipt in it swapped for its writer form (`writerTravelFact`). */
export function writerEngineResult(fact: string): string {
  return (fact ?? '').replace(/Travel: .*?\.(?=\s+[A-Z]|\s*$)/g, (m) => writerTravelFact(m) ?? m);
}

/** Meetings with someone who can speak. */
const SPEAKING_KINDS = new Set<RoadEncounterKind>(['traveler', 'meeting', 'thugs', 'villain', 'plea']);

/** The meeting in this beat: open on this stretch, or closed by this turn's own talk, fight or flight. */
function meetingOnBeat(state: Pick<GameState, 'journey' | 'turn'>): RoadEncounter | null {
  const j = state.journey;
  const e = j?.encounter;
  if (!e || j!.legsDone >= j!.legsTotal || SCENE_KINDS.has(e.kind)) return null;
  if (!roadMeetingOver(e)) return e;
  return e.closedTurn != null && e.closedTurn === state.turn ? e : null;
}

/** Who or what the road meeting puts in this beat, with the engine's count ("thugs, four of them"). */
export function roadMeetingOnBeat(state: Pick<GameState, 'journey' | 'turn'>): { label: string; count: number } | null {
  const e = meetingOnBeat(state);
  if (!e) return null;
  return { label: `${ENCOUNTER_LABEL[e.kind]}${meetingCount(e)}`, count: Math.max(1, e.count ?? 1) };
}

/** The person this beat's road meeting puts on the road (its ledger label), if one can speak. */
export function roadMeetingPerson(state: Pick<GameState, 'journey' | 'turn'>): string {
  const e = meetingOnBeat(state);
  return e && SPEAKING_KINDS.has(e.kind) ? ENCOUNTER_LABEL[e.kind] : '';
}

/** Receipt fragment for this stretch (chrome + ENGINE RESULT; the writer names who or what). */
function encounterNote(j: TravelJourney): string {
  const e = j.encounter;
  if (!e) return '; quiet stretch, nobody met on the road';
  const base = e.kind === 'wildlife' && e.dangerous ? 'dangerous wildlife' : ENCOUNTER_LABEL[e.kind];
  if (e.escaped) return `; got away from ${base}, not beaten`;
  if (e.lost) return `; lost the fight to ${base}, not beaten`;
  if (e.engaged) return `; ${base} dealt with`;
  const label = e.kind === 'camp' && e.miniBoss
    ? 'a camp with a mini-boss'
    : e.rare
      ? `rare spawn, ${base}`
      : base;
  const want = meetingWant(e);
  const off = e.distanceFt ? `, ${e.distanceFt} ft off` : '';
  const close = e.surprisesParty ? ', not spotted until close' : '';
  return `; chance meeting: ${label} (level ${e.level})${meetingCount(e)}, ${ENCOUNTER_LIFE[e.kind]}${want ? `; ${want}` : ''}${off}${close}`;
}

const FIGHT_WORDS = /^(?:face|fight|attack|charge|challenge)\b/i;

/** The player faces a meeting that can be fought and has not been fought yet. */
function facesFight(input: string, enc: RoadEncounter): boolean {
  const pad = fightPad(enc);
  if (!pad || roadMeetingOver(enc)) return false;
  return input.toLowerCase() === pad.toLowerCase() || FIGHT_WORDS.test(input);
}

const ROAD_FOE_SOURCES = new Set(['road-encounter', 'road-rare-spawn', 'road-camp-elite']);
const FLEE_WORDS = /\b(flee|run away|escape|retreat|withdraw|bolt)\b/i;

/** The meeting's own non-fight chips and the existing check each one runs (talk = parley, slip past = flee). */
const MEETING_MOVE = new Map<string, 'parley' | 'flee'>([
  ['talk your way past the thugs', 'parley'],
  ['talk to whoever blocks the way', 'parley'],
  ['slip past the dead', 'flee'],
  ['skirt around the camp', 'flee'],
  ['hide from the creature', 'flee'],
]);

/** The check this meeting's own talk / slip chip runs, when the meeting can still be fought. Null otherwise. */
export function roadMeetingMove(state: Pick<GameState, 'journey'>, raw: string): 'parley' | 'flee' | null {
  const enc = state.journey?.encounter;
  if (!enc || !fightPad(enc) || roadMeetingOver(enc)) return null;
  const chip = meetingMoveBase(raw).toLowerCase();
  if (!encounterPads(enc, state.journey!.terrain).some((p) => meetingMoveBase(p).toLowerCase() === chip)) return null;
  return MEETING_MOVE.get(chip) ?? null;
}

function liveRoadFoe(state: GameState, enc: RoadEncounter): ActiveEncounter {
  return initEncounterTerminal(roadFoe(enc), state, { forcedSpawnKey: `road-${enc.kind}` });
}

/**
 * Before the fight engine: the road meeting this input takes on, as the foe the engine settles this turn.
 * Facing a fightable meeting, or fleeing one that blocks the lane. Null otherwise.
 * Story RPG spawns no fights of its own, but a meeting it already offers chips for is settled the same way.
 */
export function roadFoeForEngine(state: GameState, raw: string): ActiveEncounter | null {
  const j = state.journey;
  const enc = j?.encounter;
  const settles = engineAllowsCombat(state) || state.engineMode === 'rpg';
  if (!enc || state.activeEncounter || !isJourneyUnderway(state) || !settles) return null;
  const input = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (facesFight(input, enc)) return liveRoadFoe(state, enc);
  if (FLEE_WORDS.test(input) && laneBlocked(enc)) return liveRoadFoe(state, enc);
  if (roadMeetingMove(state, input)) return liveRoadFoe(state, enc);
  return null;
}

/** The foe is this trip's road meeting (not a place threat or a director spawn). */
export function isRoadFoe(state: Pick<GameState, 'journey'>, foe: ActiveEncounter | null | undefined): boolean {
  return !!foe && !!state.journey?.encounter && ROAD_FOE_SOURCES.has(foe.source ?? '');
}

/**
 * After the fight engine settled a road foe: a win or a talk-down deals with the meeting, a flee that got
 * clear slips past it (escaped, not beaten), a loss ends it (lost, not beaten). Each one closes the meeting.
 */
export function settleRoadMeeting(
  state: GameState,
  outcome: 'victory' | 'escape' | 'parleyResolved' | 'defeat' | 'capture'
): GameState {
  const j = state.journey;
  if (!j?.encounter) return state;
  const enc = j.encounter;
  const next: RoadEncounter =
    outcome === 'escape'
      ? { ...enc, escaped: true, escapedTurn: state.turn, closedTurn: state.turn }
      : outcome === 'victory' || outcome === 'parleyResolved'
        ? { ...enc, engaged: true, closedTurn: state.turn }
        : { ...enc, lost: true, closedTurn: state.turn };
  return next === enc ? state : { ...state, journey: { ...j, encounter: next } };
}

/** What the travel engine did this turn (the packet's Outcome, never read from the player's words). */
export type TravelEngineOutcome = 'set out' | 'arrived' | 'fight opened' | 'blocked' | 'unchanged' | 'slipped away';

export interface TravelCommit {
  state: GameState;
  /** This turn's travel owned HERE (moved, started, advanced, or stayed on the ground). */
  handled: boolean;
  /** Arrived at a destination this turn. */
  arrived: boolean;
  /** A leg of a trip started or advanced this turn without arriving. */
  underway?: boolean;
  /** STATUS + ENGINE RESULT line (chrome, not prose). */
  receipt?: string;
  /** The typed engine result for this turn (every branch sets it). */
  outcome: TravelEngineOutcome;
  /** More STATUS lines (weather, job rolls, saves, rations, rest, finds), shown by mode. */
  extra?: string[];
  /** Writer facts for this beat (kept on `state.travelBeat`). */
  facts?: string[];
  /** What stopped "Travel on" on this stretch. */
  event?: 'meeting' | 'lost' | 'find' | 'day spent' | 'camp';
}

/** What the travel engine did this turn, for the writer's Outcome (never decided by the player's words). */
export function travelOutcome(
  commit: TravelCommit | null | undefined,
  hereBefore: string,
  after: GameState
): { arrived: boolean; underway: boolean; outcome: TravelEngineOutcome } {
  if (commit?.arrived) return { arrived: true, underway: false, outcome: 'arrived' };
  if (commit?.underway) return { arrived: false, underway: true, outcome: 'set out' };
  if (commit && commit.outcome !== 'unchanged') return { arrived: false, underway: false, outcome: commit.outcome };
  const here = tidy(after.currentLocation);
  const moved =
    !!here
    && here.toLowerCase() !== tidy(hereBefore).toLowerCase()
    && !isRoadLabel(here)
    && !isJourneyUnderway(after);
  return { arrived: moved, underway: false, outcome: moved ? 'arrived' : 'unchanged' };
}

function unchanged(state: GameState): TravelCommit {
  return { state, handled: false, arrived: false, outcome: 'unchanged' };
}

function arrive(state: GameState, dest: string, hours: number, from: string, terrain?: JourneyTerrain, trip = false): TravelCommit {
  const clock = advanceClock({ ...state, currentLocation: dest, journey: null }, hours);
  const facts = trip ? arrivalFacts(state, dest) : [];
  return {
    state: clock.state,
    handled: true,
    arrived: true,
    outcome: 'arrived',
    receipt: `Travel: ${from} to ${dest}${paceTag(state, terrain)} — ${clock.note}`,
    ...(facts.length ? { facts } : {}),
  };
}

const firstSentence = (s: string | undefined | null): string => {
  const t = tidy(s);
  const m = t.match(/^.+?[.!?](?=\s|$)/);
  return m ? m[0] : t ? `${t}.` : '';
};

/** Arrival after a trip: the first sight of the place (its map blurb, once) and one hook waiting there. */
function arrivalFacts(state: GameState, dest: string): string[] {
  const hub = matchHub(hubsForBibleId(state.campaignBibleId), dest);
  const settlement = findSettlement(state.worldAtlas, hub?.name ?? dest);
  const place = resolvePlace(state.places, hub?.name ?? dest);
  const facts: string[] = [];
  const sight = firstSentence(hub?.blurb || settlement?.blurb || place?.description);
  if (sight && typeof place?.lastVisitedTurn !== 'number') facts.push(`First sight of ${dest}: ${sight}`);
  const hook = arrivalHook(state, dest, hub?.linkedQuestIds ?? []);
  if (hook) facts.push(hook);
  return facts;
}

function arrivalHook(state: GameState, dest: string, linked: string[]): string | null {
  const here = dest.toLowerCase();
  const names = (s?: string) => {
    const t = (s ?? '').toLowerCase().trim();
    return t.length >= 4 && (t.includes(here) || here.includes(t));
  };
  const open = (state.quests ?? []).filter((q) => q.status !== 'completed' && q.status !== 'failed');
  const lead = open.find(
    (q) => (q.revealed || q.status === 'active')
      && (names(q.location) || names(q.leadsTo) || names(q.locationRef) || (q.objectives ?? []).some((o) => !o.completed && names(o.place)))
  );
  if (lead) {
    const step = (lead.objectives ?? []).find((o) => !o.completed)?.description;
    return `A lead waits here: ${lead.name}${step ? ` — ${step}` : ''}.`;
  }
  const word = linked.map((id) => open.find((q) => q.id === id)).find(Boolean);
  return word ? `Word here points to ${word.name}.` : null;
}

/** `via` is the road the player is already on (a redirect mid-trip); the receipt sets out from it, not from `from`. */
function startJourney(state: GameState, from: string, to: string, gap: MapGap, via?: string): TravelCommit {
  const day = rollDay(state, {
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
    day: 1,
    hoursToday: gap.hoursPerLeg,
    hoursSinceCheck: 0,
  });
  const journey = rollStretch(state, day.journey);
  const stop = passStop(withRouteStops(state, journey), journey);
  const clock = advanceClock({ ...stop.state, currentLocation: UNDERWAY_HERE, journey }, gap.hoursPerLeg);
  const extra = [...day.status, ...stop.status, ...daySpentLines(state, journey)];
  const facts = [...day.facts, ...stop.facts, ...daySpentFacts(journey)];
  return {
    state: clock.state,
    handled: true,
    arrived: false,
    underway: true,
    outcome: 'set out',
    ...(extra.length ? { extra } : {}),
    ...(facts.length ? { facts } : {}),
    ...stretchEvent(journey, day.lost, stop.found),
    receipt: via
      ? `Travel: off ${via}, now toward ${to}${paceTag(state, gap.terrain)} — leg 1 of ${journey.legsTotal} — ${clock.note}; ${to} still ahead${encounterNote(journey)}`
      : `Travel: ${journey.ground.toLowerCase()} between ${from} and ${to}${paceTag(state, gap.terrain)} — leg 1 of ${journey.legsTotal} — ${clock.note}; ${to} still ahead${encounterNote(journey)}`,
  };
}

function goTo(state: GameState, from: string, dest: string, via?: string): TravelCommit {
  if (isTripHere(state, dest)) return unchanged(state);
  const mapped = mapGapBetween(state, from, dest);
  if (mapped.steps <= 0) return unchanged(state);
  const gap: MapGap = { ...mapped, hoursPerLeg: hoursAtPace(state, mapped.hoursPerLeg, mapped.terrain) };
  if (gap.steps === 1) return arrive(state, dest, gap.hoursPerLeg, via ?? from, gap.terrain);
  return startJourney(state, from, dest, gap, via);
}

function stepAlong(state: GameState, j: TravelJourney): TravelCommit {
  const legsDone = j.legsDone + 1;
  const march = marchHours(state, j, j.hoursPerLeg);
  const sinceCheck = (j.hoursSinceCheck ?? 0) + j.hoursPerLeg;
  const day = rollDay(march.state, { ...march.journey, legsDone, lost: false, hoursSinceCheck: sinceCheck });
  const extra = [...march.status, ...day.status];
  const facts = [...march.facts, ...day.facts];
  if (legsDone >= day.journey.legsTotal) {
    const a = arrive(march.state, j.to, j.hoursPerLeg, j.ground.toLowerCase(), j.terrain, true);
    const all = [...facts, ...(a.facts ?? [])];
    return { ...a, ...(extra.length ? { extra } : {}), ...(all.length ? { facts: all } : {}) };
  }
  const journey = rollStretch(march.state, day.journey, sinceCheck >= WATCH_HOURS);
  const stop = passStop(withRouteStops(march.state, journey), journey);
  const clock = advanceClock({ ...stop.state, currentLocation: UNDERWAY_HERE, journey }, j.hoursPerLeg);
  extra.push(...stop.status, ...daySpentLines(state, journey));
  facts.push(...stop.facts, ...daySpentFacts(journey));
  return {
    state: clock.state,
    handled: true,
    arrived: false,
    underway: true,
    outcome: 'set out',
    ...(extra.length ? { extra } : {}),
    ...(facts.length ? { facts } : {}),
    ...stretchEvent(journey, day.lost, stop.found),
    receipt: `Travel: ${j.ground.toLowerCase()} between ${j.from} and ${j.to}${paceTag(state, j.terrain)} — leg ${legsDone} of ${journey.legsTotal} — ${clock.note}; ${j.to} still ahead${encounterNote(journey)}`,
  };
}

// ---------------------------------------------------------------------------------------------------------------
// tt-travel — the travel day (rules/travelDay holds the SRD numbers and the GM calls).

const survival = (state: Pick<GameState, 'engineMode'>) => modeProfile(state.engineMode).travelSurvival;
/** A walk across town is not a travel day: no weather, jobs, stops or camp on the streets. */
const travelDay = (j: TravelJourney) => j.terrain !== 'streets';

function stretchEvent(j: TravelJourney, lost: boolean, found: boolean): Pick<TravelCommit, 'event'> {
  const event: TravelCommit['event'] =
    j.encounter && !roadMeetingOver(j.encounter) ? 'meeting' : lost ? 'lost' : found ? 'find' : dayIsSpent(j) ? 'day spent' : undefined;
  return event ? { event } : {};
}

/** The next stretch would take the day past 8 hours on the road (SRD Extended Travel). */
export function dayIsSpent(j: TravelJourney): boolean {
  return travelDay(j) && (j.hoursToday ?? 0) + j.hoursPerLeg > TRAVEL_DAY_HOURS;
}

function canTravelOn(j: TravelJourney): boolean {
  return (
    !dayIsSpent(j)
    && (j.areaTier ?? 1) < DANGEROUS_TIER
    && !j.haunted
    && (!j.encounter || roadMeetingOver(j.encounter))
    && j.legsTotal - j.legsDone >= 2
  );
}

function slotNow(state: GameState): string {
  return timeOfDayForHour(currentHour(state));
}

function stillOn(state: GameState, j: TravelJourney, what: string): string {
  return `Travel: still on the ${j.ground.toLowerCase()} between ${j.from} and ${j.to} (${slotNow(state)}); ${what}; ${j.to} still ahead`;
}

/** Who travels with the PC and can take a job: the tabletop sidekick, else the first recruited companion. */
function travelHelper(state: GameState): string | null {
  return sidekickOf(state)?.name ?? recruitedCompanions(state)[0]?.name ?? null;
}

function jobOpen(state: GameState, j: TravelJourney, job: TravelJob): boolean {
  if (job === 'guide') return needsNavigation(j.terrain, j.weather);
  if (job === 'forager') return survival(state);
  return true;
}

/** The PC's job (by choice, else lead the way where the way must be found, else look-out); a companion takes the next. */
function assignJobs(state: GameState, j: TravelJourney): Partial<Record<TravelJob, string>> {
  const pc: TravelJob = j.pcJob ?? (needsNavigation(j.terrain, j.weather) ? 'guide' : 'lookout');
  const jobs: Partial<Record<TravelJob, string>> = { [pc]: 'you' };
  const helper = travelHelper(state);
  const next = helper ? TRAVEL_JOBS.find((k) => k !== pc && jobOpen(state, j, k)) : undefined;
  if (helper && next) jobs[next] = helper;
  return jobs;
}

function checkLines(state: GameState, rec: CheckResultRecord): string[] {
  return modeProfile(state.engineMode).numbers === 'hidden' ? [] : [formatCheckRecord(rec, state.engineMode)];
}

/**
 * One travel job's roll for the day. The PC rolls Wisdom (Survival / Perception) with its own sheet; a companion
 * rolls PB + 1 (a GM call: trained in its job, Wisdom +1). Pace and weather give Advantage or Disadvantage.
 */
function jobRoll(state: GameState, j: TravelJourney, job: TravelJob, who: string, key: string): CheckResultRecord {
  const rule = TRAVEL_JOB[job];
  const onRoad = { ...state, journey: j };
  const mods: CheckMod[] = who === 'you'
    ? skillCheckMods(onRoad, 'WIS', rule.skill)
    : [{ label: `${who}`, value: proficiencyBonus(state.character?.level) + 1 }];
  const adv = combineAdv(paceCheckAdv(onRoad, rule.skill), rule.skill === 'perception' ? weatherRuleOf(j.weather).perception ?? 'normal' : 'normal');
  const label = who === 'you' ? rule.label : `${rule.label} (${who})`;
  return resolveCheckRecord({ label, mods, dc: rule.dc(terrainRow(j.terrain)), adv, rng: seededRng(key) });
}

interface JobSettle {
  journey: TravelJourney;
  status: string[];
  facts: string[];
  lost: boolean;
}

/** A failed guide loses the way (the trip runs a stretch longer); a forager who finds food saves the day's ration. */
function settleJob(state: GameState, j: TravelJourney, job: TravelJob, who: string, key: string): JobSettle {
  if (!jobOpen(state, j, job)) return { journey: j, status: [], facts: [], lost: false };
  const rec = jobRoll(state, j, job, who, key);
  const ok = rec.outcome === 'success';
  const name = who === 'you' ? 'You' : who;
  let journey: TravelJourney = { ...j, jobResults: { ...(j.jobResults ?? {}), [job]: ok } };
  const status = checkLines(state, rec);
  const facts: string[] = [];
  const lost = job === 'guide' && !ok;
  if (lost) {
    journey = { ...journey, lost: true, lostLegs: (j.lostLegs ?? 0) + 1, legsTotal: j.legsTotal + 1 };
    if (modeProfile(state.engineMode).numbers !== 'hidden') status.push('Lost: the way goes wrong for a stretch (+1 stretch)');
    facts.push(`${name} lost the way for a while; this stretch went wrong and the trip runs a stretch longer.`);
  }
  if (job === 'forager') {
    journey = { ...journey, fedToday: ok };
    facts.push(ok ? `${name} found enough to eat along the way.` : `${name} found nothing to eat along the way.`);
  }
  return { journey, status, facts, lost };
}

interface DayRoll {
  state: GameState;
  journey: TravelJourney;
  status: string[];
  facts: string[];
  lost: boolean;
}

/** The start of a travel day: the weather roll (a d20), then each job's roll. Once a day. */
function rollDay(state: GameState, j: TravelJourney): DayRoll {
  const day = j.day ?? 1;
  if (!travelDay(j) || j.jobsRolledDay === day) return { state, journey: j, status: [], facts: [], lost: false };
  const key = `${tripKey(state, j)}|day${day}`;
  const weather = weatherFor(1 + Math.floor(hashUnit(`${key}|weather`) * 20));
  let journey: TravelJourney = { ...j, day, weather, jobsRolledDay: day, jobResults: {}, lost: false, fedToday: false };
  journey = { ...journey, jobs: assignJobs(state, journey) };
  const numbers = modeProfile(state.engineMode).numbers;
  const rule = weatherRuleOf(weather);
  const status: string[] = numbers === 'hidden' ? [] : [`Weather: ${weather}${numbers === 'open' && rule.rule ? ` (${rule.rule})` : ''}`];
  const facts: string[] = weather === 'clear' ? [] : [`The weather on the road today: ${weather}.`];
  let lost = false;
  for (const job of TRAVEL_JOBS) {
    const who = journey.jobs?.[job];
    if (!who) continue;
    const r = settleJob(state, journey, job, who, `${key}|${job}`);
    journey = r.journey;
    status.push(...r.status);
    facts.push(...r.facts);
    lost = lost || r.lost;
  }
  return { state, journey, status, facts, lost };
}

/** The PC takes a travel job for the road (a chip). A job not rolled yet today is rolled now. */
function takeJob(state: GameState, j: TravelJourney, job: TravelJob): TravelCommit {
  const done = j.jobResults?.[job] !== undefined;
  let journey: TravelJourney = { ...j, pcJob: job, jobs: { ...(j.jobs ?? {}), [job]: 'you' } };
  const extra: string[] = [];
  const facts: string[] = [];
  if (!done && jobOpen(state, j, job)) {
    const r = settleJob(state, journey, job, 'you', `${tripKey(state, j)}|day${j.day ?? 1}|pc-${job}`);
    journey = r.journey;
    extra.push(...r.status);
    facts.push(...r.facts);
  }
  const what = { guide: 'you lead the way', lookout: 'you keep lookout', forager: 'you forage as you go' }[job];
  return {
    state: { ...state, currentLocation: UNDERWAY_HERE, journey },
    handled: true,
    arrived: false,
    outcome: 'unchanged',
    receipt: stillOn(state, journey, done ? `${what} (already done today)` : what),
    ...(extra.length ? { extra } : {}),
    facts: [`${what.charAt(0).toUpperCase()}${what.slice(1)}.`, ...facts],
  };
}

/** One job chip the PC has not taken today (story RPG companions take theirs on their own: no chip). */
function jobChip(state: Partial<Pick<GameState, 'engineMode'>>, j: TravelJourney): string | null {
  if (!travelDay(j) || state.engineMode === 'rpg' || state.engineMode === 'pyoa') return null;
  const pick = (['lookout', 'forager', 'guide'] as TravelJob[]).find(
    (job) => j.jobResults?.[job] === undefined && jobOpen(state as GameState, j, job) && !(job === 'forager' && j.fedToday)
  );
  return pick ? JOB_CHIP[pick] : null;
}

function conSaveMods(state: GameState): CheckMod[] {
  const sheet = deriveTabletopSheet(state);
  const con = sheet?.saves.find((s) => s.key === 'CON')?.total ?? Math.floor(((state.character.attributes?.CON ?? 10) - 10) / 2);
  const mods: CheckMod[] = [{ label: 'CON save', value: con }];
  const tired = exhaustionLevel(state.character);
  if (tired) mods.push({ label: `exhaustion ${tired}`, value: exhaustionD20(state.character) });
  return mods;
}

/** One more Exhaustion level; at level 6 the character dies (SRD 5.2.1). */
function exhaust(state: GameState): { state: GameState; line: string } {
  const before = exhaustionLevel(state.character);
  const character = gainExhaustion(state.character, 1);
  const after = exhaustionLevel(character);
  if (after >= EXHAUSTION_DEATH) {
    return {
      state: { ...state, character: { ...character, hp: 0 }, deathSaves: { successes: 0, failures: 3, dead: true } },
      line: `Exhaustion: level ${before} → ${after}, death`,
    };
  }
  return { state: { ...state, character }, line: `Exhaustion: level ${before} → ${after}` };
}

/** SRD Extended Travel (tabletop): a Constitution save for each hour past 8 in the day, DC 10 + the hours past 8. */
function marchHours(state: GameState, j: TravelJourney, hours: number): { state: GameState; journey: TravelJourney; status: string[]; facts: string[] } {
  const before = j.hoursToday ?? 0;
  const after = before + hours;
  const journey: TravelJourney = { ...j, hoursToday: after };
  if (!travelDay(j) || !survival(state) || after <= TRAVEL_DAY_HOURS) return { state, journey, status: [], facts: [] };
  let s = state;
  const status: string[] = [];
  let failed = 0;
  for (let h = Math.max(TRAVEL_DAY_HOURS, Math.floor(before)) + 1; h <= Math.floor(after); h++) {
    const rec = resolveCheckRecord({
      label: 'Extended Travel: Constitution save',
      mods: conSaveMods(s),
      dc: extendedTravelDc(h - TRAVEL_DAY_HOURS),
      rng: seededRng(`${tripKey(state, j)}|march|${j.day ?? 1}|${h}`),
    });
    status.push(formatCheckRecord(rec, s.engineMode));
    if (rec.outcome === 'failure') {
      const ex = exhaust(s);
      s = ex.state;
      status.push(ex.line);
      failed++;
    }
  }
  const facts = failed ? ['The forced march past nightfall wore you down; you are more exhausted than before.'] : [];
  return { state: s, journey, status, facts };
}

function daySpentLines(state: GameState, j: TravelJourney): string[] {
  if (!dayIsSpent(j)) return [];
  const numbers = modeProfile(state.engineMode).numbers;
  if (numbers === 'hidden') return [];
  return numbers === 'open' && survival(state)
    ? [`Travel day: ${formatSpan(j.hoursToday ?? 0)} on the road — make camp, or push on (CON save each hour past 8)`]
    : ['Travel day: spent — make camp or push on'];
}

function daySpentFacts(j: TravelJourney): string[] {
  return dayIsSpent(j) ? ["The day's travel is nearly spent; night is coming on."] : [];
}

/** This route's named stops, made once and kept on the save (the same stops either way). */
function withRouteStops(state: GameState, j: TravelJourney): GameState {
  if (!travelDay(j)) return state;
  const key = routeKey(j.from, j.to);
  if (state.routeStops?.[key]) return state;
  const base = j.legsTotal - (j.lostLegs ?? 0);
  const stops = makeRouteStops(j.terrain, base, (k) => hashUnit(`${state.seed ?? ''}|${key}|${k}`));
  return { ...state, routeStops: { ...(state.routeStops ?? {}), [key]: stops } };
}

/** A find pays the discovery XP once (0 in tabletop, where XP comes from monster CR only). */
function payFindXp(state: GameState, key: string, find: string): { state: GameState; status: string[] } {
  if ((state.sandboxAwardKeys ?? []).includes(key)) return { state, status: [] };
  const amount = discoveryXpAmount(state, 'secret');
  const keys = [...(state.sandboxAwardKeys ?? []), key];
  if (amount <= 0) return { state: { ...state, sandboxAwardKeys: keys }, status: [] };
  const leveled = applyCharacterXpGain(state.character, amount, state.engineMode, state.systemHousing);
  const line = hidesPart(state.systemHousing, 'experience') ? [] : [`XP Gained: ${amount} (road find: ${find})`];
  return { state: { ...state, character: leveled.character, sandboxAwardKeys: keys }, status: [...line, ...leveled.notes] };
}

/** The named stop on this stretch, and its find if the look-out spotted it (once). Not while the way is lost. */
function passStop(state: GameState, j: TravelJourney): { state: GameState; status: string[]; facts: string[]; found: boolean } {
  const none = { state, status: [] as string[], facts: [] as string[], found: false };
  if (!travelDay(j) || j.lost) return none;
  const key = routeKey(j.from, j.to);
  const stops = state.routeStops?.[key];
  if (!stops?.length) return none;
  const flipped = key.split(' ~ ')[0] !== tidy(j.from).toLowerCase();
  const base = j.legsTotal - (j.lostLegs ?? 0);
  const progress = j.legsDone - (j.lostLegs ?? 0);
  const i = stops.findIndex((s) => (flipped ? base - s.leg : s.leg) === progress);
  if (i < 0) return none;
  const stop = stops[i]!;
  const facts = [`The way passes ${stop.name}.`];
  if (!stop.find || stop.found || j.jobResults?.lookout !== true) return { ...none, facts };
  const found: RouteStop[] = stops.map((s, k) => (k === i ? { ...s, found: true } : s));
  let next: GameState = { ...state, routeStops: { ...(state.routeStops ?? {}), [key]: found } };
  const status: string[] = [];
  facts.push(`The look-out spotted ${FIND_FACT[stop.find]} at ${stop.name}.`);
  if (stop.find === 'cache') {
    const loot = rollLoot({ profile: 'chestBronze', state: next, seed: `${state.seed ?? 'seed'}:road:${key}:${stop.name}` });
    next = { ...next, inventory: [...(next.inventory ?? []), ...loot.items], gold: (next.gold ?? 0) + loot.gold };
    if (loot.items.length) status.push(`Loot: ${loot.items.map((it) => `[${it.rarity}] ${it.name}`).join(', ')}`);
    if (loot.gold > 0) status.push(`Gold Gained: ${loot.gold}`);
  }
  if (modeProfile(state.engineMode).numbers !== 'hidden') status.unshift(`Find: ${stop.find} at ${stop.name}`);
  const xp = payFindXp(next, `road-find:${key}:${stop.name}`, stop.find);
  return { state: xp.state, status: [...status, ...xp.status], facts, found: true };
}

/**
 * Night camp: the watch order, a meeting check each watch (a hostile one breaks the rest), the day's food
 * (tabletop rations, Malnutrition), the SRD rest, and a companion's talk by the fire. The next day starts at dawn.
 */
function makeCamp(state: GameState, j: TravelJourney): TravelCommit {
  const key = `${tripKey(state, j)}|camp|${j.day ?? 1}|${state.turn ?? 0}`;
  const helper = travelHelper(state);
  const numbers = modeProfile(state.engineMode).numbers;
  const extra: string[] = numbers === 'hidden' ? [] : [helper ? `Camp: watches — you first, ${helper} second` : 'Camp: you keep the first watch; the second goes unwatched'];
  const facts: string[] = [
    helper
      ? `You made camp off the ${j.ground.toLowerCase()} and split the night's watches with ${helper}.`
      : `You made camp off the ${j.ground.toLowerCase()} and kept the first watch alone.`,
  ];
  let journey: TravelJourney = { ...j, encounter: null };
  let night: RoadEncounter | null = null;
  let watch = 0;
  for (let w = 1; w <= CAMP_WATCHES && !night && !replayRecordedMeetings; w++) {
    night = meetingCheck(state, journey, `${key}|w${w}`, !helper && w === 2);
    watch = w;
  }
  const which = watch === 1 ? 'first' : 'second';
  if (night && FIGHT_KINDS.has(night.kind)) {
    journey = { ...journey, encounter: night };
    const clock = advanceClock(state, watch === 1 ? 2 : 6);
    return {
      state: { ...clock.state, currentLocation: UNDERWAY_HERE, journey },
      handled: true,
      arrived: false,
      outcome: 'unchanged',
      event: 'meeting',
      receipt: stillOn(clock.state, journey, `camp broken in the ${which} watch${encounterNote(journey)}`),
      extra: [...extra, `Camp: the rest is broken in the ${which} watch (${clock.note})`],
      facts: [...facts, `In the ${which} watch the camp was disturbed; there was no rest.`],
    };
  }
  let s: GameState = state;
  if (survival(s)) {
    if (journey.fedToday) {
      journey = { ...journey, daysWithoutFood: 0 };
      extra.push('Rations: none eaten (foraged food)');
    } else {
      const eat = eatRation(s.inventory ?? []);
      if (eat.ate) {
        s = { ...s, inventory: eat.inventory };
        journey = { ...journey, daysWithoutFood: 0 };
        extra.push(`Rations: 1 day eaten (${eat.left} left)`);
      } else {
        const days = (journey.daysWithoutFood ?? 0) + 1;
        journey = { ...journey, daysWithoutFood: days };
        extra.push(`Rations: none — ${days} day${days === 1 ? '' : 's'} without food`);
        facts.push('There was nothing to eat tonight.');
        if (days >= STARVE_DAYS) {
          const ex = exhaust(s);
          s = ex.state;
          extra.push(`Malnutrition: ${ex.line}`);
        }
      }
    }
  }
  const rest = applyCampRest({ ...s, journey });
  s = rest.state;
  if (rest.receipt) extra.push(rest.receipt, ...(rest.dieLine ? [rest.dieLine] : []), ...(rest.after ?? []));
  if (rest.fact) facts.push(rest.fact);
  if (helper) {
    facts.push(`By the fire ${helper} talked with you about the road behind and what waits ahead.`);
    const talk = settleCampTalk(s);
    if (talk) {
      s = talk.state;
      extra.push(...talk.receipts);
    }
  }
  if (night) {
    journey = { ...journey, encounter: night };
    facts.push(`At first light the camp is not alone.`);
  }
  journey = { ...journey, day: (j.day ?? 1) + 1, hoursToday: 0, hoursSinceCheck: WATCH_HOURS, lost: false };
  return {
    state: { ...s, currentLocation: UNDERWAY_HERE, journey },
    handled: true,
    arrived: false,
    outcome: 'unchanged',
    event: 'camp',
    receipt: stillOn(s, journey, `camped the night${night ? encounterNote(journey) : ''}`),
    extra,
    facts,
  };
}

/** "Travel on": stretch after stretch until arrival or something worth a stop (a meeting, lost, a find, the day spent). */
function travelOn(state: GameState, j: TravelJourney): TravelCommit {
  let s = state;
  let cur = j;
  let hours = 0;
  let stretches = 0;
  const extra: string[] = [];
  const facts: string[] = [];
  let last: TravelCommit;
  for (;;) {
    last = stepAlong(s, cur);
    stretches++;
    hours += cur.hoursPerLeg;
    extra.push(...(last.extra ?? []));
    facts.push(...(last.facts ?? []));
    if (!last.underway || last.event || stretches >= 8 || !last.state.journey) break;
    s = last.state;
    cur = last.state.journey;
  }
  const end = last.arrived ? `, arrived at ${j.to}` : last.event ? `, stopped: ${last.event}` : '';
  const summary = `Travel on: ${stretches} stretch${stretches === 1 ? '' : 'es'}, +${formatSpan(hours)}${end}`;
  return { ...last, extra: [summary, ...extra], ...(facts.length ? { facts } : {}) };
}

/** The writer facts for this travel beat, kept on the save for this turn's packet. */
function withBeat(commit: TravelCommit): TravelCommit {
  const facts = commit.facts ?? [];
  if (!facts.length) return commit;
  return { ...commit, state: { ...commit.state, travelBeat: { turn: commit.state.turn ?? 0, facts } } };
}

/** This turn's travel beat facts for the writer (empty on any other turn). */
export function travelBeatFact(state: Pick<GameState, 'travelBeat' | 'turn'>): string {
  const b = state.travelBeat;
  return b && b.turn === (state.turn ?? 0) && b.facts.length ? b.facts.join(' ') : '';
}

/** Leaving a mapped place heads to another mapped place, never back into the room you came out of. */
function leaveDestination(state: GameState, here: string): string | null {
  // s82 Root C — the road (or this trip's HERE words) is never a place to leave for.
  const sheet = resolveLeaveSceneDestination(state);
  const dest = sheet && !isTripHere(state, sheet)
    ? sheet
    : resolveLeaveSceneDestination({ ...state, previousLocationSheet: null });
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
  return withBeat(commitTravelStep(state, raw));
}

function commitTravelStep(state: GameState, raw: string): TravelCommit {
  const input = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (!input || state.activeEncounter) return unchanged(state);
  if (state.journey && isJourneyUnderway(state)) {
    const origin = journeyOrigin(state) || state.journey.from;
    const j: TravelJourney = origin === state.journey.from ? state.journey : { ...state.journey, from: origin };
    state = j === state.journey ? state : { ...state, journey: j };
    const named = parseTravelDestination(input, state.campaignBibleId);
    const namedTo = named && named.name.toLowerCase() === j.to.toLowerCase();
    const namedFrom = named && named.name.toLowerCase() === j.from.toLowerCase();
    const chip = travelEngineChip(input);
    const onward = WALK_ON.test(input) || namedTo || chip === 'travel on' || chip === 'push on';
    if (chip === 'camp' && !laneBlocked(j.encounter)) return makeCamp(state, j);
    if (chip === 'guide' || chip === 'lookout' || chip === 'forager') return takeJob(state, j, chip);
    if (onward && laneBlocked(j.encounter)) {
      const slot = timeOfDayForHour(currentHour(state));
      return {
        state: { ...state, currentLocation: UNDERWAY_HERE },
        handled: true,
        arrived: false,
        outcome: 'blocked',
        receipt: `Travel: still on the ${j.ground.toLowerCase()} between ${j.from} and ${j.to} (${slot}); the way on is blocked`,
      };
    }
    if (chip === 'travel on') return travelOn(state, j);
    if (onward) return stepAlong(state, j);
    if (TURN_BACK.test(input) || namedFrom || isLeaveSceneAction(input)) {
      const back: TravelJourney = {
        ...j,
        from: j.to,
        to: j.from,
        legsDone: j.legsTotal - j.legsDone,
      };
      return stepAlong({ ...state, journey: back }, back);
    }
    if (named) {
      const road = `the ${j.ground.toLowerCase()} between ${j.from} and ${j.to}`;
      return goTo({ ...state, journey: null }, j.from, named.name, road);
    }
    const slot = timeOfDayForHour(currentHour(state));
    const where = `Travel: still on the ${j.ground.toLowerCase()} between ${j.from} and ${j.to} (${slot})`;
    // The fight engine already settled a fight this turn (a faced meeting rolls before travel): no second fight.
    const settledThisTurn = state.arcDirector?.lastEncounterClearedTurn === state.turn;
    if (j.encounter && !settledThisTurn && facesFight(input, j.encounter) && engineAllowsCombat(state)) {
      const foe = liveRoadFoe(state, j.encounter);
      const journey: TravelJourney = { ...j, encounter: { ...j.encounter, engaged: true } };
      const what = j.encounter.kind === 'camp' ? 'mini-boss' : j.encounter.rare ? 'rare spawn' : 'foe';
      return {
        state: { ...state, currentLocation: UNDERWAY_HERE, journey, activeEncounter: foe },
        handled: true,
        arrived: false,
        outcome: 'fight opened',
        receipt: `${where}; fight: ${foe.name}, ${what} (level ${foe.level}, ${foe.maxHp} HP)`,
      };
    }
    const slipped = !!j.encounter?.escaped && j.encounter.escapedTurn === state.turn;
    return {
      state: { ...state, currentLocation: UNDERWAY_HERE },
      handled: true,
      arrived: false,
      outcome: slipped ? 'slipped away' : 'unchanged',
      receipt: `${where}; ${j.to} still ahead${j.encounter ? encounterNote(j) : ''}`,
    };
  }
  const parkedOnRoad = isRoadLabel(state.currentLocation);
  const here = parkedOnRoad
    ? journeyOrigin(state)
    : dungeonRoomPlace(state, state.currentLocation) ?? tidy(state.currentLocation);
  const hub = parseTravelDestination(input, state.campaignBibleId);
  const spot = !hub && here && !parkedOnRoad ? withinPlaceSpot(input, state.sceneFacts?.lastBeat ?? '') : null;
  if (spot) return moveWithinPlace(state, input, spot);
  const dest = hub?.name ?? (isLeaveSceneAction(input) ? leaveDestination(state, here) : null);
  if (parkedOnRoad && dest && here && dest.toLowerCase() === here.toLowerCase()) {
    return arrive(state, dest, STEP_HOURS, here);
  }
  if (!dest || dest.toLowerCase() === here.toLowerCase()) {
    return unchanged(state.journey ? { ...state, journey: null } : state);
  }
  const moved = goTo({ ...state, journey: null }, here, dest);
  const facts = moved.state.sceneFacts;
  return moved.handled && facts?.hereSpot
    ? { ...moved, state: { ...moved.state, sceneFacts: { ...facts, hereSpot: undefined } } }
    : moved;
}

/** A move that stays in this place: a new spot on sceneFacts, people walked away from leave the player's side, HERE unchanged. */
function moveWithinPlace(state: GameState, input: string, spot: string): TravelCommit {
  const here = (state.currentLocation ?? '').replace(/\s+/g, ' ').trim();
  const people = presentNpcRecords(
    state.sceneFacts ? { ...state, sceneFacts: { ...state.sceneFacts, hereSpot: undefined } } : state
  ).map((r) => r.npcName);
  const hereSpot = buildHereSpot(state, input, spot, people);
  const away = new Set(hereSpot.awayFrom.map((n) => n.toLowerCase()));
  const base = state.sceneFacts ?? {
    crowd: 'unknown' as const,
    noise: 'unknown' as const,
    present: [],
    props: [],
    lastBeat: '',
    updatedTurn: state.turn ?? 0,
  };
  const sceneFacts = {
    ...base,
    present: (base.present ?? []).filter((p) => !away.has(p.toLowerCase())),
    hereSpot,
  };
  const out = hereSpot.awayFrom.length ? `; out of talking range: ${hereSpot.awayFrom.join(', ')}` : '';
  return {
    state: { ...state, journey: null, sceneFacts },
    handled: true,
    arrived: false,
    outcome: 'unchanged',
    receipt: `Moved within ${here}: now on ${spot}${out}`,
  };
}

/** After the writer: the clock owns time of day on a travel turn (prose cannot rewind it). */
export function pinClockTimeOfDay<F extends { timeOfDay?: TimeOfDay } | undefined>(
  facts: F,
  state: Pick<GameState, 'worldHour'>
): F {
  if (!facts || typeof state.worldHour !== 'number') return facts;
  return { ...facts, timeOfDay: timeOfDayForHour(state.worldHour) };
}

/** Ground chips replace the pad while underway (a live fight keeps its own pads; a parked one does not). */
export function withJourneyPads(state: GameState, choices: string[]): string[] {
  if (!isJourneyUnderway(state)) return choices;
  if (state.activeEncounter) return choices;
  return journeyPads(state);
}
