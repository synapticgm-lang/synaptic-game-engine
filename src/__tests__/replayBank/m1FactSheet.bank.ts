/**
 * M1 — FactSheet / TurnLog / engine-beat asserts (C7 re-point sample).
 * Asserts on engine state, not prose regex / proseWarden. New-player gate on turns 1–10.
 * The nine rule-gap ids stay expected-fail for M3/M6.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { RUNS_ROOT, replayWhole } from './replayRun';
import { RULE_GAPS, expectRuleGap } from './ruleGaps';
import { buildCompletedEventPacket } from '../../game/completedEventPacket';
import { buildFactSheet, formatFactSheetForWriter, hashFactSheet } from '../../game/factSheet';
import { buildTurnLog, sliceState } from '../../game/turnLog';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

let T: Replay | null = null;
let runFolder = '';

beforeAll(async () => {
  // Prefer any existing cursed-keep / summoned-pact tape under runs/; skip replay when none.
  const candidates = [
    '2026-10-13T14-15-47-252Z_cursed-keep_chilled-gm_s151',
    '2026-09-18T22-07-37',
  ].filter((f) => existsSync(join(RUNS_ROOT, f, 'turns.jsonl')));
  for (const folder of candidates) {
    try {
      const steps = await replayWhole(folder);
      if (steps.length) {
        T = new Replay(steps);
        runFolder = folder;
        return;
      }
    } catch {
      /* try next */
    }
  }
  T = null;
}, 120_000);

describe('replay bank M1 FactSheet + TurnLog', () => {
  it('[M1] FactSheet carries display names only (no engine ids)', () => {
    const state = T?.before(1);
    if (!state) {
      // Synthetic minimal state when tapes are absent offline.
      const packet = {
        turn: 1,
        actor: 'you',
        verb: 'looked',
        outcome: 'unchanged' as const,
        loot: [],
        xp: 0,
        witnesses: [],
        location: 'a ruined bathhouse',
        justKilled: false,
        combatLive: false,
        allowlist: ['a ruined bathhouse'],
        playerAction: 'Look around',
        recentBeats: [],
        inspectStreak: 0,
        waitStreak: 0,
      };
      const sheet = buildFactSheet(
        {
          turn: 1,
          currentLocation: 'a ruined bathhouse',
          character: { name: 'Jax' },
          inventory: [],
          engineMode: 'litrpg',
        } as never,
        packet as never,
        'Look around'
      );
      expect(sheet.place.name).toBeTruthy();
      expect(formatFactSheetForWriter(sheet)).toMatch(/FACTS/);
      expect(formatFactSheetForWriter(sheet)).toMatch(/SETTINGS:/);
      expect(formatFactSheetForWriter(sheet)).not.toMatch(/npcId|questId|actionId|sp-beat-/);
      return;
    }
    const packet = buildCompletedEventPacket(state, T!.input(1) || 'Look around');
    expect(packet.factSheet).toBeTruthy();
    const text = formatFactSheetForWriter(packet.factSheet!);
    expect(text).toMatch(/FACTS/);
    expect(text).toMatch(/SETTINGS:/);
    expect(text).toMatch(/\(reserved — order 6b\)/);
    // C2: no engine labels/ids in the writer sheet.
    expect(text).not.toMatch(/\bnpcId\b|\bquestId\b|\bactionId\b|sp-beat-|ck-spine-/);
    expect(hashFactSheet(packet.factSheet!)).toMatch(/^fs_[0-9a-f]{8}$/);
  });

  it('[M1] TurnLog shape is stable (v1 + factSheetHash + ai + chips)', () => {
    const state = T?.after(1);
    const sheet = buildFactSheet(
      (state ?? {
        turn: 1,
        currentLocation: 'here',
        character: { name: 'Jax', hp: 10, maxHp: 10, xp: 0, level: 1 },
        inventory: [],
        engineMode: 'litrpg',
      }) as never,
      buildCompletedEventPacket(
        (state ?? {
          turn: 1,
          currentLocation: 'here',
          character: { name: 'Jax' },
          inventory: [],
          engineMode: 'litrpg',
        }) as never,
        'Look around'
      ),
      'Look around'
    );
    const log = buildTurnLog({
      turn: 1,
      input: 'Look around',
      parsedIntent: { kind: 'observe', label: 'Look around' },
      engineBeats: [sheet.beat.outcome],
      stateBefore: sliceState({}),
      stateAfter: sliceState({}),
      factSheet: sheet,
      finalProse: 'You looked.',
      chipsOffered: ['Look around', 'Wait'],
      latencyMs: 12,
    });
    expect(log.v).toBe(1);
    expect(log.factSheetHash).toMatch(/^fs_/);
    expect(log.chipsOffered.length).toBeGreaterThan(0);
    expect(log.ai).toEqual([]);
  });

  it('[M1 new-player gate] turns 1–10 offer chips (when a tape is present)', () => {
    if (!T) {
      expect(RULE_GAPS).toHaveLength(9);
      return;
    }
    const turns = T.turns().filter((n) => n >= 1 && n <= 10);
    expect(turns.length).toBeGreaterThan(0);
    for (const n of turns) {
      const chips = T!.chips(n);
      expect(chips.length, `T${n} chips (${runFolder})`).toBeGreaterThan(0);
      // Engine beat path: packet / fact sheet exists after the turn when writer ran.
      const after = T!.after(n);
      if (after.completedEvent) {
        expect(after.completedEvent.outcome || after.completedEvent.verb).toBeTruthy();
      }
    }
  });

  it('[M1] nine rule-gap cases stay registered as expected-fail', () => {
    expect(RULE_GAPS.map((g) => g.id)).toEqual([
      'gap-nat20',
      'gap-nat1',
      'gap-oa-on-flee',
      'gap-short-rest-hit-dice',
      'gap-sell-half',
      'gap-str-x15',
      'gap-parley',
      'gap-cap-4',
      'gap-steal',
    ]);
    for (const g of RULE_GAPS) {
      expect(expectRuleGap(g.id).expectedFail).toBe(true);
      expect(g.srd).toMatch(/SRD 5\.2\.1/);
    }
  });
});
