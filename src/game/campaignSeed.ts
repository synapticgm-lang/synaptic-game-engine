import type { CampaignBible, StarterItem } from '@/data/campaigns/types';
import { ALL_CAMPAIGN_BIBLES } from '@/data/campaigns';
import type { CampaignArchetype } from './archetypes';
import type { Character, Container, EngineMode, GameState, Item, LoreCard, LoreCardType } from './types';
import { isFictionEngine } from './types';
import { syncContainerOccupancy } from './inventory';
import { stampMysteryCulprit } from './mysteryCulprit';

function snippetType(category: string): LoreCardType {
  if (category === 'faction') return 'faction';
  if (category === 'history') return 'lore';
  if (category === 'mechanic') return 'lore';
  if (category === 'culture') return 'lore';
  return 'location';
}

export function findBibleForArchetype(
  engineMode: EngineMode,
  archetype?: CampaignArchetype
): CampaignBible | undefined {
  // Never silently seed an NSFW bible from an archetype fallback.
  const catalog = ALL_CAMPAIGN_BIBLES.filter((b) => !b.nsfw);
  if (!archetype || archetype === 'ai_random') {
    return catalog.find((b) => b.engineMode === engineMode)
      ?? catalog.find((b) => isFictionEngine(engineMode) && isFictionEngine(b.engineMode));
  }
  const exact = catalog.find(
    (b) => b.archetype === archetype && b.engineMode === engineMode
  );
  if (exact) return exact;
  if (isFictionEngine(engineMode)) {
    return catalog.find((b) => b.archetype === archetype && isFictionEngine(b.engineMode));
  }
  return catalog.find((b) => b.archetype === archetype);
}

/**
 * Seed lorebook, quests, and optional starter items from a CampaignBible.
 * Called at new-game start so Guide Book content is actually in runtime state.
 */
export function seedStateFromCampaignBible(
  state: GameState,
  bible: CampaignBible
): GameState {
  const lorebook: LoreCard[] = [
    ...state.lorebook,
    ...bible.loreSnippets.map((s) => ({
      id: s.id,
      name: s.title,
      type: snippetType(s.category),
      keywords: [...s.tags, s.title],
      summary: s.body.slice(0, 600),
      lastSeenTurn: 0,
      revealed: false,
    })),
    ...bible.keyNPCs.map((npc) => ({
      id: npc.id,
      name: npc.name,
      type: 'npc' as const,
      keywords: [npc.name, npc.role, npc.disposition, ...npc.hooks.slice(0, 3)],
      summary: `${npc.role}. Disposition: ${npc.disposition}. ${npc.description}`.slice(0, 600),
      visualAnchor: npc.description.slice(0, 160),
      lastSeenTurn: 0,
      revealed: false,
    })),
  ];

  // Dedupe by id
  const seen = new Set<string>();
  const dedupedLore = lorebook.filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });

  const playerLevel = state.character?.level ?? 1;
  const quests = state.quests ?? [];
  const loadout = buildCampaignLoadout(state, bible, playerLevel);
  const character = applyCampaignCharacter(state.character, bible);
  const questRail =
    'No opening quest yet — do not invent quest log entries. Guide Book hooks stay unspoken until the System reveals them.';
  const kitRail = formatKitRail(bible, loadout.inventory);

  return syncContainerOccupancy({
    ...state,
    character,
    campaignBibleId: bible.id,
    campaignPremise: `${bible.title}: ${bible.premise}\n\n${kitRail}\n\n${questRail}`.slice(0, 2200),
    hiddenStamps: stampMysteryCulprit(state, bible),
    storyName: state.storyName,
    lorebook: dedupedLore,
    quests,
    inventory: loadout.inventory,
    containers: loadout.containers,
    currentLocation: state.currentLocation || inferStartingLocation(bible),
    timeline: [
      ...(state.timeline ?? []),
      {
        id: crypto.randomUUID(),
        turn: 0,
        kind: 'discovery',
        text: `Campaign seeded: ${bible.title}`,
        at: Date.now(),
      },
    ],
  });
}

function inferStartingLocation(bible: CampaignBible): string {
  if (bible.startingLocation?.trim()) return bible.startingLocation.trim();
  return 'where this tale opens';
}

const GENERIC_FANTASY_ITEM =
  /worn iron shortsword|patched leather tunic|minor healing draught/i;
const GENERIC_FANTASY_CONTAINER = /worn satchel/i;

function isGenericFantasyStarter(item: Item): boolean {
  return (
    item.id === 'starter-weapon'
    || item.id === 'starter-armor'
    || item.id === 'starter-potion'
    || GENERIC_FANTASY_ITEM.test(item.name)
  );
}

function isGenericFantasyContainer(container: Container): boolean {
  return container.id === 'starter-satchel' || GENERIC_FANTASY_CONTAINER.test(container.name);
}

function inventoryHasGenericFantasyKit(state: GameState): boolean {
  return (
    state.inventory.some(isGenericFantasyStarter)
    || state.containers.some(isGenericFantasyContainer)
  );
}

function isModernEarthPremise(bible: CampaignBible): boolean {
  return /system integration|every human on earth|integration protocol|modern (?:city|world|infrastructure)/i.test(
    `${bible.title} ${bible.premise}`
  );
}

export function applyCampaignCharacter(character: Character, bible: CampaignBible): Character {
  if (!isModernEarthPremise(bible)) return character;
  const arrivalBio = /transmigrated|unfamiliar world|newly arrived/i.test(character.bio ?? '');
  if (!arrivalBio && character.bio?.trim() && character.bio !== 'Someone already living in this world when the story begins.') {
    return character;
  }
  return {
    ...character,
    bio: 'An ordinary person who was already living here when the System registered Earth.',
  };
}

