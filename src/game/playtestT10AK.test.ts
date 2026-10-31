/**
 * T10AK — travel departure names engine destination after post-writer drops; threat/demand
 * wordless freeze is not an answer; a visible act that answers a tell/demand is.
 * Evidence: tabletop s9831 T10–T11; salt-road s9832 T5–T8.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, NpcMemory, TravelJourney } from './types';
import { emptySceneFacts } from './sceneFacts';
import { demandActAnswered, ensureSpokenAnswer, stripSpeakerSilence } from './spokenAnswer';
import { checkActionFollowed } from './turnCheck';
import { sealPostWriterProse, withMoveDestination } from './writerTurn';

function mem(over: Partial<NpcMemory> & { npcName: string }): NpcMemory {
  return {
    npcId: over.npcId ?? `npc-${over.npcName.replace(/\s+/g, '-').toLowerCase()}`,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 1,
    met: true,
    present: true,
    aliases: [],
    ...over,
  } as NpcMemory;
}

function tabletopRoad(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'dnd') as GameState;
  const journey = {
    from: 'Keep Gate',
    to: 'Greyhollow Inn',
    ground: 'Open road',
    terrain: 'road',
    legsDone: 1,
    legsTotal: 2,
    hoursPerLeg: 2,
    startedTurn: 11,
    encounter: null,
  } as TravelJourney;
  return {
    ...s,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    character: { ...s.character!, name: 'Jax', hp: 12, maxHp: 12, level: 1 },
    turn: 11,
    currentLocation: 'On the road between places',
    journey,
    circling: { movedTurn: 11, lastLocation: 'On the road between places', prevPlace: 'Keep Gate' },
    sceneFacts: { ...emptySceneFacts(), crowd: 'none', present: [], props: [], crowdCount: 0 },
    openingEstablishment: { pending: [], answers: { name: 'Jax' }, complete: true, sceneWritten: true },
    ...over,
  } as GameState;
}

function lockpickDoor(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'rpg') as GameState;
  const lockpick = mem({
    npcName: 'the hired lockpick',
    location: 'Consul counting-house back door',
    introSpoken: true,
    sheet: {
      job: 'lockpick',
      motive: 'materials and commissions',
      fear: '',
      speech: '',
      secret: '',
      place: 'town',
    },
  });
  return {
    ...s,
    engineMode: 'rpg',
    campaignBibleId: 'salt-road-heist',
    character: { ...s.character!, name: 'Jax', hp: 12, maxHp: 12, level: 1 },
    turn: 6,
    currentLocation: 'Consul counting-house back door',
    sceneFacts: {
      ...emptySceneFacts(),
      crowd: 'present',
      present: ['the hired lockpick'],
      props: ['lock', 'rusted delivery door'],
      crowdCount: 1,
      lastBeat: 'counting-house back door',
      updatedTurn: 6,
    },
    npcMemories: [lockpick],
    openingEstablishment: { pending: [], answers: { name: 'Jax' }, complete: true, sceneWritten: true },
    ...over,
  } as GameState;
}

describe('T10AK travel departure names Greyhollow Inn', () => {
  it('withMoveDestination / sealPostWriterProse name the journey destination when prose omitted it', () => {
    const state = tabletopRoad();
    const prose =
      'Jax left Keep Gate behind and walked out onto the open road with the greatsword resting easy in their hands. The road stayed quiet and gave Jax nothing back, and no other traveller came near enough to hail.';
    const line = 'Travel toward Greyhollow Inn';
    expect(withMoveDestination(state, prose)).toMatch(/Greyhollow Inn/i);
    const sealed = sealPostWriterProse(state, prose, line);
    expect(sealed.prose).toMatch(/Greyhollow Inn/i);
    // CirclingMemory requires stale + lastProgressTurn; only override lastLocation for the departure snapshot.
    const before: GameState = {
      ...state,
      currentLocation: 'Keep Gate',
      journey: null,
      circling: {
        ...(state.circling ?? { stale: {}, lastProgressTurn: 0 }),
        lastLocation: 'Keep Gate',
      },
    };
    const after = state;
    expect(checkActionFollowed(before, after, line, sealed.prose).p0.some((f) => f.kind === 'ignored-action')).toBe(
      false,
    );
  });

  it('seal recovers the destination after a post-writer drop of the only dest sentence', () => {
    const state = tabletopRoad();
    const afterDrop =
      'Jax left Keep Gate behind and walked out onto the open road with the greatsword resting easy in their hands. The road stayed quiet and gave Jax nothing back, and no other traveller came near enough to hail.';
    const sealed = sealPostWriterProse(state, afterDrop, 'Travel toward Greyhollow Inn');
    expect(sealed.prose).toMatch(/toward Greyhollow Inn/i);
  });
});

describe('T10AK threat / demand reply beats', () => {
  const kickTell =
    "I kick the lockpick's shin and tell them to stop stalling before I start counting their teeth.";
  const pistolDemand =
    "I shove Jax back by the shoulders and draw my pistol. I aim it at the lockpick's head and tell them to start working right now or I'll paint the wall with their brains.";

  it('wordless freeze is stripped; ensureSpokenAnswer lands content (not stayed quiet alone)', () => {
    const state = lockpickDoor();
    const silent =
      "Jax kicked the hired lockpick's shin, and the kick landed hard on the bone. Jax told the hired lockpick to stop stalling. The hired lockpick stayed quiet and did not move their hands, and the lock sat untouched.";
    const stripped = stripSpeakerSilence(silent, { label: 'the hired lockpick' });
    expect(stripped).not.toMatch(/stayed quiet/i);
    expect(stripped).not.toMatch(/did not move their hands/i);
    const out = ensureSpokenAnswer(silent, state, kickTell);
    expect(out.answer.status).toBe('added');
    expect(out.prose).toMatch(/["“][^"”]{2,}["”]/);
    expect(out.prose).not.toMatch(/stayed quiet/i);
    expect(checkActionFollowed(state, state, kickTell, out.prose).p0.some((f) => f.kind === 'ignored-action')).toBe(
      false,
    );
  });

  it('jabbed toward the lock answers "start working" — gate is not ignored-action', () => {
    const state = lockpickDoor({ turn: 7 });
    const act =
      "Jax grabbed the hired lockpick by both shoulders and shoved them back. Jax pulled the pistol from their belt. The hired lockpick jabbed a finger toward the lock.";
    expect(demandActAnswered(pistolDemand, act, 'the hired lockpick')).toBe(true);
    const out = ensureSpokenAnswer(act, state, pistolDemand);
    expect(out.answer.status).toBe('already-quoted');
    expect(out.prose).toBe(act);
    expect(out.prose).not.toMatch(/materials and commissions/i);
    expect(checkActionFollowed(state, state, pistolDemand, act).p0.some((f) => f.kind === 'ignored-action')).toBe(
      false,
    );
  });

  it('sealPostWriterProse re-lands a spoken reply when post-writer left only silence', () => {
    const state = lockpickDoor();
    const silent =
      "Jax kicked the hired lockpick's shin. The hired lockpick stayed quiet and did not move their hands.";
    const sealed = sealPostWriterProse(state, silent, kickTell);
    expect(sealed.prose).toMatch(/["“][^"”]{2,}["”]/);
    expect(sealed.prose).not.toMatch(/stayed quiet/i);
  });
});

describe('T10AK SRD — brandish is not auto-combat (honest prose only)', () => {
  it('pistol aim + tell-to-work stays a social/demand beat; demand-act prose is followed', () => {
    // SRD 5.2.1 Communicating / Ability Checks: the DM calls for a check when the outcome is
    // uncertain — brandishing is Intimidation/social unless the engine opens an encounter.
    // Evidence T7: brandish stayed social (no activeEncounter). Prose aims the pistol; no fight start.
    // T10SOC: LitRPG no longer mints flat Social track on talk; intimidation is use-based when present.
    const demand =
      "I draw my pistol. I aim it at the lockpick's head and tell them to start working right now.";
    const state = lockpickDoor({ turn: 7, activeEncounter: null });
    const prose =
      'Jax held the pistol steady at the hired lockpick\'s head. The hired lockpick jabbed a finger toward the lock.';
    expect(state.activeEncounter).toBeNull();
    expect(checkActionFollowed(state, state, demand, prose).p0.some((f) => f.kind === 'ignored-action')).toBe(
      false,
    );
  });
});
