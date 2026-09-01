/**
 * 2026-08-31m — Residual batch: map L/R, harder commit gate, drought foe,
 * numbered-list leak, aiTraffic SNAPSHOT gist, XP honesty.
 * Stamp: HUD 2026-08-31m / BUILD 2026-08-31f. Mid writer OFF.
 */
import { describe, expect, it } from 'vitest';
import { BUILD_STAMP } from './runManifest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import type { GameState } from './types';
import {
  buildInteriorFloorPlan,
  formatInteriorExitAuthority,
  graphExitPads,
  isCameraRelativePad,
} from './mapEngine';
import { compileChoices } from './choiceCompiler';
import { padChoicesToCount } from './choicePipeline';
import { classifyBeatCommit, missingPointerCardSlot, repairRejectedBeat } from './beatCommitGate';
import {
  canAttachLiveFight,
  ensureEncounterSpawnPreface,
  markPendingSpawnPreface,
} from './combatAuthority';
import { runArcDirectorBeforeGm } from './arcDirector';
import { stripChoiceList } from './parser';
import { compactTrafficGist } from './openingPointerCard';
import { isLookAroundAction } from './sandboxXp';
import { talkContradictsLockedWhy } from './hookLock';
import { applyGovernanceToProse } from './qualityGovernance';

const ATMOS =
  'Dust motes hang in the gloom. The air smells of decay and ozone. Light shafts pierce the ruin. Silence settles like damp earth.';

function summoned(turn = 8): GameState {
  const state = createInitialState(undefined, 'litrpg');
  state.campaignBibleId = 'summoned-pact';
  state.campaignPremise = 'They meant to summon a hero. Earth clothes. Pellane.';
  state.currentLocation = 'The Sevenfold Circle under Valespire Cathedral';
  state.turn = turn;
  state.openingEstablishment = {
    pending: [],
    answers: { name: 'Jax' },
    complete: true,
    sceneWritten: true,
    aloneArrival: false,
    pickedHook:
      'Location: The Sevenfold Circle under Valespire Cathedral\nWho is here / who summoned: High Chanter Orel Vane and Crown handlers of Pellane\nWhy this happened: They paid for a Pactborn champion to end the Ash Court war.',
    pickedHookId: 'the-sevenfold-circle-under-valespire-cathedral',
  };
  state.sceneFacts = {
    crowd: 'present',
    noise: 'voices',
    present: [],
    props: ['blue panel'],
    lastBeat: 'The circle holds.',
    updatedTurn: turn,
    crowdCount: 2,
    hookLock: { nature: 'intended', summary: 'paid champion', lockedTurn: 1, source: 'hook' },
  };
  state.runManifest = {
    buildStamp: BUILD_STAMP,
    seed: '31m',
    saveId: 'test-31m',
    engineMode: 'litrpg',
    createdAt: 1,
    eventSeq: 1,
  };
  return state;
}

