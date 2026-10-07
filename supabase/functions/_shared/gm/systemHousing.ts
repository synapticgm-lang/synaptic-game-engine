/**
 * LitRPG system housing — picked once at story start from the seed and frozen on the save.
 * Code-owned. Parts a housing forbids are never on; the writer and the window only see parts that are on.
 */

import type { Character, Container, Item, Quest } from './types.ts';

export type SystemHousingId = 'private_window' | 'worn_device' | 'world_status' | 'leftover_pocket';

export type SystemPartId =
  | 'health'
  | 'power_pool'
  | 'level'
  | 'experience'
  | 'active_effects'
  | 'skills'
  | 'quest_list'
  | 'pocket'
  | 'shop'
  | 'map'
  | 'light'
  | 'radio'
  | 'weapon_copy'
  | 'party_view'
  | 'base_building';

export const SYSTEM_PART_IDS: readonly SystemPartId[] = [
  'health',
  'power_pool',
  'level',
  'experience',
  'active_effects',
  'skills',
  'quest_list',
  'pocket',
  'shop',
  'map',
  'light',
  'radio',
  'weapon_copy',
  'party_view',
  'base_building',
];

export interface SystemHousingConfig {
  housing: SystemHousingId;
  parts: Record<SystemPartId, boolean>;
  /** A standing world rule for this housing (not a menu). */
  rule?: string;
}

interface HousingSpec {
  alwaysOn: SystemPartId[];
  optional: SystemPartId[];
  name: string;
  visibility: string;
  rule?: string;
}

const LEFTOVER_THIEF_RULE = 'A skilled thief can take one or two items from it.';

export const SYSTEM_HOUSINGS: Record<SystemHousingId, HousingSpec> = {
  private_window: {
    alwaysOn: ['health', 'power_pool', 'level', 'experience'],
    optional: ['skills', 'quest_list', 'pocket', 'shop'],
    name: "A private window that lives only in the player's head.",
    visibility: 'Nobody else can see it, and it cannot be shared.',
  },
  worn_device: {
    alwaysOn: ['health', 'power_pool', 'level', 'experience', 'active_effects'],
    optional: ['pocket', 'quest_list', 'map', 'light', 'radio'],
    name: 'A worn device, a real object on the body.',
    visibility: 'Others can see the object, but only the wearer reads the screen, and it is hard to remove.',
  },
  world_status: {
    alwaysOn: ['health', 'power_pool', 'level', 'experience'],
    optional: ['weapon_copy', 'party_view'],
    name: 'Levels exist in the world.',
    visibility: '',
  },
  leftover_pocket: {
    alwaysOn: ['pocket'],
    optional: [],
    name: 'A leftover pocket the player reaches into to store things.',
    visibility: 'People nearby usually cannot see the opening.',
    rule: LEFTOVER_THIEF_RULE,
  },
};

/** Names older saves wrote into their SYSTEM paragraph. */
const LEGACY_HOUSING_NAMES: Partial<Record<SystemHousingId, string[]>> = {
  leftover_pocket: ['A leftover pocket the player reaches into to store things. There is no status panel and no window.'],
};

/** What world_status is, for the writer: people simply know. */
export const WORLD_STATUS_WRITER_SENTENCE =
  'People can tell a level. A normal group can tell name, health, and one power pool.';

const WORLD_STATUS_BOUND = 'The full sheet is only for someone the player has bound.';

const HOUSING_IDS: readonly SystemHousingId[] = ['private_window', 'worn_device', 'world_status', 'leftover_pocket'];

