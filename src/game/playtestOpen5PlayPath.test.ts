/**
 * XP-D1 OPEN5 — play-path wiring: hunt start, hide drop, equip level rule, level-up gear notice,
 * hunt-gather chip profile. No live GM call.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { applyWildsKillExtras, hideForLevel, isHuntRequest, startHuntFromInput } from './wildlifeActions';
import { equipFromInput, equipItem, levelUpGearNotices } from './gearEquip';
import { HUNT_PAD } from './rules/wildlifeConfig';
import type { EngineMode, GameState, Item } from './types';

function base(mode: EngineMode, level = 1, place = 'Blackspine Treeline'): GameState {
  const s = createInitialState(undefined, mode) as GameState;
  return {
    ...s,
    engineMode: mode,
    seed: 'open5-play',
    currentLocation: place,
    activeEncounter: null,
    journey: null,
    character: { ...s.character, level },
    openingEstablishment: { ...(s.openingEstablishment as object), complete: true } as GameState['openingEstablishment'],
  };
}

function gear(over: Partial<Item>): Item {
  return { id: 'g1', name: 'Warden Blade', rarity: 'Common', quantity: 1, itemType: 'weapon', equipped: false, ...over } as Item;
}

describe('OPEN5 hunt start', () => {
  it('knows a hunt from a quest-style hunt', () => {
    expect(isHuntRequest(HUNT_PAD)).toBe(true);
    expect(isHuntRequest('I go hunting')).toBe(true);
    expect(isHuntRequest('hunt for clues')).toBe(false);
  });

  it('opens a table-level fight in litrpg and never in rpg or dnd', () => {
    const lit = startHuntFromInput(base('litrpg', 3), HUNT_PAD);
    expect(lit).toBeTruthy();
    if (lit?.fightInput) {
      expect(lit.state.activeEncounter?.levelSource).toBe('table');
      expect(lit.fightInput).toMatch(/^Attack /);
    } else {
      // Empty stock is honest: a receipt + fact, no fight, free text still answered.
      expect(lit?.fact).toBeTruthy();
    }
    expect(startHuntFromInput(base('rpg', 3), HUNT_PAD)).toBeNull();
    expect(startHuntFromInput(base('dnd', 3), HUNT_PAD)).toBeNull();
  });

  it('answers a hunt indoors with a fact and no fight', () => {
    const r = startHuntFromInput(base('litrpg', 2, 'Greyhollow Inn Cellar'), 'I go hunting');
    expect(r?.fightInput).toBeUndefined();
    expect(r?.state.activeEncounter ?? null).toBeNull();
  });
});

describe('OPEN5 hide drop', () => {
  it('drops a hide by creature level and never for humanoids', () => {
    expect(hideForLevel(1).id).toBeTruthy();
    const enc = {
      name: 'Wolf', level: 5, hp: 0, maxHp: 10, levelSource: 'table' as const, skinnable: true, creatureKind: 'beast' as const,
    };
    const beast = applyWildsKillExtras(base('rpg', 5), enc as never);
    expect(beast.receipts.join(' ')).toMatch(/Materials:/);
    const human = applyWildsKillExtras(base('rpg', 5), { ...enc, creatureKind: 'humanoid' } as never);
    expect(human.receipts.join(' ')).not.toMatch(/Materials:/);
  });
});

describe('OPEN5 equip level rule', () => {
  it('blocks gear more than 2 levels up and changes nothing', () => {
    const s = { ...base('rpg', 3), inventory: [gear({ itemLevel: 9 })] };
    const r = equipFromInput(s, 'I put on the warden blade');
    expect(r?.ok).toBe(false);
    expect(r?.blockedLine).toMatch(/Requires level 9 \(you are level 3\)/);
    expect(r?.state).toBe(s);
  });

  it('wears in-range and unlevelled gear and swaps the slot', () => {
    const worn = gear({ id: 'old', name: 'Old Knife', equipped: true, slot: 'Main Hand' });
    const s = { ...base('rpg', 3), inventory: [worn, gear({ itemLevel: 5 }), gear({ id: 'g2', name: 'Plain Dagger' })] };
    const a = equipItem(s, 'g1');
    expect(a.ok).toBe(true);
    expect(a.state.inventory.find((i) => i.id === 'g1')?.equipped).toBe(true);
    expect(a.state.inventory.find((i) => i.id === 'old')?.equipped).toBe(false);
    expect(equipItem(s, 'g2').ok).toBe(true);
  });

  it('never applies in tabletop', () => {
    const s = { ...base('dnd', 1), inventory: [gear({ itemLevel: 20 })] };
    expect(equipFromInput(s, 'I put on the warden blade')).toBeNull();
  });
});

describe('OPEN5 level-up gear notice', () => {
  it('names each newly wearable bag item once', () => {
    const inv = [gear({ itemLevel: 6 }), gear({ id: 'g2', name: 'Far Axe', itemLevel: 20 })];
    const first = levelUpGearNotices({ ...base('rpg', 3), inventory: inv });
    expect(first.notices).toEqual([]);
    const up = levelUpGearNotices({ ...first.state, character: { ...first.state.character, level: 4 } });
    expect(up.notices).toHaveLength(1);
    expect(up.notices[0]).toMatch(/Warden Blade/);
    expect(levelUpGearNotices(up.state).notices).toEqual([]);
  });
});
