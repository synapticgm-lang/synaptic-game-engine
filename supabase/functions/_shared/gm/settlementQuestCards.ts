/** Edge stub — settlement quest cards are seeded on the client at New Game; the save already carries them. */
import type { PlaceRecord } from './types.ts';

export function seedSettlementQuestCards(place: PlaceRecord, _opts: unknown = {}): PlaceRecord {
  return place;
}