function hashSeed(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function allOff(): Record<SystemPartId, boolean> {
  return Object.fromEntries(SYSTEM_PART_IDS.map((p) => [p, false])) as Record<SystemPartId, boolean>;
}

export function isSystemHousingId(value: unknown): value is SystemHousingId {
  return typeof value === 'string' && (HOUSING_IDS as readonly string[]).includes(value);
}

/** Always-on parts on, parts the housing does not allow off. */
export function clampSystemHousing(config: SystemHousingConfig): SystemHousingConfig {
  const spec = SYSTEM_HOUSINGS[config.housing];
  const parts = allOff();
  for (const p of spec.optional) parts[p] = !!config.parts?.[p];
  for (const p of spec.alwaysOn) parts[p] = true;
  return spec.rule ? { housing: config.housing, parts, rule: spec.rule } : { housing: config.housing, parts };
}

export function rollSystemHousing(seed: string): SystemHousingConfig {
  const key = String(seed ?? '');
  const housing = HOUSING_IDS[hashSeed(`housing:${key}`) % HOUSING_IDS.length];
  const parts = allOff();
  for (const p of SYSTEM_HOUSINGS[housing].optional) {
    parts[p] = hashSeed(`part:${p}:${key}`) % 2 === 0;
  }
  return clampSystemHousing({ housing, parts });
}

export function isPartOn(config: SystemHousingConfig | null | undefined, part: SystemPartId): boolean {
  if (!config || !isSystemHousingId(config.housing)) return false;
  return clampSystemHousing(config).parts[part];
}

/** A housing with no quest list: the System prints no quest list. The quests still exist. */
export function questListHidden(config: SystemHousingConfig | null | undefined): boolean {
  return !!config && isSystemHousingId(config.housing) && !isPartOn(config, 'quest_list');
}

/** A housing whose only storage is the pocket: no bag on the body, everything not worn is stored. */
export function pocketOnlyKit(config: SystemHousingConfig | null | undefined): boolean {
  return config?.housing === 'leftover_pocket';
}

const BODY_BAG_ITEM = /^(?:bag|backpack|satchel|rucksack|knapsack|pack)$/i;

/** Pocket-only kit: body bags go, worn gear stays worn, everything else is stored in the pocket. */
export function fitKitToPocket(inventory: Item[], containers: Container[]): { inventory: Item[]; containers: Container[] } {
  const kept = containers.filter((c) => c.kind === 'magical');
  const keptIds = new Set(kept.map((c) => c.id));
  const items = inventory
    .filter((i) => !BODY_BAG_ITEM.test(i.name.trim()))
    .map((i): Item => {
      if (i.containerId && keptIds.has(i.containerId)) return i;
      if (i.equipped) return i.containerId ? { ...i, containerId: undefined } : i;
      return { ...i, containerId: undefined, storedInPocket: true };
    });
  return { inventory: items, containers: kept.map((c) => ({ ...c, itemIds: c.itemIds.filter((id) => items.some((i) => i.id === id)) })) };
}

/** A new item under the pocket-only kit is stored, not worn. */
export function storeInPocket(item: Item): Item {
  return { ...item, equipped: false, containerId: undefined, storedInPocket: true };
}

export interface WriterFacts {
  /** Quests in the world. The quest_list part only decides whether the System prints a list of them. */
  quests: Quest[];
  /** Worn and carried items (never pocketed ones when the housing has a pocket). */
  carried: Item[];
  /** Items stored in the pocket. Empty when the housing has no pocket. */
  pocket: Item[];
  containers: Container[];
  /** One block per part the frozen housing allows. Empty for a save with no housing. */
  blocks: string[];
}

interface WriterFactsSource {
  systemHousing?: SystemHousingConfig | null;
  quests?: Quest[];
  inventory?: Item[];
  containers?: Container[];
  character?: Pick<Character, 'level' | 'xp' | 'xpToNext'>;
  engineMode?: string;
}

function partBlock(housing: SystemHousingId, part: SystemPartId, facts: Omit<WriterFacts, 'blocks'>, src: WriterFactsSource, nameOf: (name: string) => string): string {
  const c = src.character;
  switch (part) {
    case 'level':
      return `Level: ${c?.level ?? 1}`;
    case 'experience':
      return `XP: ${c?.xp ?? 0}/${c?.xpToNext ?? 0}`;
    case 'quest_list': {
      const main = facts.quests.filter((q) => q.type === 'main').map((q) => `[MAIN] ${q.name} (${q.status})`);
      const side = facts.quests.filter((q) => q.type === 'side' && q.status === 'active').map((q) => `[SIDE] ${q.name}`);
      return `Quest list: ${[...main, ...side].join('; ') || 'none active'}`;
    }
    case 'pocket':
      return facts.pocket.length
        ? `In the pocket (stored; not worn, not in a bag, not on the body): ${facts.pocket.map((i) => `${nameOf(i.name)} x${i.quantity}`).join('; ')}`
        : 'In the pocket: nothing stored yet.';
    default:
      return `System part: ${partLabel(housing, part)}.`;
  }
}

/**
 * The only author of the writer's quest, item, container and system-part facts.
 * Housed saves read the frozen allow list; a part that is off gets no block. Saves with no housing
 * (tabletop, story, old LitRPG) keep every quest and item, and no blocks. Only a LitRPG save reads its housing.
 */
export function writerFacts(src: WriterFactsSource, nameOf: (name: string) => string = (n) => n): WriterFacts {
  const inventory = src.inventory ?? [];
  const containers = src.containers ?? [];
  const config = src.engineMode && src.engineMode !== 'litrpg' ? null : src.systemHousing;
  if (!config || !isSystemHousingId(config.housing)) {
    return {
      quests: src.quests ?? [],
      carried: inventory.filter((i) => !i.storedInPocket),
      pocket: inventory.filter((i) => i.storedInPocket),
      containers,
      blocks: [],
    };
  }
  const clamped = clampSystemHousing(config);
  const hasPocket = clamped.parts.pocket;
  const facts = {
    quests: src.quests ?? [],
    carried: hasPocket ? inventory.filter((i) => !i.storedInPocket) : inventory,
    pocket: hasPocket ? inventory.filter((i) => i.storedInPocket) : [],
    containers,
  };
  const blocks = SYSTEM_PART_IDS
    .filter((p) => clamped.parts[p])
    .map((p) => partBlock(clamped.housing, p, facts, src, nameOf));
  return { ...facts, blocks };
}

function partLabel(housing: SystemHousingId, part: SystemPartId): string {
  switch (part) {
    case 'health': return 'health';
    case 'power_pool': return 'one power pool';
    case 'level': return 'level';
    case 'experience': return 'experience';
    case 'active_effects': return 'active effects';
    case 'skills': return 'skills';
    case 'quest_list': return 'a quest list';
    case 'pocket':
      if (housing === 'private_window') return 'a pocket others cannot search';
      if (housing === 'worn_device') return 'a pocket with item notes';
      return 'the pocket (store things; coins inside have no weight)';
    case 'shop': return 'a shop that stays open';
    case 'map': return 'a map of places already walked';
    case 'light': return 'a light';
    case 'radio': return 'a radio';
    case 'weapon_copy': return 'weapon copying (store a weapon met; absorb materials into forms)';
    case 'party_view': return 'party view (name, health, and power pool; full sheet only if bound)';
    case 'base_building': return 'base building';
  }
}

export function enabledPartLabels(config: SystemHousingConfig): string[] {
  const clamped = clampSystemHousing(config);
  return SYSTEM_PART_IDS.filter((p) => clamped.parts[p]).map((p) => partLabel(clamped.housing, p));
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

export function formatSystemBlock(config: SystemHousingConfig): string {
  const clamped = clampSystemHousing(config);
  const spec = SYSTEM_HOUSINGS[clamped.housing];
  const labels = enabledPartLabels(clamped);
  if (clamped.housing === 'world_status') {
    return ['SYSTEM:', spec.name, WORLD_STATUS_WRITER_SENTENCE, WORLD_STATUS_BOUND, `Known: ${joinList(labels)}.`].join(' ');
  }
  const shows = clamped.housing === 'leftover_pocket'
    ? `It holds only ${joinList(labels)}.`
    : `It shows ${joinList(labels)}.`;
  return ['SYSTEM:', spec.name, spec.visibility, shows, clamped.rule ?? ''].filter(Boolean).join(' ');
}

/** The housing a SYSTEM paragraph was written for. */
export function housingFromSystemBlock(block: string | null | undefined): SystemHousingId | null {
  const t = block ?? '';
  if (!t) return null;
  return HOUSING_IDS.find((id) =>
    [SYSTEM_HOUSINGS[id].name, ...(LEGACY_HOUSING_NAMES[id] ?? [])].some((name) => t.includes(name))
  ) ?? null;
}

/** Status chip. Unknown housing keeps the old panel chip. */
export function systemStatusChip(housing: SystemHousingId | null | undefined): string {
  switch (housing) {
    case 'worn_device': return 'Read the device';
    case 'private_window': return 'Look inward';
    case 'world_status': return 'Ask the world';
    case 'leftover_pocket': return 'Reach into the pocket';
    default: return 'Inspect the panel';
  }
}

/** Plain English the writer must follow for this frozen housing. */
export function systemHousingWriterClause(housing: SystemHousingId | null | undefined): string {
  switch (housing) {
    case 'worn_device':
      return 'a real object on the body. Others can see the object. Only the wearer can read the screen.';
    case 'private_window':
      return "only in the player's head. Others cannot see it. Not an object, and it does not float in the room.";
    case 'world_status':
      return WORLD_STATUS_WRITER_SENTENCE;
    case 'leftover_pocket':
      return 'a pocket the player reaches into to store things.';
    default:
      return 'not a thing in the scene. Nobody holds, opens, points at or looks at it.';
  }
}

/** The housing as whole sentences, for writer facts that stand on their own line. */
export function systemHousingWriterSentence(housing: SystemHousingId): string {
  switch (housing) {
    case 'worn_device':
      return 'The system is a worn device, a real object on the body. Others can see the object. Only the wearer can read the screen.';
    case 'private_window':
      return "The system lives only in the player's head. Others cannot see it. It is not an object, and it does not float in the room.";
    case 'world_status':
      return `Levels exist in the world. ${WORLD_STATUS_WRITER_SENTENCE}`;
    case 'leftover_pocket':
      return 'The system is only a leftover pocket the player reaches into to store things.';
  }
}

/** How the opening page names the frozen housing. Housing none keeps the card's own panel sentence. */
export function belfryHousingLine(housing: SystemHousingId | null | undefined): string | null {
  switch (housing) {
    case 'worn_device':
      return 'A worn device, a real object on the body, is on you. Others can see the object, but only the wearer reads the screen, and it is hard to remove.';
    case 'private_window':
      return 'A private window lives only in the mind, and it is not a worn object.';
    case 'world_status':
      return 'Levels exist in the world. People can tell a level, and a normal group can tell name, health, and one power pool.';
    case 'leftover_pocket':
      return 'A leftover pocket holds what you put into it.';
    default:
      return null;
  }
}

/** A card sentence that authors the system as a floating panel. */
const CARD_PANEL_SENTENCE = /\b(?:(?:blue|system|the|your|a|private) panel|blue (?:screen|window)|system (?:screen|window)|empty air)\b/i;

/**
 * Opening cards author the system as a floating blue panel. Under a frozen housing, the first such
 * sentence becomes the housing line and the rest drop, with the question right after that was put
 * to the panel. Housing none keeps the card as written.
 */
export function applyOpeningHousingLine(text: string, housing: SystemHousingId | null | undefined): string {
  const line = belfryHousingLine(housing);
  if (!text || !line) return text;
  let placed = false;
  let afterPanel = false;
  return text
    .replace(/[^.!?\n]*[.!?]+/g, (sentence) => {
      const lead = sentence.match(/^[\s"”’)]*/)?.[0] ?? '';
      if (!CARD_PANEL_SENTENCE.test(sentence)) {
        const pointsBack = afterPanel && /\?$/.test(sentence);
        afterPanel = false;
        return pointsBack ? lead.trimEnd() : sentence;
      }
      afterPanel = true;
      if (placed) return lead.trimEnd();
      placed = true;
      return `${lead}${line}`;
    })
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/** A name-ask that addresses the panel. Under a frozen housing nobody asks through a panel. */
export function housedNameAsk(question: string, housing: SystemHousingId | null | undefined): string {
  if (!housing || !/\bpanel\b/i.test(question)) return question;
  return 'Nobody else is here to ask. What name do you go by?';
}
