/**
 * Batch 12f — Manus option 1: talk envelope on E only + Fate A–E labels.
 * Silent / hall stitch unchanged. No SNAPSHOT/CRAFT. Mid writer OFF.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import { buildCompletedEventPacket } from './completedEventPacket';
import {
  classifyResponsePath,
  formatTalkWriterFacing,
  legalAddresseeFact,
  tallyResponsePaths,
} from './talkEnvelope';
import type { GameState } from './types';

const GRAIN =
  'You summoned me to get luck for your cargo run? Laugh out loud. Can I ever get back home? To earth?';
const TALK_E = 'Tell the sailors I need a night before I sign anything.';

const GRAIN_WHERE = 'a harbor circle in the hold of a Valespire grain-ship';
const GRAIN_HOOK = [
  'Location: a harbor circle in the hold of a Valespire grain-ship',
  'Who is here / who summoned: Smugglers who stole a Scale rite and panicked when it worked',
  'Why this happened: They wanted luck for a cargo run. They pulled an Earth soul. The Crown does not know yet.',
  'Opening offer: Keep their secret and they will kit you as crew (knife, oilskin, a bunk).',
].join('\n');

function grainDone(over: Partial<GameState> = {}): GameState {
  const base = createInitialState('The Summoned Pact', 'litrpg');
  return {
    ...base,
    campaignBibleId: 'summoned-pact',
    seed: 'grain-ship-12f',
    currentLocation: GRAIN_WHERE,
    character: { ...base.character, name: 'Jax' },
    turn: 4,
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax', where: GRAIN_WHERE },
      complete: true,
      sceneWritten: true,
      mode: 'weave',
      aloneArrival: false,
      pickedHook: GRAIN_HOOK,
    },
    sceneFacts: { ...emptySceneFacts(4), present: ['three sailors'] },
    ...over,
  };
}

describe('playtest12f — talk envelope + path labels', () => {
  it('HUD/BUILD are 12f, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toMatch(/^2026-09-12/);
    expect(BUILD_STAMP).toMatch(/^2026-09-12/);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('grain-ship home/earth stays C; Look is D; leftover talk is E', () => {
    const state = grainDone();
    expect(classifyResponsePath({ state, playerInput: GRAIN, subscriptionTier: 'free' })).toBe('C');
    expect(classifyResponsePath({ state, playerInput: 'Look around', subscriptionTier: 'free' })).toBe(
      'D'
    );
    expect(classifyResponsePath({ state, playerInput: TALK_E, subscriptionTier: 'free' })).toBe('E');
    expect(
      classifyResponsePath({
        state: grainDone({
          openingEstablishment: {
            ...state.openingEstablishment!,
            complete: false,
            pending: [
              {
                id: 'name',
                kind: 'name',
                question: 'What is yours?',
              },
            ],
          },
        }),
        playerInput: 'Wait',
        subscriptionTier: 'free',
      })
    ).toBe('B');
  });

  it('E talk facing leads with PLAYER SAID + ADDRESSEE and keeps the allowlist', () => {
    const state = grainDone();
    const packet = buildCompletedEventPacket(state, TALK_E);
    expect(packet.outcome).toBe('spoke');
    const facing = formatTalkWriterFacing(packet, state);
    expect(facing).toMatch(/^TALK:/);
    expect(facing).toContain(`PLAYER SAID: ${TALK_E}`);
    expect(facing).toMatch(/ADDRESSEE:/);
    expect(facing).toMatch(/YOU MAY ONLY MENTION:/);
    expect(facing).toContain('COMPLETED EVENT:');
    expect(facing).not.toMatch(/SNAPSHOT|CRAFT/i);
    expect(legalAddresseeFact(state, TALK_E)).toMatch(/luck for a cargo run|kit you as crew/i);
    const attack = buildCompletedEventPacket(state, 'Attack the Pact-Hunter Skirmisher');
    expect(formatTalkWriterFacing(attack, state)).not.toMatch(/^TALK:/);
  });

  it('Fate and live send use the talk facing; summary can tally paths', () => {
    const fate = readFileSync(resolve(__dirname, './fateAutoplay.ts'), 'utf8');
    const live = readFileSync(resolve(__dirname, './useGame.ts'), 'utf8');
    expect(fate).toContain('formatTalkWriterFacing');
    expect(fate).toContain('responsePath');
    expect(fate).toContain('pathCounts');
    expect(live).toContain('formatTalkWriterFacing');
    expect(live).not.toMatch(/formatWriterFacingEvent\(/);
    expect(
      tallyResponsePaths([
        { responsePath: 'C' },
        { responsePath: 'D' },
        { responsePath: 'E', writerOutcome: 'accepted' },
        { responsePath: 'E', writerOutcome: 'fallback' },
      ])
    ).toEqual({
      A: 0,
      B: 0,
      C: 1,
      D: 1,
      E: 2,
      E_accepted: 1,
      E_retry: 0,
      E_fallback: 1,
    });
  });
});
