/**
 * 28l / 29z8 — one writer turn: the first draft is the beat. Code checks it, trims already-told
 * sentences and logs what is left; nothing goes back to the writer. Canned / stitched lines are never
 * the success path; the caller only falls back when the reply came back empty (transport outage).
 * Shared by the live client (`useGame`) and the headless harness (`fateAutoplay`).
 */
import type { GameState } from './types';
import type { PlayerIntent } from './intentParser';
import type { CompletedEventPacket, TokenUseRef } from './completedEventPacket';
import { classifyVerb, isLastGmReprint, isUnaskedCombatClose, lastResortStoryBody, TABLETOP_BEAT_WORDS, type LedgerRef } from './completedEventPacket';
import { acceptTokenOrLedgerStory, alreadySaidLines, plainLineFactProblem, refEnumOf, repeatsSaid, type SpokenLine, type TokenAcceptPath } from './tokenProse';
import { polishMentions } from './mentionVariety';
import { isTalkTurn, unresolvedActionReason } from './actionResolution';
import {
  classifyBeatCommit,
  ignoresTerminalFight,
  sentenceGateProblem,
  sentenceGateProblems,
  TERMINAL_FIGHT_PROBLEM,
  withMissingFightFacts,
} from './beatCommitGate';
import { narratesPcInThirdPerson, pcPov, pcStorySubject } from './narrativePov';
import { dropsFightRoll, RECORD_READOUT } from './engineFactGate';
import { splitProseSentences } from './proseSentences';
import { staleLocationRepairNote } from './sceneContextTail';
import { exitRepairFact } from './exitCount';
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
import { authoredTopicsFor } from './manusTopicBanks';
import { openingCastNames, shortCardWant } from './openingEstablishment';
import { writerEngineResult } from './travelJourney';
import { isGiverName } from './questGiver';

const DROPPED_ROLL_PROBLEM = 'The engine rolled hits on you this round: show each hit that landed.';

export type WriterDraft = {
  prose: string;
  path: TokenAcceptPath | 'plain';
  refs?: TokenUseRef[];
  /** Token JSON drafts only: the accepted speech lines. */
  speech?: SpokenLine[];
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
  /** Sentences the commit gate rejected and what the one repair request did with each. */
  repairs?: SentenceRepair[];
  /** A talk turn's missing quoted answer and what the one repair request did with it (`repairMissingAnswer`). */
  answerRepair?: SentenceRepair;
};

/**
 * One sentence the commit gate rejected. `repaired` is the writer's rewrite when it passed the gate;
 * otherwise the sentence left the page and `bug` says why, for diagnosis.
 */
