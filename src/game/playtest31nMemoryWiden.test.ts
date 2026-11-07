/**
 * 2026-08-31n — Modest memory widen: last 4 log lines × 500 chars.
 * 02z — live writer packet is last 2 GM beats (selectRecentLogForContext still
 * drops pre-travel). RECENT_LOG_WINDOW stays 4 for the helper; no last-15 dump.
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
import { pageOpeners } from './completedEventPacket';

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

  // 29z9i — the live writer reads the info sheet in place of raw GM beats.
  // s77 Root D — plus the opening sentence of each of the last two GM beats, as recorded fact.
  it('live packet carries the info sheet and only the opening sentence of the last two GM beats', () => {
    const log: LogEntry[] = [
      line('g1', 1, 'gm', 'MARKER_OLD_GM_ONE ozone and a blue panel.'),
      line('p1', 2, 'player', 'MARKER_OLD_PLAYER_ONE look around'),
      line('g2', 3, 'gm', 'MARKER_KEEP_GM_TWO stone under your palms. MARKER_REST_TWO the floor is cold.'),
      line('p2', 4, 'player', 'MARKER_KEEP_PLAYER_TWO I stand up'),
      line('g3', 5, 'gm', 'MARKER_KEEP_GM_THREE Orel waits at the ring. MARKER_REST_THREE he does not move.'),
      line('p3', 6, 'player', 'MARKER_KEEP_PLAYER_THREE who are you'),
    ];
    const kept = log.slice(-RECENT_LOG_WINDOW);
    expect(kept).toHaveLength(4);
    const text = buildContextPrompt(stateWithLog(log), 'ask the chanter');
    expect(text).toMatch(/COMPLETED EVENT:/);
    expect(text).toMatch(/YOU MAY ONLY MENTION/);
    expect(text).not.toMatch(/RECENT CHAT BEATS/);
    expect(text).toMatch(/INFO SHEET/);
    expect(text).toMatch(/- T4 MARKER_KEEP_PLAYER_TWO I stand up → /);
    expect(text).toMatch(/- T2 MARKER_OLD_PLAYER_ONE look around → /);
    expect(text).not.toMatch(/T6 MARKER_KEEP_PLAYER_THREE/);
    expect(text).not.toMatch(/ALREADY ON THE PAGE/);
    expect(text).not.toMatch(/MARKER_KEEP_GM_TWO|MARKER_KEEP_GM_THREE|MARKER_REST_TWO|MARKER_REST_THREE|MARKER_OLD_GM_ONE/);
    const openers = pageOpeners(stateWithLog(log), 'ask the chanter');
    expect(openers).toEqual([
      'MARKER_KEEP_GM_TWO stone under your palms.',
      'MARKER_KEEP_GM_THREE Orel waits at the ring.',
    ]);
    expect(text).toMatch(/PLAYER: \(already shown in UI — do not restate\)/);
    expect(text).not.toMatch(/PLAYER: ask the chanter/);
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
    expect(text).toMatch(/COMPLETED EVENT:/);
    expect(text).not.toMatch(/RECENT CHAT BEATS/);
    expect(text).not.toMatch(/last 15, full detail/);
    expect(text).not.toMatch(/MARKER_T15_DUMP_/);
    expect(text).not.toMatch(/T1: Beat number 1/);
    expect(text).not.toMatch(/MARKER_LONG/);
    expect(text).not.toMatch(longTail);
    const openers = pageOpeners(state, 'look around');
    expect(openers.join('\n')).toMatch(/MARKER_LONG Y+/);
    expect(openers.join('\n')).not.toMatch(longTail);
    expect(openers.every((line) => line.length <= 500)).toBe(true);
    expect(text).toMatch(/INFO SHEET/);

    const memory = formatCampaignMemoryForPrompt(state, 'SITUATION', 'xyzzy', 4000);
    expect(memory).not.toMatch(/last 15, full detail/);
  });
});
