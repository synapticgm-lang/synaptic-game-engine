/**
 * Seed 94 — whole-sentence opening card, health not handed to the writer as story facts,
 * and a person is offered as here only where their record says they are.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { SUMMONED_PACT_PHASE4_HOOKS } from '../data/campaigns/summonedPactPhase4Hooks';
import { buildGroundTruthLedger } from './writerInfoLayer';
import { ledgerSheetLine } from './litrpgSystemWindow';
import { resolveEngineFight } from './engineFight';
import { ensureOpeningNpcPinned, formatOpeningPinMandate } from './openingPin';
import { presentNpcNames } from './npcRelationships';
import type { ActiveEncounter, GameState, NpcMemory } from './types';

const sentences = (text: string) => text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);

function orth(location: string): NpcMemory {
  return { npcId: 'sp-npc-orth', npcName: 'Orth', disposition: 'neutral', facts: ['Bible roster: gatekeeper'], lastSeenTurn: 1, location } as NpcMemory;
}

function pact(patch: Partial<GameState> = {}): GameState {
  const s = createInitialState('Jax', 'litrpg');
  return { ...s, campaignBibleId: 'summoned-pact', ...patch } as GameState;
}

describe('seed 94 opening card is whole sentences', () => {
  it('every Phase 4 page1, fallback and beat is whole sentences with no dash-tacked fragment', () => {
    for (const card of SUMMONED_PACT_PHASE4_HOOKS) {
      if (typeof card === 'string') continue;
      for (const text of [card.page1 ?? '', card.fallback ?? '', ...(card.beats ?? [])]) {
        expect(text, card.location).not.toMatch(/ — /);
        for (const s of sentences(text)) {
          expect(s.split(/\s+/).length, `${card.location}: ${s}`).toBeGreaterThanOrEqual(3);
          expect(s, card.location).toMatch(/[.!?]$/);
        }
      }
      const first = sentences(card.page1 ?? '')[0] ?? '';
      expect(first, card.location).toMatch(/\b(?:is|are|smells?|blows|rises|drifts|reaches|groans|hangs|lies)\b/);
    }
  });

  it('the bell-tower page 1 names the panel and the pass and where they are', () => {
    const card = SUMMONED_PACT_PHASE4_HOOKS.find((c) => typeof c !== 'string' && c.location === 'the bell-tower of Valespire Cathedral');
    const page1 = typeof card === 'string' ? '' : card?.page1 ?? '';
    expect(page1).not.toMatch(/^Wind through louver slats\./);
    expect(page1).toMatch(/A blue panel hangs in the air of the belfry\./);
    expect(page1).toMatch(/A tower-pass hangs on a nail by the ladder/);
  });
});

describe('seed 94 health is not a writer story fact', () => {
  it('the writer character sheet carries no HP or mana figures', () => {
    const s = pact({ character: { ...pact().character, hp: 7, maxHp: 26 } });
    for (const compact of [true, false]) {
      const sheet = buildGroundTruthLedger(s, { compact });
      expect(sheet).not.toMatch(/\bHP:|\bMana:/);
      expect(sheet).toMatch(/Gold:/);
    }
  });

  it('the panel read gives the writer level and XP, not HP or MP', () => {
    const s = pact({ character: { ...pact().character, hp: 7, maxHp: 26, level: 2 } });
    const sheet = ledgerSheetLine(s);
    expect(sheet).toMatch(/Level 2/);
    expect(sheet).not.toMatch(/\bHP\b|\bMP\b/);
  });

  it('the Fight line the writer reads has no HP; the figures stay on their own STATUS line', () => {
    const foe: ActiveEncounter = {
      name: 'Ash Raider', level: 1, hp: 12, maxHp: 12, armorClass: 12,
      strength: 10, dexterity: 10, constitution: 10, xpReward: 25, goldReward: 5,
    };
    const s = { ...createInitialState('Ria', 'dnd'), gmStrictness: 'standard', lootPity: { byTier: {} }, inventory: [], activeEncounter: foe } as GameState;
    const r = resolveEngineFight(s, 'Attack')!;
    expect(r).not.toBeNull();
    const fight = r.receipts.find((x) => /^Fight:/.test(x))!;
    expect(fight).not.toMatch(/\bHP\b|dealt|took/);
    expect(r.receipts.some((x) => /^HP: \d+ → \d+ \(dealt \d+, took \d+\)$/.test(x))).toBe(true);
    expect(r.facts).not.toMatch(/\bHP\b|dealt \d|took \d/);
  });
});

describe('seed 94 speakers only if they are here', () => {
  const tower = 'the bell-tower of Valespire Cathedral';

  it('the opening pin does not bring Orth to the back streets', () => {
    const s = pact({
      turn: 6,
      currentLocation: 'Back streets',
      npcMemories: [orth(tower)],
      openingEstablishment: { pending: [], answers: {}, complete: true, pinnedNpcNames: ['Orth'], pinnedAt: tower } as GameState['openingEstablishment'],
      sceneFacts: { ...pact().sceneFacts!, present: [] },
    });
    const next = ensureOpeningNpcPinned(s);
    expect(next.sceneFacts?.present ?? []).not.toContain('Orth');
    expect(formatOpeningPinMandate(next)).toBeNull();
  });

  it('the opening pin still holds Orth in his own tower', () => {
    const s = pact({
      turn: 2,
      currentLocation: tower,
      npcMemories: [orth(tower)],
      openingEstablishment: { pending: [], answers: {}, complete: true, pinnedNpcNames: ['Orth'] } as GameState['openingEstablishment'],
      sceneFacts: { ...pact().sceneFacts!, present: [] },
    });
    const next = ensureOpeningNpcPinned(s);
    expect(next.sceneFacts?.present).toContain('Orth');
    expect(formatOpeningPinMandate(next)).toMatch(/Orth/);
  });

  it('an unplaced pin holds only at the place the pin was set', () => {
    const base = pact({
      turn: 1,
      currentLocation: tower,
      npcMemories: [],
      openingEstablishment: { pending: [], answers: {}, complete: true, pinnedNpcNames: ['Vessa'] } as GameState['openingEstablishment'],
      sceneFacts: { ...pact().sceneFacts!, present: [] },
    });
    const stamped = ensureOpeningNpcPinned(base);
    expect(stamped.openingEstablishment?.pinnedAt).toBe(tower);
    const moved = ensureOpeningNpcPinned({ ...stamped, turn: 5, currentLocation: 'Lowmarket', sceneFacts: { ...stamped.sceneFacts!, present: [] } });
    expect(moved.sceneFacts?.present ?? []).not.toContain('Vessa');
  });

  it('the info sheet HERE list drops a name whose record is placed elsewhere', () => {
    const s = pact({
      currentLocation: 'Cathedral Undercroft',
      npcMemories: [orth(tower), { ...orth('Cathedral Undercroft'), npcId: 'g', npcName: 'Garth Barrow' }],
      sceneFacts: { ...pact().sceneFacts!, present: ['Garth Barrow', 'Orth'] },
    });
    expect(presentNpcNames(s)).toEqual(['Garth Barrow']);
  });
});
