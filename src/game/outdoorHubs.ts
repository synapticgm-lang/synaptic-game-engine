/**
 * Outdoor hub graph for LitRPG Act-3 sandbox — named travel targets, not MMO art.
 * Original place names from Summoned Pact / Hero Awakening bibles only.
 */

import type { CampaignBible } from '@/data/campaigns/types';
import type { GameState, PlaceRecord } from './types';
import { placeIdFromName } from './places';

export interface OutdoorHub {
  id: string;
  name: string;
  blurb: string;
  threatTier: number;
  linkedQuestIds?: string[];
  aliases?: string[];
}

export const SUMMONED_PACT_HUBS: OutdoorHub[] = [
  { id: 'sp-hub-lowmarket', name: 'Lowmarket', blurb: 'Crowded stalls, fences, and Earth junk buyers.', threatTier: 1, linkedQuestIds: ['sp-quest-side-junk'], aliases: ['the Lowmarket'] },
  { id: 'sp-hub-west-wall', name: 'West Wall', blurb: 'Battlements and gate traffic above the city.', threatTier: 2, aliases: ['the west wall', 'Valespire west wall'] },
  { id: 'sp-hub-weighing-cup', name: 'The Weighing Cup', blurb: 'Inn and rumor house near the cathedral close.', threatTier: 1, aliases: ['Weighing Cup'] },
  { id: 'sp-hub-contract-hall', name: 'Contract Hall', blurb: 'Notice-board and Crown job postings.', threatTier: 1, linkedQuestIds: ['sp-quest-1'] },
  { id: 'sp-hub-cathedral-close', name: 'Cathedral Close', blurb: 'Courtyard and kitchens around Valespire Cathedral.', threatTier: 1, linkedQuestIds: ['sp-quest-side-child'], aliases: ['the close'] },
  { id: 'sp-hub-undercroft', name: 'Cathedral Undercroft', blurb: 'Numbered dungeon floors under the cathedral.', threatTier: 2, aliases: ['Undercroft'] },
  { id: 'sp-hub-palace', name: 'Palace Approach', blurb: 'Guarded approach to Pellane\'s palace ledgers.', threatTier: 2, linkedQuestIds: ['sp-quest-special-ledger'], aliases: ['the palace', 'Valespire Palace'] },
  { id: 'sp-hub-cinderflow', name: 'Cinderflow Road', blurb: 'East road toward Ash Court territory.', threatTier: 3, linkedQuestIds: ['sp-quest-special-other'], aliases: ['the Cinderflow'] },
  { id: 'sp-hub-harbor', name: 'Harbor Quay', blurb: 'Grain ships, smugglers, and quay gossip.', threatTier: 2, aliases: ['the quay', 'Valespire harbor'] },
  { id: 'sp-hub-war-camp', name: 'Pellane War Camp', blurb: 'Banner-smoke and quartermaster crates beyond the walls.', threatTier: 2, aliases: ['war camp', 'the war camp'] },
];

export const HERO_AWAKENING_HUBS: OutdoorHub[] = [
  { id: 'ha-hub-ashline', name: 'Ashline Yard', blurb: 'Crew staging and informal job board.', threatTier: 1, linkedQuestIds: ['ha-quest-2'], aliases: ['the Yard', 'Ashline'] },
  { id: 'ha-hub-low-watt', name: 'The Low Watt', blurb: 'Food-and-rumor hub after clears.', threatTier: 1, aliases: ['Low Watt'] },
  { id: 'ha-hub-ward-rest', name: 'Ward Rest', blurb: 'Healers\' tent and collapse survivors.', threatTier: 1, aliases: ['Ward Rest infirmary'] },
  { id: 'ha-hub-mca-desk', name: 'MCA Field Desk', blurb: 'Auditor stamps and late-registration forms.', threatTier: 1, aliases: ['Meridian desk', 'MCA desk'] },
  { id: 'ha-hub-threshold', name: 'First Threshold Gate', blurb: 'The rift that nearly killed you — still unstable.', threatTier: 2, linkedQuestIds: ['ha-quest-1'], aliases: ['the Threshold', 'Threshold gate'] },
  { id: 'ha-hub-scrap', name: 'Scrap Fence Alley', blurb: 'Pax Orr\'s curios and hush prices.', threatTier: 2, linkedQuestIds: ['ha-quest-side-fence'], aliases: ['scrap alley', 'fence alley'] },
  { id: 'ha-hub-market', name: 'Lampmere Market', blurb: 'Mixed-folk stalls and Grade gossip.', threatTier: 1, aliases: ['the market', 'Lampmere'] },
  { id: 'ha-hub-wall', name: 'Meridian Wall', blurb: 'Night watch and Threshold seam watchers.', threatTier: 2, aliases: ['the wall', 'city wall'] },
  { id: 'ha-hub-archive', name: 'Quiet Archive', blurb: 'Soft research stacks — Quiet Hands leave traces.', threatTier: 1, linkedQuestIds: ['ha-quest-special-name'], aliases: ['the archive'] },
];

