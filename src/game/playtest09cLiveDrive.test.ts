import { describe, expect, it } from 'vitest';
import { getCampaignBibleById } from '@/data/campaigns';
import {
  criticLiveDriveTurn,
  liveDriveScriptedLines,
  reopenCoversForLiveDrive,
} from './liveDrive';
import { buildNewGameState, stampOpening } from './fateAutoplay';
import { isOpeningEstablishmentPending } from './openingEstablishment';
import { createInitialState } from './defaults';
import type { GameState } from './types';

describe('playtest09c — live drive harness', () => {
  it('New Game for live drive keeps the name cover pending', () => {
    const bible = getCampaignBibleById('summoned-pact');
    expect(bible).toBeTruthy();
    const { state: raw } = buildNewGameState({
      bibleId: 'summoned-pact',
      characterName: 'Jax',
      seed: 42,
      personality: 'cold-system',
      engineMode: 'litrpg',
    });
    const live = stampOpening(reopenCoversForLiveDrive(raw, bible!));
    expect(isOpeningEstablishmentPending(live)).toBe(true);
    expect(live.character.name).toBe('Unknown Survivor');
    expect(live.openingEstablishment?.complete).toBe(false);
    expect(live.log.some((e) => e.role === 'gm' && e.content.trim().length > 20)).toBe(true);
  });

  it('storyfollower first line is the live why-name type-in', () => {
    expect(liveDriveScriptedLines('storyfollower', 'litrpg')[0]).toMatch(/why do you want that/i);
  });

  it('critic thumbs packet echo and leftover name chips', () => {
    const state = createInitialState('The Summoned Pact', 'litrpg') as GameState;
    const echo = criticLiveDriveTurn({
      story: 'Here is the narrative of the completed event in past tense, adhering to the provided guidelines.',
      pads: [],
      player: 'Whats going on?',
      prevStories: [],
      coversPending: true,
      nameLocked: null,
      state,
      openingContinue: true,
    });
    expect(echo.some((f) => f.code === 'packet-echo' || f.code === 'opening-continue-reject')).toBe(true);

    const nameChip = criticLiveDriveTurn({
      story: 'The panel already has Jax.',
      pads: ['Give them your name', 'Look around'],
      player: 'Inspect the panel',
      prevStories: [],
      coversPending: false,
      nameLocked: 'Jax',
      state,
    });
    expect(nameChip.some((f) => f.code === 'name-chip-after-lock')).toBe(true);
  });

  it('critic thumbs NPC non-answer and one-line no-speech', () => {
    const state = createInitialState('The Summoned Pact', 'litrpg') as GameState;
    const loop = criticLiveDriveTurn({
      story: 'They have the name Jax. The chanter already answered you.',
      pads: ['Who are you'],
      player: "What's your name? I am not swearing anything yet.",
      prevStories: [],
      coversPending: false,
      nameLocked: 'Jax',
      state,
    });
    expect(loop.some((f) => f.code === 'npc-non-answer')).toBe(true);

    const short = criticLiveDriveTurn({
      story: 'The chanter is the one asking.',
      pads: ['Who are you'],
      player: 'Who are you? Answer me properly.',
      prevStories: [],
      coversPending: false,
      nameLocked: 'Jax',
      state,
    });
    expect(short.some((f) => f.code === 'one-line-no-npc' || f.code === 'npc-non-answer')).toBe(true);
  });
});
