import type { GameState, LoreCard, LoreCardType, TurnFrameTheme, Quest, QuestType, QuestStatus, MapTier, ActiveEncounter, ComicPanel } from './types';
import { stripTurnCloser } from './turnAsk';

export { stripTurnCloser, isTurnCloserLine, shouldShowTurnAsk, TURN_ASK, storyHasBody } from './turnAsk';

export interface GameEvent {
  type: 
    | 'item-gain' 
    | 'item-use' 
    | 'heal' 
    | 'damage' 
    | 'lore-card' 
    | 'quest-add' 
    | 'quest-update' 
    | 'quest-complete'
    | 'dungeon-load'
    | 'dungeon-move'
    | 'dungeon-exit'
    | 'map-floor-change'
    | 'hex-move'
    | 'enemy-appear'
    | 'encounter-end'
    | 'milestone-event'
    | 'campaign-ending'
    | 'loot-video'
    | 'visual-update'
    | 'world-deal'
    | 'world-holding'
    | 'world-order'
    | 'world-clock'
    | 'world-actor'
    | 'time-pass';
  id?: string;
  name?: string;
  qty?: number;
  rarity?: string;
  /** quest | story | key | boss | random — non-random bypasses loot table. */
  lootSource?: string;
  amount?: number;
  partner?: string;
  share?: number;
  risk?: string;
  runs?: number;
  ethic?: string;
  order?: string;
  holdingKind?: string;
  cardType?: LoreCardType;
  keywords?: string[];
  summary?: string;
  visualAnchor?: string; // Added to handle image descriptions
  questType?: QuestType;
  description?: string;
  objectiveId?: string;
  completed?: boolean;
  // Spatial & Dungeon XML Attributes
  blueprintId?: string;
  dungeonName?: string;
  isProcedural?: boolean;
  nodeId?: string;
  tier?: MapTier;
  q?: number;
  r?: number;
  z?: number;
  elevation?: number;
  nodeCount?: number;
  // Enemy encounter
  enemyName?: string;
  enemyLevel?: number;
  enemyHp?: number;
  enemyMaxHp?: number;
  enemyAc?: number;
  enemyStr?: number;
  enemyDex?: number;
  enemyCon?: number;
  enemyXp?: number;
  enemyGold?: number;
  // Milestone illustrations / legendary loot videos / player appearance updates
  imagePromptText?: string;
  itemRarity?: string;
  visualDescription?: string;
  /** True when a <visual-update> represents a radical base-form/species change (GM-flagged). */
  formChange?: boolean;
}

const CHOICE_HEADER_REGEX = /(?:what do you do|options|choices|actions|what will you do)[?: \t]*\n([\s\S]+)$/i;
// Choices must be explicitly numbered. Never treat generic Markdown bullets (`-`, `*`, `•`)
// or lettered inventory/stat lists as actions; those commonly appear in GM loot summaries.
// Supported forms include `1. Action`, `1) Action`, `Option 1: Action`, `[1] Action`,
// `(1) Action`, and markdown-emphasized variants such as `**1.** Action`.
const CHOICE_LINE_REGEX = /^\s*(?:\*\*|\*)?\s*(?:(?:Option\s+)?\d+[.):]|\[\d+\]|\(\d+\))\s*(?:\*\*|\*)?\s+(.+)$/i;
const NUMBERED_CHOICE_PREFIX =
  /(?:\*\*)?(?:(?:Option\s+)?\d+[.):]|\[\d+\]|\(\d+\))\s+(?:\*\*)?/i;
const CHOICE_OFFER_VERBS =
  /^(?:ask|inquire|inspect|examine|talk|speak|tell|approach|leave|walk away|refuse|offer|demand|listen|wait|search|look|follow|challenge|bow|kneel|accept|decline|press|probe|question|bargain|help|protect|thank|apologiz|observe|check|call|shout|whisper|confront|defy|agree)\b/i;
const IN_PROSE_OFFER_SENTENCE =
  /(?:^|[.!?]\s+)((?:Inquire about|Ask (?:the \w+|him|her|them)(?: to| about)|Ask about)\b[^.!?\n]{8,140})/gi;
const MECHANIC_SYSTEM_BODY =
  /\b(quest updated|level up|xp gained|input accepted|registration complete|action failed|hp\s*:|mp\s*:|setup complete|thank you)\b/i;

