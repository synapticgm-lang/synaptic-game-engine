/**
 * tt-build-3 — tabletop level-up and spells, from the real cursed-keep ds151 tape.
 *
 * T10 "Face the thugs" (two bandits), T13 "Face the dead" (three zombies) and T18 at Mira's Apothecary
 * (a safe hub) are the recorded turns. Each case takes the real state before that turn, gives it a
 * ready-made sheet (tt-build-1), and plays through the same arc director and chip pad a player gets.
 * Dice are pinned with a fixed Math.random so every roll can be checked.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';
import { buildNewGameState } from '../../game/fateAutoplay';
import { runArcDirectorBeforeGm, formatArcStatusReceipts } from '../../game/arcDirector';
import { commitOfferedPad, resolveOfferedChoices } from '../../game/playTranscript';
import { engineResultFact } from '../../game/engineResult';
import { applyCharacterXpGain } from '../../game/characterXp';
import { applyRestHeal, restChip } from '../../game/recoveryRules';
import { dndXpToNext } from '../../game/xpRules';
import { abilityMod, deriveTabletopSheet, formatTabletopSheet } from '../../game/tabletop/characterBuild';
import { beginTabletopCreation, creationChips, stepTabletopCreation } from '../../game/tabletop/creationFlow';
import { roundCombatChips } from '../../game/tabletop/combatChips';
import { tabletopCastChip } from '../../game/tabletop/spellCasting';
import { enumerateLegalEdges } from '../../game/choiceEdge';
import type { GameState } from '../../game/types';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const TT_DS151 = '2026-10-13T14-15-47-252Z_cursed-keep_chilled-gm_s151';

let T: Replay;
beforeAll(async () => {
  T = new Replay(await replayWhole(TT_DS151));
}, 900_000);

afterEach(() => vi.restoreAllMocks());

const walk = (s: GameState, picks: string[]) => picks.reduce(stepTabletopCreation, s);
const pregen = (n: number, pick: string) => walk(beginTabletopCreation(T.before(n)), [`Ready-made: ${pick}`, 'Begin play']);
/** Every d20 lands on 1 + floor(v × 20); every dN on 1 + floor(v × N). */
const dice = (v: number) => vi.spyOn(Math, 'random').mockReturnValue(v);
const sgn = (n: number) => (n >= 0 ? `+ ${n}` : `− ${Math.abs(n)}`);

function turn(s: GameState, input: string) {
  const arc = runArcDirectorBeforeGm(s, input);
  const status = formatArcStatusReceipts(arc);
  const engineLine = arc.mandate.split('\n').find((m) => /^ENGINE (OUTCOME|RESULT)/.test(m)) ?? '';
  const after = commitOfferedPad(arc.state);
  return { state: after, status, engineLine, mandate: arc.mandate, chips: resolveOfferedChoices(after) };
}

const words = (line: string) => line.replace(/^[^:]*:/, '');

