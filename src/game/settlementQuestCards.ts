/**
 * 29q — settlement quest cards.
 * A village / town / harbour / city place gets two cards once, when the place is first
 * created (like seedDungeonState hidden rooms). Code owns the template id and that the
 * card was offered; the writer may fill the who / what / where slots.
 *
 * Flavour lines a later writer pass should fill (one per template, no story prose here):
 * - harbour-boat-overdue: who is waiting on the quay, what the boat was carrying
 * - harbour-crate-missing: whose crate, what was inside
 * - harbour-nets-mending: whose nets, what tore them
 * - harbour-tide-find: what the tide uncovered, who found it
 * - forest-wood-cutting: who needs the wood, what it is for
 * - forest-shrine-damaged: what carving or shrine, who tends it
 * - forest-taking-stock: what is taking stock in the trees, whose stock
 * - forest-path-blocked: what blocks the path, who needs it open
 * - desert-well-bad: which well, who drinks from it
 * - desert-caravan-late: whose caravan, what it carries
 * - desert-water-salt-trade: who trades, water or salt
 * - desert-stranded-shelter: who is stranded, where they wait
 * - city-stall-theft: whose stall, what was taken
 * - city-delivery: what goes across town, to whom
 * - city-notice-board: what the notice asks, who posted it
 * - city-unpaid-debt: who owes, who is owed
 * - farm-harvest: whose field, what crop
 * - farm-missing-animal: whose animal, what kind
 * - farm-broken-fence: whose fence or field, what broke it
 * - farm-buyer-unpaid: who bought, who is owed
 */

import type { WorldOutlineSettlement } from '@/data/worldOutlines';
import type { GameState, Item, PlaceRecord, SettlementQuestCard, SettlementQuestParams } from './types';
import { questFitsSettlement } from './worldMapAuthority';
import { chestProfileForGrade, rollLoot } from './lootTableRegistry';
import { resolveLocalAreaLevel } from './placeAuthority';
import { milestoneXp } from './xpRules';

export type SettlementPlaceType = 'harbour' | 'forest' | 'desert' | 'city' | 'farm';

export interface SettlementQuestTemplate {
  id: string;
  placeType: SettlementPlaceType;
  /** Quest tag checked with questFitsSettlement. */
  tag: string;
  label: string;
  /** Talk-trigger stake this template answers. */
  stake: 'missing' | 'theft' | 'job' | 'threat' | 'debt';
}

export const SETTLEMENT_QUEST_LIBRARY: SettlementQuestTemplate[] = [
  { id: 'harbour-boat-overdue', placeType: 'harbour', tag: 'fishing', label: 'Look into the boat that did not come back', stake: 'missing' },
  { id: 'harbour-crate-missing', placeType: 'harbour', tag: 'fishing', label: 'Find the crate missing off the quay', stake: 'theft' },
  { id: 'harbour-nets-mending', placeType: 'harbour', tag: 'fishing', label: 'Help mend the torn nets', stake: 'job' },
  { id: 'harbour-tide-find', placeType: 'harbour', tag: 'fishing', label: 'See what the tide uncovered', stake: 'threat' },
  { id: 'forest-wood-cutting', placeType: 'forest', tag: 'forest', label: 'Cut the wood that is needed', stake: 'job' },
  { id: 'forest-shrine-damaged', placeType: 'forest', tag: 'forest', label: 'Look at the damaged carving', stake: 'threat' },
  { id: 'forest-taking-stock', placeType: 'forest', tag: 'forest', label: 'Stop whatever in the trees takes stock', stake: 'threat' },
  { id: 'forest-path-blocked', placeType: 'forest', tag: 'forest', label: 'Clear the blocked path', stake: 'job' },
  { id: 'desert-well-bad', placeType: 'desert', tag: 'desert', label: 'Find out why the well went bad', stake: 'threat' },
  { id: 'desert-caravan-late', placeType: 'desert', tag: 'desert', label: 'Find the late caravan', stake: 'missing' },
  { id: 'desert-water-salt-trade', placeType: 'desert', tag: 'desert', label: 'Deliver the water and salt trade', stake: 'job' },
  { id: 'desert-stranded-shelter', placeType: 'desert', tag: 'desert', label: 'Bring shade to someone stranded', stake: 'missing' },
  { id: 'city-stall-theft', placeType: 'city', tag: 'trade', label: 'Find what was stolen from the stall', stake: 'theft' },
  { id: 'city-delivery', placeType: 'city', tag: 'trade', label: 'Deliver a parcel across town', stake: 'job' },
  { id: 'city-notice-board', placeType: 'city', tag: 'social', label: 'Take the job on the notice board', stake: 'job' },
  { id: 'city-unpaid-debt', placeType: 'city', tag: 'trade', label: 'Collect the debt someone will not pay', stake: 'debt' },
  { id: 'farm-harvest', placeType: 'farm', tag: 'farming', label: 'Bring the harvest in', stake: 'job' },
  { id: 'farm-missing-animal', placeType: 'farm', tag: 'animal', label: 'Find the missing animal', stake: 'missing' },
  { id: 'farm-broken-fence', placeType: 'farm', tag: 'farming', label: 'Mend the broken fence', stake: 'job' },
  { id: 'farm-buyer-unpaid', placeType: 'farm', tag: 'farming', label: 'Collect from the buyer who never paid', stake: 'debt' },
];

