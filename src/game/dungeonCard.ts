/**
 * 28i — Dungeon card, generated once when the player first enters a dungeon hub.
 * The engine owns the rooms, foes, mini-boss, chests, traps and secrets; the card is seeded from the
 * save seed (deterministic), stored on the place record and reused on return. Each turn inside, the
 * current room's facts go to the writer as an engine fact. Game-wide: the site structure (crypt, mine…)
 * comes from the hub name + blurb; creature families and biome rooms come from the world map (the
 * dungeon's settlement biome + region tags, neighbouring regions, nearby threat words such as undead)
 * via the shared table in src/data/dungeonBiomes.ts, falling back to the hub text when the map has no
 * cell for the site. Hub-bound catalog foes still win; rewards come from the mode's encounter catalog.
 */
import type { ActiveEncounter, GameState, PlaceRecord } from './types';
import type { ActiveDungeonState, MapNode, NodeHidden } from './mapEngine';
import { dungeonHereLabel, moveToNode } from './mapEngine';
import { MULTI_FLOOR_WORDS, generateInterior, type GeneratedRoom } from './interiorGenerator';
import { detectBiome } from './encounterBiomeMatrix';
import { createHashRng } from './seededRng';
import { encountersForMode, type EncounterSeed } from '@/data/encounters';
import { hubsForBibleId, matchHub } from './outdoorHubs';
import { placeIdFromName } from './places';
import { tierToAreaLevel } from './placeAuthority';
import { chestProfileForGrade, rollLoot } from './lootTableRegistry';
import { openSeededLootable } from './looseItems';
import { milestoneXp, type MilestoneKind } from './xpRules';
import { applyCharacterXpGain } from './characterXp';
import { CHEST_GRADE_LABELS } from './dungeonSeed';
import { BIOME_FAMILIES, HUB_TEXT_BIOMES, THREAT_MODIFIERS, biomeKey, type ThreatModifier } from '@/data/dungeonBiomes';

export const DUNGEON_CARD_BLUEPRINT = 'dungeon-card';

type Theme = { entry: string; rooms: string[]; miniBossRoom: string; cacheRoom: string; foe: string; boss: string };

/** Engine room vocabulary by site kind (not story content). First match on hub name + blurb wins. */
const THEMES: Array<{ match: RegExp; theme: Theme }> = [
  {
    match: /\b(undercroft|crypt|catacomb|tomb|ossuary|cathedral|chapel|reliquary|grave|barrow)\b/i,
    theme: {
      entry: 'Stair Descent',
      rooms: ['Ossuary Passage', 'Bone Gallery', 'Flooded Crypt', 'Candle Vault', 'Collapsed Chapel', 'Charnel Hall', 'Sealed Niche Row'],
      miniBossRoom: "Warden's Crypt",
      cacheRoom: 'Offering Vault',
      foe: 'Crypt Ghoul',
      boss: 'Crypt Warden',
    },
  },
  {
    match: /\b(mine|delve|shaft|quarry|dig)\b/i,
    theme: {
      entry: 'Shaft Head',
      rooms: ['Timbered Tunnel', 'Ore Gallery', 'Flooded Drift', 'Collapsed Stope', 'Cart Junction', 'Echoing Cavern'],
      miniBossRoom: 'Deep Face',
      cacheRoom: 'Powder Store',
      foe: 'Tunnel Crawler',
      boss: 'Deep Foreman',
    },
  },
  {
    match: /\b(sewer|sump|drain|cistern|culvert|below-street)\b/i,
    theme: {
      entry: 'Grate Ladder',
      rooms: ['Overflow Channel', 'Brick Culvert', 'Sluice Chamber', 'Rat Warren', 'Silted Cistern', 'Pump Gallery'],
      miniBossRoom: 'Outfall Chamber',
      cacheRoom: "Smugglers' Nook",
      foe: 'Sewer Lurker',
      boss: 'Outfall Brute',
    },
  },
  {
    match: /\b(engine|machine|forge|factory|foundry|works|warehouse|store|containment)\b/i,
    theme: {
      entry: 'Service Hatch',
      rooms: ['Gear Gallery', 'Coolant Trench', 'Boiler Walk', 'Cable Crawlway', 'Control Pit', 'Scrap Bay'],
      miniBossRoom: 'Core Chamber',
      cacheRoom: 'Parts Locker',
      foe: 'Scrap Drone',
      boss: 'Core Sentinel',
    },
  },
  {
    match: /\b(keep|castle|fort|ruin|tower|citadel|spire|stronghold)\b/i,
    theme: {
      entry: 'Broken Gate',
      rooms: ['Guard Passage', 'Fallen Hall', 'Armoury Ruin', 'Collapsed Stair', 'Cold Barracks', 'Well Chamber'],
      miniBossRoom: "Lord's Chamber",
      cacheRoom: 'Strongroom',
      foe: 'Ruin Skulker',
      boss: 'Ruin Captain',
    },
  },
  {
    match: /\b(cave|cavern|grotto|hollow|lair|den|burrow)\b/i,
    theme: {
      entry: 'Cave Mouth',
      rooms: ['Dripping Passage', 'Fungus Grotto', 'Bat Roost', 'Underground Pool', 'Narrow Squeeze', 'Crystal Hollow'],
      miniBossRoom: 'Deep Lair',
      cacheRoom: 'Hidden Ledge',
      foe: 'Cave Stalker',
      boss: 'Lair Beast',
    },
  },
];

