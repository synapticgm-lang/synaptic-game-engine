/**
 * 28i — Shared data table for dungeon cards: world-map biome → local creature families + room flavour,
 * plus threat modifiers (undead, ash, blight) that transform the local family. Game-wide engine data,
 * no per-story entries. dungeonCard.ts reads the dungeon's map cell (settlement biome + region tags),
 * its neighbouring regions, and nearby threat words; it falls back to the hub name/blurb with no map data.
 */

export interface BiomeFamily {
  /** Room-foe creature names (one per combat room). */
  trash: string[];
  /** Mini-boss creature names. */
  elite: string[];
  /** Biome-flavoured rooms mixed into the site's room set. */
  rooms: string[];
}

export const BIOME_FAMILIES: Record<string, BiomeFamily> = {
  forest: {
    trash: ['Moss Wolf', 'Thornback Boar', 'Briar Spider', 'Bark Beetle Swarm'],
    elite: ['Elder Bear', 'Briar Spider Queen'],
    rooms: ['Root-choked Passage', 'Leaf-mould Hollow', 'Burrow Tunnel'],
  },
  coast: {
    trash: ['Tide Crab', 'Shore Eel', 'Barnacle Crawler', 'Gull Swarm'],
    elite: ['Tide Crab Matriarch', 'Great Shore Eel'],
    rooms: ['Tide Pool Cave', 'Kelp-slick Passage', 'Shell Midden'],
  },
  sea: {
    trash: ['Reef Eel', 'Spiny Crab', 'Kelp Lurker', 'Sea Urchin Cluster'],
    elite: ['Deep Squid', 'Reef Shark'],
    rooms: ['Flooded Hold', 'Coral Gallery', 'Wreck Hull'],
  },
  wetland: {
    trash: ['Bog Leech', 'Mire Toad', 'Reed Snake', 'Marsh Midge Swarm'],
    elite: ['Bog Crocodile', 'Giant Mire Toad'],
    rooms: ['Silted Channel', 'Reed-choked Chamber', 'Sunken Causeway'],
  },
  mountain: {
    trash: ['Crag Lizard', 'Rock Viper', 'Cliff Bat Swarm', 'Ridge Goat'],
    elite: ['Cave Bear', 'Ridge Wyvern'],
    rooms: ['Frost-cracked Passage', 'Scree Chamber', 'Wind Gallery'],
  },
  mine: {
    trash: ['Tunnel Crawler', 'Rock Beetle', 'Cave Bat Swarm', 'Blind Mole-rat'],
    elite: ['Crawler Queen', 'Rock Beetle Broodmother'],
    rooms: ['Timbered Tunnel', 'Ore Gallery', 'Cart Junction'],
  },
  desert: {
    trash: ['Ash Scorpion', 'Cinder Beetle', 'Dust Jackal', 'Sand Viper'],
    elite: ['Giant Ash Scorpion', 'Basilisk'],
    rooms: ['Sand-drift Passage', 'Sun-baked Chamber', 'Vent Crevice'],
  },
  plains: {
    trash: ['Feral Hound', 'Field Boar', 'Giant Rat', 'Carrion Crow Flock'],
    elite: ['Dire Wolf', 'Great Boar'],
    rooms: ['Root Cellar', 'Grain Pit', 'Earthen Burrow'],
  },
  urban: {
    trash: ['Giant Rat', 'Feral Dog Pack', 'Sewer Leech', 'Carrion Crow Flock'],
    elite: ['Rat King Swarm', 'Sewer Crocodile'],
    rooms: ['Drain Culvert', 'Bricked Cellar', 'Rat Warren'],
  },
  industrial: {
    trash: ['Rust Beetle', 'Cable Rat', 'Scrap Drone', 'Oil Slime'],
    elite: ['Scrap Golem', 'Rust Beetle Queen'],
    rooms: ['Boiler Walk', 'Cable Crawlway', 'Scrap Bay'],
  },
  danger: {
    trash: ['Fog Stalker', 'Void Mite Swarm', 'Hollow Hound', 'Glass Spider'],
    elite: ['Fog Horror', 'Hollow Alpha'],
    rooms: ['Fog-filled Hall', 'Warped Passage', 'Silent Chamber'],
  },
  underground: {
    trash: ['Cave Rat', 'Blind Crawler', 'Cave Spider', 'Pale Bat Swarm'],
    elite: ['Cave Troll', 'Giant Cave Spider'],
    rooms: ['Dripping Passage', 'Fungus Grotto', 'Underground Pool'],
  },
};

