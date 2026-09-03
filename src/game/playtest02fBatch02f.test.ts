/**
 * Batch 02f — Five P0 fixes from SYNTHESIS-02E-FOUR-MODE-T50
 * 
 * P0-1: Delete crowd empty-claim rewrite (crowdAuthority)
 * P0-2: Fix lowercase deixis rewriting (proseWarden)
 * P0-3: Extend CAST harvest deny-lists (chromeAuthority)
 * P0-4: Reject Han (Chinese) characters (errorRepairWarden)
 * P0-5: PYOA charter resurrection + false-arrival (pyoaBranchLedger + proseWarden)
 */

import { describe, it, expect } from 'vitest';
import { scrubInventedCrowdSize } from './crowdAuthority';
import { scrubUnresolvedDeixisNouns, scrubFalseArrivalWhenHere, scrubDestroyedPyoaItems } from './proseWarden';
import { 
  isChoicePadPersonToken, 
  isRoleContactLabel, 
  isDialogueVerbPersonToken 
} from './chromeAuthority';
import { classifyTurnFailure } from './errorRepairWarden';
import { 
  isPyoaItemDestroyed, 
  recordPyoaBranchChoice, 
  initPyoaBranchLedger,
  eligiblePyoaPadsAfterLock,
} from './pyoaBranchLedger';
import { harvestNarrativeIntoLedger } from './narrativeHarvest';
import { buildEntityCast } from './entityCast';
import { extractChatCompletionText, hasHanScript } from './openRouterChat';
import { applyStructuralEvents } from './structuralEvents';
import { enumerateLegalEdges } from './choiceEdge';
import { ensureTravelArrivalProse } from './outdoorHubs';
import type { GameState } from './types';

describe('Batch 02f — P0-1: Delete crowd empty-claim rewrite', () => {
  it('should NOT rewrite "no one" when crowd is present', () => {
    const input = 'No one answers your call.';
    const result = scrubInventedCrowdSize(input, 2, true);
    // P0-1: Leave "no one" unchanged — do not inject "the two people here"
    expect(result).toBe('No one answers your call.');
  });

  it('should NOT rewrite "nobody" when crowd size is tracked', () => {
    const input = 'Nobody responds to your question.';
    const result = scrubInventedCrowdSize(input, 3, true);
    // P0-1: Leave "nobody" unchanged — do not inject "people still here"
    expect(result).toBe('Nobody responds to your question.');
  });

  it('should still track crowd size but not rewrite empty claims', () => {
    const input = 'The room is empty. No people here.';
    const result = scrubInventedCrowdSize(input, 0, false);
    // P0-1: Empty claims stay when crowd size is 0
    expect(result).toBe('The room is empty. No people here.');
  });

  it('should NOT inject "people still here" filler', () => {
    const input = 'No voices call after you.';
    const result = scrubInventedCrowdSize(input, 4, true);
    // P0-1: No "people still here" injection - empty claims stay or are stripped, never filled
    expect(result).not.toContain('people still here');
  });
});