function cleanChoiceText(raw: string): string {
  return raw
    .replace(/^\s*["']|["']\s*$/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/** True when a line is a fake in-prose menu option (should become a chip). */
export function looksLikeChoiceOffer(raw: string): boolean {
  const t = cleanChoiceText(raw.replace(/^[\s✨🎲⭐️•\-–—*]+/u, ''));
  if (t.length < 8 || t.length > 160) return false;
  if (/^what do you do\??$/i.test(t)) return false;
  if (/^["“]/.test(t)) return false;
  return CHOICE_OFFER_VERBS.test(t);
}

function harvestSystemChoiceOffers(text: string): string[] {
  const out: string[] = [];
  const re = /<system>([\s\S]*?)<\/system>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const body = cleanChoiceText(m[1] ?? '');
    if (looksLikeChoiceOffer(body) && !MECHANIC_SYSTEM_BODY.test(body)) out.push(body);
  }
  return out;
}

function pushChoice(choices: string[], raw: string): void {
  const clean = cleanChoiceText(raw);
  if (
    clean.length > 2
    && clean.length < 160
    && !/^what do you do\??$/i.test(clean)
    && !choices.some((c) => c.toLowerCase() === clean.toLowerCase())
  ) {
    choices.push(clean);
  }
}

function stripHarvestedChoiceOffers(text: string): string {
  let next = text;
  next = next.replace(/<system>([\s\S]*?)<\/system>/gi, (full, body) => {
    const cleaned = cleanChoiceText(String(body ?? ''));
    if (looksLikeChoiceOffer(cleaned) && !MECHANIC_SYSTEM_BODY.test(cleaned)) return '';
    return full;
  });
  next = next
    .split('\n')
    .filter((line) => {
      const match = line.match(CHOICE_LINE_REGEX);
      if (match?.[1] && looksLikeChoiceOffer(match[1])) return false;
      const trimmed = line.trim();
      if (looksLikeChoiceOffer(trimmed) && /^(?:inquire about|ask (?:the |him |her |them |about ))/i.test(trimmed)) {
        return false;
      }
      return true;
    })
    .join('\n');
  next = next.replace(
    new RegExp(`(?:^|\\s)${NUMBERED_CHOICE_PREFIX.source}([^\\n]+)`, 'gi'),
    (full, body) => (looksLikeChoiceOffer(String(body ?? '')) ? '' : full)
  );
  next = next.replace(IN_PROSE_OFFER_SENTENCE, (full, body) => {
    if (!looksLikeChoiceOffer(String(body ?? ''))) return full;
    if (/^[.!?]\s/.test(full)) return full.charAt(0);
    return '';
  });
  return next.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+\n/g, '\n').trim();
}

/**
 * Removes the trailing GM-generated choice list (explicitly numbered options, with or
 * without a "What do you do?" style header) from narrative text. The same choices are
 * parsed separately by `extractChoiceLines` and rendered as action buttons, so they must
 * not also remain visible as raw text in the narrative stream — including inside a comic
 * panel's <narrative> block, which the GM sometimes runs the choice list directly into.
 */
export function stripChoiceList(text: string): string {
  if (!text) return text;

  // Instructed GM format is numbered choices THEN "What do you do?". Strip that
  // trailing closer first so the walk-from-the-end can see the option lines.
  // (If the closer is a header *above* the list, CHOICE_HEADER_REGEX still cuts.)
  let body = stripTurnCloser(text);
  const headerMatch = body.match(CHOICE_HEADER_REGEX);
  if (headerMatch && typeof headerMatch.index === 'number') {
    body = body.slice(0, headerMatch.index).trim();
  }

  const lines = body.split('\n');
  let cut = lines.length;
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (line.trim() === '') { cut = i; continue; }
    if (CHOICE_LINE_REGEX.test(line)) { cut = i; continue; }
    break;
  }
  let result = lines.slice(0, cut).join('\n').trim();

  const remain = result.split('\n').map((l) => l.trim()).filter(Boolean);
  const choiceCount = remain.filter((l) => CHOICE_LINE_REGEX.test(l)).length;
  if (remain.length > 0 && choiceCount >= Math.ceil(remain.length * 0.5)) {
    result = remain.filter((l) => !CHOICE_LINE_REGEX.test(l)).join('\n').trim();
  }

  // GM sometimes jams "1. … 2. … 3. What do you do?" into the last paragraph.
  const inlineIdx = result.search(/\s1[.)]\s+\S[\s\S]*\s2[.)]/);
  if (inlineIdx >= 0 && inlineIdx > result.length * 0.25) {
    result = result.slice(0, inlineIdx).trim();
  }
  result = result.replace(/\s+\d+[.)]\s+what do you do\??\s*$/i, '').trim();
  // Singleton numbered / "Inquire about…" lines left in the paragraph are fake menus.
  result = stripHarvestedChoiceOffers(result);
  return stripTurnCloser(result);
}

