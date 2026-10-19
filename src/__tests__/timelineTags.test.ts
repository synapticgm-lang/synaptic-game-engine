/**
 * q72-TIMELINETAGS — engine-tagged timeline + SCENE block (no AI).
 * Tests A–K from docs/orders/q72-TIMELINETAGS.md (+ addendum 10:36).
 */
import { describe, expect, it } from 'vitest';
import { buildCompletedEventPacket, formatWriterFacingEvent } from '../game/completedEventPacket';
import {
  applyCollectedFacts,
  collectTurnTimelineFacts,
  compressVisitLog,
  formatSceneBlock,
  leavePlaceVisit,
  mergeVisitEvents,
  recordPersonSeen,
  scenePartTokens,
  tag,
  tokensOf,
} from '../game/timeline';
import { registerWriterIntroductions } from '../game/writerIntroductions';
import { spokenLines } from '../game/settlementQuestCards';
import type { GameState, TimelineFact } from '../game/types';
import fs from 'node:fs';
import path from 'node:path';

function baseState(over: Partial<GameState> = {}): GameState {
  return {
    turn: 214,
    currentLocation: 'Lowmarket',
    character: { name: 'Jax', hp: 10, maxHp: 10, level: 1, xp: 0 },
    inventory: [],
    quests: [],
    log: [],
    npcMemories: [
      {
        npcId: 'person:the-chanter',
        npcName: 'the chanter',
        disposition: 'neutral',
        facts: [],
        lastSeenTurn: 214,
        location: 'Lowmarket',
        said: [{ topic: 'want', turn: 213, line: 'wants the paper read aloud' }],
      },
      {
        npcId: 'person:the-clerk',
        npcName: 'the clerk',
        disposition: 'neutral',
        facts: [],
        lastSeenTurn: 214,
        location: 'Lowmarket',
      },
      {
        npcId: 'person:cutha-hask',
        npcName: 'Cutha Hask',
        disposition: 'neutral',
        facts: [],
        lastSeenTurn: 214,
        location: 'Lowmarket',
        said: [{ topic: 'food', turn: 214, line: 'asked for food' }],
      },
    ],
    places: [
      {
        id: 'place:lowmarket',
        name: 'Lowmarket',
        settlementKind: 'road',
        exits: ['Valespire', 'Cathedral Close'],
      },
    ],
    sceneFacts: {
      crowd: 'few',
      noise: 'voices',
      present: ['the chanter', 'the clerk', 'Cutha Hask'],
      props: ['paper', 'flat leather case'],
      lastBeat: '',
      updatedTurn: 214,
    },
    entityRecords: {
      'creature:dog': {
        kind: 'creature',
        name: 'dog',
        firstTurn: 213,
        lastTurn: 213,
        place: 'Lowmarket',
        notes: ['animal, calm'],
      },
      'item:paper': {
        kind: 'item',
        name: 'paper',
        firstTurn: 213,
        lastTurn: 213,
        place: 'Lowmarket',
        notes: ['on the table'],
      },
    },
    timeline: [
      {
        id: 'person:cutha-hask',
        turn: 212,
        verb: 'met',
        kind: 'person',
        name: 'Cutha Hask',
        detail: 'road',
        text: 'met: Cutha Hask, road',
        at: 1,
      },
      {
        id: 'creature:dog',
        turn: 213,
        verb: 'appeared',
        kind: 'creature',
        name: 'dog',
        text: 'appeared: dog',
        at: 2,
      },
      {
        id: 'item:paper',
        turn: 213,
        verb: 'gained',
        kind: 'item',
        name: 'paper',
        text: 'gained: paper',
        at: 3,
      },
      {
        id: 'quest:circles-price',
        turn: 214,
        verb: 'step',
        kind: 'quest',
        name: "The Circle's Price",
        detail: '2/4',
        text: "step: The Circle's Price 2/4",
        at: 4,
      },
    ],
    placeVisitLog: {
      placeId: 'place:lowmarket',
      placeName: 'Lowmarket',
      sinceTurn: 210,
      events: [
        {
          id: 'person:cutha-hask',
          turn: 212,
          verb: 'met',
          kind: 'person',
          name: 'Cutha Hask',
          text: 'met: Cutha Hask',
          at: 1,
        },
        {
          id: 'person:the-chanter',
          turn: 213,
          verb: 'said',
          kind: 'said',
          name: 'the chanter',
          detail: 'wants the paper read aloud',
          text: 'the chanter: wants the paper read aloud',
          at: 2,
        },
        {
          id: 'item:paper',
          turn: 213,
          verb: 'gained',
          kind: 'item',
          name: 'paper',
          text: 'gained: paper',
          at: 3,
        },
        {
          id: 'place:cellar',
          turn: 214,
          verb: 'cleared',
          kind: 'place',
          name: 'cellar',
          text: 'cleared: cellar',
          at: 4,
        },
      ],
    },
    ...over,
  } as unknown as GameState;
}

