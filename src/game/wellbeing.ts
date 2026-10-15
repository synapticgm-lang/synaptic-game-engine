/**
 * The player's wellbeing gauge (Order S part 2; docs/design/wellbeing-safety-guide.md). It reads the *player*, never
 * the character's fate (that is `commitDeath('self')`), and its only output is a check-in card outside the story:
 * no block, no penalty, no score, nothing the writer sees. The gauge is counts and timestamps on this device only.
 */
import { aimsAtSelf } from './intentParser';

/** F1 theme (a self-aimed act: the same reading that sends the engine to `commitDeath('self')`), F2-F5 below. */
export type WellbeingFlag = 'theme' | 'distress' | 'method' | 'farewell' | 'hopeless';

export interface WellbeingReading {
  flags: WellbeingFlag[];
  /** F6: a stated age under 18 (or a Kid Mode save, from the caller). */
  under18: boolean;
}

/**
 * One reading per clause shape (speaker, target, ask): framing (the line is about the character or the game, so it
 * is not the player speaking as themselves), the player wishing their own death (F2), asking how to die (F3, in or
 * out of character), saying a last goodbye (F4), hopelessness about themselves (F5), a stated age (F6).
 */
const PLAYER_READING =
  /(?<frame>\bmy\s+character\b|\bin[- ]?game\b|\bin\s+the\s+story\b|\bas\s+a\s+game\s+action\b)|(?<distress>\bi\s+(?:really\s+)?(?:want|wish)\s+(?:to\s+die|i\s+(?:was|were)\s+dead)\b|\bsuicid(?:e|al)\b|\bself[- ]?harm|\bend\s+my\s+life\b|\bkill\s+myself\b)|(?<method>\b(?:how\s+(?:many|much|do\s+i|to|would\s+i|can\s+i)|easiest|quickest|painless|least\s+painful)\b[^.?!]{0,60}\b(?:die|kill\s+(?:my|your)sel(?:f|ves)|end\s+(?:it\s+all|my\s+life)|suicid\w*|overdose)\b|\blethal\s+dose\b)|(?<farewell>\bthis\s+is\s+my\s+last\s+(?:session|game|time)\b|\bgoodbye\s+(?:everyone|all|forever)\b|\btell\s+(?:them|everyone|my\s+\w+)\s+i'?m\s+sorry\b|\bgiving\s+(?:away\s+)?(?:all\s+)?my\s+(?:things|stuff)(?:\s+away)?\b)|(?<hopeless>\bno\s+point\s+(?:in\s+)?(?:anything|living|going\s+on|any\s*more)\b|\b(?:everyone|they)(?:'d|\s+would)?\s+(?:be\s+)?better\s+off\s+without\s+me\b|\bcan'?t\s+go\s+on\b|\bi'?m\s+(?:just\s+)?a\s+burden\b)|(?<age>\bi'?m\s+(?:1[0-7]|[5-9])(?:\s+years?\s+old)?\b(?!\s*(?:minutes|mins|hours|feet|ft|metres|meters|gold|gp|%))|\bi'?m\s+in\s+year\s+(?:[3-9]|1[01])\b)/gi;

export function readWellbeing(text: string, opts: { kid?: boolean } = {}): WellbeingReading {
  const t = (text ?? '').replace(/\s+/g, ' ').trim();
  const flags = new Set<WellbeingFlag>();
  let under18 = !!opts.kid;
  if (aimsAtSelf(t)) flags.add('theme');
  const found = [...t.matchAll(PLAYER_READING)];
  const asCharacter = found.some((m) => m.groups?.frame);
  for (const m of found) {
    const g = m.groups ?? {};
    if (g.frame) continue;
    if (g.method) flags.add('method');
    else if (g.age) under18 = true;
    else if (asCharacter) flags.add('theme');
    else if (g.distress) flags.add('distress');
    else if (g.farewell) flags.add('farewell');
    else if (g.hopeless) flags.add('hopeless');
  }
  return { flags: [...flags], under18 };
}