export const SETTLEMENT_SEED_CARD_COUNT = 2;
export const MAX_OPEN_TALK_CARDS = 3;

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Village / town / harbour / city only; other kinds get no cards. */
export function settlementPlaceType(s: Pick<WorldOutlineSettlement, 'kind' | 'biome'>): SettlementPlaceType | null {
  const kind = (s.kind ?? '').toLowerCase();
  if (!['village', 'town', 'city', 'shore'].includes(kind)) return null;
  const biome = (s.biome ?? '').toLowerCase();
  if (kind === 'shore' || /coast|sea|river|shore|harbo/.test(biome)) return 'harbour';
  if (/desert|dry|dune|ash|salt/.test(biome)) return 'desert';
  if (/forest|wood/.test(biome)) return 'forest';
  if (/farm|plains|rural|orchard|wetland/.test(biome)) return 'farm';
  if (kind === 'village') return 'farm';
  return 'city';
}

function asSettlement(place: PlaceRecord, settlement?: WorldOutlineSettlement): WorldOutlineSettlement {
  return (
    settlement ?? {
      id: place.id,
      name: place.name,
      regionId: place.regionId ?? '',
      kind: (place.settlementKind ?? 'town') as WorldOutlineSettlement['kind'],
      biome: place.biome ?? '',
      blurb: '',
    }
  );
}

function cardFrom(
  template: SettlementQuestTemplate,
  place: PlaceRecord,
  source: SettlementQuestCard['source'],
  turn: number,
  params: SettlementQuestParams = {}
): SettlementQuestCard {
  return {
    id: `${place.id}:${template.id}`,
    templateId: template.id,
    label: template.label,
    params: { who: params.who ?? '', what: params.what ?? '', where: params.where ?? place.name },
    source,
    status: 'open',
    offeredTurn: turn,
  };
}

/**
 * Stamp exactly two fitting cards on a settlement place, once. Authored linked quests count
 * toward the two. A place already stamped comes back unchanged.
 */
export function seedSettlementQuestCards(
  place: PlaceRecord,
  opts: { settlement?: WorldOutlineSettlement; authoredQuestCount?: number; seed?: string; turn?: number } = {}
): PlaceRecord {
  if (place.questCardsSeeded) return place;
  const settlement = asSettlement(place, opts.settlement);
  const type = settlementPlaceType(settlement);
  if (!type) return place;
  const gap = Math.max(0, SETTLEMENT_SEED_CARD_COUNT - (opts.authoredQuestCount ?? 0));
  const fitting = SETTLEMENT_QUEST_LIBRARY.filter(
    (t) => t.placeType === type && questFitsSettlement(t.tag, settlement)
  );
  const start = hashString(`${opts.seed ?? ''}:${place.id}`) % Math.max(1, fitting.length);
  const picked: SettlementQuestTemplate[] = [];
  for (let i = 0; i < fitting.length && picked.length < gap; i++) {
    picked.push(fitting[(start + i) % fitting.length]);
  }
  return {
    ...place,
    questCardsSeeded: true,
    questCards: [
      ...(place.questCards ?? []),
      ...picked.map((t) => cardFrom(t, place, 'seed', opts.turn ?? 0)),
    ],
  };
}

function placeMatchesLocation(place: PlaceRecord, location: string): boolean {
  const here = location.trim().toLowerCase();
  if (!here) return false;
  const names = [place.name, ...(place.aliases ?? [])].map((n) => n.trim().toLowerCase()).filter((n) => n.length >= 3);
  return names.some((n) => n === here || here.includes(n));
}

export function settlementPlaceHere(state: Pick<GameState, 'places' | 'currentLocation'>): PlaceRecord | null {
  return (state.places ?? []).find((p) => p.questCardsSeeded && placeMatchesLocation(p, state.currentLocation ?? '')) ?? null;
}

/** Open card chips for the place the player is at. */
export function settlementQuestCardChoices(state: GameState, max = 2): string[] {
  if (state.openingEstablishment?.complete === false) return [];
  if (state.activeDungeon || state.activeEncounter) return [];
  const place = settlementPlaceHere(state);
  if (!place) return [];
  return (place.questCards ?? [])
    .filter((c) => c.status === 'open')
    .slice(0, max)
    .map((c) => c.label);
}

