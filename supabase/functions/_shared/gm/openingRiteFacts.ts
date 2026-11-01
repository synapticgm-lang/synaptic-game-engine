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
  state: Pick<GameState, 'campaignBibleId' | 'engineMode' | 'storyName'>
): OpeningRiteEntry | null {
  if (state.engineMode !== 'litrpg') return null;
  const id = state.campaignBibleId?.trim();
  if (!id) return null;
  return (
    authoredOpeningRite(id)
    ?? fallbackOpeningRite({
      id,
      title: state.storyName?.trim() || id,
      engineMode: 'litrpg',
      keyNPCs: [],
    })
  );
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
