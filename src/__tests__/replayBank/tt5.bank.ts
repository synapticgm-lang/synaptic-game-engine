/**
 * tt-build-5 — the missing tabletop table rules, from the real cursed-keep ds151 tape.
 *
 * T10 "Face the thugs" (two bandits on the road), T13 "Face the dead" (three zombies) and T18 (Mira's
 * Apothecary, a safe hub) are the recorded turns. Each case stamps the table rules the way a turn does
 * (withHouseRules from Settings) before the sheet is built, then plays the same arc director and chip pad a
 * player gets. Dice are pinned with a fixed Math.random.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';
import { buildNewGameState } from '../../game/fateAutoplay';
import { runArcDirectorBeforeGm, formatArcStatusReceipts } from '../../game/arcDirector';
import { commitOfferedPad } from '../../game/playTranscript';
import { deriveTabletopSheet } from '../../game/tabletop/characterBuild';
import { beginTabletopCreation, creationChips, stepTabletopCreation } from '../../game/tabletop/creationFlow';
import { applyRestHeal } from '../../game/recoveryRules';
import { applySandboxXpAwards } from '../../game/sandboxXp';
import { applyCharacterXpGain } from '../../game/characterXp';
import { payEncounterXp } from '../../game/engineFight';
import { dndXpToNext, takesPartyShare } from '../../game/xpRules';
import { withHouseRules, houseRulesOf, grantEarnedInspiration, tableRulesLine, DEFAULT_HOUSE_RULES } from '../../game/rules/houseRules';
import { carriedWeightLb, carryLine } from '../../game/rules/encumbrance';
import { rollDice, formatDice } from '../../game/rules/dice';
import { sidekickOf } from '../../game/rules/sidekick';
import { createDefaultSettings } from '../../game/defaults';
import type { GameState, Settings } from '../../game/types';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const TT_DS151 = '2026-10-13T14-15-47-252Z_cursed-keep_chilled-gm_s151';

let T: Replay;
beforeAll(async () => {
  T = new Replay(await replayWhole(TT_DS151));
}, 900_000);

afterEach(() => vi.restoreAllMocks());

const settings = (over: Partial<Settings> = {}): Settings => ({ ...createDefaultSettings(), ...over });
const ruled = (s: GameState, over: Partial<Settings> = {}) => withHouseRules(s, settings(over));
const walk = (s: GameState, picks: string[]) => picks.reduce(stepTabletopCreation, s);
/** A ready-made sheet built under these table rules (the rules are stamped before the inn book opens). */
const pregen = (n: number, pick: string, over: Partial<Settings> = {}) =>
  ruled(walk(beginTabletopCreation(ruled(T.before(n), over)), [`Ready-made: ${pick}`, 'Begin play']), over);
const dice = (v: number) => vi.spyOn(Math, 'random').mockReturnValue(v);

function turn(s: GameState, input: string) {
  const arc = runArcDirectorBeforeGm(s, input);
  const status = formatArcStatusReceipts(arc);
  const engineLine = arc.mandate.split('\n').find((m) => /^ENGINE (OUTCOME|RESULT)/.test(m)) ?? '';
  return { state: commitOfferedPad(arc.state), status, engineLine };
}

const words = (line: string) => line.replace(/^[^:]*:/, '');
const round = (status: string[], n: number) => status.find((l) => l.startsWith(`Round ${n} — `)) ?? '';
const lastSystem = (s: GameState) => [...s.log].reverse().find((e) => e.role === 'system')?.content ?? '';

