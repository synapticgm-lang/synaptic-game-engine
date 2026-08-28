/**
 * Playtest Wave 2 (B023-B025) — NPC role obligations, hub beat caps, PYOA convergence
 * HUD stamp: 2026-08-30a
 */

import { describe, it, expect } from 'vitest';
import type { GameState } from './types';
import {
  inferNpcRole,
  trackNpcRoleObligation,
  checkNpcRoleDeadlines,
  formatNpcExitMandate,
} from './npcTopicFsm';
import {
  classifyHubGate,
  recordHubBeat,
  isHubBeatCapped,
  shouldForceLitrpgHubExit,
} from './choiceCompiler';
import {
  detectBranchConvergence,
  recordBranchConvergence,
  cleanupBranchMemoryAtConvergence,
  formatConvergenceMandate,
} from './pyoaBranchLedger';
import { character, CURRENT_SAVE_VERSION } from './defaults';

function initGameState(bibleId: string, mode: 'litrpg' | 'dnd' | 'rpg' | 'pyoa'): GameState {
  return {
    version: CURRENT_SAVE_VERSION,
    saveId: 'test-save',
    storyName: 'Test Story',
    engineMode: mode,
    campaignBibleId: bibleId,
    lastUpdated: Date.now(),
    character: character,
    inventory: [],
    containers: [],
    materials: [],
    companions: [],
    quests: [],
    shrines: [],
    bestiary: [],
    relationships: [],
    log: [],
    rolls: [],
    turn: 0,
    seed: 'test-seed',
    lorebook: [],
    gold: 100,
    gmStrictness: 'balanced',
    statDisplayMode: 'classic',
    turnFrameTheme: 'default',
  };
}

describe('Wave 2 B023 — NPC role obligations', () => {
  it('infers guide role for opening NPCs', () => {
    const state = initGameState('summoned-pact', 'litrpg');
    const role = inferNpcRole('Pellane', state, 'Talk to Pellane about the Circle');
    expect(role).toBe('guide');
  });

  it('infers merchant role from trade keywords', () => {
    const state = { ...initGameState('hero-awakening', 'litrpg'), turn: 10 };
    const role = inferNpcRole('Trader', state, 'Buy something from the Trader');
    expect(role).toBe('merchant');
  });

  it('tracks NPC role obligations', () => {
    let state = initGameState('summoned-pact', 'litrpg');
    state = trackNpcRoleObligation(state, 'Pellane', 'Talk to Pellane');
    
    const obligations = state.arcDirector?.npcRoleObligations ?? [];
    expect(obligations.length).toBe(1);
    expect(obligations[0].npc).toBe('Pellane');
    expect(obligations[0].role).toBe('guide');
    expect(obligations[0].deadlineTurn).toBe(8); // Guide exits after 8 turns
  });

  it('triggers NPC exits when deadline exceeded', () => {
    let state = initGameState('summoned-pact', 'litrpg');
    state.turn = 0;
    state = trackNpcRoleObligation(state, 'Pellane', 'Talk to Pellane');
    
    state.turn = 9; // Past deadline (8)
    const { exits } = checkNpcRoleDeadlines(state);
    expect(exits).toContain('Pellane');
  });

  it('formats NPC exit mandate', () => {
    const mandate = formatNpcExitMandate(['Pellane', 'Aldous']);
    expect(mandate).toContain('Pellane, Aldous');
    expect(mandate).toContain('exit scene');
  });

  it('satisfies guide role when opening completes', () => {
    let state = initGameState('summoned-pact', 'litrpg');
    state = trackNpcRoleObligation(state, 'Pellane', 'Talk to Pellane');
    
    // Simulate opening completion
    state.openingEstablishment = { complete: true, answers: {}, pending: [] };
    state.turn = 3;
    
    const { exits, state: nextState } = checkNpcRoleDeadlines(state);
    expect(exits.length).toBe(0); // No exit yet, deadline not reached
    
    const obligations = nextState.arcDirector?.npcRoleObligations ?? [];
    expect(obligations[0].satisfied).toBe(true);
  });
});

