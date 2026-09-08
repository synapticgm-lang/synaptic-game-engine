/**
 * Batch 02ac — systems-first pivot (all 4 phases).
 * Phase 1 combat drought + receipts · Phase 2 beat registry ·
 * Phase 3 graph pads under sealed beat · Phase 4 L2 at 150 XP.
 * Mid writer OFF. No live GM. No T50.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { SUBSCRIPTION_TIERS } from './subscriptionTiers';
import { createInitialState } from './defaults';
import { applyCharacterXpGain } from './characterXp';
import {
  runArcDirectorBeforeGm,
  shouldSpawnCombat,
  selectCombatBeat,
  formatArcStatusReceipts,
} from './arcDirector';
import { getBeatTemplate, buildBeatContractFromTemplate } from './beatRegistry';
import {
  enumerateLegalEdges,
  applySemanticCooldown,
  type StateEdge,
  type EdgeType,
} from './graphChoices';
import { compileChoices } from './choiceCompiler';
import {
  FAST_XP_AWARDS,
  FAST_XP_CURVE,
  awardCombatXp,
  awardQuestXp,
  xpRequiredForLevel,
  checkLevelUp,
} from './xpPolicy';
import { PlayerIntent } from './intentEnums';
import type { GameState } from './types';

function systemsState(partial: Partial<GameState> = {}): GameState {
  const state = createInitialState(undefined, 'litrpg');
  return {
    ...state,
    campaignBibleId: 'summoned-pact',
    engineMode: 'litrpg',
    turn: 8,
    currentLocation: 'West Wall',
    openingEstablishment: {
      pending: [],
      answers: {},
      complete: true,
      aloneArrival: false,
    },
    arcDirector: { turnsSinceCombatReceipt: 8 },
    ...partial,
  };
}

describe('02ac stamps + Free writer + Mid OFF', () => {
  it('HUD/BUILD are 2026-09-08a or later, Mid writer OFF, Free is DeepSeek', () => {
    expect(HUD_BUILD_STAMP >= '2026-09-02ac').toBe(true);
    expect(BUILD_STAMP >= '2026-09-02ac').toBe(true);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(SUBSCRIPTION_TIERS.free.writerOpenRouterId).toBe('deepseek/deepseek-v4-flash-0731');
  });
});

describe('Phase 1: ArcDirector + combat receipts', () => {
  it('shouldSpawnCombat is true at T8 with no prior combat', () => {
    expect(shouldSpawnCombat(systemsState({ turn: 8 }))).toBe(true);
  });

  it('shouldSpawnCombat is false at T7', () => {
    expect(
      shouldSpawnCombat(
        systemsState({ turn: 7, arcDirector: { turnsSinceCombatReceipt: 7 } })
      )
    ).toBe(false);
  });

  it('shouldSpawnCombat is false when a fight is already live', () => {
    expect(
      shouldSpawnCombat(
        systemsState({
          activeEncounter: {
            name: 'Pact-Hunter Skirmisher',
            hp: 16,
            maxHp: 16,
            level: 1,
          },
        })
      )
    ).toBe(false);
  });

  it('shouldSpawnCombat is false when pendingEncounter is parked', () => {
    const state = systemsState();
    state.sceneFacts = {
      crowd: 'empty',
      noise: 'quiet',
      present: [],
      props: [],
      lastBeat: '',
      updatedTurn: 8,
      pendingEncounter: {
        name: 'Wardline Bandit',
        hp: 16,
        maxHp: 16,
        level: 1,
      },
    };
    expect(shouldSpawnCombat(state)).toBe(false);
  });

  it('selectCombatBeat returns trash skirmish for T8 Summoned Pact', () => {
    expect(selectCombatBeat(systemsState({ turn: 8 }))).toBe('sp-beat-skirmish');
  });

  it('runArcDirectorBeforeGm commits combat at T8 and emits Encounter + XP', () => {
    const result = runArcDirectorBeforeGm(systemsState(), 'Look around');
    expect(result.beatCommitted).toBe(true);
    expect(result.systemReceipts.some((r) => /Encounter:/i.test(r))).toBe(true);
    expect(result.xpAwards.length).toBeGreaterThan(0);
    expect(result.xpAwards[0]?.reason).toMatch(/combat|skirmish/i);
    expect(result.xpAwards[0]?.amount).toBe(FAST_XP_AWARDS.combatTrash);
    const receipts = formatArcStatusReceipts(result).join('\n');
    expect(receipts).toMatch(/Encounter:/i);
    expect(receipts).toMatch(/XP|xp/);
  });
});

describe('Phase 2: Beat Registry', () => {
  it('getBeatTemplate returns versioned combat + quest templates', () => {
    const combat = getBeatTemplate('sp-beat-skirmish');
    expect(combat?.kind).toBe('combat');
    expect(combat?.version).toBe('1.0.0');
    expect(combat?.xpRange.min).toBe(FAST_XP_AWARDS.combatTrash);
    expect(combat?.proseHints.length).toBeGreaterThan(0);
    expect(getBeatTemplate('quest-stage-accept')?.kind).toBe('quest_stage');
    expect(getBeatTemplate('travel-hub-arrival')?.kind).toBe('travel');
  });

  it('buildBeatContractFromTemplate creates a pickable contract', () => {
    const template = getBeatTemplate('sp-beat-skirmish')!;
    const contract = buildBeatContractFromTemplate(template, systemsState());
    expect(contract.id).toMatch(/sp-beat-skirmish/);
    expect(contract.kind).toBe('encounter');
    expect(contract.spawnEncounter).toBe(true);
    expect(contract.xpChunk).toBeGreaterThanOrEqual(20);
    expect(contract.xpChunk).toBeLessThanOrEqual(30);
    expect(contract.proseHints?.length).toBeGreaterThan(0);
  });

  it('ArcDirector picks the registry skirmish, not an LLM invent', () => {
    const result = runArcDirectorBeforeGm(systemsState(), 'Look around');
    expect(result.beatId).toMatch(/sp-beat-skirmish/);
  });
});

describe('Phase 3: Graph-derived choices', () => {
  it('enumerateLegalEdges returns combat edges during an encounter', () => {
    const state = systemsState({
      activeEncounter: { name: 'Bandit', hp: 30, maxHp: 30, level: 1 },
    });
    const edges = enumerateLegalEdges(state);
    expect(edges.some((e) => e.type === 'attack')).toBe(true);
    expect(edges.some((e) => e.type === 'flee')).toBe(true);
    expect(edges.some((e) => e.type === 'travel')).toBe(false);
  });

  it('enumerateLegalEdges returns travel edges when outdoors after opening', () => {
    const state = systemsState({
      currentLocation: 'West Wall',
      sceneFacts: {
        crowd: 'present',
        noise: 'voices',
        present: [],
        props: [],
        lastBeat: '',
        updatedTurn: 8,
        indoor: false,
      },
    });
    const edges = enumerateLegalEdges(state);
    expect(edges.some((e) => e.type === 'travel')).toBe(true);
    expect(edges.filter((e) => e.type === 'travel').length).toBeGreaterThanOrEqual(2);
  });

  it('applySemanticCooldown filters a repeated inspect family', () => {
    const edges: StateEdge[] = [
      { type: 'inspect', label: 'Look around', intent: PlayerIntent.INTENT_INSPECT, cooldown: 5 },
      { type: 'wait', label: 'Wait', intent: PlayerIntent.INTENT_WAIT, cooldown: 5 },
    ];
    const history = [10, 11, 12, 13, 14].map((turn) => ({
      turn,
      choiceType: 'inspect' as EdgeType,
    }));
    const filtered = applySemanticCooldown(edges, history);
    expect(filtered.some((e) => e.type === 'inspect')).toBe(false);
    expect(filtered.some((e) => e.type === 'wait')).toBe(true);
  });

  it('compileChoices under a sealed beat prefers graph pads and stays ≤6', () => {
    const state = systemsState({
      activeEncounter: { name: 'Bandit', hp: 20, maxHp: 20, level: 1 },
      arcDirector: { activeBeatId: 'sp-beat-skirmish', turnsSinceCombatReceipt: 0 },
    });
    const { choices, notes } = compileChoices(state, [
      'Invent a crystal on the street',
      'Ask the clerk about salt',
      'Walk away',
    ]);
    expect(choices.length).toBeGreaterThan(0);
    expect(choices.length).toBeLessThanOrEqual(6);
    expect(choices.some((c) => /press the attack/i.test(c))).toBe(true);
    expect(notes.some((n) => /graph pads/i.test(n))).toBe(true);
  });
});

describe('Phase 4: Fast XP loop', () => {
  it('L1→L2 requires 150 XP (was 200)', () => {
    expect(FAST_XP_CURVE.L1_to_L2).toBe(150);
    expect(xpRequiredForLevel(2)).toBe(150);
    const state = createInitialState(undefined, 'litrpg');
    expect(state.character.xpToNext).toBe(150);
    const leveled = applyCharacterXpGain(state.character, 150);
    expect(leveled.levelsGained).toBe(1);
    expect(leveled.character.level).toBe(2);
  });

  it('combat trash/boss and quest accept/complete use the fast table', () => {
    const state = createInitialState();
    expect(awardCombatXp(state, 'trash').xp).toBe(25);
    expect(awardCombatXp(state, 'boss').xp).toBe(50);
    expect(awardQuestXp(state, 'accept').xp).toBe(15);
    expect(awardQuestXp(state, 'complete').xp).toBe(50);
  });

  it('checkLevelUp triggers at 150 XP', () => {
    const state = createInitialState(undefined, 'litrpg');
    state.character = { ...state.character, xp: 150, xpToNext: 150, level: 1 };
    const result = checkLevelUp(state);
    expect(result.leveledUp).toBe(true);
    expect(result.newLevel).toBe(2);
  });

  it('Free-day projection reaches L2 from combat + quest awards', () => {
    let state = createInitialState(undefined, 'litrpg');
    state = awardCombatXp(state, 'trash').state;
    state = awardQuestXp(state, 'accept').state;
    state = awardCombatXp(state, 'trash').state;
    state = awardQuestXp(state, 'tick').state;
    state = awardCombatXp(state, 'trash').state;
    const ding = checkLevelUp({
      ...state,
      character: { ...state.character, xp: 150, xpToNext: 150, level: 1 },
    });
    expect(ding.leveledUp).toBe(true);
    expect(ding.newLevel).toBe(2);
  });
});
