/**
 * Root B (seed 77) — the opening is compiled once: the cast slot keeps appositive clauses on their
 * phrase, the card's offer is a record with accept / refuse chips and a real grant, the matched spine's
 * giver is a person at a real place, and the writer gets the card's want when asked at the card.
 */
import { describe, expect, it } from 'vitest';
import { buildNewGameState, stampOpening } from './fateAutoplay';
import { buildCompletedEventPacket, formatWriterFacingEvent } from './completedEventPacket';
import {
  compileOpeningCard,
  coverContinuePads,
  normalizeOpeningHookCard,
} from './openingEstablishment';
import { applyOpeningOfferChoice } from './openingOffer';
import { buildInfoSheet } from './infoSheet';
import { resolveOfferedChoices } from './playTranscript';
import { hubsForBibleId } from './outdoorHubs';
import { summonedPact } from '@/data/campaigns/summonedPact';
import type { GameState } from './types';

function seed77(): GameState {
  const { state } = buildNewGameState({ bibleId: 'summoned-pact', characterName: 'Jax', seed: 77, personality: 'cold-system' });
  return stampOpening(state);
}

function withPlayerLine(state: GameState, line: string): GameState {
  return {
    ...state,
    turn: (state.turn ?? 0) + 1,
    log: [...(state.log ?? []), { id: `p-${line}`, turn: (state.turn ?? 0) + 1, role: 'player', content: line, timestamp: 0 }],
  };
}

describe('seed 77 infirmary card compiles its cast, offer and spine', () => {
  it('is the infirmary card and its cast holds no appositive "not a stranger…"', () => {
    const s = seed77();
    expect(s.openingEstablishment?.pickedHook).toMatch(/Location: the cathedral infirmary/);
    const card = s.openingEstablishment?.card;
    expect(card?.castNames ?? []).not.toContain('not a stranger in Earth clothes');
    expect((card?.castNames ?? []).some((n) => /\bstranger\b/i.test(n))).toBe(false);
  });

  it('no Summoned Pact hook card compiles a castName that starts with not / no / never', () => {
    for (const raw of summonedPact.openingHooks ?? []) {
      const card = normalizeOpeningHookCard(raw);
      const compiled = compileOpeningCard('summoned-pact', card.text, card.page1);
      for (const n of compiled?.castNames ?? []) {
        expect(n, card.location).not.toMatch(/^(?:not|no|never)\b/i);
      }
    }
  });

  it('after New Game the pad offers accept and refuse; accepting grants wraps, a knife and a tabard with a receipt', () => {
    const s = seed77();
    expect(s.openingEstablishment?.card?.offer?.items).toEqual(['wraps', 'knife', 'tabard']);
    expect(coverContinuePads(s)).toEqual(expect.arrayContaining(['Accept the work', 'Refuse the work']));
    expect(resolveOfferedChoices(s)).toEqual(expect.arrayContaining(['Accept the work', 'Refuse the work']));

    const taken = applyOpeningOfferChoice(s, 'Accept the work');
    const names = taken.state.inventory.map((i) => i.name);
    expect(names).toEqual(expect.arrayContaining(['wraps', 'knife', 'tabard']));
    expect(taken.receipts[0]).toBe('Offer accepted: the work');
    expect(taken.receipts.filter((r) => /^Loot granted:/.test(r))).toHaveLength(3);
    expect(taken.state.openingEstablishment?.offerTaken).toBe('accepted');
    expect(coverContinuePads(taken.state)).not.toContain('Accept the work');
    expect(applyOpeningOfferChoice(taken.state, 'Accept the work').receipts).toEqual([]);

    const refused = applyOpeningOfferChoice(s, 'Refuse the work');
    expect(refused.state.inventory).toEqual(s.inventory);
    expect(refused.receipts[0]).toMatch(/^Offer refused: Refuse the job/);
    expect(coverContinuePads(refused.state)).not.toContain('Refuse the work');
  });

  it('High Priest Arus is a record at a real place, the quest carries him, and the OPEN line names him', () => {
    const s = seed77();
    const quest = (s.quests ?? []).find((q) => q.id === 'sp-spine-cathedral-royal-vanguard');
    expect(quest?.revealed).toBe(true);
    expect(quest?.giver).toBe('High Priest Arus');
    const hubNames = hubsForBibleId('summoned-pact').map((h) => h.name);
    const isPlace = quest?.location === s.currentLocation || hubNames.includes(quest?.location ?? '');
    expect(isPlace).toBe(true);
    expect(quest?.location).not.toBe('Consecrated Sanctuary');
    const arus = (s.npcMemories ?? []).find((m) => m.npcName === 'High Priest Arus');
    expect(arus?.location).toBe(quest?.location);
    const open = buildInfoSheet(s).open.join('\n');
    expect(open).toMatch(/High Priest Arus/);
  });

  it('the packet behind "Ask what they want" at the card carries the card\'s want and its open offer', () => {
    const s = withPlayerLine(seed77(), 'Ask what they want');
    const text = formatWriterFacingEvent(buildCompletedEventPacket(s, 'Ask what they want'));
    expect(text).toMatch(/The court paid for a Pactborn who could close wounds/);
    expect(text).toMatch(/Agree to work their cots and they will issue a chirurgeon/);
    const away = withPlayerLine({ ...seed77(), currentLocation: 'Lowmarket', circling: { lastLocation: 'Lowmarket', prevPlace: 'the cathedral infirmary', openingPlace: 'the cathedral infirmary' } as GameState['circling'] }, 'Ask what they want');
    const awayText = formatWriterFacingEvent(buildCompletedEventPacket(away, 'Ask what they want'));
    expect(awayText).not.toMatch(/What they want \(their own reason/);
  });
});
