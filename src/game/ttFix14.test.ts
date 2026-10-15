/**
 * tt-fix-14 — one block per item:
 * 1. the hub nudge's speaker is someone here: on an empty stretch nobody mentions anything;
 * 2. a kill told in any words is never rewritten; the engine outcome sentence is added once (q31-RC1);
 * 3. a speech line with its own said-tag and narration paints as written, not cut to the quote.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, NpcMemory } from './types';
import type { LedgerRef } from './completedEventPacket';
import { nudgeIfStuck } from './choiceRanking';
import { terminalFightOutcome } from './engineResult';
import { ignoresTerminalFight, withMissingFightFacts } from './beatCommitGate';
import { parseTokenBeat, renderTokenBeat } from './tokenProse';

function ck(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    turn: 19,
    character: { ...s.character, name: 'Jax' },
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true },
    activeEncounter: null,
    places: [],
    quests: [],
    npcMemories: [],
    sceneFacts: { ...(s.sceneFacts ?? {}), present: [] },
    circling: { stale: {}, lastProgressTurn: 0, nudgeCursor: 3 },
    ...over,
  } as GameState;
}

describe('1 — the hub nudge comes from someone here', () => {
  it('on an empty stretch the nudge names no speaker (lap 18 C T19)', () => {
    const line = nudgeIfStuck(ck({ currentLocation: 'the washed-out road' } as Partial<GameState>)).receipts[0] ?? '';
    expect(line).not.toMatch(/someone nearby/i);
    expect(line).not.toMatch(/ mentions /);
  });

  it('with a person here, that person mentions the place', () => {
    const oskar = { npcId: 'oskar', npcName: 'Oskar the Woodcutter', location: 'Greyhollow Inn' } as unknown as NpcMemory;
    const line = nudgeIfStuck(ck({ currentLocation: 'Greyhollow Inn', npcMemories: [oskar] } as Partial<GameState>)).receipts[0] ?? '';
    expect(line).toMatch(/^Nudge: Oskar the Woodcutter mentions /);
  });
});

describe('2 — "killing it" tells the kill', () => {
  const fact =
    'Fight: VICTORY vs Cave Rat in 3 rounds. The fight is over: Cave Rat is down and cannot fight on. You hit Cave Rat with your shortsword; it goes down.';
  const draft =
    'Jax swung their shortsword and the blade struck the Cave Rat, killing it. The Corridor in Keep Gate answered with sudden silence after the fight. They could see the Cave Rat lying still near the Broken Gate.';

  // q31-RC1: the outcome comes from the engine record; the writer's words are no longer tested for it.
  it('the first draft of lap 18 A T14 commits as written, with the engine outcome added once', () => {
    expect(terminalFightOutcome(fact)?.outcome).toBe('victory');
    const s = ck({ completedEvent: { engineResult: fact } } as unknown as Partial<GameState>);
    expect(ignoresTerminalFight(s, draft)).toBe(false);
    const out = withMissingFightFacts(s, draft, { who: 'Jax', him: 'them' });
    expect(out.startsWith(draft)).toBe(true);
    expect(withMissingFightFacts(s, out, { who: 'Jax', him: 'them' })).toBe(out);
  });

  it('a kill told in unlisted words ("lay quiet") is not rewritten or doubled', () => {
    const s = ck({ completedEvent: { engineResult: fact } } as unknown as Partial<GameState>);
    const quiet = 'Jax brought the blade down and the thing lay quiet.';
    expect(ignoresTerminalFight(s, quiet)).toBe(false);
    const out = withMissingFightFacts(s, quiet, { who: 'Jax', him: 'them' });
    expect(out.startsWith(quiet)).toBe(true);
    expect(out.match(/went down and did not get up/g)?.length).toBe(1);
  });
});

describe('3 — a speech line keeps its narration', () => {
  const refs: LedgerRef[] = [
    { tok: 't1', id: 'here', display: 'Greyhollow Graveyard', klass: 'place' },
    { tok: 't7', id: 'present:tilde-rudd', display: 'Tilde Rudd', klass: 'person' },
  ];
  const wire = (text: string, speaker: string | null = null) =>
    JSON.stringify({
      refs: [{ tok: 't1', id: 'here', use: 'place' }, { tok: 't7', id: 'present:tilde-rudd', use: 'actor' }],
      lines: [{ fn: 'speech', text, speaker_tok: speaker }],
    });

  it('the said-tag with narration paints as the writer wrote it (lap 18 B T19)', () => {
    const beat = parseTokenBeat(wire('"Look there," @t7 said softly, and pointed at the third grave, where a thin line of pale dust was drifting up.'))!;
    const prose = renderTokenBeat(beat, refs);
    expect(prose).toBe('"Look there," Tilde Rudd said softly, and pointed at the third grave, where a thin line of pale dust was drifting up.');
    expect(beat.lines[0]!.spoken).toBe(true);
    expect(beat.lines[0]!.speaker_tok).toBe('t7');
  });

  it('a bare tag still paints as a said line', () => {
    const beat = parseTokenBeat(wire('"Look there," @t7 said.'))!;
    expect(renderTokenBeat(beat, refs)).toBe('Tilde Rudd said, "Look there."');
    const typed = parseTokenBeat(wire('"Look there."', 't7'))!;
    expect(renderTokenBeat(typed, refs)).toBe('Tilde Rudd said, "Look there."');
  });
});
