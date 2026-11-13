import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { deriveOpeningJournal } from './liveOpening';
import { isSystemStatusChip, systemStatusChip } from './systemHousing';
import { keepOpeningOfferInSlots, visibleActionChips } from './fourSlotPads';
import { stripUnauthorizedNpcSpeech } from './intentParser';
import { healDanglingQuoteOpen, backedAnswerFacts } from './writerTurn';
import { ensureNpcSheet, openingCastFacts } from './npcSheet';
import { placeVessel, stampPlaceVessel } from './vesselPlace';
import { vesselTemplateForName } from './placeTemplates';
import { isInteriorPlace } from './placeAuthority';
import { buildInteriorFloorPlan } from './mapEngine';
import type { GameState } from './types';

const PROSE =
  'The lamps in Yarrowholt Circle threw a low orange wash across the plank walls, and beyond them the hull timbers of the Valespire grain-ship creaked against the harbor swell. Jax had stopped counting the hours since the light took him. He stood.';

function yarrow(over: Partial<GameState> = {}): GameState {
  const base = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...base,
    character: { ...base.character, name: 'Jax' },
    currentLocation: 'Yarrowholt Circle',
    places: [{ id: 'p-yarrow', name: 'Yarrowholt Circle' }],
    openingEstablishment: {
      ...(base.openingEstablishment ?? {}),
      instance: {
        placeName: 'Yarrowholt Circle',
        placeKind: 'summoning circle',
        situation: 'A chalk circle on the planks.',
        cast: [{ name: 'Brannoc Tew', role: 'a deckhand who stole an Esk rite', gender: 'm' }],
        offerSummary: 'Keep their secret and they kit you as crew (knife, oilskin, a bunk).',
        offerChips: [
          { kind: 'accept', label: 'Take the crew kit', note: 'knife, oilskin, a bunk' },
          { kind: 'refuse', label: 'Keep your own kit', note: '' },
        ],
        alone: false,
        retiredNames: [],
      },
    } as unknown as GameState['openingEstablishment'],
    ...over,
  } as GameState;
}

describe('Play-through points (12 Nov)', () => {
  it('1. journal quest text is who is here + the offer, no prose snippet cut mid-word', () => {
    const j = deriveOpeningJournal(yarrow(), PROSE);
    expect(j.description).toContain('Brannoc Tew is here');
    expect(j.description).toContain('The offer on the table:');
    expect(j.description).not.toMatch(/lamps|hull timbers|He st/);
  });

  it('2. the world-status button reads "Check your level"; old saves still treat "Ask the world" as status', () => {
    expect(systemStatusChip('world_status')).toBe('Check your level');
    expect(isSystemStatusChip('Check your level')).toBe(true);
    expect(isSystemStatusChip('Ask the world')).toBe(true);
  });

  it('3+6. no free-input buttons; the open offer holds slots over Look/Wait/travel fillers, count unchanged', () => {
    expect(visibleActionChips(['Look around', 'Say something…', 'Do something else…', 'Wait and listen'])).toEqual(['Look around', 'Wait and listen']);
    const pads = ['Look around', 'Wait and listen', 'Travel toward Lowmarket', 'Travel toward West Wall'];
    const kept = keepOpeningOfferInSlots(yarrow(), pads);
    expect(kept).toHaveLength(4);
    expect(kept).toEqual(expect.arrayContaining(['Take the crew kit', 'Keep your own kit']));
    expect(kept.slice(0, 2)).toEqual(['Look around', 'Wait and listen']);
    // Tabletop three stays three.
    expect(keepOpeningOfferInSlots(yarrow(), pads.slice(0, 3))).toHaveLength(3);
    // Offer taken → plain pads.
    const taken = yarrow();
    taken.openingEstablishment = { ...taken.openingEstablishment!, offerTaken: 'accepted' };
    expect(keepOpeningOfferInSlots(taken, pads)).toEqual(pads);
  });

  it('4. an NPC answer that opens with similar words survives; only a near-exact echo drops; no stub left', () => {
    const prose = 'Jax asked Brannoc Tew what he wanted. Brannoc said, "What I want from you is nothing. I ask for nothing." He waited.';
    const fact = 'NPC reaction slot open for the crew.';
    const out = stripUnauthorizedNpcSpeech(prose, 'Ask what they want from me', 'Jax', fact, ['Brannoc Tew']);
    expect(out).toContain('I ask for nothing.');
    const echo = stripUnauthorizedNpcSpeech('Brannoc said, "Ask what they want from me." He waited.', 'Ask what they want from me', 'Jax', '', ['Brannoc Tew']);
    expect(echo).not.toContain('Ask what they want from me');
    expect(healDanglingQuoteOpen('Brannoc said, ". I ask for nothing." Brannoc waits.')).toBe('Brannoc said, "I ask for nothing." Brannoc waits.');
    expect(healDanglingQuoteOpen('"Hold." He waits.')).toBe('"Hold." He waits.');
  });

  it('5. an opening person gets their story role and the offer, not a random town job', () => {
    const s = yarrow();
    expect(openingCastFacts(s, 'Brannoc Tew')).toEqual({ role: 'a deckhand who stole an Esk rite', offer: 'Keep their secret and they kit you as crew (knife, oilskin, a bunk).' });
    const seeded = ensureNpcSheet(s, 'Brannoc Tew', 'Yarrowholt Circle');
    const mem = seeded.npcMemories!.find((m) => m.npcName === 'Brannoc Tew')!;
    expect(mem.need).not.toMatch(/shelter and food/);
    expect(mem.goal?.target ?? '').not.toMatch(/safe place to rest/);
    expect(mem.offer).toContain('kit you as crew');
    const facts = backedAnswerFacts(s, 'Brannoc Tew').join(' ');
    expect(facts).toContain('a deckhand who stole an Esk rite');
    expect(facts).toContain('kit you as crew');
  });

  it('8. mobile HUD: "Journal" and "World map", not two "World" buttons', () => {
    const hud = readFileSync('src/components/Hud.tsx', 'utf8');
    expect(hud).toContain('>Journal<');
    expect(hud).toContain('>World map<');
    expect((hud.match(/>World</g) ?? []).length).toBe(0);
  });

  it('9. "The Ship Inn" is an inn, not decks; vessel names and John\'s story facts still are ships', () => {
    expect(vesselTemplateForName('The Ship Inn')).toBeNull();
    expect(vesselTemplateForName('the Valespire grain-ship')?.id).toBe('veh-boat-cargo');
    expect(vesselTemplateForName('a navy frigate')?.id).toBe('veh-ship-warship');
    const inn = buildInteriorFloorPlan('The Ship Inn', [], undefined, 'inn-seed');
    expect(inn.nodes.some((n) => (n.tags ?? []).some((t) => t.startsWith('deck:')))).toBe(false);
    expect(isInteriorPlace('The Ship Inn')).toBe(true);
    const s = yarrow({ openingEstablishment: undefined });
    expect(placeVessel(s, 'The Ship Inn')).toBeUndefined();
    const v = placeVessel(s, 'Yarrowholt Circle', PROSE);
    expect(v).toBe('veh-boat-cargo');
    expect(stampPlaceVessel(s, 'Yarrowholt Circle', v).places![0]!.vessel).toBe('veh-boat-cargo');
  });
});