describe('playtest31mNextBatch', () => {
  it('stamp is 2026-08-31m / 31f and Mid writer stays OFF', () => {
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(BUILD_STAMP >= '2026-08-31f').toBe(true);
    expect(HUD_BUILD_STAMP >= '2026-08-31m').toBe(true);
  });

  it('map pads use graph doorway/cardinal — never camera-left when coords are missing', () => {
    const dungeon = buildInteriorFloorPlan(
      'alone in a building with serious damage somewhere off the Valespire roads',
      [],
      undefined,
      '31m-nocoord'
    );
    dungeon.nodes = dungeon.nodes.map((n) => ({ ...n, coordinates: undefined }));
    const pads = graphExitPads(dungeon);
    expect(pads.length).toBeGreaterThan(0);
    expect(pads.join(' ')).not.toMatch(/\b(left|right|camera-left)\b/i);
    expect(pads.some((p) => /doorway|stairs/i.test(p))).toBe(true);

    const auth = formatInteriorExitAuthority(dungeon);
    expect(auth).toMatch(/never camera-left/i);
    expect(auth).not.toMatch(/\bto the left\b/i);

    const state = summoned();
    state.activeDungeon = dungeon;
    const compiled = compileChoices(state, [
      'Go left through the door',
      'On your right, try the gap',
      'Wait and watch',
    ]);
    expect(compiled.choices.join(' ')).not.toMatch(/\b(go left|on your right|camera-left)\b/i);
    expect(isCameraRelativePad('Go left through the door')).toBe(true);

    const padded = padChoicesToCount(
      ['Go left through the door', 'Search the ruin carefully'],
      state,
      'The entry is quiet.',
      3
    );
    expect(padded.join(' ')).not.toMatch(/\bgo left\b/i);
  });

  it('commit gate rejects atmosphere-only / missing slot / recycle and stitches instead of committing', () => {
    const state = summoned(8);
    state.log = [
      {
        id: 'g1',
        turn: 7,
        role: 'gm',
        content: ATMOS,
        timestamp: 1,
      },
    ];
    const gate = classifyBeatCommit(state, ATMOS, 'Examine the room');
    expect(gate.accept).toBe(false);
    expect(gate.reasons).toContain('atmosphere-only');
    expect(gate.reasons).toContain('recycle-without-delta');

    const repaired = repairRejectedBeat(state, ATMOS, gate.reasons);
    expect(repaired.repaired).toBe(true);
    expect(repaired.prose).not.toBe(ATMOS);
    expect(repaired.prose.length).toBeGreaterThan(20);

    const opening = summoned(1);
    opening.openingEstablishment = { ...opening.openingEstablishment!, complete: false };
    expect(missingPointerCardSlot(opening, ATMOS)).toBe(true);
    const miss = classifyBeatCommit(opening, ATMOS, 'Look around');
    expect(miss.reasons).toContain('missing-pointer-slot');

    const gov = applyGovernanceToProse(state, ATMOS, 'Examine the room');
    expect(gov.rejectClone).toBe(true);
    expect(gov.notes.some((n) => /Commit gate/i.test(n))).toBe(true);
  });

  it('drought does not attach a live fight until foe is present or preface commits', () => {
    let state = summoned(16);
    state.arcDirector = {
      committedBeatIds: ['sp-beat-orient', 'sp-beat-hear-reason'],
      turnsSinceCombatReceipt: 20,
    };
    const arc = runArcDirectorBeforeGm(state, 'Wait and watch');
    const parked = arc.state.sceneFacts?.pendingEncounter;
    if (parked) {
      expect(arc.state.activeEncounter).toBeFalsy();
      expect(arc.state.sceneFacts?.pendingSpawnPreface).toBe(parked.name);
      expect(canAttachLiveFight(arc.state, parked.name)).toBe(false);

      const ensured = ensureEncounterSpawnPreface(arc.state, 'Steel rings in the dark.');
      expect(ensured.prepended).toBe(true);
      expect(ensured.state.activeEncounter?.name).toBe(parked.name);
      expect(ensured.state.sceneFacts?.pendingEncounter).toBeUndefined();
      expect(ensured.state.sceneFacts?.present.some((p) => p.includes(parked.name))).toBe(true);
    } else {
      const name = 'Pact-Hunter Skirmisher';
      const marked = markPendingSpawnPreface(
        {
          ...state,
          sceneFacts: {
            ...state.sceneFacts!,
            pendingEncounter: {
              name,
              hp: 12,
              maxHp: 12,
              level: 1,
            } as GameState['activeEncounter'],
          },
        },
        name
      );
      expect(canAttachLiveFight(marked, name)).toBe(false);
      const ensured = ensureEncounterSpawnPreface(marked, 'Dust hangs.');
      expect(ensured.state.activeEncounter?.name).toBe(name);
      expect(ensured.prepended).toBe(true);
    }
  });

  it('stripChoiceList removes mid-body 1. Carefully examine leftovers', () => {
    const prose =
      'The stone is cold under you. 1. Carefully examine the mosaic under the dust. Light shafts cut the gloom.';
    const stripped = stripChoiceList(prose);
    expect(stripped).not.toMatch(/\b1\.\s*Carefully examine/i);
    expect(stripped).toMatch(/stone is cold/i);
    expect(stripped).toMatch(/Light shafts/i);

    const opening =
      'You are on your back inside a seven-ring circle.\n1. Carefully examine the blue panel\n2. Ask what they want';
    const openStripped = stripChoiceList(opening);
    expect(openStripped).not.toMatch(/Carefully examine the blue panel/i);
  });

  it('SNAPSHOT gist is compact (location, crowdCount, hook, present, stamp) — not the prompt', () => {
    const state = summoned(4);
    state.sceneFacts = {
      ...state.sceneFacts!,
      present: ['Orel Vane'],
      crowdCount: 2,
    };
    const gist = compactTrafficGist(state);
    expect(gist.location).toMatch(/Sevenfold Circle/i);
    expect(gist.crowdCount).toBe(2);
    expect(gist.hookWhy).toBe('intended');
    expect(gist.presence).toMatch(/Orel Vane/i);
    expect(gist.stamp).toBe(BUILD_STAMP);
    expect(JSON.stringify(gist)).not.toMatch(/AUTHORITY:|POINTER CARD|CRAFT:/);
  });

  it('scout / look-around still does not pay hear-reason on contradicted why', () => {
    expect(isLookAroundAction('Scout the cell and get bearings')).toBe(true);
    expect(isLookAroundAction('Look around')).toBe(true);
    const state = summoned(7);
    state.sceneFacts = {
      ...state.sceneFacts!,
      hookLock: {
        nature: 'accident',
        summary: 'pulled here by accident',
        lockedTurn: 1,
        source: 'harvest',
      },
    };
    expect(talkContradictsLockedWhy('Ask why I was bought here', state.sceneFacts?.hookLock)).toBe(
      true
    );
    const scout = runArcDirectorBeforeGm(state, 'Scout the cell and get bearings');
    expect(scout.beatCommitted && scout.beatId === 'sp-beat-hear-reason').toBe(false);
    expect(scout.xpAwards.some((a) => /hear-reason|Social milestone/i.test(a.reason))).toBe(false);
    const look = runArcDirectorBeforeGm(state, 'Look around');
    expect(look.xpAwards.some((a) => /hear-reason|Social milestone/i.test(a.reason))).toBe(false);
  });
});
