/**
 * Batch 02q — one camera / one fight.
 * Tapes: 02p LitRPG T17 leave-reach + blade; lastKill throat re-engage.
 * Mid writer OFF. No live GM call.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import { isFactClosedViolation, classifyBeatCommit } from './beatCommitGate';
import {
  isLeaveReachFightBleed,
  isOneCameraFightViolation,
  scrubOneCameraFight,
  shouldSkipTravelArrivalPrepend,
} from './oneCameraFight';
import { applyProseWarden } from './proseWarden';
import { encounterBlocksTravel } from './encounterTerminalFsm';
import type { GameState } from './types';

const T17 =
  'You leave The Weighing Cup behind and reach West Wall. The blade bites a hair\'s width deeper as you shift your weight toward the wall.';

const T10_BLADE =
  "The skirmisher's blade stops mid-arc, a handspan from your throat.";

function fightState(): GameState {
  const state = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...state,
    currentLocation: 'The Weighing Cup',
    activeEncounter: {
      name: 'Pact-Hunter Skirmisher',
      level: 1,
      hp: 12,
      maxHp: 16,
      armorClass: 12,
      strength: 12,
      dexterity: 12,
      constitution: 12,
      xpReward: 30,
      goldReward: 5,
      phase: 'engaged',
    },
    sceneFacts: { ...emptySceneFacts(17), present: ['Pact-Hunter Skirmisher'] },
    turn: 17,
  };
}

describe('Batch 02q stamps', () => {
  it('HUD and BUILD are 2026-09-02q and Mid writer stays OFF', () => {
    expect(HUD_BUILD_STAMP >= '2026-09-02q').toBe(true);
    expect(BUILD_STAMP >= '2026-09-02q').toBe(true);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });
});

describe('Batch 02q — one camera / one fight', () => {
  it('rejects 02p LitRPG T17 leave-reach + blade bleed', () => {
    expect(isLeaveReachFightBleed(T17)).toBe(true);
    const state = fightState();
    expect(isOneCameraFightViolation(state, T17)).toBe(true);
    expect(isFactClosedViolation(state, T17)).toBe(true);
    expect(classifyBeatCommit(state, T17).accept).toBe(false);
  });

  it('strips leave-reach while the fight is live; skips arrival prepend', () => {
    const state = fightState();
    expect(shouldSkipTravelArrivalPrepend(state)).toBe(true);
    expect(encounterBlocksTravel(state)).toBe(true);
    const scrubbed = scrubOneCameraFight(T17, state, 'Travel toward West Wall');
    expect(scrubbed).not.toMatch(/leave The Weighing Cup/i);
    expect(scrubbed).toMatch(/blade bites/i);
    const warden = applyProseWarden(T17, { hasLiveEncounter: true });
    expect(warden).not.toMatch(/leave The Weighing Cup/i);
  });

  it('rejects closed-kill blade-at-throat reopen', () => {
    const state = createInitialState(undefined, 'litrpg') as GameState;
    const closed: GameState = {
      ...state,
      activeEncounter: undefined,
      sceneFacts: {
        ...emptySceneFacts(20),
        lastKill: {
          name: 'Pact-Hunter Skirmisher',
          outcome: 'victory',
          turn: 16,
          remains: true,
        },
      },
      turn: 20,
    };
    expect(isFactClosedViolation(closed, T10_BLADE)).toBe(true);
    expect(isFactClosedViolation(closed, 'Rain drums the awning. The road is open.')).toBe(false);
  });
});
