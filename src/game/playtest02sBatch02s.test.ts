/**
 * Batch 02s — post-commit leave-reach must not land on a steel beat.
 * Tapes: 02r D&D s42 T28; RPG s43 T14.
 * Mid writer OFF. No live GM call.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import { enforceCameraOnProse } from './travelAuthority';
import {
  isLeaveReachFightBleed,
  proseHasFightBleed,
  scrubOneCameraFight,
  stampTravelArrivalIfSafe,
} from './oneCameraFight';
import type { GameState } from './types';

const DND_T28_BODY =
  'You push off the crates and the fence takes your weight. A curved blade, worn in easy reach.';

const RPG_T14_BODY =
  "The Pact-Hunter's blade stops its slide, the tip still low.";

const LEGAL_TRAVEL = 'Rain hits the stalls. A vendor under a patched tarp meets your glance.';

function roadState(): GameState {
  const state = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...state,
    currentLocation: 'West Wall',
    previousLocationSheet: { name: 'Lowmarket' } as GameState['previousLocationSheet'],
    turn: 28,
    sceneFacts: {
      ...emptySceneFacts(28),
      cameraLock: { scale: 'outdoor', label: 'West Wall', lockedTurn: 28 },
    },
  };
}

describe('Batch 02s stamps', () => {
  it('HUD and BUILD are 2026-09-02s and Mid writer stays OFF', () => {
    expect(HUD_BUILD_STAMP >= '2026-09-02s').toBe(true);
    expect(BUILD_STAMP >= '2026-09-02s').toBe(true);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });
});

describe('Batch 02s — stamp after commit cannot glue steel', () => {
  it('refuses leave-reach on 02r D&D T28 curved-blade body', () => {
    expect(proseHasFightBleed(DND_T28_BODY)).toBe(true);
    const stamped = stampTravelArrivalIfSafe(DND_T28_BODY, 'West Wall', 'Lowmarket');
    expect(stamped).toBe(DND_T28_BODY);
    expect(isLeaveReachFightBleed(stamped)).toBe(false);
    const camera = enforceCameraOnProse(DND_T28_BODY, roadState(), 'Travel toward West Wall');
    expect(camera).not.toMatch(/You leave Lowmarket behind and reach West Wall/i);
  });

  it('refuses leave-reach on 02r RPG T14 live-blade body', () => {
    const stamped = stampTravelArrivalIfSafe(RPG_T14_BODY, 'The Weighing Cup', 'West Wall');
    expect(stamped).toBe(RPG_T14_BODY);
    expect(isLeaveReachFightBleed(`${stamped}`)).toBe(false);
  });

  it('still stamps legal travel with no steel', () => {
    const stamped = stampTravelArrivalIfSafe(LEGAL_TRAVEL, 'West Wall', 'Lowmarket');
    expect(stamped).toMatch(/^You leave Lowmarket behind and reach West Wall\./);
    expect(isLeaveReachFightBleed(stamped)).toBe(false);
  });

  it('drops leftover steel on arrival after a refused stamp', () => {
    const scrubbed = scrubOneCameraFight(DND_T28_BODY, roadState(), 'Travel toward West Wall');
    expect(scrubbed).not.toMatch(/\bblade\b/i);
    expect(scrubbed.length).toBeGreaterThan(12);
  });
});
