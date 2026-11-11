/**
 * Live AI opening (non-PYOA): validate, retry once, derive journal/rite,
 * shape concrete offer chips, never fall back to authored page 1.
 */
import type { GameState, Quest, Settings } from './types';
import { openingInstanceOf, givenNameOf, escapeRe } from './openingInstance';
import {
  formatOpeningWriterNotes,
  openingChoiceCount,
  retiredNameNeedles,
  STORYTELLER_RETRY_CHIP,
  STORYTELLER_RETRY_MESSAGE,
} from './openingWriterNotes';

export { formatOpeningWriterNotes, openingChoiceCount, STORYTELLER_RETRY_CHIP, STORYTELLER_RETRY_MESSAGE };

export type LiveOpeningWriter = (state: GameState, playerInput: string, settings: Settings) => Promise<string>;

export interface LiveOpeningSuccess {
  ok: true;
  prose: string;
  retried: boolean;
  pads: string[];
  journal: DerivedOpeningJournal;
  rite: DerivedOpeningRite;
}

export interface LiveOpeningFailure {
  ok: false;
  error: string;
  pads: string[];
}

export type LiveOpeningResult = LiveOpeningSuccess | LiveOpeningFailure;

export interface DerivedOpeningJournal {
  title: string;
  description: string;
  objectives: string[];
}

export interface DerivedOpeningRite {
  giverName: string;
  riteTitle: string;
  offerSentence: string;
  acceptChip: string;
  refuseChip: string;
}

let testWriter: LiveOpeningWriter | null = null;

export function setLiveOpeningWriterForTests(writer: LiveOpeningWriter | null): void {
  testWriter = writer;
}