const DEFAULT_THEME: Theme = {
  entry: 'Entrance Stair',
  rooms: ['Narrow Passage', 'Pillared Hall', 'Dripping Chamber', 'Collapsed Corridor', 'Guard Room', 'Echoing Vault'],
  miniBossRoom: 'Inner Sanctum',
  cacheRoom: 'Hidden Cache',
  foe: 'Dungeon Lurker',
  boss: 'Dungeon Keeper',
};

export function isDungeonCard(d: ActiveDungeonState | null | undefined): d is ActiveDungeonState {
  return d?.blueprintId === DUNGEON_CARD_BLUEPRINT;
}

function siteHub(state: GameState, site: string) {
  return matchHub(hubsForBibleId(state.campaignBibleId), site);
}

function themeFor(text: string): Theme | null {
  return THEMES.find((t) => t.match.test(text))?.theme ?? null;
}

/** Where the dungeon sits on the world map: biome of its cell, nearby threat modifiers, and the source. */
export interface DungeonBiomeContext {
  biome: string;
  modifiers: ThreatModifier[];
  source: 'map' | 'hub';
}

function biomeFromText(text: string): string | null {
  return HUB_TEXT_BIOMES.find((b) => b.match.test(text))?.biome ?? biomeKey(detectBiome(text));
}

function modifiersIn(text: string): ThreatModifier[] {
  return THREAT_MODIFIERS.filter((m) => m.match.test(text));
}

/**
 * Read the dungeon's map cell (atlas settlement or place record biome + its region's tags) and its
 * neighbours (connected regions' tags + their settlements' biome/quest tags). No map cell → hub name/blurb only.
 */
export function dungeonBiomeContext(state: GameState, name: string, blurb: string): DungeonBiomeContext {
  const atlas = state.worldAtlas;
  const key = name.toLowerCase();
  const place = findPlace(state, name);
  const settle = atlas?.settlements?.find(
    (s) => s.name.toLowerCase() === key || s.aliases?.some((a) => a.toLowerCase() === key)
  );
  const regionId = settle?.regionId ?? place?.regionId;
  const region = regionId ? atlas?.regions.find((r) => r.id === regionId) : undefined;
  const cellBiome = settle?.biome ?? place?.biome;
  if (atlas && (cellBiome || region)) {
    const near = (region?.connections ?? [])
      .map((id) => atlas.regions.find((r) => r.id === id))
      .filter((r): r is NonNullable<typeof r> => !!r);
    const nearIds = new Set([region?.id, ...near.map((r) => r.id)].filter(Boolean));
    const nearSettle = (atlas.settlements ?? []).filter((s) => nearIds.has(s.regionId) && s !== settle);
    const cellTags = [cellBiome, ...(region?.tags ?? [])];
    const nearTags = [...near.flatMap((r) => r.tags ?? []), ...nearSettle.map((s) => s.biome)];
    const biome =
      cellTags.map(biomeKey).find(Boolean) ??
      biomeFromText(`${name} ${blurb} ${settle?.blurb ?? ''}`) ??
      nearTags.map(biomeKey).find(Boolean) ??
      'underground';
    const text = [
      name,
      blurb,
      settle?.blurb ?? '',
      region ? `${region.name} ${region.blurb} ${(region.tags ?? []).join(' ')}` : '',
      // Neighbours contribute threat tags only (not their prose), so a forest next to a caldera stays a forest.
      ...near.map((r) => (r.tags ?? []).join(' ')),
      ...nearSettle.filter((s) => s.regionId === region?.id).map((s) => `${s.name} ${s.blurb}`),
      ...nearSettle.map((s) => (s.questTags ?? []).join(' ')),
    ].join(' ');
    return { biome, modifiers: modifiersIn(text), source: 'map' };
  }
  const text = `${name} ${blurb}`;
  return { biome: biomeFromText(text) ?? 'underground', modifiers: modifiersIn(text), source: 'hub' };
}

function pick<T>(list: T[], rng: () => number): T | undefined {
  return list.length ? list[Math.floor(rng() * list.length)] : undefined;
}

function foePool(state: GameState, tier: 'trash' | 'elite', hubId?: string): EncounterSeed[] {
  const all = encountersForMode(state.engineMode).filter((e) => e.tier === tier);
  const here = hubId ? all.filter((e) => e.hubId === hubId) : [];
  if (here.length) return here;
  const free = all.filter((e) => !e.hubId);
  return free.length ? free : all;
}

