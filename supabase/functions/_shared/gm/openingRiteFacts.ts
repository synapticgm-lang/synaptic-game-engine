/**
 * XP-D1 OPEN — thin writer-facing Opening Rite facts.
 * Kept free of characterXp / advancement so gm-edge can sync without pulling class rules.
 */
import {
  authoredOpeningRite,
  fallbackOpeningRite,
  type OpeningRiteEntry,
} from './openingRiteTable.ts';
import type { GameState } from './types.ts';

export function riteEntryForState(
  state: Pick<GameState, 'campaignBibleId' | 'engineMode' | 'storyName' | 'openingEstablishment'>
): OpeningRiteEntry | null {
  if (state.engineMode !== 'litrpg') return null;
  const id = state.campaignBibleId?.trim();
  if (!id) return null;
  const base =
    authoredOpeningRite(id)
    ?? fallbackOpeningRite({
      id,
      title: state.storyName?.trim() || id,
      engineMode: 'litrpg',
      keyNPCs: [],
    });
  if (!base) return null;
  const inst = state.openingEstablishment?.instance;
  if (!inst) return base;
  const accept = inst.offerChips.find((c) => c.kind === 'accept');
  const refuse = inst.offerChips.find((c) => c.kind === 'refuse');
  const lead = inst.cast[0]?.name;
  const offerBit = inst.offerSummary || accept?.note;
  // Keep the authored rite title (e.g. "Opening Rite: The Pact"). Never retitle
  // the rite to the offer chip ("Opening: Take the kit") — that is not the main quest.
  return {
    ...base,
    giver: lead ?? inst.factionName ?? 'the registrar',
    offerSentence: offerBit ? `Will you take this: ${offerBit}?` : accept ? `Will you: ${accept.label}?` : 'Will you take what is being offered, or keep your own kit?',
    acceptChip: accept?.label ?? base.acceptChip,
    refuseChip: refuse?.label ?? 'Keep your own kit',
  };
}

export function openingRiteIsOpen(state: Pick<GameState, 'engineMode' | 'openingRite'>): boolean {
  return state.engineMode === 'litrpg' && !!state.openingRite && !state.openingRite.done;
}

/** Writer fact: pending offer the opening prose must end on. */
export function openingRiteWriterOffer(state: GameState): string | null {
  if (!openingRiteIsOpen(state)) return null;
  const entry = riteEntryForState(state);
  if (!entry) return null;
  return `OPENING RITE (end this beat on the pending offer, spoken or System): ${entry.offerSentence}`;
}

/** Writer fact after a refuse while the System still completes the rite. */
export function openingRiteRefuseWriterFact(state: GameState): string | null {
  if (state.engineMode !== 'litrpg') return null;
  if (!state.openingRite?.forced) return null;
  return 'OPENING RITE: the player refused; the System/summoner persists with no punishment and registers them anyway.';
}
