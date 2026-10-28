/**
 * T10J — mid-travel placeTok is live HERE; plain words are not PC say / NPC names;
 * crowd aggregates get no speaker reaction slot. Offline from LitRPG s1028 turns.jsonl.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, TravelJourney } from './types';
import { compileRefEnum } from './completedEventPacket';
import { isAggregatePersonToken } from './chromeAuthority';
import {
  extractPlayerQuotedSay,
  parsePlayerSteps,
  sheetContextFromState,
} from './intentParser';
import { buildClauseWriterFact, speechAddressCue } from './writerCueLines';
import { emptySceneFacts } from './sceneFacts';
import { UNDERWAY_HERE } from './locationName';

function litrpg(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'litrpg', undefined, 't10j') as GameState;
  return {
    ...s,
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    character: { ...s.character, name: 'Jax' },
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true, sceneWritten: true },
    ...over,
  } as GameState;
}

const journey: TravelJourney = {
  from: 'Valespire peace-festival square',
  to: 'Cathedral Close',
  legsDone: 1,
  legsTotal: 2,
  ground: 'Back streets',
  terrain: 'streets',
  hoursPerLeg: 0.5,
  day: 1,
  startedTurn: 3,
} as TravelJourney;

describe('T10J mid-travel live place', () => {
  it('REF ENUM here is the trip phrase, not the origin square (s1028 T7)', () => {
    const s = litrpg({
      currentLocation: UNDERWAY_HERE,
      journey,
      sceneFacts: { ...emptySceneFacts(), present: [], crowd: 'none' },
    });
    const refs = compileRefEnum(s);
    const here = refs.find((r) => r.id === 'here');
    expect(here?.display.toLowerCase()).toMatch(
      /back streets from valespire peace-festival square toward cathedral close/,
    );
    expect(here?.display.toLowerCase()).not.toBe('valespire peace-festival square');
    // Origin/dest remain exits the writer may name — but placeTok prefers here.
    expect(refs.some((r) => /valespire peace-festival square/i.test(r.display))).toBe(true);
    expect(refs.some((r) => /cathedral close/i.test(r.display))).toBe(true);
  });
});

describe('T10J yet is not PC say / a person', () => {
  const line =
    'I address High Chanter Orel Vane who is actually here, not "yet". My words stay: I ask the bell-ringer up in that tower whether the Close is open yet, then wave to him with my hat.';

  it('not "yet" is not extractSay / PC says exactly (s1028 T8 typed)', () => {
    const s = litrpg({
      currentLocation: UNDERWAY_HERE,
      journey,
      sceneFacts: { ...emptySceneFacts(), present: [], crowd: 'none' },
    });
    const read = parsePlayerSteps(line, sheetContextFromState(s));
    expect(read.steps.every((st) => st.say !== 'yet')).toBe(true);
    expect(read.steps.every((st) => !st.addressee || !/^yet$/i.test(st.addressee))).toBe(true);
    const cue = buildClauseWriterFact(line, true, {
      said: read.steps.find((st) => st.say)?.say ?? '',
      addressee: read.steps.find((st) => st.addressee)?.addressee ?? null,
    });
    expect(cue).not.toMatch(/PC says exactly: "yet"/i);
    expect(cue).toMatch(/empty scene|No one present to answer/i);
  });

  it('unquoted open yet keeps no person named yet', () => {
    const bare =
      'I ask the bell-ringer up in that tower whether the Close is open yet, then wave to him with my hat.';
    const s = litrpg({
      currentLocation: UNDERWAY_HERE,
      journey,
      sceneFacts: { ...emptySceneFacts(), present: [], crowd: 'none' },
    });
    const read = parsePlayerSteps(bare, sheetContextFromState(s));
    expect(read.steps.every((st) => !st.addressee || !/^yet$/i.test(st.addressee))).toBe(true);
    expect(extractPlayerQuotedSay(bare)).toBeNull();
  });
});

describe('T10J absent address invents nobody', () => {
  it('passerby / bell-ringer on an empty road → empty scene, no present stamp', () => {
    const s = litrpg({
      currentLocation: UNDERWAY_HERE,
      journey,
      sceneFacts: { ...emptySceneFacts(), present: [], crowd: 'none' },
      npcMemories: [],
    });
    const line =
      'I kick a loose cobble aside while asking the passerby in the lane which way the quiet route to the Close runs.';
    const read = parsePlayerSteps(line, sheetContextFromState(s));
    expect(read.steps.every((st) => !st.addressee)).toBe(true);
    const cue = buildClauseWriterFact(line, true, { addressee: null });
    expect(cue).toMatch(/empty scene/);
    expect(cue).not.toMatch(/NPC reaction slot open/i);
    expect(s.sceneFacts?.present ?? []).toEqual([]);
    expect((s.npcMemories ?? []).length).toBe(0);
  });
});

describe('T10J crowd is not a speaker', () => {
  it('festival crowd is an aggregate — no reaction slot, not a person ref', () => {
    expect(isAggregatePersonToken('the festival crowd')).toBe(true);
    expect(isAggregatePersonToken('festival crowd')).toBe(true);
    expect(speechAddressCue('the festival crowd')).toMatch(/No one present to answer/);
    expect(speechAddressCue('the festival crowd')).not.toMatch(/NPC reaction slot open/);
    expect(speechAddressCue('Vessa')).toMatch(/NPC reaction slot open for Vessa/);

    const s = litrpg({
      currentLocation: 'Valespire peace-festival square',
      journey: null,
      sceneFacts: {
        ...emptySceneFacts(),
        present: ['the festival crowd'],
        crowd: 'present',
      },
      openingEstablishment: {
        complete: true,
        sceneWritten: true,
        castNpcIds: ['festival-crowd'],
      },
      npcMemories: [
        {
          npcId: 'festival-crowd',
          npcName: 'the festival crowd',
          disposition: 'neutral',
          facts: [],
          lastSeenTurn: 1,
          location: 'Valespire peace-festival square',
          introSpoken: true,
        },
      ],
    });
    const refs = compileRefEnum(s);
    expect(refs.some((r) => r.klass === 'person' && /festival crowd/i.test(r.display))).toBe(false);
  });
});
