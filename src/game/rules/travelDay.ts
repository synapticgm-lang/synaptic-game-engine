/**
 * Shared rules engine — a day on the road (every mode; the mode profile decides what is shown).
 *
 * From the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at
 * https://www.dndbeyond.com/srd, licensed under CC-BY-4.0 (https://creativecommons.org/licenses/by/4.0/legalcode):
 * the Travel Terrain table (maximum pace, encounter distance, Foraging, Navigation and Search DCs) and Good Roads;
 * Extended Travel (each hour past 8 in a day: Constitution saving throw, DC 10 + 1 per hour past 8, or 1 Exhaustion
 * level); the Exhaustion condition (D20 Tests −2 × level, Speed −5 feet × level, death at level 6, a Long Rest
 * removes 1 level); Malnutrition (no food for 5 days: 1 Exhaustion level at the end of the fifth day and 1 more each
 * day after, not removed until the creature eats a full day's food); Rations; Heavy Precipitation (Lightly
 * Obscured, Disadvantage on Wisdom (Perception) checks); Strong Wind (Disadvantage on ranged weapon attack rolls);
 * and the Survival skill (follow tracks, forage, find a trail).
 *
 * The SRD leaves these to the GM; the engine makes the same call in every mode: a meeting check each watch
 * (4 hours) on a d6, about one in three meetings hostile, what each side wants, the three travel jobs and what a
 * failed one costs, the daily weather roll, named stops and their finds.
 */
import type { Character, Item, JourneyTerrain, RoadEncounterKind, RouteStop, TravelJob, TravelWeather } from '../types';
import type { AdvState } from '../checkRules';
import type { TravelPace } from './travelPace';

export type SrdTerrain =
  | 'arctic'
  | 'coastal'
  | 'desert'
  | 'forest'
  | 'grassland'
  | 'hill'
  | 'mountain'
  | 'swamp'
  | 'underdark'
  | 'urban'
  | 'waterborne';

export interface SrdTerrainRow {
  maxPace: TravelPace | 'special';
  /** Encounter distance dice: [count, sides] × 10 feet. */
  distance: readonly [number, number];
  foraging: number;
  navigation: number;
  search: number;
}

/** SRD 5.2.1 Travel Terrain table. */
export const SRD_TRAVEL_TERRAIN: Readonly<Record<SrdTerrain, SrdTerrainRow>> = {
  arctic: { maxPace: 'fast', distance: [6, 6], foraging: 20, navigation: 10, search: 10 },
  coastal: { maxPace: 'normal', distance: [2, 10], foraging: 10, navigation: 5, search: 15 },
  desert: { maxPace: 'normal', distance: [6, 6], foraging: 20, navigation: 10, search: 10 },
  forest: { maxPace: 'normal', distance: [2, 8], foraging: 10, navigation: 15, search: 15 },
  grassland: { maxPace: 'fast', distance: [6, 6], foraging: 15, navigation: 5, search: 15 },
  hill: { maxPace: 'normal', distance: [2, 10], foraging: 15, navigation: 10, search: 15 },
  mountain: { maxPace: 'slow', distance: [4, 10], foraging: 20, navigation: 15, search: 20 },
  swamp: { maxPace: 'slow', distance: [2, 8], foraging: 10, navigation: 15, search: 20 },
  underdark: { maxPace: 'normal', distance: [2, 6], foraging: 20, navigation: 10, search: 20 },
  urban: { maxPace: 'normal', distance: [2, 6], foraging: 20, navigation: 15, search: 15 },
  waterborne: { maxPace: 'special', distance: [6, 6], foraging: 15, navigation: 10, search: 15 },
};

const SRD_TERRAIN_OF: Record<JourneyTerrain, SrdTerrain> = {
  road: 'grassland',
  coast: 'coastal',
  forest: 'forest',
  marsh: 'swamp',
  mountain: 'mountain',
  streets: 'urban',
};

/** Ground the travel engine already names, as its SRD terrain row. */
export function srdTerrainOf(terrain: JourneyTerrain): SrdTerrain {
  return SRD_TERRAIN_OF[terrain] ?? 'grassland';
}

export function terrainRow(terrain: JourneyTerrain): SrdTerrainRow {
  return SRD_TRAVEL_TERRAIN[srdTerrainOf(terrain)];
}

/** Ground with a good road or street on it (SRD Good Roads: one pace step faster than the terrain allows). */
const GOOD_ROAD = new Set<JourneyTerrain>(['road', 'coast', 'streets']);

export function hasGoodRoad(terrain: JourneyTerrain): boolean {
  return GOOD_ROAD.has(terrain);
}

const PACE_STEPS: readonly TravelPace[] = ['slow', 'normal', 'fast'];

