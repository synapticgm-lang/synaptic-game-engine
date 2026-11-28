/**
 * Dedicated page-1 writer request (brief 05).
 * Never a completed-event packet: the player has not acted yet.
 * Single source for the opening user prompt; buildContextPrompt branches here.
 */
import type { GameState, NarrativePerspective, OpeningInstance, OpeningOfferChip } from './types';
import {
  formatPcNameClashRail,
  formatPlayerPronounRail,
  isUnwrittenLiveOpening,
  openingChoiceCount,
} from './openingWriterNotes';
import { openingRiteWriterOffer } from './openingRiteFacts';
import { genderNoun } from './personNames';
import { resolvePerspective } from './narrativePov';

/** Local read — avoid importing openingInstance (keeps the edge twin graph small for brief 05). */
function openingInstanceOf(state: GameState): OpeningInstance | undefined {
  return state.openingEstablishment?.instance;
}

export interface OpeningRequestCastRef {
  id: string;
  name: string;
  role: string;
  gender?: 'male' | 'female';
  pronouns?: 'he/him' | 'she/her' | 'they/them';
}

export interface OpeningRequest {
  kind: 'opening-page-1';
  pcName: string;
  placeId: string;
  placeName: string;
  placeKind: string;
  cast: OpeningRequestCastRef[];
  alone: boolean;
  situation?: string;
  pressing?: string;
  how?: string;
  whoYouAre?: string;
  offerSummary?: string;
  offerChips: OpeningOfferChip[];
  offerItemNotes?: string[];
  factionName?: string;
  factionKind?: string;
  nearbyLandmark?: string;
  settlementName?: string;
  retiredNames: string[];
  optionCount: number;
  perspective: NarrativePerspective;
  pronounRail: string;
  pcNameClashRail: string;
  riteOffer?: string;
}

function castIdFor(
  state: GameState,
  member: { name: string },
  index: number
): string {
  const pinned = state.openingEstablishment?.castNpcIds?.[index]?.trim();
  if (pinned) return pinned;
  const mem = (state.npcMemories ?? []).find(
    (m) => m.npcId && (m.npcName ?? '').replace(/\s+/g, ' ').trim().toLowerCase() === member.name.toLowerCase()
  );
  if (mem?.npcId) return mem.npcId;
  return `opening-cast-${index + 1}`;
}

function placeIdFor(state: GameState): string {
  const fromHook = (state.openingEstablishment?.pickedHookId ?? '').trim();
  if (fromHook) return fromHook;
  return 'opening-place';
}

/** Typed opening request from committed New Game state. Empty when page 1 is not pending. */
export function buildOpeningRequest(
  state: GameState,
  perspective?: NarrativePerspective
): OpeningRequest | null {
  if (!isUnwrittenLiveOpening(state)) return null;
  const inst = openingInstanceOf(state);
  if (!inst) return null;
  const pov = resolvePerspective(perspective);
  const cast: OpeningRequestCastRef[] = inst.cast.map((c, i) => ({
    id: castIdFor(state, c, i),
    name: c.name,
    role: c.role,
    gender: c.gender,
    pronouns: c.pronouns,
  }));
  return {
    kind: 'opening-page-1',
    pcName: (state.character?.name ?? '').replace(/\s+/g, ' ').trim() || 'Adventurer',
    placeId: placeIdFor(state),
    placeName: inst.placeName,
    placeKind: inst.placeKind,
    cast,
    alone: inst.alone,
    situation: inst.situation || undefined,
    pressing: inst.pressing,
    how: inst.how,
    whoYouAre: inst.whoYouAre,
    offerSummary: inst.offerSummary,
    offerChips: inst.offerChips ?? [],
    offerItemNotes: inst.offerItemNotes,
    factionName: inst.factionName,
    factionKind: inst.factionKind,
    nearbyLandmark: inst.nearbyLandmark,
    settlementName: inst.settlementName,
    retiredNames: inst.retiredNames ?? [],
    optionCount: openingChoiceCount(state),
    perspective: pov,
    pronounRail: formatPlayerPronounRail(state),
    pcNameClashRail: formatPcNameClashRail(state),
    riteOffer: openingRiteWriterOffer(state) ?? undefined,
  };
}

/**
 * Writer-facing page-1 packet. No "Narrate this completed event" / PLAYER ACTION framing.
 */
