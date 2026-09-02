/** Edge stub — intent streak for SNAPSHOT stagnation rail. */
export function countPlayerIntentStreak(state: {
  log?: Array<{ role?: string; content?: unknown }>;
}): { key: string; count: number } {
  const log = state.log ?? [];
  const start = Math.max(0, log.length - 80);
  let key = '';
  let count = 0;
  for (let i = log.length - 1; i >= start; i--) {
    const e = log[i];
    if (e?.role !== 'player') continue;
    const raw = typeof e.content === 'string' ? e.content : '';
    const k = raw.toLowerCase().slice(0, 48);
    if (!key) {
      key = k || 'empty';
      count = 1;
      continue;
    }
    if (k === key) count += 1;
    else break;
  }
  return { key: key || 'empty', count };
}