/** SRD maximum pace on this ground, a step faster on a good road. */
export function maxTravelPace(terrain: JourneyTerrain): TravelPace {
  const row = terrainRow(terrain);
  const base: TravelPace = row.maxPace === 'special' ? 'normal' : row.maxPace;
  if (!hasGoodRoad(terrain)) return base;
  return PACE_STEPS[Math.min(PACE_STEPS.length - 1, PACE_STEPS.indexOf(base) + 1)]!;
}

/** The chosen pace, no faster than the ground allows. */
export function paceOnGround(pace: TravelPace, terrain: JourneyTerrain): TravelPace {
  const max = maxTravelPace(terrain);
  return PACE_STEPS.indexOf(pace) > PACE_STEPS.indexOf(max) ? max : pace;
}

/** SRD Extended Travel: hours in a travel day before the Constitution saves start. */
export const TRAVEL_DAY_HOURS = 8;

/** SRD Extended Travel DC for the nth hour past 8. */
export function extendedTravelDc(hoursPast: number): number {
  return 10 + Math.max(1, Math.floor(hoursPast));
}

/** A watch: one meeting check per watch on the road and at camp (GM call). */
export const WATCH_HOURS = 4;
/** Two watches through the night at camp; SRD Long Rest allows up to 2 hours of standing watch. */
export const CAMP_WATCHES = 2;

/** Meeting check (GM call): a d6 per watch, a meeting on 1, or on 1–2 on dangerous or haunted ground. */
export function meetingOn(dangerous: boolean): number {
  return dangerous ? 2 : 1;
}

/** Encounter distance in feet from the SRD dice for this ground. `rng` in [0, 1). */
export function encounterDistanceFt(terrain: JourneyTerrain, rng: () => number): number {
  const [n, sides] = terrainRow(terrain).distance;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += 1 + Math.min(sides - 1, Math.floor(rng() * sides));
  return sum * 10;
}

/** The closest the SRD dice allow: a meeting the look-out failed to spot is first seen this near. */
export function minEncounterDistanceFt(terrain: JourneyTerrain): number {
  return terrainRow(terrain).distance[0] * 10;
}

/** Daily weather roll (GM call): a d20 per day for the ground being crossed. */
export function weatherFor(d20: number): TravelWeather {
  if (d20 <= 9) return 'clear';
  if (d20 <= 13) return 'overcast';
  if (d20 <= 16) return 'light rain';
  if (d20 <= 18) return 'heavy rain';
  if (d20 === 19) return 'strong wind';
  return 'fog';
}

export interface WeatherRule {
  /** Wisdom (Perception) checks while it lasts. */
  perception?: AdvState;
  /** Ranged weapon attack rolls while it lasts. */
  rangedWeapons?: AdvState;
  /** The way is hard to keep: the guide must navigate even on a road. */
  hardGoing: boolean;
  /** SRD wording for the dice line. */
  rule?: string;
}

export const WEATHER_RULE: Readonly<Record<TravelWeather, WeatherRule>> = {
  clear: { hardGoing: false },
  overcast: { hardGoing: false },
  'light rain': { hardGoing: false },
  'heavy rain': { perception: 'disadvantage', hardGoing: true, rule: 'Heavy Precipitation: Lightly Obscured, Disadvantage on Perception; open flames go out' },
  'strong wind': { rangedWeapons: 'disadvantage', hardGoing: false, rule: 'Strong Wind: Disadvantage on ranged weapon attacks; open flames go out' },
  fog: { perception: 'disadvantage', hardGoing: true, rule: 'fog, Lightly Obscured: Disadvantage on Perception' },
};

export function weatherRuleOf(weather: TravelWeather | undefined | null): WeatherRule {
  return weather ? WEATHER_RULE[weather] ?? WEATHER_RULE.clear : WEATHER_RULE.clear;
}

/** The guide has to find the way today: off a good road, or the weather hides it. */
export function needsNavigation(terrain: JourneyTerrain, weather: TravelWeather | undefined | null): boolean {
  return !hasGoodRoad(terrain) || weatherRuleOf(weather).hardGoing;
}

export interface TravelJobRule {
  /** Dice-line label. */
  label: string;
  skill: 'survival' | 'perception';
  dc: (row: SrdTerrainRow) => number;
  /**
   * Skill library family that will own this job's check once it is delivered (29 gathering, 31 survival and
   * navigation). Until then the job rolls the SRD skill.
   */
  libraryFamily?: 29 | 31;
}

/** The three travel jobs (GM call), each rolled once a day against the SRD Travel Terrain DCs. */
export const TRAVEL_JOB: Readonly<Record<TravelJob, TravelJobRule>> = {
  guide: { label: 'Navigation: Wisdom (Survival)', skill: 'survival', dc: (r) => r.navigation, libraryFamily: 31 },
  lookout: { label: 'Look-out: Wisdom (Perception)', skill: 'perception', dc: (r) => r.search },
  forager: { label: 'Foraging: Wisdom (Survival)', skill: 'survival', dc: (r) => r.foraging, libraryFamily: 29 },
};