export function openTalkCardCount(places: PlaceRecord[] | undefined): number {
  return (places ?? []).reduce(
    (n, p) => n + (p.questCards ?? []).filter((c) => c.source === 'talk' && c.status === 'open').length,
    0
  );
}

export function completeSettlementQuestCard(places: PlaceRecord[], cardId: string): PlaceRecord[] {
  return places.map((p) =>
    p.questCards?.some((c) => c.id === cardId)
      ? { ...p, questCards: p.questCards.map((c) => (c.id === cardId ? { ...c, status: 'done' as const } : c)) }
      : p
  );
}

export interface SettlementCardFinish {
  places: PlaceRecord[];
  card: SettlementQuestCard | null;
  xp: number;
  /** STATUS XP line (reasoned). */
  notes: string[];
  lootNotes: string[];
  awardKey: string | null;
  item: Item | null;
}

export function settlementCardAwardKey(cardId: string): string {
  return `settlement-card:${cardId}`;
}

/** One item from the grade-1 chest roll at the local area level (reseeded if a roll comes up empty). */
function settlementCardItem(state: GameState, cardId: string): Item | null {
  for (let i = 0; i < 12; i++) {
    const loot = rollLoot({ profile: chestProfileForGrade(1), state, seed: `${state.seed ?? 'seed'}:${cardId}:${i}` });
    if (loot.items[0]) return loot.items[0];
  }
  return null;
}

/**
 * 29r — finish an open settlement card once: mark it done, pay the quest-complete milestone
 * (D&D reads the area level for the High band; rpg / litrpg the flat amount; over-level cut
 * applies) and grant one grade-1 chest item. A done or already-paid card returns nothing.
 * PYOA never pays.
 */
export function finishSettlementQuestCard(state: GameState, cardId: string): SettlementCardFinish {
  const places = state.places ?? [];
  const none: SettlementCardFinish = { places, card: null, xp: 0, notes: [], lootNotes: [], awardKey: null, item: null };
  const card = places.flatMap((p) => p.questCards ?? []).find((c) => c.id === cardId);
  const awardKey = settlementCardAwardKey(cardId);
  if (!card || card.status !== 'open' || (state.sandboxAwardKeys ?? []).includes(awardKey)) return none;
  if (state.engineMode === 'pyoa') return none;
  const done = completeSettlementQuestCard(places, cardId);
  const area = resolveLocalAreaLevel(state);
  const r = milestoneXp(state.engineMode, 'questComplete', {
    level: area.level,
    strictness: state.gmStrictness,
    playerLevel: area.partyLevel,
    areaLevel: area.rawLevel,
  });
  const item = settlementCardItem(state, cardId);
  return {
    places: done,
    card: { ...card, status: 'done' },
    xp: r.amount,
    notes: r.amount > 0 ? [`XP Gained: ${r.amount} (quest complete: ${card.label}${r.detail ? ` — ${r.detail}` : ''})`] : [],
    lootNotes: item ? [`Loot: [${item.rarity}] ${item.name}`] : [],
    awardKey,
    item,
  };
}

