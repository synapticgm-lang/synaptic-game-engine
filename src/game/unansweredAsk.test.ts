import { describe, expect, it } from 'vitest';
import {
  gmBeatAnswersPlayerAsk,
  isOfferOnlyUnansweredBeat,
  isUnresolvedActionNarrative,
} from './actionResolution';
import { padChoicesToCount } from './choicePipeline';
import { createInitialState } from './defaults';
import { extractChoiceLines, looksLikeChoiceOffer, stripChoiceList } from './parser';
import { applyStanceDensity } from './stanceDensity';
import type { PlayerIntent } from './intentParser';

const TALK: PlayerIntent = { kind: 'talk', label: 'Talk', targets: [] };

describe('extractChoiceLines — in-prose options become chips', () => {
  it('extracts a singleton "1. Ask the elder…" line as a choice', () => {
    const prose = `The elder's eyes narrow over the ward-light.

1. Ask the elder to elaborate on what he means by a 'fractured' energy signature.`;
    const choices = extractChoiceLines(prose);
    expect(choices.some((c) => /ask the elder to elaborate/i.test(c))).toBe(true);
    expect(looksLikeChoiceOffer(choices[0] ?? '')).toBe(true);
  });

  it('strips leftover numbered menu text from the body', () => {
    const prose = `The elder's eyes narrow.

1. Ask the elder to elaborate on what he means by a 'fractured' energy signature.`;
    const stripped = stripChoiceList(prose);
    expect(stripped).toMatch(/elder's eyes narrow/i);
    expect(stripped).not.toMatch(/1\.\s*Ask the elder/i);
  });

  it('lifts a blue-system "Inquire about…" offer into a choice and strips it', () => {
    const prose = `The court waits.
<system>Inquire about the 'unique' nature of your arrival.</system>`;
    const choices = extractChoiceLines(prose);
    expect(choices.some((c) => /inquire about the ['']unique[''] nature/i.test(c))).toBe(true);
    const stripped = stripChoiceList(prose);
    expect(stripped).not.toMatch(/inquire about/i);
    expect(stripped).toMatch(/court waits/i);
  });
});

describe('unanswered player ask', () => {
  it('treats player question + GM "you could inquire" as unanswered', () => {
    const player = "What do you mean by a fractured energy signature?";
    const gm =
      "The court is quiet. You could inquire about the 'unique' nature of your arrival.";
    expect(isOfferOnlyUnansweredBeat(gm)).toBe(true);
    expect(gmBeatAnswersPlayerAsk(player, gm)).toBe(false);
    expect(isUnresolvedActionNarrative(player, gm, TALK)).toBe(true);
  });

  it('counts a spoken in-world answer as resolved', () => {
    const player = "What do you mean by a fractured energy signature?";
    const gm =
      'The elder\'s mouth tightens. He says, "Fractured means the Circle\'s wards split when you arrived — two signatures, not one."';
    expect(isOfferOnlyUnansweredBeat(gm)).toBe(false);
    expect(gmBeatAnswersPlayerAsk(player, gm)).toBe(true);
    expect(isUnresolvedActionNarrative(player, gm, TALK)).toBe(false);
  });
});

describe('conversation beat — not look-around only', () => {
  it('does not leave Inspect the immediate surroundings as the only real chip', () => {
    const state = createInitialState('The Summoned Pact', 'litrpg');
    state.turn = 4;
    state.currentLocation = 'The Sevenfold Circle';
    state.npcMemories = [
      {
        npcId: 'elder-1',
        npcName: 'the elder',
        disposition: 'neutral',
        facts: ['spoke of a fractured energy signature'],
        lastSeenTurn: 3,
      },
    ];
    const story = 'The elder watches you. His voice is dry as parchment.';
    const lastAsk = "What do you mean by a fractured energy signature?";
    const chips = padChoicesToCount(
      ['Inspect the immediate surroundings'],
      state,
      story,
      3,
      lastAsk
    );
    const inspectOnly =
      chips.length === 1 && /inspect the immediate surroundings/i.test(chips[0] ?? '');
    expect(inspectOnly).toBe(false);
    expect(chips.some((c) => /inspect the immediate surroundings/i.test(c))).toBe(false);
    expect(chips.some((c) => /ask|talk|refuse|walk/i.test(c))).toBe(true);

    const stance = applyStanceDensity(
      ['Inspect the immediate surroundings'],
      state,
      story,
      lastAsk
    );
    expect(stance.some((c) => /inspect the immediate surroundings/i.test(c))).toBe(false);
    expect(stance.length).toBeGreaterThanOrEqual(2);
  });
});
