/**
 * Batch U — post–Batch-T Gemini T50 P0s (seed 42 tape).
 * Stitch bank leak, false Sevenfold arrival, choice chips in body, travel starvation, entity mad-libs.
 * Mid writer OFF.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import {
  applyProseWarden,
  scrubFalseArrivalWhenHere,
  scrubStitchBankLeaks,
  scrubEntityMadLibs,
} from './proseWarden';
import {
  codedSceneMove,
  isStitchBankFingerprint,
  repairRejectedBeat,
} from './beatCommitGate';
import { hasNumberedChoiceLeak, stripChoiceList } from './parser';
import { compileChoices } from './choiceCompiler';
import { enforceCameraOnProse } from './travelAuthority';
import { ensureTravelArrivalProse } from './outdoorHubs';
import { readabilityGatePass, scanReadabilityViolations } from './readabilityGate';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { HUD_BUILD_STAMP } from '../components/Hud';
import type { GameState } from './types';

describe('playtest31uBatchU', () => {
  it('stamp is 2026-08-31u / 31m and Mid writer stays OFF', () => {
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(HUD_BUILD_STAMP).toBe('2026-08-31u');
    expect(BUILD_STAMP).toBe('2026-08-31m');
  });

  describe('P0-1 — stitch bank never commits', () => {
    const tapeLines = [
      'In Lowmarket, the beat needs an exit, a spoken commit, or a stake — not another sift.',
      'Pact-Hunter Skirmisher still holds the line in Lowmarket — strike, parley, or break contact now.',
      'Nothing more yields here. Leave Lowmarket toward West Wall, or talk to someone who will move.',
    ];

    it('detects stitch bank fingerprints from Batch T tape', () => {
      for (const line of tapeLines) {
        expect(isStitchBankFingerprint(line)).toBe(true);
      }
    });

    it('coded scene move is diegetic, not meta stitch', () => {
      let state = createInitialState(undefined, 'litrpg');
      state = {
        ...state,
        openingEstablishment: { pending: [], answers: {}, complete: true, aloneArrival: false },
        currentLocation: 'Lowmarket',
        campaignBibleId: 'summoned-pact',
        turn: 9,
        activeEncounter: {
          name: 'Pact-Hunter Skirmisher',
          phase: 'engaged',
          encounterId: 'enc-u',
          engagedTurnCount: 1,
          failedFleeCount: 0,
          failedParleyCount: 0,
        } as GameState['activeEncounter'],
        sceneFacts: {
          crowd: 'present',
          noise: 'voices',
          present: ['Pact-Hunter Skirmisher'],
          props: [],
          lastBeat: '',
          updatedTurn: 9,
        },
      } as GameState;
      const move = codedSceneMove(state);
      expect(isStitchBankFingerprint(move)).toBe(false);
      expect(move).toMatch(/press the attack|parley|skirmish|blade/i);

      const repaired = repairRejectedBeat(state, tapeLines[0]!, ['atmosphere-only']);
      expect(isStitchBankFingerprint(repaired.prose)).toBe(false);
      expect(scrubStitchBankLeaks(tapeLines[1]!)).not.toMatch(/still holds the line/i);
    });
  });

  describe('P0-2 — Sevenfold false-arrival only on real travel', () => {
    it('scrubs glued Sevenfold prefix from Batch T T3/T31 tape', () => {
      const t3 =
        'You reach The Sevenfold Circle under bombardment. You leave Lowmarket behind and reach West Wall.';
      expect(
        scrubFalseArrivalWhenHere(t3, 'West Wall', [
          'The Sevenfold Circle under bombardment',
          'Lowmarket',
        ])
      ).not.toMatch(/Sevenfold Circle/i);
      expect(t3).toMatch(/Sevenfold/);
    });

    it('enforceCameraOnProse uses travel snap not stale opening lock', () => {
      let state = createInitialState(undefined, 'litrpg');
      state = {
        ...state,
        currentLocation: 'West Wall',
        previousLocationSheet: { name: 'Lowmarket', mapScale: 'street' } as GameState['previousLocationSheet'],
        sceneFacts: {
          crowd: 'present',
          noise: 'voices',
          present: [],
          props: [],
          lastBeat: '',
          updatedTurn: 20,
          cameraLock: {
            scale: 'outdoor',
            label: 'The Sevenfold Circle under bombardment',
            lockedTurn: 0,
          },
        },
      } as GameState;
      const prose = 'Dust hangs over the ramparts.';
      const out = enforceCameraOnProse(prose, state, 'Travel toward West Wall');
      expect(out).not.toMatch(/Sevenfold Circle/i);
      expect(out).toMatch(/leave Lowmarket|reach West Wall/i);
    });

    it('ensureTravelArrivalProse skips Sevenfold when traveling between hubs', () => {
      expect(
        ensureTravelArrivalProse('Rain falls.', 'The Sevenfold Circle under bombardment', 'Lowmarket')
      ).toBe('Rain falls.');
    });
  });

  describe('P0-3 — choice labels stripped / rejected', () => {
    it('strips numbered chips from Batch T tape (T6/T10/T17/T50)', () => {
      const t6 =
        'Your gaze locks onto the Lowmarket Fence. 1. Meet the fence\'s gaze with a more intense stare.';
      expect(stripChoiceList(t6)).not.toMatch(/\b1\.\s*Meet/i);

      const t10 =
        'The tense silence hangs. 1. "I don\'t want to fight. What do you want? "';
      expect(stripChoiceList(t10)).not.toMatch(/\b1\.\s*"/i);

      const t50 =
        'The only way forward appears to be a narrow path. 1. Descend the path into the city.';
      expect(stripChoiceList(t50)).not.toMatch(/\b1\.\s*Descend/i);
      expect(hasNumberedChoiceLeak(t50)).toBe(true);
      expect(hasNumberedChoiceLeak(stripChoiceList(t50))).toBe(false);
    });
  });

  describe('P0-4 — travel pad starvation under live stakes', () => {
    it('drops travel after 2 travel picks in 5 turns with pending encounter', () => {
      let state = createInitialState(undefined, 'litrpg');
      state = {
        ...state,
        openingEstablishment: { pending: [], answers: {}, complete: true, aloneArrival: false },
        currentLocation: 'Lowmarket',
        campaignBibleId: 'summoned-pact',
        turn: 20,
        log: [
          { id: '1', turn: 18, role: 'player', content: 'Travel toward West Wall', timestamp: 1 },
          { id: '2', turn: 19, role: 'gm', content: 'You walk.', timestamp: 2 },
          { id: '3', turn: 19, role: 'player', content: 'Travel toward Lowmarket', timestamp: 3 },
          { id: '4', turn: 20, role: 'gm', content: 'Market noise.', timestamp: 4 },
        ],
        sceneFacts: {
          crowd: 'present',
          noise: 'voices',
          present: ['Pact-Hunter Skirmisher'],
          props: [],
          lastBeat: '',
          updatedTurn: 20,
          pendingEncounter: {
            name: 'Pact-Hunter Skirmisher',
            phase: 'engaged',
            encounterId: 'enc-park',
            engagedTurnCount: 0,
            failedFleeCount: 0,
            failedParleyCount: 0,
          },
        },
      } as GameState;
      const compiled = compileChoices(
        state,
        ['Travel toward West Wall', 'Press the attack', 'Parley'],
        undefined,
        'Wait and watch'
      );
      expect(compiled.choices.every((c) => !/\btravel\b/i.test(c))).toBe(true);
    });
  });

  describe('P0-1b — entity mad-libs in wrong slots', () => {
    it('rewrites activity Scattered Scale and just Pact-Hunter Skirmisher', () => {
      const t4 = 'the faintest murmur of activity Scattered Scale.';
      expect(scrubEntityMadLibs(t4)).toMatch(/murmur of activity/i);
      expect(scrubEntityMadLibs(t4)).not.toMatch(/activity Scattered/i);

      const t25 = 'A creature lunges just Pact-Hunter Skirmisher.';
      expect(scrubEntityMadLibs(t25)).not.toMatch(/just Pact-Hunter/i);

      const t8 = 'the two people here around you, a sparse collection';
      expect(
        applyProseWarden(t8, { currentLocation: 'Lowmarket' })
      ).not.toMatch(/people here around/i);
    });
  });

  describe('readability gate module', () => {
    it('flags stitch leak and choice leak in synthetic log', () => {
      let state = createInitialState(undefined, 'litrpg');
      state = {
        ...state,
        currentLocation: 'Lowmarket',
        log: [
          {
            id: 'g1',
            turn: 3,
            role: 'gm',
            content:
              'In Lowmarket, the beat needs an exit, a spoken commit, or a stake — not another sift.',
            timestamp: 1,
          },
          {
            id: 'g2',
            turn: 6,
            role: 'gm',
            content: 'Tension builds. 1. Meet the fence\'s gaze.',
            timestamp: 2,
          },
        ],
      } as GameState;
      const violations = scanReadabilityViolations(state);
      expect(violations.some((v) => v.kind === 'stitch-leak')).toBe(true);
      expect(violations.some((v) => v.kind === 'choice-leak')).toBe(true);
      expect(readabilityGatePass(state).pass).toBe(false);
    });
  });
});
