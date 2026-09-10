/**
 * Batch 08c — Free MUD-modern presentation (Option 2).
 * Batch 08d — Silent Engine: receipts only (no DeepSeek micro-flavor calls).
 * Free is NOT a 50–100 word Retrospective Narrator novelist on this path.
 */

import { assemblePacketStitch, type CompletedEventPacket } from './completedEventPacket';
import { hallTalkAsksPanel } from './openingEstablishment';
import type { HostedAiTier } from './testLab';
import { effectiveWriterTier } from './testLab';

/** Feature lock — Free path only. Mid novelization stays future upsell. */
export const FREE_MUD_PRESENTATION_ENABLED = true;

/**
 * 08d Silent Engine — no Free flavor micro-prompt / DeepSeek calls.
 * Receipts only (100% mechanical). Flip false to restore 08c Option 2 flavor.
 */
export const SILENT_ENGINE = true;

export type MudPresentationKind = 'mud-receipt' | 'standard';

export type FreeMudTurn = {
  /** Optional 1-sentence flavor (may be empty). */
  content: string;
  flavorQuote: string;
  /** Code-owned receipt lines — primary Free story surface. */
  receiptLines: string[];
  presentation: MudPresentationKind;
  flavorSource: 'ai' | 'none';
};

const INSTRUCTION_VOICE =
  /\b(my instruction|you should|do the following|as an ai|write a|narrate this|completed event)\b/i;
const NUMBERED_LIST = /^\s*\d+[\.)]\s+/m;
const MULTI_SENTENCE = /[.!?]["']?\s+[A-Z]/;

export function shouldUseFreeMudPresentation(
  subscriptionTier: HostedAiTier | string | undefined
): boolean {
  if (!FREE_MUD_PRESENTATION_ENABLED) return false;
  return effectiveWriterTier(subscriptionTier) === 'free';
}

/** True when Free mud path should skip the AI flavor round-trip entirely. */
export function shouldSkipMicroFlavor(): boolean {
  return SILENT_ENGINE === true;
}

/**
 * Look / wait / combat / travel stay Silent receipts.
 * Talk and questions must hit callGm — Silent talk is the one-line "game over" lock.
 */
export function isSilentReceiptAction(raw: string): boolean {
  const t = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return false;
  if (hallTalkAsksPanel(t)) return false;
  if (
    /\b(ask|talk|speak|tell|say |who are you|where am|what'?s going on|what is going on|what do (?:you|they) want|what they want|why should i|my name is|call me)\b/i.test(
      t
    )
  ) {
    return false;
  }
  if (/\b(attack|fight|strike|engage|flee|retreat|loot|press the attack)\b/i.test(t)) return true;
  if (/\b(wait|rest|stay|hold)\b/i.test(t)) return true;
  if (/\b(look around|inspect|examine|search|scout)\b/i.test(t)) return true;
  if (/\b(travel|go to|head (?:to|toward)|leave the scene|walk away)\b/i.test(t)) return true;
  return false;
}

/** Free Silent mud only for receipt verbs after covers — not conversation. */
export function shouldUseSilentMudTurn(opts: {
  subscriptionTier?: string;
  openingComplete?: boolean;
  freeOpeningTurn?: boolean;
  playerInput: string;
}): boolean {
  if (!SILENT_ENGINE) return false;
  if (opts.freeOpeningTurn) return false;
  if (opts.openingComplete !== true) return false;
  if (!shouldUseFreeMudPresentation(opts.subscriptionTier)) return false;
  return isSilentReceiptAction(opts.playerInput);
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
 * Noun allowlist; never invent items/people/outcomes.
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
 * Gate: ≤1 sentence, no invent Title-Case outside allowlist, no instruction voice.
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

/** Compose Free turn: receipt always; flavor only if AI gate passes (off under Silent Engine). */
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
  const silent = opts.silent === true || shouldSkipMicroFlavor();
  if (silent) {
    return {
      content: assemblePacketStitch(packet),
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

/** Display helper — authored stitch, then flavor, then receipt dump. */
export function mudDisplayBody(turn: FreeMudTurn): string {
  if (turn.content.trim()) return turn.content.trim();
  if (turn.flavorQuote.trim()) return turn.flavorQuote.trim();
  return turn.receiptLines.join('\n');
}
