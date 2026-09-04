/**
 * Batch 02r — scene context tail + stale-camera commit.
 * Tapes: 02q LitRPG vault→street tail; D&D Cup/Wall blend; lastKill steel after clear.
 * Mid writer OFF. No live GM call.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import type { GameState, LogEntry } from './types';
import { buildContextPrompt } from './systemPrompt';
import { isFactClosedViolation, classifyBeatCommit } from './beatCommitGate';
import {
  selectRecentLogForContext,
  isStaleContextBleed,
  mentionsPlace,
} from './sceneContextTail';

function line(id: string, turn: number, role: LogEntry['role'], content: string): LogEntry {
  return { id, turn, role, content, timestamp: turn };
}

function streetAfterVault(log: LogEntry[]): GameState {
  const state = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...state,
    campaignBibleId: 'summoned-pact',
    currentLocation: 'Lowmarket',
    previousLocationSheet: { name: 'The Sevenfold Circle under Valespire Cathedral' } as GameState['previousLocationSheet'],
    turn: 10,
    log,
    sceneFacts: {
      ...emptySceneFacts(10),
      cameraLock: { scale: 'outdoor', label: 'Lowmarket', lockedTurn: 10 },
    },
    openingEstablishment: {
      pending: [],
      answers: {},
      complete: true,
      aloneArrival: false,
    },
  };
}

describe('Batch 02r stamps', () => {
  it('HUD and BUILD are 2026-09-02r and Mid writer stays OFF', () => {
    expect(HUD_BUILD_STAMP >= '2026-09-02r').toBe(true);
    expect(BUILD_STAMP >= '2026-09-02r').toBe(true);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });
});

describe('Batch 02r — scene context tail', () => {
  it('drops vault GM after travel to Lowmarket', () => {
    const log: LogEntry[] = [
      line('g8', 8, 'gm', 'MARKER_VAULT The Sevenfold Circle holds its breath. The handler waits.'),
      line('p9', 9, 'player', 'MARKER_TRAVEL Travel toward Lowmarket'),
      line('g9', 9, 'gm', 'MARKER_STREET Rain hits the Lowmarket stalls.'),
      line('p10', 10, 'player', 'MARKER_LOOK look around'),
    ];
    const state = streetAfterVault(log);
    const kept = selectRecentLogForContext(state, 4);
    const text = kept.map((e) => e.content).join('\n');
    expect(text).not.toMatch(/MARKER_VAULT/);
    expect(text).toMatch(/MARKER_TRAVEL/);
    expect(text).toMatch(/MARKER_STREET/);
    const prompt = buildContextPrompt(state, 'ask the stall-hand');
    expect(prompt).not.toMatch(/MARKER_VAULT/);
    expect(prompt).toMatch(/MARKER_STREET/);
  });

  it('keeps last 4 when the camera has not moved', () => {
    const state = createInitialState(undefined, 'litrpg') as GameState;
    state.currentLocation = 'Lowmarket';
    state.turn = 6;
    state.log = [
      line('g1', 1, 'gm', 'MARKER_OLD ozone and a blue panel.'),
      line('p1', 2, 'player', 'MARKER_OLD_P look around'),
      line('g2', 3, 'gm', 'MARKER_KEEP_A stone under your palms.'),
      line('p2', 4, 'player', 'MARKER_KEEP_B I stand up'),
      line('g3', 5, 'gm', 'MARKER_KEEP_C Orel waits at the ring.'),
      line('p3', 6, 'player', 'MARKER_KEEP_D who are you'),
    ];
    const kept = selectRecentLogForContext(state, 4);
    expect(kept).toHaveLength(4);
    expect(kept.map((e) => e.content).join(' ')).toMatch(/MARKER_KEEP_A/);
    expect(kept.map((e) => e.content).join(' ')).not.toMatch(/MARKER_OLD/);
  });

  it('drops pre-clear fight GM after lastKill', () => {
    const state = createInitialState(undefined, 'litrpg') as GameState;
    state.currentLocation = 'Lowmarket';
    state.turn = 20;
    state.activeEncounter = undefined;
    state.sceneFacts = {
      ...emptySceneFacts(20),
      lastKill: {
        name: 'Pact-Hunter Skirmisher',
        outcome: 'victory',
        turn: 19,
        remains: true,
      },
    };
    state.log = [
      line('g17', 17, 'gm', 'MARKER_FIGHT The skirmisher blade stops mid-arc at your throat.'),
      line('p18', 18, 'player', 'Strike'),
      line('g19', 19, 'gm', 'MARKER_CLEAR The Pact-Hunter Skirmisher falls. Encounter cleared.'),
      line('p20', 20, 'player', 'Search the body'),
    ];
    const kept = selectRecentLogForContext(state, 4);
    const text = kept.map((e) => e.content).join('\n');
    expect(text).not.toMatch(/MARKER_FIGHT/);
    expect(text).toMatch(/MARKER_CLEAR/);
  });
});

describe('Batch 02r — stale context commit', () => {
  it('mentions Sevenfold / Lowmarket without a deny-list of people', () => {
    expect(mentionsPlace('The Sevenfold Circle holds its breath.', 'The Sevenfold Circle under Valespire Cathedral')).toBe(true);
    expect(mentionsPlace('Rain hits the Lowmarket stalls.', 'Lowmarket')).toBe(true);
    expect(mentionsPlace('Rain hits the Lowmarket stalls.', 'The Sevenfold Circle under Valespire Cathedral')).toBe(false);
  });

  it('rejects old-room camera after recent travel (02q D&D T10 class)', () => {
    const state = streetAfterVault([
      line('p10', 10, 'player', 'Travel toward Lowmarket'),
    ]);
    const bleed =
      'Behind you, the Sevenfold Circle has gone still. The handler waits at the ring.';
    expect(isStaleContextBleed(state, bleed)).toBe(true);
    expect(isFactClosedViolation(state, bleed)).toBe(true);
    expect(classifyBeatCommit(state, bleed).accept).toBe(false);
    expect(
      isFactClosedViolation(state, 'You left the Sevenfold Circle behind. Lowmarket rain hits the stalls.')
    ).toBe(false);
    expect(isFactClosedViolation(state, 'A vendor under a patched tarp meets your glance.')).toBe(false);
  });

  it('rejects post-clear steel in the last 2 turns', () => {
    const state = createInitialState(undefined, 'litrpg') as GameState;
    const closed: GameState = {
      ...state,
      currentLocation: 'Lowmarket',
      activeEncounter: undefined,
      turn: 20,
      sceneFacts: {
        ...emptySceneFacts(20),
        lastKill: {
          name: 'Pact-Hunter Skirmisher',
          outcome: 'victory',
          turn: 19,
          remains: true,
        },
      },
    };
    const steel = "The skirmisher's blade stops mid-arc, a handspan from your throat.";
    expect(isStaleContextBleed(closed, steel)).toBe(true);
    expect(isFactClosedViolation(closed, steel)).toBe(true);
    expect(isFactClosedViolation(closed, 'Rain drums the awning. The road is open.')).toBe(false);
  });
});
