/**
 * Batch 02x — Lock B CAST named-only + Lock C fact-close + Lock D entropy shape.
 * Gemini 02w 4×T50 leftovers. Mid writer OFF. No live GM call.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import {
  canHarvestAsNamedPerson,
  isBareHonorificTitle,
  isCommonRoleNpc,
} from './entityRegistry';
import { harvestNarrativeIntoLedger } from './narrativeHarvest';
import { buildEntityCast } from './entityCast';
import {
  classifyBeatCommit,
  isEngineChromeOnlyBeat,
  isExactPriorGmBody,
  isFactClosedViolation,
  isHudCombatChromeLeak,
  isWriterMonologueLeak,
} from './beatCommitGate';
import { attachLastKill } from './combatAuthority';
import { applyPresentTrimOnTravel } from './presentAuthority';
import { isOpeningOccupancyReset } from './sceneContextTail';
import { isInventedNamedIdentity } from './closedScenePerson';
import { isSlotGlueViolation } from './slotGlue';
import {
  initPyoaBranchLedger,
  isPyoaCharterClosed,
  isPyoaItemDestroyed,
  recordPyoaBranchChoice,
} from './pyoaBranchLedger';
import { applyStructuralEvents } from './structuralEvents';
import { enumerateLegalEdges } from './choiceEdge';
import { excludedPadFamilies, isTravelPad } from './padUniverse';
import type { GameState } from './types';

const KILL = {
  name: 'Pact-Hunter Skirmisher',
  outcome: 'victory' as const,
  turn: 14,
  remains: true,
};

function litrpgState(partial: Partial<GameState> = {}): GameState {
  const state = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...state,
    bibleId: 'summoned-pact',
    campaignBibleId: 'summoned-pact',
    openingEstablishment: {
      pending: [],
      answers: { where: 'Sevenfold Circle' },
      complete: true,
      aloneArrival: false,
    },
    currentLocation: 'West Wall',
    turn: 18,
    sceneFacts: emptySceneFacts(18),
    ...partial,
  };
}

function roadState(partial: Partial<GameState> = {}): GameState {
  const state = createInitialState(undefined, 'pyoa') as GameState;
  return {
    ...state,
    engineMode: 'pyoa',
    campaignBibleId: 'thornferry-road',
    currentLocation: 'mill landing at Thornferry',
    turn: 20,
    companions: [
      {
        id: 'wren',
        name: 'Wren Holt',
        type: 'party',
        role: 'guide',
        hp: 8,
        maxHp: 8,
        maintenanceCost: '',
        assignment: '',
        notes: '',
      },
    ],
    sceneFacts: { ...emptySceneFacts(20), present: ['Wren Holt'] },
    pyoaBranchLedger: initPyoaBranchLedger(),
    ...partial,
  };
}

describe('Batch 02x stamps', () => {
  it('HUD and BUILD stay at or after 2026-09-02x and Mid writer stays OFF', () => {
    expect(HUD_BUILD_STAMP >= '2026-09-02x').toBe(true);
    expect(BUILD_STAMP >= '2026-09-02x').toBe(true);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });
});

describe('Batch 02x — Lock B: CAST named-only', () => {
  it('denies roles, compounds, and bare titles from named harvest', () => {
    expect(isCommonRoleNpc('skirmisher')).toBe(true);
    expect(isCommonRoleNpc('handler')).toBe(true);
    expect(isCommonRoleNpc('vendor')).toBe(true);
    expect(isBareHonorificTitle('Brother')).toBe(true);
    expect(canHarvestAsNamedPerson('Skirmisher', 'summoned-pact')).toBe(false);
    expect(canHarvestAsNamedPerson('Pact-Hunter Skirmisher', 'summoned-pact')).toBe(false);
    expect(canHarvestAsNamedPerson('handler', 'summoned-pact')).toBe(false);
    expect(canHarvestAsNamedPerson('vendor', 'summoned-pact')).toBe(false);
    expect(canHarvestAsNamedPerson('Brother', 'summoned-pact')).toBe(false);
    expect(canHarvestAsNamedPerson('Brother Tam', 'summoned-pact')).toBe(false);
    expect(canHarvestAsNamedPerson('Miria', 'summoned-pact')).toBe(false);
    expect(canHarvestAsNamedPerson('Liza', 'summoned-pact')).toBe(false);
  });

  it('keeps real given names and registry people', () => {
    expect(canHarvestAsNamedPerson('Wren Holt', 'thornferry-road')).toBe(true);
    expect(canHarvestAsNamedPerson('Orel Vane', 'summoned-pact')).toBe(true);
    expect(canHarvestAsNamedPerson('Father Karel', 'summoned-pact')).toBe(true);
    expect(canHarvestAsNamedPerson('Tomas', 'summoned-pact')).toBe(true);
  });

  it('does not harvest role compounds or invented Title+Given into present[] / CAST', () => {
    let state = litrpgState({ sceneFacts: emptySceneFacts(6) });
    const harvested = harvestNarrativeIntoLedger(
      state,
      'The Pact-Hunter Skirmisher priest waits. Brother Tam nods. Wren Holt keeps pace.',
      6
    );
    const present = harvested.sceneFacts?.present ?? [];
    expect(present.some((p) => /skirmisher/i.test(p))).toBe(false);
    expect(present.some((p) => /Brother Tam/i.test(p))).toBe(false);
    expect(present.some((p) => /Wren Holt/i.test(p))).toBe(true);

    const castState = {
      ...harvested,
      sceneFacts: { ...emptySceneFacts(6), present: ['handler', 'vendor', 'Wren Holt'] },
    };
    const cast = buildEntityCast(castState);
    expect(cast).toMatch(/Wren Holt/);
    expect(cast).not.toMatch(/NAMED CHARACTERS[^]*\bhandler\b/i);
    expect(cast).not.toMatch(/NAMED CHARACTERS[^]*\bvendor\b/i);
  });

  it('rejects invented Brother Tam identity splice without occupancy', () => {
    const empty = litrpgState({ sceneFacts: { ...emptySceneFacts(8), present: [] } });
    expect(isInventedNamedIdentity(empty, 'Brother Tam nods from the stall.')).toBe(true);
    expect(isFactClosedViolation(empty, 'Brother Tam nods from the stall.')).toBe(true);
    const known = litrpgState({
      sceneFacts: { ...emptySceneFacts(8), present: ['Father Karel'] },
    });
    expect(isInventedNamedIdentity(known, 'Father Karel nods from the stall.')).toBe(false);
  });
});

describe('Batch 02x — Lock C: fact-closed scenes', () => {
  it('closes the charter after three uses and blocks kit / Use / chest rez', () => {
    let state = roadState({
      inventory: [{ id: 'mc', name: 'Millstone Charter', rarity: 'Common', quantity: 1 }],
    });
    state = recordPyoaBranchChoice(state, 'Inspect the charter clause');
    state = recordPyoaBranchChoice(state, 'Inspect the charter clause');
    state = recordPyoaBranchChoice(state, 'Inspect the charter clause');
    expect(state.pyoaBranchLedger?.charterUses).toBe(3);
    expect(isPyoaCharterClosed(state)).toBe(true);
    expect(isPyoaItemDestroyed(state, 'charter')).toBe(true);
    expect(state.inventory?.some((i) => /charter/i.test(i.name))).toBe(false);
    expect(enumerateLegalEdges(state).some((e) => /charter/i.test(e.label))).toBe(false);

    const gained = applyStructuralEvents(state, [
      { type: 'item-gain', name: 'Millstone Charter', qty: 1 },
    ]);
    expect(gained.state.inventory?.some((i) => /charter/i.test(i.name))).toBe(false);

    const chest = 'The charter\'s weight sits against your chest again.';
    expect(isFactClosedViolation(state, chest)).toBe(true);
    expect(classifyBeatCommit(state, chest).accept).toBe(false);
  });

  it('rejects lastKill living talk and keeps legal corpse language', () => {
    let state = attachLastKill(litrpgState(), KILL);
    state = { ...state, turn: 16, activeEncounter: undefined };
    const talk = 'The skirmisher talks to you from the wet cobbles, asking about the rain.';
    const corpse = 'The rain hisses across the cobbles; the skirmisher is already down, lashed to the post.';
    expect(isFactClosedViolation(state, talk)).toBe(true);
    expect(isFactClosedViolation(state, corpse)).toBe(false);
    expect(classifyBeatCommit(state, talk).accept).toBe(false);
  });

  it('rejects a recycled rock-connect kill after lastKill is committed', () => {
    let state = attachLastKill(litrpgState(), KILL);
    state = { ...state, turn: 17, activeEncounter: undefined };
    const recycle = 'The rock connects, and she lands hard in the alley mouth.';
    expect(isFactClosedViolation(state, recycle)).toBe(true);
    expect(classifyBeatCommit(state, recycle).accept).toBe(false);
  });

  it('rejects an exact prior GM body unless the player asked to repeat', () => {
    const vendor = 'A vendor under a patched tarp meets your glance in West Wall, then looks away — the moment is yours to break.';
    const state = litrpgState({
      log: [{ id: 'g1', role: 'gm', content: vendor, timestamp: 1, turn: 16 }],
    });
    expect(isExactPriorGmBody(state, vendor)).toBe(true);
    expect(classifyBeatCommit(state, vendor, 'Wait and watch').accept).toBe(false);
    expect(classifyBeatCommit(state, vendor, 'Say that again').accept).toBe(true);
  });

  it('rejects opening occupancy as HERE after leave, from camera ledger', () => {
    const state = litrpgState({
      currentLocation: 'West Wall',
      previousLocationSheet: { name: 'Sevenfold Circle' } as GameState['previousLocationSheet'],
      turn: 8,
      sceneFacts: {
        ...emptySceneFacts(8),
        present: [],
        cameraLock: { scale: 'outdoor', label: 'West Wall', lockedTurn: 7 },
      },
      log: [
        { id: 'p', role: 'player', content: 'Leave the circle', timestamp: 1, turn: 7 },
        { id: 'g', role: 'gm', content: 'You reach the West Wall in the rain.', timestamp: 2, turn: 7 },
      ],
      openingEstablishment: {
        pending: [],
        answers: { where: 'Sevenfold Circle' },
        complete: true,
        aloneArrival: false,
        pinnedNpcNames: ['Handler'],
      },
    });
    const reset = 'The handler waits in the Sevenfold Circle as if you never left.';
    expect(isOpeningOccupancyReset(state, reset)).toBe(true);
    expect(isFactClosedViolation(state, reset)).toBe(true);
    const here = 'Rain drums the West Wall stones. The road east is open.';
    expect(isOpeningOccupancyReset(state, here)).toBe(false);
  });

  it('strips opening pins from present[] on travel', () => {
    const state = litrpgState({
      sceneFacts: { ...emptySceneFacts(8), present: ['Handler', 'Wren Holt'] },
      companions: [
        {
          id: 'wren',
          name: 'Wren Holt',
          type: 'party',
          role: 'guide',
          hp: 8,
          maxHp: 8,
          maintenanceCost: '',
          assignment: '',
          notes: '',
        },
      ],
      openingEstablishment: {
        pending: [],
        answers: { where: 'Sevenfold Circle' },
        complete: true,
        aloneArrival: false,
        pinnedNpcNames: ['Handler'],
      },
    });
    const left = applyPresentTrimOnTravel(state, 'Sevenfold Circle', 'West Wall');
    expect(left.sceneFacts?.present ?? []).toEqual(['Wren Holt']);
  });
});

describe('Batch 02x — Lock D: instruction / chrome / salad shape', () => {
  it('rejects planner instruction-voice without quoting only Gemini strings', () => {
    expect(isWriterMonologueLeak('No tag needed. No loot for just watching.')).toBe(true);
    expect(isWriterMonologueLeak('End with the drizzle on the stones.')).toBe(true);
    expect(isWriterMonologueLeak('No numbers, no tags, no new named people in this beat.')).toBe(true);
    expect(isWriterMonologueLeak('That isn\'t real — skip the SNAPSHOT dump.')).toBe(true);
    expect(isWriterMonologueLeak('The handler wipes grit from his eyes and answers you.')).toBe(false);
    expect(isWriterMonologueLeak('no one else at the gate seems to have noticed.')).toBe(false);
    const state = litrpgState();
    expect(classifyBeatCommit(state, 'No tag needed. No loot for just watching.').accept).toBe(false);
  });

  it('rejects HP / RECORD / bracket-slot / SNAPSHOT chrome', () => {
    expect(isHudCombatChromeLeak('The skirmisher still stands (4/16 HP).')).toBe(true);
    expect(isHudCombatChromeLeak('She bleeds (13/16 HP) but holds the lane.')).toBe(true);
    expect(isHudCombatChromeLeak('RECORD 114 Pact-Hunter Skirmisher')).toBe(true);
    expect(isHudCombatChromeLeak('You read [the sign] beside the quay.')).toBe(true);
    expect(isEngineChromeOnlyBeat('RECORD 114 Pact-Hunter Skirmisher (13/16 HP)')).toBe(true);
    const state = litrpgState();
    expect(classifyBeatCommit(state, 'SNAPSHOT Location: West Wall === Presence: none').accept).toBe(
      false
    );
    expect(classifyBeatCommit(state, 'The skirmisher still stands (4/16 HP).').accept).toBe(false);
    expect(classifyBeatCommit(state, 'You read [the sign] beside the quay.').accept).toBe(false);
  });

  it('keeps legal story and slot speech', () => {
    const namesOk = 'Rain drums the awning. There is no one else at the gate.';
    const talk = 'You talk to Wren Holt about the ferry slip.';
    const stranger = 'The stranger shouts from the stall.';
    const state = roadState();
    expect(isWriterMonologueLeak(namesOk)).toBe(false);
    expect(isFactClosedViolation(state, namesOk)).toBe(false);
    expect(isFactClosedViolation(state, stranger)).toBe(false);
    expect(isSlotGlueViolation(stranger)).toBe(false);
    expect(classifyBeatCommit(state, namesOk).accept).toBe(true);
    expect(classifyBeatCommit(state, talk).accept).toBe(true);
    expect(isSlotGlueViolation('You examine the Brother Tam, etched into the lid.')).toBe(true);
  });
});

describe('Batch 02x — Lock A still closed', () => {
  it('first hub departure can still birth travel', () => {
    const state = litrpgState({
      currentLocation: 'West Wall',
      turn: 4,
      log: [{ id: 'a', role: 'gm', content: 'You stand on the West Wall in the rain.', timestamp: 1, turn: 3 }],
      sceneFacts: { ...emptySceneFacts(4), present: ['Wall Sergeant'] },
      discoveredLocations: ['sp-hub-lowmarket', 'sp-hub-west-wall'],
    });
    expect(excludedPadFamilies(state).has('travel')).toBe(false);
    const edges = enumerateLegalEdges(state);
    expect(edges.some((e) => e.kind === 'travel' || isTravelPad(e.label))).toBe(true);
  });
});
