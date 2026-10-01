/**
 * 28l / 29z8 — one writer turn: the first draft is the beat. Code checks it, trims already-told
 * sentences and logs what is left; nothing goes back to the writer. Canned / stitched lines are never
 * the success path; the caller only falls back when the reply came back empty (transport outage).
 * Shared by the live client (`useGame`) and the headless harness (`fateAutoplay`).
 */
import type { GameState } from './types';
import type { PlayerIntent } from './intentParser';
import type { CompletedEventPacket, TokenUseRef } from './completedEventPacket';
import { classifyVerb, isLastGmReprint, isUnaskedCombatClose, type LedgerRef } from './completedEventPacket';
import { acceptTokenOrLedgerStory, refEnumOf, type TokenAcceptPath } from './tokenProse';
import { polishMentions } from './mentionVariety';
import { unresolvedActionReason } from './actionResolution';
import { classifyBeatCommit } from './beatCommitGate';
import { isNearClone, isSameBeat } from './beatFingerprint';
import {
  detectAtmosphereReprint,
  detectLeadingCollage,
  detectSameRoomEssayHard,
  playerAsksContinuation,
  playerAsksRepeat,
  recentGmBeatTexts,
  recycledSentencesIn,
  shouldRetryUnaskedCollage,
  trimRecycledSentences,
} from './semanticLoopDetector';
import { stripActionTags, stripChoiceList } from './parser';
import type { WriterRawIssue } from './openRouterChat';
import { ensureSpokenAnswer, type SpokenAnswer } from './spokenAnswer';

export type WriterDraft = {
  prose: string;
  path: TokenAcceptPath | 'plain';
  refs?: TokenUseRef[];
};

export type WriterTurnOutcome = 'accepted' | 'empty';

export type WriterTurnResult = WriterDraft & {
  outcome: WriterTurnOutcome;
  /** 29z9 — who / want / where: whether the addressee's own words are on the page, and where they came from. */
  spoken?: SpokenAnswer;
  /** Problems found on the first draft (logged, never re-asked). */
  problems: string[];
  /** Problems left on the committed draft after code trims. */
  remaining: string[];
  firstDraft: string;
};

export type DraftCheck = {
  state: GameState;
  playerInput: string;
  intent: PlayerIntent;
  engineFact: string;
  previousGm: string;
};