describe('Batch 02f — P0-2: Fix lowercase deixis rewriting', () => {
  it('should rewrite capitalized deixis patterns correctly', () => {
    // "The Ahead half-hidden" gets caught by half-hidden pattern → "someone"
    const input1 = 'The Ahead half-hidden behind debris.';
    const result1 = scrubUnresolvedDeixisNouns(input1, 'Lowmarket');
    // Pattern matching "X half-hidden" runs first
    expect(result1).toContain('someone half-hidden');
    expect(result1).not.toContain('the Ahead');
  });

  it('should rewrite capitalized "the Ahead" when standalone', () => {
    // When not matched by other patterns, falls through to final pattern
    const input = 'Study the Ahead carefully.';
    const result = scrubUnresolvedDeixisNouns(input, 'Lowmarket');
    expect(result).toContain('the way ahead');
    expect(result).not.toContain('the Ahead');
  });

  it('should NOT rewrite lowercase "the right"', () => {
    const input = 'The right marks, the right blood.';
    const result = scrubUnresolvedDeixisNouns(input, 'Lowmarket');
    // P0-2: Lowercase "the right" stays unchanged (valid English direction)
    expect(result).toBe('The right marks, the right blood.');
  });

  it('should NOT rewrite lowercase "the left"', () => {
    const input = 'Turn to the left and walk forward.';
    const result = scrubUnresolvedDeixisNouns(input, 'Cathedral');
    // P0-2: Lowercase "the left" stays unchanged
    expect(result).toBe('Turn to the left and walk forward.');
  });

  it('should rewrite capitalized deixis in context patterns', () => {
    // "the Right half-hidden" gets caught by half-hidden pattern
    const input = 'Study the Right half-hidden nearby.';
    const result = scrubUnresolvedDeixisNouns(input, 'West Wall');
    expect(result).toContain('someone half-hidden');
    expect(result).not.toContain('the Right');
  });

  it('should rewrite standalone capitalized "the Right"', () => {
    const input = 'Examine the Right closely.';
    const result = scrubUnresolvedDeixisNouns(input, 'West Wall');
    expect(result).toContain('the way ahead');
    expect(result).not.toContain('the Right');
  });

  it('should preserve lowercase directional phrases', () => {
    const input = 'The right path leads forward, the left toward danger.';
    const result = scrubUnresolvedDeixisNouns(input, 'Sevenfold Circle');
    // P0-2: All lowercase directions stay unchanged
    expect(result).toBe('The right path leads forward, the left toward danger.');
  });
});

describe('Batch 02f — P0-3: Extend CAST harvest deny-lists', () => {
  it('should deny "They" as choice-pad person token', () => {
    expect(isChoicePadPersonToken('They')).toBe(true);
    expect(isChoicePadPersonToken('they')).toBe(true);
    expect(isChoicePadPersonToken('THEY')).toBe(true);
  });

  it('should deny "Child" as choice-pad person token', () => {
    expect(isChoicePadPersonToken('Child')).toBe(true);
    expect(isChoicePadPersonToken('child')).toBe(true);
    expect(isChoicePadPersonToken('THE CHILD')).toBe(true);
  });

  it('should deny "They" as role-contact label', () => {
    expect(isRoleContactLabel('They')).toBe(true);
    expect(isRoleContactLabel('they')).toBe(true);
  });

  it('should deny "Child" as role-contact label', () => {
    expect(isRoleContactLabel('Child')).toBe(true);
    expect(isRoleContactLabel('child')).toBe(true);
    expect(isRoleContactLabel('the child')).toBe(true);
  });

  it('should deny "Child" as dialogue-verb person token', () => {
    expect(isDialogueVerbPersonToken('Child')).toBe(true);
    expect(isDialogueVerbPersonToken('child')).toBe(true);
  });

  it('should still allow valid proper names', () => {
    expect(isChoicePadPersonToken('Jax')).toBe(false);
    expect(isChoicePadPersonToken('Silas')).toBe(false);
    expect(isRoleContactLabel('Pellane')).toBe(false);
  });

  it('should deny hub-role compounds with these tokens', () => {
    // They/Child should never be in CAST substitution lists
    expect(isRoleContactLabel('They')).toBe(true);
    expect(isRoleContactLabel('Child')).toBe(true);
  });

  it('does not harvest They / Child into present[]', () => {
    const state = {
      ...({} as GameState),
      saveId: 'cast-deny',
      seed: '42',
      turn: 4,
      engineMode: 'litrpg' as const,
      bibleId: 'summoned-pact',
      character: { name: 'Jax', level: 1, xp: 0, hp: 10, maxHp: 10 },
      inventory: [],
      quests: [],
      sceneFacts: { present: [] as string[] },
    };
    const harvested = harvestNarrativeIntoLedger(
      state,
      'They meet Child at the Lowmarket Fence. Tomas nods.',
      4
    );
    const present = harvested.sceneFacts?.present ?? [];
    expect(present.some((p) => /^they$/i.test(p))).toBe(false);
    expect(present.some((p) => /^child$/i.test(p))).toBe(false);
    expect(present.some((p) => /lowmarket\s+fence/i.test(p))).toBe(false);
  });

  it('does not list They / Child / hub-role compounds in CAST', () => {
    const state = {
      ...({} as GameState),
      saveId: 'cast-block',
      seed: '42',
      turn: 4,
      engineMode: 'litrpg' as const,
      bibleId: 'summoned-pact',
      character: { name: 'Jax', level: 1, xp: 0, hp: 10, maxHp: 10 },
      inventory: [],
      quests: [],
      sceneFacts: { present: ['They', 'Child', 'Lowmarket Fence', 'Tomas'] },
    };
    const cast = buildEntityCast(state);
    expect(cast).not.toMatch(/\bThey\b/);
    expect(cast).not.toMatch(/\bChild\b/);
    expect(cast).not.toMatch(/Lowmarket Fence/);
    expect(cast).toMatch(/Tomas/);
  });
});

