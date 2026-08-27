/** Edge stub — intent streak for SNAPSHOT stagnation rail. */
export function countPlayerIntentStreak(state: {
  log?: Array<{ role?: string; content?: string }>;
}): { key: string; count: number } {
  const log = state.log ?? [];
  let key = '';
  let count = 0;
  for (let i = log.length - 1; i >= 0; i--) {
    const e = log[i];
    if (e?.role !== 'player') continue;
    const k = (e.content ?? '').toLowerCase().slice(0, 48);
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
