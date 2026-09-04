/**
 * Batch 02p — invented clerk / closed-scene person.
 * Tapes: 02n PYOA s42/s43/s44 (stranger clerk, clerk falls into step).
 * Mid writer OFF. No live GM call.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import { initPyoaBranchLedger } from './pyoaBranchLedger';
import { isFactClosedViolation, classifyBeatCommit } from './beatCommitGate';
import { harvestNarrativeIntoLedger } from './narrativeHarvest';
import { applyPresentTrimOnTravel } from './presentAuthority';
import { compileChoices } from './choiceCompiler';
import { isClosedScenePersonPad } from './closedScenePerson';
import type { GameState } from './types';

function pyoaAt(location: string, extras?: Partial<GameState>): GameState {
  const state = createInitialState(undefined, 'pyoa') as GameState;
  return {
    ...state,
    engineMode: 'pyoa',
    bibleId: 'thornferry-road',
    campaignBibleId: 'thornferry-road',
    currentLocation: location,
    openingEstablishment: {
      pending: [],
      answers: {},
      complete: true,
      aloneArrival: false,
    },
    pyoaBranchLedger: initPyoaBranchLedger(),
    sceneFacts: { ...emptySceneFacts(8), present: [] },
    turn: 8,
    ...extras,
  };
}

describe('Batch 02p stamps', () => {
  it('HUD and BUILD are 2026-09-02p and Mid writer stays OFF', () => {
    expect(HUD_BUILD_STAMP >= '2026-09-02p').toBe(true);
    expect(BUILD_STAMP >= '2026-09-02p').toBe(true);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });
});

describe('Batch 02p — invented clerk / closed-scene person', () => {
  it('rejects stranger-clerk glue and falls-into-step after leave (02n PYOA)', () => {
    const road = pyoaAt('rain road east of Thornferry');
    expect(
      isFactClosedViolation(road, 'The stranger clerk falls into step beside you.')
    ).toBe(true);
    expect(
      classifyBeatCommit(road, 'The stranger clerk falls into step beside you.').accept
    ).toBe(false);
    expect(
      isFactClosedViolation(road, 'A clerk waits at the chapel door.')
    ).toBe(true);
  });

  it('allows a first mill-landing clerk, then harvests occupancy not CAST', () => {
    const mill = pyoaAt('mill landing at Thornferry');
    const prose = 'A clerk waits by the dock with a ledger book.';
    expect(isFactClosedViolation(mill, prose)).toBe(false);
    const next = harvestNarrativeIntoLedger(mill, prose, 8);
    expect(next.sceneFacts?.anonymousRoles).toContain('clerk');
    expect(next.sceneFacts?.present?.some((p) => /^clerk$/i.test(p))).toBe(false);
  });

  it('drops clerk occupancy on travel and starves Talk-to-clerk pads', () => {
    const mill = pyoaAt('mill landing at Thornferry', {
      sceneFacts: { ...emptySceneFacts(8), present: [], anonymousRoles: ['clerk'] },
    });
    const left = applyPresentTrimOnTravel(
      mill,
      'mill landing at Thornferry',
      'rain road east of Thornferry'
    );
    expect(left.sceneFacts?.anonymousRoles ?? []).toEqual([]);
    expect(isClosedScenePersonPad('Talk to the clerk', left)).toBe(true);
    expect(isClosedScenePersonPad('Ask the clerk about the charter', left)).toBe(true);
    const compiled = compileChoices(left, [
      'Talk to the clerk',
      'Ask the clerk about the charter',
      'Inspect the immediate surroundings',
    ]);
    expect(compiled.choices.some((c) => /clerk/i.test(c))).toBe(false);
    expect(compiled.choices.length).toBeGreaterThan(0);
  });

  it('keeps named companions and hub Crown Clerk pads', () => {
    const road = pyoaAt('rain road east of Thornferry');
    expect(isFactClosedViolation(road, 'The road east is wet. Wren keeps pace.')).toBe(false);
    const hall = createInitialState(undefined, 'litrpg') as GameState;
    const atHall: GameState = {
      ...hall,
      engineMode: 'litrpg',
      campaignBibleId: 'summoned-pact',
      currentLocation: 'Contract Hall',
      openingEstablishment: {
        pending: [],
        answers: {},
        complete: true,
        aloneArrival: false,
      },
      sceneFacts: { ...emptySceneFacts(10), present: ['Crown Clerk'] },
      turn: 10,
    };
    expect(isClosedScenePersonPad('Ask the clerk about Pact work', atHall)).toBe(false);
  });
});
