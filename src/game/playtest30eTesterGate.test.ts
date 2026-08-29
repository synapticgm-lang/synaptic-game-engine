/**
 * playtest30e — Google-only play + silent tester cohort.
 * Testers: unlimited Free text, no hosted art, no Test Lab UI.
 * Founders: Test Lab still unlocks Mid/High + art when their email is marked.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { allowsImageGeneration } from './comicImagePrompt';
import { canSpend, canSpendComicKleinUnit, memorablePlatesAvailable } from './capacityLedger';
import { createDefaultSettings } from './defaults';
import { BUILD_STAMP } from './runManifest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import {
  __resetPlayAccountForTests,
  canShowTestLabUi,
  effectiveWriterTier,
  hasUnlimitedTextCapacity,
  hostedImagesAllowed,
  isTesterCohort,
  markTestAccountEmail,
  setPlayAccountContext,
  setServerPlayAccess,
  setTestLabEnabled,
} from './testLab';

function installMemoryStorage(): void {
  const store = new Map<string, string>();
  const memory = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  };
  Object.defineProperty(globalThis, 'localStorage', { value: memory, configurable: true });
}

function signedInTester(): void {
  setPlayAccountContext({
    signedIn: true,
    email: 'tester@example.com',
    userId: 'user-tester',
  });
}

function signedInFounder(): void {
  markTestAccountEmail('founder@example.com');
  setTestLabEnabled(true);
  setPlayAccountContext({
    signedIn: true,
    email: 'founder@example.com',
    userId: 'user-founder',
  });
}

describe('playtest30e — tester gate', () => {
  beforeEach(() => {
    installMemoryStorage();
    __resetPlayAccountForTests();
  });

  afterEach(() => {
    __resetPlayAccountForTests();
  });

  it('stamp advanced; Mid writer stays OFF', () => {
    expect(BUILD_STAMP >= '2026-08-30e').toBe(true);
    expect(HUD_BUILD_STAMP.startsWith('2026-08-30')).toBe(true);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('signed-in unmarked Google users are testers: unlimited Free text, no art', () => {
    signedInTester();
    expect(isTesterCohort()).toBe(true);
    expect(hasUnlimitedTextCapacity()).toBe(true);
    expect(effectiveWriterTier('high')).toBe('free');
    expect(hostedImagesAllowed()).toBe(false);
    expect(canSpend('text')).toBe(true);
    expect(canSpend('memorable')).toBe(false);
    expect(memorablePlatesAvailable()).toBe(false);
    expect(canSpendComicKleinUnit()).toBe(false);
    expect(allowsImageGeneration(createDefaultSettings(), 'milestone-illustration')).toBe(false);
    expect(allowsImageGeneration(createDefaultSettings(), 'character-portrait')).toBe(false);
    expect(canShowTestLabUi({ email: 'tester@example.com' })).toBe(import.meta.env.DEV);
  });

  it('flipping localStorage Test Lab does not promote a tester to Mid or art', () => {
    signedInTester();
    setTestLabEnabled(true);
    expect(isTesterCohort()).toBe(true);
    expect(effectiveWriterTier('high')).toBe('free');
    expect(hostedImagesAllowed()).toBe(false);
  });

  it('marked founder with Test Lab keeps Mid writer and art', () => {
    signedInFounder();
    expect(isTesterCohort()).toBe(false);
    expect(hasUnlimitedTextCapacity()).toBe(true);
    expect(effectiveWriterTier('high')).toBe('free');
    localStorage.setItem(
      'synapticgm-test-lab',
      JSON.stringify({
        enabled: true,
        aiPreviewTier: 'high',
        markedEmails: ['founder@example.com'],
      })
    );
    expect(effectiveWriterTier('free')).toBe('high');
    expect(hostedImagesAllowed()).toBe(true);
    expect(canSpend('memorable')).toBe(true);
  });

  it('signed-out account is not a tester and cannot spend unlimited text', () => {
    __resetPlayAccountForTests();
    expect(isTesterCohort()).toBe(false);
    expect(hasUnlimitedTextCapacity()).toBe(false);
  });

  it('server play_access staff/admin leaves tester cohort; tester stays in', () => {
    signedInTester();
    setServerPlayAccess('staff');
    expect(isTesterCohort()).toBe(false);
    expect(hostedImagesAllowed()).toBe(true);
    setServerPlayAccess('tester');
    expect(isTesterCohort()).toBe(true);
    expect(hostedImagesAllowed()).toBe(false);
  });
});
