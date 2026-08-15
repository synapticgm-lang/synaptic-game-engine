import type { ItemTemplate, WorldPack, ZoneSlice } from '../types';
import { BRINEWATCH } from './zones/brinewatch';
import { GRANITE_STAIR } from './zones/graniteStair';
import { LAMPWOOD } from './zones/lampwood';
import { REEDFEN } from './zones/reedfen';

const SHARED_ITEMS: ItemTemplate[] = [
  { id: 'item_padded_vest', name: 'Padded Vest', category: 'armor', goldValue: 5, repairCostPerPoint: 0.5 },
  { id: 'item_leather_jacket', name: 'Leather Jacket', category: 'armor', goldValue: 7, repairCostPerPoint: 0.5 },
  { id: 'item_system_bandage', name: 'System-Issue Bandage', category: 'consumable', goldValue: 1, repairCostPerPoint: 0 },
  { id: 'item_stamina_pill', name: 'System-Issue Stamina Pill', category: 'consumable', goldValue: 1, repairCostPerPoint: 0 },
  { id: 'item_salvage_kit', name: 'Salvage Kit', category: 'tool', goldValue: 3, repairCostPerPoint: 0 },
];

const CAPITALS: ZoneSlice = {
  places: [
    {
      id: 'poi_ash_seat',
      name: 'Ash Seat',
      zoneId: 'ash_seat',
      mapScale: 'street',
      dangerTier: 'safe',
      outdoor: true,
      exits: [],
      npcIds: [],
    },
    {
      id: 'poi_tidehold',
      name: 'Tidehold',
      zoneId: 'tidehold',
      mapScale: 'street',
      dangerTier: 'safe',
      outdoor: true,
      exits: [],
      npcIds: [],
    },
  ],
  npcs: [],
  species: [],
  items: [],
  quests: [],
  dungeons: [],
};

function mergeSlices(slices: ZoneSlice[]): ZoneSlice {
  const items = new Map<string, ItemTemplate>();
  for (const item of [...SHARED_ITEMS, ...slices.flatMap((s) => s.items)]) {
    items.set(item.id, item);
  }
  return {
    places: slices.flatMap((s) => s.places),
    npcs: slices.flatMap((s) => s.npcs),
    species: slices.flatMap((s) => s.species),
    items: [...items.values()],
    quests: slices.flatMap((s) => s.quests),
    dungeons: slices.flatMap((s) => s.dungeons),
  };
}

const merged = mergeSlices([REEDFEN, LAMPWOOD, BRINEWATCH, GRANITE_STAIR, CAPITALS]);

export const ASH_COMPACT_PACK: WorldPack = {
  id: 'ash_compact',
  name: 'Ash Compact',
  rulesModuleId: 'hp_check',
  maturity: 'pg13',
  factions: [
    { id: 'ash_compact', name: 'Ash Compact' },
    { id: 'tide_covenant', name: 'Tide Covenant' },
  ],
  races: [
    {
      id: 'hearthborn',
      name: 'Hearthborn',
      factionId: 'ash_compact',
      startingPlaceId: 'poi_reedfen_square',
      starterWeaponId: 'item_hearthborn_knife',
      starterMapId: 'item_reedfen_map',
      firstHourQuestId: 'quest_hearthborn_race_1',
      abilityFlag: 'hearthborn_warmth',
    },
    {
      id: 'lanternfolk',
      name: 'Lanternfolk',
      factionId: 'ash_compact',
      startingPlaceId: 'poi_wickhaven',
      starterWeaponId: 'item_oak_staff',
      starterMapId: 'item_lampwood_map',
      firstHourQuestId: 'quest_lanternfolk_race_1',
      abilityFlag: 'lantern_sense',
    },
    {
      id: 'saltkin',
      name: 'Saltkin',
      factionId: 'tide_covenant',
      startingPlaceId: 'poi_brinewatch_dock',
      starterWeaponId: 'item_iron_hatchet',
      starterMapId: 'item_brinewatch_map',
      firstHourQuestId: 'quest_saltkin_race_1',
      abilityFlag: 'tide_step',
    },
    {
      id: 'stonevein',
      name: 'Stonevein',
      factionId: 'tide_covenant',
      startingPlaceId: 'poi_anvil_gate',
      starterWeaponId: 'item_stone_maul',
      starterMapId: 'item_granite_map',
      firstHourQuestId: 'quest_stonevein_race_1',
      abilityFlag: 'stonevein_endurance',
    },
  ],
  places: merged.places,
  npcs: merged.npcs,
  species: merged.species,
  items: merged.items,
  quests: merged.quests,
  dungeons: merged.dungeons,
  firstHourQuestId: 'quest_hearthborn_race_1',
  banList: [
    'Hogwarts', 'Stormwind', 'Orgrimmar', 'Pikachu', 'Palworld', 'Mordor', 'Gondor',
    'Teyvat', 'Liyue', 'Whiterun', 'Skyrim', 'Waterdeep', 'Neverwinter', 'Warhammer',
    'Sigmar', 'Eorzea', 'Azeroth', 'Kalimdor', 'Hyrule', 'Geralt', 'Faerûn', 'Arda',
    'Jedi', 'Sith', 'Westeros', 'Targaryen', 'Muggle', 'Pokeball', 'Quirk', 'Hearthstone',
  ],
};
