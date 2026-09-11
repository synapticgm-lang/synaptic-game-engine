/**
 * 11f — ledger deficit trap: write unlocked name after covers;
 * hall topics by inclusion; leftover ask same turn.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import {
  applyOpeningAnswer,
  extractGivenName,
  hallTalkAsksRefuse,
  hallTalkAsksWant,
  shouldStitchOpeningContinue,
} from './openingEstablishment';
import { stitchOpeningContinue } from './openingStitch';
import { isSilentReceiptAction } from './freeMudPresentation';
import type { GameState } from './types';

function saltDoneUnnamed(): GameState {
  const base = createInitialState('Salt Road Heist', 'rpg');
  return {
    ...base,
    campaignBibleId: 'salt-road-heist',
    engineMode: 'rpg',
    currentLocation: 'a Salt Road tavern hire',
    character: { ...base.character, name: '' },
    openingEstablishment: {
      pending: [],
      answers: { where: 'a Salt Road tavern hire' },
      complete: true,
      sceneWritten: true,
      mode: 'weave',
      aloneArrival: false,
      pickedHook: 'Location: a Salt Road tavern hire\nWho is here / who summoned: Vessa',
    },
    sceneFacts: emptySceneFacts(1),
  };
}

function cathedralNamed(): GameState {
  const base = createInitialState('The Summoned Pact', 'litrpg');
  return {
    ...base,
    campaignBibleId: 'summoned-pact',
    engineMode: 'litrpg',
    currentLocation: 'The Sevenfold Circle under Valespire Cathedral',
    character: { ...base.character, name: 'Jax' },
    openingEstablishment: {
      pending: [],
      answers: { where: 'The Sevenfold Circle under Valespire Cathedral', name: 'Jax' },
      complete: true,
      sceneWritten: true,
      mode: 'weave',
      aloneArrival: false,
      pickedHook:
        'Location: The Sevenfold Circle under Valespire Cathedral\nWho is here / who summoned: Robed figures and a chanter\nWhy this happened: They paid for a Pactborn champion.',
    },
    sceneFacts: emptySceneFacts(1),
  };
}

function greyhollowNamed(): GameState {
  const base = createInitialState('Cursed Keep', 'dnd');
  return {
    ...base,
    campaignBibleId: 'cursed-keep',
    engineMode: 'dnd',
    currentLocation: 'Greyhollow tavern common room',
    character: { ...base.character, name: 'Jax' },
    openingEstablishment: {
      pending: [],
      answers: { where: 'Greyhollow tavern common room', name: 'Jax' },
      complete: true,
      sceneWritten: true,
      mode: 'weave',
      aloneArrival: false,
      pickedHook: 'Location: Greyhollow tavern common room\nWho is here: the innkeep and a quiet room',
    },
    sceneFacts: emptySceneFacts(1),
  };
}

function millNamed(): GameState {
  const base = createInitialState('Thornferry Road', 'pyoa');
  return {
    ...base,
    campaignBibleId: 'thornferry-road',
    engineMode: 'pyoa',
    currentLocation: 'the mill landing at Thornferry',
    character: { ...base.character, name: 'Jax' },
    openingEstablishment: {
      pending: [],
      answers: { where: 'the mill landing at Thornferry', name: 'Jax' },
      complete: true,
      sceneWritten: true,
      mode: 'plunge',
      aloneArrival: false,
      pickedHook: 'Location: mill landing\nWho is here: Wren Holt waits with a sealed charter',
    },
    sceneFacts: emptySceneFacts(1),
  };
}

describe('playtest11f — ledger deficit + topic inclusion', () => {
  it('HUD/BUILD are 11f, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-09-11f');
    expect(BUILD_STAMP).toBe('2026-09-11f');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('harvests spoken names and rejects refuse / kit / species tokens', () => {
    expect(extractGivenName('My name is Jax.')).toBe('Jax');
    expect(extractGivenName('Call me Ren')).toBe('Ren');
    expect(extractGivenName('Jax I guess')).toBe('Jax');
    expect(extractGivenName("I'm not telling you")).toBeNull();
    expect(extractGivenName('Check what I am carrying')).toBeNull();
    expect(extractGivenName("I'm human")).toBeNull();
  });

  it('writes Jax after covers even when the name chip queue is empty', async () => {
    const { state, generateOpening, deferToPlay } = await applyOpeningAnswer(
      saltDoneUnnamed(),
      'My name is Jax.'
    );
    expect(generateOpening).toBe(true);
    expect(deferToPlay).toBe(true);
    expect(state.character.name).toBe('Jax');
    expect(state.openingEstablishment?.answers.name).toBe('Jax');
    const text = stitchOpeningContinue(state, 'My name is Jax.');
    expect(text).toMatch(/have the name Jax/i);
  });

  it('does not overwrite a locked name', async () => {
    const { state } = await applyOpeningAnswer(cathedralNamed(), 'Call me Ren');
    expect(state.character.name).toBe('Jax');
    expect(state.openingEstablishment?.answers.name).toBe('Jax');
  });

  it('want inclusion catches actually-want; I-want-to-leave is not hall want', () => {
    expect(hallTalkAsksWant('What do you actually want from me?')).toBe(true);
    expect(hallTalkAsksWant("What's your actual deal?")).toBe(true);
    expect(hallTalkAsksWant('I want to leave')).toBe(false);
    expect(shouldStitchOpeningContinue(saltDoneUnnamed(), 'What do you actually want from me?')).toBe(
      true
    );
  });

  it('Wait+refuse is hall refuse, not Silent', () => {
    const line = 'Wait and see what happens if I refuse';
    expect(hallTalkAsksRefuse(line)).toBe(true);
    expect(hallTalkAsksRefuse('Refuse to give a name')).toBe(false);
    expect(shouldStitchOpeningContinue(greyhollowNamed(), line)).toBe(true);
    expect(isSilentReceiptAction(line)).toBe(false);
    expect(isSilentReceiptAction('Wait')).toBe(true);
    expect(shouldStitchOpeningContinue(greyhollowNamed(), 'Wait')).toBe(false);
  });

  it('name plus leftover ask writes the name and answers the other topic', async () => {
    const { state } = await applyOpeningAnswer(
      saltDoneUnnamed(),
      "My name is Jax. What's your actual deal?"
    );
    expect(state.character.name).toBe('Jax');
    const text = stitchOpeningContinue(state, "My name is Jax. What's your actual deal?");
    expect(text).toMatch(/have the name Jax/i);
    expect(text).toMatch(/want|have not said what they want/i);
  });

  it('kit inspect is a carry receipt, not identity + want reprint', () => {
    const text = stitchOpeningContinue(cathedralNamed(), 'Check what I am carrying');
    expect(text).toMatch(/arrived with|nothing new is in your hands/i);
    expect(text).not.toMatch(/Pactborn|Handler\. You came through|answers you/i);
    expect(shouldStitchOpeningContinue(cathedralNamed(), 'Check what I am carrying')).toBe(true);
    expect(isSilentReceiptAction('Check what I am carrying')).toBe(false);
  });

  it('Look/Wait still skip stitch; Greyhollow/Salt do not invent a panel on search', () => {
    expect(shouldStitchOpeningContinue(greyhollowNamed(), 'Look around')).toBe(false);
    expect(shouldStitchOpeningContinue(saltDoneUnnamed(), 'Look around')).toBe(false);
    expect(stitchOpeningContinue(greyhollowNamed(), 'Look around')).not.toMatch(/panel still shows/i);
    expect(stitchOpeningContinue(millNamed(), 'Look around')).not.toMatch(/panel still shows/i);
  });
});
