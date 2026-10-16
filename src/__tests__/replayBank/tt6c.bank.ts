/**
 * tt-build-6c — the logged-dice oracle, crafting (SRD 5.2.1's downtime), attunement, Weapon Mastery, the class
 * features of all twelve SRD classes in the round engine, and SRD magic items in loot, from the real cursed-keep
 * ds151 tape.
 *
 * T9 is Greyhollow Inn (a safe hub), T13 three zombies on the graveyard road. Each case builds a sheet through the
 * step 1 inn book and stamps the table rules from Settings the way a turn does. Dice are pinned with a fixed
 * Math.random: 0.5 rolls d20 11 / d100 51; 0.3 rolls d20 7, so the zombies (+3) miss every armored sheet.
 * SRD 5.2.1 by Wizards of the Coast LLC, CC-BY-4.0.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';
import { buildNewGameState } from '../../game/fateAutoplay';
import { runArcDirectorBeforeGm, formatArcStatusReceipts } from '../../game/arcDirector';
import { commitOfferedPad } from '../../game/playTranscript';
import { beginTabletopCreation, creationChips, stepTabletopCreation, tabletopCreationPending } from '../../game/tabletop/creationFlow';
import { withHouseRules } from '../../game/rules/houseRules';
import { createDefaultSettings } from '../../game/defaults';
import { roundCombatChips } from '../../game/tabletop/combatChips';
import { resolveDowntimeTurn } from '../../game/tabletop/downtimeTurn';
import { craftRecipe } from '../../game/rules/downtime';
import { craftCost } from '../../game/rules/srdGear';
import { rollOracle } from '../../game/rules/oracle';
import { rollLoot } from '../../game/lootTableRegistry';
import { MAGIC_ITEMS, attunedItems, magicItem } from '../../game/rules/magicItems';
import { CLASSES, toolProficiencies } from '../../game/tabletop/characterBuild';
import { purseOf } from '../../game/rules/coins';
import type { GameState, Settings } from '../../game/types';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const TT_DS151 = '2026-10-13T14-15-47-252Z_cursed-keep_chilled-gm_s151';

let T: Replay;
beforeAll(async () => {
  T = new Replay(await replayWhole(TT_DS151));
}, 900_000);

afterEach(() => {
  vi.restoreAllMocks();
});

const settings = (over: Partial<Settings> = {}): Settings => ({ ...createDefaultSettings(), ...over });
const ruled = (s: GameState, over: Partial<Settings> = {}) => withHouseRules(s, settings(over));
function built(n: number, picks: string[], over: Partial<Settings> = {}): GameState {
  let s = picks.reduce(stepTabletopCreation, beginTabletopCreation(ruled(T.before(n), over)));
  for (let i = 0; i < 12 && tabletopCreationPending(s); i++) s = stepTabletopCreation(s, creationChips(s)[0]);
  return ruled(s, over);
}
const dice = (v: number) => vi.spyOn(Math, 'random').mockReturnValue(v);
function turn(s: GameState, input: string) {
  const arc = runArcDirectorBeforeGm(s, input);
  return { state: commitOfferedPad(arc.state), status: formatArcStatusReceipts(arc), mandate: arc.mandate };
}
const round = (status: string[], n: number) => status.find((l) => l.startsWith(`Round ${n} — `)) ?? '';
const engineFact = (mandate: string) => /ENGINE RESULT \(required fact — state it plainly\): ([^\n]*)/.exec(mandate)?.[1] ?? '';
const named = (s: GameState, name: string) => (s.inventory ?? []).filter((i) => i.name === name);
/** The T13 fight opened with the tape's own line, round 1 played (every zombie misses at 0.3). */
function opened(cls: string, over: Partial<Settings> = {}) {
  dice(0.3);
  return turn(built(13, ['Build my own', cls, 'Human', 'Soldier'], over), T.input(13));
}

