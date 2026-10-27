/**
 * T10A — typed free text is never replaced by a canned missing-item sentence when the
 * line names scenery, body/worn instruments, or pronouns (not bag USE/EQUIP/GIVE).
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, Item, ItemType } from './types';
import { groundPlayerAction } from './intentParser';
import { findUnsupportedItemClaims, inventoryHasItem } from './suggestionValidation';
import { validateActionHard } from './actionValidation';

const TABLETOP_LINE =
  'I step toward Father Aldous and ask who he thinks I am, then nudge a splintered coffin lid with my boot to see what burst it.';

const LITRPG_LINE =
  'I pick a loose cobble off the road, toss it up and down, and call out, "Anyone still working this street?"';

function item(name: string, equipped: boolean, itemType: ItemType = 'accessory'): Item {
  return {
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    rarity: 'Common',
    itemType,
    quantity: 1,
    equipped,
  };
}

describe('T10A free text never canned for non-inventory claims', () => {
  it('tabletop: Father Aldous ask + boot nudge keeps typed words; boot is not a bag claim', () => {
    const s0 = createInitialState(undefined, 'dnd') as GameState;
    const state = {
      ...s0,
      engineMode: 'dnd' as const,
      turn: 2,
      inventory: [
        item('Travelling clothes', true, 'armor'),
        item('Chain Mail', true, 'armor'),
        item('Greatsword', true, 'weapon'),
      ],
      sceneFacts: {
        ...(s0.sceneFacts ?? {}),
        present: ['Father Aldous'],
        props: ['splintered coffin lid', 'coffin'],
        crowd: 'present',
        noise: 'quiet',
        lastBeat: '',
        updatedTurn: 2,
      },
      openingEstablishment: {
        ...(s0.openingEstablishment ?? {}),
        complete: true,
        pending: [],
        answers: { name: 'Jax' },
      },
    } as GameState;

    expect(findUnsupportedItemClaims(TABLETOP_LINE, state)).toEqual([]);
    const grounded = groundPlayerAction(TABLETOP_LINE, state, 'Father Aldous stands by a splintered coffin.');
    expect(grounded.rewritten).toBe(false);
    expect(grounded.text).toBe(TABLETOP_LINE);
    expect(grounded.text).not.toMatch(/I try to use/i);
    expect(grounded.text).not.toMatch(/do not have it/i);
    expect(validateActionHard(TABLETOP_LINE, state, 'Father Aldous stands by a splintered coffin.').valid).toBe(true);
  });

  it('LitRPG: cobble toss + call-out keeps typed words; "it up" is not a bag claim', () => {
    const s0 = createInitialState(undefined, 'litrpg') as GameState;
    const state = {
      ...s0,
      engineMode: 'litrpg' as const,
      turn: 4,
      inventory: [
        item('The clothes you had on when the light took you', true, 'armor'),
        item('Travel cloak', false, 'armor'),
        item('Waypass', false, 'quest'),
      ],
      sceneFacts: {
        ...(s0.sceneFacts ?? {}),
        present: [],
        props: ['loose cobble', 'road'],
        crowd: 'none',
        noise: 'quiet',
        lastBeat: '',
        updatedTurn: 4,
      },
      openingEstablishment: {
        ...(s0.openingEstablishment ?? {}),
        complete: true,
        pending: [],
        answers: { name: 'Jax' },
      },
    } as GameState;

    expect(findUnsupportedItemClaims(LITRPG_LINE, state)).toEqual([]);
    const grounded = groundPlayerAction(LITRPG_LINE, state, 'A cracked road. Loose cobbles underfoot.');
    expect(grounded.rewritten).toBe(false);
    expect(grounded.text).toBe(LITRPG_LINE);
    expect(grounded.text).not.toMatch(/I try to use/i);
    expect(grounded.text).not.toMatch(/act only with that/i);
  });

  it('sheet carry includes unequipped loot (cloak + pass), not only equipped clothes', () => {
    const s0 = createInitialState(undefined, 'litrpg') as GameState;
    const state = {
      ...s0,
      engineMode: 'litrpg' as const,
      turn: 4,
      inventory: [
        item('The clothes you had on when the light took you', true, 'armor'),
        item('Travel cloak', false, 'armor'),
        item('Waypass', false, 'quest'),
      ],
    } as GameState;

    expect(inventoryHasItem(state, 'Travel cloak')).toBe(true);
    expect(inventoryHasItem(state, 'Waypass')).toBe(true);
    expect(inventoryHasItem(state, 'cloak')).toBe(true);
    expect(inventoryHasItem(state, 'pass')).toBe(true);

    // A real missing USE still notes the full sheet (equipped or not) and does not rewrite the line.
    const useMissing = 'I use my crowbar on the grate.';
    expect(findUnsupportedItemClaims(useMissing, state)).toContain('crowbar');
    const grounded = groundPlayerAction(useMissing, state);
    expect(grounded.text).toBe(useMissing);
    expect(grounded.rewritten).toBe(false);
    expect(grounded.notes.join(' ')).toMatch(/Travel cloak/i);
    expect(grounded.notes.join(' ')).toMatch(/Waypass/i);
    expect(grounded.notes.join(' ')).not.toMatch(/nothing equipped/i);
  });
});
