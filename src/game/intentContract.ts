/**
 * IntentContract — every player send becomes obligations the draft must honor.
 * Research P0: act / answer / refuse / correct / talk-to-X — satisfy or explicitly resist.
 */

import type { GameState } from './types';
import {
  isAskNearbyPerson,
  isSpeechOrProtest,
  primaryActionClause,
  type PlayerIntent,
} from './intentParser';

function isPlayerQuestion(action: string): boolean {
  const t = action.replace(/\s+/g, ' ').trim();
  if (/\?/.test(t)) return true;
  return /\b(what|how|why|where|who|when|can i|could i|would you|tell me|explain|details|if i (?:agree|refuse|don'?t)|what (?:do|does|happens|if)|how (?:might|do|can)|prove)\b/i.test(
    t
  );
}

export type ObligationKind =
  | 'act'
  | 'answer'
  | 'refuse'
  | 'correct'
  | 'talk'
  | 'observe'
  | 'open_ask'
  | 'silenced_thread';

export interface Obligation {
  id: string;
  kind: ObligationKind;
  /** Short binding instruction for the writer. */
  must: string;
  /** Optional target name/role. */
  target?: string;
  /** Player text snippet this obligation came from. */
  source?: string;
}

export interface IntentContract {
  primaryKind: PlayerIntent['kind'];
  label: string;
  verbatim: string;
  job: string;
  obligations: Obligation[];
}

export interface ObligationCoverage {
  ok: boolean;
  missing: Obligation[];
  notes: string[];
}

function uid(prefix: string, i: number): string {
  return `${prefix}-${i}`;
}

function openAskThreads(state: GameState): string[] {
  return (state.campaignMemory?.consequences ?? [])
    .filter((c) => c.unresolved && /^open ask\b/i.test(c.text))
    .map((c) => c.text.replace(/^open ask\s*\(t\d+\):\s*/i, '').trim())
    .filter(Boolean)
    .slice(0, 3);
}

function silencedThreads(state: GameState): string[] {
  return (state.campaignMemory?.consequences ?? [])
    .filter(
      (c) =>
        c.unresolved
        && /silenced|cut off|interrupted|began to speak|started to speak/i.test(c.text)
    )
    .map((c) => c.text.trim())
    .filter(Boolean)
    .slice(0, 2);
}

/**
 * Compile a binding IntentContract from the player's send + coarse intent + ledger.
 */
export function buildIntentContract(args: {
  typed: string;
  resolvedText: string;
  intent: PlayerIntent;
  state: GameState;
}): IntentContract {
  const typed = args.typed.replace(/\s+/g, ' ').trim();
  const job = primaryActionClause(args.resolvedText || typed);
  const obligations: Obligation[] = [];
  let i = 0;

  const speech =
    args.intent.kind === 'talk'
    || args.intent.kind === 'refuse'
    || isSpeechOrProtest(typed)
    || isSpeechOrProtest(job);
  const question = isPlayerQuestion(typed) || isPlayerQuestion(job);

  if (speech || isAskNearbyPerson(typed) || isAskNearbyPerson(job)) {
    obligations.push({
      id: uid('talk', i++),
      kind: 'talk',
      must: 'Honor the player\'s typed words as dialogue. Someone present answers THAT line — not a pocket-search, kit recap, or physical follow-through.',
      source: typed.slice(0, 160),
    });
  }

  if (question) {
    obligations.push({
      id: uid('answer', i++),
      kind: 'answer',
      must: `Answer the player's question with concrete in-world terms. Do not stall with "awaits your response" or soft-reset the ask. Question: "${job.slice(0, 140)}"`,
      source: job.slice(0, 160),
    });
  }

  if (args.intent.kind === 'refuse' || /\b(i\s+refuse|i\s+won'?t|didn'?t\s+agree|decline)\b/i.test(typed)) {
    obligations.push({
      id: uid('refuse', i++),
      kind: 'refuse',
      must: 'Treat this as refusal/protest. Narrate acknowledgment of the refusal in-fiction. Do not force compliance or invent consent.',
      source: typed.slice(0, 120),
    });
  }

  if (/\b(actually|correction|i said|i meant|not\s+"|that'?s\s+wrong|i am not|my name is|call me)\b/i.test(typed)) {
    obligations.push({
      id: uid('correct', i++),
      kind: 'correct',
      must: 'Honor the player correction as highest authority for their own facts (name, look, refusal, identity). Do not overwrite it with prior prose.',
      source: typed.slice(0, 120),
    });
  }

  // Non-speech actions still need an act obligation
  if (!speech || args.intent.kind === 'attack' || args.intent.kind === 'move' || args.intent.kind === 'search' || args.intent.kind === 'use_item' || args.intent.kind === 'observe' || args.intent.kind === 'cast' || args.intent.kind === 'rest' || args.intent.kind === 'flee') {
    if (args.intent.kind !== 'talk' && args.intent.kind !== 'refuse') {
      obligations.push({
        id: uid('act', i++),
        kind: args.intent.kind === 'observe' ? 'observe' : 'act',
        must: `Resolve the primary action (${args.intent.label}): "${job.slice(0, 140)}" with concrete sensory results for THIS action first.`,
        target: args.intent.targets[0],
        source: job.slice(0, 160),
      });
    } else if (!obligations.some((o) => o.kind === 'talk' || o.kind === 'answer')) {
      obligations.push({
        id: uid('act', i++),
        kind: 'act',
        must: `Resolve what the player asked for: "${job.slice(0, 140)}"`,
        source: job.slice(0, 160),
      });
    }
  }

  for (const ask of openAskThreads(args.state)) {
    obligations.push({
      id: uid('open', i++),
      kind: 'open_ask',
      must: `An Open ask is still on the ledger — answer it this turn with concrete terms: "${ask.slice(0, 120)}"`,
      source: ask.slice(0, 120),
    });
  }

  for (const sil of silencedThreads(args.state)) {
    obligations.push({
      id: uid('sil', i++),
      kind: 'silenced_thread',
      must: `A silenced/interrupted speaker is on the ledger — return to that thread or say why they stay silent: "${sil.slice(0, 100)}"`,
      source: sil.slice(0, 100),
    });
  }

  // De-dupe similar must-lines
  const seen = new Set<string>();
  const unique = obligations.filter((o) => {
    const key = `${o.kind}:${o.must.slice(0, 80)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    primaryKind: args.intent.kind,
    label: args.intent.label,
    verbatim: typed,
    job,
    obligations: unique.slice(0, 8),
  };
}

/** Inject into TURN MANDATE / user payload. */
export function formatIntentContractForPrompt(contract: IntentContract): string {
  if (!contract.obligations.length) return '';
  const lines = contract.obligations.map(
    (o, idx) => `${idx + 1}. [${o.kind.toUpperCase()}] ${o.must}`
  );
  return `=== INTENT CONTRACT (BINDING OBLIGATIONS) ===
Player typed (verbatim): "${contract.verbatim.slice(0, 220)}"
Primary intent: ${contract.label} (${contract.primaryKind})
Engine job clause: "${contract.job.slice(0, 180)}"
Each obligation MUST be satisfied in the story this turn, or the scene must explicitly resist/refuse it in-fiction (never ignore):
${lines.join('\n')}
Ambiguous nouns: clarify in-world, use Introduction Permit, or reject invention — do not invent free names.
====================================================`;
}

function proseOnly(text: string): string {
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/\[SYSTEM[^\]]*\]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Heuristic coverage: missing obligations trigger resolution retry.
 * Prefer false-negatives over false-positives that force endless retries.
 */
export function checkObligationCoverage(
  contract: IntentContract,
  narrative: string
): ObligationCoverage {
  const prose = proseOnly(narrative);
  const missing: Obligation[] = [];
  const notes: string[] = [];

  if (!prose || prose.length < 50) {
    return {
      ok: false,
      missing: contract.obligations,
      notes: ['Narrative too short to cover obligations'],
    };
  }

  for (const o of contract.obligations) {
    let covered = true;
    switch (o.kind) {
      case 'talk':
      case 'refuse':
        covered =
          /["“][^"”]{2,}["”]/.test(prose)
          || /\b(says?|said|asks?|asked|replies|replied|answers?|answered|snaps?|snapped|mutters?|protests?|refuses?|acknowledges?)\b/i.test(
            prose
          );
        if (!covered) notes.push('Talk/refuse obligation: no spoken exchange detected');
        break;
      case 'answer':
      case 'open_ask': {
        const tokens = (o.source ?? o.must)
          .toLowerCase()
          .match(/[a-z]{4,}/g)
          ?.filter(
            (t) =>
              !/^(with|from|that|this|have|into|your|their|about|would|could|should|what|when|where|which|please|more|some|tell|does|will|just|only|must|answer|question|player|concrete|terms|open|ask|ledger)$/.test(
                t
              )
          ) ?? [];
        const hay = prose.toLowerCase();
        const hits = tokens.filter((t) => hay.includes(t)).length;
        const stake =
          /\b(if you|in return|terms|because|sanctuary|protection|refuse|agree|cost|price|deal|pact)\b/i.test(
            prose
          );
        covered = hits >= Math.min(2, Math.max(1, tokens.length)) || stake;
        if (!covered) notes.push(`Answer obligation weakly covered: ${o.kind}`);
        break;
      }
      case 'correct':
        covered =
          /\b(name|called|correction|understood|noted|as you (?:said|wish|put)|very well)\b/i.test(
            prose
          )
          || (o.source
            ? o.source
                .toLowerCase()
                .split(/\s+/)
                .filter((w) => w.length > 3)
                .some((w) => prose.toLowerCase().includes(w))
            : true);
        if (!covered) notes.push('Correction obligation not reflected');
        break;
      case 'silenced_thread':
        covered =
          /\b(silent|silence|cut off|interrupted|again|resume|began|started|still|quiet|gesture)\b/i.test(
            prose
          );
        // Soft: don't fail hard if talk already covered this turn
        if (!covered && missing.every((m) => m.kind !== 'talk')) {
          /* allow pass if talk obligations exist and passed */
        }
        if (!covered) {
          // Only fail if no dialogue cues at all
          if (!/["“]|says?|said|asks?/i.test(prose)) {
            notes.push('Silenced thread not revisited');
          } else {
            covered = true;
          }
        }
        break;
      case 'act':
      case 'observe': {
        const jobTokens =
          (o.source ?? '')
            .toLowerCase()
            .match(/[a-z]{4,}/g)
            ?.filter(
              (t) =>
                !/^(with|from|that|this|have|into|your|their|about|would|could|should|then|have|will|just)$/.test(
                  t
                )
            )
            .slice(0, 6) ?? [];
        const hay = prose.toLowerCase();
        const hits = jobTokens.filter((t) => hay.includes(t)).length;
        covered =
          jobTokens.length === 0
          || hits >= Math.min(1, jobTokens.length)
          || prose.length >= 180;
        if (!covered) notes.push('Act/observe obligation may not resolve the job clause');
        break;
      }
      default:
        covered = true;
    }
    if (!covered) missing.push(o);
  }

  return {
    ok: missing.length === 0,
    missing,
    notes,
  };
}

export function buildObligationRetryBlock(contract: IntentContract, coverage: ObligationCoverage): string {
  const miss = coverage.missing
    .map((o) => `- [${o.kind}] ${o.must}`)
    .join('\n');
  return `=== INTENT CONTRACT RETRY (BINDING) ===
Your prior reply missed required player obligations.
Player typed: "${contract.verbatim.slice(0, 200)}"
Missing:
${miss || '(coverage failed)'}
REQUIRED: Satisfy EVERY missing obligation in NEW prose this turn (or explicitly resist in-fiction). Do not ignore the typed line. Do not replace dialogue with a physical stub.
================================================`;
}

export {
  introductionPermitForName,
  type IntroductionPermit,
  type IntroductionPermitSource,
} from './introductionPermit';
