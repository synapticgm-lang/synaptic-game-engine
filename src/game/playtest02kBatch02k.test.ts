/**
 * Batch 02k — Lock C residual: dead foe must not greet as a living NPC.
 * Mid writer OFF.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { harvestNarrativeIntoLedger } from './narrativeHarvest';
import { scrubDeadFoeReengage } from './proseWarden';
import { isFactClosedViolation } from './beatCommitGate';
import { attachLastKill } from './combatAuthority';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import type { GameState } from './types';

const KILL = {
  name: 'Void-Touched Scavenger',
  outcome: 'victory' as const,
  turn: 38,
  remains: true,
};

describe('Batch 02k stamps', () => {
  it('HUD and BUILD stay at or after 2026-09-02k and Mid writer stays OFF', () => {
    expect(HUD_BUILD_STAMP >= '2026-09-02k').toBe(true);
    expect(BUILD_STAMP >= '2026-09-02k').toBe(true);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });
});

describe('Batch 02k — Lock C: dead foe living rez', () => {
  it('scrubs lastKill greeter rez and keeps corpse language', () => {
    const greeter =
      'the Void-Touched Scavenger, a stout man with a bushy beard, looks up from his mug of ale and nods in greeting.';
    const out = scrubDeadFoeReengage(greeter, KILL, false);
    expect(out).not.toMatch(/nods in greeting/i);
    expect(out).toMatch(/fallen/i);

    const corpse = 'The fallen Void-Touched Scavenger lies where you left them. Ichor pools on the boards.';
    expect(scrubDeadFoeReengage(corpse, KILL, false)).toMatch(/ichor/i);
  });

  it('rejects living-greeter commit after lastKill', () => {
    let state = createInitialState(undefined, 'litrpg') as GameState;
    state = attachLastKill(state, KILL);
    expect(
      isFactClosedViolation(
        state,
        'the Void-Touched Scavenger, a stout man with a bushy beard, looks up from his mug of ale and nods in greeting.'
      )
    ).toBe(true);
    expect(
      isFactClosedViolation(state, 'The fallen Void-Touched Scavenger lies where you left them.')
    ).toBe(false);
  });

  it('does not re-harvest lastKill into present[]', () => {
    let state = createInitialState(undefined, 'litrpg') as GameState;
    state = {
      ...state,
      bibleId: 'summoned-pact',
      campaignBibleId: 'summoned-pact',
      sceneFacts: {
        ...emptySceneFacts(40),
        present: ['Brother Tam'],
        lastKill: KILL,
      },
    };
    const next = harvestNarrativeIntoLedger(
      state,
      'You push through the swinging doors. Brother Tam nods. the Void-Touched Scavenger looks up from his mug of ale.',
      40
    );
    expect(next.sceneFacts?.present ?? []).toContain('Brother Tam');
    expect(next.sceneFacts?.present?.some((p) => /scavenger/i.test(p))).toBe(false);
  });
});
