/**
 * Act-3 LitRPG sandbox — faction seed/mutate, hubs, XP banks, quest reveal.
 */
import { describe, expect, it } from 'vitest';
import {
  mutateFactionOnQuestEvent,
  mutateFactionOnStance,
  seedFactionStandingsForBible,
  standingFromInfluence,
} from './factionStandings';
import { hubsForBibleId, matchHub, seedOutdoorHubPlaces, outdoorHubTravelChoices } from './outdoorHubs';
import { applySandboxXpAwards, SANDBOX_XP } from './sandboxXp';
import {
  revealQuestsFromBanks,
  seedLocalStarterQuest,
  syncQuestsFromPlay,
  resumeMainQuestFocus,
} from './questPlay';
import { createInitialState } from './defaults';
import { emptyWorldLedger } from './worldSim';
import { summonedPact } from '@/data/campaigns/summonedPact';
import { heroAwakening } from '@/data/campaigns/heroAwakening';

describe('Act-3 faction standings', () => {
  it('seeds Summoned Pact factions (Pellane / Ash / Street)', () => {
    const seeded = seedFactionStandingsForBible(summonedPact);
    expect(seeded.map((f) => f.id)).toEqual(['pellane-crown', 'ash-court', 'valespire-street']);
    expect(seeded.every((f) => f.standing === 'neutral')).toBe(true);
  });

  it('seeds Hero Awakening factions (MCA / Independents / Vesper / Quiet Hands)', () => {
    const seeded = seedFactionStandingsForBible(heroAwakening);
    expect(seeded.map((f) => f.id)).toContain('mca');
    expect(seeded.find((f) => f.id === 'independent-riftwards')?.standing).toBe('friendly');
    expect(seeded.find((f) => f.id === 'vesper-cartel')?.standing).toBe('unfriendly');
  });

  it('mutates standing on kind stance toward Pellane handler', () => {
    const base = seedFactionStandingsForBible(summonedPact);
    const next = mutateFactionOnStance(base, 'Help Captain Sera Quill with the tour', ['Captain Sera Quill']);
    const pellane = next.find((f) => f.id === 'pellane-crown')!;
    expect((pellane.influence ?? 0)).toBeGreaterThan(0);
    expect(standingFromInfluence(pellane.influence ?? 0)).toBe(pellane.standing);
  });

  it('mutates on quest complete', () => {
    const base = seedFactionStandingsForBible(summonedPact);
    const next = mutateFactionOnQuestEvent(base, 'sp-quest-side-junk', 'complete');
    expect(next.find((f) => f.id === 'valespire-street')!.influence).toBeGreaterThan(0);
  });
});

describe('Act-3 outdoor hubs', () => {
  it('has 6–12 Summoned Pact hubs with original names', () => {
    const hubs = hubsForBibleId('summoned-pact');
    expect(hubs.length).toBeGreaterThanOrEqual(6);
    expect(hubs.length).toBeLessThanOrEqual(12);
    expect(hubs.some((h) => h.name === 'Lowmarket')).toBe(true);
    expect(hubs.some((h) => /fable|albion|fallout/i.test(h.name))).toBe(false);
  });

  it('seeds places with threatTier', () => {
    const places = seedOutdoorHubPlaces([], summonedPact);
    expect(places.length).toBeGreaterThanOrEqual(6);
    expect(places.every((p) => typeof p.threatTier === 'number')).toBe(true);
    expect(matchHub(hubsForBibleId('summoned-pact'), 'the Lowmarket')?.id).toBe('sp-hub-lowmarket');
  });

  it('offers travel choices when opening complete and outdoors', () => {
    const state = {
      ...createInitialState('Act3', 'litrpg'),
      campaignBibleId: 'summoned-pact',
      openingEstablishment: { pending: [], answers: {}, complete: true, sceneWritten: true },
      currentLocation: 'Cathedral Close',
      activeDungeon: null,
      activeEncounter: null,
      quests: [],
      places: [],
    };
    const choices = outdoorHubTravelChoices(state, 2);
    expect(choices.length).toBeGreaterThan(0);
    expect(choices[0]).toMatch(/^Travel toward /);
  });
});

