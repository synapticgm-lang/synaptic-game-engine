/**
 * Site-wide crowd / presence authority.
 * SNAPSHOT Crowd + sceneFacts.present + companions + encounter are the count.
 * The writer cannot invent a larger or smaller gathering without a ledger enter/leave.
 * Deterministic harvest + warden rewrite — not a Continuity-Warden LLM.
 */

import type { GameState, SceneFacts } from './types.ts';
import { filterChromeFromPresent, isChromePersonToken } from './chromeAuthority.ts';

export type CrowdBucket = 'empty' | 'solo' | 'pair' | 'few' | 'group' | 'large';

export type CrowdHeadcount = {
  /** Locked headcount when harvest or occupancy has committed a number. */
  locked: boolean;
  /** Locked count, or 0 when empty/alone. */
  count: number;
  /** Named people + occupancy already on the ledger (floor if unlocked). */
  floor: number;
  crowdPresent: boolean;
};

const PEOPLE_NOUN =
  'people|persons|figures|individuals|onlookers|bystanders|watchers|strangers|souls|bodies|arrivals|summoned|handlers';

const NON_PERSON_PROP = /^(cracked street)$/i;

const AGGREGATE =
  /^(bystanders?|handlers?|onlookers?|watchers?|crowd|people|voices)$/i;

const OCCUPANCY = /^figure\s+\d+$/i;

const OBJECT_PAIR =
  /\b(?:pair of|both)\s+(?:boots?|shoes?|gloves?|eyes?|hands?|shoulders?|knees?|feet|ears|doors?|windows?|crates?|barrels?|bags?|keys?)\b/i;

const TWO_OF_YOU = /\bthe two of you\b/i;

const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
};

/** Other people arrive or leave — unlocks a headcount change. Not "when you arrived". */
export const CROWD_ENTER =
  /\b(?:(?:more|other|others|someone(?: else)?|they|people|figures|a (?:group|crowd|pair)|another)\s+(?:arrive|arrives|arrived|enter|enters|entered|join|joins|joined|appear|appears|appeared|step(?:s|ped)? in)|(?:people|figures|a (?:group|crowd))\s+(?:gather|gathers|gathered|pour(?:s|ed)? in)|crowd\s+(?:gathers|grows|swells)|someone new)\b/i;

export const CROWD_LEAVE =
  /\b(?:(?:they|people|figures|the (?:group|crowd|others|rest)|everyone else)\s+(?:leave|leaves|left|flee|fled|depart|departs|departed|scatter|scatters|scattered|disperse|disperses)|crowd\s+(?:thins|clears|scatters|leaves|disperses|moves on)|only\s+(?:one|two|a few|[A-Za-z]+)\s+(?:remain|remains|left)|the others (?:are )?(?:gone|left))\b/i;

const EMPTY_CLAIMS =
  /\b((?:the )?(?:square|street|room|hall|place) is (?:empty|deserted)|no (?:one|people|crowd|voices)|(?:empty|deserted) (?:square|street|room|hall))\b/gi;

const LARGE_SPAN =
  /\b(?:dozens?|scores?|hundreds?|fifty|sixty|seventy|eighty|ninety|hundred|two hundred|three hundred)(?:\s+of)?\s+(?:the\s+)?(?:people|figures|individuals|onlookers|bystanders|watchers|voices|souls|bodies)\b/gi;

const GROUP_SPAN =
  /\b(?:a\s+)?(?:scattered\s+|sparse\s+|modest\s+|small\s+|large\s+|meager\s+)?(?:group|crowd|gathering)(?:\s+of\s+(?:the\s+)?(?:people|figures|individuals|onlookers|bystanders|strangers))?|(?:several|many)\s+(?:people|figures|individuals|onlookers|bystanders)\b/gi;

const FEW_SPAN =
  /\b(?:a\s+)?(?:few|handful of)\s+(?:people|figures|individuals|onlookers|bystanders)\b/gi;

const PAIR_SPAN =
  /\b(?:the\s+)?(?:two|both)\s+(?:figures|people|individuals|strangers|onlookers|bystanders)(?:\s+who\s+were\s+present)?|\ba pair of\s+(?:people|figures|individuals)\b|\bthe pair\b/gi;

