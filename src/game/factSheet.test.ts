/**
 * M1 — FactSheet unit tests (offline, no AI).
 * SRD notes live on rule-gap cases; this file covers the sheet shape and C2 display-name rule.
 */
import { describe, expect, it } from 'vitest';
import { buildCompletedEventPacket, formatWriterFacingEvent } from './completedEventPacket';
import { buildFactSheet, formatFactSheetForWriter, hashFactSheet } from './factSheet';
import { buildTurnLog, diceRollsFromReceipts, sliceState } from './turnLog';
import type { GameState } from './types';

function baseState(over: Partial<GameState> = {}): GameState {
  return {
    turn: 3,
    currentLocation: 'Greyhollow Inn',
    engineMode: 'dnd',
    character: {
      name: 'Jax',
      hp: 10,
      maxHp: 12,
      xp: 0,
      level: 1,
      xpToNext: 300,
      gender: 'male',
      attributes: { STR: 15, DEX: 14, CON: 13, INT: 10, WIS: 12, CHA: 8 },
      conditions: [],
    },
    inventory: [
      { id: 'i1', name: 'Longsword', equipped: true, quantity: 1, itemType: 'weapon' },
      { id: 'i2', name: 'Torch', equipped: false, quantity: 1 },
    ],
    gold: 16,
    npcMemories: [
      {
        npcId: 'n1',
        npcName: 'Mira the Apothecary',
        disposition: 'friendly',
        stance: { now: 'warm', cause: 'helped with herbs', turn: 2, events: ['e1'] },
        sheet: { job: 'apothecary' },
        met: true,
        facts: ['Introduced in play T1'],
        said: [],
        completedTopics: [],
      },
    ],
    log: [],
    places: [],
    sceneFacts: { crowd: 'sparse', noise: 'unknown', present: ['Mira the Apothecary'], props: ['counter'] },
    commitments: [
      {
        promiseId: 'p1',
        kind: 'promise',
        to: 'Mira the Apothecary',
        description: 'Bring nightshade',
        status: 'open',
        madeTurn: 2,
        trustDeltaOnKeep: 1,
        trustDeltaOnBreak: -1,
        beneficiaries: ['Mira the Apothecary'],
        witnesses: [],
      },
    ],
    quests: [],
    ...over,
  } as GameState;
}

describe('M1 factSheet', () => {
  it('builds a sheet with place, present manner, open ledger, gear, beat, player slot, settings slot', () => {
    const state = baseState();
    const packet = buildCompletedEventPacket(state, 'Ask Mira about the herbs', {
      engineResult: 'Check success. Mira answers about the herbs.',
    });
    expect(packet.factSheet).toBeTruthy();
    const sheet = packet.factSheet!;
    expect(sheet.place.name).toMatch(/Greyhollow|Inn/i);
    expect(sheet.present.some((p) => p.name === 'Mira the Apothecary')).toBe(true);
    const mira = sheet.present.find((p) => p.name === 'Mira the Apothecary')!;
    expect(mira.manner).toBe('warm');
    expect(sheet.openLedger.some((e) => /Bring nightshade/i.test(e.line))).toBe(true);
    expect(sheet.gear.inHand.toLowerCase()).toContain('longsword');
    expect(sheet.beat.engineResult).toMatch(/Check success/);
    expect(sheet.settingsSlot).toBeNull();
    expect(sheet.player.typed).toMatch(/Ask Mira/);
    // C2 — no engine ids on the writer text.
    const text = formatFactSheetForWriter(sheet);
    expect(text).not.toMatch(/\bn1\b|\bp1\b|\bnpcId\b/);
    expect(text).toMatch(/SETTINGS:/);
    expect(hashFactSheet(sheet)).toMatch(/^fs_[0-9a-f]{8}$/);
  });

  it('formatWriterFacingEvent includes the FactSheet as the facts leaf', () => {
    const packet = buildCompletedEventPacket(baseState(), 'Look around');
    const text = formatWriterFacingEvent(packet);
    expect(text).toMatch(/FACTS \(engine-committed/);
    expect(text).toMatch(/COMPLETED EVENT:/);
  });

  it('TurnLog records dice from receipts and a stable hash', () => {
    const sheet = buildFactSheet(
      baseState(),
      buildCompletedEventPacket(baseState(), 'Attack'),
      'Attack'
    );
    const rolls = diceRollsFromReceipts([
      'Round 1 — you Longsword d20 11 + 5 = 16 vs AC 12: hit',
    ]);
    expect(rolls[0]?.die).toBe('d20');
    expect(rolls[0]?.total).toBe(16);
    const log = buildTurnLog({
      turn: 3,
      input: 'Attack',
      factSheet: sheet,
      stateBefore: sliceState(baseState()),
      stateAfter: sliceState(baseState()),
      diceRolls: rolls,
      finalProse: 'The blow landed.',
      chipsOffered: ['Attack', 'Dodge'],
      latencyMs: 40,
      ai: [{ role: 'writer', model: 'test', tokensIn: 10, tokensOut: 20, costUsd: 0, latencyMs: 40 }],
    });
    expect(log.v).toBe(1);
    expect(log.diceRolls[0]?.dc ?? log.diceRolls[0]?.total).toBeTruthy();
    expect(log.factSheetHash).toBe(hashFactSheet(sheet));
  });
});
