/**
 * Error Repair Warden — deterministic auto-repair for recurring playtest failure classes.
 * Distinct from Continuity Warden (LLM classifier) and runWarden (post-GM claim scrub).
 * See docs/research/ERROR-FIX-LOG.md.
 */

import type { GameState, Quest } from './types';
import { isAloneArrivalPick, isAloneArrivalOpening } from './openingEstablishment';
import { adaptStarterQuestsForArrival } from './questPlay';
import { getCampaignBibleById } from '@/data/campaigns';

/** Bump when adding load-time repairs that must re-run on old saves. */
export const CURRENT_ERROR_REPAIR_REVISION = 2;

export type FailureClass =
  | 'turn_proxy'
  | 'opening_contract'
  | 'quest_coherence'
  | 'continuity_prose'
  | 'chrome_hud'
  | 'art_hosted'
  | 'save_schema'
  | 'deploy_ops';

export type TurnFailKind =
  | 'timeout'
  | 'network'
  | 'empty'
  | 'rate_limit'
  | 'auth'
  | 'client_bug'
  | 'unknown';

export type ErrorRepairNote = {
  class: FailureClass;
  code: string;
  detail: string;
};

export type ErrorRepairResult = {
  state: GameState;
  dirty: boolean;
  notes: ErrorRepairNote[];
};

const ALONE_QUEST_BAD =
  /Hear why Pellane wanted you|Swear the Pact, refuse it, or walk away before anyone owns your name/i;

/**
 * Default / early / first-post-open proxy budgets (Class A).
 * Mid-game Free writer routinely exceeds 30s (session aaabaae0 turns 15–18).
 * Base default is 55s; hosted Free mid-game gets 60s.
 */
export const GM_PROXY_TIMEOUT_DEFAULT_MS = 55_000;
export const GM_PROXY_TIMEOUT_FREE_DEFAULT_MS = 60_000;
export const GM_PROXY_TIMEOUT_EARLY_MS = 55_000;
export const GM_PROXY_TIMEOUT_FIRST_POST_OPEN_MS = 75_000;

/** Initial attempt + this many transport retries (timeout / network / empty). */
export const TURN_TRANSPORT_MAX_AUTO_RETRIES = 2;
export const TURN_TRANSPORT_RETRY_BACKOFF_MS = [700, 1800] as const;

/**
 * Longer budget for the first real GM turns after opening covers (and early honeymoon).
 * Free cold starts routinely exceed a short hard abort — mid-game Free also needs ≥55–60s.
 */
export function gmProxyTimeoutMsForState(
  state: Pick<GameState, 'turn' | 'openingEstablishment' | 'storyStartTextTurnsRemaining'>,
  opts?: { writerTier?: string | null }
): number {
  const turn = state.turn ?? 0;
  const est = state.openingEstablishment;
  const honeymoon = state.storyStartTextTurnsRemaining ?? 0;
  const freeWriter = (opts?.writerTier ?? '').toLowerCase() === 'free';
  if (est?.complete === true && (honeymoon > 0 || turn <= 5)) {
    return GM_PROXY_TIMEOUT_FIRST_POST_OPEN_MS;
  }
  if (turn <= 8) return GM_PROXY_TIMEOUT_EARLY_MS;
  return freeWriter ? GM_PROXY_TIMEOUT_FREE_DEFAULT_MS : GM_PROXY_TIMEOUT_DEFAULT_MS;
}

/** Map proxy / fetch errors to a stable class for toast + retry policy. */
export function classifyTurnFailure(err: unknown): TurnFailKind {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  const name = err instanceof Error ? err.name : '';
  if (/still compiling|aborted|AbortError|timed?\s*out/i.test(msg) || name === 'AbortError') {
    return 'timeout';
  }
  if (
    /Failed to fetch|NetworkError|network|ECONNRESET|ENOTFOUND|Load failed|Network request failed/i.test(
      msg
    )
  ) {
    return 'network';
  }
  if (/429|Rate limit/i.test(msg)) return 'rate_limit';
  // Free writers sometimes return "The AI provider returned no content." — must be empty (retryable), not unknown.
  if (/empty content|empty response|returned no content|\bno content\b/i.test(msg)) return 'empty';
  if (/auth|JWT|session|401|403/i.test(msg)) return 'auth';
  if (/is not defined|Cannot read|undefined is not/i.test(msg)) return 'client_bug';
  return 'unknown';
}

