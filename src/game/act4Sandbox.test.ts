/**
 * Act-4 LitRPG sandbox depth — denser reveals, faction contacts, hub beats, resume.
 */
import { describe, expect, it } from 'vitest';
import {
  FACTION_CONTACTS,
  matchFactionContact,
  mutateFactionOnStance,
  seedFactionStandingsForBible,
} from './factionStandings';
import {
  atMappedHubAfterOpening,
  hubArrivalChoicePads,
  pickHubArrivalBeat,
  resolveHubArrival,
} from './hubEncounters';
import { hubsForBibleId, parseTravelDestination } from './outdoorHubs';
import {
  revealQuestsFromBanks,
  resumeMainQuestFocus,
  resumeMainTravelChoice,
  seedLocalStarterQuest,
} from './questPlay';
import { createInitialState } from './defaults';
import { summonedPact } from '@/data/campaigns/summonedPact';
import { heroAwakening } from '@/data/campaigns/heroAwakening';
import { isAloneOrEmptyScene } from './choicePipeline';

describe('Act-4 denser side reveals', () => {
  it('reveals Otherworld Junk from weighing-cup / Earth-kit talk', () => {
    let quests = seedLocalStarterQuest([], summonedPact.starterQuests);
    expect(quests.find((q) => q.id === 'sp-quest-side-junk')!.revealed).toBe(false);
    quests = revealQuestsFromBanks(quests, 'At the Weighing Cup someone mentions Earth kit for sale');
    expect(quests.find((q) => q.id === 'sp-quest-side-junk')!.revealed).toBe(true);
  });

  it('reveals Marked Child from Kitchen Saint gossip', () => {
    let quests = seedLocalStarterQuest([], summonedPact.starterQuests);
    quests = revealQuestsFromBanks(quests, 'Brother Tam whispers about the Kitchen Saint and a marked child');
    expect(quests.find((q) => q.id === 'sp-quest-side-child')!.revealed).toBe(true);
  });

  it('reveals Yard Share from Mara alone', () => {
    let quests = seedLocalStarterQuest([], heroAwakening.starterQuests);
    quests = revealQuestsFromBanks(quests, 'Mara offers work after the clear');
    expect(quests.find((q) => q.id === 'ha-quest-2')!.revealed).toBe(true);
  });

  it('reveals Scrap Fence from hush price talk', () => {
    let quests = seedLocalStarterQuest([], heroAwakening.starterQuests);
    quests = revealQuestsFromBanks(quests, 'They talk hush prices on curios');
    expect(quests.find((q) => q.id === 'ha-quest-side-fence')!.revealed).toBe(true);
  });
});

describe('Act-4 faction contacts', () => {
  it('lists bible-grounded contacts for both campaigns', () => {
    expect(FACTION_CONTACTS.some((c) => c.name === 'Captain Sera Quill')).toBe(true);
    expect(FACTION_CONTACTS.some((c) => c.name === 'Mara Keene')).toBe(true);
    expect(FACTION_CONTACTS.some((c) => /fable|albion|fallout/i.test(c.name))).toBe(false);
  });

  it('matches contacts and applies weighted stance deltas', () => {
    expect(matchFactionContact('Talk to Captain Sera Quill')?.factionId).toBe('pellane-crown');
    expect(matchFactionContact('Help Mara Keene')?.factionId).toBe('independent-riftwards');
    const base = seedFactionStandingsForBible(summonedPact);
    const next = mutateFactionOnStance(base, 'Help Captain Sera Quill with the tour', ['Captain Sera Quill']);
    const pellane = next.find((f) => f.id === 'pellane-crown')!;
    // kind base 6 * 1.75 ≈ 11
    expect(pellane.influence ?? 0).toBeGreaterThanOrEqual(10);
  });

  it('Brother Tam moves Valespire Street, not only crowd keywords', () => {
    const base = seedFactionStandingsForBible(summonedPact);
    const next = mutateFactionOnStance(base, 'Thank Brother Tam for the bread', ['Brother Tam']);
    expect(next.find((f) => f.id === 'valespire-street')!.influence).toBeGreaterThan(0);
  });
});

