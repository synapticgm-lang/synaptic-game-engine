/**
 * 2026-09-27a RRR Repair 1 — gate blocks bad paint, ledger stitches,
 * talk target, readability P0/P1 kinds.
 */
import { describe, expect, it } from 'vitest';
import { emptySceneFacts } from './sceneFacts';
import { isBlockedPaint } from './beatCommitGate';
import { ledgerActionStitch } from './completedEventPacket';
import { spokenTalkFallback } from './talkEnvelope';
import { readabilityGatePass } from './readabilityGate';
import { closedUniverseFallbacks } from './padUniverse';
import { compileGraphChoiceLabels } from './graphChoices';
import { sealedCastNames } from './beatContract';
import { applyPresentTrimOnTravel } from './presentAuthority';
import { ledgerSheetLine } from './litrpgSystemWindow';
import { openingCastLabel } from './openingEstablishment';
import { applyCardCrowdToFacts } from './openingPointerCard';
import { craftProgressionPolicy } from './craftBookCompiler';
import { compileChoices } from './choiceCompiler';
import { newGameState } from './newGameTestState';
import type { GameState, LogEntry } from './types';

function newGameBase(bibleId: string, npcId: string, storyName: string): GameState {
  return newGameState(bibleId, { npcId, storyName, engineMode: 'litrpg' });
}

const PRIOR =
  'Brother Oren and tracker Kessa Cinder answer you. "They finished a tracking-rite on the ash road and found you in the ash."';

function gm(id: string, turn: number, content: string): LogEntry {
  return { id, turn, role: 'gm', content, timestamp: turn };
}

function pactState(over: Partial<GameState> = {}): GameState {
  const base = newGameBase('summoned-pact', 'sp-npc-9', 'The Summoned Pact');
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
      castNpcIds: base.openingEstablishment?.castNpcIds ?? [],
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

    const trail = pactState({
      turn: 6,
      currentLocation: 'Cinderwake Trail',
      sceneFacts: { ...emptySceneFacts(6), present: ['Brother Oren', 'Kessa Cinder'], indoor: false },
    });
    const arrive = ledgerActionStitch(trail, 'Travel toward Lowmarket');
    expect(arrive).toMatch(/Lowmarket/);
    expect(arrive).toMatch(/Oren[^.]*stayed/);
  });

  it('RC3 talk to an absent role never reprints the opening tracking-rite line', () => {
    const line = spokenTalkFallback(pactState(), 'Talk to the fence');
    expect(line).not.toMatch(/tracking-rite/);
  });

  it('RC5 readability: verbatim repeat is P0; travel streak is P1', () => {
    const repeat = pactState({ log: [gm('g2', 2, PRIOR), gm('g11', 11, PRIOR)] });
    expect(readabilityGatePass(repeat).p0Count).toBeGreaterThanOrEqual(1);

    const travel: LogEntry[] = [1, 2, 3, 4].map((t) => ({
      id: `p${t}`,
      turn: t,
      role: 'player',
      content: 'Travel toward Lowmarket',
      timestamp: t,
    }));
    const res = readabilityGatePass(pactState({ log: travel }));
    expect(res.p1Count).toBeGreaterThanOrEqual(1);
    expect(res.p0Count).toBe(0);
  });
});

const REMOVED = /direct question|listen for the real answer|press for leverage|take a stake in what is unfolding/i;

describe('27b Repair 2', () => {
  it('S1 no-cast pads carry no abstract labels and no objective-description chip', () => {
    const s = pactState({
      quests: [
        {
          id: 'q1',
          name: "Circle's Price",
          description: 'x',
          status: 'active',
          type: 'main',
          objectives: [{ id: 'o1', description: 'Hear their reason (or demand it)', completed: false }],
        } as unknown as GameState['quests'][number],
      ],
    });
    const pads = [...closedUniverseFallbacks(s), ...compileGraphChoiceLabels(s)];
    expect(pads.some((p) => REMOVED.test(p))).toBe(false);
    expect(pads.some((p) => /hear their reason/i.test(p))).toBe(false);
  });

  it('S2 sealedCastNames dedupes aliases and joins; travel trims origin-only NPCs', () => {
    const cast = (present: string[]) =>
      sealedCastNames(pactState({ sceneFacts: { ...emptySceneFacts(11), present } }));
    expect(cast(['Brother Oren', 'Kessa Cinder', 'Oren and Kessa'])).toEqual(['Brother Oren', 'Kessa Cinder']);
    expect(cast(['Pell Wren', 'Quay-master Pell'])).toEqual(['Pell Wren']);

    const before = pactState({
      currentLocation: 'Cinderwake Trail',
      sceneFacts: { ...emptySceneFacts(11), present: ['Pell Wren'] },
    });
    const moved = applyPresentTrimOnTravel({ ...before, currentLocation: 'Lowmarket' }, 'Cinderwake Trail', 'Lowmarket');
    expect(sealedCastNames(moved)).not.toContain('Pell Wren');
  });

  it('S3 talk target from cast; inspect panel reads the ledger sheet', () => {
    const s = pactState({ sceneFacts: { ...emptySceneFacts(11), present: ['Pell Wren'] } });
    expect(spokenTalkFallback(s, 'Ask a direct question')).not.toMatch(/direct question/i);
    expect(spokenTalkFallback(s, 'Talk to Pell Wren')).toMatch(/Pell Wren/);

    const sheetState = pactState({ character: { ...pactState().character, level: 3, xp: 120, xpToNext: 450 } });
    const sheet = ledgerSheetLine(sheetState);
    expect(sheet).toMatch(/Level 3/);
    expect(sheet).toMatch(/XP 120\/450/);
  });
});

describe('27c tidy-ups', () => {
  it('T1 no cast after travel: nobody answers; page 1 seeds the opening NPC into present', () => {
    const s = pactState();
    const line = spokenTalkFallback(s, 'Ask what they want');
    expect(line).toBe('Nobody here answered.');
    const cast = openingCastLabel(s);
    if (cast) expect(line).not.toContain(cast);

    const saltBase = newGameBase('salt-road-heist', 'salt-road-heist-npc-1', 'Salt Road');
    const salt = pactState({
      ...saltBase,
      campaignBibleId: 'salt-road-heist',
      turn: 0,
      openingEstablishment: { ...saltBase.openingEstablishment!, sceneWritten: true },
      sceneFacts: { ...emptySceneFacts(0), present: [], indoor: false },
      log: [],
    });
    expect(openingCastLabel(salt)).toBe('Vessa');
    const facts = applyCardCrowdToFacts(salt, { ...emptySceneFacts(0), present: [] });
    expect(facts.present).toContain('Vessa');
  });

  it('T2 compileChoices / craftProgressionPolicy never emit Press for leverage', () => {
    const inspects: LogEntry[] = [1, 2, 3, 4].map((t) => ({
      id: `p${t}`,
      turn: t,
      role: 'player',
      content: 'Inspect the crate',
      timestamp: t,
    }));
    for (const engineMode of ['rpg', 'litrpg', 'dnd', 'pyoa'] as const) {
      const s = pactState({ engineMode, log: inspects });
      expect(craftProgressionPolicy(s, 'Inspect the crate').preferPads).not.toContain('Press for leverage');
      expect(compileChoices(s, []).choices.some((c) => /press for leverage/i.test(c))).toBe(false);
    }
  });
});