export function turnFailPlayerMessage(kind: TurnFailKind): string {
  switch (kind) {
    case 'timeout':
      return 'The GM took too long. Your line is back in the box — tap send to try again.';
    case 'network':
      return 'Connection dropped. Your line is back in the box — check signal and retry.';
    case 'empty':
      return 'The GM returned nothing. Your line is back — try once more.';
    case 'rate_limit':
      return 'Too many requests right now. Wait a moment, then send again.';
    case 'auth':
      return 'Sign-in expired or blocked. Refresh the page, then retry.';
    case 'client_bug':
      return 'A client bug blocked this turn. Soft refresh and retry — report if it repeats.';
    default:
      return 'That turn did not land. Your line is back in the box — try again.';
  }
}

/** After transport auto-retries are exhausted — still restores the draft. */
export function turnFailExhaustedMessage(kind: TurnFailKind): string {
  switch (kind) {
    case 'timeout':
      return 'Still timing out after retry. Your line is back in the box — tap send once more.';
    case 'network':
      return 'Still no connection after retry. Your line is back in the box — check signal, gm-turn deploy, or try another network.';
    case 'empty':
      return 'Still empty after retry. Your line is back — try once more.';
    default:
      return turnFailPlayerMessage(kind);
  }
}

export function turnTransportRetryMessage(attempt: number, kind: TurnFailKind): string {
  if (kind === 'network') return `Connection glitch — retrying (${attempt})…`;
  if (kind === 'timeout') return `Timed out — retrying (${attempt})…`;
  return `Empty reply — retrying (${attempt})…`;
}

/** Prefer auto-retry for flaky transport; never for auth/client bugs. */
export function shouldAutoRetryTurn(kind: TurnFailKind): boolean {
  return kind === 'timeout' || kind === 'network' || kind === 'empty';
}

export function transportRetryBackoffMs(retryIndex: number): number {
  return TURN_TRANSPORT_RETRY_BACKOFF_MS[retryIndex] ?? 2000;
}

function stampAloneArrival(state: GameState, notes: ErrorRepairNote[]): GameState {
  const est = state.openingEstablishment;
  if (!est || est.aloneArrival !== undefined) return state;
  if (state.campaignBibleId !== 'summoned-pact') return state;
  const alone = isAloneArrivalPick({
    text: est.pickedHook,
    location: state.currentLocation,
    fallback: est.pickedHookFallback,
  });
  notes.push({
    class: 'opening_contract',
    code: 'ERR_ALONE_STAMP',
    detail: alone ? 'stamped aloneArrival=true from hook' : 'stamped aloneArrival=false',
  });
  return {
    ...state,
    openingEstablishment: { ...est, aloneArrival: alone },
  };
}

function repairAloneStarterQuest(state: GameState, notes: ErrorRepairNote[]): GameState {
  if (!isAloneArrivalOpening(state)) return state;
  if (state.campaignBibleId !== 'summoned-pact') return state;
  const bible = getCampaignBibleById('summoned-pact');
  const seeds = bible?.starterQuests ?? [];
  if (!seeds.length) return state;

  const adapted = adaptStarterQuestsForArrival(seeds, true);
  const aloneSeed = adapted.find((s) => s.id === 'sp-quest-1');
  if (!aloneSeed) return state;

  const quests = state.quests ?? [];
  let dirty = false;
  const nextQuests: Quest[] = quests.map((q) => {
    if (q.id !== 'sp-quest-1' && !/Circle.?s Price/i.test(q.name ?? '')) {
      return q;
    }
    const objBlob = (q.objectives ?? []).map((o) => o.description).join(' ');
    if (!ALONE_QUEST_BAD.test(q.description ?? '') && !/Pellane|Swear the Pact/i.test(q.description ?? '') && !ALONE_QUEST_BAD.test(objBlob)) {
      return q;
    }
    dirty = true;
    return {
      ...q,
      description: aloneSeed.description,
      objectives: aloneSeed.objectives.map((desc, i) => ({
        id: q.objectives?.[i]?.id ?? `obj-${i}`,
        description: desc,
        completed: q.objectives?.[i]?.completed ?? false,
      })),
    };
  });

  if (!dirty) return state;
  notes.push({
    class: 'quest_coherence',
    code: 'ERR_ALONE_QUEST',
    detail: 'rewrote Circle’s Price for alone arrival',
  });
  return { ...state, quests: nextQuests };
}

