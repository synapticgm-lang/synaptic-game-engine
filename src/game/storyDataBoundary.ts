/**
 * 28p — story data → game boundary.
 * Bible fields that become facts, speech, page 1, cards, or item text carry only in-world
 * sentences. Author direction (the player / next page / "X first." / writer rules) is dropped
 * here, once, for every story. `premise` and `styleRail` stay writer rails and are not touched.
 */

import type {
  CampaignBible,
  KeyNPC,
  LoreSnippet,
  OpeningBeatCard,
  OpeningHookCard,
  StarterItem,
  StarterQuest,
} from '@/data/campaigns/types';
import { OPENING_HOOK_DECKS } from '@/data/campaigns/openingHookDecks';
import type { PlaceRecord } from './types';
import { placeIdFromName } from './placeUtils';

const META_AUDIENCE = /\b(?:the\s+(?:player|reader|writer|narrator|author|GM|game master)s?\b|player['’]s\b|players['’])/i;
const META_DOCUMENT =
  /\b(?:the\s+)?(?:next|first|opening|previous)\s+(?:page|scene|beat|chapter)\s+(?:is|waits|asks|opens|starts|begins)\b|\bpage\s+(?:one|1|two|2)\b/i;
const META_NEXT_IS = /\bthe\s+next\s+(?:word|move|question|page|beat)\s+is\s+(?:whether|that|the|what)\b/i;
const META_RULE =
  /^(?:do\s+not|don['’]t|never|always)\s+(?:invent|name|list|lecture|dump|force|offer|spawn|describe|narrate|reprint|mention|use|add)\b/i;
const META_TERMS =
  /\b(?:BINDING|AUTHORITY|writer[- ]only|when earned|(?:not|as) a (?:\w+ )?lecture|story choices?|the camera (?:stays|starts|opens|is))\b/;
/** Stage direction shapes — only in author telegram fields (card `text`, string cards, `openingHook`). */
const STAGE_START = /^(?:you|we)\s+(?:start|begin)\b/i;
const STAGE_ORDER = /^[A-Z][\w’'-]*(?:\s+[\w’'-]+){0,3}\s+first(?:,\s*[\w’'-]+(?:\s+[\w’'-]+){0,3}\s+second)?[.!]?$/;
const STAGE_CONTRAST = /^[A-Z][\w’'-]*(?:\s+[\w’'-]+){0,3},\s+not\s+[\w’'-]+(?:\s+[\w’'-]+){0,3}[.!]?$/;

/** One sentence of author direction (not in-world text). `telegram` adds stage-direction shapes. */
export function isAuthorNoteSentence(sentence: string, opts?: { telegram?: boolean }): boolean {
  const s = (sentence ?? '').replace(/\s+/g, ' ').trim();
  if (!s) return false;
  if (
    META_AUDIENCE.test(s)
    || META_DOCUMENT.test(s)
    || META_NEXT_IS.test(s)
    || META_RULE.test(s)
    || META_TERMS.test(s)
  ) {
    return true;
  }
  return opts?.telegram === true && (STAGE_START.test(s) || STAGE_ORDER.test(s) || STAGE_CONTRAST.test(s));
}

