/**
 * 2026-09-10b — Cover-continue answers the typed line; no opener reprint.
 * Live save f876b00d: where/why and "My name is Jax" both got writer rehash.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { coverContinuePads, isOpeningCoverTurn } from './openingEstablishment';
import { resolveOfferedChoices } from './playTranscript';
import { stitchOpeningContinue, stitchOpeningScene } from './openingStitch';
import { emptySceneFacts } from './sceneFacts';
import type { GameState } from './types';

const useGame = readFileSync(resolve(__dirname, './useGame.ts'), 'utf8');

function warCamp(over: Partial<GameState> = {}): GameState {
  const base = createInitialState('The Summoned Pact', 'litrpg');
  return {
    ...base,
    campaignBibleId: 'summoned-pact',
    seed: '1q5m7ck5',
    currentLocation: 'Pellane war camp beyond Valespire walls',
    character: { ...base.character, name: 'Unknown Survivor' },
    openingEstablishment: {
      pending: [
        { id: 'name', kind: 'name', question: 'They need a name before they will say what they want. What is yours?' },
      ],
      answers: { where: 'Pellane war camp beyond Valespire walls' },
      complete: false,
      sceneWritten: true,
      mode: 'weave',
      aloneArrival: false,
      pickedHookFallback:
        'Light, then mud and banner-smoke. You are on your back in a war-camp circle scraped into dirt outside Valespire’s walls. Armored handlers shout over horn-calls. A blue panel hangs at eye level. Someone wanted a hero yesterday. The Mark on you is already an argument.',
    },
    sceneFacts: { ...emptySceneFacts(1), present: ['bystanders'] },
    log: [
      {
        id: 't0',
        turn: 0,
        role: 'gm',
        content:
          'Light, then mud and banner-smoke. You are on your back in a war-camp circle scraped into dirt outside Valespire’s walls.',
        timestamp: 1,
      },
    ],
    ...over,
  };
}

describe('playtest10b — cover answers the line', () => {
  it('HUD/BUILD stay on the 10 line, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toMatch(/^2026-09-1/);
    expect(BUILD_STAMP).toMatch(/^2026-09-1/);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('useGame stays on local stitch for cover turns', () => {
    expect(useGame).not.toMatch(/await callOpeningGm\(/);
    expect(useGame).toContain('isOpeningCoverTurn');
    expect(useGame).toContain('stitchOpeningContinue(openingState, contentSanitized)');
  });

  it('page 1 is one authored paragraph, not fallback plus beats', () => {
    const text = stitchOpeningScene(warCamp());
    expect(text).toMatch(/mud|banner-smoke|Valespire|panel/i);
    expect((text.match(/banner-smoke/gi) ?? []).length).toBeLessThanOrEqual(1);
    expect(text).not.toMatch(/Mud, banner-smoke, a war-camp circle\. Horns/i);
  });

  it('where/why answers the line and does not reprint horns and handlers', () => {
    const text = stitchOpeningContinue(
      warCamp(),
      'Question where am I and why should I give you my name'
    );
    expect(text).toMatch(/war camp|Valespire/i);
    expect(text).toMatch(/name|want|body on the line/i);
    expect(text).not.toMatch(/horn-calls|banner-smoke|acrid smell/i);
    expect(text).not.toMatch(/A name, if you please/i);
  });

  it('giving Jax acknowledges the name and answers what they want', () => {
    const named = warCamp({
      character: { ...warCamp().character, name: 'Jax' },
      openingEstablishment: {
        ...warCamp().openingEstablishment!,
        answers: { ...warCamp().openingEstablishment!.answers, name: 'Jax' },
        pending: [],
        complete: true,
      },
    });
    const text = stitchOpeningContinue(named, 'My name is Jax what your and what do you want');
    expect(text).toMatch(/Jax/);
    expect(text).toMatch(/want|body on the line|have not said/i);
    expect(text).not.toMatch(/What is your name/i);
    expect(text).not.toMatch(/banner-smoke|horn-calls/i);
  });

  it('cover chips are name-only; name-ack is one chip, not Lowmarket', () => {
    const pending = warCamp();
    expect(isOpeningCoverTurn(pending)).toBe(true);
    expect(resolveOfferedChoices(pending)).toEqual(['Give your name', 'Refuse to give a name']);
    expect(resolveOfferedChoices(pending).join(' ')).not.toMatch(/Lowmarket|West Wall|Check Status/i);

    const named = warCamp({
      turn: 3,
      character: { ...warCamp().character, name: 'Jax' },
      openingEstablishment: {
        ...warCamp().openingEstablishment!,
        answers: { ...warCamp().openingEstablishment!.answers, name: 'Jax' },
        pending: [],
        complete: true,
      },
      log: [
        ...warCamp().log,
        { id: 'p', turn: 2, role: 'player', content: 'My name is Jax what your and what do you want', timestamp: 2 },
      ],
    });
    const pads = coverContinuePads(named);
    expect(pads).toEqual(['Who are you', 'Inspect the panel']);
    expect(resolveOfferedChoices(named)).toEqual(['Who are you', 'Inspect the panel']);
  });
});
