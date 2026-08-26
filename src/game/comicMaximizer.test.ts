/**
 * Fixture pack F (Comic Maximizer) — deterministic contract tests for P0 comic-lite.
 * No vision/critic LLM. Image-semantic cases stay human-reviewed.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { createDefaultSettings, createInitialState } from './defaults';
import {
  validateGmPanels,
  resolveComicPanelPlan,
  buildDeterministicOnePanel,
  isValidOverlayAnchor,
  resolveP0PanelCeiling,
} from './comicBeatSpec';
import {
  evaluateComicEligibility,
  hashUnitInterval,
  kidComicPreflight,
  buildComicBeatDedupeKey,
} from './comicEligibility';
import {
  buildComicJobKey,
  reserveComicJobKey,
  markComicJobSpent,
  shouldAttachComicResult,
  __resetComicJobReservationsForTests,
} from './comicJobKeys';
import {
  bindOverlayUtterance,
  fallbackOverlayAnchor,
  isFiveAnchorVocabulary,
} from './comicOverlayBind';
import { scrubFranchiseStyleLeak, shouldUseComicGrid, buildComicPanelImagePrompt } from './comicImagePrompt';
import { buildVisualConsistencyBlock } from './visualConsistency';
import { resolvePanelBudget } from './panelBudget';
import { __resetComicKleinSessionForTests } from './capacityLedger';

function baseState(overrides: Record<string, unknown> = {}) {
  const state = createInitialState('Comic Fixture', 'litrpg');
  return {
    ...state,
    character: {
      ...state.character,
      name: 'Ana',
      appearance: 'short dark curls, red field coat',
    },
    currentLocation: 'Glasshouse North',
    locationSheet: {
      ...(state.locationSheet || { name: 'Glasshouse North', interactables: [], exits: [] }),
      name: 'Glasshouse North',
    },
    sceneFacts: {
      crowd: 'none' as const,
      noise: 'quiet' as const,
      present: ['Ana'],
      props: ['fogged panes', 'iron ribs', 'blue grow-lamps'],
      lastBeat: 'arrival',
      updatedTurn: 1,
    },
    companions: [],
    ledgerRevision: 3,
    turn: 4,
    saveId: 'save-test-1',
    ...overrides,
  };
}

describe('F — Comic Maximizer P0 fixtures', () => {
  beforeEach(() => {
    __resetComicJobReservationsForTests();
    __resetComicKleinSessionForTests();
  });

  it('G01 roster lock — PanelSpec / prompt exact count, no extras', () => {
    const state = baseState();
    const { panel } = buildDeterministicOnePanel({
      state,
      storyText: 'Ana stands alone among the fogged panes of Glasshouse North, red coat bright against iron ribs.',
      playerAction: 'Look at the grow-lamps',
    });
    expect(panel.imagePrompt).toMatch(/Exact count:\s*1/i);
    expect(panel.imagePrompt).toMatch(/Ana/);
    expect(panel.imagePrompt).not.toMatch(/masked guide/i);

    const block = buildVisualConsistencyBlock(state);
    expect(block).toMatch(/ROSTER LOCK/);
    expect(block).toMatch(/exact count 1/i);
  });

  it('G02 equipped-kit lock — weapon only, not unequipped bow', () => {
    const state = baseState({
      inventory: [
        {
          id: 'w1',
          name: 'brass spear',
          rarity: 'common',
          quantity: 1,
          equipped: true,
          slot: 'main-hand',
          itemType: 'weapon',
        },
        {
          id: 'w2',
          name: 'hunting bow',
          rarity: 'common',
          quantity: 1,
          equipped: false,
          itemType: 'weapon',
        },
      ],
    });
    const block = buildVisualConsistencyBlock(state as never);
    expect(block).toMatch(/brass spear/i);
    expect(block).toMatch(/EQUIPPED WEAPON/);
    expect(block).toMatch(/ignore unequipped inventory/i);
  });

  it('G03 place anchors bound', () => {
    const state = baseState();
    const { panel, spec } = buildDeterministicOnePanel({
      state,
      storyText: 'Mist beads on fogged panes along the iron ribs under blue grow-lamps.',
      playerAction: 'Step closer to the glass',
    });
    expect(spec.placeId).toMatch(/Glasshouse/i);
    expect(panel.imagePrompt).toMatch(/fogged panes/i);
    expect(panel.imagePrompt).toMatch(/iron ribs/i);
  });

  it('G04 / R02 overlay speaker bind — mismatch fails closed', () => {
    const accepted = {
      utteranceId: 'u17',
      speakerId: 'c_ana',
      speakerLabel: 'Ana',
      text: 'Stay behind me.',
    };
    const ok = bindOverlayUtterance({
      utteranceId: 'u17',
      claimedSpeakerId: 'c_ana',
      accepted,
    });
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.speakerLabel).toBe('Ana');

    const bad = bindOverlayUtterance({
      utteranceId: 'u17',
      claimedSpeakerId: 'c_ben',
      accepted,
    });
    expect(bad.ok).toBe(false);
  });

  it('G05 / R16 five-anchor vocabulary + fallback', () => {
    expect(isFiveAnchorVocabulary('top-left')).toBe(true);
    expect(isFiveAnchorVocabulary('center-left')).toBe(false);
    expect(isValidOverlayAnchor('bottom-center')).toBe(true);
    expect(fallbackOverlayAnchor('center-left')).toBe('top-left');
    expect(fallbackOverlayAnchor('bottom-center')).toBe('bottom-center');
  });

  it('G06 / G07 / R10 non-blocking contract — art never gates eligibility of story commit', () => {
    // Structural: resolveComicPanelPlan never throws; pending is a panel status, not a turn lock.
    const plan = resolveComicPanelPlan({
      isComicView: true,
      gmPanels: [],
      state: baseState() as never,
      storyText: 'Ana freezes as the glasshouse lamps flicker blue across the iron ribs.',
      playerAction: 'Hold still and listen',
      settings: { ...createDefaultSettings(), visualMode: 'comic', panelFrequency: 'balanced' },
    });
    expect(plan.panels.length).toBeLessThanOrEqual(1);
    expect(plan.panels[0]?.imageStatus).toBe('pending');
  });

  it('G08 / G09 kid skip before spend', () => {
    expect(kidComicPreflight('close-up of a corpse in a blood fountain', 'kid').skip).toBe(true);
    expect(kidComicPreflight('soft lantern light on a quiet hallway', 'kid').skip).toBe(false);
    expect(kidComicPreflight('anything', 'adult').skip).toBe(false);
  });

  it('G12 splash-only — P0 ceiling is one panel', () => {
    expect(resolveP0PanelCeiling(createDefaultSettings())).toBe(1);
    const settings = { ...createDefaultSettings(), visualMode: 'comic' as const, panelFrequency: 'high' as const, comicLayout: 'paged' as const };
    expect(Math.min(resolvePanelBudget(settings), resolveP0PanelCeiling(settings))).toBe(1);
  });

  it('G14 / R18 Classic never uses ComicGrid', () => {
    const classic = { ...createDefaultSettings(), visualMode: 'classic' as const, artStylePreset: 'classic-book' as const };
    expect(shouldUseComicGrid(classic)).toBe(false);
    const plan = resolveComicPanelPlan({
      isComicView: false,
      gmPanels: [{ imagePrompt: 'x', narrative: 'y'.repeat(50) }],
      state: baseState() as never,
      storyText: 'A long story beat that would otherwise illustrate.',
      playerAction: 'Enter the hall',
      settings: classic,
    });
    expect(plan.source).toBe('none');
    expect(plan.panels).toHaveLength(0);
  });

  it('G15 / R11 idempotent job key — no double reserve', () => {
    const key = buildComicJobKey({
      gameId: 'g1',
      turnId: 't1',
      beatRevision: 2,
      panelIndex: 0,
      attemptClass: 'initial',
    });
    expect(reserveComicJobKey(key).ok).toBe(true);
    expect(reserveComicJobKey(key).ok).toBe(false);
    expect(reserveComicJobKey(key).alreadyReserved).toBe(true);
    markComicJobSpent(key);
  });

  it('R04 invented NPC in GM tags rejected; deterministic fallback excludes guide', () => {
    const state = baseState();
    const bad = validateGmPanels({
      panels: [
        {
          imagePrompt: 'A masked guide leads Ana through the glasshouse',
          narrative: 'Someone gestures from the mist.'.repeat(3),
        },
      ],
      state: state as never,
      budget: 1,
    });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.reason).toBe('invented_npc');

    const plan = resolveComicPanelPlan({
      isComicView: true,
      gmPanels: [
        {
          imagePrompt: 'A masked guide leads Ana through the glasshouse',
          narrative: 'Someone gestures from the mist.'.repeat(3),
        },
      ],
      state: state as never,
      storyText: 'Ana stands among fogged panes and iron ribs under blue grow-lamps, alone for now.',
      playerAction: 'Call out softly',
      settings: { ...createDefaultSettings(), visualMode: 'comic' },
    });
    expect(plan.source).toBe('deterministic');
    expect(plan.panels[0]?.imagePrompt).not.toMatch(/masked guide/i);
  });

  it('R12 stale attach discarded when beatRevision mismatches', () => {
    expect(
      shouldAttachComicResult({ jobBeatRevision: 1, currentBeatRevision: 2 })
    ).toBe(false);
    expect(
      shouldAttachComicResult({ jobBeatRevision: 2, currentBeatRevision: 2 })
    ).toBe(true);
  });

  it('R13 franchise / living-artist prompt scrubbed', () => {
    const scrubbed = scrubFranchiseStyleLeak('Draw this like Marvel Jim Lee splash page');
    expect(scrubbed).not.toMatch(/Marvel/i);
    expect(scrubbed).not.toMatch(/Jim Lee/i);
    const prompt = buildComicPanelImagePrompt('Ana in the glasshouse, Marvel style', 'adult');
    expect(prompt).not.toMatch(/Marvel/i);
  });

  it('R14 over-budget clamped — webtoon and live ceiling', () => {
    const webtoon = {
      ...createDefaultSettings(),
      visualMode: 'comic' as const,
      comicLayout: 'webtoon' as const,
      panelFrequency: 'high' as const,
    };
    expect(resolvePanelBudget(webtoon)).toBeLessThanOrEqual(2);
    expect(Math.min(resolvePanelBudget(webtoon), resolveP0PanelCeiling(webtoon))).toBe(1);
  });

  it('R17 duplicate beat skip', () => {
    const state = baseState();
    const key = buildComicBeatDedupeKey(state as never);
    const result = evaluateComicEligibility({
      settings: { ...createDefaultSettings(), visualMode: 'comic', contentMode: 'adult' },
      state: state as never,
      storyText: [
        'Ana walks the iron ribs again as blue lamps hum over fogged panes and wet soil beds stretch ahead toward the sealed north door.',
        'Condensation ticks from the glass. Her red coat brushes a rail. Nothing new has moved since the last beat,',
        'but the glasshouse still breathes cold air against her gloves and boots. Somewhere a pump cycles.',
        'She counts the same three grow-lamp rows, the same cracked tile, the same empty bench by the aisle.',
        'The place refuses to surprise her, yet the silence keeps weight in her chest as she chooses the next step.',
      ].join(' '),
      playerAction: 'Cross to the far bench',
      lastComicBeatKey: key,
      frequencySeed: 'always-hit|0',
    });
    expect(result.eligible).toBe(false);
    expect(result.skipReason).toBe('duplicate_beat');
  });

  it('frequency sampling is deterministic', () => {
    expect(hashUnitInterval('a')).toBe(hashUnitInterval('a'));
    expect(hashUnitInterval('a')).not.toBe(hashUnitInterval('b'));
  });
});
