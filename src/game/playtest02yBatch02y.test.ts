/**
 * Batch 02y — UI-never-people + place-title slot-glue + prose-burn charter
 * + imperative-craft + occupancy-after-travel + talk recycle.
 * Gemini 02x 4×T50 leftovers. Mid writer OFF. No live GM call.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import { canHarvestAsNamedPerson } from './entityRegistry';
import { isPlannerUiPersonToken } from './chromeAuthority';
import { harvestNarrativeIntoLedger } from './narrativeHarvest';
import { buildEntityCast } from './entityCast';
import {
  classifyBeatCommit,
  isFactClosedViolation,
  isWriterMonologueLeak,
} from './beatCommitGate';
import { isOpeningOccupancyReset } from './sceneContextTail';
import { applyPresentTrimOnTravel } from './presentAuthority';
import { isSlotGlueViolation, ledgerPlaceTitles, scrubSlotGlue } from './slotGlue';
import {
  applyPyoaCharterProseBurn,
  initPyoaBranchLedger,
  isPyoaCharterClosed,
  isPyoaCharterProseBurn,
  isPyoaItemDestroyed,
  recordPyoaBranchChoice,
} from './pyoaBranchLedger';
import { detectTalkUltimatumRecycle } from './semanticLoopDetector';
import { applyProseWarden } from './proseWarden';
import type { GameState } from './types';

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

describe('Batch 02y stamps', () => {
  it('HUD and BUILD are 2026-09-02y and Mid writer stays OFF', () => {
    expect(HUD_BUILD_STAMP.startsWith('2026-09-02')).toBe(true);
    expect(BUILD_STAMP.startsWith('2026-09-02')).toBe(true);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });
});

describe('Batch 02y — UI / pronouns / planner fragments never CAST', () => {
  it('denies contracted chips, colon labels, bare pronouns, and status adjectives', () => {
    expect(isPlannerUiPersonToken("So I'm")).toBe(true);
    expect(isPlannerUiPersonToken("So I'll")).toBe(true);
    expect(isPlannerUiPersonToken('We:')).toBe(true);
    expect(isPlannerUiPersonToken('Her')).toBe(true);
    expect(isPlannerUiPersonToken('Smart')).toBe(true);
    expect(canHarvestAsNamedPerson("So I'm", 'summoned-pact')).toBe(false);
    expect(canHarvestAsNamedPerson('Her', 'summoned-pact')).toBe(false);
    expect(canHarvestAsNamedPerson('We:', 'summoned-pact')).toBe(false);
    expect(canHarvestAsNamedPerson('Smart', 'summoned-pact')).toBe(false);
    expect(canHarvestAsNamedPerson('Wren Holt', 'thornferry-road')).toBe(true);
  });

  it('does not harvest planner / pronoun chips into present[] or CAST', () => {
    let state = litrpgState({
      sceneFacts: { ...emptySceneFacts(9), present: ["So I'm", 'Her', 'Smart', 'Wren Holt'] },
    });
    const harvested = harvestNarrativeIntoLedger(
      state,
      "So I'm waiting. Her nods. We: keep watch. Smart lists the kit. Wren Holt keeps pace. There is no one else at the gate.",
      9
    );
    const present = harvested.sceneFacts?.present ?? [];
    expect(present.some((p) => /so i['’]m/i.test(p))).toBe(false);
    expect(present.some((p) => /^her$/i.test(p))).toBe(false);
    expect(present.some((p) => /^smart$/i.test(p))).toBe(false);
    expect(present.some((p) => /^we:?$/i.test(p))).toBe(false);
    expect(present.some((p) => /Wren Holt/i.test(p))).toBe(true);

    const cast = buildEntityCast(harvested);
    expect(cast).toMatch(/Wren Holt/);
    expect(cast).not.toMatch(/NAMED CHARACTERS[^]*So I'm/i);
    expect(cast).not.toMatch(/NAMED CHARACTERS[^]*\bHer\b/);
    expect(cast).not.toMatch(/NAMED CHARACTERS[^]*\bSmart\b/);
  });
});

describe('Batch 02y — place-title slot glue', () => {
  it('rejects take/open place-title object glue when the title is HERE', () => {
    const state = litrpgState({
      currentLocation: 'Sevenfold Circle',
      sceneFacts: { ...emptySceneFacts(6), cameraLock: { scale: 'indoor', label: 'Sevenfold Circle', lockedTurn: 5 } },
    });
    const take = 'You take The Sevenfold hands and pull toward the door.';
    const open = 'You open your The Sevenfold and wait.';
    expect(ledgerPlaceTitles(state).some((t) => /sevenfold/i.test(t))).toBe(true);
    expect(isSlotGlueViolation(take, [], ledgerPlaceTitles(state))).toBe(true);
    expect(isSlotGlueViolation(open, [], ledgerPlaceTitles(state))).toBe(true);
    expect(isFactClosedViolation(state, take)).toBe(true);
    expect(isFactClosedViolation(state, open)).toBe(true);
    expect(scrubSlotGlue(take, [], ledgerPlaceTitles(state))).not.toMatch(/take The Sevenfold hands/i);
    expect(applyProseWarden(take, { currentLocation: 'Sevenfold Circle', knownPlaces: ['Sevenfold Circle'] })).not.toMatch(
      /take The Sevenfold hands/i
    );
  });

  it('keeps legal stranger speech and Wren Holt', () => {
    const stranger = 'The stranger shouts from the stall.';
    expect(isSlotGlueViolation(stranger)).toBe(false);
    expect(isFactClosedViolation(roadState(), stranger)).toBe(false);
    expect(canHarvestAsNamedPerson('Wren Holt', 'thornferry-road')).toBe(true);
  });
});

describe('Batch 02y — charter prose burn', () => {
  it('destroys the charter on one prose burn and rejects the next intact beat', () => {
    let state = roadState({
      inventory: [{ id: 'mc', name: 'Millstone Charter', rarity: 'Common', quantity: 1 }],
    });
    const burn =
      'The last corner of the Millstone Charter curls, catches, and dies in the hearth ash.';
    expect(isPyoaCharterProseBurn(burn)).toBe(true);
    state = applyPyoaCharterProseBurn(state, burn);
    expect(isPyoaCharterClosed(state)).toBe(true);
    expect(isPyoaItemDestroyed(state, 'charter')).toBe(true);
    expect(state.inventory?.some((i) => /charter/i.test(i.name))).toBe(false);

    const harvested = harvestNarrativeIntoLedger(
      roadState({
        inventory: [{ id: 'mc', name: 'Millstone Charter', rarity: 'Common', quantity: 1 }],
      }),
      burn,
      21
    );
    expect(isPyoaCharterClosed(harvested)).toBe(true);

    const intact = "The charter's weight sits against your chest again. The seal is intact.";
    expect(isFactClosedViolation(state, intact)).toBe(true);
    expect(classifyBeatCommit(state, intact).accept).toBe(false);
  });

  it('still destroys after three uses', () => {
    let state = roadState({
      inventory: [{ id: 'mc', name: 'Millstone Charter', rarity: 'Common', quantity: 1 }],
    });
    state = recordPyoaBranchChoice(state, 'Inspect the charter clause');
    state = recordPyoaBranchChoice(state, 'Inspect the charter clause');
    state = recordPyoaBranchChoice(state, 'Inspect the charter clause');
    expect(state.pyoaBranchLedger?.charterUses).toBe(3);
    expect(isPyoaCharterClosed(state)).toBe(true);
  });
});

describe('Batch 02y — imperative craft + legal no one else', () => {
  it('rejects writer-order word-budget / do-not-narrate beats', () => {
    const leak =
      'In no more than 120 words, describe the rain on the stones. Do not narrate the next hour.';
    expect(isWriterMonologueLeak(leak)).toBe(true);
    expect(classifyBeatCommit(litrpgState(), leak).accept).toBe(false);
    expect(isWriterMonologueLeak('Skip the comma and keep the beat tight.')).toBe(true);
  });

  it('keeps legal story mentioning no one else', () => {
    const ok = 'Rain drums the awning. There is no one else at the gate.';
    expect(isWriterMonologueLeak(ok)).toBe(false);
    expect(isFactClosedViolation(litrpgState(), ok)).toBe(false);
    expect(classifyBeatCommit(litrpgState(), ok).accept).toBe(true);
  });
});

describe('Batch 02y — occupancy after leave-travel', () => {
  it('rejects opening handler / priest as HERE after leave', () => {
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
    const handler = 'The handler waits by the gate as if you never left.';
    const priest = 'Scale priests stand in the Sevenfold Circle and look up.';
    const farewell = 'She stays behind, watching you go until the fog swallows her.';
    expect(isOpeningOccupancyReset(state, handler)).toBe(true);
    expect(isFactClosedViolation(state, handler)).toBe(true);
    expect(isOpeningOccupancyReset(state, priest)).toBe(true);
    expect(isOpeningOccupancyReset(state, farewell)).toBe(false);
    const here = 'Rain drums the West Wall stones. The road east is open.';
    expect(isOpeningOccupancyReset(state, here)).toBe(false);
  });

  it('trims opening pins on travel and will not re-harvest them from farewell prose', () => {
    const state = litrpgState({
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
      previousLocationSheet: { name: 'Sevenfold Circle' } as GameState['previousLocationSheet'],
      sceneFacts: {
        ...emptySceneFacts(8),
        present: ['Handler', 'Wren Holt'],
        cameraLock: { scale: 'outdoor', label: 'West Wall', lockedTurn: 7 },
      },
      log: [{ id: 'p', role: 'player', content: 'Leave the circle', timestamp: 1, turn: 7 }],
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
    const harvested = harvestNarrativeIntoLedger(
      { ...left, currentLocation: 'West Wall' },
      'The handler stays behind, watching you go until the fog swallows her. Wren Holt keeps pace.',
      8
    );
    expect(harvested.sceneFacts?.present ?? []).toEqual(['Wren Holt']);
  });
});

describe('Batch 02y — talk / argument recycle', () => {
  it('rejects the same Wren heading line the third time in five turns', () => {
    const heading =
      'Wren Holt studies the wet road and asks which way you are headed before the mill closes.';
    const prior = [heading, heading];
    expect(detectTalkUltimatumRecycle(heading, prior, 'Talk to Wren Holt')).toBe(true);
    expect(detectTalkUltimatumRecycle(heading, [], 'Talk to Wren Holt')).toBe(false);

    const state = roadState({
      log: [
        { id: 'g1', role: 'gm', content: heading, timestamp: 1, turn: 16 },
        { id: 'g2', role: 'gm', content: heading, timestamp: 2, turn: 17 },
      ],
    });
    expect(classifyBeatCommit(state, heading, 'Talk to Wren Holt').accept).toBe(false);
    expect(classifyBeatCommit(state, heading, 'Say that again').accept).toBe(true);
    const first = roadState({ log: [] });
    expect(classifyBeatCommit(first, heading, 'Talk to Wren Holt').accept).toBe(true);
  });
});