export const TRAVEL_JOBS: readonly TravelJob[] = ['guide', 'lookout', 'forager'];

export const JOB_CHIP: Readonly<Record<TravelJob, string>> = {
  guide: 'Lead the way',
  lookout: 'Keep lookout',
  forager: 'Forage as you go',
};

export const TRAVEL_ON_CHIP = 'Travel on';
export const CAMP_CHIP = 'Make camp';
/** The push-on chip's head; the pad adds the hour it walks into and what a failed save costs (`travelJourney`). */
export const PUSH_ON_CHIP = 'Push on';

export type TravelEngineChip = TravelJob | 'travel on' | 'camp' | 'push on';

/** A chip the travel engine settles by itself (no player check, no writer decision). */
export function travelEngineChip(raw: string): TravelEngineChip | null {
  const t = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (/^travel on\.?$/i.test(t)) return 'travel on';
  if (/^(?:make|pitch|set up) camp\b/i.test(t)) return 'camp';
  if (/^push on\b/i.test(t)) return 'push on';
  if (/^lead the way\b/i.test(t)) return 'guide';
  if (/^keep (?:a )?look-?out\b/i.test(t)) return 'lookout';
  if (/^forage\b/i.test(t)) return 'forager';
  return null;
}

/** Hostile meetings: faced as a fight unless talked down or slipped past. */
export const HOSTILE_KINDS: ReadonlySet<RoadEncounterKind> = new Set(['thugs', 'undead', 'monster', 'villain']);

/** What the other side wants (GM call), shown before anyone rolls for initiative. Signs and lairs: what is seen. */
export const MEETING_WANT: Readonly<Record<RoadEncounterKind, readonly string[]>> = {
  wildlife: ['its kill left alone', 'you away from its young', 'food and nothing more', 'to pass by, wary'],
  traveler: ['news of the road ahead', 'company for the next stretch', 'to trade a little', 'directions'],
  meeting: ['to know your business here', 'word of someone gone missing', 'a hand with a heavy load', 'to sell what they carry'],
  thugs: ['a toll for the road', 'your purse and nothing more', 'to know who sent you', 'you gone from this stretch'],
  camp: ['to be left in peace', 'news from where you came from', 'to trade', 'to know if you are trouble'],
  undead: ['the living off their ground', 'what was taken from their graves', 'nothing but the living'],
  monster: ['to feed', 'its territory back', 'a way out, cornered'],
  villain: ['what you carry', 'you to turn back', 'your help on their own terms', 'your name for a debt'],
  signs: ['fresh tracks cross the way', 'a campfire still warm beside the path', 'a cart lies broken and looted', 'claw marks scar a tree at head height'],
  plea: ['a hurt traveler begs for help with a wound', 'a child is lost and asks the way home', 'a farmer begs help with a stuck cart', 'a pilgrim asks for food'],
  lair: ['a den mouth with bones at the threshold', 'a nest high in the rocks', 'a burrow with fresh spoil heaped outside', 'a cave that smells of a beast'],
};

/**
 * What helping each plea is (keyed by its `MEETING_WANT.plea` want): the writer's fact, and a pack cost. A plea that
 * costs a ration with none in the pack cannot be helped; the meeting is passed by and the fact says why.
 */
export const PLEA_HELP: Readonly<Record<string, { fact: string; ration?: true; cannot?: string }>> = {
  'a hurt traveler begs for help with a wound': { fact: "You stopped and bound the hurt traveler's wound." },
  'a child is lost and asks the way home': { fact: 'You showed the lost child the way home.' },
  'a farmer begs help with a stuck cart': { fact: "You put your shoulder to the farmer's cart and freed it from the mud." },
  'a pilgrim asks for food': {
    fact: 'You gave the pilgrim a day of your rations.',
    ration: true,
    cannot: 'You had no food to give the pilgrim, who went on hungry.',
  },
};

/** Stop names per ground (original, not from any licensed setting). */
const STOP_NAMES: Readonly<Record<JourneyTerrain, readonly string[]>> = {
  road: ['the Milestone', 'the Old Well', 'the Burned Farm', 'the Wayside Shrine', 'the Toll Stone', 'the Leaning Gibbet'],
  coast: ['the Gull Rocks', 'the Tide Steps', 'Wreck Cove', 'the Salt Cairn', 'the Fisher Huts'],
  forest: ['the Split Oak', 'Charcoal Clearing', 'the Mossy Stair', 'the Hollow Spring', "the Woodcutters' Hut"],
  marsh: ['the Plank Causeway', 'Heron Pool', 'the Sunken Cart', 'the Reed Shrine', 'the Eel Weir'],
  mountain: ['the Cairn Shelf', 'Goat Notch', 'the Cold Spring', "the Shepherd's Lean-to", 'the Fallen Arch'],
  streets: ['the Fountain Yard', "the Lamplighter's Corner", 'the Old Pump', 'the Chalk Wall'],
};