export type SentenceRepair = {
  sentence: string;
  flag: string;
  fact: string;
  repaired?: string;
  bug?: string;
  /** The writer's reply when it could not be read as the rewrite. */
  reply?: string;
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
  return { prose, path: accepted.path, refs: accepted.refs, ...(accepted.speech ? { speech: accepted.speech } : {}) };
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
    const reused = recycledSentencesIn(text, recent, undefined, check.state.character?.name).slice(0, 3);
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
 * s82 Root A — the engine settled a fight this turn and the beat left it out: one rewrite with that
 * problem, then the last-resort paint from the engine result. Any other problem stays logged only (29z8).
 */
export async function runWriterTurnWithFightRetry(opts: {
  firstRaw: string;
  packet: CompletedEventPacket;
  check: DraftCheck;
  rewrite: (problem: string) => Promise<string>;
  /** Lap 13 — sends only the repair request (no packet); the reply is the rewritten sentence(s). */
  repair?: (request: string) => Promise<string>;
}): Promise<WriterTurnResult & { fightRetry?: 'retried' | 'added' | 'painted'; fightDraft?: string }> {
  const turn = await runWriterTurnFightOnly(opts);
  if (turn.outcome !== 'accepted' || turn.path === 'last-resort') return turn;
  const done = await repairMissingAnswer(await repairRejectedSentences(turn, opts), opts);
  if (opts.check.state.engineMode !== 'dnd') return done;
  const prose = capBeatWords(done.prose, TABLETOP_BEAT_WORDS, opts.check.state);
  return prose === done.prose ? done : { ...done, prose, remaining: writerDraftProblems(prose, opts.check) };
}

const wordCount = (s: string) => (s.match(/[A-Za-z0-9][\w'’-]*/g) ?? []).length;

/**
 * TT31 — a beat over the word cap loses whole sentences from the end until it fits. A spoken line, the
 * sentence naming where the player went and the first two sentences stay.
 */
export function capBeatWords(prose: string, cap: number, state: GameState): string {
  if (wordCount(prose) <= cap) return prose;
  const dest = [state.journey?.to, state.currentLocation].filter((p): p is string => !!p && p.length > 2).map((p) => p.toLowerCase());
  const sentences = splitProseSentences(prose);
  const keep = sentences.map((s, i) => i < 2 || /["“]/.test(s) || dest.some((d) => s.toLowerCase().includes(d)));
  let total = wordCount(prose);
  for (let i = sentences.length - 1; i >= 0 && total > cap; i--) {
    if (keep[i]) continue;
    total -= wordCount(sentences[i]!);
    sentences[i] = '';
  }
  return sentences.filter(Boolean).join(' ');
}

export const MISSING_ANSWER_PROBLEM = 'Someone must answer the player in quoted speech.';

/** People in this beat's REF ENUM who could answer (named people, roles, companions, a live foe). */
function answerersHere(check: DraftCheck, packet: CompletedEventPacket): string[] {
  const bareName = (s: string) => s.replace(/^(?:the|a|an)\s+/i, '').trim().toLowerCase();
  // A foe the engine put down cannot answer, unless a live fight with that name is on again.
  const kill = check.state.sceneFacts?.lastKill;
  const live = bareName(check.state.activeEncounter?.name ?? '');
  const downed = kill?.outcome === 'victory' && bareName(kill.name) !== live ? bareName(kill.name) : '';
  return refEnumOf(check.state, packet)
    .filter((r) => (r.klass === 'person' || r.klass === 'companion') && !!r.display)
    .map((r) => r.display.replace(/^(?:the|a|an)\s+/i, '').trim())
    .filter((d) => d.length > 1 && (!downed || d.toLowerCase() !== downed));
}

const hasQuote = (prose: string) => /["“][^"“”]{3,}["”]/.test(prose);

/** "thugs" → "thug", "thieves" → "thief", "witches" → "witch": one member of a group held here. */
function oneOfGroup(plural: string): string | null {
  const w = plural.toLowerCase();
  if (!/s$/.test(w) || /ss$/.test(w)) return null;
  if (/ies$/.test(w)) return w.replace(/ies$/, 'y');
  if (/ves$/.test(w)) return w.replace(/ves$/, 'f');
  if (/(?:ch|sh|x|z)es$/.test(w)) return w.replace(/es$/, '');
  return w.replace(/s$/, '');
}

/**
 * The words outside the quotes name a person here: their full display, one word of a held proper name
 * ("Nell" for Nell Rudd), or one member of a group held here ("a thug" when the thugs are here).
 */
function speakerHere(bare: string, here: string[]): boolean {
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return here.some((p) => {
    if (new RegExp(`\\b${esc(p)}\\b`, 'i').test(bare)) return true;
    const words = p.split(/\s+/).filter((w) => /^[A-Z][a-z'’-]{2,}$/.test(w));
    if (words.length > 1 && words.some((w) => new RegExp(`\\b${esc(w)}\\b`).test(bare))) return true;
    const last = p.split(/\s+/).pop() ?? '';
    const one = /^[a-z]/.test(last) ? oneOfGroup(last) : null;
    return !!one && new RegExp(`\\b(?:a|an|one|another|the)\\s+(?:[\\w'’-]+\\s+){0,3}?${esc(one)}\\b`, 'i').test(bare);
  });
}

const sameName = (a: string, b: string) => {
  const bare = (s: string) => s.replace(/^(?:the|a|an)\s+/i, '').trim().toLowerCase();
  return !!bare(a) && bare(a) === bare(b);
};

/**
 * tt-fix-4 — what a person here can be quoted saying without inventing anything: their authored topic lines,
 * the opening card's want when they are the card's cast, their bible lore card, and the text of the quest they
 * give or take part in. A sheet's archetype motive is a writer note, never a line to quote.
 */
export function backedAnswerFacts(state: GameState, name: string): string[] {
  const facts = authoredTopicsFor(name).map((t) => t.line);
  if (openingCastNames(state).some((n) => sameName(n, name))) facts.push(shortCardWant(state));
  const memory = (state.npcMemories ?? []).find(
    (m) => sameName(m.npcName, name) || (m.aliases ?? []).some((a) => sameName(a, name))
  );
  const names = [name, ...(memory ? [memory.npcName, ...(memory.aliases ?? [])] : [])].filter(Boolean);
  const isThem = (n?: string) => !!n && names.some((x) => isGiverName(x, n));
  for (const card of state.lorebook ?? []) {
    if (card.type === 'npc' && (isThem(card.name) || (card.keywords ?? []).some(isThem))) {
      facts.push(...splitProseSentences(card.summary ?? '').slice(0, 4));
    }
  }
  for (const q of state.quests ?? []) {
    if (q.status !== 'active') continue;
    const takesPart = isThem(q.giver) || (q.objectives ?? []).some((o) => (o.people ?? []).some(isThem));
    if (!takesPart) continue;
    facts.push(...splitProseSentences(q.description ?? '').slice(0, 3));
    facts.push(...(q.objectives ?? []).filter((o) => !o.completed).map((o) => o.description));
  }
  return [...new Set(facts.map((f) => f.replace(/\s+/g, ' ').trim()).filter((f) => f.length > 3))];
}

const FACT_STOP = new Set(['that', 'this', 'with', 'from', 'they', 'them', 'their', 'what', 'want', 'wants', 'have', 'here', 'there', 'were', 'will', 'your', 'about', 'into', 'just']);
const factWords = (s: string) =>
  new Set((s.toLowerCase().match(/[a-z][a-z'’-]{3,}/g) ?? []).map((w) => w.replace(/(?:ing|ed|es|s)$/, '')).filter((w) => !FACT_STOP.has(w)));

/** The quoted words carry a backed fact: two of its content words, or all of a short one's. */
export function quoteHeldToFacts(quoted: string, facts: string[]): boolean {
  const said = factWords(quoted);
  return facts.some((f) => {
    const words = [...factWords(f)];
    const shared = words.filter((w) => said.has(w)).length;
    return shared >= Math.min(2, words.length) && shared > 0;
  });
}

/** The one request for a missing answer. The player's character is never the speaker: the player speaks for them. */
export function answerRepairRequest(
  check: DraftCheck,
  here: string[],
  said: string[],
  prose: string,
  backed: Map<string, string[]> = new Map()
): string {
  const pc = (check.state.character?.name ?? '').trim();
  const known = here.flatMap((p) => (backed.get(p) ?? []).map((f) => `${p}: ${f}`));
  return [
    'Your story left out the answer. Write ONE sentence in which a person here answers the player.',
    'Format: the spoken words inside quote marks, plus who said it outside the quotes, e.g. "Words they say," Name said. Use a name from People here as the speaker.',
    'The spoken words say only what that person is known to say below, in their own voice. Add no new fact, person, place, object or task.',
    ...(pc ? [`${pc} is the player's character: never write words, a reply or a decision for ${pc}.`] : []),
    'Reply with only that sentence as plain prose. No JSON, no other text.',
    `Player said: "${check.playerInput.slice(0, 200)}"`,
    `People here: ${here.join('; ')}`,
    `Known to say: ${known.join(' | ')}`,
    ...(said.length ? [`Already said (say something new): ${said.slice(-4).map((s) => `"${s.slice(0, 100)}"`).join(' ')}`] : []),
    `Your story so far: ${prose.slice(0, 600)}`,
    `Engine fact: ${writerEngineResult(check.engineFact).trim() || 'Keep only what the scene already established.'}`,
  ].join('\n');
}

/**
 * Lap 37 — the player spoke to someone here and the committed beat has no quoted reply (the speech line
 * was dropped by the line gate, trimmed, or never written). ONE repair request asks for that answer as
 * one sentence; it lands after the beat's first sentence only when it quotes a person here, says
 * something new and passes the commit gate. Otherwise nothing is added and the miss is logged as a bug.
 */
export async function repairMissingAnswer(
  turn: WriterTurnResult & { fightRetry?: 'retried' | 'added' | 'painted'; fightDraft?: string },
  opts: { packet: CompletedEventPacket; check: DraftCheck; repair?: (request: string) => Promise<string> }
): Promise<WriterTurnResult & { fightRetry?: 'retried' | 'added' | 'painted'; fightDraft?: string }> {
  const { check, packet } = opts;
  if (!isTalkTurn(check.playerInput, check.intent) || playerAsksRepeat(check.playerInput)) return turn;
  const everyone = answerersHere(check, packet);
  // The player named who they spoke to: that person answers, not whoever else stands here.
  const addressee = everyone.find((p) => speakerHere(check.playerInput, [p]));
  const here = addressee ? [addressee] : everyone;
  if (!here.length) return turn;
  if (hasQuote(turn.prose)) {
    // "Tilde looked up. "Not tonight," she said." names the speaker in the sentence before the quote.
    const all = splitProseSentences(turn.prose);
    const unquoted = (s: string | undefined) => (s ?? '').replace(/["“][^"“”]*["”]/g, ' ');
    if (!addressee || all.some((s, i) => hasQuote(s) && speakerHere(`${unquoted(all[i - 1])} ${unquoted(s)}`, here))) return turn;
  }
  const fact = check.engineFact;
  const missing = { sentence: '(no answer on the page)', flag: MISSING_ANSWER_PROBLEM, fact };
  // Only a backed line may be quoted: with nothing on record for anyone here, the turn keeps its own lines.
  const backed = new Map(here.map((p) => [p, backedAnswerFacts(check.state, p)] as const).filter(([, f]) => f.length));
  if (!backed.size) return { ...turn, answerRepair: { ...missing, bug: 'skipped: no backed line for anyone here' } };
  const speakers = [...backed.keys()];
  const said = [...alreadySaidLines(check.state, packet).values()].flat();
  const request = answerRepairRequest(check, speakers, said, turn.prose, backed);
  if (!opts.repair) return { ...turn, answerRepair: { ...missing, bug: 'no repair path' } };
  const raw = await opts.repair(request).catch(() => '');
  const line = raw.trim() ? repairReplyLines(raw, check, packet, 1)?.[0] : undefined;
  const quoted = line?.match(/["“]([^"“”]{3,})["”]/)?.[1] ?? '';
  const bare = line?.replace(/["“][^"“”]*["”]/g, ' ') ?? '';
  const pc = (check.state.character?.name ?? '').trim().split(/\s+/)[0] ?? '';
  const pcSpeaks = new RegExp(`^\\W*(?:you${pc.length > 1 ? `|${pc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}` : ''})\\b`, 'i').test(bare);
  const bug = !raw.trim()
    ? 'repair reply empty'
    : !line
      ? 'repair reply was not one sentence'
      : !quoted
        ? 'repair reply has no quoted answer'
        : pcSpeaks || !speakerHere(bare, speakers)
          ? 'repair reply names nobody here as the speaker'
          : !quoteHeldToFacts(quoted, speakers.filter((p) => speakerHere(bare, [p])).flatMap((p) => backed.get(p) ?? []))
            ? 'repair reply is not held to a backed line'
            : repeatsSaid(quoted, said)
            ? 'repair reply says an earlier line again'
            : (() => {
                const still = sentenceGateProblem(check.state, line, check.playerInput)
                  ?? plainLineFactProblem(line, check.state, packet);
                return still ? `repair failed the gate: ${still}` : '';
              })();
  if (bug) {
    return {
      ...turn,
      answerRepair: { ...missing, ...(line ? { repaired: line } : {}), bug, ...(!line && raw.trim() ? { reply: raw.trim().slice(0, 600) } : {}) },
    };
  }
  const sentences = splitProseSentences(turn.prose);
  const prose = sentences.length > 1 ? [sentences[0], line, ...sentences.slice(1)].join(' ') : `${turn.prose.trim()} ${line}`;
  return {
    ...turn,
    prose,
    answerRepair: { ...missing, repaired: line },
    remaining: writerDraftProblems(prose, check),
  };
}

function sentencePattern(sentence: string): RegExp {
  return new RegExp(sentence.trim().split(/\s+/).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+'));
}

/** The draft with one sentence swapped for `replacement` ('' drops it), whitespace-tolerant. */
export function replaceDraftSentence(prose: string, sentence: string, replacement: string): string {
  const next = prose.replace(sentencePattern(sentence), () => replacement.trim());
  return next.replace(/[ \t]{2,}/g, ' ').replace(/ +([.,!?])/g, '$1').replace(/^\s+|\s+$/g, '');
}

/** One request: only the flagged sentence(s), why each failed, and the engine fact. */
export function sentenceRepairRequest(
  flagged: { sentence: string; flag: string; note?: string }[],
  engineFact: string
): string {
  const many = flagged.length > 1;
  return [
    many
      ? `Rewrite these ${flagged.length} sentences of your story. Reply with one rewritten sentence per line, in order, as plain prose. No JSON, no numbers, no other text.`
      : 'Rewrite this one sentence of your story. Reply with only the rewritten sentence as plain prose. No JSON, no other text.',
    ...flagged.map(
      (f, i) =>
        `${many ? `${i + 1}. ` : ''}Sentence: "${f.sentence}"\n${many ? '   ' : ''}Problem: ${f.flag}${f.note ? ` ${f.note}` : ''}`
    ),
    `Engine fact: ${writerEngineResult(engineFact).trim() || 'Keep only what the scene already established.'}`,
  ].join('\n');
}

function repairReplyLines(raw: string, check: DraftCheck, packet: CompletedEventPacket, count: number): string[] | null {
  const rendered = renderWriterDraft(raw, check.state, packet).prose
    || (/^\s*[[{]/.test(raw) ? '' : stripChoiceList(stripActionTags(raw)).trim());
  if (!rendered) return null;
  // A line wrapped whole in quotes loses them; an attributed reply that opens and closes on a quote keeps them.
  const clean = (s: string) => s.replace(/^\s*(?:\d+[.)]\s*|[-*]\s*)/, '').replace(/^"([^"]*)"$/, '$1').trim();
  const lines = rendered.split(/\n+/).map(clean).filter(Boolean);
  if (count > 1) return lines.length === count ? lines : null;
  const sentences = splitProseSentences(lines.join(' '));
  return sentences.length >= 1 && sentences.length <= 2 ? [sentences.join(' ')] : null;
}

/**
 * Lap 13 — a sentence the commit gate rejects never reaches the page. The writer gets ONE request with
 * only the flagged sentence(s) and the engine fact; a rewrite that passes the gate takes its place and the
 * rest of the draft stays. A rewrite that fails leaves the sentence off the page and is logged as a bug.
 */
export async function repairRejectedSentences(
  turn: WriterTurnResult & { fightRetry?: 'retried' | 'added' | 'painted'; fightDraft?: string },
  opts: { packet: CompletedEventPacket; check: DraftCheck; repair?: (request: string) => Promise<string> }
): Promise<WriterTurnResult & { fightRetry?: 'retried' | 'added' | 'painted'; fightDraft?: string }> {
  const { check, packet } = opts;
  // The draft as a whole is what the gate rejects; a sentence that only reads wrong out of context is not.
  const wholeProblems = sentenceGateProblems(check.state, turn.prose, check.playerInput);
  const whole = wholeProblems[0];
  if (!whole) return turn;
  // tt-fix-3 — every sentence the draft fails on is repaired in the one request, not only the first reason's.
  const flagged = splitProseSentences(turn.prose)
    .map((sentence) => ({ sentence, flag: sentenceGateProblems(check.state, sentence, check.playerInput).find((p) => wholeProblems.includes(p)) }))
    .filter((f): f is { sentence: string; flag: string } => !!f.flag);
  if (!flagged.length) {
    return {
      ...turn,
      repairs: [{ sentence: turn.prose.slice(0, 200), flag: whole, fact: check.engineFact, bug: 'unlocated: no single sentence fails the gate' }],
    };
  }
  // A way-out flag is fixed against this place's ways out, whatever else the turn's fact says.
  const exitFact = flagged.some((f) => /\bways? out\b/i.test(f.flag)) && !/\bExits:/.test(check.engineFact) ? exitRepairFact(check.state) : '';
  const fact = [exitFact, check.engineFact.trim()].filter(Boolean).join(' ');
  const countNote = flagged.some((f) => /^Gives the wrong number of ways out/.test(f.flag))
    ? 'Name every one of those ways out, or give no number of ways at all.'
    : '';
  // A record read-out that cannot be rewritten stays when it is the only sentence naming where the player went.
  const destination = [check.state.journey?.to, check.state.currentLocation].filter((p): p is string => !!p && p.length > 2);
  const namesDestination = (s: string) => destination.some((p) => s.toLowerCase().includes(p.toLowerCase()));
  const onlyDestination = (s: string, draft: string) =>
    namesDestination(s) && !splitProseSentences(draft).some((o) => o !== s && namesDestination(o));
  let lines: string[] | null = null;
  let bug = 'no repair path';
  let raw = '';
  if (opts.repair) {
    const asked = flagged.map((f) => ({
      ...f,
      note: [staleLocationRepairNote(check.state, f.sentence), countNote].filter(Boolean).join(' '),
    }));
    raw = await opts.repair(sentenceRepairRequest(asked, fact)).catch(() => '');
    lines = raw.trim() ? repairReplyLines(raw, check, packet, flagged.length) : null;
    bug = raw.trim() ? 'repair reply was not a rewrite of the flagged sentence' : 'repair reply empty';
  }
  let prose = turn.prose;
  const repairs: SentenceRepair[] = flagged.map((f, i) => {
    const line = lines?.[i];
    // The rewrite fails only for a reason it fails in its draft too (out of context alone is not enough).
    const inDraft = line ? sentenceGateProblems(check.state, replaceDraftSentence(prose, f.sentence, line), check.playerInput) : [];
    const still = line ? sentenceGateProblems(check.state, line, check.playerInput).find((p) => inDraft.includes(p)) ?? null : null;
    const ok = !!line && !still && line.trim() !== f.sentence.trim();
    // A repair that hands the same sentence back found nothing to change: the gate's flag was false, the line stays.
    const unchanged = !!line && line.trim() === f.sentence.trim();
    const keep = unchanged || (!ok && f.flag === RECORD_READOUT && onlyDestination(f.sentence, prose));
    if (!keep) prose = replaceDraftSentence(prose, f.sentence, ok ? line! : '');
    return ok
      ? { sentence: f.sentence, flag: f.flag, fact, repaired: line }
      : {
          sentence: f.sentence, flag: f.flag, fact,
          ...(line ? { repaired: line } : {}),
          bug: unchanged ? 'kept: repair returned the sentence unchanged' : still ? `repair failed the gate: ${still}` : bug,
          ...(!line && raw.trim() ? { reply: raw.trim().slice(0, 600) } : {}),
        };
  });
  return { ...turn, prose, repairs, remaining: writerDraftProblems(prose, check) };
}

async function runWriterTurnFightOnly(opts: {
  firstRaw: string;
  packet: CompletedEventPacket;
  check: DraftCheck;
  rewrite: (problem: string) => Promise<string>;
}): Promise<WriterTurnResult & { fightRetry?: 'retried' | 'added' | 'painted'; fightDraft?: string }> {
  const first = runWriterTurn(opts);
  if (first.outcome !== 'accepted' || !ignoresTerminalFight(opts.check.state, first.prose)) return first;
  const head = dropsFightRoll(opts.check.state, first.prose) ? DROPPED_ROLL_PROBLEM : TERMINAL_FIGHT_PROBLEM;
  const problem = `${head} ${opts.check.engineFact}`.trim();
  const raw = await opts.rewrite(problem).catch(() => '');
  const second = runWriterTurn({ ...opts, firstRaw: raw });
  const fightDraft = raw.trim() ? raw.trim().slice(0, 1200) : undefined;
  if (second.outcome === 'accepted' && !ignoresTerminalFight(opts.check.state, second.prose)) {
    return { ...second, problems: [...new Set([...first.problems, ...second.problems])], fightRetry: 'retried', fightDraft };
  }
  // The writer's lines stay; the engine adds a plain sentence for each settled fight fact still missing.
  const base = second.outcome === 'accepted' && second.prose.trim() ? second : first;
  if (base.prose.trim()) {
    const state = opts.check.state;
    const pov = pcPov(opts.packet.pc ?? state.character);
    const prose = withMissingFightFacts(state, base.prose, {
      who: pcStorySubject(pov),
      him: narratesPcInThirdPerson(pov) ? pov.him : 'you',
    });
    return { ...base, prose, remaining: writerDraftProblems(prose, opts.check), fightRetry: 'added', fightDraft };
  }
  const painted = lastResortStoryBody(opts.check.state, opts.packet, opts.check.playerInput);
  return {
    ...first,
    prose: painted.prose,
    path: 'last-resort',
    refs: undefined,
    speech: undefined,
    remaining: writerDraftProblems(painted.prose, opts.check),
    fightRetry: 'painted',
    fightDraft,
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
    const move = moveSentenceCheck(check.playerInput, refs, check.state.journey?.to ?? check.state.currentLocation);
    next = trimRecycledSentences(next, recentGmBeatTexts(check.state), 2, move, check.state.character?.name).text;
  }
  return polishMentions(next, refs, check.state);
}

/**
 * On a turn the player traveled or left, a sentence naming the place left and the place reached is that
 * move, and so is a sentence naming where the move is going (the trip's destination, else the place reached).
 */
export function moveSentenceCheck(
  playerInput: string,
  refs: LedgerRef[],
  destination?: string | null
): (sentence: string) => boolean {
  const verb = classifyVerb(playerInput);
  if (verb !== 'traveled' && verb !== 'left') return () => false;
  const bare = (p: string) => p.replace(/^(?:the|a|an)\s+/i, '').trim().toLowerCase();
  const places = [...new Set(
    refs
      .filter((r) => r.klass === 'place')
      .map((r) => bare(r.display))
      .filter((p) => p.length > 2)
  )];
  const dest = bare(destination ?? '');
  const goingTo = dest.length > 2 && places.includes(dest) ? dest : '';
  return (sentence) => {
    const s = sentence.toLowerCase();
    return (!!goingTo && s.includes(goingTo)) || places.filter((p) => s.includes(p)).length >= 2;
  };
}
