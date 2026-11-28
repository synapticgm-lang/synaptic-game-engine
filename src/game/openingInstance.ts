/**
 * Seed-stable opening names and places. Hook cards describe roles and pressure;
 * this module mints a fresh, locked instance for the save so two games never
 * open on the same catalog proper names.
 */
import type {
  GameState,
  NpcMemory,
  OpeningCastMember,
  OpeningInstance,
  OpeningOfferChip,
} from './types';
import { hashSeed, keyedRng, type Rng } from './seededRng';
import { genderForPersonName, NAME_HONORIFIC, nameWords, pickPersonName, type PersonGender } from './personNames';
import { isCommonOpeningLexeme } from './openingWriterNotes';
import { campaignCanonicalHubNames, campaignHubLabels, hubCanonicalNameForLocation, isCampaignHubToken } from './outdoorHubs';
import { applyPresenceFacts } from './presentAuthority';
import { isCatalogCastBlockedHere } from './openingCatalogGuard';
import { compileOpeningOffer } from './openingEstablishment';

/** A hook snapshot the instance mint can read without importing the hook-deck tree. */
export interface OpeningHookSnapshot {
  location?: string;
  text?: string;
  page1?: string;
  fallback?: string;
  whoHere?: string;
  openingOffer?: string;
  pressingNeed?: string;
  howYouGotHere?: string;
  summonIntent?: string;
  whoYouAre?: string;
  beats?: string[];
  writerNotes?: string;
  faction?: string;
  /** Catalog NPC names already resolved from the hook's castNpcIds. */
  catalogNpcNames?: string[];
  castNpcIds?: string[];
}

const HONORIFIC = NAME_HONORIFIC;

const PLACE_SUFFIX = new Set([
  'trail', 'road', 'inn', 'ford', 'gate', 'keep', 'hall', 'ward', 'quay', 'mill', 'well', 'bridge',
  'pass', 'crossing', 'camp', 'market', 'square', 'cathedral', 'temple', 'shrine', 'circle', 'court',
  'hold', 'manor', 'estate', 'tower', 'docks', 'harbor', 'harbour', 'woods', 'forest', 'marsh', 'moor',
  'heath', 'hollow', 'wake', 'reach', 'vale', 'spire', 'port', 'station', 'waystation', 'block', 'row', 'lane',
  'street', 'avenue', 'plaza', 'lab', 'facility', 'ship', 'deck', 'yard', 'green', 'close', 'rise',
  'fell', 'ridge', 'cliff', 'point', 'head', 'bay', 'sound', 'creek', 'brook', 'river', 'cross',
  'chapel', 'abbey', 'priory', 'cloister', 'undercroft', 'cellar', 'loft', 'pan', 'works', 'plant',
  'complex', 'outpost', 'depot', 'wharf', 'pier', 'jetty', 'ferry', 'landing',
]);

const FACTION_WORDS = new Set([
  'crown', 'court', 'pact', 'cult', 'company', 'guild', 'house', 'order', 'legion', 'watch', 'guard',
  'regiment', 'circle', 'choir', 'chapter', 'syndicate', 'cartel', 'crew', 'band', 'clan', 'tribe',
  'host', 'fleet', 'navy', 'army', 'church', 'temple', 'college', 'school', 'office', 'bureau',
  'ministry', 'council', 'senate', 'assembly', 'covenant', 'compact', 'league', 'alliance',
]);

const TITLE_STOP = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'from', 'with', 'by', 'as',
  'you', 'your', 'yours', 'yourself', 'heat', 'light', 'system', 'panel', 'nobody', 'nothing',
  'something', 'someone', 'anyone', 'everyone', 'both', 'offers', 'offer', 'here', 'this', 'that',
  'these', 'those', 'who', 'what', 'why', 'how', 'when', 'where', 'already', 'mid', 'pursuit',
  'lying', 'standing', 'kneeling', 'waking', 'alone', 'just', 'still', 'blue', 'hangs', 'sit',
  'sits', 'sits', 'raised', 'drawn', 'put', 'blade', 'hand', 'pack', 'gear', 'never', 'put',
]);

const PLACE_STEMS = [
  'Brack', 'Hollin', 'Sallow', 'Dunmore', 'Fenwick', 'Marl', 'Cotter', 'Rudd', 'Tew', 'Aske',
  'Wyle', 'Thatch', 'Merrow', 'Coyne', 'Idra', 'Lisle', 'Cutha', 'Hask', 'Barrow', 'Crane',
  'Pike', 'Ness', 'Oatley', 'Redd', 'Calder', 'Morrow', 'Halden', 'Birch', 'Rowan', 'Ashen',
  'Keld', 'Thorpe', 'Wain', 'Mabb', 'Ortle', 'Stane', 'Voss', 'Yarrow', 'Beck',
  'Alden', 'Bramley', 'Caer', 'Durn', 'Esk', 'Flint', 'Goss', 'Harth', 'Ilme', 'Jorren',
  'Kemp', 'Larn', 'Moss', 'Nairn', 'Ockley', 'Pratt', 'Quen', 'Rill', 'Selk', 'Torr',
  'Ulm', 'Verra', 'Wex', 'Yale', 'Zost', 'Brindle', 'Callow', 'Dapple', 'Elwick', 'Farrow',
  'Gild', 'Hewes', 'Ingo', 'Jarrow', 'Loden', 'Mux', 'Noll', 'Orwick', 'Pendreth', 'Reston',
  'Shand', 'Tulley', 'Upton', 'Varley', 'Welby', 'Yarn', 'Amberly', 'Beltane', 'Corven', 'Drewe',
];

const PLACE_MIDS = [
  'fen', 'mere', 'wick', 'stead', 'hurst', 'leigh', 'croft', 'moor', 'ridge',
  'haven', 'field', 'bury', 'ham', 'shaw', 'holt', 'vale', 'kirk', 'dell',
];

const MODERN_GIVEN = [
  'Priya', 'Jonas', 'Mara', 'Theo', 'Nina', 'Luc', 'Asha', 'Kenan', 'Ivy', 'Rafi', 'Sofi', 'Marc',
];
const MODERN_FAMILY = [
  'Adler', 'Vance', 'Rahim', 'Kessler', 'Mori', 'Okoye', 'Silva', 'Berg', 'Cho', 'Perez', 'Nolan', 'Ibarra',
];
const SCIFI_GIVEN = [
  'Rin', 'Kade', 'Nyx', 'Vela', 'Jori', 'Tamsin', 'Sable', 'Ilex', 'Torin', 'Yara', 'Pax', 'Nim',
];
const SCIFI_FAMILY = [
  'Voss', 'Keel', 'Rook', 'Solan', 'Phes', 'Darra', 'Quillan', 'Hex', 'Orry', 'Tal', 'Mire', 'Kett',
];

/** Catalog stems we never mint and always retire when they appear on a hook. */
export const CATALOG_NAME_BLOCKLIST = [
  'Oren', 'Kessa', 'Cinder', 'Cinderwake', 'Pellane', 'Valespire', 'Orel', 'Vane', 'Greyhollow',
  'Thrynn', 'Madden', 'Lene', 'Sera', 'Quill', 'Aric', 'Bram', 'Cael', 'Dara', 'Eamon', 'Fael',
];

const TITLE_NAME =
  /\b((?:(?:Brother|Sister|Father|Mother|Sir|Lady|Lord|Captain|Sergeant|High|Chanter|Priest|Priestess|Tracker|Scout|Novice|Elder|Master|Mistress|Doctor|Dame|Baron|Baroness|Warden|Keeper|Auditor|Advocate|Inquisitor|Marshal|Commander|Lieutenant|Corporal|Ensign|Admiral|General|Acolyte|Adept|Seer|Oracle|Abbot|Abbess|Prior|Prioress|Deacon|Reverend|Squire|Knight|Ranger|Hunter)[ \t]+){0,2}(?:[A-Z][a-z]+(?:-[A-Z][a-z]+)?[ \t]+){0,2}[A-Z][a-z]+(?:-[A-Z][a-z]+)?)\b/g;

