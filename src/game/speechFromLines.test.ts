/**
 * s73 H + J — a writer speech line is a speaker ref and the spoken words; code paints the tag and quote marks,
 * and the said record binds by the declared speaker, not by quote pairing over prose.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { CompletedEventPacket, LedgerRef } from './completedEventPacket';
import { applySocialLedgerTurn } from './npcMemory';
import { harvestNarrativeIntoLedger } from './narrativeHarvest';
import { acceptTokenOrLedgerStory, classifyTokenLine, parseTokenBeat } from './tokenProse';
import type { GameState, NpcMemory } from './types';

const T12_RAW = String.raw`{"refs":[{"tok":"t1","id":"here","use":"place"},{"tok":"t2","id":"extra:osric-coyne","use":"speaker"}],"lines":[{"fn":"action","text":"Jax crossed the packed dirt between the stalls and stopped in front of Osric Coyne's table, where a dented kettle and three cracked radios sat waiting for buyers."},{"fn":"speech","text":"\"@t2 said, \\\"Back again, Jax. Most folks come once, buy nothing, and never find this row a second time.\\\"\""},{"fn":"action","text":"Osric wiped his hands on his apron and looked Jax up and down like he was weighing a sack of grain."},{"fn":"speech","text":"\"@t2 said, \\\"So what is it you actually want? I move junk, not secrets, but I hear things while I sell.\\\"\""},{"fn":"hook","text":"Behind the stalls, Maud Pike set down her hammer and watched the two of them without pretending not to."}]}`;

const T12_GM = String.raw`Jax crossed the packed dirt between the stalls and stopped in front of Osric Coyne's table, where a dented kettle and three cracked radios sat waiting for buyers. "Osric said, \"Back again, Jax. Most folks come once, buy nothing, and never find this row a second time.\"" Osric wiped his hands on his apron and looked Jax up and down like he was weighing a sack of grain. "Osric said, \"So what is it you actually want? I move junk, not secrets, but I hear things while I sell.\"" Behind the stalls, Maud Pike set down her hammer and watched the two of them without pretending not to.`;

const BACK = 'Back again, Jax. Most folks come once, buy nothing, and never find this row a second time.';
const WANT = 'So what is it you actually want? I move junk, not secrets, but I hear things while I sell.';

const person = (npcName: string): NpcMemory =>
  ({
    npcId: npcName.toLowerCase().replace(/\s+/g, '-'),
    npcName,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 11,
    met: true,
    introSpoken: true,
    location: 'Lowmarket',
  }) as NpcMemory;

function base(present: string[] = ['Osric Coyne', 'Maud Pike']): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    seed: 'seed73',
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    character: { ...s.character!, name: 'Jax' },
    currentLocation: 'Lowmarket',
    worldAtlas: null,
    activeEncounter: null,
    activeDungeon: null,
    journey: null,
    quests: [],
    places: [{ id: 'lowmarket', name: 'Lowmarket' }],
    npcMemories: [person('Osric Coyne'), person('Maud Pike')],
    companions: [],
    log: [],
    turn: 12,
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true } as GameState['openingEstablishment'],
    sceneFacts: { ...s.sceneFacts!, crowd: 'present', present },
  } as GameState;
}

const ENUM: LedgerRef[] = [
  { tok: 't1', id: 'here', display: 'Lowmarket', klass: 'place' },
  { tok: 't2', id: 'extra:osric-coyne', display: 'Osric Coyne', klass: 'person' },
  { tok: 't3', id: 'extra:maud-pike', display: 'Maud Pike', klass: 'person' },
];
const packet = { refEnum: ENUM } as unknown as CompletedEventPacket;

describe('s73 — speech line shape', () => {
  it('parse reads the wrapped, escaped line into plain words and the speaker ref', () => {
    const beat = parseTokenBeat(T12_RAW)!;
    const speech = beat.lines.filter((l) => l.fn === 'speech');
    expect(speech).toEqual([
      { fn: 'speech', text: BACK, speaker_tok: 't2', spoken: true },
      { fn: 'speech', text: WANT, speaker_tok: 't2', spoken: true },
    ]);
  });

  it('the painter owns the tag and the quote marks: no backslash, one quote pair per line, tag outside', () => {
    const out = acceptTokenOrLedgerStory(T12_RAW, base(), packet);
    expect(out.path).toBe('json');
    expect(out.prose).not.toContain('\\');
    expect(out.prose).toContain(`Osric Coyne said, "${BACK}"`);
    expect(out.prose).toContain(`Osric Coyne said, "${WANT}"`);
    expect((out.prose.match(/"/g) ?? []).length).toBe(4);
    expect(out.speech).toEqual([
      { speakerId: 'extra:osric-coyne', speaker: 'Osric Coyne', words: BACK },
      { speakerId: 'extra:osric-coyne', speaker: 'Osric Coyne', words: WANT },
    ]);
  });

  it('a speech line that still holds a backslash after parse is rejected', () => {
    const raw = String.raw`{"refs":[{"tok":"t2","id":"extra:osric-coyne","use":"speaker"}],"lines":[{"fn":"speech","speaker_tok":"t2","text":"Back again\\n, Jax."}]}`;
    const beat = parseTokenBeat(raw)!;
    expect(beat.lines[0]!.text).toContain('\\');
    expect(classifyTokenLine(beat.lines[0]!, beat, ENUM, ['Jax'])).toEqual({ ok: false, reason: 'speech-shape' });
  });
});

describe('s73 — said record binds by the declared speaker', () => {
  const said = (s: GameState, name: string) => s.npcMemories?.find((m) => m.npcName === name)?.said ?? [];

  for (const [label, gm] of [['rendered prose', ''], ['the s73 committed text', T12_GM]] as const) {
    it(`Osric holds both lines, Maud nothing, no narration (${label})`, () => {
      const accepted = acceptTokenOrLedgerStory(T12_RAW, base(), packet);
      const s = applySocialLedgerTurn({
        state: base(),
        playerAction: 'Talk to Osric Coyne',
        turn: 12,
        talkTopics: [],
        gmText: gm || accepted.prose,
        speechLines: accepted.speech,
      });
      expect(said(s, 'Osric Coyne').map((l) => l.line)).toEqual([BACK, WANT]);
      expect(said(s, 'Maud Pike')).toEqual([]);
      const all = (s.npcMemories ?? []).flatMap((m) => m.said ?? []).map((l) => l.line);
      expect(all.some((l) => l.includes('\\'))).toBe(false);
      expect(all.some((l) => l.includes('wiped his hands'))).toBe(false);
    });
  }
});

describe('s73 — harvest keeps present to the people here', () => {
  it('the Turn 12 text adds neither Osric nor Jax to present', () => {
    const s = harvestNarrativeIntoLedger(base(), T12_GM, 12);
    const present = s.sceneFacts?.present ?? [];
    expect(present).not.toContain('Osric');
    expect(present).not.toContain('Jax');
    expect(present).toEqual(expect.arrayContaining(['Osric Coyne', 'Maud Pike']));
  });

  it('a bare first name already on present folds into the full-name person; the player leaves present', () => {
    const s = harvestNarrativeIntoLedger(base(['Osric Coyne', 'Maud Pike', 'Osric', 'Jax']), T12_GM, 12);
    const present = s.sceneFacts?.present ?? [];
    expect(present).not.toContain('Osric');
    expect(present).not.toContain('Jax');
    expect(present.filter((p) => p === 'Osric Coyne')).toHaveLength(1);
  });
});