function starterToItem(si: StarterItem, bible: CampaignBible, containerId?: string): Item {
  const isWeapon = si.itemType === 'weapon' || /sword|knife|blade|axe|bow|staff|mace|spear|dagger/i.test(si.name);
  const isArmor = si.itemType === 'armor' || /tunic|clothes|jacket|coat|shirt|armor/i.test(si.name);
  return {
    id: si.id,
    name: si.name,
    rarity: si.rarity,
    quantity: 1,
    itemType: si.itemType,
    itemLevel: si.itemLevel,
    description: si.description,
    provenance: si.provenance ?? `Campaign: ${bible.title}`,
    equipped: si.equipped ?? (isWeapon || isArmor),
    slot: si.slot ?? (isWeapon ? 'Main Hand' : isArmor ? 'Body' : undefined),
    containerId,
  };
}

function formatKitRail(bible: CampaignBible, inventory: Item[]): string {
  const frame = isModernEarthPremise(bible)
    ? 'This is this Earth, already in progress. The player did not arrive from another world.'
    : 'Use this kit. Do not invent extra starting gear.';
  return (
    `OPENING KIT (AUTHORITY): The player's inventory and worn clothes ARE the kit below. ${frame} `
    + `Do not dress them as a fantasy traveler unless this premise is a fantasy arrival.\n`
    + inventory
      .map((i) => `- ${i.name}${i.equipped ? ' (worn/held)' : ''}: ${i.provenance ?? i.description ?? ''}`)
      .join('\n')
  );
}

function buildCampaignLoadout(
  state: GameState,
  bible: CampaignBible,
  playerLevel: number
): { inventory: Item[]; containers: Container[] } {
  const replace = bible.replaceDefaultLoadout === true || isFictionEngine(bible.engineMode);
  const containerSpec = bible.startingContainer;
  const campaignReady = bible.starterItems.filter((si) => (si.itemLevel ?? 1) <= playerLevel);

  if (replace) {
    const pack: Container | undefined = containerSpec
      ? {
          id: containerSpec.id,
          name: containerSpec.name,
          capacity: containerSpec.capacity,
          used: 0,
          modifier: 'none',
          itemIds: [],
          storageType: 'General',
          kind: 'physical',
          equipped: true,
          slot: 'Container',
        }
      : state.containers.find((c) => !isGenericFantasyContainer(c));
    const containers = pack
      ? [pack, ...state.containers.filter((c) => c.id !== pack.id && !isGenericFantasyContainer(c))]
      : state.containers.filter((c) => !isGenericFantasyContainer(c));
    const containerId = containers[0]?.id;
    const campaignItems = campaignReady.map((si) => starterToItem(si, bible, containerId));
    const campaignNames = new Set(campaignItems.map((i) => i.name.toLowerCase()));
    const kept = state.inventory.filter(
      (i) => !isGenericFantasyStarter(i) && !campaignNames.has(i.name.toLowerCase())
    ).map((i) => ({ ...i, containerId: i.containerId && containers.some((c) => c.id === i.containerId) ? i.containerId : containerId }));
    return { inventory: [...campaignItems, ...kept], containers };
  }

  const existingContainerId = state.containers[0]?.id;
  const invNames = new Set(state.inventory.map((i) => i.name.toLowerCase()));
  const alreadyHasWeapon = state.inventory.some(
    (i) =>
      i.itemType === 'weapon'
      || i.slot === 'Main Hand'
      || /sword|knife|blade|axe|bow|staff|mace|spear|dagger/i.test(i.name)
  );
  const starterItems = campaignReady
    .filter((si) => !invNames.has(si.name.toLowerCase()))
    .filter((si) => !(si.itemType === 'weapon' && alreadyHasWeapon))
    .slice(0, 3)
    .map((si) => starterToItem(si, bible, existingContainerId));
  return {
    inventory: [...state.inventory, ...starterItems],
    containers: state.containers,
  };
}

/**
 * Repair saves that still carry the generic fantasy traveler kit on a campaign
 * that declared its own opening loadout (e.g. System Integration).
 */
export function reconcileCampaignLoadout(state: GameState): GameState {
  const bible = state.campaignBibleId
    ? ALL_CAMPAIGN_BIBLES.find((b) => b.id === state.campaignBibleId)
    : findBibleForArchetype(state.engineMode, state.campaignArchetype);
  const stamped =
    bible?.mysteryCulprits?.length && !state.hiddenStamps?.culpritId
      ? { ...state, hiddenStamps: stampMysteryCulprit(state, bible) }
      : state;
  const shouldReplace = bible?.replaceDefaultLoadout === true || isFictionEngine(bible?.engineMode);
  if (!bible || !shouldReplace) return stamped;
  const kitStale = inventoryHasGenericFantasyKit(state);
  const premiseStale = !state.campaignPremise || !/OPENING KIT/i.test(state.campaignPremise);
  const bioStale = /transmigrated|unfamiliar world|newly arrived/i.test(state.character?.bio ?? '');
  if (!kitStale && !premiseStale && !bioStale) return stamped;
  return seedStateFromCampaignBible(stamped, bible);
}

export function seedStateFromArchetype(
  state: GameState,
  engineMode: EngineMode,
  archetype?: CampaignArchetype
): GameState {
  const bible = findBibleForArchetype(engineMode, archetype);
  if (!bible) return state;
  return seedStateFromCampaignBible(state, bible);
}
