/**
 * tt-build-9 — the character builder page and the dice the player sees, from the real cursed-keep ds151 tape.
 * T4 is Keep Gate at night, T9 Greyhollow Inn. The builder hands its sheet to the same confirm page as the inn-book
 * chips (creationFlow.takeBuiltSheet); its preview (sheetPreview) prints the numbers the in-game sheet prints.
 * Every d20 the tabletop STATUS shows gets the player's die (rollView); the number is the engine's.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';
import { buildNewGameState } from '../../game/fateAutoplay';
import {
  beginTabletopCreation, creationChips, stepTabletopCreation, tabletopCreationPending, takeBuiltSheet,
} from '../../game/tabletop/creationFlow';
import { creationRng, deriveTabletopSheet, scoresForMethod, type DerivedSheet } from '../../game/tabletop/characterBuild';
import { sheetFromState } from '../../game/tabletop/sheetLibrary';
import { pregenSheets, previewSavedSheet, previewSheet } from '../../game/tabletop/sheetPreview';
import { withHouseRules } from '../../game/rules/houseRules';
import { runPlayerCheck } from '../../game/checkMath';
import { parsePlayerIntent } from '../../game/intentParser';
import { filterSystemLogForEngine } from '../../game/systemLog';
import { shownD20, splitRollLine } from '../../game/rules/rollView';
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
function finish(s: GameState): GameState {
  for (let i = 0; i < 12 && tabletopCreationPending(s); i++) s = stepTabletopCreation(s, creationChips(s)[0]);
  return s;
}
/** The numbers a sheet prints: every box on the builder page and the in-game Tabletop Sheet. */
const printed = (d: DerivedSheet) => ({
  title: d.title, scores: d.scores, ac: d.ac, maxHp: d.maxHp, pb: d.pb, initiative: d.initiative, speed: d.speed,
  passivePerception: d.passivePerception, hitDie: d.hitDie, saves: d.saves, skills: d.skills,
  spellDc: d.spellcasting?.dc ?? null, spellAttack: d.spellcasting?.attack ?? null,
});

