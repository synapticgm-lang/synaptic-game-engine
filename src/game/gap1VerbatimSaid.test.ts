/**
 * Gap 1 — one verbatim record of what each person said: every quoted line, any topic,
 * never a stage direction; voice notes and warden notes are not memories.
 */
import { describe, expect, it } from 'vitest';
import type { CampaignBible } from '@/data/campaigns/types';
import { createInitialState } from './defaults';
import { formatInfoSheet } from './infoSheet';
import {
  applySocialLedgerTurn,
  mergeNpcMemoriesFromTurn,
  recordSpokenTopics,
  seedBibleNpcRoster,
  upsertHarvestedNpcMemory,
} from './npcMemory';
import { formatNpcMemoriesForPrompt, sheetMemoryLine } from './npcRecords';
import { collectTurnTimelineFacts } from './timeline';
import type { GameState, LogEntry, NpcMemory } from './types';

let id = 0;
const entry = (turn: number, role: LogEntry['role'], content: string): LogEntry =>
  ({ id: `g${id++}`, turn, role, content, timestamp: turn }) as LogEntry;

function base(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    currentLocation: 'Mireglass March',
    worldAtlas: null,
    activeEncounter: null,
    activeDungeon: null,
    journey: null,
    quests: [],
    places: [{ id: 'mireglass-march', name: 'Mireglass March' }],
    npcMemories: [],
    companions: [],
    log: [],
    turn: 2,
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true } as GameState['openingEstablishment'],
    ...over,
    sceneFacts: { ...s.sceneFacts!, present: [], ...(over.sceneFacts ?? {}) },
  } as GameState;
}

const person = (name: string): NpcMemory =>
  ({
    npcId: name.toLowerCase().replace(/\s+/g, '-'),
    npcName: name,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 2,
    met: true,
    introSpoken: true,
    location: 'Mireglass March',
  }) as NpcMemory;

describe('Gap 1 — every quoted line lands in said', () => {
  it('three non who/want/refuse questions keep all three of Ilyra Fen\'s quotes; turn 8 sheet still shows the turn 5 quote', () => {
    const turns: [number, string, string][] = [
      [3, 'How many reflections should I count?', 'Ilyra Fen tilted her head toward the pools and said, "Count seven, never eight."'],
      [5, 'Tell me about the March', 'Ilyra Fen answered without looking up. "The March keeps what falls into it."'],
      [7, 'What are the rules here?', 'Ilyra Fen spoke softly. "Nobody leaves the glass by the way they came."'],
    ];
    let state = base({ npcMemories: [person('Ilyra Fen')], sceneFacts: { present: ['Ilyra Fen'] } as GameState['sceneFacts'] });
    for (const [turn, ask, gm] of turns) {
      state = applySocialLedgerTurn({ state: { ...state, turn }, playerAction: ask, turn, talkTopics: [], gmText: gm });
    }
    const ilyra = state.npcMemories!.find((m) => m.npcName === 'Ilyra Fen')!;
    expect(ilyra.said?.map((s) => s.line)).toEqual([
      'Count seven, never eight.',
      'The March keeps what falls into it.',
      'Nobody leaves the glass by the way they came.',
    ]);
    expect(ilyra.said?.every((s) => s.topic === 'other')).toBe(true);
    expect(ilyra.said?.[1]?.turn).toBe(5);

    const atT8 = { ...state, turn: 8, log: [entry(8, 'player', 'Can i ever get back'), entry(8, 'gm', 'The water stilled.')] };
    expect(formatInfoSheet(atT8)).toMatch(/Ilyra Fen.*already said \(other, T5\): "The March keeps what falls into it\."/);
  });

  it('reported speech by Ilyra and Tekk at turn 5 lands in said; turn 8 sheet shows Ilyra\'s line', () => {
    const t5 =
      'Ilyra said the March shows every walker the face they left behind, and that his was still deciding. '
      + 'Tekk tapped his pole against the bank and told Jax the water only lies to those who ask it twice.';
    const ilyraFen = { ...person('Ilyra Fen'), aliases: ['Ilyra'] };
    const tekkReed = { ...person('Tekk Reed'), aliases: ['Tekk'] };
    let state = base({
      npcMemories: [ilyraFen, tekkReed],
      sceneFacts: { present: ['Ilyra Fen', 'Tekk Reed'] } as GameState['sceneFacts'],
    });
    state = applySocialLedgerTurn({ state: { ...state, turn: 5 }, playerAction: 'Tell me about the March', turn: 5, talkTopics: [], gmText: t5 });
    const said = (name: string) => state.npcMemories!.find((m) => m.npcName === name)!.said?.map((s) => s.line);
    expect(said('Ilyra Fen')).toEqual(['the March shows every walker the face they left behind, and that his was still deciding']);
    expect(said('Tekk Reed')).toEqual(['the water only lies to those who ask it twice']);

    const atT8 = { ...state, turn: 8, log: [entry(8, 'player', 'Can i ever get back'), entry(8, 'gm', 'The water stilled.')] };
    expect(formatInfoSheet(atT8)).toMatch(
      /Ilyra Fen.*already said \(other, T5\): "the March shows every walker the face they left behind, and that his was still deciding"/
    );
  });

  it('a stage direction with no speech content records nothing', () => {
    const out = recordSpokenTopics([person('Tekk Reed')], ['Tekk Reed'], [], 'Tekk Reed nodded, and he spoke without turning his head.', 5);
    expect(out[0]!.said).toBeUndefined();
  });

  it('Tekk Reed\'s said line is the quote in the next sentence, not the stage direction', () => {
    const gm = 'Tekk Reed did not move from the water\'s edge, but he spoke without turning his head. "Watch needs eyes, not boasts."';
    const out = recordSpokenTopics([person('Tekk Reed')], ['Tekk Reed'], ['who'], gm, 2);
    expect(out[0]!.said).toEqual([{ topic: 'who', turn: 2, line: 'Watch needs eyes, not boasts.' }]);
  });
});