describe('replay bank tt-build-5 (missing tabletop settings)', () => {
  it('[tabletop ds151 T10 | tt-build-5] ability-score method from the table: the build skips the question and rolls 4d6 in the open', () => {
    const open = ruled(T.before(10), { ttStatMethod: '4d6' });
    const s = walk(beginTabletopCreation(open), ['Build my own', 'Fighter', 'Human', 'Soldier']);
    expect(s.tabletopCreation!.stage).toBe('scores');
    expect(s.tabletopCreation!.picks.method).toBe('4d6');
    expect(lastSystem(s)).toContain('This table sets abilities by roll 4d6, drop the lowest.');
    expect(lastSystem(s)).toMatch(/Roll 1: 4d6 /);
    // Quick start and ready-made characters use the table's method too.
    const quick = walk(beginTabletopCreation(open), ['Quick start']);
    expect(quick.character.srd!.method).toBe('4d6');
    const ready = walk(beginTabletopCreation(ruled(T.before(10), { ttStatMethod: 'point-buy' })), ['Ready-made: Human Fighter (Soldier)']);
    expect(ready.character.srd!.method).toBe('point-buy');
    // Player chooses (the default): the question is still asked with all three methods.
    const choose = walk(beginTabletopCreation(ruled(T.before(10))), ['Build my own', 'Fighter', 'Human', 'Soldier']);
    expect(choose.tabletopCreation!.stage).toBe('method');
    expect(creationChips(choose)).toHaveLength(3);
  });

  it('[tabletop ds151 T10 | tt-build-5] starting level 3: the sheet climbs through the SRD level-up with fixed HP', () => {
    const one = pregen(10, 'Human Fighter (Soldier)');
    const three = pregen(10, 'Human Fighter (Soldier)', { ttStartingLevel: 3 });
    const con = Math.floor((three.character.attributes.CON - 10) / 2);
    expect(one.character.level).toBe(1);
    expect(three.character.level).toBe(3);
    expect(three.character.maxHp).toBe(10 + con + 2 * (6 + con));
    expect(three.character.hp).toBe(three.character.maxHp);
    expect(three.character.xp).toBe(0);
    expect(three.character.xpToNext).toBe(dndXpToNext(3));
    expect(deriveTabletopSheet(three)!.title).toContain('Fighter 3');
    expect(deriveTabletopSheet(three)!.pb).toBe(2);
  });

  it('[tabletop ds151 T13 | tt-build-5] crit rules: double dice (SRD), max dice + roll, or double the total — each shown on STATUS', () => {
    const s = pregen(13, 'Human Fighter (Soldier)');
    const crit = (over: Partial<Settings>) => {
      vi.restoreAllMocks();
      dice(0.99); // every d20 is 20, every die its top face
      return round(turn(ruled(s, over), T.input(13)).status, 1);
    };
    expect(crit({})).toMatch(/you Greatsword d20 20 \+ \d+ = \d+ vs AC 8: critical hit, 4d6 \(6, 6, 6, 6\) \+ \d+ = \d+ slashing/);
    expect(crit({ ttCritRule: 'max-plus-roll' })).toMatch(/you Greatsword d20 20 \+ \d+ = \d+ vs AC 8: critical hit, 2d6 max 12 \+ 2d6 \(6, 6\) \+ \d+ = \d+ slashing/);
    expect(crit({ ttCritRule: 'double-total' })).toMatch(/you Greatsword d20 20 \+ \d+ = \d+ vs AC 8: critical hit, 2d6 \(6, 6\) ×2 \+ \d+ = \d+ slashing/);
    // The maths, with dice that are not all top faces: 1d8 crit is 8 + 1d8 or 1d8 × 2.
    const seq = (xs: number[]) => { let i = 0; return () => xs[i++ % xs.length]!; };
    expect(formatDice(rollDice('1d8+3', seq([0.25]), { crit: true, critRule: 'max-plus-roll' }))).toBe('1d8 max 8 + 1d8 (3) + 3 = 14');
    expect(formatDice(rollDice('1d8+3', seq([0.25]), { crit: true, critRule: 'double-total' }))).toBe('1d8 (3) ×2 + 3 = 9');
    expect(formatDice(rollDice('1d8+3', seq([0.25]), { crit: true }))).toBe('2d8 (3, 3) + 3 = 9');
  });

  it('[tabletop ds151 T10 | tt-build-5] hidden GM rolls: the bandits’ dice stay behind the screen; your own rolls and the result still show', () => {
    const s = pregen(10, 'Human Fighter (Soldier)');
    dice(0.5); // d20 11 everywhere
    const r = turn(ruled(s, { ttDiceVisibility: 'hidden' }), T.input(10));
    const init = r.status.find((l) => l.startsWith('Initiative — '))!;
    expect(init).toMatch(/you d20 11 /);
    expect(init).toContain('Bandit ×2 rolled behind the screen');
    const r1 = round(r.status, 1);
    expect(r1).toMatch(/you Greatsword d20 11 \+ \d+ = \d+ vs AC 12/);
    expect(r1).toMatch(/Bandit \d Scimitar: (miss|hit|critical hit)/);
    expect(r1).not.toMatch(/Bandit \d Scimitar d20/);
    vi.restoreAllMocks();
    dice(0.5);
    const open = turn(ruled(s), T.input(10));
    expect(round(open.status, 1)).toMatch(/Bandit \d Scimitar d20 11 \+ 3 = 14 vs AC \d+/);
  });

  it('[tabletop ds151 T10 | tt-build-5] encounter difficulty: Deadly adds a bandit and raises HP and attack; Easy lowers them', () => {
    const s = pregen(10, 'Human Fighter (Soldier)');
    dice(0.5);
    const deadly = turn(ruled(s, { ttEncounterDifficulty: 'deadly' }), T.input(10));
    expect(deadly.status).toContain('Encounter difficulty: deadly — foe HP ×1.5, foe attacks +2, one more foe');
    // Three bandits at HP 17 and +5 drop a level-1 soldier in one round: the deadly table is deadly.
    expect(deadly.status.find((l) => l.startsWith('Initiative — '))).toContain('Bandit ×3');
    expect(round(deadly.status, 1)).toContain('Bandit 1 HP 17 → 6');
    expect(round(deadly.status, 1)).toMatch(/Bandit 3 Scimitar d20 11 \+ 5 = 16 vs AC 16: hit/);
    expect(deadly.status.some((l) => l.startsWith('Fight: DEFEAT'))).toBe(true);
    expect(words(deadly.engineLine)).not.toMatch(/\d/);
    vi.restoreAllMocks();
    dice(0.5);
    const easy = turn(ruled(s, { ttEncounterDifficulty: 'easy' }), T.input(10));
    expect(easy.status).toContain('Encounter difficulty: easy — foe HP ×0.75, foe attacks -1');
    expect(easy.state.roundCombat!.foes.map((f) => f.maxHp)).toEqual([8, 8]);
    expect(round(easy.status, 1)).toMatch(/Bandit \d Scimitar d20 11 \+ 2 = 13 vs AC/);
    vi.restoreAllMocks();
    dice(0.5);
    const normal = turn(ruled(s), T.input(10));
    expect(normal.status.some((l) => l.startsWith('Encounter difficulty:'))).toBe(false);
    expect(normal.state.roundCombat!.foes.map((f) => f.maxHp)).toEqual([11, 11]);
  });

  it('[tabletop ds151 T10 | tt-build-5] solo scaling with milestone levelling: one bandit at level 1, the win pays no XP', () => {
    const s = pregen(10, 'Human Fighter (Soldier)', { ttSoloScaling: true, ttProgression: 'milestone' });
    expect(sidekickOf(s)).toBeNull();
    dice(0.99); // all 20s: the greatsword crit drops the lone bandit in round 1
    const r = turn(ruled(s, { ttSoloScaling: true, ttProgression: 'milestone' }), T.input(10));
    expect(r.status).toContain('Solo scaling: 1 of 2 foes, foe HP and damage ×0.75, no save riders');
    expect(r.status.some((l) => l.startsWith('Fight: VICTORY'))).toBe(true);
    expect(r.status.some((l) => l.startsWith('XP Gained'))).toBe(false);
    expect(r.state.character.xp).toBe(s.character.xp);
    // XP levelling: the same win pays the encounter XP.
    vi.restoreAllMocks();
    dice(0.99);
    const xp = turn(ruled(s, { ttSoloScaling: true }), T.input(10));
    expect(xp.status.some((l) => l.startsWith('XP Gained'))).toBe(true);
  });

  it('[tabletop ds151 T10 | tt-build-5] milestone levelling: a finished quest is one level, with no XP line', () => {
    const s = ruled(pregen(10, 'Human Fighter (Soldier)'), { ttProgression: 'milestone' });
    const quest = (s.quests ?? []).find((q) => q.status !== 'completed');
    expect(quest).toBeTruthy();
    const after = (s.quests ?? []).map((q) => (q.id === quest!.id ? { ...q, status: 'completed' as const } : q));
    const r = applySandboxXpAwards(s, { playerAction: 'Hand over the proof', questsBefore: s.quests ?? [], questsAfter: after, events: [], turn: s.turn });
    expect(r.notes).toEqual([`Milestone: quest complete: ${quest!.name} — level up`]);
    expect(r.xp).toBe(dndXpToNext(1) - (s.character.xp ?? 0));
    expect(applyCharacterXpGain(s.character, r.xp, 'dnd').character.level).toBe(2);
    // Fight XP pays nothing under milestones.
    const enc = { name: 'the thugs', hp: 22, maxHp: 22, count: 2, cr: '1/8' } as never;
    expect(payEncounterXp(s, enc, 'defeated the thugs').receipts).toEqual([]);
    expect(tableRulesLine(s)).toContain('Levelling: milestone');
  });

  it('[tabletop ds151 T10 | tt-build-5] a warrior sidekick joins at creation, fights after you, draws a bandit, and takes no XP share', () => {
    const s = pregen(10, 'Human Fighter (Soldier)', { ttSidekick: 'warrior' });
    const sk = sidekickOf(s)!;
    expect(sk).toBeTruthy();
    expect(sk.role).toBe('Warrior sidekick');
    expect(sk.ac).toBe(16);
    expect(sk.maxHp).toBe(13);
    expect(takesPartyShare(sk)).toBe(false);
    expect([...s.log].reverse().find((e) => e.role === 'system')!.content).toContain(`${sk.name} joins you as your sidekick`);
    dice(0.5);
    const r = turn(ruled(s, { ttSidekick: 'warrior' }), T.input(10));
    const r1 = round(r.status, 1);
    expect(r1).toContain(`${sk.name} a weapon d20 11 + 5 = 16 vs AC 12: hit`);
    expect(r1).toMatch(/Bandit 2 Scimitar d20 11 \+ 3 = 14 vs AC 16: miss/);
    // With an ally beside you, solo scaling does not apply.
    vi.restoreAllMocks();
    dice(0.5);
    const both = turn(ruled(s, { ttSidekick: 'warrior', ttSoloScaling: true }), T.input(10));
    expect(both.status.some((l) => l.startsWith('Solo scaling'))).toBe(false);
    expect(both.state.roundCombat!.foes).toHaveLength(2);
    expect(words(r.engineLine)).not.toMatch(/\d/);
  });

  it('[tabletop ds151 T10 | tt-build-5] death rules: Revivify for coin, or left for dead and robbed; SRD death is final', () => {
    const s0 = pregen(10, 'Human Fighter (Soldier)', { ttDeathRule: 'revive' });
    const dying = (over: Partial<Settings>, gold: number): GameState => ruled({
      ...s0,
      gold,
      character: { ...s0.character, hp: 0, conditions: ['Unconscious'], heroicInspiration: false },
      deathSaves: { successes: 0, failures: 2 },
    }, over);
    dice(0); // natural 1
    const revive = turn(dying({ ttDeathRule: 'revive' }, 450), 'Fight for breath');
    expect(revive.status).toContain('Death rule (revive): Revivify — back at 1 HP; 300 GP of your coin pays for the diamond');
    expect(revive.state.character.hp).toBe(1);
    expect(revive.state.gold).toBe(150);
    expect(revive.state.deathSaves ?? null).toBeNull();
    expect(revive.state.character.conditions ?? []).not.toContain('Unconscious');
    expect(words(revive.engineLine)).not.toMatch(/\d/);
    const mercy = turn(dying({ ttDeathRule: 'mercy' }, 41), 'Fight for breath');
    expect(mercy.status).toContain('Death rule (mercy): left for dead — you wake 1d4 (1) hours later at 1 HP');
    expect(mercy.status).toContain('Gold Lost: 20 (taken while you lay senseless)');
    expect(mercy.state.gold).toBe(21);
    expect(mercy.state.character.hp).toBe(1);
    const srd = turn(dying({}, 41), 'Fight for breath');
    expect(srd.state.deathSaves?.dead).toBe(true);
    expect(srd.state.gold).toBe(41);
  });

  it('[tabletop ds151 T10 | tt-build-5] Heroic Inspiration: a Human starts with it; 5.2.1 rerolls a missed attack, 5.1 gives Advantage', () => {
    const s = pregen(10, 'Human Fighter (Soldier)');
    expect(s.character.heroicInspiration).toBe(true);
    expect(lastSystem(s)).toContain('Heroic Inspiration: yours (Human, Resourceful).');
    dice(0.01); // every d20 is 1: the swing misses, the reroll misses too
    const r = turn(ruled(s), T.input(10));
    expect(round(r.status, 1)).toMatch(/you Greatsword d20 1 \+ \d+ = \d+ vs AC 12 \(Heroic Inspiration: rerolled d20 1\): miss/);
    expect(r.status).toContain('Heroic Inspiration: spent');
    expect(r.state.character.heroicInspiration).toBe(false);
    // 5.1: Inspiration is Advantage on the first attack.
    vi.restoreAllMocks();
    dice(0.01);
    const old = turn(ruled(s, { ttRulesVersion: 'srd-5.1' }), T.input(10));
    expect(round(old.status, 1)).toMatch(/you Greatsword d20 \(adv: 1, 1\) 1 .*\(Heroic Inspiration: Advantage\)/);
    // A Human made under 5.1 does not get it at creation; the rule turned off grants nothing.
    expect(pregen(10, 'Human Fighter (Soldier)', { ttRulesVersion: 'srd-5.1' }).character.heroicInspiration).toBeUndefined();
    expect(pregen(10, 'Human Fighter (Soldier)', { ttHeroicInspiration: false }).character.heroicInspiration).toBeUndefined();
    // A finished quest grants it (first stamp only records the old keys).
    const spent = { ...r.state, inspirationKeys: [] as string[] };
    const done = grantEarnedInspiration({ ...spent, sandboxAwardKeys: [...(spent.sandboxAwardKeys ?? []), 'quest-complete:q1'] });
    expect(done.character.heroicInspiration).toBe(true);
    const fresh = grantEarnedInspiration({ ...spent, inspirationKeys: undefined, sandboxAwardKeys: ['quest-complete:q1'] });
    expect(fresh.character.heroicInspiration).toBe(false);
    expect(fresh.inspirationKeys).toEqual(['quest-complete:q1']);
  });

  it('[tabletop ds151 T10 | tt-build-5] variant encumbrance: over STR × 10 lb you are slowed 20 ft and swing with Disadvantage', () => {
    const s0 = pregen(10, 'Human Fighter (Soldier)', { ttEncumbrance: 'variant' });
    const str = deriveTabletopSheet(s0)!.scores.STR;
    const load = (lb: number): GameState => ruled({ ...s0, inventory: [...(s0.inventory ?? []), { id: 'stone', name: 'Stone Block', quantity: lb, rarity: 'Common', type: 'misc' } as never] }, { ttEncumbrance: 'variant' });
    const base = carriedWeightLb(s0.inventory);
    const heavy = load(str * 10 - base + 1);
    expect(deriveTabletopSheet(heavy)!.speed).toBe(10);
    expect(carryLine(heavy.inventory, str, 'variant')).toContain('heavily encumbered (Speed −20 ft, Disadvantage on STR/DEX/CON attacks, checks and saves)');
    // Just over STR × 5 (the soldier's kit alone may already be past it): Speed −10.
    const extra = Math.max(1, str * 5 - base + 1);
    expect(base + extra).toBeLessThanOrEqual(str * 10);
    expect(deriveTabletopSheet(load(extra))!.speed).toBe(20);
    // Capacity only (the step-4 rule): no speed change.
    expect(deriveTabletopSheet(ruled(heavy, { ttEncumbrance: 'capacity' }))!.speed).toBe(30);
    dice(0.5);
    const r = turn(heavy, T.input(10));
    expect(round(r.status, 1)).toMatch(/you Greatsword d20 \(dis: 11, 11\) 11/);
  });

  it('[tabletop ds151 T18 | tt-build-5] rest variants at Mira’s: gritty long rest is a week, heroic short rest is five minutes; the sidekick heals', () => {
    const s0 = pregen(18, 'Human Fighter (Soldier)', { ttSidekick: 'expert' });
    expect(T.after(18).currentLocation).toBe("Mira's Apothecary");
    const sk = sidekickOf(s0)!;
    const hurt: GameState = {
      ...s0,
      character: { ...s0.character, hp: 3, heroicInspiration: false },
      companions: (s0.companions ?? []).map((c) => (c.sidekick ? { ...c, hp: 2 } : c)),
    };
    const gritty = applyRestHeal(ruled(hurt, { ttRestVariant: 'gritty', ttSidekick: 'expert' }), 'Rest for the night');
    expect(gritty.receipt).toMatch(/^Rest: long rest \(gritty rest\), 7 days — HP 3 → \d+ \(/);
    expect(gritty.fact).toContain('about a week');
    expect(gritty.after).toContain(`${sk.name}: HP 2 → ${sk.maxHp}`);
    expect(gritty.after).toContain('Heroic Inspiration: yours (Human, Resourceful)');
    expect(sidekickOf(gritty.state)!.hp).toBe(sk.maxHp);
    const heroic = applyRestHeal(ruled(hurt, { ttRestVariant: 'heroic' }), 'Take a short rest');
    expect(heroic.receipt).toMatch(/^Rest: short rest \(heroic rest\), 5 minutes — HP 3 → \d+ \(/);
    expect(heroic.fact).toContain('about five minutes');
    const standard = applyRestHeal(ruled(hurt), 'Take a short rest');
    expect(standard.receipt).toMatch(/^Rest: short rest, 1 hour — HP 3 → \d+ \(\+1h, now \w+\)$/);
  });

  it('[tt-build-5 guard] LitRPG and story RPG ignore every table rule: no stamp, no sidekick, same XP and crit maths', () => {
    const loud = settings({
      ttRulesVersion: 'srd-5.1', ttStatMethod: '4d6', ttStartingLevel: 5, ttProgression: 'milestone', ttDiceVisibility: 'hidden',
      ttEncounterDifficulty: 'deadly', ttSoloScaling: true, ttSidekick: 'warrior', ttDeathRule: 'mercy', ttRestVariant: 'gritty',
      ttEncumbrance: 'variant', ttCritRule: 'double-total', ttHeroicInspiration: true,
    });
    for (const bibleId of ['summoned-pact', 'salt-road-heist']) {
      const st = buildNewGameState({ bibleId, characterName: 'Jax', seed: 150, personality: 'chilled-gm' }).state;
      const stamped = withHouseRules(st, loud);
      expect(stamped).toBe(st);
      expect(houseRulesOf(stamped)).toEqual(DEFAULT_HOUSE_RULES);
      expect(sidekickOf(stamped)).toBeNull();
      expect(stamped.character.heroicInspiration).toBeUndefined();
      const enc = { name: 'a thug', hp: 10, maxHp: 10, count: 1, cr: '1/8' } as never;
      expect(payEncounterXp(stamped, enc, 'x').receipts).toEqual(payEncounterXp(st, enc, 'x').receipts);
    }
    const seq = () => 0.25;
    expect(formatDice(rollDice('1d8+3', seq, { crit: true }))).toBe('2d8 (3, 3) + 3 = 9');
  });
});
