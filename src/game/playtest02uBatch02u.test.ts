/**
 * Batch 02u — nobody-inflection salad from 02t T30 (LitRPG s43 + RPG s43).
 * Mid writer OFF. No live GM call.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { isTokenSaladLeak } from './beatCommitGate';
import { applyProseWarden } from './proseWarden';
import {
  isNobodyInflectionSalad,
  scrubNobodyInflection,
} from './slotGlue';

const LITRPG_T2 =
  'crates of salted fish and strange metal scrap stacked between no oneed tables.';
const RPG_T23 = 'The no ones are thinner at this hour, evening settling in with the damp.';
const RPG_T24 = 'no oneked over worth selling tonight.';

describe('Batch 02u stamps', () => {
  it('HUD and BUILD are 2026-09-02u and Mid writer stays OFF', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-09-02u');
    expect(BUILD_STAMP).toBe('2026-09-02u');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });
});

describe('Batch 02u — nobody inflection salad', () => {
  it('rejects no oneed / no ones / no oneked, keeps legal no one else', () => {
    expect(isNobodyInflectionSalad(LITRPG_T2)).toBe(true);
    expect(isNobodyInflectionSalad(RPG_T23)).toBe(true);
    expect(isNobodyInflectionSalad(RPG_T24)).toBe(true);
    expect(isTokenSaladLeak(LITRPG_T2)).toBe(true);
    expect(isTokenSaladLeak(RPG_T23)).toBe(true);
    expect(isTokenSaladLeak('no one else at the gate seems to have noticed.')).toBe(false);
    expect(isNobodyInflectionSalad('no one else at the gate seems to have noticed.')).toBe(false);
  });

  it('rewrites inflection salad and leaves legal no-one prose', () => {
    const tables = scrubNobodyInflection(LITRPG_T2);
    expect(tables).not.toMatch(/no oneed/i);
    expect(tables).toMatch(/empty tables/);
    const lanes = scrubNobodyInflection(RPG_T23);
    expect(lanes).not.toMatch(/no ones/i);
    expect(lanes).toMatch(/lanes are thinner/);
    const legal = 'The watch-bell rings twice above you; no one else at the gate seems to have noticed.';
    expect(applyProseWarden(legal)).toMatch(/no one else/);
    expect(applyProseWarden(LITRPG_T2)).not.toMatch(/no oneed/i);
  });
});