/** Map / hub tags that share a family with a main biome. */
export const BIOME_ALIASES: Record<string, string> = {
  river: 'wetland',
  marsh: 'wetland',
  swamp: 'wetland',
  island: 'coast',
  shore: 'coast',
  town: 'urban',
  city: 'urban',
  trade: 'urban',
  residential: 'urban',
  district: 'urban',
  park: 'forest',
  farm: 'plains',
  rural: 'plains',
  hazard: 'desert',
  fog: 'danger',
  dungeon: 'underground',
  // encounterBiomeMatrix.detectBiome() vocabulary (reused as the last hub-text fallback)
  coastal: 'coast',
  wilderness: 'forest',
  urban_ruin: 'urban',
};

/** Hub name/blurb words → biome, used only when the map has no cell for the dungeon. First match wins. */
export const HUB_TEXT_BIOMES: Array<{ match: RegExp; biome: string }> = [
  { match: /\b(reef|wreck|undersea|underwater|sunken ship|coral)\b/i, biome: 'sea' },
  { match: /\b(coast|harbou?r|quay|shore|beach|pier|tide|sea-cave)\b/i, biome: 'coast' },
  { match: /\b(marsh|reed|bog|fen|mire|swamp|river)\b/i, biome: 'wetland' },
  { match: /\b(forest|wood|woods|grove|timber|glade|thicket)\b/i, biome: 'forest' },
  { match: /\b(mine|delve|quarry|shaft|ore)\b/i, biome: 'mine' },
  { match: /\b(mountain|ridge|peak|cliff|pass|highland)\b/i, biome: 'mountain' },
  { match: /\b(desert|sand|ash|cinder|caldera|dune)\b/i, biome: 'desert' },
  { match: /\b(engine|machine|factory|foundry|works|warehouse)\b/i, biome: 'industrial' },
  { match: /\b(city|street|market|cathedral|palace|sewer|sump|drain|alley|ward|town)\b/i, biome: 'urban' },
  { match: /\b(farm|field|orchard|steppe|plain|meadow)\b/i, biome: 'plains' },
  { match: /\b(fog|void|dead zone)\b/i, biome: 'danger' },
];

/** Threat modifiers found on the dungeon's cell or its neighbours; they transform the local family. */
export interface ThreatModifier {
  tag: string;
  match: RegExp;
  /** Prefixes for room foes (picked per room). */
  prefixes: string[];
  /** Prefix for the mini-boss. */
  bossPrefix: string;
}

export const THREAT_MODIFIERS: ThreatModifier[] = [
  {
    tag: 'undead',
    match: /\b(undead|ghouls?|wraiths?|haunt(?:ed|s)?|necro\w*|skeletons?|zombies?|revenants?|crypts?|tombs?|graves?|graveyard|barrows?|ossuary|catacombs?|charnel|undercroft)\b/i,
    prefixes: ['Skeletal', 'Rotting', 'Grave-risen'],
    bossPrefix: 'Deathless',
  },
  {
    tag: 'ash',
    match: /\b(ember\w*|cinder\w*|volcanic|vents?|burning|ash-\w+)\b/i,
    prefixes: ['Ember-scarred', 'Ash-coated'],
    bossPrefix: 'Cinder-crowned',
  },
  {
    tag: 'blight',
    match: /\b(blight(?:ed)?|corrupt(?:ed|ion)?|cursed?|taint(?:ed)?)\b/i,
    prefixes: ['Blighted', 'Tainted'],
    bossPrefix: 'Blight-born',
  },
];

/** Normalise a map/hub tag to a BIOME_FAMILIES key, or null. */
export function biomeKey(tag: string | undefined | null): string | null {
  if (!tag) return null;
  const t = tag.trim().toLowerCase();
  if (BIOME_FAMILIES[t]) return t;
  const alias = BIOME_ALIASES[t];
  return alias && BIOME_FAMILIES[alias] ? alias : null;
}
