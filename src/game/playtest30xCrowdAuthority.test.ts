/**
 * Site-wide crowd / presence authority — count buckets, not Josie phrase pairs.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import {
  applyProseWarden,
  calculateCrowdSize,
  crowdSizeForWarden,
  scrubInventedCrowdSize,
} from './proseWarden';
import {
  harvestCrowdIntoSceneFacts,
  resolveCrowdHeadcount,
} from './crowdAuthority';
import { applyCommittedNarrative, seedOpeningSceneFacts } from './sceneFacts';
import { harvestNarrativeIntoLedger } from './narrativeHarvest';
import { formatSceneSnapshotForPrompt } from './situationPacket';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { HUD_BUILD_STAMP } from '../components/Hud';
import type { EngineMode, GameState } from './types';

function withCrowd(state: GameState, present: string[], crowdCount?: number): GameState {
  return {
    ...state,
    openingEstablishment: {
      pending: [],
      answers: {},
      complete: true,
      aloneArrival: false,
    },
    sceneFacts: {
      crowd: (crowdCount ?? present.length) > 0 ? 'present' : 'none',
      noise: 'voices',
      present,
      props: [],
      lastBeat: '',
      updatedTurn: 1,
      crowdCount,
    },
  };
}

describe('playtest30x — site-wide crowd presence authority', () => {
  it('stamp is 2026-08-30X / 30q and Mid writer stays OFF', () => {
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(BUILD_STAMP >= '2026-08-30q').toBe(true);
    expect(HUD_BUILD_STAMP >= '2026-08-30X').toBe(true);
  });

  it('does not treat blue panel + handlers as a locked pair', () => {
    const state = createInitialState(undefined, 'litrpg');
    state.openingEstablishment = {
      pending: [],
      answers: {},
      complete: false,
      aloneArrival: false,
    };
    const seeded = seedOpeningSceneFacts(state);
    const resolved = resolveCrowdHeadcount({ ...state, sceneFacts: seeded });
    expect(resolved.locked).toBe(false);
    expect(calculateCrowdSize({ ...state, sceneFacts: seeded })).toBe(-1);
    expect(seeded.present).not.toContain('handlers');
  });

  it('warden buckets: 0 / 1 / 2 / small group / large', () => {
    const groupLine = 'Around you, a scattered group of individuals wait in disarray.';
    const pairLine = 'You look towards the two figures who were present when you arrived.';
    const fewLine = 'A few people glance over.';
    const largeLine = 'A hundred people cheer.';
    const severalLine = 'Several onlookers press closer.';

    expect(scrubInventedCrowdSize(groupLine, 0, false)).not.toMatch(/group of individuals/i);
    expect(scrubInventedCrowdSize(pairLine, 1, true)).toMatch(/the person here/i);
    expect(scrubInventedCrowdSize(pairLine, 1, true)).not.toMatch(/two figures/i);

    const pairFromGroup = scrubInventedCrowdSize(groupLine, 2, true);
    expect(pairFromGroup).toMatch(/two people here/i);
    expect(pairFromGroup).not.toMatch(/group of individuals/i);
    expect(scrubInventedCrowdSize(severalLine, 2, true)).not.toMatch(/several/i);
    expect(scrubInventedCrowdSize(largeLine, 2, true)).not.toMatch(/hundred people/i);

    const groupFromPair = scrubInventedCrowdSize(pairLine, 5, true);
    expect(groupFromPair).toMatch(/the people here/i);
    expect(groupFromPair).not.toMatch(/two figures/i);
    expect(scrubInventedCrowdSize(fewLine, 5, true)).not.toMatch(/a few people/i);

    const largeKeepsCrowd = scrubInventedCrowdSize(largeLine, 20, true);
    expect(largeKeepsCrowd).toMatch(/hundred people/i);
    expect(scrubInventedCrowdSize(pairLine, 20, true)).not.toMatch(/two figures/i);
  });

  it('does not rewrite object pairs or the two of you', () => {
    expect(scrubInventedCrowdSize('A pair of boots sits by the door.', 5, true)).toMatch(/pair of boots/i);
    expect(scrubInventedCrowdSize('She wipes both hands on her coat.', 5, true)).toMatch(/both hands/i);
    expect(scrubInventedCrowdSize('The two of you keep walking.', 5, true)).toMatch(/two of you/i);
  });

  it('unlocked count does not swap group ↔ pair until a mention locks the beat', () => {
    const mixed =
      'A scattered group of individuals wait. You look towards the two figures who were present.';
    expect(scrubInventedCrowdSize(mixed, -1, true)).toMatch(/group of individuals/i);
    expect(scrubInventedCrowdSize(mixed, -1, true)).toMatch(/two figures/i);

    const state = withCrowd(createInitialState(undefined, 'rpg'), ['blue panel']);
    const n = crowdSizeForWarden(state, mixed);
    expect(n).toBe(5);
    const sameBeat = applyProseWarden(mixed, { crowdSize: n, crowdPresent: true });
    expect(sameBeat).not.toMatch(/two figures/i);
    expect(sameBeat).toMatch(/people here|group of individuals/i);
  });

  it('harvest locks two / group and refuses shrink or grow without enter/leave', () => {
    const empty = harvestCrowdIntoSceneFacts(undefined, 'You wake in the dark.', 1);
    expect(empty.crowdCount).toBeUndefined();

    const pair = harvestCrowdIntoSceneFacts(undefined, 'Two figures watch from the wall.', 1);
    expect(pair.crowdCount).toBe(2);
    expect(countPeople(pair.present)).toBe(2);

    const group = harvestCrowdIntoSceneFacts(undefined, 'A scattered group of individuals wait.', 1);
    expect(group.crowdCount).toBe(5);
    expect(countPeople(group.present)).toBe(5);

    const noShrink = harvestCrowdIntoSceneFacts(group, 'You look towards the two figures who were present when you arrived.', 2);
    expect(noShrink.crowdCount).toBe(5);

    const noGrow = harvestCrowdIntoSceneFacts(pair, 'A scattered group of individuals mill about.', 2);
    expect(noGrow.crowdCount).toBe(2);

    const grew = harvestCrowdIntoSceneFacts(
      pair,
      'More people arrive. A group of individuals fills the hall.',
      2
    );
    expect(grew.crowdCount).toBe(5);
  });

  it('applyCommittedNarrative + harvest ledger stay consistent on later turns', () => {
    const state = withCrowd(createInitialState(undefined, 'dnd'), []);
    const first = applyCommittedNarrative(state, 'Two strangers stand by the gate.', 1);
    expect(first.crowdCount).toBe(2);

    const second = applyCommittedNarrative(
      { ...state, sceneFacts: first },
      'A crowd of people suddenly fills the yard.',
      2
    );
    expect(second.crowdCount).toBe(2);

    const named = harvestNarrativeIntoLedger(
      { ...state, sceneFacts: first },
      'Mira says nothing. Two figures wait.',
      2
    );
    expect(named.sceneFacts?.crowdCount).toBe(2);
    expect(named.sceneFacts?.present.some((p) => /mira/i.test(p))).toBe(true);
  });

  it('SNAPSHOT Crowd line is mode-agnostic and uses the locked count', () => {
    const modes: EngineMode[] = ['litrpg', 'dnd', 'rpg', 'pyoa'];
    for (const mode of modes) {
      const state = withCrowd(createInitialState(undefined, mode), ['Herald', 'figure 1'], 2);
      const snap = formatSceneSnapshotForPrompt(state);
      expect(snap).toMatch(/Crowd: present \/ intimate \(~2\)/);
      expect(snap).toMatch(/CROWD COUNT \(BINDING\): 2 people/);
      expect(snap).toMatch(/AUTHORITY:.*crowd count/);
    }
  });

  it('24f hundred-people scrub still fires on a small locked count', () => {
    const out = applyProseWarden('A hundred people cheer.', {
      crowdSize: 3,
      crowdPresent: true,
    });
    expect(out.toLowerCase()).not.toContain('hundred people');
  });
});

function countPeople(present: string[]): number {
  return present.filter((p) => /^figure\s+\d+$/i.test(p) || !/blue panel|system panel/i.test(p)).length;
}