const FINDS: readonly NonNullable<RouteStop['find']>[] = ['cache', 'tracks', 'lore stone', 'shrine'];

export const FIND_FACT: Readonly<Record<NonNullable<RouteStop['find']>, string>> = {
  cache: 'a hidden cache tucked out of sight',
  tracks: 'tracks that show who passed this way and when',
  'lore stone': 'a weathered stone carved with an old account of this place',
  shrine: 'a small roadside shrine with fresh offerings',
};

/** The same route either way: one key for both ends. */
export function routeKey(a: string, b: string): string {
  return [a, b].map((s) => (s ?? '').replace(/\s+/g, ' ').trim().toLowerCase()).sort().join(' ~ ');
}

/**
 * The named stops on a route (1 or 2 between its ends), each counted from the route key's first end.
 * Half carry a find; the look-out spots it the first time the party passes.
 */
export function makeRouteStops(terrain: JourneyTerrain, legs: number, unit: (k: string) => number): RouteStop[] {
  const between = Math.max(0, legs - 1);
  if (!between) return [];
  const count = Math.min(2, between);
  const names = [...(STOP_NAMES[terrain] ?? STOP_NAMES.road)];
  const out: RouteStop[] = [];
  for (let i = 0; i < count; i++) {
    const name = names.splice(Math.min(names.length - 1, Math.floor(unit(`stop${i}`) * names.length)), 1)[0]!;
    const leg = count === 1 ? Math.max(1, Math.ceil(between / 2)) : i === 0 ? 1 : between;
    const find = unit(`find${i}`) < 0.5 ? FINDS[Math.min(FINDS.length - 1, Math.floor(unit(`kind${i}`) * FINDS.length))] : undefined;
    out.push({ name, leg, ...(find ? { find } : {}) });
  }
  return out;
}

const RATION = /\bration/i;
const RATION_DAYS = /\((\d+)\s+days?\)/i;

/** Eat one day's rations from the pack (SRD Rations: one day's food). `ate` is null when there is none. */
export function eatRation(inventory: readonly Item[]): { inventory: Item[]; ate: string | null; left: number } {
  const i = inventory.findIndex((it) => RATION.test(it.name) && (it.quantity ?? 1) > 0);
  if (i < 0) return { inventory: [...inventory], ate: null, left: 0 };
  const item = inventory[i]!;
  const qty = item.quantity ?? 1;
  const days = Number(item.name.match(RATION_DAYS)?.[1] ?? 0);
  let next: Item | null = null;
  if (qty > 1) next = { ...item, quantity: qty - 1 };
  else if (days > 1) next = { ...item, name: item.name.replace(RATION_DAYS, `(${days - 1} day${days - 1 === 1 ? '' : 's'})`) };
  const out = inventory.filter((_, k) => k !== i);
  if (next) out.splice(i, 0, next);
  const left = out.filter((it) => RATION.test(it.name)).reduce((n, it) => {
    const d = Number(it.name.match(RATION_DAYS)?.[1] ?? 0);
    return n + (it.quantity ?? 1) * Math.max(1, d);
  }, 0);
  return { inventory: out, ate: item.name, left };
}

/** SRD Malnutrition: from the end of the fifth day without food, one Exhaustion level each day. */
export const STARVE_DAYS = 5;

export const EXHAUSTION_DEATH = 6;

export function exhaustionLevel(c: Pick<Character, 'exhaustion'> | null | undefined): number {
  return Math.max(0, Math.min(EXHAUSTION_DEATH, Math.floor(c?.exhaustion ?? 0)));
}

/** SRD Exhaustion: each D20 Test is reduced by 2 × level. */
export function exhaustionD20(c: Pick<Character, 'exhaustion'> | null | undefined): number {
  return -2 * exhaustionLevel(c);
}

/** SRD Exhaustion: Speed is reduced by 5 feet × level. */
export function exhaustionSpeed(c: Pick<Character, 'exhaustion'> | null | undefined): number {
  return 5 * exhaustionLevel(c);
}

/** One more Exhaustion level, capped at death (level 6). */
export function gainExhaustion<C extends Pick<Character, 'exhaustion'>>(c: C, levels = 1): C {
  return { ...c, exhaustion: Math.min(EXHAUSTION_DEATH, exhaustionLevel(c) + levels) };
}