const SOLO_SPAN =
  /\b(?:a\s+)?(?:single|lone|solitary)\s+(?:figure|person|individual|stranger)|(?:the\s+)?(?:one|only)\s+(?:other\s+)?(?:figure|person|individual)\b/gi;

/** Already-canonical warden phrases — never re-match / re-expand these. */
const CANONICAL_CROWD_PHRASE =
  /\bthe\s+(?:person|two people|few people|people|crowd)\s+here\b/gi;

const NUMBERED_SPAN = new RegExp(
  `\\b(\\d{1,3}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\\s+(${PEOPLE_NOUN})\\b`,
  'gi'
);

export function crowdBucket(n: number): CrowdBucket {
  if (n <= 0) return 'empty';
  if (n === 1) return 'solo';
  if (n === 2) return 'pair';
  if (n <= 4) return 'few';
  if (n <= 8) return 'group';
  return 'large';
}

export function canonicalCrowdPhrase(bucket: CrowdBucket): string {
  switch (bucket) {
    case 'empty':
      return 'no one';
    case 'solo':
      return 'the person here';
    case 'pair':
      return 'the two people here';
    case 'few':
      return 'the few people here';
    case 'group':
      return 'the people here';
    case 'large':
      return 'the crowd here';
  }
}

export function isNonPersonToken(token: string): boolean {
  const t = token.trim();
  return isChromePersonToken(t) || NON_PERSON_PROP.test(t);
}

export function isAggregateToken(token: string): boolean {
  return AGGREGATE.test(token.trim());
}

export function isOccupancyToken(token: string): boolean {
  return OCCUPANCY.test(token.trim());
}

export function isPersonToken(token: string): boolean {
  const t = token.trim();
  if (!t || isNonPersonToken(t)) return false;
  if (isAggregateToken(t)) return false;
  return true;
}

export function isNamedPersonToken(token: string): boolean {
  const t = token.trim();
  if (!isPersonToken(t) || isOccupancyToken(t)) return false;
  if (/^(companion|enemy):/i.test(t)) return true;
  return /[A-Za-z]/.test(t);
}

export function countPersonTokens(present: string[] | undefined): number {
  return (present ?? []).filter((p) => isPersonToken(p)).length;
}

export function crowdFluxInText(text: string): boolean {
  if (!text) return false;
  return CROWD_ENTER.test(text) || CROWD_LEAVE.test(text);
}

function extrasBeyondPresent(state: GameState, present: string[]): number {
  const names = new Set(present.map((p) => p.toLowerCase()));
  let extra = 0;
  for (const c of state.companions ?? []) {
    const n = (c.name ?? '').trim().toLowerCase();
    if (n && !names.has(n) && !names.has(`companion: ${n}`)) extra += 1;
  }
  if (state.activeEncounter?.name) {
    const n = state.activeEncounter.name.trim().toLowerCase();
    if (n && !names.has(n) && ![...names].some((x) => x.startsWith('enemy:'))) extra += 1;
  } else if (state.activeEncounter) {
    extra += 1;
  }
  return extra;
}

export function resolveCrowdHeadcount(state: GameState): CrowdHeadcount {
  const alone = state.openingEstablishment?.aloneArrival === true;
  const present = state.sceneFacts?.present ?? [];
  const people = countPersonTokens(present);
  const extras = extrasBeyondPresent(state, present);
  const crowd = state.sceneFacts?.crowd ?? 'unknown';
  const crowdPresent = !alone && (crowd === 'present' || crowd === 'sparse' || people + extras > 0);

  if (alone && !state.activeEncounter) {
    return { locked: true, count: 0, floor: 0, crowdPresent: false };
  }

  const lockedCount = state.sceneFacts?.crowdCount;
  const floor = people + extras;

  if (typeof lockedCount === 'number' && lockedCount >= 0) {
    const count = Math.max(0, lockedCount);
    return { locked: true, count, floor: Math.max(floor, count > 0 ? 1 : 0), crowdPresent: count > 0 || crowdPresent };
  }

  if (people > 0) {
    return { locked: false, count: people + extras, floor, crowdPresent: true };
  }

  if (crowd === 'none') {
    return { locked: true, count: extras, floor: extras, crowdPresent: extras > 0 };
  }

  return {
    locked: false,
    count: extras,
    floor,
    crowdPresent,
  };
}

