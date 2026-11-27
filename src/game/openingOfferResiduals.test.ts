/**
 * Brief 02: benefits stay on the typed record; no English head-noun heal.
 */
import { describe, expect, it } from 'vitest';
import { getCampaignBibleById } from '@/data/campaigns';
import { newGameState } from './newGameTestState';
import { offerRecordFromTypedData, openingOfferPads, openingOfferRecord, resolveOpeningHookPick } from './openingEstablishment';
import { applyOpeningOfferChoice } from './openingOffer';
import type { GameState } from './types';

function crewKitState(): GameState {
  const bible = getCampaignBibleById('summoned-pact')!;
  for (let i = 0; i < 1500; i++) {
    const p = resolveOpeningHookPick(bible, String(i));
    if (p?.offer?.items?.some((it) => it.id === 'sp-offer-bunk')) {
      const s = newGameState('summoned-pact', { seed: String(i), liveOpening: true });
      return { ...s, turn: 1, openingEstablishment: { ...s.openingEstablishment!, sceneWritten: true } } as GameState;
    }
  }
  throw new Error('no crew-kit card');
}

describe('opening offer residuals (typed data)', () => {
  it('crew kit: bunk stays a benefit; inventory is knife + oilskin', () => {
    const s = crewKitState();
    const rec = openingOfferRecord(s);
    expect(rec?.items.map((i) => i.toLowerCase()).sort()).toEqual(['knife', 'oilskin']);
    expect(rec?.benefits?.map((b) => b.toLowerCase())).toContain('a bunk');
    const r = applyOpeningOfferChoice(s, openingOfferPads(s)[0]!);
    expect(r.receipts.join(' | ')).toMatch(/not carried\):/);
    expect((r.state.inventory ?? []).map((i) => i.name.toLowerCase())).not.toContain('a bunk');
  }, 60_000);

  it('offerRecordFromTypedData is the only carryable split', () => {
    const rec = offerRecordFromTypedData({
      items: [
        { id: 'k', label: 'key to the room', carryable: true },
        { id: 'r', label: 'room', carryable: false },
      ],
    });
    expect(rec?.items).toEqual(['key to the room']);
    expect(rec?.benefits).toEqual(['room']);
  });
});
