/**
 * Seed 94 — whole-sentence opening card, health not handed to the writer as story facts,
 * and a person is offered as here only where their record says they are.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { SUMMONED_PACT_PHASE4_HOOKS } from '../data/campaigns/summonedPactPhase4Hooks';
import { buildGroundTruthLedger } from './writerInfoLayer';
import { ledgerSheetLine } from './litrpgSystemWindow';
import { stitchOpeningContinue, stitchOpeningScene } from './openingStitch';
import { summonedPact } from '../data/campaigns/summonedPact';
import { SYSTEM_PART_IDS, clampSystemHousing, type SystemHousingConfig, type SystemHousingId } from './systemHousing';
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

  function belfryOpening(page1: string, housing: SystemHousingId): string {
    const parts = Object.fromEntries(SYSTEM_PART_IDS.map((p) => [p, false])) as SystemHousingConfig['parts'];
    const s = pact({
      seed: 'belfry-housing',
      currentLocation: 'the bell-tower of Valespire Cathedral',
      systemHousing: clampSystemHousing({ housing, parts }),
      openingEstablishment: {
        pending: [],
        answers: {},
        complete: false,
        pickedHookFallback: page1,
      } as GameState['openingEstablishment'],
    });
    return stitchOpeningScene(s);
  }

  it('the bell-tower opening follows the frozen housing and still names the pass', () => {
    const card = SUMMONED_PACT_PHASE4_HOOKS.find((c) => typeof c !== 'string' && c.location === 'the bell-tower of Valespire Cathedral');
    const page1 = typeof card === 'string' ? '' : card?.page1 ?? '';
    expect(page1).not.toMatch(/^Wind through louver slats\./);
    expect(page1).toMatch(/A tower-pass hangs on a nail by the ladder/);
    const worn = belfryOpening(page1, 'worn_device');
    expect(worn).not.toMatch(/panel hangs in the air/i);
    expect(worn).toMatch(/A worn device, a real object on the body, is on you\./);
    expect(worn).toMatch(/Others can see the object, but only the wearer reads the screen, and it is hard to remove\./);
    expect(worn).toMatch(/A tower-pass hangs on a nail by the ladder/);
    const mind = belfryOpening(page1, 'private_window');
    expect(mind).not.toMatch(/panel hangs in the air/i);
    expect(mind).toMatch(/A private window lives only in the mind, and it is not a worn object\./);
    expect(mind).not.toMatch(/worn device/);
    const world = belfryOpening(page1, 'world_status');
    expect(world).not.toMatch(/panel hangs in the air/i);
    expect(world).toMatch(/Levels exist in the world/);
    const pocket = belfryOpening(page1, 'leftover_pocket');
    expect(pocket).not.toMatch(/panel hangs in the air/i);
    expect(pocket).toMatch(/leftover pocket/i);
  });

  const HOUSED: SystemHousingId[] = ['private_window', 'worn_device', 'world_status', 'leftover_pocket'];
  const ALL_CARDS = [...(summonedPact.openingHooks ?? []), ...SUMMONED_PACT_PHASE4_HOOKS]
    .filter((c): c is Exclude<typeof c, string> => typeof c !== 'string');

  it('no housed opening card hands the writer a blue panel, a panel in the air or empty air', () => {
    for (const card of ALL_CARDS) {
      for (const text of [card.page1 ?? '', card.fallback ?? ''].filter(Boolean)) {
        for (const housing of HOUSED) {
          const out = belfryOpening(text, housing);
          expect(out, `${housing} / ${card.location}`).not.toMatch(/blue panel|panel in the air|empty air|\bthe panel\b/i);
        }
      }
    }
  });

  it('the bathhouse opening under world_status says what the system is and keeps the room', () => {
    const card = ALL_CARDS.find((c) => /ruined bathhouse/.test(c.page1 ?? ''))!;
    const out = belfryOpening(card.page1!, 'world_status');
    expect(out).not.toMatch(/A blue panel hangs in the draft/);
    expect(out).toMatch(/There is no panel, no device, and no window\./);
    expect(out).toMatch(/The cedar door bangs its hinges against the stone\./);
    expect(out).not.toMatch(/What name do you give it\?/);
  });

  it('housing none keeps the card blue panel', () => {
    const card = ALL_CARDS.find((c) => /ruined bathhouse/.test(c.page1 ?? ''))!;
    const s = pact({
      seed: 'none-housing',
      systemHousing: undefined,
      openingEstablishment: { pending: [], answers: {}, complete: false, pickedHookFallback: card.page1 } as GameState['openingEstablishment'],
    });
    expect(stitchOpeningScene(s)).toMatch(/A blue panel hangs in the draft/);
  });

  it('a housed alone name-ask does not ask through the panel', () => {
    const parts = Object.fromEntries(SYSTEM_PART_IDS.map((p) => [p, false])) as SystemHousingConfig['parts'];
    for (const housing of HOUSED) {
      const s = pact({
        seed: 'alone-ask',
        systemHousing: clampSystemHousing({ housing, parts }),
        openingEstablishment: {
          pending: [{ kind: 'name', question: 'The panel waits on a name. What do you enter?' }],
          answers: {},
          complete: false,
          aloneArrival: true,
          pickedHookFallback: 'Rain through a cracked dome. You are alone on ceramic tiles in a ruined bathhouse. A blue panel hangs in the draft. Nobody came to greet you.',
        } as unknown as GameState['openingEstablishment'],
      });
      const out = stitchOpeningScene(s);
      expect(out, housing).not.toMatch(/blue panel|\bthe panel\b|empty air/i);
      expect(out, housing).toMatch(/What name do you go by\?/);
    }
  });

  it('a housed opening search does not put the result on a panel', () => {
    const parts = Object.fromEntries(SYSTEM_PART_IDS.map((p) => [p, false])) as SystemHousingConfig['parts'];
    const s = pact({
      seed: 'search-housed',
      currentLocation: 'a ruined bathhouse off the Valespire roads',
      systemHousing: clampSystemHousing({ housing: 'world_status', parts }),
      openingEstablishment: { pending: [], answers: { name: 'Jax', where: 'a ruined bathhouse off the Valespire roads' }, complete: true, aloneArrival: true } as unknown as GameState['openingEstablishment'],
    });
    const out = stitchOpeningContinue(s, 'Search the area');
    expect(out).not.toMatch(/panel/i);
    const none = stitchOpeningContinue({ ...s, systemHousing: undefined }, 'Search the area');
    expect(none).toMatch(/The panel still shows Jax\./);
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
    const base = pact({ seed: 'seed94-level-sheet' });
    const parts = Object.fromEntries(SYSTEM_PART_IDS.map((p) => [p, false])) as SystemHousingConfig['parts'];
    const s = pact({
      seed: 'seed94-level-sheet',
      character: { ...base.character, hp: 7, maxHp: 26, level: 2 },
      systemHousing: clampSystemHousing({ housing: 'private_window', parts }),
    });
    const sheet = ledgerSheetLine(s);
    expect(sheet).toMatch(/Level 2/);
    expect(sheet).not.toMatch(/\bHP\b|\bMP\b/);
  });

  it('worn-device ledger prints only the parts housing turned on', () => {
    const base = pact({ seed: 'seed94-worn-sheet' });
    const off = Object.fromEntries(SYSTEM_PART_IDS.map((p) => [p, false])) as SystemHousingConfig['parts'];
    const named = {
      pending: [],
      answers: { name: 'Jax' },
      complete: true,
    } as GameState['openingEstablishment'];
    const worn = pact({
      seed: 'seed94-worn-sheet',
      character: { ...base.character, name: 'Jax', level: 2, xp: 10, xpToNext: 40, hp: 7, maxHp: 26, mp: 3, maxMp: 8, conditions: ['Bleeding'] },
      openingEstablishment: named,
      inventory: [{ id: 't', name: 'Token', rarity: 'Common', quantity: 1, description: 'brass' }],
      quests: [{ id: 'q', name: 'Find the pass', description: 'Climb the tower', status: 'active', type: 'main', objectives: [{ id: 'o', description: 'Climb', completed: false }] }],
      systemHousing: clampSystemHousing({ housing: 'worn_device', parts: { ...off, quest_list: true, pocket: true } }),
    });
    const onSheet = ledgerSheetLine(worn);
    expect(onSheet).toBe('The device reads: Name: Jax; Level 2; Effects: Bleeding; Pocket: Token (brass); Registration: designation locked; Mark: Pactborn / Calamity Mark — unresolved; XP 10/40; Quest: Find the pass, next: Climb.');
    expect(onSheet.toLowerCase()).not.toMatch(/blue panel|empty air/);
    const quiet = ledgerSheetLine(pact({
      ...worn,
      systemHousing: clampSystemHousing({ housing: 'worn_device', parts: off }),
    }));
    expect(quiet).toBe('The device reads: Name: Jax; Level 2; Effects: Bleeding; Registration: designation locked; Mark: Pactborn / Calamity Mark — unresolved; XP 10/40.');
    expect(quiet).not.toMatch(/Pocket:|Quest:/);
    expect(ledgerSheetLine(pact({ ...worn, systemHousing: clampSystemHousing({ housing: 'private_window', parts: off }) }))).toMatch(/^The window reads: /);
    expect(ledgerSheetLine(pact({ ...worn, systemHousing: clampSystemHousing({ housing: 'world_status', parts: off }) }))).toMatch(/^Known in the world: /);
    expect(quiet.toLowerCase()).not.toMatch(/blue panel|empty air/);
    const pocket = ledgerSheetLine(pact({
      ...worn,
      systemHousing: clampSystemHousing({ housing: 'leftover_pocket', parts: off }),
    }));
    expect(pocket).toBe('Pocket: Token.');
    expect(pocket).not.toMatch(/Level|XP |Quest:|Effects:/);
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
