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
  hallTalkAsksRefuse,
  hallTalkAsksWant,
  openingCastLabel,
  openingWhoAskLine,
} from './openingEstablishment';
import { stitchOpeningContinue } from './openingStitch';
import { shouldSkipHardGate, validateActionHard } from './actionValidation';
import { findHardItemUseClaims } from './suggestionValidation';
import { buildNewGameState, stampOpening } from './fateAutoplay';
import { criticLiveDriveTurn, reopenCoversForLiveDrive } from './liveDrive';
import { getCampaignBibleById } from '@/data/campaigns';
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

function saltHire(): GameState {
  const base = createInitialState('Salt Road Heist', 'rpg');
  return {
    ...base,
    campaignBibleId: 'salt-road-heist',
    engineMode: 'rpg',
    currentLocation: 'a Salt Road tavern hire',
    character: { ...base.character, name: '' },
    openingEstablishment: {
      pending: [{ id: 'name', kind: 'name' as const, question: 'What name should they write?' }],
      answers: { where: 'a Salt Road tavern hire' },
      complete: false,
      sceneWritten: true,
      mode: 'weave',
      aloneArrival: false,
      pickedHook: 'Location: a Salt Road tavern hire\nWho is here / who summoned: Vessa',
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
  it('HUD/BUILD stay on the 11 line, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toMatch(/^2026-09-11/);
    expect(BUILD_STAMP).toMatch(/^2026-09-11/);
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

  it('seed-42 Live Drive who-asks speak, with no Pactborn on tabletop or panel-Wren', () => {
    const cells = [
      { bibleId: 'summoned-pact', mode: 'litrpg' as const, personality: 'cold-system' },
      { bibleId: 'cursed-keep', mode: 'dnd' as const, personality: 'dry-wit' },
      { bibleId: 'salt-road-heist', mode: 'rpg' as const, personality: 'fireside' },
      { bibleId: 'thornferry-road', mode: 'pyoa' as const, personality: 'mission-lead' },
    ];
    for (const cell of cells) {
      const bible = getCampaignBibleById(cell.bibleId);
      expect(bible).toBeTruthy();
      const { state: raw } = buildNewGameState({
        bibleId: cell.bibleId,
        characterName: 'Jax',
        seed: 42,
        personality: cell.personality,
        engineMode: cell.mode,
      });
      const opened = stampOpening(reopenCoversForLiveDrive(raw, bible!));
      const named = {
        ...opened,
        character: { ...opened.character, name: 'Jax' },
        openingEstablishment: {
          ...opened.openingEstablishment!,
          pending: [],
          complete: true,
          answers: { ...(opened.openingEstablishment?.answers ?? {}), name: 'Jax' },
        },
      };
      const who = stitchOpeningContinue(named, 'Who are you? Answer me properly.');
      expect(who, cell.bibleId).toMatch(/"/);
      expect(who, cell.bibleId).not.toMatch(/is the one asking/i);
      if (cell.mode === 'dnd') expect(who).not.toMatch(/Pactborn|Calamity Mark/i);
      if (cell.mode === 'pyoa') expect(who).not.toMatch(/the panel (?:is|answers)/i);
      const flags = criticLiveDriveTurn({
        story: who,
        pads: ['Ask what they want'],
        player: 'Who are you? Answer me properly.',
        prevStories: [],
        coversPending: false,
        nameLocked: 'Jax',
        state: named,
      });
      expect(flags.some((f) => f.code === 'npc-non-answer' || f.code === 'one-line-no-npc'), cell.bibleId).toBe(
        false
      );
    }
  });

  it('Why should I help restates the card want, not the Who quote', () => {
    const want = stitchOpeningContinue(cathedral(), 'Ask what they want');
    const who = stitchOpeningContinue(
      {
        ...cathedral(),
        log: [
          { id: 'p1', turn: 2, role: 'player' as const, content: 'Ask what they want', timestamp: 2 },
          { id: 'g1', turn: 2, role: 'gm', content: want, timestamp: 3 },
        ],
      },
      'Who are you?'
    );
    const help = stitchOpeningContinue(
      {
        ...cathedral(),
        log: [
          { id: 'p1', turn: 2, role: 'player' as const, content: 'Ask what they want', timestamp: 2 },
          { id: 'g1', turn: 2, role: 'gm', content: want, timestamp: 3 },
          { id: 'p2', turn: 3, role: 'player' as const, content: 'Who are you?', timestamp: 4 },
          { id: 'g2', turn: 3, role: 'gm', content: who, timestamp: 5 },
        ],
      },
      'Why should I help you?'
    );
    expect(help).not.toBe(who);
    expect(help).not.toMatch(/Handler\. You came through|I keep this book|is the one asking/i);
    expect(help).not.toMatch(/answers you\.\s+"The /i);
    expect(help).toMatch(/already said it/i);
    expect(help).toMatch(/Pactborn|travel kit|Ash Court/i);
  });

  it('Greyhollow Why-help does not reprint the innkeep Who line', () => {
    const who = stitchOpeningContinue(greyhollow(), 'Who are you?');
    const help = stitchOpeningContinue(
      {
        ...greyhollow(),
        log: [
          { id: 'p', turn: 2, role: 'player' as const, content: 'Who are you?', timestamp: 2 },
          { id: 'g', turn: 2, role: 'gm', content: who, timestamp: 3 },
        ],
      },
      'Why should I help you?'
    );
    expect(help).not.toMatch(/I keep this book/i);
    expect(help).toMatch(/have not said what they want/i);
  });

  it('refuse is not the want slot and does not steal the name chip', () => {
    expect(hallTalkAsksWant('Why should I help you?')).toBe(true);
    expect(hallTalkAsksWant('What happens if I refuse?')).toBe(false);
    expect(hallTalkAsksRefuse('What happens if I refuse?')).toBe(true);
    expect(hallTalkAsksRefuse('if I refuse')).toBe(true);
    expect(hallTalkAsksRefuse('Refuse to give a name')).toBe(false);
    expect(hallTalkAsksWant('Refuse to give a name')).toBe(false);
  });

  it('Why-help then refuse are different sentences on empty-cost cards', () => {
    const who = stitchOpeningContinue(greyhollow(), 'Who are you?');
    const help = stitchOpeningContinue(
      {
        ...greyhollow(),
        log: [
          { id: 'p', turn: 2, role: 'player' as const, content: 'Who are you?', timestamp: 2 },
          { id: 'g', turn: 2, role: 'gm', content: who, timestamp: 3 },
        ],
      },
      'Why should I help you?'
    );
    const refuse = stitchOpeningContinue(
      {
        ...greyhollow(),
        log: [
          { id: 'p', turn: 2, role: 'player' as const, content: 'Who are you?', timestamp: 2 },
          { id: 'g', turn: 2, role: 'gm', content: who, timestamp: 3 },
          { id: 'p2', turn: 3, role: 'player' as const, content: 'Why should I help you?', timestamp: 4 },
          { id: 'g2', turn: 3, role: 'gm', content: help, timestamp: 5 },
        ],
      },
      'What happens if I refuse?'
    );
    expect(help).toMatch(/have not said what they want/i);
    expect(refuse).toMatch(/have not said what happens if you refuse/i);
    expect(refuse).not.toBe(help);
    expect(refuse).not.toMatch(/I keep this book|Handler\. You came through/i);
  });

  it('unnamed Salt refuse keeps the name-gate and does not reprint Why-help', () => {
    const help = stitchOpeningContinue(saltHire(), 'Why should I help you?');
    const refuse = stitchOpeningContinue(
      {
        ...saltHire(),
        log: [
          { id: 'p', turn: 2, role: 'player' as const, content: 'Why should I help you?', timestamp: 2 },
          { id: 'g', turn: 2, role: 'gm', content: help, timestamp: 3 },
        ],
      },
      'What happens if I refuse?'
    );
    expect(help).toMatch(/have not said what they want/i);
    expect(help).toMatch(/still want a name/i);
    expect(refuse).toMatch(/have not said what happens if you refuse/i);
    expect(refuse).toMatch(/still want a name/i);
    expect(refuse).not.toBe(help);
  });

  it('cathedral refuse does not reprint the vault want already-told', () => {
    const want = stitchOpeningContinue(cathedral(), 'Ask what they want');
    const help = stitchOpeningContinue(
      {
        ...cathedral(),
        log: [
          { id: 'p1', turn: 2, role: 'player' as const, content: 'Ask what they want', timestamp: 2 },
          { id: 'g1', turn: 2, role: 'gm', content: want, timestamp: 3 },
        ],
      },
      'Why should I help you?'
    );
    const refuse = stitchOpeningContinue(
      {
        ...cathedral(),
        log: [
          { id: 'p1', turn: 2, role: 'player' as const, content: 'Ask what they want', timestamp: 2 },
          { id: 'g1', turn: 2, role: 'gm', content: want, timestamp: 3 },
          { id: 'p2', turn: 3, role: 'player' as const, content: 'Why should I help you?', timestamp: 4 },
          { id: 'g2', turn: 3, role: 'gm', content: help, timestamp: 5 },
        ],
      },
      'What happens if I refuse?'
    );
    expect(help).toMatch(/already said it/i);
    expect(help).toMatch(/Pactborn|travel kit|Ash Court/i);
    expect(refuse).not.toBe(help);
    expect(refuse).toMatch(/have not said what happens if you refuse/i);
    expect(refuse).not.toMatch(/Handler\. You came through|Pactborn|travel kit|Ash Court/i);
  });

  it('second who-ask restates; it does not reprint the first beat', () => {
    const first = stitchOpeningContinue(cathedral(), 'Who are you?');
    const second = stitchOpeningContinue(
      {
        ...cathedral(),
        log: [
          { id: 'p', turn: 2, role: 'player' as const, content: 'Who are you?', timestamp: 2 },
          { id: 'g', turn: 2, role: 'gm', content: first, timestamp: 3 },
        ],
      },
      'Who are you? Answer me properly.'
    );
    expect(second).toMatch(/already said|already answered/i);
    expect(second).toMatch(/"/);
    expect(second).not.toBe(first);
  });

  it('name-locked species cover does not keep Give your name', () => {
    const dnd = {
      ...greyhollow(),
      openingEstablishment: {
        ...greyhollow().openingEstablishment!,
        complete: false,
        pending: [{ id: 'species', kind: 'species' as const, question: 'What folk are you?' }],
      },
    };
    expect(coverContinuePads(dnd).join(' ')).not.toMatch(/Give your name/i);
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
