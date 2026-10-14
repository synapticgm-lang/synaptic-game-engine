/**
 * s77 Root G — the System has one author. Check Status: the painted plate is the window, the writer
 * gets only what changed. R: a housing with level / experience / skills off grows them hidden and
 * prints nothing. No live GM call.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { buildCompletedEventPacket, formatWriterFacingEvent, ledgerActionStitch } from './completedEventPacket';
import { buildLitrpgSystemWindow, withLitrpgSystemWindow } from './litrpgSystemWindow';
import { clampSystemHousing, SYSTEM_PART_IDS, type SystemHousingId, type SystemPartId } from './systemHousing';
import { applySandboxXpAwards } from './sandboxXp';
import { applyCharacterXpGain } from './characterXp';
import { grantLevelSkills } from './skillGates';
import { payEncounterXp } from './engineFight';
import { milestoneXp } from './xpRules';
import { milestoneAreaOpts } from './placeAuthority';
import { formatInfoSheet } from './infoSheet';
import type { ActiveEncounter, GameState, LogEntry } from './types';

const allParts = Object.fromEntries(SYSTEM_PART_IDS.map((p) => [p, true])) as Record<SystemPartId, boolean>;

const gmEntry = (turn: number, content: string, extra: Partial<LogEntry> = {}): LogEntry =>
  ({ id: `gm${turn}`, turn, role: 'gm', content, timestamp: turn, ...extra }) as LogEntry;

function pact(housing: SystemHousingId, over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    seed: 'seed77',
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    currentLocation: 'The Cathedral Infirmary',
    places: [{ id: 'infirmary', name: 'The Cathedral Infirmary' }],
    worldAtlas: null,
    activeEncounter: null,
    activeDungeon: null,
    journey: null,
    quests: [],
    npcMemories: [],
    companions: [],
    inventory: [],
    character: { ...s.character!, name: 'Jax', level: 1, xp: 0, xpToNext: 150, hp: 24, maxHp: 24 },
    systemHousing: clampSystemHousing({ housing, parts: allParts }),
    openingEstablishment: {
      ...(s.openingEstablishment ?? {}),
      answers: { name: 'Jax' },
      pending: [],
      complete: true,
    } as GameState['openingEstablishment'],
    log: [],
    turn: 1,
    sceneFacts: { ...s.sceneFacts!, crowd: 'present', present: [] },
    ...over,
  } as GameState;
}

const SHEET_RUN = /Name: Jax;\s*Level 1;/;

describe('s77 Root G — Check Status: the painted plate is the window', () => {
  // T9 replay: the opening plate showed XP 0/150; by T9 the ledger holds 75/150.
  const t9 = () => {
    const earlier = pact('private_window');
    const plate = buildLitrpgSystemWindow(earlier)!;
    return pact('private_window', {
      turn: 9,
      character: { ...earlier.character!, xp: 75 },
      log: [gmEntry(1, 'The infirmary smelled of lye.', { systemWindow: plate }), gmEntry(8, 'The chirurgeons went back to their cots.')],
    });
  };

  it('the writer packet carries only the change, never the whole sheet', () => {
    const s = t9();
    const packet = buildCompletedEventPacket(s, 'Check Status');
    expect(packet.ledgerRead).toBe(true);
    const writer = formatWriterFacingEvent(packet);
    expect(writer).toContain('Jax looked inward; the game shows the window.');
    expect(writer).toContain('XP 0 → 75');
    expect(writer).not.toMatch(SHEET_RUN);
    expect(writer).not.toContain('The window reads:');
    expect(writer).not.toMatch(/Registration: designation locked/);
  });

  it('nothing changed since the last read says so, and a first read hands over no sheet', () => {
    const s = t9();
    const same = { ...s, log: [...s.log, gmEntry(8, 'x', { systemWindow: buildLitrpgSystemWindow(s)! })] };
    expect(formatWriterFacingEvent(buildCompletedEventPacket(same, 'Check Status'))).toContain('Nothing changed since the last read.');
    const first = formatWriterFacingEvent(buildCompletedEventPacket({ ...s, log: [] }, 'Check Status'));
    expect(first).toMatch(/First read/);
    expect(first).not.toMatch(SHEET_RUN);
  });

  it('the log entry still carries the systemWindow plate', () => {
    const entry = withLitrpgSystemWindow(gmEntry(9, 'Jax looked inward.'), t9(), 'Check Status');
    expect(entry.systemWindow?.lines).toContain('Name: Jax');
    expect(entry.systemWindow?.lines).toContain('XP 75/150');
  });

  it('code-written prose for a read has no sheet run', () => {
    const line = ledgerActionStitch(t9(), 'Check Status');
    expect(line).not.toMatch(SHEET_RUN);
    expect(line).toContain('XP 0 → 75');
  });
});

const bandit = (id: string): ActiveEncounter => ({ name: 'Wardline Bandit', encounterId: id }) as ActiveEncounter;

/** Five quiet turns, then a won fight and its level-up: the engine path, receipts collected. */
function playFiveTurnsAndAFight(housing: SystemHousingId) {
  // 2026-10-14c — quiet turns pay nothing (no turn-5 First Steps), so the fight alone carries the level.
  let s = pact(housing, { character: { ...pact(housing).character!, xp: 125 } });
  const shown: string[] = [];
  const levelBefore = s.character.level ?? 1;
  for (let turn = 1; turn <= 5; turn++) {
    s = { ...s, turn };
    const r = applySandboxXpAwards(s, { playerAction: 'Look around', questsBefore: [], questsAfter: [], events: [], turn });
    const leveled = applyCharacterXpGain(s.character, r.xp, s.engineMode, s.systemHousing);
    s = { ...s, character: leveled.character, sandboxAwardKeys: r.awardKeys };
    shown.push(...r.notes, ...leveled.notes);
  }
  s = { ...s, turn: 6 };
  const fight = payEncounterXp(s, bandit('enc-t6'), 'defeated Wardline Bandit');
  s = fight.state;
  shown.push(...fight.receipts);
  const deed = applySandboxXpAwards(s, {
    playerAction: 'Attack the Wardline Bandit',
    questsBefore: [],
    questsAfter: [],
    events: [],
    turn: 6,
    enemyKilled: true,
  });
  const leveled = applyCharacterXpGain(s.character, deed.xp, s.engineMode, s.systemHousing);
  s = { ...s, character: leveled.character, sandboxAwardKeys: deed.awardKeys };
  shown.push(...deed.notes, ...leveled.notes);
  const granted = grantLevelSkills(s, levelBefore);
  s = granted.state;
  shown.push(...granted.receipts);
  s = { ...s, log: [gmEntry(6, 'The bandit went down.', { systemLog: shown })] };
  return { state: s, shown };
}

