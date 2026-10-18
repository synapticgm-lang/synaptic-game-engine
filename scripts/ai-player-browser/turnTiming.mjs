/**
 * q51c-AIPLOG: clock from pick submit (chip click or typed Enter)
 * until the new GM reply has finished streaming.
 */

function wholeMs(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.round(x);
}

/** Stamp at the moment the pick is submitted. */
export function startTurnClock() {
  const ms = Date.now();
  return { ms, iso: new Date(ms).toISOString() };
}

/** Whole milliseconds from the stamp until now. */
export function replyMsSince(stamp) {
  if (!stamp || !Number.isFinite(stamp.ms)) return 0;
  return wholeMs(Date.now() - stamp.ms);
}

/**
 * @param {{ ms: number, iso: string }} stamp
 * @param {number | Date} [now] reply-finished instant (default Date.now())
 * @returns {{ ts: string, replyMs: number }}
 */
export function turnTimeFields(stamp, now) {
  const end = now instanceof Date ? now.getTime() : (now == null ? Date.now() : Number(now));
  const ms = stamp && Number.isFinite(stamp.ms) ? stamp.ms : end;
  const ts = stamp && typeof stamp.iso === 'string' && stamp.iso
    ? stamp.iso
    : new Date(ms).toISOString();
  return { ts, replyMs: wholeMs(end - ms) };
}
