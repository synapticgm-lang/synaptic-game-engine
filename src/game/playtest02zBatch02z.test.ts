/**
 * Batch 02z — Path A authority inversion.
 * Sealed BeatContract card + slim writer packet + legal pad oracle + occupancy after leave.
 * Mid writer OFF. No live GM call. No T50.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import {
  buildSealedBeatCard,
  formatSealedBeatCard,
  formatWriterFacingPacket,
  inventedCastNamesInProse,
  isInventedCastViolation,
  sealedCastNames,
  sealedClosedFacts,
} from './beatContract';
import { formatFullMemoryBlock } from './situationPacket';
import { buildContextPrompt } from './systemPrompt';
import { buildSystemPrompt } from './masterPrompt';
import { formatCraftSnapshotLines } from './craftBookCompiler';
import { createDefaultSettings } from './defaults';
import {
  classifyBeatCommit,
  codedSceneMove,
  isFactClosedViolation,
} from './beatCommitGate';
import { applyPresentTrimOnTravel } from './presentAuthority';
import { isOpeningOccupancyReset, isLeftBehindActingHere } from './sceneContextTail';
import { enumerateLegalEdges } from './choiceEdge';
import {
  compileChoices,
} from './choiceCompiler';
import {
  excludedPadFamilies,
  isNamedTalkPad,
  isTravelPad,
  shouldStarveTalkPads,
} from './padUniverse';
import {
  applyPyoaCharterProseBurn,
  initPyoaBranchLedger,
  isPyoaCharterClosed,
} from './pyoaBranchLedger';
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

describe('Batch 02z stamps', () => {
  it('HUD and BUILD are 2026-09-02z and Mid writer stays OFF', () => {
    expect(HUD_BUILD_STAMP.startsWith('2026-09-02')).toBe(true);
    expect(BUILD_STAMP.startsWith('2026-09-02')).toBe(true);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });
});

describe('Batch 02z — sealed card from ledger', () => {
  it('CAST excludes planner chips and roles; CLOSED includes burned charter', () => {
    const messy = roadState({
      sceneFacts: { ...emptySceneFacts(20), present: ["So I'm", 'handler', 'Wren Holt'] },
    });
    const names = sealedCastNames(messy);
    expect(names).toEqual(['Wren Holt']);
    expect(names.some((n) => /so i['’]m/i.test(n))).toBe(false);
    expect(names.some((n) => /^handler$/i.test(n))).toBe(false);

    let burned = roadState({
      inventory: [{ id: 'mc', name: 'Millstone Charter', rarity: 'Common', quantity: 1 }],
    });
    burned = applyPyoaCharterProseBurn(
      burned,
      'The last corner of the Millstone Charter curls, catches, and dies in the hearth ash.'
    );
    expect(isPyoaCharterClosed(burned)).toBe(true);
    expect(sealedClosedFacts(burned).some((c) => /charter=destroyed/i.test(c))).toBe(true);
    const card = buildSealedBeatCard(burned, 'Talk to Wren Holt');
    expect(card.cast).toEqual(['Wren Holt']);
    expect(card.here.toLowerCase()).toMatch(/thornferry|mill/);
    expect(card.verb).toBe('talk');
    expect(card.closed.some((c) => /charter=destroyed/i.test(c))).toBe(true);
    expect(formatSealedBeatCard(card)).toMatch(/^HERE:/m);
    expect(formatSealedBeatCard(card)).not.toMatch(/SNAPSHOT/);
  });
});

describe('Batch 02z — slim writer packet', () => {
  it('live formatter has no SNAPSHOT Location or CRAFT lines', () => {
    const state = litrpgState({
      sceneFacts: { ...emptySceneFacts(18), present: ['Wren Holt'] },
      companions: roadState().companions,
      log: [
        { id: 'g1', role: 'gm', content: 'Rain drums the West Wall stones.', timestamp: 1, turn: 16 },
        { id: 'p1', role: 'player', content: 'Look around', timestamp: 2, turn: 17 },
        { id: 'g2', role: 'gm', content: 'The lane stays empty. There is no one else at the gate.', timestamp: 3, turn: 17 },
      ],
    });
    const packet = formatWriterFacingPacket(state, 'Talk to Wren Holt');
    const memory = formatFullMemoryBlock(state);
    const context = buildContextPrompt(state, 'Talk to Wren Holt');
    for (const text of [packet, memory, context]) {
      expect(text).not.toMatch(/### SNAPSHOT/);
      expect(text).not.toMatch(/SNAPSHOT Location/);
      expect(text).not.toMatch(/^CRAFT:/m);
      expect(text).not.toMatch(/AUTHORITY: SNAPSHOT/);
      expect(text).toMatch(/HERE:/);
      expect(text).toMatch(/CAST:/);
      expect(text).toMatch(/VERB:/);
      expect(text).toMatch(/PLAYER:/);
    }
    expect(formatCraftSnapshotLines(state)).toEqual([]);
    expect(packet).toMatch(/Rain drums the West Wall/);
    expect(packet).toMatch(/no one else at the gate/);
    expect(packet).not.toMatch(/Inventory \(/);
  });

  it('live system prompt drops kit dump and duplicate SNAPSHOT/CRAFT rails', () => {
    const kitName = 'TEST-KIT-WIDGET-XYZ';
    const state = litrpgState({
      inventory: [{ id: 'kit-widget', name: kitName, rarity: 'Common', quantity: 1, equipped: true, slot: 'hands' }],
      gold: 77,
      character: {
        ...litrpgState().character,
        hp: 11,
        maxHp: 22,
        mp: 3,
        maxMp: 9,
      },
    });
    const settings = createDefaultSettings();
    const live = buildSystemPrompt(state, settings, []);
    const kid = buildSystemPrompt(state, { ...settings, contentMode: 'kid' }, []);
    for (const text of [live, kid]) {
      expect(text).not.toMatch(/GROUND TRUTH CHARACTER/);
      expect(text).not.toMatch(/Equipped Gear:/);
      expect(text).not.toMatch(/Inventory:/);
      expect(text).not.toMatch(/SNAPSHOT Location/);
      expect(text).not.toMatch(/### SNAPSHOT/);
      expect(text).not.toMatch(/^CRAFT:/m);
      expect(text).not.toMatch(/AUTHORITY: SNAPSHOT/);
      expect(text).not.toContain(kitName);
      expect(text).toMatch(/ENGINE MODE DNA/);
      expect(text).toMatch(/PLAYER AGENCY/);
    }
    expect(kid).toMatch(/KID MODE/);
    expect(formatCraftSnapshotLines(state)).toEqual([]);
  });
});

describe('Batch 02z — invented CAST fails then stitch stays legal', () => {
  it('invented named person not on CAST is a commit fail; stitch does not invent them', () => {
    const state = litrpgState({
      companions: roadState().companions,
      sceneFacts: { ...emptySceneFacts(18), present: ['Wren Holt'] },
    });
    const invent = 'Orel Vane waits by the grain sacks and asks which way you are headed.';
    expect(inventedCastNamesInProse(state, invent)).toContain('Orel Vane');
    expect(isInventedCastViolation(state, invent)).toBe(true);
    expect(classifyBeatCommit(state, invent, 'Talk to Wren Holt').accept).toBe(false);
    const stitch = codedSceneMove(state);
    expect(stitch).not.toMatch(/Orel Vane/i);
    expect(isInventedCastViolation(state, stitch)).toBe(false);
  });

  it('keeps legal no one else, talk to Wren, and corpse already down', () => {
    const ok = 'Rain drums the awning. There is no one else at the gate.';
    const talk = 'You talk to Wren Holt about the ferry slip.';
    const corpse = 'The Pact-Hunter Skirmisher is already down. The blade stays where it fell.';
    const wall = litrpgState({
      sceneFacts: {
        ...emptySceneFacts(18),
        present: [],
        lastKill: { name: 'Pact-Hunter Skirmisher', outcome: 'victory', turn: 14, remains: true },
      },
    });
    expect(isFactClosedViolation(litrpgState(), ok)).toBe(false);
    expect(classifyBeatCommit(litrpgState(), ok).accept).toBe(true);
    expect(classifyBeatCommit(roadState(), talk, 'Talk to Wren Holt').accept).toBe(true);
    expect(classifyBeatCommit(wall, corpse, 'Check the body').accept).toBe(true);
  });
});

describe('Batch 02z — occupancy after leave', () => {
  it('after leave, handler/priest are not CAST or HERE', () => {
    const state = litrpgState({
      currentLocation: 'West Wall',
      previousLocationSheet: { name: 'Sevenfold Circle' } as GameState['previousLocationSheet'],
      turn: 8,
      sceneFacts: {
        ...emptySceneFacts(8),
        present: ['Handler', 'Wren Holt'],
        cameraLock: { scale: 'outdoor', label: 'West Wall', lockedTurn: 7 },
      },
      companions: roadState().companions,
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
    const left = applyPresentTrimOnTravel(state, 'Sevenfold Circle', 'West Wall');
    expect(left.sceneFacts?.present ?? []).toEqual(['Wren Holt']);
    expect(sealedCastNames(left)).toEqual(['Wren Holt']);
    expect(sealedCastNames(left).some((n) => /handler/i.test(n))).toBe(false);
    const handler = 'The handler waits by the gate as if you never left.';
    const priest = 'Scale priests stand in the Sevenfold Circle and look up.';
    expect(isOpeningOccupancyReset(left, handler)).toBe(true);
    expect(isOpeningOccupancyReset(left, priest)).toBe(true);
    expect(classifyBeatCommit(left, handler, 'Look around').accept).toBe(false);
    const card = buildSealedBeatCard(left, 'Look around');
    expect(card.here.toLowerCase()).toMatch(/west wall/);
    expect(card.cast).not.toContain('Handler');
  });

  it('rejects previous-HERE people acting as HERE after committed travel', () => {
    const state = litrpgState({
      currentLocation: 'Lowmarket',
      previousLocationSheet: { name: 'West Wall' } as GameState['previousLocationSheet'],
      turn: 10,
      sceneFacts: {
        ...emptySceneFacts(10),
        present: ['Wren Holt'],
        leftBehind: ['Wall Sergeant'],
        cameraLock: { scale: 'outdoor', label: 'Lowmarket', lockedTurn: 9 },
      },
      companions: roadState().companions,
      log: [{ id: 'p', role: 'player', content: 'Travel toward Lowmarket', timestamp: 1, turn: 9 }],
    });
    const snap = 'The Wall Sergeant waits by the battlement as if you never left.';
    expect(isLeftBehindActingHere(state, snap)).toBe(true);
    expect(classifyBeatCommit(state, snap, 'Look around').accept).toBe(false);
  });
});

describe('Batch 02z — legal pad oracle', () => {
  it('travel starved still births no Travel pad; first hub departure stays legal', () => {
    const starved = litrpgState({
      turn: 43,
      log: [
        { id: 'a', role: 'player', content: 'Travel toward Lowmarket', timestamp: 1 },
        { id: 'b', role: 'gm', content: 'You reach Lowmarket.', timestamp: 2 },
        { id: 'c', role: 'player', content: 'Talk to Lowmarket Fence', timestamp: 3 },
        { id: 'd', role: 'gm', content: 'The fence waits.', timestamp: 4 },
        { id: 'e', role: 'player', content: 'Travel toward West Wall', timestamp: 5 },
        { id: 'f', role: 'gm', content: 'You reach West Wall.', timestamp: 6 },
      ],
      sceneFacts: { ...emptySceneFacts(43), present: ['Wall Sergeant'] },
      discoveredLocations: ['sp-hub-lowmarket', 'sp-hub-west-wall'],
    });
    expect(excludedPadFamilies(starved).has('travel')).toBe(true);
    const compiled = compileChoices(
      starved,
      ['Travel toward Lowmarket', 'Inspect the battlement', 'Ask a direct question'],
      undefined,
      'Travel toward West Wall'
    );
    expect(compiled.choices.filter((c) => isTravelPad(c)).length).toBe(0);

    const first = litrpgState({
      currentLocation: 'West Wall',
      turn: 4,
      log: [{ id: 'a', role: 'gm', content: 'You stand on the West Wall in the rain.', timestamp: 1, turn: 3 }],
      sceneFacts: { ...emptySceneFacts(4), present: ['Wall Sergeant'] },
      discoveredLocations: ['sp-hub-lowmarket', 'sp-hub-west-wall'],
    });
    expect(excludedPadFamilies(first).has('travel')).toBe(false);
    expect(enumerateLegalEdges(first).some((e) => e.kind === 'travel' || isTravelPad(e.label))).toBe(true);
  });

  it('named talk pads starve when CAST is empty; talk to Wren stays when CAST has Wren', () => {
    const empty = litrpgState({ sceneFacts: { ...emptySceneFacts(8), present: [] } });
    expect(shouldStarveTalkPads(empty)).toBe(true);
    expect(isNamedTalkPad('Talk to Wren Holt')).toBe(true);
    const compiled = compileChoices(empty, ['Talk to Wren Holt', 'Inspect the immediate surroundings']);
    expect(compiled.choices.some((c) => /talk to wren/i.test(c))).toBe(false);

    const withWren = roadState();
    expect(shouldStarveTalkPads(withWren)).toBe(false);
    const talking = compileChoices(withWren, ['Talk to Wren Holt', 'Inspect the mill']);
    expect(talking.choices.some((c) => /talk to wren/i.test(c))).toBe(true);
  });
});
