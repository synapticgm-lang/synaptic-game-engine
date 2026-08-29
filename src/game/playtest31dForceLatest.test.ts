/**
 * Force-latest client gate + 30S save leftover chrome strip on Continue.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { applySaveRepair } from './saveMigration';
import { CURRENT_ERROR_REPAIR_REVISION } from './errorRepairWarden';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { HUD_BUILD_STAMP } from '../components/Hud';
import {
  compareStamps,
  parseDeployedPayload,
  parseDeployedStampFromHtml,
  shouldReload,
  shouldReloadClient,
  UPDATING_COPY,
} from './forceLatest';

describe('playtest31d — force-latest + 30S chrome leftover', () => {
  it('stamp is 2026-08-31d / 30w and Mid writer stays OFF', () => {
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(BUILD_STAMP >= '2026-08-30w').toBe(true);
    expect(HUD_BUILD_STAMP >= '2026-08-31d').toBe(true);
  });

  it('older stamp → shouldReload; same or newer does not', () => {
    expect(shouldReload('2026-08-30S', '2026-08-31d')).toBe(true);
    expect(shouldReload('2026-08-31c', '2026-08-31d')).toBe(true);
    expect(shouldReload('2026-08-31d', '2026-08-31d')).toBe(false);
    expect(shouldReload('2026-08-31d', '2026-08-31c')).toBe(false);
    expect(shouldReload('', '2026-08-31d')).toBe(false);
    expect(compareStamps('2026-08-30S', '2026-08-30v')).toBeLessThan(0);
  });

  it('reloads when HUD or BUILD is behind the deployed page', () => {
    expect(
      shouldReloadClient({
        runningHud: '2026-08-30S',
        runningBuild: '2026-08-30l',
        deployedHud: '2026-08-31d',
        deployedBuild: '2026-08-30w',
      })
    ).toBe(true);
    expect(
      shouldReloadClient({
        runningHud: '2026-08-31d',
        runningBuild: '2026-08-30w',
        deployedHud: '2026-08-31d',
        deployedBuild: '2026-08-30w',
      })
    ).toBe(false);
    expect(
      shouldReloadClient({
        runningHud: '2026-08-31d',
        runningBuild: '2026-08-30v',
        deployedHud: '2026-08-31d',
        deployedBuild: '2026-08-30w',
      })
    ).toBe(true);
  });

  it('reads sgm-build meta and version.json; copy is not test-mode', () => {
    expect(UPDATING_COPY).toBe('Updating to the latest game…');
    expect(UPDATING_COPY.toLowerCase()).not.toMatch(/test mode/);
    expect(
      parseDeployedStampFromHtml('<meta name="sgm-build" content="2026-08-31d" />')
    ).toBe('2026-08-31d');
    expect(parseDeployedPayload('{"hud":"2026-08-31d","build":"2026-08-30w"}')).toEqual({
      hud: '2026-08-31d',
      build: '2026-08-30w',
    });
    expect(
      parseDeployedPayload('<html><meta name="sgm-build" content="2026-08-31d"></html>')
    ).toEqual({ hud: '2026-08-31d' });
  });

  it('applySaveRepair strips Place / blue panel from an old 30S present[] and keeps the story', () => {
    const base = createInitialState('The Summoned Pact', 'litrpg');
    const story = 'The mosaic is wet. Josie demanded to go home.';
    const old = {
      ...base,
      saveRepairRevision: 2,
      errorRepairRevision: 0,
      turn: 6,
      log: [{ id: 'g1', turn: 5, role: 'gm' as const, content: story, timestamp: 1 }],
      sceneFacts: {
        crowd: 'present' as const,
        noise: 'voices' as const,
        present: ['Place', 'blue panel', 'Mira'],
        props: [],
        lastBeat: story,
        updatedTurn: 5,
      },
      openingEstablishment: {
        pending: [],
        answers: {},
        complete: true,
        pinnedNpcNames: ['Place', 'Mira'],
      },
    };
    const repaired = applySaveRepair(old);
    expect(repaired.dirty).toBe(true);
    expect(repaired.state.sceneFacts?.present).not.toContain('Place');
    expect(repaired.state.sceneFacts?.present).not.toContain('blue panel');
    expect(repaired.state.sceneFacts?.present.some((p) => /mira/i.test(p))).toBe(true);
    expect(repaired.state.openingEstablishment?.pinnedNpcNames).not.toContain('Place');
    expect(repaired.state.log.some((e) => e.content === story)).toBe(true);
    expect(repaired.notes.join(' ')).toMatch(/ERR_CHROME_PRESENT/);
    expect(repaired.state.errorRepairRevision).toBe(CURRENT_ERROR_REPAIR_REVISION);
    expect(CURRENT_ERROR_REPAIR_REVISION).toBeGreaterThanOrEqual(4);
  });
});
