/**
 * 2026-09-27a RRR Repair 1 — gate blocks bad paint, ledger stitches,
 * talk target, readability P0/P1 kinds.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import { isBlockedPaint } from './beatCommitGate';
import { ledgerActionStitch } from './completedEventPacket';
import { spokenTalkFallback } from './talkEnvelope';
import { readabilityGatePass } from './readabilityGate';
import type { GameState, LogEntry } from './types';

const PRIOR =
  'Brother Oren and tracker Kessa Cinder answer you. "They finished a tracking-rite on the ash road and found you in the ash."';

function gm(id: string, turn: number, content: string): LogEntry {
  return { id, turn, role: 'gm', content, timestamp: turn };
}

function pactState(over: Partial<GameState> = {}): GameState {
  const base = createInitialState('The Summoned Pact', 'litrpg');
  return {
    ...base,
    campaignBibleId: 'summoned-pact',
    engineMode: 'litrpg',
    turn: 11,
    currentLocation: 'Lowmarket',
    character: { ...base.character, name: 'Jax' },
    openingEstablishment: {
      pending: [],
      answers: { where: 'Cinderwake Trail', name: 'Jax' },
      complete: true,
      sceneWritten: true,
      mode: 'weave',
      aloneArrival: false,
      pickedHook:
        'Location: Cinderwake Trail\nWho is here / who summoned: Brother Oren and tracker Kessa Cinder\nWhy this happened: they finished a tracking-rite on the ash road.',
    },
    sceneFacts: { ...emptySceneFacts(11), present: [], indoor: false },
    log: [gm('g2', 2, PRIOR)],
    ...over,
  };
}

describe('27a Repair 1', () => {
  it('RC1 isBlockedPaint catches warden / collage / commit-gate notes and exact prior body', () => {
    const s = pactState();
    expect(isBlockedPaint(['Narrative does not resolve the player action'], s, 'fresh text here')).toBe(true);
    expect(isBlockedPaint(['Collage reject: no new tail'], s, 'fresh text here')).toBe(true);
    expect(isBlockedPaint(['Commit gate: recycle-without-delta'], s, 'fresh text here')).toBe(true);
    expect(isBlockedPaint([], s, PRIOR)).toBe(true);
    expect(isBlockedPaint([], s, 'A brand new beat that nobody has seen before at all.')).toBe(false);
  });

  it('RC2 ledgerActionStitch: outdoor look names the stalls; travel says who stayed behind', () => {
    const look = ledgerActionStitch(pactState(), 'Look around');
    expect(/stalls|fences/i.test(look)).toBe(true);
    expect(/\b(room|walls?|doorway)\b/i.test(look)).toBe(false);

    const trail = pactState({
      turn: 6,
      currentLocation: 'Cinderwake Trail',
      sceneFacts: { ...emptySceneFacts(6), present: ['Brother Oren', 'Kessa Cinder'], indoor: false },
    });
    const arrive = ledgerActionStitch(trail, 'Travel toward Lowmarket');
    expect(arrive).toMatch(/Lowmarket/);
    expect(arrive).toMatch(/Oren[^.]*stayed/);
    expect(/\b(room|walls?|doorway)\b/i.test(arrive)).toBe(false);
  });

  it('RC3 talk to an absent role never reprints the opening tracking-rite line', () => {
    const line = spokenTalkFallback(pactState(), 'Talk to the fence');
    expect(line).not.toMatch(/tracking-rite/);
    expect(line).toMatch(/fence/i);
  });

  it('RC5 readability: verbatim repeat is P0; short outdoor room beat is P1', () => {
    const repeat = pactState({ log: [gm('g2', 2, PRIOR), gm('g11', 11, PRIOR)] });
    expect(readabilityGatePass(repeat).p0Count).toBeGreaterThanOrEqual(1);

    const shortRoom = pactState({ log: [gm('g5', 5, 'You looked through the room again. Nothing new had come.')] });
    const res = readabilityGatePass(shortRoom);
    expect(res.p1Count).toBeGreaterThanOrEqual(1);
  });
});
