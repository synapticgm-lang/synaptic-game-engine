import { describe, expect, it } from 'vitest';
import { payEncounterXp } from './engineFight';
import { crToXp } from './xpRules';
import type { Companion, GameState } from './types';

function comp(over: Partial<Companion>): Companion {
  return {
    id: over.name ?? 'c',
    name: 'Mira',
    type: 'party',
    role: 'archer',
    hp: 10,
    maxHp: 10,
    maintenanceCost: '',
    assignment: 'with you',
    notes: '',
    ...over,
  };
}

function state(engineMode: GameState['engineMode'], companions: Companion[]): GameState {
  return {
    engineMode,
    turn: 7,
    companions,
    sandboxAwardKeys: [],
    character: { name: 'Jax', level: 1, xp: 0, xpToNext: 300 },
  } as unknown as GameState;
}

const raw = { name: 'Bandit Captain', cr: 2, encounterId: 'enc-1' } as never;

describe('29z9j D&D fight XP is shared across the party', () => {
  it('each party member gets the same hidden share as the player; a pet keeps its own total', () => {
    const s = state('dnd', [comp({ name: 'Mira' }), comp({ name: 'Dain' }), comp({ name: 'Wolf', type: 'beast' }), comp({ name: 'Keeper', type: 'caretaker' })]);
    const out = payEncounterXp(s, raw, 'victory');
    const share = Math.floor(crToXp(2) / 3);
    expect(out.state.character.xp).toBe(share);
    const byName = Object.fromEntries((out.state.companions ?? []).map((c) => [c.name, c]));
    expect(byName.Mira!.xp).toBe(share);
    expect(byName.Dain!.xp).toBe(share);
    expect(byName.Mira!.level).toBe(1);
    expect(byName.Wolf!.xp).toBe(share);
    expect(byName.Keeper!.xp).toBeUndefined();
    expect(out.receipts.join(' ')).not.toMatch(/Mira|Dain|Wolf/);
  });

  it('a summon does not shrink the party split', () => {
    const s = state('dnd', [comp({ name: 'Mira' }), comp({ name: 'Imp', summon: true })]);
    const out = payEncounterXp(s, raw, 'victory');
    expect(out.state.character.xp).toBe(Math.floor(crToXp(2) / 2));
    expect(out.state.companions?.find((c) => c.name === 'Imp')?.xp).toBe(Math.floor(crToXp(2) / 2));
  });

  it('hidden total levels a companion and raises max HP', () => {
    const s = state('dnd', [comp({ name: 'Mira', xp: 290, level: 1 })]);
    const out = payEncounterXp(s, raw, 'victory');
    const mira = out.state.companions![0]!;
    expect(mira.level).toBe(2);
    expect(mira.maxHp).toBeGreaterThan(10);
  });

  it('an active summon on the sheet keeps its own total and grows with its level', () => {
    const s = state('dnd', []);
    const imp = { id: 'imp', name: 'Imp', kind: 'creature', hp: 6, maxHp: 6, attack: 2, defense: 1, abilities: [], active: true, xp: 290 };
    const gone = { ...imp, id: 'old', name: 'Old Wisp', active: false, xp: 0 };
    (s.character as { summons?: unknown[] }).summons = [imp, gone];
    const out = payEncounterXp(s, raw, 'victory');
    expect(out.receipts[0]).toContain(`XP Gained: ${crToXp(2)}`);
    const [a, b] = out.state.character.summons!;
    expect(a!.xp).toBe(290 + crToXp(2));
    expect(a!.level).toBeGreaterThan(1);
    expect(a!.attack).toBeGreaterThan(2);
    expect(b!.xp).toBe(0);
  });

  it('LitRPG fight XP stays the player only', () => {
    const s = state('litrpg', [comp({ name: 'Mira' })]);
    const out = payEncounterXp(s, raw, 'victory');
    expect(out.state.companions?.[0]?.xp).toBeUndefined();
  });
});
