import { describe, expect, it } from 'vitest';
import { formatDice, rollDice } from './dice';
import { SRD_MONSTERS, type StatBlock } from './srdMonsters';
import { playRound, rollDeathSave, rollInitiative, type PcProfile, type RoundAction } from './roundCombat';
import { combatFacts, deathSaveLine, presentCombatStatus, tabletopCombatLines } from './combatPresenter';
import type { RoundCombatState } from '../types';

const block = (id: string): StatBlock => {
  const { match: _m, ...b } = SRD_MONSTERS.find((m) => m.id === id)!;
  return b;
};
const always = (v: number) => () => v;
/** Rolls d20 = n for every die (any die maxes out at its own size when n >= size). */
const d20 = (n: number) => always((n - 0.5) / 20);
const seq = (...vals: number[]) => {
  let i = 0;
  return () => vals[Math.min(i++, vals.length - 1)]!;
};

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
  weapon: { name: 'Greatsword', toHit: 5, dice: '2d6', mod: 3, type: 'slashing', ranged: false },
  conditions: [],
  ...over,
});

const fight = (b: StatBlock, n = 1, over: Partial<RoundCombatState> = {}): { combat: RoundCombatState; blocks: Record<string, StatBlock> } => ({
  combat: {
    encounterName: b.name,
    round: 1,
    pcInitiative: 20,
    foes: Array.from({ length: n }, (_, i) => ({ id: `f${i + 1}`, name: `${b.name} ${i + 1}`, blockId: b.id, hp: b.hp, maxHp: b.hp, initiative: 5, conditions: [] })),
    pcConditions: [],
    ...over,
  },
  blocks: Object.fromEntries(Array.from({ length: n }, (_, i) => [`f${i + 1}`, b])),
});

const play = (action: RoundAction, p: PcProfile, f: ReturnType<typeof fight>, rng: () => number) =>
  playRound({ pc: p, combat: f.combat, blocks: f.blocks, action, rng });

describe('shared rules engine — dice', () => {
  it('a critical hit rolls the damage dice twice and adds the modifier once', () => {
    const r = rollDice('2d6', always(0.999), { crit: true, extraBonus: 3 });
    expect(r.dice).toEqual([6, 6, 6, 6]);
    expect(r.total).toBe(27);
    expect(formatDice(r)).toBe('4d6 (6, 6, 6, 6) + 3 = 27');
  });
});

