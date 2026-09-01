/**
 * 2026-08-31n — Modest memory widen: last 4 log lines × 500 chars.
 * SNAPSHOT / lastSnapshotGist / AUTHORITY still win; no last-15 dump.
 * Stamp: HUD 2026-08-31n / BUILD 2026-08-31g. Mid writer OFF.
 */
import { describe, expect, it } from 'vitest';
import { BUILD_STAMP } from './runManifest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import type { GameState, LogEntry } from './types';
import {
  buildContextPrompt,
  RECENT_LOG_CHAR_CAP,
  RECENT_LOG_WINDOW,
} from './systemPrompt';
import { formatCampaignMemoryForPrompt } from './campaignMemory';

function line(id: string, turn: number, role: LogEntry['role'], content: string): LogEntry {
  return { id, turn, role, content, timestamp: turn };
}

function stateWithLog(log: LogEntry[]): GameState {
  const state = createInitialState(undefined, 'litrpg');
  state.campaignBibleId = 'summoned-pact';
  state.currentLocation = 'The Sevenfold Circle under Valespire Cathedral';
  state.turn = 8;
  state.log = log;
  state.runManifest = {
    buildStamp: BUILD_STAMP,
    seed: '31n',
    saveId: 'test-31n',
    engineMode: 'litrpg',
    createdAt: 1,
    eventSeq: 1,
  };
  return state;
}

describe('playtest31nMemoryWiden', () => {
  it('stamp is 2026-08-31n / 31g and Mid writer stays OFF', () => {
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(BUILD_STAMP >= '2026-08-31g').toBe(true);
    expect(HUD_BUILD_STAMP >= '2026-08-31n').toBe(true);
    expect(RECENT_LOG_WINDOW).toBe(4);
    expect(RECENT_LOG_CHAR_CAP).toBe(500);
  });

  it('includes last 4 log lines (GM + player) and drops older raw lines', () => {
    const log: LogEntry[] = [
      line('g1', 1, 'gm', 'MARKER_OLD_GM_ONE ozone and a blue panel.'),
      line('p1', 2, 'player', 'MARKER_OLD_PLAYER_ONE look around'),
      line('g2', 3, 'gm', 'MARKER_KEEP_GM_TWO stone under your palms.'),
      line('p2', 4, 'player', 'MARKER_KEEP_PLAYER_TWO I stand up'),
      line('g3', 5, 'gm', 'MARKER_KEEP_GM_THREE Orel waits at the ring.'),
      line('p3', 6, 'player', 'MARKER_KEEP_PLAYER_THREE who are you'),
    ];
    const kept = log.slice(-RECENT_LOG_WINDOW);
    expect(kept).toHaveLength(4);
    const text = buildContextPrompt(stateWithLog(log), 'ask the chanter');
    expect(text).toMatch(/RECENT CHAT BEATS/);
    expect(text).toMatch(/MARKER_KEEP_GM_TWO/);
    expect(text).toMatch(/MARKER_KEEP_PLAYER_TWO/);
    expect(text).toMatch(/MARKER_KEEP_GM_THREE/);
    expect(text).toMatch(/MARKER_KEEP_PLAYER_THREE/);
    expect(text).not.toMatch(/MARKER_OLD_GM_ONE/);
    expect(text).not.toMatch(/MARKER_OLD_PLAYER_ONE/);
    expect(text).toMatch(/GM: MARKER_KEEP_GM_TWO/);
    expect(text).toMatch(/PLAYER: MARKER_KEEP_PLAYER_TWO/);
  });

  it('caps each raw line at 500 chars and never dumps last-15 summaries', () => {
    const longTail = 'Z'.repeat(200);
    const log: LogEntry[] = [
      line('g1', 1, 'gm', `MARKER_LONG ${'Y'.repeat(480)}${longTail}`),
      line('p1', 2, 'player', 'MARKER_SHORT ask again'),
      line('g2', 3, 'gm', 'MARKER_GM_B a second beat.'),
      line('p2', 4, 'player', 'MARKER_PLAYER_B wait'),
    ];
    const state = stateWithLog(log);
    state.campaignMemory = {
      campaignSummary: 'A ruined hall.',
      personalitySummary: 'Cautious.',
      turnSummaries: Array.from({ length: 18 }, (_, i) => ({
        id: `t${i + 1}`,
        turn: i + 1,
        text: `Beat number ${i + 1} happened. MARKER_T15_DUMP_${i + 1}`,
      })),
      chapterSummaries: [],
      arcSummaries: [],
      pins: [],
      consequences: [],
    };

    const text = buildContextPrompt(state, 'look around');
    expect(text).toMatch(/RECENT CHAT BEATS \(flavor — SCENE FACTS \+ timeline win/);
    expect(text).not.toMatch(/last 15, full detail/);
    expect(text).not.toMatch(/MARKER_T15_DUMP_/);
    expect(text).not.toMatch(/T1: Beat number 1/);
    expect(text).toMatch(/MARKER_LONG/);
    expect(text).not.toMatch(longTail);

    const recentBlock = text.split('RECENT CHAT BEATS')[1] ?? '';
    const longLine = recentBlock.split('\n').find((row) => row.includes('MARKER_LONG')) ?? '';
    expect(longLine.startsWith('GM: ')).toBe(true);
    expect(longLine.slice('GM: '.length).length).toBe(RECENT_LOG_CHAR_CAP);

    const memory = formatCampaignMemoryForPrompt(state, 'SITUATION', 'xyzzy', 4000);
    expect(memory).not.toMatch(/last 15, full detail/);
  });
});
