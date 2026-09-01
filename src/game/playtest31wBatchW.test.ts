/**
 * Batch W — post–Batch-V Gemini T50 P0s (seed 42 tape).
 * Entity mad-lib collapse, UI/stitch bleed, combat catch/travel clear, dead abstract pads.
 * Mid writer OFF.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import {
  applyProseWarden,
  scrubEntityMadLibs,
  scrubStitchBankLeaks,
  scrubDualLocationOpenings,
} from './proseWarden';
import {
  codedSceneMove,
  isStitchBankFingerprint,
  classifyBeatCommit,
  repairRejectedBeat,
} from './beatCommitGate';
import {
  isRoleContactLabel,
  filterChromeFromPresent,
  realPresentPeople,
} from './chromeAuthority';
import { harvestNarrativeIntoLedger } from './narrativeHarvest';
import { emptySceneFacts } from './sceneFacts';
import {
  tickEncounterTerminal,
  fleeAvailable,
  encounterBlocksTravel,
  initEncounterTerminal,
} from './encounterTerminalFsm';
import { compileChoices } from './choiceCompiler';
import { hasNumberedChoiceLeak, stripChoiceList } from './parser';
import { scanReadabilityViolations } from './readabilityGate';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { HUD_BUILD_STAMP } from '../components/Hud';
import type { GameState } from './types';

describe('playtest31wBatchW', () => {
  it('stamp is 2026-08-31w / 31o and Mid writer stays OFF', () => {
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(HUD_BUILD_STAMP).toBe('2026-08-31w');
    expect(BUILD_STAMP).toBe('2026-08-31o');
  });

  describe('P0-1 — entity / role-label collapse', () => {
    it('blocks stall contact and Scattered Scale from person slots', () => {
      expect(isRoleContactLabel('stall contact')).toBe(true);
      expect(isRoleContactLabel('the stall contact')).toBe(true);
      expect(filterChromeFromPresent(['stall contact', 'Scattered Scale', 'Wall Sergeant'])).toEqual([
        'Wall Sergeant',
      ]);
      expect(realPresentPeople(['stall contact', 'Lowmarket Fence'])).toEqual(['Lowmarket Fence']);
    });

    it('scrubs tape quotes: Scattered Scale mad-libs + stall contact substitution', () => {
      const t4 =
        'a stark contrast to the grim fortifications you just Scattered Scale.';
      expect(scrubEntityMadLibs(t4)).not.toMatch(/just Scattered Scale/i);

      const t2 = 'Scattered Scale, through the hazy, debris-filled air, you can make out';
      expect(scrubEntityMadLibs(t2)).toMatch(/^Ahead,/i);

      const t6 = '"the stall contact," the handler finally rasps, "the stall contact decree.';
      const cleaned = scrubEntityMadLibs(t6);
      expect(cleaned).not.toMatch(/the stall contact decree/i);

      const t14 = 'the stall contact across the stall leans stall contact, a low chuckle';
      expect(scrubEntityMadLibs(t14)).not.toMatch(/leans stall contact/i);

      expect(
        scrubEntityMadLibs('its form begins to writhe, the swirling malice within it the crowd here strength once more.')
      ).not.toMatch(/crowd here strength/i);
    });

    it('narrative harvest never locks stall contact', () => {
      let state = createInitialState(undefined, 'litrpg');
      state = harvestNarrativeIntoLedger(
        state,
        'The stall contact, a wiry fence, watched. Talk to stall contact.',
        6
      );
      expect(state.sceneFacts?.present ?? []).not.toContain('stall contact');
    });
  });

  describe('P0-2 — UI / stitch bleed never commits', () => {
    it('flags and scrubs Batch V stitch fingerprints', () => {
      const meta =
        'A shuttered stall and an open lane both invite a real move — talk, trade, or travel.';
      const hang =
        'A question hangs; you could answer it, walk the next street, or take a harder stake.';
      const ash =
        'In Lowmarket, ash still sifts between the stones. Someone at a nearby stall shifts weight';
      expect(isStitchBankFingerprint(meta)).toBe(true);
      expect(isStitchBankFingerprint(hang)).toBe(true);
      expect(isStitchBankFingerprint(ash)).toBe(true);
      expect(scrubStitchBankLeaks(meta)).not.toMatch(/invite a real move/i);
      expect(scrubStitchBankLeaks(hang)).not.toMatch(/question hangs/i);
    });

    it('codedSceneMove emits diegetic banks only', () => {
      let state = createInitialState(undefined, 'litrpg');
      state = {
        ...state,
        openingEstablishment: { pending: [], answers: {}, complete: true },
        currentLocation: 'West Wall',
        turn: 43,
        sceneFacts: { ...emptySceneFacts(43), present: [] },
      } as GameState;
      const move = codedSceneMove(state);
      expect(isStitchBankFingerprint(move)).toBe(false);
      expect(move).not.toMatch(/invite a real move|question hangs|ash still sifts|side lane toward/i);
    });

    it('stripChoiceList removes Plunge into numbered leak (T27)', () => {
      const t27 =
        'towards the heart of the market. 1. Plunge into the thick of the Lowmarket crowd';
      const stripped = stripChoiceList(t27);
      expect(stripped).not.toMatch(/\b1\.\s*Plunge/i);
      expect(hasNumberedChoiceLeak(stripped)).toBe(false);
    });

    it('commit gate rejects stitch fingerprint prose', () => {
      const state = {
        ...createInitialState(undefined, 'litrpg'),
        turn: 15,
        openingEstablishment: { pending: [], answers: {}, complete: true },
      } as GameState;
      const beat = 'In Lowmarket, ash still sifts between the stones. Someone shifts weight.';
      expect(classifyBeatCommit(state, beat).accept).toBe(false);
      const repaired = repairRejectedBeat(state, beat, ['recycle-without-delta']);
      expect(isStitchBankFingerprint(repaired.prose)).toBe(false);
    });
  });

  describe('P0-3 — combat catch blocks travel soft-clear', () => {
    it('flee fail marks caught and does not clear on flee cap', () => {
      let state = createInitialState(undefined, 'litrpg');
      state.turn = 14;
      state.activeEncounter = initEncounterTerminal(
        {
          name: 'Pact-Hunter Skirmisher',
          level: 1,
          hp: 16,
          maxHp: 16,
          armorClass: 12,
          strength: 12,
          dexterity: 12,
          constitution: 12,
          xpReward: 25,
          goldReward: 5,
        },
        state
      );
      let tick = tickEncounterTerminal(state, 'Try to flee');
      state = tick.state;
      expect(state.activeEncounter?.caught).toBe(true);
      expect(fleeAvailable(state.activeEncounter)).toBe(false);

      tick = tickEncounterTerminal(state, 'Try to flee');
      expect(tick.state.activeEncounter).toBeTruthy();
      expect(tick.cleared).toBeUndefined();
    });

    it('encounterBlocksTravel while live encounter up', () => {
      const state = {
        ...createInitialState(undefined, 'litrpg'),
        activeEncounter: {
          name: 'Pact-Hunter Skirmisher',
          hp: 10,
          maxHp: 16,
          level: 1,
          armorClass: 12,
          strength: 12,
          dexterity: 12,
          constitution: 12,
          xpReward: 25,
          goldReward: 5,
          phase: 'engaged',
        },
      } as GameState;
      expect(encounterBlocksTravel(state)).toBe(true);
    });

    it('starves travel pads under live encounter (T15 tape)', () => {
      let state = createInitialState(undefined, 'litrpg');
      state = {
        ...state,
        openingEstablishment: { pending: [], answers: {}, complete: true },
        currentLocation: 'Lowmarket',
        turn: 15,
        activeEncounter: {
          name: 'Pact-Hunter Skirmisher',
          hp: 10,
          maxHp: 16,
          level: 1,
          armorClass: 12,
          strength: 12,
          dexterity: 12,
          constitution: 12,
          xpReward: 25,
          goldReward: 5,
          phase: 'engaged',
          caught: true,
          failedFleeCount: 2,
        },
        sceneFacts: { ...emptySceneFacts(15), present: ['Lowmarket Fence'] },
      } as GameState;
      const compiled = compileChoices(
        state,
        ['Travel toward West Wall', 'Press the attack', 'Parley', 'Try to flee'],
        undefined,
        'Travel toward West Wall'
      );
      expect(compiled.choices.some((c) => /^Travel toward/i.test(c))).toBe(false);
      expect(compiled.choices.some((c) => /press the attack|parley/i.test(c))).toBe(true);
    });
  });

  describe('P0-4 — abstract dead pads starved under live context', () => {
    it('drops Press for leverage / Ask a direct question when NPCs present', () => {
      let state = createInitialState(undefined, 'litrpg');
      state = {
        ...state,
        openingEstablishment: { pending: [], answers: {}, complete: true },
        currentLocation: 'Lowmarket',
        turn: 24,
        sceneFacts: { ...emptySceneFacts(24), present: ['Lowmarket Fence'] },
        log: [
          { id: 'a', role: 'player', content: 'Press for leverage', timestamp: 1, turn: 23 },
          { id: 'b', role: 'gm', content: 'They offer no quarter.', timestamp: 2, turn: 23 },
        ],
      } as GameState;
      const compiled = compileChoices(
        state,
        ['Press for leverage', 'Ask a direct question', 'Talk to Lowmarket Fence', 'Leave through the nearest exit'],
        undefined,
        'Press for leverage'
      );
      expect(compiled.choices.some((c) => /^Press for leverage$/i.test(c))).toBe(false);
      expect(compiled.choices.some((c) => /Talk to Lowmarket Fence/i.test(c))).toBe(true);
    });
  });

  describe('P1 — dual-location + NPC face', () => {
    it('scrubs reach-then-old-location ping-pong (T23)', () => {
      const dual =
        'You leave Lowmarket behind and reach West Wall. In Lowmarket, ash still sifts between the stones.';
      const out = scrubDualLocationOpenings(dual, 'West Wall', ['Lowmarket', 'West Wall']);
      expect(out).not.toMatch(/reach West Wall\. In Lowmarket/i);
    });

    it('keeps NPC face possessive on role subjects', () => {
      const line = 'The stall contact shifts, a flicker crossing your face.';
      const out = applyProseWarden(line);
      expect(out).toMatch(/their face/i);
      expect(out).not.toMatch(/crossing your face/i);
    });
  });

  describe('readabilityGate scans Batch W violations', () => {
    it('detects entity mad-lib and ui-bleed in committed log', () => {
      const state = {
        ...createInitialState(undefined, 'litrpg'),
        log: [
          {
            id: '1',
            role: 'gm',
            turn: 4,
            content: 'you just Scattered Scale through the rain.',
            timestamp: 1,
          },
          {
            id: '2',
            role: 'gm',
            turn: 3,
            content: 'invite a real move — talk, trade, or travel.',
            timestamp: 2,
          },
        ],
      } as GameState;
      const violations = scanReadabilityViolations(state);
      expect(violations.some((v) => v.kind === 'entity-madlib')).toBe(true);
      expect(violations.some((v) => v.kind === 'ui-bleed' || v.kind === 'stitch-leak')).toBe(true);
    });
  });
});