describe('Wave 2 B024 — Hub beat caps', () => {
  it('classifies hub gate types', () => {
    expect(classifyHubGate('Wait and watch')).toBe('loiter');
    expect(classifyHubGate('Buy from the merchant')).toBe('vendor');
    expect(classifyHubGate('Travel to the harbor')).toBe('travel');
    expect(classifyHubGate('Ask about the quest')).toBe('quest');
  });

  it('records hub beat usage', () => {
    let state = initGameState('summoned-pact', 'litrpg');
    state.currentLocation = 'Harbor Quay';
    state.turn = 10;
    
    state = recordHubBeat(state, 'harbor-quay', 'loiter');
    
    const records = state.arcDirector?.hubBeatRecords ?? [];
    expect(records.length).toBe(1);
    expect(records[0].hubId).toBe('harbor-quay');
    expect(records[0].gateType).toBe('loiter');
    expect(records[0].count).toBe(1);
  });

  it('caps loiter beats at 3', () => {
    let state = initGameState('summoned-pact', 'litrpg');
    state.currentLocation = 'Harbor Quay';
    state.turn = 10;
    
    // Record 3 loiter beats
    state = recordHubBeat(state, 'harbor-quay', 'loiter');
    state.turn = 11;
    state = recordHubBeat(state, 'harbor-quay', 'loiter');
    state.turn = 12;
    state = recordHubBeat(state, 'harbor-quay', 'loiter');
    
    expect(isHubBeatCapped(state, 'harbor-quay', 'loiter')).toBe(true);
  });

  it('forces LitRPG hub exit after loiter threshold', () => {
    let state = initGameState('summoned-pact', 'litrpg');
    state.engineMode = 'litrpg';
    state.currentLocation = 'Harbor Quay';
    state.turn = 50;
    
    // Simulate heavy loitering
    state = recordHubBeat(state, 'harbor-quay', 'loiter');
    state.turn = 51;
    state = recordHubBeat(state, 'harbor-quay', 'loiter');
    state.turn = 52;
    state = recordHubBeat(state, 'harbor-quay', 'loiter');
    state.turn = 53;
    state = recordHubBeat(state, 'harbor-quay', 'loiter');
    
    expect(shouldForceLitrpgHubExit(state)).toBe(true);
  });

  it('does not force exit for non-LitRPG modes', () => {
    let state = initGameState('cursed-keep', 'dnd');
    state.engineMode = 'dnd';
    state.currentLocation = 'Main Hall';
    state.turn = 50;
    
    // Simulate loitering
    state = recordHubBeat(state, 'main-hall', 'loiter');
    state.turn = 51;
    state = recordHubBeat(state, 'main-hall', 'loiter');
    state.turn = 52;
    state = recordHubBeat(state, 'main-hall', 'loiter');
    state.turn = 53;
    state = recordHubBeat(state, 'main-hall', 'loiter');
    
    expect(shouldForceLitrpgHubExit(state)).toBe(false);
  });
});

