/**
 * tt-build-6b — coins and carrying, armor training, real-time rest while away, session zero and the saved-sheet
 * library, from the real cursed-keep ds151 tape.
 *
 * T4 is Keep Gate at night, T9 Greyhollow Inn (a safe hub), T13 three zombies on the graveyard road, T18 Mira's
 * Apothecary. Each case uses a step 1 ready-made or built sheet and stamps the table rules from Settings the way a
 * turn does. Dice are pinned with a fixed Math.random.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';
import { buildNewGameState } from '../../game/fateAutoplay';
import { runArcDirectorBeforeGm, formatArcStatusReceipts } from '../../game/arcDirector';
import { commitOfferedPad } from '../../game/playTranscript';
import { beginTabletopCreation, creationChips, stepTabletopCreation, tabletopCreationPending } from '../../game/tabletop/creationFlow';
import { resolveCheckContext, runPlayerCheck } from '../../game/checkMath';
import { parsePlayerIntent } from '../../game/intentParser';
import { withHouseRules } from '../../game/rules/houseRules';
import { carryLine } from '../../game/rules/encumbrance';
import {
  carriedCoinLb, changeFor, coinWeightLb, formatPurse, payCoins, purseCp, purseOf, settlePurse, srdSaleCp, usesPurse, wealthLine,
} from '../../game/rules/coins';
import { applyAwayRest, awayRestBlock } from '../../game/rules/awayRest';
import { formatTabletopSheet, untrainedArmor } from '../../game/tabletop/characterBuild';
import { casterKit } from '../../game/tabletop/spellCasting';
import { roundCombatChips } from '../../game/tabletop/combatChips';
import { sellItem, sellPriceLabel } from '../../game/merchant';
import { formatSessionZeroForPrompt } from '../../game/customTabletopRules';
import { buildMasterPrompt } from '../../game/masterPrompt';
import { importSheetText, saveSheet, setDefaultSheet, sheetFromState, validateSheet } from '../../game/tabletop/sheetLibrary';
import { createDefaultSettings } from '../../game/defaults';
import type { GameState, Item, Settings } from '../../game/types';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const TT_DS151 = '2026-10-13T14-15-47-252Z_cursed-keep_chilled-gm_s151';
const HOUR = 3_600_000;

let T: Replay;
beforeAll(async () => {
  T = new Replay(await replayWhole(TT_DS151));
}, 900_000);

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const settings = (over: Partial<Settings> = {}): Settings => ({ ...createDefaultSettings(), ...over });
const ruled = (s: GameState, over: Partial<Settings> = {}) => withHouseRules(s, settings(over));
const walk = (s: GameState, picks: string[]) => picks.reduce(stepTabletopCreation, s);
const pregen = (n: number, pick: string, over: Partial<Settings> = {}) =>
  ruled(walk(beginTabletopCreation(ruled(T.before(n), over)), [`Ready-made: ${pick}`, 'Begin play']), over);
function built(n: number, picks: string[], over: Partial<Settings> = {}): GameState {
  let s = walk(beginTabletopCreation(ruled(T.before(n), over)), picks);
  for (let i = 0; i < 12 && tabletopCreationPending(s); i++) s = stepTabletopCreation(s, creationChips(s)[0]);
  return ruled(s, over);
}
const dice = (v: number) => vi.spyOn(Math, 'random').mockReturnValue(v);
const check = (s: GameState, input: string) => runPlayerCheck(s, parsePlayerIntent(input, s), input);
const ctx = (s: GameState, input: string) => resolveCheckContext(s, parsePlayerIntent(input, s), input);
function turn(s: GameState, input: string) {
  const arc = runArcDirectorBeforeGm(s, input);
  return { state: commitOfferedPad(arc.state), status: formatArcStatusReceipts(arc) };
}
const round = (status: string[], n: number) => status.find((l) => l.startsWith(`Round ${n} — `)) ?? '';
const item = (s: GameState, name: string) => (s.inventory ?? []).find((i) => i.name === name);
/** The same character wearing another armor piece (taken off a Fighter's real kit), the old armor off. */
function wearing(s: GameState, armor: Item): GameState {
  const inv = (s.inventory ?? []).map((i) => (i.equipped && /armor|mail|shirt/i.test(i.name) ? { ...i, equipped: false } : i));
  return { ...s, inventory: [...inv, { ...armor, id: `${armor.id}-worn`, equipped: true }] };
}
/** An in-memory localStorage for the device library (the bank runs in node). */
function memoryStorage() {
  const m = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, String(v)),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
    key: (i: number) => [...m.keys()][i] ?? null,
    get length() { return m.size; },
  });
}