/**
 * Pure extraction of explicitly numbered choice lines from GM narrative text (no habit
 * blending — see `extractChoicesFromText` in useGame.ts for the habit-augmented wrapper
 * used by the UI). This is the actual "narrative parser" half of the choice pipeline:
 * it finds the trailing options list (after a "What do you do?"-style header if present,
 * otherwise by scanning backward from the end of the text) and returns clean option text
 * with markdown/HTML stripped.
 */
export function extractChoiceLines(text: string): string[] {
  if (!text) return [];

  let targetText = text;
  const headerMatch = text.match(CHOICE_HEADER_REGEX);
  if (headerMatch && headerMatch[1]) {
    targetText = headerMatch[1];
  }

  const choices: string[] = [];

  for (const line of targetText.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = trimmed.match(CHOICE_LINE_REGEX);
    if (match?.[1]) {
      pushChoice(choices, match[1]);
      continue;
    }
    if (
      looksLikeChoiceOffer(trimmed)
      && /^(?:inquire about|ask (?:the |him |her |them |about ))/i.test(trimmed)
    ) {
      pushChoice(choices, trimmed);
    }
  }

  // Inline numbered options, including a singleton "1. Ask the elder…" jammed into a paragraph.
  const inline =
    targetText.match(
      /\d+[.)]\s+([^\n]+?)(?=\s+\d+[.)]|\s+what do you do|$)/gi
    ) ?? [];
  for (const raw of inline) {
    const cleaned = raw.replace(/^\s*\d+[.)]\s+/, '').trim();
    if (looksLikeChoiceOffer(cleaned) || choices.length === 0) pushChoice(choices, cleaned);
  }

  for (const offer of harvestSystemChoiceOffers(text)) pushChoice(choices, offer);

  const offerRe = new RegExp(IN_PROSE_OFFER_SENTENCE.source, IN_PROSE_OFFER_SENTENCE.flags);
  let m: RegExpExecArray | null;
  while ((m = offerRe.exec(targetText)) !== null) {
    if (looksLikeChoiceOffer(m[1] ?? '')) pushChoice(choices, m[1]);
  }

  return choices;
}

export function extractUpdates(state: GameState, gmText: string): Partial<GameState> {
  const updates: Partial<GameState> = {};

  const hpMatch = gmText.match(/HP:\s*(\d+)\s*\/\s*(\d+)/i);
  if (hpMatch) {
    updates.character = {
      ...state.character,
      hp: parseInt(hpMatch[1], 10),
      maxHp: parseInt(hpMatch[2], 10),
    };
  }

  const mpMatch = gmText.match(/MP:\s*(\d+)\s*\/\s*(\d+)/i);
  if (mpMatch) {
    updates.character = {
      ...(updates.character ?? state.character),
      mp: parseInt(mpMatch[1], 10),
      maxMp: parseInt(mpMatch[2], 10),
    };
  }

  const xpMatch = gmText.match(/XP:\s*(\d+)\s*\/\s*(\d+)/i);
  if (xpMatch) {
    updates.character = {
      ...(updates.character ?? state.character),
      xp: parseInt(xpMatch[1], 10),
      xpToNext: parseInt(xpMatch[2], 10),
    };
  }

  const levelMatch = gmText.match(/Level:\s*(\d+)/i);
  if (levelMatch) {
    updates.character = {
      ...(updates.character ?? state.character),
      level: parseInt(levelMatch[1], 10),
    };
  }

  return updates;
}

export function extractNewItems(gmText: string): Array<{ name: string; rarity: string; provenance?: string }> {
  const items: Array<{ name: string; rarity: string; provenance?: string }> = [];
  const re = /\[(Common|Uncommon|Rare|Epic|Legendary)\]\s+([^\n\]]+?)(?:\s*\(Looted:\s*([^)]+)\))?/gi;
  let m;
  while ((m = re.exec(gmText)) !== null) {
    items.push({ rarity: m[1], name: m[2].trim(), provenance: m[3]?.trim() });
  }
  return items;
}