describe('replay bank tt-build-9 (builder page + dice on every shown roll)', () => {
  it('[tabletop ds151 T4 | tt-build-9] a builder sheet reaches the inn-book confirm page with the chip build\'s numbers', () => {
    const chips = finish(walk(beginTabletopCreation(ruled(T.before(4))), ['Build my own', 'Wizard', 'Elf', 'Sage', 'Standard array']));
    const sheet = sheetFromState(chips, 'Ilse')!;
    const open = beginTabletopCreation(ruled(T.before(4)));
    const built = takeBuiltSheet(open, sheet);
    expect(built.tabletopCreation!.stage).toBe('confirm');
    expect(built.character.name).toBe('Ilse');
    expect(built.character.srd).toMatchObject({ classId: 'wizard', speciesId: 'elf', backgroundId: 'sage', source: 'build' });
    expect(built.log[built.log.length - 1]!.content).toContain('Built on the character page.');
    const played = stepTabletopCreation(built, 'Begin play');
    expect(tabletopCreationPending(played)).toBe(false);
    expect(printed(deriveTabletopSheet(played)!)).toEqual(printed(deriveTabletopSheet(chips)!));
  });

  it('[tabletop ds151 T4 | tt-build-9] the builder preview prints what the in-game sheet prints (ready-made and built)', () => {
    for (const pre of pregenSheets()) {
      const viaChip = walk(beginTabletopCreation(ruled(T.before(4))), [`Ready-made: ${pre.name}`, 'Begin play']);
      expect(printed(previewSavedSheet(pre).sheet), pre.name).toEqual(printed(deriveTabletopSheet(viaChip)!));
    }
    const rogue = finish(walk(beginTabletopCreation(ruled(T.before(4))), ['Build my own', 'Rogue', 'Halfling', 'Criminal', 'Point buy (27 points)']));
    const sheet = sheetFromState(rogue, 'Wren')!;
    const preview = previewSheet(sheet);
    expect(preview.ok).toBe(true);
    if (preview.ok) expect(printed(preview.preview.sheet)).toEqual(printed(deriveTabletopSheet(rogue)!));
  });

  it('[tabletop ds151 T9 | tt-build-9] a sheet the rules refuse stays on the inn book; outside creation the builder does nothing', () => {
    const open = beginTabletopCreation(ruled(T.before(9)));
    const bad = takeBuiltSheet(open, { name: 'Ox', picks: { classId: 'artificer', speciesId: 'elf', backgroundId: 'sage', method: 'standard-array', baseScores: { STR: 15, DEX: 14, CON: 13, INT: 12, WIS: 10, CHA: 8 }, kitId: 'A' } });
    expect(bad.tabletopCreation!.stage).toBe('start');
    expect(bad.character.srd).toEqual(open.character.srd);
    expect(bad.log[bad.log.length - 1]!.content).toMatch(/^That sheet cannot be used yet:/);
    const inPlay = T.after(9);
    expect(takeBuiltSheet(inPlay, pregenSheets()[0])).toBe(inPlay);
  });

  it('[tabletop ds151 T4 | tt-build-9] in play the builder rolls 4d6 with the save\'s own creation dice, the inn book\'s roll', () => {
    const table = ruled(T.before(4), { ttStatMethod: '4d6' });
    const viaChip = walk(beginTabletopCreation(table), ['Build my own', 'Fighter', 'Human', 'Soldier']);
    const builderRoll = scoresForMethod('4d6', 'fighter', creationRng(table));
    expect(viaChip.tabletopCreation!.picks.rolls).toEqual(builderRoll.rolls);
    expect(viaChip.tabletopCreation!.picks.baseScores).toEqual(builderRoll.baseScores);
  });

  it('[tabletop ds151 T9 | tt-build-9] every d20 the tabletop STATUS shows gets a die, and the die is the engine\'s number', () => {
    const shown = T.turns().flatMap((n) => filterSystemLogForEngine(T.receipts(n), 'dnd'));
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const hero = walk(beginTabletopCreation(ruled(T.before(9))), ['Ready-made: Halfling Rogue (Criminal)', 'Begin play']);
    const check = runPlayerCheck(hero, parsePlayerIntent('Search the area', hero), 'Search the area');
    vi.restoreAllMocks();
    const lines = [...shown, check.displayLine ?? ''].filter((l) => /\bd20\b/i.test(l));
    expect(lines.length, 'the tape and a check show d20 rolls').toBeGreaterThan(0);
    for (const line of lines) {
      const parts = splitRollLine(line);
      expect(parts.map((p) => p.text).join(''), line).toBe(line);
      expect(parts.filter((p) => p.roll).length, line).toBe((line.match(/\bd20\b/gi) ?? []).length);
    }
    // Math.random 0.5 → d20 11: the die shows 11.
    expect(shownD20(check.displayLine ?? '')!.kept).toBe(11);
  });

  it('[tt-build-9 guard] LitRPG and story RPG show no d20 on STATUS, so no die and no builder', () => {
    for (const bibleId of ['summoned-pact', 'salt-road-heist']) {
      const st = buildNewGameState({ bibleId, characterName: 'Jax', seed: 150, personality: 'chilled-gm' }).state;
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const check = runPlayerCheck(st, parsePlayerIntent('Search the area', st), 'Search the area');
      vi.restoreAllMocks();
      for (const line of filterSystemLogForEngine([check.displayLine ?? ''], st.engineMode)) {
        expect(splitRollLine(line).some((p) => p.roll), `${bibleId}: ${line}`).toBe(false);
      }
      expect(tabletopCreationPending(st)).toBe(false);
      expect(takeBuiltSheet(st, pregenSheets()[0])).toBe(st);
    }
  });
});
