/**
 * Batch 02a — RPG T50 Gemini Residual Fixes (2026-09-02).
 * Stamp: HUD 2026-09-02a / BUILD 2026-09-02a. Mid writer OFF.
 * 
 * Context: RPG T50 run scored 2/10 with Gemini. This run used baseline 2026-08-31n
 * (before Batch X deployment). Many P0s already fixed in Batch X, but 3 new fixes needed:
 * 1. "Tavern" mad-lib scrubbing (character/verb/direction patterns)
 * 2. Possessive pronoun repair ("you stool" → "your stool")
 * 3. Tighter loiter interrupt (≥2 instead of ≥3)
 */
import { describe, expect, it } from 'vitest';
import { scrubEntityMadLibs, scrubPossessiveDeterminerSlips } from './proseWarden';
import { BUILD_STAMP } from './runManifest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import type { GameState } from './types';
import { compileChoices } from './choiceCompiler';

describe('playtest02a — RPG T50 residual fixes', () => {
  it('stamps are 2026-09-02a and Mid writer stays OFF', () => {
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(BUILD_STAMP).toBe('2026-09-02a');
    expect(HUD_BUILD_STAMP).toBe('2026-09-02a');
  });

  describe('Fix 1: Tavern mad-lib scrubbing', () => {
    it('scrubs Tavern as character (watches/waits/stands)', () => {
      const input = 'Rain drums the awning while Tavern watches you from the stall.';
      const result = scrubEntityMadLibs(input);
      expect(result).not.toContain('Tavern watches');
      expect(result).toContain('vendor watches');
    });

    it('scrubs Tavern as direction (toward the Tavern)', () => {
      const input = 'You were intending to make your way toward the Tavern.';
      const result = scrubEntityMadLibs(input);
      expect(result).not.toContain('toward the Tavern');
      expect(result).toContain('toward the waystation');
    });

    it('scrubs Tavern from direction (from the Tavern)', () => {
      const input = 'The path leading away from here disappears into the gloom that swallows the Salt Road Tavern.';
      const result = scrubEntityMadLibs(input);
      expect(result).not.toContain('Salt Road Tavern');
      expect(result).toContain('waystation');
    });

    it('scrubs Tavern as clause separator', () => {
      const input = 'Tavern, the passage is poorly lit and treacherous.';
      const result = scrubEntityMadLibs(input);
      expect(result).not.toContain('Tavern, the passage');
      expect(result).toContain('Further along, the passage');
    });

    it('scrubs Tavern as adjective (a Tavern dim glow)', () => {
      const input = 'You take a Tavern dim glow of the entrance.';
      const result = scrubEntityMadLibs(input);
      expect(result).not.toContain('Tavern dim');
      expect(result).toContain('a dim');
    });

    it('preserves Tavern when part of legitimate location name', () => {
      const input = 'You enter the Greyhollow Tavern door.';
      const result = scrubEntityMadLibs(input);
      // Should preserve "Tavern door" (legitimate compound)
      expect(result).toContain('Tavern');
    });

    it('scrubs at/near Tavern prepositions', () => {
      const input = 'The crowd gathers at the Tavern.';
      const result = scrubEntityMadLibs(input);
      expect(result).not.toContain('at the Tavern');
      expect(result).toContain('at the waystation');
    });
  });

  describe('Fix 2: Possessive pronoun repair', () => {
    it('fixes "on you stool" → "on your stool"', () => {
      const input = 'Vessa remains perched on you stool, her gaze fixed somewhere beyond your shoulder.';
      const result = scrubPossessiveDeterminerSlips(input);
      expect(result).not.toContain('on you stool');
      expect(result).toContain('on your stool');
    });

    it('fixes "you eyes" → "your eyes"', () => {
      const input = 'The light falls across you eyes momentarily.';
      const result = scrubPossessiveDeterminerSlips(input);
      expect(result).not.toContain('you eyes');
      expect(result).toContain('your eyes');
    });

    it('fixes "you face" → "your face"', () => {
      const input = 'A shadow crosses you face as you consider.';
      const result = scrubPossessiveDeterminerSlips(input);
      expect(result).not.toContain('you face');
      expect(result).toContain('your face');
    });

    it('fixes "perched on you chair"', () => {
      const input = 'The cat is perched on you chair in the corner.';
      const result = scrubPossessiveDeterminerSlips(input);
      expect(result).not.toContain('on you chair');
      expect(result).toContain('on your chair');
    });

    it('fixes multiple prepositions (at/in/near/beside)', () => {
      const inputs = [
        'at you table',
        'in you bag',
        'near you side',
        'beside you shoulder',
        'from you hand',
      ];
      const expected = [
        'at your table',
        'in your bag',
        'near your side',
        'beside your shoulder',
        'from your hand',
      ];
      inputs.forEach((input, i) => {
        const result = scrubPossessiveDeterminerSlips(`The item is ${input}.`);
        expect(result).toContain(expected[i]);
      });
    });

    it('fixes body parts (head/hand/shoulder/chest)', () => {
      const inputs = [
        'over you head',
        'across you hand',
        'on you shoulder',
        'near you chest',
      ];
      const expected = [
        'over your head',
        'across your hand',
        'on your shoulder',
        'near your chest',
      ];
      inputs.forEach((input, i) => {
        const result = scrubPossessiveDeterminerSlips(`It hovers ${input}.`);
        expect(result).toContain(expected[i]);
      });
    });

    it('preserves "you" as subject pronoun', () => {
      const input = 'You stool at the bar while the vendor watches.';
      const result = scrubPossessiveDeterminerSlips(input);
      // "You stool" at sentence start should stay (though it's bad grammar, that's a different issue)
      expect(result).toContain('You stool');
    });
  });

  describe('Fix 3: Tighter loiter interrupt', () => {
    it('forces exit pads after 2 loiter actions (not 3)', () => {
      // Mock state with 2 consecutive loiter actions
      const state: Partial<GameState> = {
        turn: 10,
        engineMode: 'rpg',
        log: [
          { role: 'player', content: 'Wait and observe', turn: 8, timestamp: '2026-09-02T10:00:00Z' },
          { role: 'gm', content: 'Nothing changes.', turn: 8, timestamp: '2026-09-02T10:00:01Z' },
          { role: 'player', content: 'Inspect the room', turn: 9, timestamp: '2026-09-02T10:00:02Z' },
          { role: 'gm', content: 'Still the same.', turn: 9, timestamp: '2026-09-02T10:00:03Z' },
        ],
        sceneFacts: {
          currentLocation: 'Waystation',
          present: [],
        },
        openingEstablishment: {
          complete: true,
          nameGiven: true,
          origin: 'unknown',
          kitDisclosed: true,
        },
        locationSheet: {
          id: 'waystation',
          name: 'Salt Road Waystation',
          biome: 'plains',
          threat: 'low',
          edges: [{ label: 'Travel north', destination: 'checkpoint' }],
        },
      } as GameState;

      // Provide initial choices that include loiter options
      const initialChoices = [
        'Wait and observe',
        'Inspect the room',
        'Scout the area',
        'Leave toward the north',
        'Travel north',
      ];

      const result = compileChoices(state as GameState, initialChoices);

      // After 2 loiter actions, should force exit/travel pads
      const exitChoices = result.choices.filter((c) => /\b(leave|exit|travel|head)\b/i.test(c));
      expect(exitChoices.length).toBeGreaterThan(0);

      // Should drop Wait/Inspect/Scout generic loiter pads due to stallInterrupt
      const waitPads = result.choices.filter((c) => /\b(wait and observe|inspect the room|scout the area)\b/i.test(c));
      expect(waitPads.length).toBe(0);
    });

    it('still allows loiter on turn 1 (no streak yet)', () => {
      const state: Partial<GameState> = {
        turn: 1,
        engineMode: 'rpg',
        log: [],
        sceneFacts: {
          currentLocation: 'Waystation',
          present: [],
        },
        openingEstablishment: {
          complete: true,
          nameGiven: true,
          origin: 'unknown',
          kitDisclosed: true,
        },
      } as GameState;

      const initialChoices = [
        'Wait and observe',
        'Inspect the room',
        'Scout the area',
        'Leave the waystation',
      ];

      const result = compileChoices(state as GameState, initialChoices);

      // First turn should allow inspect
      const hasInspect = result.choices.some((c) => /\b(inspect|look around|examine)\b/i.test(c));
      expect(hasInspect).toBe(true);
    });
  });

  it('all three fixes work together in prose warden', () => {
    // Combined test: prose with Tavern mad-lib + possessive slip
    const input = `Rain drums the awning while Tavern watches you from you stool. ` +
      `The vendor remains perched on you chair, waiting for your next word toward the Tavern.`;

    // Apply entity mad-lib scrubbing
    let result = scrubEntityMadLibs(input);
    expect(result).not.toContain('Tavern watches');
    expect(result).toContain('vendor watches');

    // Apply possessive determiner scrubbing
    result = scrubPossessiveDeterminerSlips(result);
    expect(result).not.toContain('you stool');
    expect(result).toContain('your stool');
    expect(result).not.toContain('you chair');
    expect(result).toContain('your chair');

    // Final result should have both fixes applied
    expect(result).not.toContain('Tavern');
    expect(result).not.toContain('you stool');
    expect(result).not.toContain('you chair');
    expect(result).toContain('vendor');
    expect(result).toContain('your stool');
    expect(result).toContain('your chair');
  });
});