describe('shared rules engine — rounds', () => {
  it('attack = d20 + ability mod + proficiency against AC; a natural 20 crits, a natural 1 misses', () => {
    const crit = play('attack', pc(), fight(block('bandit')), d20(20));
    const atk = crit.events.find((e) => e.k === 'attack' && e.pc)!;
    expect(atk).toMatchObject({ kept: 20, mod: 5, total: 25, ac: 12, hit: true, crit: true });
    expect(atk.k === 'attack' && atk.damage!.dice).toHaveLength(4);
    const miss = play('attack', pc({ weapon: { ...pc().weapon, toHit: 30 } }), fight(block('bandit')), d20(1));
    expect(miss.events.find((e) => e.k === 'attack' && e.pc)).toMatchObject({ hit: false, nat1: true });
  });

  it('initiative: identical foes share one roll; the surprised side rolls with Disadvantage', () => {
    const b = block('bandit');
    const foes = [1, 2].map((i) => ({ id: `f${i}`, name: `Bandit ${i}`, block: b }));
    const r = rollInitiative(pc(), foes, d20(10), 'foes');
    const foeRolls = r.events.filter((e) => e.k === 'initiative' && e.who !== 'Jax');
    expect(foeRolls).toHaveLength(1);
    expect(foeRolls[0]).toMatchObject({ adv: 'disadvantage', who: 'Bandit ×2' });
    expect(r.foeInitiative.f1).toBe(r.foeInitiative.f2);
    expect(tabletopCombatLines(r.events.map((e) => ({ ...e, round: 1 })), 'Jax')[0]).toBe('Initiative — you d20 10 + 1 = 11; Bandit ×2 d20 (dis: 10, 10) 10 + 1 = 11');
  });

  it('Dodge gives the foes Disadvantage until your next turn', () => {
    const f = fight(block('bandit'), 1, { pcInitiative: 20 });
    const r = play('dodge', pc(), f, d20(15));
    expect(r.events.find((e) => e.k === 'attack' && !e.pc)).toMatchObject({ adv: 'disadvantage' });
  });

  it('a Ghoul claw forces a CON save; Paralyzed skips your turn, and a melee hit on you is a critical hit', () => {
    const f = fight(block('ghoul'), 1, { pcInitiative: 1 });
    const weak = pc({ ac: 10, hp: 40, maxHp: 40, saves: { ...pc().saves, CON: -3 } });
    const r1 = play('attack', weak, f, d20(10));
    expect(r1.events.find((e) => e.k === 'save' && e.pc)).toMatchObject({ ability: 'CON', dc: 10, ok: false });
    expect(r1.events.some((e) => e.k === 'condition' && e.name === 'Paralyzed' && e.on)).toBe(true);
    // Until the end of your next turn: it wears off once the lost turn is over.
    expect(r1.events.some((e) => e.k === 'condition' && e.name === 'Paralyzed' && !e.on)).toBe(true);
    expect(r1.events.some((e) => e.k === 'act' && e.pc && e.action === 'skip')).toBe(true);
    const f2 = fight(block('ghoul'), 1, { pcInitiative: 1, pcConditions: [{ name: 'Paralyzed', endsAfterTurnOf: 'pc' }] });
    const r2 = play('attack', pc({ hp: 40, maxHp: 40 }), f2, d20(12));
    expect(r2.events.find((e) => e.k === 'attack' && !e.pc)).toMatchObject({ adv: 'advantage', hit: true, crit: true });
    const elf = play('attack', pc({ ac: 10, hp: 40, maxHp: 40, species: 'elf', saves: weak.saves }), fight(block('ghoul'), 1, { pcInitiative: 1 }), d20(10));
    expect(elf.events.some((e) => e.k === 'condition' && e.name === 'Paralyzed' && e.on)).toBe(false);
  });

  it('a Wolf bite knocks you Prone; you stand up on your turn', () => {
    const f = fight(block('wolf'), 1, { pcInitiative: 1 });
    const r = play('attack', pc({ hp: 40, maxHp: 40 }), f, d20(15));
    expect(r.events.some((e) => e.k === 'condition' && e.name === 'Prone' && e.on)).toBe(true);
    expect(r.events.some((e) => e.k === 'act' && e.action === 'stand')).toBe(true);
  });

  it('Disengage only stops opportunity attacks (SRD 5.2.1); Flee draws opportunity attacks then escapes', () => {
    expect(play('disengage', pc({ speed: 35 }), fight(block('bandit')), d20(10)).outcome).toBe('ongoing');
    expect(play('disengage', pc(), fight(block('bandit')), d20(10)).outcome).toBe('ongoing');
    expect(play('disengage', pc(), fight(block('wolf')), d20(10)).outcome).toBe('ongoing');
    const flee = play('flee', pc({ hp: 40, maxHp: 40 }), fight(block('bandit'), 2), d20(15));
    expect(flee.outcome).toBe('escaped');
    expect(flee.events.filter((e) => e.k === 'attack' && e.opportunity)).toHaveLength(2);
  });

  it('Hide (each sneaker vs each watcher Passive Perception) makes you Invisible and your next attack has Advantage', () => {
    const hidden = play('hide', pc({ stealth: 5 }), fight(block('bandit'), 1, { pcInitiative: 20 }), seq(0.6, 0.0));
    // Bandit Passive Perception 10; total 18 beats it (SK-3 individual contest, not a flat DC 15).
    expect(hidden.events.find((e) => e.k === 'check' && e.label === 'Stealth')).toMatchObject({ dc: 10, ok: true });
    expect(hidden.combat.hiddenStealth).toBe(18);
    const next = playRound({ pc: pc(), combat: hidden.combat, blocks: fight(block('bandit')).blocks, action: 'attack', rng: d20(10) });
    expect(next.events.find((e) => e.k === 'attack' && e.pc)).toMatchObject({ adv: 'advantage' });
  });

  it('Help lets your ally strike with Advantage; Use item drinks a potion (2d4 + 2)', () => {
    const ally = { name: 'Mara', toHit: 4, dice: '1d6+2', type: 'slashing' };
    const helped = play('help', pc({ ally }), fight(block('bandit')), d20(10));
    expect(helped.events.find((e) => e.k === 'attack' && e.attacker === 'Mara')).toMatchObject({ adv: 'advantage' });
    const drink = play('item', pc({ hp: 3, potion: { name: 'Potion of Healing', heal: '2d4+2' } }), fight(block('bandit')), d20(20));
    expect(drink.potionUsed).toBe(true);
    expect(drink.events.find((e) => e.k === 'heal')).toMatchObject({ hpBefore: 3, hpAfter: 12 });
  });

  it('Undead Fortitude: a Zombie dropped by non-radiant damage saves CON (DC 5 + damage) and stays at 1 HP', () => {
    const f = fight(block('zombie'));
    f.combat.foes[0]!.hp = 1;
    const r = play('attack', pc({ weapon: { ...pc().weapon, dice: '1d4', mod: 0 } }), f, seq((10 - 0.5) / 20, 0.0, (19.5) / 20));
    const order = r.events.filter((e) => e.k === 'attack' || e.k === 'save' || e.k === 'fortitude').map((e) => e.k);
    expect(order.slice(0, 3)).toEqual(['attack', 'save', 'fortitude']);
    expect(r.combat.foes[0]!.hp).toBe(1);
  });

  it('a Skeleton takes double bludgeoning damage', () => {
    const r = play('attack', pc({ weapon: { name: 'Mace', toHit: 4, dice: '1d6', mod: 2, type: 'bludgeoning', ranged: false } }), fight(block('skeleton')), d20(15));
    const atk = r.events.find((e) => e.k === 'attack' && e.pc)!;
    expect(atk.k === 'attack' && atk.vulnerable).toBe(true);
    expect(atk.k === 'attack' && atk.dealt).toBe(atk.k === 'attack' ? atk.damage!.total * 2 : 0);
  });

  it('at 0 HP you go down (death saves); damage left over equal to your max HP kills outright', () => {
    const down = play('attack', pc({ hp: 1 }), fight(block('bandit'), 1, { pcInitiative: 1 }), d20(15));
    expect(down.outcome).toBe('down');
    expect(down.pcHp).toBe(0);
    const dead = play('attack', pc({ hp: 1, maxHp: 1 }), fight(block('bandit'), 1, { pcInitiative: 1 }), d20(15));
    expect(dead.outcome).toBe('dead');
  });
});

