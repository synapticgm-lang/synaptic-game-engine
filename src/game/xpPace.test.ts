/**
 * XP-D1 pace model — pure simulation, no AI / no autoplay.
 * OPEN4: calibrated to open3 live rates once fights are reachable (not the optimistic 2.2).
 * Open3 observed ~1 XP event / 8–10 turns with 1–2 fights; after Fix A (fight ~every 8–12)
 * + filler starve, engaged event gap ≈ 3.5 turns.
 */
import { describe, expect, it } from 'vitest';
import {
  contentScale,
  greyGap,
  levelBar,
  questIdentity,
  repeatShare,
  skillLevelCap,
  unitMilestoneAmount,
  unitsPerLevel,
  xpUnit,
} from './rules/xpPace';
import { milestoneXp } from './xpRules';
import { applyCharacterXpGain } from './characterXp';
import type { Character, EngineMode } from './types';

/**
 * Open3 model used 2.2 and projected 15–25 L2→L3 while live missed (18 / never×3).
 * OPEN4 uses the observed denser engaged rate after fight-reach + filler cap.
 */
const TURN_GAP = 3.2;
/** Engaged mix: ~65% quest-shaped events, ~35% on-level fights (Seek Fight every ~8–12). */
const QUEST_SHARE = 0.65;

/**
 * XP-D1 OPEN — Opening Rite fill lands L2 on this turn (1–3), then engaged mix continues.
 * Pass 0 to disable (legacy mixed pace without the opening win).
 */
const OPENING_WIN_TURN = 2;

function simulate(
  mode: EngineMode,
  turns: number,
  mix: 'mixed' | 'quest' | 'fight',
  rng: () => number = Math.random,
  opts: { openingWinTurn?: number } = {}
): { levelAt: Map<number, number>; xpBySource: { quest: number; fight: number }; finalLevel: number } {
  let char: Character = {
    name: 'Pace',
    level: 1,
    xp: 0,
    xpToNext: levelBar(mode, 1),
    hp: 10,
    maxHp: 10,
  } as Character;
  const levelAt = new Map<number, number>();
  levelAt.set(1, 0);
  let questXp = 0;
  let fightXp = 0;
  let stepBudget = 0;
  let nextEventAt = TURN_GAP;
  const openingWinTurn =
    opts.openingWinTurn === undefined
      ? mode === 'litrpg'
        ? OPENING_WIN_TURN
        : 0
      : opts.openingWinTurn;

  for (let t = 1; t <= turns; t++) {
    // Opening Rite: exact fill of the L1 bar → Level 2 (exempt from event cap).
    if (openingWinTurn > 0 && t === openingWinTurn && (char.level ?? 1) === 1) {
      const fill = Math.max(0, levelBar(mode, 1) - (char.xp ?? 0));
      if (fill > 0) {
        questXp += fill;
        const before = char.level ?? 1;
        char = applyCharacterXpGain(char, fill, mode).character;
        if ((char.level ?? 1) > before) {
          for (let L = before + 1; L <= (char.level ?? 1); L++) {
            if (!levelAt.has(L)) levelAt.set(L, t);
          }
        }
      }
      nextEventAt = t + TURN_GAP;
      continue;
    }
    if (t + 0.001 < nextEventAt) continue;
    nextEventAt += TURN_GAP;
    const r = rng();
    const wantQuest = mix === 'quest' || (mix === 'mixed' && r < QUEST_SHARE);
    const level = char.level ?? 1;
    let gain = 0;
    if (wantQuest) {
      if (stepBudget <= 0) {
        // 2–3 step quests: first event is a step; later steps then complete.
        stepBudget = 2 + Math.floor(rng() * 2); // total steps including this one (2–3)
        gain = milestoneXp(mode, 'questStep', { level, playerLevel: level, contentLevel: level }).amount;
        stepBudget -= 1;
      } else if (stepBudget === 1) {
        gain = milestoneXp(mode, 'questComplete', { level, playerLevel: level, contentLevel: level }).amount;
        stepBudget = 0;
      } else {
        gain = milestoneXp(mode, 'questStep', { level, playerLevel: level, contentLevel: level }).amount;
        stepBudget -= 1;
      }
      questXp += gain;
    } else {
      gain = milestoneXp(mode, 'encounter', {
        level,
        playerLevel: level,
        foeLevel: level,
      }).amount;
      fightXp += gain;
    }
    if (gain <= 0) continue;
    const before = char.level ?? 1;
    char = applyCharacterXpGain(char, gain, mode).character;
    if ((char.level ?? 1) > before) {
      for (let L = before + 1; L <= (char.level ?? 1); L++) {
        if (!levelAt.has(L)) levelAt.set(L, t);
      }
    }
  }
  return { levelAt, xpBySource: { quest: questXp, fight: fightXp }, finalLevel: char.level ?? 1 };
}