describe('Wave 2 B025 — PYOA branch convergence', () => {
  it('detects convergence when branches reach same quest stage', () => {
    let state = initGameState('vesper-glass-cipher', 'pyoa');
    state.engineMode = 'pyoa';
    state.turn = 20;
    state.currentLocation = 'Convergence Point';
    state.pyoaBranchLedger = {
      activeBranch: 'ally-path',
      branchLocked: 'ally-path',
      committedPaths: ['fork:ally-path', 'locked:ally-path', 'ally-path:commit', 'trust-event'],
      branchClosed: true,
    };
    
    // Simulate reaching a convergence quest
    state.quests = [{
      id: 'vesper-conclusion',
      title: 'The Vesper Conclusion',
      description: 'Final convergence',
      status: 'active',
      type: 'main',
      revealed: true,
    }];
    
    const { converged, convergencePoint } = detectBranchConvergence(state);
    expect(converged).toBe(true);
    expect(convergencePoint).toBeDefined();
    expect(convergencePoint?.branches).toContain('ally-path');
  });

  it('records convergence points', () => {
    let state = initGameState('vesper-glass-cipher', 'pyoa');
    state.engineMode = 'pyoa';
    state.turn = 20;
    
    const convergencePoint = {
      turn: 20,
      branches: ['ally-path', 'solo-road'],
      stateHash: 'abc123',
    };
    
    state = recordBranchConvergence(state, convergencePoint);
    
    const points = state.pyoaBranchLedger?.convergencePoints ?? [];
    expect(points.length).toBe(1);
    expect(points[0].stateHash).toBe('abc123');
  });

  it('cleans up branch memory at convergence', () => {
    let state = initGameState('vesper-glass-cipher', 'pyoa');
    state.engineMode = 'pyoa';
    state.turn = 20;
    state.currentLocation = 'Convergence Point';
    state.pyoaBranchLedger = {
      activeBranch: 'ally-path',
      branchLocked: 'ally-path',
      committedPaths: ['fork:ally-path', 'locked:ally-path', 'ally-path:commit', 'old-path-1', 'old-path-2', 'old-path-3'],
      branchClosed: true,
    };
    
    state.quests = [{
      id: 'vesper-conclusion',
      title: 'The Vesper Conclusion',
      description: 'Final convergence',
      status: 'active',
      type: 'main',
      revealed: true,
    }];
    
    state = cleanupBranchMemoryAtConvergence(state);
    
    // Branch should be unlocked after convergence
    expect(state.pyoaBranchLedger?.branchLocked).toBe(false);
    expect(state.pyoaBranchLedger?.branchClosed).toBe(false);
    
    // Paths should be cleaned up
    const paths = state.pyoaBranchLedger?.committedPaths ?? [];
    expect(paths.length).toBeLessThan(16);
    expect(paths.some((p: string) => p.startsWith('convergence:'))).toBe(true);
  });

  it('formats convergence mandate', () => {
    let state = initGameState('vesper-glass-cipher', 'pyoa');
    state.engineMode = 'pyoa';
    state.currentLocation = 'Convergence Point';
    state.pyoaBranchLedger = {
      activeBranch: 'ally-path',
      branchLocked: 'ally-path',
      committedPaths: ['fork:ally-path', 'locked:ally-path'],
      branchClosed: true,
    };
    
    state.quests = [{
      id: 'vesper-conclusion',
      title: 'Convergence',
      status: 'active',
      type: 'main',
      revealed: true,
    }];
    
    const mandate = formatConvergenceMandate(state);
    expect(mandate).toContain('CONVERGENCE');
    expect(mandate).toContain('ally-path');
  });

  it('does not detect convergence without locked branch', () => {
    let state = initGameState('vesper-glass-cipher', 'pyoa');
    state.engineMode = 'pyoa';
    state.turn = 5;
    state.pyoaBranchLedger = {
      activeBranch: 'none',
      committedPaths: [],
      branchClosed: false,
    };
    
    const { converged } = detectBranchConvergence(state);
    expect(converged).toBe(false);
  });
});

describe('Wave 2 integration', () => {
  it('Wave 2 checks do not break existing saves', () => {
    // Old save without Wave 2 fields
    const oldSave = initGameState('summoned-pact', 'litrpg');
    delete (oldSave as any).arcDirector;
    delete (oldSave as any).pyoaBranchLedger;
    
    // Should not crash
    const { exits } = checkNpcRoleDeadlines(oldSave);
    expect(exits.length).toBe(0);
    
    expect(shouldForceLitrpgHubExit(oldSave)).toBe(false);
    
    const { converged } = detectBranchConvergence(oldSave);
    expect(converged).toBe(false);
  });

  it('Wave 2 integrates with quality governance', () => {
    let state = initGameState('summoned-pact', 'litrpg');
    state.turn = 10;
    state.currentLocation = 'Harbor Quay';
    
    // Track NPC
    state = trackNpcRoleObligation(state, 'Pellane', 'Talk to Pellane');
    
    // Record hub beat
    state = recordHubBeat(state, 'harbor-quay', 'loiter');
    
    expect(state.arcDirector?.npcRoleObligations?.length).toBe(1);
    expect(state.arcDirector?.hubBeatRecords?.length).toBe(1);
  });
});
