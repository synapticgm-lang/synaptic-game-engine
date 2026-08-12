import type { TimelineFact } from './types';

/** Format recent facts for prompt injection (newest last). */
export function formatTimelineForPrompt(
  timeline: TimelineFact[] | undefined,
  limit = 20
): string {
  const slice = (timeline ?? []).slice(-limit);
  if (slice.length === 0) return '(no timeline facts yet)';
  return slice.map((f) => `T${f.turn} [${f.kind}] ${f.text}`).join('\n');
}
