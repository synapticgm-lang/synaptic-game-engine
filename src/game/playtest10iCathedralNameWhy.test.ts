/**
 * 2026-09-10i — Cathedral start: name+why is not a four-word telegram.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import {
  hallTalkAsksWhere,
  hallTalkAsksWant,
  isCoverShapedPlayerLine,
  openingWantLine,
  openingWhoAskLine,
  playerAskedWhyPulled,
  playerGaveNameAndAskedMore,
  shouldStitchOpeningContinue,
} from './openingEstablishment';
import { stitchOpeningContinue } from './openingStitch';
import { resolveOfferedChoices } from './playTranscript';
import { isSilentReceiptAction } from './freeMudPresentation';
import { hasRealGmStory } from './turnAsk';
import type { GameState } from './types';

const LINE =
  'My name is Jax I dont know of this Sevenfold Circle why have you brought me here?';

function cathedral(over: Partial<GameState> = {}): GameState {
  const base = createInitialState('The Summoned Pact', 'litrpg');
  return {
    ...base,
    campaignBibleId: 'summoned-pact',
    currentLocation: 'The Sevenfold Circle under Valespire Cathedral',
    character: { ...base.character, name: 'Jax' },
    turn: 1,
    openingEstablishment: {
      pending: [],
      answers: {
        where: 'The Sevenfold Circle under Valespire Cathedral',
        name: 'Jax',
      },
      complete: true,
      sceneWritten: true,
      mode: 'weave',
      aloneArrival: false,
      pickedHook:
        'Why this happened: They paid for a Pactborn champion to end the Ash Court war. The seventh ring stuttered; the Mark looks wrong.\nOpening offer: Swear the Pact and they will issue travel kit.',
    },
    sceneFacts: emptySceneFacts(1),
    log: [
      {
        id: 't0',
        turn: 0,
        role: 'gm',
        content:
          'Light, then cold stone. You are on your back inside a seven-ring summoning circle under a cathedral vault.',
        timestamp: 1,
      },
    ],
    ...over,
  };
}

describe('playtest10i — cathedral name+why', () => {
  it('HUD/BUILD stay on the 10 line, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toMatch(/^2026-09-1/);
    expect(BUILD_STAMP).toMatch(/^2026-09-1/);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('why-brought and dont-know-of-this are hall talk, not Silent', () => {
    expect(playerAskedWhyPulled(LINE)).toBe(true);
    expect(hallTalkAsksWhere(LINE)).toBe(true);
    expect(playerGaveNameAndAskedMore(LINE)).toBe(true);
    expect(playerGaveNameAndAskedMore('My name is Jax')).toBe(false);
    expect(isCoverShapedPlayerLine(LINE)).toBe(true);
    expect(shouldStitchOpeningContinue(cathedral(), LINE)).toBe(true);
    expect(isSilentReceiptAction(LINE)).toBe(false);
    expect(hallTalkAsksWant('Ask Wren Holt what they want')).toBe(false);
  });

  it('name + why answers the card, not only They have the name Jax', () => {
    const text = stitchOpeningContinue(cathedral(), LINE);
    expect(text).toMatch(/They have the name Jax/i);
    expect(text).toMatch(/You are/i);
    expect(text).toMatch(/Pactborn|Ash Court|war|Mark/i);
    expect(text).not.toBe('They have the name Jax.');
    expect(text.length).toBeGreaterThan(40);
    expect(openingWantLine(cathedral()).length).toBeGreaterThan(8);
  });

  it('who-ask does not claim they have no name when Jax is locked', () => {
    const text = stitchOpeningContinue(cathedral(), 'Who are you? Where am I?');
    expect(text).toMatch(/You are/i);
    expect(text).toMatch(/answer(?:s)? you/i);
    expect(text).toMatch(/"/);
    expect(text).not.toMatch(/is the one asking/i);
    expect(text).not.toMatch(/have not given you a name back/i);
    expect(openingWhoAskLine(cathedral())).not.toMatch(/have not given you a name back/i);
  });

  it('short name-lock telegram still paints as a GM bubble', () => {
    expect(
      hasRealGmStory({
        id: 't2',
        turn: 2,
        role: 'gm',
        content: 'They have the name Jax.',
        timestamp: 2,
      })
    ).toBe(true);
    expect(hasRealGmStory({ id: 'empty', turn: 2, role: 'gm', content: '', timestamp: 2 })).toBe(false);
    expect(
      hasRealGmStory({ id: 'ask', turn: 2, role: 'gm', content: 'What do you do?', timestamp: 2 })
    ).toBe(false);
  });

  it('auto-named page 1 does not pad Check Status / Wait', () => {
    const pads = resolveOfferedChoices(cathedral({ turn: 1, choices: ['Ask what they want'] }));
    expect(pads).toEqual(['Ask what they want']);
    expect(pads.join(' ')).not.toMatch(/Check Status|Wait and watch/i);
  });
});
