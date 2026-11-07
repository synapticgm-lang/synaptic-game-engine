/**
 * 2026-09-10j — Hall questions spoken by scene CAST; no card-paragraph reprint.
 */
import { publicStampIdentityHolds, readPublicStampIdentity } from './publicStampFiles';
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
import type { GameState, NpcMemory } from './types';

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
    expect(readPublicStampIdentity().build.length).toBeGreaterThan(0);
    expect(publicStampIdentityHolds()).toBe(true);
    expect(readPublicStampIdentity()).toMatchObject({
      hud: HUD_BUILD_STAMP,
      build: BUILD_STAMP,
      htmlComment: BUILD_STAMP,
      htmlMeta: BUILD_STAMP,
      versionHud: BUILD_STAMP,
      versionBuild: BUILD_STAMP,
    });
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
    // 29z4 — the militia has no info sheet: no canned "we found you here" answer.
    expect(text).toMatch(/The militia answer you/);
    expect(text).not.toMatch(/We are the ones who found you here/);
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
    expect(second).toMatch(/already said it|already answered|spear has not moved/i);
    expect(second).not.toBe(first);
    expect(second).toMatch(/"/);
  });

  it('Where am I does not reprint the name-lock telegram', () => {
    const text = stitchOpeningContinue(westWall(), 'Where am i');
    expect(text).toMatch(/You are in/i);
    expect(text).not.toMatch(/They already have the name Jax/i);
  });

  it('a nonspeaking group listed first does not take the bark, and nobody is seated', () => {
    const scav: NpcMemory = {
      npcId: 'scav',
      npcName: 'the scavengers',
      disposition: 'neutral',
      facts: [],
      lastSeenTurn: 1,
    };
    const mil: NpcMemory = {
      npcId: 'mil',
      npcName: 'the militia',
      disposition: 'neutral',
      facts: [],
      lastSeenTurn: 1,
    };
    const state = westWall({
      npcMemories: [scav, mil],
      timeline: [],
      openingEstablishment: {
        ...westWall().openingEstablishment!,
        castNpcIds: ['scav', 'mil'],
      },
    });
    expect(openingCastLabel(state)).toBe('the militia');
    const who = stitchOpeningContinue(state, 'Who are you');
    expect(who).toMatch(/The militia answer you/);
    expect(who).not.toMatch(/scavengers answer/i);
    expect(state.npcMemories?.map((m) => m.npcId)).toEqual(['scav', 'mil']);
    expect(state.timeline ?? []).toEqual([]);
    expect(state.timeline?.some((f) => f.kind === 'person')).toBe(false);
  });

  it('a named person who speaks stays the speaker when a group is only present', () => {
    const state = westWall({
      openingEstablishment: {
        ...westWall().openingEstablishment!,
        card: { cast: 'Mira Quill', castNames: ['Mira Quill'], props: [], names: ['Mira', 'Quill'] },
        pickedHookFallback: 'A ragged scavenger stops on the gravel and stares. Mira Quill asks who you are.',
      },
    });
    expect(openingCastLabel(state)).toBe('Mira Quill');
    expect(stitchOpeningContinue(state, 'Who are you')).toMatch(/Mira Quill/);
    expect(stitchOpeningContinue(state, 'Who are you')).not.toMatch(/scavengers answer/i);
  });

  it('a named person who only stares yields to the group that barks, and is not seated', () => {
    const state = westWall({
      npcMemories: [],
      timeline: [],
      openingEstablishment: {
        ...westWall().openingEstablishment!,
        card: { cast: 'Mira Quill', castNames: ['Mira Quill'], props: [], names: ['Mira', 'Quill'] },
        pickedHookFallback:
          'Mira Quill stares at the rings. Two militia step out of the brush behind you. One barks for a name.',
      },
    });
    expect(openingCastLabel(state)).toBe('the militia');
    expect(stitchOpeningContinue(state, 'Who are you')).toMatch(/The militia answer you/);
    expect(stitchOpeningContinue(state, 'Who are you')).not.toMatch(/Mira Quill answer/i);
    expect(state.npcMemories ?? []).toEqual([]);
    expect(state.timeline ?? []).toEqual([]);
  });

  it('free text keeps the card offer with the group that spoke, not the group that stared', () => {
    const text = stitchOpeningContinue(westWall(), 'I wait');
    expect(text).toMatch(/militia/i);
    expect(text).not.toMatch(/scavenger/i);
  });
});
