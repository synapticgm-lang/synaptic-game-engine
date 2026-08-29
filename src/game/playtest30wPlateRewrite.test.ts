import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import {
  CANNED_SAFER_SCENE_LINE,
  gmFacingPlayerAction,
  groundPlayerAction,
  isSaferSceneLeak,
  parsePlayerIntent,
  playerTypedDialogue,
  playerVisibleActionText,
  resolvePlayerActionLines,
} from './intentParser';
import { validateActionHard } from './actionValidation';
import { pinOpeningHereScene, synthesizeMemorablePrompt } from './memorableMoments';
import { applyProseWarden, scrubFalseSpokenAction, scrubSaferSceneMeta } from './proseWarden';
import { buildDeterministicOnePanel } from './comicBeatSpec';
import { formatSceneArtLock } from './sceneArtLock';
import type { GameState } from './types';

function quietState(overrides: Partial<GameState> = {}): GameState {
  const state = createInitialState('Agency', 'litrpg');
  return {
    ...state,
    openingEstablishment: {
      complete: true,
      pending: [],
      answers: {},
      aloneArrival: false,
    },
    sceneFacts: {
      crowd: 'none',
      noise: 'quiet',
      present: [],
      props: ['blue panel'],
      lastBeat: 'You stand on a circular mosaic of cracked stone.',
      updatedTurn: 1,
    },
    activeEncounter: undefined,
    ...overrides,
  };
}

const PHYSICAL = [
  'I run away',
  'flee',
  'walk away',
  'leave',
  'retreat',
  'escape',
  'back away',
  'I scan the blue panel',
  'Inspect the mosaic',
];

describe('playtest30w — site-wide player line + plate lock', () => {
  it('Mid writer stays OFF; BUILD is 30p+', () => {
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(BUILD_STAMP >= '2026-08-30p').toBe(true);
    const html = readFileSync(resolve(__dirname, '../../index.html'), 'utf8');
    expect(html).toMatch(/sgm-build 2026-08-30[W-Z]/);
  });

  it('typed physical lines stay on the log; flee intent still parses', () => {
    const state = quietState();
    for (const typed of PHYSICAL) {
      const lines = resolvePlayerActionLines(typed, state, 'Stone walls. A blue panel hangs.');
      expect(lines.displayText).toBe(typed);
      expect(lines.gmText).toBe(typed);
      expect(lines.displayText).not.toBe(CANNED_SAFER_SCENE_LINE);
      expect(isSaferSceneLeak(lines.gmText)).toBe(false);
    }
    expect(parsePlayerIntent('I run away').kind).toBe('flee');
    expect(parsePlayerIntent('leave').kind).toBe('move');
    expect(parsePlayerIntent('I scan the blue panel').kind).toBe('observe');
  });

  it('never injects the safer-scene template from groundPlayerAction or the hard gate', () => {
    const state = quietState();
    const grounded = groundPlayerAction('I run away', state, '');
    expect(grounded.text).toBe('I run away');
    expect(grounded.intent.kind).toBe('flee');
    expect(isSaferSceneLeak(grounded.text)).toBe(false);
    expect(gmFacingPlayerAction('I run away', {
      ...grounded,
      text: CANNED_SAFER_SCENE_LINE,
      rewritten: true,
    })).toBe('I run away');

    const hard = validateActionHard('I run away', state, 'A quiet hall.');
    expect(hard.valid).toBe(true);
    expect(hard.rewritten && isSaferSceneLeak(hard.rewritten)).toBeFalsy();
  });

  it('scan / inspect / flee are not typed dialogue; quoted talk still is', () => {
    expect(playerTypedDialogue('I scan the blue panel')).toBe(false);
    expect(playerTypedDialogue('Inspect the mosaic')).toBe(false);
    expect(playerTypedDialogue('I run away')).toBe(false);
    expect(playerTypedDialogue('walk away')).toBe(false);
    expect(playerTypedDialogue('Ask what is going on')).toBe(true);
    expect(playerTypedDialogue('"Get back."')).toBe(true);
  });

  it('Kid Mode still masks slurs; I run away stays', () => {
    expect(playerVisibleActionText('I run away', 'kid')).toBe('I run away');
    expect(playerVisibleActionText('I run away', 'adult')).toBe('I run away');
  });

  it('warden strips safer-scene meta and false you-state on a physical act', () => {
    const leaked =
      'Dust along the stone walls. "I scan the blue panel before committing," you state, your voice cutting through the low hum of unease, "if none is present, I stay alert and choose a safer scene action." The man in robes does not move.';
    const cleaned = applyProseWarden(leaked, { playerInput: 'I scan the blue panel' });
    expect(cleaned).not.toMatch(/safer scene action/i);
    expect(cleaned).not.toMatch(/if none is present/i);
    expect(cleaned).not.toMatch(/before committing/i);
    expect(cleaned).not.toMatch(/you state/i);
    expect(scrubSaferSceneMeta(CANNED_SAFER_SCENE_LINE)).not.toMatch(/safer scene/i);
    expect(scrubFalseSpokenAction('"Wait." you state calmly.', 'I run away')).not.toMatch(/you state/i);
  });

  it('plates bind standing + mosaic from committed prose, not a fallen-hook card', () => {
    const story =
      'You stand on a circular mosaic of cracked stone. Jagged cracks spiderweb across the ancient tiles beneath your feet.';
    const prompt = pinOpeningHereScene({
      storyText: story,
      location: 'The Sevenfold Circle',
      pickedHook: 'You are on your back in the seven-ring circle.',
      sceneFacts: { props: ['circular mosaic'], present: ['handlers'] },
    });
    expect(prompt).toMatch(/STANCE:.*standing/i);
    expect(prompt).toMatch(/mosaic/i);
    expect(prompt).not.toMatch(/The viewpoint character is lying on the floor/i);

    const later = synthesizeMemorablePrompt({
      beat: 'legendary',
      storyText: story,
      location: 'The Sevenfold Circle',
      sceneFacts: { props: ['circular mosaic'], present: ['handlers'] },
    });
    expect(later).toMatch(/SCENE AUTHORITY/i);
    expect(later).toMatch(/standing/i);

    const spec = buildDeterministicOnePanel({
      state: quietState({ currentLocation: 'The Sevenfold Circle' }),
      storyText: story,
      playerAction: 'Look around',
    });
    expect(spec.panel.imagePrompt).toMatch(/SCENE AUTHORITY/i);
    expect(spec.panel.imagePrompt).toMatch(/standing/i);
    expect(formatSceneArtLock({ storyText: story, location: 'here' })).toMatch(/FLOOR:.*mosaic/i);
  });
});