describe('Act-3 side-quest reveal + resume', () => {
  it('keeps L2+ hidden until bank trigger', () => {
    let quests = seedLocalStarterQuest([], summonedPact.starterQuests);
    const junk = quests.find((q) => q.id === 'sp-quest-side-junk')!;
    expect(junk.revealed).toBe(false);
    expect(junk.type).toBe('side');
    quests = syncQuestsFromPlay(quests, [], 'Look around the circle', { locked: false });
    expect(quests.find((q) => q.id === 'sp-quest-side-junk')!.revealed).toBe(false);
    quests = revealQuestsFromBanks(quests, 'Sera Quill warns about Lowmarket thieves');
    expect(quests.find((q) => q.id === 'sp-quest-side-junk')!.revealed).toBe(true);
    expect(quests.find((q) => q.id === 'sp-quest-side-junk')!.status).toBe('active');
  });

  it('resume main exposes next objective + place pin', () => {
    const quests = seedLocalStarterQuest([], summonedPact.starterQuests).map((q) =>
      q.id === 'sp-quest-1'
        ? { ...q, revealed: true, status: 'active' as const }
        : q
    );
    const state = {
      ...createInitialState('Act3', 'litrpg'),
      openingEstablishment: { pending: [], answers: {}, complete: true },
      quests,
    };
    const focus = resumeMainQuestFocus(state);
    expect(focus.quest?.id).toBe('sp-quest-1');
    expect(focus.nextObjective).toBeTruthy();
    expect(focus.placePin).toBe('Cathedral Close');
  });
});

describe('Act-3 off-spine XP', () => {
  it('awards discover-hub XP once', () => {
    const base = {
      ...createInitialState('Act3', 'litrpg'),
      campaignBibleId: 'summoned-pact',
      places: seedOutdoorHubPlaces([], summonedPact),
      sandboxAwardKeys: [] as string[],
      worldLedger: emptyWorldLedger(),
      quests: [],
    };
    const first = applySandboxXpAwards(base, {
      playerAction: 'Travel toward Lowmarket',
      locationName: 'Lowmarket',
      questsBefore: [],
      questsAfter: [],
      events: [],
      turn: 3,
    });
    expect(first.xp).toBe(SANDBOX_XP.discoverHub);
    expect(first.notes.some((n) => /XP Gained: 8/.test(n))).toBe(true);
    const second = applySandboxXpAwards(
      { ...base, places: first.places, sandboxAwardKeys: first.awardKeys },
      {
        playerAction: 'Look around Lowmarket',
        locationName: 'Lowmarket',
        questsBefore: [],
        questsAfter: [],
        events: [],
        turn: 4,
      }
    );
    expect(second.xp).toBe(0);
  });

  it('awards quest tick + complete XP', () => {
    const before = [
      {
        id: 'sp-quest-side-junk',
        name: 'Otherworld Junk',
        description: 'Fence',
        status: 'active' as const,
        type: 'side' as const,
        revealed: true,
        objectives: [
          { id: 'a', description: 'Find a fence', completed: false },
          { id: 'b', description: 'Sell', completed: false },
        ],
      },
    ];
    const afterTick = [
      {
        ...before[0],
        objectives: [
          { id: 'a', description: 'Find a fence', completed: true },
          { id: 'b', description: 'Sell', completed: false },
        ],
      },
    ];
    const state = {
      ...createInitialState('Act3', 'litrpg'),
      campaignBibleId: 'summoned-pact',
      places: [],
      sandboxAwardKeys: [] as string[],
    };
    const tick = applySandboxXpAwards(state, {
      playerAction: 'Talk to the fence',
      questsBefore: before,
      questsAfter: afterTick,
      events: [],
      turn: 5,
    });
    expect(tick.xp).toBe(SANDBOX_XP.questTick);
    const afterDone = [{ ...afterTick[0], status: 'completed' as const }];
    const done = applySandboxXpAwards(
      { ...state, sandboxAwardKeys: tick.awardKeys },
      {
        playerAction: 'Finish the sale',
        questsBefore: afterTick,
        questsAfter: afterDone,
        events: [],
        turn: 6,
      }
    );
    expect(done.xp).toBe(SANDBOX_XP.questCompleteSide);
  });
});
