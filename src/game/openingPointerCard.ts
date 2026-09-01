/**
 * Opening POINTER CARD — slots + FORBID, not a genre lecture.
 * Page 1 is a committed scene: stitch first, GM continues these slots.
 */

import type { GameState, SceneFacts } from './types';
import { filterChromeFromPresent, realPresentPeople } from './chromeAuthority';
import { syncPresentToCount } from './crowdAuthority';

export type PointerWhoBand = 0 | 1 | 2 | 4 | 5;

export type PointerCardSlots = {
  id: string;
  where: string;
  who: string;
  whoCount: PointerWhoBand;
  why: string;
  firstPressure: string;
  offer: string;
  forbid: string[];
  beats: string[];
  alone: boolean;
};

export type SnapshotGist = {
  location: string;
  crowd: string;
  crowdCount?: number;
  presence: string;
  hookWhy?: string;
  lastBeat: string;
  turn: number;
  stamp?: string;
};

const TITLE_NAME =
  /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g;

const NAME_STOP = new Set([
  'The', 'You', 'Your', 'A', 'An', 'And', 'Or', 'But', 'When', 'Where', 'What',
  'Who', 'Why', 'How', 'This', 'That', 'Location', 'Opening', 'Earth', 'System',
  'Circle', 'Sevenfold', 'Place', 'Name', 'Look', 'Kit', 'Panel', 'Mark',
  'Pactborn', 'Calamity', 'Crown', 'Ash', 'Court', 'Light', 'Stone',
]);

function lineAfter(text: string, label: RegExp): string {
  const m = text.match(label);
  return (m?.[1] ?? '').replace(/\s+/g, ' ').trim();
}

function slugId(raw: string): string {
  const s = raw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return s.slice(0, 48) || 'opening-card';
}

export function inferWhoCountFromHook(
  who: string,
  why: string,
  beats: string[],
  alone: boolean
): PointerWhoBand {
  if (alone) return 0;
  const blob = `${who} ${why} ${beats.join(' ')}`.toLowerCase();
  if (/\balone\b/.test(blob) && !/\bnot alone\b/.test(blob)) return 0;
  if (/\b(crowd|betting|mass summon|four bodies|festival)\b/.test(blob)) return 5;
  if (/\b(handlers|figures|robes|soldiers|robed)\b/.test(blob)) return 4;
  if (/\b(two|pair|both)\b/.test(blob)) return 2;
  if (/\b(one |a handler|a priest|a sergeant|a scribe)\b/.test(blob)) return 1;
  if (who.trim()) return 2;
  return 2;
}

export function compilePointerCardSlots(state: GameState): PointerCardSlots | null {
  const est = state.openingEstablishment;
  const text = (est?.pickedHook ?? '').trim();
  const fallback = (est?.pickedHookFallback ?? '').trim();
  const alone = est?.aloneArrival === true;
  if (!text && !fallback) return null;

  const where =
    lineAfter(text, /^Location:\s*(.+)$/m)
    || state.currentLocation
    || 'here';
  const who = lineAfter(text, /^Who is here(?:\s*\/\s*who summoned)?:\s*(.+)$/m);
  const why = lineAfter(text, /^Why this happened:\s*(.+)$/m);
  const offer = lineAfter(text, /^Opening offer[^:]*:\s*(.+)$/m);
  const beats = (text.match(/^-\s+(.+)$/gm) ?? []).map((l) => l.replace(/^-\s+/, '').trim());
  const firstPressure =
    beats[0]
    || offer
    || fallback.split(/(?<=[.!?])\s+/)[1]
    || (alone ? 'Nothing else moves in this room.' : 'Someone is already deciding what you are worth.');
  const whoCount = inferWhoCountFromHook(who, why, beats, alone);
  const forbid = [
    'Do not invent a new room, crowd size, or summon-why.',
    'Do not write an ordinary Earth street first unless this card is Earth Integration.',
    'Do not add named people or places beyond this card.',
    'Chrome (blue panel, Place, Registration) is not a person.',
  ];
  if (alone) {
    forbid.push('Alone card: no handlers, bystanders, or welcoming NPC on page one.');
  }

  return {
    id: est?.pickedHookId || slugId(where),
    where,
    who,
    whoCount,
    why,
    firstPressure,
    offer,
    forbid,
    beats,
    alone,
  };
}

export function formatPointerCardSlotBlock(slots: PointerCardSlots, mode: 'establish' | 'continue'): string {
  const whoLine =
    slots.alone || slots.whoCount === 0
      ? 'WHO_COUNT: 0 (alone — no people)'
      : `WHO_COUNT: ${slots.whoCount}${slots.who ? ` — ${slots.who}` : ''}`;
  const verb = mode === 'continue' ? 'Continue' : 'Establish';
  return `${verb} this card. Do not invent a new room, crowd, or why.
WHERE: ${slots.where}
${whoLine}
WHY: ${slots.why || 'not stated — do not invent a new summon-why'}
FIRST_PRESSURE: ${slots.firstPressure}
FORBID:
${slots.forbid.map((f) => `- ${f}`).join('\n')}`;
}

