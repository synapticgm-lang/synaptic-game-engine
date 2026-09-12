/**
 * Batch 12c — Manus Phase 4 opening hooks + New Game preview.
 * Same seed/card as stitch. No callOpeningGm. No SNAPSHOT/CRAFT. Mid writer OFF.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { ALL_CAMPAIGN_BIBLES, getCampaignBibleById } from '@/data/campaigns';
import { summonedPact } from '@/data/campaigns/summonedPact';
import { SUMMONED_PACT_PHASE4_HOOKS } from '@/data/campaigns/summonedPactPhase4Hooks';
import { createInitialState } from './defaults';
import {
  firstOpeningLine,
  openingHookDeck,
  previewOpeningHook,
  resolveOpeningHookPick,
} from './openingEstablishment';
import { stitchOpeningScene } from './openingStitch';
import type { OpeningBeatCard } from '@/data/campaigns/types';

function uniqueLocations(bibleId: string): string[] {
  const bible = getCampaignBibleById(bibleId);
  const locs = openingHookDeck(bible)
    .map((card) => (typeof card === 'string' ? card.slice(0, 48) : (card.location ?? card.page1 ?? card.text ?? '').slice(0, 80)))
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set(locs)];
}

describe('playtest12c — Manus Phase 4 hooks + preview', () => {
  it('HUD/BUILD are 12c, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-09-12c');
    expect(BUILD_STAMP).toBe('2026-09-12c');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('Summoned Pact gained 24 unique Phase 4 cards (honest count, not 200)', () => {
    expect(SUMMONED_PACT_PHASE4_HOOKS.length).toBe(24);
    const locs = SUMMONED_PACT_PHASE4_HOOKS.map((c) => (c.location ?? '').toLowerCase());
    expect(new Set(locs).size).toBe(24);
    const bibleLocs = (summonedPact.openingHooks ?? [])
      .filter((c): c is OpeningBeatCard => typeof c !== 'string')
      .map((c) => (c.location ?? '').toLowerCase());
    expect(new Set(bibleLocs).size).toBe(bibleLocs.length);
    expect(openingHookDeck(summonedPact).length).toBeGreaterThanOrEqual(44);
    for (const card of SUMMONED_PACT_PHASE4_HOOKS) {
      expect(card.page1, card.location).toBeTruthy();
      expect((card.page1 ?? '').length, card.location).toBeGreaterThan(80);
      expect(card.summonIntent, card.location).toBeTruthy();
      expect(card.faction, card.location).toBeTruthy();
      expect(card.openingOffer, card.location).toBeTruthy();
    }
  });

  it('flagship decks stay distinct; other bibles already have catalog decks', () => {
    expect(uniqueLocations('summoned-pact').length).toBeGreaterThanOrEqual(40);
    expect(uniqueLocations('cursed-keep').length).toBeGreaterThanOrEqual(8);
    expect(uniqueLocations('salt-road-heist').length).toBeGreaterThanOrEqual(8);
    expect(uniqueLocations('thornferry-road').length).toBeGreaterThanOrEqual(8);
    expect(openingHookDeck(getCampaignBibleById('hero-awakening')).length).toBeGreaterThanOrEqual(8);
    const catalogued = ALL_CAMPAIGN_BIBLES.filter((b) => openingHookDeck(b).length >= 3);
    expect(catalogued.length).toBe(ALL_CAMPAIGN_BIBLES.length);
  });

  it('New Game preview is the same card stitch will use (no GM)', () => {
    const seed = 'preview-lock-12c';
    const preview = previewOpeningHook(summonedPact, seed);
    const pick = resolveOpeningHookPick(summonedPact, seed);
    expect(preview).toBeTruthy();
    expect(pick).toBeTruthy();
    expect(preview!.location).toBe(pick!.location);
    expect(preview!.why).toBe(pick!.summonIntent);
    expect(preview!.cast).toBe(pick!.faction);
    expect(preview!.firstLine).toBe(firstOpeningLine(pick!.page1 || pick!.fallback || pick!.text));

    const state = createInitialState('The Summoned Pact', 'litrpg', summonedPact.archetype, seed);
    expect(state.seed).toBe(seed);
    const again = resolveOpeningHookPick(summonedPact, state.seed);
    expect(again?.location).toBe(pick!.location);
    expect(again?.page1).toBe(pick!.page1);

    const stitched = stitchOpeningScene({
      ...state,
      campaignBibleId: 'summoned-pact',
      currentLocation: pick!.location || state.currentLocation,
      openingEstablishment: {
        pending: [],
        answers: {},
        complete: false,
        sceneWritten: true,
        mode: 'weave',
        pickedHook: pick!.text,
        pickedHookFallback: pick!.page1 || pick!.fallback,
        aloneArrival: false,
      },
    });
    expect(stitched).toMatch(new RegExp(preview!.firstLine.slice(0, 24).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
    expect(stitched).not.toMatch(/Narrate this completed event|SNAPSHOT|CRAFT/i);
  });

  it('same seed is stable; different seeds can pick another card', () => {
    const a = previewOpeningHook(summonedPact, 'seed-alpha');
    const b = previewOpeningHook(summonedPact, 'seed-alpha');
    expect(a?.location).toBe(b?.location);
    expect(a?.firstLine).toBe(b?.firstLine);
    const seen = new Set<string>();
    for (let i = 0; i < 80; i++) {
      seen.add(previewOpeningHook(summonedPact, `mix-${i}`)?.location ?? '');
    }
    expect(seen.size).toBeGreaterThan(8);
  });
});
