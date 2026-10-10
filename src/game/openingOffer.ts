/**
 * The opening card's offer, settled by the engine before the writer: accepting hands over the card's
 * items through the item-gain path with a receipt; refusing closes the offer. Either way it stops being open.
 */
import type { GameEvent } from './parser';
import type { GameState } from './types';
import { isAcceptOfferLine, openOpeningOffer } from './openingEstablishment';
import { applyStructuralEvents } from './structuralEvents';

const OFFER_NOUN = /\b(?:work|job|offer|kit|deal|cots|terms)\b/i;

export function isOfferRefuseLine(raw: string): boolean {
  const t = (raw ?? '').replace(/\s+/g, ' ').trim();
  return /^(?:i\s+)?(?:refuse|decline|turn down|say no to)\b/i.test(t) && OFFER_NOUN.test(t);
}

export function applyOpeningOfferChoice(
  state: GameState,
  playerInput: string
): { state: GameState; receipts: string[] } {
  const offer = openOpeningOffer(state);
  const est = state.openingEstablishment;
  if (!offer || !est) return { state, receipts: [] };
  if (isOfferRefuseLine(playerInput)) {
    return {
      state: { ...state, openingEstablishment: { ...est, offerTaken: 'refused' } },
      receipts: [`Offer refused: ${offer.refuse || `the ${offer.noun}`}`],
    };
  }
  if (isAcceptOfferLine(playerInput)) {
    const events: GameEvent[] = offer.items.map((name) => ({
      type: 'item-gain',
      name,
      qty: 1,
      lootSource: 'story',
    }));
    const granted = applyStructuralEvents(state, events, { playerInput });
    return {
      state: { ...granted.state, openingEstablishment: { ...est, offerTaken: 'accepted' } },
      receipts: [`Offer accepted: the ${offer.noun}`, ...granted.notes.filter((n) => /^Loot granted:/.test(n))],
    };
  }
  return { state, receipts: [] };
}
