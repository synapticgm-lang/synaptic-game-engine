/**
 * tt-build-npcmotive — NPC motive lines:
 * 1. every generated sheet and every cursed-keep roster person gets 3-5 spoken motive lines when the record is made;
 * 2. old saves get them on load;
 * 3. the writer answers first, held to those lines; only when its repair fails does the engine land one line,
 *    the one not said yet, else the least recent (motiveUsed, kept by the harvest);
 * 4. sheetAnswerLine is gone (no parallel path).
 */
import { describe, expect, it } from 'vitest';
import archetypes from '../../docs/research/manus-next-stage/npc-personalities.json';
import motiveData from '../data/npcMotiveLines.json';
import { cursedKeep } from '../data/campaigns/cursedKeep';
import { createInitialState } from './defaults';
import type { GameState, NpcMemory } from './types';
import * as npcSheet from './npcSheet';
import { ensureNpcSheet, motiveAnswer, motiveLinesFor, withMotiveLines } from './npcSheet';
import { recordSpokenTopics, seedBibleNpcRoster } from './npcMemory';
import { applySaveRepair } from './saveMigration';
import { repairMissingAnswer, type WriterTurnResult } from './writerTurn';
import { parsePlayerIntent } from './intentParser';
import type { CompletedEventPacket } from './completedEventPacket';

function ck(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    turn: 12,
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true } as GameState['openingEstablishment'],
    activeEncounter: null,
    ...over,
  } as GameState;
}

const memory = (name: string, over: Partial<NpcMemory> = {}): NpcMemory =>
  ({ npcId: name.toLowerCase(), npcName: name, disposition: 'neutral', facts: [], lastSeenTurn: 0, aliases: [], ...over }) as NpcMemory;

describe('1 — motive lines are seeded when the record is made', () => {
  it('every archetype motivation has its own spoken line: first person, no closing stop, no sheet note', () => {
    const data = motiveData as Record<string, string[]>;
    for (const a of archetypes as { id: string; motivations: string[] }[]) {
      expect(data[a.id], a.id).toHaveLength(a.motivations.length);
      for (const m of a.motivations) {
        const lines = motiveLinesFor(m);
        expect(lines.length, m).toBeGreaterThanOrEqual(3);
        expect(lines.length, m).toBeLessThanOrEqual(5);
        expect(new Set(lines).size).toBe(lines.length);
        for (const l of lines) {
          expect(l).toMatch(/\b(?:I|me|my|mine|we|us|our)\b/i);
          expect(l).not.toMatch(/[.!?]$/);
          expect(l.toLowerCase()).not.toBe(`i want to ${m.toLowerCase()}`);
        }
      }
    }
  });

  it('a generated townsperson gets lines on first meet, their sheet motive line first, the same every time', () => {
    const a = ensureNpcSheet(ck({ npcMemories: [] }), 'Wat Miller', 'Greyhollow Inn').npcMemories!.find((m) => m.npcName === 'Wat Miller')!;
    const b = ensureNpcSheet(ck({ npcMemories: [] }), 'Wat Miller', 'Greyhollow Inn').npcMemories!.find((m) => m.npcName === 'Wat Miller')!;
    expect(a.motiveLines!.length).toBeGreaterThanOrEqual(3);
    expect(a.motiveLines).toEqual(motiveLinesFor(a.sheet!.motive));
    expect(b.motiveLines).toEqual(a.motiveLines);
  });

  it('cursed-keep roster people get their authored lines; the Entity Below, who cannot be reasoned with, gets none', () => {
    const s = seedBibleNpcRoster(ck({ npcMemories: [] }), cursedKeep);
    const lines = (n: string) => s.npcMemories!.find((m) => m.npcName === n)?.motiveLines ?? [];
    for (const n of ['Father Aldous', 'Torin', 'Vess', 'Kael', 'Dain Holt', 'Elara Moss', 'Bram Coyle']) {
      expect(lines(n).length, n).toBeGreaterThanOrEqual(3);
    }
    expect(lines('Torin')[0]).toBe('I want a full common room and no trouble in it');
    expect(lines('The Entity Below')).toEqual([]);
  });
});

describe('2 — old saves get them on load', () => {
  it('a saved sheet and a saved roster row with no lines are filled; a second pass changes nothing', () => {
    const old = ck({
      npcMemories: [
        memory('Rosel Coyne', { sheet: { job: 'artisan', motive: 'Keep loved ones safe', fear: '', speech: '', secret: '', place: 'town' } }),
        memory('Oskar the Woodcutter', { aliases: ['Oskar'], facts: ['Bible roster: quest-patron'] }),
      ],
    });
    const once = withMotiveLines(old, cursedKeep);
    expect(once.npcMemories![0]!.motiveLines![0]).toBe("I just want the people I care about kept out of harm's way");
    expect(once.npcMemories![1]!.motiveLines![0]).toBe('I want my daughter back, that is all I want');
    expect(withMotiveLines(once, cursedKeep)).toBe(once);
  });

  it('applySaveRepair runs it on every load', () => {
    const base = ck();
    const old = ck({
      npcMemories: [memory('Torin', { facts: ['Bible roster: keeper'] })],
      openingEstablishment: { ...base.openingEstablishment, pending: [] } as GameState['openingEstablishment'],
    });
    const out = applySaveRepair(old);
    expect(out.state.npcMemories!.find((m) => m.npcName === 'Torin')!.motiveLines![0]).toBe('I want a full common room and no trouble in it');
    expect(out.notes).toContain('npc motive lines seeded');
  });
});

