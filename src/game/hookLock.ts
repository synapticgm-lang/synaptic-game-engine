/**
 * Site-wide hook / summon-why authority.
 * When the writer or hook card commits why-you’re-here (accident vs intended vs
 * bargain vs pawn), that nature stays on the save. Later prose cannot reverse it
 * unless the player or a ledger event changes it.
 * Deterministic harvest + warden rewrite — not a Continuity-Warden LLM.
 */

import type { GameState, SceneFacts } from './types';

export type HookNature = 'accident' | 'intended' | 'bargain' | 'pawn';

export type HookLockSource = 'hook-card' | 'harvest' | 'player' | 'ledger';

export interface HookLock {
  nature: HookNature;
  /** One-line locked why for SNAPSHOT / manifest. */
  summary: string;
  lockedTurn: number;
  source: HookLockSource;
}

export type HookMention = {
  index: number;
  length: number;
  nature: HookNature;
  text: string;
  summary: string;
};

const ACCIDENT_SPAN =
  /\b(?:accidentally|by accident|wrong (?:person|hero|catch|soul|body)|instead of (?:the )?(?:intended|chosen|named|hero)|not the (?:name|one|hero) (?:on the rite|they (?:wanted|meant|summoned))|they did not mean|ritual(?:\s+\w+){0,6}\s+awry|gone awry|pulled through|you (?:are|were) leftover|one mistake on|you were extra|wrong catch)\b/gi;

