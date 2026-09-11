/**
 * 11b — cover who/why is spoken, mode-safe, and "pull me here" is not an item.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import {
  coverContinuePads,
  openingCastLabel,
  openingWhoAskLine,
} from './openingEstablishment';
import { stitchOpeningContinue } from './openingStitch';
import { shouldSkipHardGate, validateActionHard } from './actionValidation';
import { findHardItemUseClaims } from './suggestionValidation';
import type { GameState } from './types';

function cathedral(): GameState {
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

function greyhollow(): GameState {
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

function thornferry(): GameState {
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

describe('playtest11b — cover talk spoken + mode lock', () => {
  it('HUD/BUILD are 2026-09-11b and Mid writer stays OFF', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-09-11b');
    expect(BUILD_STAMP).toBe('2026-09-11b');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('cathedral who-ask is spoken, not is-the-one-asking', () => {
    const text = stitchOpeningContinue(cathedral(), 'Who are you?');
    expect(openingCastLabel(cathedral())).toMatch(/chanter|robed|priest|handler/i);
    expect(text).toMatch(/answer(?:s)? you/i);
    expect(text).toMatch(/"/);
    expect(text).not.toMatch(/is the one asking/i);
    expect(openingWhoAskLine(cathedral())).toMatch(/Pactborn|Handler|Mark/i);
  });

  it('Greyhollow who-ask never prints Pactborn', () => {
    expect(openingCastLabel(greyhollow())).toMatch(/innkeep|Aldous/i);
    const text = stitchOpeningContinue(greyhollow(), 'Who are you? Answer me properly.');
    expect(text).toMatch(/answer(?:s)? you|innkeep|Aldous/i);
    expect(text).toMatch(/"/);
    expect(text).not.toMatch(/Pactborn|Calamity Mark|is the one asking/i);
  });

  it('Thornferry who-ask is Wren, not the panel', () => {
    expect(openingCastLabel(thornferry())).toMatch(/Wren/i);
    const text = stitchOpeningContinue(thornferry(), "What's your name?");
    expect(text).toMatch(/Wren/i);
    expect(text).toMatch(/"/);
    expect(text).not.toMatch(/the panel is the one asking|panel answers you/i);
  });

  it('pull me here is not an invented item', () => {
    const line = 'Where am I? Who are you people? Why did you pull me here?';
    expect(findHardItemUseClaims(line, cathedral())).toEqual([]);
    expect(shouldSkipHardGate(line, cathedral())).toBe(true);
    expect(validateActionHard(line, cathedral(), '').valid).toBe(true);
  });

  it('Who chip starves after a who-ask', () => {
    const asked = {
      ...cathedral(),
      log: [
        { id: 'p', turn: 2, role: 'player' as const, content: 'Who are you?', timestamp: 2 },
      ],
    };
    expect(coverContinuePads(asked).join(' ')).not.toMatch(/Who are you/i);
  });
});
