import type { TimelineFact, TimelineFactKind, TimelineTagKind, TimelineVerb } from './types';

const WS = /\s+/g;

/** Render display text from a tag (never store free prose as the source of truth). */
export function renderTagText(verb: TimelineVerb, kind: TimelineTagKind | TimelineFactKind, name: string, detail?: string): string {
  const who = (name ?? '').replace(WS, ' ').trim();
  const note = (detail ?? '').replace(WS, ' ').trim();
  if (kind === 'said') return note ? `${who}: ${note}` : `${who} said`;
  if (verb === 'met' && note) return `${verb}: ${who}, ${note}`;
  if (verb === 'step' && note) return `${verb}: ${who} ${note}`;
  if (note && (verb === 'appeared' || verb === 'gained' || verb === 'lost' || verb === 'used' || verb === 'dropped')) return `${verb}: ${who} (${note})`;
  if (note) return `${verb}: ${who} — ${note}`;
  return `${verb}: ${who}`;
}

/** Format recent facts for prompt injection (newest last). */
export function formatTimelineForPrompt(timeline: TimelineFact[] | undefined, limit = 20): string {
  const slice = (timeline ?? []).slice(-limit);
  if (slice.length === 0) return '(no timeline facts yet)';
  return slice.map((f) => {
    if (f.verb && f.name) {
      const body = f.verb === 'said' ? renderTagText('said', 'said', f.name, f.detail) : `${f.verb}: ${f.name}${f.detail ? `, ${f.detail}` : ''}`;
      return `T${f.turn} ${body}`;
    }
    return `T${f.turn} [${f.kind}] ${f.text}`;
  }).join('\n');
}
