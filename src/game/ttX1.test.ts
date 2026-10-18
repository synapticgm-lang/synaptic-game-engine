/**
 * TT-X1 combat clarity in text (tabletop only).
 * SRD 5.2.1: Initiative (identical creatures share one roll); Bloodied (half HP or fewer);
 * distances in feet. Sources: Wizards of the Coast LLC, CC BY 4.0; Sly Flourish (theatre-of-the-mind problem cited in the order).
 */
import { describe, expect, it } from 'vitest';
import type { RoundCombatState } from './types';
import {
  buildCombatStatusBlock,
  combatStatusContradicts,
  formatEconomyLine,
  visibleWound,
} from './rules/combatPresenter';
import { playRound, rollInitiative, type PcProfile } from './rules/roundCombat';
import { SRD_MONSTERS, type StatBlock } from './rules/srdMonsters';
// Tabletop-only TT-X1 — no defaults / engineFactGate import (keeps the suite light).
const block = (id: string): StatBlock => {
  const { match: _m, ...b } = SRD_MONSTERS.find((m) => m.id === id)!;
  return b;
};
const always = (v: number) => () => v;
const d20 = (n: number) => always((n - 0.5) / 20);

const pc = (over: Partial<PcProfile> = {}): PcProfile => ({
  name: 'Jax',
  ac: 16,
  hp: 12,
  maxHp: 12,
  speed: 30,
  initiativeMod: 1,
  saves: { STR: 5, DEX: 1, CON: 4, INT: -1, WIS: 1, CHA: 0 },
  stealth: 1,
  species: 'human',
  weapon: { name: 'Longsword', toHit: 5, dice: '1d8', mod: 3, type: 'slashing', ranged: false },
  conditions: [],
  ...over,
});

describe('TT-X1 combat status', () => {
  it('X1-1: after a melee attack, the block shows "Action used · Bonus action · 25 ft movement · Reaction"', () => {
    const b = block('goblin-warrior');
    // Start 10 ft away: closing to within 5 ft spends 5 ft of a 30 ft Speed → 25 left.
    const combat: RoundCombatState = {
      encounterName: b.name,
      round: 1,
      pcInitiative: 20,
      foes: [{ id: 'f1', name: b.name, blockId: b.id, hp: b.hp, maxHp: b.hp, initiative: 5, conditions: [], distanceFt: 10 }],
      pcConditions: [],
    };
    const res = playRound({
      pc: pc(),
      combat,
      blocks: { f1: b },
      action: 'attack',
      rng: d20(15),
    });
    expect(res.combat.pcEconomy).toEqual({
      actionAvailable: false,
      bonusAvailable: true,
      movementFt: 25,
      reactionAvailable: true,
    });
    expect(formatEconomyLine(res.combat.pcEconomy!)).toBe('Action used · Bonus action · 25 ft movement · Reaction');
    const status = buildCombatStatusBlock({
      combat: res.combat,
      pcName: 'Jax',
      pcHp: res.pcHp,
      pcMaxHp: 12,
    });
    expect(status.text).toContain('Action used · Bonus action · 25 ft movement · Reaction');
    expect(status.screenReaderText).toBe(status.text);
    expect(res.combat.foes[0]!.distanceFt).toBe(5);
  });

  it('X1-2: three identical goblins share one initiative entry', () => {
    const b = block('goblin-warrior');
    const foes = [1, 2, 3].map((i) => ({ id: `f${i}`, name: `${b.name} ${i}`, block: b }));
    const init = rollInitiative(pc(), foes, d20(10), null);
    const foeEvents = init.events.filter((e) => e.k === 'initiative' && e.who !== 'Jax');
    expect(foeEvents).toHaveLength(1);
    expect(foeEvents[0]!.who).toMatch(/×3/);
    expect(init.foeInitiative.f1).toBe(init.foeInitiative.f2);
    expect(init.foeInitiative.f2).toBe(init.foeInitiative.f3);

    const combat: RoundCombatState = {
      encounterName: b.name,
      round: 1,
      pcInitiative: init.pcInitiative,
      foes: foes.map((f) => ({
        id: f.id,
        name: f.name,
        blockId: b.id,
        hp: b.hp,
        maxHp: b.hp,
        initiative: init.foeInitiative[f.id]!,
        conditions: [],
        distanceFt: 30,
      })),
      pcConditions: [],
    };
    const status = buildCombatStatusBlock({ combat, pcName: 'Jax', pcHp: 12, pcMaxHp: 12 });
    const goblinRows = status.initiativeOrder.filter((r) => /goblin/i.test(r.label));
    expect(goblinRows).toHaveLength(1);
    expect(goblinRows[0]!.label).toMatch(/×3/);
    expect(status.text).toMatch(/×3/);
    // One shared initiative number on the order line, not three separate goblin entries.
    const initLine = status.text.split('\n')[0]!;
    expect(initLine.match(/Goblin/gi)?.length ?? 0).toBe(1);
  });

  it('X1-3: an enemy at half HP is shown as "Bloodied" with no number; distances match; prose never contradicts them', () => {
    const b = block('goblin-warrior');
    const half = Math.floor(b.hp / 2);
    expect(visibleWound(half, b.hp)).toBe('Bloodied');
    const combat: RoundCombatState = {
      encounterName: b.name,
      round: 2,
      pcInitiative: 15,
      foes: [
        {
          id: 'f1',
          name: b.name,
          blockId: b.id,
          hp: half,
          maxHp: b.hp,
          initiative: 10,
          conditions: [],
          distanceFt: 30,
        },
      ],
      pcConditions: [],
      pcEconomy: {
        actionAvailable: false,
        bonusAvailable: true,
        movementFt: 30,
        reactionAvailable: true,
      },
    };
    const status = buildCombatStatusBlock({ combat, pcName: 'Jax', pcHp: 12, pcMaxHp: 12 });
    expect(status.text).toContain('Bloodied');
    expect(status.text).toContain('about 30 ft');
    // No HP digits on the wound / distance lines for this foe.
    const foeLine = status.text.split('\n').find((l) => /Bloodied/.test(l))!;
    expect(foeLine).not.toMatch(/\d+\s*\/\s*\d+|HP\s*\d+/i);
    expect(foeLine).not.toMatch(new RegExp(`\\b${half}\\b`));

    expect(combatStatusContradicts(`${b.name} is unhurt and waits.`, status)).toMatch(/Bloodied/);
    expect(combatStatusContradicts(`${b.name} stays within 5 ft of you.`, status)).toMatch(/about 30 ft|within 5/);
    expect(combatStatusContradicts(`${b.name} is Bloodied about 30 ft away.`, status)).toBeNull();
  });
});
