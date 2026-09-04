/**
 * Craft-book compiler — one page per turn, not the D2 library.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { BUILD_STAMP } from './runManifest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { formatSceneSnapshotForPrompt } from './situationPacket';
import { formatModeStoryAuthorityLine, MODE_STORY_AUTHORITY } from './fluidProseRails';
import {
  applyCraftLearning,
  assertCraftAuthorityBudget,
  compileCraftRules,
  craftRulesForMode,
  formatCraftSnapshotLines,
} from './craftBookCompiler';
import { applyGovernanceCommit } from './qualityGovernance';
import type { EngineMode, GameState, LogEntry } from './types';

const MODES: EngineMode[] = ['litrpg', 'dnd', 'rpg', 'pyoa'];

function playing(mode: EngineMode): GameState {
  const state = createInitialState('Craft', mode);
  state.turn = 6;
  state.openingEstablishment = { complete: true, aloneArrival: false } as never;
  return state;
}

function withPlayer(state: GameState, text: string, turn = 5): GameState {
  const entry: LogEntry = {
    id: `p-${turn}`,
    turn,
    role: 'player',
    content: text,
    timestamp: turn,
  };
  return { ...state, log: [...(state.log ?? []), entry] };
}

function countCraftLines(snap: string): number {
  return (snap.match(/^CRAFT:/gm) ?? []).length;
}

describe('playtest31g — craft book compiler', () => {
  it('stamp is 2026-08-31g / 30z and Mid writer stays OFF', () => {
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(BUILD_STAMP >= '2026-08-30z').toBe(true);
    expect(HUD_BUILD_STAMP >= '2026-08-31g').toBe(true);
  });

  it('encodes 8–12 short rules per mode; each authority ≤200 chars', () => {
    expect(assertCraftAuthorityBudget()).toEqual([]);
    for (const mode of MODES) {
      const n = craftRulesForMode(mode).length;
      expect(n).toBeGreaterThanOrEqual(8);
      expect(n).toBeLessThanOrEqual(12);
    }
  });

  it('litrpg inspect → inspect-delta CRAFT and drops the static MODE AUTHORITY sentence', () => {
    const state = withPlayer(playing('litrpg'), 'Inspect the room');
    const compiled = compileCraftRules(state);
    expect(compiled.when).toBe('inspect');
    expect(compiled.replacedModeLine).toBe(true);
    expect(compiled.ruleIds).toContain('litrpg-inspect-delta');
    expect(compiled.ruleIds.length).toBeLessThanOrEqual(2);

    const snap = formatSceneSnapshotForPrompt(state);
    expect(snap).not.toMatch(/^CRAFT:/m);
    expect(snap).not.toContain(formatModeStoryAuthorityLine('litrpg'));
    expect(countCraftLines(snap)).toBe(0);
    expect(formatCraftSnapshotLines(state)).toEqual([]);
  });

  it('pyoa wait → fork rule', () => {
    const state = withPlayer(playing('pyoa'), 'Wait');
    const compiled = compileCraftRules(state);
    expect(compiled.when).toBe('wait');
    expect(compiled.replacedModeLine).toBe(true);
    expect(compiled.ruleIds).toContain('pyoa-wait-fork');
    expect(compiled.ruleIds.length).toBeLessThanOrEqual(2);

    const snap = formatSceneSnapshotForPrompt(state);
    expect(snap).not.toMatch(/^CRAFT:/m);
    expect(snap).not.toContain(formatModeStoryAuthorityLine('pyoa'));
    expect(countCraftLines(snap)).toBe(0);
  });

  it('compiler still picks mode rules internally; SNAPSHOT gets no CRAFT or MODE AUTHORITY', () => {
    for (const mode of ['dnd', 'rpg'] as EngineMode[]) {
      const state = playing(mode);
      const snap = formatSceneSnapshotForPrompt(state);
      expect(formatCraftSnapshotLines(state)).toEqual([]);
      expect(snap).not.toContain(MODE_STORY_AUTHORITY[mode]);
      expect(countCraftLines(snap)).toBe(0);
    }

    const dndTalkState = withPlayer(playing('dnd'), 'Ask the captain what she heard');
    const dndCompiled = compileCraftRules(dndTalkState);
    expect(dndCompiled.replacedModeLine).toBe(true);
    const dndTalk = formatSceneSnapshotForPrompt(dndTalkState);
    expect(dndTalk).not.toMatch(/^CRAFT:/m);
    expect(countCraftLines(dndTalk)).toBe(0);

    const rpgTalkState = withPlayer(playing('rpg'), 'Talk to Mara about the pass');
    const rpgCompiled = compileCraftRules(rpgTalkState);
    expect(rpgCompiled.replacedModeLine).toBe(true);
    const rpgTalk = formatSceneSnapshotForPrompt(rpgTalkState);
    expect(rpgTalk).not.toMatch(/^CRAFT:/m);
    expect(countCraftLines(rpgTalk)).toBe(0);
  });

  it('never emits more than 2 CRAFT lines even with stacked boosts', () => {
    const boosted = applyCraftLearning(
      { lastSignals: ['atmosphere', 'collage', 'pad_irrelevant'] },
      ['atmosphere', 'collage', 'pad_irrelevant'],
      'litrpg',
      []
    );
    const state: GameState = {
      ...withPlayer(playing('litrpg'), 'Inspect the walls again'),
      craftLedger: boosted,
    };
    const compiled = compileCraftRules(state);
    expect(compiled.ruleIds.length).toBeLessThanOrEqual(2);
    expect(countCraftLines(formatSceneSnapshotForPrompt(state))).toBe(0);
  });

  it('learns from last-turn atmosphere without a new LLM — inspect rule is boosted next turn', () => {
    const learned = applyCraftLearning(undefined, ['atmosphere'], 'litrpg', ['litrpg-default']);
    expect(learned.lastSignals).toContain('atmosphere');
    expect(learned.boosts?.['litrpg-inspect-delta'] ?? 0).toBeGreaterThan(0);

    const state: GameState = {
      ...withPlayer(playing('litrpg'), 'Inspect the room'),
      craftLedger: learned,
    };
    const compiled = compileCraftRules(state);
    expect(compiled.ruleIds[0]).toBe('litrpg-inspect-delta');
  });

  it('commit persists craftApplied on the GM log entry', () => {
    const previous = withPlayer(playing('litrpg'), 'Inspect the room');
    const gm: LogEntry = {
      id: 'gm-7',
      turn: 7,
      role: 'gm',
      content: 'Salt flake on the cot iron. The ward brightens.',
      timestamp: 7,
    };
    const next: GameState = {
      ...previous,
      turn: 7,
      log: [...previous.log, gm],
    };
    const commit = applyGovernanceCommit(previous, next, 'Inspect the room');
    const stamped = (commit.patches.log ?? next.log).find((e) => e.id === 'gm-7');
    expect(stamped?.craftApplied?.length).toBeGreaterThan(0);
    expect(stamped?.craftApplied?.length).toBeLessThanOrEqual(2);
    expect(stamped?.craftApplied).toContain('litrpg-inspect-delta');
    expect(commit.patches.craftLedger?.lastApplied).toContain('litrpg-inspect-delta');
  });
});