describe('replay bank tt-build-6b (coins, carrying, armor training, away rest, session zero, sheet library)', () => {
  it('[tabletop ds151 T18 | tt-build-6b] coins: the purse is the gold ledger in SRD coins; selling SRD gear pays half its cost in exact change', () => {
    const s = pregen(18, 'Dwarf Cleric (Acolyte)');
    expect(s.currentLocation).toMatch(/Apothecary/);
    // The purse settles on the turn stamp: an older save's gold arrives as GP.
    expect(usesPurse(s)).toBe(true);
    expect(s.purse).toEqual({ coins: { pp: 0, gp: s.gold, ep: 0, sp: 0, cp: 0 }, gold: s.gold });
    expect(wealthLine(s)).toBe(`${s.gold} GP`);
    // The Priest's Pack costs 33 GP (SRD); a buyer pays half: 16 GP 5 SP. The list and the sale read one price.
    const pack = item(s, "Priest's Pack")!;
    expect(pack.equipped).toBeFalsy();
    expect(srdSaleCp("Priest's Pack")).toBe(1650);
    expect(sellPriceLabel(s, pack)).toBe('16 GP, 5 SP');
    // The two Holy Symbols (kit and Acolyte) sell as a stack: 2 × 5 GP, halved.
    expect(sellPriceLabel(s, item(s, 'Holy Symbol')!)).toBe('5 GP');
    const sold = sellItem(s, pack.id);
    expect(sold).toMatchObject({ ok: true, soldFor: '16 GP, 5 SP', goldGained: 16 });
    const after = sold.newState!;
    expect(after.gold).toBe(s.gold + 16);
    expect(purseOf(after)).toMatchObject({ gp: s.gold + 16, sp: 5 });
    expect(formatTabletopSheet(after).find((l) => l.startsWith('Kit:'))).toMatch(new RegExp(`· ${s.gold + 16} GP, 5 SP$`));
    // Gold spent elsewhere (a merchant, a death fee) is paid from the purse, small coins first, with change.
    const spent = settlePurse({ ...after, gold: after.gold - 3 });
    expect(purseCp(spent.purse!.coins)).toBe(purseCp(purseOf(after)!) - 300);
    expect(spent.purse!.coins.sp).toBeLessThan(10);
    expect(payCoins({ pp: 0, gp: 0, ep: 0, sp: 5, cp: 0 }, 100)).toBeNull();
    expect(changeFor(1234)).toEqual({ pp: 0, gp: 12, ep: 0, sp: 3, cp: 4 });
  });

  it('[tabletop ds151 T4 | tt-build-6b] carrying: 50 coins weigh a pound and count against Strength × 15', () => {
    const s = pregen(4, 'Human Fighter (Soldier)', { ttEncumbrance: 'capacity' });
    const coins = purseOf(s)!;
    expect(carriedCoinLb(s)).toBe(coinWeightLb(coins));
    const rich = settlePurse({ ...s, gold: 500 });
    expect(carriedCoinLb(rich)).toBe(10);
    const line = carryLine(rich.inventory, rich.character.attributes.STR, 'capacity', carriedCoinLb(rich));
    expect(line).toMatch(/\(coins 10 lb\)/);
    // A merchant receipt that never touched the purse cannot desync it: the next read folds the gold in.
    expect(purseOf({ ...rich, gold: 520 })!.gp).toBe(purseOf(rich)!.gp + 20);
  });

  it('[tabletop ds151 T4 + T13 | tt-build-6b] armor training: a Wizard in Chain Mail has Disadvantage on STR and DEX rolls and cannot cast', () => {
    const fighter = pregen(4, 'Human Fighter (Soldier)');
    const mail = item(fighter, 'Chain Mail')!;
    expect(untrainedArmor(fighter.character, fighter.inventory)).toBeNull();
    const wizard = built(4, ['Build my own', 'Wizard', 'Human', 'Sage']);
    expect(casterKit(wizard)).not.toBeNull();
    const armored = wearing(wizard, mail);
    expect(untrainedArmor(armored.character, armored.inventory)).toBe('Chain Mail');
    expect(casterKit(armored)).toBeNull();
    expect(formatTabletopSheet(armored)).toContain('Armor training: not trained in Chain Mail — Disadvantage on Strength and Dexterity rolls, and no spellcasting');
    dice(0.5);
    expect(ctx(armored, 'Climb the gate').label).toBe('Athletics');
    expect(check(armored, 'Climb the gate').displayLine).toMatch(/untrained in Chain Mail\) d20 \(dis: 11, 11\)/);
    // A mental check is not hampered by armor.
    expect(check(armored, 'Recall what I know of the keep').displayLine ?? '').not.toMatch(/untrained/);
    // The trained Fighter rolls the same climb straight.
    expect(check(fighter, 'Climb the gate').displayLine).toMatch(/^Athletics \(medium\) d20 \(11\) /);
    // In the T13 fight: no Cast chip, and the Wizard's weapon attack rolls with Disadvantage.
    vi.restoreAllMocks();
    dice(0.5);
    const fightWizard = wearing(built(13, ['Build my own', 'Wizard', 'Human', 'Sage']), mail);
    const fight = turn(fightWizard, T.input(13));
    expect(round(fight.status, 1)).toMatch(/you [A-Za-z ]+ d20 \(dis: 11, 11\)/);
    expect((roundCombatChips(fight.state) ?? []).some((c) => /^Cast /.test(c))).toBe(false);
  });

  it('[tabletop ds151 T9 + T13 | tt-build-6b] away rest: an hour away at the inn is a short rest, a night away a long rest plus Heroic Inspiration; never on the road', () => {
    // A Dwarf, so the well-rested bonus is the away rest's own (a Human already gets it from Resourceful).
    const base = pregen(9, 'Dwarf Cleric (Acolyte)');
    expect(base.currentLocation).toBe('Greyhollow Inn');
    const hurt: GameState = { ...base, character: { ...base.character, hp: base.character.maxHp - 6, heroicInspiration: false } };
    expect(awayRestBlock(hurt)).toBeNull();
    expect(applyAwayRest(hurt, 30 * 60_000)).toBeNull();
    dice(0.5);
    const short = applyAwayRest(hurt, 2 * HOUR)!;
    expect(short.kind).toBe('short');
    expect(short.recap[0]).toBe('While you were away (2 hours), you rested at Greyhollow Inn.');
    expect(short.recap[1]).toMatch(/^Rest: short rest, 1 hour — HP \d+ → \d+ \(\+1h, now /);
    expect(short.recap).toContain(`HP: ${short.state.character.hp}/${short.state.character.maxHp}`);
    expect(short.state.hitDiceSpent).toBe((hurt.hitDiceSpent ?? 0) + 1);
    const long = applyAwayRest(hurt, 10 * HOUR)!;
    expect(long.kind).toBe('long');
    expect(long.state.character.hp).toBe(hurt.character.maxHp);
    expect(long.recap).toContain('Well rested: Heroic Inspiration is yours');
    expect(long.state.character.heroicInspiration).toBe(true);
    // Capped: three days away is still one long rest, and the clock moves the rest's 8 hours, not 72.
    const days = applyAwayRest(hurt, 72 * HOUR)!;
    expect(days.state.worldHour).toBe(long.state.worldHour);
    expect(days.recap[0]).toMatch(/^While you were away \(3 days\)/);
    // Unsafe: on the graveyard road with the dead about, nothing happens.
    const road = pregen(13, 'Human Fighter (Soldier)');
    expect(awayRestBlock(road)).toBe('not somewhere safe');
    expect(applyAwayRest(road, 10 * HOUR)).toBeNull();
    // Gritty rests need a real week away for a long rest; a night is only a short one.
    const gritty = ruled(hurt, { ttRestVariant: 'gritty' });
    expect(applyAwayRest(gritty, 10 * HOUR)!.kind).toBe('short');
  });

  it('[tabletop ds151 T4 | tt-build-6b] session zero: lines and veils reach the writer as limits; tabletop only', () => {
    const s = pregen(4, 'Human Fighter (Soldier)');
    const sz = { lines: ['harm to children', 'Harm to children', ''], veils: ['torture'], sheetId: null };
    const text = formatSessionZeroForPrompt(sz);
    expect(text).toBe([
      'TABLE LIMITS (set by the player at session zero — always honor them):',
      'Lines (never include, not even off-screen or implied): harm to children.',
      'Veils (may happen, but off-screen: one plain sentence, no detail): torture.',
    ].join('\n'));
    expect(buildMasterPrompt({ ...s, sessionZero: sz }, settings())).toContain(text);
    expect(buildMasterPrompt(s, settings())).not.toContain('TABLE LIMITS');
    const lit = buildNewGameState({ bibleId: 'summoned-pact', characterName: 'Jax', seed: 150, personality: 'chilled-gm' }).state;
    expect(buildMasterPrompt({ ...lit, sessionZero: sz }, settings())).not.toContain('TABLE LIMITS');
    // The table rules picked at session zero are the same Settings the turn stamp reads.
    const lvl3 = built(4, ['Quick start'], { ttStartingLevel: 3, ttProgression: 'milestone' });
    expect(lvl3.character.level).toBe(3);
    expect(lvl3.houseRules!.progression).toBe('milestone');
  });

  it('[tabletop ds151 T4 | tt-build-6b] sheet library: a saved sheet, a session-zero pick and a pasted sheet all reach the confirm page through the same SRD build', () => {
    memoryStorage();
    const dwarf = built(4, ['Build my own', 'Fighter', 'Dwarf', 'Soldier']);
    const saved = sheetFromState(dwarf, 'Bram')!;
    expect(validateSheet(saved)).toMatchObject({ ok: true, corrections: [] });
    saveSheet(saved);
    const start = beginTabletopCreation(ruled(T.before(4)));
    expect(creationChips(start)).toContain('Saved: Bram — Dwarf Fighter');
    const fromChip = stepTabletopCreation(start, 'Saved: Bram — Dwarf Fighter');
    expect(fromChip.tabletopCreation!.stage).toBe('confirm');
    expect(fromChip.character.srd).toMatchObject({ classId: 'fighter', speciesId: 'dwarf', backgroundId: 'soldier', source: 'library' });
    // Same picks, same engine numbers as the inn-book build.
    expect(fromChip.character.maxHp).toBe(dwarf.character.maxHp);
    expect(fromChip.character.attributes).toEqual(dwarf.character.attributes);
    // Picked at session zero, the sheet opens straight on the confirm page.
    const picked = beginTabletopCreation(ruled({ ...T.before(4), sessionZero: { lines: [], veils: [], sheetId: saved.id } }));
    expect(picked.tabletopCreation!.stage).toBe('confirm');
    expect(picked.log[picked.log.length - 1]!.content).toContain('Bram — Dwarf Fighter, from your saved sheets.');
    // A default sheet does the same with no pick; Start over still reaches every option.
    setDefaultSheet(saved.id);
    const byDefault = beginTabletopCreation(ruled(T.before(4)));
    expect(byDefault.tabletopCreation!.stage).toBe('confirm');
    expect(stepTabletopCreation(byDefault, 'Start over').tabletopCreation!.stage).toBe('start');
    setDefaultSheet(null);
    // Bring your own: a pasted sheet is checked line by line; engine-owned numbers are dropped, not trusted.
    const paste = ['Name: Wren', 'Class: Rogue', 'Species: Halfling', 'Background: Criminal', 'STR 8 DEX 15 CON 14 INT 12 WIS 10 CHA 13'].join('\n');
    const pasted = stepTabletopCreation(beginTabletopCreation(ruled(T.before(4))), paste);
    expect(pasted.tabletopCreation!.stage).toBe('confirm');
    expect(pasted.character.srd).toMatchObject({ classId: 'rogue', speciesId: 'halfling', method: 'standard-array', kitId: 'A', source: 'library' });
    expect(pasted.log[pasted.log.length - 1]!.content).toContain('Your sheet checks out. Changes to fit the rules:');
    const json = importSheetText(JSON.stringify({ name: 'Ox', class: 'Fighter', species: 'Goliath', background: 'Soldier', method: 'point buy', scores: { STR: 15, DEX: 14, CON: 15, INT: 8, WIS: 10, CHA: 8 }, hp: 99, ac: 22 }));
    expect(json.ok).toBe(true);
    if (json.ok) expect(json.corrections).toContain('The engine works out hp, ac from the SRD rules; the sheet\'s own numbers are not used.');
    // Problems block the sheet and the inn book asks again.
    const bad = importSheetText('Class: Bard\nSpecies: Elf\nBackground: Sage\nMethod: point buy\nSTR 15 DEX 15 CON 15 INT 15 WIS 8 CHA 8');
    expect(bad.ok).toBe(false);
    if (!bad.ok) {
      expect(bad.problems[0]).toMatch(/^Class Bard is not one this game has/);
      expect(bad.problems).toContain('Those scores cost 36 points; point buy allows 27.');
    }
    const refused = stepTabletopCreation(beginTabletopCreation(ruled(T.before(4))), 'Class: Bard\nSpecies: Elf\nBackground: Sage\nSTR 15 DEX 14 CON 13 INT 12 WIS 10 CHA 8');
    expect(refused.tabletopCreation!.stage).toBe('start');
    expect(refused.log[refused.log.length - 1]!.content).toMatch(/^That sheet cannot be used yet: Class Bard/);
  });

  it('[tt-build-6b guard] LitRPG and story RPG keep plain gold, salvage prices, no away rest and no armor training', () => {
    for (const bibleId of ['summoned-pact', 'salt-road-heist']) {
      const st = buildNewGameState({ bibleId, characterName: 'Jax', seed: 150, personality: 'chilled-gm' }).state;
      const stamped = withHouseRules(st, settings());
      expect(stamped).toBe(st);
      expect(usesPurse(st)).toBe(false);
      expect(purseOf(st)).toBeNull();
      expect(settlePurse(st)).toBe(st);
      expect(wealthLine(st)).toBe(`${st.gold} GP`);
      expect(carriedCoinLb(st)).toBe(0);
      expect(applyAwayRest(st, 10 * HOUR)).toBeNull();
      expect(untrainedArmor(st.character, st.inventory)).toBeNull();
      const sellable = (st.inventory ?? []).find((i) => !i.equipped);
      if (sellable) {
        const sold = sellItem(st, sellable.id);
        expect(sold.soldFor).toBe(`${sold.goldGained} gold`);
        expect(sold.newState!.purse ?? null).toBeNull();
      }
      expect(formatPurse({ gp: 3 })).toBe('3 GP');
    }
  });
});