function sentenceCount(prose: string): number {
  return (prose.match(/[^.!?]+[.!?]+["')\]]*/g) ?? []).filter((s) => s.trim().split(/\s+/).length >= 3).length;
}

/** Render a raw writer reply (token JSON or plain text) to player prose; '' when nothing usable. */
export function renderWriterDraft(raw: string, state: GameState, packet?: CompletedEventPacket): WriterDraft {
  if (!raw?.trim()) return { prose: '', path: 'last-resort' };
  const accepted = acceptTokenOrLedgerStory(raw, state, packet, {
    alreadyRepaired: true,
    lenient: true,
    noLedgerFallback: true,
  });
  const prose = (accepted.prose ?? '').trim();
  if (!stripChoiceList(stripActionTags(prose)).trim()) return { prose: '', path: accepted.path };
  return { prose, path: accepted.path, refs: accepted.refs };
}

function unresolvedProblem(why: string, playerInput: string, engineFact: string): string {
  if (why === 'too short') return 'Too thin: write 4–6 full sentences.';
  if (why === 'engine result not stated') return `State the ENGINE RESULT plainly as already settled: ${engineFact.slice(0, 240)}`;
  if (why === 'speech, no reply' || why === 'asked person, no reply') return 'Someone must answer the player in quoted speech.';
  if (why === 'question unanswered') return 'Answer the player\'s question directly.';
  const target = why.match(/^named target missing \((.+)\)$/)?.[1];
  if (target) return `Show the player acting on the ${target}.`;
  return `Resolve the player's action "${playerInput.slice(0, 120)}" (${why}).`;
}

/** Cheap code checks on a rendered draft. Each entry is one plain problem, logged with the turn. */
export function writerDraftProblems(prose: string, check: DraftCheck): string[] {
  const text = stripChoiceList(stripActionTags(prose ?? '')).trim();
  if (!text) return ['No usable story came back.'];
  if (playerAsksRepeat(check.playerInput)) return [];
  const out: string[] = [];
  if (sentenceCount(text) < 2) out.push('Too thin: write 4–6 full sentences.');
  const why = unresolvedActionReason(check.playerInput, text, check.intent, check.previousGm, check.engineFact);
  if (why) out.push(unresolvedProblem(why, check.playerInput, check.engineFact));
  const gate = classifyBeatCommit(check.state, text, check.playerInput);
  if (!gate.accept) out.push(...(gate.details?.length ? gate.details : gate.reasons));
  const fps = check.state.recentBeatFingerprints ?? [];
  const recent = recentGmBeatTexts(check.state);
  const collage = detectLeadingCollage(text, recent);
  if (
    isNearClone(text, fps)
    || shouldRetryUnaskedCollage(text, recent, check.playerInput)
    || (isSameBeat(text, fps) && !playerAsksContinuation(check.playerInput))
    || (collage.hit && !collage.tailHasNewContent)
    || detectAtmosphereReprint(text, recent)
    || detectSameRoomEssayHard(text, recent, check.playerInput)
  ) {
    const reused = recycledSentencesIn(text, recent).slice(0, 3);
    out.push(
      reused.length
        ? `Repeats an earlier beat: write what is new this turn. Do not reuse these lines: ${reused.map((s) => `"${s.slice(0, 110)}"`).join(' ')}`
        : 'Repeats an earlier beat: write what is new this turn.'
    );
  }
  if (check.previousGm && isLastGmReprint(text, check.previousGm)) out.push('Same text as the last beat: write a new one.');
  if (isUnaskedCombatClose(text, check.playerInput)) out.push('Do not end or restart a fight the engine did not settle this turn.');
  return [...new Set(out)];
}

export type WriterIssue = WriterRawIssue | 'recycled' | 'unresolved';

const RECYCLE_NOTE =
  /recycle-without-delta|Collage reject|Beat recycle reject|Atmosphere reprint|Same-room essay HARD|Repeats an earlier beat|Same text as the last beat|Reuses sentences/i;
const UNRESOLVED_NOTE = /Narrative does not resolve the player action|Resolve the player's action|Answer the player's question|must answer the player|Show the player acting/i;

/**
 * 28l — the raw problems a committed beat carried: reply-level issues from the transport plus the
 * warden / governance / draft-check flags still standing after the one revision. Logged with thumbs.
 */
export function writerTurnIssues(rawIssues: readonly string[], notes: readonly string[]): WriterIssue[] {
  const out = new Set<WriterIssue>();
  for (const r of rawIssues) {
    if (r === 'empty' || r === 'reasoning-only' || r === 'cut-off') out.add(r);
  }
  if (notes.some((n) => RECYCLE_NOTE.test(n))) out.add('recycled');
  if (notes.some((n) => UNRESOLVED_NOTE.test(n))) out.add('unresolved');
  return [...out];
}

/**
 * 29z8 - one writer pass per turn. The first draft is the beat: code trims already-told sentences and
 * names labels once; any problem left is logged for the tester, never sent back to the writer.
 */
export function runWriterTurn(opts: {
  firstRaw: string;
  packet: CompletedEventPacket;
  check: DraftCheck;
}): WriterTurnResult {
  const { packet, check } = opts;
  const first = renderWriterDraft(opts.firstRaw, check.state, packet);
  const problems = writerDraftProblems(first.prose, check);
  if (!first.prose) return { ...first, outcome: 'empty', problems, remaining: problems, firstDraft: '' };
  const spoken = ensureSpokenAnswer(finishCommittedProse(first.prose, check, packet), check.state, check.playerInput);
  const prose = spoken.prose;
  return {
    ...first,
    prose,
    outcome: 'accepted',
    problems,
    remaining: writerDraftProblems(prose, check),
    firstDraft: first.prose,
    spoken: spoken.answer,
  };
}

/**
 * 28u — last pass on the beat that commits: sentences already told in recent beats drop out
 * (at least two sentences stay), and full labels are named once per beat.
 */
export function finishCommittedProse(prose: string, check: DraftCheck, packet?: CompletedEventPacket): string {
  let next = prose;
  const refs = refEnumOf(check.state, packet);
  if (!playerAsksRepeat(check.playerInput) && !/<[^>]+>/.test(next)) {
    const move = moveSentenceCheck(check.playerInput, refs);
    next = trimRecycledSentences(next, recentGmBeatTexts(check.state), 2, move).text;
  }
  return polishMentions(next, refs, check.state);
}

/** On a turn the player traveled or left, a sentence naming the place left and the place reached is that move. */
export function moveSentenceCheck(playerInput: string, refs: LedgerRef[]): (sentence: string) => boolean {
  const verb = classifyVerb(playerInput);
  if (verb !== 'traveled' && verb !== 'left') return () => false;
  const places = [...new Set(
    refs
      .filter((r) => r.klass === 'place')
      .map((r) => r.display.replace(/^(?:the|a|an)\s+/i, '').trim().toLowerCase())
      .filter((p) => p.length > 2)
  )];
  return (sentence) => {
    const s = sentence.toLowerCase();
    return places.filter((p) => s.includes(p)).length >= 2;
  };
}