describe('Batch 02f — P0-4: Reject Han (Chinese) characters', () => {
  it('should classify Han characters as empty (retryable)', () => {
    const hanMessage = '你好世界 这是中文';
    const error = new Error(hanMessage);
    const kind = classifyTurnFailure(error);
    // P0-4: Han characters → 'empty' → retry same-model → failover to Llama
    expect(kind).toBe('empty');
  });

  it('should classify mixed Han+English as empty', () => {
    const mixed = 'The GM says: 你好 and then some English text';
    const error = new Error(mixed);
    const kind = classifyTurnFailure(error);
    expect(kind).toBe('empty');
  });

  it('should NOT classify pure English as empty', () => {
    const english = 'The GM returned a valid English response.';
    const error = new Error(english);
    const kind = classifyTurnFailure(error);
    expect(kind).not.toBe('empty');
  });

  it('treats Han in extracted GM content as empty', () => {
    expect(hasHanScript('你好世界')).toBe(true);
    expect(
      extractChatCompletionText({
        choices: [{ message: { content: '你好世界 这是中文' } }],
      })
    ).toBe('');
    expect(
      extractChatCompletionText({
        choices: [{ message: { content: 'The door groans.' } }],
      })
    ).toBe('The door groans.');
  });

  it('should detect various Han character ranges', () => {
    // Test different Han characters across the CJK Unified Ideographs block
    const samples = [
      '一二三四五', // Numbers
      '人口日月水火', // Common characters
      '龍鳳麒麟', // Complex characters
      '電話電腦', // Modern terms
    ];
    
    for (const sample of samples) {
      const error = new Error(sample);
      const kind = classifyTurnFailure(error);
      expect(kind).toBe('empty');
    }
  });
});

