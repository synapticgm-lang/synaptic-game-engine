import { describe, expect, it } from 'vitest';
import { getCampaignBibleById } from '@/data/campaigns';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { seedStateFromCampaignBible } from './campaignSeed';
import {
  isAloneArrivalPick,
  normalizeOpeningHookCard,
  openingHookDeck,
  pendingRequiredCovers,
  resolveOpeningMode,
  resolveOpeningPrompts,
  seedCoverAnswers,
} from './openingEstablishment';
import {
  applyOpeningContract,
  ensureStarterLookCharacter,
  stitchOpeningScene,
} from './openingStitch';
import type { EngineMode, GameState } from './types';
import type { CampaignBible, OpeningHookCard } from '@/data/campaigns/types';

function stitchCard(bible: CampaignBible, mode: EngineMode, card: OpeningHookCard, index: number): string {
  const seed = `opening-paste|${bible.id}|${index}`;
  const picked = normalizeOpeningHookCard(card);
  const aloneArrival = isAloneArrivalPick(picked);
  let state: GameState = createInitialState(bible.title, mode, bible.archetype);
  state = seedStateFromCampaignBible({ ...state, seed, campaignBibleId: bible.id }, bible);
  const character = ensureStarterLookCharacter(state.character);
  const openingMode = resolveOpeningMode(bible, mode);
  const openingPrompts = applyOpeningContract(
    resolveOpeningPrompts(bible, mode, bible.archetype),
    bible,
    aloneArrival,
    seed
  );
  const coverAnswers = seedCoverAnswers(bible, character, picked.location);
  const pendingCovers = pendingRequiredCovers(openingPrompts, character, openingMode);
  return stitchOpeningScene({
    ...state,
    character,
    seed,
    currentLocation: picked.location || coverAnswers.where || bible.startingLocation || state.currentLocation,
    openingEstablishment: {
      pending: pendingCovers,
      answers: coverAnswers,
      complete: pendingCovers.length === 0,
      sceneWritten: true,
      mode: openingMode,
      pickedHook: picked.text,
      pickedHookFallback: picked.page1 || picked.fallback,
      aloneArrival,
    },
  });
}

