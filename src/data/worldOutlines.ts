import type { EngineMode } from '@/game/types';

/**
 * Premade landmass / region graphs. At New Game the engine picks one outline
 * (or a bible-pinned id) and stores fogged region state on the save.
 * Structure/dungeon blueprints stay separate — this is the *world* atlas.
 */

export interface WorldOutlineRegion {
  id: string;
  name: string;
  blurb: string;
  connections: string[];
  tags?: string[];
}

export interface WorldOutlineDef {
  id: string;
  name: string;
  description: string;
  /** Modes that may randomly receive this outline. */
  modes: EngineMode[];
  startingRegionId: string;
  regions: WorldOutlineRegion[];
}

export const WORLD_OUTLINES: WorldOutlineDef[] = [
  {
    id: 'crescent-isles',
    name: 'The Crescent Isles',
    description: 'A broken ring of islands around a calm inner sea. Trade lanes hug the coasts; the outer reefs are unmarked.',
    modes: ['litrpg', 'rpg', 'dnd'],
    startingRegionId: 'harbor-ring',
    regions: [
      { id: 'harbor-ring', name: 'Harbor Ring', blurb: 'Busy ports and ferry piers on the inner crescent.', connections: ['reed-flats', 'salt-markets'], tags: ['coast', 'town'] },
      { id: 'reed-flats', name: 'Reed Flats', blurb: 'Shallow wetlands and stilt villages.', connections: ['harbor-ring', 'mistwood'], tags: ['wetland'] },
      { id: 'salt-markets', name: 'Salt Markets', blurb: 'Warehouse quays and spice sheds.', connections: ['harbor-ring', 'cliffwatch'], tags: ['trade'] },
      { id: 'mistwood', name: 'Mistwood', blurb: 'Foggy timber isle with old stone markers.', connections: ['reed-flats', 'ash-caldera'], tags: ['forest'] },
      { id: 'cliffwatch', name: 'Cliffwatch', blurb: 'Sheer outer cliffs and a lonely beacon.', connections: ['salt-markets', 'outer-reef'], tags: ['coast'] },
      { id: 'ash-caldera', name: 'Ash Caldera', blurb: 'Warm black sand and sealed volcanic vents.', connections: ['mistwood', 'outer-reef'], tags: ['hazard'] },
      { id: 'outer-reef', name: 'Outer Reef', blurb: 'Shipwrecks and uncharted cuts through coral.', connections: ['cliffwatch', 'ash-caldera'], tags: ['sea', 'danger'] },
    ],
  },
  {
    id: 'spine-marches',
    name: 'The Spine Marches',
    description: 'A long mountain chain divides wet western valleys from dry eastern steppe. Passes are few and contested.',
    modes: ['litrpg', 'rpg', 'dnd'],
    startingRegionId: 'lowgate',
    regions: [
      { id: 'lowgate', name: 'Lowgate', blurb: 'Valley town under the first pass towers.', connections: ['green-fold', 'stone-stair'], tags: ['town'] },
      { id: 'green-fold', name: 'Green Fold', blurb: 'Farm terraces and orchard hills.', connections: ['lowgate', 'river-bend'], tags: ['rural'] },
      { id: 'stone-stair', name: 'Stone Stair', blurb: 'Switchback pass with wayforts.', connections: ['lowgate', 'high-saddle', 'deep-delve'], tags: ['mountain'] },
      { id: 'river-bend', name: 'River Bend', blurb: 'Wide water and ferry crossings.', connections: ['green-fold', 'reedfen'], tags: ['river'] },
      { id: 'high-saddle', name: 'High Saddle', blurb: 'Wind-scoured ridge between snowfields.', connections: ['stone-stair', 'east-steppe'], tags: ['mountain'] },
      { id: 'deep-delve', name: 'Deep Delve', blurb: 'Mine mouths and abandoned shafts.', connections: ['stone-stair'], tags: ['dungeon', 'mine'] },
      { id: 'reedfen', name: 'Reedfen', blurb: 'Western marsh under the peaks.', connections: ['river-bend'], tags: ['wetland'] },
      { id: 'east-steppe', name: 'East Steppe', blurb: 'Dry grass and caravan tracks.', connections: ['high-saddle'], tags: ['plains'] },
    ],
  },
  {
    id: 'grid-metro',
    name: 'Grid Metro Sprawl',
    description: 'A modern city broken into districts after Integration. Streets are mapped; dead zones are not.',
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
  },
  {
    id: 'shatter-coast',
    name: 'Shatter Coast',
    description: 'Ragged mainland coast with fjords inland and a chain of storm islands offshore.',
    modes: ['dnd', 'rpg', 'litrpg'],
    startingRegionId: 'brinewatch',
    regions: [
      { id: 'brinewatch', name: 'Brinewatch', blurb: 'Fishing town under a salt-stained keep.', connections: ['tide-road', 'lampwood'], tags: ['coast', 'town'] },
      { id: 'tide-road', name: 'Tide Road', blurb: 'Coastal track that floods at spring tide.', connections: ['brinewatch', 'granite-stair'], tags: ['coast'] },
      { id: 'lampwood', name: 'Lampwood', blurb: 'Pine woods with lantern posts on the paths.', connections: ['brinewatch', 'reedfen-inland'], tags: ['forest'] },
      { id: 'granite-stair', name: 'Granite Stair', blurb: 'Cliff switchbacks to the highland.', connections: ['tide-road', 'stonevein'], tags: ['mountain'] },
      { id: 'reedfen-inland', name: 'Inland Reedfen', blurb: 'Freshwater marsh behind the dunes.', connections: ['lampwood'], tags: ['wetland'] },
      { id: 'stonevein', name: 'Stonevein', blurb: 'Quarry country and old dwarf-cut halls.', connections: ['granite-stair', 'storm-isles'], tags: ['mine'] },
      { id: 'storm-isles', name: 'Storm Isles', blurb: 'Offshore rocks reachable only in fair weather.', connections: ['stonevein'], tags: ['island', 'sea'] },
    ],
  },
];

export function getWorldOutlineById(id: string): WorldOutlineDef | undefined {
  return WORLD_OUTLINES.find((o) => o.id === id);
}

export function pickWorldOutline(
  engineMode: EngineMode,
  seed: string,
  pinnedId?: string | null,
): WorldOutlineDef | null {
  if (pinnedId === null) return null;
  if (pinnedId) {
    return getWorldOutlineById(pinnedId) ?? null;
  }
  // Closed / choice-spine stories do not get an open atlas by default.
  if (engineMode === 'pyoa') return null;
  const pool = WORLD_OUTLINES.filter((o) => o.modes.includes(engineMode));
  const list = pool.length ? pool : WORLD_OUTLINES.filter((o) => o.modes.includes('litrpg'));
  if (!list.length) return null;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return list[h % list.length] ?? null;
}
