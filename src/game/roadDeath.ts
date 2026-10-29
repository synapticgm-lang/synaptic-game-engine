/**
 * T10SM1 — one pure producer for the road / exhaustion death book page.
 * No client-only imports so the edge can sync and import this file.
 *
 * SRD 5.2.1 Exhaustion (WotC CC BY 4.0): level 6 = death.
 */
import type { GameState } from './types';

/** This turn's travel beat facts for the writer (empty on any other turn). */
export function travelBeatFact(state: Pick<GameState, 'travelBeat' | 'turn'>): string {
  const b = state.travelBeat;
  return b && b.turn === (state.turn ?? 0) && b.facts.length ? b.facts.join(' ') : '';
}

/** Peel a death sentence out of a travel beat that already contains "You are dead." */
function deathBeatToBookProse(beat: string): string {
  if (!/\bYou are dead\./i.test(beat)) return '';
  const death =
    beat.match(
      /(?:The forced march wore you down past what a body can bear\.\s*)?Your breath stops on the road\.\s*You are dead\./i,
    )?.[0]
    ?? beat.match(/[^.]*You are dead\./i)?.[0]?.trim();
  if (!death) return '';
  const line = death.endsWith('.') ? death : `${death}.`;
  return /The forced march|Your breath stops/i.test(line)
    ? line
    : 'The forced march wore you down past what a body can bear. Your breath stops on the road. You are dead.';
}

/**
 * When Extended Travel / exhaustion-6 death settled this turn (on the travel beat), the book
 * page is that death sentence — never a CAST reaction. Null when the PC is not dead, or when
 * death came from elsewhere (combat death saves, danger) with no travel-beat death on record.
 * (Uses deathSaves.dead directly to avoid a roadDeath ↔ death ↔ travelJourney import cycle; readers elsewhere use isDead.)
 */
export function roadDeathBookProse(
  state: Pick<GameState, 'deathSaves' | 'travelBeat' | 'turn' | 'character'>
): string | null {
  if (!state.deathSaves?.dead) return null;
  const beat = travelBeatFact(state);
  const fromBeat = beat ? deathBeatToBookProse(beat) : '';
  // SRD 5.2.1 Exhaustion level 6 = death (WotC CC BY 4.0). Only when this turn's travel beat
  // records the march / road death — not every deathSaves.dead (combat death saves stay off this page).
  if (fromBeat && /\bYou are dead\./i.test(fromBeat)) return fromBeat;
  return null;
}
