/**
 * Batch 08c — Free MUD-modern receipt + micro-flavor gate + Tag & Trigger stub.
 */
import { describe, expect, it } from 'vitest';
import { buildCompletedEventPacket } from './completedEventPacket';
import {
  buildFactualReceipt,
  composeFreeMudTurn,
  formatMicroFlavorPrompt,
  gateMicroFlavorQuote,
  shouldUseFreeMudPresentation,
  FREE_MUD_PRESENTATION_ENABLED,
} from './freeMudPresentation';
import {
  TAG_SKIRMISH_BOUNTY,
  CLAIM_BOUNTY_PAD,
  applyCombatClearTag,
  consumeTagTriggerOnInput,
  hasWorldTag,
  tagTriggerPads,
  withWorldTag,
} from './tagTrigger';
import { compileChoices } from './choiceCompiler';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { HUD_BUILD_STAMP } from '@/components/Hud';
import { BUILD_STAMP } from './runManifest';
import { createInitialState } from './defaults';
import type { GameState } from './types';
import { hasRealGmStory } from './turnAsk';

function baseState(over: Partial<GameState> = {}): GameState {
  const s = createInitialState();
  return {
    ...s,
    campaignBibleId: 'summoned-pact',
    engineMode: 'litrpg',
    currentLocation: 'Lowmarket',
    turn: 12,
    openingEstablishment: {
      complete: true,
      askedName: true,
      askedOrigin: true,
      askedLook: true,
      askedKit: true,
    } as GameState['openingEstablishment'],
    sceneFacts: {
      crowd: 'present',
      noise: 'voices',
      present: ['vendor'],
      props: ['stall'],
      lastBeat: 'market',
      updatedTurn: 12,
      lastKill: {
        name: 'Pact-Hunter Skirmisher',
        outcome: 'victory',
        remains: true,
        turn: 12,
      },
      ...s.sceneFacts,
    },
    ...over,
  };
}

describe('08c — Free MUD presentation', () => {
  it('locks Free mud on + Mid writer OFF + stamp 08c path still mud', () => {
    expect(FREE_MUD_PRESENTATION_ENABLED).toBe(true);
    expect(shouldUseFreeMudPresentation('free')).toBe(true);
    expect(shouldUseFreeMudPresentation('mid')).toBe(false);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    // Stamp moved to 08d Silent Engine — mud path still on.
    expect(HUD_BUILD_STAMP).toMatch(/^2026-09-0/);
    expect(BUILD_STAMP).toMatch(/^2026-09-0/);
  });

  it('builds factual receipt from packet (no AI)', () => {
    const state = baseState();
    const packet = buildCompletedEventPacket(state, 'Attack the skirmisher', { xp: 25 });
    const lines = buildFactualReceipt(packet, ['XP Gained: 25 (combat)']);
    expect(lines.some((l) => /^HERE:/i.test(l))).toBe(true);
    expect(lines.some((l) => /^ACT:/i.test(l))).toBe(true);
    expect(lines.some((l) => /^OUTCOME:/i.test(l))).toBe(true);
    expect(lines.some((l) => /XP/i.test(l))).toBe(true);
  });

  it('micro-prompt is short and sealed', () => {
    const packet = buildCompletedEventPacket(baseState(), 'Inspect the stall');
    const prompt = formatMicroFlavorPrompt(packet);
    expect(prompt).toMatch(/ONE short/i);
    expect(prompt).toMatch(/YOU MAY ONLY MENTION/i);
    expect(prompt.length).toBeLessThan(1200);
  });

  it('gates invent Title-Case and multi junk', () => {
    const packet = buildCompletedEventPacket(baseState(), 'Wait');
    expect(gateMicroFlavorQuote('NONE', packet).ok).toBe(false);
    expect(gateMicroFlavorQuote('Dust hung in the Lowmarket air.', packet).ok).toBe(true);
    const invent = gateMicroFlavorQuote('Lord Vexarion winked from the throne.', packet);
    expect(invent.ok).toBe(false);
  });

  it('compose keeps receipt when flavor fails', () => {
    const packet = buildCompletedEventPacket(baseState(), 'Wait');
    const turn = composeFreeMudTurn(packet, { flavorRaw: 'Invented Wizard Bob smiled.' });
    expect(turn.presentation).toBe('mud-receipt');
    expect(turn.flavorQuote).toBe('');
    expect(turn.receiptLines.length).toBeGreaterThan(0);
  });

  it('mud receipt LogEntry counts as real story', () => {
    expect(
      hasRealGmStory({
        id: '1',
        turn: 1,
        role: 'gm',
        content: '',
        timestamp: 0,
        presentation: 'mud-receipt',
        systemLog: ['HERE: Lowmarket', 'ACT: waited', 'OUTCOME: resolved'],
      })
    ).toBe(true);
  });
});

describe('08c — Tag & Trigger stub', () => {
  it('writes bounty tag on combat clear', () => {
    const state = baseState();
    const packet = buildCompletedEventPacket(state, 'Attack', { xp: 25 });
    const next = applyCombatClearTag(state, packet);
    expect(hasWorldTag(next, TAG_SKIRMISH_BOUNTY)).toBe(true);
  });

  it('injects Claim Lowmarket bounty pad when tagged at Lowmarket', () => {
    const state = withWorldTag(baseState(), TAG_SKIRMISH_BOUNTY);
    expect(tagTriggerPads(state)).toContain(CLAIM_BOUNTY_PAD);
    const compiled = compileChoices(state, ['Look around', 'Wait']);
    expect(compiled.choices.some((c) => /claim lowmarket bounty/i.test(c))).toBe(true);
  });

  it('consumes tag on claim pad', () => {
    const state = withWorldTag(baseState(), TAG_SKIRMISH_BOUNTY);
    const { state: next, receipt } = consumeTagTriggerOnInput(state, CLAIM_BOUNTY_PAD);
    expect(hasWorldTag(next, TAG_SKIRMISH_BOUNTY)).toBe(false);
    expect(receipt).toMatch(/BOUNTY/i);
  });
});
