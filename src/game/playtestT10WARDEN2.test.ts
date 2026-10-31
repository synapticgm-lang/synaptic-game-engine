/**
 * T10WARDEN2 — Warden v2: repeated ambient/NPC lines, bare quote stubs,
 * nobody-to-answer after fights / without a question, same-act pad demotion.
 * Evidence: big-picture-review-31oct item 1 + QT4; tabletop s9511.
 */
import { describe, expect, it } from 'vitest';
import {
  actResultKey,
  guardFinalProse,
  isBareQuoteFragment,
  playerAskedSpeech,
  WARDEN_V2_LOOKBACK,
} from './semanticLoopDetector';
import { ensureSpokenAnswer } from './spokenAnswer';
import { convertWriterCueFact } from './writerCueLines';
import { normalizeCommittedProse, type DraftCheck } from './writerTurn';
import { chipProgressScore, rankChoices, recordCirclingTurn } from './choiceRanking';
import { parsePlayerIntent } from './intentParser';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import type { GameState } from './types';

function base(over: Partial<GameState> = {}): GameState {
  const s = createInitialState('t10warden2', 'dnd') as GameState;
  return {
    ...s,
    turn: 12,
    currentLocation: 'Greyhollow Inn',
    character: { ...s.character, name: 'Jax' },
    openingEstablishment: { complete: true, sceneWritten: true },
    log: [],
    sceneFacts: { present: ['Wenna Barrow', 'the innkeep'] },
    npcMemories: [
      {
        npcId: 'wenna',
        npcName: 'Wenna Barrow',
        disposition: 'neutral',
        facts: [],
        lastSeenTurn: 10,
        aliases: ['the innkeep'],
        location: 'Greyhollow Inn',
      },
    ],
    ...over,
  } as GameState;
}

function checkOf(state: GameState, playerInput: string, engineFact = ''): DraftCheck {
  return {
    state,
    playerInput,
    intent: parsePlayerIntent(playerInput, state),
    engineFact,
    previousGm: '',
  };
}

describe('T10WARDEN2 fragment + speech ask helpers', () => {
  it('flags mid-clause quote stubs from s9511', () => {
    expect(isBareQuoteFragment('to be believed')).toBe(true);
    expect(isBareQuoteFragment('someone to take the job')).toBe(true);
    expect(isBareQuoteFragment('I like a quiet town where folk get along.')).toBe(false);
    expect(isBareQuoteFragment('Keep your kit.')).toBe(false);
  });

  it('playerAskedSpeech: Fight/Look are not asks; Ask/quote are', () => {
    expect(playerAskedSpeech('Attack')).toBe(false);
    expect(playerAskedSpeech('Look around')).toBe(false);
    expect(playerAskedSpeech('Ask what they want')).toBe(true);
    expect(playerAskedSpeech('Who are you?')).toBe(true);
    expect(playerAskedSpeech('Say "hello" to Wenna')).toBe(true);
  });

  it('WARDEN_V2_LOOKBACK is 5', () => {
    expect(WARDEN_V2_LOOKBACK).toBe(5);
  });
});

describe('T10WARDEN2 guardFinalProse (last-step, no model)', () => {
  it('drops ambient line already used in last ~5 (innkeep wiped spot)', () => {
    const ambient = 'The innkeep wiped the same clean spot.';
    const recent = [
      `Jax sat. ${ambient}`,
      'Rain hit the glass.',
      `Wenna nodded. ${ambient}`,
      'A mug clinked.',
      `Someone coughed. ${ambient}`,
    ];
    const draft = `Jax ordered ale. ${ambient} The fire popped once.`;
    const out = guardFinalProse(draft, recent, 'Order a drink', { minKeep: 1 });
    expect(out.text).not.toMatch(/wiped the same clean spot/i);
    expect(out.text).toMatch(/ordered ale|fire popped/i);
  });

  it('drops a repeated NPC quote across T11/T12 unless the player asked to repeat', () => {
    const line = 'I like a quiet town where folk get along';
    const recent = [`Wenna Barrow said, "${line}." The mug sat still.`];
    const draft = `Jax leaned in. Wenna Barrow said, "${line}." Rain thickened.`;
    const out = guardFinalProse(draft, recent, 'Wait', { minKeep: 1 });
    expect(out.text).not.toContain(line);
    const keep = guardFinalProse(draft, recent, 'Say that again', { minKeep: 1 });
    expect(keep.text).toContain(line);
  });

  it('drops bare quote fragments (Oskar / Silas stubs)', () => {
    const draft =
      'Oskar said, "to be believed". Silas Thorne said, "someone to take the job". The hall stayed quiet.';
    const out = guardFinalProse(draft, [], 'Look around', { minKeep: 1 });
    expect(out.text).not.toMatch(/to be believed/i);
    expect(out.text).not.toMatch(/someone to take the job/i);
    expect(out.text).toMatch(/hall stayed quiet/i);
  });

  it('drops nobody-to-answer when no question was asked', () => {
    const draft = 'The stalker walked off into the brush. No one was there to answer.';
    const out = guardFinalProse(draft, [], 'Attack', { minKeep: 1 });
    expect(out.text).not.toMatch(/No one was there to answer/i);
    expect(out.text).toMatch(/stalker walked off/i);
  });

  it('drops nobody-to-answer when fightSettled even if the input looks social', () => {
    const draft = 'The beast dropped them flat and walked off. No one was there to answer.';
    const out = guardFinalProse(draft, [], 'Ask Wilds Stalker to stabilise you', {
      fightSettled: true,
      minKeep: 1,
    });
    expect(out.text).not.toMatch(/No one was there to answer/i);
  });

  it('keeps nobody-to-answer when the player actually asked into an empty room', () => {
    const draft = 'Jax called into the dark. No one was there to answer.';
    const out = guardFinalProse(draft, [], 'Call out "Anyone home?"', { minKeep: 1 });
    expect(out.text).toMatch(/No one was there to answer/i);
  });
});