describe('replay bank tt-build-3 (tabletop level-up and spells)', () => {
  it('[tabletop ds151 T10 | tt-build-3] winning the fight crosses 300 XP: level 2 by the SRD (fixed Hit Die + CON), new features on STATUS', () => {
    const s0 = pregen(10, 'Human Fighter (Soldier)');
    const s = { ...s0, character: { ...s0.character, xp: dndXpToNext(1) - 1 } };
    const con = abilityMod(s.character.attributes.CON);
    expect(s.character.maxHp).toBe(10 + con);
    dice(0.5);
    const r1 = turn(s, T.input(10));
    const r2 = turn(r1.state, 'Attack with the Greatsword');
    expect(r2.status.some((l) => l.startsWith('Fight: VICTORY vs the thugs'))).toBe(true);
    const hpWon = r1.state.character.hp;
    expect(r2.status).toContain('Level Up! Now level 2');
    expect(r2.status).toContain(
      `Level 2 — Hit Die d10: fixed 6 ${sgn(con)} CON; HP max ${10 + con} → ${16 + 2 * con}, HP ${r2.status.find((l) => l.startsWith('HP: '))?.match(/→ (\d+)/)?.[1] ?? hpWon} → ${r2.state.character.hp}; Hit Dice 2`
    );
    expect(r2.status).toContain('New features: Action Surge, Tactical Mind');
    expect(r2.state.character.level).toBe(2);
    expect(r2.state.character.maxHp).toBe(16 + 2 * con);
    // The level-up raises HP by the gain; it is not a free full heal.
    expect(r2.state.character.srd?.hpGains).toEqual([6]);
    // The sheet shows the same numbers, from the same source.
    const d = deriveTabletopSheet(r2.state)!;
    expect(d.maxHp).toBe(r2.state.character.maxHp);
    expect(d.hpLine).toBe(`d10 10 + 6 ${con >= 0 ? '+' : ''}${con} CON ×2`);
    expect(d.features).toEqual(expect.arrayContaining(['Action Surge', 'Tactical Mind']));
    // Level lines are STATUS chrome, never writer facts; the writer gets no digits.
    expect(engineResultFact(r2.status)).not.toMatch(/Level \d|Hit Die|New feature/);
    expect(words(r2.engineLine)).not.toMatch(/\d/);
    if (r2.status.some((l) => l.startsWith('Gold Gained:'))) expect(r2.engineLine).toContain('some coin');
  });

  it('[tabletop ds151 T10 | tt-build-3] "roll for HP" on the inn book rolls the Hit Die at level-up and shows the roll', () => {
    const page = walk(beginTabletopCreation(T.before(10)), ['Ready-made: Human Fighter (Soldier)']);
    expect(creationChips(page)).toEqual(['Begin play', 'Roll for HP at each level', 'Start over']);
    const rolled = walk(page, ['Roll for HP at each level']);
    expect(rolled.character.srd?.hpMethod).toBe('roll');
    expect(creationChips(rolled)).toContain('Take the fixed HP at each level');
    const s = walk(rolled, ['Begin play']);
    const con = abilityMod(s.character.attributes.CON);
    dice(0.95); // d10 → 10
    const up = applyCharacterXpGain(s.character, dndXpToNext(1), 'dnd');
    expect(up.character.level).toBe(2);
    expect(up.notes[1]).toBe(`Level 2 — Hit Die d10: rolled 10 ${sgn(con)} CON; HP max ${10 + con} → ${20 + 2 * con}, HP ${s.character.hp} → ${s.character.hp + 10 + con}; Hit Dice 2`);
  });

  it('[tabletop ds151 T13 | tt-build-3] a cleric casts Bless: one level 1 slot, concentration, and the slot count on STATUS', () => {
    const s = pregen(13, 'Dwarf Cleric (Acolyte)');
    const before = deriveTabletopSheet(s)!.spellcasting!;
    expect(before.slots).toEqual([{ level: 1, total: 2, left: 2 }]);
    expect(before.prepared).toEqual(['Cure Wounds', 'Guiding Bolt', 'Bless', 'Healing Word']);
    dice(0.5);
    const r1 = turn(s, T.input(13));
    expect(r1.chips).toContain('Cast Sacred Flame');
    expect(r1.chips).toContain('Cast Bless');
    expect(r1.chips).toEqual(roundCombatChips(r1.state));
    const r2 = turn(r1.state, 'Cast Bless');
    const round = r2.status.find((l) => l.startsWith('Round 2 — '))!;
    expect(round).toContain('you cast Bless (level 1 slot, concentration)');
    expect(r2.status).toContain('Spell slots: level 1 1/2 left');
    expect(r2.state.character.casting?.slotsUsed).toEqual([1]);
    expect(r2.state.roundCombat?.concentration).toBe('Bless');
    expect(deriveTabletopSheet(r2.state)!.spellcasting!.slots[0]!.left).toBe(1);
    // Concentrating on Bless: no second concentration chip.
    expect(r2.chips).not.toContain('Cast Bless');
    expect(r2.engineLine).toContain('You cast Bless:');
    expect(words(r2.engineLine)).not.toMatch(/\d/);
    // Blessed: the next attack adds 1d4, shown on STATUS.
    const r3 = turn(r2.state, 'Cast Sacred Flame');
    expect(r3.status.find((l) => l.startsWith('Round 3 — '))).toMatch(/Zombie DEX save against Sacred Flame d20 11 − 2 = 9 vs DC \d+/);
  });

  it('[tabletop ds151 T13 | tt-build-3] taking damage while concentrating calls a CON save (DC 10 or half the damage); a failure ends Bless', () => {
    const s = pregen(13, 'Dwarf Cleric (Acolyte)');
    dice(0.5);
    const r1 = turn(s, T.input(13));
    const r2 = turn(r1.state, 'Cast Bless');
    vi.restoreAllMocks();
    // d20 20 for the zombies' slams (they hit); the CON save shares the roll, so pin it low after.
    let n = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => (n++ % 2 === 0 ? 0.99 : 0.01));
    const r3 = turn(r2.state, 'Dodge');
    const round = r3.status.find((l) => l.startsWith('Round 3 — '))!;
    if (/CON save to hold Bless/.test(round)) {
      expect(round).toMatch(/you CON save to hold Bless d20 \d+ [+−] \d+( \+ Bless 1d4 \(\d\))? = \d+ vs DC \d+: (success|failure)/);
      if (/to hold Bless[^;]*failure/.test(round)) {
        expect(round).toContain('you lose concentration on Bless');
        expect(r3.state.roundCombat?.concentration ?? null).toBeNull();
        expect(r3.engineLine).toContain('Your concentration breaks, and Bless fades.');
      }
    } else {
      // Dodge gave every slam disadvantage: no damage, no save.
      expect(r3.state.character.hp).toBe(r2.state.character.hp);
    }
    expect(words(r3.engineLine)).not.toMatch(/\d/);
  });

  it('[tabletop ds151 T13 | tt-build-3] a wizard’s Magic Missile spends a slot and always hits; with no slot left the chip goes and a typed cast spends nothing', () => {
    const s = pregen(13, 'Elf Wizard (Sage)');
    dice(0.3);
    const r1 = turn(s, T.input(13));
    expect(r1.chips).toContain('Cast Fire Bolt');
    expect(r1.chips.some((c) => /^Cast (Magic Missile|Burning Hands)$/.test(c))).toBe(true);
    const r2 = turn(r1.state, 'Cast Magic Missile');
    const round = r2.status.find((l) => l.startsWith('Round 2 — '))!;
    expect(round).toContain('you cast Magic Missile (level 1 slot)');
    // Three darts at one target: 3 × (1d4 + 1), rolled as one line, no attack roll.
    expect(round).toMatch(/you Magic Missile: 3d4 \(\d, \d, \d\) \+ 3 = \d+ force; Zombie HP \d+ → \d+/);
    expect(round).not.toMatch(/Magic Missile d20/);
    expect(r2.status).toContain('Spell slots: level 1 1/2 left');
    const r3 = turn(r2.state, 'Cast Magic Missile');
    if (r3.state.roundCombat) {
      expect(r3.status).toContain('Spell slots: level 1 0/2 left');
      expect(r3.chips.some((c) => /^Cast (Magic Missile|Burning Hands|Thunderwave)$/.test(c))).toBe(false);
      expect(r3.chips).toContain('Cast Fire Bolt');
      const r4 = turn(r3.state, 'Cast Magic Missile');
      expect(r4.status).toContain('Spell: Magic Missile — not cast (no spell slot left for Magic Missile); no slot spent');
      expect(r4.state.character.casting?.slotsUsed).toEqual([2]);
      expect(r4.engineLine).toContain('You reach for Magic Missile, but no spell slot left for Magic Missile, so you attack instead.');
    }
  });

  it('[tabletop ds151 T18 | tt-build-3] a long rest at Mira’s brings every slot back; a wizard’s short rest uses Arcane Recovery once', () => {
    const s0 = pregen(18, 'Elf Wizard (Sage)');
    expect(T.after(18).currentLocation).toBe("Mira's Apothecary");
    const spent = { ...s0, character: { ...s0.character, casting: { slotsUsed: [2] } } };
    expect(deriveTabletopSheet(spent)!.spellcasting!.slots[0]!.left).toBe(0);
    // Full HP, but out of slots: the rest chip is offered (short first: Arcane Recovery is due).
    expect(restChip(spent)).toBe('Take a short rest');
    const short = applyRestHeal(spent, 'Take a short rest');
    expect(short.receipt).toMatch(/^Rest: short rest, 1 hour — HP stays \d+ \(\+1h, now \w+\)$/);
    expect(short.after).toEqual(['Arcane Recovery: level 1 slot back', 'Spell slots: level 1 1/2 left']);
    expect(short.state.character.casting?.arcaneRecoveryUsed).toBe(true);
    expect(restChip(short.state)).toBe('Rest for the night');
    expect(applyRestHeal(short.state, 'Take a short rest').receipt).toBeNull();
    const long = applyRestHeal(short.state, 'Rest for the night');
    expect(long.receipt).toMatch(/^Rest: long rest, 8 hours — HP stays \d+ \(\+8h, now \w+\)$/);
    expect(long.after).toEqual(['Spell slots: level 1 2/2 left']);
    expect(long.state.character.casting).toEqual({ slotsUsed: [] });
    expect(long.fact).toMatch(/spells ready again/);
    expect(engineResultFact([long.receipt!, ...long.after!], 'dnd')).not.toMatch(/Spell slots/);
  });

  it('[tabletop ds151 T18 | tt-build-3] out of a fight: a hurt cleric casts Cure Wounds (chip offered), a wizard puts on Mage Armor', () => {
    const c0 = pregen(18, 'Dwarf Cleric (Acolyte)');
    const hurt = { ...c0, character: { ...c0.character, hp: 3 } };
    const wis = abilityMod(hurt.character.attributes.WIS);
    // The chip reaches the pad through the legal edges the choice compiler reads (beside the rest chip).
    expect(tabletopCastChip(hurt)).toBe('Cast Cure Wounds');
    expect(enumerateLegalEdges(hurt).map((e) => e.label)).toContain('Cast Cure Wounds');
    expect(tabletopCastChip(c0)).toBeNull();
    dice(0.5); // 2d8 → 5, 5
    const r = turn(hurt, 'Cast Cure Wounds');
    const heal = 10 + wis;
    expect(r.status).toContain(`Spell: Cure Wounds (level 1 slot) — 2d8 (5, 5) ${sgn(wis)} = ${heal}; HP 3 → ${Math.min(hurt.character.maxHp, 3 + heal)}`);
    expect(r.status).toContain('Spell slots: level 1 1/2 left');
    expect(r.engineLine).toBe('ENGINE RESULT (required fact — state it plainly): You cast Cure Wounds: healing warmth closes your wounds.');

    const w0 = pregen(18, 'Elf Wizard (Sage)');
    const acBefore = deriveTabletopSheet(w0)!.ac;
    const dex = abilityMod(w0.character.attributes.DEX);
    const m = turn(w0, 'Cast Mage Armor');
    expect(m.status).toContain(`Spell: Mage Armor (level 1 slot) — AC ${acBefore} → ${13 + dex} until your next long rest`);
    expect(deriveTabletopSheet(m.state)!.ac).toBe(13 + dex);
    expect(m.state.character.armorClass).toBe(13 + dex);
    expect(formatTabletopSheet(m.state).join('\n')).toContain(`AC ${13 + dex} (Mage Armor)`);
    expect(words(m.engineLine)).not.toMatch(/\d/);
    // Sacred Flame needs a target: cast outside a fight, nothing is spent.
    const miss = turn(hurt, 'Cast Sacred Flame');
    expect(miss.status).toContain('Spell: Sacred Flame — not cast (Sacred Flame needs a foe to aim at); no slot spent');
    expect(miss.state.character.casting ?? { slotsUsed: [] }).toEqual({ slotsUsed: [] });
  });

  it('[tt-build-3 guard] LitRPG and story RPG level-ups gain the shared Hit Die HP and keep the one STATUS line; a fighter casts nothing', () => {
    for (const bibleId of ['summoned-pact', 'salt-road-heist']) {
      const st = buildNewGameState({ bibleId, characterName: 'Jax', seed: 150, personality: 'chilled-gm' }).state;
      const c = { ...st.character, hp: 1 };
      const up = applyCharacterXpGain(c, 100_000, st.engineMode);
      expect(up.character.level).toBeGreaterThan(1);
      expect(up.notes.every((n) => /^Level Up! Now level \d+$/.test(n))).toBe(true);
      expect(up.character.srd).toBeUndefined();
      // tt-build-7: d8 at its fixed value (5) + CON modifier per level, added to max and current HP (no full heal).
      const perLevel = Math.max(1, 5 + Math.floor(((st.character.attributes?.CON ?? 10) - 10) / 2));
      const levels = up.character.level - 1;
      expect(up.character.maxHp).toBe(st.character.maxHp + perLevel * levels);
      expect(up.character.hp).toBe(1 + perLevel * levels);
    }
    const f = pregen(13, 'Human Fighter (Soldier)');
    expect(deriveTabletopSheet(f)!.spellcasting).toBeUndefined();
    expect(turn(f, 'Cast Bless').status.some((l) => l.startsWith('Spell:'))).toBe(false);
  });
});
