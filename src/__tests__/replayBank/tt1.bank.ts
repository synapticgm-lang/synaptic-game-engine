/**
 * Tabletop build step 1 — character creation in the cursed-keep inn book (SRD 5.2.1, CC-BY-4.0).
 * Cases start from lap 3's recorded tabletop run (tt ds151) and from the exact New Game the fate-autoplay
 * runner builds. The engine owns every number: HP = hit die max + CON, AC from worn armour, proficiency +2,
 * 18 skills and six saves; checks and rests read the same sheet. The writer never sees the creation menu.
 * Recorded runs made before creation (no meta.tabletopCreation) replay exactly as before.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';
import { buildNewGameState, stampOpening } from '../../game/fateAutoplay';
import { runPlayerCheck } from '../../game/checkMath';
import { applyRestHeal } from '../../game/recoveryRules';
import { buildContextPrompt } from '../../game/systemPrompt';
import { resolveOfferedChoices } from '../../game/playTranscript';
import { abilityMod, deriveTabletopSheet, formatTabletopSheet, sheetSkillBonus } from '../../game/tabletop/characterBuild';
import { beginTabletopCreation, creationChips, stepTabletopCreation, tabletopCreationPending } from '../../game/tabletop/creationFlow';
import type { GameState } from '../../game/types';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const TT_DS151 = '2026-10-13T14-15-47-252Z_cursed-keep_chilled-gm_s151';

let T: Replay;
beforeAll(async () => {
  T = new Replay(await replayWhole(TT_DS151));
}, 900_000);

const walk = (s: GameState, picks: string[]) => picks.reduce(stepTabletopCreation, s);
const firstTurn = () => T.turns()[0]!;
const fateBuild = (bibleId: string, seed: number, tabletopCreation: boolean) =>
  buildNewGameState({ bibleId, characterName: 'Jax', seed, personality: 'chilled-gm', tabletopCreation }).state;

describe('replay bank tt-build-1 (tabletop character creation)', () => {
  it('[tabletop ds151 T1 | tt-build-1] the inn book opens on the real opening and offers quick start, 4 pregens and a build', () => {
    const open = T.before(firstTurn());
    expect(open.character.srd).toBeUndefined();
    const book = beginTabletopCreation(open);
    expect(tabletopCreationPending(book)).toBe(true);
    expect(creationChips(book)).toEqual([
      'Quick start',
      'Ready-made: Human Fighter (Soldier)',
      'Ready-made: Halfling Rogue (Criminal)',
      'Ready-made: Dwarf Cleric (Acolyte)',
      'Ready-made: Elf Wizard (Sage)',
      'Build my own',
    ]);
    expect(resolveOfferedChoices(book)).toEqual(creationChips(book));
    // Creation spends no turn.
    expect(book.turn).toBe(open.turn);
  });

  it('[tabletop ds151 T1 | tt-build-1] a built Dwarf Cleric by 4d6 gets engine HP, AC, saves and skills, shown before play', () => {
    const open = T.before(firstTurn());
    let s = walk(beginTabletopCreation(open), ['Build my own', 'Cleric', 'Dwarf', 'Acolyte', 'Roll 4d6, drop the lowest']);
    expect(s.tabletopCreation!.stage).toBe('scores');
    const rollRows = s.log[s.log.length - 1]!.content;
    expect(rollRows.match(/^Roll \d: 4d6 /gm)).toHaveLength(6);
    s = walk(s, ['Keep these scores', 'Chain Shirt, Shield and Mace']);
    expect(s.tabletopCreation!.stage).toBe('confirm');
    const c = s.character;
    const con = abilityMod(c.attributes.CON);
    // d8 max + CON + Dwarven Toughness 1.
    expect(c.maxHp).toBe(Math.max(1, 8 + con + 1));
    // Chain Shirt 13 + DEX (max 2) + Shield 2.
    expect(c.armorClass).toBe(13 + Math.min(abilityMod(c.attributes.DEX), 2) + 2);
    const d = deriveTabletopSheet(s)!;
    expect(d.pb).toBe(2);
    expect(d.skills).toHaveLength(18);
    expect(d.saves.filter((v) => v.proficient).map((v) => v.key)).toEqual(['WIS', 'CHA']);
    expect(c.srd!.skillProfs).toEqual(expect.arrayContaining(['Insight', 'Religion']));
    const summary = s.log[s.log.length - 1]!.content;
    expect(summary).toContain(`HP ${c.maxHp} `);
    expect(summary).toContain(`AC ${c.armorClass} (Chain Shirt + Shield)`);
    expect(summary).toMatch(/^Saves: STR [+−]\d, DEX [+−]\d, CON [+−]\d, INT [+−]\d, WIS [+−]\d\*, CHA [+−]\d\*$/m);
    expect(s.inventory.filter((i) => i.equipped).map((i) => i.name)).toEqual(expect.arrayContaining(['Chain Shirt', 'Shield', 'Mace']));
    s = stepTabletopCreation(s, 'Begin play');
    expect(tabletopCreationPending(s)).toBe(false);
    // The opening chips come back once the book closes.
    expect(resolveOfferedChoices(s)).toEqual(resolveOfferedChoices(open));
  });

  it('[tabletop ds151 T1 | tt-build-1] point buy holds to 27 points and the standard array to its six numbers', () => {
    const open = T.before(firstTurn());
    const pb = walk(beginTabletopCreation(open), ['Build my own', 'Wizard', 'Elf', 'Sage', 'Point buy (27 points)']);
    expect(walk(pb, ['STR 15 DEX 15 CON 15 INT 15 WIS 8 CHA 8']).tabletopCreation!.picks.baseScores).toEqual(pb.tabletopCreation!.picks.baseScores);
    const arr = walk(beginTabletopCreation(open), ['Build my own', 'Fighter', 'Human', 'Soldier', 'Standard array']);
    const bad = walk(arr, ['STR 18 DEX 14 CON 13 INT 12 WIS 10 CHA 8']);
    expect(bad.tabletopCreation!.picks.baseScores).toEqual(arr.tabletopCreation!.picks.baseScores);
    const good = walk(arr, ['STR 8 DEX 15 CON 14 INT 13 WIS 12 CHA 10']);
    expect(good.tabletopCreation!.picks.baseScores!.DEX).toBe(15);
  });

  it('[tabletop ds151 T18 | tt-build-1] a rest rolls the class Hit Die and a lock check reads sheet expertise', () => {
    const hurt = T.before(18);
    const wiz = walk(beginTabletopCreation(hurt), ['Ready-made: Elf Wizard (Sage)', 'Begin play']);
    const short = applyRestHeal({ ...wiz, character: { ...wiz.character, hp: 1 } }, 'Take a short rest');
    expect(short.dieLine).toMatch(/^Hit Die: d6 [1-6] [+−] \d+ = \d+$/);
    const rogue = walk(beginTabletopCreation(hurt), ['Ready-made: Halfling Rogue (Criminal)', 'Begin play']);
    const sheet = rogue.character.srd!;
    expect(sheet.skillProfs).toContain('Sleight of Hand');
    const bonus = sheetSkillBonus(rogue.character, 'Sleight of Hand');
    expect(bonus).toBe(sheet.expertise.includes('Sleight of Hand') ? 4 : 2);
    const intent = { kind: 'search' as const, label: 'search', targets: ['lock'] };
    const withSheet = runPlayerCheck(rogue, intent, 'Pick the lock', 10);
    const noProf = { ...rogue, character: { ...rogue.character, srd: { ...sheet, skillProfs: [], expertise: [] } } };
    expect(withSheet.modifier - runPlayerCheck(noProf, intent, 'Pick the lock', 10).modifier).toBe(bonus);
  });

  it('[tabletop ds151 T1 | tt-build-1] the writer packet never carries the creation menu or the sheet lines', () => {
    const open = T.before(firstTurn());
    const s = walk(beginTabletopCreation(open), ['Build my own', 'Rogue', 'Halfling', 'Criminal', 'Standard array', 'Keep these scores', '100 GP', 'Begin play']);
    const prompt = buildContextPrompt(s, T.input(firstTurn()));
    expect(prompt).not.toMatch(/inn book|Point buy|Standard array|Ready-made|Passive Perception|Keep these scores/i);
  });

  it('[fate cursed-keep s150/s151 | tt-build-1] the runner picks creation by seed, stably, and the opening STATUS shows the sheet', () => {
    for (const seed of [150, 151]) {
      const a = fateBuild('cursed-keep', seed, true);
      const b = fateBuild('cursed-keep', seed, true);
      expect(a.character.srd).toEqual(b.character.srd);
      expect(tabletopCreationPending(a)).toBe(false);
      const opening = stampOpening(a);
      expect(opening.log[0]!.systemLog).toEqual(formatTabletopSheet(a));
      expect(opening.log[0]!.systemLog!.join('\n')).toMatch(/^HP \d+ \(d(6|8|10) /m);
    }
  });

  it('[tt-build-1 guard] runs recorded before creation replay with no sheet; LitRPG and story RPG never open the book', () => {
    for (const n of T.turns()) expect(T.after(n).character.srd, `T${n}`).toBeUndefined();
    expect(T.before(firstTurn()).log[0]!.systemLog).toEqual([]);
    for (const bibleId of ['summoned-pact', 'salt-road-heist']) {
      const on = fateBuild(bibleId, 150, true);
      const off = fateBuild(bibleId, 150, false);
      expect(on.character.srd).toBeUndefined();
      expect(on.tabletopCreation).toBeUndefined();
      expect(on.character.maxHp).toBe(off.character.maxHp);
      expect(on.inventory.map((i) => i.name)).toEqual(off.inventory.map((i) => i.name));
      expect(beginTabletopCreation(on)).toBe(on);
    }
  });
});