describe('T10WARDEN2 producers', () => {
  it('ensureSpokenAnswer does not append nobody-to-answer after a settled fight with no ask', () => {
    const state = base({
      sceneFacts: {
        ...emptySceneFacts(),
        present: [],
        lastKill: { name: 'Wilds Stalker', remains: true, outcome: 'victory', turn: 12 },
      },
      completedEvent: { justKilled: true, engineResult: 'Fight: VICTORY' } as GameState['completedEvent'],
    });
    const out = ensureSpokenAnswer(
      'The stalker walked off into the brush. No one was there to answer.',
      state,
      'Attack',
    );
    expect(out.prose).not.toMatch(/No one was there to answer/i);
  });

  it('convertWriterCueFact skips nobody-to-answer when Fight is on the same fact', () => {
    const fact =
      'Fight: VICTORY over Wilds Stalker. Must narrate: the foe falls. Speech event: you address the empty scene. No one present to answer.';
    const plain = convertWriterCueFact(fact, 'Jax');
    expect(plain).not.toMatch(/No one was there to answer/i);
  });

  it('normalizeCommittedProse runs Warden v2 on committed beats', () => {
    const state = base({
      log: [
        { id: 'g1', role: 'gm', content: 'The innkeep wiped the same clean spot. A stool scraped.', turn: 10, timestamp: 1 },
        { id: 'p1', role: 'player', content: 'Wait', turn: 11, timestamp: 2 },
        { id: 'g2', role: 'gm', content: 'Rain hit the glass. The innkeep wiped the same clean spot.', turn: 11, timestamp: 3 },
      ],
    });
    const draft =
      'Jax waited by the door. The innkeep wiped the same clean spot. Oskar said, "to be believed".';
    const out = normalizeCommittedProse(draft, checkOf(state, 'Wait'));
    expect(out).not.toMatch(/wiped the same clean spot/i);
    expect(out).not.toMatch(/to be believed/i);
  });
});

describe('T10WARDEN2 same-action pad demotion (never reject free text)', () => {
  it('recordCirclingTurn stores lastDeadActResult; rankChoices rests that chip', () => {
    const before = base({ turn: 10, circling: { stale: {}, lastProgressTurn: 8, lastLocation: 'greyhollow inn' } });
    const after = recordCirclingTurn(
      { ...before, turn: 11 },
      'Inspect the bar',
      ['Nothing new.'],
      before,
    );
    expect(after.circling?.lastDeadActResult).toMatch(/^inspect the bar\|/);
    expect(after.circling?.tried?.['greyhollow inn']?.['inspect the bar']).toBe(11);

    const ranked = rankChoices(after, [
      'Inspect the bar',
      'Ask Wenna Barrow about the keep',
      'Look around',
      'Wait',
    ]);
    expect(ranked.choices[0]).not.toBe('Inspect the bar');
    expect(ranked.notes.some((n) => /same-result|Rested (?:repeat|chip)/i.test(n))).toBe(true);
    // Free text is never rejected — scoring / rest only demotes chips.
    expect(chipProgressScore(after, 'Inspect the bar')).toBeGreaterThan(
      chipProgressScore(after, 'Ask Wenna Barrow about the keep'),
    );
  });

  it('actResultKey is stable for identical action+result', () => {
    expect(actResultKey('Wait', 'Nothing moves.')).toBe(actResultKey('Wait', 'Nothing moves.'));
    expect(actResultKey('Wait', 'Nothing moves.')).not.toBe(actResultKey('Look around', 'Nothing moves.'));
  });
});
