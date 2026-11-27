/**
 * Brief 02: offer pads stay while the offer is open — no prose noun re-grounding.
 */
import { describe, expect, it } from 'vitest';
import { getCampaignBibleById } from '@/data/campaigns';
import { newGameState } from './newGameTestState';
import { openingOfferPads, resolveOpeningHookPick } from './openingEstablishment';
import { applyOpeningOfferChoice } from './openingOffer';
import type { GameState, LogEntry } from './types';

function crewSeed(): string {
  const bible = getCampaignBibleById('summoned-pact')!;
  for (let i = 0; i < 1500; i++) {
    const p = resolveOpeningHookPick(bible, String(i));
    if (p?.offer?.items?.some((it) => it.id === 'sp-offer-bunk')) return String(i);
  }
  throw new Error('no crew-kit card');
}

function opened(): GameState {
  const seed = crewSeed();
  const s = newGameState('summoned-pact', { seed, liveOpening: true });
  const pads = openingOfferPads({
    ...s,
    turn: 1,
    openingEstablishment: { ...s.openingEstablishment!, sceneWritten: true },
  } as GameState);
  const page1: LogEntry = {
    id: 'g0',
    turn: 0,
    role: 'gm',
    content: 'Chalk lines glow. A quartermaster stands over you. No kit nouns in this line.',
    timestamp: 0,
    offeredChoices: ['Look around', 'Wait and listen', ...pads],
  };
  return {
    ...s,
    log: [page1],
    choices: ['Look around', 'Wait and listen', ...pads],
    turn: 1,
    openingEstablishment: { ...s.openingEstablishment!, sceneWritten: true },
  } as GameState;
}

describe('opening offer chips stay (typed data)', () => {
  it('accept and refuse stay after a talk turn with no kit nouns in prose', () => {
    const s = opened();
    const before = openingOfferPads(s);
    expect(before).toHaveLength(2);
    const afterTalk = {
      ...s,
      log: [
        ...(s.log ?? []),
        {
          id: 'g1',
          turn: 1,
          role: 'gm' as const,
          content: 'Hale watches. The circle stays quiet.',
          timestamp: 1,
        },
      ],
    } as GameState;
    expect(openingOfferPads(afterTalk)).toEqual(before);
  }, 60_000);

  it('refuse clears the pads', () => {
    const s = opened();
    const pads = openingOfferPads(s);
    const refused = applyOpeningOfferChoice(s, pads[1]!).state;
    expect(openingOfferPads(refused)).toEqual([]);
  }, 60_000);
});