/** Device-only: counts are timestamps of the last window, never the text. */
export interface WellbeingGauge {
  themes: number[];
  hopeless: number[];
  /** A pausable card (F1 / F5) stays quiet until then. */
  quietUntil?: number;
}

export interface CheckInCard {
  /** F2-F4 cannot be paused; F1 / F5 can (settings, or 24 h after showing). */
  pausable: boolean;
  lines: string[];
}

export const WELLBEING_DEFAULTS = { threshold: 3, windowMs: 24 * 3_600_000, hopelessPerSession: 2 };

/** Helplines by country (guide §5): two or three, call / text / web, 24/7. Check the numbers each release. */
export function helplinesFor(locale: string | undefined, opts: { under18?: boolean; danger?: boolean } = {}): string[] {
  const country = (locale ?? '').replace('_', '-').split('-')[1]?.toUpperCase() ?? '';
  if (country === 'GB' || country === 'UK') {
    return [
      ...(opts.danger ? ['In danger right now: call 999'] : []),
      ...(opts.under18 ? ['Childline: call 0800 1111 (free, under 19)'] : []),
      'Samaritans: call 116 123 (free, 24/7)',
      'Shout: text SHOUT to 85258 (free, 24/7)',
    ];
  }
  if (country === 'US') return ['988: call or text (free, 24/7)'];
  return ['findahelpline.com (US: 988)'];
}

/** One turn's reading onto the gauge. A single act never shows the pausable card; F2-F4 show it at once. */
export function gaugeCheckIn(
  gauge: WellbeingGauge,
  reading: WellbeingReading,
  opts: { now: number; locale?: string; checkInsOn?: boolean; threshold?: number; windowMs?: number },
): { gauge: WellbeingGauge; card: CheckInCard | null } {
  const windowMs = opts.windowMs ?? WELLBEING_DEFAULTS.windowMs;
  const since = opts.now - windowMs;
  const f = new Set(reading.flags);
  const next: WellbeingGauge = {
    themes: [...gauge.themes.filter((t) => t > since), ...(f.has('theme') ? [opts.now] : [])],
    hopeless: [...gauge.hopeless.filter((t) => t > since), ...(f.has('hopeless') ? [opts.now] : [])],
    ...(gauge.quietUntil && gauge.quietUntil > opts.now ? { quietUntil: gauge.quietUntil } : {}),
  };
  const danger = f.has('method') || f.has('farewell');
  const lines = helplinesFor(opts.locale, { under18: reading.under18, danger });
  if (danger || f.has('distress')) return { gauge: next, card: { pausable: false, lines } };
  const threshold = reading.under18 ? 1 : opts.threshold ?? WELLBEING_DEFAULTS.threshold;
  const hopelessAt = reading.under18 ? 1 : WELLBEING_DEFAULTS.hopelessPerSession;
  const due = (f.has('theme') && next.themes.length >= threshold) || (f.has('hopeless') && next.hopeless.length >= hopelessAt);
  if (!due || opts.checkInsOn === false || next.quietUntil) return { gauge: next, card: null };
  return { gauge: { ...next, quietUntil: opts.now + windowMs }, card: { pausable: true, lines } };
}

const GAUGE_KEY = 'synapticgm-wellbeing';

export function loadGauge(): WellbeingGauge {
  try {
    const raw = JSON.parse(globalThis.localStorage?.getItem(GAUGE_KEY) ?? 'null');
    return { themes: [], hopeless: [], ...(raw && typeof raw === 'object' ? raw : {}) };
  } catch {
    return { themes: [], hopeless: [] };
  }
}

export function saveGauge(gauge: WellbeingGauge): void {
  try {
    globalThis.localStorage?.setItem(GAUGE_KEY, JSON.stringify(gauge));
  } catch {
    /* private mode: the card still shows this turn */
  }
}

/** The card's text (wording is the shipped signposting until the §5a drafts pass expert review). */
export function formatCheckInCard(card: CheckInCard): string {
  return [
    "If you're going through a tough time, you don't have to handle it alone:",
    ...card.lines,
    'This is a game, not a crisis service. Nothing you play is shared.',
  ].join('\n');
}
