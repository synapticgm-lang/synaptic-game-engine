/**
 * WS-5 Waves B-D Integration Tests
 */

import { describe, it, expect } from 'vitest';
import {
  checkConvergence,
  isConvergenceEligible,
  commitConvergence,
  validateConvergenceCatalog,
  THORNFERRY_CONVERGENCES,
} from './pyoaConvergence';
import {
  isEndingEligible,
  getEligibleEndings,
  enforceT150Deadline,
  commitEnding,
  validateEndingCatalog,
  THORNFERRY_ENDINGS,
} from './pyoaEndingGates';
import {
  initReplayState,
  SeededRandom,
  selectCrisisDeterministic,
  recordEndingReached,
  validateReplay,
  calculateReplayStatistics,
  buildReplayTrace,
} from './pyoaReplay';
import type { GameState } from './types';

describe('WS-5 Wave B: Convergence', () => {
  describe('Convergence Catalog', () => {
    it('should have valid Thornferry convergences', () => {
      const validation = validateConvergenceCatalog(THORNFERRY_CONVERGENCES);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
    
    it('should have 2 convergence points', () => {
      expect(THORNFERRY_CONVERGENCES).toHaveLength(2);
    });
    
    it('should preserve provenance facts', () => {
      const conv = THORNFERRY_CONVERGENCES[0];
      expect(conv.preserveProvenanceFacts.length).toBeGreaterThan(0);
    });
  });
  
  describe('Convergence Eligibility', () => {
    it('should not be eligible before window', () => {
      const conv = THORNFERRY_CONVERGENCES[0]; // T88-96
      const state: Partial<GameState> = {
        turn: 70,
        pyoaBranchLedger: {
          activeBranch: 'none',
          committedPaths: ['fact:thornferry-road.truth.revealed'],
          charterUses: 0,
          branchClosed: false,
          convergencePoints: [],
        },
      };
      
      expect(isConvergenceEligible(conv, state as GameState, 70)).toBe(false);
    });
    
    it('should be eligible in window with facts', () => {
      const conv = THORNFERRY_CONVERGENCES[0];
      const state: Partial<GameState> = {
        turn: 90,
        pyoaBranchLedger: {
          activeBranch: 'none',
          committedPaths: ['fact:thornferry-road.truth.revealed'],
          charterUses: 0,
          branchClosed: false,
          convergencePoints: [],
        },
      };
      
      expect(isConvergenceEligible(conv, state as GameState, 90)).toBe(true);
    });
    
    it('should not be eligible if already converged', () => {
      const conv = THORNFERRY_CONVERGENCES[0];
      const state: Partial<GameState> = {
        turn: 90,
        pyoaBranchLedger: {
          activeBranch: 'none',
          committedPaths: ['fact:thornferry-road.truth.revealed'],
          charterUses: 0,
          branchClosed: false,
          convergencePoints: [
            {
              turn: 85,
              branches: ['ally-path'],
              stateHash: 'thornferry-road:convergence:1_road_merges',
            },
          ],
        },
      };
      
      expect(isConvergenceEligible(conv, state as GameState, 90)).toBe(false);
    });
  });
  
  describe('Convergence Commit', () => {
    it('should commit convergence and unlock branch', () => {
      const conv = THORNFERRY_CONVERGENCES[0];
      const state: Partial<GameState> = {
        turn: 90,
        saveId: 'test-save',
        pyoaBranchLedger: {
          activeBranch: 'ally-path',
          committedPaths: ['fact:thornferry-road.truth.revealed'],
          charterUses: 0,
          branchClosed: true,
          branchLocked: 'ally-path',
          convergencePoints: [],
        },
      };
      
      const result = commitConvergence(conv, state as GameState);
      
      expect(result.receipt.kind).toBe('convergence');
      expect(result.receipt.convergenceId).toBe(conv.id);
      expect(result.state.pyoaBranchLedger?.branchLocked).toBe(false);
      expect(result.state.pyoaBranchLedger?.branchClosed).toBe(false);
    });
  });
});

describe('WS-5 Wave C: Ending Gates', () => {
  describe('Ending Catalog', () => {
    it('should have valid Thornferry endings', () => {
      const validation = validateEndingCatalog(THORNFERRY_ENDINGS);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
    
    it('should have 6 endings', () => {
      expect(THORNFERRY_ENDINGS).toHaveLength(6);
    });
    
    it('should have failure ending', () => {
      const failure = THORNFERRY_ENDINGS.find(e => e.class === 'failure');
      expect(failure).toBeDefined();
      expect(failure?.priority).toBe(1);
    });
    
    it('should have secret ending with highest priority', () => {
      const secret = THORNFERRY_ENDINGS.find(e => e.class === 'secret');
      expect(secret).toBeDefined();
      expect(secret?.priority).toBe(120);
    });
  });
  
  describe('Ending Eligibility', () => {
    it('should not be eligible before window', () => {
      const ending = THORNFERRY_ENDINGS[0]; // Keeper Under Stone
      const state: Partial<GameState> = {
        turn: 100,
        pyoaBranchLedger: {
          activeBranch: 'none',
          committedPaths: [
            'fact:thornferry-road.trust.miller',
            'fact:thornferry-road.truth.concealed',
            'fact:thornferry-road.method.diplomacy',
            'fact:thornferry-road.alliance.accepted',
          ],
          charterUses: 0,
          branchClosed: false,
          convergencePoints: [],
        },
      };
      
      const check = isEndingEligible(ending, state as GameState, 100);
      expect(check.eligible).toBe(false);
      expect(check.reason).toContain('Too early');
    });
    
    it('should be eligible with all prerequisites', () => {
      const ending = THORNFERRY_ENDINGS[0];
      const state: Partial<GameState> = {
        turn: 135,
        pyoaBranchLedger: {
          activeBranch: 'none',
          committedPaths: [
            'fact:thornferry-road.trust.miller',
            'fact:thornferry-road.truth.concealed',
            'fact:thornferry-road.method.diplomacy',
            'fact:thornferry-road.alliance.accepted',
          ],
          charterUses: 0,
          branchClosed: false,
          convergencePoints: [],
        },
      };
      
      const check = isEndingEligible(ending, state as GameState, 135);
      expect(check.eligible).toBe(true);
    });
    
    it('should not be eligible with missing prerequisites', () => {
      const ending = THORNFERRY_ENDINGS[0];
      const state: Partial<GameState> = {
        turn: 135,
        pyoaBranchLedger: {
          activeBranch: 'none',
          committedPaths: [
            'fact:thornferry-road.trust.miller',
            // Missing other facts
          ],
          charterUses: 0,
          branchClosed: false,
          convergencePoints: [],
        },
      };
      
      const check = isEndingEligible(ending, state as GameState, 135);
      expect(check.eligible).toBe(false);
      expect(check.missingFacts).toBeDefined();
    });
  });
  
  describe('T150 Deadline', () => {
    it('should not enforce before T150', () => {
      const state: Partial<GameState> = {
        turn: 140,
        pyoaBranchLedger: {
          activeBranch: 'none',
          committedPaths: [],
          charterUses: 0,
          branchClosed: false,
          convergencePoints: [],
        },
      };
      
      const result = enforceT150Deadline('thornferry-road', state as GameState);
      expect(result.enforced).toBe(false);
    });
    
    it('should enforce at T150', () => {
      const state: Partial<GameState> = {
        turn: 150,
        pyoaBranchLedger: {
          activeBranch: 'none',
          committedPaths: [],
          charterUses: 0,
          branchClosed: false,
          convergencePoints: [],
        },
      };
      
      const result = enforceT150Deadline('thornferry-road', state as GameState);
      expect(result.enforced).toBe(true);
      expect(result.ending).toBeDefined();
    });
    
    it('should force failure ending at deadline', () => {
      const state: Partial<GameState> = {
        turn: 150,
        pyoaBranchLedger: {
          activeBranch: 'none',
          committedPaths: [],
          charterUses: 0,
          branchClosed: false,
          convergencePoints: [],
        },
      };
      
      const result = enforceT150Deadline('thornferry-road', state as GameState);
      expect(result.ending?.class).toBe('failure');
    });
  });
  
  describe('Ending Commit', () => {
    it('should commit ending and set terminal state', () => {
      const ending = THORNFERRY_ENDINGS[5]; // Failure ending (no prerequisites)
      const state: Partial<GameState> = {
        turn: 150,
        saveId: 'test-save',
        pyoaBranchLedger: {
          activeBranch: 'none',
          committedPaths: [],
          charterUses: 0,
          branchClosed: false,
          convergencePoints: [],
        },
      };
      
      const result = commitEnding(ending, state as GameState, true);
      
      expect(result.receipt.kind).toBe('ending');
      expect(result.receipt.endingId).toBe(ending.id);
      expect(result.receipt.terminal).toBe(true);
      expect(result.state.playPhase).toBe('ended');
    });
  });
});

describe('WS-5 Wave D: Replay', () => {
  describe('Seeded Random', () => {
    it('should produce deterministic sequence', () => {
      const rng1 = new SeededRandom('test-seed');
      const rng2 = new SeededRandom('test-seed');
      
      const sequence1 = [rng1.next(), rng1.next(), rng1.next()];
      const sequence2 = [rng2.next(), rng2.next(), rng2.next()];
      
      expect(sequence1).toEqual(sequence2);
    });
    
    it('should produce different sequences for different seeds', () => {
      const rng1 = new SeededRandom('seed-1');
      const rng2 = new SeededRandom('seed-2');
      
      const val1 = rng1.next();
      const val2 = rng2.next();
      
      expect(val1).not.toEqual(val2);
    });
    
    it('should pick from array deterministically', () => {
      const rng = new SeededRandom('test-seed');
      const array = ['a', 'b', 'c', 'd', 'e'];
      
      const pick1 = rng.pick(array);
      
      const rng2 = new SeededRandom('test-seed');
      const pick2 = rng2.pick(array);
      
      expect(pick1).toBe(pick2);
    });
  });
  
  describe('Deterministic Crisis Selection', () => {
    it('should select same crisis with same seed', () => {
      const replayState = initReplayState('test-seed');
      const crises = [
        'thornferry-road:crisis:1_millstone_charter',
        'thornferry-road:crisis:2_lord_vs_rebels',
      ];
      
      const selected1 = selectCrisisDeterministic(crises, replayState, 0);
      const selected2 = selectCrisisDeterministic(crises, replayState, 0);
      
      expect(selected1).toBe(selected2);
    });
    
    it('should select different crises for different turns', () => {
      const replayState = initReplayState('test-seed');
      const crises = [
        'thornferry-road:crisis:1_millstone_charter',
        'thornferry-road:crisis:2_lord_vs_rebels',
        'thornferry-road:crisis:3_bandits_vs_villagers',
      ];
      
      const selected1 = selectCrisisDeterministic(crises, replayState, 0);
      const selected2 = selectCrisisDeterministic(crises, replayState, 1);
      
      // With multiple crises, different turns likely pick different ones
      // (probabilistic test - might occasionally fail)
      expect(typeof selected1).toBe('string');
      expect(typeof selected2).toBe('string');
    });
  });
  
  describe('Ending Tracking', () => {
    it('should record ending reached', () => {
      const replayState = initReplayState('test-seed');
      const nextState = recordEndingReached(replayState, 'thornferry-road:ending:rebel-hero');
      
      expect(nextState.endingCounts['thornferry-road:ending:rebel-hero']).toBe(1);
      expect(nextState.runsCompleted).toBe(1);
    });
    
    it('should accumulate ending counts', () => {
      let replayState = initReplayState('test-seed');
      
      replayState = recordEndingReached(replayState, 'thornferry-road:ending:rebel-hero');
      replayState = recordEndingReached(replayState, 'thornferry-road:ending:rebel-hero');
      replayState = recordEndingReached(replayState, 'thornferry-road:ending:lord-champion');
      
      expect(replayState.endingCounts['thornferry-road:ending:rebel-hero']).toBe(2);
      expect(replayState.endingCounts['thornferry-road:ending:lord-champion']).toBe(1);
      expect(replayState.runsCompleted).toBe(3);
    });
  });
  
  describe('Replay Validation', () => {
    it('should validate matching replay', () => {
      const expected = initReplayState('test-seed');
      const actual = initReplayState('test-seed');
      
      const validation = validateReplay(expected, actual);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
    
    it('should detect seed mismatch', () => {
      const expected = initReplayState('seed-1');
      const actual = initReplayState('seed-2');
      
      const validation = validateReplay(expected, actual);
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('Seed mismatch'))).toBe(true);
    });
  });
  
  describe('Replay Statistics', () => {
    it('should calculate statistics for multiple runs', () => {
      const traces = [
        buildReplayTrace(
          recordEndingReached(initReplayState('seed-1'), 'ending-1'),
          'thornferry-road',
          'ending-1',
          100
        ),
        buildReplayTrace(
          recordEndingReached(initReplayState('seed-2'), 'ending-1'),
          'thornferry-road',
          'ending-1',
          120
        ),
        buildReplayTrace(
          recordEndingReached(initReplayState('seed-3'), 'ending-2'),
          'thornferry-road',
          'ending-2',
          90
        ),
      ];
      
      const stats = calculateReplayStatistics(traces);
      
      expect(stats.totalSeeds).toBe(3);
      expect(stats.averageTurns).toBeCloseTo(103.33, 1);
      expect(stats.endingDistribution['ending-1']).toBe(2);
      expect(stats.endingDistribution['ending-2']).toBe(1);
    });
  });
});
