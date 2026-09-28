/**
 * 28l — one writer turn: first draft → code-found problems → at most one short revision → last-resort
 * plain-prose call to the same writer. Canned / stitched lines are never the success path; the caller
 * only falls back when every writer call came back empty (transport outage).
 * Shared by the live client (`useGame`) and the headless harness (`fateAutoplay`).
 */
import type { GameState, NarrativePerspective } from './types';
import { narratesPcInThirdPerson, pcPov, pcStorySubject } from './narrativePov';
import type { PlayerIntent } from './intentParser';
import type { CompletedEventPacket, TokenUseRef } from './completedEventPacket';
import { isLastGmReprint, isUnaskedCombatClose } from './completedEventPacket';
import { formatTalkWriterFacing } from './talkEnvelope';
import { acceptTokenOrLedgerStory, type TokenAcceptPath } from './tokenProse';
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
  shouldRetryUnaskedCollage,
} from './semanticLoopDetector';
import { stripActionTags, stripChoiceList } from './parser';
import type { WriterRawIssue } from './openRouterChat';

export type WriterDraft = {
  prose: string;
  path: TokenAcceptPath | 'plain';
  refs?: TokenUseRef[];
};

export type WriterTurnOutcome = 'accepted' | 'revised' | 'last-resort' | 'empty';

export type WriterTurnResult = WriterDraft & {
  outcome: WriterTurnOutcome;
  /** Problems found on the first draft (empty when it passed). */
  problems: string[];
  /** Problems left on the committed draft. */
  remaining: string[];
  /** Writer calls made inside this helper (the first draft is the caller's). */
  extraCalls: number;
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

/** Cheap code checks on a rendered draft. Each entry is one plain instruction for the revision. */
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
    out.push('Repeats an earlier beat: write what is new this turn.');
  }
  if (check.previousGm && isLastGmReprint(text, check.previousGm)) out.push('Same text as the last beat: write a new one.');
  if (isUnaskedCombatClose(text, check.playerInput)) out.push('Do not end or restart a fight the engine did not settle this turn.');
  return [...new Set(out)];
}

/** The revision call: the same facts, the writer's own draft, and the code-found problems. */
export function formatWriterRevisionFacing(
  packet: CompletedEventPacket,
  state: GameState,
  draft: string,
  problems: string[],
  perspective?: NarrativePerspective
): string {
  return [
    formatTalkWriterFacing(packet, state, { perspective }),
    '',
    'YOUR DRAFT:',
    draft.replace(/\s+/g, ' ').trim().slice(0, 1200),
    '',
    'FIX ONLY THESE PROBLEMS (keep everything else):',
    ...problems.map((p) => `- ${p}`),
    'Return the whole beat again in the same JSON shape (plain prose is also accepted).',
  ].join('\n');
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

/** Last resort: the same writer, a much simpler prompt, plain prose. */
export function formatPlainProseFacing(
  packet: CompletedEventPacket,
  state: GameState,
  perspective?: NarrativePerspective
): string {
  const lastGm = [...(state.log ?? [])].reverse().find((e) => e.role === 'gm')?.content ?? '';
  const pov = pcPov(state.character ?? packet.pc, perspective);
  const person = narratesPcInThirdPerson(pov)
    ? `close third person on ${pcStorySubject(pov)} (${pov.he}/${pov.him}/${pov.his}), never "you" for ${pcStorySubject(pov)}`
    : pov.perspective === 'first-person'
      ? 'first person ("I")'
      : 'second person ("you")';
  const lines = [
    `Write 3–5 sentences of story in past tense, ${person}. Plain prose only: no JSON, no lists, no headings.`,
    `The player did: ${packet.playerAction || '(looked around)'}`,
    `Where: ${packet.location}.`,
  ];
  if (packet.engineResult) lines.push(`Already settled (state it as finished): ${packet.engineResult}`);
  if (packet.allowlist.length) lines.push(`Names you may use: ${packet.allowlist.join(', ')}. Use no other names.`);
  if (lastGm.trim()) lines.push(`Previous beat (do not repeat it): ${lastGm.replace(/\s+/g, ' ').trim().slice(0, 300)}`);
  return lines.join('\n');
}

/**
 * Judge the first draft; revise once only when code found a real problem; if still nothing usable,
 * ask the same writer for plain prose. Never paints a stitch.
 */
export async function runWriterTurn(opts: {
  firstRaw: string;
  packet: CompletedEventPacket;
  check: DraftCheck;
  callWriter: (payload: string) => Promise<string>;
  /** False after a transport retry this turn: skip the revision (the turn is already slow). */
  allowRevision?: boolean;
  perspective?: NarrativePerspective;
}): Promise<WriterTurnResult> {
  const { packet, check, callWriter } = opts;
  const state = check.state;
  let extraCalls = 0;
  let draft = renderWriterDraft(opts.firstRaw, state, packet);
  const firstDraft = draft.prose;
  const problems = writerDraftProblems(draft.prose, check);
  let remaining = problems;
  let outcome: WriterTurnOutcome = 'accepted';

  if (draft.prose && problems.length && opts.allowRevision !== false) {
    extraCalls += 1;
    const raw = await callWriter(formatWriterRevisionFacing(packet, state, draft.prose, problems, opts.perspective));
    const revised = renderWriterDraft(raw, state, packet);
    if (revised.prose) {
      const left = writerDraftProblems(revised.prose, check);
      if (
        left.length < problems.length
        || (left.length === problems.length && sentenceCount(revised.prose) > sentenceCount(draft.prose))
      ) {
        draft = revised;
        remaining = left;
        outcome = 'revised';
      }
    }
  }

  // A beat still under two sentences after the revision is not a story beat: ask for plain prose.
  const stillThin = !!draft.prose && extraCalls > 0 && sentenceCount(draft.prose) < 2;
  if (!draft.prose || stillThin) {
    extraCalls += 1;
    const raw = await callWriter(formatPlainProseFacing(packet, state, opts.perspective));
    const plain = renderWriterDraft(raw, state, packet);
    const plainLeft = plain.prose ? writerDraftProblems(plain.prose, check) : [];
    if (plain.prose && (!draft.prose || plainLeft.length <= remaining.length)) {
      draft = { ...plain, path: 'plain' };
      remaining = plainLeft;
      outcome = 'last-resort';
    } else if (!draft.prose) {
      outcome = 'empty';
    }
  }

  return { ...draft, outcome, problems, remaining, extraCalls, firstDraft };
}