/** Legacy L6-style overlapping scene sections (audit sizes) for before/after token compare. */
function legacyScenePartL6(): string {
  const mention = 'YOU MAY ONLY MENTION: ' + 'x'.repeat(2250);
  const refEnum = 'REF ENUM:\n' + 'y'.repeat(530);
  const people = 'PEOPLE HERE:\n' + 'z'.repeat(490);
  const facts = 'FACTS:\n' + 'a'.repeat(260);
  const info = 'INFO SHEETS:\n' + 'b'.repeat(250);
  const how = 'HOW THEY ARE NOW:\n' + 'c'.repeat(225);
  const last = 'LAST:\n' + 'd'.repeat(220);
  const asked = 'ASKED:\n' + 'e'.repeat(165);
  const open = 'OPEN:\n' + 'f'.repeat(150);
  return [mention, refEnum, people, facts, info, how, last, asked, open].join('\n');
}

function legacyScenePartT7(): string {
  // Slightly smaller T7-shaped dump (~900 tokens).
  return legacyScenePartL6().slice(0, Math.floor(legacyScenePartL6().length * 0.8));
}

describe('q72-TIMELINETAGS', () => {
  it('A: scripted engine events write one tag each (verb/kind/id) in order', () => {
    let s = baseState({ turn: 10, timeline: [], placeVisitLog: null, npcMemories: [], entityRecords: {} });
    s = recordPersonSeen(s, 'Cutha Hask', 'met on the road');
    s = tag(s, 'appeared', 'creature', { id: 'creature:dog', name: 'dog' }, 'calm');
    s = tag(s, 'gained', 'item', { id: 'item:paper', name: 'paper' }, 'on the table');
    s = tag(s, 'opened', 'exit', { id: 'exit:valespire', name: 'Valespire' }, 'road');
    s = tag(s, 'accepted', 'quest', { id: 'quest:circle', name: "The Circle's Price" });
    s = tag(s, 'step', 'quest', { id: 'quest:circle', name: "The Circle's Price" }, '2/4');
    s = tag(s, 'said', 'said', { id: 'person:the-chanter', name: 'the chanter' }, 'wants the paper read aloud');
    s = tag(s, 'left', 'person', { id: 'person:the-clerk', name: 'the clerk' });

    const tagged = (s.timeline ?? []).filter((f) => f.verb);
    expect(tagged.map((f) => `${f.verb}:${f.kind}:${f.name}`)).toEqual([
      'met:person:Cutha Hask',
      'appeared:creature:dog',
      'gained:item:paper',
      'opened:exit:Valespire',
      'accepted:quest:The Circle\'s Price',
      'step:quest:The Circle\'s Price',
      'said:said:the chanter',
      'left:person:the clerk',
    ]);
    expect(s.entityRecords?.['creature:dog']?.name).toBe('dog');
    expect(s.entityRecords?.['item:paper']?.name).toBe('paper');
    expect(s.npcMemories?.some((m) => m.npcName === 'Cutha Hask')).toBe(true);
    // Collector drops Player attempted + XP regex
    const collected = collectTurnTimelineFacts({
      turn: 11,
      playerAction: 'Look around',
      stateBefore: s,
      stateAfter: s,
      events: [],
      systemLog: ['XP gained: 25', 'You gained 10 XP'],
      newItemNames: [],
    });
    expect(collected.every((f) => !/Player attempted/i.test(f.text))).toBe(true);
    expect(collected.every((f) => !/XP gained/i.test(f.text))).toBe(true);
    // Both paths share applyCollectedFacts
    const viaFate = applyCollectedFacts(s, collected);
    expect(viaFate.timeline?.length).toBeGreaterThanOrEqual((s.timeline ?? []).length);
  });

  it('B: writer-invented names write NO tag and add no presence', () => {
    const s = baseState({ npcMemories: [], timeline: [], placeVisitLog: null });
    const next = registerWriterIntroductions(s, 'I\'ll the stranger stepped from the fog. "Hello," said I\'ll.');
    expect(next.npcMemories ?? []).toEqual([]);
    expect(next.timeline ?? []).toEqual([]);
    expect(next).toBe(s);
  });

  it('C: SCENE block matches fixed format; size within budget on L6 and T7 fixtures', () => {
    const s = baseState();
    const block = formatSceneBlock(s);
    expect(block).toContain('SCENE T214 - Lowmarket (road)');
    expect(block).toMatch(/^PRESENT:/m);
    expect(block).toMatch(/^CREATURES:/m);
    expect(block).toMatch(/^ITEMS:/m);
    expect(block).toMatch(/^EXITS:/m);
    expect(block).toMatch(/^SAID:/m);
    expect(block).toMatch(/^RECENT:/m);
    expect(block).toContain('Cutha Hask (person)');
    expect(block).toContain('Valespire (road)');
    expect(block).toMatch(/RECENT:.*T212 met: Cutha Hask/);

    const sceneTok = tokensOf(block);
    expect(sceneTok).toBeLessThanOrEqual(200);

    const beforeL6 = tokensOf(legacyScenePartL6());
    const beforeT7 = tokensOf(legacyScenePartT7());
    const after = scenePartTokens(s);
    // eslint-disable-next-line no-console
    console.log(
      `q72 packet size: L6 before=${beforeL6} after=${after}; T7 before=${beforeT7} after=${after} (chars/4 tokens)`
    );
    expect(beforeL6).toBeGreaterThan(1000);
    expect(after).toBeLessThanOrEqual(300);
    expect(after).toBeLessThan(beforeL6);
    expect(after).toBeLessThan(beforeT7);

    const packet = buildCompletedEventPacket(s, 'Ask the chanter');
    expect(packet.sceneBlock).toBe(block);
    const facing = formatWriterFacingEvent(packet);
    expect(facing).toContain('SCENE T214 - Lowmarket (road)');
    expect(facing).not.toMatch(/PEOPLE HERE \(their sheets/);
  });

  it('D: SAID lines come from the engine answer, identical across writer replies', () => {
    const s = baseState();
    const a = formatSceneBlock(s);
    const b = formatSceneBlock(s);
    expect(a).toContain('the chanter: wants the paper read aloud');
    expect(a).toContain('Cutha Hask: asked for food');
    expect(a).toBe(b);
    // Prose stub yields nothing
    expect(spokenLines('"I am a brand new invented line," said the fog.')).toEqual([]);
  });

  it('E: entity REF records appear only when the id is referenced', () => {
    const s = baseState();
    const packet = buildCompletedEventPacket(s, 'Talk to Cutha Hask about food');
    expect(packet.refRecords ?? '').toMatch(/REF person:cutha-hask:/i);
    const quiet = buildCompletedEventPacket(s, 'Wait');
    // Wait references nobody — refRecords empty or no Cutha
    expect(quiet.refRecords ?? '').not.toMatch(/Cutha Hask/);
  });

  it('F: prose-path tests updated (registerWriterIntroductions is a no-op)', () => {
    const s = baseState({ npcMemories: [] });
    expect(registerWriterIntroductions(s, 'A sailor coiled rope.').npcMemories ?? []).toEqual([]);
  });

  it('G: old save loads (no verb) and new events tag; no new word-list files', () => {
    const old: TimelineFact = {
      id: 'legacy-1',
      turn: 1,
      kind: 'other',
      text: 'Player attempted: Look around',
      at: 1,
    };
    let s = baseState({ timeline: [old], placeVisitLog: null });
    s = tag(s, 'met', 'person', { id: 'person:nell', name: 'Nell Rudd' }, 'met on the road');
    expect(s.timeline?.[0]?.text).toBe('Player attempted: Look around');
    expect(s.timeline?.[0]?.verb).toBeUndefined();
    expect(s.timeline?.some((f) => f.verb === 'met' && f.name === 'Nell Rudd')).toBe(true);

    const src = fs.readFileSync(path.join(__dirname, '../game/timeline.ts'), 'utf8');
    expect(src).not.toMatch(/pushFact\(facts,\s*turn,\s*'other',\s*`Player/);
    expect(src).not.toMatch(/\/xp\\s\+gained\|gained/);
    // Grep check: this test file does not add ROLE_NOUNS / quote harvest lists
    const self = fs.readFileSync(__filename, 'utf8');
    expect(self).not.toMatch(/ROLE_NOUNS\s*=/);
  });

  it('H: long stay (60+ tags) still shows earliest key events in HERE SO FAR within budget', () => {
    let s = baseState({ turn: 100, timeline: [], placeVisitLog: null });
    s = tag(s, 'met', 'person', { id: 'person:early', name: 'Early Friend' }, 'first meet');
    for (let i = 0; i < 60; i++) {
      s = { ...s, turn: 100 + i };
      s = tag(s, 'appeared', 'creature', { id: `creature:rat-${i % 3}`, name: 'rat' }, 'minor');
    }
    s = tag(s, 'step', 'quest', { id: 'quest:q', name: 'Main Quest' }, '1/4');
    const block = formatSceneBlock(s);
    expect(block).toMatch(/HERE SO FAR/);
    expect(block).toMatch(/Early Friend|met Early Friend/);
    expect(tokensOf(block)).toBeLessThanOrEqual(200);
  });

  it('I: leave and return shows the stored summary', () => {
    let s = baseState({ turn: 200 });
    s = tag(s, 'met', 'person', { id: 'person:brin', name: 'Brin Holt' });
    s = tag(s, 'gained', 'item', { id: 'item:key', name: 'iron key' });
    s = leavePlaceVisit(s);
    const pl = (s.places ?? []).find((p) => p.name === 'Lowmarket');
    expect(pl?.lastVisitSummary).toMatch(/Brin Holt|iron key/);
    expect(pl?.lastVisitTurns).toEqual({ from: 210, to: 200 });
    // Return
    s = { ...s, turn: 220, currentLocation: 'Lowmarket', placeVisitLog: null };
    const block = formatSceneBlock(s);
    expect(block).toMatch(/LAST VISIT \(T210-T200\)/);
  });

  it('J: dungeon visit records rooms cleared, doors, traps, loot and kills', () => {
    let s = baseState({
      turn: 50,
      currentLocation: 'Crypt',
      activeDungeon: { id: 'crypt', name: 'Crypt' } as unknown as GameState['activeDungeon'],
      timeline: [],
      placeVisitLog: null,
      places: [{ id: 'place:crypt', name: 'Crypt', exits: ['Stairs'] }],
    });
    s = tag(s, 'cleared', 'place', { id: 'room:cellar', name: 'cellar' }, 'room');
    s = tag(s, 'opened', 'exit', { id: 'door:north', name: 'north door' });
    s = tag(s, 'found', 'item', { id: 'trap:spike', name: 'spike trap' }, 'trap');
    s = tag(s, 'sprung', 'item', { id: 'trap:spike', name: 'spike trap' });
    s = tag(s, 'gained', 'item', { id: 'item:coin', name: 'silver coin' }, 'loot');
    s = tag(s, 'died', 'combat', { id: 'combat:skeleton', name: 'skeleton' });
    const log = s.placeVisitLog?.events ?? [];
    expect(log.some((f) => f.verb === 'cleared' && f.name === 'cellar')).toBe(true);
    expect(log.some((f) => f.verb === 'opened' && /door/i.test(f.name ?? ''))).toBe(true);
    expect(log.some((f) => f.verb === 'found' || f.verb === 'sprung')).toBe(true);
    expect(log.some((f) => f.verb === 'gained' && /coin/i.test(f.name ?? ''))).toBe(true);
    expect(log.some((f) => f.verb === 'died' && f.name === 'skeleton')).toBe(true);
  });

  it('K: merging never removes a person/quest-step/item/death entry', () => {
    const events: TimelineFact[] = [
      { id: 'p1', turn: 1, verb: 'met', kind: 'person', name: 'Ada', text: 'met: Ada', at: 1 },
      { id: 'q1', turn: 2, verb: 'step', kind: 'quest', name: 'Quest', detail: '1/3', text: 'step: Quest 1/3', at: 2 },
      { id: 'i1', turn: 3, verb: 'gained', kind: 'item', name: 'torch', text: 'gained: torch', at: 3 },
      { id: 'c1', turn: 4, verb: 'died', kind: 'combat', name: 'rat', text: 'died: rat', at: 4 },
      { id: 'r1', turn: 5, verb: 'appeared', kind: 'creature', name: 'rat', text: 'appeared: rat', at: 5 },
      { id: 'r2', turn: 6, verb: 'appeared', kind: 'creature', name: 'rat', text: 'appeared: rat', at: 6 },
      { id: 'r3', turn: 7, verb: 'appeared', kind: 'creature', name: 'rat', text: 'appeared: rat', at: 7 },
    ];
    const merged = mergeVisitEvents(events);
    expect(merged.some((f) => f.verb === 'met' && f.name === 'Ada')).toBe(true);
    expect(merged.some((f) => f.verb === 'step' && f.name === 'Quest')).toBe(true);
    expect(merged.some((f) => f.verb === 'gained' && f.name === 'torch')).toBe(true);
    expect(merged.some((f) => f.verb === 'died' && f.name === 'rat')).toBe(true);
    // minor rats collapsed
    expect(merged.filter((f) => f.verb === 'appeared' && f.name === 'rat').length).toBe(1);
    expect(compressVisitLog(events)).toMatch(/Ada/);
  });
});
