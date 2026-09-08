/**
 * Batch 08c — Free MUD-modern presentation (Option 2).
 * Batch 08d — Silent Engine: receipts only (no DeepSeek micro-flavor calls).
 * Batch 08e — Sparse flavor: DeepSeek ONLY on lethal / level-up / new HERE / first Talk.
 * Free is NOT a 50–100 word Retrospective Narrator novelist on this path.
 */

import type { CompletedEventPacket } from './completedEventPacket';
import type { GameState, SceneFacts } from './types';
import { matchesLastKillName } from './combatAuthority';
import type { HostedAiTier } from './testLab';
import { effectiveWriterTier } from './testLab';

/** Feature lock — Free path only. Mid novelization stays future upsell. */
export const FREE_MUD_PRESENTATION_ENABLED = true;

/**
 * 08d Silent Engine — no Free flavor micro-prompt / DeepSeek calls.
 * 08e branch default: false (sparse thresholds own flavor).
 */
export const SILENT_ENGINE = false;

/**
 * 08e Sparse flavor — Free mud path calls DeepSeek only on thresholds.
 * When true with SILENT_ENGINE false: not every-turn (08c), not silent (08d).
 */
export const SPARSE_FLAVOR = true;

export type MudPresentationKind = 'mud-receipt' | 'standard';

export type SparseFlavorKind = 'lethal' | 'level-up' | 'arrival' | 'first-talk';

export type FreeMudTurn = {
  /** Optional 1-sentence flavor (may be empty). */
  content: string;
  flavorQuote: string;
  /** Code-owned receipt lines — primary Free story surface. */
  receiptLines: string[];
  presentation: MudPresentationKind;
  flavorSource: 'ai' | 'none';
};

export type SparseFlavorContext = {
  state: GameState;
  packet: CompletedEventPacket;
  arcReceipts?: string[];
};

export type MicroFlavorPlan = {
  skip: boolean;
  kind: SparseFlavorKind | null;
  prompt: string;
  state: GameState;
};

const INSTRUCTION_VOICE =
  /\b(my instruction|you should|do the following|as an ai|write a|narrate this|completed event)\b/i;
