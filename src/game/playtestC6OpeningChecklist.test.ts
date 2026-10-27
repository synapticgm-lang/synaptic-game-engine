/**
 * C6 — every flagship premade opening card carries who/how/where/whoHere/pressing.
 * PYOA books are excluded. No generic fallback text fills missing fields.
 */
import { describe, expect, it } from 'vitest';
import { getCampaignBibleById } from '@/data/campaigns';
import {
  FLAGSHIP_OPENING_PREMADES,
  openingChecklistComplete,
  openingChecklistFields,
  openingSceneFromChecklist,
} from './openingChecklist';
import { normalizeOpeningHookCard, openingHookDeck } from './openingEstablishment';

describe('playtestC6 — opening checklist (flagship premades)', () => {
  it('lists the three non-PYOA flagships', () => {
    expect([...FLAGSHIP_OPENING_PREMADES]).toEqual([
      'summoned-pact',
      'cursed-keep',
      'salt-road-heist',
    ]);
  });

  it('every flagship deck card has all five authored checklist fields', () => {
    for (const id of FLAGSHIP_OPENING_PREMADES) {
      const bible = getCampaignBibleById(id);
      expect(bible, id).toBeTruthy();
      const deck = openingHookDeck(bible!);
      expect(deck.length, id).toBeGreaterThanOrEqual(3);
      deck.forEach((card, i) => {
        expect(
          openingChecklistComplete(card),
          `${id}[${i}] ${typeof card === 'string' ? card.slice(0, 40) : card.location}`
        ).toBe(true);
        const fields = openingChecklistFields(card)!;
        for (const key of ['who', 'how', 'where', 'whoHere', 'pressing'] as const) {
          expect(fields[key].length, `${id}[${i}].${key}`).toBeGreaterThan(3);
        }
      });
    }
  });

  it('normalizeOpeningHookCard surfaces the five fields on the pointer telegram', () => {
    const bible = getCampaignBibleById('summoned-pact')!;
    const card = openingHookDeck(bible)[0]!;
    const n = normalizeOpeningHookCard(card);
    expect(n.who).toBeTruthy();
    expect(n.how).toBeTruthy();
    expect(n.where).toBeTruthy();
    expect(n.whoHere).toBeTruthy();
    expect(n.pressing).toBeTruthy();
    expect(n.text).toMatch(/Who you are:/);
    expect(n.text).toMatch(/How you got here:/);
    expect(n.text).toMatch(/^Location:/m);
    expect(n.text).toMatch(/Who is here/);
    expect(n.text).toMatch(/What's pressing:/);
  });

  it('checklist scene assembly uses only authored fields (no stock filler)', () => {
    const fields = openingChecklistFields({
      who: 'a traveler at the inn',
      how: 'The last coach left you here.',
      where: 'Greyhollow, at the inn',
      whoHere: 'the innkeep',
      pressing: 'A name in the book before they talk about the keep.',
    })!;
    const scene = openingSceneFromChecklist(fields);
    expect(scene).toContain('a traveler at the inn');
    expect(scene).toContain('Greyhollow, at the inn');
    expect(scene).toContain('the innkeep');
    expect(scene).not.toMatch(/People in the scene are already reacting/);
  });

  it('does not invent checklist fields for a thin card', () => {
    expect(
      openingChecklistFields({
        location: 'somewhere',
        faction: 'someone',
        summonIntent: 'a reason',
      })
    ).toBeUndefined();
  });
});
