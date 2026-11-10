/**
 * PR 28 follow-up: live-game option guard, and lifeline on every hpAfterFight caller.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { chipKindOf } from './chipCheck';
import { createInitialState } from './defaults';
import { resolveEngineFight } from './engineFight';
import { buildNewGameState } from './fateAutoplay';
import { applyPlayPhaseAfterHp } from './playPhase';
import { applyShapedLivePad, shapeLiveTurnPad } from './playerOptions';
import { commitOfferedTurn } from './playTranscript';
import { fightHpFromResult, hpAfterFight } from './recoveryRules';
import { ORIGIN_QUICK_START_CHIP, originPad } from './rules/rpgOrigin';
import { emptySceneFacts } from './sceneFacts';
import { shopChips } from './shopChips';
import { beginTabletopCreation, creationChips, tabletopCreationPending } from './tabletop/creationFlow';
import type { ActiveEncounter, EngineMode, GameState, NpcMemory } from './types';
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

function declaredOnly(choices: string[] | undefined): string[] {
  return (choices ?? []).filter((c) => !/^(?:say something|do something else)\b/i.test(c));
}

function merchantMem(location: string, name = 'Hale'): NpcMemory {
  return {
    npcId: 'hale',
    npcName: name,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 1,
    aliases: [],
    location,
    roleHint: 'merchant',
  } as NpcMemory;
}

describe('engine40 live-path option guard', () => {
  it('travel is kept on the Greyhollow Inn tabletop pad (cap 3, fillers evicted)', () => {
    const { state: built } = buildNewGameState({
      bibleId: 'cursed-keep',
      characterName: 'Jax',
      seed: 884211,
      personality: 'chilled-gm',
      engineMode: 'dnd',
      tabletopCreation: true,
    });
    const atInn: GameState = {
      ...built,
      currentLocation: 'Greyhollow Inn',
      turn: 6,
      playPhase: 'live',
      tabletopCreation: built.tabletopCreation ? { ...built.tabletopCreation, stage: 'done' } : undefined,
      log: [
        {
          id: 'gm-inn',
          turn: 6,
          role: 'gm',
          content: 'The common room of Greyhollow Inn is quiet. The lane toward Greyhollow Church is open.',
          timestamp: 0,
        },
      ],
      choices: [
        'Look around',
        'Wait and listen',
        'Search the area',
        'Travel toward Greyhollow Church',
      ],
    };
    const committed = commitOfferedTurn(atInn, 'gm-inn');
    const raw = committed.choices ?? committed.offeredPad?.choices ?? atInn.choices;
    expect(declaredOnly(raw).some((c) => /^Travel toward Greyhollow Church$/i.test(c))).toBe(true);
    const live = declaredOnly(shapeLiveTurnPad(committed, raw));
    const afterCommit = declaredOnly(applyShapedLivePad(committed, 'gm-inn').choices);
    for (const [label, pad] of [
      ['shapeLiveTurnPad', live],
      ['applyShapedLivePad', afterCommit],
    ] as const) {
      expect(pad.length, label).toBeLessThanOrEqual(3);
      expect(pad.some((c) => /^Travel toward Greyhollow Church$/i.test(c)), label).toBe(true);
      const fillers = pad.filter((c) => /^(?:Look around|Wait and listen|Search the area)$/i.test(c));
      expect(fillers.length, label).toBeLessThan(pad.length);
    }
  });

  it('the origin pad is unchanged including Quick start', () => {
    const { state: built } = buildNewGameState({
      bibleId: 'salt-road-heist',
      characterName: 'Jax',
      seed: 884211,
      personality: 'warm-gm',
      engineMode: 'rpg',
    });
    const originState: GameState = {
      ...built,
      engineMode: 'rpg',
      activeEncounter: null,
      roundCombat: undefined,
      character: { ...built.character, origin: undefined },
      openingEstablishment: {
        pending: [],
        answers: { ...(built.openingEstablishment?.answers ?? {}), name: 'Jax' },
        complete: true,
        sceneWritten: true,
      },
    };
    const raw = originPad(originState);
    expect(raw).toBeTruthy();
    expect(raw).toContain(ORIGIN_QUICK_START_CHIP);
    expect(shapeLiveTurnPad(originState, raw!)).toEqual(raw);

    const withPad: GameState = {
      ...originState,
      turn: 1,
      choices: raw!,
      log: [{ id: 'gm-origin', turn: 1, role: 'gm', content: 'Before the road, you choose how you arrived.', timestamp: 0 }],
    };
    const committed = commitOfferedTurn(withPad, 'gm-origin');
    const after = shapeLiveTurnPad(committed, committed.choices ?? raw!);
    expect(after).toEqual(committed.choices ?? raw!);
    expect(after).toContain(ORIGIN_QUICK_START_CHIP);
    expect(applyShapedLivePad(committed, 'gm-origin').choices).toContain(ORIGIN_QUICK_START_CHIP);
  });

  it('a tabletop session-zero creation pad, including Quick start, is left unchanged', () => {
    const { state: built } = buildNewGameState({
      bibleId: 'cursed-keep',
      characterName: 'Jax',
      seed: 884211,
      personality: 'chilled-gm',
      engineMode: 'dnd',
      tabletopCreation: false,
    });
    const opened = beginTabletopCreation({
      ...built,
      character: { ...built.character, srd: undefined },
    });
    expect(tabletopCreationPending(opened)).toBe(true);
    const raw = opened.offeredPad?.choices?.length ? opened.offeredPad.choices : creationChips(opened);
    expect(raw).toContain('Quick start');
    expect(shapeLiveTurnPad(opened, raw)).toEqual(raw);
  });

  it("'Face the threat' and 'Buy …' survive the cap in dnd, litrpg and rpg", () => {
    for (const mode of ['dnd', 'litrpg', 'rpg'] as EngineMode[]) {
      const cap = mode === 'dnd' ? 3 : 4;
      const base = mode === 'dnd' ? dnd() : mode === 'rpg' ? rpg() : lit();
      const location = mode === 'dnd' ? 'Market Square' : mode === 'rpg' ? 'Safehouse Alley' : 'Lowmarket';
      const state: GameState = {
        ...base,
        engineMode: mode,
        currentLocation: location,
        gold: 80,
        turn: 8,
        sceneFacts: {
          ...emptySceneFacts(8),
          present: ['Hale'],
          pendingEncounter: foe({ name: 'Cutpurse', level: 2, hp: 10, maxHp: 10 }),
        },
        npcMemories: [merchantMem(location)],
        log: [{ id: `gm-${mode}`, turn: 8, role: 'gm', content: `Hale keeps a stall in ${location}. A cutpurse is watching.`, timestamp: 0 }],
      };
      const buy = shopChips(state).find((c) => c.kind === 'buy')?.label;
      expect(buy, mode).toMatch(/^Buy /);
      const raw = [
        'Look around',
        'Wait and listen',
        'Search the area',
        'Talk to Hale',
        'Face the threat',
        buy!,
      ];
      const live = declaredOnly(shapeLiveTurnPad(state, raw));
      expect(live.length, `${mode} shapeLiveTurnPad`).toBeLessThanOrEqual(cap);
      expect(live.some((c) => /^Face the threat$/i.test(c)), `${mode} fight`).toBe(true);
      expect(live.some((c) => /^Buy /i.test(c)), `${mode} buy`).toBe(true);

      const withPad: GameState = { ...state, choices: raw, offeredPad: { turn: 8, choices: raw } };
      const committed = commitOfferedTurn(withPad, `gm-${mode}`);
      // If four-slot already dropped fight/shop, reshape the legal over-cap pad the
      // live path would have handed to commit, so post-commit shaping cannot evict them.
      const legalPad = declaredOnly(committed.choices).some((c) => /^Face the threat$/i.test(c))
        && declaredOnly(committed.choices).some((c) => /^Buy /i.test(c))
        ? (committed.choices ?? raw)
        : raw;
      const reshaped = declaredOnly(applyShapedLivePad({ ...committed, choices: legalPad, offeredPad: { turn: 8, choices: legalPad } }, `gm-${mode}`).choices);
      expect(reshaped.length, `${mode} applyShapedLivePad`).toBeLessThanOrEqual(cap);
      expect(reshaped.some((c) => /^Face the threat$/i.test(c)), `${mode} fight after reshape`).toBe(true);
      expect(reshaped.some((c) => /^Buy /i.test(c)), `${mode} buy after reshape`).toBe(true);
    }
  });

  it("a no-resolver 'Travel toward Lowmarket' is dropped, while builder-backed travel, fight and shop are kept at the cap", () => {
    const { state: built } = buildNewGameState({
      bibleId: 'cursed-keep',
      characterName: 'Jax',
      seed: 884211,
      personality: 'chilled-gm',
      engineMode: 'dnd',
      tabletopCreation: true,
    });
    const state: GameState = {
      ...built,
      currentLocation: 'Greyhollow Inn',
      gold: 80,
      turn: 7,
      playPhase: 'live',
      tabletopCreation: built.tabletopCreation ? { ...built.tabletopCreation, stage: 'done' } : undefined,
      sceneFacts: {
        ...emptySceneFacts(7),
        present: ['Hale'],
        pendingEncounter: foe({ name: 'Cutpurse', level: 2, hp: 10, maxHp: 10 }),
      },
      npcMemories: [...(built.npcMemories ?? []), merchantMem('Greyhollow Inn')],
      log: [
        {
          id: 'gm-inn',
          turn: 7,
          role: 'gm',
          content: 'The common room of Greyhollow Inn is quiet. Hale keeps a stall. A cutpurse is watching. The lane toward Greyhollow Church is open.',
          timestamp: 0,
        },
      ],
    };
    const buy = shopChips(state).find((c) => c.kind === 'buy')?.label;
    expect(buy).toMatch(/^Buy /);
    const liveTravel = 'Travel toward Greyhollow Church';
    const deadTravel = 'Travel toward Lowmarket';
    expect(chipKindOf(state, liveTravel), 'builder-backed travel').toBeTruthy();
    expect(chipKindOf(state, 'Face the threat'), 'builder-backed fight').toBeTruthy();
    expect(chipKindOf(state, buy!), 'builder-backed shop').toBeTruthy();
    expect(chipKindOf(state, deadTravel), 'no-resolver travel').toBeNull();

    const raw = [
      'Look around',
      'Wait and listen',
      'Search the area',
      deadTravel,
      liveTravel,
      'Face the threat',
      buy!,
    ];
    const pad = declaredOnly(shapeLiveTurnPad(state, raw));
    expect(pad.length).toBeLessThanOrEqual(3);
    expect(pad.some((c) => /^Travel toward Lowmarket$/i.test(c))).toBe(false);
    expect(pad.some((c) => /^Travel toward Greyhollow Church$/i.test(c))).toBe(true);
    expect(pad.some((c) => /^Face the threat$/i.test(c))).toBe(true);
    expect(pad.some((c) => /^Buy /i.test(c))).toBe(true);
  });

  it('PYOA pads are left alone by shapeLiveTurnPad', () => {
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
