/** Writer turn: first draft is the beat; blocking problems get one rewrite in runWriterTurnWithFightRetry. */
import type { GameState } from './types';
import { givePcTheirQuote, stripUnauthorizedNpcSpeech, type PlayerIntent } from './intentParser';
import type { CompletedEventPacket, TokenUseRef } from './completedEventPacket';
import { classifyVerb, isLastGmReprint, isUnaskedCombatClose, lastResortStoryBody, TABLETOP_BEAT_WORDS, tokenUseMatchesClass, type LedgerRef } from './completedEventPacket';
import { acceptTokenOrLedgerStory, alreadySaidLines, plainLineFactProblem, refEnumOf, repeatsSaid, storySentences, type DroppedLine, type SpokenLine, type TokenAcceptPath } from './tokenProse';
import { polishMentions } from './mentionVariety';
import { isTalkTurn, unresolvedActionReason } from './actionResolution';
import {
  classifyBeatCommit,
  ignoresTerminalFight,
  missingFightFacts,
  sentenceGateProblem,
  sentenceGateProblems,
  TERMINAL_FIGHT_PROBLEM,
  withMissingFightFacts,
} from './beatCommitGate';
import { terminalFightOutcome, terminalOutcomeSentence } from './engineResult';
import { narratesPcInThirdPerson, pcPov, pcStorySubject } from './narrativePov';
import { dropsFightRoll } from './engineFactGate';
import { escRe } from './engineFactPatterns';
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
  trimSameBeatRestatements,
} from './semanticLoopDetector';
import { stripActionTags, stripChoiceList } from './parser';
import type { WriterRawIssue } from './openRouterChat';
import { ensureSpokenAnswer, stripSpeakerSilence, type SpokenAnswer } from './spokenAnswer';
import { authoredTopicsFor } from './manusTopicBanks';
import { openingCastNames, shortCardWant } from './openingEstablishment';
import { isOfferRefuseLine } from './openingOffer';
import { isRoadLabel, roadMeetingOpenerLines, writerEngineResult } from './travelJourney';
import { engineFactForRepair } from './writerCueLines';
import { isGiverName } from './questGiver';
import { motiveAnswer, motiveLinesOf } from './npcSheet';
import { actionVerb, objectWords, stemHit } from './chipRules';
import { checkPlayCrimes } from './turnCheck';
import { mentionsName, peopleHere } from './chipLegality';
const DROPPED_ROLL_PROBLEM = 'The engine rolled hits on you this round: show each hit that landed.';
export type WriterDraft = {
  prose: string;
  path: TokenAcceptPath | 'plain';
  refs?: TokenUseRef[];
  /** Token JSON drafts only: the accepted speech lines. */
  speech?: SpokenLine[];
  /** Lines the token line gate dropped; they go into the turn's one repair request. */
  dropped?: DroppedLine[];
};
export type WriterTurnOutcome = 'accepted' | 'empty';
export type WriterTurnResult = WriterDraft & {
  outcome: WriterTurnOutcome;
  /** 29z9 — who / want / where: whether the addressee's own words are on the page, and where they came from. */
  spoken?: SpokenAnswer;
  /** First-draft problems (blocking ones may get one rewrite). */
  problems: string[];
  /** Problems left after trims / rewrite / fallback. */
  remaining: string[];
  firstDraft: string;
  repairs?: SentenceRepair[];
  answerRepair?: SentenceRepair;
  /** RC-R1 — fight outcome on STATUS combat log, not prose. */
  outcomeShown?: 'engine';
  combatLog?: string;
};
/** Fight omit + RC-N3 blocking-draft rewrite / fallback. */
export type WriterTurnRetryResult = WriterTurnResult & {
  fightRetry?: 'retried' | 'added' | 'painted';
  draftRetry?: 'retried' | 'painted';
  fightDraft?: string;
};
/** One gate-rejected sentence and what the repair did with it. */
export type SentenceRepair = {
  sentence: string;
  flag: string;
  fact: string;
  repaired?: string;
  bug?: string;
  reply?: string;
};
export type DraftCheck = {
  state: GameState;
  playerInput: string;
  intent: PlayerIntent;
  engineFact: string;
  previousGm: string;
};
/** Render a raw writer reply (token JSON or plain text) to player prose; '' when nothing usable. */
export function renderWriterDraft(raw: string, state: GameState, packet?: CompletedEventPacket): WriterDraft {
  if (!raw?.trim()) return { prose: '', path: 'last-resort' };
  const accepted = acceptTokenOrLedgerStory(raw, state, packet, {
    lenient: true,
    noLedgerFallback: true,
  });
  const prose = (accepted.prose ?? '').trim();
  if (!stripChoiceList(stripActionTags(prose)).trim()) return { prose: '', path: accepted.path };
  const { refs, speech, dropped } = accepted;
  return { prose, path: accepted.path, refs, ...(speech ? { speech } : {}), ...(dropped ? { dropped } : {}) };
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
/** Cheap code checks on a rendered draft (logged with the turn). */
export function writerDraftProblems(prose: string, check: DraftCheck): string[] {
  const text = stripChoiceList(stripActionTags(prose ?? '')).trim();
  if (!text) return ['No usable story came back.'];
  if (playerAsksRepeat(check.playerInput)) return [];
  const out: string[] = [];
  if (storySentences(text) < 2) out.push('Too thin: write 4–6 full sentences.');
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
  const here = peopleHere(check.state);
  // q73-DYING: engine dying/dead flags plus the existing verb stem (chipRules.stemHit). No new word list.
  const ds = check.state.deathSaves;
  const tabletopDown = check.state.engineMode === 'dnd' && !!ds;
  const dyingNow = tabletopDown && !ds!.dead && !ds!.stable;
  const deadNow = tabletopDown && !!ds!.dead;
  if (dyingNow || deadNow) {
    // SRD 5.2.1 Unconscious: "An Unconscious creature is incapacitated, can't move or speak, and
    // is unaware of its surroundings" (Wizards of the Coast, CC BY 4.0). T10AH — any PC-led act
    // that is not refused in the same sentence (cannot / locked) is illegal, not only walk/talk.
    const first = (check.state.character?.name ?? '').trim().split(' ')[0] ?? '';
    const bits: string[] = [];
    let buf = '';
    for (const ch of text) {
      buf += ch;
      if (ch === '.' || ch === '!' || ch === '?') { bits.push(buf); buf = ''; }
    }
    if (buf.trim()) bits.push(buf);
    for (const bit of bits) {
      const lead = bit.trim();
      const low = lead.toLowerCase();
      const subject = (first.length >= 2 && low.startsWith(first.toLowerCase())) || low.startsWith('you ');
      if (!subject) continue;
      if (
        low.includes('cannot')
        || low.includes("can't")
        || low.includes('unable')
        || low.includes('could not')
        || low.includes('locked inside')
        || low.includes('stayed locked')
      ) {
        continue;
      }
      const moving = stemHit(lead, 'walk') || stemHit(lead, 'travel') || stemHit(lead, 'head') || stemHit(lead, 'move');
      const speaking = stemHit(lead, 'talk') || stemHit(lead, 'speak') || stemHit(lead, 'say') || stemHit(lead, 'shout') || classifyVerb(lead) === 'spoke' || classifyVerb(lead) === 'traveled' || classifyVerb(lead) === 'left';
      const rescued = deadNow && (stemHit(lead, 'wake') || stemHit(lead, 'stand') || stemHit(lead, 'rescue'));
      const micro =
        stemHit(lead, 'lick')
        || stemHit(lead, 'crawl')
        || stemHit(lead, 'push')
        || stemHit(lead, 'reach')
        || stemHit(lead, 'try')
        || stemHit(lead, 'glare')
        || /\b(?:worked|managed|succeeded|got up)\b/i.test(lead);
      if (moving || speaking || rescued || micro) {
        out.push(deadNow ? 'Show the player acting after death.' : 'Show the player acting while unconscious.');
        break;
      }
    }
  }
  // Same play-crime gate as turnCheck (incl. system-ledger wrong-voice). No second word list.
  for (const f of checkPlayCrimes(check.state, check.state, check.playerInput, text).p0) {
    if (f.kind === 'absent-speaker') out.push(`Absent speaker: ${f.detail}. Only PRESENT speak (${here.join(', ') || '(none)'}).`);
    if (f.kind === 'wrong-voice') out.push(`Wrong voice: ${f.detail}`);
    // T10F/T10H — reject when an NPC is given the player's quoted line (blocking; finishCommittedProse also reattributes).
    if (f.kind === 'plays-player' && /NPC speaks the player's quoted words/i.test(f.detail)) {
      out.push(`Player's quoted words in an NPC's mouth: ${f.detail}`);
    }
    // T10P — invented PC quoted speech (player typed no quotes) is a hard miss.
    if (f.kind === 'plays-player' && /the prose writes the player's own words/i.test(f.detail)) {
      out.push(`Invented PC speech: ${f.detail}`);
    }
  }
  if (isOfferRefuseLine(check.playerInput)) {
    const card = (check.state.openingEstablishment?.card?.cast ?? '').trim();
    const named = (card || openingCastNames(check.state)[0] || '').trim();
    const low = named.toLowerCase();
    const who = !named || low === 'panel' || low === 'the panel' || low === 'the people here' || low === 'people here' || low === 'the people who pulled you' ? '' : named;
    let seated = false;
    if (who) for (let i = 0; i < here.length; i++) if (mentionsName(here[i]!, who) || mentionsName(who, here[i]!)) seated = true;
    const quoted = text.includes('"') || text.includes('\u201c');
    let namedHere = false;
    for (let i = 0; i < here.length; i++) if (mentionsName(text, here[i]!)) namedHere = true;
    if (seated && !quoted && !namedHere) out.push('Someone must answer the player in quoted speech.');
  }
  return [...new Set(out)];
}
export type WriterIssue = WriterRawIssue | 'recycled' | 'unresolved';
const RECYCLE_NOTE =
  /recycle-without-delta|Collage reject|Beat recycle reject|Atmosphere reprint|Same-room essay HARD|Repeats an earlier beat|Same text as the last beat|Reuses sentences/i;
const UNRESOLVED_NOTE = /Narrative does not resolve the player action|Resolve the player's action|Answer the player's question|must answer the player|Show the player acting/i;
/** Transport + post-revision draft/warden flags still standing (logged with thumbs). */
export function writerTurnIssues(rawIssues: readonly string[], notes: readonly string[]): WriterIssue[] {
  const out = new Set<WriterIssue>();
  for (const r of rawIssues) {
    if (r === 'empty' || r === 'reasoning-only' || r === 'cut-off' || r === 'fireworks-served') out.add(r);
  }
  if (notes.some((n) => RECYCLE_NOTE.test(n))) out.add('recycled');
  if (notes.some((n) => UNRESOLVED_NOTE.test(n))) out.add('unresolved');
  return [...out];
}
/** Render + check one draft (no rewrite). Blocking problems are handled by runWriterTurnWithFightRetry. */
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
/** Fight omit rewrite, then repairs, then RC-N3 blocking rewrite / engine-fact fallback. */
export async function runWriterTurnWithFightRetry(opts: {
  firstRaw: string;
  packet: CompletedEventPacket;
  check: DraftCheck;
  rewrite: (problem: string) => Promise<string>;
  repair?: (request: string) => Promise<string>;
}): Promise<WriterTurnRetryResult> {
  const turn = await runWriterTurnFightOnly(opts);
  if (turn.outcome !== 'accepted' || turn.path === 'last-resort') return turn;
  const answered = await repairMissingAnswer(await repairRejectedSentences(turn, opts), opts);
  const placed = withMoveDestination(opts.check.state, answered.prose);
  let done: WriterTurnRetryResult =
    placed === answered.prose ? answered : { ...answered, prose: placed, remaining: writerDraftProblems(placed, opts.check) };
  if (opts.check.state.engineMode === 'dnd') {
    const prose = capBeatWords(done.prose, TABLETOP_BEAT_WORDS, opts.check.state);
    if (prose !== done.prose) done = { ...done, prose, remaining: writerDraftProblems(prose, opts.check) };
  }
  // RC-N3 after repairs: hard misses → rewrite then engine-fact page; speech-answer → rewrite then keep.
  if (done.fightRetry) return done;
  const blocking: string[] = [];
  for (let i = 0; i < done.remaining.length; i++) {
    const p = done.remaining[i]!;
    if (p.startsWith('Too thin:') || p.startsWith('State the ENGINE RESULT') || p.startsWith("Resolve the player's action")
      || p.startsWith('Someone must answer') || p.startsWith("Answer the player's question") || p.startsWith('Show the player acting')
      || p.startsWith('Absent speaker:') || p.startsWith('Wrong voice:')
      || p.startsWith("Player's quoted words in an NPC's mouth:")
      || p.startsWith('Invented PC speech:')) blocking.push(p);
  }
  if (!blocking.length) return done;
  let raw = '';
  try { raw = await opts.rewrite(blocking.join('\n')); } catch { /* rewrite miss */ }
  const second = runWriterTurn({ ...opts, firstRaw: raw });
  const fightDraft = raw.trim() ? raw.trim().slice(0, 1200) : undefined;
  let hardLeft = second.outcome !== 'accepted';
  if (!hardLeft) {
    for (let i = 0; i < second.remaining.length; i++) {
      const p = second.remaining[i]!;
      if (p.startsWith('Too thin:') || p.startsWith('State the ENGINE RESULT') || p.startsWith("Resolve the player's action")
        || p.startsWith('Show the player acting') || p.startsWith('Absent speaker:') || p.startsWith('Wrong voice:')
        || p.startsWith("Player's quoted words in an NPC's mouth:")
        || p.startsWith('Invented PC speech:')) { hardLeft = true; break; }
    }
  } else {
    hardLeft = false;
    for (let i = 0; i < blocking.length; i++) {
      const p = blocking[i]!;
      if (p.startsWith('Too thin:') || p.startsWith('State the ENGINE RESULT') || p.startsWith("Resolve the player's action")
        || p.startsWith('Show the player acting') || p.startsWith('Absent speaker:') || p.startsWith('Wrong voice:')
        || p.startsWith("Player's quoted words in an NPC's mouth:")
        || p.startsWith('Invented PC speech:')) { hardLeft = true; break; }
    }
  }
  if (second.outcome === 'accepted' && !hardLeft) {
    return {
      ...second,
      problems: [...new Set([...done.problems, ...second.problems])],
      draftRetry: 'retried',
      fightDraft,
      outcomeShown: done.outcomeShown,
      combatLog: done.combatLog,
    };
  }
  if (!hardLeft) return { ...done, draftRetry: 'retried', fightDraft };
  const painted = lastResortStoryBody(opts.check.state, opts.packet, opts.check.playerInput);
  return {
    ...done,
    prose: painted.prose,
    path: 'last-resort',
    refs: undefined,
    speech: undefined,
    remaining: writerDraftProblems(painted.prose, opts.check),
    problems: [...new Set([...done.problems, 'blocking draft fell back to engine-fact page'])],
    draftRetry: 'painted',
    fightDraft,
  };
}
/** Engine moved the player this turn but the beat never names where to — add one plain sentence. */
export function withMoveDestination(state: GameState, prose: string): string {
  const c = state.circling;
  if (!prose.trim() || c?.movedTurn == null || c.movedTurn !== state.turn) return prose;
  const j = state.journey;
  const underway = !!j && j.legsDone < j.legsTotal;
  const dest = (underway ? j!.to : state.currentLocation ?? '').replace(/\s+/g, ' ').trim();
  if (!dest || isRoadLabel(dest)) return prose;
  const low = prose.toLowerCase();
  // T10Y — dungeon "parent — Room": name the room leaf. Skipping every em-dash dest left Coolant Trench unnamed.
  const leafParts = dest.split(/\s*[—–]\s*|\s+-\s+/);
  const roomLeaf = leafParts.length >= 2 ? (leafParts[leafParts.length - 1] ?? '').trim() : '';
  const paintTo = roomLeaf || dest;
  if (paintTo.length > 2 && low.includes(paintTo.toLowerCase())) return prose;
  const pc = (state.character?.name ?? '').trim() || 'They';
  // T10Q — streets terrain is town travel; do not paste the journey "back streets" leg label as a sentence.
  const line = underway
    ? j!.terrain === 'streets'
      ? `${pc} headed toward ${paintTo} through the town.`
      : `${pc} was on the ${j!.ground.toLowerCase()} toward ${paintTo}.`
    : `${pc} reached ${paintTo}.`;
  return `${line} ${prose.trim()}`;
}
const wordCount = (s: string) => (s.match(/[A-Za-z0-9][\w'’-]*/g) ?? []).length;
/** Drop trailing sentences until the beat fits the word cap (spoken / dest / first two stay). */
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
  const hereNow = (check.state.currentLocation ?? '').trim().toLowerCase();
  const gone = new Set<string>();
  const tagged: string[] = [];
  for (const f of check.state.timeline ?? []) {
    if ((f.kind !== 'person' && f.kind !== 'creature') || !f.name) continue;
    if (f.place && hereNow && f.place.trim().toLowerCase() !== hereNow) continue;
    const name = bareName(f.name);
    if (f.verb === 'died' || f.verb === 'left') gone.add(name.toLowerCase());
    else if (!gone.has(name.toLowerCase())) tagged.push(name);
  }
  const fromRefs = refEnumOf(check.state, packet)
    .filter((r) => tokenUseMatchesClass('speaker', r.klass) && !!r.display)
    .map((r) => r.display.replace(/^(?:the|a|an)\s+/i, '').trim());
  const seen = new Set<string>();
  const out: string[] = [];
  for (const d of [...fromRefs, ...tagged]) {
    const key = d.toLowerCase();
    if (d.length <= 1 || seen.has(key) || gone.has(key) || (downed && key === downed)) continue;
    seen.add(key);
    out.push(d);
  }
  return out;
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
/** Outside-quote words name someone here (full display, given name, or one of a held group). */
function speakerHere(bare: string, here: string[]): boolean {
  return here.some((p) => {
    if (new RegExp(`\\b${escRe(p)}\\b`, 'i').test(bare)) return true;
    const words = p.split(/\s+/).filter((w) => /^[A-Z][a-z'’-]{2,}$/.test(w));
    if (words.length > 1 && words.some((w) => new RegExp(`\\b${escRe(w)}\\b`).test(bare))) return true;
    const last = p.split(/\s+/).pop() ?? '';
    const one = /^[a-z]/.test(last) ? oneOfGroup(last) : null;
    return !!one && new RegExp(`\\b(?:a|an|one|another|the)\\s+(?:[\\w'’-]+\\s+){0,3}?${escRe(one)}\\b`, 'i').test(bare);
  });
}
const sameName = (a: string, b: string) => {
  const bare = (s: string) => s.replace(/^(?:the|a|an)\s+/i, '').trim().toLowerCase();
  return !!bare(a) && bare(a) === bare(b);
};
/** Lines a person here may be quoted saying (topics, card want, lore, their quest) — never archetype motive. */
export function backedAnswerFacts(state: GameState, name: string): string[] {
  const facts = authoredTopicsFor(name).map((t) => t.line);
  // OP-1: a road meeting's speaker is backed by its opener idea's gist.
  facts.push(...roadMeetingOpenerLines(state, name));
  if (openingCastNames(state).some((n) => sameName(n, name))) facts.push(shortCardWant(state));
  const memory = (state.npcMemories ?? []).find(
    (m) => sameName(m.npcName, name) || (m.aliases ?? []).some((a) => sameName(a, name))
  );
  const names = [name, ...(memory ? [memory.npcName, ...(memory.aliases ?? [])] : [])].filter(Boolean);
  const isThem = (n?: string) => !!n && names.some((x) => isGiverName(x, n));
  for (const card of state.lorebook ?? []) {
    // tt-fix-7 — a harvest card's summary is a placeholder ("Met in play. Details unfold through conversation."), not a line.
    if (card.id?.startsWith('harvest-npc-')) continue;
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
const SELF_TITLE = /^(?:father|mother|brother|sister|sir|lady|lord|old|captain|master|mistress|the)$/i;
/** tt-fix-7 — quoted words naming their own speaker ("Aldous wants to know…", said by Aldous) are a note read out, not speech. */
export function speaksOfSelf(quoted: string, speaker: string): boolean {
  const parts = speaker.split(/\s+/).filter((w) => w.length > 2 && /^[A-Z]/.test(w) && !SELF_TITLE.test(w));
  return parts.some((w) => new RegExp(`\\b${escRe(w)}\\b`).test(quoted));
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
    'The spoken words say only what that person is known to say below, in their own voice: first person (I, me, my), never their own name, and never a copy of a note. Add no new fact, person, place, object or task.',
    ...(pc ? [`${pc} is the player's character: never write words, a reply or a decision for ${pc}.`] : []),
    'Reply with only that sentence as plain prose. No JSON, no other text.',
    `Player said: "${check.playerInput.slice(0, 200)}"`,
    `People here: ${here.join('; ')}`,
    `Known to say: ${known.join(' | ')}`,
    ...(said.length ? [`Already said (say something new): ${said.slice(-4).map((s) => `"${s.slice(0, 100)}"`).join(' ')}`] : []),
    `Your story so far: ${prose.slice(0, 600)}`,
    // T10S — repair must not see Must-narrate PC acts converted to story (that pasted player clauses onto NPCs).
    `Engine fact: ${engineFactForRepair(check.engineFact).trim() || 'Keep only what the scene already established.'}`,
  ].join('\n');
}
/** Missing quoted reply on a talk turn: one repair sentence, else log the miss. */
export async function repairMissingAnswer(
  turn: WriterTurnRetryResult,
  opts: { packet: CompletedEventPacket; check: DraftCheck; repair?: (request: string) => Promise<string> }
): Promise<WriterTurnRetryResult> {
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
  // Only a backed line may be quoted: what is on record for them, and their own motive lines.
  const backed = new Map(here.map((p): [string, string[]] => [p, [...backedAnswerFacts(check.state, p), ...motiveLinesOf(check.state, p)]]).filter(([, f]) => f.length));
  const said = [...alreadySaidLines(check.state, packet).values()].flat();
  if (!backed.size) return { ...turn, answerRepair: { ...missing, bug: `no backed line for ${here.join(', ')}` } };
  const speakers = [...backed.keys()];
  const request = answerRepairRequest(check, speakers, said, turn.prose, backed);
  const sent = !!opts.repair && !turn.repairs?.some((r) => !r.bug?.startsWith('unlocated'));
  const raw = sent ? await opts.repair!(request).catch(() => '') : '';
  const line = raw.trim() ? repairReplyLines(raw, check, packet, 1)?.[0] : undefined;
  const quoted = line?.match(/["“]([^"“”]{3,})["”]/)?.[1] ?? '';
  const bare = line?.replace(/["“][^"“”]*["”]/g, ' ') ?? '';
  const pc = (check.state.character?.name ?? '').trim().split(/\s+/)[0] ?? '';
  const pcSpeaks = new RegExp(`^\\W*(?:you${pc.length > 1 ? `|${escRe(pc)}` : ''})\\b`, 'i').test(bare);
  const bug = !opts.repair
    ? 'no repair path'
    : !sent
    ? 'one repair per turn: the sentence repair sent it'
    : !raw.trim()
    ? 'repair reply empty'
    : !line
      ? 'repair reply was not one sentence'
      : !quoted
        ? 'repair reply has no quoted answer'
        : pcSpeaks || !speakerHere(bare, speakers)
          ? 'repair reply names nobody here as the speaker'
          : speakers.some((p) => speakerHere(bare, [p]) && speaksOfSelf(quoted, p))
            ? 'repair reply has the speaker talk about themselves by name (a note, not speech)'
          : !quoteHeldToFacts(quoted, speakers.filter((p) => speakerHere(bare, [p])).flatMap((p) => backed.get(p) ?? []))
            ? 'repair reply is not held to a backed line'
            : repeatsSaid(quoted, said)
            ? 'repair reply says an earlier line again'
            : (() => {
                const still = sentenceGateProblem(check.state, line, check.playerInput)
                  ?? plainLineFactProblem(line, check.state, packet);
                return still ? `repair failed the gate: ${still}` : '';
              })();
  if (!bug) return landAnswer(turn, check, missing, line!);
  const answerRepair = { ...missing, ...(line ? { repaired: line } : {}), bug, ...(!line && raw.trim() ? { reply: raw.trim().slice(0, 600) } : {}) };
  // The writer's answer failed: the engine lands one of the person's own motive lines.
  const own = motiveAnswer(check.state, speakers);
  return own ? { ...landAnswer(turn, check, answerRepair, own.line), speech: turn.speech && [...turn.speech, own.spoken] } : { ...turn, answerRepair };
}
/** The answer line lands after the beat's first sentence. */
function landAnswer<T extends WriterTurnResult>(turn: T, check: DraftCheck, missing: SentenceRepair, line: string): T {
  // T10AF — strip content-free non-answers for the speaker before landing a real line, so a
  // stock motive never stacks on "said nothing / gave no answer" (Keep Gate T131 / Dunn T147).
  const speaker =
    line.match(/["”]\s*([^"“”]+?)\s+said\b/i)?.[1]?.trim() ??
    line.match(/^([^"“”]+?)\s+said\b/i)?.[1]?.trim() ??
    '';
  // stripSpeakerSilence derives name tokens from label (Speaker.names is internal to spokenAnswer).
  const cleaned = speaker ? stripSpeakerSilence(turn.prose, { label: speaker }) : turn.prose;
  const sentences = splitProseSentences(cleaned);
  const prose = sentences.length > 1 ? [sentences[0], line, ...sentences.slice(1)].join(' ') : `${cleaned.trim()} ${line}`.trim();
  return { ...turn, prose, answerRepair: { ...missing, repaired: line }, remaining: writerDraftProblems(prose, check) };
}
/** The draft with one sentence swapped for `replacement` ('' drops it), whitespace-tolerant. */
export function replaceDraftSentence(prose: string, sentence: string, replacement: string): string {
  const next = prose.replace(new RegExp(sentence.trim().split(/\s+/).map(escRe).join('\\s+')), () => replacement.trim());
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
    // T10S — strip Must narrate / PC says cues so a rewrite cannot mirror the player's act onto an NPC.
    `Engine fact: ${engineFactForRepair(engineFact).trim() || 'Keep only what the scene already established.'}`,
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
/** One repair request for every gate-rejected / dropped line; failures leave the page and are logged. */
export async function repairRejectedSentences(
  turn: WriterTurnRetryResult,
  opts: { packet: CompletedEventPacket; check: DraftCheck; repair?: (request: string) => Promise<string> }
): Promise<WriterTurnRetryResult> {
  const { check, packet } = opts;
  // The draft as a whole is what the gate rejects; a sentence that only reads wrong out of context is not.
  const wholeProblems = sentenceGateProblems(check.state, turn.prose, check.playerInput);
  const flagOf = (text: string) => sentenceGateProblems(check.state, text, check.playerInput).find((p) => wholeProblems.includes(p));
  // tt-fix-3 — every sentence the draft fails on is in the one request; a flag no one sentence carries is on the pair that does.
  const all = splitProseSentences(turn.prose);
  const locate = (list: string[]) =>
    list.map((sentence) => ({ sentence, flag: flagOf(sentence) })).filter((f): f is { sentence: string; flag: string } => !!f.flag);
  const singles = wholeProblems.length ? locate(all) : [];
  const flagged: { sentence: string; flag: string; after?: string }[] =
    singles.length || !wholeProblems.length ? singles : locate(all.slice(1).map((s, i) => `${all[i]} ${s}`)).slice(0, 1);
  for (const d of turn.dropped ?? []) {
    const flag = plainLineFactProblem(d.sentence, check.state, packet) ?? sentenceGateProblem(check.state, d.sentence, check.playerInput) ?? `it failed the line check (${d.reason})`;
    flagged.push({ sentence: d.sentence, flag, after: d.after });
  }
  if (!flagged.length) {
    return wholeProblems.length
      ? { ...turn, repairs: [{ sentence: turn.prose.slice(0, 200), flag: wholeProblems[0]!, fact: check.engineFact, bug: 'unlocated: no sentence or pair fails the gate' }] }
      : turn;
  }
  // A way-out flag is fixed against this place's ways out, whatever else the turn's fact says.
  const exitFact = flagged.some((f) => /\bways? out\b/i.test(f.flag)) && !/\bExits:/.test(check.engineFact) ? exitRepairFact(check.state) : '';
  const fact = [exitFact, check.engineFact.trim()].filter(Boolean).join(' ');
  const countNote = flagged.some((f) => /^Gives the wrong number of ways out/.test(f.flag))
    ? 'Name every one of those ways out, or give no number of ways at all.'
    : '';
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
    // A flagged sentence's rewrite takes its place; a dropped line's goes after the kept line it followed
    // (first when it opened the beat, last when that line is gone).
    const place = (text: string) => {
      if (f.after == null) return replaceDraftSentence(prose, f.sentence, text);
      const next = f.after ? replaceDraftSentence(prose, f.after, `${f.after} ${text}`) : `${text} ${prose}`;
      return next !== prose ? next : `${prose} ${text}`;
    };
    // The rewrite fails only for a reason it fails in its draft too (out of context alone is not enough).
    const inDraft = line ? sentenceGateProblems(check.state, place(line), check.playerInput) : [];
    // tt-fix-7 — a rewrite answers to the same line-fact gate as a writer line (R3: it brought back a wrong time of day).
    const still = line
      ? sentenceGateProblems(check.state, line, check.playerInput).find((p) => inDraft.includes(p))
        ?? plainLineFactProblem(line, check.state, packet)
      : null;
    const unchanged = !!line && line.trim() === f.sentence.trim();
    const ok = !!line && !still && !unchanged;
    if (ok) prose = place(line!);
    else if (f.after == null) prose = place('');
    return ok
      ? { sentence: f.sentence, flag: f.flag, fact, repaired: line }
      : {
          sentence: f.sentence, flag: f.flag, fact,
          ...(line ? { repaired: line } : {}),
          bug: still ? `repair failed the gate${unchanged ? ' (returned unchanged)' : ''}: ${still}` : unchanged ? 'repair returned the sentence unchanged' : bug,
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
}): Promise<WriterTurnRetryResult> {
  const state = opts.check.state;
  const pov = pcPov(opts.packet.pc ?? state.character);
  const fightPov = { who: pcStorySubject(pov), him: narratesPcInThirdPerson(pov) ? pov.him : 'you' };
  const withFacts = <T extends WriterTurnResult>(turn: T): T => {
    const fight = terminalFightOutcome(state.completedEvent?.engineResult);
    if (!fight) return turn;
    const prose = withMissingFightFacts(state, turn.prose, fightPov);
    const combatLog = terminalOutcomeSentence(fight, fightPov);
    return {
      ...turn,
      prose,
      remaining: writerDraftProblems(prose, opts.check),
      outcomeShown: 'engine' as const,
      combatLog,
    };
  };
  const first = runWriterTurn(opts);
  if (first.outcome !== 'accepted') return first;
  if (!ignoresTerminalFight(state, first.prose)) return withFacts(first);
  const head = dropsFightRoll(state, first.prose) ? DROPPED_ROLL_PROBLEM : TERMINAL_FIGHT_PROBLEM;
  const problem = `${head} ${opts.check.engineFact}`.trim();
  const raw = await opts.rewrite(problem).catch(() => '');
  const second = runWriterTurn({ ...opts, firstRaw: raw });
  const fightDraft = raw.trim() ? raw.trim().slice(0, 1200) : undefined;
  if (second.outcome === 'accepted' && !ignoresTerminalFight(state, second.prose)) {
    return withFacts({ ...second, problems: [...new Set([...first.problems, ...second.problems])], fightRetry: 'retried' as const, fightDraft });
  }
  const rewriteBetter = second.outcome === 'accepted' && !!second.prose.trim()
    && missingFightFacts(opts.check.state, second.prose) < missingFightFacts(opts.check.state, first.prose);
  const base = rewriteBetter ? second : first;
  if (base.prose.trim()) return withFacts({ ...base, fightRetry: 'added' as const, fightDraft });
  const painted = lastResortStoryBody(opts.check.state, opts.packet, opts.check.playerInput);
  const fight = terminalFightOutcome(state.completedEvent?.engineResult);
  return {
    ...first, prose: painted.prose, path: 'last-resort', refs: undefined, speech: undefined,
    remaining: writerDraftProblems(painted.prose, opts.check), fightRetry: 'painted', fightDraft,
    ...(fight ? { outcomeShown: 'engine' as const, combatLog: terminalOutcomeSentence(fight, fightPov) } : {}),
  };
}
/**
 * T10H / T10L — one beat, one telling: PC owns their quoted words; chip/fragment/wrong-speaker
 * NPC lines are dropped; same-turn event is not restated.
 * Shared by finishCommittedProse and post-clause-check (repair can reintroduce a restatement).
 */
export function normalizeCommittedProse(prose: string, check: DraftCheck, packet?: CompletedEventPacket): string {
  let next = prose ?? '';
  if (!next.trim()) return next;
  const refs = refEnumOf(check.state, packet);
  const pc = check.state.character?.name;
  next = givePcTheirQuote(next, check.playerInput, pc);
  next = stripUnauthorizedNpcSpeech(next, check.playerInput, pc, check.engineFact);
  if (!playerAsksRepeat(check.playerInput) && !/<[^>]+>/.test(next)) {
    const isEvent = thisTurnsEventCheck(check, refs);
    const isMove = moveSentenceCheck(
      check.playerInput,
      refs,
      check.state.journey?.to ?? check.state.currentLocation
    );
    const eventHits = (sentence: string) => {
      const verb = actionVerb(check.playerInput);
      const words = [verb, ...objectWords(check.playerInput)].filter((w) => w.length >= 3);
      return words.filter((w) => stemHit(sentence.replace(/["“][^"”]*["”]/g, ' '), w));
    };
    next = trimRecycledSentences(next, recentGmBeatTexts(check.state), 2, isEvent, check.state.character?.name).text;
    // minKeep 1: same-reply place/leg reprints may leave a single sentence (T10N).
    next = trimSameBeatRestatements(next, { isThisTurnsEvent: isEvent, isMoveEvent: isMove, eventHits, minKeep: 1 }).text;
  }
  // T10O — stray period after a quote that already closed on ?/!/… (`?"."`).
  next = next.replace(/([?!…])(["”])\.(?=\s|$)/g, '$1$2').replace(/([.!?]){2,}/g, '$1');
  // T10Y — doubled speech attribution (`Jax said, Jax said, "…"`) and group-of-itself (`the crew of the crew`).
  next = next.replace(
    /\b([A-Z][\w'’-]+(?:\s+[A-Z][\w'’-]+)?)\s+said,\s+\1\s+said,/g,
    '$1 said,',
  );
  next = next.replace(
    /\b((?:[Tt]he|[Aa]n?)\s+)([a-z][\w'-]+)\s+of\s+(?:the\s+)?\2\b/g,
    '$1$2',
  );
  return polishMentions(next, refs, check.state);
}
/** Drop already-told sentences (keep ≥2) and name full labels once. */
export function finishCommittedProse(prose: string, check: DraftCheck, packet?: CompletedEventPacket): string {
  return normalizeCommittedProse(prose, check, packet);
}
/** Keep sentences that tell this turn's own move or the PC doing the chosen action. */
export function thisTurnsEventCheck(
  check: Pick<DraftCheck, 'state' | 'playerInput'>,
  refs: LedgerRef[] = refEnumOf(check.state)
): (sentence: string) => boolean {
  const move = moveSentenceCheck(check.playerInput, refs, check.state.journey?.to ?? check.state.currentLocation);
  const action = playerActionSentenceCheck(check.playerInput, check.state.character?.name);
  return (s) => move(s) || action(s);
}
/** A sentence with the player character as its subject that does the chosen action: its verb or what it acts on. */
export function playerActionSentenceCheck(playerInput: string, pcName?: string | null): (sentence: string) => boolean {
  const verb = actionVerb(playerInput);
  const words = [verb, ...objectWords(playerInput)].filter((w) => w.length >= 3);
  const first = (pcName ?? '').trim().split(/\s+/)[0] ?? '';
  if (!words.length) return () => false;
  const subject = new RegExp(`^\\W*(?:${first.length >= 2 ? `${escRe(first)}|` : ''}you)\\b`, 'i');
  return (s) => subject.test(s) && words.some((w) => stemHit(s.replace(/["“][^"”]*["”]/g, ' '), w));
}
/** Travel/leave turn: sentence names leave+reach or the trip destination. */
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