describe('Gap 1 — voice notes and warden notes are not memories', () => {
  it('a watch-role roster NPC who has been met carries no "Speech:" in the writer sheet', () => {
    const bible = {
      id: 'summoned-pact',
      keyNPCs: [{ id: 'tekk-reed', name: 'Tekk Reed', role: 'Gate guard', description: 'Keeps the watch at the March gate.', disposition: 'neutral' }],
    } as unknown as CampaignBible;
    const seeded = seedBibleNpcRoster(base(), bible);
    expect(seeded.npcMemories!.find((m) => m.npcName === 'Tekk Reed')!.facts.join(' ')).toMatch(/Speech:/);
    const met = upsertHarvestedNpcMemory(seeded.npcMemories!, 'Tekk Reed', 2, 'Jax');
    const tekk = met.find((m) => m.npcName === 'Tekk Reed')!;
    expect(sheetMemoryLine(tekk, 'Jax')).not.toMatch(/Speech:/);
    expect(formatNpcMemoriesForPrompt([tekk], 6, 'Jax')).not.toMatch(/Speech:/);
  });

  it('a warden note quoting "asked Ilyra Fen" never lands in her facts', () => {
    const before = base({ npcMemories: [person('Ilyra Fen')], sceneFacts: { present: ['Ilyra Fen'] } as GameState['sceneFacts'] });
    const facts = collectTurnTimelineFacts({
      turn: 4,
      playerAction: 'Ask about the glass',
      stateBefore: before,
      stateAfter: before,
      events: [],
      systemLog: [],
      newItemNames: [],
      wardenNotes: ['Writer words kept: applyGovernanceToProse would change "Jax asked Ilyra Fen about the glass…"'],
    });
    expect(facts.some((f) => f.text.startsWith('Warden:'))).toBe(true);
    const merged = mergeNpcMemoriesFromTurn(before, [], facts, 4);
    const ilyra = merged.find((m) => m.npcName === 'Ilyra Fen')!;
    expect(ilyra.facts.some((f) => /Warden:/.test(f))).toBe(false);
  });
});
