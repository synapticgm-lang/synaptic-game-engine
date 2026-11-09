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
/** Why a withheld check dropped the draft. The gate still drops it in every one of these cases. */
export type ClauseWithholdCause =
  | 'threw'
  | 'empty'
  | 'parse'
  | 'no-clauses'
  | 'serious'
  | 'uncovered'
  | 'repair-dropped';

export type ClauseCheckChat = (args: {
  system: string;
  user: string;
}) => Promise<{ claims?: ClauseClaim[]; diagnostic?: ClauseWithholdCause } | null>;

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

/**
 * The prose sentence a repair may replace. Never the first sentence by default.
 * An exact whole sentence wins. A claim of at least three content words may name
 * the longer sentence that contains it. A shorter fragment does not.
 */
export function sentenceForClaim(prose: string, claim: string): string | null {
  const sentences = splitProseSentences(prose);
  const said = utterance(claim);
  if (said.length < 2) return null;
  const words = contentWords(claim);
  let best: { sentence: string; rank: number } | null = null;
  for (const sentence of sentences) {
    const exact = said === utterance(sentence);
    const carries = !exact && words.length >= 3 && utterance(sentence).includes(said);
    if (!exact && !carries && !claimMatchesSentence(claim, sentence)) continue;
    const rank = (exact ? 1000 : 0) + words.length;
    if (!best || rank > best.rank) best = { sentence, rank };
  }
  return best?.sentence ?? null;
}

export interface ClauseCheckPassResult {
  claims: ClauseClaim[];
  records: ClauseCheckRecord[];
  unsupported: ClauseClaim[];
  serious: ClauseClaim[];
  /** Throw, empty payload, or no parseable claims. Not a pass. */
  failed: boolean;
  /** Set when `failed`. Callers that withhold for a later local rule set their own cause. */
  failCause?: ClauseWithholdCause;
}

