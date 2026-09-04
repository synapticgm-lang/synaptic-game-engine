/**
 * Batch 02m — writer planning notes must not commit as GM story.
 * Shared P0 from 2×4 T30 (RPG s42 T5, LitRPG s43 T6, D&D s43 T7).
 * Mid writer OFF.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import {
  classifyBeatCommit,
  isWriterMonologueLeak,
  isDirectorChromeLeak,
  codedSceneMove,
  scrubDirectorChrome,
} from './beatCommitGate';
import { createInitialState } from './defaults';
import type { GameState } from './types';

const RPG_S42 =
  "turn: The vault is still under bombardment, dust drifting. The two priests are chanting low. Let me write this with good prose — sensory grounding, dialogue, one clear beat.";
const LITRPG_S43 =
  "Narrative: You turn from the blue panel. That completes stage-2 receipt fairly well. I should keep it tight — one beat. Let me write it cleanly.";
const DND_S43 =
  'Story first, then system-log, then action tags. The instruction says: "I only output narrative prose" because choices are calculated separately. Do NOT emit numbered choice lists.';

describe('Batch 02m stamps', () => {
  it('HUD and BUILD are 2026-09-02m and Mid writer stays OFF', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-09-02m');
    expect(BUILD_STAMP).toBe('2026-09-02m');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });
});

describe('Batch 02m — writer monologue never commits', () => {
  it('fingerprints the three 02l2x leak quotes', () => {
    expect(isWriterMonologueLeak(RPG_S42)).toBe(true);
    expect(isWriterMonologueLeak(LITRPG_S43)).toBe(true);
    expect(isWriterMonologueLeak(DND_S43)).toBe(true);
    expect(isDirectorChromeLeak(RPG_S42)).toBe(true);
  });

  it('does not flag ordinary story prose', () => {
    expect(isWriterMonologueLeak('The handler wipes grit from his eyes and answers you.')).toBe(false);
    expect(isWriterMonologueLeak('You keep it tight against the rain and walk on.')).toBe(false);
  });

  it('commit gate rejects writer notes and coded scene move is diegetic', () => {
    const state = createInitialState(undefined, 'litrpg') as GameState;
    state.openingEstablishment = {
      pending: [],
      answers: {},
      complete: true,
      aloneArrival: false,
    };
    state.turn = 6;
    const gate = classifyBeatCommit(state, RPG_S42, 'Ask a direct question');
    expect(gate.accept).toBe(false);
    expect(isWriterMonologueLeak(codedSceneMove(state))).toBe(false);
  });

  it('scrubs a mixed beat down to diegetic sentences', () => {
    const mixed =
      'The handler answers you. Let me write this with good prose. Dust drifts in the vault.';
    const scrub = scrubDirectorChrome(mixed);
    expect(scrub.scrubbed).toBe(true);
    expect(scrub.prose).not.toMatch(/Let me write this with good prose/i);
    expect(scrub.prose).toMatch(/handler answers/i);
  });
});
