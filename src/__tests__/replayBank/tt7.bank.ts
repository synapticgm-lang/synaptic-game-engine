/**
 * tt-build-7 — LitRPG and story RPG on the shared engine maths, each mode keeping its presentation
 * (rules/modeProfile). Real play states: LitRPG ds150 (levels up on T11) and story RPG ds150.
 * Shared now: level-up HP (Hit Die fixed value + CON), skill proficiency (+PB, ×2 expertise; a rank is how
 * LitRPG and story RPG show it), the DC ladder with the Strictness shift, conditions on checks, the SRD rests
 * and no HP back after a won fight. Held for John (tt-build-7.md): the XP bar curve and the fight damage maths.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';
import { applyCharacterXpGain } from '../../game/characterXp';
import { resolveCheckContext, runPlayerCheck } from '../../game/checkMath';
import { parsePlayerIntent } from '../../game/intentParser';
import { applyRestHeal, isSafeHubRest, recoveryRow, restChip } from '../../game/recoveryRules';
import { edgesToChoiceLabels, enumerateLegalEdges } from '../../game/choiceEdge';
import { proficiencyBonus } from '../../game/checkRules';
import { ladderDc } from '../../game/rules/exploration';
import { modeProfile } from '../../game/rules/modeProfile';
import { grantLevelSkills } from '../../game/skillGates';
import type { GameState } from '../../game/types';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const LIT_DS150 = '2026-10-12T17-05-53-021Z_summoned-pact_cold-system_s150';
const RPG_DS150 = '2026-10-13T12-08-03-265Z_salt-road-heist_chilled-gm_s150';

let L: Replay;
let R: Replay;
beforeAll(async () => {
  L = new Replay(await replayWhole(LIT_DS150));
  R = new Replay(await replayWhole(RPG_DS150));
}, 900_000);

afterEach(() => vi.restoreAllMocks());

const ctx = (s: GameState, input: string) => resolveCheckContext(s, parsePlayerIntent(input, s), input);
const check = (s: GameState, input: string) => runPlayerCheck(s, parsePlayerIntent(input, s), input);
const asMode = (s: GameState, engineMode: GameState['engineMode']) => ({ ...s, engineMode }) as GameState;
const conMod = (s: GameState) => Math.floor(((s.character.attributes?.CON ?? 10) - 10) / 2);
/** The first turn whose committed state stands at a safe hub, hurt to half HP (real place, real sheet). */
function hurtAtHub(T: Replay): GameState {
  const n = T.turns().find((t) => isSafeHubRest(T.after(t), 'rest'));
  expect(n, 'the replay reaches a safe hub').toBeDefined();
  const s = T.after(n!);
  return { ...s, character: { ...s.character, hp: Math.max(1, Math.floor(s.character.maxHp / 2)) } };
}