describe('playtest09b — page 1 is one authored paragraph', () => {
  it('HUD/BUILD stay on 2026-09-09, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toMatch(/^2026-09-09/);
    expect(BUILD_STAMP).toMatch(/^2026-09-09/);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('every Summoned Pact page 1 is player prose, not writer rails', () => {
    const bible = getCampaignBibleById('summoned-pact')!;
    openingHookDeck(bible).forEach((card, i) => {
      const prose = stitchCard(bible, 'litrpg', card, i);
      expect(prose, `${i}`).not.toMatch(/Do not invent|Do not place|Do not spawn|Ruin level:|The camera stays HERE/i);
      expect(prose, `${i}`).not.toMatch(/floor-joint|ears still ring from the pull|you are cargo/i);
      expect(prose.length, `${i}`).toBeGreaterThan(80);
    });
  });

  it('Cursed Keep does not glue handler / slate / cargo / indoor summon spice', () => {
    const bible = getCampaignBibleById('cursed-keep')!;
    openingHookDeck(bible).forEach((card, i) => {
      const prose = stitchCard(bible, 'dnd', card, i);
      expect(prose, `${i}`).not.toMatch(/handler waits|a scribe has a slate|you are cargo|kit, oath, or a door/i);
      expect(prose, `${i}`).not.toMatch(/someone in the room needs a name/i);
      expect(prose, `${i}`).not.toMatch(/ears still ring from the pull|floor-joint ticks|chalk grit/i);
    });
  });

  it('Salt Road and Thornferry stay in their own rooms', () => {
    const salt = getCampaignBibleById('salt-road-heist')!;
    const thorn = getCampaignBibleById('thornferry-road')!;
    for (const [bible, mode] of [[salt, 'rpg'], [thorn, 'pyoa']] as const) {
      openingHookDeck(bible).forEach((card, i) => {
        const prose = stitchCard(bible, mode, card, i);
        expect(prose, `${bible.id}:${i}`).not.toMatch(/handler waits|you are cargo|kit, oath, or a door|the pull/i);
        expect(prose, `${bible.id}:${i}`).not.toMatch(/floor-joint ticks|someone in the room/i);
      });
    }
  });

  it('L09 shows the hall and priests; L13 puts scavenger and militia on camera', () => {
    const bible = getCampaignBibleById('summoned-pact')!;
    const deck = openingHookDeck(bible);
    const ash = deck.find((c) => typeof c !== 'string' && /Ash-adjacent/i.test(c.location ?? ''));
    const west = deck.find((c) => typeof c !== 'string' && /west wall/i.test(c.location ?? ''));
    const fest = deck.find((c) => typeof c !== 'string' && /festival/i.test(c.location ?? ''));
    expect(ash && west && fest).toBeTruthy();
    const ashProse = stitchCard(bible, 'litrpg', ash!, deck.indexOf(ash!));
    const westProse = stitchCard(bible, 'litrpg', west!, deck.indexOf(west!));
    const festProse = stitchCard(bible, 'litrpg', fest!, deck.indexOf(fest!));
    expect(ashProse).toMatch(/Ash Court priests/i);
    expect(ashProse).not.toMatch(/rival hall/i);
    expect(westProse).toMatch(/scavenger|militia/i);
    expect(westProse).not.toMatch(/handler waits/i);
    expect((westProse.match(/what name/gi) ?? []).length).toBe(1);
    expect(festProse).toMatch(/sunlit cobbles|Earth clothes/i);
    expect(festProse).not.toMatch(/you were in the crowd|this is HERE|Earth is already gone/i);
  });

  it('alone ruins lock a specific building noun', () => {
    const bible = getCampaignBibleById('summoned-pact')!;
    const nouns = /barn|bathhouse|watchtower|market hall|waystation|foundation stones|outline/i;
    openingHookDeck(bible)
      .filter((c) => typeof c !== 'string' && /alone/i.test(c.location ?? ''))
      .forEach((card, i) => {
        const prose = stitchCard(bible, 'litrpg', card, i);
        expect(prose, typeof card === 'string' ? card : card.location).toMatch(nouns);
        expect(prose).toMatch(/lungs|rain|wind|damp|ash|cold|wet|soaks|shiver/i);
        expect(prose).toMatch(/what (name|do you enter)/i);
        expect(prose).not.toMatch(/shabby building|a damaged building|four ruined walls|designation|this is HERE/i);
        expect((prose.match(/what name|what do you enter/gi) ?? []).length).toBe(1);
      });
  });

  it('flagship page 1 never names the medium', () => {
    for (const [id, mode] of [
      ['summoned-pact', 'litrpg'],
      ['cursed-keep', 'dnd'],
      ['salt-road-heist', 'rpg'],
      ['thornferry-road', 'pyoa'],
    ] as const) {
      const bible = getCampaignBibleById(id)!;
      openingHookDeck(bible).forEach((card, i) => {
        const prose = stitchCard(bible, mode, card, i);
        expect(prose, `${id}:${i}`).not.toMatch(/next page|this is HERE|primary user designation|Seconds left:|\[ SYSTEM \]/i);
        expect(prose, `${id}:${i}`).not.toMatch(/designation/i);
      });
    }
  });

  it('R01, R02, P01, and P06 end on a player verb, not a postcard', () => {
    const salt = getCampaignBibleById('salt-road-heist')!;
    const thorn = getCampaignBibleById('thornferry-road')!;
    const loft = openingHookDeck(salt).find((c) => typeof c !== 'string' && /warehouse loft/i.test(c.location ?? ''));
    const way = openingHookDeck(salt).find((c) => typeof c !== 'string' && /waystation/i.test(c.location ?? ''));
    const mill = openingHookDeck(thorn).find((c) => typeof c !== 'string' && /mill landing/i.test(c.location ?? ''));
    const side = openingHookDeck(thorn).find((c) => typeof c !== 'string' && /side-path/i.test(c.location ?? ''));
    const dusk = openingHookDeck(thorn).find((c) => typeof c !== 'string' && /last light/i.test(c.location ?? ''));
    const r01 = stitchCard(salt, 'rpg', loft!, 0);
    const r02 = stitchCard(salt, 'rpg', way!, 1);
    const p01 = stitchCard(thorn, 'pyoa', mill!, 0);
    const p05 = stitchCard(thorn, 'pyoa', side!, 4);
    const p06 = stitchCard(thorn, 'pyoa', dusk!, 5);
    expect(r01).toMatch(/Talk is done|First move is yours/i);
    expect(r02).toMatch(/You.re late|What do you tell him/i);
    expect(p01).toMatch(/This has to move|I walk it alone/i);
    expect(p01).not.toMatch(/next hour|next page|Oakhaven/i);
    expect(p05).toMatch(/look at you|Wren.*wait/i);
    expect(p05).not.toMatch(/ditch|call out|let Wren speak|Seconds left|draw your own weapon/i);
    expect(p06).not.toMatch(/next page/i);
    expect(p06).toMatch(/ford|mill/i);
  });

  it('tabletop name asks are not LitRPG registrar voice', () => {
    const cursed = getCampaignBibleById('cursed-keep')!;
    const styled = applyOpeningContract(
      resolveOpeningPrompts(cursed, 'dnd', cursed.archetype),
      cursed,
      false,
      'greyhollow-1'
    );
    const name = styled.find((p) => p.kind === 'name')?.question ?? '';
    expect(name).not.toMatch(/handler|slate|cargo|someone in the room/i);
    expect(name).toMatch(/name/i);
  });
});