export function hubsForBibleId(bibleId: string | undefined | null): OutdoorHub[] {
  if (bibleId === 'summoned-pact') return SUMMONED_PACT_HUBS;
  if (bibleId === 'hero-awakening') return HERO_AWAKENING_HUBS;
  return [];
}

export function hubsForBible(bible: CampaignBible | undefined | null): OutdoorHub[] {
  return hubsForBibleId(bible?.id);
}

function hubToPlace(hub: OutdoorHub): PlaceRecord {
  const dangerTier = hub.threatTier <= 1 ? 1 : hub.threatTier <= 2 ? 2 : 3;
  return {
    id: placeIdFromName(hub.name),
    name: hub.name,
    aliases: hub.aliases,
    threatTier: hub.threatTier,
    dangerTier: dangerTier as 1 | 2 | 3 | 4,
    mapScale: hub.threatTier >= 3 ? 'region' : 'street',
    arcStatus: 'open',
  };
}

/** Seed hub places on New Game without overwriting visited arcs. */
export function seedOutdoorHubPlaces(
  places: PlaceRecord[] | undefined,
  bible: CampaignBible | undefined | null
): PlaceRecord[] {
  const hubs = hubsForBible(bible);
  if (!hubs.length) return places ?? [];
  let next = [...(places ?? [])];
  for (const hub of hubs) {
    const place = hubToPlace(hub);
    const existing = next.find(
      (p) =>
        p.id === place.id
        || p.name.toLowerCase() === place.name.toLowerCase()
        || p.aliases?.some((a) => a.toLowerCase() === place.name.toLowerCase())
    );
    if (existing) {
      next = next.map((p) =>
        p.id === existing.id
          ? {
              ...p,
              threatTier: p.threatTier ?? place.threatTier,
              dangerTier: p.dangerTier ?? place.dangerTier,
              aliases: Array.from(new Set([...(p.aliases ?? []), ...(place.aliases ?? [])])).slice(0, 12),
            }
          : p
      );
    } else {
      next.push(place);
    }
  }
  return next;
}

export function matchHub(
  hubs: OutdoorHub[],
  placeName: string | undefined
): OutdoorHub | null {
  const key = (placeName ?? '').trim().toLowerCase();
  if (!key) return null;
  return (
    hubs.find(
      (h) =>
        h.name.toLowerCase() === key
        || h.aliases?.some((a) => a.toLowerCase() === key)
        || key.includes(h.name.toLowerCase())
    ) ?? null
  );
}

export function formatOutdoorHubsForPrompt(state: GameState): string {
  const hubs = hubsForBibleId(state.campaignBibleId);
  if (!hubs.length) return '';
  const here = (state.currentLocation ?? '').toLowerCase();
  const lines = hubs.map((h) => {
    const visited = (state.places ?? []).some(
      (p) =>
        (p.name.toLowerCase() === h.name.toLowerCase() || p.id === placeIdFromName(h.name))
        && typeof p.lastVisitedTurn === 'number'
    );
    const at = here.includes(h.name.toLowerCase()) ? ' ← HERE' : '';
    const pin = visited ? 'visited' : 'mapped';
    const quests = h.linkedQuestIds?.length ? ` quests=${h.linkedQuestIds.join(',')}` : '';
    return `- ${h.name} [Tier ${h.threatTier}, ${pin}]${at}: ${h.blurb}${quests}`;
  });
  return `[OUTDOOR HUBS — travel targets in this starting region. Player may leave the spine. Do not invent licensed place names.]\n${lines.join('\n')}`;
}

/** Light travel pads when outdoors — never invent crowd; skip during opening covers / alone first beats. */
export function outdoorHubTravelChoices(state: GameState, max = 2): string[] {
  if (state.openingEstablishment?.complete === false) return [];
  if (state.activeDungeon) return [];
  if (state.activeEncounter) return [];
  const hubs = hubsForBibleId(state.campaignBibleId);
  if (!hubs.length) return [];
  const here = (state.currentLocation ?? '').toLowerCase();
  const candidates = hubs.filter((h) => !here.includes(h.name.toLowerCase()));
  // Prefer unvisited, then linked to active quests.
  const activeIds = new Set(
    (state.quests ?? []).filter((q) => q.status === 'active' && q.revealed).map((q) => q.id)
  );
  const scored = [...candidates].sort((a, b) => {
    const aLink = a.linkedQuestIds?.some((id) => activeIds.has(id)) ? 0 : 1;
    const bLink = b.linkedQuestIds?.some((id) => activeIds.has(id)) ? 0 : 1;
    if (aLink !== bLink) return aLink - bLink;
    const aVis = (state.places ?? []).some(
      (p) => p.name.toLowerCase() === a.name.toLowerCase() && p.lastVisitedTurn != null
    )
      ? 1
      : 0;
    const bVis = (state.places ?? []).some(
      (p) => p.name.toLowerCase() === b.name.toLowerCase() && p.lastVisitedTurn != null
    )
      ? 1
      : 0;
    return aVis - bVis;
  });
  return scored.slice(0, max).map((h) => `Travel toward ${h.name}`);
}
