/**
 * Training-capture vocabularies — the ONE source for every enumerated value gm-turn writes to
 * public.gm_turn_captures. The migration's CHECK constraints must list exactly these values;
 * src/game/trainingCaptureVocab.test.ts reads the migration and fails if they drift.
 */

/** Why a call may be captured (consent basis). Test accounts are `test`. */
export const CAPTURE_BASES = ['founder', 'staff', 'test', 'opt_in'] as const;
export type CaptureBasis = (typeof CAPTURE_BASES)[number];

/** One row per model call; only `writer` is a gameplay turn. */
export const CAPTURE_CALL_KINDS = ['writer', 'rewrite', 'repair', 'check'] as const;
export type CaptureCallKind = (typeof CAPTURE_CALL_KINDS)[number];

/** Training rights of the host that served the call. */
export const TRAINING_RIGHTS = ['allowed', 'conditional', 'excluded', 'unknown'] as const;
export type TrainingRights = (typeof TRAINING_RIGHTS)[number];

/** Whose OpenRouter key placed the call. */
export const CAPTURE_KEY_SOURCES = ['server', 'player'] as const;
export type CaptureKeySource = (typeof CAPTURE_KEY_SOURCES)[number];

/** Review status; inserts are always `candidate`. */
export const CAPTURE_STATUSES = ['candidate', 'accepted', 'rejected', 'quarantined'] as const;
export type CaptureStatus = (typeof CAPTURE_STATUSES)[number];

/** How the call ended. */
export const CAPTURE_COMPLETION_STATUSES = ['ok', 'empty', 'error', 'rate_limited'] as const;
export type CaptureCompletionStatus = (typeof CAPTURE_COMPLETION_STATUSES)[number];
