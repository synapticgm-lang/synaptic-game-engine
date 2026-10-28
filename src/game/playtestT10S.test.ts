/**
 * T10S — PC acts not mirrored onto NPCs; no empty "answered"; sip is not loot; articles on props.
 */
import { describe, expect, it } from 'vitest';
import { looksLikeSteal, resolveStealAttempt } from './stealParley';
import { convertWriterCueFact, engineFactForRepair, clauseToThirdPerson } from './writerCueLines';
import { writerEngineResult } from './travelJourney';
import { parseTokenBeat, renderTokenBeat, type TokenBeat } from './tokenProse';
import { ensureSpokenAnswer } from './spokenAnswer';
import { givePcTheirQuote, stripUnauthorizedNpcSpeech, type IntentStep } from './intentParser';
import type { GameState } from './types';
import type { LedgerRef } from './completedEventPacket';

const base = (): GameState =>
  ({
    turn: 3,
    seed: 't10s',
    engineMode: 'dnd',
    character: {
      name: 'Jax',
      hp: 10,
      maxHp: 10,
      level: 1,
      xp: 0,
      xpToNext: 100,
      attributes: { DEX: 12, WIS: 10 },
    },
    inventory: [],
    sceneFacts: { present: ['Silas Thorne'], props: ['wrapped relic', 'cup'] },
    npcMemories: [
      {
        npcId: 'silas',
        npcName: 'Silas Thorne',
        disposition: 'neutral',
        facts: [],
        lastSeenTurn: 1,
        location: 'Greyhollow Church',
        present: true,
        met: true,
      },
    ],
    currentLocation: 'Greyhollow Church',
  }) as unknown as GameState;

describe('T10S steal / sip', () => {
  it('take a sip from the cup is not a steal and does not gain an item named sip', () => {
    const line = 'I take a sip from the cup and ask the cultist if they know how to get out of here.';
    const step = { action: 'take', clause: line, target: 'sip' } as IntentStep;
    expect(looksLikeSteal(line, step)).toBe(false);
    const out = resolveStealAttempt(base(), line, step);
    expect(out.taken).toBe(false);
    expect((out.state.inventory ?? []).some((i) => /sip/i.test(i.name))).toBe(false);
    expect(out.facts.join(' ')).not.toMatch(/Took the sip/i);
  });
});

describe('T10S reaction / answer content', () => {
  it('reaction-slot fallback never paints empty answered', () => {
    const fact =
      'Must narrate: Talk to Silas. Speech event: you address Silas Thorne. NPC reaction slot open for Silas Thorne.';
    const plain = writerEngineResult(fact, 'Jax');
    expect(plain).not.toMatch(/\banswered\b/i);
    expect(plain).toMatch(/Silas Thorne said nothing/i);
  });

  it('engineFactForRepair drops Must narrate PC acts so repair cannot paste them onto NPCs', () => {
    const fact =
      'Must narrate: I step closer to the altar. The story must show this act. SUCCESS (General check: d20 17 + -1 = 16 vs DC 15) Must narrate: glance at the stone font. PC says exactly: "Did you find anything?" (do not rewrite). Speech event: you address Silas Thorne. NPC reaction slot open for Silas Thorne.';
    const forRepair = engineFactForRepair(fact);
    expect(forRepair).toMatch(/SUCCESS/i);
    expect(forRepair).not.toMatch(/step closer|glance at the stone|Did you find/i);
    expect(forRepair).not.toMatch(/Must narrate|PC says exactly|reaction slot/i);
    const book = convertWriterCueFact(fact, 'Jax');
    expect(book).toMatch(/Jax stepped closer/i);
    expect(book).not.toMatch(/Silas Thorne stepped closer/i);
  });

  it('ensureSpokenAnswer does not append empty answered', () => {
    const out = ensureSpokenAnswer(
      'Jax grabbed Silas Thorne by the collar.',
      base(),
      'I grab Silas by the collar. "Pick your head up, Thorne."',
    );
    expect(out.prose).not.toMatch(/\banswered\b/i);
  });

  it('stripUnauthorizedNpcSpeech rewrites content-free answered to said nothing', () => {
    const out = stripUnauthorizedNpcSpeech(
      'Silas went still in Jax\'s grip, and then he answered. The pew creaked.',
      'I grab Silas by the collar. "Pick your head up, Thorne."',
      'Jax',
    );
    expect(out).not.toMatch(/\banswered\b/i);
    expect(out).toMatch(/said nothing/i);
    expect(out).toMatch(/pew creaked/i);
  });
});

describe('T10S speech ownership + articles', () => {
  it('untagged PC quote is not inferred onto the addressed NPC', () => {
    const raw = JSON.stringify({
      refs: [
        { tok: 't5', id: 'here', use: 'place' },
        { tok: 't6', id: 'present:silas-thorne', use: 'addressed' },
      ],
      lines: [
        { fn: 'action', text: 'Jax stepped closer to the altar.' },
        { fn: 'speech', text: '"Did you find anything in there, Silas?"' },
        { fn: 'react', text: '@t6 looked up slowly.' },
      ],
    });
    const action =
      'I step closer to the altar. "Did you find anything in there, Silas?" I pull my hood down.';
    const beat = parseTokenBeat(raw, action)!;
    const speech = beat.lines.find((l) => l.fn === 'speech')!;
    expect(speech.speaker_tok).toBeFalsy();
    const refs: LedgerRef[] = [
      { tok: 't5', id: 'here', klass: 'place', display: 'Greyhollow Church' },
      { tok: 't6', id: 'present:silas-thorne', klass: 'person', display: 'Silas Thorne' },
    ];
    const prose = renderTokenBeat(beat, refs);
    expect(prose).not.toMatch(/Silas Thorne said,\s*"Did you find/i);
    expect(prose).toMatch(/Did you find anything in there, Silas/i);
  });

  it('givePcTheirQuote matches curly apostrophes', () => {
    const player = "I shove Silas\u2019s shoulder. \"Get up, you useless drunk.\"";
    const prose = 'Silas Thorne said, "Get up, you useless drunk."';
    expect(givePcTheirQuote(prose, player, 'Jax')).toMatch(/^Jax said,/i);
  });

  it('prop token after while/faces still takes an article', () => {
    const refs: LedgerRef[] = [
      { tok: 't8', id: 'present:cult', klass: 'person', display: 'the denied-god cult' },
      { tok: 't10', id: 'prop:wrapped-relic', klass: 'prop', display: 'wrapped relic' },
    ];
    const beat = {
      refs: [
        { tok: 't8', id: 'present:cult', use: 'speaker' as const },
        { tok: 't10', id: 'prop:wrapped-relic', use: 'prop' as const },
      ],
      lines: [
        {
          fn: 'action' as const,
          text: 'Jax looked @t8 over while @t10 sat between them on the floor.',
        },
      ],
    } as TokenBeat;
    const prose = renderTokenBeat(beat, refs);
    expect(prose).toMatch(/while the wrapped relic sat/i);
    expect(prose).not.toMatch(/while wrapped relic sat/i);
  });
});

describe('T10S clause person', () => {
  it('clauseToThirdPerson keeps I→PC without inventing NPC as subject', () => {
    // T10R — Must narrate uses simple past + PC name.
    expect(clauseToThirdPerson('I step closer to the altar', 'Jax')).toMatch(/Jax stepped closer/i);
  });
});