describe('Batch 02f — P0-5: PYOA charter resurrection', () => {
  const mockState: GameState = {
    saveId: 'test-pyoa-charter',
    seed: '42',
    turn: 10,
    engineMode: 'pyoa',
    bibleId: 'thornferry-road',
    character: { name: 'Wren', level: 1, xp: 0, hp: 10, maxHp: 10 },
    inventory: [],
    quests: [],
    pyoaBranchLedger: initPyoaBranchLedger(),
  };

  it('should track charter destruction from player input', () => {
    const input = 'I burn the charter';
    const result = recordPyoaBranchChoice(mockState, input);
    
    expect(result.pyoaBranchLedger?.destroyedItems).toContain('millstone-charter');
  });

  it('should detect destroyed charter from various phrases', () => {
    const phrases = [
      'burn the Millstone Charter',
      'destroy the charter',
      'discard the millstone charter',
      'throw away the charter',
    ];

    for (const phrase of phrases) {
      const result = recordPyoaBranchChoice(mockState, phrase);
      expect(result.pyoaBranchLedger?.destroyedItems?.length).toBeGreaterThan(0);
    }
  });

  it('should check if charter is destroyed', () => {
    const stateWithDestroyed = recordPyoaBranchChoice(mockState, 'burn the charter');
    
    expect(isPyoaItemDestroyed(stateWithDestroyed, 'millstone-charter')).toBe(true);
    expect(isPyoaItemDestroyed(stateWithDestroyed, 'Millstone Charter')).toBe(true);
    expect(isPyoaItemDestroyed(stateWithDestroyed, 'charter')).toBe(true);
  });

  it('should NOT resurrect charter after destruction', () => {
    const stateWithDestroyed = recordPyoaBranchChoice(mockState, 'burn the charter');
    
    // Destroyed items should persist across turns
    expect(isPyoaItemDestroyed(stateWithDestroyed, 'charter')).toBe(true);
    
    // Further uses should not remove from destroyed list
    const afterUse = recordPyoaBranchChoice(stateWithDestroyed, 'use the charter');
    expect(isPyoaItemDestroyed(afterUse, 'charter')).toBe(true);
  });

  it('strips the charter from inventory and blocks resurrection pads/gains', () => {
    const withKit: GameState = {
      ...mockState,
      inventory: [{ id: 'mc', name: 'Millstone Charter', rarity: 'Common', quantity: 1 }],
    };
    const afterBurn = recordPyoaBranchChoice(withKit, 'burn the Millstone Charter');
    expect(afterBurn.inventory?.some((i) => /charter/i.test(i.name))).toBe(false);
    expect(eligiblePyoaPadsAfterLock(afterBurn, 'Use the Millstone Charter')).toBe(false);
    expect(enumerateLegalEdges(afterBurn).some((e) => /Millstone Charter/i.test(e.label))).toBe(false);

    const gained = applyStructuralEvents(afterBurn, [
      { type: 'item-gain', name: 'Millstone Charter', qty: 1 },
    ]);
    expect(gained.notes.some((n) => /destroyed PYOA item/i.test(n))).toBe(true);
    expect(gained.state.inventory?.some((i) => /charter/i.test(i.name))).toBe(false);

    const prose = scrubDestroyedPyoaItems(
      'You still hold the Millstone Charter. The charter is in your pack.',
      afterBurn.pyoaBranchLedger?.destroyedItems
    );
    expect(prose).not.toMatch(/still hold the Millstone Charter/i);
    expect(prose).not.toMatch(/charter is in your pack/i);
  });

  it('should only track destruction for PYOA mode', () => {
    const nonPyoaState: GameState = { ...mockState, engineMode: 'litrpg' };
    const result = recordPyoaBranchChoice(nonPyoaState, 'burn the charter');
    
    // No destruction tracking outside PYOA - but ledger still initialized
    expect(result.pyoaBranchLedger?.destroyedItems || []).toEqual([]);
  });
});

describe('Batch 02f — P0-5: PYOA false-arrival hardening', () => {
  it('should strip "mill landing at Thornferry" when already there', () => {
    const input = 'You reach the mill landing at Thornferry. The road stretches ahead.';
    const result = scrubFalseArrivalWhenHere(
      input,
      'mill landing at Thornferry',
      [],
      false
    );
    
    // P0-5: Strip false arrival when location unchanged
    expect(result).not.toContain('You reach the mill landing');
    expect(result).toContain('The road stretches ahead');
  });

  it('should strip "mill landing" arrival when at compound location', () => {
    const input = 'You reach the mill landing. Workers gather nearby.';
    const result = scrubFalseArrivalWhenHere(
      input,
      'mill landing at Thornferry',
      [],
      false
    );
    
    expect(result).not.toContain('You reach the mill landing');
    expect(result).toContain('Workers gather nearby');
  });

  it('should strip repeated mill landing arrivals', () => {
    const input = 'You reach the mill landing at Thornferry for the third time. Nothing has changed.';
    const result = scrubFalseArrivalWhenHere(
      input,
      'mill landing',
      [],
      false
    );
    
    expect(result).not.toContain('You reach the mill landing');
    expect(result).toContain('Nothing has changed');
  });

  it('should NOT strip arrival when location actually changed', () => {
    const input = 'You leave the West Wall behind and reach the mill landing at Thornferry.';
    const result = scrubFalseArrivalWhenHere(
      input,
      'mill landing at Thornferry',
      [],
      false,
      'West Wall' // priorLocation was different
    );
    
    // P0-5: Allow legitimate travel narration when location changed
    expect(result).toContain('You leave the West Wall');
    expect(result).toContain('reach the mill landing');
  });

  it('does not prepend mill-landing when already on the Thornferry cluster', () => {
    expect(
      ensureTravelArrivalProse('Silas waits by the water.', 'mill landing at Thornferry', 'the ford')
    ).toBe('Silas waits by the water.');
    expect(
      ensureTravelArrivalProse('Dust hangs.', 'mill landing at Thornferry', 'Thornferry Road')
    ).toBe('Dust hangs.');
  });

  it('should handle case-insensitive mill landing matches', () => {
    const inputs = [
      'You reach the Mill Landing at thornferry.',
      'You arrive at the MILL LANDING.',
      'Reaching the mill landing at Thornferry.',
    ];

    for (const input of inputs) {
      const result = scrubFalseArrivalWhenHere(
        input,
        'mill landing at Thornferry',
        [],
        false
      );
      
      expect(result.toLowerCase()).not.toContain('you reach');
      expect(result.toLowerCase()).not.toContain('you arrive');
      expect(result.toLowerCase()).not.toContain('reaching');
    }
  });

  it('should preserve other content when stripping false arrivals', () => {
    const input = 'You reach the mill landing at Thornferry. Silas waits by the water. The charter weighs heavy.';
    const result = scrubFalseArrivalWhenHere(
      input,
      'mill landing',
      [],
      false
    );
    
    expect(result).toContain('Silas waits by the water');
    expect(result).toContain('The charter weighs heavy');
    expect(result).not.toContain('You reach');
  });
});

