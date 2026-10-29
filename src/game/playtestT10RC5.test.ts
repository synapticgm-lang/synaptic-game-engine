/**
 * T10RC5 — live RC1/RC3 holes: writer only gets seated speakers; Face resolves or is absent;
 * Director threat does not re-announce after a foe is already parked; chip labels are not subjects.
 */
import { describe, expect, it } from 'vitest';
import type { GameState, NpcMemory, Quest } from './types';
import { compileRefEnum } from './completedEventPacket';
import { engineThreatHere, planDirector, applyDirectorChipPolicy, stallPressureActive } from './director';
import { resolveEngineFight } from './engineFight';
import { parkPendingEncounter, initEncounterTerminal } from './encounterTerminalFsm';
import { peopleHere } from './scenePresence';
import { ensureSpokenAnswer } from './spokenAnswer';
import { seat } from './presentAuthority';

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
    turn: 8,
    currentLocation: 'Cathedral Close',
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    sceneFacts: emptySceneFacts(8),
    ...over,
  } as GameState;
}

describe('T10RC5 seated speakers + Face threat live path', () => {
  it('compileRefEnum does not hand location-stamped unseated Orel as a speaker at Cathedral Close', () => {
    // LitRPG T8/T34 rebuild: Orel stamped at Close but not seated; Nell/Col are.
    let s = base({
      turn: 8,
      currentLocation: 'Cathedral Close',
      sceneFacts: {
        ...emptySceneFacts(8),
        crowd: 'sparse',
        present: ['Nell Rudd', 'Col Thatch'],
        crowdCount: 2,
      },
      npcMemories: [
        mem({ npcName: 'High Chanter Orel Vane', location: 'Cathedral Close', present: false }),
        mem({ npcName: 'Nell Rudd', location: 'Cathedral Close', present: true }),
        mem({ npcName: 'Col Thatch', location: 'Cathedral Close', present: true }),
      ],
      quests: [
        {
          id: 'sys-bounty',
          name: 'System bounty: Allies become enemies',
          description: 'Hear the concern',
          status: 'active',
          type: 'side',
          revealed: true,
          giver: 'High Chanter Orel Vane',
          objectives: [{ id: 'o1', description: 'Hear High Chanter Orel Vane\'s concern', completed: false }],
        } as Quest,
      ],
    });
    s = seat(s, ['Nell Rudd', 'Col Thatch']);
    expect(peopleHere(s)).toEqual(expect.arrayContaining(['Nell Rudd', 'Col Thatch']));
    expect(peopleHere(s).some((n) => /Orel/i.test(n))).toBe(false);
    expect(peopleHere(s).some((n) => /System bounty/i.test(n))).toBe(false);
    const refs = compileRefEnum(s, ['High Chanter Orel Vane']);
    expect(refs.some((r) => /orel/i.test(r.id) || /orel/i.test(r.display))).toBe(false);
    expect(refs.some((r) => /nell/i.test(r.display))).toBe(true);
  });

  it('rpg road T176–178: unseated Dunn/Edda are not speaker refs while presence is empty', () => {
    const s = base({
      engineMode: 'rpg',
      campaignBibleId: 'salt-road-heist',
      currentLocation: 'On the road between places',
      turn: 177,
      sceneFacts: {
        ...emptySceneFacts(177),
        crowd: 'none',
        present: [],
        crowdCount: 0,
      },
      npcMemories: [
        mem({ npcName: 'Dunn Rudd', location: 'Bribe Market', present: false }),
        mem({ npcName: 'Edda Brack', location: 'Salt Road Waystation', present: false }),
      ],
      journey: {
        from: 'Salt Road Waystation',
        to: 'Safehouse Alley',
        legsDone: 1,
        legsTotal: 2,
        ground: 'back streets',
        encounter: {
          kind: 'thugs',
          name: 'thugs',
          want: 'to know who sent you',
          distanceFt: 120,
        },
      } as GameState['journey'],
    });
    expect(peopleHere(s)).toEqual([]);
    const refs = compileRefEnum(s, ['Dunn Rudd', 'Edda Brack']);
    expect(refs.some((r) => /dunn|edda/i.test(r.display))).toBe(false);
  });

  it('Face the threat resolves when foe parked; absent when foe cleared (live T193 hole)', () => {
    let s = base({
      engineMode: 'rpg',
      campaignBibleId: 'salt-road-heist',
      turn: 192,
      currentLocation: 'Salt Road Waystation',
      circling: { stale: {}, lastProgressTurn: 187, recentPlaces: ['Consul Caravan Camp'] },
      progressGovernor: { turnsSinceProgress: 5, lastProgressTurn: 187, recentDeltas: [] },
      sceneFacts: emptySceneFacts(192),
      npcMemories: [mem({ npcName: 'Dunn Rudd', location: 'Salt Road Waystation', need: 'Pick an approach' })],
      quests: [
        {
          id: 'sr-case',
          name: 'Case the Caravan',
          description: 'Case the caravan',
          status: 'active',
          type: 'main',
          revealed: true,
          objectives: [{ id: 'o1', description: 'Pick an approach', completed: false }],
        } as Quest,
      ],
    });
    expect(stallPressureActive(s)).toBe(true);
    const planned = planDirector(s, { playerInput: 'Inspect the waystation' });
    s = planned.state;
    if (planned.plan.need === 'threat') {
      expect(engineThreatHere(s)).toBeTruthy();
      expect((planned.plan.chips ?? []).some((c) => /Face the threat/i.test(c.label))).toBe(true);
      const fact = planned.plan.development?.fact ?? '';
      expect(fact).not.toMatch(/Pick an approach/i);
      const fought = resolveEngineFight(s, 'Face the threat');
      expect(fought).not.toBeNull();
    }
    // Stale Face with no foe must not stay on the pad.
    const cleared: GameState = {
      ...s,
      activeEncounter: null,
      sceneFacts: { ...(s.sceneFacts ?? emptySceneFacts(193)), pendingEncounter: undefined },
      directorPlan: {
        need: 'threat',
        chips: [{ label: 'Face the threat', reason: 'director-threat' }],
        turn: 193,
        development: { kind: 'threat', fact: 'Must narrate: Danger closes.' },
      },
    };
    const pads = applyDirectorChipPolicy(cleared, ['Look around', 'Face the threat', 'Wait'], {});
    expect(pads.some((c) => /Face the threat/i.test(c))).toBe(false);
    expect(resolveEngineFight(cleared, 'Face the threat')).toBeNull();
  });

  it('present NPC whisper ask gets grammatical content (T12 rebuild)', () => {
    let s = base({
      turn: 12,
      currentLocation: 'Cathedral Close',
      sceneFacts: {
        ...emptySceneFacts(12),
        crowd: 'sparse',
        present: ['Nell Rudd', 'Col Thatch'],
        crowdCount: 2,
      },
      npcMemories: [
        mem({
          npcName: 'Nell Rudd',
          location: 'Cathedral Close',
          present: true,
          roleHint: 'informant',
          need: 'a buyer who pays',
        }),
        mem({ npcName: 'Col Thatch', location: 'Cathedral Close', present: true }),
      ],
    });
    s = seat(s, ['Nell Rudd', 'Col Thatch']);
    const prose =
      'Jax leaned in close to Nell Rudd and whispered that if she wanted a buyer, she should at least tell them what the price of silence was. Jax tapped their empty pockets twice.';
    const out = ensureSpokenAnswer(prose, s, 'I lean in and whisper that if she wants a buyer, she should at least tell me what the price of silence is.');
    expect(out.prose).toMatch(/Nell Rudd/i);
    expect(out.prose).not.toMatch(/said nothing/i);
    expect(out.answer.status).toBe('added');
  });
});
