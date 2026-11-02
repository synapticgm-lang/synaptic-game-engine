/**
 * XP-D1 OPEN7 addendum — starter-zone mini-boss XP + win rates at L4–L7.
 */
import { describe, expect, it } from 'vitest';
import { unitMilestoneAmount, grayLevel, QUEST_STEP_UNITS_L2_PLUS } from './rules/xpPace';
import { simulateCombat, type EnemyStats } from './combat';
import { huntFoe } from './wildlifeActions';
import { createInitialState } from './defaults';
import type { GameState } from './types';

const BOSS_LEVEL = 3; // spawn+2 elite — grayLevel(7)=2 so still pays at L7; grayLevel(8)=3 would zero.

function bossXp(playerLevel: number): number {
  return unitMilestoneAmount('litrpg', 'encounter', {
    playerLevel,
    foeLevel: BOSS_LEVEL,
    levelSource: 'table',
    elite: true,
  });
}

function questCompleteShare(playerLevel: number): number {
  return unitMilestoneAmount('litrpg', 'questComplete', { playerLevel });
}

function winRateAt(level: number, trials = 50): number {
  const base = createInitialState(undefined, 'litrpg') as GameState;
  const maxHp = 16 + level * 4;
  const state: GameState = {
    ...base,
    engineMode: 'litrpg',
    seed: `boss-wr-${level}`,
    character: { ...base.character, level, hp: maxHp, maxHp },
  };
  const enc = huntFoe(
    {
      speciesId: 'boss',
      name: 'Zone Matriarch',
      level: BOSS_LEVEL,
      kind: 'beast',
      behaviour: 'territorial',
      elite: true,
      stock: 1,
      maxStock: 1,
      skinnable: true,
      primaryDrop: 'hide',
    },
    'Treeline'
  );
  const enemy: EnemyStats = {
    name: enc.name,
    level: enc.level,
    hp: enc.hp,
    maxHp: enc.maxHp,
    attack: Math.max(1, enc.level + 2),
    defense: Math.max(0, Math.floor(enc.level / 2)),
    armorClass: enc.armorClass ?? 12,
    xpReward: 0,
    goldReward: 0,
  };
  let wins = 0;
  for (let i = 0; i < trials; i++) {
    let t = (i * 0x9e3779b9 + level * 31) >>> 0;
    const rng = () => {
      t += 0x6d2b79f5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
    const fresh = { ...state, character: { ...state.character, hp: maxHp } };
    if (simulateCombat(fresh, enemy, { rng }).victory) wins += 1;
  }
  return wins / trials;
}

describe('OPEN7 addendum — zone mini-boss', () => {
  it('boss is not gray at L6/L7 and pays >0 via elite×2 + gap rule (not a constant)', () => {
    expect(BOSS_LEVEL).toBeGreaterThan(grayLevel(6));
    expect(BOSS_LEVEL).toBeGreaterThan(grayLevel(7));
    for (const P of [4, 5, 6, 7]) {
      const xp = bossXp(P);
      const normalSameMob = unitMilestoneAmount('litrpg', 'encounter', {
        playerLevel: P,
        foeLevel: BOSS_LEVEL,
        levelSource: 'table',
      });
      expect(xp).toBeGreaterThan(0);
      expect(xp).toBeGreaterThan(normalSameMob * 2);
      const ratio = xp / normalSameMob;
      // Ideal elite/trash ≈ 2/0.48 ≈ 4.17; OPEN8 smaller xpUnit can round the floor toward ~3.2.
      expect(ratio).toBeGreaterThan(3.0);
      expect(ratio).toBeLessThan(5);
    }
    // Intended arrival (L4): elite full-taper ×2 is at least a quest-step share and beats trash.
    const step = unitMilestoneAmount('litrpg', 'questStep', { playerLevel: 4 });
    expect(QUEST_STEP_UNITS_L2_PLUS).toBeGreaterThan(0);
    expect(bossXp(4)).toBeGreaterThanOrEqual(step);
    // Quest-complete absolute is a higher bar; boss should be in the same ballpark (≥ half) at intended level.
    expect(bossXp(4)).toBeGreaterThanOrEqual(Math.floor(questCompleteShare(4) * 0.5));
    // Over-levelled grinder still earns >0 (not gray) and more than non-elite same-mob trash.
    expect(bossXp(7)).toBeGreaterThan(0);
    expect(bossXp(7)).toBeGreaterThan(
      unitMilestoneAmount('litrpg', 'encounter', {
        playerLevel: 7,
        foeLevel: BOSS_LEVEL,
        levelSource: 'table',
      })
    );
  });

  it('boss win rates: beatable at intended band; over-levelled grinder wins more easily', () => {
    const r4 = winRateAt(4);
    const r5 = winRateAt(5);
    const r6 = winRateAt(6);
    const r7 = winRateAt(7);
    expect(r4).toBeGreaterThan(0.2);
    expect(r6).toBeGreaterThan(0.35);
    expect(r7).toBeGreaterThanOrEqual(r4);
    expect(r5).toBeGreaterThan(0.25);
    // Soft monotonicity — allow noise but L7 should not be worse than L4.
    expect(r7 + 0.05).toBeGreaterThanOrEqual(r4);
  }, 60_000);
});
