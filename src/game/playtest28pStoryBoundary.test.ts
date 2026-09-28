import { describe, expect, it } from 'vitest';
import { getCampaignBibleById, RAW_CAMPAIGN_BIBLES } from '@/data/campaigns';
import { OPENING_HOOK_DECKS } from '@/data/campaigns/openingHookDecks';
import { isAuthorNoteSentence, seedStoryPlaces, stripAuthorNotes, storyPlacesForBible } from './storyDataBoundary';
import { normalizeOpeningHookCard } from './openingEstablishment';
import { buildPlaceCard, hubsForBibleId } from './outdoorHubs';
import { minorRoleForPlace, sceneAllowsRoleIntroduction, storyMinorRoles } from './closedScenePerson';
import { formatWriterInfoLayer } from './writerInfoLayer';
import { applyErrorRepairs } from './errorRepairWarden';
import { newGameState } from './newGameTestState';

describe('28p story data boundary', () => {
  it('drops author notes, keeps in-world sentences', () => {
    expect(isAuthorNoteSentence('The next page waits on what you say.')).toBe(true);
    expect(isAuthorNoteSentence('He will confide in the player if they earn it.')).toBe(true);
    expect(isAuthorNoteSentence('Do not invent a licensed skill title.')).toBe(true);
    expect(isAuthorNoteSentence('Inn first, landing second.', { telegram: true })).toBe(true);
    expect(isAuthorNoteSentence('Dusk, not dawn.', { telegram: true })).toBe(true);
    // Stage shapes are author telegram only — in-world card lines stay.
    expect(isAuthorNoteSentence('Entertainment first, hero second.')).toBe(false);
    expect(isAuthorNoteSentence('Attend opening lecture')).toBe(false);
    expect(isAuthorNoteSentence('Some players find it maddening.')).toBe(false);
    expect(isAuthorNoteSentence('The ferry is already late.')).toBe(false);
    const clean = 'Dawn on the mill landing. The ferry rope is wet.';
    expect(stripAuthorNotes(clean)).toBe(clean);
  });

  it('play bibles carry no author notes in fact fields; raw bibles are untouched', () => {
    const raw = RAW_CAMPAIGN_BIBLES.find((b) => b.id === 'thornferry-road')!;
    const play = getCampaignBibleById('thornferry-road')!;
    expect(raw.openingHook).toMatch(/next page/i);
    expect(play.openingHook).not.toMatch(/next page/i);
    expect(play.openingHook).toMatch(/mill landing/i);
    expect(play.premise).toBe(raw.premise);
    const ck = getCampaignBibleById('cursed-keep')!;
    for (const npc of ck.keyNPCs) {
      expect(`${npc.description} ${npc.hooks.join(' ')}`).not.toMatch(/\bthe player\b/i);
    }
  });

  it('hook card telegram never reaches pickedHook when page 1 is authored', () => {
    for (const card of OPENING_HOOK_DECKS['thornferry-road']) {
      const n = normalizeOpeningHookCard(card);
      expect(n.text).not.toMatch(/Dusk, not dawn|question is sharper|next page|Inn first/i);
      expect(n.page1 ?? '').not.toMatch(/next word is whether/i);
    }
  });

  it('a story with no hub bank gets place cards with descriptions and exits', () => {
    const bible = getCampaignBibleById('thornferry-road')!;
    expect(hubsForBibleId(bible.id)).toHaveLength(0);
    const places = storyPlacesForBible(bible);
    expect(places.length).toBeGreaterThanOrEqual(4);
    expect(places.some((p) => p.name === 'the mill loft')).toBe(true);
    const state = { ...newGameState('thornferry-road'), places: seedStoryPlaces([], bible, false), turn: 1 };
    const card = buildPlaceCard(state, 'the ferry inn at Thornferry', 'the mill landing at Thornferry');
    expect(card.description).toMatch(/inn/i);
    expect(card.exits?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(seedStoryPlaces([], getCampaignBibleById('summoned-pact'), true)).toEqual([]);
  });

  it('an empty place offers its unnamed local; the writer sees it and the role gate allows it', () => {
    expect(minorRoleForPlace('the ferry inn at Thornferry')).toBe('innkeeper');
    expect(minorRoleForPlace('Thornferry chapel stoop')).toBe('priest');
    const state = {
      ...newGameState('thornferry-road'),
      currentLocation: 'the ferry inn at Thornferry',
      npcMemories: [],
      sceneFacts: { crowd: 'unknown' as const, noise: 'unknown' as const, present: [], props: [], lastBeat: '', updatedTurn: 3 },
      turn: 3,
    };
    expect(storyMinorRoles(state)).toEqual(['innkeeper']);
    expect(sceneAllowsRoleIntroduction(state, 'innkeeper', 'look around')).toBe(true);
    expect(formatWriterInfoLayer(state)).toMatch(/an innkeeper \(may speak; give no name\)/);
    const opening = { ...state, openingEstablishment: { ...state.openingEstablishment!, complete: false } };
    expect(storyMinorRoles(opening)).toEqual([]);
  });

  it('Continue repair strips notes from old saved card text and seeds story places', () => {
    const base = newGameState('thornferry-road');
    const old = {
      ...base,
      places: [],
      openingEstablishment: {
        ...base.openingEstablishment!,
        pickedHook: 'Location: Thornferry mill at last light\nDusk. The next page is that answer.',
      },
    };
    const { state, notes } = applyErrorRepairs(old);
    expect(state.openingEstablishment?.pickedHook).toBe('Location: Thornferry mill at last light\nDusk.');
    expect((state.places ?? []).some((p) => p.settlementKind === 'story-place')).toBe(true);
    expect(notes.some((n) => n.code === 'ERR_STORY_AUTHOR_NOTES')).toBe(true);
  });
});