/**
 * Locked headcount for the warden, or -1 when present but not yet numbered.
 * 0 = empty / alone.
 */
export function calculateCrowdSize(state: GameState): number {
  const r = resolveCrowdHeadcount(state);
  if (r.locked) return r.count;
  return -1;
}

/**
 * Warden count: locked ledger wins; if still unlocked, the first people-count
 * mention in this beat becomes the lock for the rest of the beat.
 */
export function crowdSizeForWarden(state: GameState, incomingProse?: string): number {
  const locked = calculateCrowdSize(state);
  if (locked >= 0) return locked;
  if (incomingProse && !crowdFluxInText(incomingProse)) {
    const mention = detectCrowdMention(incomingProse);
    if (mention) return mention.count;
  }
  return -1;
}

export function formatCrowdSnapshotLine(state: GameState): string {
  const alone = state.openingEstablishment?.aloneArrival === true;
  if (alone && !state.activeEncounter) return 'none';
  const r = resolveCrowdHeadcount(state);
  if (!r.crowdPresent && r.count <= 0) return 'none';
  if (!r.locked) {
    const floorBit = r.floor > 0 ? ` (at least ${r.floor} named)` : '';
    return `present / count not established${floorBit}`;
  }
  const n = r.count;
  const band = n <= 3 ? 'intimate' : n <= 8 ? 'small' : n <= 15 ? 'modest' : 'large';
  return `present / ${band} (~${n})`;
}

export function formatCrowdBindingLine(state: GameState): string | null {
  const r = resolveCrowdHeadcount(state);
  if (!r.locked) {
    if (!r.crowdPresent) return null;
    return 'CROWD COUNT: present but not yet numbered — after this beat the ledger locks the size you write. Later beats keep that size unless someone enters or leaves.';
  }
  if (r.count <= 0) {
    return 'CROWD COUNT (BINDING): 0 — empty. Do not invent a pair, group, or crowd unless someone enters.';
  }
  return `CROWD COUNT (BINDING): ${r.count} people here. Pair/both/two-people language only if the count is 2. Group/crowd/several only if the count is 5+. Do not change the count unless someone enters or leaves.`;
}

export function formatPresenceForSnapshot(present: string[] | undefined): string[] {
  return (present ?? []).filter((p) => isNamedPersonToken(p) && !isOccupancyToken(p));
}

export function syncPresentToCount(present: string[], count: number): string[] {
  const named = present.filter((p) => isNamedPersonToken(p));
  const props = present.filter((p) => isNonPersonToken(p));
  if (count <= 0) return [...props];
  const need = Math.max(0, count - named.length);
  const figures = Array.from({ length: need }, (_, i) => `figure ${i + 1}`);
  return [...props, ...named, ...figures];
}

function parseNumberWord(raw: string): number | null {
  const t = raw.toLowerCase();
  if (NUMBER_WORDS[t] != null) return NUMBER_WORDS[t]!;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 && n <= 200 ? n : null;
}

export type CrowdMention = {
  index: number;
  length: number;
  bucket: CrowdBucket;
  count: number;
  text: string;
};

function mention(index: number, text: string, bucket: CrowdBucket, count: number): CrowdMention {
  return { index, length: text.length, bucket, count, text };
}

/** Earliest crowd-size mention that is about people, not objects. */
export function detectCrowdMention(text: string): CrowdMention | null {
  if (!text) return null;
  const found: CrowdMention[] = [];

  const collect = (re: RegExp, bucket: CrowdBucket, count: number) => {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const span = m[0];
      if (OBJECT_PAIR.test(span) || TWO_OF_YOU.test(span)) continue;
      if (spansCanonicalPhrase(text, m.index, span.length)) continue;
      if (bucket === 'pair' && /arrived/i.test(span) && /you arrived/i.test(text.slice(Math.max(0, m.index - 8), m.index + span.length))) {
        /* "who were present when you arrived" is still a pair mention */
      }
      found.push(mention(m.index, span, bucket, count));
    }
  };

  collect(LARGE_SPAN, 'large', 20);
  collect(GROUP_SPAN, 'group', 5);
  collect(FEW_SPAN, 'few', 3);
  collect(PAIR_SPAN, 'pair', 2);
  collect(SOLO_SPAN, 'solo', 1);

  NUMBERED_SPAN.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = NUMBERED_SPAN.exec(text)) !== null) {
    const n = parseNumberWord(m[1] ?? '');
    if (n == null) continue;
    const span = m[0];
    if (OBJECT_PAIR.test(span) || TWO_OF_YOU.test(span)) continue;
    if (spansCanonicalPhrase(text, m.index, span.length)) continue;
    found.push(mention(m.index, span, crowdBucket(n), n));
  }

  if (!found.length) return null;
  found.sort((a, b) => a.index - b.index || b.length - a.length);
  return found[0]!;
}

