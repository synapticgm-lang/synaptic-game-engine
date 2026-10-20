/**
 * q75-ROUNDTYPED — consecutive typed_action_not_sent tracking.
 * After 3 in a row, force an on-screen chip; if still stuck, stop with a clear verdict.
 */

/** Bump or reset the consecutive typed-not-sent counter. */
export function noteTypedNotSent(consecutive, { failed = false } = {}) {
  if (failed) return (consecutive || 0) + 1;
  return 0;
}

/** After this many consecutive typed_action_not_sent, pick a chip instead of typing. */
export const TYPED_NOT_SENT_CHIP_AFTER = 3;

/** True when the harness should fall back to an on-screen option. */
export function shouldForceChipAfterTypedFail(consecutive) {
  return (consecutive || 0) >= TYPED_NOT_SENT_CHIP_AFTER;
}

/**
 * Verdict when chip fallback still cannot advance the turn.
 * @param {number} turn
 */
export function typedStuckVerdict(turn) {
  return `stuck: input not accepted at T${turn}`;
}