/** Circle Blessing is a glitched passive — never equipped Shoulders (reads as a cloak). */
function repairCircleBlessingSlot(state: GameState, notes: ErrorRepairNote[]): GameState {
  const inv = state.inventory ?? [];
  let dirty = false;
  const nextInv = inv.map((item) => {
    if (!/circle blessing/i.test(item.name ?? '')) return item;
    if (!item.equipped && item.slot !== 'Shoulders') return item;
    dirty = true;
    return { ...item, equipped: false, slot: undefined };
  });
  if (!dirty) return state;
  notes.push({
    class: 'opening_contract',
    code: 'ERR_CIRCLE_BLESSING_SLOT',
    detail: 'Circle Blessing unequipped from Shoulders (passive / bag)',
  });
  return { ...state, inventory: nextInv };
}

/**
 * Idempotent load/continue repairs for known recurrence classes.
 * Safe to call every Continue; only mutates when content is wrong.
 */
export function applyErrorRepairs(state: GameState): ErrorRepairResult {
  const notes: ErrorRepairNote[] = [];
  let next = stampAloneArrival(state, notes);
  next = repairAloneStarterQuest(next, notes);
  next = repairCircleBlessingSlot(next, notes);
  const needsRev = (next.errorRepairRevision ?? 0) < CURRENT_ERROR_REPAIR_REVISION;
  if (notes.length === 0 && !needsRev) {
    return { state, dirty: false, notes: [] };
  }
  if (needsRev) {
    notes.push({
      class: 'save_schema',
      code: 'ERR_REV_BUMP',
      detail: `errorRepairRevision → ${CURRENT_ERROR_REPAIR_REVISION}`,
    });
  }
  return {
    state: { ...next, errorRepairRevision: CURRENT_ERROR_REPAIR_REVISION },
    dirty: true,
    notes,
  };
}

/** Catalog for agents — what each class owns (not runtime). */
export const FAILURE_CLASS_OWNERS: Record<
  FailureClass,
  { owner: string; log: string }
> = {
  turn_proxy: {
    owner: 'classifyTurnFailure + gmProxy + useGame refund path',
    log: 'ERROR-FIX-LOG Class A',
  },
  opening_contract: {
    owner: 'openingEstablishment OpeningContract / alone covers',
    log: 'ERROR-FIX-LOG Class B',
  },
  quest_coherence: {
    owner: 'questPlay + applyErrorRepairs',
    log: 'ERROR-FIX-LOG Class C',
  },
  continuity_prose: {
    owner: 'runWarden + proseWarden',
    log: 'ERROR-FIX-LOG Class D',
  },
  chrome_hud: {
    owner: 'Hud.tsx layout contract (viewport tests)',
    log: 'ERROR-FIX-LOG Class E',
  },
  art_hosted: {
    owner: 'generate-image + memorableMoments',
    log: 'ERROR-FIX-LOG Class F',
  },
  save_schema: {
    owner: 'saveMigration.applySaveRepair',
    log: 'ERROR-FIX-LOG Class G',
  },
  deploy_ops: {
    owner: 'HUD stamp + edge deploy checklist',
    log: 'ERROR-FIX-LOG Class H',
  },
};

