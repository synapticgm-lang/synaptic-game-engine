/**
 * Batch 02g — surgical P0s from 02f Gemini + readability gates.
 * P0-1: Leave / Walk away must not prepend mill-landing arrivals.
 * P0-2: Thornferry cluster aliases are not a location change.
 * P0-3: Pact-Hunter Skirmisher is not a pulled weapon / CAST object.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { detectHubRoleMadlib, isChoicePadPersonToken } from './chromeAuthority';
import { ensureTravelArrivalProse, isThornferryCluster } from './outdoorHubs';
import { scrubEntityMadLibs, scrubFalseArrivalWhenHere } from './proseWarden';
import { enforceCameraOnProse, playerCommittedArrivalTravel } from './travelAuthority';
import type { GameState } from './types';

describe('Batch 02g stamps', () => {
  it('HUD and BUILD are at least 2026-09-02g', () => {
    expect(HUD_BUILD_STAMP >= '2026-09-02g').toBe(true);
    expect(BUILD_STAMP >= '2026-09-02g').toBe(true);
  });
});

describe('Batch 02g — P0-1: leave/exit is not an arrival', () => {
  it('does not treat Leave / Walk away as arrival travel', () => {
    expect(playerCommittedArrivalTravel('Leave through the nearest exit')).toBe(false);
    expect(playerCommittedArrivalTravel('Walk away with consequence')).toBe(false);
    expect(playerCommittedArrivalTravel('Travel toward Lowmarket')).toBe(true);
  });

  it('enforceCameraOnProse does not prepend mill-landing on Leave', () => {
    const state = {
      currentLocation: 'mill landing at Thornferry',
      previousLocationSheet: { name: 'Thornferry Road' },
      sceneFacts: { cameraLock: { scale: 'outdoor', label: 'mill landing at Thornferry', lockedTurn: 1 } },
    } as unknown as GameState;
    const body = 'The road out of Thornferry takes you between tall hedgerows.';
    const next = enforceCameraOnProse(body, state, 'Leave through the nearest exit');
    expect(next).not.toMatch(/You reach the mill landing/i);
    expect(next).toContain('hedgerows');
  });

  it('ensureTravelArrivalProse skips mill dest with empty from', () => {
    expect(ensureTravelArrivalProse('Silas waits by the water.', 'mill landing at Thornferry', '')).toBe(
      'Silas waits by the water.'
    );
  });

  it('ensureTravelArrivalProse skips when body already leaves the landing', () => {
    const body = 'You set out along the muddy track, the mill landing already shrinking behind you.';
    expect(ensureTravelArrivalProse(body, 'mill landing at Thornferry', 'chapel')).not.toMatch(
      /You reach the mill landing/i
    );
  });
});

describe('Batch 02g — P0-2: Thornferry cluster lock', () => {
  it('treats mill / ford / Thornferry as one cluster', () => {
    expect(isThornferryCluster('mill landing at Thornferry')).toBe(true);
    expect(isThornferryCluster('the ford')).toBe(true);
    expect(isThornferryCluster('West Wall')).toBe(false);
  });

  it('strips mill-landing arrival when prior is a cluster alias', () => {
    const input = 'You reach the mill landing at Thornferry. The rain has thinned to a drizzle.';
    const result = scrubFalseArrivalWhenHere(
      input,
      'mill landing at Thornferry',
      [],
      false,
      'Thornferry Road'
    );
    expect(result).not.toContain('You reach the mill landing');
    expect(result).toMatch(/rain has thinned/i);
  });

  it('still allows a real arrival from West Wall', () => {
    const input = 'You leave the West Wall behind and reach the mill landing at Thornferry.';
    const result = scrubFalseArrivalWhenHere(
      input,
      'mill landing at Thornferry',
      [],
      false,
      'West Wall'
    );
    expect(result).toContain('reach the mill landing');
  });
});

describe('Batch 02g — P0-3: Pact-Hunter is not a weapon', () => {
  it('rewrites pull/draw Pact-Hunter Skirmisher as a blade', () => {
    const input = 'You pull Pact-Hunter Skirmisher, the blade hissing past your shirt.';
    const cleaned = scrubEntityMadLibs(input);
    expect(cleaned).not.toMatch(/pull Pact-Hunter/i);
    expect(cleaned).toMatch(/draw your blade/i);
    expect(detectHubRoleMadlib(input)).toBe(true);
  });

  it('strips Pact-Hunter sentence-starter tics and the Easy pad token', () => {
    const tic = scrubEntityMadLibs('Pact-Hunter Skirmisher, the street splits.');
    expect(tic).not.toMatch(/Pact-Hunter Skirmisher,/);
    expect(tic).toMatch(/the street splits/i);
    const easy = scrubEntityMadLibs('Check the Easy. If it\'s the second one, we don\'t need the purse.');
    expect(easy).not.toMatch(/\bthe Easy\b/);
    expect(easy).toMatch(/the stall/);
    expect(isChoicePadPersonToken('Easy')).toBe(true);
  });
});