describe('shared rules engine — death saves', () => {
  it('10+ succeeds, under 10 fails, a 1 is two failures, a 20 is back up at 1 HP; three of either settles it', () => {
    let ds = { successes: 0, failures: 0 };
    for (let i = 0; i < 3; i++) ds = rollDeathSave(ds, d20(12)).state;
    expect(ds).toMatchObject({ successes: 3, stable: true });
    const one = rollDeathSave({ successes: 0, failures: 1 }, d20(1));
    expect(one.result).toBe('two failures');
    expect(one.state.dead).toBe(true);
    expect(rollDeathSave({ successes: 0, failures: 2 }, d20(20)).result).toBe('revived');
    expect(deathSaveLine(rollDeathSave({ successes: 1, failures: 0 }, d20(4)))).toBe('Death save: d20 4 — failure (1 success, 1 failure)');
  });
});

describe('combat presenter — one engine, a presenter per mode', () => {
  it('tabletop shows every roll; LitRPG shows receipts with no dice; story RPG shows none; the writer gets words only', () => {
    const r = play('attack', pc(), fight(block('bandit'), 2), d20(15));
    const tt = presentCombatStatus('dnd', r.events, 'Jax');
    expect(tt.join(' ')).toMatch(/Round 1 — you Greatsword d20 15 \+ 5 = 20 vs AC 12: hit, 2d6 \(\d, \d\) \+ 3 = \d+ slashing/);
    expect(presentCombatStatus('litrpg', r.events, 'Jax').join(' ')).not.toMatch(/d20|AC/);
    expect(presentCombatStatus('rpg', r.events, 'Jax')).toEqual([]);
    const facts = combatFacts(r.events, 'Jax').join(' ');
    expect(facts.replace(/Bandit \d/g, '')).not.toMatch(/\d|\bAC\b|d20|HP/);
    expect(facts).toMatch(/You hit Bandit 1 with your greatsword/);
  });
});
