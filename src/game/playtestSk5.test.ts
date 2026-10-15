/**
 * q31-SK5 — skill XP, named tiers and levels (LitRPG / Story RPG; tabletop untouched).
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, NamedSkillState } from './types';
import {
  OLD_RANK_TO_LEVEL,
  applyFailedCraftMaterials,
  applySkillXp,
  craftMaterialsLost,
  greyCutoff,
  levelLabel,
  longShotBoost,
  migrateNamedSkill,
  settleSkillUse,
  useXpFor,
  xpForLevel,
} from './rules/skillGrowth';

function litrpg(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    seed: 'sk5',
    engineMode: 'litrpg',
    turn: 3,
    character: { ...s.character, name: 'Rook', level: 1, xp: 40, skills: {}, skillsGrantedThrough: 1 },
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true } as GameState['openingEstablishment'],
    ...over,
  };
}

function withNamed(s: GameState, rec: NamedSkillState): GameState {
  return { ...s, character: { ...s.character, namedSkills: [migrateNamedSkill(rec)] } };
}

describe('SK-5 skill XP', () => {
  it('SK5-a: on-level success at skill 10 is +24 XP; character XP unchanged', () => {
    const before = litrpg();
    const s = withNamed(before, { id: 'searching', rank: 1, uses: 0, level: 10, xp: 0 });
    const charXp = s.character.xp;
    const r = settleSkillUse(s, 'Search the area', { success: true, taskLevel: 10 });
    const rec = r.state.character.namedSkills!.find((x) => x.id === 'searching')!;
    expect(useXpFor(10, 10)).toBe(24);
    expect(rec.xp).toBe(24);
    expect(rec.level).toBe(10);
    expect(r.state.character.xp).toBe(charXp);
  });

  it('SK5-b: orange task (skill 10, task 13) is +47 XP', () => {
    expect(useXpFor(10, 13)).toBe(47);
    const s = withNamed(litrpg(), { id: 'searching', rank: 1, uses: 0, level: 10, xp: 0 });
    const r = settleSkillUse(s, 'Search the area', { success: true, taskLevel: 13 });
    expect(r.state.character.namedSkills![0]!.xp).toBe(47);
  });

  it('SK5-c: green reduced > 0; grey cutoff at skill 20 is 13 → 0 XP', () => {
    expect(greyCutoff(20)).toBe(13);
    const green = useXpFor(20, 15);
    const yellow = useXpFor(20, 20);
    expect(green).toBeGreaterThan(0);
    expect(green).toBeLessThan(yellow);
    expect(useXpFor(20, 13)).toBe(0);
    const s = withNamed(litrpg(), { id: 'searching', rank: 2, uses: 0, level: 20, xp: 5 });
    const grey = settleSkillUse(s, 'Search the area', { success: true, taskLevel: 13 });
    expect(grey.state.character.namedSkills![0]!.xp).toBe(5);
    const greenHit = settleSkillUse(s, 'Search the area', { success: true, taskLevel: 15 });
    expect(greenHit.state.character.namedSkills![0]!.xp).toBeGreaterThan(5);
  });

  it('SK5-d: failure awards 0 skill XP', () => {
    const s = withNamed(litrpg(), { id: 'searching', rank: 1, uses: 0, level: 10, xp: 12 });
    const r = settleSkillUse(s, 'Search the area', { success: false, taskLevel: 10 });
    expect(r.state.character.namedSkills![0]!.xp).toBe(12);
    expect(r.state.character.namedSkills![0]!.level).toBe(10);
  });

  it('SK5-e: failed craft loses half materials rounded down; success loses none via this path', () => {
    expect(craftMaterialsLost(7)).toBe(3);
    const base = litrpg({
      materials: [{ id: 'iron-ingot', name: 'Iron ingot', rarity: 'Common', quantity: 7 }],
    });
    const fail = applyFailedCraftMaterials(base, 'Iron ingot', 7);
    expect(fail.materials.find((m) => m.name === 'Iron ingot')?.quantity).toBe(4);
    const settled = settleSkillUse(
      withNamed(base, { id: 'searching', rank: 0, uses: 0, level: 0, xp: 0 }),
      'Search the area',
      { success: false, craftAttempt: { name: 'Iron ingot', qty: 7 } },
    );
    expect(settled.state.materials.find((m) => m.name === 'Iron ingot')?.quantity).toBe(4);
  });

  it('SK5-f/g: long-shot boosts by tier with overflow; no band stacking', () => {
    expect(longShotBoost('Journeyman')).toBe(505);
    expect(longShotBoost('Expert')).toBe(1614);
    expect(longShotBoost('Master')).toBe(4526);
    const master = settleSkillUse(
      withNamed(litrpg(), { id: 'searching', rank: 0, uses: 0, level: 0, xp: 0 }),
      'Search the area',
      { success: true, longShot: true, skillTier: 'Master', taskLevel: 41 },
    );
    const m = master.state.character.namedSkills![0]!;
    expect(m.level).toBe(18);
    expect(m.xp).toBe(473);
    const expert = applySkillXp(0, 0, longShotBoost('Expert'));
    expect(expert.level).toBe(11);
    expect(expert.xp).toBe(21);
    const journeyman = applySkillXp(0, 0, longShotBoost('Journeyman'));
    expect(journeyman.level).toBe(5);
    expect(journeyman.xp).toBe(41);
    // Overflow carry: 20 XP short of next level + 505 levels through as many bars as it covers.
    const near = applySkillXp(10, xpForLevel(10) - 20, 505);
    expect(near.level).toBe(12);
    expect(near.xp).toBe(226);
  });

  it('SK5-h: tier labels and Master 10 cap', () => {
    expect(levelLabel(10)).toBe('Novice 10');
    expect(levelLabel(11)).toBe('Apprentice 1');
    expect(levelLabel(50)).toBe('Master 10');
    const capped = applySkillXp(50, 0, 1000);
    expect(capped).toEqual({ level: 50, xp: 0, leveled: false });
  });

  it('SK5-i: old rank/uses migrate to matching level with no XP invent', () => {
    expect(OLD_RANK_TO_LEVEL).toEqual([0, 1, 11, 21]);
    const m = migrateNamedSkill({ id: 'searching', rank: 3, uses: 9 });
    expect(m.level).toBe(21);
    expect(m.xp).toBe(0);
    expect(m.rank).toBe(3);
  });

  it('SK5-j: tabletop writes no skill XP; craft materials untouched on settle', () => {
    const s0 = createInitialState(undefined, 'dnd') as GameState;
    const s = {
      ...s0,
      engineMode: 'dnd' as const,
      materials: [{ id: 'iron-ingot', name: 'Iron ingot', rarity: 'Common' as const, quantity: 7 }],
      character: { ...s0.character, namedSkills: [{ id: 'searching', rank: 0, uses: 0 }] },
    };
    const r = settleSkillUse(s, 'Search the area', {
      success: false,
      craftAttempt: { name: 'Iron ingot', qty: 7 },
    });
    expect(r.state.character.namedSkills).toEqual(s.character.namedSkills);
    expect(r.state.materials[0]!.quantity).toBe(7);
    expect(applyFailedCraftMaterials(s, 'Iron ingot', 7).materials[0]!.quantity).toBe(7);
  });
});
