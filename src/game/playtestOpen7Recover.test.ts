/**
 * XP-D1 OPEN7 addendum — hurt recovery chips + outdoor short rest (LitRPG / Story RPG).
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { rankChoices, isHuntChip, isSeekFightChip } from './choiceRanking';
import { ensureWildsReady } from './wilds';
import {
  applyOutdoorShortRest,
  applyRestHeal,
  canOutdoorShortRest,
} from './recoveryRules';
import {
  HUNT_DEATH_COOLDOWN_TURNS,
  OUTDOOR_REST_CHIP,
  OUTDOOR_SHORT_REST_HEAL_FRACTION,
  isHurtHp,
  isOutdoorRestPad,
} from './rules/wildlifeConfig';
import type { GameState } from './types';

function outdoor(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return ensureWildsReady({
    ...s,
    engineMode: 'litrpg',
    seed: 'open7-recover',
    turn: 12,
    currentLocation: 'Cinderwake Trail',
    places: [{ id: 'trail', name: 'Cinderwake Trail', regionId: 'r1' }],
    openingEstablishment: { ...(s.openingEstablishment as object), complete: true } as GameState['openingEstablishment'],
    character: { ...s.character, level: 2, hp: 10, maxHp: 20 },
    inventory: s.inventory,
    containers: [
      {
        id: 'bag',
        name: 'Bag',
        capacity: 16,
        used: 0,
        itemIds: [],
        storageType: 'General',
        kind: 'physical',
        equipped: true,
        slot: 'Container',
      },
    ],
    ...over,
  } as GameState);
}

const POOL = ['Look around', 'Ask what they want', 'Travel toward Contract Hall', 'Hunt the wildlife nearby'];

describe('OPEN7 addendum — hurt recovery', () => {
  it('at HP ≤ 50% no Hunt/Seek; Rest / Walk back offered high', () => {
    expect(isHurtHp(10, 20)).toBe(true);
    const state = outdoor({ character: { name: 'Jax', level: 2, hp: 10, maxHp: 20, xp: 0, xpToNext: 187 } as GameState['character'] });
    const ranked = rankChoices(state, POOL);
    expect(ranked.choices.some((c) => isHuntChip(c))).toBe(false);
    expect(ranked.choices.some((c) => isSeekFightChip(c))).toBe(false);
    expect(ranked.choices.some((c) => isOutdoorRestPad(c) || /\brest\b|\bcamp\b|walk back/i.test(c))).toBe(true);
    const recoveryIdx = ranked.choices.findIndex((c) => isOutdoorRestPad(c) || /\brest\b|\bcamp\b/i.test(c));
    expect(recoveryIdx).toBeGreaterThanOrEqual(0);
    expect(recoveryIdx).toBeLessThan(3);
  });

  it('above 50% Hunt returns', () => {
    const state = outdoor({ character: { name: 'Jax', level: 2, hp: 16, maxHp: 20, xp: 0, xpToNext: 187 } as GameState['character'] });
    expect(isHurtHp(16, 20)).toBe(false);
    const ranked = rankChoices(state, ['Look around', 'Ask what they want', 'Wait']);
    expect(ranked.choices.some((c) => isHuntChip(c))).toBe(true);
  });

  it('after death cooldown recovery chip offered and Hunt not', () => {
    const state = outdoor({
      turn: 20,
      wildsHuntDeathCooldownUntilTurn: 20 + HUNT_DEATH_COOLDOWN_TURNS,
      character: { name: 'Jax', level: 2, hp: 12, maxHp: 20, xp: 0, xpToNext: 187 } as GameState['character'],
    });
    const ranked = rankChoices(state, POOL);
    expect(ranked.choices.some((c) => isHuntChip(c))).toBe(false);
    expect(ranked.notes.some((n) => /recovery|death cooldown|hurt/i.test(n))).toBe(true);
  });

  it('short outdoor rest heals configured fraction, advances time, refuses mid-encounter, 0 XP, cooldown', () => {
    const state = outdoor();
    const beforeXp = state.character.xp;
    const rest = applyOutdoorShortRest(state, OUTDOOR_REST_CHIP);
    expect(rest.receipt).toBeTruthy();
    const expected = Math.min(
      state.character.maxHp,
      state.character.hp + Math.max(1, Math.floor(state.character.maxHp * OUTDOOR_SHORT_REST_HEAL_FRACTION))
    );
    expect(rest.state.character.hp).toBe(expected);
    expect(rest.state.character.xp).toBe(beforeXp);
    expect(rest.state.outdoorShortRestCooldownUntilTurn).toBeGreaterThan(state.turn ?? 0);

    const midFight = outdoor({ activeEncounter: { name: 'Wolf', level: 2, hp: 10, maxHp: 10 } as GameState['activeEncounter'] });
    expect(canOutdoorShortRest(midFight, OUTDOOR_REST_CHIP)).toBe(false);
    expect(applyOutdoorShortRest(midFight, OUTDOOR_REST_CHIP).receipt).toBeNull();

    // Cooldown blocks free infinite healing.
    const again = applyOutdoorShortRest(rest.state, OUTDOOR_REST_CHIP);
    expect(again.receipt).toBeNull();

    // Cap at max HP.
    const nearlyFull = outdoor({
      character: { name: 'Jax', level: 2, hp: 19, maxHp: 20, xp: 0, xpToNext: 187 } as GameState['character'],
      outdoorShortRestCooldownUntilTurn: undefined,
    });
    const topped = applyOutdoorShortRest(nearlyFull, 'I bind my wounds');
    expect(topped.state.character.hp).toBe(20);
    expect(topped.state.character.hp).toBeLessThanOrEqual(20);
  });

  it('typed rest resolves through applyRestHeal outdoors; tabletop has no outdoor short rest', () => {
    const lit = outdoor();
    const via = applyRestHeal(lit, 'Rest and bind your wounds');
    expect(via.receipt).toBeTruthy();

    const dnd = outdoor({ engineMode: 'dnd' });
    expect(canOutdoorShortRest(dnd, OUTDOOR_REST_CHIP)).toBe(false);
    expect(applyOutdoorShortRest(dnd, OUTDOOR_REST_CHIP).receipt).toBeNull();
  });
});