const TAG_PATTERNS: Array<{ type: GameEvent['type']; re: RegExp; parse: (m: RegExpMatchArray) => GameEvent }> = [
  {
    type: 'item-gain',
    re: /<item-gain\b([^>]*)\/?>/gi,
    parse: (m) => {
      const attrs = Object.fromEntries(
        [...String(m[1] ?? '').matchAll(/(\w+)="([^"]*)"/g)].map((x) => [x[1].toLowerCase(), x[2]])
      );
      return {
        type: 'item-gain' as const,
        id: attrs.id || crypto.randomUUID(),
        name: attrs.name || '',
        qty: parseInt(attrs.qty ?? '1', 10) || 1,
        rarity: attrs.rarity || undefined,
        lootSource: attrs.source || attrs.lootsource || undefined,
      };
    },
  },
  {
    type: 'item-use',
    re: /<item-use\b([^>]*)\/?>/gi,
    parse: (m) => {
      const attrs = Object.fromEntries(
        [...String(m[1] ?? '').matchAll(/(\w+)="([^"]*)"/g)].map((x) => [x[1].toLowerCase(), x[2]])
      );
      return {
        type: 'item-use' as const,
        id: attrs.id || '',
        name: attrs.name || '',
        qty: parseInt(attrs.qty ?? '1', 10) || 1,
      };
    },
  },
  {
    type: 'heal',
    re: /<heal\s+amount="(\d+)"\s*\/>/gi,
    parse: (m) => ({ type: 'heal', amount: parseInt(m[1], 10) }),
  },
  {
    type: 'damage',
    re: /<damage\s+amount="(\d+)"\s*\/>/gi,
    parse: (m) => ({ type: 'damage', amount: parseInt(m[1], 10) }),
  },
  {
    // Updated to optionally extract the visualAnchor attribute
    type: 'lore-card',
    re: /<lore-card\s+id="([^"]*)"\s+name="([^"]*)"\s+type="([^"]*)"\s+keywords="([^"]*)"\s+summary="([^"]*)"(?:\s+visualAnchor="([^"]*)")?\s*\/>/gi,
    parse: (m) => ({
      type: 'lore-card',
      id: m[1],
      name: m[2],
      cardType: m[3] as LoreCardType,
      keywords: m[4].split(',').map((k) => k.trim()).filter(Boolean),
      summary: m[5],
      visualAnchor: m[6], // Extracted anchor
    }),
  },
  {
    type: 'quest-add',
    re: /<quest-add\s+id="([^"]*)"\s+name="([^"]*)"\s+type="([^"]*)"\s+description="([^"]*)"\s*\/>/gi,
    parse: (m) => ({
      type: 'quest-add',
      id: m[1],
      name: m[2],
      questType: (m[3] as QuestType) || 'side',
      description: m[4],
    }),
  },
  {
    type: 'quest-update',
    re: /<quest-update\s+id="([^"]*)"\s+objectiveId="([^"]*)"\s+completed="([^"]*)"\s*\/>/gi,
    parse: (m) => ({
      type: 'quest-update',
      id: m[1],
      objectiveId: m[2],
      completed: m[3] === 'true',
    }),
  },
  {
    type: 'quest-complete',
    re: /<quest-complete\s+id="([^"]*)"\s*\/>/gi,
    parse: (m) => ({
      type: 'quest-complete',
      id: m[1],
    }),
  },
  {
    type: 'dungeon-load',
    re: /<dungeon-load\s+(?:id|blueprintId|shape)="([^"]*)"\s+name="([^"]*)"(?:\s+procedural="(true|false)")?(?:\s+tier="(\d+)")?(?:\s+nodes="(\d+)")?\s*\/>/gi,
    parse: (m) => ({
      type: 'dungeon-load',
      blueprintId: m[1],
      dungeonName: m[2],
      isProcedural: m[3] === 'true',
      tier: m[4] ? (parseInt(m[4], 10) as MapTier) : 4,
      nodeCount: m[5] ? parseInt(m[5], 10) : undefined,
    }),
  },
  {
    type: 'dungeon-move',
    re: /<dungeon-move\s+(?:node|nodeId)="([^"]*)"\s*\/>/gi,
    parse: (m) => ({
      type: 'dungeon-move',
      nodeId: m[1],
    }),
  },
  {
    type: 'dungeon-exit',
    re: /<dungeon-exit\s*\/>/gi,
    parse: () => ({
      type: 'dungeon-exit',
    }),
  },
  {
    type: 'map-floor-change',
    re: /<map-floor-change\s+z="(-?\d+)"\s*\/>/gi,
    parse: (m) => ({
      type: 'map-floor-change',
      z: parseInt(m[1], 10),
    }),
  },
  {
    type: 'hex-move',
    re: /<hex-move\s+q="(-?\d+)"\s+r="(-?\d+)"(?:\s+tier="(\d+)")?(?:\s+z="(-?\d+)")?\s*\/>/gi,
    parse: (m) => ({
      type: 'hex-move',
      q: parseInt(m[1], 10),
      r: parseInt(m[2], 10),
      tier: m[3] ? (parseInt(m[3], 10) as MapTier) : undefined,
      z: m[4] ? parseInt(m[4], 10) : undefined,
    }),
  },
  {
    type: 'enemy-appear',
    // Attribute order varies; hp may be "18" or "18/30". Do not use [^/]* — "/" appears in hp.
    re: /<enemy\b([^>]*)\/?>/gi,
    parse: (m) => {
      const attrs = Object.fromEntries(
        [...String(m[1] ?? '').matchAll(/(\w+)="([^"]*)"/g)].map((x) => [x[1].toLowerCase(), x[2]])
      );
      const hpRaw = attrs.hp ?? '10';
      const hpParts = hpRaw.split('/');
      const cur = parseInt(hpParts[0] ?? '10', 10);
      const max = parseInt(hpParts[1] ?? hpParts[0] ?? '10', 10);
      return {
        type: 'enemy-appear' as const,
        enemyName: attrs.name || 'Enemy',
        enemyLevel: parseInt(attrs.level ?? '1', 10) || 1,
        enemyHp: Number.isFinite(cur) ? cur : 10,
        enemyMaxHp: Number.isFinite(max) ? max : Number.isFinite(cur) ? cur : 10,
        enemyAc: parseInt(attrs.ac ?? '10', 10) || 10,
        enemyStr: parseInt(attrs.str ?? '10', 10) || 10,
        enemyDex: parseInt(attrs.dex ?? '10', 10) || 10,
        enemyCon: parseInt(attrs.con ?? '10', 10) || 10,
        enemyXp: parseInt(attrs.xp ?? '0', 10) || 0,
        enemyGold: parseInt(attrs.gold ?? '0', 10) || 0,
      };
    },
  },
  {
    type: 'encounter-end',
    re: /<encounter-end\s*\/>/gi,
    parse: () => ({
      type: 'encounter-end',
    }),
  },
  {
    type: 'milestone-event',
    re: /<milestone-event\s+prompt="([^"]*)"\s*\/>/gi,
    parse: (m) => ({
      type: 'milestone-event',
      imagePromptText: m[1],
    }),
  },
  {
    type: 'campaign-ending',
    re: /<campaign-ending\b([^>]*)\/?>/gi,
    parse: (m) => {
      const attrs = Object.fromEntries(
        [...String(m[1] ?? '').matchAll(/(\w+)="([^"]*)"/g)].map((x) => [x[1].toLowerCase(), x[2]])
      );
      return {
        type: 'campaign-ending' as const,
        id: attrs.id?.trim() || undefined,
      };
    },
  },
  {
    type: 'loot-video',
    re: /<loot-video\s+item="([^"]*)"\s+rarity="([^"]*)"\s+prompt="([^"]*)"\s*\/>/gi,
    parse: (m) => ({
      type: 'loot-video',
      name: m[1],
      itemRarity: m[2],
      imagePromptText: m[3],
    }),
  },
  {
    type: 'visual-update',
    re: /<visual-update\s+description="([^"]*)"(?:\s+form-change="(true|false)")?\s*\/>/gi,
    parse: (m) => ({
      type: 'visual-update',
      visualDescription: m[1],
      formChange: m[2] === 'true',
    }),
  },
  {
    type: 'world-deal',
    re: /<world-deal\b([^>]*)\/?>/gi,
    parse: (m) => {
      const attrs = Object.fromEntries(
        [...String(m[1] ?? '').matchAll(/(\w+)="([^"]*)"/g)].map((x) => [x[1].toLowerCase(), x[2]])
      );
      const rawShare = parseFloat(attrs.share ?? '0.2');
      return {
        type: 'world-deal' as const,
        id: attrs.id,
        name: attrs.name || '',
        partner: attrs.partner || attrs.name || '',
        share: Number.isFinite(rawShare) ? rawShare : 0.2,
        risk: attrs.risk,
        runs: parseInt(attrs.runs ?? '2', 10) || 2,
        ethic: attrs.ethic,
      };
    },
  },
  {
    type: 'world-holding',
    re: /<world-holding\b([^>]*)\/?>/gi,
    parse: (m) => {
      const attrs = Object.fromEntries(
        [...String(m[1] ?? '').matchAll(/(\w+)="([^"]*)"/g)].map((x) => [x[1].toLowerCase(), x[2]])
      );
      return {
        type: 'world-holding' as const,
        id: attrs.id,
        name: attrs.name || '',
        holdingKind: attrs.kind,
        order: attrs.order,
        ethic: attrs.ethic,
      };
    },
  },
  {
    type: 'world-order',
    re: /<world-order\b([^>]*)\/?>/gi,
    parse: (m) => {
      const attrs = Object.fromEntries(
        [...String(m[1] ?? '').matchAll(/(\w+)="([^"]*)"/g)].map((x) => [x[1].toLowerCase(), x[2]])
      );
      return {
        type: 'world-order' as const,
        id: attrs.id,
        name: attrs.holding || attrs.name || '',
        order: attrs.order,
      };
    },
  },
  {
    type: 'world-clock',
    re: /<world-clock\b([^>]*)\/?>/gi,
    parse: (m) => {
      const attrs = Object.fromEntries(
        [...String(m[1] ?? '').matchAll(/(\w+)="([^"]*)"/g)].map((x) => [x[1].toLowerCase(), x[2]])
      );
      return {
        type: 'world-clock' as const,
        id: attrs.id,
        name: attrs.name || '',
        ethic: attrs.ethic,
      };
    },
  },
  {
    type: 'world-actor',
    re: /<world-actor\b([^>]*)\/?>/gi,
    parse: (m) => {
      const attrs = Object.fromEntries(
        [...String(m[1] ?? '').matchAll(/(\w+)="([^"]*)"/g)].map((x) => [x[1].toLowerCase(), x[2]])
      );
      return {
        type: 'world-actor' as const,
        id: attrs.id,
        name: attrs.name || '',
        ethic: attrs.ethic,
        summary: attrs.profession || attrs.summary,
        enemyLevel: parseInt(attrs.level ?? '1', 10) || 1,
      };
    },
  },
  {
    type: 'time-pass',
    re: /<time-pass\b([^>]*)\/?>/gi,
    parse: (m) => {
      const attrs = Object.fromEntries(
        [...String(m[1] ?? '').matchAll(/(\w+)="([^"]*)"/g)].map((x) => [x[1].toLowerCase(), x[2]])
      );
      return {
        type: 'time-pass' as const,
        amount: parseFloat(attrs.days ?? attrs.amount ?? '0') || 0,
      };
    },
  },
];

