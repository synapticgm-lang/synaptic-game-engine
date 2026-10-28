/**
 * T10AM — RPG s9852 Salt Road Waystation: stall emptied Brannoc before "Ask about the lead";
 * free-text rustling ask got unrelated need; chips vanished while gate still named him.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, NpcMemory } from './types';
import { ensureSpokenAnswer } from './spokenAnswer';
import { emptySceneFacts } from './sceneFacts';
import { planSceneThreads, stallPressureActive, STALL_N } from './openThreads';
import { peopleHere } from './chipLegality';
import { checkActionFollowed } from './turnCheck';
import { collectSceneAffordances } from './sceneAffordances';

function mem(over: Partial<NpcMemory> & { npcName: string }): NpcMemory {
  return {
    npcId: over.npcId ?? `town-${over.npcName.replace(/\s+/g, '-').toLowerCase()}`,
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

function waystation(over: Partial<GameState> = {}): GameState {
  const brannoc = mem({
    npcName: 'Brannoc Rudd',
    npcId: 'town-brannoc-rudd',
    location: 'Salt Road Waystation',
    roleHint: 'refugee',
    need: 'shelter and food',
    goal: { motivation: 'Comfort', target: 'a safe place to rest' },
    offer: 'what little they carry',
    sheet: {
      job: 'refugee',
      motive: 'Find a lost crewmate',
      fear: 'Replacement',
      speech: 'playful',
      secret: '',
      place: 'road',
    },
  });
  return {
    ...(createInitialState(undefined, 'rpg') as GameState),
    engineMode: 'rpg',
    campaignBibleId: 'salt-road-heist',
    character: {
      ...(createInitialState(undefined, 'rpg') as GameState).character,
      name: 'Jax',
    },
    turn: 11,
    currentLocation: 'Salt Road Waystation',
    sceneFacts: {
      ...emptySceneFacts(),
      crowd: 'sparse',
      noise: 'quiet',
      present: ['Brannoc Rudd'],
      props: [],
      lastBeat: 'waystation',
      updatedTurn: 11,
      crowdCount: 1,
      indoor: true,
    },
    npcMemories: [brannoc],
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax' },
      complete: true,
      sceneWritten: true,
    },
    progressGovernor: { turnsSinceProgress: STALL_N, lastProgressTurn: 7, recentDeltas: [] },
    circling: {
      lastLocation: 'Salt Road Waystation',
      lastProgressTurn: 7,
      recentPlaces: ['Salt Road Waystation'],
      tried: {},
      stale: {},
    },
    openThreads: [
      {
        id: 'npc-goal:brannoc',
        kind: 'npc-goal',
        label: 'Brannoc Rudd: a safe place to rest',
        entityId: 'town-brannoc-rudd',
        placeId: 'Salt Road Waystation',
        lastSeenTurn: 8,
        resolution: { type: 'npc-goal-met', npcId: 'town-brannoc-rudd' },
      },
    ],
    sceneThreadPlan: undefined,
    ...over,
  } as GameState;
}

describe('T10AM stall does not eject the addressed listener (s9852 T11)', () => {
  it('Ask Brannoc about the lead under stall keeps him PRESENT', () => {
    const before = waystation();
    expect(stallPressureActive(before)).toBe(true);
    expect(peopleHere(before)).toContain('Brannoc Rudd');
    const after = planSceneThreads(before, 'Ask Brannoc Rudd about the lead');
    expect(peopleHere(after)).toContain('Brannoc Rudd');
    expect(after.sceneFacts?.present ?? []).toContain('Brannoc Rudd');
    const brannoc = (after.npcMemories ?? []).find((m) => /Brannoc/i.test(m.npcName));
    expect(brannoc?.shouldExit).not.toBe(true);
    expect(brannoc?.exitReason).not.toBe('stall-pressure');
    // World still moves (threat / thread) — only the addressed listener is protected.
    expect(after.sceneThreadPlan?.stallEventId || after.sceneFacts?.stallWorldFact || after.sceneFacts?.placeWorldFact).toBeTruthy();
  });

  it('hub stall can still depart a different present person', () => {
    const before = waystation({
      sceneFacts: {
        ...emptySceneFacts(),
        present: ['Brannoc Rudd', 'Osric Wyle'],
        crowd: 'sparse',
        crowdCount: 2,
        updatedTurn: 11,
        lastBeat: 'waystation',
      },
      npcMemories: [
        mem({
          npcName: 'Brannoc Rudd',
          npcId: 'town-brannoc-rudd',
          location: 'Salt Road Waystation',
          need: 'shelter and food',
        }),
        mem({
          npcName: 'Osric Wyle',
          npcId: 'town-osric-wyle',
          location: 'Salt Road Waystation',
          need: 'the delivery',
        }),
      ],
    });
    const after = planSceneThreads(before, 'Ask Brannoc Rudd about the lead');
    expect(peopleHere(after)).toContain('Brannoc Rudd');
    expect(peopleHere(after)).not.toContain('Osric Wyle');
    const osric = (after.npcMemories ?? []).find((m) => /Osric/i.test(m.npcName));
    expect(osric?.shouldExit).toBe(true);
    expect(osric?.exitReason).toBe('stall-pressure');
  });
});

describe('T10AM free-text question is not an unrelated need dump (s9852 T10)', () => {
  it('rustling/wind question does not get "I need shelter and food"', () => {
    const state = waystation({ turn: 10 });
    const ask =
      'I lean back against the counter and cross my arms, then I glance toward the open door. "You think that rustling was just wind or something else?"';
    const draft =
      'Inside Salt Road Waystation Jax leaned back against the counter and spoke to Brannoc Rudd. Brannoc Rudd only shook his head and said nothing back, so the question hung in the air between them.';
    const out = ensureSpokenAnswer(draft, state, ask);
    expect(out.answer.status).toBe('added');
    expect(out.prose).toMatch(/Brannoc Rudd said/i);
    expect(out.prose).toMatch(/["\u201c][^"\u201d]{8,}["\u201d]/);
    expect(out.prose).not.toMatch(/I need shelter and food/i);
    expect(out.prose).not.toMatch(/said nothing/i);
    expect(
      checkActionFollowed(state, state, ask, out.prose).p0.some((f) => f.kind === 'ignored-action'),
    ).toBe(false);
  });

  it('Ask about the lead keeps a Brannoc reply (not empty-room prose)', () => {
    const state = waystation();
    const ask = 'Ask Brannoc Rudd about the lead';
    const draft =
      'The waystation stayed quiet, with only the road wind and the creak of old wood answering Jax\'s words. The empty bench in front of Jax stood exactly where Salt Road Waystation had sat before.';
    const out = ensureSpokenAnswer(draft, state, ask);
    expect(out.prose).toMatch(/Brannoc Rudd said/i);
    expect(out.prose).toMatch(/["\u201c][^"\u201d]{8,}["\u201d]/);
    expect(out.prose).not.toMatch(/I need shelter and food/i);
    expect(
      checkActionFollowed(state, state, ask, out.prose).p0.some((f) => f.kind === 'ignored-action'),
    ).toBe(false);
  });
});

describe('T10AM other bible / other NPC (cursed-keep steward)', () => {
  it('typed content question without ledger overlap skips unrelated need', () => {
    const steward = mem({
      npcName: 'the steward',
      npcId: 'town-the-steward',
      location: 'Keep Gate',
      need: 'a safe place to rest',
      sheet: {
        job: 'steward',
        motive: 'Win fairly',
        fear: '',
        speech: '',
        secret: '',
        place: 'town',
      },
    });
    const state = {
      ...(createInitialState(undefined, 'dnd') as GameState),
      engineMode: 'dnd',
      campaignBibleId: 'cursed-keep',
      character: { ...(createInitialState(undefined, 'dnd') as GameState).character, name: 'Jax' },
      turn: 40,
      currentLocation: 'Keep Gate',
      sceneFacts: {
        ...emptySceneFacts(),
        present: ['the steward'],
        crowd: 'sparse',
        crowdCount: 1,
        updatedTurn: 40,
        lastBeat: 'gate',
      },
      npcMemories: [steward],
      openingEstablishment: {
        pending: [],
        answers: { name: 'Jax' },
        complete: true,
        sceneWritten: true,
      },
    } as GameState;
    const ask =
      'I glance at the oak and ask the steward, "Was that rustling just wind or something else?"';
    const draft =
      'Jax glanced at the oak and asked the steward about the rustling. The steward said nothing back.';
    const out = ensureSpokenAnswer(draft, state, ask);
    expect(out.prose).toMatch(/the steward said/i);
    expect(out.prose).toMatch(/["\u201c][^"\u201d]{8,}["\u201d]/);
    expect(out.prose).not.toMatch(/I need a safe place to rest/i);
  });
});

describe('T10AM chips stay while the addressed NPC remains', () => {
  it('after protected stall, Talk/Ask chips still name Brannoc', () => {
    const after = planSceneThreads(waystation(), 'Ask Brannoc Rudd about the lead');
    const labels = collectSceneAffordances(after).map((a) => a.label);
    expect(labels.some((l) => /Brannoc Rudd/i.test(l) && /(?:ask|talk|press)/i.test(l))).toBe(true);
  });
});