export function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function givenNameOf(name: string): string {
  const raw = (name ?? '').replace(HONORIFIC, '').trim();
  const parts = raw.split(/\s+/).filter(Boolean);
  return parts[0] || raw || name;
}

function hay(hook: OpeningHookSnapshot): string {
  return [
    hook.location,
    hook.whoHere,
    hook.openingOffer,
    hook.pressingNeed,
    hook.howYouGotHere,
    hook.whoYouAre,
    hook.text,
    hook.page1,
    hook.fallback,
    hook.writerNotes,
    ...(hook.beats ?? []),
  ]
    .filter(Boolean)
    .join('\n');
}


/** People named in a "Who is here" slot, split on list punctuation — never across lines. */
export function peopleFromWhoHere(whoHere: string | undefined): string[] {
  if (!whoHere) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const part of whoHere.split(/\s*(?:,|;|\/|\band\b|\bplus\b|\bwith\b)\s*/i)) {
    const chunk = part.replace(/\s+/g, ' ').trim().replace(/[.,;:]+$/, '');
    if (!chunk || /^(?:no one|nobody|none|you are alone|alone)\b/i.test(chunk)) continue;
    const m = chunk.match(
      /(?:(?:Brother|Sister|Father|Mother|Sir|Lady|Lord|Captain|Sergeant|High Chanter|Priest|Priestess|Tracker|Scout|Novice|Elder|Master|Mistress|Doctor|Dame|Warden|Keeper)\s+)?[A-Z][a-z]+(?:-[A-Z][a-z]+)?(?:\s+[A-Z][a-z]+(?:-[A-Z][a-z]+)?){0,2}/
    );
    const n = (m?.[0] ?? '').trim();
    if (!n || n.length < 3) continue;
    if (!isLikelyProperName(n) || isPlaceName(n, 'who')) continue;
    const first = n.split(/\s+/)[0] ?? '';
    if (TITLE_STOP.has(first.toLowerCase())) continue;
    // Honorific alone is not a person.
    if (/^(?:Brother|Sister|Father|Mother|Sir|Lady|Lord|Captain|Tracker|Scout|Novice|Elder)$/i.test(n)) continue;
    const key = n.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }
  return out;
}

const IMPLIED_ROLE_NOUN =
  'enforcers?|thieves|thief|scouts?|innkeeps?|innkeepers?|muscle|cutters?|lockpicks?|priests?|priestesses?|captains?|bouncers?|trackers?|sisters?|brothers?|fathers?|merchants?';

/** A role-only who-here ("an enforcer", "the scout") with no proper name. */
export function impliedRoleFromWhoHere(whoHere: string | undefined): string | undefined {
  if (!whoHere) return undefined;
  if (peopleFromWhoHere(whoHere).length) return undefined;
  const t = whoHere.replace(/\s+/g, ' ').trim();
  if (!t || /^(?:no one|nobody|none|you are alone|alone)\b/i.test(t)) return undefined;
  const groupOnly = /^(?:the\s+)?(?:crew|faces|people|crowd|company|watchmen|hirelings|others)\b/i.test(t);
  const hasRole = new RegExp(`\\b(?:${IMPLIED_ROLE_NOUN})\\b`, 'i').test(t);
  if (groupOnly && !hasRole) return undefined;
  let role = t
    .replace(/^(?:a|an|the)\s+/i, '')
    .replace(/[,.;].*$/, '')
    .replace(/\s+is waiting\b.*$/i, '')
    .replace(/\s+beside you\b.*$/i, '')
    .replace(/\s+on the porch\b.*$/i, '')
    .trim();
  // Long faction sentences ("Ash Court priests who will swear…") still yield a role.
  if (role.length > 48) {
    const sliced = role.match(new RegExp(`^((?:[A-Z][\\w-]+(?:\\s+[A-Z][\\w-]+){0,2}\\s+)?(?:${IMPLIED_ROLE_NOUN}))\\b`, 'i'));
    if (sliced?.[1]) role = sliced[1].trim();
    else {
      const noun = role.match(new RegExp(`\\b(?:${IMPLIED_ROLE_NOUN})\\b`, 'i'));
      if (noun) role = noun[0];
    }
  }
  if (role.length < 3 || role.length > 48) return undefined;
  return singularizeGroupRole(role);
}

