/**
 * RC-VR1 part VR1-b — silent rollers write CheckResultRecord; hand-built result strings cut.
 * Tabletop only. SRD 5.2.1 (Wizards of the Coast, CC BY 4.0): ability checks / saves / contests
 * when the outcome is uncertain; Travel Terrain and Forced March CON saves as written.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { resolveCheckRecord } from './checkRules';
import { formatBreakAwayStatus, formatPreRollLine, formatResultLine, isVr1RollLine, outcomeFactFromRecord } from './rules/rollView';
import { explorationCheckSpec } from './rules/exploration';
import { filterSystemLogForEngine } from './systemLog';
import { resolveLedgerFlee, resolveLedgerCombat } from './ledgerCombat';
import { resolveLedgerTrap, formatTrapReceipt } from './ledgerTrap';
import { runPlayerCheck, type CheckSpec } from './checkMath';
import { formatCheckRecord } from './checkRules';
import { srdBreakAwayCheck } from './engineFight';
import type { GameState, ActiveEncounter } from './types';
import type { PlayerIntent } from './intentParser';
import { TRAVEL_JOB } from './rules/travelDay';
import type { ActiveDungeonState } from './mapEngine';

function ttState(extra?: Partial<GameState>): GameState {
  const s = createInitialState('Ria', 'dnd');
  return {
    ...s,
    campaignBibleId: 'cursed-keep',
    character: {
      ...s.character,
      attributes: { STR: 14, DEX: 12, CON: 14, INT: 12, WIS: 12, CHA: 12 },
      hp: 20,
    },
    ...extra,
  } as GameState;
}

describe('VR1-b CheckResultRecord rollers', () => {
  it('VR1-7 navigation / search / forage STATUS use formatCheckRecord from the record', () => {
    for (const job of ['guide', 'lookout', 'forager'] as const) {
      const rule = TRAVEL_JOB[job];
      const rec = resolveCheckRecord({
        label: rule.label,
        mods: [{ label: 'WIS', value: 1 }],
        dc: 15,
        d20s: [13],
      });
      const spec: CheckSpec = { kind: 'skill', ability: 'WIS', skill: rule.skill, dc: 15, dcShown: false, adv: 'normal' };
      rec.spec = spec;
      // VR1-5 shared maths line (no job label); STATUS uses formatCheckRecord so the job name stays on the receipt.
      const maths = formatResultLine(rec);
      expect(maths).toBe('d20 13 + 1 (WIS) = 14 vs DC 15 — failure');
      expect(maths).not.toMatch(/Navigation:|Look-out:|Foraging:/);
      const status = formatCheckRecord(rec, 'dnd');
      expect(status.startsWith(rule.label)).toBe(true);
      expect(isVr1RollLine(status)).toBe(true);
      expect(isVr1RollLine(formatPreRollLine(spec))).toBe(false);
      expect(outcomeFactFromRecord(rec)).toBe('Check failure.');
      expect(filterSystemLogForEngine([status], 'dnd')).toContain(status);
    }
  });

  it('VR1-7 exhaustion CON save record shows pre-roll (dcShown) and result', () => {
    const rec = resolveCheckRecord({
      label: 'Extended Travel: Constitution save',
      mods: [{ label: 'CON save', value: 2 }],
      dc: 11,
      d20s: [8],
    });
    const spec: CheckSpec = { kind: 'save', ability: 'CON', dc: 11, dcShown: true, adv: 'normal' };
    rec.spec = spec;
    expect(formatPreRollLine(spec)).toBe('Constitution save (DC 11) — rolling a d20…');
    expect(formatResultLine(rec)).toBe('d20 8 + 2 (CON save) = 10 vs DC 11 — failure');
    expect(outcomeFactFromRecord(rec)).toBe('Check failure.');
  });

  it('VR1-7 flee contest STATUS is formatBreakAwayStatus from the CheckResultRecord', () => {
    const enc = { name: 'Goblin', level: 1, hp: 7, maxHp: 7 } as ActiveEncounter;
    const check = srdBreakAwayCheck(ttState(), enc, true, () => 0.5);
    expect(check.record).toBeDefined();
    expect(check.record.spec?.kind).toBe('contest');
    expect(check.line).toMatch(/^Flee check: d20 \d+ [+−] \d+ = \d+ vs Goblin d20 \d+ [+−] \d+ = \d+ — (?:success|failure)$/);
    expect(check.lines[0]).toBe(check.line);
    expect(check.lines.some((l) => l === outcomeFactFromRecord(check.record))).toBe(true);
    // Same helper the engine uses — record maths, not a second roll.
    expect(formatBreakAwayStatus('parley', check.record)).toMatch(/^Parley check: d20 /);
  });

  it('VR1-7 attack / flee ledger rounds carry the CheckResultRecord', () => {
    const intent = { kind: 'attack', label: 'Strike' } as unknown as PlayerIntent;
    const s = ttState({
      activeEncounter: {
        name: 'Bandit',
        level: 1,
        hp: 10,
        maxHp: 10,
        armorClass: 12,
        strength: 12,
        dexterity: 12,
        constitution: 12,
        xpReward: 25,
        goldReward: 0,
      },
    });
    const check = runPlayerCheck(s, intent, 'attack the bandit', 14);
    expect(check.record).toBeDefined();
    const combat = resolveLedgerCombat(s, check);
    expect(combat?.round.record).toBe(check.record);
    const fleeIntent = { kind: 'flee', label: 'Flee' } as unknown as PlayerIntent;
    const fleeCheck = runPlayerCheck(s, fleeIntent, 'flee', 18);
    const fled = resolveLedgerFlee(s, fleeCheck);
    expect(fled?.round.record).toBe(fleeCheck.record);
  });

  it('VR1-7 trap receipt uses formatResultLine from the record', () => {
    const dungeon = {
      blueprintId: 'test-dungeon',
      dungeonName: 'Trap Room',
      tier: 4 as const,
      dangerTier: 1 as const,
      currentZLevel: 0,
      currentNodeId: 'room-a',
      visitedNodeIds: ['room-a'],
      clearedNodeIds: [] as string[],
      nodes: [{
        id: 'room-a',
        name: 'Entry',
        description: 'A trapped room',
        connections: [] as [],
        hidden: {
          traps: [{ id: 't1', damage: 4, dc: 12, disarmed: false, revealed: false }],
          lootables: [],
          secrets: [],
          mobs: [],
          looseItems: [],
        },
      }],
    } as unknown as ActiveDungeonState;
    const s = ttState({ activeDungeon: dungeon });
    const intent = { kind: 'search', label: 'Disarm' } as unknown as PlayerIntent;
    const check = runPlayerCheck(s, intent, 'disarm the trap', 10);
    const resolved = resolveLedgerTrap(s, check, 't1');
    expect(resolved?.round.record).toBe(check.record);
    const receipt = formatTrapReceipt(resolved!.round);
    expect(receipt).toContain(formatResultLine(check.record!));
    expect(receipt).toContain(outcomeFactFromRecord(check.record!));
  });

  it('VR1-b explorationCheckSpec builds ladder DC CheckSpec for search', () => {
    const s = ttState();
    const spec = explorationCheckSpec(s, 'search', 'WIS', 'perception');
    expect(spec.kind).toBe('skill');
    expect(spec.ability).toBe('WIS');
    expect(spec.skill).toBe('perception');
    expect(spec.dc).toBeGreaterThanOrEqual(5);
    expect(spec.dcShown).toBe(false);
  });

  it('writer outcome fact is one line from the record', () => {
    const rec = resolveCheckRecord({
      label: 'Persuasion',
      mods: [{ label: 'CHA', value: 2 }],
      dc: 15,
      d20s: [18],
    });
    expect(outcomeFactFromRecord(rec)).toBe('Check success.');
  });
});
