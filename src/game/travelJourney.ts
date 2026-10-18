/** Travel legs, clock, road meetings, Extended Travel, camp (SRD 5.2.1). */
import { encounterOpenerIdea, openerIdeaFact, openerIdeaGist, pickOpenerIdea } from './openerIdeas';
import type {
  ActiveEncounter,
  GameState,
  HouseRules,
  JourneyTerrain,
  RoadCampOutcome,
  RoadEncounter,
  RoadEncounterKind,
  RouteStop,
  TimeOfDay,
  TravelJob,
  TravelJourney,
  WorldAtlasState,
} from './types';
import { resolveLocalAreaLevel, resolveThreatTier } from './placeAuthority';
import { tickAwayAttunements } from './rules/magicItems';
import { DEFAULT_HOUSE_RULES, houseRulesOf, pillarCopies } from './rules/houseRules';
import { hoursAtPace, paceCheckAdv, paceTag } from './rules/travelPace';
import {
  CAMP_CHIP,
  CAMP_WATCHES,
  EXHAUSTION_DEATH,
  FIND_FACT,
  JOB_CHIP,
  MEETING_LOOK,
  MEETING_WANT,
  PLEA_HELP,
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
import { commitDeath } from './rules/death';
import { combineAdv, formatCheckRecord, proficiencyBonus, resolveCheckRecord, type CheckMod, type CheckResultRecord } from './checkRules';
import { skillCheckMods } from './checkMath';
import { isVr1RollLine, outcomeFactFromRecord } from './rules/rollView';
import { applyCampRest } from './recoveryRules';
import { sidekickOf } from './rules/sidekick';
import { recruitedCompanions, settleCampTalk } from './rules/companions';
import { rollLoot } from './lootTableRegistry';
import { gainLootMoney, lootMoneyText } from './rules/coins';
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
import { fuzzyTypedPhrase } from './typedNameMatch';
import { findSettlement } from './worldMapAuthority';
import { engineAllowsCombat } from './beatContract';
import { initEncounterTerminal } from './encounterTerminalFsm';
import { buildHereSpot, withinPlaceSpot } from './hereSpot';
import { presentNpcRecords } from './npcRecords';
import { UNDERWAY_HERE, underwayHereLabel } from './locationName';
import { createHashRng, hashUnit, keyedRng } from './seededRng';
import { nameWords, pickPersonName } from './personNames';
import { replayPreFeature } from './replaySeam';
import { campAt, campEncounter, campHeadcount, campMemoryFact, campPeople, placeRoadCamp, recordCampOutcome } from './roadCamps';
import { resolveCampRob } from './lockAttempt';
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
type ClockState = Partial<Pick<GameState, 'worldHour' | 'worldDay' | 'roadDay' | 'sceneFacts'>>;
function currentHour(state: ClockState): number {
  if (typeof state.worldHour === 'number') return state.worldHour;
  const slot = state.sceneFacts?.timeOfDay;
  return slot && slot !== 'unknown' ? SLOT_START[slot] : 9;
}
/** The one world clock: hours since the save's first day began (worldDay × 24 + worldHour). */
export function worldClock(state: ClockState): number {
  return (state.worldDay ?? 0) * 24 + currentHour(state);
}
/** World-clock hour this waking day began: the last wake, or now when a full day has passed since. */
function roadDayStart(state: ClockState): number {
  const d = state.roadDay;
  return d && worldClock(state) - d.since < 24 ? d.since : worldClock(state);
}
/** This waking day's record (road hours, the day's food), read off the world clock (a night's sleep or 24 hours starts the next). */
function roadDayNow(state: ClockState): NonNullable<GameState['roadDay']> {
  const since = roadDayStart(state);
  const d = state.roadDay;
  return d && d.since === since ? d : { since, hours: 0 };
}
export function roadHoursToday(state: ClockState): number {
  return roadDayNow(state).hours;
}
/** A night's sleep ends the day: the next one starts on waking. */
export function wakeToNewDay<T extends ClockState>(state: T): T {
  return { ...state, roadDay: { since: worldClock(state), hours: 0 } };
}
function formatSpan(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
}
/** Move the clock; timeOfDay follows the hour. Returns the chrome fragment. */
export function advanceClock(state: GameState, hours: number): { state: GameState; note: string } {
  const total = currentHour(state) + hours;
  const hour = total % 24;
  const worldDay = (state.worldDay ?? 0) + Math.floor(total / 24);
  const slot = timeOfDayForHour(hour);
  const sceneFacts = state.sceneFacts ? { ...state.sceneFacts, timeOfDay: slot } : state.sceneFacts;
  const next: GameState = { ...state, worldHour: hour, ...(worldDay ? { worldDay } : {}), sceneFacts };
  return {
    state: tickAwayAttunements(next, worldDay * 24 + hour),
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
const SNEAK_CAMP_PAD = 'Sneak into the camp'; // CR-1 (not a raid chip)
/** The chip that opens a live fight for this meeting (null = no fight on offer). */
function fightPad(enc: RoadEncounter): string | null {
  if (enc.kind === 'camp') return enc.miniBoss ? CHAMPION_PAD : null;
  return FIGHT_KINDS.has(enc.kind) ? FIXED_ENCOUNTER_PADS[enc.kind]![0]! : null;
}
/**
 * A meeting with no fight on offer, answered by its own chip: the go-by chip passes it (not beaten), the plea's
 * help chip helps it, and the wildlife chip lets the animal go its way. Taking up any other meeting (greet,
 * approach, study, talk) keeps it open to talk.
 */
function answersMeeting(enc: RoadEncounter, input: string, turn: number, terrain: JourneyTerrain): RoadEncounter | null {
  if (fightPad(enc) || roadMeetingOver(enc)) return null;
  const said = meetingMoveBase(input).toLowerCase();
  const at = encounterPads(enc, terrain).findIndex((p) => p.toLowerCase() === said);
  if (at > 0 || (at === 0 && enc.kind === 'wildlife')) return { ...enc, escaped: true, escapedTurn: turn, closedTurn: turn };
  return at === 0 && enc.kind === 'plea' ? { ...enc, engaged: true, closedTurn: turn } : null;
}
/**
 * The help the player gave a plea, as the engine settles it: the writer's fact, and the ration it costs where the
 * mode counts food. No ration to give: the plea is passed by, and the fact says so.
 */
function helpPlea(state: GameState, enc: RoadEncounter): { state: GameState; encounter: RoadEncounter; fact: string; extra: string[] } {
  const help = PLEA_HELP[enc.want ?? ''];
  if (!help) return { state, encounter: enc, fact: enc.want ? `You stopped and helped: ${enc.want}.` : 'You stopped and helped them.', extra: [] };
  if (!help.ration || !survival(state)) return { state, encounter: enc, fact: help.fact, extra: [] };
  const eat = eatRation(state.inventory ?? []);
  if (!eat.ate) {
    return { state, encounter: { ...enc, engaged: false, escaped: true, escapedTurn: state.turn }, fact: help.cannot ?? help.fact, extra: [] };
  }
  return { state: { ...state, inventory: eat.inventory }, encounter: enc, fact: help.fact, extra: [`Rations: 1 day given away (${eat.left} left)`] };
}
/** The meeting is over: fought and won or talked down, helped, fled past, or the fight against it was lost. */
export function roadMeetingOver(enc: RoadEncounter): boolean {
  return !!enc.engaged || !!enc.escaped || !!enc.lost;
}
function encounterPads(enc: RoadEncounter, terrain: JourneyTerrain): string[] {
  if (roadMeetingOver(enc)) return [];
  if (enc.kind === 'wildlife') return [LIVES_PAD[terrain]];
  if (enc.kind === 'traveler') return [TALK_PAD[terrain]];
  // Only a meeting that can force a fight has a check to fail; a peaceful one is simply passed by.
  const cost = fightPad(enc) ? withFailCost : (p: string) => p;
  if (enc.kind === 'camp') {
    const pads: string[] = ['Approach the camp'];
    if (enc.camp?.placeId) pads.push(SNEAK_CAMP_PAD);
    if (enc.miniBoss) pads.push(CHAMPION_PAD);
    pads.push('Skirt around the camp');
    const out: string[] = [];
    for (let i = 0; i < pads.length; i++) out.push(cost(pads[i]!));
    return out;
  }
  const fixed = FIXED_ENCOUNTER_PADS[enc.kind] ?? [];
  const out: string[] = [];
  for (let i = 0; i < fixed.length; i++) out.push(cost(fixed[i]!));
  return out;
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
/** Push on into the current clock slot; tabletop names the Extended Travel fail cost. */
function pushOnPad(state: Partial<Pick<GameState, 'character' | 'engineMode'>> & ClockState): string {
  const head = `${PUSH_ON_CHIP} into the ${timeOfDayForHour(currentHour(state))}`;
  if (!survival({ engineMode: state.engineMode } as GameState)) return head;
  return exhaustionLevel(state.character) + 1 >= EXHAUSTION_DEATH
    ? `${head}, but one failed save now kills you`
    : `${head}, but each failed save wears you down more`;
}
/**
 * Chips for the ground between: walk on, this stretch's chance meeting (if any), turn back.
 * Turn back rests for a few turns after a bounce between the same places (the circling memory's
 * short return), unless the way on is blocked.
 */
export function journeyPads(
  state: Pick<GameState, 'journey' | 'places' | 'currentLocation'> &
    Partial<Pick<GameState, 'circling' | 'turn' | 'engineMode' | 'character' | 'activeEncounter'>> &
    ClockState
): string[] {
  const j = state.journey;
  if (!j || !isJourneyUnderway(state)) return [];
  // Same rule as withJourneyPads: a live fight keeps combat pads; Walk on / turn-back stay off.
  if (state.activeEncounter) return [];
  const met = j.encounter ? encounterPads(j.encounter, j.terrain) : [];
  const spent = dayIsSpent(state, j);
  const forward = laneBlocked(j.encounter)
    ? []
    : spent
      ? [CAMP_CHIP, pushOnPad(state)]
      : ['Walk on', ...(canTravelOn(state, j) ? [TRAVEL_ON_CHIP] : [])];
  const job = spent || (j.encounter && !roadMeetingOver(j.encounter)) ? null : jobChip(state, j);
  const origin = journeyOrigin(state);
  const bounced = state.circling?.shortReturnTurn;
  const rested = forward.length > 0 && bounced != null && (state.turn ?? 0) - bounced < TURN_BACK_REST_TURNS;
  return [...forward, ...met, ...(job ? [job] : []), ...(origin && !rested ? [`Turn back toward ${origin}`] : [])];
}
/**
 * A chip of the ground between: walk on / turn back, a travel engine chip, or the live meeting's own chips by its
 * class (with or without the failure-cost tail). A meeting chip with no such meeting on the stretch is not one.
 */
export function isJourneyPad(state: Pick<GameState, 'journey'>, choice: string): boolean {
  const t = meetingMoveBase(choice).toLowerCase();
  const j = state.journey;
  const met = j?.encounter ? encounterPads(j.encounter, j.terrain) : [];
  return WALK_ON.test(t) || /^turn back toward\s+\S/i.test(t) || !!travelEngineChip(t) || met.some((p) => meetingMoveBase(p).toLowerCase() === t);
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
/** A replayed tape's recorded meeting roll (`replaySeam`); live play and new runs use the d6 per watch. */
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
  nameMeeting(state, encounter, key);
  encounter.distanceFt = unwatched ? minEncounterDistanceFt(j.terrain) : encounterDistanceFt(j.terrain, keyedRng(`${key}|distance`));
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
  if (replayPreFeature()) {
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
/** People meetings the engine names: the one who speaks for them (a group's leader, a camp's keeper). */
const NAMED_KINDS = new Set<RoadEncounterKind>(['traveler', 'meeting', 'plea', 'villain', 'thugs', 'camp']);
/**
 * tt-build-roadmeet (John, 15 Oct, 2a) — a rolled people meeting gets a seeded name and a one-line description:
 * a plea's is drawn from the plea itself ("a farmer, begs help with a stuck cart"), the rest is a seeded look.
 * The name is the meeting's speaker and joins the presence record while the meeting runs.
 */
function nameMeeting(state: GameState, encounter: RoadEncounter, key: string): void {
  if (!NAMED_KINDS.has(encounter.kind)) return;
  const rng = createHashRng('road-meeting', key);
  const taken = nameWords([...(state.npcMemories ?? []).flatMap((m) => [m.npcName, ...(m.aliases ?? [])]), ...campPeople(state), state.character?.name]);
  const name = pickPersonName(rng, taken);
  if (!name) return;
  encounter.name = name;
  const who = PLEA_HELP[encounter.want ?? '']?.who;
  const looks = MEETING_LOOK[encounter.kind] ?? [];
  if (encounter.kind === 'plea') {
    if (who && encounter.want?.startsWith(`${who} `)) encounter.about = `${who}, who ${encounter.want.slice(who.length + 1)}`;
  } else if (looks.length) {
    encounter.about = looks[at(looks.length, rng())]!;
  }
  // OP-1: a meeting/traveler starts from a seeded opener idea (kept on the encounter so the talk carries on from it).
  const idea = pickOpenerIdea(encounter.kind, key);
  if (idea) encounter.openerIdea = idea.id;
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
 * tt-fix-9 — the live road meeting a speaker label (or the meeting's name) stands for, by its class. Null for signs,
 * a lair or a plea (their want describes a scene, not what one says). Its `want`, when recorded, is what it wants.
 */
/**
 * OP-1: the backed line for a road meeting's speaker is the gist of its opener idea (tt-fix-4 treats it as the
 * backing for what they say, never as a quote). Empty when the name is not this stretch's live meeting.
 */
export function roadMeetingOpenerLines(state: Pick<GameState, 'journey'>, name: string): string[] {
  const gist = openerIdeaGist(encounterOpenerIdea(roadMeetingSpeaker(state.journey, name)));
  return gist ? [gist] : [];
}
export function roadMeetingSpeaker(j: TravelJourney | null | undefined, speaker: string): RoadEncounter | null {
  const e = j?.encounter;
  if (!e || roadMeetingOver(e) || SCENE_KINDS.has(e.kind) || e.kind === 'plea') return null;
  const bare = (s: string) => s.replace(/^(?:the|a|an)\s+/i, '').trim().toLowerCase();
  return [ENCOUNTER_LABEL[e.kind], e.name ?? ''].some((n) => !!n && bare(n) === bare(speaker)) ? e : null;
}
/**
 * Who a meeting is, as its event names them: "Wat Thatch, a farmer, who begs help with a stuck cart", "Osric Marl,
 * a traveler leaning on a walking staff", "thugs, three of them, led by Garth Rudd, with a broken nose".
 * An unnamed meeting (wildlife, the dead, a tape recorded before names) is its label and count.
 */
function meetingWho(e: RoadEncounter): string {
  const base = e.kind === 'wildlife' && e.dangerous ? 'dangerous wildlife' : ENCOUNTER_LABEL[e.kind];
  const look = e.about ? `, ${e.about}` : '';
  if (!e.name) return `${base}${meetingCount(e)}`;
  if (e.kind === 'plea') return `${e.name}${look}`;
  if (e.kind === 'thugs') return `${base}${meetingCount(e)}, led by ${e.name}${look}`;
  if (e.kind === 'camp') return `${base}${campHeadcount(e)} kept by ${e.name}${look}`;
  return `${e.name}, ${base}${e.about ? ` ${e.about}` : ''}`;
}
/**
 * Writer fact (tt-build-roadmeet: an event in the ENGINE RESULT): the meeting on this stretch is on the page
 * before any chip meets it. Who or what, and what it wants; the writer tells it in its own words.
 */
export function roadMeetingFact(j: TravelJourney | null | undefined): string {
  const e = j?.encounter;
  if (!e || roadMeetingOver(e)) return '';
  const want = meetingWant(e);
  if (SCENE_KINDS.has(e.kind)) {
    return `Event on this stretch: ${want || ENCOUNTER_LABEL[e.kind]}. Show it plainly in the story, so the next choice can meet it.`;
  }
  const near = e.surprisesParty ? ' It was not seen until it was close.' : '';
  const told = e.kind === 'plea' && !!e.about;
  const intent = !want || told ? '' : e.kind === 'plea' ? ` ${want.charAt(0).toUpperCase()}${want.slice(1)}.` : ` What ${e.name ?? 'it'} ${want}.`;
  const memory = campMemoryFact(e);
  const opener = openerIdeaFact(encounterOpenerIdea(e));
  return `Event on this stretch: the road brings ${meetingWho(e)}.${intent}${memory ? ` ${memory}` : ''}${opener ? ` ${opener}` : ''}${near} Show it plainly in the story (seen or heard, not named as a list), what it wants before any blow, so the next choice can meet it.`;
}
/** The turn's engine result with this stretch's road meeting event after it (tt-build-roadmeet). */
export function withRoadMeetingEvent(state: Pick<GameState, 'journey'>, engineResult?: string): string {
  const j = state.journey;
  const event = j && j.legsDone < j.legsTotal ? roadMeetingFact(j) : '';
  return [engineResult?.trim(), event].filter(Boolean).join('\n');
}
const TIME_SLOT = '(dawn|morning|midday|afternoon|dusk|evening|night)';
/** tt-fix-4 — travel receipt → destination + plain time (STATUS keeps legs/spans). */
export function writerTravelFact(receipt: string): string | null {
  const r = (receipt ?? '').replace(/\s+/g, ' ').trim().replace(/\.$/, '');
  if (!/^Travel:/i.test(r)) return null;
  const slot = r.match(new RegExp(`\\bnow ${TIME_SLOT}\\b`, 'i'))?.[1] ?? r.match(new RegExp(`\\(${TIME_SLOT}\\)`, 'i'))?.[1];
  const time = slot ? ` It is now ${slot}.` : '';
  const to =
    r.match(/;\s*([^;]+?) still ahead\b/)?.[1]
    ?? r.match(/\bbetween .+? and (.+?)(?: at a \w+ pace)?(?: \(| —|;|$)/)?.[1];
  const ground = r.match(/^Travel: (?:still on )?(?:the )?(.+?) between /i)?.[1];
  const on = ground ? `On the ${ground} toward ${to}` : `Toward ${to}`;
  if (to && /the way on is blocked/i.test(r)) return `${on}; the way on is blocked.${time}`;
  if (to) return `${on}.${time}`;
  const dest = r.match(/^Travel: .* to (.+?)(?: at a \w+ pace)?(?: — |$)/)?.[1];
  return dest ? `Arrived at ${dest}.${time}` : null;
}
/** Plain Travel: → writer form, then every other receipt label the same way. Not inside "Extended Travel:" (q31-L4). */
export function writerEngineResult(fact: string): string {
  const travel = (fact ?? '').replace(/(?<![A-Za-z])Travel: .*?\.(?=\s+[A-Z]|\s*$)/g, (m) => writerTravelFact(m) ?? m);
  const parts = travel.split('. ');
  const out: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    let s = (i < parts.length - 1 ? `${parts[i]}.` : parts[i]!).trim();
    while (s.includes('  ')) s = s.split('  ').join(' ');
    if (!s || isRoadLabel(s)) continue;
    const roomHead = 'Dungeon room: ';
    if (s.startsWith(roomHead) && !s.startsWith('Dungeon room: none')) {
      const body = s.endsWith('.') ? s.slice(0, -1) : s;
      const mark = ', inside ';
      const cut = body.indexOf(mark);
      if (cut > roomHead.length) {
        const room = body.slice(roomHead.length, cut);
        const inside = body.slice(cut + mark.length);
        if (room && inside) {
          out.push(`You stood in ${room} inside ${inside}.`);
          continue;
        }
      }
    }
    const waysHead = 'Ways on: ';
    if (s.startsWith(waysHead)) {
      const body = (s.endsWith('.') ? s.slice(0, -1) : s).slice(waysHead.length);
      const names: string[] = [];
      const raw = body.split(',');
      for (let w = 0; w < raw.length; w++) {
        let n = raw[w]!.trim();
        const paren = n.indexOf(' (');
        if (paren >= 0) n = n.slice(0, paren).trim();
        if (n && !isRoadLabel(n)) names.push(n);
      }
      if (names.length === 1) out.push(`A way led on to ${names[0]}.`);
      else if (names.length > 1) out.push(`Ways led on to ${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}.`);
      continue;
    }
    if (s.startsWith('Rest:')) {
      const low = s.toLowerCase();
      const kind = low.includes('long rest') ? 'long rest' : low.includes('short rest') ? 'short rest' : 'rest';
      const hpAt = s.indexOf('HP ');
      if (hpAt >= 0) {
        const bits = s.slice(hpAt + 3).trim().split(' ');
        const to = (bits[2] ?? '').split('(')[0] ?? '';
        if (bits[0] && to && (bits[1] === '→' || bits[1] === '->' || bits[1] === 'to')) {
          out.push(`You took a ${kind} and your hurts eased (${bits[0]} to ${to}).`);
          continue;
        }
      }
      out.push(`You took a ${kind}.`);
      continue;
    }
    out.push(s.endsWith('.') ? s : `${s}.`);
  }
  return out.join(' ');
}
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
/**
 * Road-meeting event row (name, description). Presence itself is presentNpcRecords.
 */
export function roadMeetingRef(state: Pick<GameState, 'journey' | 'turn'>): { display: string; note: string } | null {
  const e = meetingOnBeat(state);
  if (!e || !SPEAKING_KINDS.has(e.kind)) return null;
  const idea = encounterOpenerIdea(e);
  // OP-1: the picked idea is the backing for what this person says (its gist), never a line to quote.
  const gist = idea ? `; opens with: ${idea.situation}, ${idea.intent}` : '';
  return { display: e.name ?? ENCOUNTER_LABEL[e.kind], note: `${meetingWho(e)}; present on this road while the meeting runs${gist}` };
}
/** Receipt fragment for this stretch (chrome + ENGINE RESULT; the writer names who or what). */
function encounterNote(j: TravelJourney): string {
  const e = j.encounter;
  if (!e) return '; quiet stretch, nobody met on the road';
  const base = e.kind === 'wildlife' && e.dangerous ? 'dangerous wildlife' : `${ENCOUNTER_LABEL[e.kind]}${campHeadcount(e)}`;
  if (e.escaped) return fightPad(e) ? `; got away from ${base}, not beaten` : `; passed by ${base}`;
  if (e.lost) return `; lost the fight to ${base}, not beaten`;
  if (e.engaged) return e.kind === 'plea' ? `; helped ${base}` : `; ${base} dealt with`;
  const label = e.kind === 'camp' && e.miniBoss
    ? `${base} with a mini-boss`
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
  const memory = CAMP_MEMORY[outcome];
  const kept = enc.camp && memory ? recordCampOutcome(state, enc.camp.placeId, memory) : state;
  return { ...kept, journey: { ...j, encounter: next } };
}
/** What a settled fight at a placed camp leaves the camp remembering (a loss leaves it as it was). */
const CAMP_MEMORY: Partial<Record<Parameters<typeof settleRoadMeeting>[1], RoadCampOutcome>> = {
  victory: 'cleared',
  parleyResolved: 'parleyed',
  escape: 'fled',
};
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
  /** Push-on chip slot; writer uses it over the landing hour. */
  pushOnSlot?: TimeOfDay;
}
/** Extended Travel extras + Travel receipt for the writer (push-on clock). */
export function travelEngineLines(commit: TravelCommit): string[] {
  const lines: string[] = [];
  for (let i = 0; i < (commit.extra ?? []).length; i++) {
    const t = commit.extra![i]!.trim();
    // Record-backed STATUS: formatCheckRecord label "Extended Travel: Constitution save…" (VR1-b CheckResultRecord).
    if (t.toLowerCase().startsWith('extended travel:') || isVr1RollLine(t) || t.startsWith('Constitution save')) lines.push(t);
  }
  for (let i = 0; i < (commit.facts ?? []).length; i++) {
    const f = commit.facts![i]!.trim();
    if (f === 'Check success.' || f === 'Check failure.') lines.push(f);
  }
  if (!commit.receipt) return lines;
  let r = commit.receipt.trim();
  while (r.includes('  ')) r = r.split('  ').join(' ');
  if (commit.pushOnSlot) {
    const at = r.toLowerCase().indexOf(' now ');
    if (at >= 0) {
      let end = at + 5;
      while (end < r.length) {
        const c = r.charCodeAt(end);
        if ((c < 65 || c > 90) && (c < 97 || c > 122)) break;
        end++;
      }
      r = `${r.slice(0, at + 5)}${commit.pushOnSlot}${r.slice(end)}`;
    }
  }
  lines.push(r);
  return lines;
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
/**
 * Arrival after a trip: one hook waiting there. The first sight of the place is its card text, handed once by
 * the writer's HERE block (placeFirstSight), not a second time here.
 */
function arrivalFacts(state: GameState, dest: string): string[] {
  const hub = matchHub(hubsForBibleId(state.campaignBibleId), dest);
  const hook = arrivalHook(state, dest, hub?.linkedQuestIds ?? []);
  return hook ? [hook] : [];
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
  const set: TravelJourney = {
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
    hoursSinceCheck: 0,
  };
  const march = marchHours(state, gap.terrain, tripKey(state, set), gap.hoursPerLeg);
  if (march.dead) return diedOnRoad(march, stillOn(march.state, set, 'you died on the road'), set);
  const day = rollDay(march.state, set);
  const camp = withRoadCamp(day.state, rollStretch(day.state, day.journey));
  const journey = camp.journey;
  const stop = passStop(withRouteStops(camp.state, journey), journey);
  const clock = advanceClock({ ...stop.state, currentLocation: UNDERWAY_HERE, journey }, gap.hoursPerLeg);
  const extra = [...march.status, ...day.status, ...stop.status, ...daySpentLines(day.state, journey)];
  const facts = [...march.facts, ...day.facts, ...stop.facts, ...camp.facts, ...(dayIsSpent(day.state, journey) ? ["The day's travel is nearly spent."] : [])];
  return {
    state: clock.state,
    handled: true,
    arrived: false,
    underway: true,
    outcome: 'set out',
    ...(extra.length ? { extra } : {}),
    ...(facts.length ? { facts } : {}),
    ...stretchEvent(march.state, journey, day.lost, stop.found),
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
  if (gap.steps === 1) {
    const march = marchHours(state, gap.terrain, `${state.seed ?? ''}|${from}|${dest}|${state.turn ?? 0}`, gap.hoursPerLeg);
    if (march.dead) return diedOnRoad(march, `Travel: on the way from ${from} toward ${dest}; you died on the road`, null);
    const a = arrive(march.state, dest, gap.hoursPerLeg, via ?? from, gap.terrain);
    return {
      ...a,
      ...(march.status.length ? { extra: march.status } : {}),
      ...(march.facts.length ? { facts: [...march.facts, ...(a.facts ?? [])] } : {}),
    };
  }
  return startJourney(state, from, dest, gap, via);
}
function stepAlong(state: GameState, j: TravelJourney): TravelCommit {
  const legsDone = j.legsDone + 1;
  const march = marchHours(state, j.terrain, tripKey(state, j), j.hoursPerLeg);
  if (march.dead) return diedOnRoad(march, stillOn(march.state, j, 'you died on the road'), j);
  const sinceCheck = (j.hoursSinceCheck ?? 0) + j.hoursPerLeg;
  const day = rollDay(march.state, { ...j, legsDone, lost: false, hoursSinceCheck: sinceCheck });
  const extra = [...march.status, ...day.status];
  const facts = [...march.facts, ...day.facts];
  if (legsDone >= day.journey.legsTotal) {
    const a = arrive(day.state, j.to, j.hoursPerLeg, j.ground.toLowerCase(), j.terrain, true);
    const all = [...facts, ...(a.facts ?? [])];
    return { ...a, ...(extra.length ? { extra } : {}), ...(all.length ? { facts: all } : {}) };
  }
  const camp = withRoadCamp(day.state, rollStretch(day.state, day.journey, sinceCheck >= WATCH_HOURS));
  const journey = camp.journey;
  const stop = passStop(withRouteStops(camp.state, journey), journey);
  const clock = advanceClock({ ...stop.state, currentLocation: UNDERWAY_HERE, journey }, j.hoursPerLeg);
  extra.push(...stop.status, ...daySpentLines(day.state, journey));
  facts.push(...stop.facts, ...camp.facts, ...(dayIsSpent(day.state, journey) ? ["The day's travel is nearly spent."] : []));
  return {
    state: clock.state,
    handled: true,
    arrived: false,
    underway: true,
    outcome: 'set out',
    ...(extra.length ? { extra } : {}),
    ...(facts.length ? { facts } : {}),
    ...stretchEvent(march.state, journey, day.lost, stop.found),
    receipt: `Travel: ${j.ground.toLowerCase()} between ${j.from} and ${j.to}${paceTag(state, j.terrain)} — leg ${legsDone} of ${journey.legsTotal} — ${clock.note}; ${j.to} still ahead${encounterNote(journey)}`,
  };
}
const survival = (state: Pick<GameState, 'engineMode'>) => modeProfile(state.engineMode).travelSurvival;
const travelDay = (j: TravelJourney) => j.terrain !== 'streets';
function stretchEvent(state: ClockState, j: TravelJourney, lost: boolean, found: boolean): Pick<TravelCommit, 'event'> {
  const event: TravelCommit['event'] =
    j.encounter && !roadMeetingOver(j.encounter) ? 'meeting' : lost ? 'lost' : found ? 'find' : dayIsSpent(state, j) ? 'day spent' : undefined;
  return event ? { event } : {};
}
/** The next stretch would take today's road hours on the world clock past 8 (SRD Extended Travel). */
export function dayIsSpent(state: ClockState, j: TravelJourney): boolean {
  return travelDay(j) && roadHoursToday(state) + j.hoursPerLeg > TRAVEL_DAY_HOURS;
}
function canTravelOn(state: ClockState, j: TravelJourney): boolean {
  return (
    !dayIsSpent(state, j)
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
  if (job === 'forager') return survival(state) && !roadDayNow(state).fed;
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

/**
 * VR1-b: STATUS from the shared CheckResultRecord via formatCheckRecord (one maths path; label names the job).
 * Pre-roll ("rolling a d20…") stays on the live chip UI — silent rollers already rolled, so STATUS is the result only
 * (bare "d20" with no kept die must not enter STATUS or die chrome counts a phantom).
 * SRD 5.2.1 Travel Terrain DCs (WotC CC BY 4.0) still set the record's dc.
 */
function checkLines(state: GameState, rec: CheckResultRecord): string[] {
  if (modeProfile(state.engineMode).numbers === 'hidden') return [];
  return [formatCheckRecord(rec, state.engineMode)];
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
  const dc = rule.dc(terrainRow(j.terrain));
  const rec = resolveCheckRecord({ label, mods, dc, adv, rng: keyedRng(key) });
  // VR1 CheckSpec — SRD 5.2.1: ability check when the outcome is uncertain (WotC CC BY 4.0).
  rec.spec = { kind: 'skill', ability: 'WIS', skill: rule.skill, dc, dcShown: false, adv };
  return rec;
}

interface JobSettle {
  state: GameState;
  journey: TravelJourney;
  status: string[];
  facts: string[];
  lost: boolean;
}

/** A failed guide loses the way (the trip runs a stretch longer); a forager who finds food feeds the day (any trip). */
function settleJob(state: GameState, j: TravelJourney, job: TravelJob, who: string, key: string): JobSettle {
  if (!jobOpen(state, j, job)) return { state, journey: j, status: [], facts: [], lost: false };
  const rec = jobRoll(state, j, job, who, key);
  const ok = rec.outcome === 'success';
  const name = who === 'you' ? 'You' : who;
  let journey: TravelJourney = { ...j, jobResults: { ...(j.jobResults ?? {}), [job]: ok } };
  const status = checkLines(state, rec);
  const facts: string[] = [outcomeFactFromRecord(rec)];
  const lost = job === 'guide' && !ok;
  if (lost) {
    journey = { ...journey, lost: true, lostLegs: (j.lostLegs ?? 0) + 1, legsTotal: j.legsTotal + 1 };
    if (modeProfile(state.engineMode).numbers !== 'hidden') status.push('Lost: the way goes wrong for a stretch (+1 stretch)');
    facts.push(`${name} lost the way for a while; this stretch went wrong and the trip runs a stretch longer.`);
  }
  let s = state;
  if (job === 'forager') {
    if (ok) s = { ...state, roadDay: { ...roadDayNow(state), fed: true } };
    facts.push(ok ? `${name} found enough to eat along the way.` : `${name} found nothing to eat along the way.`);
  }
  return { state: s, journey, status, facts, lost };
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
  let journey: TravelJourney = { ...j, day, weather, jobsRolledDay: day, jobResults: {}, lost: false };
  journey = { ...journey, jobs: assignJobs(state, journey) };
  const numbers = modeProfile(state.engineMode).numbers;
  const rule = weatherRuleOf(weather);
  const status: string[] = numbers === 'hidden' ? [] : [`Weather: ${weather}${numbers === 'open' && rule.rule ? ` (${rule.rule})` : ''}`];
  const facts: string[] = weather === 'clear' ? [] : [`The weather on the road today: ${weather}.`];
  let lost = false;
  let s = state;
  for (const job of TRAVEL_JOBS) {
    const who = journey.jobs?.[job];
    if (!who) continue;
    const r = settleJob(s, journey, job, who, `${key}|${job}`);
    s = r.state;
    journey = r.journey;
    status.push(...r.status);
    facts.push(...r.facts);
    lost = lost || r.lost;
  }
  return { state: s, journey, status, facts, lost };
}

/** The PC takes a travel job for the road (a chip). A job not rolled yet today is rolled now. */
function takeJob(state: GameState, j: TravelJourney, job: TravelJob): TravelCommit {
  const done = j.jobResults?.[job] !== undefined;
  let journey: TravelJourney = { ...j, pcJob: job, jobs: { ...(j.jobs ?? {}), [job]: 'you' } };
  let s = state;
  const extra: string[] = [];
  const facts: string[] = [];
  if (!done && jobOpen(state, j, job)) {
    const r = settleJob(state, journey, job, 'you', `${tripKey(state, j)}|day${j.day ?? 1}|pc-${job}`);
    s = r.state;
    journey = r.journey;
    extra.push(...r.status);
    facts.push(...r.facts);
  }
  const what = { guide: 'you lead the way', lookout: 'you keep lookout', forager: 'you forage as you go' }[job];
  return {
    state: { ...s, currentLocation: UNDERWAY_HERE, journey },
    handled: true,
    arrived: false,
    outcome: 'unchanged',
    receipt: stillOn(state, journey, done ? `${what} (already done today)` : what),
    ...(extra.length ? { extra } : {}),
    facts: [`${what.charAt(0).toUpperCase()}${what.slice(1)}.`, ...facts],
  };
}

/** One job chip the PC has not taken today (story RPG companions take theirs on their own: no chip). */
function jobChip(state: Partial<Pick<GameState, 'engineMode'>> & ClockState, j: TravelJourney): string | null {
  if (!travelDay(j) || state.engineMode === 'rpg' || state.engineMode === 'pyoa') return null;
  const pick = (['lookout', 'forager', 'guide'] as TravelJob[]).find(
    (job) => j.jobResults?.[job] === undefined && jobOpen(state as GameState, j, job)
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

/** One more Exhaustion level; at level 6 the character dies (SRD 5.2.1), settled by the table's death rule. */
function exhaust(state: GameState, rng: () => number, deathFact: string): { state: GameState; lines: string[]; fact?: string } {
  const before = exhaustionLevel(state.character);
  const character = gainExhaustion(state.character, 1);
  const after = exhaustionLevel(character);
  if (after >= EXHAUSTION_DEATH) {
    const end = commitDeath({ ...state, character }, 'danger', rng, deathFact);
    const s = end.dead ? end.state : { ...end.state, character: { ...end.state.character, exhaustion: EXHAUSTION_DEATH - 1 } };
    return { state: s, lines: [`Exhaustion: level ${before} → ${after}, death`, ...end.receipts], fact: end.fact };
  }
  return { state: { ...state, character }, lines: [`Exhaustion: level ${before} → ${after}`] };
}

/**
 * SRD Extended Travel (tabletop): the road hours go on the world clock's day, and each hour past 8 in that day
 * calls a Constitution save, DC 10 + the hours past 8. `key` is the trip's dice key.
 */
interface March {
  state: GameState;
  status: string[];
  facts: string[];
  /** The march killed the PC (Exhaustion 6): the trip stops where they fell, and nothing more is rolled. */
  dead?: boolean;
}

function marchHours(state: GameState, terrain: JourneyTerrain, key: string, hours: number): March {
  if (terrain === 'streets') return { state, status: [], facts: [] };
  const today = roadDayNow(state);
  const since = today.since;
  const before = today.hours;
  const after = before + hours;
  const logged: GameState = { ...state, roadDay: { ...today, hours: after } };
  if (!survival(state) || after <= TRAVEL_DAY_HOURS) return { state: logged, status: [], facts: [] };
  let s = logged;
  const status: string[] = [];
  let failed = 0;
  let deathFact: string | undefined;
  const facts: string[] = [];
  for (let h = Math.max(TRAVEL_DAY_HOURS, Math.floor(before)) + 1; h <= Math.floor(after) && !s.deathSaves?.dead && !deathFact; h++) {
    const dc = extendedTravelDc(h - TRAVEL_DAY_HOURS);
    // SRD 5.2.1 Forced March / Extended Travel: Constitution saving throw (WotC CC BY 4.0).
    const rec = resolveCheckRecord({
      label: 'Extended Travel: Constitution save',
      mods: conSaveMods(s),
      dc,
      rng: keyedRng(`${key}|march|${since}|${h}`),
    });
    rec.spec = { kind: 'save', ability: 'CON', dc, dcShown: true, adv: 'normal' };
    status.push(...checkLines(s, rec));
    facts.push(outcomeFactFromRecord(rec));
    if (rec.outcome === 'failure') {
      const ex = exhaust(s, keyedRng(`${key}|death|${since}|${h}`), 'The forced march wore you down past what a body can bear. Your breath stops on the road. You are dead.');
      s = ex.state;
      status.push(...ex.lines);
      deathFact = ex.fact;
      failed++;
    }
  }
  if (s.deathSaves?.dead) return { state: s, status, facts: [...facts, deathFact ?? ''], dead: s.deathSaves.dead };
  if (deathFact) facts.push(deathFact);
  else if (failed) facts.push('The forced march wore you down; you are more exhausted than before.');
  return { state: s, status, facts };
}

/** The trip ends where the march killed the PC: no weather, jobs, stretch or arrival after death. */
function diedOnRoad(march: March, receipt: string, journey: TravelJourney | null): TravelCommit {
  return {
    state: journey ? { ...march.state, currentLocation: UNDERWAY_HERE, journey } : march.state,
    handled: true,
    arrived: false,
    outcome: 'unchanged',
    extra: march.status,
    facts: march.facts,
    receipt,
  };
}

function daySpentLines(state: GameState, j: TravelJourney): string[] {
  if (!dayIsSpent(state, j)) return [];
  const numbers = modeProfile(state.engineMode).numbers;
  if (numbers === 'hidden') return [];
  return numbers === 'open' && survival(state)
    ? [`Travel day: ${formatSpan(roadHoursToday(state))} on the road — make camp, or push on (CON save each hour past 8)`]
    : ['Travel day: spent — make camp or push on'];
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

/** Where this stretch sits on its route: the route key and the leg counted from the route's first end (null off a travel day or while lost). */
function routeLeg(j: TravelJourney): { key: string; leg: number } | null {
  if (!travelDay(j) || j.lost) return null;
  const key = routeKey(j.from, j.to);
  const flipped = key.split(' ~ ')[0] !== tidy(j.from).toLowerCase();
  const base = j.legsTotal - (j.lostLegs ?? 0);
  const progress = j.legsDone - (j.lostLegs ?? 0);
  return { key, leg: flipped ? base - progress : progress };
}

function withRoadCamp(state: GameState, j: TravelJourney): { state: GameState; journey: TravelJourney; facts: string[] } {
  const at = routeLeg(j);
  const enc = j.encounter;
  const same = { state, journey: j, facts: [] as string[] };
  if (!at || replayPreFeature()) return same;
  const placed = campAt(state, at.key, at.leg);
  if (placed) {
    const met = campEncounter(placed, enc ?? { stretch: j.legsDone, dangerous: (j.areaTier ?? 1) >= DANGEROUS_TIER });
    if (met) return { state, journey: { ...j, encounter: met, quietStretches: 0 }, facts: [] };
    const journey = enc?.kind === 'camp' ? { ...j, encounter: null } : j;
    return { state, journey, facts: [`The way passes ${placed.name}, empty since you cleared it.`] };
  }
  if (enc?.kind !== 'camp' || enc.camp) return same;
  const made = placeRoadCamp(state, at.key, at.leg, enc);
  return { state: made.state, journey: { ...j, encounter: made.encounter }, facts: [] };
}

/** The named stop on this stretch, and its find if the look-out spotted it (once). Not while the way is lost. */
function passStop(state: GameState, j: TravelJourney): { state: GameState; status: string[]; facts: string[]; found: boolean } {
  const none = { state, status: [] as string[], facts: [] as string[], found: false };
  const at = routeLeg(j);
  const key = at?.key ?? '';
  const stops = state.routeStops?.[key];
  if (!at || !stops?.length) return none;
  const i = stops.findIndex((s) => s.leg === at.leg);
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
    next = gainLootMoney({ ...next, inventory: [...(next.inventory ?? []), ...loot.items] }, loot.gold, loot.coins);
    if (loot.items.length) status.push(`Loot: ${loot.items.map((it) => `[${it.rarity}] ${it.name}`).join(', ')}`);
    const money = lootMoneyText(loot.gold, loot.coins);
    if (money) status.push(`Gold Gained: ${money}`);
  }
  if (modeProfile(state.engineMode).numbers !== 'hidden') status.unshift(`Find: ${stop.find} at ${stop.name}`);
  const xp = payFindXp(next, `road-find:${key}:${stop.name}`, stop.find);
  return { state: xp.state, status: [...status, ...xp.status], facts, found: true };
}

/**
 * Night camp: the watch order, a meeting check each watch (a hostile one breaks the rest), the day's food
 * (tabletop rations, Malnutrition), the SRD rest, and a companion's talk by the fire. The next day starts on waking.
 */
function makeCamp(state: GameState, j: TravelJourney): TravelCommit {
  const key = `${tripKey(state, j)}|camp|${j.day ?? 1}|${state.turn ?? 0}`;
  const helper = travelHelper(state);
  const numbers = modeProfile(state.engineMode).numbers;
  const extra: string[] = numbers === 'hidden' ? [] : [helper ? `Camp: watches — you first, ${helper} second` : 'Camp: you keep the first watch; the second goes unwatched'];
  const facts: string[] = [
    helper
      ? `You made camp off the ${j.ground.toLowerCase()} and split the watches with ${helper}.`
      : `You made camp off the ${j.ground.toLowerCase()} and kept the first watch alone.`,
  ];
  let journey: TravelJourney = { ...j, encounter: null };
  let night: RoadEncounter | null = null;
  let watch = 0;
  for (let w = 1; w <= CAMP_WATCHES && !night && !replayPreFeature(); w++) {
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
    const eat = roadDayNow(s).fed ? null : eatRation(s.inventory ?? []);
    if (!eat || eat.ate) {
      // A full day's food (SRD 5.2.1 Malnutrition) ends the hungry-day count and the Malnutrition hold on Exhaustion.
      const character = s.character.malnutritionExhaustion ? { ...s.character, malnutritionExhaustion: 0 } : s.character;
      s = { ...s, ...(eat ? { inventory: eat.inventory } : {}), character, daysWithoutFood: 0 };
      extra.push(eat ? `Rations: 1 day eaten (${eat.left} left)` : 'Rations: none eaten (foraged food)');
    } else {
      const days = (s.daysWithoutFood ?? 0) + 1;
      s = { ...s, daysWithoutFood: days };
      extra.push(`Rations: none — ${days} day${days === 1 ? '' : 's'} without food`);
      facts.push('There was nothing to eat.');
      if (days >= STARVE_DAYS) {
        const ex = exhaust(s, keyedRng(`starve|${s.turn ?? 0}|${days}`), 'Days without food took the last of your strength. You are dead.');
        s = { ...ex.state, character: { ...ex.state.character, malnutritionExhaustion: (s.character.malnutritionExhaustion ?? 0) + exhaustionLevel(ex.state.character) - exhaustionLevel(s.character) } };
        extra.push(`Malnutrition: ${ex.lines[0]}`, ...ex.lines.slice(1));
        if (ex.fact) facts.push(ex.fact);
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
  const span = `from ${slotNow(state)} until ${slotNow(s)}`;
  facts.push(`The camp lasted ${span}.`);
  if (night) {
    const placed = withRoadCamp(s, { ...journey, encounter: night });
    s = placed.state;
    journey = placed.journey;
    facts.push(...placed.facts);
    if (journey.encounter) facts.push(`On waking, the camp is not alone.`);
  }
  journey = { ...journey, day: (j.day ?? 1) + 1, hoursSinceCheck: WATCH_HOURS, lost: false };
  return {
    state: wakeToNewDay({ ...s, currentLocation: UNDERWAY_HERE, journey }),
    handled: true,
    arrived: false,
    outcome: 'unchanged',
    event: 'camp',
    receipt: stillOn(s, journey, `camped ${span}${night ? encounterNote(journey) : ''}`),
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

const TYPED_DESTINATION =
  /\b(?:travel(?:ing)?|go(?:ing)?|head(?:ing)?|walk(?:ing)?|move|return)\s+(?:back\s+)?(?:to|toward|towards|into|for)\s+(?:the\s+)?(.+)$/i;

/** A named hub, forgiving a typo in a typed destination ("travel to Lowmarkt"). */
function typedHub(input: string, bibleId: string | undefined | null) {
  const hub = parseTravelDestination(input, bibleId);
  if (hub) return hub;
  const name = input.match(TYPED_DESTINATION)?.[1]?.replace(/[.!?]+$/, '').trim();
  if (!name) return null;
  const hubs = hubsForBibleId(bibleId);
  const hit = fuzzyTypedPhrase(name, hubs.map((h) => h.name));
  return hit ? hubs.find((h) => h.name === hit) ?? null : null;
}

function commitTravelStep(state: GameState, raw: string): TravelCommit {
  const input = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (!input || state.activeEncounter) return unchanged(state);
  if (state.journey && isJourneyUnderway(state)) {
    const origin = journeyOrigin(state) || state.journey.from;
    const j: TravelJourney = origin === state.journey.from ? state.journey : { ...state.journey, from: origin };
    state = j === state.journey ? state : { ...state, journey: j };
    const named = typedHub(input, state.campaignBibleId);
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
    if (onward) {
      const pushOnSlot = chip === 'push on' ? timeOfDayForHour(currentHour(state)) : undefined;
      const out = stepAlong(state, j);
      return pushOnSlot ? { ...out, pushOnSlot } : out;
    }
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
    // CR-1 — sneak into a placed camp and rob the stash (SK-3 → LK-1 lock → LK-1 alarm). No "raid" chip.
    if (j.encounter?.kind === 'camp' && j.encounter.camp?.placeId && meetingMoveBase(input).toLowerCase() === SNEAK_CAMP_PAD.toLowerCase()) {
      let place: import('./types').PlaceRecord | undefined;
      const places = state.places ?? [];
      for (let pi = 0; pi < places.length; pi++) {
        if (places[pi]!.id === j.encounter!.camp!.placeId) {
          place = places[pi];
          break;
        }
      }
      if (place?.roadCamp && place.dungeonCard) {
        const rob = resolveCampRob(state, place);
        if (rob) {
          let next = rob.state;
          if (rob.outcome === 'robbed') next = recordCampOutcome(next, place.id, 'robbed');
          const journey: TravelJourney = {
            ...j,
            encounter: rob.wake
              ? { ...j.encounter, engaged: true }
              : rob.outcome === 'robbed'
                ? { ...j.encounter, escaped: true, escapedTurn: state.turn, closedTurn: state.turn }
                : j.encounter,
          };
          const foe = rob.wake && engineAllowsCombat(state) ? liveRoadFoe(next, journey.encounter!) : null;
          return {
            state: {
              ...next,
              currentLocation: UNDERWAY_HERE,
              journey,
              ...(foe ? { activeEncounter: foe } : {}),
            },
            handled: true,
            arrived: false,
            outcome: foe ? 'fight opened' : rob.outcome === 'robbed' ? 'slipped away' : 'unchanged',
            receipt: foe
              ? `${where}; camp woke — fight: ${foe.name} (level ${foe.level}, ${foe.maxHp} HP)`
              : `${where}; ${rob.receipts[rob.receipts.length - 1] ?? 'camp rob'}`,
            extra: rob.receipts,
            facts: rob.outcome === 'robbed'
              ? [`You slipped the camp stash at ${place.name}.`]
              : rob.wake
                ? [`The camp at ${place.name} woke as you tried to rob it.`]
                : undefined,
          };
        }
      }
    }
    const answered = j.encounter ? answersMeeting(j.encounter, input, state.turn, j.terrain) : null;
    const help = answered?.engaged && answered.kind === 'plea' ? helpPlea(state, answered) : null;
    const helped = answered ? { ...j, encounter: help?.encounter ?? answered } : j;
    const slipped = !help && !!helped.encounter?.escaped && helped.encounter.escapedTurn === state.turn;
    const fact = help?.fact ?? (slipped && answered?.kind === 'wildlife' ? 'You gave the animal room, and it went its own way.' : null);
    return {
      state: { ...(help?.state ?? state), currentLocation: UNDERWAY_HERE, journey: helped },
      handled: true,
      arrived: false,
      outcome: slipped ? 'slipped away' : 'unchanged',
      receipt: `${where}; ${j.to} still ahead${helped.encounter ? encounterNote(helped) : ''}`,
      ...(help?.extra.length ? { extra: help.extra } : {}),
      ...(fact ? { facts: [fact] } : {}),
    };
  }
  const parkedOnRoad = isRoadLabel(state.currentLocation);
  const here = parkedOnRoad
    ? journeyOrigin(state)
    : dungeonRoomPlace(state, state.currentLocation) ?? tidy(state.currentLocation);
  const hub = typedHub(input, state.campaignBibleId);
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
