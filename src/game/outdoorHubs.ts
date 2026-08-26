/**
 * Outdoor hub graph for Act-3/4 sandbox — named travel targets, not MMO art.
 * Full banks: Summoned Pact / Hero Awakening.
 * Thin ports: ready LitRPG + flagship tabletop (Cursed Keep) + flagship story-RPG (Salt Road).
 * PYOA and blank canvases stay empty (Mode DNA / custom shell).
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
  { id: 'sp-hub-contract-hall', name: 'Contract Hall', blurb: 'Notice-board and Crown job postings.', threatTier: 1, linkedQuestIds: ['sp-quest-1'], aliases: ['the Contract Hall'] },
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

/** System Integration — urban survivor hubs (thin). */
export const SYSTEM_INTEGRATION_HUBS: OutdoorHub[] = [
  { id: 'si-hub-street', name: 'Cracked Street', blurb: 'Your Integration start — cracked asphalt and a blue panel.', threatTier: 1, linkedQuestIds: ['si-quest-1'], aliases: ['cracked city street', 'the street'] },
  { id: 'si-hub-store', name: 'Convenience Store Dungeon', blurb: 'Tier-1 micro-dungeon seeded into a corner shop.', threatTier: 2, linkedQuestIds: ['si-quest-1'], aliases: ['the store', 'convenience store'] },
  { id: 'si-hub-riverside', name: 'Riverside Stronghold', blurb: 'Sanctioned hub — housing, crafting, Wave duty.', threatTier: 2, linkedQuestIds: ['si-quest-2'], aliases: ['Riverside', 'the stronghold'] },
  { id: 'si-hub-corridor', name: 'Contested Corridor', blurb: 'Two-hour run between street and Riverside.', threatTier: 2, aliases: ['the corridor'] },
  { id: 'si-hub-wave-wall', name: 'Wave Wall', blurb: 'Reinforced perimeter waiting for the next surge.', threatTier: 2, linkedQuestIds: ['si-quest-3'], aliases: ['the wall', 'hub wall'] },
  { id: 'si-hub-dead-border', name: 'Dead Zone Border', blurb: 'Violet-sky edge where panels go dark.', threatTier: 3, linkedQuestIds: ['si-quest-4'], aliases: ['dead zone', 'the border'] },
];

/** Gatebreak Ward — district defense (thin). */
export const GATEBREAK_WARD_HUBS: OutdoorHub[] = [
  { id: 'gw-hub-shelter', name: 'Ward 9 Shelter', blurb: 'Civilian bunker and scrap beds.', threatTier: 1, linkedQuestIds: ['gatebreak-ward-quest-1'], aliases: ['the shelter', 'Ward 9'] },
  { id: 'gw-hub-militia', name: 'Militia Post', blurb: 'Sergeant Rill\'s clipboard and armbands.', threatTier: 1, aliases: ['militia desk', 'Rill\'s post'] },
  { id: 'gw-hub-subway', name: 'Subway Gate', blurb: 'Unscheduled B-gate under the tracks.', threatTier: 3, linkedQuestIds: ['gatebreak-ward-quest-1'], aliases: ['the subway', 'subway B-gate'] },
  { id: 'gw-hub-guild', name: 'Guild Desk', blurb: 'Licensed hunters and contract smiles.', threatTier: 2, aliases: ['hunter guild', 'Vex\'s desk'] },
  { id: 'gw-hub-scrap', name: 'Scrap Market', blurb: 'Unlicensed loot and quiet buyers.', threatTier: 2, aliases: ['the scrap market'] },
  { id: 'gw-hub-evac', name: 'Evacuation Yard', blurb: 'Rumored exits for people with working cars.', threatTier: 1, aliases: ['evac yard'] },
];

/** Ascending Spire — climb plaza hubs (thin). */
export const ASCENDING_SPIRE_HUBS: OutdoorHub[] = [
  { id: 'as-hub-gate', name: 'Spire Gate Plaza', blurb: 'Permits, intel buyers, and the black tower.', threatTier: 1, linkedQuestIds: ['ascending-spire-quest-1'], aliases: ['Spire Gate', 'the plaza'] },
  { id: 'as-hub-board', name: 'Ranking Board', blurb: 'Public climb ranks — fame and assassins.', threatTier: 1, aliases: ['the board', 'climber board'] },
  { id: 'as-hub-camp', name: 'Climber Camp', blurb: 'Tents and ration brick smoke outside the gate.', threatTier: 1, aliases: ['the camp'] },
  { id: 'as-hub-floor1', name: 'Floor 1 Antechamber', blurb: 'First sealed biome before the Floor Warden.', threatTier: 2, linkedQuestIds: ['ascending-spire-quest-1'], aliases: ['Floor 1', 'antechamber'] },
  { id: 'as-hub-broker', name: 'Map Broker Stall', blurb: 'Verified floor intel for Spire Coin.', threatTier: 1, aliases: ['map broker', 'broker stall'] },
  { id: 'as-hub-rival', name: 'Rival Guild Tent', blurb: 'Cheerful climbers who may steal your clear.', threatTier: 2, aliases: ['rival tent', 'guild tent'] },
];