function claimText(claim: string): string {
  return claim.replace(/^out of character:\s*/i, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function contentWords(text: string): string[] {
  return claimText(text).split(' ').filter((word) => word.length > 3);
}

/**
 * A claim belongs to a sentence only by a real overlap.
 * One word, or a dot, does not cover a sentence. No fallback onto the first sentence.
 */
function utterance(text: string): string {
  return claimText(text).replace(/[.!?…]+$/g, '').trim();
}

export function claimMatchesSentence(claim: string, sentence: string): boolean {
  const c = claimText(claim);
  const s = claimText(sentence);
  if (!c || !s) return false;
  // A claim that is the whole sentence covers that sentence, including "Yes." and "She nods."
  // A shorter fragment still needs two content words, so "Mira" or "." cannot cover a longer line.
  const said = utterance(claim);
  if (said.length >= 2 && said === utterance(sentence)) return true;
  const words = contentWords(c);
  const sentenceWords = contentWords(s);
  // A one-word claim, or a sentence with one content word, only matches as the whole sentence.
  if (words.length < 2 || sentenceWords.length < 2) return false;
  const hits = words.filter((word) => sentenceWords.includes(word)).length;
  // Extra content words in the sentence were not named by the claim.
  const extras = sentenceWords.filter((word) => !words.includes(word));
  return extras.length === 0
    && hits >= 2
    && hits >= Math.min(3, words.length)
    && hits * 2 >= words.length;
}

/**
 * A supported fact quoted from inside a sentence means that sentence was checked.
 * Colour, a dot, and a two-word fragment still do not cover a longer sentence.
 */
function supportedFactInsideSentence(claim: ClauseClaim, sentence: string): boolean {
  if (claim.kind !== 'fact' || !claim.support.trim()) return false;
  const said = utterance(claim.c);
  const words = contentWords(claim.c);
  if (words.length < 3 || said.length < 12) return false;
  return utterance(sentence).includes(said);
}

/** Sentences the checker did not account for. A nonempty list can still leave some out. */
export function uncoveredSentences(prose: string, claims: ClauseClaim[]): string[] {
  return splitProseSentences(prose).filter(
    (sentence) => !claims.some((claim) => claimMatchesSentence(claim.c, sentence) || supportedFactInsideSentence(claim, sentence))
  );
}

/** Serious unsupported claims that still describe a sentence in this prose. */
export function seriousStillInProse(prose: string, serious: ClauseClaim[]): ClauseClaim[] {
  const sentences = splitProseSentences(prose);
  return serious.filter((claim) => sentences.some((sentence) => claimMatchesSentence(claim.c, sentence)));
}

function recordsMarkedRepaired(records: ClauseCheckRecord[], replacement: string): ClauseCheckRecord[] {
  if (!replacement) return records;
  const marked = records.map((record) =>
    claimMatchesSentence(record.clause, replacement) ? { ...record, repaired: true } : record
  );
  return marked.some((record) => record.repaired)
    ? marked
    : [...marked, { clause: replacement, kind: 'fact', support: '', severity: 'serious', repaired: true }];
}

function withheldResult(
  checkPasses: number,
  serious0: ClauseClaim[],
  withholdCause: ClauseWithholdCause
): ClauseCheckAndRepairResult {
  return {
    prose: '',
    records: [],
    repaired: false,
    serious0,
    checkPasses,
    withheld: true,
    withholdCause,
  };
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
  let out: { claims?: ClauseClaim[]; diagnostic?: ClauseWithholdCause } | null = null;
  let failed = false;
  let failCause: ClauseWithholdCause | undefined;
  try {
    out = await args.chat({ system: CLAUSE_CHECK_SYS, user });
  } catch {
    failed = true;
    failCause = 'threw';
    out = null;
  }
  if (out == null) {
    failed = true;
    failCause = failCause ?? 'empty';
  }
  const claims = failed ? [] : parseClauseClaims(out);
  // A reply that names no clause did not check the draft. One attempt only.
  if (!failed && splitProseSentences(args.prose).length > 0 && claims.length === 0) {
    failed = true;
    failCause = out?.diagnostic ?? 'no-clauses';
  }
  const unsupported = unsupportedFacts(claims);
  const serious = unsupported.filter((u) => u.severity !== 'minor');
  return {
    claims,
    records: toClauseRecords(claims),
    unsupported,
    serious,
    failed,
    ...(failCause ? { failCause } : {}),
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
  /**
   * True when the check threw, came back empty, or did not parse.
   * `prose` is then empty — callers publish an engine page, never the draft.
   */
  withheld: boolean;
  /** Which withhold branch dropped the draft. Absent when the draft is kept. */
  withholdCause?: ClauseWithholdCause;
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
  if (first.failed) {
    return {
      prose: '',
      records: [],
      repaired: false,
      serious0: [],
      checkPasses: 1,
      withheld: true,
      withholdCause: first.failCause ?? 'empty',
    };
  }
  let prose = args.prose;
  let repaired = false;
  let replacement = '';
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
          replacement = line;
          repairedSet.add(target.c);
        }
      }
    }
    // T10TURNS — second clause pass only when a repair landed.
    // If that pass still flags the rewrite, drop those sentences and recheck the remainder once.
    if (repaired) {
      const second = await runClauseCheck({
        factSheet: args.factSheet,
        prose,
        player: args.player,
        chat: args.chat,
      });
      checkPasses = 2;
      if (second.failed) return withheldResult(2, first.serious, second.failCause ?? 'repair-dropped');
      const seriousHit = seriousStillInProse(prose, second.serious);
      const missed = uncoveredSentences(prose, second.claims);
      const stillFirst = splitProseSentences(prose).filter((sentence) =>
        first.serious.some((claim) => claimMatchesSentence(claim.c, sentence))
      );
      if (!seriousHit.length && !missed.length && !stillFirst.length) {
        return {
          prose,
          records: recordsMarkedRepaired(toClauseRecords(second.claims, repairedSet), replacement),
          repaired: true,
          serious0: first.serious,
          checkPasses,
          withheld: false,
        };
      }
      const originalSentences = splitProseSentences(args.prose);
      const drop = splitProseSentences(prose).filter((sentence) => {
        if (stillFirst.includes(sentence)) return true;
        if (seriousHit.some((claim) => claimMatchesSentence(claim.c, sentence))) return true;
        if (!missed.includes(sentence)) return false;
        if (replacement && claimMatchesSentence(sentence, replacement)) return true;
        const coveredBefore = originalSentences.some(
          (original) => original === sentence || claimMatchesSentence(original, sentence)
        );
        return !coveredBefore;
      });
      const kept = splitProseSentences(prose).filter((sentence) => !drop.includes(sentence));
      if (!kept.length) return withheldResult(2, first.serious, 'repair-dropped');
      const remainder = kept.join(' ');
      const third = await runClauseCheck({
        factSheet: args.factSheet,
        prose: remainder,
        player: args.player,
        chat: args.chat,
      });
      checkPasses = 3;
      if (
        third.failed
        || seriousStillInProse(remainder, third.serious).length
        || uncoveredSentences(remainder, third.claims).length
      ) {
        return withheldResult(3, first.serious, third.failCause ?? 'repair-dropped');
      }
      return {
        prose: remainder,
        records: toClauseRecords(third.claims, repairedSet),
        repaired: true,
        serious0: first.serious,
        checkPasses,
        withheld: false,
      };
    }
  }

  // Repair missing or it did not land: the flagged draft is known-invalid.
  if (first.serious.length) return withheldResult(checkPasses, first.serious, 'serious');
  // A claim list that skips a sentence did not check that sentence.
  if (uncoveredSentences(prose, first.claims).length) return withheldResult(checkPasses, first.serious, 'uncovered');
  return {
    prose,
    records,
    repaired: false,
    serious0: first.serious,
    checkPasses,
    withheld: false,
  };
}

