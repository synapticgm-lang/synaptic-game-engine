/**
 * Mode lap 2 — tabletop and Story RPG roots from mode-result-1.
 * Fix 1 (tabletop): the engine's flee/parley check and every attack roll (die, modifier, AC, result) and the
 * HP change reach STATUS; a won fight gives no HP back (damage stays until a rest); a fight forced by a failed
 * flee/parley is told with that attempt (fl151 T20 "Talk your way past the thugs" had no talk at all).
 * Fix 2 (tabletop): arriving somewhere pays no XP; encounter XP is the CR XP of each foe beaten; no CR on the
 * card means the XP rules' default CR for treasure too (fl151 T9's first chest paid 2,240 gp at level 1).
 * Fix 3 (Story RPG): arrivals pay no XP, a level-up reads as growth not a skill rank, and STATUS loot carries
 * no LitRPG rarity tag. LitRPG behaviour is unchanged (guards at the end).
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';
import { filterSystemLogForEngine } from '../../game/systemLog';
import { milestoneXp } from '../../game/xpRules';
import { recoveryRow } from '../../game/recoveryRules';
import { formatArcStatusReceipts } from '../../game/arcDirector';
import { grantLevelSkills } from '../../game/skillGates';
import type { GameState } from '../../game/types';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const TT_FL151 = '2026-10-13T12-08-03-523Z_cursed-keep_chilled-gm_s151';
const TT_DS151 = '2026-10-13T12-08-03-436Z_cursed-keep_chilled-gm_s151';
const TT_DS150 = '2026-10-13T12-08-03-286Z_cursed-keep_chilled-gm_s150';
const RPG_DS150 = '2026-10-13T12-08-03-265Z_salt-road-heist_chilled-gm_s150';
const RPG_FL151 = '2026-10-13T12-08-03-259Z_salt-road-heist_chilled-gm_s151';

let F: Replay;
let D: Replay;
let S: Replay;
let R: Replay;
let RF: Replay;
beforeAll(async () => {
  F = new Replay(await replayWhole(TT_FL151));
  D = new Replay(await replayWhole(TT_DS151));
  S = new Replay(await replayWhole(TT_DS150));
  R = new Replay(await replayWhole(RPG_DS150));
  RF = new Replay(await replayWhole(RPG_FL151));
}, 900_000);

const status = (r: Replay, n: number) => (r.at(n).telemetry.systemLog ?? []).join('\n');
const allStatus = (r: Replay) => r.turns().map((n) => status(r, n)).join('\n');
const lastTurn = (r: Replay) => r.turns()[r.turns().length - 1]!;

describe('replay bank mode2 (mode lap 2)', () => {
  it('[tabletop fl151 T8 | mode2 fix 1] the flee roll, each attack roll and the HP change are on STATUS', () => {
    expect(F.input(8)).toBe('Try to flee');
    const s = status(F, 8);
    expect(s).toMatch(/^Flee check: d20 \d+ [+−] \d+ vs DC 12 — failure$/m);
    expect(s).toMatch(/^Round 1 — you d20 \d+ [+−] \d+ = \d+ vs AC \d+: (?:hit|miss|critical)/m);
    expect(s).toMatch(/^HP: \d+ → \d+ \(dealt \d+, took \d+\)$/m);
  });

  it('[tabletop fl151 T20 | mode2 fix 1] a fight forced by a failed parley is told with the talk that failed', () => {
    expect(F.input(20)).toBe('Talk your way past the thugs');
    expect(status(F, 20)).toMatch(/^Parley check: d20 \d+ [+−] \d+ vs DC 13 — failure$/m);
    expect(F.prose(20)).toMatch(/talk the thugs down/);
    expect(F.prose(20)).toMatch(/went down|fight was over/);
  });

  it('[tabletop fl151 T20 | mode2 fix 1] fight damage stays after the win; the rolls stay out of the writer facts', () => {
    const hp = status(F, 20).match(/^HP: (\d+) → (\d+) \(dealt \d+, took (\d+)\)$/m);
    expect(hp).not.toBeNull();
    const [, before, after, took] = hp!.map(Number);
    expect(took).toBeGreaterThan(0);
    expect(after).toBe(before - took);
    expect(F.after(20).character.hp).toBe(after);
    expect(F.after(20).character.hp).toBeLessThan(F.after(20).character.maxHp);
    const fact = F.after(20).completedEvent?.engineResult ?? '';
    expect(fact).toMatch(/Parley check/);
    expect(fact).not.toMatch(/Round \d|HP:/);
  });

  it('[tabletop fl151 T9 | mode2 fix 2] a level-1 chest with no CR rolls the low treasure band', () => {
    expect(F.input(9)).toBe('Open the Bronze chest');
    const s = status(F, 9);
    expect(s).toMatch(/Treasure cache CR 0–3/);
    expect(s).not.toMatch(/CR 4–9/);
    const gold = Number(s.match(/^Gold Gained: (\d+)$/m)?.[1] ?? 0);
    expect(gold).toBeGreaterThan(0);
    expect(gold).toBeLessThan(1000);
    expect(allStatus(F)).not.toMatch(/Coin purse CR 4–9/);
  });

  it('[tabletop ds151 T10/T13 | mode2 fix 2] encounter XP is the CR XP of each foe beaten', () => {
    expect(status(D, 10)).toMatch(/XP Gained: 100 \(defeated the thugs — CR 1\/4 \(no CR on card, default\) = 50 XP × 2 = 100 XP ÷ 1 = 100\)/);
    expect(status(D, 13)).toMatch(/XP Gained: 150 \(defeated the restless dead — CR 1\/4 .*50 XP × 3 = 150 XP ÷ 1 = 150\)/);
  });

  it('[tabletop ds150 | mode2 fix 2] walking to places pays no XP, so no level comes from arrivals', () => {
    expect(allStatus(S)).not.toMatch(/XP Gained: \d+ \(reached /);
    expect(allStatus(S)).not.toMatch(/Fight: VICTORY/);
    expect(S.after(lastTurn(S)).character.level).toBe(1);
  });

  it('[story rpg ds150 | mode2 fix 3] arrivals pay no XP; meeting a person still does', () => {
    const all = allStatus(R);
    expect(all).not.toMatch(/XP Gained: \d+ \(reached /);
    expect(all).toMatch(/XP Gained: 25 \(met Vessa\)/);
    expect(R.after(lastTurn(R)).character.level).toBe(1);
  });

  it('[story rpg ds150 + fl151 | mode2 fix 3] STATUS loot has no LitRPG rarity tag', () => {
    const all = `${allStatus(R)}\n${allStatus(RF)}`;
    expect(all).toMatch(/^Loot: /m);
    expect(all).not.toMatch(/\[(?:Common|Uncommon|Rare|Epic|Legendary)\]/);
  });

  it('[story rpg ds150 | mode2 fix 3] a level-up reads as growth, not a skill rank', () => {
    const s = R.after(lastTurn(R));
    const up = grantLevelSkills({ ...s, character: { ...s.character, level: 2, skillsGrantedThrough: 1 } }, 1);
    expect(up.receipts[0]).toMatch(/^You have grown: you can now /);
    expect(up.receipts.join(' ')).not.toMatch(/\brank\b|Level 2:/);
  });

  it('[mode2 guard] LitRPG keeps its STATUS, XP table, recovery and level line', () => {
    const lit = ['Flee check: d20 3 + 1 vs DC 12 — failure', 'Loot: [Epic] Masterwork Jerkin'];
    expect(filterSystemLogForEngine(lit, 'litrpg')).toEqual(['Loot: [Epic] Masterwork Jerkin']);
    expect(milestoneXp('litrpg', 'significantPlace').amount).toBe(25);
    expect(milestoneXp('litrpg', 'dungeonEntry').amount).toBe(25);
    expect(recoveryRow('litrpg').victoryFraction).toBe(0.25);
    const litState = { ...S.after(3), engineMode: 'litrpg' } as GameState;
    expect(
      formatArcStatusReceipts({ state: litState, systemReceipts: ['HP: 24 → 20 (dealt 9, took 4)', 'Fight: VICTORY vs X in 2 rounds'] } as never)
    ).toEqual(['Fight: VICTORY vs X in 2 rounds']);
    const up = grantLevelSkills({ ...litState, character: { ...litState.character, level: 2, skillsGrantedThrough: 1 } }, 1);
    expect(up.receipts[0]).toMatch(/^Level 2: .+ rank 1 — you can now /);
  });
});
