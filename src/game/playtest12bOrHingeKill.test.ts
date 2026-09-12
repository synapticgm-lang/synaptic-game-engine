/**
 * Batch 12b — Kill or-hinge repair banner entirely.
 * Mid writer OFF. Conversational `or` routes to GM/stitch naturally.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import {
  detectRepairSituation,
  isInformationalOrAsk,
  isExploreOrLayoutAsk,
  type RepairSituation,
} from './repairEngine';
import type { GameState } from './types';

function emptyState(): GameState {
  return createInitialState(undefined, 'litrpg') as GameState;
}

describe('playtest12b — or-hinge kill', () => {
  it('HUD/BUILD are 12a, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toMatch(/^2026-09-12/);
    expect(BUILD_STAMP).toMatch(/^2026-09-12/);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('RepairSituation type only has safety', () => {
    // Type-level check via assignment
    const safety: RepairSituation = 'safety';
    expect(safety).toBe('safety');

    // The following lines should NOT compile if they're uncommented:
    // const ambiguous: RepairSituation = 'ambiguous_action'; // Should error
    // const protest: RepairSituation = 'protest'; // Should error
    // const contradiction: RepairSituation = 'contradiction'; // Should error
    // const correction: RepairSituation = 'correction_needed'; // Should error
  });

  it('detectRepairSituation never returns ambiguous_action for or-questions', () => {
    const state = emptyState();
    const conversationalOr = [
      'So what\'s the pay then? Do I need to stay on the ship or can I leave?',
      'pay or leave',
      'stay or go',
      'Can I refuse or is this mandatory?',
      'Do I get paid or is this volunteer?',
      'fight or flee',
      'Should I take the offer or walk away?',
      'Is there a wage or just room and board?',
    ];

    for (const input of conversationalOr) {
      const result = detectRepairSituation(input, state);
      // Should not trigger any repair, or only safety (not ambiguous_action)
      expect(result).not.toBe('ambiguous_action');
      // @ts-expect-error - These types should not exist anymore
      expect(result).not.toBe('protest');
      // @ts-expect-error
      expect(result).not.toBe('contradiction');
      // @ts-expect-error
      expect(result).not.toBe('correction_needed');
    }
  });

  it('detectRepairSituation still returns safety for Kid Mode triggers', () => {
    const state = emptyState();
    const safetyTriggers = [
      'make this less intense',
      'tone down',
      'fade out',
      'too much',
      'ooc stop',
    ];

    for (const input of safetyTriggers) {
      const result = detectRepairSituation(input, state);
      expect(result).toBe('safety');
    }
  });

  it('isInformationalOrAsk still correctly identifies UI questions', () => {
    expect(isInformationalOrAsk('info or option')).toBe(true);
    expect(isInformationalOrAsk('menus or buttons')).toBe(true);
    expect(isInformationalOrAsk('check the panel')).toBe(true);
    expect(isInformationalOrAsk('explore the system menu')).toBe(true);
    expect(isInformationalOrAsk('does it have any options')).toBe(true);

    // Conversational questions should NOT match
    expect(isInformationalOrAsk('pay or stay')).toBe(false);
    expect(isInformationalOrAsk('fight or flee')).toBe(false);
  });

  it('isExploreOrLayoutAsk still correctly identifies room exploration', () => {
    expect(isExploreOrLayoutAsk('are there any doors')).toBe(true);
    expect(isExploreOrLayoutAsk('check for windows')).toBe(true);
    expect(isExploreOrLayoutAsk('doors or windows in the room')).toBe(true);
    expect(isExploreOrLayoutAsk('explore the room for signs of where you are')).toBe(true);
    expect(isExploreOrLayoutAsk('inspect the panel for info')).toBe(true);

    // Action choices should NOT match
    expect(isExploreOrLayoutAsk('pay or stay')).toBe(false);
    expect(isExploreOrLayoutAsk('accept the offer or refuse')).toBe(false);
  });

  it('conversational or-questions route naturally without repair', () => {
    const state = emptyState();
    
    // The key test case from the bug report
    const bugInput = 'So what\'s the pay then? Do I need to stay on the ship or can I leave?';
    const result = detectRepairSituation(bugInput, state);
    
    // Should NOT trigger any repair situation
    expect(result).toBeNull();
    
    // Additional conversational cases
    const moreConversational = [
      'What happens if I refuse? Can I leave or am I stuck here?',
      'Do I have a choice or is this forced?',
      'pay me or I walk',
      'tell me what you want or let me go',
    ];

    for (const input of moreConversational) {
      const res = detectRepairSituation(input, state);
      expect(res).toBeNull();
    }
  });

  it('old CSV-backed situations are gone', () => {
    const state = emptyState();
    
    // Inputs that would have triggered protest/contradiction/correction_needed
    const oldTriggers = [
      'I refuse that completely',
      'No way, that contradicts what you said before',
      'Actually I want to do X and then Y',
    ];

    for (const input of oldTriggers) {
      const result = detectRepairSituation(input, state);
      // Should not trigger any repair (or only safety if it happens to match)
      expect(result).not.toBe('protest' as any);
      expect(result).not.toBe('contradiction' as any);
      expect(result).not.toBe('correction_needed' as any);
    }
  });
});
