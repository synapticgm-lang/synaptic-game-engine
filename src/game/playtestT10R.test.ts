/**
 * T10R — regressions after T10P/T10Q: fallback prose, quote+NPC reply, crafting false positive,
 * absent NPC presence, bare `@` / place paste / invented possessive person.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { parsePlayerSteps, sheetContextFromState } from './intentParser';
import { resolveTypedFreeText } from './typedFreeText';
import { writerEngineResult } from './travelJourney';
import { resolveDowntimeTurn } from './tabletop/downtimeTurn';
import {
  clauseToThirdPerson,
  convertWriterCueFact,
  WRITER_CUE_CHROME,
} from './writerCueLines';
import { classifyTokenLine, collapseEchoedLabel, renderTokenBeat, type TokenBeat } from './tokenProse';
import { ensureSpokenAnswer } from './spokenAnswer';
import type { GameState } from './types';
import type { LedgerRef } from './completedEventPacket';

function innWithOskar(): GameState {
  const s0 = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s0,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    turn: 7,
    currentLocation: 'Greyhollow Inn',
    character: {
      ...s0.character,
      name: 'Jax',
      srd: { speciesId: 'human', classId: 'fighter', skillProfs: [], toolProfs: [] } as unknown as NonNullable<
        GameState['character']
      >['srd'],
    },
    sceneFacts: { ...(s0.sceneFacts ?? {}), present: ['Oskar the Woodcutter', 'Edda Merrow'] },
    npcMemories: [
      {
        npcId: 'oskar',
        npcName: 'Oskar the Woodcutter',
        disposition: 'neutral',
        facts: [],
        lastSeenTurn: 5,
        location: 'Greyhollow Inn',
      },
    ],
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax' },
      complete: true,
      sceneWritten: true,
    },
  } as unknown as GameState;
}

function roadAwayFromPriest(): GameState {
  const s0 = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s0,
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    turn: 7,
    currentLocation: 'On the road between places',
    character: { ...s0.character, name: 'Jax' },
    sceneFacts: { ...(s0.sceneFacts ?? {}), present: [] },
    journey: {
      from: 'a wayside shrine on the Valespire road',
      to: 'Cathedral Close',
      ground: 'back streets',
      legsDone: 1,
      legsTotal: 2,
      terrain: 'streets',
    },
    npcMemories: [
      {
        npcId: 'priest',
        npcName: 'the one frightened priest',
        disposition: 'neutral',
        facts: [],
        lastSeenTurn: 5,
        location: 'a wayside shrine on the Valespire road',
      },
    ],
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax' },
      complete: true,
      sceneWritten: true,
    },
  } as unknown as GameState;
}

describe('T10R fallback narration', () => {
  it('Must narrate uses PC name + past tense; gerund adjuncts stay grammatical', () => {
    expect(clauseToThirdPerson('I slide a silver coin across the table', 'Jax')).toMatch(
      /Jax slid a silver coin across the table/i,
    );
    expect(clauseToThirdPerson('rest my fingers on it', 'Jax')).toMatch(/Jax rested their fingers on it/i);
    expect(clauseToThirdPerson('while staring at Oskar', 'Jax')).toMatch(/Jax stared at Oskar/i);
    expect(clauseToThirdPerson('staring at Oskar', 'Jax')).toMatch(/Jax stared at Oskar/i);

    const fact =
      'Must narrate: I slide a silver coin across the table. The story must show this act. Must narrate: rest my fingers on it while staring at Oskar. The story must show this act.';
    // while-gerund stays on the act clause (no while-split) → grammatical adjunct, not "They staring".
    const plain = convertWriterCueFact(fact, 'Jax');
    expect(plain).not.toMatch(WRITER_CUE_CHROME);
    expect(plain).not.toMatch(/\bThey\b/);
    expect(plain).toMatch(/Jax slid/i);
    expect(plain).toMatch(/rested their fingers on it while staring at Oskar/i);
    expect(plain).not.toMatch(/They staring|Jax staring/i);
  });

  it('Talk chip fallback paints an NPC answer beat, never a bare @', () => {
    const fact =
      'Must narrate: Talk to the steward. Speech event: you address the steward. NPC reaction slot open for the steward.';
    const plain = writerEngineResult(fact, 'Jax');
    expect(plain).not.toMatch(WRITER_CUE_CHROME);
    expect(plain).not.toMatch(/(?:^|\s)@+(?:\s|$)/);
    // T10S — exchange beat is silence or content, never empty "answered".
    expect(plain).toMatch(/steward said nothing/i);
  });
});

describe('T10R quote + NPC reply', () => {
  it('typed quote after an act is its own speech step with PC says exactly + reaction', () => {
    // No SRD sheet → free-text path notes the act without rolling (avoids incomplete sheet).
    const state = {
      ...innWithOskar(),
      character: { ...innWithOskar().character!, name: 'Jax', srd: undefined },
    } as unknown as GameState;
    const line =
      'I stand up abruptly and slam my hands on the table. "Oskar, look me in the eye and tell me why that door frame is scratched fresh.';
    const steps = parsePlayerSteps(line, sheetContextFromState(state)).steps;
    expect(steps.some((s) => (s.say ?? '').toLowerCase().includes('look me in the eye'))).toBe(true);
    const typed = resolveTypedFreeText(state, line);
    expect(typed.engineResult).toMatch(/PC says exactly:/i);
    expect(typed.engineResult).toMatch(/NPC reaction slot open for Oskar/i);
    const plain = writerEngineResult(typed.engineResult, 'Jax');
    expect(plain).toMatch(/look me in the eye/i);
    expect(plain).toMatch(/Oskar[^.]{0,40}said nothing/i);
    expect(plain).not.toMatch(/\banswered\b/i);
  });

  it('ensureSpokenAnswer restores an exchange after a Talk stub', () => {
    const state = innWithOskar();
    const out = ensureSpokenAnswer(
      'Jax stepped up to the table and spoke to Oskar the Woodcutter. @',
      state,
      'Talk to Oskar the Woodcutter',
    );
    expect(out.prose).not.toMatch(/(?:^|\s)@+(?:\s|$)/);
    // T10S — motive line when authored, else honest silence (never empty "answered").
    expect(out.prose).toMatch(/Oskar the Woodcutter (?:said nothing|said,)/i);
    expect(out.prose).not.toMatch(/\banswered\b/i);
  });
});

describe('T10R crafting root', () => {
  it('kick / make-noise is not a craft turn', () => {
    const state = innWithOskar();
    const line =
      "I kick the leg of Oskar's table hard enough to make his tankard rattle. \"Alright, you lot, save your stares and listen up!";
    expect(resolveDowntimeTurn(state, line)).toBeNull();
  });

  it('explicit craft verb with a makeable item still enters the craft path', () => {
    const state = {
      ...innWithOskar(),
      gold: 800,
      inventory: [
        { id: 't1', name: "Smith's Tools", quantity: 1, rarity: 'Common', itemType: 'material' },
      ],
      character: {
        ...innWithOskar().character!,
        name: 'Jax',
        gold: 800,
        srd: {
          classId: 'fighter',
          speciesId: 'human',
          backgroundId: 'soldier',
          method: 'standard',
          baseScores: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
          bonus: {},
          skillProfs: [],
          expertise: [],
          languages: ['Common'],
          originFeats: [],
          kitId: 'A',
          source: 'build',
        },
      },
    } as unknown as GameState;
    const hit = resolveDowntimeTurn(state, 'Craft Plate Armor');
    expect(hit).not.toBeNull();
    expect(hit!.receipts[0]).toMatch(/^Crafting: Plate Armor/);
  });
});

describe('T10R absent NPC by presence', () => {
  it('pebble toss / wink at the priest while underway records no one present', () => {
    const state = roadAwayFromPriest();
    const toss =
      "I squat down and pick up a single pebble, tossing it gently toward the priest's feet to see if he flinches.";
    const typed = resolveTypedFreeText(state, toss);
    expect(typed.engineResult).toMatch(/No one present to answer/i);
    expect(typed.engineResult).not.toMatch(/NPC reaction slot open for/i);

    const wink =
      'I whistle a jaunty tune and give the priest a slow, exaggerated wink. "Nice reflexes, but I bet you can\'t catch this one.';
    const typed2 = resolveTypedFreeText(state, wink);
    expect(typed2.engineResult).toMatch(/No one present to answer/i);
  });
});

describe('T10R token paint', () => {
  it('bare @ hook lines are rejected; place short-form + on + full display collapses', () => {
    const beat: TokenBeat = {
      refs: [{ tok: 't7', id: 'cast:the-steward', use: 'speaker' }],
      lines: [{ fn: 'hook', text: '@', speaker_tok: 't7' }],
    };
    const refs: LedgerRef[] = [
      { tok: 't7', id: 'cast:the-steward', display: 'the steward', klass: 'person' },
    ];
    expect(classifyTokenLine(beat.lines[0]!, beat, refs).ok).toBe(false);

    const painted = collapseEchoedLabel(
      'Jax left the shrine on a wayside shrine on the Valespire road behind them',
      'a wayside shrine on the Valespire road',
    );
    expect(painted).not.toMatch(/the shrine on a wayside shrine/i);
    expect(painted).toMatch(/a wayside shrine on the Valespire road/i);

    const driverBeat: TokenBeat = {
      refs: [{ tok: 't6', id: 'cast:the-one-frightened-priest', use: 'actor' }],
      lines: [
        {
          fn: 'hook',
          text: "The careful driver's hand lay nearer the axe than the priest's.",
        },
      ],
    };
    const driverRefs: LedgerRef[] = [
      {
        tok: 't6',
        id: 'cast:the-one-frightened-priest',
        display: 'the one frightened priest',
        klass: 'person',
      },
    ];
    expect(
      classifyTokenLine(driverBeat.lines[0]!, driverBeat, driverRefs, [
        'the one frightened priest',
        'Jax',
      ]).ok,
    ).toBe(false);

    const rendered = renderTokenBeat(
      {
        refs: [{ tok: 't1', id: 'place:a-wayside-shrine-on-the-valespire-road', use: 'place' }],
        lines: [
          {
            fn: 'action',
            text: 'Jax left the shrine on @t1 behind them.',
          },
          { fn: 'hook', text: '@' },
        ],
      },
      [
        {
          tok: 't1',
          id: 'place:a-wayside-shrine-on-the-valespire-road',
          display: 'a wayside shrine on the Valespire road',
          klass: 'place',
        },
      ],
    );
    expect(rendered).not.toMatch(/(?:^|\s)@+(?:\s|$)/);
    expect(rendered).not.toMatch(/the shrine on a wayside shrine/i);
  });
});