describe('Act-4 hub encounter banks', () => {
  it('rotates explore/social on Tier-1; threat on higher tiers', () => {
    const low = hubsForBibleId('summoned-pact').find((h) => h.id === 'sp-hub-lowmarket')!;
    const a = pickHubArrivalBeat(low, 0, 'summoned-pact')!;
    const b = pickHubArrivalBeat(low, 1, 'summoned-pact')!;
    const c = pickHubArrivalBeat(low, 2, 'summoned-pact')!;
    expect(a.kind).toBe('explore');
    expect(b.kind).toBe('social');
    expect(c.kind).toBe('explore'); // Tier-1 soft pool skips threat
    const road = hubsForBibleId('summoned-pact').find((h) => h.id === 'sp-hub-cinderflow')!;
    const kinds = [0, 1, 2].map((v) => pickHubArrivalBeat(road, v, 'summoned-pact')!.kind);
    expect(kinds).toContain('threat');
  });

  it('parseTravelDestination resolves Travel toward Lowmarket', () => {
    const hub = parseTravelDestination('Travel toward Lowmarket', 'summoned-pact');
    expect(hub?.id).toBe('sp-hub-lowmarket');
  });

  it('hub arrival choices appear after opening at a hub', () => {
    const state = {
      ...createInitialState('Act4', 'litrpg'),
      campaignBibleId: 'summoned-pact',
      openingEstablishment: { pending: [], answers: {}, complete: true, sceneWritten: true },
      currentLocation: 'Lowmarket',
      activeDungeon: null,
      activeEncounter: null,
      sandboxAwardKeys: [] as string[],
      places: [],
    };
    expect(atMappedHubAfterOpening(state)).toBe(true);
    expect(isAloneOrEmptyScene(state)).toBe(false);
    const pads = hubArrivalChoicePads(state, 2);
    expect(pads.length).toBeGreaterThan(0);
    const resolved = resolveHubArrival(state, 'Lowmarket');
    expect(resolved?.hub.name).toBe('Lowmarket');
    expect(resolved?.beat.pressure.length).toBeGreaterThan(10);
  });

  it('keeps alone invent gate before opening complete', () => {
    const state = {
      ...createInitialState('Act4', 'litrpg'),
      campaignBibleId: 'summoned-pact',
      openingEstablishment: {
        pending: [],
        answers: {},
        complete: false,
        aloneArrival: true,
        sceneWritten: true,
      },
      currentLocation: 'a ruined empty circle',
    };
    expect(atMappedHubAfterOpening(state)).toBe(false);
    expect(isAloneOrEmptyScene(state)).toBe(true);
  });
});

describe('Act-4 stronger resume-main', () => {
  it('exposes resumeCopy, distanceHint, and Return-to pad when off-spine', () => {
    const quests = seedLocalStarterQuest([], summonedPact.starterQuests).map((q) =>
      q.id === 'sp-quest-1'
        ? { ...q, revealed: true, status: 'active' as const }
        : q
    );
    const state = {
      ...createInitialState('Act4', 'litrpg'),
      campaignBibleId: 'summoned-pact',
      openingEstablishment: { pending: [], answers: {}, complete: true },
      currentLocation: 'Lowmarket',
      quests,
      activeDungeon: null,
      activeEncounter: null,
    };
    const focus = resumeMainQuestFocus(state);
    expect(focus.placePin).toBe('Cathedral Close');
    expect(focus.offSpine).toBe(true);
    expect(focus.distanceHint).toBe('elsewhere');
    expect(focus.resumeCopy).toMatch(/Next:/);
    expect(resumeMainTravelChoice(state)).toBe('Return to Cathedral Close');
  });

  it('marks distance here when at the pin', () => {
    const quests = seedLocalStarterQuest([], summonedPact.starterQuests).map((q) =>
      q.id === 'sp-quest-1'
        ? { ...q, revealed: true, status: 'active' as const }
        : q
    );
    const state = {
      ...createInitialState('Act4', 'litrpg'),
      openingEstablishment: { pending: [], answers: {}, complete: true },
      currentLocation: 'Cathedral Close',
      quests,
    };
    const focus = resumeMainQuestFocus(state);
    expect(focus.offSpine).toBe(false);
    expect(focus.distanceHint).toBe('here');
    expect(resumeMainTravelChoice(state)).toBeNull();
  });
});
