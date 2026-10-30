/**
 * T10RC6 — absent-speaker leftovers after RC1+RC5: in-range road meeting seats the
 * engine name (slot == seat == gate); Absent-speaker pages never survive draft stage;
 * Ask chips require the same seat list.
 */
import { describe, expect, it } from 'vitest';
import type { GameState, NpcMemory, RoadEncounter } from './types';
import { chipProblem } from './chipLegality';
import { peopleHere, roadMeetingPeople } from './scenePresence';
import { speechAddressCue } from './writerCueLines';
import { checkPlayCrimes } from './turnCheck';
import { ensureSpokenAnswer } from './spokenAnswer';
import { TALKING_RANGE_FT } from './hereSpot';
import { runWriterTurnWithFightRetry, writerDraftProblems, type DraftCheck } from './writerTurn';
import { parsePlayerIntent } from './intentParser';
import { commitTravel } from './travelJourney';
import { createInitialState } from './defaults';

function emptySceneFacts(turn: number) {
  return {
    crowd: 'none' as const,
    noise: 'unknown' as const,
    present: [] as string[],
    props: [] as string[],
    lastBeat: '',
    updatedTurn: turn,
    crowdCount: 0,
  };
}

function mem(over: Partial<NpcMemory>): NpcMemory {
  return {
    npcId: over.npcId ?? `npc:${(over.npcName ?? 'X').toLowerCase().replace(/\s+/g, '-')}`,
    npcName: over.npcName ?? 'X',
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 1,
    ...over,
  };
}

function base(over: Partial<GameState> = {}): GameState {
  return {
    character: { name: 'Jax', level: 1, xp: 0, hp: 20, maxHp: 20, attributes: {} },
    log: [],
    inventory: [],
    quests: [],
    places: [],
    npcMemories: [],
    turn: 22,
    currentLocation: 'On the road between places',
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    sceneFacts: emptySceneFacts(22),
    ...over,
  } as GameState;
}

function roadMeeting(over: Partial<RoadEncounter> = {}): RoadEncounter {
  return {
    kind: 'meeting',
    name: 'Maud Merrow',
    want: 'a hand with a heavy load',
    distanceFt: 5,
    about: 'on their own errand',
    ...over,
  } as RoadEncounter;
}

describe('T10RC6 in-range road meeting seats engine name', () => {
  it('T22/T206 rebuild: 5 ft meeting seat == reaction slot == checkPlayCrimes-visible', () => {
    const name = 'Maud Merrow';
    let s = base({
      engineMode: 'rpg',
      campaignBibleId: 'salt-road-heist',
      turn: 206,
      currentLocation: 'On the road between places',
      sceneFacts: {
        ...emptySceneFacts(206),
        // Stale place cast must not steal the reaction slot.
        present: ['High Chanter Orel Vane'],
        crowd: 'sparse',
        crowdCount: 1,
      },
      npcMemories: [
        mem({ npcName: 'High Chanter Orel Vane', location: 'Cathedral Close', present: true }),
        mem({ npcName: name, location: 'On the road between places', present: false }),
      ],
      journey: {
        from: 'Harbor Fence',
        to: 'Checkpoint Rise',
        legsDone: 1,
        legsTotal: 2,
        ground: 'back streets',
        terrain: 'streets',
        hoursPerLeg: 1,
        startedTurn: 200,
        encounter: roadMeeting({ name, distanceFt: 5 }),
      } as GameState['journey'],
    });
    // Same commit path the harness uses — seats the meeting, clears stale cast.
    s = commitTravel(s, 'Greet whoever is coming').state;
    expect(s.journey?.encounter?.distanceFt).toBeLessThanOrEqual(TALKING_RANGE_FT);
    expect(roadMeetingPeople(s)).toBe(name);
    expect(peopleHere(s)).toContain(name);
    expect(peopleHere(s).some((n) => /Orel/i.test(n))).toBe(false);
    // T10RC6fix2 — seat stamps record place to HERE (readers do not trust bare present[]).
    expect(s.sceneFacts?.present).toContain(name);
    expect(s.npcMemories?.find((m) => m.npcName === name)?.location).toBe(s.currentLocation);
    const cue = speechAddressCue(null, peopleHere(s));
    expect(cue).toMatch(new RegExp(`NPC reaction slot open for ${name}`));
    expect(cue).not.toMatch(/Orel/i);
    const voiced = `${name} said, "Evening. Help me with this crate." The back street held still.`;
    expect(checkPlayCrimes(s, s, 'Greet whoever is coming', voiced).p0.some((f) => f.kind === 'absent-speaker')).toBe(
      false,
    );
    // Stale elsewhere-NPC (or writer invent after harvest) speaking while unseated is absent.
    const stale = 'High Chanter Orel Vane said, "There is a rite to finish." The lantern burned low.';
    expect(
      checkPlayCrimes(s, s, 'Greet whoever is coming', stale).p0.some((f) => f.kind === 'absent-speaker'),
    ).toBe(true);
  });

  it('out-of-range meeting is not seated and opens no reaction slot', () => {
    const s = base({
      journey: {
        from: 'Lowmarket',
        to: 'Cathedral Close',
        legsDone: 0,
        legsTotal: 2,
        ground: 'back streets',
        terrain: 'streets',
        hoursPerLeg: 1,
        startedTurn: 20,
        encounter: roadMeeting({ name: 'Cutha Dunmore', distanceFt: 120 }),
      } as GameState['journey'],
    });
    expect(roadMeetingPeople(s)).toBeNull();
    expect(peopleHere(s)).not.toContain('Cutha Dunmore');
    expect(speechAddressCue('Cutha Dunmore', peopleHere(s))).toMatch(/No one present to answer/);
  });
});