describe('Batch 02f — Integration: All P0 fixes together', () => {
  it('should apply all fixes in a complex scenario', () => {
    // Complex scenario with multiple issues
    const prose = `
      You reach the mill landing at Thornferry. No one responds to your call.
      The Right marks show the way. The Ahead shifts in shadow.
      They watch from the darkness. A study the Child reveals nothing.
    `;

    // Apply P0-5 false-arrival
    let fixed = scrubFalseArrivalWhenHere(prose, 'mill landing', [], false);
    
    // Apply P0-1 crowd
    fixed = scrubInventedCrowdSize(fixed, 0, false);
    
    // Apply P0-2 deixis
    fixed = scrubUnresolvedDeixisNouns(fixed, 'mill landing');
    
    // P0-3 is checked at harvest/CAST time, not in prose warden
    
    // Verify fixes
    expect(fixed).not.toContain('You reach the mill landing');
    expect(fixed).not.toContain('people still here');
    expect(fixed).toContain('The Right'); // Capitalized "Right" in "The Right marks"
    expect(fixed).not.toContain('the Ahead'); // lowercase "the Ahead" removed
  });

  it('should handle empty Han response + normal prose', () => {
    // P0-4: Han detection
    const hanError = new Error('你好世界');
    expect(classifyTurnFailure(hanError)).toBe('empty');
    
    // After retry with Llama, we get normal prose that needs other fixes
    const llamaProse = 'No one here. The Right way leads Forward.';
    const fixed = scrubInventedCrowdSize(llamaProse, 0, false);
    
    expect(fixed).toContain('No one here');
    expect(fixed).toContain('The Right'); // Capitalized stays (but context determines if scrubbed)
  });

  it('should prevent charter resurrection after burn', () => {
    const mockState: GameState = {
      saveId: 'test-integration',
      seed: '42',
      turn: 15,
      engineMode: 'pyoa',
      character: { name: 'Wren', level: 1, xp: 0, hp: 10, maxHp: 10 },
      inventory: [],
      quests: [],
      pyoaBranchLedger: initPyoaBranchLedger(),
    };

    // Burn the charter
    const afterBurn = recordPyoaBranchChoice(mockState, 'burn the charter');
    expect(isPyoaItemDestroyed(afterBurn, 'charter')).toBe(true);

    // Later turns cannot resurrect it
    expect(isPyoaItemDestroyed(afterBurn, 'Millstone Charter')).toBe(true);
    expect(isPyoaItemDestroyed(afterBurn, 'millstone-charter')).toBe(true);
  });
});