const PAWN_SPAN =
  /\b(?:you were (?:bought|brought) here|bought here|as a (?:piece|pawn)|a pawn (?:for|in)|pawn for \w[\w']* game|(?:piece|pawn) for (?:their|his|her|the) (?:game|plot|war)|brought here as (?:a )?(?:piece|pawn|tool)|bought (?:you|here) as)\b/gi;

const INTENDED_SPAN =
  /\b(?:they (?:meant|intended) to summon you|you (?:are|were) the intended (?:hero|summon|champion)|they (?:paid for|wanted) you (?:specifically|as (?:their )?(?:hero|champion|pactborn))|the intended (?:hero|summon) (?:is|was) you)\b/gi;

const BARGAIN_SPAN =
  /\b(?:you (?:sold yourself|swore the pact|signed (?:the|on)|enlisted)|in exchange for|the bargain you (?:struck|made|accepted)|you agreed to (?:their|the) (?:pact|offer|deal))\b/gi;

const PLAYER_REVISE = {
  accident:
    /\b(?:it was (?:an )?accident|i (?:was|am) the wrong (?:person|hero)|they (?:grabbed|pulled|took) the wrong|instead of (?:the )?(?:intended|hero))\b/i,
  pawn:
    /\b(?:i (?:was|am) (?:a |their )?(?:pawn|piece)|they (?:bought|hired) me|i sold myself|brought me as (?:a )?(?:pawn|piece))\b/i,
  intended:
    /\b(?:i (?:was|am) (?:the )?intended|they meant (?:to (?:summon )?me|me)|i (?:am|was) the (?:hero|champion) they (?:wanted|paid for))\b/i,
  bargain:
    /\b(?:i (?:swore|signed|enlisted|took the (?:deal|offer|pact))|we (?:struck|made) a bargain)\b/i,
} as const;

const CANONICAL: Record<HookNature, string> = {
  accident: 'pulled here by accident, not as a chosen piece',
  intended: 'brought here as the one they meant to summon',
  bargain: 'here because of the bargain you struck',
  pawn: 'brought here as a piece in their game',
};

const BINDING_LABEL: Record<HookNature, string> = {
  accident: 'accident / wrong catch — not a purchased pawn and not the intended summon',
  intended: 'intended summon — they meant this arrival, not an accident or a purchased pawn',
  bargain: 'bargain — you are here because of a deal that was struck, not a silent rewrite',
  pawn: 'pawn / piece — brought as leverage, not the wrong person by accident',
};

function applyCase(sample: string, replacement: string): string {
  if (!sample) return replacement;
  if (sample[0] === sample[0]?.toUpperCase() && /[A-Z]/.test(sample[0]!)) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

function mention(index: number, text: string, nature: HookNature): HookMention {
  return {
    index,
    length: text.length,
    nature,
    text,
    summary: CANONICAL[nature],
  };
}

function collect(re: RegExp, text: string, nature: HookNature, into: HookMention[]): void {
  re.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    into.push(mention(m.index, m[0], nature));
  }
}

/** All why-here claims in reading order. Accident wins ties at the same index. */
export function listHookMentions(text: string): HookMention[] {
  if (!text) return [];
  const found: HookMention[] = [];
  collect(ACCIDENT_SPAN, text, 'accident', found);
  collect(PAWN_SPAN, text, 'pawn', found);
  collect(INTENDED_SPAN, text, 'intended', found);
  collect(BARGAIN_SPAN, text, 'bargain', found);
  found.sort((a, b) => a.index - b.index || naturePriority(a.nature) - naturePriority(b.nature));
  return found;
}

/** Accident (wrong-hero of a plot) outranks pawn/intended when they share a span. */
function naturePriority(nature: HookNature): number {
  switch (nature) {
    case 'accident':
      return 0;
    case 'pawn':
      return 1;
    case 'intended':
      return 2;
    case 'bargain':
      return 3;
  }
}

export function detectHookNature(text: string): HookMention | null {
  const found = listHookMentions(text);
  if (!found.length) return null;
  const first = found[0]!;
  const window = found.filter((m) => m.index <= first.index + 160);
  if (window.some((m) => m.nature === 'accident')) {
    return window.find((m) => m.nature === 'accident') ?? first;
  }
  return first;
}

export function classifyHookNature(text: string): HookNature | null {
  return detectHookNature(text)?.nature ?? null;
}

export function lockHookFromText(
  text: string,
  turn: number,
  source: HookLockSource
): HookLock | undefined {
  const hit = detectHookNature(text);
  if (!hit) return undefined;
  return {
    nature: hit.nature,
    summary: CANONICAL[hit.nature],
    lockedTurn: turn,
    source,
  };
}

export function seedHookLockFromPickedHook(
  pickedText?: string,
  fallback?: string,
  turn = 0
): HookLock | undefined {
  const blob = [pickedText, fallback].filter(Boolean).join('\n');
  return lockHookFromText(blob, turn, 'hook-card');
}

export function resolveHookLock(state: GameState): HookLock | undefined {
  return state.sceneFacts?.hookLock ?? state.openingEstablishment?.hookLock;
}

/**
 * Locked why for the warden. If still unlocked, the first claim in this beat
 * locks the rest of the beat (then harvest persists it).
 */
export function hookLockForWarden(state: GameState, incomingProse?: string): HookLock | undefined {
  const locked = resolveHookLock(state);
  if (locked) return locked;
  if (!incomingProse) return undefined;
  return lockHookFromText(incomingProse, state.turn ?? 0, 'harvest');
}

export function formatHookBindingLine(state: GameState): string | null {
  const lock = resolveHookLock(state);
  if (!lock) {
    return 'HOOK WHY: not yet locked — the first committed why-you-are-here (accident / intended / bargain / pawn) becomes canon. Do not flip it later.';
  }
  return `HOOK WHY (BINDING): ${BINDING_LABEL[lock.nature]}. Locked line: ${lock.summary}. Do not reverse this unless the player or a ledger event changes it.`;
}

export function hookManifestFact(lock: HookLock): string {
  return `Hook why: ${lock.nature} — ${lock.summary}`;
}

export function hookForbiddenReversal(lock: HookLock): string {
  return `Do not reverse locked hook why (${lock.nature})`;
}

/** True when prose claims a nature that contradicts the lock. */
export function detectHookContradiction(prose: string, lock: HookLock | undefined): string | null {
  if (!lock || !prose) return null;
  const mentions = listHookMentions(prose);
  const clash = mentions.find((m) => m.nature !== lock.nature && naturesConflict(lock.nature, m.nature));
  if (!clash) return null;
  return `Prose claims hook why ${clash.nature} but ledger is locked ${lock.nature}`;
}

export function naturesConflict(locked: HookNature, claimed: HookNature): boolean {
  if (locked === claimed) return false;
  if (locked === 'bargain' && claimed === 'bargain') return false;
  return true;
}

/**
 * Talk/ask that frames the locked why as the opposite nature.
 * “Ask why I was bought here” against an accident lock is not a player revise
 * (`they bought me` / `I am a pawn` would be) — ArcDirector must not pay XP.
 */
export function talkContradictsLockedWhy(
  playerInput: string | undefined,
  lock: HookLock | undefined
): boolean {
  if (!lock || !playerInput?.trim()) return false;
  if (playerMayReviseHook(playerInput)) return false;
  const claimed = classifyHookNature(playerInput);
  if (claimed && naturesConflict(lock.nature, claimed)) return true;
  const t = playerInput.toLowerCase();
  if (lock.nature === 'accident' && /\b(bought|pawn|paid for)\b/.test(t)) return true;
  if (lock.nature === 'pawn' && /\b(accident|wrong (?:person|hero)|pulled through|gone awry)\b/.test(t)) {
    return true;
  }
  return false;
}

/** Faction packet notes must not claim paid/bought why when lock is accident. */
export function factionNoteForHook(notes: string | undefined, nature: HookNature | undefined): string {
  const raw = (notes ?? '').trim();
  if (!raw || !nature) return raw;
  if (nature === 'accident' && /\b(paid for|bought|purchased)\b/i.test(raw)) {
    return 'The rite misfired. You have not sworn yet.';
  }
  if (nature === 'bargain' && /\b(paid for|bought)\b/i.test(raw) && !/\bbargain|deal|swore\b/i.test(raw)) {
    return 'A bargain is on the table. You have not sworn yet.';
  }
  return raw;
}

export function alignFactionNotesToHook<T extends { notes?: string }>(
  standings: T[],
  lock: HookLock | undefined
): T[] {
  if (!lock || !standings.length) return standings;
  return standings.map((f) => ({
    ...f,
    notes: factionNoteForHook(f.notes, lock.nature) || f.notes,
  }));
}

export function playerMayReviseHook(playerInput: string | undefined): HookNature | null {
  if (!playerInput?.trim()) return null;
  for (const nature of ['accident', 'pawn', 'intended', 'bargain'] as const) {
    if (PLAYER_REVISE[nature].test(playerInput)) return nature;
  }
  return null;
}

export function reviseHookLock(
  prev: HookLock | undefined,
  nature: HookNature,
  turn: number,
  source: 'player' | 'ledger'
): HookLock {
  return {
    nature,
    summary: CANONICAL[nature],
    lockedTurn: turn,
    source,
  };
}

/**
 * Optional grammar: "bought here" as arrival, not a shop. Runs even without a lock.
 */
export function scrubBoughtHereSlip(text: string): string {
  if (!text) return text;
  return text.replace(/\bbought here\b/gi, (span) => applyCase(span, 'brought here'));
}

function opposingNatures(locked: HookNature): HookNature[] {
  return (['accident', 'intended', 'bargain', 'pawn'] as HookNature[]).filter((n) =>
    naturesConflict(locked, n)
  );
}

/**
 * Rewrite why-here claims that contradict the locked nature.
 * Same-beat first mention is treated as the lock when none is persisted yet.
 */
export function scrubHookReversals(text: string, lock: HookLock | undefined): string {
  if (!text) return text;
  let next = scrubBoughtHereSlip(text);
  const effective = lock ?? lockHookFromText(next, 0, 'harvest');
  if (!effective) return next;

  const mentions = listHookMentions(next);
  if (!mentions.length) return next;

  const oppose = new Set(opposingNatures(effective.nature));
  let rebuilt = next;
  for (const hit of [...mentions].reverse()) {
    if (!oppose.has(hit.nature)) continue;
    const phrase = applyCase(hit.text, CANONICAL[effective.nature]);
    rebuilt = rebuilt.slice(0, hit.index) + phrase + rebuilt.slice(hit.index + hit.length);
  }
  return rebuilt.replace(/\s{2,}/g, ' ').replace(/\s+([.,;:])/g, '$1');
}

/**
 * First lock wins. Later beats cannot flip nature unless the player or a ledger
 * event revises it. Harvests from this beat when still unlocked.
 */
export function harvestHookIntoSceneFacts(
  prev: SceneFacts | undefined,
  narrative: string,
  turn = 0,
  playerInput?: string
): SceneFacts {
  const base: SceneFacts = prev
    ? { ...prev, updatedTurn: turn }
    : {
        crowd: 'unknown',
        noise: 'unknown',
        present: [],
        props: [],
        lastBeat: '',
        updatedTurn: turn,
      };

  const playerNature = playerMayReviseHook(playerInput);
  if (playerNature) {
    return {
      ...base,
      hookLock: reviseHookLock(base.hookLock, playerNature, turn, 'player'),
    };
  }

  if (base.hookLock) return base;

  const harvested = lockHookFromText(narrative, turn, 'harvest');
  if (!harvested) return base;
  return { ...base, hookLock: harvested };
}

/** Persist hookLock onto sceneFacts + openingEstablishment. */
export function attachHookLock(state: GameState, lock: HookLock | undefined): GameState {
  if (!lock) return state;
  const existing = resolveHookLock(state);
  const next = existing ?? lock;
  return {
    ...state,
    sceneFacts: state.sceneFacts
      ? { ...state.sceneFacts, hookLock: state.sceneFacts.hookLock ?? next }
      : { crowd: 'unknown', noise: 'unknown', present: [], props: [], lastBeat: '', updatedTurn: state.turn, hookLock: next },
    openingEstablishment: state.openingEstablishment
      ? { ...state.openingEstablishment, hookLock: state.openingEstablishment.hookLock ?? next }
      : state.openingEstablishment,
  };
}

/** Backfill from hook card + committed GM log (Continue / mid-save). */
export function backfillHookLockFromSave(state: GameState): HookLock | undefined {
  const existing = resolveHookLock(state);
  if (existing) return existing;
  const fromCard = seedHookLockFromPickedHook(
    state.openingEstablishment?.pickedHook,
    state.openingEstablishment?.pickedHookFallback,
    0
  );
  if (fromCard) return fromCard;
  const gmBlob = (state.log ?? [])
    .filter((e) => e.role === 'gm')
    .map((e) => e.content)
    .join('\n');
  return lockHookFromText(gmBlob, state.turn ?? 0, 'harvest');
}