export function parseActionTags(text: string): GameEvent[] {
  const events: GameEvent[] = [];
  for (const { re, parse } of TAG_PATTERNS) {
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(text)) !== null) {
      events.push(parse(m));
    }
  }
  return events;
}

export function stripActionTags(text: string): string {
  // Use [^>]* (not [^/]*) so attributes like hp="18/30" still match.
  return text
    .replace(/<item-gain\b[^>]*\/?>/gi, '')
    .replace(/<item-use\b[^>]*\/?>/gi, '')
    .replace(/<heal\b[^>]*\/?>/gi, '')
    .replace(/<damage\b[^>]*\/?>/gi, '')
    .replace(/<lore-card\b[^>]*\/?>/gi, '')
    .replace(/<quest-add\b[^>]*\/?>/gi, '')
    .replace(/<quest-update\b[^>]*\/?>/gi, '')
    .replace(/<quest-complete\b[^>]*\/?>/gi, '')
    .replace(/<turn-frame\b[^>]*\/?>/gi, '')
    .replace(/<dungeon-load\b[^>]*\/?>/gi, '')
    .replace(/<dungeon-move\b[^>]*\/?>/gi, '')
    .replace(/<dungeon-exit\s*\/?>/gi, '')
    .replace(/<map-floor-change\b[^>]*\/?>/gi, '')
    .replace(/<hex-move\b[^>]*\/?>/gi, '')
    .replace(/<enemy\b[^>]*\/?>/gi, '')
    .replace(/<encounter-end\s*\/?>/gi, '')
    .replace(/<milestone-event\b[^>]*\/?>/gi, '')
    .replace(/<campaign-ending\b[^>]*\/?>/gi, '')
    .replace(/<loot-video\b[^>]*\/?>/gi, '')
    .replace(/<visual-update\b[^>]*\/?>/gi, '')
    .replace(/<world-deal\b[^>]*\/?>/gi, '')
    .replace(/<world-holding\b[^>]*\/?>/gi, '')
    .replace(/<world-order\b[^>]*\/?>/gi, '')
    .replace(/<world-clock\b[^>]*\/?>/gi, '')
    .replace(/<world-actor\b[^>]*\/?>/gi, '')
    .replace(/<time-pass\b[^>]*\/?>/gi, '')
    .replace(/<system-log>[\s\S]*?<\/system-log>/gi, '')
    .replace(/^[ \t]*(?:_>\s*)?SYSTEM LOG\s*$/gim, '')
    .replace(/<panel>[\s\S]*?<\/panel>/gi, '')
    .replace(/<image-prompt>[\s\S]*?<\/image-prompt>/gi, '')
    .replace(/<narrative>[\s\S]*?<\/narrative>/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function parsePanels(text: string): ComicPanel[] {
  const panels: ComicPanel[] = [];
  const panelRegex = /<panel>([\s\S]*?)<\/panel>/gi;
  let match;
  while ((match = panelRegex.exec(text)) !== null) {
    const body = match[1];
    const imagePromptMatch = body.match(/<image-prompt>([\s\S]*?)<\/image-prompt>/i);
    const narrativeMatch = body.match(/<narrative>([\s\S]*?)<\/narrative>/i);
    if (imagePromptMatch && narrativeMatch) {
      panels.push({
        imagePrompt: imagePromptMatch[1].trim(),
        narrative: narrativeMatch[1].trim(),
      });
    }
  }
  return panels;
}

export function parseTurnFrame(text: string): TurnFrameTheme | null {
  const m = text.match(/<turn-frame\s+([^/]*?)\/>/i);
  if (!m) return null;
  const attrs = m[1];
  const icon = attrs.match(/icon="([^"]*)"/i)?.[1];
  const accentColor = attrs.match(/accentColor="([^"]*)"/i)?.[1];
  const frameStyle = attrs.match(/frameStyle="([^"]*)"/i)?.[1];
  if (!icon || !accentColor || !frameStyle) return null;
  return { icon, accentColor, frameStyle };
}

