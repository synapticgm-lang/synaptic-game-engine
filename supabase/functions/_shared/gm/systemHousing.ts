/**
 * LitRPG system housing — picked once at story start from the seed and frozen on the save.
 * Code-owned. Parts a housing forbids are never on; the writer and the window only see parts that are on.
 */

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
    name: 'A leftover pocket the player reaches into to store things. There is no status panel and no window.',
    visibility: 'People nearby usually cannot see the opening.',
    rule: LEFTOVER_THIEF_RULE,
  },
};

/** What world_status is, for the writer: nothing shows it, people simply know. */
export const WORLD_STATUS_WRITER_SENTENCE =
  'There is no panel, no device, and no window. People can tell a level. A normal group can tell name, health, and one power pool. No quest list shows, and no search result shows on a panel.';

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
  return HOUSING_IDS.find((id) => t.includes(SYSTEM_HOUSINGS[id].name)) ?? null;
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
      return 'a pocket the player reaches into to store things. There is no status panel and no window.';
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
      return 'The system is only a leftover pocket the player reaches into to store things. There is no status panel and no window.';
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
      return 'Levels exist in the world. There is no panel, no device, and no window. People can tell a level, and a normal group can tell name, health, and one power pool.';
    case 'leftover_pocket':
      return 'A leftover pocket holds what you put into it. There is no status panel and no window.';
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
