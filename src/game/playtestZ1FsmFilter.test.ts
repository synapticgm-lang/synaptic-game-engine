/**
 * Batch Z Milestone 2 — Z-1 FSM Pad Filtering Debug Test
 * Validates that travel pads are blocked when pendingEncounter exists.
 */

import { describe, it, expect } from 'vitest';
import { compileChoices } from './choiceCompiler';
import { createInitialState } from './defaults';
import type { GameState } from './types';

describe('Z-1 FSM Pad Filtering', () => {
  it('blocks travel pads when pendingEncounter exists', () => {
    const state: GameState = {
      ...createInitialState('litrpg'),
      turn: 19,
      currentLocation: 'Lowmarket',
      sceneFacts: {
        pendingEncounter: {
          name: 'Pact-Hunter Skirmisher',
          hp: 16,
          maxHp: 16,
          xpReward: 25,
        },
        present: ['Lowmarket Fence'],
        crowd: 'present',
      },
      campaignBibleId: 'summoned-pact',
    };

    // Simulate choices that include travel pads
    const rawChoices = [
      'Press the attack',
      'Try to flee',
      'Ask the Lowmarket Fence what they want',
      'Travel toward West Wall',
      'Travel toward Sevenfold Circle',
      'Inspect the area',
    ];

    const { choices, notes } = compileChoices(state, rawChoices, undefined, 'talk to fence');

    // Travel pads should be filtered out
    expect(choices).not.toContain('Travel toward West Wall');
    expect(choices).not.toContain('Travel toward Sevenfold Circle');
    
    // Should have travel filter notes (either FSM or yo-yo lock)
    const travelFilterNotes = notes.filter(n => 
      n.includes('FSM') || 
      n.includes('pending-enc') || 
      n.includes('Travel yo-yo lock')
    );
    expect(travelFilterNotes.length).toBeGreaterThan(0);
    
    // Combat pads should remain
    expect(choices.some(c => /press the attack|flee|ask/i.test(c))).toBe(true);
  });

  it('blocks travel pads when activeEncounter exists', () => {
    const state: GameState = {
      ...createInitialState('litrpg'),
      turn: 19,
      currentLocation: 'Lowmarket',
      activeEncounter: {
        name: 'Pact-Hunter Skirmisher',
        hp: 8,
        maxHp: 16,
        xpReward: 25,
        phase: 'engaged',
        startedTurn: 9,
        engagedTurnCount: 3,
        failedFleeCount: 0,
        failedParleyCount: 0,
        maxEngagedTurns: 8,
        maxFailedFlee: 2,
        maxFailedParley: 1,
        encounterId: 'enc-9-pact-hunter',
      },
      sceneFacts: {
        present: ['Lowmarket Fence'],
        crowd: 'present',
      },
      campaignBibleId: 'summoned-pact',
    };

    const rawChoices = [
      'Press the attack',
      'Try to flee',
      'Travel toward West Wall',
      'Inspect the area',
    ];

    const { choices, notes } = compileChoices(state, rawChoices, undefined, 'attack');

    // Travel pads should be filtered out
    expect(choices).not.toContain('Travel toward West Wall');
    
    // Should have travel filter notes (either FSM or encounter lock)
    const travelFilterNotes = notes.filter(n => 
      n.includes('FSM') || 
      n.includes('combat drop travel') ||
      n.includes('Travel yo-yo lock') ||
      n.includes('Encounter lock')
    );
    expect(travelFilterNotes.length).toBeGreaterThan(0);
    
    // Combat pads should remain
    expect(choices).toContain('Press the attack');
  });

  it('allows travel pads when no encounter exists', () => {
    const state: GameState = {
      ...createInitialState('litrpg'),
      turn: 5,
      currentLocation: 'Lowmarket',
      sceneFacts: {
        present: ['Lowmarket Fence'],
        crowd: 'present',
      },
      campaignBibleId: 'summoned-pact',
    };

    const rawChoices = [
      'Talk to the Lowmarket Fence',
      'Travel toward West Wall',
      'Inspect the area',
    ];

    const { choices } = compileChoices(state, rawChoices, undefined, 'look around');

    // Travel pads should be allowed
    expect(choices.some(c => /travel toward/i.test(c))).toBe(true);
  });
});
