/**
 * 29z9i — the info sheet: code writes every line from committed state and the turn record, the writer
 * reads it in place of the raw recent GM beats. No live GM call.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { buildCompletedEventPacket, formatWriterFacingEvent } from './completedEventPacket';
import { buildTalkEnvelope } from './talkEnvelope';
import { INFO_SHEET_CHAR_CAP, INFO_SHEET_LINE_CAP, buildInfoSheet, formatInfoSheet } from './infoSheet';
import type { GameState, LogEntry, NpcMemory, Quest } from './types';

let id = 0;
const entry = (turn: number, role: LogEntry['role'], content: string, systemLog?: string[]): LogEntry =>
  ({ id: `e${id++}`, turn, role, content, timestamp: turn, systemLog }) as LogEntry;

function base(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    seed: 'sheet',
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    currentLocation: 'a ruined bathhouse',
    worldAtlas: null,
    activeEncounter: null,
    activeDungeon: null,
    journey: null,
    quests: [],
    places: [],
    npcMemories: [],
    companions: [],
    log: [],
    turn: 6,
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true } as GameState['openingEstablishment'],
    ...over,
    sceneFacts: { ...s.sceneFacts!, crowd: 'none', present: [], crowdCount: 0, ...(over.sceneFacts ?? {}) },
  } as GameState;
}

const PROSE_ONLY = 'A silver-eyed stranger named Orrin Vale had promised a vault key.';

const played = () =>
  base({
    log: [
      entry(1, 'gm', 'Cracked tiles. A blue panel hung in the air.'),
      entry(2, 'player', 'Who are you?'),
      entry(2, 'gm', 'Vessa answered: "Your handler."', ['Met: Vessa']),
      entry(3, 'player', 'Search the tiles'),
      entry(3, 'gm', PROSE_ONLY, ['Search: nothing found']),
      entry(4, 'player', 'Inspect the panel'),
      entry(4, 'gm', 'The panel read your name.'),
      entry(5, 'player', 'Wait'),
      entry(5, 'gm', 'Water dripped somewhere.', ['XP +12 (bearings)']),
      entry(6, 'player', 'Look around'),
    ],
    npcMemories: [
      {
        npcId: 'vessa',
        npcName: 'Vessa',
        disposition: 'neutral',
        facts: ['Introduced in play T2'],
        lastSeenTurn: 2,
        met: true,
        roleHint: 'handler',
        location: 'Valespire',
        completedTopics: ['who'],
      } as NpcMemory,
    ],
    quests: [
      {
        id: 'q1',
        name: 'Echoes of a Dead Summoner',
        description: '',
        status: 'active',
        type: 'main',
        revealed: true,
        revealedTurn: 3,
        objectives: [{ id: 'o1', description: 'Find the summoner\u2019s ledger', completed: false }],
      } as Quest,
    ],
    sceneFacts: { props: ['blue panel'] } as GameState['sceneFacts'],
  });

describe('29z9i — info sheet sections', () => {
  const s = played();
  const sheet = buildInfoSheet(s);
  const text = formatInfoSheet(s);

  it('NOW: turn, place, indoor/outdoor, alone, mode', () => {
    expect(sheet.now).toBe('T6 · a ruined bathhouse · indoor · alone · LitRPG');
  });

  it('LAST: newest first, completed turns only, engine result or none', () => {
    expect(sheet.last).toEqual([
      'T5 Wait → XP +12 (bearings)',
      'T4 Inspect the panel → no engine result',
      'T3 Search the tiles → Search: nothing found',
    ]);
  });

  it('HERE: nobody, and the System window is seen only by the player and cannot be touched', () => {
    expect(sheet.here[0]).toBe('nobody');
    expect(sheet.here[1]).toMatch(/only the player sees it; nobody can touch it/);
  });

  it('PEOPLE: name, role, where, when met, last topic', () => {
    expect(sheet.people).toEqual(['Vessa · handler · Valespire · met T2 · last topic who']);
  });

  it('PLACES: this place only', () => {
    expect(sheet.places).toMatch(/^a ruined bathhouse · /);
  });

  it('FACTS: engine facts with their turn, newest first', () => {
    expect(sheet.facts[0]).toBe('T3 quest found: Echoes of a Dead Summoner');
    expect(sheet.facts.every((f) => /^T\d+ /.test(f))).toBe(true);
  });

  it('ASKED: who answered, want and refuse not asked', () => {
    expect(sheet.asked).toMatch(/^who asked T2, answered · want not asked · refuse not asked/);
    expect(sheet.asked).toMatch(/panel asked T4, no answer/);
  });

  it('OPEN: the live quest step', () => {
    expect(sheet.open).toEqual(['quest Echoes of a Dead Summoner — step: Find the summoner\u2019s ledger']);
  });

  it('sections come in order and nothing comes from prose', () => {
    const order = ['NOW:', 'LAST:', 'HERE:', 'PEOPLE:', 'PLACES:', 'FACTS:', 'ASKED:', 'OPEN:'].map((h) => text.indexOf(h));
    expect(order.every((i, n) => i >= 0 && (n === 0 || i > order[n - 1]!))).toBe(true);
    expect(text).not.toMatch(/Orrin|vault key|silver-eyed/);
    expect(text).not.toMatch(/Look around/);
  });

  it('a live threat and someone here', () => {
    const fight = base({
      activeEncounter: { name: 'Ash Hound', hp: 6, maxHp: 14 } as GameState['activeEncounter'],
      companions: [{ name: 'Mira' } as never],
    });
    const f = buildInfoSheet(fight);
    expect(f.now).toMatch(/· with 2 here ·/);
    expect(f.here[0]).toBe('Mira, Ash Hound');
    expect(f.open).toContain('threat Ash Hound (6/14 HP)');
  });

  it('no System window line outside LitRPG', () => {
    const tab = buildInfoSheet({ ...played(), engineMode: 'dnd' } as GameState);
    expect(tab.here).toEqual(['nobody']);
    expect(tab.now).toMatch(/tabletop$/);
  });
});

describe('29z9i — info sheet caps', () => {
  it('stays inside ~40 lines and the character cap on a long save', () => {
    const log: LogEntry[] = [];
    for (let t = 1; t <= 60; t++) {
      log.push(entry(t, 'player', `Search crate number ${t} by the far wall carefully`));
      log.push(entry(t, 'gm', 'Dust.', [`Loot: copper coin x${t} found in crate ${t}`, `XP +${t} (search)`]));
    }
    const s = base({ log, turn: 61 });
    const text = formatInfoSheet(s);
    expect(text.split('\n').length).toBeLessThanOrEqual(INFO_SHEET_LINE_CAP);
    expect(text.length).toBeLessThanOrEqual(INFO_SHEET_CHAR_CAP);
    expect(buildInfoSheet(s).last[0]).toMatch(/^T60 /);
  });
});

describe('29z9i — the writer reads the sheet, not raw recent beats', () => {
  it('formatWriterFacingEvent carries the sheet and no GM beat text', () => {
    const s = played();
    const packet = buildCompletedEventPacket(s, 'Look around');
    expect(packet.recentBeats.join(' ')).toMatch(/Water dripped/);
    const facing = formatWriterFacingEvent(packet);
    expect(facing).toContain('INFO SHEET');
    expect(facing).not.toMatch(/^GM: Water dripped/m);
    expect(facing).not.toMatch(/Orrin Vale/);
  });

  it('the talk envelope drops LAST BEATS when the sheet is there', () => {
    const s = played();
    const packet = buildCompletedEventPacket(s, 'What do you want?');
    expect(buildTalkEnvelope(s, 'What do you want?', packet)).not.toMatch(/LAST BEATS/);
  });
});
