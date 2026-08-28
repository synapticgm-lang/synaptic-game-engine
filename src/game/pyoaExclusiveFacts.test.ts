/**
 * WS-5 Wave B Tests: Exclusive Facts
 */

import { describe, it, expect } from 'vitest';
import {
  EXCLUSIVE_FACT_REGISTRY,
  THORNFERRY_EXCLUSIVE_GROUPS,
  checkFactConflict,
  validateFactWrites,
  validateExactlyOneRequirement,
  evaluatePredicate,
  evaluatePredicateGroup,
  extractFactsFromGameState,
  commitFactWrite,
  validateExclusiveFactInvariants,
} from './pyoaExclusiveFacts';
import type { GameState } from './types';
import type { FactWrite, FactPredicate, PredicateGroup } from './pyoaTypes';

describe('WS-5 Wave B: Exclusive Facts', () => {
  describe('Registry', () => {
    it('should register Thornferry exclusive groups', () => {
      const groups = EXCLUSIVE_FACT_REGISTRY.getAllGroups();
      expect(groups.length).toBeGreaterThanOrEqual(5);
      
      const allegianceGroup = groups.find(g => g.id === 'thornferry-road.allegiance');
      expect(allegianceGroup).toBeDefined();
      expect(allegianceGroup?.members).toHaveLength(3);
    });
    
    it('should map facts to groups', () => {
      const group = EXCLUSIVE_FACT_REGISTRY.getGroupForFact('thornferry-road.allegiance.lord');
      expect(group).toBeDefined();
      expect(group?.id).toBe('thornferry-road.allegiance');
    });
  });
  
  describe('Conflict Detection', () => {
    it('should detect mutex conflict', () => {
      const write: FactWrite = {
        factId: 'thornferry-road.allegiance.rebels',
        value: true,
        visibility: 'known',
      };
      
      const existingFacts = {
        'thornferry-road.allegiance.lord': true,
      };
      
      const conflict = checkFactConflict(write, existingFacts);
      expect(conflict.hasConflict).toBe(true);
      expect(conflict.conflictingFact).toBe('thornferry-road.allegiance.lord');
    });
    
    it('should allow non-conflicting facts', () => {
      const write: FactWrite = {
        factId: 'thornferry-road.allegiance.lord',
        value: true,
        visibility: 'known',
      };
      
      const existingFacts = {
        'thornferry-road.trust.miller': true,
      };
      
      const conflict = checkFactConflict(write, existingFacts);
      expect(conflict.hasConflict).toBe(false);
    });
    
    it('should allow setting false', () => {
      const write: FactWrite = {
        factId: 'thornferry-road.allegiance.rebels',
        value: false,
        visibility: 'known',
      };
      
      const existingFacts = {
        'thornferry-road.allegiance.lord': true,
      };
      
      const conflict = checkFactConflict(write, existingFacts);
      expect(conflict.hasConflict).toBe(false);
    });
  });
  
  describe('Batch Validation', () => {
    it('should validate batch of writes', () => {
      const writes: FactWrite[] = [
        {
          factId: 'thornferry-road.allegiance.lord',
          value: true,
          visibility: 'known',
        },
        {
          factId: 'thornferry-road.trust.miller',
          value: true,
          visibility: 'known',
        },
      ];
      
      const result = validateFactWrites(writes, {});
      expect(result.valid).toBe(true);
      expect(result.conflicts).toHaveLength(0);
    });
    
    it('should detect conflict in batch', () => {
      const writes: FactWrite[] = [
        {
          factId: 'thornferry-road.allegiance.lord',
          value: true,
          visibility: 'known',
        },
        {
          factId: 'thornferry-road.allegiance.rebels',
          value: true,
          visibility: 'known',
        },
      ];
      
      const result = validateFactWrites(writes, {});
      expect(result.valid).toBe(false);
      expect(result.conflicts.length).toBeGreaterThan(0);
    });
  });
  
  describe('Exactly-One Requirement', () => {
    it('should require exactly one after crisis', () => {
      const group = THORNFERRY_EXCLUSIVE_GROUPS[0]; // allegiance group
      
      const validation = validateExactlyOneRequirement(
        group,
        {}, // no facts set
        true // crisis resolved
      );
      
      expect(validation.satisfied).toBe(false);
      expect(validation.reason).toContain('none are set');
    });
    
    it('should accept one fact when crisis resolved', () => {
      const group = THORNFERRY_EXCLUSIVE_GROUPS[0];
      
      const validation = validateExactlyOneRequirement(
        group,
        { 'thornferry-road.allegiance.lord': true },
        true
      );
      
      expect(validation.satisfied).toBe(true);
    });
    
    it('should allow zero facts before crisis', () => {
      const group = THORNFERRY_EXCLUSIVE_GROUPS[0];
      
      const validation = validateExactlyOneRequirement(
        group,
        {},
        false // crisis not resolved
      );
      
      expect(validation.satisfied).toBe(true);
    });
  });
  
  describe('Predicate Evaluation', () => {
    it('should evaluate exists predicate', () => {
      const pred: FactPredicate = {
        factId: 'thornferry-road.allegiance.lord',
        op: 'exists',
      };
      
      expect(evaluatePredicate(pred, { 'thornferry-road.allegiance.lord': true })).toBe(true);
      expect(evaluatePredicate(pred, {})).toBe(false);
    });
    
    it('should evaluate eq predicate', () => {
      const pred: FactPredicate = {
        factId: 'thornferry-road.power',
        op: 'eq',
        value: 10,
      };
      
      expect(evaluatePredicate(pred, { 'thornferry-road.power': 10 })).toBe(true);
      expect(evaluatePredicate(pred, { 'thornferry-road.power': 5 })).toBe(false);
    });
    
    it('should evaluate gte predicate', () => {
      const pred: FactPredicate = {
        factId: 'thornferry-road.power',
        op: 'gte',
        value: 5,
      };
      
      expect(evaluatePredicate(pred, { 'thornferry-road.power': 10 })).toBe(true);
      expect(evaluatePredicate(pred, { 'thornferry-road.power': 3 })).toBe(false);
    });
  });
  
  describe('Predicate Group Evaluation', () => {
    it('should evaluate all predicates', () => {
      const group: PredicateGroup = {
        all: [
          { factId: 'thornferry-road.allegiance.lord', op: 'exists' },
          { factId: 'thornferry-road.trust.miller', op: 'exists' },
        ],
      };
      
      const facts = {
        'thornferry-road.allegiance.lord': true,
        'thornferry-road.trust.miller': true,
      };
      
      expect(evaluatePredicateGroup(group, facts)).toBe(true);
    });
    
    it('should fail if any all predicate fails', () => {
      const group: PredicateGroup = {
        all: [
          { factId: 'thornferry-road.allegiance.lord', op: 'exists' },
          { factId: 'thornferry-road.trust.miller', op: 'exists' },
        ],
      };
      
      const facts = {
        'thornferry-road.allegiance.lord': true,
      };
      
      expect(evaluatePredicateGroup(group, facts)).toBe(false);
    });
    
    it('should evaluate any predicates', () => {
      const group: PredicateGroup = {
        any: [
          { factId: 'thornferry-road.allegiance.lord', op: 'exists' },
          { factId: 'thornferry-road.allegiance.rebels', op: 'exists' },
        ],
      };
      
      const facts = {
        'thornferry-road.allegiance.lord': true,
      };
      
      expect(evaluatePredicateGroup(group, facts)).toBe(true);
    });
    
    it('should evaluate none predicates', () => {
      const group: PredicateGroup = {
        none: [
          { factId: 'thornferry-road.village.abandoned', op: 'exists' },
        ],
      };
      
      const facts = {
        'thornferry-road.village.saved': true,
      };
      
      expect(evaluatePredicateGroup(group, facts)).toBe(true);
    });
  });
  
  describe('Game State Integration', () => {
    it('should extract facts from ledger', () => {
      const state: Partial<GameState> = {
        pyoaBranchLedger: {
          activeBranch: 'ally-path',
          committedPaths: [
            'fact:thornferry-road.allegiance.rebels',
            'locked:ally-path',
          ],
          charterUses: 0,
          branchClosed: false,
          convergencePoints: [],
        },
      };
      
      const facts = extractFactsFromGameState(state as GameState);
      expect(facts['thornferry-road.allegiance.rebels']).toBe(true);
    });
    
    it('should commit fact write to game state', () => {
      const state: Partial<GameState> = {
        pyoaBranchLedger: {
          activeBranch: 'none',
          committedPaths: [],
          charterUses: 0,
          branchClosed: false,
          convergencePoints: [],
        },
      };
      
      const write: FactWrite = {
        factId: 'thornferry-road.allegiance.lord',
        value: true,
        visibility: 'known',
      };
      
      const nextState = commitFactWrite(write, state as GameState);
      expect(nextState.pyoaBranchLedger?.committedPaths).toContain('fact:thornferry-road.allegiance.lord');
    });
    
    it('should validate all invariants', () => {
      const state: Partial<GameState> = {
        pyoaBranchLedger: {
          activeBranch: 'ally-path',
          committedPaths: [
            'fact:thornferry-road.allegiance.lord',
          ],
          charterUses: 0,
          branchClosed: false,
          convergencePoints: [],
        },
      };
      
      const result = validateExclusiveFactInvariants(state as GameState);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
