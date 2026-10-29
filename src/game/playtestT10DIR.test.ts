/**
 * T10DIR — one Director owns "what happens next".
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, NpcMemory } from './types';
import { emptySceneFacts } from './sceneFacts';
import {
  STALL_N,
  applyDirectorChipPolicy,
  filterDirectorTravelChips,
  isJobAsk,
  planDirector,
  resolveJobTalk,
  stallPressureActive,
  travelDestFromChip,
} from './director';
import { planSceneThreads, stallPressureActive as otStall } from './openThreads';
import { nudgeIfStuck } from './choiceRanking';
import { BUILD_ID, BUILD_STAMP } from './runManifest';
import { ALLOW_LISTS, DIRECTOR_FIELDS } from './singleWriterAllow';
import { peopleHere } from './chipLegality';
// Side-effect: bind planDirector for planSceneThreads.
import './director';

function mem(over: Partial<NpcMemory> & { npcName: string }): NpcMemory {
  return {
    npcId: over.npcId ?? `npc-${over.npcName.replace(/\s+/g, '-').toLowerCase()}`,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 1,
    met: true,
    present: true,
    aliases: [],
    introSpoken: true,
    ...over,
  } as NpcMemory;
}

function base(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'rpg') as GameState;
  return {
    ...s,
    engineMode: 'rpg',
    campaignBibleId: 'salt-road-heist',
    character: { ...s.character, name: 'Jax' },
    turn: 10,
    currentLocation: 'Salt Road Waystation',
    sceneFacts: {
      ...emptySceneFacts(10),
      crowd: 'sparse',
      present: ['Piers Thatch'],
      crowdCount: 1,
    },
    npcMemories: [
      mem({
        npcName: 'Piers Thatch',
        roleHint: 'quest-patron',
        offer: 'coin for a road job',
        need: 'someone to take the job',
        goal: { motivation: 'Protection', target: 'Harbor Fence' },
        location: 'Salt Road Waystation',
        present: true,
      }),
    ],
    places: [
      { id: 'hub-waystation', name: 'Salt Road Waystation', lastVisitedTurn: 8 },
      { id: 'hub-camp', name: 'Consul Caravan Camp', lastVisitedTurn: 5 },
      { id: 'hub-harbor', name: 'Harbor Fence', lastVisitedTurn: undefined },
    ],
    circling: { stale: {}, lastProgressTurn: 8 },
    progressGovernor: { turnsSinceProgress: 2, lastProgressTurn: 8, recentDeltas: [] },
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax' },
      complete: true,
      sceneWritten: true,
    },
    ...over,
  } as GameState;
}

describe('T10DIR director', () => {
  it('STALL_N is 2 and fires before LOOP STOP (5)', () => {
    expect(STALL_N).toBe(2);
    expect(STALL_N).toBeLessThan(5);
    const s = base({
      turn: 12,
      circling: { stale: {}, lastProgressTurn: 10 },
      progressGovernor: { turnsSinceProgress: 2, lastProgressTurn: 10, recentDeltas: [] },
    });
    expect(stallPressureActive(s)).toBe(true);
    expect(otStall(s)).toBe(true);
  });

  it('stall injects a concrete world development (engine fact)', () => {
    const s = base({
      turn: 12,
      circling: { stale: {}, lastProgressTurn: 10 },
      progressGovernor: { turnsSinceProgress: 2, lastProgressTurn: 10, recentDeltas: [] },
    });
    expect(stallPressureActive(s)).toBe(true);
    const { state, plan, receipts } = planDirector(s);
    expect(plan.need).not.toBe('none');
    expect(receipts.length + (plan.development?.fact ? 1 : 0)).toBeGreaterThan(0);
    expect(state.directorPlan?.turn).toBe(12);
    expect(state.sceneThreadPlan?.plannedTurn).toBe(12);
    // Injection itself is recorded; lastProgressTurn is NOT advanced by writeDirectorNudge.
    expect(state.circling?.lastProgressTurn).toBe(10);
  });

  it('never offers travel chip to the current place (by id)', () => {
    const s = base();
    const chips = [
      'Travel toward Salt Road Waystation',
      'Travel toward Harbor Fence',
      'Ask Piers Thatch about the job',
    ];
    const filtered = filterDirectorTravelChips(s, chips);
    expect(filtered.some((c) => /waystation/i.test(c))).toBe(false);
    expect(filtered.some((c) => /Harbor Fence/i.test(c))).toBe(true);
    expect(travelDestFromChip('Travel toward Harbor Fence')).toBe('Harbor Fence');
  });

  it('blocks ping-pong A→B→A without a new director travel reason', () => {
    // Player was at Waystation, traveled to Camp (HERE); offering Waystation again is the bounce.
    const s = base({
      currentLocation: 'Consul Caravan Camp',
      directorPlan: { need: 'none', chips: [], turn: 10 },
    });
    // newest last: arrived at Camp from Waystation; offering Waystation again is the bounce.
    const recent = ['Travel toward Salt Road Waystation', 'Travel toward Consul Caravan Camp'];
    const filtered = filterDirectorTravelChips(
      s,
      ['Travel toward Salt Road Waystation', 'Travel toward Harbor Fence'],
      recent,
    );
    expect(filtered.some((c) => /Salt Road Waystation/i.test(c))).toBe(false);
    expect(filtered.some((c) => /Harbor Fence/i.test(c))).toBe(true);
  });

  it('replaces a twice-no-op chip with the next plan chip', () => {
    const s = base({
      directorPlan: {
        need: 'lead',
        chips: [
          { label: 'Travel toward Harbor Fence', reason: 'lead' },
          { label: 'Ask Piers Thatch about the lead', reason: 'talk' },
        ],
        turn: 10,
      },
    });
    const next = applyDirectorChipPolicy(s, ['Use Holy Water (Flask)', 'Look around'], {
      noOpChip: 'Use Holy Water (Flask)',
    });
    expect(next.some((c) => /Holy Water/i.test(c))).toBe(false);
    expect(next[0]).toMatch(/Harbor Fence|Ask Piers/i);
  });

  it('job ask resolves to accept/decline within 2 asks', () => {
    expect(isJobAsk('Ask Piers Thatch about the job')).toBe(true);
    let s = base();
    const first = resolveJobTalk(s, 'Ask Piers Thatch about the job');
    expect(first.plan.need).toBe('quest-offer');
    expect(first.chips.some((c) => /Accept the job/i.test(c.label))).toBe(true);
    expect(first.chips.some((c) => /Decline the job/i.test(c.label))).toBe(true);
    s = first.state;
    const second = resolveJobTalk(s, 'Ask Piers Thatch about the job');
    expect(second.chips.length).toBeGreaterThan(0);
    // At most 2 asks — third empty path yields lead only.
    const third = resolveJobTalk(second.state, 'Ask Piers Thatch about the job');
    expect(third.plan.need === 'lead' || third.chips.length > 0).toBe(true);
  });

  it('planSceneThreads delegates to director (no local stall decision)', () => {
    const s = base({
      turn: 14,
      circling: { stale: {}, lastProgressTurn: 11 },
      progressGovernor: { turnsSinceProgress: 3, lastProgressTurn: 11, recentDeltas: [] },
    });
    const after = planSceneThreads(s);
    expect(after.directorPlan).toBeTruthy();
    expect(after.sceneThreadPlan?.plannedTurn).toBe(14);
  });

  it('nudgeIfStuck never returns the OPT-5 dead-end note', () => {
    const s = base({
      turn: 20,
      circling: { stale: {}, lastProgressTurn: 16, nudgedTurn: undefined },
      progressGovernor: { turnsSinceProgress: 4, lastProgressTurn: 16, recentDeltas: [] },
    });
    const r = nudgeIfStuck(s);
    expect(r.notes.join(' ')).not.toMatch(/Nudge skipped.*OPT-5/);
  });

  it('BUILD_STAMP literal stays; BUILD_ID is tag+sha', () => {
    expect(BUILD_STAMP).toBe('2026-10-27a');
    expect(BUILD_ID.startsWith(`${BUILD_STAMP}+`)).toBe(true);
  });

  it('director fields are allow-listed to director.ts only', () => {
    for (const f of DIRECTOR_FIELDS) {
      expect(ALLOW_LISTS[f]).toEqual(['src/game/director.ts']);
    }
  });
});

describe('T10DIR dry-run fate harness reaches director (no paid AI)', () => {
  it('dry-run headlessFateTurn under stall writes stallWorldFact + directorPlan chips', async () => {
    const store = new Map<string, string>();
    (globalThis as { localStorage?: Storage }).localStorage = {
      getItem: (k) => store.get(k) ?? null,
      setItem: (k, v) => { store.set(k, String(v)); },
      removeItem: (k) => { store.delete(k); },
      clear: () => store.clear(),
      key: (i) => [...store.keys()][i] ?? null,
      get length() { return store.size; },
    } as Storage;

    const { headlessFateTurn } = await import('./fateAutoplay');
    const { createDefaultSettings } = await import('./defaults');
    let s = base({
      engineMode: 'dnd',
      campaignBibleId: 'cursed-keep',
      turn: 12,
      openingEstablishment: {
        pending: [],
        answers: { name: 'Jax' },
        complete: true,
        sceneWritten: true,
      },
      progressGovernor: { turnsSinceProgress: STALL_N + 1, lastProgressTurn: 8, recentDeltas: [] },
      circling: { stale: {}, lastProgressTurn: 8, recentPlaces: ['Keep Gate'] },
      currentLocation: 'Keep Gate',
      offeredPad: { turn: 12, choices: ['Look around', 'Wait', 'Study the clues'] },
    });
    const settings = { ...createDefaultSettings(), subscriptionTier: 'free' as const };
    const rng = () => 0.42;
    const result = await headlessFateTurn(s, settings, rng, {
      bibleId: 'cursed-keep',
      personalityId: 'chilled-gm',
      seed: 42,
      mode: 'first-pad',
      aiAgentMode: 'default',
      dryRun: true,
    });
    // Dry-run previously returned before planSceneThreads — must now reach the director.
    expect(
      !!(result.state.sceneFacts?.stallWorldFact
        || (result.state.directorPlan && result.state.directorPlan.need !== 'none')
        || (result.telemetry.systemLog ?? []).some((l) => /Stall pressure|Nudge:/i.test(l))),
    ).toBe(true);
    const pad = result.state.offeredPad?.choices ?? result.state.choices ?? [];
    for (const chip of pad) {
      const dest = travelDestFromChip(chip);
      if (dest) {
        expect(dest.toLowerCase()).not.toBe((result.state.currentLocation ?? '').toLowerCase());
      }
    }
  });
});

describe('T10DIR offline 30-turn first-chip policy (no paid AI)', () => {
  function drive(mode: 'dnd' | 'rpg' | 'litrpg', seed: number): void {
    let s = base({
      engineMode: mode,
      campaignBibleId: mode === 'dnd' ? 'cursed-keep' : mode === 'litrpg' ? 'summoned-pact' : 'salt-road-heist',
      seed: String(seed),
      turn: 1,
      circling: { stale: {}, lastProgressTurn: 1, recentPlaces: [] },
      progressGovernor: { turnsSinceProgress: 0, lastProgressTurn: 1, recentDeltas: [] },
    });
    const recentChips: string[] = [];
    let noProgress = 0;
    for (let t = 1; t <= 30; t++) {
      s = { ...s, turn: t };
      // Simulate stall pressure every few turns without real XP.
      if (noProgress >= STALL_N) {
        s = {
          ...s,
          progressGovernor: {
            turnsSinceProgress: noProgress,
            lastProgressTurn: t - noProgress,
            recentDeltas: [],
          },
          circling: { ...(s.circling ?? { stale: {}, lastProgressTurn: t - noProgress }), lastProgressTurn: t - noProgress },
        };
      }
      const planned = planDirector(s, { playerInput: '', recentChips });
      s = planned.state;
      const chips = applyDirectorChipPolicy(s, [
        ...(s.directorPlan?.chips.map((c) => c.label) ?? []),
        'Look around',
        'Wait',
        `Travel toward ${s.currentLocation}`,
        'Travel toward Harbor Fence',
        'Travel toward Consul Caravan Camp',
      ], { recentChips });
      // Never travel to current place.
      for (const c of chips) {
        const dest = travelDestFromChip(c);
        if (!dest) continue;
        expect(dest.toLowerCase()).not.toBe((s.currentLocation ?? '').toLowerCase());
      }
      // First-chip policy.
      const pick = chips[0] ?? 'Look around';
      recentChips.push(pick);
      if (recentChips.length > 8) recentChips.shift();
      const dest = travelDestFromChip(pick);
      if (dest && dest.toLowerCase() !== (s.currentLocation ?? '').toLowerCase()) {
        const prev = s.currentLocation;
        s = {
          ...s,
          currentLocation: dest,
          circling: {
            ...(s.circling ?? { stale: {}, lastProgressTurn: t }),
            lastProgressTurn: t,
            prevPlace: prev,
            recentPlaces: [...(s.circling?.recentPlaces ?? []), dest].slice(-4),
          },
          progressGovernor: { turnsSinceProgress: 0, lastProgressTurn: t, recentDeltas: [] },
        };
        noProgress = 0;
      } else if (planned.plan.need !== 'none') {
        // Acting on a development counts as progress only when the player moves/accepts —
        // injection alone does not reset; picking a director chip that is not travel still
        // advances the stall clock unless it is an accept.
        noProgress += 1;
        if (/Accept the job/i.test(pick)) {
          noProgress = 0;
          s = {
            ...s,
            circling: { ...(s.circling ?? { stale: {}, lastProgressTurn: t }), lastProgressTurn: t },
            progressGovernor: { turnsSinceProgress: 0, lastProgressTurn: t, recentDeltas: [] },
          };
        }
      } else {
        noProgress += 1;
      }
      // No LOOP-STOP-style 5-turn window without a director response once stalled.
      if (noProgress >= 5) {
        expect(stallPressureActive(s) ? (s.directorPlan?.need !== 'none' || (s.sceneFacts?.stallWorldFact ?? '').length > 0) : true).toBe(true);
        // Force a director beat so the window cannot persist without ownership.
        const forced = planDirector({
          ...s,
          progressGovernor: { turnsSinceProgress: STALL_N, lastProgressTurn: t - STALL_N, recentDeltas: [] },
          circling: { ...(s.circling ?? { stale: {}, lastProgressTurn: t - STALL_N }), lastProgressTurn: t - STALL_N },
        });
        expect(forced.plan.need !== 'none' || forced.receipts.length > 0).toBe(true);
        s = forced.state;
        noProgress = STALL_N;
      }
    }
  }

  it('dnd seed 42: no travel-to-here / no unmanaged 5-turn stall', () => {
    drive('dnd', 42);
  });
  it('rpg seed 42: no travel-to-here / no unmanaged 5-turn stall', () => {
    drive('rpg', 42);
  });
  it('litrpg seed 42: no travel-to-here / no unmanaged 5-turn stall', () => {
    drive('litrpg', 42);
  });
});

describe('T10DIR absent NPC speech', () => {
  it('director speech path: present:false Nell is not a seated speaker candidate', () => {
    const s = base({
      engineMode: 'litrpg',
      campaignBibleId: 'summoned-pact',
      turn: 57,
      currentLocation: 'Cathedral Close',
      sceneFacts: {
        ...emptySceneFacts(57),
        crowd: 'sparse',
        present: ['Ysolde Merrow'],
        crowdCount: 1,
      },
      npcMemories: [
        mem({
          npcName: 'Ysolde Merrow',
          present: true,
          location: 'Cathedral Close',
        }),
        mem({
          npcName: 'Nell Rudd',
          present: false,
          location: 'Lowmarket', // not HERE; and present:false
        }),
      ],
    });
    const here = peopleHere(s);
    expect(here.some((n) => /Nell Rudd/i.test(n))).toBe(false);
    expect(here.some((n) => /Ysolde/i.test(n))).toBe(true);
    // sceneFacts.present must not list Nell either (SM1 seat list).
    expect((s.sceneFacts?.present ?? []).some((n) => /Nell/i.test(n))).toBe(false);
  });
});