function chipKey(s: string): string {
  return (s ?? '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/** The open card whose chip the player picked at its own place (turn-start or this-turn location). */
export function settlementCardForChip(
  state: GameState,
  action: string,
  locations: Array<string | undefined>
): SettlementQuestCard | null {
  if (state.openingEstablishment?.complete === false) return null;
  if (state.activeDungeon || state.activeEncounter) return null;
  const said = chipKey(action);
  if (!said) return null;
  for (const loc of locations) {
    if (!loc) continue;
    const place = settlementPlaceHere({ places: state.places, currentLocation: loc });
    const card = (place?.questCards ?? []).find((c) => c.status === 'open' && chipKey(c.label) === said);
    if (card) return card;
  }
  return null;
}

const SMALL_TALK = /\b(how are you|good (?:morning|evening|day|afternoon)|well met|hello|greetings|nice weather|the weather|looks like rain|price list|costs? (?:\w+ )?(?:copper|silver|gold|coins?)|that'?ll be \d+)\b/i;
const ACTION = /\b(find|finds|finding|found|bring|brings|bringing|brought|stop|stops|stopping|deliver|delivers|delivering|delivered)\b/i;
const ANIMAL = /\b(dog|hound|pup|puppy|cat|goat|sheep|cow|calf|pig|horse|mule|ox|hen|chickens?|lamb|animal)\b/i;
const PERSON = /\b(son|daughter|child|boy|girl|brother|sister|husband|wife|father|mother|friend|man|woman|fisherman|crew)\b/i;
const MISSING = /\b(missing|lost|gone|vanished|disappeared|never came back|did not come back|didn'?t come back|ran off|run off|wandered off|taken)\b/i;
const THEFT = /\b(stole|stolen|steal|theft|thief|thieves|robbed|pinched|swiped)\b/i;
const DEBT = /\b(owes?|owed|won'?t pay|will not pay|never paid|unpaid|debt)\b/i;
const THREAT = /\b(danger|dangerous|threat|attack(?:s|ed)?|raid(?:s|ed)?|bandits?|wolves|wolf|beast|monster|poison(?:ed)?|burn(?:ed|ing)?)\b/i;
const JOB = /\b(job|work|parcel|package|delivery|shipment|harvest)\b/i;
const HARBOUR = /\b(boat|ship|quay|net|nets|tide|dock|harbou?r)\b/;
const DESERT = /\b(well|caravan|salt|water|stranded)\b/;
const FOREST = /\b(wood|trees?|shrine|carving|path)\b/;
const CITY = /\b(stall|notice|board|across town|market)\b/;
const FARM = /\b(field|fence|harvest|crop|buyer|farm)\b/;

type Stake = SettlementQuestTemplate['stake'];

function lineStake(line: string): Stake | null {
  if (MISSING.test(line) && (ANIMAL.test(line) || PERSON.test(line) || HARBOUR.test(line) || DESERT.test(line))) return 'missing';
  if (THEFT.test(line)) return 'theft';
  if (DEBT.test(line)) return 'debt';
  if (THREAT.test(line)) return 'threat';
  if (JOB.test(line) && /\b(dangerous|unpaid|won'?t pay|urgent)\b/i.test(line)) return 'job';
  return null;
}

/** True when a spoken line carries a real stake and a next action. */
export function isStakeLine(line: string): boolean {
  const t = (line ?? '').trim();
  if (t.length < 12) return false;
  if (SMALL_TALK.test(t) && !lineStake(t)) return false;
  return !!lineStake(t) && ACTION.test(t);
}

function templateScore(t: SettlementQuestTemplate, line: string, type: SettlementPlaceType | null): number {
  const l = line.toLowerCase();
  let score = t.placeType === type ? 2 : 0;
  if (t.id === 'farm-missing-animal' && ANIMAL.test(l)) score += 5;
  const hint = { harbour: HARBOUR, desert: DESERT, forest: FOREST, city: CITY, farm: FARM }[t.placeType];
  if (hint.test(l)) score += 3;
  return score;
}

function paramsFromLine(line: string, speaker?: string): SettlementQuestParams {
  const what =
    line.match(ANIMAL)?.[0]
    ?? line.match(PERSON)?.[0]
    ?? line.match(/\b(boat|crate|caravan|parcel|package|shipment|harvest|stall|well|nets?)\b/i)?.[0]
    ?? '';
  return { who: speaker ?? '', what: what.toLowerCase() };
}

/** Quoted spoken lines in committed prose (an NPC actually spoke). */
export function spokenLines(prose: string): string[] {
  const out: string[] = [];
  const re = /["“]([^"”]{4,400})["”]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(prose ?? ''))) out.push(m[1].trim());
  return out;
}

/**
 * Dialogue-only trigger: open at most one library card at the place here when an NPC line
 * has a stake and a next action. Returns the places unchanged when nothing opens.
 */
export function openTalkQuestCard(
  state: Pick<GameState, 'places' | 'currentLocation'>,
  spoken: string | string[],
  turn: number,
  speaker?: string
): { places: PlaceRecord[]; card: SettlementQuestCard | null } {
  const places = state.places ?? [];
  const none = { places, card: null };
  const place = settlementPlaceHere(state);
  if (!place) return none;
  const line = (Array.isArray(spoken) ? spoken : [spoken]).find((l) => isStakeLine(l));
  if (!line) return none;
  if (openTalkCardCount(places) >= MAX_OPEN_TALK_CARDS) return none;
  const cards = place.questCards ?? [];
  const seeded = cards.filter((c) => c.source === 'seed');
  const seededAllOpen = seeded.length > 0 && seeded.every((c) => c.status === 'open');
  if (seededAllOpen && cards.some((c) => c.source === 'talk')) return none;
  const stake = lineStake(line);
  const settlement = asSettlement(place);
  const type = settlementPlaceType(settlement);
  const used = new Set(cards.map((c) => c.templateId));
  const template = SETTLEMENT_QUEST_LIBRARY
    .filter((t) => t.stake === stake && !used.has(t.id) && questFitsSettlement(t.tag, settlement))
    .map((t) => ({ t, s: templateScore(t, line, type) }))
    .sort((a, b) => b.s - a.s)[0]?.t;
  if (!template) return none;
  const card = cardFrom(template, place, 'talk', turn, paramsFromLine(line, speaker));
  return {
    places: places.map((p) => (p.id === place.id ? { ...p, questCards: [...cards, card] } : p)),
    card,
  };
}