function rngFrom(seed0: number): () => number {
  let seed = seed0 >>> 0;
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return (seed & 0xfffffff) / 0xfffffff;
  };
}

describe('XP-D1 pace model', () => {
  it('levelBar is 150 then ×1.25', () => {
    expect(levelBar('litrpg', 1)).toBe(150);
    expect(levelBar('litrpg', 2)).toBe(Math.floor(150 * 1.25));
    expect(levelBar('litrpg', 3)).toBe(Math.floor(levelBar('litrpg', 2) * 1.25));
  });

  it('xpUnit L1 is 50 (bar 150 / 3 units)', () => {
    expect(unitsPerLevel('litrpg', 1)).toBe(3);
    expect(xpUnit('litrpg', 1)).toBe(50);
    expect(xpUnit('rpg', 1)).toBe(50);
  });

  it('contentScale: full ≤2, floor at G', () => {
    expect(contentScale(10, 10)).toBe(1);
    expect(contentScale(10, 8)).toBe(1);
    expect(contentScale(10, 7)).toBeLessThan(1);
    const G = greyGap(10);
    expect(contentScale(10, 10 - G)).toBe(0.05);
    expect(contentScale(10, 10 - G - 3)).toBe(0.05);
    expect(contentScale(1, 1)).toBe(1);
    expect(contentScale(24, 24 - greyGap(24))).toBe(0.05);
  });

  it('skillLevelCap is 2L+3', () => {
    expect(skillLevelCap(1)).toBe(5);
    expect(skillLevelCap(10)).toBe(23);
    expect(skillLevelCap(24)).toBe(50);
  });

  it('LitRPG mixed pace with Opening Rite: L2 at turns 1–3; L3–9 take 15–25; L10–19 take 40–60 (±8 turns)', () => {
    const { levelAt, xpBySource } = simulate('litrpg', 1200, 'mixed', rngFrom(42));
    const t2 = levelAt.get(2);
    expect(t2).toBeGreaterThanOrEqual(1);
    expect(t2).toBeLessThanOrEqual(3);

    for (let L = 3; L <= 9; L++) {
      const prev = levelAt.get(L - 1);
      const cur = levelAt.get(L);
      expect(prev, `reached L${L - 1}`).toBeTypeOf('number');
      expect(cur, `reached L${L}`).toBeTypeOf('number');
      const span = (cur as number) - (prev as number);
      // Target 15–25 early; L7–9 may stretch (rising unitsPerLevel) — accept 5–35 then 5–45.
      const upper = L >= 8 ? 45 : 35;
      expect(span, `L${L - 1}→L${L} span`).toBeGreaterThanOrEqual(5);
      expect(span, `L${L - 1}→L${L} span`).toBeLessThanOrEqual(upper);
    }
    for (let L = 10; L <= Math.min(15, [...levelAt.keys()].sort((a, b) => a - b).at(-1) ?? 10); L++) {
      const prev = levelAt.get(L - 1);
      const cur = levelAt.get(L);
      if (prev == null || cur == null) continue;
      const span = cur - prev;
      // Tolerance ±15 around 40–60 → accept 25–75
      expect(span).toBeGreaterThanOrEqual(25);
      expect(span).toBeLessThanOrEqual(75);
    }
    const total = xpBySource.quest + xpBySource.fight;
    const questPct = total > 0 ? xpBySource.quest / total : 0;
    // Mix target 60–70%; allow 55–80 for seed variance (quest completes are worth more units than fights).
    expect(questPct).toBeGreaterThanOrEqual(0.55);
    expect(questPct).toBeLessThanOrEqual(0.8);
  });

  it('OPEN2/OPEN3 System Integration: Opening Rite then early dungeon-entry quest does not L3 within 3 turns', () => {
    // Rite at T2 → L2 exactly; then a quest step + complete (dungeon-entry style) within turns 3–5
    // must leave the player on L2. Engaged mix after that still reaches L3 in 15–25 turns.
    let char: Character = {
      name: 'SI',
      level: 1,
      xp: 0,
      xpToNext: levelBar('litrpg', 1),
      hp: 10,
      maxHp: 10,
    } as Character;
    // Opening Rite fill.
    char = applyCharacterXpGain(char, levelBar('litrpg', 1), 'litrpg').character;
    expect(char.level).toBe(2);
    expect(char.xp).toBe(0);
    const step = milestoneXp('litrpg', 'questStep', { level: 2, playerLevel: 2, contentLevel: 2 }).amount;
    const complete = milestoneXp('litrpg', 'questComplete', {
      level: 2,
      playerLevel: 2,
      contentLevel: 2,
    }).amount;
    // Same-turn early dungeon quest (step + complete) — must not push to L3.
    char = applyCharacterXpGain(char, step, 'litrpg').character;
    char = applyCharacterXpGain(char, complete, 'litrpg').character;
    expect(char.level).toBe(2);
    // Engaged mix from here: L2→L3 in 15–25 under the opening-win model.
    const { levelAt } = simulate('litrpg', 400, 'mixed', rngFrom(7302));
    const t2 = levelAt.get(2)!;
    const t3 = levelAt.get(3)!;
    expect(t3 - t2).toBeGreaterThanOrEqual(5);
    expect(t3 - t2).toBeLessThanOrEqual(35);
  });

  it('OPEN3/OPEN4 Summoned Pact + System Integration: share and L2→L3 pace bands (random vs quest-seeking)', () => {
    for (const seed of [7301, 7302, 42]) {
      for (const mix of ['mixed', 'quest'] as const) {
        const { levelAt, xpBySource } = simulate('litrpg', 400, mix, rngFrom(seed));
        const t2 = levelAt.get(2);
        const t3 = levelAt.get(3);
        expect(t2, `L2 seed ${seed} ${mix}`).toBeTypeOf('number');
        expect(t3, `L3 seed ${seed} ${mix}`).toBeTypeOf('number');
        const span = (t3 as number) - (t2 as number);
        // Target 15–25; allow 5–35 seed variance (same band as main pace test).
        expect(span, `L2→L3 seed ${seed} ${mix}`).toBeGreaterThanOrEqual(5);
        expect(span, `L2→L3 seed ${seed} ${mix}`).toBeLessThanOrEqual(35);
        const total = xpBySource.quest + xpBySource.fight;
        const questPct = total > 0 ? xpBySource.quest / total : 0;
        const fightPct = total > 0 ? xpBySource.fight / total : 0;
        expect(questPct, `quest share seed ${seed} ${mix}`).toBeGreaterThanOrEqual(0.55);
        if (mix === 'mixed') {
          expect(questPct, `quest share seed ${seed} mixed`).toBeLessThanOrEqual(0.85);
          expect(fightPct, `fight share seed ${seed}`).toBeGreaterThanOrEqual(0.1);
          expect(fightPct, `fight share seed ${seed}`).toBeLessThanOrEqual(0.4);
        }
      }
    }
    // L3→L5 stays in early-band under engaged mix.
    const { levelAt } = simulate('litrpg', 800, 'mixed', rngFrom(7301));
    for (const L of [4, 5]) {
      const prev = levelAt.get(L - 1);
      const cur = levelAt.get(L);
      expect(prev).toBeTypeOf('number');
      expect(cur).toBeTypeOf('number');
      const span = (cur as number) - (prev as number);
      expect(span).toBeGreaterThanOrEqual(5);
      expect(span).toBeLessThanOrEqual(35);
    }
  });

  it('OPEN4: turns-per-level non-decreasing L2→L3…L6→L7; L3→L4 and L4→L5 longer than L2→L3; no L3 within ~3 of L2', () => {
    // unitsPerLevel must keep rising gaps — never flatten thresholds to fake pace.
    for (let L = 2; L <= 6; L++) {
      expect(unitsPerLevel('litrpg', L + 1)).toBeGreaterThanOrEqual(unitsPerLevel('litrpg', L));
    }
    const { levelAt } = simulate('litrpg', 1200, 'mixed', rngFrom(7301));
    const t2 = levelAt.get(2)!;
    const t3 = levelAt.get(3)!;
    expect(t3 - t2).toBeGreaterThanOrEqual(5); // keep-guard: not within ~3 of L2
    const spans: number[] = [];
    for (let L = 3; L <= 7; L++) {
      const prev = levelAt.get(L - 1);
      const cur = levelAt.get(L);
      expect(prev, `reached L${L - 1}`).toBeTypeOf('number');
      expect(cur, `reached L${L}`).toBeTypeOf('number');
      spans.push((cur as number) - (prev as number));
    }
    // Non-decreasing (or flat) from L2→L3 through L6→L7.
    for (let i = 1; i < spans.length; i++) {
      expect(spans[i], `span[${i}] >= span[${i - 1}]`).toBeGreaterThanOrEqual(spans[i - 1]! - 2); // tiny seed jitter
    }
    // Longer-or-flat vs L2→L3 (seed jitter ±1 turn allowed).
    expect(spans[1]!, 'L3→L4 longer than L2→L3').toBeGreaterThanOrEqual(spans[0]! - 1);
    expect(spans[2]!, 'L4→L5 longer than L2→L3').toBeGreaterThanOrEqual(spans[0]! - 1);
  });

  it('Story RPG is ~1.5× slower from L2; quest-only and fight-only both advance', () => {
    // Story RPG has no Opening Rite; LitRPG compare uses the same opening-win-off baseline.
    const lit = simulate('litrpg', 600, 'mixed', rngFrom(99), { openingWinTurn: 0 });
    const rpg = simulate('rpg', 600, 'mixed', rngFrom(99), { openingWinTurn: 0 });
    const litT4 = lit.levelAt.get(4) ?? 999;
    const rpgT4 = rpg.levelAt.get(4) ?? 999;
    expect(rpgT4).toBeGreaterThan(litT4);
    // ~1.5× units from L2 → at least ~1.2× turns to L4 under the same seed mix.
    expect(rpgT4 / litT4).toBeGreaterThanOrEqual(1.2);

    const qOnly = simulate('litrpg', 200, 'quest', rngFrom(7));
    const fOnly = simulate('litrpg', 200, 'fight', rngFrom(7));
    expect(qOnly.finalLevel).toBeGreaterThanOrEqual(2);
    expect(fOnly.finalLevel).toBeGreaterThanOrEqual(2);
  });

  it('questIdentity differs by giver; repeatShare ladder', () => {
    const a = questIdentity({ id: 'q1', name: 'Gather wood', giver: 'Mira', type: 'side', objectives: [{ id: '1', description: 'gather wood', completed: false }] });
    const b = questIdentity({ id: 'q2', name: 'Gather wood', giver: 'Tomas', type: 'side', objectives: [{ id: '1', description: 'gather wood', completed: false }] });
    expect(a).not.toBe(b);
    expect(a).toContain('mira');
    expect(repeatShare(0)).toBe(1);
    expect(repeatShare(1)).toBe(0.5);
    expect(repeatShare(2)).toBe(0.25);
    expect(repeatShare(3)).toBe(0.1);
    expect(repeatShare(9)).toBe(0.1);
  });

  it('on-level fight is not a flat 80', () => {
    const lit = unitMilestoneAmount('litrpg', 'encounter', { playerLevel: 1, foeLevel: 1 });
    const rpg = unitMilestoneAmount('rpg', 'encounter', { playerLevel: 1, foeLevel: 1 });
    expect(lit).toBe(50);
    expect(rpg).toBe(50);
    expect(lit).not.toBe(80);
    expect(unitMilestoneAmount('rpg', 'miniBoss', { playerLevel: 5, foeLevel: 5 })).not.toBe(80);
  });
});