export function formatPointerCardForSnapshot(state: GameState): string {
  const slots = compilePointerCardSlots(state);
  if (!slots) return '';
  const est = state.openingEstablishment;
  const opening = !est?.complete || (state.turn ?? 0) <= 2 || est?.sceneWritten;
  if (!opening && (state.turn ?? 0) > 8) return '';
  return `### POINTER CARD (${slots.id})
${formatPointerCardSlotBlock(slots, est?.sceneWritten ? 'continue' : 'establish')}`;
}

/** Player-facing Chapter One line — not eval language. */
export function formatOpeningCardChrome(state: GameState): string {
  const slots = compilePointerCardSlots(state);
  if (!slots) return 'Chapter One';
  const who =
    slots.whoCount === 0
      ? 'You are alone.'
      : slots.whoCount === 1
        ? 'One person is here.'
        : slots.whoCount === 2
          ? 'Two people are here.'
          : 'A few people are here.';
  const why = slots.why ? ` ${slots.why.replace(/\.$/, '')}.` : '';
  const place = slots.where.replace(/^(the|a|an)\s+/i, '');
  return `Chapter One — ${place}. ${who}${why}`.slice(0, 220);
}

export function buildOpeningGmPlayerInput(state: GameState, playerInput?: string): string {
  const typed = (playerInput ?? '').trim();
  if (typed && typed !== '(opening)') return typed;
  const slots = compilePointerCardSlots(state);
  const lastGm = [...(state.log ?? [])].reverse().find((e) => e?.role === 'gm')?.content?.trim();
  const locked = lastGm
    ? `LOCKED SCENE (continue this — do not restart or invent a new room):\n${lastGm.slice(0, 900)}`
    : '';
  if (!slots) {
    return locked || 'Establish this opening scene from the campaign bible. Do not invent a new room.';
  }
  const mode = lastGm || state.openingEstablishment?.sceneWritten ? 'continue' : 'establish';
  return [formatPointerCardSlotBlock(slots, mode), locked].filter(Boolean).join('\n\n');
}

export function seedCrowdCountFromCard(state: GameState): number | undefined {
  const slots = compilePointerCardSlots(state);
  if (!slots) return undefined;
  return slots.whoCount;
}

export function openingInventBudgetZero(state: GameState): boolean {
  const est = state.openingEstablishment;
  if (!est) return false;
  if (state.sceneFacts?.cameraLock && (state.turn ?? 0) > 1) return false;
  const harvested = !!(est.answers?.name || est.answers?.wear || est.answers?.look || est.complete);
  if (harvested && (state.turn ?? 0) > 2) return false;
  return (state.turn ?? 0) <= 2 || !est.complete;
}

export function pointerCardAllowlist(state: GameState): Set<string> {
  const slots = compilePointerCardSlots(state);
  const names = new Set<string>();
  const add = (raw: string | undefined) => {
    if (!raw) return;
    let m: RegExpExecArray | null;
    const re = new RegExp(TITLE_NAME.source, 'g');
    while ((m = re.exec(raw)) !== null) {
      const n = m[1]!;
      if (NAME_STOP.has(n.split(/\s+/)[0]!)) continue;
      if (n.length < 3) continue;
      names.add(n.toLowerCase());
    }
  };
  add(slots?.where);
  add(slots?.who);
  add(slots?.why);
  add(slots?.offer);
  for (const b of slots?.beats ?? []) add(b);
  add(state.currentLocation);
  add(state.character?.name);
  for (const p of realPresentPeople(state.sceneFacts?.present)) add(p);
  for (const p of state.openingEstablishment?.pinnedNpcNames ?? []) add(p);
  return names;
}

function inventedTitleNames(prose: string, allow: Set<string>): string[] {
  const found: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(TITLE_NAME.source, 'g');
  while ((m = re.exec(prose)) !== null) {
    const n = m[1]!;
    if (NAME_STOP.has(n.split(/\s+/)[0]!)) continue;
    if (n.length < 3) continue;
    if (allow.has(n.toLowerCase())) continue;
    if (!found.some((x) => x.toLowerCase() === n.toLowerCase())) found.push(n);
  }
  return found.slice(0, 8);
}

/** First GM-continue after stitch: keep at most one extra invented name/place. */
export function stripOpeningInventQuota(state: GameState, prose: string, maxNew = 1): string {
  if (!prose) return prose;
  const extras = inventedTitleNames(prose, pointerCardAllowlist(state));
  if (extras.length <= maxNew) return prose;
  let next = prose;
  for (const name of extras.slice(maxNew)) {
    const re = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    next = next.replace(re, 'someone here');
  }
  return next.replace(/\s{2,}/g, ' ').trim();
}

