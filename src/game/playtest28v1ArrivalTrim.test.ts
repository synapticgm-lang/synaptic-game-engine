/**
 * 28v1 — the travel-arrival stamp goes through the same recycle trim as the writer's beat.
 */
import { describe, expect, it } from 'vitest';
import { stampTravelArrivalIfSafe } from './oneCameraFight';
import type { GameState } from './types';

const BODY = 'Rope creaks on the rampart. A sentry counts crates by the gate. Gulls fight over a fish head.';

function stateWithLog(gm: string[]): Pick<GameState, 'activeEncounter' | 'sceneFacts' | 'log'> {
  return {
    activeEncounter: undefined,
    sceneFacts: undefined,
    log: gm.map((content, i) => ({ id: `g${i}`, role: 'gm', content, timestamp: i })) as GameState['log'],
  };
}

describe('28v1 arrival stamp recycle trim', () => {
  it('drops a repeat-trip arrival stamp already told in a recent beat', () => {
    const prior = 'You leave Lowmarket behind and reach West Wall. Wind worries the banners.';
    const out = stampTravelArrivalIfSafe(BODY, 'West Wall', 'Lowmarket', stateWithLog([prior]));
    expect(out).not.toMatch(/You leave Lowmarket behind and reach West Wall/);
    expect(out).toBe(BODY);
  });

  it('keeps a first-trip arrival stamp', () => {
    const out = stampTravelArrivalIfSafe(BODY, 'West Wall', 'Lowmarket', stateWithLog(['Mud on the market stones.']));
    expect(out).toMatch(/^You leave Lowmarket behind and reach West Wall\./);
  });

  it('keeps a repeat stamp when the trim would leave fewer than two sentences', () => {
    const prior = 'You leave Lowmarket behind and reach West Wall.';
    const out = stampTravelArrivalIfSafe('Gulls wheel.', 'West Wall', 'Lowmarket', stateWithLog([prior]));
    expect(out).toMatch(/reach West Wall\./);
  });

  it('without a log the stamp is unchanged', () => {
    const out = stampTravelArrivalIfSafe(BODY, 'West Wall', 'Lowmarket', { activeEncounter: undefined, sceneFacts: undefined });
    expect(out).toMatch(/^You leave Lowmarket behind and reach West Wall\./);
  });
});
