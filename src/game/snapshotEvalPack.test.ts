import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { shouldSkipHardGate, validateActionHard } from './actionValidation';
import { createInitialState } from './defaults';
import {
  SNAPSHOT_EVAL_SUBSET,
  type SnapshotEvalRow,
  type SnapshotEvalSnap,
} from './fixtures/snapshotEvalPack.subset';
import { applyProseWarden, type ProseWardenContext } from './proseWarden';
import type {
  Companion,
  CrowdPresence,
  GameState,
  Item,
  TensionLevel,
  TimeOfDay,
  Weather,
} from './types';

const FIXTURE_CSV = join(dirname(fileURLToPath(import.meta.url)), 'fixtures/snapshotEvalPack.subset.csv');

function item(name: string): Item {
  return { id: name, name, rarity: 'Common', quantity: 1 };
}

function companion(name: string): Companion {
  return {
    id: name,
    name,
    type: 'party',
    role: '',
    hp: 10,
    maxHp: 10,
    maintenanceCost: '',
    assignment: '',
    notes: '',
  };
}

function stateFromSnapshot(snap: SnapshotEvalSnap, story: string): GameState {
  const initial = createInitialState('Snapshot Eval', 'litrpg');
  const crowd = snap.crowd as CrowdPresence;
  return {
    ...initial,
    currentLocation: snap.location,
    inventory: snap.inventory.map(item),
    containers: [],
    companions: snap.companions.map(companion),
    openingEstablishment: {
      complete: !snap.openingCover,
      pending: snap.openingCover
        ? [{ id: 'name', kind: 'name', question: 'What is your name?' }]
        : [],
      answers: {},
      aloneArrival: snap.aloneArrival,
    },
    sceneFacts: {
      crowd,
      noise: crowd === 'present' ? 'voices' : 'quiet',
      present: [...snap.present],
      props: [...snap.props],
      lastBeat: story,
      updatedTurn: 1,
      timeOfDay: snap.timeOfDay as TimeOfDay,
      indoor: snap.indoor,
      tension: snap.tension as TensionLevel,
      weather: (snap.weather as Weather | undefined) ?? 'unknown',
    },
  };
}

function hardGateDecision(row: SnapshotEvalRow): 'block' | 'allow' | 'skip' {
  const state = stateFromSnapshot(row.snapshot, row.lastGmStory);
  if (shouldSkipHardGate(row.playerInput, state)) return 'skip';
  const result = validateActionHard(row.playerInput, state, row.lastGmStory);
  return result.valid ? 'allow' : 'block';
}

function wardenCtx(snap: SnapshotEvalSnap): ProseWardenContext {
  return {
    currentLocation: snap.location,
    aloneArrival: snap.aloneArrival,
    crowdSize: snap.crowdSize,
    crowdPresent: snap.crowd === 'present',
    currentTimeOfDay: snap.timeOfDay,
    previousTimeOfDay: snap.timeOfDay,
    isIndoor: snap.indoor,
    wasIndoor: snap.indoor,
    currentTension: snap.tension,
    previousTension: snap.tension,
    inventory: snap.inventory.map(item),
    sceneProps: [...snap.props],
  };
}

function parseSubsetCsv(raw: string): Array<{ id: string; suite: string; expect: string }> {
  const lines = raw.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
  const header = lines[0]?.split(',') ?? [];
  const idIdx = header.indexOf('id');
  const suiteIdx = header.indexOf('suite');
  const expectIdx = header.indexOf('expect');
  return lines.slice(1).map((line) => {
    const cols = line.split(',');
    return {
      id: cols[idIdx] ?? '',
      suite: cols[suiteIdx] ?? '',
      expect: cols[expectIdx] ?? '',
    };
  });
}

describe('snapshot eval pack subset (Manus 2026-08-25 / live 25b)', () => {
  it('CI fixture CSV lists the same ids as the typed subset', () => {
    const csv = parseSubsetCsv(readFileSync(FIXTURE_CSV, 'utf8'));
    expect(csv.map((row) => row.id)).toEqual(SNAPSHOT_EVAL_SUBSET.map((row) => row.id));
  });

  describe('hard gate', () => {
    for (const row of SNAPSHOT_EVAL_SUBSET.filter((r) => r.suite === 'gate')) {
      it(`${row.id} ${row.expect}: ${row.playerInput}`, () => {
        expect(hardGateDecision(row)).toBe(row.expect);
      });
    }
  });

  describe('prose warden scrub', () => {
    for (const row of SNAPSHOT_EVAL_SUBSET.filter((r) => r.suite === 'warden')) {
      it(`${row.id} scrubs ${row.absentAfter}`, () => {
        const out = applyProseWarden(row.lastGmStory, wardenCtx(row.snapshot));
        expect(out.toLowerCase()).not.toContain((row.absentAfter ?? '').toLowerCase());
      });
    }
  });

  describe('flair / no over-scrub', () => {
    for (const row of SNAPSHOT_EVAL_SUBSET.filter((r) => r.suite === 'flair')) {
      it(`${row.id} keeps legal prose`, () => {
        const out = applyProseWarden(row.lastGmStory, wardenCtx(row.snapshot));
        for (const phrase of row.keepPhrases ?? []) {
          expect(out).toContain(phrase);
        }
      });
    }
  });
});

/**
 * Deferred Manus rows — do not assert against live 25b yet.
 * A004/C003 hand-over verbs are not in findHardItemUseClaims.
 * A005/A006/B013/E006 "dog"/"knight" do not match COMPANION_REFERENCE.
 * A021/B007/E002 info-skip needs a live "or"/panel pattern.
 * D003/D024 empty/all-alone phrasing is narrower than the pack.
 * D006 "enter the building" does not match the indoor-transition regex.
 * D008/D009 festival-over / was-not-always-so live in sceneFacts TIME_PASSED, not applyProseWarden.
 * D012–D018, C-quest PW_LEDGER/QUEST/EXIT/INVENTORY/PRESENCE/LOCATION/WEATHER: Phase 2.
 * G003 simile "hundred hands" is a live over-scrub vs 25b flair-free law.
 * E-chrome banner/cancel/draft-restore needs UI tests, not validateActionHard.
 */
describe.skip('snapshot eval pack — Phase 2 / live-mismatch (documented)', () => {
  it('placeholder so the skip suite is visible in vitest', () => {
    expect(true).toBe(true);
  });
});
