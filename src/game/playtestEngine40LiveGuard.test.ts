/**
 * PR 28 follow-up: live-game option guard, and lifeline on every hpAfterFight caller.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInitialState } from './defaults';
import { resolveEngineFight } from './engineFight';
import { applyPlayPhaseAfterHp } from './playPhase';
import { applyShapedLivePad, shapeLiveTurnPad, shapePlayerOptions } from './playerOptions';
import { fightHpFromResult, hpAfterFight } from './recoveryRules';
import { emptySceneFacts } from './sceneFacts';
import type { ActiveEncounter, GameState } from './types';
import * as combat from './combat';

afterEach(() => {
  vi.restoreAllMocks();
});

const here = dirname(fileURLToPath(import.meta.url));

function lit(over: Partial<GameState> = {}, hp = 24, max = 24): GameState {
  const s = createInitialState('Jax', 'litrpg');
  return {
    ...s,
    engineMode: 'litrpg',
    ...over,
    character: {
      ...s.character,
      name: 'Jax',
      hp,
      maxHp: max,
      level: 1,
      lifeline: s.character.lifeline ?? 'System lifeline',
      ...(over.character ?? {}),
    },
  };
}

function rpg(over: Partial<GameState> = {}, hp = 24, max = 24): GameState {
  const s = createInitialState('Jax', 'rpg');
  return {
    ...s,
    engineMode: 'rpg',
    ...over,
    character: {
      ...s.character,
      name: 'Jax',
      hp,
      maxHp: max,
      level: 1,
      lifeline: s.character.lifeline ?? 'an old oath that will not let you go',
      ...(over.character ?? {}),
    },
  };
}

function dnd(over: Partial<GameState> = {}): GameState {
  const s = createInitialState('Jax', 'dnd');
  return { ...s, engineMode: 'dnd', ...over, character: { ...s.character, name: 'Jax', ...(over.character ?? {}) } };
}

function foe(over: Partial<ActiveEncounter> = {}): ActiveEncounter {
  return {
    name: 'Pact-Hunter Skirmisher',
    level: 6,
    hp: 40,
    maxHp: 40,
    strength: 18,
    constitution: 16,
    armorClass: 14,
    xpReward: 40,
    goldReward: 10,
    count: 1,
    phase: 'engaged',
    ...over,
  } as ActiveEncounter;
}

function assertNoUnsafeZero(state: GameState) {
  const hp = state.character.hp ?? 0;
  if (hp > 0) return;
  const dying = !!(state.engineMode === 'dnd' && state.deathSaves && !state.deathSaves.dead && !state.deathSaves.stable);
  const ended = state.playPhase === 'ended';
  expect(dying || ended, '0 HP with no lifeline or death-save / ended state').toBe(true);
}

function defeatResult(finalPlayerHp: number, damageReceived: number): combat.CombatResult {
  return {
    victory: false,
    rounds: 2,
    damageDealt: 3,
    damageReceived,
    finalPlayerHp,
    finalPlayerMp: 0,
    finalEnemyHp: 12,
    xpGained: 0,
    goldGained: 0,
    loot: [],
    roundsLog: [],
    summary: 'defeat',
  };
}

describe('engine40 live-path option guard', () => {
  it('useGame live turn path shapes the pad; origin and session-zero pads do not', () => {
    const src = readFileSync(join(here, 'useGame.ts'), 'utf8');
    expect(src).toMatch(/finalChoices = shapeLiveTurnPad\(/);
    expect(src).toMatch(/heardChoices = shapeLiveTurnPad\(/);
    expect(src).toMatch(/applyShapedLivePad\(mergedState/);
    // Origin / opening pads still write their own choices without the live shaper.
    const originBlock = src.slice(src.indexOf('stepOriginCreation'), src.indexOf('stepOriginCreation') + 1800);
    expect(originBlock).not.toMatch(/shapeLiveTurnPad|applyShapedLivePad/);
    const openingAssigns = [...src.matchAll(/choices: openingChoicesForPad/g)];
    expect(openingAssigns.length).toBeGreaterThan(0);
    expect(src).not.toMatch(/shapeLiveTurnPad\([^)]*openingChoicesForPad/);
  });

  it('the live path pad is capped (3 dnd / 4 otherwise), drops raw place_ ids and Follow up:', () => {
    const raw = [
      'Follow up: The Lost Survey',
      'Travel toward place_greyhollow-at-the-inn',
      'Look around',
      'Wait and listen',
      'Search the area',
      'Talk to the innkeep',
      'Check the notice board',
    ];
    for (const [mode, cap] of [['dnd', 3], ['litrpg', 4], ['rpg', 4]] as const) {
      const state = mode === 'dnd' ? dnd() : mode === 'rpg' ? rpg() : lit();
      const pad = shapeLiveTurnPad(state, raw);
      const declared = pad.filter((c) => !/^(?:say something|do something else)\b/i.test(c));
      expect(declared.length, mode).toBeLessThanOrEqual(cap);
      expect(declared.some((c) => /^Follow up:/i.test(c)), mode).toBe(false);
      expect(declared.some((c) => /place_[a-z0-9-]+/i.test(c)), mode).toBe(false);
      expect(declared).toEqual(shapePlayerOptions(state, raw));
    }
  });

  it('applyShapedLivePad rewrites the committed live pad and log', () => {
    const state = lit({
      turn: 8,
      choices: ['Follow up: The Lost Survey', 'Travel toward place_greyhollow-at-the-inn', 'Look around', 'Wait and listen', 'Search the area'],
      offeredPad: {
        turn: 8,
        choices: ['Follow up: The Lost Survey', 'Travel toward place_greyhollow-at-the-inn', 'Look around'],
        chips: [
          { label: 'Follow up: The Lost Survey', actionId: 'label:follow', kind: 'compiled' },
          { label: 'Look around', actionId: 'look', kind: 'compiled' },
        ],
      },
      log: [{ id: 'gm-1', turn: 8, role: 'gm', content: 'The common room is quiet.', timestamp: 0, offeredChoices: ['Follow up: The Lost Survey'] }],
    });
    const next = applyShapedLivePad(state, 'gm-1');
    const declared = (next.choices ?? []).filter((c) => !/^(?:say something|do something else)\b/i.test(c));
    expect(declared.length).toBeLessThanOrEqual(4);
    expect(declared.some((c) => /^Follow up:/i.test(c))).toBe(false);
    expect(declared.some((c) => /place_[a-z0-9-]+/i.test(c))).toBe(false);
    expect(next.offeredPad?.choices).toEqual(next.choices);
    expect(next.log.find((e) => e.id === 'gm-1')?.offeredChoices).toEqual(next.choices);
  });

  it('PYOA and (by contract) origin pads are left alone by shapeLiveTurnPad', () => {
    const s = createInitialState('Jax', 'pyoa');
    const raw = ['Turn to page 12', 'Follow up: A clue'];
    expect(shapeLiveTurnPad({ ...s, engineMode: 'pyoa' }, raw)).toEqual(raw);
  });
});

describe('engine40 fightHpFromResult + lifeline per caller', () => {
  it('fightHpFromResult: a defeat never raises HP, and can reach 0', () => {
    const state = lit({}, 1, 31);
    expect(fightHpFromResult(state, false, 8, 0)).toBeLessThanOrEqual(1);
    expect(fightHpFromResult(state, false, 8, 11)).toBe(0);
    expect(fightHpFromResult(state, false, 0, 1)).toBe(0);
    expect(fightHpFromResult(lit({}, 22, 24), false, 20, 2)).toBe(20);
    expect(hpAfterFight(state, false, 8)).toBeLessThanOrEqual(1);
  });

  it('caller resolveEngineFight (litrpg): a defeat that would have healed instead fires the lifeline', () => {
    vi.spyOn(combat, 'simulateCombat').mockReturnValue(defeatResult(8, 11));
    const startHp = 1;
    const before = lit(
      {
        turn: 9,
        gold: 80,
        currentLocation: 'Lowmarket',
        activeEncounter: foe(),
        sceneFacts: { ...emptySceneFacts(9), present: ['Pact-Hunter Skirmisher'] },
      },
      startHp,
      31,
    );
    const fought = resolveEngineFight(before, 'Attack Pact-Hunter Skirmisher');
    expect(fought).not.toBeNull();
    const next = fought!.state;
    // The fight HP line must not rise above the starting HP; the lifeline may then restore more.
    expect(fought!.receipts.some((l) => /HP:\s*1\s*→\s*0\b/.test(l))).toBe(true);
    expect(next.character.hp).toBeGreaterThan(0);
    expect(fought!.receipts.some((l) => /Lifeline/i.test(l))).toBe(true);
    expect(next.character.conditions ?? []).toContain('Weakened');
    assertNoUnsafeZero(next);
  });

  it('caller resolveEngineFight (rpg): 0 HP applies the lifeline, never raises HP', () => {
    vi.spyOn(combat, 'simulateCombat').mockReturnValue(defeatResult(0, 20));
    const startHp = 5;
    const before = rpg(
      {
        turn: 12,
        gold: 60,
        currentLocation: 'Salt Road Waystation',
        activeEncounter: foe({ name: 'the thugs', count: 3 }),
        sceneFacts: { ...emptySceneFacts(12), present: ['the thugs'], crowdCount: 3 },
      },
      startHp,
      28,
    );
    const fought = resolveEngineFight(before, 'Attack the thugs');
    expect(fought).not.toBeNull();
    const next = fought!.state;
    expect(fought!.receipts.some((l) => /HP:\s*5\s*→\s*0\b/.test(l))).toBe(true);
    expect(next.character.hp).toBeGreaterThan(0);
    expect(fought!.receipts.some((l) => /Lifeline/i.test(l))).toBe(true);
    assertNoUnsafeZero(next);
  });

  it('caller useGame auto-fight: writes fightHpFromResult then applyPlayPhaseAfterHp', () => {
    const src = readFileSync(join(here, 'useGame.ts'), 'utf8');
    const auto = src.slice(src.indexOf('const runAutoFight'), src.indexOf('const runAutoFight') + 12000);
    expect(auto).toMatch(/fightHpFromResult\(liveCurrent, result\.victory, result\.finalPlayerHp/);
    expect(auto).toMatch(/hp: hpAfter/);
    expect(auto).toMatch(/applyPlayPhaseAfterHp\(updated, updated\.character\.hp/);
  });

  it('applyPlayPhaseAfterHp after fightHpFromResult(0) never leaves 0 HP without a lifeline', () => {
    const start = lit({ gold: 100, turn: 4 }, 1, 31);
    const hp = fightHpFromResult(start, false, 8, 11);
    expect(hp).toBe(0);
    const out = applyPlayPhaseAfterHp({ ...start, character: { ...start.character, hp } }, 0, 4);
    expect(out.character.hp).toBeGreaterThan(0);
    expect(out.lifelineReceipts?.some((l) => /Lifeline/.test(l))).toBe(true);
    assertNoUnsafeZero(out);
  });
});
