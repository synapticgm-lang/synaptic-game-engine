/**
 * Slim opening-page-1 notes for the writer packet and system prompt.
 * Imports types only so the edge graph stays capped (no hook decks).
 */
import type { GameState } from './types.ts';

export const STORYTELLER_RETRY_MESSAGE = "The storyteller didn't answer — Try again";
export const STORYTELLER_RETRY_CHIP = 'Try again';

export function openingChoiceCountOf(engineMode: GameState['engineMode'] | undefined): number {
  return engineMode === 'dnd' ? 3 : 4;
}

export function openingChoiceCount(state: GameState): number {
  return openingChoiceCountOf(state.engineMode);
}

/** Short private rail + locked names. Safe to embed in the system prompt. */
export function formatOpeningPage1Rail(state: GameState): string {
  const est = state.openingEstablishment;
  if (!est || est.sceneWritten) return '';
  const inst = est.instance;
  if (!inst) return '';
  const n = openingChoiceCount(state);
  const people = inst.alone
    ? 'ALONE: do not invent a welcoming committee.'
    : `LOCKED PEOPLE (use these names): ${inst.cast.map((c) => `${c.name} — ${c.role}`).join('; ') || 'none'}`;
  const retired = inst.retiredNames.length ? `Do not use retired catalog names: ${inst.retiredNames.slice(0, 24).join(', ')}.` : '';
  const offer = inst.offerSummary ? `THE OFFER must be unmistakable in the prose: ${inst.offerSummary}` : '';
  const chips = inst.offerChips.length
    ? `End with exactly ${n} numbered choices. Prefer: ${inst.offerChips.map((c) => c.label).join('; ')}.`
    : `End with exactly ${n} numbered choices that follow from the prose.`;
  return [
    '【 OPENING PAGE 1 】',
    'Write the first prose the player will read. Novel-quality, concrete, present, no director notes, no menu language.',
    `LOCKED PLACE: ${inst.placeName} (${inst.placeKind}) — use this name.`,
    people,
    inst.factionName ? `LOCKED FACTION: ${inst.factionName}${inst.factionKind ? ` (${inst.factionKind})` : ''}` : '',
    inst.situation ? `SITUATION (private): ${inst.situation}` : '',
    inst.pressing ? `PRESSURE (private): ${inst.pressing}` : '',
    inst.how ? `HOW YOU ARRIVED (private): ${inst.how}` : '',
    offer,
    chips,
    retired,
    'Name the locked place and every locked person who is here. No "someone here", "a figure", or unnamed stand-ins when a locked name exists.',
    'Follow the Gamebook / GM writing style already in this system prompt.',
  ]
    .filter(Boolean)
    .join('\n');
}

/** Full player-input packet for the opening GM call (client builds this). */
export function formatOpeningWriterNotes(state: GameState, retryErrors?: string[]): string {
  const rail = formatOpeningPage1Rail(state);
  const inst = state.openingEstablishment?.instance;
  const extra = inst
    ? [
        inst.whoYouAre ? `WHO YOU ARE (private): ${inst.whoYouAre}` : '',
        inst.offerChips.length
          ? `Concrete offer chips (use these labels when they still follow from your prose):\n${inst.offerChips.map((c, i) => `  ${i + 1}. ${c.label} — ${c.note}`).join('\n')}`
          : '',
      ]
        .filter(Boolean)
        .join('\n')
    : '';
  const retry = retryErrors?.length
    ? `Your last draft failed these checks: ${retryErrors.join('; ')}. Rewrite the opening. Use the locked names exactly. Make the offer unmistakable. Name concrete people and the place.`
    : '';
  return [rail, extra, retry].filter(Boolean).join('\n\n');
}
