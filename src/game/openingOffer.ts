/**
 * The opening card's offer, settled by the engine before the writer: accepting hands over the card's
 * items through the item-gain path with a receipt; refusing closes the offer. Either way it stops being open.
 */
import type { GameEvent } from './parser';
import type { GameState } from './types';
import { isAcceptOfferLine, openingCastNames, openOpeningOffer } from './openingEstablishment';
import { openRouteView } from './questRoutes';
import { applyStructuralEvents } from './structuralEvents';
import { recordPersonSeen } from './timeline';

const OFFER_NOUN = /\b(?:work|job|offer|kit|deal|cots|terms)\b/i;

export function isOfferRefuseLine(raw: string): boolean {
  const t = (raw ?? '').replace(/\s+/g, ' ').trim();
  return /^(?:i\s+)?(?:refuse|decline|turn down|say no to)\b/i.test(t) && OFFER_NOUN.test(t);
}

export function applyOpeningOfferChoice(
  state: GameState,
  playerInput: string
): { state: GameState; receipts: string[] } {
  let seated = state;
  if (isOfferRefuseLine(playerInput)) {
    const card = (seated.openingEstablishment?.card?.cast ?? '').trim();
    const named = (card || openingCastNames(seated)[0] || '').trim();
    const low = named.toLowerCase();
    const who = !named || low === 'panel' || low === 'the panel' || low === 'the people here' || low === 'people here' || low === 'the people who pulled you' ? '' : named;
    if (who) seated = recordPersonSeen(seated, who, 'made the offer');
  }
  const route = openRouteView(seated, playerInput)?.routeByLabel;
  const eid = (route?.kind === 'person' ? route.entityId : '') ?? '';
  if (eid.toLowerCase().startsWith('npc:')) {
    const who = eid.slice(4).trim();
    if (who) seated = recordPersonSeen(seated, who, 'addressed');
  }
  const offer = openOpeningOffer(seated);
  const est = seated.openingEstablishment;
  if (!offer || !est) return { state: seated, receipts: [] };
  if (isOfferRefuseLine(playerInput)) {
    return {
      state: { ...seated, openingEstablishment: { ...est, offerTaken: 'refused' } },
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
    const granted = applyStructuralEvents(seated, events, { playerInput });
    // Who made the offer is the card's cast; the card's terms ("they will unbar the door") are not settled here.
    const who = openingCastNames(state)[0];
    const from = who ? ` from ${who}` : '';
    return {
      state: { ...granted.state, openingEstablishment: { ...est, offerTaken: 'accepted' } },
      receipts: [`Offer accepted: the ${offer.noun}${from}`, ...granted.notes.filter((n) => /^Loot granted:/.test(n))],
    };
  }
  return { state: seated, receipts: [] };
}
