/**
 * q38-G1b — TT-G1 validator + tabletop data pass (OPT-4).
 * Acceptance from acceptance-tests-new-orders.md (G1-1, OPT4-1).
 * LitRPG/RPG bible fill is q42-OPT4m; this file asserts the validator runs on those modes.
 */
import { describe, expect, it } from 'vitest';
import { ALL_CAMPAIGN_BIBLES, cursedKeep } from '@/data/campaigns';
import {
  TABLETOP_MAIN_SPINES,
  tabletopSpineToStarterQuest,
} from '@/data/quests/tabletopMainSpines';
import {
  validateModeQuestData,
  validateQuestStepRoutes,
  withTabletopQuestRoutes,
} from './questRoutes';
import type { QuestObjective } from './types';

describe('q38-G1b TT-G1 validator + tabletop data (OPT-4)', () => {
  it('G1-1: the validator fails a quest node with fewer than three routes', () => {
    const thin: QuestObjective = {
      id: 'thin',
      description: 'Find the key',
      completed: false,
      routes: [{ id: 'a', kind: 'person', label: 'Ask the clerk' }],
    };
    expect(validateQuestStepRoutes(thin, 'dnd').some((e) => /fewer than 3/.test(e))).toBe(true);
  });

  it('OPT4-1: validator fails thin steps in tabletop, LitRPG and RPG data; PYOA not read', () => {
    const thinSeed = {
      id: 'thin-q',
      title: 'Thin',
      objectives: ['Find it'],
      objectiveAnchors: [{ routes: [{ id: 'a', kind: 'person' as const, label: 'Ask' }] }],
    };
    expect(validateModeQuestData('dnd', [{ id: 'fixture', engineMode: 'dnd', starterQuests: [thinSeed] }]).length).toBeGreaterThan(
      0,
    );
    expect(
      validateModeQuestData('litrpg', [{ id: 'fixture', engineMode: 'litrpg', starterQuests: [thinSeed] }]).length,
    ).toBeGreaterThan(0);
    expect(validateModeQuestData('rpg', [{ id: 'fixture', engineMode: 'rpg', starterQuests: [thinSeed] }]).length).toBeGreaterThan(
      0,
    );
    expect(validateModeQuestData('pyoa', ALL_CAMPAIGN_BIBLES)).toEqual([]);
    // Never walk PYOA bible ids when validating other modes.
    const pyoaIds = new Set(ALL_CAMPAIGN_BIBLES.filter((b) => b.engineMode === 'pyoa').map((b) => b.id));
    const dndErrs = validateModeQuestData(
      'dnd',
      ALL_CAMPAIGN_BIBLES.filter((b) => b.engineMode === 'dnd'),
    );
    for (const e of dndErrs) {
      const bibleId = e.split('/')[0]!;
      expect(pyoaIds.has(bibleId)).toBe(false);
    }
  });

  it('OPT4-1 / G1b: cursed-keep and all tabletop play data pass (≥3 routes per step)', () => {
    const ck = ALL_CAMPAIGN_BIBLES.find((b) => b.id === 'cursed-keep')!;
    expect(ck).toBeTruthy();
    expect(validateModeQuestData('dnd', [ck])).toEqual([]);

    // Hand-authored RAW cursed-keep also carries routes before enrich.
    const rawCk = withTabletopQuestRoutes(cursedKeep.starterQuests[0]!);
    expect(rawCk.objectiveAnchors?.every((a) => (a?.routes?.length ?? 0) >= 3)).toBe(true);

    const tabletop = ALL_CAMPAIGN_BIBLES.filter((b) => b.engineMode === 'dnd');
    expect(validateModeQuestData('dnd', tabletop)).toEqual([]);

    const spineSeeds = TABLETOP_MAIN_SPINES.map((s) => tabletopSpineToStarterQuest(s));
    expect(validateModeQuestData('dnd', [], spineSeeds)).toEqual([]);
  });

  it('G1b: LitRPG and RPG data still fail until q42-OPT4m (validator runs; PYOA skipped)', () => {
    const litrpg = ALL_CAMPAIGN_BIBLES.filter((b) => b.engineMode === 'litrpg');
    const rpg = ALL_CAMPAIGN_BIBLES.filter((b) => b.engineMode === 'rpg');
    expect(litrpg.length).toBeGreaterThan(0);
    expect(rpg.length).toBeGreaterThan(0);
    expect(validateModeQuestData('litrpg', litrpg).length).toBeGreaterThan(0);
    expect(validateModeQuestData('rpg', rpg).length).toBeGreaterThan(0);
    expect(validateModeQuestData('pyoa', ALL_CAMPAIGN_BIBLES.filter((b) => b.engineMode === 'pyoa'))).toEqual([]);
  });
});