function findPlace(state: GameState, site: string): PlaceRecord | undefined {
  const id = placeIdFromName(site);
  const key = site.toLowerCase();
  return (state.places ?? []).find(
    (p) => p.id === id || p.name.toLowerCase() === key || p.aliases?.some((a) => a.toLowerCase() === key)
  );
}

/** Build the card for a site. Deterministic from the save seed + site name. */
export function buildDungeonCard(state: GameState, site: string): ActiveDungeonState {
  const hub = siteHub(state, site);
  const name = hub?.name ?? site;
  const siteTheme = themeFor(`${name} ${hub?.blurb ?? ''}`);
  const ctx = dungeonBiomeContext(state, name, hub?.blurb ?? '');
  const family = BIOME_FAMILIES[ctx.biome] ?? BIOME_FAMILIES.underground!;
  const threat = ctx.modifiers[0];
  const theme: Theme = siteTheme ?? {
    ...DEFAULT_THEME,
    rooms: [...family.rooms, ...DEFAULT_THEME.rooms.slice(0, 3)],
  };
  const seed = `${state.seed ?? state.saveId ?? 'dungeon'}:${name}`;
  const rng = createHashRng(seed, 'dungeon-card');
  const danger = Math.max(1, Math.min(4, Math.floor(hub?.threatTier ?? 2))) as 1 | 2 | 3 | 4;
  const level = Math.max(1, state.character?.level ?? 1);

  const siteTag = ['crypt', 'mine', 'sewer', 'engine', 'keep', 'cave'][THEMES.findIndex((t) => t.theme === siteTheme)] ?? 'any';
  // 28j — layout from the generic interior generator: seeded template pick, optional stacked floors
  // (stairs / ladders), seeded extra doors, optional secret room. Cached on the card / place record.
  const floors = danger >= 3 || MULTI_FLOOR_WORDS.test(`${name} ${hub?.blurb ?? ''}`) ? 2 : rng() < 0.3 ? 2 : 1;
  const gen = generateInterior({ seed, key: name, kind: 'dungeon', tags: [siteTag], floors, needBoss: true, needCache: true, secretChance: 0.6 });
  const secretOf = new Map(gen.secrets.map((x) => [x.fromId, x.id]));

  const middle = siteTheme ? [...theme.rooms, ...family.rooms] : [...theme.rooms];
  for (let i = middle.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [middle[i], middle[j]] = [middle[j]!, middle[i]!];
  }
  const spare = [...DEFAULT_THEME.rooms];
  const usedNames = new Set<string>();
  const nextRoomName = (): string => {
    const n = middle.find((m) => !usedNames.has(m)) ?? spare.find((m) => !usedNames.has(m)) ?? `Chamber ${usedNames.size + 1}`;
    usedNames.add(n);
    return n;
  };
  const floorWord = (f: number) => (f <= 1 ? 'Lower' : f === 2 ? 'Deep' : 'Deepest');
  let cacheNamed = false;
  // Template room labels are kept when they are real names; generic ones get the site theme's names.
  const genericLabel = (l?: string) => !l || / - (?:hex|sector|core hub)\b/i.test(l) || /^(?:entry|stairs?|chamber|hex \d+)$/i.test(l);
  const roomName = (r: GeneratedRoom): string => {
    if (r.role === 'entry') return theme.entry;
    if (!genericLabel(r.label) && r.role !== 'boss' && !usedNames.has(r.label!)) {
      usedNames.add(r.label!);
      return r.label!;
    }
    if (r.role === 'boss') return theme.miniBossRoom;
    if (r.role === 'stair') return r.via === 'ladder' ? 'Ladder Shaft' : 'Stairwell Down';
    if (r.role === 'secret') return `Hidden ${theme.cacheRoom.split(' ').pop()}`;
    if (r.landing) return `${floorWord(r.floor)} Landing`;
    if (r.role === 'cache' && !cacheNamed) {
      cacheNamed = true;
      return theme.cacheRoom;
    }
    return nextRoomName();
  };

  const trash = foePool(state, 'trash', hub?.id);
  const elite = foePool(state, 'elite', hub?.id);
  const hubBound = (list: EncounterSeed[]) => !!hub?.id && list.some((e) => e.hubId === hub.id);
  const creature = (tier: 'trash' | 'elite'): string => {
    const base = pick(tier === 'trash' ? family.trash : family.elite, rng) ?? (tier === 'trash' ? theme.foe : theme.boss);
    if (!threat) return base;
    return `${tier === 'trash' ? pick(threat.prefixes, rng) ?? threat.prefixes[0] : threat.bossPrefix} ${base}`;
  };
  const trashFromHub = hubBound(trash);
  const eliteFromHub = hubBound(elite);
  if (typeof console !== 'undefined') {
    console.info(
      `[dungeon-card] ${name}: biome=${ctx.biome} source=${ctx.source}${ctx.modifiers.length ? ` modifiers=${ctx.modifiers.map((m) => m.tag).join(',')}` : ''}${trashFromHub ? ' trash=hub-cards' : ''}${eliteFromHub ? ' elite=hub-cards' : ''} templates=${gen.templateIds.join('+')} floors=${gen.floors}${gen.secrets.length ? ` secret-rooms=${gen.secrets.length}` : ''}`
    );
  }
  const foeRooms = gen.rooms.filter((r) => r.role === 'room' && !r.landing);
  const bronzeRoom = foeRooms.length ? foeRooms[Math.floor(rng() * foeRooms.length)]!.id : null;

  const nodes: MapNode[] = gen.nodes.map((g) => {
    const r = gen.rooms.find((x) => x.id === g.id)!;
    const id = g.id;
    const label = roomName(r);
    const hidden: NodeHidden = { traps: [], lootables: [], secrets: [], mobs: [] };
    const tags = ['dungeon-card', ...(g.tags ?? [])];
    if (r.role === 'entry') {
      tags.push('entry', `biome:${ctx.biome}`, `theme-source:${ctx.source}`, `layout:${gen.templateIds.join('+')}`);
      for (const m of ctx.modifiers) tags.push(`threat:${m.tag}`);
    }
    if (r.role === 'room' && !r.landing) {
      tags.push('combat');
      const card = pick(trash, rng);
      hidden.mobs.push({
        id: `${id}__${card?.id ?? 'foe'}`,
        name: trashFromHub && card?.foeName ? card.foeName : creature('trash'),
        level,
        role: 'trash',
        spawned: false,
      });
      if (rng() < 0.3) {
        hidden.traps.push({
          id: `${id}_trap`,
          dc: 10 + danger + Math.floor(rng() * 3),
          skillHint: 'perception',
          damage: 1 + danger + Math.floor(rng() * 3),
          revealed: false,
          disarmed: false,
        });
      }
      if (!secretOf.has(id) && rng() < 0.35) {
        hidden.secrets.push({ id: `${id}_secret`, clue: 'a loose stone with a hollow behind it', revealed: false });
      }
      if (id === bronzeRoom) {
        hidden.lootables.push({ id: `${id}_chest`, label: `${CHEST_GRADE_LABELS[1]} chest`, opened: false, loot: { rarity: 'Common', qty: 1, grade: 1 } });
      }
    }
    if (r.role === 'stair') {
      tags.push('stair');
      if (rng() < 0.5) {
        hidden.traps.push({ id: `${id}_trap`, dc: 10 + danger, skillHint: 'perception', damage: 1 + danger, revealed: false, disarmed: false });
      }
    }
    if (r.role === 'cache') {
      tags.push('cache');
      hidden.traps.push({
        id: `${id}_trap`,
        dc: 11 + danger,
        skillHint: 'perception',
        damage: 2 + danger,
        revealed: false,
        disarmed: false,
      });
      hidden.lootables.push({ id: `${id}_chest`, label: `${CHEST_GRADE_LABELS[2]} chest`, opened: false, loot: { rarity: 'Common', qty: 2, grade: 2 } });
      if (!secretOf.has(id)) hidden.secrets.push({ id: `${id}_secret`, clue: 'a false panel behind the shelves', revealed: false });
    }
    if (r.role === 'secret') {
      tags.push('secret-room');
      hidden.lootables.push({ id: `${id}_chest`, label: `${CHEST_GRADE_LABELS[2]} chest`, opened: false, loot: { rarity: 'Common', qty: 2, grade: 2 } });
    }
    if (r.role === 'boss') {
      tags.push('mini_boss');
      const card = pick(elite, rng);
      hidden.mobs.push({
        id: `${id}__${card?.id ?? 'miniboss'}`,
        name: eliteFromHub && card?.foeName ? card.foeName : creature('elite'),
        level: level + 1,
        role: 'miniBoss',
        spawned: false,
      });
      hidden.lootables.push({ id: `${id}_chest`, label: `${CHEST_GRADE_LABELS[3]} chest`, opened: false, loot: { rarity: 'Common', qty: 3, grade: 3 } });
    }
    const hiddenRoomId = secretOf.get(id);
    if (hiddenRoomId) {
      hidden.secrets.push({ id: `${id}_to_${hiddenRoomId}`, clue: 'a hidden door behind a loose panel', revealed: false, unlocksNodeId: hiddenRoomId });
    }
    return {
      ...g,
      name: label,
      description: `${label}, inside ${name}.`,
      tags,
      hidden,
    };
  });

  const entryZ = nodes.find((n) => n.id === gen.entryId)?.zLevel ?? -1;
  return {
    blueprintId: DUNGEON_CARD_BLUEPRINT,
    dungeonName: name,
    siteName: name,
    tier: 4,
    dangerTier: danger,
    areaLevel: Math.max(level, tierToAreaLevel(danger)),
    currentZLevel: entryZ,
    currentNodeId: gen.entryId,
    visitedNodeIds: [gen.entryId],
    clearedNodeIds: [],
    nodes,
    dungeonRules: { bossNode: gen.bossId ?? nodes[nodes.length - 1]!.id },
  };
}

