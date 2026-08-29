import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { BUILD_STAMP } from './runManifest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import {
  playerAsksRepeat,
  playerAsksContinuation,
  filterRecycledStallChoices,
} from './semanticLoopDetector';
import { applyGovernanceToProse, filterGovernanceChoices } from './qualityGovernance';
import { formatSceneSnapshotForPrompt } from './situationPacket';
import { formatFluidProseRailsForPrompt } from './fluidProseRails';
import { buildPlayDump, buildPlayTurnsJsonl } from './playTranscript';
import { beatFingerprint } from './beatFingerprint';

describe('playtest30r — anti-repeat + play dump + story do/don’t', () => {
  it('Mid writer stays OFF and stamps moved forward', () => {
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(BUILD_STAMP >= '2026-08-30k').toBe(true);
    expect(HUD_BUILD_STAMP >= '2026-08-30R').toBe(true);
  });

  it('detects explicit repeat vs continuation', () => {
    expect(playerAsksRepeat('Say that again')).toBe(true);
    expect(playerAsksRepeat('Repeat what you said')).toBe(true);
    expect(playerAsksRepeat('Read it again')).toBe(true);
    expect(playerAsksRepeat('Wait and watch')).toBe(false);
    expect(playerAsksContinuation('Keep searching the same room')).toBe(true);
    expect(playerAsksContinuation('Keep walking')).toBe(true);
    expect(playerAsksContinuation('Inspect the cracked wall')).toBe(false);
  });

  it('drops recycled stall pads unless the player asked to repeat', () => {
    const base = createInitialState('Pact', 'litrpg');
    const state = {
      ...base,
      log: [
        {
          id: 'g1',
          turn: 4,
          role: 'gm' as const,
          content: 'The hall is still.',
          timestamp: 1,
          offeredChoices: ['Wait and watch', 'Inspect the surroundings', 'Walk away'],
        },
      ],
    };
    const recycled = filterRecycledStallChoices(
      ['Wait and watch', 'Talk to Mira', 'Inspect the surroundings'],
      state,
      'Talk to Mira'
    );
    expect(recycled.removed.some((c) => /wait/i.test(c))).toBe(true);
    expect(recycled.filtered.some((c) => /Mira/i.test(c))).toBe(true);

    const allowed = filterRecycledStallChoices(
      ['Wait and watch', 'Talk to Mira'],
      state,
      'Say that again'
    );
    expect(allowed.removed).toEqual([]);
  });

  it('hard-rejects near-clone prose on any turn unless player asked to repeat', () => {
    const state = createInitialState('Pact', 'pyoa');
    state.turn = 40;
    const prose =
      'The lantern glass ticks once. Salt air presses the same cracked pane. The crisis line waits at the door.';
    const cloneState = {
      ...state,
      qualityGovernance: {
        noveltyBudget: {
          recentSentences: {},
          recentParagraphs: { [beatFingerprint(prose)]: 38 },
          bannedTopics: [],
        },
      },
    };
    const rejected = applyGovernanceToProse(cloneState, prose, 'Look around');
    expect(rejected.rejectClone).toBe(true);
    const allowed = applyGovernanceToProse(cloneState, prose, 'Say that again');
    expect(allowed.rejectClone).toBeFalsy();
    const fresh = applyGovernanceToProse(createInitialState('Pact', 'pyoa'), prose, 'Look around');
    expect(fresh.rejectClone).toBeFalsy();
  });

  it('SNAPSHOT AUTHORITY forbids recycle unless the player asked', () => {
    const state = createInitialState(undefined, 'litrpg');
    state.turn = 8;
    state.openingEstablishment = { complete: true, aloneArrival: false } as never;
    const snap = formatSceneSnapshotForPrompt(state);
    expect(snap).toMatch(
      /Do not recycle a prior beat, location essay, crisis line, or choice pad unless the player asked to repeat or restate/
    );
    expect(formatFluidProseRailsForPrompt('pyoa')).toMatch(/NO RECYCLE/);
    expect(formatFluidProseRailsForPrompt('litrpg')).toMatch(/NO RECYCLE/);
    expect(formatFluidProseRailsForPrompt('dnd')).toMatch(/NO RECYCLE/);
    expect(formatFluidProseRailsForPrompt('rpg')).toMatch(/NO RECYCLE/);
  });

  it('play dump includes mode, stamp, options, and JSONL without eval copy', () => {
    const base = createInitialState('Test Tale', 'pyoa');
    const state = {
      ...base,
      saveId: 'save-loop-1',
      campaignBibleId: 'vesper-glass-cipher',
      turn: 2,
      currentLocation: 'The Landing',
      log: [
        {
          id: 'g1',
          turn: 1,
          role: 'gm' as const,
          content: 'The landing glass hums.',
          timestamp: 1,
          offeredChoices: ['Wait', 'Open the door'],
          systemLog: ['Quest Unlocked: Cipher'],
        },
        {
          id: 'p1',
          turn: 1,
          role: 'player' as const,
          content: 'Wait',
          timestamp: 2,
        },
      ],
    };
    const dump = buildPlayDump(state);
    expect(dump).toContain('Engine: pyoa');
    expect(dump).toContain('Bible: vesper-glass-cipher');
    expect(dump).toContain('Stamp:');
    expect(dump).toContain('### Options offered');
    expect(dump).toContain('## Loop review');
    expect(dump).toContain('## Turns (JSONL)');
    expect(dump).not.toMatch(/eval harness|test mode|AI study/i);
    const jsonl = buildPlayTurnsJsonl(state);
    const row = JSON.parse(jsonl.trim().split('\n')[0] ?? '{}') as { playerInput?: string; fatePick?: unknown };
    expect(row.playerInput).toBe('Wait');
    expect(row.fatePick).toBeNull();
  });

  it('filterGovernanceChoices drops last-turn Wait on PYOA', () => {
    const base = createInitialState('Fork', 'pyoa');
    const state = {
      ...base,
      turn: 6,
      openingEstablishment: { ...base.openingEstablishment!, complete: true, pending: [] },
      log: [
        {
          id: 'g1',
          turn: 5,
          role: 'gm' as const,
          content: 'The fork is still here.',
          timestamp: 1,
          offeredChoices: ['Wait and watch', 'Take the left path'],
        },
      ],
    };
    const { choices, notes } = filterGovernanceChoices(
      state,
      ['Wait and watch', 'Take the left path', 'Ask about the charter'],
      'Take the left path'
    );
    expect(choices.some((c) => /wait and watch/i.test(c))).toBe(false);
    expect(notes.some((n) => /Recycle pad/i.test(n))).toBe(true);
  });
});
