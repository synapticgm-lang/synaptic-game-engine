/**
 * 2026-09-09c — Cover-continue local stitch + Silent receipts, not packet echo / chip dump.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { isWriterMonologueLeak } from './beatCommitGate';
import { classifyOpeningContinue } from './openingPointerCard';
import { stitchOpeningContinue } from './openingStitch';
import { renderDeterministicFallback, buildSealedManifest } from './sealedManifest';
import { composeFreeMudTurn, mudDisplayBody } from './freeMudPresentation';
import { buildCompletedEventPacket } from './completedEventPacket';
import { createInitialState } from './defaults';
import { runArcDirectorBeforeGm } from './arcDirector';
import type { GameState } from './types';

const useGame = readFileSync(resolve(__dirname, './useGame.ts'), 'utf8');

function aloneRuin(over: Partial<GameState> = {}): GameState {
  const base = createInitialState('The Summoned Pact', 'litrpg');
  return {
    ...base,
    seed: '09c-ruin',
    campaignBibleId: 'summoned-pact',
    currentLocation: 'alone in a half-collapsed ruin on the edge of wild country',
    character: { ...base.character, name: 'Unknown Survivor' },
    openingEstablishment: {
      pending: [
        {
          id: 'name',
          kind: 'name',
          question: 'The panel waits on a name. What do you enter?',
        },
      ],
      answers: { where: 'a half-collapsed watchtower' },
      complete: false,
      sceneWritten: true,
      mode: 'weave',
      aloneArrival: true,
    },
    sceneFacts: {
      crowd: 'none',
      noise: 'quiet',
      present: [],
      props: ['panel'],
      lastBeat: 'street empty; it is quiet; System panel is visible; indoors',
      updatedTurn: 2,
    },
    ...over,
  };
}

describe('playtest09c — cover-continue + Silent receipts', () => {
  it('HUD/BUILD stay on the 09/10 opening line, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toMatch(/^2026-09-1/);
    expect(BUILD_STAMP).toMatch(/^2026-09-1/);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('useGame never awaits callOpeningGm', () => {
    expect(useGame).not.toMatch(/await callOpeningGm\(/);
    expect(useGame).toContain('stitchOpeningContinue(openingState, contentSanitized)');
    expect(useGame).toContain('mudDisplayBody');
  });

  it('why-name continue answers without packet echo or a pad list', () => {
    const text = stitchOpeningContinue(
      aloneRuin(),
      'Whats going on? My name why do you want that'
    );
    expect(text).toMatch(/panel wants a name|does not say why/i);
    expect(text).toMatch(/watchtower|ruin|stone|doorway|panel/i);
    expect(text).not.toMatch(/completed event|adhering to|Narrate this/i);
    expect(text).not.toMatch(/later learned was called/i);
    expect(text).not.toMatch(/^\s*\d+\.\s/m);
    expect(text).not.toMatch(/still waiting for a name you will own/i);
  });

  it('search continue looks the room instead of reprinting page 1', () => {
    const named = aloneRuin({
      character: { ...aloneRuin().character, name: 'Jax' },
      openingEstablishment: {
        ...aloneRuin().openingEstablishment!,
        answers: { ...aloneRuin().openingEstablishment!.answers, name: 'Jax' },
        pending: [],
        complete: true,
      },
    });
    const text = stitchOpeningContinue(
      named,
      "Think in your head 'why does it need to know my name is Jax' search the room you are in for anything of use or intel"
    );
    expect(text).toMatch(/search|doorway|stone|dust/i);
    expect(text).toMatch(/Jax/);
    expect(text).not.toMatch(/Here is the narrative/i);
    expect(text).not.toMatch(/^\s*\d+\.\s/m);
  });

  it('inspect panel is a panel beat, not a SNAPSHOT dump', () => {
    const text = stitchOpeningContinue(aloneRuin(), 'Inspect the panel');
    expect(text).toMatch(/panel/i);
    expect(text).not.toMatch(/street empty|System panel is visible/i);
    expect(text).not.toMatch(/At alone in/i);
  });

  it('classifyOpeningContinue rejects packet instruction echo and empty HERE comma', () => {
    const echo = classifyOpeningContinue(
      aloneRuin(),
      'Here is the narrative of the completed event in past tense, adhering to the provided guidelines: Dust fell.'
    );
    expect(echo.accept).toBe(false);
    expect(echo.reasons).toEqual(expect.arrayContaining(['writer-monologue']));

    const comma = classifyOpeningContinue(
      aloneRuin(),
      'You later learned was called "," and the moths circled the panel.'
    );
    expect(comma.accept).toBe(false);
    expect(comma.reasons).toEqual(expect.arrayContaining(['empty-here']));
  });

  it('isWriterMonologueLeak fingerprints the 08a packet lecture', () => {
    expect(
      isWriterMonologueLeak(
        'Here is the narrative of the completed event in past tense, adhering to the provided guidelines:'
      )
    ).toBe(true);
    expect(isWriterMonologueLeak('The moth brushed the panel and you stood up.')).toBe(false);
  });

  it('renderDeterministicFallback never prints lastBeat chips or At alone in…', () => {
    const state = aloneRuin({
      openingEstablishment: {
        ...aloneRuin().openingEstablishment!,
        complete: true,
        pending: [],
      },
      turn: 4,
    });
    const arc = runArcDirectorBeforeGm(state, 'Inspect the panel');
    const manifest = buildSealedManifest(arc.state, 'Inspect the panel', arc);
    const prose = renderDeterministicFallback(manifest, {
      ...arc.state,
      sceneFacts: state.sceneFacts,
      currentLocation: state.currentLocation,
    });
    expect(prose).not.toMatch(/street empty|it is quiet; System panel is visible/i);
    expect(prose).not.toMatch(/At alone in/i);
  });

  it('Silent Engine display body is the stitch, not empty then chips', () => {
    const state = aloneRuin({
      openingEstablishment: {
        ...aloneRuin().openingEstablishment!,
        complete: true,
        pending: [],
      },
      currentLocation: 'a half-collapsed watchtower',
    });
    const packet = buildCompletedEventPacket(state, 'Inspect the panel');
    const turn = composeFreeMudTurn(packet, {
      flavorRaw: 'Should never land.',
      silent: true,
    });
    expect(turn.content.trim().length).toBeGreaterThan(20);
    expect(turn.content).not.toMatch(/^HERE:/m);
    const body = mudDisplayBody(turn);
    expect(body).toBe(turn.content.trim());
    expect(body).not.toMatch(/street empty/i);
    expect(body).not.toMatch(/At alone in/i);
    expect(turn.receiptLines.some((l) => /^HERE:/i.test(l))).toBe(true);
  });
});