describe('T10RC6 Absent speaker never survives draft stage', () => {
  it('T169 rebuild: page with Absent speaker is not kept as usable', async () => {
    const s = base({
      engineMode: 'rpg',
      campaignBibleId: 'salt-road-heist',
      turn: 169,
      currentLocation: 'Salt Road Waystation',
      sceneFacts: emptySceneFacts(169),
      npcMemories: [mem({ npcName: 'Vessa', location: 'Harbor Fence', present: false })],
    });
    const engineFact =
      'Must narrate: I lean against the post. Speech event: you address the empty scene. No one present to answer.';
    const draft =
      'Jax leaned back against the wooden post at Salt Road Waystation and let their weight settle there. Then Jax began to hum a tuneless song. Jax said, "If you don\'t move faster, I\'m charging you for my time." The only sound left was the creak of the post. Vessa said nothing.';
    const check: DraftCheck = {
      state: s,
      playerInput: 'I lean against the post and start humming',
      intent: parsePlayerIntent('I lean against the post and start humming', s),
      engineFact,
      previousGm: '',
    };
    expect(writerDraftProblems(draft, check).some((p) => p.startsWith('Absent speaker:'))).toBe(true);
    const out = await runWriterTurnWithFightRetry({
      firstRaw: draft,
      packet: { engineResult: engineFact, playerAction: check.playerInput } as never,
      check,
      rewrite: async () =>
        'Jax leaned on the post at Salt Road Waystation and hummed a tuneless song about missing socks. Jax said, "If you don\'t move faster than a snail on sedatives, I\'m charging you for my time." No one was there to answer. The post creaked under their weight.',
    });
    expect(out.prose).not.toMatch(/\bVessa\b/);
    expect(writerDraftProblems(out.prose, check).some((p) => p.startsWith('Absent speaker:'))).toBe(false);
  });
});

describe('T10RC6 ghost Ask chip when unseated', () => {
  it('T44 rebuild: Ask Orel not offered when crowd departed / nobody seated', () => {
    const s = base({
      turn: 44,
      currentLocation: 'Cathedral Close',
      sceneFacts: {
        ...emptySceneFacts(44),
        crowd: 'none',
        present: [],
        crowdCount: 0,
      },
      npcMemories: [
        mem({
          npcName: 'High Chanter Orel Vane',
          location: 'Cathedral Close',
          present: false,
          goal: { motivation: 'Knowledge', target: 'a secret worth selling' },
        }),
      ],
      journey: null,
    });
    expect(peopleHere(s)).toEqual([]);
    const chip = 'Ask High Chanter Orel Vane about a secret worth selling';
    expect(chipProblem(s, chip, 'Nobody in Cathedral Close answered, and only the wind moved.')?.kind).toBe(
      'ghost-chip',
    );
  });
});

describe('T10RC6 empty seats get one absence line', () => {
  it('typed ask with nobody here paints No one was there to answer once', () => {
    const s = base({
      turn: 17,
      currentLocation: 'Lowmarket',
      sceneFacts: emptySceneFacts(17),
      journey: null,
    });
    const out = ensureSpokenAnswer(
      'Jax bent down at Lowmarket and picked up the stray coin from between two cobblestones.',
      s,
      'I flip the coin between my fingers while staring at Osric.',
    );
    expect(out.answer.status).toBe('nobody-here');
    expect(out.prose).toMatch(/No one was there to answer/i);
    expect(out.prose.match(/No one was there to answer/gi)?.length).toBe(1);
  });
});

describe('T10RC6 seed smoke road seat', () => {
  it('commitTravel seats a named in-range meeting from a fresh trip when greet closes range', () => {
    const seed = createInitialState(undefined, 'dnd') as GameState;
    let found: GameState | null = null;
    for (let i = 0; i < 400; i++) {
      const start = {
        ...seed,
        seed: `rc6-road-${i}`,
        engineMode: 'dnd' as const,
        campaignBibleId: 'cursed-keep',
        currentLocation: 'Greyhollow Inn',
        worldAtlas: null,
        activeEncounter: null,
        journey: null,
        sceneFacts: seed.sceneFacts
          ? { ...seed.sceneFacts, pendingEncounter: undefined, present: ['Father Aldous'], crowd: 'sparse' as const, crowdCount: 1 }
          : emptySceneFacts(0),
        npcMemories: [
          mem({ npcName: 'Father Aldous', location: 'Greyhollow Inn', present: true }),
        ],
      } as GameState;
      const mid = commitTravel(start, 'Travel toward Keep Gate').state;
      const enc = mid.journey?.encounter;
      if (!enc?.name || enc.kind !== 'meeting') continue;
      if (typeof enc.distanceFt === 'number' && enc.distanceFt > TALKING_RANGE_FT) {
        const greeted = commitTravel(mid, 'Greet whoever is coming').state;
        if ((greeted.journey?.encounter?.distanceFt ?? 999) > TALKING_RANGE_FT) continue;
        found = greeted;
      } else {
        found = mid;
      }
      break;
    }
    expect(found).toBeTruthy();
    const name = found!.journey!.encounter!.name!;
    expect(peopleHere(found!)).toContain(name);
    expect(peopleHere(found!).some((n) => /Aldous/i.test(n))).toBe(false);
    expect(speechAddressCue(null, peopleHere(found!))).toMatch(new RegExp(`NPC reaction slot open for ${name}`));
  });
});