function hereLabel(d: ActiveDungeonState): string {
  const node = d.nodes.find((n) => n.id === d.currentNodeId);
  return dungeonHereLabel(d.dungeonName, node?.name);
}

/** Enter a dungeon site: reuse the stored card (back at the entry room) or build it once. */
export function openDungeonCard(state: GameState, site: string): GameState {
  const hubName = siteHub(state, site)?.name ?? site;
  const place = findPlace(state, hubName);
  const stored = place?.dungeonCard;
  const card: ActiveDungeonState = stored
    ? { ...stored, currentNodeId: 'r0', currentZLevel: stored.nodes.find((n) => n.id === 'r0')?.zLevel ?? -1 }
    : buildDungeonCard(state, hubName);
  const id = place?.id ?? placeIdFromName(hubName);
  const places = place
    ? (state.places ?? []).map((p) => (p.id === place.id ? { ...p, allowsDungeon: true, dungeonRef: card.dungeonName } : p))
    : [
        ...(state.places ?? []),
        { id, name: hubName, allowsDungeon: true, dungeonRef: card.dungeonName, arcStatus: 'open' as const, mapScale: 'street' as const },
      ];
  return {
    ...state,
    activeDungeon: card,
    places,
    currentLocation: hereLabel(card),
    locationSheet: state.locationSheet
      ? { ...state.locationSheet, name: hereLabel(card), mapScale: 'dungeon' }
      : state.locationSheet,
    sceneFacts: { ...(state.sceneFacts ?? {}), indoor: true } as GameState['sceneFacts'],
  };
}