export function listCrowdMentions(text: string): CrowdMention[] {
  if (!text) return [];
  const found: CrowdMention[] = [];
  const collect = (re: RegExp, bucket: CrowdBucket, count: number) => {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const span = m[0];
      if (OBJECT_PAIR.test(span) || TWO_OF_YOU.test(span)) continue;
      if (spansCanonicalPhrase(text, m.index, span.length)) continue;
      found.push(mention(m.index, span, bucket, count));
    }
  };
  collect(LARGE_SPAN, 'large', 20);
  collect(GROUP_SPAN, 'group', 5);
  collect(FEW_SPAN, 'few', 3);
  collect(PAIR_SPAN, 'pair', 2);
  collect(SOLO_SPAN, 'solo', 1);
  NUMBERED_SPAN.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = NUMBERED_SPAN.exec(text)) !== null) {
    const n = parseNumberWord(m[1] ?? '');
    if (n == null) continue;
    const span = m[0];
    if (OBJECT_PAIR.test(span) || TWO_OF_YOU.test(span)) continue;
    if (spansCanonicalPhrase(text, m.index, span.length)) continue;
    found.push(mention(m.index, span, crowdBucket(n), n));
  }
  found.sort((a, b) => a.index - b.index);
  return found;
}

function applyCase(sample: string, replacement: string): string {
  if (!sample) return replacement;
  if (sample[0] === sample[0]?.toUpperCase() && /[A-Z]/.test(sample[0]!)) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

/** Collapse double-apply corruption: "the sparse the crowd here here". */
export function normalizeCrowdRewriteArtifacts(text: string): string {
  if (!text) return text;
  let next = text;
  // "herehere" / "here here" / "here hereere"
  next = next.replace(/\bhere(?:\s*here)+\b/gi, 'here');
  next = next.replace(/\bhereere\b/gi, 'here');
  // "the sparse the crowd here" / "the modest the people here"
  next = next.replace(
    /\bthe\s+(?:sparse|modest|small|large|scattered|meager)\s+the\s+(crowd|people|person|two people|few people)\s+here\b/gi,
    (_m, noun: string) => `the ${String(noun).toLowerCase()} here`
  );
  // "the people herehere" already handled; "the the crowd here"
  next = next.replace(/\bthe\s+the\s+(crowd|people|person|two people|few people)\s+here\b/gi, 'the $1 here');
  // Stranded adjective before canonical: "sparse the crowd here" / "modest the crowd here"
  next = next.replace(
    /\b(?:sparse|modest|small|large|scattered|meager)\s+the\s+(crowd|people|person|two people|few people)\s+here\b/gi,
    (_m, noun: string) => `the ${String(noun).toLowerCase()} here`
  );
  // "the people here passes" grammar after rewrite — light fix
  next = next.replace(/\bthe people here passes\b/gi, 'no one passes');
  return next.replace(/\s{2,}/g, ' ').replace(/\s+([.,;:])/g, '$1');
}

function spansCanonicalPhrase(text: string, index: number, length: number): boolean {
  CANONICAL_CROWD_PHRASE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = CANONICAL_CROWD_PHRASE.exec(text)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    if (index >= start && index + length <= end) return true;
  }
  return false;
}

/**
 * Rewrite any people-count class that contradicts the locked headcount.
 * Skips when count is unknown (-1) except invented large crowds, and skips
 * object pairs / "the two of you". Flux (enter/leave) this beat is not rewritten.
 */