const GROWTH_LINE = /XP Gained|\bLevel\b|\brank\b/i;

describe('s77 Root G — R: hidden growth under housing', () => {
  it('leftover_pocket: awards recorded and the character grows, but nothing prints', () => {
    const { state, shown } = playFiveTurnsAndAFight('leftover_pocket');
    expect(shown.filter((l) => GROWTH_LINE.test(l))).toEqual([]);
    expect(state.sandboxAwardKeys).toEqual(expect.arrayContaining(['achv:first-kill', 'encounter:enc-t6:6']));
    expect(state.sandboxAwardKeys).not.toContain('achv:first-steps');
    expect(state.character.level).toBe(2);
    expect(state.character.skillsGrantedThrough).toBe(2);
    expect(Object.values(state.character.skills ?? {}).some((r) => (r ?? 0) >= 1)).toBe(true);
  });

  it('leftover_pocket: the writer packet and info sheet carry no XP, level or rank line', () => {
    const { state } = playFiveTurnsAndAFight('leftover_pocket');
    const packet = buildCompletedEventPacket(state, 'Attack the Wardline Bandit', { xp: 40 });
    expect(packet.xp).toBe(0);
    const writer = formatWriterFacingEvent(packet);
    expect(writer).not.toMatch(/^XP: /m);
    expect(writer).not.toMatch(/XP Gained|Level Up|\brank \d/);
    expect(formatInfoSheet(state)).not.toMatch(/XP Gained|Level Up|\brank \d/);
  });

  it('leftover_pocket: the hidden growth matches private_window exactly, and the next fight uses the hidden level', () => {
    const hidden = playFiveTurnsAndAFight('leftover_pocket').state;
    const open = playFiveTurnsAndAFight('private_window').state;
    for (const k of ['xp', 'level', 'xpToNext', 'maxHp', 'skills', 'skillsGrantedThrough'] as const) {
      expect(hidden.character[k], k).toEqual(open.character[k]);
    }
    expect(hidden.sandboxAwardKeys).toEqual(open.sandboxAwardKeys);
    const next = { ...hidden, turn: 9 };
    const xpBefore = next.character.xp ?? 0;
    const paid = payEncounterXp(next, bandit('enc-t9'), 'defeated Wardline Bandit');
    const expected = milestoneXp('litrpg', 'encounter', {
      level: 2,
      partySize: 1,
      strictness: next.gmStrictness,
      ...milestoneAreaOpts(next),
    }).amount;
    expect((paid.state.character.xp ?? 0) - xpBefore).toBe(expected);
    expect(paid.receipts).toEqual([]);
  });

  it('turning a part on later pays nothing twice', () => {
    const hidden = playFiveTurnsAndAFight('leftover_pocket').state;
    const on = { ...hidden, turn: 7, systemHousing: clampSystemHousing({ housing: 'private_window', parts: allParts }) };
    expect(grantLevelSkills(on, 2).receipts).toEqual([]);
    const again = applySandboxXpAwards(on, { playerAction: 'Look around', questsBefore: [], questsAfter: [], events: [], turn: 7 });
    expect(again.xp).toBe(0);
  });

  it('private_window keeps today\'s receipts', () => {
    const { state, shown } = playFiveTurnsAndAFight('private_window');
    expect(shown.some((l) => /^XP Gained: \d+ \(Achievement: First Kill/.test(l))).toBe(true);
    expect(shown.some((l) => /^XP Gained: \d+ \(defeated Wardline Bandit/.test(l))).toBe(true);
    expect(shown).toContain('Level Up! Now level 2');
    expect(shown.some((l) => /rank 1/.test(l))).toBe(true);
    expect(state.character.level).toBe(2);
  });
});