/**
 * Text that may be shown and saved. A withheld check never falls back to the writer draft.
 * Does not roll dice, award XP, or write the save.
 */
export function storyAfterClauseCheck(args: {
  clause: ClauseCheckAndRepairResult;
  enginePage: string;
  draft: string;
}): { text: string; withheld: boolean } {
  if (!args.clause.withheld) return { text: args.clause.prose, withheld: false };
  const page = args.enginePage.trim();
  // Empty engine page stays empty. Never substitute args.draft.
  void args.draft;
  if (!page) return { text: '', withheld: true };
  return { text: page, withheld: true };
}

/**
 * Wire ClauseCheckChat through callGmCheck / OpenRouter (same plumbing as writer/repair).
 * Tests pass a stub instead — never call this helper with a live key in vitest.
 */
export function makeGmClauseChat(
  callCheck: (userPayload: string) => Promise<string>
): ClauseCheckChat {
  return async ({ user }) => {
    const text = (await callCheck(user)) ?? '';
    if (!text.trim()) return { claims: [], diagnostic: 'empty' };
    const trimmed = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    let body: unknown;
    try {
      body = JSON.parse(trimmed);
    } catch {
      return { claims: [], diagnostic: 'parse' };
    }
    const claims = parseClauseClaims(body);
    if (claims.length) return { claims };
    const list = Array.isArray(body)
      ? body
      : body && typeof body === 'object'
        ? (body as { claims?: unknown }).claims
        : undefined;
    if (Array.isArray(list) && list.length === 0) return { claims: [], diagnostic: 'no-clauses' };
    return { claims: [], diagnostic: 'parse' };
  };
}

/** One TurnLog row for a diagnostic replay. A normal session records nothing here. */
export function diagnosticClauseWithholdVerdict(
  cause: ClauseWithholdCause | undefined,
  diagnosticReplay: boolean
): Array<{ checker: 'clauseWithhold'; verdict: 'fail'; detail: ClauseWithholdCause }> {
  if (!diagnosticReplay || !cause) return [];
  return [{ checker: 'clauseWithhold', verdict: 'fail', detail: cause }];
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
