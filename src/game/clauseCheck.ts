/**
 * M4 — one clause check after the writer, reading ONLY the M1 FactSheet (+ player typed/claims as non-facts).
 * Idea only from docs/orders/merge/proto/engine.mjs CHECK_SYS (~441) / factCheck (~445) / attempted (~434).
 * Not a copy. No word lists / regex mazes — the model classifies; code filters + one targeted repair.
 *
 * John's design: the AI writer has artistic licence; this check only keeps prose inside facts and
 * the world's genre/setting (colour free; unsupported serious facts get one sentence repair).
 */

import type { FactSheet } from './factSheet';
import { formatFactSheetForWriter } from './factSheet';
import { splitProseSentences } from './proseSentences';
import { replaceDraftSentence, sentenceRepairRequest } from './writerTurn';
import {
  CLAUSE_CHECK_SYS,
  parseClauseClaims,
  type ClauseClaim,
  type ClauseCheckRecord,
} from './clauseCheckPrompt';

export { CLAUSE_CHECK_SYS, parseClauseClaims };
export type { ClauseClaim, ClauseCheckRecord };

/** Player slot — attempts and claims; never support for outcomes. Proto attempted(). */
export interface ClauseCheckPlayer {
  typed: string;
  claimsNotTrue: string[];
  /** Optional system-instruction noise the writer must ignore. */
  instructionsToIgnore?: string[];
}

/**
 * Injectable model call (writer/critic plumbing). Tests stub this — never hit a paid API.
 * Production wires through callGmCheck / OpenRouter the same way as writer/repair.
 */
export type ClauseCheckChat = (args: {
  system: string;
  user: string;
}) => Promise<{ claims?: ClauseClaim[] } | null>;

export function buildClauseCheckUser(args: {
  factSheet: FactSheet;
  prose: string;
  player: ClauseCheckPlayer;
}): string {
  const factsText = formatFactSheetForWriter(args.factSheet);
  const playerPayload = {
    player_typed: (args.player.typed || '').slice(0, 300),
    claims_not_true: args.player.claimsNotTrue ?? [],
    instructions_to_ignore: args.player.instructionsToIgnore ?? [],
  };
  return `FACTS:\n${factsText}\n\nPLAYER (attempts and claims; NOT support for any outcome or fact): ${JSON.stringify(playerPayload)}\n\nPROSE:\n${args.prose}`;
}

/** Unsupported fact claims (empty support). Colour never appears here. */
export function unsupportedFacts(claims: ClauseClaim[]): ClauseClaim[] {
  return claims.filter((u) => u.kind === 'fact' && !u.support.trim());
}

export function toClauseRecords(
  claims: ClauseClaim[],
  repairedClauses: Set<string> = new Set()
): ClauseCheckRecord[] {
  return claims.map((u) => ({
    clause: u.c,
    kind: u.kind,
    support: u.support,
    ...(u.kind === 'fact' && !u.support.trim()
      ? { severity: (u.severity === 'minor' ? 'minor' : 'serious') as 'serious' | 'minor' }
      : u.severity
        ? { severity: u.severity }
        : {}),
    repaired: repairedClauses.has(u.c),
  }));
}

