/**
 * XP-D1 OPEN7 — hunting always pays unless gray; no per-session budget; death-farm cooldown.
 */
import { describe, it, expect } from 'vitest';
import {
  applyWildsHuntBudget,
  killScale,
  unitMilestoneAmount,
  wildsBudgetCaps,
} from './rules/xpPace';
import { HUNT_DEATH_COOLDOWN_TURNS, WILDS_KILL_XP_MULT } from './rules/wildlifeConfig';
import { payEncounterXp } from './engineFight';
import { rankChoices, HUNT_WILDS_CHIP, isHuntChip } from './choiceRanking';
import { ensureWildsReady, wildsHasStock } from './wilds';
import { startHuntFromInput } from './wildlifeActions';
import type { ActiveEncounter, GameState } from './types';

function base(over: Partial<GameState> = {}): GameState {
  return {
    engineMode: 'litrpg',
    turn: 10,
    seed: 7303,
    saveId: 'open7-hunt',
    currentLocation: 'Cinderwake Trail',
    character: { name: 'Jax', level: 2, xp: 40, xpToNext: 187, hp: 20, maxHp: 20 },
    openingEstablishment: { complete: true, pending: [], answers: {} },
    inventory: [],
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
    materials: [],
    quests: [],
    log: [],
    places: [{ id: 'place_cinderwake-trail', name: 'Cinderwake Trail', regionId: 'r1' }],
    ...over,
  } as unknown as GameState;
}

function tableFoe(level: number, name = 'Shore Eel'): ActiveEncounter {
  return {
    name,
    level,
    hp: 10 + level * 4,
    maxHp: 10 + level * 4,
    levelSource: 'table',
    source: 'wilds-hunt',
  } as ActiveEncounter;
}

describe('OPEN7 hunt XP — no budget, gray-only zero', () => {
  it('200-kill sweep never hits a cap and never goes to 0 unless gray', () => {
    const P = 2;
    let ledger = { playerLevel: P, regularPaid: 0, challengePaid: 0 };
    let zeros = 0;
    for (let i = 0; i < 200; i++) {
      const raw = unitMilestoneAmount('litrpg', 'encounter', {
        playerLevel: P,
        foeLevel: 2,
        levelSource: 'table',
      });
      expect(raw).toBeGreaterThan(0);
      const paid = applyWildsHuntBudget('litrpg', P, raw, {
        challenge: false,
        gray: false,
        ledger,
      });
      expect(paid.capped).toBe(false);
      expect(paid.amount).toBe(raw);
      expect(paid.amount).toBeGreaterThan(0);
      ledger = paid.ledger;
      if (paid.amount === 0) zeros += 1;
    }
    expect(zeros).toBe(0);
    expect(ledger.regularPaid).toBeGreaterThan(100);
  });

  it('player 10 levels above a creature gets 0 (gray)', () => {
    expect(killScale(12, 2)).toBe(0);
    const raw = unitMilestoneAmount('litrpg', 'encounter', {
      playerLevel: 12,
      foeLevel: 2,
      levelSource: 'table',
    });
    expect(raw).toBe(0);
    const paid = applyWildsHuntBudget('litrpg', 12, 50, { challenge: false, gray: true });
    expect(paid.amount).toBe(0);
    expect(paid.status).toMatch(/too weak/i);
  });

  it('WILDS_KILL_XP_MULT is applied to table kills (tuning lever, not a cap)', () => {
    expect(WILDS_KILL_XP_MULT).toBeGreaterThan(0);
    expect(WILDS_KILL_XP_MULT).toBeLessThanOrEqual(1);
    const full = unitMilestoneAmount('litrpg', 'encounter', {
      playerLevel: 2,
      foeLevel: 2,
      levelSource: 'rolled',
    });
    const table = unitMilestoneAmount('litrpg', 'encounter', {
      playerLevel: 2,
      foeLevel: 2,
      levelSource: 'table',
    });
    // Table path uses killScale=1 × mult; rolled uses contentScale≈1 without mult.
    expect(table).toBe(Math.round(full * WILDS_KILL_XP_MULT));
  });

  it('historical budget caps remain readable but do not limit applyWildsHuntBudget', () => {
    const caps = wildsBudgetCaps('litrpg', 2);
    expect(caps.regular).toBeGreaterThan(0);
    const over = applyWildsHuntBudget('litrpg', 2, caps.regular + 500, {
      challenge: false,
      gray: false,
    });
    expect(over.amount).toBe(caps.regular + 500);
    expect(over.capped).toBe(false);
  });
});

describe('OPEN7 death-farm cooldown', () => {
  it('death then re-hunt inside cooldown pays 0 and offers no Hunt chip', () => {
    let state = ensureWildsReady(base({ turn: 20 }));
    expect(wildsHasStock(state)).toBe(true);
    state = {
      ...state,
      wildsHuntDeathCooldownUntilTurn: 20 + HUNT_DEATH_COOLDOWN_TURNS,
      wildsHuntDeathFoeKey: 'shore-eel',
      turn: 21,
    };
    const paid = payEncounterXp(state, tableFoe(2, 'Shore Eel'), 'defeated Shore Eel');
    expect(paid.state.character.xp).toBe(state.character.xp);
    expect(paid.receipts.some((r) => /XP Gained:\s*0|XP: none|still recovering/i.test(r))).toBe(true);

    const ranked = rankChoices(state, [
      'Look around',
      'Ask what they want',
      'Travel toward Contract Hall',
      HUNT_WILDS_CHIP,
    ]);
    expect(ranked.choices.some((c) => isHuntChip(c))).toBe(false);
    expect(ranked.notes.some((n) => /death cooldown|recovery after defeat/i.test(n))).toBe(true);
  });

  it('after the cooldown Hunt pays again', () => {
    const state = ensureWildsReady(
      base({
        turn: 30,
        wildsHuntDeathCooldownUntilTurn: 25,
      })
    );
    const paid = payEncounterXp(state, tableFoe(2), 'defeated Shore Eel');
    expect(paid.receipts.some((r) => /XP Gained:\s*[1-9]/i.test(r))).toBe(true);
    const ranked = rankChoices(state, ['Look around', 'Wait', 'Ask what they want']);
    expect(ranked.choices.some((c) => isHuntChip(c))).toBe(true);
  });

  it('typed "I go hunting" is never rejected during cooldown (engine still opens / facts)', () => {
    const state = ensureWildsReady(
      base({
        turn: 22,
        wildsHuntDeathCooldownUntilTurn: 25,
      })
    );
    const started = startHuntFromInput(state, 'I go hunting');
    expect(started).not.toBeNull();
    // May open a fight or return a fact — never null for a clear hunt ask outdoors.
    expect(started!.fact || started!.state.activeEncounter || started!.receipts).toBeTruthy();
  });
});