function splitSentences(text: string): string[] {
  return text.split(/(?<=[.!?…])\s+(?=["“‘'(]?[A-Z0-9])/);
}

/** Drop author-note sentences; keep everything else byte-for-byte. */
export function stripAuthorNotes(
  text: string | undefined,
  removed?: string[],
  opts?: { telegram?: boolean },
): string {
  const raw = (text ?? '').trim();
  if (!raw) return text ?? '';
  const kept: string[] = [];
  let dropped = 0;
  for (const part of splitSentences(raw)) {
    if (isAuthorNoteSentence(part, opts)) {
      removed?.push(part.trim());
      dropped += 1;
    } else kept.push(part);
  }
  return dropped ? kept.join(' ').trim() : (text as string);
}

export interface StoryDataFlag {
  field: string;
  sentence: string;
}

function strip(
  field: string,
  text: string | undefined,
  flags?: StoryDataFlag[],
  telegram = false,
): string | undefined {
  if (text == null) return text;
  const removed: string[] = [];
  const out = stripAuthorNotes(text, removed, { telegram });
  for (const sentence of removed) flags?.push({ field, sentence });
  return out;
}

/** Hook card with author notes out of every field that can reach the player. */
export function sanitizeHookCardForPlay(
  card: OpeningHookCard,
  flags?: StoryDataFlag[],
  at = 'openingHooks',
): OpeningHookCard {
  if (typeof card === 'string') return strip(at, card, flags, true) ?? '';
  const c: OpeningBeatCard = { ...card };
  c.page1 = strip(`${at}.page1`, card.page1, flags);
  c.text = strip(`${at}.text`, card.text, flags, true);
  c.fallback = strip(`${at}.fallback`, card.fallback, flags);
  c.summonIntent = strip(`${at}.summonIntent`, card.summonIntent, flags);
  c.openingCost = strip(`${at}.openingCost`, card.openingCost, flags);
  c.openingOffer = strip(`${at}.openingOffer`, card.openingOffer, flags);
  if (card.beats) {
    c.beats = card.beats
      .map((b, i) => strip(`${at}.beats[${i}]`, b, flags) ?? '')
      .filter(Boolean);
  }
  return c;
}

const sanitized = new WeakMap<CampaignBible, CampaignBible>();

/** Bible copy whose fact/speech fields carry no author notes. Memoized per bible object. */
export function sanitizeBibleForPlay(bible: CampaignBible, flags?: StoryDataFlag[]): CampaignBible {
  if (!flags) {
    const hit = sanitized.get(bible);
    if (hit) return hit;
  }
  const npc = (n: KeyNPC): KeyNPC => ({
    ...n,
    description: strip(`keyNPCs.${n.id}.description`, n.description, flags) ?? '',
    hooks: n.hooks.map((h) => strip(`keyNPCs.${n.id}.hooks`, h, flags) ?? '').filter(Boolean),
  });
  const lore = (l: LoreSnippet): LoreSnippet => ({
    ...l,
    body: strip(`loreSnippets.${l.id}.body`, l.body, flags) ?? '',
  });
  const item = (i: StarterItem): StarterItem => ({
    ...i,
    description: strip(`starterItems.${i.id}.description`, i.description, flags) ?? '',
  });
  const quest = (q: StarterQuest): StarterQuest => ({
    ...q,
    description: strip(`starterQuests.${q.id}.description`, q.description, flags) ?? '',
    objectives: q.objectives.map((o) => strip(`starterQuests.${q.id}.objectives`, o, flags) ?? '').filter(Boolean),
    rewards: strip(`starterQuests.${q.id}.rewards`, q.rewards, flags) ?? '',
  });
  const out: CampaignBible = {
    ...bible,
    tagline: strip('tagline', bible.tagline, flags) ?? '',
    shortDescription: strip('shortDescription', bible.shortDescription, flags),
    openingHook: strip('openingHook', bible.openingHook, flags, true),
    openingHooks: bible.openingHooks?.map((c, i) => sanitizeHookCardForPlay(c, flags, `openingHooks[${i}]`)),
    keyNPCs: bible.keyNPCs.map(npc),
    loreSnippets: bible.loreSnippets.map(lore),
    starterItems: bible.starterItems.map(item),
    starterQuests: bible.starterQuests.map(quest),
  };
  if (!flags) sanitized.set(bible, out);
  return out;
}

const TEMPORAL_TAIL =
  /\s+(?:before|after|when|while|until|during)\b.*$|\s+at\s+(?:dawn|dusk|night|midnight|noon|last light|first light|the storm|klaxon)\b.*$|,.*$/i;

/** Place name from a hook-card location label: temporal / clause tails are not part of the name. */
export function placeNameFromStoryLabel(label: string | undefined): string {
  const raw = (label ?? '').replace(/\s+/g, ' ').trim();
  if (!raw) return '';
  const name = raw.replace(TEMPORAL_TAIL, '').trim();
  return name.length >= 3 ? name : raw;
}

function firstSentence(text: string | undefined): string {
  const t = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  return (splitSentences(t)[0] ?? t).slice(0, 180).trim();
}

/**
 * Place cards for a story that ships no hub bank: its own hook-card locations and world lore.
 * Marked `settlementKind: 'story-place'` so place-card exits can use them.
 */
export function storyPlacesForBible(bible: CampaignBible | undefined | null): PlaceRecord[] {
  if (!bible) return [];
  const clean = sanitizeBibleForPlay(bible);
  const byId = new Map<string, PlaceRecord>();
  const add = (label: string | undefined, description: string) => {
    const name = placeNameFromStoryLabel(label);
    if (!name) return;
    const id = placeIdFromName(name);
    const prev = byId.get(id);
    const aliases = Array.from(new Set([...(prev?.aliases ?? []), name, (label ?? '').trim()].filter(Boolean))).slice(0, 12);
    byId.set(id, {
      id,
      name: prev?.name ?? name,
      aliases,
      mapScale: 'street',
      arcStatus: 'open',
      settlementKind: 'story-place',
      description: prev?.description || description || undefined,
    });
  };
  if (clean.startingLocation) add(clean.startingLocation, '');
  const deck = clean.openingHooks?.length ? clean.openingHooks : OPENING_HOOK_DECKS[bible.id] ?? [];
  for (const raw of deck) {
    const card = sanitizeHookCardForPlay(raw);
    if (typeof card === 'string') continue;
    add(card.location, firstSentence(card.page1 || card.fallback || card.text));
  }
  for (const l of clean.loreSnippets) {
    if (l.category === 'world') add(l.title, firstSentence(l.body));
  }
  return [...byId.values()].slice(0, 10);
}

/** Merge story places into `places` without overwriting existing records. */
export function seedStoryPlaces(
  places: PlaceRecord[] | undefined,
  bible: CampaignBible | undefined | null,
  hasHubBank: boolean,
): PlaceRecord[] {
  const base = places ?? [];
  if (hasHubBank) return base;
  const seen = new Set(base.flatMap((p) => [p.id, p.name.toLowerCase(), ...(p.aliases ?? []).map((a) => a.toLowerCase())]));
  const extra = storyPlacesForBible(bible).filter(
    (p) => !seen.has(p.id) && !seen.has(p.name.toLowerCase()),
  );
  return extra.length ? [...base, ...extra] : base;
}