/** Store the card on its place record and clear activeDungeon (the player left). */
export function parkDungeonCard(state: GameState, opts?: { toSite?: boolean }): GameState {
  const d = state.activeDungeon;
  if (!isDungeonCard(d)) return state;
  const site = d.siteName ?? d.dungeonName;
  const place = findPlace(state, site);
  const places = place
    ? (state.places ?? []).map((p) => (p.id === place.id ? { ...p, dungeonCard: d, lastVisitedTurn: state.turn } : p))
    : [
        ...(state.places ?? []),
        { id: placeIdFromName(site), name: site, allowsDungeon: true, dungeonRef: d.dungeonName, dungeonCard: d, arcStatus: 'visited' as const, mapScale: 'street' as const },
      ];
  return {
    ...state,
    activeDungeon: null,
    places,
    currentLocation: opts?.toSite ? site : state.currentLocation,
    sceneFacts: { ...(state.sceneFacts ?? {}), indoor: opts?.toSite ? false : state.sceneFacts?.indoor } as GameState['sceneFacts'],
  };
}

function currentNode(d: ActiveDungeonState): MapNode | undefined {
  return d.nodes.find((n) => n.id === d.currentNodeId);
}

function withNode(d: ActiveDungeonState, nodeId: string, fn: (h: NodeHidden) => NodeHidden): ActiveDungeonState {
  return { ...d, nodes: d.nodes.map((n) => (n.id === nodeId && n.hidden ? { ...n, hidden: fn(n.hidden) } : n)) };
}

function mod(score: number | undefined): number {
  return Math.floor(((score ?? 10) - 10) / 2);
}

/** D&D shows the maths; other modes show results only. */
function rollLine(state: GameState, what: string, roll: number, m: number, dc: number, ok: boolean, result: string): string {
  if (state.engineMode === 'dnd') {
    return `Dungeon: ${what} — d20 ${roll} ${m >= 0 ? '+' : '−'} ${Math.abs(m)} vs DC ${dc} — ${ok ? 'success' : 'failure'}. ${result}`;
  }
  return `Dungeon: ${what} — ${result}`;
}

function payDungeonXp(state: GameState, kind: MilestoneKind, key: string, label: string): { state: GameState; receipts: string[] } {
  if ((state.sandboxAwardKeys ?? []).includes(key)) return { state, receipts: [] };
  const r = milestoneXp(state.engineMode, kind, { level: state.character.level, strictness: state.gmStrictness });
  const keys = [...(state.sandboxAwardKeys ?? []), key];
  if (r.amount <= 0) return { state: { ...state, sandboxAwardKeys: keys }, receipts: [] };
  const leveled = applyCharacterXpGain(state.character, r.amount, state.engineMode);
  return {
    state: { ...state, character: leveled.character, sandboxAwardKeys: keys },
    receipts: [`XP Gained: ${r.amount} (${label}${r.detail ? ` — ${r.detail}` : ''})`, ...leveled.notes],
  };
}

function nearestUnexploredStep(d: ActiveDungeonState): string | null {
  const start = d.currentNodeId;
  const prev = new Map<string, string>();
  const queue = [start];
  const seen = new Set([start]);
  while (queue.length) {
    const id = queue.shift()!;
    if (id !== start && !d.visitedNodeIds.includes(id)) {
      let step = id;
      while (prev.get(step) !== start) step = prev.get(step)!;
      return step;
    }
    for (const next of d.nodes.find((n) => n.id === id)?.connections ?? []) {
      if (seen.has(next)) continue;
      seen.add(next);
      prev.set(next, id);
      queue.push(next);
    }
  }
  return null;
}