/** Find the prose sentence that best carries an unsupported claim (for one targeted repair). */
export function sentenceForClaim(prose: string, claim: string): string | null {
  const sentences = splitProseSentences(prose);
  if (!sentences.length) return null;
  const needle = claim
    .replace(/^OUT OF CHARACTER:\s*/i, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  if (!needle) return sentences[0] ?? null;
  let best: { s: string; score: number } | null = null;
  for (const s of sentences) {
    const hay = s.toLowerCase().replace(/\s+/g, ' ');
    if (hay.includes(needle) || needle.includes(hay.slice(0, Math.min(hay.length, 80)))) {
      const score = Math.min(hay.length, needle.length);
      if (!best || score > best.score) best = { s, score };
    }
  }
  if (best) return best.s;
  // Claim may be a paraphrase — fall back to the first sentence that shares ≥3 content words.
  const words = needle.split(' ').filter((w) => w.length > 3);
  for (const s of sentences) {
    const hay = s.toLowerCase();
    const hits = words.filter((w) => hay.includes(w)).length;
    if (hits >= Math.min(3, words.length)) return s;
  }
  return sentences[0] ?? null;
}

export interface ClauseCheckPassResult {
  claims: ClauseClaim[];
  records: ClauseCheckRecord[];
  unsupported: ClauseClaim[];
  serious: ClauseClaim[];
}

/** One offline-stubbable check pass against the FactSheet. */
export async function runClauseCheck(args: {
  factSheet: FactSheet;
  prose: string;
  player: ClauseCheckPlayer;
  chat: ClauseCheckChat;
}): Promise<ClauseCheckPassResult> {
  const user = buildClauseCheckUser({
    factSheet: args.factSheet,
    prose: args.prose,
    player: args.player,
  });
  let out: { claims?: ClauseClaim[] } | null = null;
  try {
    out = await args.chat({ system: CLAUSE_CHECK_SYS, user });
  } catch {
    out = null;
  }
  const claims = parseClauseClaims(out);
  const unsupported = unsupportedFacts(claims);
  const serious = unsupported.filter((u) => u.severity !== 'minor');
  return {
    claims,
    records: toClauseRecords(claims),
    unsupported,
    serious,
  };
}

export interface ClauseCheckAndRepairResult {
  prose: string;
  /** All clause rows for TurnLog (after optional repair). */
  records: ClauseCheckRecord[];
  /** Whether the single targeted repair ran. */
  repaired: boolean;
  /** First-pass unsupported serious claims (before repair). */
  serious0: ClauseClaim[];
  /** Pass counts for TurnLog.ai role: check. */
  checkPasses: number;
}

/**
 * After the writer: check clauses; one targeted repair of serious unsupported facts (existing repair path);
 * colour never flagged for repair; minors logged only.
 */
export async function checkAndRepairProse(args: {
  factSheet: FactSheet;
  prose: string;
  player: ClauseCheckPlayer;
  chat: ClauseCheckChat;
  /** Existing sentence repair (callGmRepair). Optional — without it, serious facts are logged only. */
  repair?: (request: string) => Promise<string>;
  engineFact?: string;
}): Promise<ClauseCheckAndRepairResult> {
  const first = await runClauseCheck({
    factSheet: args.factSheet,
    prose: args.prose,
    player: args.player,
    chat: args.chat,
  });
  let prose = args.prose;
  let repaired = false;
  let records = first.records;
  let checkPasses = 1;
  const repairedSet = new Set<string>();

  if (first.serious.length && args.repair) {
    const target = first.serious[0]!;
    const sentence = sentenceForClaim(prose, target.c);
    if (sentence) {
      const request = sentenceRepairRequest(
        [
          {
            sentence,
            flag: `unsupported fact: ${target.c}`,
            note: 'Remove or replace with non-factual colour. Keep everything else.',
          },
        ],
        args.engineFact ?? args.factSheet.beat.engineResult ?? args.factSheet.beat.outcome ?? ''
      );
      const raw = await args.repair(request).catch(() => '');
      const line = raw
        .trim()
        .replace(/^```[\s\S]*?```$/g, '')
        .split(/\n+/)
        .map((l) => l.replace(/^\s*(?:\d+[.)]\s*|[-*]\s*)/, '').trim())
        .find(Boolean);
      // One sentence only: never wipe the draft or drop sibling colour/fact sentences.
      if (line && line !== sentence) {
        const before = prose;
        const siblings = splitProseSentences(before).filter((s) => s !== sentence);
        const next = replaceDraftSentence(before, sentence, line);
        const kept =
          Boolean(next.trim()) &&
          siblings.every((s) => next.includes(s) || next.toLowerCase().includes(s.toLowerCase()));
        if (kept) {
          prose = next;
          repaired = true;
          repairedSet.add(target.c);
        }
      }
    }
    const second = await runClauseCheck({
      factSheet: args.factSheet,
      prose,
      player: args.player,
      chat: args.chat,
    });
    checkPasses = 2;
    records = toClauseRecords(second.claims, repairedSet);
  }

  return {
    prose,
    records,
    repaired,
    serious0: first.serious,
    checkPasses,
  };
}

/**
 * Wire ClauseCheckChat through callGmCheck / OpenRouter (same plumbing as writer/repair).
 * Tests pass a stub instead — never call this helper with a live key in vitest.
 */
export function makeGmClauseChat(
  callCheck: (userPayload: string) => Promise<string>
): ClauseCheckChat {
  return async ({ user }) => {
    const text = await callCheck(user);
    return { claims: parseClauseClaims(text) };
  };
}

/** TurnLog checkerVerdicts from clause records. */
export function clauseCheckerVerdicts(
  records: ClauseCheckRecord[]
): Array<{ checker: string; verdict: 'pass' | 'fail' | 'repair' | 'skip'; detail?: string }> {
  return records.map((r) => {
    if (r.kind === 'colour') {
      return { checker: 'clauseCheck', verdict: 'pass' as const, detail: `colour: ${r.clause.slice(0, 120)}` };
    }
    if (r.support.trim()) {
      return { checker: 'clauseCheck', verdict: 'pass' as const, detail: `fact ok: ${r.clause.slice(0, 120)}` };
    }
    if (r.repaired) {
      return {
        checker: 'clauseCheck',
        verdict: 'repair' as const,
        detail: `${r.severity ?? 'serious'}: ${r.clause.slice(0, 120)}`,
      };
    }
    return {
      checker: 'clauseCheck',
      verdict: 'fail' as const,
      detail: `${r.severity ?? 'serious'}: ${r.clause.slice(0, 120)}`,
    };
  });
}