export function classifyOpeningContinue(
  state: GameState,
  prose: string
): { accept: boolean; prose: string; reasons: string[] } {
  const reasons: string[] = [];
  let next = stripOpeningInventQuota(state, prose, openingInventBudgetZero(state) ? 0 : 1);
  const slots = compilePointerCardSlots(state);
  if (slots?.where) {
    const here = slots.where.toLowerCase();
    const moved =
      /\b(?:you (?:are|wake) (?:in|on|at) (?:an? )?(?:ordinary )?(?:street|mall|apartment|earth))\b/i.test(next)
      && !here.includes('street')
      && !here.includes('earth');
    if (moved) reasons.push('invented-earth-street');
  }
  if (slots && slots.whoCount === 0 && /\b(handlers?|bystanders?|crowd|people who saw you)\b/i.test(next)) {
    reasons.push('invented-crowd');
    next = next
      .replace(/\b(?:the )?handlers?\b/gi, '')
      .replace(/\b(?:the )?bystanders?\b/gi, '')
      .replace(/\s{2,}/g, ' ');
  }
  if (slots?.why && /bought here as a pawn|pellane'?s game/i.test(next) && !/pawn/i.test(slots.why)) {
    reasons.push('invented-why');
  }
  const extras = inventedTitleNames(next, pointerCardAllowlist(state));
  if (openingInventBudgetZero(state) && extras.length > 0) {
    reasons.push('invent-budget');
    next = stripOpeningInventQuota(state, next, 0);
  }
  const accept = !reasons.includes('invented-earth-street') && !reasons.includes('invented-why');
  return { accept, prose: next.trim(), reasons };
}

export function buildSnapshotGist(state: GameState): SnapshotGist {
  const present = filterChromeFromPresent(state.sceneFacts?.present ?? []).slice(0, 6);
  const count = state.sceneFacts?.crowdCount;
  const crowd =
    typeof count === 'number'
      ? `${state.sceneFacts?.crowd ?? 'present'} (~${count})`
      : (state.sceneFacts?.crowd ?? 'unknown');
  return {
    location: state.currentLocation || 'unknown',
    crowd,
    crowdCount: typeof count === 'number' ? count : undefined,
    presence: present.join(', ') || 'none',
    hookWhy: state.sceneFacts?.hookLock?.nature,
    lastBeat: (state.sceneFacts?.lastBeat ?? '').slice(0, 180),
    turn: state.turn ?? 0,
    stamp: state.runManifest?.buildStamp,
  };
}

/** Compact gist for ai_traffic / GM log — never the full prompt. */
export function compactTrafficGist(state: GameState): SnapshotGist {
  return buildSnapshotGist(state);
}

export function persistSnapshotGist(state: GameState, lastBeat?: string): GameState {
  const base = state.sceneFacts;
  if (!base) return state;
  const gist = buildSnapshotGist({
    ...state,
    sceneFacts: lastBeat ? { ...base, lastBeat: lastBeat.slice(0, 180) } : base,
  });
  return {
    ...state,
    sceneFacts: {
      ...base,
      lastBeat: lastBeat?.slice(0, 180) ?? base.lastBeat,
      lastSnapshotGist: gist,
    },
  };
}

export function formatLastSnapshotGistLine(state: GameState): string | null {
  const g = state.sceneFacts?.lastSnapshotGist;
  if (!g) return null;
  return `LAST SNAPSHOT (T${g.turn}): Location=${g.location}; Crowd=${g.crowd}; Presence=${g.presence}${g.hookWhy ? `; Why=${g.hookWhy}` : ''}`;
}

export function applyCardCrowdToFacts(state: GameState, facts: SceneFacts): SceneFacts {
  const slots = compilePointerCardSlots(state);
  if (!slots) return facts;
  const pinned = filterChromeFromPresent([
    ...(state.openingEstablishment?.pinnedNpcNames ?? []),
    ...(facts.present ?? []),
  ]);
  if (slots.whoCount === 0) {
    return {
      ...facts,
      crowd: 'none',
      noise: 'quiet',
      present: [],
      crowdCount: 0,
      lastBeat: facts.lastBeat && !/people are present/i.test(facts.lastBeat)
        ? facts.lastBeat
        : 'The room is empty of other people.',
    };
  }
  return {
    ...facts,
    crowd: 'present',
    crowdCount: slots.whoCount,
    present: syncPresentToCount(pinned, slots.whoCount),
    lastBeat: facts.lastBeat && !/people are present/i.test(facts.lastBeat)
      ? facts.lastBeat
      : `${slots.whoCount} ${slots.whoCount === 1 ? 'person is' : 'people are'} here.`,
  };
}

export function compileLitrpgCoreIdentity(state: GameState): string {
  const id = (state.campaignBibleId ?? '').toLowerCase();
  const premise = state.campaignPremise ?? '';
  const arch = String(state.campaignArchetype ?? '');
  if (id === 'system-integration' || /every human on earth|integration protocol/i.test(premise)) {
    return 'Modern Integration Earth. Blue System panels. Dungeon cores. Wave threats.';
  }
  if (id === 'summoned-pact' || arch === 'isekai' || /summoned pact|isekai|pactborn/i.test(`${id} ${premise}`)) {
    return 'Other-world summon. You arrived HERE — not Earth Integration. Private blue panel, rite or ruin, honest physics.';
  }
  if (id === 'hero-awakening' || /wake ledger/i.test(premise)) {
    return 'Wake Ledger. You were already in this world. Not a summon, not Earth Integration.';
  }
  return "LitRPG System physics in THIS bible's world-shape. Do not default to Modern Integration Earth.";
}