function liveFoe(node: MapNode | undefined) {
  return (node?.hidden?.mobs ?? []).find((m) => !m.defeated);
}

function spawnFoe(state: GameState, mob: NodeHidden['mobs'][number]): GameState {
  const d = state.activeDungeon!;
  const node = currentNode(d)!;
  const catalogId = mob.id.split('__')[1];
  const card = catalogId ? encountersForMode(state.engineMode).find((e) => e.id === catalogId) : undefined;
  const mini = mob.role === 'miniBoss';
  const level = Math.max(1, mob.level);
  const maxHp = mob.hpRemaining && mob.hpRemaining > 0 ? mob.hpRemaining : mini ? 20 + level * 3 : 10 + level * 3;
  const encounter: ActiveEncounter = {
    name: mob.name,
    level,
    hp: maxHp,
    maxHp,
    armorClass: 10 + Math.min(4, level) + (mini ? 1 : 0),
    strength: 10 + level + (mini ? 2 : 0),
    dexterity: 10,
    constitution: 10 + level,
    xpReward: card?.xpReward ?? 0,
    goldReward: card?.goldReward ?? 0,
    encounterId: `${d.dungeonName}:${node.id}:${mob.id}`,
    source: mini ? 'dungeon mini-boss' : 'dungeon room',
  };
  const dungeon = withNode(d, node.id, (h) => ({
    ...h,
    mobs: h.mobs.map((m) => (m.id === mob.id ? { ...m, spawned: true } : m)),
  }));
  return { ...state, activeEncounter: encounter, activeDungeon: dungeon };
}

/** The current room's card facts for the writer (one line). */
export function dungeonRoomFacts(state: GameState): string {
  const d = state.activeDungeon;
  if (!isDungeonCard(d)) return '';
  const node = currentNode(d);
  if (!node) return '';
  const h = node.hidden;
  const bits: string[] = [`Dungeon room: ${node.name}, inside ${d.dungeonName}.`];
  const foe = liveFoe(node);
  if (foe) bits.push(`${foe.name} is here${foe.role === 'miniBoss' ? ' (the mini-boss)' : ''}.`);
  else if ((h?.mobs ?? []).length) bits.push('The room is cleared; its foe lies dead.');
  for (const l of h?.lootables ?? []) bits.push(`A ${l.label}, ${l.opened ? 'already opened' : 'closed'}.`);
  for (const t of h?.traps ?? []) if (t.revealed) bits.push(`A trap here is ${t.disarmed ? 'sprung' : 'spotted'}.`);
  for (const s of h?.secrets ?? []) if (s.revealed) bits.push(`Found: ${s.clue}.`);
  const ways = node.connections
    .map((id) => d.nodes.find((n) => n.id === id))
    .filter((n): n is MapNode => !!n)
    .map((n) => `${n.name}${d.visitedNodeIds.includes(n.id) ? '' : ' (unexplored)'}`);
  if (ways.length) bits.push(`Ways on: ${ways.join(', ')}.`);
  return bits.join(' ');
}

/** Chips for the room: its own actions, the next unexplored room, and the way out. */
export function dungeonCardChoices(state: GameState): string[] {
  const d = state.activeDungeon;
  if (!isDungeonCard(d) || state.activeEncounter) return [];
  const node = currentNode(d);
  const out: string[] = [];
  const foe = liveFoe(node);
  if (foe) out.push(`Fight the ${foe.name}`);
  if (!foe) {
    const chest = (node?.hidden?.lootables ?? []).find((l) => !l.opened);
    if (chest) out.push(`Open the ${chest.label}`);
    const searched = (state.sandboxAwardKeys ?? []).includes(`dungeon-search:${d.dungeonName}:${node?.id}`);
    if (!searched && (node?.id !== 'r0' || (node?.hidden?.secrets ?? []).some((x) => !x.revealed))) out.push(`Search the ${node?.name}`);
  }
  if (nearestUnexploredStep(d)) out.push('Next unexplored room');
  out.push('Head back to the exit');
  return out;
}

const EXIT_RE = /\b(head back to the exit|leave the dungeon|exit the dungeon|climb (?:back )?out)\b/i;
const NEXT_RE = /\b(next unexplored room|go deeper|press on|explore (?:on|further|deeper))\b/i;
const SEARCH_RE = /\b(search|look for (?:secrets|hidden))\b/i;
const OPEN_RE = /\b(open|loot|pry)\b.*\b(chest|cache|coffer)\b/i;
const FIGHT_RE = /\b(fight|attack|engage|strike)\b/i;

/**
 * Run the card for this turn (after the arc director and any move). Returns receipts; lines starting
 * "Dungeon" are engine facts for the writer.
 */