export function scrubInventedCrowdSize(
  text: string,
  trackedCrowdSize: number,
  crowdPresent?: boolean
): string {
  if (!text) return text;
  let next = text;

  if (crowdPresent || trackedCrowdSize > 0) {
    EMPTY_CLAIMS.lastIndex = 0;
    if (EMPTY_CLAIMS.test(next)) {
      EMPTY_CLAIMS.lastIndex = 0;
      const fill =
        trackedCrowdSize === 2
          ? 'the two people here'
          : trackedCrowdSize === 1
            ? 'the person here'
            : trackedCrowdSize >= 5
              ? 'the people here'
              : 'people still here';
      next = next.replace(EMPTY_CLAIMS, (match) => {
        if (/no voices/i.test(match)) return 'quiet voices';
        return fill;
      });
    }
  }

  if (crowdFluxInText(next)) return normalizeCrowdRewriteArtifacts(next);

  if (trackedCrowdSize < 0) {
    LARGE_SPAN.lastIndex = 0;
    if (LARGE_SPAN.test(next)) {
      LARGE_SPAN.lastIndex = 0;
      next = next.replace(LARGE_SPAN, (span) => applyCase(span, 'people here'));
    }
    return normalizeCrowdRewriteArtifacts(next);
  }

  if (trackedCrowdSize >= 20) {
    const mentions = listCrowdMentions(next);
    if (!mentions.some((x) => x.bucket === 'solo' || x.bucket === 'pair' || x.bucket === 'few')) {
      return normalizeCrowdRewriteArtifacts(next);
    }
  }

  const target = crowdBucket(trackedCrowdSize);
  const mentions = listCrowdMentions(next);
  if (!mentions.length) return normalizeCrowdRewriteArtifacts(next);

  let rebuilt = next;
  for (const hit of [...mentions].reverse()) {
    if (hit.bucket === target) continue;
    if (trackedCrowdSize >= 20 && hit.bucket === 'group') continue;
    if (trackedCrowdSize >= 20 && hit.bucket === 'large') continue;
    // Never expand a span that already ends with " here" into another "… here"
    if (/\bhere\b/i.test(hit.text) && canonicalCrowdPhrase(target).includes('here')) {
      continue;
    }
    const phrase = applyCase(hit.text, canonicalCrowdPhrase(target));
    rebuilt = rebuilt.slice(0, hit.index) + phrase + rebuilt.slice(hit.index + hit.length);
  }
  return normalizeCrowdRewriteArtifacts(
    rebuilt.replace(/\s{2,}/g, ' ').replace(/\s+([.,;:])/g, '$1')
  );
}

/**
 * Harvest a people-count from prose into sceneFacts.present + crowdCount.
 * First lock wins. Later beats cannot grow/shrink without enter/leave language.
 */
export function harvestCrowdIntoSceneFacts(
  prev: SceneFacts | undefined,
  narrative: string,
  turn = 0
): SceneFacts {
  const base: SceneFacts = prev
    ? { ...prev, present: filterChromeFromPresent(prev.present), updatedTurn: turn }
    : {
        crowd: 'unknown',
        noise: 'unknown',
        present: [],
        props: [],
        lastBeat: '',
        updatedTurn: turn,
      };

  const mention = detectCrowdMention(narrative);
  const flux = crowdFluxInText(narrative);
  const prevLocked = typeof prev?.crowdCount === 'number';
  const namedFloor = countPersonTokens(base.present.filter((p) => isNamedPersonToken(p)));

  if (!mention) {
    if (prevLocked && namedFloor > (prev!.crowdCount ?? 0)) {
      const nextCount = namedFloor;
      return {
        ...base,
        crowd: nextCount > 0 ? (nextCount <= 3 ? 'sparse' : 'present') : 'none',
        present: syncPresentToCount(base.present, nextCount),
        crowdCount: nextCount,
        updatedTurn: turn,
      };
    }
    return base;
  }

  if (prevLocked && !flux && mention.count !== prev!.crowdCount) {
    if (namedFloor <= (prev!.crowdCount ?? 0)) return base;
  }

  const nextCount =
    prevLocked && !flux
      ? Math.max(prev!.crowdCount ?? 0, mention.count === prev!.crowdCount ? mention.count : namedFloor)
      : mention.count;
  const present = syncPresentToCount(base.present, nextCount);
  return {
    ...base,
    crowd: nextCount > 0 ? (nextCount <= 3 ? 'sparse' : 'present') : 'none',
    present,
    crowdCount: nextCount,
    lastBeat: base.lastBeat || (nextCount > 0 ? `${nextCount} people present` : 'street empty'),
    updatedTurn: turn,
  };
}