export function isVitestEnv(): boolean {
  try {
    if (typeof process !== 'undefined' && (process.env?.VITEST || process.env?.VITEST_WORKER_ID)) return true;
    if (typeof import.meta !== 'undefined' && (import.meta as { env?: { MODE?: string; VITEST?: boolean } }).env?.VITEST) {
      return true;
    }
    if (typeof import.meta !== 'undefined' && (import.meta as { env?: { MODE?: string } }).env?.MODE === 'test') {
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

function sentenceCount(text: string): number {
  return (text.match(/[.!?]["']?\s+[A-Z]|[.!?]["']?\s*$/g) ?? []).length;
}

function mentionsName(text: string, name: string): boolean {
  const parts = [name, ...name.split(/\s+/).filter((p) => p.length >= 4)];
  return parts.some((p) => new RegExp(`\\b${escapeRe(p)}\\b`, 'i').test(text));
}

const COMMON_STORY_WORDS = new Set([
  'your', 'you', 'their', 'them', 'this', 'that', 'with', 'from', 'have', 'been', 'were', 'they',
  'heat', 'light', 'trail', 'road', 'circle', 'place', 'here', 'already', 'back', 'down', 'over',
  'under', 'into', 'then', 'when', 'what', 'where', 'there', 'about', 'after', 'before', 'still',
  'just', 'like', 'than', 'some', 'more', 'only', 'also', 'even', 'well', 'upon', 'onto',
]);

function similarToAuthored(text: string, authored: string | undefined): boolean {
  const a = (authored ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  const b = text.replace(/\s+/g, ' ').trim().toLowerCase();
  if (!a || a.length < 40) return false;
  // Verbatim reprint of a long authored span, not shared setting words (heat, trail, ash).
  const span = a.slice(0, Math.min(90, a.length)).trim();
  if (span.length >= 70 && b.includes(span)) return true;
  const content = (s: string) => s.split(/[^a-z]+/).filter((w) => w.length >= 5 && !COMMON_STORY_WORDS.has(w));
  const wordsA = [...new Set(content(a))];
  if (wordsA.length < 10) return false;
  const setB = new Set(content(b));
  const hit = wordsA.filter((w) => setB.has(w)).length;
  return hit / wordsA.length > 0.85;
}

export function validateLiveOpeningProse(state: GameState, prose: string): string[] {
  const errors: string[] = [];
  const text = (prose ?? '').replace(/\s+/g, ' ').trim();
  if (text.length < 180) errors.push('too short');
  if (sentenceCount(text) < 2) errors.push('needs at least two sentences');
  if (/\bsomeone here\b|\bsomeone nearby\b|\ba figure\b|\ba person here\b|\bpeople here\b|\bsomeone in the scene\b|\bunnamed (?:man|woman|person|figure)\b/i.test(text)) {
    errors.push('vague salad wording');
  }
  if (/Do not invent|Do not place|Ruin level:|The camera stays HERE|Who is here \/ who summoned|Opening offer \(optional|LOCKED PLACE:|【 OPENING/i.test(text)) {
    errors.push('pointer dump');
  }
  const inst = openingInstanceOf(state);
  if (inst?.placeName && !mentionsName(text, inst.placeName)) {
    errors.push(`missing place ${inst.placeName}`);
  }
  if (inst && !inst.alone && inst.cast.length) {
    const hit = inst.cast.some((c) => mentionsName(text, c.name));
    if (!hit) errors.push('missing named person');
  }
  const locked = [
    inst?.placeName,
    inst?.settlementName,
    inst?.factionName,
    ...(inst?.cast ?? []).map((c) => c.name),
  ].filter(Boolean) as string[];
  for (const r of inst?.retiredNames ?? []) {
    const needles = retiredNameNeedles(r);
    if (!needles.length) continue;
    if (locked.some((n) => needles.every((w) => n.toLowerCase().includes(w.toLowerCase())))) continue;
    if (needles.some((w) => new RegExp(`\\b${escapeRe(w)}\\b`, 'i').test(text))) {
      errors.push(`retired name ${r}`);
    }
  }
  if (similarToAuthored(text, state.openingEstablishment?.authoredPage1Retired)) {
    errors.push('authored reprint');
  }
  return errors;
}

/** Deterministic mock used in unit tests so CI never hits the network. */
export function mockLiveOpeningProse(state: GameState): string {
  const inst = openingInstanceOf(state);
  const place = inst?.placeName || state.currentLocation || 'the opening place';
  const lead = inst?.cast[0];
  const second = inst?.cast[1];
  const offer = inst?.offerSummary || inst?.offerChips.find((c) => c.kind === 'accept')?.note || 'an offer already on the table';
  const people = lead
    ? second
      ? `${lead.name} is already in motion, and ${second.name} has not looked away.`
      : `${lead.name} is already in motion and has not looked away.`
    : 'The place is quiet enough that you can hear your own breath.';
  const offerLine = lead
    ? `The offer is plain: ${offer}. You can take it, or you can keep your own kit.`
    : `Nothing has been pressed into your hands. ${offer}`;
  return [
    `${place} is already under you, named and ordinary, not a blur.`,
    people,
    inst?.pressing ? inst.pressing : 'Whatever pulled you here has not finished with you.',
    offerLine,
    inst?.how ? inst.how : 'You have not yet decided which way to move.',
  ]
    .filter(Boolean)
    .join(' ');
}

function chipFollowsProse(label: string, prose: string): boolean {
  const words = label.split(/\s+/).filter((w) => w.length >= 4 && !/^(with|from|your|their|this|that|keep|take|walk|hear|offer|own)$/i.test(w));
  if (!words.length) return true;
  return words.some((w) => new RegExp(`\\b${escapeRe(w.replace(/'s$/, ''))}\\b`, 'i').test(prose));
}

export function shapeOpeningPads(state: GameState, prose: string): string[] {
  const n = openingChoiceCount(state);
  const inst = openingInstanceOf(state);
  const labels: string[] = [];
  const push = (label: string | undefined) => {
    const t = (label ?? '').replace(/\s+/g, ' ').trim();
    if (!t) return;
    if (labels.some((x) => x.toLowerCase() === t.toLowerCase())) return;
    labels.push(t);
  };
  const chips = inst?.offerChips ?? [];
  const preferred = chips.filter((c) => chipFollowsProse(c.label, prose));
  const rest = chips.filter((c) => !preferred.includes(c));
  for (const c of [...preferred, ...rest]) {
    if (labels.length >= n) break;
    push(c.label);
  }
  for (const member of inst?.cast ?? []) {
    if (labels.length >= n) break;
    if (!mentionsName(prose, member.name)) continue;
    push(`Ask ${givenNameOf(member.name)} what they want`);
  }
  if (labels.length < n) push('Look around first');
  if (labels.length < n) push('Wait and listen');
  if (labels.length < n) push('Study the immediate ground');
  return labels.slice(0, n);
}

function clipJournalTitle(raw: string, max = 72): string {
  let t = (raw ?? '').replace(/\s+/g, ' ').trim().replace(/[.,;:]+$/, '');
  t = t.replace(/^(?:the offer on the table:\s*)/i, '');
  if (!t) return '';
  if (/^hear \S+ out$/i.test(t)) return '';
  if (t.length > max) t = t.slice(0, max - 1).replace(/\s+\S*$/, '').replace(/[.,;:]+$/, '') + '…';
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function deriveOpeningJournal(state: GameState, prose?: string): DerivedOpeningJournal {
  const inst = openingInstanceOf(state);
  const lead = inst?.cast[0];
  const place = inst?.placeName || state.currentLocation || 'this place';
  const offer = inst?.offerSummary || inst?.offerChips.find((c) => c.kind === 'accept')?.note;
  const accept = inst?.offerChips.find((c) => c.kind === 'accept');
  const fromScene = (prose ?? '').replace(/\s+/g, ' ').trim();
  const itemFromNote = accept?.note?.replace(/^.*?\boffers\s+/i, '').trim();
  const title =
    clipJournalTitle(itemFromNote && lead ? `${givenNameOf(lead.name)}'s ${itemFromNote}` : itemFromNote || '')
    || clipJournalTitle(offer ?? '')
    || clipJournalTitle(accept?.label ?? '')
    || clipJournalTitle((fromScene.match(/([^.!?]{0,20}\b(?:waterskin|scarf|brand-iron|brand iron|offer|pact|hunt|blanket|bread|cloak|work|contract)[^.!?]{0,40})/i)?.[1]) ?? '')
    || (lead ? `${givenNameOf(lead.name)} at ${place}` : `Arrival at ${place}`);
  const description = [
    lead ? `${lead.name} is here — ${lead.role}.` : `You are on your own at ${place}.`,
    offer ? `The offer on the table: ${offer}` : '',
    fromScene ? fromScene.slice(0, 240) : inst?.situation,
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  const objectives = [
    `Get your bearings in ${place}`,
    lead ? `Hear why ${givenNameOf(lead.name)} is here with you` : 'Learn why you arrived',
    'Decide whether to take the offer or keep your own kit',
  ];
  return { title, description, objectives };
}

export function deriveOpeningRite(state: GameState, prose?: string): DerivedOpeningRite {
  const inst = openingInstanceOf(state);
  const lead = inst?.cast[0];
  const accept = inst?.offerChips.find((c) => c.kind === 'accept');
  const refuse = inst?.offerChips.find((c) => c.kind === 'refuse');
  const offerBit = inst?.offerSummary || accept?.note || 'what is being offered';
  const fromProse = (prose ?? '').match(/([^.!?]{0,80}\b(?:offer|will you|waterskin|scarf|brand|pact|rite|hunt)[^.!?]*[.!?])/i)?.[1];
  return {
    giverName: lead?.name ?? inst?.factionName ?? 'the registrar',
    riteTitle: accept ? `The opening offer` : 'The opening',
    offerSentence: fromProse?.trim() || `Will you take ${offerBit}?`,
    acceptChip: accept?.label ?? (lead ? `Hear ${givenNameOf(lead.name)} out` : 'Step forward'),
    refuseChip: refuse?.label ?? 'Keep your own kit',
  };
}

export function derivedJournalQuest(state: GameState, prose?: string): Quest {
  const j = deriveOpeningJournal(state, prose);
  const inst = openingInstanceOf(state);
  return {
    id: 'opening-live-journal',
    name: j.title,
    description: j.description,
    status: 'active',
    type: 'main',
    revealed: true,
    location: inst?.placeName,
    giver: inst?.cast[0]?.name,
    objectives: j.objectives.map((d, i) => ({ id: `opening-obj-${i + 1}`, description: d, completed: false })),
  };
}

function hideCatalogStarter(q: Quest, privateSpineId?: string): Quest {
  const id = q.id ?? '';
  if (id === 'opening-live-journal') return q;
  if (privateSpineId && id === privateSpineId) return { ...q, revealed: false, status: q.status === 'active' ? 'hidden' : q.status };
  if (/^opening-rite:/.test(id)) return q;
  if (/^(?:sp-quest-1|si-quest-1)$/.test(id) || /-spine-/.test(id) || /Hear why Pellane wanted you/i.test(q.name ?? '')) {
    return { ...q, revealed: false };
  }
  return q;
}

export const failedOpeningPads = [STORYTELLER_RETRY_CHIP];

export function applyFailedLiveOpening(state: GameState): GameState {
  return {
    ...state,
    openingEstablishment: {
      ...(state.openingEstablishment ?? { pending: [], answers: {}, complete: true }),
      sceneWritten: false,
      sceneWriteError: STORYTELLER_RETRY_MESSAGE,
    },
    choices: failedOpeningPads,
  };
}

export function applySuccessfulLiveOpening(state: GameState, prose: string): GameState {
  const pads = shapeOpeningPads(state, prose);
  const journal = derivedJournalQuest(state, prose);
  const privateSpineId = state.openingEstablishment?.privateSpineId;
  const quests = [...(state.quests ?? [])];
  const idx = quests.findIndex((q) => q.id === journal.id);
  if (idx >= 0) quests[idx] = journal;
  else quests.unshift(journal);
  const visible = quests.map((q) => hideCatalogStarter(q, privateSpineId));
  return {
    ...state,
    currentLocation: openingInstanceOf(state)?.placeName || state.currentLocation,
    quests: visible,
    choices: pads,
    openingEstablishment: {
      ...(state.openingEstablishment ?? { pending: [], answers: {}, complete: true }),
      sceneWritten: true,
      sceneWriteError: undefined,
    },
  };
}

async function runWriter(
  writer: LiveOpeningWriter,
  state: GameState,
  settings: Settings,
  retryErrors?: string[]
): Promise<string> {
  const input = formatOpeningWriterNotes(state, retryErrors) || '(opening)';
  const raw = await writer(state, input, settings);
  return (raw ?? '').trim();
}

export async function writeLiveOpening(
  state: GameState,
  settings: Settings,
  deps?: { writer?: LiveOpeningWriter }
): Promise<LiveOpeningResult> {
  let writer = deps?.writer ?? testWriter;
  if (!writer && isVitestEnv()) {
    writer = async (s) => mockLiveOpeningProse(s);
  }
  if (!writer) {
    const { callOpeningGm } = await import('./aiService');
    writer = (s, input, settings) => callOpeningGm(s, input, settings);
  }
  let retried = false;
  let prose = '';
  try {
    prose = await runWriter(writer, state, settings);
  } catch {
    return { ok: false, error: STORYTELLER_RETRY_MESSAGE, pads: failedOpeningPads };
  }
  let errors = validateLiveOpeningProse(state, prose);
  if (errors.length) {
    retried = true;
    try {
      prose = await runWriter(writer, state, settings, errors);
    } catch {
      return { ok: false, error: STORYTELLER_RETRY_MESSAGE, pads: failedOpeningPads };
    }
    errors = validateLiveOpeningProse(state, prose);
    if (errors.length) {
      return { ok: false, error: STORYTELLER_RETRY_MESSAGE, pads: failedOpeningPads };
    }
  }
  if (!prose.trim()) {
    return { ok: false, error: STORYTELLER_RETRY_MESSAGE, pads: failedOpeningPads };
  }
  const pads = shapeOpeningPads(state, prose);
  return {
    ok: true,
    prose,
    retried,
    pads,
    journal: deriveOpeningJournal(state, prose),
    rite: deriveOpeningRite(state, prose),
  };
}

export function originOnlyOpeningText(state: GameState): string {
  const q = state.openingEstablishment?.pending?.[0]?.question?.trim();
  const start = state.openingEstablishment?.registrar?.startLine?.trim();
  if (q && start) return `${start} ${q}`.replace(/\s+/g, ' ').trim();
  if (q) return q;
  if (start) return start;
  return 'Before the first page, the story needs a name. What do you enter?';
}