/** Fabled Legacy — village walkabouts (thin). */
export const FABLED_LEGACY_HUBS: OutdoorHub[] = [
  { id: 'fl-hub-square', name: 'Mossford Square', blurb: 'Quiet village heart between mill and chapel.', threatTier: 1, linkedQuestIds: ['fl-quest-1'], aliases: ['the square', 'Mossford'] },
  { id: 'fl-hub-inn', name: 'The Crooked Beam', blurb: 'Inn where wounded strangers collapse.', threatTier: 1, linkedQuestIds: ['fl-quest-1'], aliases: ['Crooked Beam', 'the inn'] },
  { id: 'fl-hub-chapel', name: 'Chapel Menhir', blurb: 'Old Faith stone behind the village.', threatTier: 1, aliases: ['the menhir', 'chapel stone'] },
  { id: 'fl-hub-smithy', name: 'Marta\'s Smithy', blurb: 'Forge heat and ceremonial sickle work.', threatTier: 1, linkedQuestIds: ['fl-quest-2'], aliases: ['the smithy', 'blacksmith'] },
  { id: 'fl-hub-trail', name: 'Greentooth Trailhead', blurb: 'Lower hills path toward the Hollow Cairn.', threatTier: 2, linkedQuestIds: ['fl-quest-3'], aliases: ['trailhead', 'lower hills'] },
  { id: 'fl-hub-mill', name: 'River Tess Mill', blurb: 'Mill noise and valley gossip.', threatTier: 1, aliases: ['the mill'] },
];

/** Cursed Keep — flagship tabletop (thin). */
export const CURSED_KEEP_HUBS: OutdoorHub[] = [
  { id: 'ck-hub-inn', name: 'Greyhollow Inn', blurb: 'Last coach stop — warm ale, cold silence.', threatTier: 1, linkedQuestIds: ['ck-quest-1'], aliases: ['the inn', 'Greyhollow Tavern', 'the tavern'] },
  { id: 'ck-hub-church', name: 'Greyhollow Church', blurb: 'Father Aldous and six sleepless nights.', threatTier: 1, linkedQuestIds: ['ck-quest-2'], aliases: ['the church', 'the chapel'] },
  { id: 'ck-hub-gate', name: 'Keep Gate', blurb: 'Chained gate on the granite hill — footprints stop here.', threatTier: 2, linkedQuestIds: ['ck-quest-1'], aliases: ['the keep gate', 'Greymark gate'] },
  { id: 'ck-hub-graveyard', name: 'Greyhollow Graveyard', blurb: 'Fresh graves opened from the inside.', threatTier: 2, linkedQuestIds: ['ck-quest-2'], aliases: ['the graveyard'] },
  { id: 'ck-hub-apothecary', name: 'Mira\'s Apothecary', blurb: 'Remedies and a decade of hidden journals.', threatTier: 1, linkedQuestIds: ['ck-quest-3'], aliases: ['the apothecary', 'apothecary shop'] },
  { id: 'ck-hub-treeline', name: 'Blackspine Treeline', blurb: 'Forest edge where kindling baskets tip over.', threatTier: 2, aliases: ['the treeline', 'Blackspine edge'] },
];

/** Salt Road Heist — flagship story-RPG (thin). */
export const SALT_ROAD_HUBS: OutdoorHub[] = [
  { id: 'sr-hub-waystation', name: 'Salt Road Waystation', blurb: 'Staging point before the Consul\'s caravan.', threatTier: 1, linkedQuestIds: ['salt-road-heist-quest-1'], aliases: ['the waystation', 'Salt Road'] },
  { id: 'sr-hub-caravan', name: 'Consul Caravan Camp', blurb: 'Guards, sealed crates, and the tax ledger.', threatTier: 2, linkedQuestIds: ['salt-road-heist-quest-1'], aliases: ['caravan camp', 'the caravan'] },
  { id: 'sr-hub-safehouse', name: 'Safehouse Alley', blurb: 'Vessa\'s bribe-priced bolt-hole.', threatTier: 1, aliases: ['the safehouse', 'Vessa\'s alley'] },
  { id: 'sr-hub-fence', name: 'Harbor Fence', blurb: 'Coast buyers for hot ledgers.', threatTier: 2, aliases: ['the fence', 'harbor buyer'] },
  { id: 'sr-hub-market', name: 'Bribe Market', blurb: 'Every favor has a Salt Road price.', threatTier: 1, aliases: ['the bribe market'] },
  { id: 'sr-hub-checkpoint', name: 'Checkpoint Rise', blurb: 'Heat rises here — papers or a fight.', threatTier: 2, aliases: ['the checkpoint'] },
];

const HUBS_BY_BIBLE: Record<string, OutdoorHub[]> = {
  'summoned-pact': SUMMONED_PACT_HUBS,
  'hero-awakening': HERO_AWAKENING_HUBS,
  'system-integration': SYSTEM_INTEGRATION_HUBS,
  'gatebreak-ward': GATEBREAK_WARD_HUBS,
  'ascending-spire': ASCENDING_SPIRE_HUBS,
  'fabled-legacy': FABLED_LEGACY_HUBS,
  'cursed-keep': CURSED_KEEP_HUBS,
  'salt-road-heist': SALT_ROAD_HUBS,
};

export function hubsForBibleId(bibleId: string | undefined | null): OutdoorHub[] {
  if (!bibleId) return [];
  return HUBS_BY_BIBLE[bibleId] ?? [];
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

/** Parse "Travel toward X" / "Return to X" into a known hub when possible. */
export function parseTravelDestination(
  action: string,
  bibleId: string | undefined | null
): OutdoorHub | null {
  const a = (action ?? '').replace(/\s+/g, ' ').trim();
  const m = a.match(/^(?:travel\s+toward|return\s+to)\s+(.+)$/i);
  if (!m) return null;
  const name = m[1].replace(/[.!?]+$/, '').trim();
  return matchHub(hubsForBibleId(bibleId), name);
}