export function advanceDungeonCard(
  state: GameState,
  playerInput: string,
  arcReceipts: string[] = []
): { state: GameState; receipts: string[] } {
  let next = state;
  const receipts: string[] = [];
  const d0 = next.activeDungeon;
  // Seeded (non-card) dungeons: chests roll by code and land on the floor for pickup.
  if (!isDungeonCard(d0)) return openSeededLootable(state, playerInput);
  const input = (playerInput ?? '').trim();

  // Left by travel: the place is no longer this dungeon's room → park the card.
  const node0 = currentNode(d0);
  if (node0 && !(next.currentLocation ?? '').toLowerCase().includes(node0.name.toLowerCase())) {
    return { state: parkDungeonCard(next), receipts };
  }

  // First entry milestone (once per dungeon per save).
  const entry = payDungeonXp(next, 'dungeonEntry', `dungeon-entry:${d0.dungeonName}`, `entered ${d0.dungeonName}`);
  next = entry.state;
  receipts.push(...entry.receipts);

  // Fight settled this turn inside the room → mark the foe, room cleared, mini-boss down.
  {
    const d = next.activeDungeon!;
    const node = currentNode(d)!;
    const foe = liveFoe(node);
    if (foe && !next.activeEncounter && arcReceipts.some((r) => r.startsWith(`Encounter cleared: ${foe.name} (victory)`))) {
      next = {
        ...next,
        activeDungeon: withNode(d, node.id, (h) => ({
          ...h,
          mobs: h.mobs.map((m) => (m.id === foe.id ? { ...m, spawned: true, defeated: true, hpRemaining: null } : m)),
        })),
      };
      if (foe.role === 'miniBoss') receipts.push(`Dungeon: the mini-boss ${foe.name} is down.`);
      const after = currentNode(next.activeDungeon!);
      if (!liveFoe(after)) {
        next = {
          ...next,
          activeDungeon: {
            ...next.activeDungeon!,
            clearedNodeIds: Array.from(new Set([...(next.activeDungeon!.clearedNodeIds ?? []), node.id])),
          },
        };
        receipts.push(`Dungeon: ${node.name} is cleared.`);
        const paid = payDungeonXp(next, 'roomCleared', `dungeon-room:${d.dungeonName}:${node.id}`, `cleared ${node.name}`);
        next = paid.state;
        receipts.push(...paid.receipts);
      }
      if (next.activeDungeon!.nodes.every((n) => !liveFoe(n))) {
        receipts.push(`Dungeon: every foe in ${d.dungeonName} is down.`);
        const all = payDungeonXp(next, 'dungeonCleared', `dungeon-cleared:${d.dungeonName}`, `cleared ${d.dungeonName}`);
        next = all.state;
        receipts.push(...all.receipts);
      }
    }
  }

  const attrs = next.character.attributes as unknown as Record<string, number | undefined> | undefined;
  const d = next.activeDungeon!;
  const node = currentNode(d)!;
  const foeHere = liveFoe(node);

  if (EXIT_RE.test(input) && !next.activeEncounter) {
    receipts.push(`Dungeon: you climbed back out of ${d.dungeonName}.`);
    return { state: parkDungeonCard(next, { toSite: true }), receipts };
  }

  if (NEXT_RE.test(input) || node.connections.some((id) => {
    const n = d.nodes.find((x) => x.id === id);
    return !!n && new RegExp(`\\b${n.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(input);
  })) {
    if (next.activeEncounter) {
      receipts.push(`Dungeon: ${next.activeEncounter.name} blocks the way on.`);
    } else {
      const named = node.connections.find((id) => {
        const n = d.nodes.find((x) => x.id === id);
        return !!n && input.toLowerCase().includes(n.name.toLowerCase());
      });
      const target = named ?? nearestUnexploredStep(d);
      if (target) {
        const moved = moveToNode(d, target);
        next = { ...next, activeDungeon: moved, currentLocation: hereLabel(moved) };
        if (next.locationSheet) next = { ...next, locationSheet: { ...next.locationSheet, name: hereLabel(moved) } };
        const room = currentNode(moved)!;
        receipts.push(`Dungeon: you moved into ${room.name}.`);
        const trap = (room.hidden?.traps ?? []).find((t) => !t.revealed);
        if (trap) {
          const roll = Math.floor(Math.random() * 20) + 1;
          const m = mod(attrs?.WIS);
          const ok = roll + m >= trap.dc;
          const dmg = ok ? 0 : trap.damage ?? 2;
          const hp = Math.max(1, next.character.hp - dmg);
          next = {
            ...next,
            character: { ...next.character, hp },
            activeDungeon: withNode(next.activeDungeon!, room.id, (h) => ({
              ...h,
              traps: h.traps.map((t) => (t.id === trap.id ? { ...t, revealed: true, disarmed: !ok } : t)),
            })),
          };
          receipts.push(
            rollLine(next, 'trap check', roll, m, trap.dc, ok, ok ? 'you spotted a trap and stepped around it.' : `a trap went off; you took ${dmg} damage (HP ${hp}).`)
          );
        }
      }
    }
  } else if (OPEN_RE.test(input)) {
    const chest = (node.hidden?.lootables ?? []).find((l) => !l.opened);
    if (foeHere) {
      receipts.push(`Dungeon: ${foeHere.name} stands between you and the chest.`);
    } else if (chest) {
      const grade = chest.loot.grade ?? 1;
      const loot = rollLoot({ profile: chestProfileForGrade(grade), state: next, seed: `${next.seed ?? 'seed'}:${d.dungeonName}:${chest.id}` });
      next = {
        ...next,
        inventory: [...(next.inventory ?? []), ...loot.items],
        gold: (next.gold ?? 0) + loot.gold,
        lootPity: loot.nextPity != null
          ? { byTier: { ...(next.lootPity?.byTier ?? {}), [loot.pityTier]: loot.nextPity } }
          : next.lootPity,
        activeDungeon: withNode(d, node.id, (h) => ({
          ...h,
          lootables: h.lootables.map((l) => (l.id === chest.id ? { ...l, opened: true } : l)),
        })),
      };
      receipts.push(`Dungeon: you opened the ${chest.label}.`);
      if (loot.items.length) receipts.push(`Loot: ${loot.items.map((i) => `[${i.rarity}] ${i.name}`).join(', ')}`);
      if (loot.gold > 0) receipts.push(`Gold Gained: ${loot.gold}`);
      if (next.engineMode === 'dnd') receipts.push(...loot.displayLines);
      if (!loot.items.length && loot.gold <= 0) receipts.push(`Dungeon: the ${chest.label} was empty.`);
    } else {
      receipts.push(`Dungeon: there is no closed chest in ${node.name}.`);
    }
  } else if (SEARCH_RE.test(input) && !foeHere) {
    const key = `dungeon-search:${d.dungeonName}:${node.id}`;
    const secret = (node.hidden?.secrets ?? []).find((s) => !s.revealed);
    next = { ...next, sandboxAwardKeys: Array.from(new Set([...(next.sandboxAwardKeys ?? []), key])) };
    if (secret) {
      const roll = Math.floor(Math.random() * 20) + 1;
      const m = mod(attrs?.INT);
      const dc = 10 + (d.dangerTier ?? 2);
      const ok = roll + m >= dc;
      if (ok) {
        const loot = rollLoot({ profile: 'chestBronze', state: next, seed: `${next.seed ?? 'seed'}:${d.dungeonName}:${secret.id}` });
        next = {
          ...next,
          inventory: [...(next.inventory ?? []), ...loot.items],
          gold: (next.gold ?? 0) + loot.gold,
          activeDungeon: withNode(next.activeDungeon!, node.id, (h) => ({
            ...h,
            secrets: h.secrets.map((s) => (s.id === secret.id ? { ...s, revealed: true } : s)),
          })),
        };
        const hiddenRoom = secret.unlocksNodeId ? next.activeDungeon!.nodes.find((n) => n.id === secret.unlocksNodeId) : undefined;
        if (hiddenRoom) {
          // 28j — a found secret opens its hidden room onto the door graph (both ways).
          next = {
            ...next,
            activeDungeon: {
              ...next.activeDungeon!,
              nodes: next.activeDungeon!.nodes.map((n) =>
                n.id === node.id
                  ? { ...n, connections: Array.from(new Set([...n.connections, hiddenRoom.id])) }
                  : n.id === hiddenRoom.id
                    ? { ...n, connections: Array.from(new Set([...n.connections, node.id])) }
                    : n
              ),
            },
          };
        }
        receipts.push(rollLine(next, `search of ${node.name}`, roll, m, dc, true, `you found ${secret.clue}${hiddenRoom ? ` — a way into ${hiddenRoom.name}` : ''}.`));
        if (loot.items.length) receipts.push(`Loot: ${loot.items.map((i) => `[${i.rarity}] ${i.name}`).join(', ')}`);
        if (loot.gold > 0) receipts.push(`Gold Gained: ${loot.gold}`);
      } else {
        receipts.push(rollLine(next, `search of ${node.name}`, roll, m, dc, false, 'you found nothing.'));
      }
    } else {
      receipts.push(`Dungeon: you searched ${node.name} and found nothing hidden.`);
    }
  }

  // A foe in the current room: spawn it on arrival, or re-engage when the player picks the fight.
  if (!next.activeEncounter) {
    const room = currentNode(next.activeDungeon!)!;
    const foe = liveFoe(room);
    if (foe && (!foe.spawned || FIGHT_RE.test(input))) {
      next = spawnFoe(next, foe);
      receipts.push(`Dungeon: ${foe.name} is here in ${room.name}${foe.role === 'miniBoss' ? ' — the mini-boss' : ''}.`);
    }
  }

  const facts = dungeonRoomFacts(next);
  if (facts) receipts.push(facts);
  return { state: next, receipts };
}