describe('3 — the writer answers first; the engine line only when that fails', () => {
  const torinLines = cursedKeep.keyNPCs.find((n) => n.name === 'Torin')!.motiveLines!;
  const torin = (over: Partial<NpcMemory> = {}) => memory('Torin', { motiveLines: torinLines, location: 'Greyhollow Inn', ...over });
  const packet = { refEnum: [{ id: 't1', klass: 'person', display: 'Torin' }] } as unknown as CompletedEventPacket;
  const prose = 'The common room was warm. A log shifted in the hearth.';

  async function talk(state: GameState, reply: string, speech?: WriterTurnResult['speech']) {
    const playerInput = 'Ask Torin what he wants';
    const asked: string[] = [];
    const turn = { prose, path: 'json-partial', outcome: 'accepted', problems: [], remaining: [], firstDraft: prose, speech } as unknown as WriterTurnResult;
    const out = await repairMissingAnswer(turn, {
      packet,
      check: { state, playerInput, intent: parsePlayerIntent(playerInput, state), engineFact: '', previousGm: '' },
      repair: async (req) => {
        asked.push(req);
        return reply;
      },
    });
    return { out, asked };
  }

  it('the writer is asked, with the motive lines as what the person is known to say', async () => {
    const { asked } = await talk(ck({ currentLocation: 'Greyhollow Inn', npcMemories: [torin()] }), '');
    expect(asked).toHaveLength(1);
    for (const l of torinLines) expect(asked[0]).toContain(`Torin: ${l}`);
  });

  it('a failed writer answer lands the first unsaid motive line, keeps the failure reason, and joins the speech record', async () => {
    const { out } = await talk(ck({ currentLocation: 'Greyhollow Inn', npcMemories: [torin()] }), '', []);
    expect(out.prose).toContain(`"${torinLines[0]}," Torin said.`);
    expect(out.answerRepair?.bug).toBe('repair reply empty');
    expect(out.answerRepair?.repaired).toBe(`"${torinLines[0]}," Torin said.`);
    expect(out.speech).toEqual([{ speakerId: 'torin', speaker: 'Torin', words: torinLines[0] }]);
  });

  it('the pick skips lines already said, then cycles least recent first', () => {
    const at = (used: string[]) => motiveAnswer(ck({ npcMemories: [torin({ motiveUsed: used })] }), ['Torin'])!.spoken.words;
    expect(at([torinLines[0]!])).toBe(torinLines[1]);
    expect(at([torinLines[0]!, torinLines[1]!])).toBe(torinLines[2]);
    expect(at([torinLines[2]!, torinLines[0]!, torinLines[1]!])).toBe(torinLines[2]);
  });

  it('the harvest moves a spoken motive line to the back of motiveUsed, so the next pick differs', () => {
    const state = ck({ npcMemories: [torin({ present: true })], sceneFacts: { ...ck().sceneFacts, present: ['Torin'] } as GameState['sceneFacts'] });
    const gm = `${prose} "${torinLines[0]}," Torin said.`;
    const after = recordSpokenTopics(state.npcMemories!, ['Torin'], ['want'], gm, 12, [{ speakerId: 'torin', speaker: 'Torin', words: torinLines[0]! }]);
    expect(after[0]!.motiveUsed).toEqual([torinLines[0]]);
    const next = motiveAnswer({ ...state, npcMemories: after }, ['Torin'])!;
    expect(next.spoken.words).toBe(torinLines[1]);
  });

  it('a group with no lines gets nothing landed (no canned refusal)', async () => {
    const state = ck({ currentLocation: 'the road' });
    const thugPacket = { refEnum: [{ id: 'g1', klass: 'person', display: 'thugs' }] } as unknown as CompletedEventPacket;
    const playerInput = 'Talk to the thugs';
    const turn = { prose, path: 'json-partial', outcome: 'accepted', problems: [], remaining: [], firstDraft: prose } as unknown as WriterTurnResult;
    const out = await repairMissingAnswer(turn, {
      packet: thugPacket,
      check: { state, playerInput, intent: parsePlayerIntent(playerInput, state), engineFact: '', previousGm: '' },
      repair: async () => '',
    });
    expect(out.prose).toBe(prose);
    expect(out.prose).not.toMatch(/rather not say/);
  });
});

describe('4 — one path', () => {
  it('sheetAnswerLine no longer exists', () => {
    expect((npcSheet as Record<string, unknown>).sheetAnswerLine).toBeUndefined();
  });
});