const NUMBERED_LIST = /^\s*\d+[\.)]\s+/m;
const MULTI_SENTENCE = /[.!?]["']?\s+[A-Z]/;
const CHROME_LEAK =
  /\b(?:HERE:|ACT:|OUTCOME:|CLEAR:|CORPSE:|CAST:|XP:|DMG:|ENCOUNTER:)|(?:FOE HP|SNAPSHOT|CRAFT|STATUS|Level Up!)/i;

export function shouldUseFreeMudPresentation(
  subscriptionTier: HostedAiTier | string | undefined
): boolean {
  if (!FREE_MUD_PRESENTATION_ENABLED) return false;
  return effectiveWriterTier(subscriptionTier) === 'free';
}

/**
 * True when Silent Engine is on (no flavor calls at all).
 * Under SPARSE_FLAVOR, use `planMicroFlavor` — do not treat this as sparse skip.
 */
export function shouldSkipMicroFlavor(): boolean {
  return SILENT_ENGINE === true;
}

function normKey(raw: string): string {
  return String(raw ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function sparseMemory(state: GameState): NonNullable<SceneFacts['sparseFlavor']> {
  return {
    arrivalKeys: [...(state.sceneFacts?.sparseFlavor?.arrivalKeys ?? [])],
    talkKeys: [...(state.sceneFacts?.sparseFlavor?.talkKeys ?? [])],
  };
}

function inferWeaponNoun(packet: CompletedEventPacket): string {
  const pool = [...(packet.allowlist ?? []), packet.playerAction, packet.verb]
    .join(' ')
    .toLowerCase();
  if (/\b(sword|blade|knife|dagger|axe|mace|spear|bow|arrow|staff|club|fist|steel)\b/.test(pool)) {
    const m = pool.match(/\b(sword|blade|knife|dagger|axe|mace|spear|bow|arrow|staff|club|fist|steel)\b/);
    return m?.[1] ?? 'steel';
  }
  return 'steel';
}

function corpseOrFoeNoun(packet: CompletedEventPacket): string {
  const name = packet.lastKill?.name ?? packet.target ?? 'foe';
  const last = name.trim().split(/\s+/).pop() ?? 'foe';
  return last.toLowerCase();
}

/** Resolve which sparse threshold fires this turn (priority order). */
export function resolveSparseFlavorThreshold(
  ctx: SparseFlavorContext
): SparseFlavorKind | null {
  const { packet, state, arcReceipts = [] } = ctx;
  const mem = sparseMemory(state);

  if (packet.justKilled || packet.outcome === 'killed') {
    return 'lethal';
  }

  if (arcReceipts.some((r) => /Level Up!/i.test(String(r ?? '')))) {
    return 'level-up';
  }

  const arrived =
    packet.outcome === 'arrived'
    || packet.verb === 'traveled'
    || packet.verb === 'left';
  if (arrived) {
    const here = normKey(packet.location);
    if (here && !mem.arrivalKeys.includes(here)) return 'arrival';
  }

  if (packet.verb === 'spoke' && packet.target) {
    if (matchesLastKillName(packet.target, packet.lastKill ?? state.sceneFacts?.lastKill)) {
      return null;
    }
    const talkKey = normKey(packet.target);
    if (talkKey && !mem.talkKeys.includes(talkKey)) return 'first-talk';
  }

  return null;
}

/** Persist threshold memory so arrival/first-talk fire once per key. */
export function rememberSparseFlavor(
  state: GameState,
  kind: SparseFlavorKind,
  packet: CompletedEventPacket
): GameState {
  const mem = sparseMemory(state);
  if (kind === 'arrival') {
    const here = normKey(packet.location);
    if (here && !mem.arrivalKeys.includes(here)) mem.arrivalKeys.push(here);
  } else if (kind === 'first-talk' && packet.target) {
    const talkKey = normKey(packet.target);
    if (talkKey && !mem.talkKeys.includes(talkKey)) mem.talkKeys.push(talkKey);
  } else {
    return state;
  }
  return {
    ...state,
    sceneFacts: {
      ...(state.sceneFacts ?? {
        crowd: 'unknown',
        noise: 'unknown',
        present: [],
        props: [],
        lastBeat: '',
        updatedTurn: state.turn,
      }),
      sparseFlavor: {
        arrivalKeys: mem.arrivalKeys.slice(-40),
        talkKeys: mem.talkKeys.slice(-40),
      },
    },
  };
}

/**
 * Ultra-lean sparse prompts — one sentence; ledger nouns; fail-closed NONE.
 */
export function formatSparseFlavorPrompt(
  packet: CompletedEventPacket,
  kind: SparseFlavorKind
): string {
  const allow = packet.allowlist.length
    ? packet.allowlist.slice(0, 8).join(', ')
    : 'none';
  if (kind === 'lethal') {
    const noun = corpseOrFoeNoun(packet);
    const weapon = inferWeaponNoun(packet);
    return [
      `Write exactly one sentence describing ${noun} dying by ${weapon}.`,
      'No names. No pronouns. No lists. No second sentence.',
      'If you cannot stay inside the ledger, reply with exactly: NONE',
      `YOU MAY ONLY MENTION: ${allow}.`,
    ].join(' ');
  }
  if (kind === 'level-up') {
    return [
      'Write exactly one sentence describing a level threshold crossing as a quiet body rush.',
      'No names. No pronouns inventing people. No XP numbers. No lists.',
      'If you cannot, reply with exactly: NONE',
      `YOU MAY ONLY MENTION: ${allow}.`,
    ].join(' ');
  }
  if (kind === 'arrival') {
    const place = packet.location || 'here';
    return [
      `Write exactly one sentence describing arrival at ${place}.`,
      'No invented people. No pronouns inventing cast. No lists.',
      'If you cannot, reply with exactly: NONE',
      `YOU MAY ONLY MENTION: ${allow}.`,
    ].join(' ');
  }
  const who = packet.target || 'someone';
  return [
    `Write exactly one spoken or gestured first-meeting sentence with ${who}.`,
    'Past tense. No lists. No invented loot or places.',
    'If you cannot stay inside the allowlist, reply with exactly: NONE',
    `YOU MAY ONLY MENTION: ${allow}.`,
  ].join(' ');
}

/**
 * Plan whether this Free mud turn requests DeepSeek flavor.
 * Marks arrival/first-talk memory when a threshold fires (even if AI later fails).
 */
export function planMicroFlavor(ctx: SparseFlavorContext): MicroFlavorPlan {
  if (SILENT_ENGINE) {
    return { skip: true, kind: null, prompt: '', state: ctx.state };
  }
  if (!SPARSE_FLAVOR) {
    return {
      skip: false,
      kind: null,
      prompt: formatMicroFlavorPrompt(ctx.packet),
      state: ctx.state,
    };
  }
  const kind = resolveSparseFlavorThreshold(ctx);
  if (!kind) {
    return { skip: true, kind: null, prompt: '', state: ctx.state };
  }
  return {
    skip: false,
    kind,
    prompt: formatSparseFlavorPrompt(ctx.packet, kind),
    state: rememberSparseFlavor(ctx.state, kind, ctx.packet),
  };
}

/** Factual receipt from sealed packet + ArcDirector STATUS lines — never AI. */
export function buildFactualReceipt(
  packet: CompletedEventPacket,
  arcReceipts: string[] = [],
  extras?: { locationBefore?: string; gold?: number; hp?: { current: number; max: number } }
): string[] {
  const lines: string[] = [];
  const loc = packet.location?.trim();
  if (loc) lines.push(`HERE: ${loc}`);

  const verbLine = packet.target
    ? `ACT: ${packet.verb} → ${packet.target}`
    : `ACT: ${packet.verb}`;
  lines.push(verbLine);
  lines.push(`OUTCOME: ${packet.outcome}`);

  if (packet.damage != null && packet.damage > 0) {
    lines.push(`DMG: ${packet.damage}`);
  }
  const hp = packet.hp ?? extras?.hp;
  if (hp && Number.isFinite(hp.current) && Number.isFinite(hp.max)) {
    lines.push(`FOE HP: ${hp.current}/${hp.max}`);
  }
  if (packet.justKilled && packet.lastKill?.name) {
    lines.push(`CLEAR: ${packet.lastKill.name}`);
  } else if (packet.lastKill?.name && packet.lastKill.remains) {
    lines.push(`CORPSE: ${packet.lastKill.name}`);
  }
  if (packet.xp > 0) lines.push(`XP: +${packet.xp}`);
  if (packet.loot.length) lines.push(`LOOT: ${packet.loot.join(', ')}`);
  if (packet.witnesses.length) {
    lines.push(`CAST: ${packet.witnesses.slice(0, 4).join(', ')}`);
  }
  if (packet.combatLive) lines.push('ENCOUNTER: live');
  else if (packet.phase === 'pending') lines.push('ENCOUNTER: pending');
  else if (packet.phase === 'cleared') lines.push('ENCOUNTER: cleared');

  for (const r of arcReceipts) {
    const t = String(r ?? '').replace(/\s+/g, ' ').trim();
    if (!t) continue;
    if (lines.some((l) => l.toLowerCase() === t.toLowerCase())) continue;
    // Keep Arc STATUS readable but receipt-shaped
    if (/^XP Gained:/i.test(t)) lines.push(t.replace(/^XP Gained:\s*/i, 'XP: '));
    else if (/^Encounter:/i.test(t)) lines.push(t.toUpperCase().startsWith('ENCOUNTER') ? t : `ENCOUNTER: ${t.replace(/^Encounter:\s*/i, '')}`);
    else lines.push(t);
  }

  if (extras?.gold != null && Number.isFinite(extras.gold)) {
    lines.push(`GOLD: ${extras.gold}`);
  }

  return lines.slice(0, 14);
}

/**
 * Micro-prompt only: one sensory/dialogue sentence from the sealed event.
 * Noun allowlist; never invent items/people/outcomes. (08c every-turn path)
 */
export function formatMicroFlavorPrompt(packet: CompletedEventPacket): string {
  const target = packet.target ? ` ${packet.target}` : '';
  const lines = [
    'Write ONE short sensory or spoken flavor sentence for this completed game event.',
    'Past tense. No lists. No instructions. No second sentence.',
    'Do not invent items, people, places, damage, XP, or outcomes not listed.',
    'If you cannot stay inside the allowlist, reply with exactly: NONE',
    '',
    `Event: You ${packet.verb}${target}. Outcome: ${packet.outcome}.`,
    `Location: ${packet.location}.`,
  ];
  if (packet.justKilled && packet.lastKill?.name) {
    lines.push(`Corpse only: ${packet.lastKill.name}.`);
  }
  if (packet.witnesses.length) {
    lines.push(`People here: ${packet.witnesses.join(', ')}.`);
  }
  lines.push(`YOU MAY ONLY MENTION: ${packet.allowlist.length ? packet.allowlist.join(', ') : 'none'}.`);
  lines.push('');
  lines.push(`PLAYER: ${packet.playerAction || '(act)'}`);
  return lines.join('\n').trim();
}

function titleCaseTokens(text: string): string[] {
  const out: string[] = [];
  const re = /\b((?:[A-Z][a-z]+(?:-[A-Z][a-z]+)?\s+){0,2}[A-Z][a-z]+(?:-[A-Z][a-z]+)?)\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const tok = m[1]?.trim();
    if (tok) out.push(tok);
  }
  return out;
}

function allowlistCovers(allowlist: string[], token: string): boolean {
  const t = token.trim().toLowerCase();
  if (!t) return true;
  const starters = new Set([
    'the', 'a', 'an', 'you', 'your', 'then', 'after', 'before', 'when', 'while',
    'but', 'and', 'so', 'now', 'there', 'this', 'that', 'its', 'his', 'her',
    'their', 'our', 'my', 'once', 'still', 'next', 'last', 'first', 'air',
    'dust', 'stone', 'light', 'shadow', 'voice', 'silence', 'breath', 'floor',
    'wall', 'door', 'street', 'lane', 'room', 'blood', 'steel', 'blade',
  ]);
  if (starters.has(t)) return true;
  return allowlist.some((n) => {
    const a = n.toLowerCase();
    if (a === t || a.includes(t) || t.includes(a)) return true;
    const last = a.split(/\s+/).pop() ?? '';
    return last.length >= 4 && (last === t || t.endsWith(` ${last}`));
  });
}

/**
 * Gate: ≤1 sentence, no invent Title-Case outside allowlist, no instruction voice,
 * no receipt/chrome leak (08e fail-closed).
 */
export function gateMicroFlavorQuote(
  raw: string,
  packet: CompletedEventPacket
): { ok: true; quote: string } | { ok: false; reason: string } {
  let text = String(raw ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text || /^none\.?$/i.test(text)) {
    return { ok: false, reason: 'empty' };
  }
  // Take first sentence only
  const first = text.match(/^(.+?[.!?])(?:\s|$)/)?.[1] ?? text;
  text = first.trim();
  if (text.length < 8) return { ok: false, reason: 'too-short' };
  if (text.length > 220) return { ok: false, reason: 'too-long' };
  if (NUMBERED_LIST.test(text)) return { ok: false, reason: 'list' };
  if (INSTRUCTION_VOICE.test(text)) return { ok: false, reason: 'instruction' };
  if (CHROME_LEAK.test(text)) return { ok: false, reason: 'chrome-leak' };
  if (MULTI_SENTENCE.test(text.slice(0, -1))) {
    // already sliced to first sentence; soft OK
  }
  for (const tok of titleCaseTokens(text)) {
    if (!allowlistCovers(packet.allowlist, tok)) {
      return { ok: false, reason: `invent:${tok}` };
    }
  }
  // Living lastKill talk
  if (
    packet.lastKill?.name
    && packet.lastKill.remains
    && !packet.combatLive
    && new RegExp(`\\b${packet.lastKill.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)
    && /\b(says|asks|nods|grins|looks up|answers|stirs)\b/i.test(text)
  ) {
    return { ok: false, reason: 'living-lastKill' };
  }
  return { ok: true, quote: text };
}

/** Compose Free turn: receipt always; flavor only if AI gate passes (off under Silent / non-threshold sparse). */
export function composeFreeMudTurn(
  packet: CompletedEventPacket,
  opts: {
    arcReceipts?: string[];
    flavorRaw?: string;
    gold?: number;
    /** Force silent even if SILENT_ENGINE later flips — tests / callers. */
    silent?: boolean;
  } = {}
): FreeMudTurn {
  const receiptLines = buildFactualReceipt(packet, opts.arcReceipts ?? [], {
    gold: opts.gold,
  });
  // Callers pass silent:true for non-threshold sparse / full Silent Engine.
  const silent = opts.silent === true || SILENT_ENGINE === true;
  if (silent) {
    return {
      content: '',
      flavorQuote: '',
      receiptLines,
      presentation: 'mud-receipt',
      flavorSource: 'none',
    };
  }
  const gated = gateMicroFlavorQuote(opts.flavorRaw ?? '', packet);
  const flavorQuote = gated.ok ? gated.quote : '';
  return {
    content: flavorQuote,
    flavorQuote,
    receiptLines,
    presentation: 'mud-receipt',
    flavorSource: gated.ok ? 'ai' : 'none',
  };
}

/** Display helper — receipt body for TTS / dumps when quote empty. */
export function mudDisplayBody(turn: FreeMudTurn): string {
  if (turn.flavorQuote.trim()) return turn.flavorQuote.trim();
  return turn.receiptLines.join('\n');
}
