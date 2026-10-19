/**
 * q64-DRAWGATE / q64b-DRAWGATE2 — possession gate bounds the item NP (and `with` instruments);
 * draft restore never resurrects an older line.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from '../game/defaults';
import { validateActionHard, restoreDraftAfterBlock } from '../game/actionValidation';
import { applyTabletopSheet, resolveSheet } from '../game/tabletop/characterBuild';
import type { GameState, Item } from '../game/types';

function item(name: string, extra: Partial<Item> = {}): Item {
  return { id: name, name, rarity: 'Common', quantity: 1, ...extra };
}

/** Quick-start tabletop fighter with kit weapons (itemType weapon on the records). */
function quickStartFighterInEncounter(): GameState {
  const base = createInitialState('Jax', 'dnd') as GameState;
  const sheet = resolveSheet({
    classId: 'fighter',
    speciesId: 'human',
    backgroundId: 'soldier',
    method: 'standard-array',
    baseScores: { STR: 15, DEX: 14, CON: 13, INT: 10, WIS: 12, CHA: 8 },
    kitId: 'A',
  });
  const withKit = applyTabletopSheet(
    {
      ...base,
      engineMode: 'dnd',
      campaignBibleId: 'cursed-keep',
      currentLocation: 'Greyhollow Graveyard',
      turn: 16,
      openingEstablishment: {
        complete: true,
        pending: [],
        answers: {},
        aloneArrival: false,
      },
      activeEncounter: {
        id: 'road-bandit',
        name: 'Road Bandit',
        hp: 11,
        maxHp: 11,
      } as GameState['activeEncounter'],
    },
    sheet,
  );
  return withKit;
}

function aloneWithKit(inventory: Item[]): GameState {
  const base = createInitialState('Jax', 'dnd') as GameState;
  return {
    ...base,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    inventory,
    containers: [],
    openingEstablishment: {
      complete: true,
      pending: [],
      answers: {},
      aloneArrival: false,
    },
    sceneFacts: {
      crowd: 'none',
      noise: 'quiet',
      present: [],
      props: ['locked chest'],
      lastBeat: 'A locked chest sits in the corner.',
      updatedTurn: 1,
    },
  };
}

describe('q64-DRAWGATE', () => {
  it('does not block Draw weapon / Draw my sword with a coordinated follow-on clause', () => {
    const state = quickStartFighterInEncounter();
    expect(state.inventory.some((i) => i.itemType === 'weapon')).toBe(true);

    const drawWeapon = validateActionHard('Draw weapon and roll initiative', state);
    expect(drawWeapon.valid).toBe(true);
    expect(drawWeapon.violations.join(' ')).not.toMatch(/don't have/i);

    const drawSword = validateActionHard('Draw my sword and brace for the attack', state);
    expect(drawSword.valid).toBe(true);
    expect(drawSword.violations.join(' ')).not.toMatch(/don't have/i);
  });

  it('still blocks a missing crossbow and names only that item', () => {
    const state = quickStartFighterInEncounter();
    expect(state.inventory.some((i) => /crossbow/i.test(i.name))).toBe(false);

    const result = validateActionHard('I draw my crossbow', state);
    expect(result.valid).toBe(false);
    const msg = result.violations.join(' ');
    expect(msg).toMatch(/don't have: crossbow/i);
    expect(msg).not.toMatch(/and /i);
  });

  it('after a block the restore path keeps the blocked line, never an older draft', () => {
    const older =
      'I look the handler in the eye. What happens if I walk away?';
    const blocked = 'Draw weapon and roll initiative';
    expect(restoreDraftAfterBlock(blocked, older)).toBe(blocked);
    expect(restoreDraftAfterBlock(blocked, older)).not.toBe(older);
    expect(restoreDraftAfterBlock('', older)).toBe('');
  });
});

describe('q64b-DRAWGATE2', () => {
  it("blocks 'I use the golden quest key to open it' with no key, naming the key", () => {
    const state = aloneWithKit([item('map'), item('travel bag')]);
    const result = validateActionHard('I use the golden quest key to open it', state);
    expect(result.valid).toBe(false);
    expect(result.violations.join(' ')).toMatch(/don't have: golden quest key/i);
  });

  it("allows the same line when a golden quest key is carried", () => {
    const state = aloneWithKit([item('map'), item('golden quest key')]);
    const result = validateActionHard('I use the golden quest key to open it', state);
    expect(result.valid).toBe(true);
    expect(result.violations.join(' ')).not.toMatch(/don't have/i);
  });

  it("blocks 'I pry it open with my crowbar' with no crowbar", () => {
    const state = aloneWithKit([item('map')]);
    const result = validateActionHard('I pry it open with my crowbar', state);
    expect(result.valid).toBe(false);
    expect(result.violations.join(' ')).toMatch(/don't have: crowbar/i);
  });

  it("allows pry-with-crowbar when a crowbar is carried", () => {
    const state = aloneWithKit([item('crowbar')]);
    const result = validateActionHard('I pry it open with my crowbar', state);
    expect(result.valid).toBe(true);
    expect(result.violations.join(' ')).not.toMatch(/don't have/i);
  });

  it("keeps 'Draw weapon and roll initiative' allowed with a carried weapon", () => {
    const state = quickStartFighterInEncounter();
    const result = validateActionHard('Draw weapon and roll initiative', state);
    expect(result.valid).toBe(true);
    expect(result.violations.join(' ')).not.toMatch(/don't have/i);
  });
});
