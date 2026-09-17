import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { BUILD_STAMP } from './runManifest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { compileChoices } from './choiceCompiler';
import { enumerateLegalEdges } from './choiceEdge';
import { stitchOpeningScene } from './openingStitch';
import {
  advancePyoaSpine,
  authoredPageText,
  authoredStartPage,
  ensurePyoaSpine,
  initUmbraSpine,
  isAuthoredPyoaBook,
  legalSpineExits,
  spineBibleSupported,
  spineChoiceLabels,
} from './pyoaSpine';
import type { GameState } from './types';
import {
  campaignAgeChip,
  filterBiblesForContentMode,
  getCampaignBibleById,
  getCampaignBiblesByEngineMode,
  isKidRestrictedCampaign,
} from '@/data/campaigns';

function umbraState(over: Partial<GameState> = {}): GameState {
  let state = createInitialState(undefined, 'pyoa') as GameState;
  state = {
    ...state,
    engineMode: 'pyoa',
    campaignBibleId: 'umbra-protocol',
    openingEstablishment: {
      pending: [],
      answers: {},
      complete: true,
      sceneWritten: true,
    },
    pyoaSpine: initUmbraSpine(),
    ...over,
  };
  return ensurePyoaSpine(state);
}

describe('playtest15a — Umbra compiled book', () => {
  it('HUD/BUILD are 15a, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-09-17a');
    expect(BUILD_STAMP).toBe('2026-09-17a');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('loads the authored Umbra book, not Thornferry', () => {
    expect(spineBibleSupported('umbra-protocol')).toBe(true);
    expect(isAuthoredPyoaBook('umbra-protocol')).toBe(true);
    expect(isAuthoredPyoaBook('thornferry-road')).toBe(false);
    const start = authoredStartPage();
    expect(start).toMatch(/bourdon bell/i);
    expect(start.length).toBeGreaterThan(80);
    const state = umbraState();
    expect(state.pyoaSpine?.currentNodeId).toBe('up-bell-tower');
    expect(authoredPageText(state)).toBe(start);
    expect(legalSpineExits(state).map((e) => e.label)).toEqual([
      'Kneel by the Archbishop',
      'Pry the brass clasp open',
      'Climb to the louvres',
    ]);
  });

  it('opening stitch is the compiled start page with no cover ask', () => {
    const state = umbraState();
    expect(stitchOpeningScene(state)).toBe(authoredStartPage());
  });

  it('compiler and edges are chips only — no Wait, no charter pad', () => {
    const state = umbraState();
    const { choices } = compileChoices(state, ['Wait and watch', 'Look around'], undefined, 'look');
    expect(choices).toEqual(spineChoiceLabels(state));
    expect(choices.some((c) => /wait and watch/i.test(c))).toBe(false);
    const edges = enumerateLegalEdges(state);
    expect(edges.map((e) => e.label)).toEqual(choices);
    expect(edges.some((e) => /millstone charter|wait and watch|face the crisis/i.test(e.label))).toBe(
      false
    );
  });

  it('advances on a chip and lands the destination page', () => {
    let state = umbraState();
    state = advancePyoaSpine(state, 'Kneel by the Archbishop');
    expect(state.pyoaSpine?.currentNodeId).toBe('up-bell-body');
    const page = authoredPageText(state) ?? '';
    expect(page.length).toBeGreaterThan(40);
    expect(page).not.toBe(authoredStartPage());
  });

  it('is marked 16+ and hidden in Kid Mode, not as NSFW', () => {
    const bible = getCampaignBibleById('umbra-protocol');
    expect(bible?.ageRating).toBe(16);
    expect(bible?.nsfw).not.toBe(true);
    expect(campaignAgeChip(bible)).toBe('16+');
    expect(isKidRestrictedCampaign(bible)).toBe(true);
    const adult = getCampaignBiblesByEngineMode('pyoa', 'adult');
    const kid = getCampaignBiblesByEngineMode('pyoa', 'kid');
    expect(adult.some((b) => b.id === 'umbra-protocol')).toBe(true);
    expect(kid.some((b) => b.id === 'umbra-protocol')).toBe(false);
    expect(filterBiblesForContentMode([bible!], 'kid')).toEqual([]);
  });

  it('an ending chip closes the book', () => {
    let state = umbraState({
      pyoaSpine: {
        ...initUmbraSpine(),
        currentNodeId: 'up-w-press-run',
        visited: ['up-bell-tower', 'up-w-press-run'],
      },
    });
    state = advancePyoaSpine(state, 'Set the Architect names in type');
    expect(state.pyoaSpine?.currentNodeId).toBe('up-end-parliament-dawn');
    expect(state.pyoaSpine?.endingId).toBe('up-end-parliament-dawn');
    expect(state.playPhase).toBe('ended');
    expect(legalSpineExits(state)).toEqual([]);
  });
});