/** How many people to mint for a role-only occupancy. Capped at 2. */
export function impliedOccupancyCount(whoHere: string | undefined): number {
  const t = (whoHere ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return 0;
  const numbered = t.match(/^(?:the\s+)?(two|three|four|five|six|seven|eight|nine|ten|a pair of|a couple of|several|some|both|\d+)\b/i);
  if (numbered) return 2;
  if (/^(?:a|an|one)\s+/i.test(t)) return 1;
  if (new RegExp(`\\b(?:${IMPLIED_ROLE_NOUN})\\b`, 'i').test(t) && /s\b/i.test(t.match(new RegExp(`\\b(?:${IMPLIED_ROLE_NOUN})\\b`, 'i'))?.[0] ?? '')) {
    return 2;
  }
  return 1;
}

/** "two militia" / "a pair of scouts" is a group, not one person's role. */
function singularizeGroupRole(role: string): string {
  const t = (role ?? '').replace(/\s+/g, ' ').trim();
  const numbered = t.match(/^(?:two|three|four|five|six|seven|eight|nine|ten|\d+|a pair of|a couple of|several|some|both)\s+(.+)$/i);
  const core = (numbered?.[1] ?? t).replace(/^(?:the|a|an)\s+/i, '').trim();
  if (!core) return t;
  if (/militia$/i.test(core)) return 'militia';
  if (/men$/i.test(core) && !/women$/i.test(core)) return core.replace(/men$/i, 'man');
  if (/women$/i.test(core)) return core.replace(/women$/i, 'woman');
  if (/ies$/i.test(core)) return core.replace(/ies$/i, 'y');
  if (/(?:ses|shes|ches|xes|zes)$/i.test(core)) return core.replace(/es$/i, '');
  if (/s$/i.test(core) && !/ss$/i.test(core)) return core.replace(/s$/i, '');
  return core;
}

export function whoHereImpliesPresent(whoHere: string | undefined): boolean {
  const t = (whoHere ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return false;
  if (/^(?:no one|nobody|none|you are alone|alone)\b/i.test(t)) return false;
  return true;
}

export function isCatalogStem(word: string): boolean {
  const k = (word ?? '').trim().toLowerCase();
  return !!k && CATALOG_NAME_BLOCKLIST.some((b) => b.toLowerCase() === k);
}

/**
 * A sound proper-noun test: Title-Case alone is not enough.
 * Rejects sentence-initial verbs and common nouns (Walk, Stay, Salt, Glass, Earth, They).
 * Accepts multi-word places ("Salt Road waystation"), honorific + name, and distinctive stems.
 */
/** Hook/card field labels — not names, even when Title-Cased in compiled text. */
export const HOOK_FIELD_LABELS = new Set([
  'talk', 'location', 'armed', 'twenty', 'dawn', 'abort', 'first', 'move', 'who', 'what',
  'pressing', 'offer', 'cost', 'summon', 'intent', 'faction', 'beats', 'page', 'how',
  'where', 'why', 'when',
]);

export function isLikelyProperName(name: string): boolean {
  const t = (name ?? '').trim().replace(/[.,;:]+$/, '');
  if (t.length < 3) return false;
  const parts = t.split(/\s+/).filter(Boolean);
  if (!parts.length) return false;
  const first = parts[0]!;
  const last = parts[parts.length - 1]!;
  if (TITLE_STOP.has(first.toLowerCase())) return false;
  if (parts.length === 1 && HOOK_FIELD_LABELS.has(first.toLowerCase())) return false;
  if (/^(?:Brother|Sister|Father|Mother|Sir|Lady|Lord|Captain|Tracker|Scout|Novice|Elder|High|Chanter)$/i.test(t)) {
    return false;
  }
  if (parts.length >= 2 && PLACE_SUFFIX.has(last.toLowerCase())) {
    return true;
  }
  if (parts.length >= 2) {
    const distinctive = parts.some((p) => !isCommonOpeningLexeme(p) || isCatalogStem(p));
    return distinctive && parts.every((p) => !TITLE_STOP.has(p.toLowerCase()));
  }
  if (PLACE_SUFFIX.has(first.toLowerCase()) || FACTION_WORDS.has(first.toLowerCase())) return false;
  if (isCommonOpeningLexeme(first) && !isCatalogStem(first)) return false;
  return /^(?:[A-Z][a-z]+(?:-[A-Z][a-z]+)?)$/.test(first);
}

export function extractTitleNames(text: string | undefined): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  if (!text) return out;
  const re = new RegExp(TITLE_NAME.source, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    let n = (m[1] ?? '').trim();
    if (!n) continue;
    const after = text.slice(m.index + m[0].length);
    const suf = after.match(/^\s+([a-z][a-z-]+)/);
    if (suf && PLACE_SUFFIX.has(suf[1]!.toLowerCase())) {
      n = `${n} ${suf[1]}`;
    }
    if (!isLikelyProperName(n)) continue;
    if (PLACE_SUFFIX.has(n.toLowerCase())) continue;
    if (n.length < 3) continue;
    const key = n.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }
  return out;
}

function lastWord(name: string): string {
  const bits = name.trim().split(/\s+/);
  return (bits[bits.length - 1] ?? '').toLowerCase();
}

function isPlaceName(name: string, field: 'location' | 'who' | 'other'): boolean {
  if (PLACE_SUFFIX.has(lastWord(name))) return true;
  if (field === 'location' && !HONORIFIC.test(name)) {
    // A single Title-Case token in a location line is usually a settlement.
    if (!/\s/.test(name) && name.length >= 5) return true;
    if (/\b(?:trail|road|inn|ford|gate|keep|hall|town|city|village|camp)\b/i.test(name)) return true;
  }
  return false;
}

function isFactionName(name: string, context: string): boolean {
  if (FACTION_WORDS.has(lastWord(name))) return true;
  const re = new RegExp(`\\b${escapeRe(name)}(?:'s)?\\s+(?:scouts?|soldiers?|men|women|guard|host|court|pact|cult|company|guild|house|order|legion|watch)\\b`, 'i');
  if (re.test(context)) return true;
  const pos = new RegExp(`\\b(?:the\\s+)?${escapeRe(name)}\\s+(?:crown|court|pact|realm|throne)\\b`, 'i');
  return pos.test(context);
}

function classifyName(
  name: string,
  hook: OpeningHookSnapshot
): 'person' | 'place' | 'faction' {
  const blob = hay(hook);
  if (isFactionName(name, blob)) return 'faction';
  if (isPlaceName(name, 'other')) return 'place';
  const inLoc = hook.location && new RegExp(`\\b${escapeRe(name)}\\b`).test(hook.location);
  if (inLoc && isPlaceName(name, 'location')) return 'place';
  if (inLoc && !hook.whoHere?.includes(name) && name.length >= 5 && !HONORIFIC.test(name) && !/\s/.test(name)) {
    return 'place';
  }
  if (hook.whoHere && new RegExp(`\\b${escapeRe(name)}\\b`).test(hook.whoHere)) return 'person';
  if (inLoc) return 'place';
  return 'person';
}

function inferPlaceKind(hook: OpeningHookSnapshot): string {
  const loc = (hook.location ?? '').trim();
  if (!loc) return 'a named place';
  const lower = loc.toLowerCase();
  for (const s of PLACE_SUFFIX) {
    if (new RegExp(`\\b${s}\\b`, 'i').test(lower)) {
      const adj = lower.match(/\b(ash|scorched|salt|fog|rain|night|dawn|dusk|stone|rural|coastal|frozen|burnt|ruined|crowded|quiet)\b/)?.[1];
      return adj ? `a ${adj} ${s}` : `a ${s}`;
    }
  }
  return loc.replace(/\b[A-Z][a-zA-Z'’-]{2,}\b/g, '').replace(/\s+/g, ' ').trim() || 'the place you stand';
}

function inferPlaceSuffix(kind: string): string {
  const k = kind.toLowerCase();
  for (const s of ['trail', 'inn', 'ford', 'gate', 'keep', 'hall', 'ward', 'quay', 'mill', 'well', 'bridge', 'pass', 'camp', 'market', 'square', 'cathedral', 'temple', 'shrine', 'circle', 'court', 'hollow', 'road', 'lane', 'wharf', 'ferry', 'outpost', 'station', 'yard']) {
    if (k.includes(s)) return s[0]!.toUpperCase() + s.slice(1);
  }
  return 'Hollow';
}

function pickUnused(rng: Rng, bank: readonly string[], taken: Set<string>): string {
  const shuffled = [...bank].sort(() => rng() - 0.5);
  for (const w of shuffled) {
    if (!taken.has(w.toLowerCase())) {
      taken.add(w.toLowerCase());
      return w;
    }
  }
  const fallback = `${bank[Math.floor(rng() * bank.length)] ?? 'Hollin'}${Math.floor(rng() * 80) + 2}`;
  taken.add(fallback.toLowerCase());
  return fallback;
}

function pickModernOrScifiName(rng: Rng, taken: Set<string>, genre: 'modern' | 'scifi'): string {
  const givenBank = genre === 'scifi' ? SCIFI_GIVEN : MODERN_GIVEN;
  const famBank = genre === 'scifi' ? SCIFI_FAMILY : MODERN_FAMILY;
  for (let i = 0; i < 12; i++) {
    const given = givenBank[Math.floor(rng() * givenBank.length)]!;
    const family = famBank[Math.floor(rng() * famBank.length)]!;
    if (taken.has(given.toLowerCase()) || taken.has(family.toLowerCase())) continue;
    taken.add(given.toLowerCase());
    taken.add(family.toLowerCase());
    return `${given} ${family}`;
  }
  return pickPersonName(rng, taken) || pickUnused(rng, givenBank, taken);
}

function inferGenre(hook: OpeningHookSnapshot, bibleId?: string, engineMode?: string): 'fantasy' | 'modern' | 'scifi' {
  const id = (bibleId ?? '').toLowerCase();
  if (id === 'system-integration') return 'modern';
  if (/umbra|erebus|null-parameter|protocol/.test(id) && /sci|space|cyber|station/.test(id + hay(hook).toLowerCase())) {
    return 'scifi';
  }
  // Fantasy isekai hooks often mention Earth — that is not a modern-earth campaign.
  if (/summoned-pact|cursed-keep|shattered-coast|thornferry|greyhollow|hero-awakening/.test(id)) {
    return 'fantasy';
  }
  const blob = `${id} ${hay(hook)}`.toLowerCase();
  if (/\b(airlock|android|orbit|starship|colony|neural|comlink)\b/.test(blob)) return 'scifi';
  if (/\b(subway|taxi|apartment|denim|office tower|motel)\b/.test(blob)) return 'modern';
  void engineMode;
  return 'fantasy';
}

function mintPerson(
  rng: Rng,
  taken: Set<string>,
  genre: 'fantasy' | 'modern' | 'scifi'
): { name: string; gender: PersonGender } {
  const name = genre === 'fantasy'
    ? (pickPersonName(rng, taken) || pickModernOrScifiName(rng, taken, 'modern'))
    : pickModernOrScifiName(rng, taken, genre);
  return { name, gender: genderForPersonName(name) };
}

function joinStemMid(stem: string, mid: string): string {
  if (stem.toLowerCase().endsWith(mid[0]!)) return stem + mid.slice(1);
  return stem + mid;
}

function mintPlaceName(rng: Rng, kind: string, taken: Set<string>, salt = ''): string {
  const suffix = inferPlaceSuffix(kind);
  const space = PLACE_STEMS.length * PLACE_MIDS.length;
  const h = hashSeed(`${salt}|${kind}|place`);
  const start = h % space;
  const step = (h % (space - 1)) + 1;
  for (let i = 0; i < space; i++) {
    const slot = (start + i * step) % space;
    const stem = PLACE_STEMS[Math.floor(slot / PLACE_MIDS.length)]!;
    const mid = PLACE_MIDS[slot % PLACE_MIDS.length]!;
    const join = joinStemMid(stem, mid);
    const name = suffix.toLowerCase() === 'wake' ? join : `${join} ${suffix}`;
    if (taken.has(join.toLowerCase()) || taken.has(name.toLowerCase())) continue;
    taken.add(join.toLowerCase());
    taken.add(name.toLowerCase());
    return name;
  }
  const stem = pickUnused(rng, PLACE_STEMS, taken);
  if (suffix.toLowerCase() === 'wake') return `${stem}croft`;
  return `${stem} ${suffix}`;
}

function roleForPerson(name: string, hook: OpeningHookSnapshot): string {
  const who = hook.whoHere ?? '';
  const idx = who.indexOf(name);
  if (idx >= 0) {
    const before = who.slice(Math.max(0, idx - 40), idx).replace(/.*(?:,|and)\s+/i, '').trim();
    const after = who.slice(idx + name.length).replace(/\s*(?:,|and)\s+.*$/i, '').trim();
    const pre = before.replace(/[.,;:]+$/g, '').trim();
    const bits = [pre && !new RegExp(`\\b${escapeRe(name)}\\b`, 'i').test(pre) ? pre : '', after.replace(/^[.,;:]+/, '').trim()]
      .filter((s) => s && s.length < 48 && !/^who is here/i.test(s));
    if (bits.length) return bits.join(' ').replace(/\s+/g, ' ').trim();
  }
  const honor = name.match(HONORIFIC)?.[0]?.trim();
  if (honor) return roleFromHonorific(honor);
  return 'present in the scene';
}

const FAMILY_HONORIFICS = /^(?:Father|Mother|Brother|Sister)$/i;

/** Independently minted people never keep Father/Mother/Brother/Sister as their role. */
function roleFromHonorific(honor: string): string {
  if (FAMILY_HONORIFICS.test(honor)) return 'priest';
  return honor.toLowerCase();
}

function sanitizeMintedRole(role: string): string {
  const t = (role ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return 'present in the scene';
  if (FAMILY_HONORIFICS.test(t)) return 'priest';
  return t;
}

function shortItem(item: string): string {
  return item.replace(/^(?:a|an|the)\s+/i, '').replace(/\s+/g, ' ').trim();
}

function splitOfferItems(offer: string): string[] {
  const raw = (offer ?? '').replace(/\s+/g, ' ').trim();
  if (!raw) return [];
  const first = raw.split(/(?<=[.!?])\s+/).find((s) => !/^(?:no one|nobody|none|nothing|no|refuse|decline)\b/i.test(s)) ?? raw;
  const nouns: string[] = [];
  const seen = new Set<string>();
  // Prefer concrete nouns: waterskin, scarf, brand-iron, bread, blanket, work, pact.
  const hits = first.match(
    /\b(?:waterskin|water|scarf|brand-iron|brandiron|brand iron|bread|blanket|cloak|coat|kit|pact|oath|work|job|contract|hunt|iron|skin)\b/gi
  ) ?? [];
  for (const h of hits) {
    const n = shortItem(h);
    const k = n.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    nouns.push(n);
  }
  if (nouns.length) return nouns;
  return first
    .split(/\s*(?:,|\/|\bor\b|\band\b)\s*/i)
    .map((p) => p.replace(/^(?:a|an|the|some|your|their|his|her)\s+/i, '').replace(/[.,;:]+$/g, '').trim())
    .filter(
      (p) =>
        p
        && p.split(/\s+/).length <= 3
        && !/\b(?:whatever|anything|nothing|junk|neither|both|offers?|not your gear|will|share|walk with|take)\b/i.test(p)
        && !/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?$/.test(p) // drop bare person names as "items"
    );
}


function attachItemsToCast(items: string[], cast: OpeningCastMember[], offer: string): Array<{ item: string; person?: OpeningCastMember }> {
  const out: Array<{ item: string; person?: OpeningCastMember }> = [];
  for (const item of items) {
    const owner = cast.find((c) => {
      const full = new RegExp(`\\b${escapeRe(c.name)}(?:'s)?\\b`, 'i');
      const given = new RegExp(`\\b${escapeRe(givenNameOf(c.name))}(?:'s)?\\b`, 'i');
      const window = offer.match(new RegExp(`.{0,40}${escapeRe(item)}.{0,40}`, 'i'))?.[0] ?? offer;
      return full.test(window) || given.test(window);
    });
    out.push({ item, person: owner ?? (cast.length === 1 ? cast[0] : undefined) });
  }
  // If items didn't attach and we have two people + two item clusters, zip them.
  if (out.every((o) => !o.person) && cast.length >= 2 && items.length >= 2) {
    return items.map((item, i) => ({ item, person: cast[Math.min(i, cast.length - 1)] }));
  }
  if (out.some((o) => !o.person) && cast.length) {
    let i = 0;
    return out.map((o) => (o.person ? o : { ...o, person: cast[i++ % cast.length] }));
  }
  return out;
}

/** An offer "item" that is really what the player is asked to do ("Sign the blank", "Sit the audit"). */
const ACTION_VERB = /^(?:sign|sit|kneel|read|swear|take|join|walk|work|serve|agree|enlist|copy|stay|pick|play|wear|grab|keep|cooperate|help|come|follow|hold|guard|carry|fight|stand|name|give|bow|pray|confess|vouch|testify|answer|accept)\b/i;
function isActionClause(item: string): boolean {
  const t = shortItem(item);
  return ACTION_VERB.test(t) || /^[A-Z][a-z]+\s+(?:the|a|an|your|their|his|her)\b/.test(t);
}
/**
 * The offer's own condition as the accept action: "Sit the audit and they will issue …" → "Sit the audit
 * for Dunn"; "Keep their secret and …" → "Keep Brannoc's secret"; "Enlist and …" → "Enlist with Hale".
 * Null when the offer does not open with a short imperative.
 */
function offerConditionLabel(offer: string, cast: OpeningCastMember[], giver?: OpeningCastMember): string | null {
  const first = (offer ?? '').replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+/)[0] ?? '';
  const m = first.match(/^(.+?)\s+and\s+(?:they|he|she|we|that side|the \w+)\s+(?:will|may|offer|issue|share)\b/i);
  let cond = (m?.[1] ?? '').split(/\s*[—–(,]\s*/)[0]!.trim();
  if (!cond || !ACTION_VERB.test(cond) && !/^[A-Z][a-z]+\b/.test(cond)) return null;
  if (/^(?:the|a|an|if|when|you|they|he|she|we|i|it|no|nobody|one|first)\b/i.test(cond)) return null;
  const words = cond.split(/\s+/);
  if (words.length > 6) return null;
  const named = cast.some((c) => new RegExp(`\\b${escapeRe(givenNameOf(c.name))}\\b`, 'i').test(cond));
  const who = giver ? givenNameOf(giver.name) : '';
  if (who && !named && /\b(?:their|his|her)\b/i.test(cond)) {
    cond = cond.replace(/\b(?:their|his|her)\b/i, `${who}'s`);
  } else if (who && !named && words.length === 1) {
    cond = `${cond} with ${who}`;
  } else if (who && !named && words.length <= 4 && !/\b(?:they|them|us)\b/i.test(cond)) {
    cond = `${cond} for ${who}`;
  }
  return cond.charAt(0).toUpperCase() + cond.slice(1);
}

function concreteAcceptLabel(item: string, person?: OpeningCastMember): string {
  const noun = shortItem(item).replace(/^(?:offer of\s+)?/i, '');
  if (/^walk with\b/i.test(noun) || /^take\b/i.test(noun) || /^hear \b/i.test(noun)) return noun;
  const who = person ? givenNameOf(person.name) : '';
  if (who && /\b(water|waterskin|skin|scarf|bread|food|drink|cloak|blanket|coat)\b/i.test(noun)) {
    return `Walk with ${who} for ${noun}`;
  }
  if (who && /\b(hunt|iron|brand|brand-iron|contract|job|work|rite|pact|brandiron)\b/i.test(noun)) {
    return `Take ${who}'s ${noun}`;
  }
  if (who && noun.split(/\s+/).length <= 3) return `Take ${who}'s offer of ${noun}`;
  if (who) return `Hear ${who} out`;
  if (noun.split(/\s+/).length <= 3) return `Take the ${noun}`;
  return who ? `Hear ${who} out` : 'Step forward';
}

export function applyReplacements(text: string, map: Array<[string, string]>): string {
  let out = text ?? '';
  const sorted = [...map].sort((a, b) => b[0].length - a[0].length);
  for (const [from, to] of sorted) {
    if (!from) continue;
    // Never remap a lone common lexeme (Walk, Salt, They) even if it slipped into the map.
    if (from.split(/\s+/).length === 1 && isCommonOpeningLexeme(from) && !isCatalogStem(from)) continue;
    out = out.replace(new RegExp(`\\b${escapeRe(from)}\\b`, 'gi'), to);
  }
  return out;
}

function textMentionsPerson(text: string, name: string): boolean {
  const given = givenNameOf(name);
  if (new RegExp(`\\b${escapeRe(name)}\\b`, 'i').test(text)) return true;
  return given.length >= 2 && new RegExp(`\\b${escapeRe(given)}\\b`, 'i').test(text);
}

function rewritePronounsForGender(sentence: string, gender: PersonGender): string {
  if (gender === 'female') {
    return sentence
      .replace(/\bhimself\b/g, 'herself').replace(/\bHimself\b/g, 'Herself')
      .replace(/\bhe\b/g, 'she').replace(/\bHe\b/g, 'She')
      .replace(/\bhim\b/g, 'her').replace(/\bHim\b/g, 'Her')
      .replace(/\bhis\b/g, 'her').replace(/\bHis\b/g, 'Her');
  }
  return sentence
    .replace(/\bherself\b/g, 'himself').replace(/\bHerself\b/g, 'Himself')
    .replace(/\bshe\b/g, 'he').replace(/\bShe\b/g, 'He')
    .replace(/\bhers\b/g, 'his').replace(/\bHers\b/g, 'His')
    .replace(/\bher\b(?=\s+[A-Za-z])/g, 'his').replace(/\bHer\b(?=\s+[A-Za-z])/g, 'His')
    .replace(/\bher\b/g, 'him').replace(/\bHer\b/g, 'Him');
}

/**
 * After a catalog name is swapped for a minted person, fix leftover pronouns in
 * hook / offer / refuse / pressing text so they match the minted gender.
 * "Walk with Wenna Merrow and he will share…" becomes "…and she will share…".
 */
export function alignHookPronouns(text: string, cast: OpeningCastMember[]): string {
  if (!text || !cast.length) return text;
  const fixBound = (sentence: string): string => {
    let s = sentence;
    for (const member of cast) {
      if (!member.gender) continue;
      const subj = member.gender === 'female' ? 'she' : 'he';
      const given = givenNameOf(member.name);
      const namePat = `${escapeRe(member.name)}|${escapeRe(given)}`;
      s = s.replace(new RegExp(`\\b(${namePat})(\\s+and\\s+)(?:he|she)\\b`, 'gi'), (_, n, mid) => `${n}${mid}${subj}`);
    }
    return s;
  };
  const sentences = text.split(/(?<=[.!?])(?:\s+|$)/);
  let out = sentences.map((sentence) => {
    if (!sentence) return sentence;
    const mentioned = cast.filter((c) => c.gender && textMentionsPerson(sentence, c.name));
    const bound = fixBound(sentence);
    if (mentioned.length === 1) return rewritePronounsForGender(bound, mentioned[0]!.gender!);
    return bound;
  }).join(' ');
  // A single-person opening may say "if you refuse him" in a sentence that never names them.
  if (cast.length === 1 && cast[0]?.gender) {
    const obj = cast[0].gender === 'female' ? 'her' : 'him';
    out = out.replace(/\brefuse\s+(?:him|her)\b/gi, `refuse ${obj}`);
  }
  return out;
}

function rewriteBlob(blob: string | undefined, map: Array<[string, string]>): string | undefined {
  if (!blob) return blob;
  return applyReplacements(blob, map);
}

export function hookKey(state: { seed?: string; campaignBibleId?: string | null }): string {
  return `${state.seed ?? '0'}|${state.campaignBibleId ?? ''}|opening-instance`;
}

/**
 * Mint a locked opening instance from the seed and a hook snapshot (roles, not a closed name list).
 */

/** A map hub this opening may sit near — never the hook's own catalog place, nor a page-1 ban. */
function pickNearbyLandmark(
  bibleId: string | undefined,
  catalogPlace: string | undefined,
  placeName: string,
  retired: string[],
  seedKey: string
): string | undefined {
  const banned = new Set(
    [catalogPlace, placeName, ...(retired ?? []), ...(catalogPlace ? catalogPlace.split(/\s+/) : [])]
      .map((s) => (s ?? '').trim().toLowerCase())
      .filter(Boolean)
  );
  const isEligible = (lab: string) => {
    const k = lab.toLowerCase();
    if (banned.has(k)) return false;
    if ([...banned].some((b) => b.length >= 5 && (k.includes(b) || b.includes(k)))) return false;
    return true;
  };
  const labels = campaignCanonicalHubNames(bibleId).filter(isEligible);
  if (!labels.length) return undefined;
  const idx = hashSeed(`${seedKey}|nearby-landmark`) % labels.length;
  return labels[idx];
}

function structuredBanHay(hook: OpeningHookSnapshot): string {
  return [
    hook.whoYouAre,
    hook.whoHere,
    hook.pressingNeed,
    hook.summonIntent,
    hook.openingOffer,
  ]
    .filter(Boolean)
    .join('\n');
}

/** Catalog factions that must not open page 1 when they appear in structured hook text. */
const CATALOG_FACTION_NAMES = ['Pellane', 'Ash Court'];

/** Catalog given names / surnames for campaign cast (not place stems). */
const CATALOG_CAST_NAMES = [
  'Oren', 'Kessa', 'Orel', 'Vane', 'Thrynn', 'Madden', 'Lene', 'Sera', 'Quill',
  'Aric', 'Bram', 'Cael', 'Dara', 'Eamon', 'Fael',
];

function groupLabelFromWhoHere(whoHere: string | undefined): string | undefined {
  if (!whoHere || peopleFromWhoHere(whoHere).length) return undefined;
  const t = whoHere.replace(/\s+/g, ' ').trim();
  if (!t || /^(?:no one|nobody|none|you are alone|alone)\b/i.test(t)) return undefined;
  const m = t.match(/^(?:the\s+)?(crew|faces|people|crowd|company|watchmen|hirelings|others|hands|outfit|gang)\b/i);
  if (!m?.[1]) return undefined;
  return `the ${m[1]!.toLowerCase()}`;
}

export function mintOpeningInstance(
  hook: OpeningHookSnapshot,
  seedKey: string,
  opts?: { bibleId?: string; engineMode?: string }
): OpeningInstance {
  const rng = keyedRng(seedKey);
  const genre = inferGenre(hook, opts?.bibleId, opts?.engineMode);
  const taken = nameWords(CATALOG_NAME_BLOCKLIST);
  for (const lab of campaignHubLabels(opts?.bibleId)) {
    for (const w of lab.split(/\s+/)) {
      if (w.length >= 3 && !isCommonOpeningLexeme(w)) taken.add(w.toLowerCase());
    }
  }
  const retired: string[] = [];
  const isGenericToken = (n: string) => {
    const k = n.trim().toLowerCase();
    return !k || PLACE_SUFFIX.has(k) || FACTION_WORDS.has(k) || TITLE_STOP.has(k) || isCommonOpeningLexeme(k);
  };
  const retire = (n: string, flags?: { evenIfHub?: boolean }) => {
    const t = n.trim();
    if (!t || isGenericToken(t)) return;
    // Never retire a single common English word or field label on its own (Cinder, First, Talk).
    if (t.split(/\s+/).length === 1 && (isCommonOpeningLexeme(t) || HOOK_FIELD_LABELS.has(t.toLowerCase()))) return;
    // Hubs this opening actually replaced (its catalog place or faction) are banned on page 1
    // even though they stay on the map for later turns.
    if (!flags?.evenIfHub && isCampaignHubToken(t, opts?.bibleId)) return;
    if (!retired.some((x) => x.toLowerCase() === t.toLowerCase())) retired.push(t);
    for (const w of t.split(/\s+/)) {
      if (w.length >= 3 && !isGenericToken(w)) taken.add(w.toLowerCase());
    }
  };

  // Names come only from structured hook fields (who / castNpcIds / location / faction),
  // never from free sentences (pressing, page1, "First move is yours", compiled labels).
  const whoNames = [
    ...peopleFromWhoHere(hook.whoHere),
    ...(hook.catalogNpcNames ?? []).map((n) => n.trim()).filter(Boolean),
  ];
  const locNames = extractTitleNames(hook.location);
  // Structured faction field only — even a bare catalog name like Pellane is banned on page 1.
  const factionPool = extractTitleNames(hook.faction)
    .filter(
      (n) =>
        !isGenericToken(n)
        && !whoNames.some((w) => w.toLowerCase() === n.toLowerCase() || w.toLowerCase().includes(n.toLowerCase()))
        && !locNames.some((w) => w.toLowerCase() === n.toLowerCase() || w.toLowerCase().includes(n.toLowerCase()))
    );

  const replacements: Array<[string, string]> = [];
  const places = locNames.filter((n) => !isGenericToken(n));
  const factions: Array<{ from: string; kind: string }> = [];
  for (const n of factionPool) {
    factions.push({ from: n, kind: lastWord(n) });
  }
  const people = whoNames;

  // Always mint the opening place for this game. Never lock page 1 to a campaign hub
  // (Cinderwake Trail / Greyhollow Inn / Salt Road Waystation). The minted spot may
  // sit near a different hub, which stays on the map for later turns.
  const placeKind = inferPlaceKind(hook);
  const hubPlace = hubCanonicalNameForLocation(hook.location, opts?.bibleId);
  const catalogPlace = hubPlace || places.sort((a, b) => b.length - a.length)[0];
  const placeName = mintPlaceName(rng, placeKind, taken, seedKey);
  if (catalogPlace && catalogPlace.toLowerCase() !== placeName.toLowerCase()) {
    retire(catalogPlace, { evenIfHub: true });
    replacements.push([catalogPlace, placeName]);
    // Distinctive coined stem (Cinderwake) only — never a common English word (Cinder, Salt).
    const first = catalogPlace.split(/\s+/)[0] ?? '';
    if (
      first.length >= 8
      && !PLACE_SUFFIX.has(first.toLowerCase())
      && !isCommonOpeningLexeme(first)
      && first.toLowerCase() !== lastWord(placeName)
    ) {
      retire(first, { evenIfHub: true });
      replacements.push([first, placeName.split(/\s+/)[0] ?? placeName]);
    }
  }
  const nearbyLandmark = pickNearbyLandmark(opts?.bibleId, catalogPlace, placeName, retired, seedKey);

  let settlementName: string | undefined;
  const settlementHits = places.filter(
    (p) => p !== catalogPlace && !PLACE_SUFFIX.has(lastWord(p)) && !isCampaignHubToken(p, opts?.bibleId)
  );
  if (settlementHits[0]) {
    retire(settlementHits[0]);
    settlementName = pickUnused(rng, PLACE_STEMS, taken);
    replacements.push([settlementHits[0], settlementName]);
  }

  let factionName: string | undefined;
  let factionKind: string | undefined;
  if (factions[0]) {
    retire(factions[0].from, { evenIfHub: true });
    factionKind = factions[0].kind || 'company';
    const stem = pickUnused(rng, PLACE_STEMS, taken);
    factionName = /^(house|order|guild|company|court)$/i.test(factionKind) ? `${factionKind[0]!.toUpperCase()}${factionKind.slice(1)} ${stem}` : stem;
    replacements.push([factions[0].from, factionName]);
  }
  // The structured faction field is a catalog label even when it is not Title-Case
  // ("A Pact loadout crew and a debt-collector who arrived late"). Always retire it
  // and mint a name so later turns cannot treat the raw catalog phrase as a person.
  const factionRaw = (hook.faction ?? '').replace(/\s+/g, ' ').trim();
  if (factionRaw) {
    retire(factionRaw, { evenIfHub: true });
    const leadPhrase = (factionRaw.split(/\s+and\s+|\s*,\s*/i)[0] ?? '').trim();
    if (leadPhrase && leadPhrase.toLowerCase() !== factionRaw.toLowerCase()) {
      retire(leadPhrase, { evenIfHub: true });
    }
    if (!factionName) {
      factionKind = lastWord(leadPhrase || factionRaw) || 'company';
      const stem = pickUnused(rng, PLACE_STEMS, taken);
      factionName = /^(house|order|guild|company|court)$/i.test(factionKind)
        ? `${factionKind[0]!.toUpperCase()}${factionKind.slice(1)} ${stem}`
        : FACTION_WORDS.has(factionKind)
          ? `${stem} ${factionKind}`
          : stem;
    }
    if (!replacements.some(([from]) => from.toLowerCase() === factionRaw.toLowerCase())) {
      replacements.push([factionRaw, factionName]);
    }
    if (leadPhrase && leadPhrase.toLowerCase() !== factionRaw.toLowerCase()
      && !replacements.some(([from]) => from.toLowerCase() === leadPhrase.toLowerCase())) {
      replacements.push([leadPhrase, factionName]);
    }
  }

  // Ban catalog faction and cast names found in structured hook text (who / whoHere /
  // pressing / summonIntent / openingOffer) so a name like Pellane cannot open Cinderwake.
  const banHay = structuredBanHay(hook);
  if (banHay) {
    const already = (n: string) =>
      retired.some((x) => x.toLowerCase() === n.toLowerCase())
      || replacements.some(([from]) => from.toLowerCase() === n.toLowerCase());
    const mentioned = (n: string) => new RegExp(`\\b${escapeRe(n)}\\b`, 'i').test(banHay);
    for (const faction of [
      ...CATALOG_FACTION_NAMES,
      ...extractTitleNames(hook.faction).filter((n) => !isGenericToken(n)),
    ]) {
      if (!mentioned(faction) || already(faction)) continue;
      retire(faction, { evenIfHub: true });
      if (!factionName) {
        factionKind = lastWord(faction) || 'company';
        const stem = pickUnused(rng, PLACE_STEMS, taken);
        factionName = /^(house|order|guild|company|court)$/i.test(factionKind)
          ? `${factionKind[0]!.toUpperCase()}${factionKind.slice(1)} ${stem}`
          : stem;
      }
      replacements.push([faction, factionName]);
      const first = faction.split(/\s+/)[0] ?? '';
      if (
        first.length >= 7
        && first.toLowerCase() !== faction.toLowerCase()
        && !isGenericToken(first)
        && !already(first)
      ) {
        retire(first, { evenIfHub: true });
        replacements.push([first, factionName.split(/\s+/)[0] ?? factionName]);
      }
    }
    for (const person of [...CATALOG_CAST_NAMES, ...(hook.catalogNpcNames ?? [])]) {
      if (!mentioned(person) || already(person)) continue;
      // Ban the catalog person on page 1, but do not add them to the opening cast
      // unless they were already listed in whoHere / castNpcIds (handled below).
      retire(person, { evenIfHub: true });
    }
  }

  const seenPeople = new Set<string>();
  const orderedPeople: string[] = [];
  for (const n of [...whoNames, ...people]) {
    const key = n.toLowerCase();
    if (seenPeople.has(key)) continue;
    // Skip if this "person" was actually classified as place/faction and already retired as such.
    if (places.includes(n) || factions.some((f) => f.from === n)) continue;
    if (isCampaignHubToken(n, opts?.bibleId)) continue;
    seenPeople.add(key);
    orderedPeople.push(n);
  }

  const aloneHint = !orderedPeople.length && /^(?:no one|nobody|none|you are alone|alone)\b/i.test((hook.whoHere ?? '').trim());
  const cast: OpeningCastMember[] = [];
  for (const catalog of orderedPeople) {
    retire(catalog);
    const minted = mintPerson(rng, taken, genre);
    replacements.push([catalog, minted.name]);
    const bare = catalog.replace(HONORIFIC, '').trim();
    if (bare && bare !== catalog) {
      retire(bare);
      replacements.push([bare, minted.name]);
    }
    const given = bare.split(/\s+/)[0] ?? '';
    if (given && given !== bare && given.length >= 3 && !isCommonOpeningLexeme(given) && !HOOK_FIELD_LABELS.has(given.toLowerCase())) {
      retire(given);
      replacements.push([given, givenNameOf(minted.name)]);
    }
    const roleSrc = applyReplacements(roleForPerson(catalog, hook), replacements).replace(minted.name, '').replace(/\s+/g, ' ').trim();
    cast.push({ name: minted.name, role: sanitizeMintedRole(roleSrc), gender: minted.gender });
  }

  const impliedRole = impliedRoleFromWhoHere(hook.whoHere);
  if (!cast.length && impliedRole) {
    const n = Math.max(1, Math.min(2, impliedOccupancyCount(hook.whoHere) || 1));
    for (let i = 0; i < n; i++) {
      const minted = mintPerson(rng, taken, genre);
      cast.push({ name: minted.name, role: sanitizeMintedRole(impliedRole), gender: minted.gender });
    }
  }

  const offerRaw = hook.openingOffer?.trim() ?? '';
  const offerScrubbed = offerRaw ? applyReplacements(offerRaw, replacements) : '';
  const items = splitOfferItems(offerScrubbed).filter((it) => {
    // Drop leftover catalog names and refuse clauses.
    if (/^(?:refuse|decline|keep your|neither)\b/i.test(it)) return false;
    return it.length >= 2;
  });
  // Offer chips only for a real offer the click can resolve: a "No one offers kit" / salvage-or-leave
  // card has none (better no button than a dead one).
  const compiledOffer = compileOpeningOffer(offerScrubbed ? `Opening offer: ${offerScrubbed}` : undefined);
  const offerCompiles = !!compiledOffer;
  const attached = offerCompiles ? attachItemsToCast(items, cast, offerScrubbed) : [];
  // ONE accept chip and ONE refuse chip per offer. The accept names what the player does (the offer's
  // own condition, "Sit the audit for Dunn"), else a clean item, else the giver's offer — never an
  // action clause dressed as an item ("Take Dunn's offer of Sit the audit").
  const offerChips: OpeningOfferChip[] = [];
  // The giver is who the offer itself names ("Accept Yara's rank stamp and she will …"), else who the items attach to.
  const offerFirst = offerScrubbed.split(/(?<=[.!?])\s+/)[0] ?? '';
  const giver =
    cast.find((c) => new RegExp(`\\b${escapeRe(givenNameOf(c.name))}\\b`, 'i').test(offerFirst))
    ?? attached.find((r) => r.person)?.person
    ?? (offerCompiles ? cast[0] : undefined);
  // What accepting hands over: the offer's own compiled items ("militia armband", "short blade"), named with
  // the minted cast. Never a chip note ("Nell offers a deal") or an action clause ("Sign the blank").
  const itemNotes = [...new Set(compiledOffer?.items ?? [])];
  if (offerCompiles) {
    const cleanItems = attached.filter((r) => !isActionClause(r.item));
    const label = offerConditionLabel(offerScrubbed, cast, giver)
      ?? (cleanItems[0] ? concreteAcceptLabel(cleanItems[0].item, giver ?? cleanItems[0].person) : null)
      ?? (giver ? `Accept ${givenNameOf(giver.name)}'s offer` : 'Accept the offer');
    const what = cleanItems.map((r) => shortItem(r.item)).join(', ');
    offerChips.push({
      kind: 'accept',
      label,
      note: giver
        ? `${giver.name} offers ${what || 'a deal'}`
        : what || 'An offer is on the table.',
    });
    offerChips.push({
      kind: 'refuse',
      label: 'Keep your own kit',
      note: 'Refuse whatever is being offered and keep your own kit.',
    });
  }

  const situation = applyReplacements(
    [
      hook.whoYouAre,
      hook.howYouGotHere,
      hook.pressingNeed,
      hook.whoHere,
      hook.location,
    ]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim() || `${placeKind} — the scene is already in motion.`,
    replacements
  );

  // Do not retire the global catalog blocklist. Hubs like Greyhollow and Valespire
  // stay on the map; only names this opening actually replaced are banned.
  const nameMap = [...replacements].sort((a, b) => b[0].length - a[0].length);
  const offerSummary = offerScrubbed
    ? applyReplacements(offerScrubbed, nameMap)
    : attached.length
      ? attached.map((a) => a.item).join(', ')
      : undefined;

  return {
    placeName,
    placeKind,
    settlementName,
    factionName,
    factionKind,
    cast: cast.map((c) => ({ ...c, role: applyReplacements(c.role, nameMap).replace(/\s+/g, ' ').trim() || c.role })),
    situation: alignHookPronouns(applyReplacements(situation, nameMap), cast),
    pressing: hook.pressingNeed ? alignHookPronouns(applyReplacements(hook.pressingNeed, nameMap), cast) : undefined,
    how: hook.howYouGotHere ? alignHookPronouns(applyReplacements(hook.howYouGotHere, nameMap), cast) : undefined,
    whoYouAre: hook.whoYouAre ? alignHookPronouns(applyReplacements(hook.whoYouAre, nameMap), cast) : undefined,
    offerSummary: offerSummary ? alignHookPronouns(offerSummary, cast) : offerSummary,
    offerChips,
    ...(itemNotes.length ? { offerItemNotes: itemNotes } : {}),
    alone: aloneHint || (!cast.length && !whoHereImpliesPresent(hook.whoHere)),
    nearbyLandmark,
    groupLabel: groupLabelFromWhoHere(hook.whoHere),
    retiredNames: retired.filter((n) => !isGenericToken(n)),
    nameMap,
  };
}

function patchRoster(memories: NpcMemory[] | undefined, instance: OpeningInstance, castNpcIds?: string[]): NpcMemory[] {
  const next = [...(memories ?? [])];
  instance.cast.forEach((member, i) => {
    const id = castNpcIds?.[i];
    const idx = id ? next.findIndex((m) => m.npcId === id) : -1;
    if (idx >= 0) {
      const prev = next[idx]!;
      next[idx] = {
        ...prev,
        npcName: member.name,
        aliases: [member.role, ...(prev.aliases ?? []).filter((a) => !instance.retiredNames.some((r) => a.toLowerCase().includes(r.toLowerCase())))],
        roleHint: member.role || prev.roleHint,
      };
    } else {
      next.push({
        npcId: `opening-cast-${i + 1}`,
        npcName: member.name,
        disposition: 'neutral',
        facts: [member.role].filter(Boolean),
        lastSeenTurn: 0,
        roleHint: member.role,
        aliases: [member.role],
      });
    }
  });
  // Drop retired catalog names from leftover aliases so they cannot leak.
  return next.map((m) => ({
    ...m,
    aliases: (m.aliases ?? []).filter((a) => !instance.retiredNames.some((r) => new RegExp(`\\b${escapeRe(r)}\\b`, 'i').test(a))),
    npcName: instance.retiredNames.some((r) => new RegExp(`\\b${escapeRe(r)}\\b`, 'i').test(m.npcName)) && !instance.cast.some((c) => c.name === m.npcName)
      ? m.npcName // non-opening roster: leave for later travel, but...
      : m.npcName,
  }));
}

/**
 * Lock the minted instance onto the save: place, pins, scrubbed hook blob, roster names.
 */
/** The offer's non-carried benefits (a berth, a cover story), compiled from the hook's own offer line. */
function compiledBenefits(offer: string | undefined, fallback?: string[]): { benefits?: string[] } {
  const benefits = compileOpeningOffer(offer ? `Opening offer: ${offer}` : undefined)?.benefits ?? fallback;
  return benefits?.length ? { benefits } : {};
}

export function attachOpeningInstance(
  state: GameState,
  hook: OpeningHookSnapshot,
  blob?: string
): GameState {
  const existing = state.openingEstablishment?.instance;
  const catalogNpcNames = [
    ...(hook.catalogNpcNames ?? []),
    ...(hook.castNpcIds ?? []).map((id) => (state.npcMemories ?? []).find((m) => m.npcId === id)?.npcName ?? ''),
  ].filter(Boolean);
  const instance = existing ?? mintOpeningInstance(
    { ...hook, catalogNpcNames },
    hookKey(state),
    {
      bibleId: state.campaignBibleId ?? undefined,
      engineMode: state.engineMode,
    }
  );
  const map: Array<[string, string]> = instance.nameMap?.length
    ? [...instance.nameMap]
    : [];
  if (!map.length) {
    const locNames = extractTitleNames(hook.location);
    const whoNames = peopleFromWhoHere(hook.whoHere);
    if (locNames[0] && !isCampaignHubToken(locNames[0], state.campaignBibleId ?? undefined)) {
      map.push([locNames[0], instance.placeName]);
    }
    whoNames.forEach((n, i) => {
      const minted = instance.cast[i]?.name;
      if (minted) {
        map.push([n, minted]);
        const bare = n.replace(HONORIFIC, '').trim();
        if (bare && bare !== n) map.push([bare, minted]);
      }
    });
  }

  const scrubbedBlob = rewriteBlob(blob, map);
  const rawHook = hook.text ? applyReplacements(hook.text, map) : scrubbedBlob;
  const scrubbedHook = rawHook ? alignHookPronouns(rawHook, instance.cast) : rawHook;
  const est = state.openingEstablishment;
  const pinned = instance.cast.map((c) => c.name);
  const memories = patchRoster(state.npcMemories, instance, est?.castNpcIds);
  // The card records the offer whenever the instance carries offer chips, so every chip shown resolves on click.
  const cardOffer = instance.offerChips.length
    ? est?.card?.offer ?? compileOpeningOffer(hook.openingOffer ? `Opening offer: ${hook.openingOffer}` : undefined)
    : est?.card?.offer;

  const next: GameState = {
    ...state,
    currentLocation: instance.placeName,
    npcMemories: memories,
    openingEstablishment: {
      ...(est ?? { pending: [], answers: {}, complete: true }),
      instance,
      pickedHook: scrubbedHook ?? est?.pickedHook,
      // Always the minted cast — never keep a pre-attach bible catalog pin.
      pinnedNpcNames: pinned,
      pinnedAt: instance.placeName,
      authoredPage1Retired: hook.page1 || hook.fallback || est?.authoredPage1Retired,
      // Do not carry authored page 1 as a player-facing fallback.
      pickedHookFallback: undefined,
      page1: undefined,
      answers: { ...(est?.answers ?? {}), where: instance.placeName },
      card: est?.card
        ? {
            ...est.card,
            place: instance.placeName,
            cast: instance.cast.length ? instance.cast.map((c) => c.name).join(' and ') : est.card.cast,
            castNames: pinned,
            names: [
              instance.placeName,
              ...pinned,
              ...(instance.factionName ? [instance.factionName] : []),
              ...(instance.settlementName ? [instance.settlementName] : []),
            ],
            offer: cardOffer
              ? {
                  ...cardOffer,
                  items: instance.offerItemNotes?.length ? instance.offerItemNotes : cardOffer.items,
                  ...(compiledBenefits(hook.openingOffer, cardOffer.benefits)),
                  accept: instance.offerChips.find((c) => c.kind === 'accept')?.label ?? cardOffer.accept,
                  refuse: instance.offerChips.find((c) => c.kind === 'refuse')?.label ?? 'Keep your own kit',
                }
              : cardOffer,
          }
        : est?.card,
    },
  };
  const priorPins = est?.pinnedNpcNames ?? [];
  const present = (state.sceneFacts?.present ?? []).filter((p) => {
    const label = (p ?? '').replace(/\s+/g, ' ').trim();
    if (!label) return false;
    if (priorPins.some((n) => n.toLowerCase() === label.toLowerCase())) return false;
    if (isCatalogCastBlockedHere(next, label)) return false;
    return true;
  });
  for (const name of pinned) {
    if (!present.some((p) => p.toLowerCase() === name.toLowerCase())) present.push(name);
  }
  return applyPresenceFacts(next, { present });
}

export function openingInstanceOf(state: GameState): OpeningInstance | undefined {
  return state.openingEstablishment?.instance;
}


export function snapshotFromPickedHook(
  picked?: (OpeningHookSnapshot & {
    who?: string;
    how?: string;
    summonIntent?: string;
    pressing?: string;
    where?: string;
    writerNotes?: string;
    beats?: string[];
    faction?: string;
    castNpcIds?: string[];
  }) | null
): OpeningHookSnapshot {
  if (!picked) return {};
  return {
    location: picked.location ?? picked.where,
    text: picked.text,
    page1: picked.page1,
    fallback: picked.fallback,
    whoHere: picked.whoHere ?? picked.faction,
    openingOffer: picked.openingOffer,
    pressingNeed: picked.pressingNeed ?? picked.pressing,
    howYouGotHere: picked.howYouGotHere ?? picked.how,
    summonIntent: picked.summonIntent,
    whoYouAre: picked.whoYouAre ?? picked.who,
    beats: picked.beats,
    writerNotes: picked.writerNotes,
    faction: picked.faction,
    castNpcIds: picked.castNpcIds,
  };
}