export function eventsToEncounterUpdate(events: GameEvent[], current: ActiveEncounter | null): ActiveEncounter | null {
  let encounter = current;
  for (const e of events) {
    if (e.type === 'enemy-appear' && e.enemyName) {
      const cur = e.enemyHp ?? 10;
      const max = e.enemyMaxHp ?? cur;
      encounter = {
        name: e.enemyName,
        level: e.enemyLevel ?? 1,
        hp: cur,
        maxHp: max,
        armorClass: e.enemyAc ?? 10,
        strength: e.enemyStr ?? 10,
        dexterity: e.enemyDex ?? 10,
        constitution: e.enemyCon ?? 10,
        xpReward: e.enemyXp ?? 0,
        goldReward: e.enemyGold ?? 0,
      };
    } else if (e.type === 'encounter-end') {
      encounter = null;
    }
  }
  return encounter;
}

export function isLoreRevealed(card: LoreCard): boolean {
  return card.revealed === true || (card.lastSeenTurn ?? 0) > 0;
}

export function matchLoreCards(input: string, recentNarrative: string, lorebook: LoreCard[], limit = 7): LoreCard[] {
  if (lorebook.length === 0) return [];
  const haystack = `${input} ${recentNarrative}`.toLowerCase();
  // Unrevealed encyclopedia cards stay GM-background. Matching their titles into the
  // prompt is how "Dungeon Zones & Dead Zones" gets treated as the current place.
  const visible = lorebook.filter(isLoreRevealed);
  if (visible.length === 0) return [];
  const scored = visible
    .map((card) => {
      let score = 0;
      for (const kw of card.keywords) {
        if (haystack.includes(kw.toLowerCase())) score += 1;
      }
      if (haystack.includes(card.name.toLowerCase())) score += 2;
      return { card, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.card);
  return scored;
}

export function eventsToLoreCards(events: GameEvent[], currentTurn: number): LoreCard[] {
  return events
    .filter((e) => e.type === 'lore-card' && e.id && e.name && e.cardType)
    .map((e) => ({
      id: e.id!,
      name: e.name!,
      type: e.cardType!,
      keywords: e.keywords ?? [],
      summary: e.summary ?? '',
      visualAnchor: e.visualAnchor, // Maps parsed anchor to the state
      lastSeenTurn: currentTurn,
      revealed: true,
    }));
}

export interface MilestoneRequest {
  imagePrompt: string;
}

/** At most one milestone flag is honored per turn even if the model emits several. */
export function eventsToMilestone(events: GameEvent[]): MilestoneRequest | null {
  const e = events.find((ev) => ev.type === 'milestone-event' && ev.imagePromptText?.trim());
  return e ? { imagePrompt: e.imagePromptText!.trim() } : null;
}

export interface LootVideoRequest {
  itemName: string;
  itemRarity: string;
  imagePrompt: string;
}

/** At most one loot-video flag is honored per turn — these are meant to be rare/legendary. */
export function eventsToLootVideo(events: GameEvent[]): LootVideoRequest | null {
  const e = events.find((ev) => ev.type === 'loot-video' && ev.name && ev.imagePromptText?.trim());
  if (!e) return null;
  return {
    itemName: e.name!,
    itemRarity: e.itemRarity ?? 'Legendary',
    imagePrompt: e.imagePromptText!.trim(),
  };
}

/**
 * Heuristic safety net for radical base-form/species transformations, used alongside (not
 * instead of) the GM's explicit `form-change="true"` flag on `<visual-update>` — models
 * forget to set flags, but rarely fail to describe a transformation in the text itself.
 */
const FORM_CHANGE_PATTERNS = [
  /\b(reptil|serpentine|drakon|dragon-?kin|were-?\w+|lycanthrop|polymorph(?:ed)?|shape-?shift(?:ed)?)\b/i,
  /\btransform(?:ed|s)?\s+into\b/i,
  /\b(turned|morphed|mutated|shrunk|shrank)\s+into\b/i,
  /\bno longer (?:look|looks|appear|appears)\s+(?:human|humanoid)\b/i,
  /\b(beast|feral|monstrous|inhuman|amorphous|ooze|slime|undead|skeleton|golem|construct|elemental)\s+(?:form|body|creature)\b/i,
  /\bsmall (?:reptilian|lizard|scaled)\s+creature\b/i,
];

export function isRadicalFormChange(description: string): boolean {
  if (!description) return false;
  return FORM_CHANGE_PATTERNS.some((re) => re.test(description));
}

export interface VisualUpdateRequest {
  description: string;
  /** GM-flagged OR heuristically-detected radical base-form/species change. */
  formChange: boolean;
}

/** Player's own canonical appearance can change mid-game (new gear, transformation, injury). */
export function eventsToVisualUpdate(events: GameEvent[]): VisualUpdateRequest | null {
  const e = events.find((ev) => ev.type === 'visual-update' && ev.visualDescription?.trim());
  if (!e) return null;
  const description = e.visualDescription!.trim();
  return { description, formChange: !!e.formChange || isRadicalFormChange(description) };
}

export function eventsToQuestUpdates(events: GameEvent[], currentQuests: Quest[] = [], turn = 0): Quest[] {
  let updatedQuests = [...currentQuests];

  for (const e of events) {
    if (e.type === 'quest-add' && e.id && e.name) {
      const exists = updatedQuests.some((q) => q.id === e.id);
      if (!exists) {
        const newQuest: Quest = {
          id: e.id,
          name: e.name,
          description: e.description ?? '',
          type: e.questType ?? 'side',
          status: 'active',
          revealed: true,
          revealedTurn: turn,
          activatedTurn: turn,
          minTurnsBeforeComplete: 1,
          objectives: [],
        };
        updatedQuests.push(newQuest);
      }
    } else if (e.type === 'quest-update' && e.id && e.objectiveId) {
      updatedQuests = updatedQuests.map((q) => {
        if (q.id !== e.id) return q;
        const objectives = q.objectives ?? [];
        const objExists = objectives.some((o) => o.id === e.objectiveId);
        const updatedObjs = objExists
          ? objectives.map((o) => (o.id === e.objectiveId ? { ...o, completed: !!e.completed } : o))
          : [...objectives, { id: e.objectiveId!, description: e.objectiveId!, completed: !!e.completed }];
        return {
          ...q,
          revealed: true,
          revealedTurn: q.revealedTurn ?? turn,
          activatedTurn: q.activatedTurn ?? turn,
          status: q.status === 'hidden' ? 'active' : q.status,
          objectives: updatedObjs,
        };
      });
    } else if (e.type === 'quest-complete' && e.id) {
      const q = updatedQuests.find((x) => x.id === e.id);
      if (!q) continue;
      const activated = q.activatedTurn ?? q.revealedTurn ?? turn;
      const min = q.minTurnsBeforeComplete ?? 1;
      if (q.status === 'hidden' || turn - activated < min) {
        // Block same-turn create→complete (Hidden Door anti-pattern)
        continue;
      }
      updatedQuests = updatedQuests.map((quest) =>
        quest.id === e.id
          ? { ...quest, status: 'completed' as QuestStatus, revealed: true, completedTurn: turn }
          : quest
      );
    }
  }

  return updatedQuests;
}