describe('replay bank tt-build-6c (oracle, crafting, attunement, mastery, class features, magic loot)', () => {
  it('[tabletop ds151 T9 | tt-build-6c] oracle: a typed question rolls d100 against named odds, is logged, and is not talk', () => {
    const s = built(9, ['Build my own', 'Cleric', 'Human', 'Acolyte']);
    expect(s.currentLocation).toBe('Greyhollow Inn');
    dice(0.5);
    const q = 'is the innkeeper hiding something? Likely';
    const r = turn(s, `Ask the oracle: ${q}`);
    expect(r.status).toEqual([`Oracle: ${q} (Likely, 75%) — d100 51: Yes`]);
    expect(engineFact(r.mandate)).toBe(`The oracle answers "${q}": yes.`);
    expect(r.state.oracleLog).toEqual([{ turn: s.turn, question: q, odds: 'Likely', chance: 75, roll: 51, answer: 'Yes' }]);
    // The same roll on a small chance is a plain No; the extremes of each band add "and".
    const rng = (v: number) => () => v;
    expect(rollOracle('x', 'Small chance', rng(0.5), 1).answer).toBe('No');
    expect(rollOracle('x', 'Even odds', rng(0), 1)).toMatchObject({ roll: 1, answer: 'Yes, and' });
    expect(rollOracle('x', 'Even odds', rng(0.99), 1)).toMatchObject({ roll: 100, answer: 'No, and' });
    // A second question appends; the log is the one record the sheet and STATUS read.
    const again = turn(r.state, 'Oracle: does the road flood tonight? small chance');
    expect(again.state.oracleLog!.map((e) => e.answer)).toEqual(['Yes', 'No']);
    expect(again.status[0]).toBe('Oracle: does the road flood tonight? small chance (Small chance, 10%) — d100 51: No');
  });

  it('[tabletop ds151 T9 | tt-build-6c] crafting: tool proficiency, coin from the purse and days on the clock; refusals spend nothing', () => {
    dice(0.5);
    const cleric = built(9, ['Build my own', 'Cleric', 'Human', 'Acolyte']);
    expect(toolProficiencies(cleric.character)).toContain("Calligrapher's Supplies");
    const gp = cleric.gold;
    // Scribe a cantrip scroll: Calligrapher's Supplies, the spell prepared, 15 GP, 1 day.
    const scroll = turn(cleric, 'Scribe a spell scroll of Sacred Flame');
    expect(scroll.status).toEqual(["Crafting: Spell Scroll (Sacred Flame) — 1 day of work, 15 GP in materials (Calligrapher's Supplies); +24h, now dawn"]);
    expect(scroll.state.gold).toBe(gp - 15);
    expect(purseOf(scroll.state)!.gp).toBe(gp - 15);
    expect(named(scroll.state, 'Spell Scroll (Sacred Flame)')).toHaveLength(1);
    expect(engineFact(scroll.mandate)).toBe("You spend 1 day working with your Calligrapher's Supplies and finish a Spell Scroll (Sacred Flame). It is in your pack now.");
    // A level 1 scroll costs 25 GP; short of coin, nothing moves.
    const poor = turn(cleric, 'Scribe a Spell Scroll (Cure Wounds)');
    expect(poor.status).toEqual([`Crafting: Spell Scroll (Cure Wounds) — not done (the materials cost 25 GP and you cannot pay it); nothing spent`]);
    expect(poor.state.gold).toBe(gp);
    expect(poor.state.worldHour).toBe(cleric.worldHour);
    // A spell the caster does not have prepared cannot be scribed.
    expect(turn({ ...cleric, gold: 100, purse: undefined }, 'Scribe a spell scroll of Magic Missile').status[0]).toBe('Crafting: Spell Scroll (Magic Missile) — not done (you do not have Magic Missile prepared); nothing spent');
    // A longsword is Smith's Tools work; the Cleric has none.
    expect(turn(cleric, 'Craft a longsword').status[0]).toBe("Crafting: Longsword — not done (you need Smith's Tools (proficient and carried)); nothing spent");
    // A Druid's Herbalism Kit brews a Potion of Healing for 25 GP in a day; it heals as the SRD potion does.
    const druid = built(9, ['Build my own', 'Druid', 'Elf', 'Sage']);
    const brew = turn({ ...druid, gold: 100, purse: undefined }, 'Brew a potion of healing');
    expect(brew.status[0]).toBe('Crafting: Potion of Healing — 1 day of work, 25 GP in materials (Herbalism Kit); +24h, now dawn');
    expect(brew.state.gold).toBe(75);
    expect(named(brew.state, 'Potion of Healing')[0]).toMatchObject({ provenance: 'Crafted', description: MAGIC_ITEMS['Potion of Healing'].text });
    // A Monk's Woodcarver's Tools fletch arrows: nonmagical gear at half its cost, a day per 10 GP.
    const monk = built(9, ['Build my own', 'Monk', 'Human', 'Sage']);
    const arrows = craftRecipe('arrows')!;
    expect(arrows).toMatchObject({ item: 'Arrows', tools: ["Woodcarver's Tools"], quantity: 20, ...{ costCp: craftCost(100).materialsCp, days: craftCost(100).days } });
    const made = turn(monk, 'Fletch some arrows');
    expect(made.status[0]).toMatch(/^Crafting: 20 Arrows — 1 day of work, 5 SP in materials \(Woodcarver's Tools\); \+24h/);
    // Not a craft: an ordinary line is left to the story.
    expect(resolveDowntimeTurn(cleric, 'Make camp by the fire')).toBeNull();
  });

  it('[tabletop ds151 T9 + T13 | tt-build-6c] attunement: an hour with the item, three at most, AC from the one table; never mid-fight', () => {
    dice(0.5);
    const fighter = built(9, ['Build my own', 'Fighter', 'Human', 'Soldier']);
    const cloak = magicItem('Cloak of Protection', 'mi-cloak', 'Engine loot');
    const s = { ...fighter, inventory: [...fighter.inventory, cloak] };
    const ac = s.character.armorClass!;
    const at = turn(s, 'Attune to the Cloak of Protection');
    expect(at.status).toEqual([`Attunement: Cloak of Protection — attuned (1 of 3); AC ${ac} → ${ac + 1}; +1h, now morning`]);
    expect(attunedItems(at.state.inventory).map((i) => i.name)).toEqual(['Cloak of Protection']);
    expect(turn(at.state, 'Attune to the Cloak of Protection').status[0]).toBe('Attunement: Cloak of Protection — not done (you are already attuned to Cloak of Protection); nothing spent');
    // Bracers of Defense need no armor: attuned, they add nothing while the Fighter wears Chain Mail.
    const bracers = turn({ ...at.state, inventory: [...at.state.inventory, magicItem('Bracers of Defense', 'mi-br', 'Engine loot')] }, 'Attune to my Bracers of Defense');
    expect(bracers.status[0]).toBe('Attunement: Bracers of Defense — attuned (2 of 3); +1h, now morning');
    expect(bracers.state.character.armorClass).toBe(at.state.character.armorClass);
    const ring = turn({ ...bracers.state, inventory: [...bracers.state.inventory, magicItem('Ring of Protection', 'mi-ring', 'Engine loot')] }, 'Attune to the Ring of Protection');
    // Duplicate name still refused; a true 4th (Brooch) hits the SRD three-item limit (E-CR2).
    const fourthDup = turn({ ...ring.state, inventory: [...ring.state.inventory, { ...cloak, id: 'mi-cloak-2' }] }, 'Attune to the Cloak of Protection');
    expect(fourthDup.status[0]).toBe('Attunement: Cloak of Protection — not done (you are already attuned to Cloak of Protection); nothing spent');
    const fourth = turn({ ...ring.state, inventory: [...ring.state.inventory, magicItem('Brooch of Shielding', 'mi-brooch', 'Engine loot')] }, 'Attune to the Brooch of Shielding');
    expect(fourth.status[0]).toBe('Attunement: Brooch of Shielding — not done (you are already attuned to 3 items); nothing spent');
    // Voluntary end costs a Short Rest (SRD Attunement; E-CR2).
    const end = turn(at.state, 'End my attunement to the Cloak of Protection');
    expect(end.status).toEqual([`Attunement: Cloak of Protection — ended; AC ${ac + 1} → ${ac}; +1h, now morning`]);
    // A potion needs no attunement.
    expect(turn({ ...s, inventory: [...s.inventory, magicItem('Potion of Healing', 'mi-p', 'x')] }, 'Attune to the Potion of Healing').status[0])
      .toBe('Attunement: Potion of Healing — not done (Potion of Healing does not need attunement); nothing spent');
    // In the T13 fight nothing attunes: the line goes to the round engine.
    const fight = opened('Fighter');
    const tried = turn({ ...fight.state, inventory: [...fight.state.inventory, cloak] }, 'Attune to the Cloak of Protection');
    expect(tried.status.some((l) => l.startsWith('Attunement:'))).toBe(false);
    expect(attunedItems(tried.state.inventory)).toHaveLength(0);
  });

  it('[tabletop ds151 T13 | tt-build-6c] Weapon Mastery: Cleave carries a Greataxe into a second zombie, Sap gives Disadvantage; SRD 5.1 has none', () => {
    const barb = opened('Barbarian');
    expect(round(barb.status, 1)).toBe('Round 1 — you Greataxe d20 7 + 5 = 12 vs AC 8: hit, 1d12 (4) + 3 = 7 slashing = 7; Zombie 1 HP 15 → 8; you Greataxe d20 7 + 5 = 12 vs AC 8 (Cleave): hit, 1d12 (4) = 4 slashing = 4; Zombie 2 HP 15 → 11; Zombie 1 Slam d20 7 + 3 = 10 vs AC 14: miss; Zombie 2 Slam d20 7 + 3 = 10 vs AC 14: miss; Zombie 3 Slam d20 7 + 3 = 10 vs AC 14: miss');
    vi.restoreAllMocks();
    const pal = opened('Paladin');
    expect(round(pal.status, 1)).toMatch(/Zombie HP 15 → 9; Zombie gains Sap \(Longsword mastery\); Zombie Slam d20 \(dis: 7, 7\) /);
    vi.restoreAllMocks();
    const old = opened('Barbarian', { ttRulesVersion: 'srd-5.1' });
    expect(round(old.status, 1)).not.toMatch(/Cleave/);
    expect(round(old.status, 1)).toMatch(/^Round 1 — you Greataxe d20 7 \+ 5 = 12 vs AC 8: hit, 1d12 \(4\) \+ 3 = 7 slashing = 7; Zombie HP 15 → 8; Zombie Slam/);
  });

  it('[tabletop ds151 T13 | tt-build-6c] class features: Rage, Hunter\'s Mark, Hex, Innate Sorcery and Martial Arts run in the round engine with use counts', () => {
    const barb = opened('Barbarian');
    expect(roundCombatChips(barb.state)).toContain('Rage and attack with the Greataxe');
    const rage = turn(barb.state, 'Rage and attack the nearest zombie');
    expect(round(rage.status, 2)).toMatch(/^Round 2 — Rage: \+2 damage on Strength attacks, Resistance to bludgeoning, piercing and slashing, Advantage on Strength saves; you Greataxe d20 7 \+ 5 = 12 vs AC 8: hit, 1d12 \(4\) \+ 3 = 7 \+ Rage 2 slashing = 9;/);
    expect(rage.status).toContain('Class feature: Rage — 1 of 2 uses left');
    expect(rage.state.character.featureUses).toEqual({ rage: 1 });
    expect(roundCombatChips(rage.state)).not.toContain('Rage and attack with the Greataxe');
    vi.restoreAllMocks();
    const ranger = opened('Ranger');
    const mark = turn(ranger.state, "Cast Hunter's Mark on the zombie and attack");
    expect(round(mark.status, 2)).toMatch(/^Round 2 — you cast Hunter's Mark \(no slot, concentration\); Zombie gains Hunter's Mark; you Scimitar .* \+ Hunter's Mark 1d6 \(2\) = 2 slashing = 7;/);
    expect(mark.status).toContain("Class feature: Favored Enemy (Hunter's Mark) — 1 of 2 uses left");
    expect(mark.state.character.casting?.slotsUsed ?? []).toEqual([]);
    vi.restoreAllMocks();
    const lock = opened('Warlock');
    const hex = turn(lock.state, 'Cast Hex on the zombie');
    expect(round(hex.status, 2)).toMatch(/^Round 2 — you cast Hex \(level 1 slot, concentration\); Zombie gains Hex; you Eldritch Blast d20 7 \+ 4 = 11 vs AC 8: hit, 1d10 \(4\) = 4 \+ Hex 1d6 \(2\) = 2 force = 6;/);
    expect(hex.status).toContain('Spell slots: level 1 0/1 left');
    vi.restoreAllMocks();
    const sorc = opened('Sorcerer');
    const innate = turn(sorc.state, 'Use Innate Sorcery and cast Fire Bolt');
    expect(round(innate.status, 2)).toMatch(/^Round 2 — Innate Sorcery: spell save DC \+1 and Advantage on spell attack rolls for the fight; you Fire Bolt d20 \(adv: 7, 7\)/);
    expect(innate.status).toContain('Class feature: Innate Sorcery — 1 of 2 uses left');
    vi.restoreAllMocks();
    const monk = opened('Monk');
    expect(round(monk.status, 1)).toMatch(/you Spear d20 7 \+ 5 = 12 vs AC 8: hit, .*; you Unarmed Strike d20 7 \+ 5 = 12 vs AC 8: hit, 1d6 \(2\) \+ 3 = 5 bludgeoning = 5;/);
  });

  it('[tabletop ds151 T13 | tt-build-6c] level 2: Reckless Attack gives Advantage and the zombies Advantage back; Divine Smite spends its free use only on a hit', () => {
    const barb = opened('Barbarian', { ttStartingLevel: 2 });
    const reckless = turn(barb.state, 'Reckless attack with the Greataxe');
    expect(round(reckless.status, 2)).toMatch(/you Greataxe d20 \(adv: 7, 7\) 7 \+ 5 = 12 vs AC 8/);
    expect(round(reckless.status, 2)).toMatch(/Zombie Slam d20 \(adv: 7, 7\)/);
    vi.restoreAllMocks();
    const pal = opened('Paladin', { ttStartingLevel: 2 });
    const smite = turn(pal.state, 'Smite the zombie with Divine Smite');
    expect(round(smite.status, 2)).toMatch(/you Longsword d20 7 \+ 5 = 12 vs AC 8: hit, 1d8 \(3\) \+ 3 = 6 \+ Divine Smite 2d8 \(3, 3\) = 6 \+ Divine Smite \(Undead\) 1d8 \(3\) = 3 slashing = 15; Zombie HP 9 → 0;.*; you cast Divine Smite \(no slot\);/);
    expect(smite.status).toContain("Class feature: Paladin's Smite (Divine Smite) — 0 of 1 use left");
    expect(smite.state.character.casting?.slotsUsed ?? []).toEqual([]);
  });

  it('[tabletop ds151 T9 | tt-build-6c] Lay On Hands outside a fight heals from the pool; a short rest gives a Rage and a pact slot back', () => {
    dice(0.5);
    const pal = built(9, ['Build my own', 'Paladin', 'Human', 'Soldier']);
    const hurt = { ...pal, character: { ...pal.character, hp: pal.character.maxHp - 4 } };
    const loh = turn(hurt, 'Lay on hands');
    expect(loh.status).toEqual([`Class feature: Lay On Hands — 4 HP; HP ${hurt.character.hp} → ${pal.character.maxHp}`, 'Class feature: Lay On Hands — 1 of 5 HP left in the pool']);
    expect(loh.state.character.hp).toBe(pal.character.maxHp);
    expect(turn(loh.state, 'Lay on hands').status[0]).toBe('Class feature: Lay On Hands — not done (you are already at full Hit Points); nothing spent');
    const barb = built(9, ['Build my own', 'Barbarian', 'Human', 'Sage']);
    const short = turn({ ...barb, character: { ...barb.character, featureUses: { rage: 2 } } }, 'Take a short rest');
    expect(short.status).toContain('Class feature: 1 Rage back');
    expect(short.state.character.featureUses).toEqual({ rage: 1 });
    const lock = built(9, ['Build my own', 'Warlock', 'Human', 'Sage']);
    const pact = turn({ ...lock, character: { ...lock.character, casting: { ...(lock.character.casting ?? { slotsUsed: [] }), slotsUsed: [1] } } }, 'Take a short rest');
    expect(pact.status).toContain('Spell slots: level 1 1/1 left');
  });

  it('[tabletop ds151 T9 | tt-build-6c] all twelve SRD classes build, and magic items drop from the SRD table', () => {
    expect(CLASSES.map((c) => c.name).sort()).toEqual(['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard']);
    for (const c of CLASSES) {
      const s = built(9, ['Build my own', c.name, 'Human', 'Sage']);
      expect(s.character.srd?.classId).toBe(c.id);
      expect(s.character.maxHp).toBeGreaterThan(0);
    }
    const atClass = stepTabletopCreation(beginTabletopCreation(ruled(T.before(9))), 'Build my own');
    const asked = stepTabletopCreation(atClass, 'Artificer');
    expect(asked.log[asked.log.length - 1]!.content).toContain(`Choose one of: ${CLASSES.map((c) => c.name).join(', ')}.`);
    const fighter = built(9, ['Build my own', 'Fighter', 'Human', 'Soldier']);
    const loot = rollLoot({ profile: 'rareSpawn', state: fighter, seed: 'b' });
    expect(loot.items.map((i) => i.name)).toEqual(['Bracers of Defense']);
    expect(loot.displayLines[1]).toBe('d20 = 19 → Rare: Bracers of Defense');
    expect(loot.items[0]).toMatchObject({ rarity: 'Rare', description: MAGIC_ITEMS['Bracers of Defense'].text });
  });

  it('[tt-build-6c guard] LitRPG and story RPG get no oracle, crafting, attunement or SRD magic loot', () => {
    for (const bibleId of ['summoned-pact', 'salt-road-heist']) {
      const st = buildNewGameState({ bibleId, characterName: 'Jax', seed: 150, personality: 'chilled-gm' }).state;
      for (const line of ['Ask the oracle: is it safe?', 'Brew a potion of healing', 'Attune to the Cloak of Protection', 'Lay on hands']) {
        expect(resolveDowntimeTurn(st, line)).toBeNull();
      }
      const loot = rollLoot({ profile: 'rareSpawn', state: st, seed: 'b' });
      expect(loot.items.some((i) => MAGIC_ITEMS[i.name])).toBe(false);
      const arc = runArcDirectorBeforeGm(st, 'Ask the oracle: is it safe?');
      expect(arc.state.oracleLog ?? []).toEqual([]);
    }
  });
});
