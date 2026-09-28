/**
 * WS-5 Waves B-D Integration Tests
 */

import { describe, it, expect } from 'vitest';
import {
  isEndingEligible,
  getEligibleEndings,
  enforceT150Deadline,
  commitEnding,
  validateEndingCatalog,
  THORNFERRY_ENDINGS,
} from './pyoaEndingGates';
import type { GameState } from './types';

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
