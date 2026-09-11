/**
 * 2026-09-10j — Hall questions spoken by scene CAST; no card-paragraph reprint.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import {
  isAloneArrivalPick,
  openingCastLabel,
  openingHayHasOccupancy,
} from './openingEstablishment';
import { stitchOpeningContinue, stitchOpeningScene } from './openingStitch';
import { applyErrorRepairs } from './errorRepairWarden';
import type { GameState } from './types';

const WEST_PAGE1 =
  'Cold wind over cracked brass rings outside Valespire’s west wall. The sky is open and grey. A blue panel hangs over the stone — private, yours. There are no priests and no rite still running; you are leftover from a circle that already failed. Distant wall-horns. A ragged scavenger stops on the gravel and stares. Two militia step out of the brush behind you. One levels a spear and barks for a name before they decide you are salvage. What name do you give them?';

const WEST_HOOK =
  'Location: a ruined empty circle outside the west wall\nWho is here / who summoned: No priests — scavengers and a militia patrol arriving late\nWhy this happened: The rite already failed for someone else. You are leftover. The circle is cracked and cold.\nOpening offer (optional — player may refuse): The patrol will issue a militia armband and a short blade if you come quietly.';

function westWall(over: Partial<GameState> = {}): GameState {
  const base = createInitialState('The Summoned Pact', 'litrpg');
  return {
    ...base,
    campaignBibleId: 'summoned-pact',
    currentLocation: 'a ruined empty circle outside the west wall',
    character: { ...base.character, name: 'Jax' },
    turn: 1,
    openingEstablishment: {
      pending: [],
      answers: {
        where: 'a ruined empty circle outside the west wall',
        name: 'Jax',
      },
      complete: true,
      sceneWritten: true,
      mode: 'weave',
      aloneArrival: true,
      pickedHook: WEST_HOOK,
      pickedHookFallback: WEST_PAGE1,
    },
    sceneFacts: emptySceneFacts(1),
    log: [
      {
        id: 't0',
        turn: 0,
        role: 'gm',
        content: WEST_PAGE1,
        timestamp: 1,
      },
    ],
    ...over,
  };
}

describe('playtest10j — west wall NPC voice', () => {
  it('HUD/BUILD stay on the 10 line, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toMatch(/^2026-09-10/);
    expect(BUILD_STAMP).toMatch(/^2026-09-10/);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('no-priests plus militia/scavenger is occupied, not alone', () => {
    expect(openingHayHasOccupancy(WEST_PAGE1)).toBe(true);
    expect(
      isAloneArrivalPick({
        location: 'a ruined empty circle outside the west wall',
        page1: WEST_PAGE1,
        faction: 'No priests — scavengers and a militia patrol arriving late',
      })
    ).toBe(false);
    expect(openingCastLabel(westWall())).toMatch(/militia/i);
    expect(openingCastLabel(westWall())).not.toMatch(/panel/i);
  });

  it('Continue clears a false aloneArrival stamp when the page has people', () => {
    const { state, notes } = applyErrorRepairs(westWall());
    expect(state.openingEstablishment?.aloneArrival).toBe(false);
    expect(notes.some((n) => n.code === 'ERR_ALONE_OCCUPANCY')).toBe(true);
  });

  it('page 1 drops the name bark when Jax is already locked', () => {
    const page = stitchOpeningScene(westWall());
    expect(page).not.toMatch(/barks for a name|What name do you give them/i);
    expect(page).toMatch(/militia|scavenger/i);
  });

  it('Who are you is the militia speaking, not the panel', () => {
    const text = stitchOpeningContinue(westWall(), 'Who are you');
    expect(text).toMatch(/militia/i);
    expect(text).toMatch(/"/);
    expect(text).not.toMatch(/the panel is the one asking/i);
  });

  it('what do you want is spoken once; a second ask does not reprint the card', () => {
    const first = stitchOpeningContinue(westWall(), 'What do you want from me');
    expect(first).toMatch(/militia|answer/i);
    expect(first).toMatch(/leftover|armband|rite already failed/i);
    expect(first).toMatch(/"/);
    const second = stitchOpeningContinue(
      westWall({
        log: [
          ...westWall().log,
          { id: 'p1', turn: 1, role: 'player', content: 'What do you want from me', timestamp: 2 },
          { id: 'g1', turn: 1, role: 'gm', content: first, timestamp: 3 },
        ],
      }),
      'You ask why should I join you? What do you want from me'
    );
    expect(second).toMatch(/already answered|spear has not moved/i);
    expect(second).not.toBe(first);
    expect(second).not.toMatch(/The rite already failed for someone else/i);
  });

  it('Where am I does not reprint the name-lock telegram', () => {
    const text = stitchOpeningContinue(westWall(), 'Where am i');
    expect(text).toMatch(/You are in/i);
    expect(text).not.toMatch(/They already have the name Jax/i);
  });
});
