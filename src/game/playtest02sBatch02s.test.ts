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
    expect(HUD_BUILD_STAMP.startsWith('2026-09')).toBe(true);
    expect(BUILD_STAMP.startsWith('2026-09')).toBe(true);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });
});

describe('Batch 02s — stamp after commit cannot glue steel', () => {
  it('no leave-reach on 02r D&D T28 curved-blade body', () => {
    expect(proseHasFightBleed(DND_T28_BODY)).toBe(true);
    const camera = enforceCameraOnProse(DND_T28_BODY, roadState(), 'Travel toward West Wall');
    expect(camera).toBe(DND_T28_BODY);
    expect(isLeaveReachFightBleed(camera)).toBe(false);
  });

  it('no leave-reach on 02r RPG T14 live-blade body', () => {
    const camera = enforceCameraOnProse(RPG_T14_BODY, roadState(), 'Travel toward The Weighing Cup');
    expect(camera).toBe(RPG_T14_BODY);
  });

  it('legal travel prose stays the writer\'s (29u: no stamp)', () => {
    const camera = enforceCameraOnProse(LEGAL_TRAVEL, roadState(), 'Travel toward West Wall');
    expect(camera).toBe(LEGAL_TRAVEL);
  });

  it('drops leftover steel on arrival after a refused stamp', () => {
    const scrubbed = scrubOneCameraFight(DND_T28_BODY, roadState(), 'Travel toward West Wall');
    expect(scrubbed).not.toMatch(/\bblade\b/i);
    expect(scrubbed.length).toBeGreaterThan(12);
  });
});
