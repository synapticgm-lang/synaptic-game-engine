import type { EngineMode } from './types.ts';

/**
 * Premade landmass / region graphs + named settlements (towns, cities, shores).
 * At New Game the engine picks one outline and stores fogged region + settlement state.
 * AI narrates inside this map — it does not invent new cities/coasts.
 */

export interface WorldOutlineRegion {
  id: string;
  name: string;
  blurb: string;
  connections: string[];
  /** Biome / geography tags for fog + quest fitness. */
  tags?: string[];
}

export interface WorldOutlineSettlement {
  id: string;
  name: string;
  regionId: string;
  kind: 'city' | 'town' | 'village' | 'shore' | 'landmark' | 'ruin' | 'fort' | 'district';
  /** Primary biome for quest-site fitness (farm, coast, desert, forest, …). */
  biome: string;
  blurb: string;
  aliases?: string[];
  allowsDungeon?: boolean;
  questTags?: string[];
}

export interface WorldOutlineDef {
  id: string;
  name: string;
  description: string;
  modes: EngineMode[];
  startingRegionId: string;
  regions: WorldOutlineRegion[];
  settlements: WorldOutlineSettlement[];
}

export const WORLD_OUTLINES: WorldOutlineDef[] = [
  {
    id: 'crescent-isles',
    name: 'The Crescent Isles',
    description:
      'A broken ring of islands around a calm inner sea. Trade lanes hug the coasts; the outer reefs are unmarked.',
    modes: ['litrpg', 'rpg', 'dnd'],
    startingRegionId: 'harbor-ring',
    regions: [
      { id: 'harbor-ring', name: 'Harbor Ring', blurb: 'Busy ports and ferry piers on the inner crescent.', connections: ['reed-flats', 'salt-markets'], tags: ['coast', 'town'] },
      { id: 'reed-flats', name: 'Reed Flats', blurb: 'Shallow wetlands and stilt villages.', connections: ['harbor-ring', 'mistwood'], tags: ['wetland'] },
      { id: 'salt-markets', name: 'Salt Markets', blurb: 'Warehouse quays and spice sheds.', connections: ['harbor-ring', 'cliffwatch'], tags: ['trade'] },
      { id: 'mistwood', name: 'Mistwood', blurb: 'Foggy timber isle with old stone markers.', connections: ['reed-flats', 'ash-caldera'], tags: ['forest'] },
      { id: 'cliffwatch', name: 'Cliffwatch', blurb: 'Sheer outer cliffs and a lonely beacon.', connections: ['salt-markets', 'outer-reef'], tags: ['coast'] },
      { id: 'ash-caldera', name: 'Ash Caldera', blurb: 'Warm black sand and sealed volcanic vents.', connections: ['mistwood', 'outer-reef'], tags: ['hazard', 'desert'] },
      { id: 'outer-reef', name: 'Outer Reef', blurb: 'Shipwrecks and uncharted cuts through coral.', connections: ['cliffwatch', 'ash-caldera'], tags: ['sea', 'danger'] },
    ],
    settlements: [
      { id: 'port-crescent', name: 'Port Crescent', regionId: 'harbor-ring', kind: 'city', biome: 'coast', blurb: 'Main harbor city on the inner ring.', aliases: ['Crescent Port', 'the harbor city'], questTags: ['trade', 'fishing', 'social'] },
      { id: 'ferry-pier', name: 'Ferry Pier', regionId: 'harbor-ring', kind: 'shore', biome: 'coast', blurb: 'Public piers and ticket sheds.', questTags: ['fishing', 'trade'] },
      { id: 'stilt-hamlet', name: 'Stilt Hamlet', regionId: 'reed-flats', kind: 'village', biome: 'wetland', blurb: 'Reed houses on stilts.', questTags: ['fishing', 'farming'] },
      { id: 'spice-quay', name: 'Spice Quay', regionId: 'salt-markets', kind: 'town', biome: 'trade', blurb: 'Warehouse town of salt and spice.', questTags: ['trade', 'social'] },
      { id: 'mistwood-lodge', name: 'Mistwood Lodge', regionId: 'mistwood', kind: 'landmark', biome: 'forest', blurb: 'Timber lodge and trailhead.', allowsDungeon: true, questTags: ['combat', 'ruin'] },
      { id: 'beacon-cliff', name: 'Beacon Cliff', regionId: 'cliffwatch', kind: 'shore', biome: 'coast', blurb: 'Lonely lighthouse shore.', questTags: ['fishing', 'combat'] },
      { id: 'vent-camp', name: 'Vent Camp', regionId: 'ash-caldera', kind: 'ruin', biome: 'desert', blurb: 'Ash-camp near sealed vents — nothing grows here.', allowsDungeon: true, questTags: ['combat', 'ruin', 'mining'] },
      { id: 'wreck-cut', name: 'Wreck Cut', regionId: 'outer-reef', kind: 'shore', biome: 'sea', blurb: 'Coral cut through shipwrecks.', allowsDungeon: true, questTags: ['combat', 'dungeon', 'fishing'] },
    ],
  },
  {
    id: 'spine-marches',
    name: 'The Spine Marches',
    description:
      'A long mountain chain divides wet western valleys from dry eastern steppe. Passes are few and contested.',
    modes: ['litrpg', 'rpg', 'dnd'],
    startingRegionId: 'lowgate',
    regions: [
      { id: 'lowgate', name: 'Lowgate', blurb: 'Valley town under the first pass towers.', connections: ['green-fold', 'stone-stair'], tags: ['town'] },
      { id: 'green-fold', name: 'Green Fold', blurb: 'Farm terraces and orchard hills.', connections: ['lowgate', 'river-bend'], tags: ['rural', 'farm'] },
      { id: 'stone-stair', name: 'Stone Stair', blurb: 'Switchback pass with wayforts.', connections: ['lowgate', 'high-saddle', 'deep-delve'], tags: ['mountain'] },
      { id: 'river-bend', name: 'River Bend', blurb: 'Wide water and ferry crossings.', connections: ['green-fold', 'reedfen'], tags: ['river'] },
      { id: 'high-saddle', name: 'High Saddle', blurb: 'Wind-scoured ridge between snowfields.', connections: ['stone-stair', 'east-steppe'], tags: ['mountain'] },
      { id: 'deep-delve', name: 'Deep Delve', blurb: 'Mine mouths and abandoned shafts.', connections: ['stone-stair'], tags: ['dungeon', 'mine'] },
      { id: 'reedfen', name: 'Reedfen', blurb: 'Western marsh under the peaks.', connections: ['river-bend'], tags: ['wetland'] },
      { id: 'east-steppe', name: 'East Steppe', blurb: 'Dry grass and caravan tracks.', connections: ['high-saddle'], tags: ['plains', 'desert'] },
    ],
    settlements: [
      { id: 'lowgate-town', name: 'Lowgate', regionId: 'lowgate', kind: 'town', biome: 'town', blurb: 'Gate-town under the pass.', aliases: ['Lowgate Town'], questTags: ['trade', 'social', 'combat'] },
      { id: 'orchard-terrace', name: 'Orchard Terrace', regionId: 'green-fold', kind: 'village', biome: 'farm', blurb: 'Farm terraces and fruit hills.', questTags: ['farming', 'social'] },
      { id: 'wayfort', name: 'Wayfort', regionId: 'stone-stair', kind: 'fort', biome: 'mountain', blurb: 'Pass fort on the switchbacks.', allowsDungeon: true, questTags: ['combat'] },
      { id: 'ferry-crossing', name: 'Ferry Crossing', regionId: 'river-bend', kind: 'shore', biome: 'river', blurb: 'Wide-water ferry.', questTags: ['fishing', 'trade'] },
      { id: 'saddle-camp', name: 'Saddle Camp', regionId: 'high-saddle', kind: 'landmark', biome: 'mountain', blurb: 'Wind camp on the ridge.', questTags: ['combat'] },
      { id: 'delve-mouth', name: 'Delve Mouth', regionId: 'deep-delve', kind: 'ruin', biome: 'mine', blurb: 'Mine mouths and abandoned shafts.', allowsDungeon: true, questTags: ['mining', 'dungeon', 'combat'] },
      { id: 'reedfen-village', name: 'Reedfen Village', regionId: 'reedfen', kind: 'village', biome: 'wetland', blurb: 'Marsh village under the peaks.', questTags: ['fishing', 'farming'] },
      { id: 'steppe-caravan', name: 'Steppe Caravan Post', regionId: 'east-steppe', kind: 'landmark', biome: 'plains', blurb: 'Dry grass caravan tracks — poor farmland.', questTags: ['trade', 'combat'] },
    ],
  },
  {
    id: 'grid-metro',
    name: 'Grid Metro Sprawl',
    description:
      'A modern city broken into districts after Integration. Streets are mapped; dead zones are not.',
    modes: ['litrpg'],
    startingRegionId: 'central-ward',
    regions: [
      { id: 'central-ward', name: 'Central Ward', blurb: 'Transit hub, offices, and blue System glow.', connections: ['market-strip', 'riverfront'], tags: ['urban'] },
      { id: 'market-strip', name: 'Market Strip', blurb: 'Shops, Salvage stalls, crowded pavements.', connections: ['central-ward', 'industrial-belt'], tags: ['urban', 'trade'] },
      { id: 'riverfront', name: 'Riverfront', blurb: 'Quays, bridges, and flooded underpasses.', connections: ['central-ward', 'parklands'], tags: ['urban'] },
      { id: 'industrial-belt', name: 'Industrial Belt', blurb: 'Warehouses and dungeon-tagged factories.', connections: ['market-strip', 'dead-zone-edge'], tags: ['industrial'] },
      { id: 'parklands', name: 'Parklands', blurb: 'Green corridors that still feel almost normal.', connections: ['riverfront', 'suburbs'], tags: ['park'] },
      { id: 'suburbs', name: 'Suburbs', blurb: 'Quiet streets and boarded schools.', connections: ['parklands', 'dead-zone-edge'], tags: ['residential'] },
      { id: 'dead-zone-edge', name: 'Dead Zone Edge', blurb: 'Fogged blocks the map will not name yet.', connections: ['industrial-belt', 'suburbs'], tags: ['danger', 'fog'] },
    ],
    settlements: [
      { id: 'transit-hub', name: 'Transit Hub', regionId: 'central-ward', kind: 'district', biome: 'urban', blurb: 'Central offices and System glow.', questTags: ['social', 'trade'] },
      { id: 'salvage-row', name: 'Salvage Row', regionId: 'market-strip', kind: 'district', biome: 'trade', blurb: 'Shops and Salvage stalls.', questTags: ['trade', 'social'] },
      { id: 'flooded-quay', name: 'Flooded Quay', regionId: 'riverfront', kind: 'shore', biome: 'river', blurb: 'Quays and underpasses.', allowsDungeon: true, questTags: ['combat', 'dungeon'] },
      { id: 'factory-block', name: 'Factory Block', regionId: 'industrial-belt', kind: 'district', biome: 'industrial', blurb: 'Dungeon-tagged warehouses.', allowsDungeon: true, questTags: ['dungeon', 'combat'] },
      { id: 'green-corridor', name: 'Green Corridor', regionId: 'parklands', kind: 'landmark', biome: 'park', blurb: 'Almost-normal park strip.', questTags: ['social'] },
      { id: 'boarded-school', name: 'Boarded School District', regionId: 'suburbs', kind: 'district', biome: 'residential', blurb: 'Quiet streets.', questTags: ['social', 'combat'] },
      { id: 'dead-zone-gate', name: 'Dead Zone Gate', regionId: 'dead-zone-edge', kind: 'ruin', biome: 'danger', blurb: 'Fogged blocks — nothing farms here.', allowsDungeon: true, questTags: ['combat', 'dungeon', 'ruin'] },
    ],
  },
  {
    id: 'shatter-coast',
    name: 'Shatter Coast',
    description:
      'Ragged mainland coast with fjords inland and a chain of storm islands offshore. Saltmar is the cliff-city capital.',
    modes: ['dnd', 'rpg', 'litrpg'],
    startingRegionId: 'saltmar',
    regions: [
      { id: 'saltmar', name: 'Saltmar', blurb: 'Cliff-city capital — Upper, Middle, and Lower wards.', connections: ['brinewatch', 'tide-road'], tags: ['coast', 'city'] },
      { id: 'brinewatch', name: 'Brinewatch', blurb: 'Fishing town under a salt-stained keep.', connections: ['saltmar', 'tide-road', 'lampwood'], tags: ['coast', 'town'] },
      { id: 'tide-road', name: 'Tide Road', blurb: 'Coastal track that floods at spring tide.', connections: ['saltmar', 'brinewatch', 'granite-stair'], tags: ['coast'] },
      { id: 'lampwood', name: 'Lampwood', blurb: 'Pine woods with lantern posts on the paths.', connections: ['brinewatch', 'reedfen-inland'], tags: ['forest'] },
      { id: 'granite-stair', name: 'Granite Stair', blurb: 'Cliff switchbacks to the highland.', connections: ['tide-road', 'stonevein'], tags: ['mountain'] },
      { id: 'reedfen-inland', name: 'Inland Reedfen', blurb: 'Freshwater marsh behind the dunes.', connections: ['lampwood'], tags: ['wetland'] },
      { id: 'stonevein', name: 'Stonevein', blurb: 'Quarry country and old dwarf-cut halls.', connections: ['granite-stair', 'storm-isles'], tags: ['mine'] },
      { id: 'storm-isles', name: 'Storm Isles', blurb: 'Offshore rocks reachable only in fair weather.', connections: ['stonevein'], tags: ['island', 'sea'] },
    ],
    settlements: [
      { id: 'saltmar-city', name: 'Saltmar', regionId: 'saltmar', kind: 'city', biome: 'coast', blurb: 'Cliff metropolis of three wards.', aliases: ['the harborside streets of Saltmar', 'Saltmar City'], questTags: ['trade', 'social', 'intrigue'] },
      { id: 'saltmar-upper', name: 'Upper Ward', regionId: 'saltmar', kind: 'district', biome: 'coast', blurb: 'Guild halls and Sentinel barracks atop the cliffs.', aliases: ['Saltmar Upper Ward'], questTags: ['social', 'intrigue'] },
      { id: 'saltmar-middle', name: 'Middle Ward', regionId: 'saltmar', kind: 'district', biome: 'coast', blurb: 'Markets and workshops on the cliff face.', aliases: ['Saltmar Middle Ward'], questTags: ['trade', 'social'] },
      { id: 'saltmar-lower', name: 'Lower Ward', regionId: 'saltmar', kind: 'district', biome: 'coast', blurb: 'Harbor, fish markets, and sea-cave undercity.', aliases: ['Saltmar Lower Ward', 'the harbor'], questTags: ['fishing', 'trade', 'combat'] },
      { id: 'great-lift', name: 'Great Lift', regionId: 'saltmar', kind: 'landmark', biome: 'coast', blurb: 'Counterweight elevators between the three wards.', questTags: ['social', 'intrigue'] },
      { id: 'brinewatch-town', name: 'Brinewatch', regionId: 'brinewatch', kind: 'town', biome: 'coast', blurb: 'Fishing town under the keep.', aliases: ['Brinewatch Town'], questTags: ['fishing', 'trade', 'social'] },
      { id: 'salt-keep', name: 'Salt-Stained Keep', regionId: 'brinewatch', kind: 'fort', biome: 'coast', blurb: 'Keep above the harbor.', allowsDungeon: true, questTags: ['combat', 'dungeon'] },
      { id: 'tide-road-inn', name: 'Tide Road Inn', regionId: 'tide-road', kind: 'landmark', biome: 'coast', blurb: 'Inn on the flooding track.', questTags: ['social', 'fishing'] },
      { id: 'lampwood-trail', name: 'Lampwood Trailhead', regionId: 'lampwood', kind: 'landmark', biome: 'forest', blurb: 'Lantern-post paths.', allowsDungeon: true, questTags: ['combat', 'ruin'] },
      { id: 'granite-switchback', name: 'Granite Switchback', regionId: 'granite-stair', kind: 'landmark', biome: 'mountain', blurb: 'Cliff stairs to highland.', questTags: ['combat'] },
      { id: 'reedfen-docks', name: 'Reedfen Docks', regionId: 'reedfen-inland', kind: 'village', biome: 'wetland', blurb: 'Marsh village behind dunes.', questTags: ['fishing', 'farming'] },
      { id: 'stonevein-quarry', name: 'Stonevein Quarry', regionId: 'stonevein', kind: 'ruin', biome: 'mine', blurb: 'Quarry and dwarf-cut halls.', allowsDungeon: true, questTags: ['mining', 'dungeon', 'combat'] },
      { id: 'storm-landing', name: 'Storm Landing', regionId: 'storm-isles', kind: 'shore', biome: 'sea', blurb: 'Fair-weather island landing.', allowsDungeon: true, questTags: ['combat', 'fishing'] },
    ],
  },
];

export function getWorldOutlineById(id: string): WorldOutlineDef | undefined {
  return WORLD_OUTLINES.find((o) => o.id === id);
}

export function pickWorldOutline(
  engineMode: EngineMode,
  seed: string,
  pinnedId?: string | null
): WorldOutlineDef | null {
  // Explicit null pin: PYOA / closed stories only — open modes still get a map (29e).
  if (pinnedId === null && engineMode === 'pyoa') return null;
  if (pinnedId && pinnedId.length > 0) {
    return getWorldOutlineById(pinnedId) ?? null;
  }
  if (engineMode === 'pyoa') return null;
  const pool = WORLD_OUTLINES.filter((o) => o.modes.includes(engineMode));
  const list = pool.length ? pool : WORLD_OUTLINES.filter((o) => o.modes.includes('litrpg'));
  if (!list.length) return null;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return list[h % list.length] ?? null;
}
