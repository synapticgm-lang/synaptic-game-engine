/**
 * Batch Z Milestone 2 — Z-1 FSM Pad Filtering Debug Test
 * Validates pad filtering by encounter state (a pending foe is off the page; a live one locks pads).
 */

import { describe, it, expect } from 'vitest';
import { compileChoices } from './choiceCompiler';
import { createInitialState } from './defaults';
import type { GameState } from './types';

describe('Z-1 FSM Pad Filtering', () => {
  // s75 O — a parked foe is off the page: the player may still leave before it arrives.
  it('does not lock travel or offer fight pads while a foe is only pending', () => {
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

    expect(notes.some(n => n.includes('Encounter lock') || n.includes('pending-enc'))).toBe(false);

    // A parked foe is not on the page yet: no fight pads until it goes live
    expect(choices.some(c => /press the attack|try to flee|parley/i.test(c))).toBe(false);
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