describe('replay bank tt-build-7 (one engine, three presenters)', () => {
  it('[litrpg ds150 T13 | tt-build-7] the level-up adds the d8 Hit Die at its fixed 5 + CON; LitRPG shows one line', () => {
    // Earned XP (xp-fix): the run stays level 1, so the level-up is applied to the real T13 sheet.
    const b = L.after(13);
    expect(b.character.level, 'earned XP: still level 1 after the first kill').toBe(1);
    expect(L.after(L.turns()[L.turns().length - 1]).character.level).toBe(1);
    const gain = Math.max(1, 5 + conMod(b));
    const up = grantLevelSkills({ ...b, character: { ...b.character, level: 2, skillsGrantedThrough: 1 } }, 1);
    expect(up.receipts.join('\n')).toMatch(/^Level 2: /m);
    expect(up.receipts.join('\n')).not.toMatch(/Hit Die|Proficiency Bonus|max HP/);
    // Same maths with the tabletop presenter: same HP, every number shown.
    const xp = b.character.xpToNext - b.character.xp;
    const lit = applyCharacterXpGain(b.character, xp, 'litrpg');
    const table = applyCharacterXpGain(b.character, xp, 'dnd');
    expect(lit.character.maxHp).toBe(b.character.maxHp + gain);
    expect(lit.notes).toEqual(['Level Up! Now level 2']);
    if (table.levelsGained) expect(table.character.maxHp).toBe(lit.character.maxHp);
  });

  it('[litrpg ds150 + story rpg ds150 | tt-build-7] checks sit on the shared DC ladder; only tabletop names the rung', () => {
    for (const s of [L.after(11), R.after(3)]) {
      const strict = s.gmStrictness;
      expect(ctx(s, 'Search the area')).toMatchObject({ dc: ladderDc('medium', strict), rung: 'medium' });
      expect(ctx(s, 'Look around')).toMatchObject({ dc: ladderDc('easy', strict), rung: 'easy' });
      expect(ctx(s, 'Search the area').dc).toBe(ctx(asMode(s, 'dnd'), 'Search the area').dc);
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      expect(check(s, 'Look around').displayLine ?? '').not.toMatch(/\b(easy|medium|hard)\b/);
      expect(check(asMode(s, 'dnd'), 'Look around').displayLine ?? '').toMatch(/\(easy\)/);
      vi.restoreAllMocks();
    }
  });

  it('[litrpg ds150 T11 | tt-build-7] a skill rank is proficiency: rank 1 adds the Proficiency Bonus, rank 2 doubles it', () => {
    const s = L.after(11);
    const pb = proficiencyBonus(s.character.level);
    const withRank = (rank: number) => ({ ...s, character: { ...s.character, skills: { ...(s.character.skills ?? {}), investigation: rank } } }) as GameState;
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const none = check(withRank(0), 'Search the area').modifier;
    expect(check(withRank(1), 'Search the area').modifier).toBe(none + pb);
    expect(check(withRank(2), 'Search the area').modifier).toBe(none + pb * 2);
  });

  it('[story rpg ds150 T3 | tt-build-7] a condition changes the check in every mode', () => {
    const s = R.after(3);
    const poisoned = { ...s, character: { ...s.character, conditions: ['poisoned'] } } as GameState;
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(check(s, 'Search the area').record?.advState).toBe('normal');
    expect(check(poisoned, 'Search the area').record?.advState).toBe('disadvantage');
    expect(check(asMode(poisoned, 'dnd'), 'Search the area').record?.advState).toBe('disadvantage');
    expect(check(poisoned, 'Search the area').displayLine).toBe('Investigation: failure');
  });

  it('[litrpg ds150 + story rpg ds150 | tt-build-7] a safe hub offers the rest chip; the rest heals by the SRD rules with the short line', () => {
    for (const T of [L, R]) {
      const s = hurtAtHub(T);
      const chip = restChip(s);
      expect(chip).toMatch(/^(Take a short rest|Rest for the night)$/);
      expect(edgesToChoiceLabels(enumerateLegalEdges(s))).toContain(chip);
      expect(applyRestHeal(s, 'Wait a moment').receipt, 'waiting is not a rest').toBeNull();
      const night = applyRestHeal(s, 'Rest for the night');
      expect(night.state.character.hp).toBe(s.character.maxHp);
      expect(night.receipt).toBe(`Rest: HP ${s.character.hp} → ${s.character.maxHp}`);
      expect(night.dieLine).toBeUndefined();
      const table = applyRestHeal(asMode(s, 'dnd'), 'Rest for the night');
      expect(table.state.character.hp).toBe(night.state.character.hp);
      expect(table.receipt).toMatch(/long rest, 8 hours/);
    }
  });

  it('[tt-build-7] a won fight gives no HP back in any mode; each mode keeps its presenter', () => {
    for (const mode of ['litrpg', 'rpg', 'pyoa'] as const) expect(recoveryRow(mode)).toEqual(recoveryRow('dnd'));
    expect(recoveryRow('litrpg').victoryFraction).toBe(0);
    expect(modeProfile('dnd').numbers).toBe('open');
    expect(modeProfile('litrpg').numbers).toBe('system');
    expect(modeProfile('rpg').numbers).toBe('hidden');
  });
});