export function formatOpeningRequest(req: OpeningRequest): string {
  const n = req.optionCount;
  const people = req.alone
    ? 'ALONE: do not invent a welcoming committee.'
    : `LOCKED PEOPLE (ids + names; use these names, genders, and roles exactly): ${
        req.cast
          .map((c) => {
            const g = c.gender ? genderNoun(c.gender) : c.pronouns ?? 'unspecified';
            return `${c.id} → ${c.name} — ${g}, ${c.role}`;
          })
          .join('; ') || 'none'
      }`;
  const retired = req.retiredNames.length
    ? `Do not use retired catalog names: ${req.retiredNames.slice(0, 24).join(', ')}.`
    : '';
  const offer = req.offerSummary
    ? `THE OFFER must be unmistakable in the prose: ${req.offerSummary}`
    : '';
  const optionHint = req.offerChips.length
    ? `options: exactly ${n} distinct concrete action labels that follow from the prose. Name the actual offer where there is one. Prefer when they still follow: ${req.offerChips.map((c) => c.label).join('; ')}.`
    : `options: exactly ${n} distinct concrete action labels that follow from the prose.`;
  const near = req.nearbyLandmark
    ? `The scene may sit near ${req.nearbyLandmark}, which is still on the map (for example "on the road toward ${req.nearbyLandmark}"). The opening takes place at ${req.placeName}, not at a retired catalog place.`
    : '';
  const voice =
    req.perspective === 'second-person'
      ? 'Voice: second person ("you") for the player character.'
      : req.perspective === 'third-person' || req.perspective === 'hybrid'
        ? `Voice: follow the save perspective (${req.perspective}); do not invent a different POV.`
        : `Voice: follow the save perspective (${req.perspective}).`;

  return [
    '【 OPENING PAGE 1 】',
    'Write the first page of this game. The player has not acted yet — do not narrate a completed player action, reply to an unsaid line, or invent a prior beat.',
    voice,
    req.pronounRail,
    req.pcNameClashRail,
    req.riteOffer ?? '',
    `PC: ${req.pcName}`,
    `PLACE id=${req.placeId}: ${req.placeName} (${req.placeKind}) — use this full name in the prose, not a generic word like trail or road.`,
    near,
    people,
    req.factionName
      ? `LOCKED FACTION: ${req.factionName}${req.factionKind ? ` (${req.factionKind})` : ''}`
      : '',
    req.settlementName ? `SETTLEMENT: ${req.settlementName}` : '',
    req.situation ? `SITUATION (private): ${req.situation}` : '',
    req.pressing ? `PRESSURE (private): ${req.pressing}` : '',
    req.how ? `HOW YOU ARRIVED (private): ${req.how}` : '',
    req.whoYouAre ? `WHO YOU ARE (private): ${req.whoYouAre}` : '',
    offer,
    req.offerItemNotes?.length
      ? `Offer item labels (refs for accept chips): ${req.offerItemNotes.join(', ')}`
      : '',
    req.offerChips.length
      ? `Concrete offer chips (use these labels when they still follow from your prose):\n${req.offerChips.map((c, i) => `  ${i + 1}. ${c.label} — ${c.note}`).join('\n')}`
      : '',
    retired,
    'Return a JSON object with keys prose, options, and journalTitle. No markdown fences.',
    'prose: the first page the player will read. Novel-quality, concrete, present, no director notes, no menu language, no numbered choice list, no XML or angle-bracket tags.',
    optionHint,
    "If an option uses a gendered pronoun (he/she), it must match that person's locked gender. Otherwise phrase the option without a pronoun.",
    "A speaker who introduces themselves (\"Name. I track.\") must be that locked person, with that person's gender and role. Do not put one person's name in another person's mouth.",
    'Use he/him/his for a locked man and she/her/hers for a locked woman. Do not swap those pronouns.',
    'journalTitle: a short title, at most 8 whole words, naming a person, place, or goal from the scene. Do not write a comma-separated list of names and places.',
    'Name the locked place in full and every locked person by name in the prose. No "someone here", "a figure", or unnamed stand-ins when a locked name exists.',
    'Show any housing / rules only through the scene — never as a stated rules line.',
    'Follow the Gamebook / GM writing style already in this system prompt.',
  ]
    .filter(Boolean)
    .join('\n');
}

/** User-prompt leaf for page 1, or null when this turn is not an unwritten live opening. */
export function openingWriterFacing(state: GameState, perspective?: NarrativePerspective): string | null {
  const req = buildOpeningRequest(state, perspective);
  return req ? formatOpeningRequest(req) : null;
}
