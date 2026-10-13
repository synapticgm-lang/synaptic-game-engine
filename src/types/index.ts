/**
 * Unified type definitions — single source of truth for all components.
 * Re-exports existing game types and adds new shared interfaces.
 */

export type {
  Rarity,
  Item,
  ItemType,
  AttributeKey,
  Attributes,
  Character,
  GameState,
  LogEntry,
  Quest,
  QuestStatus,
  QuestType,
  RollRecord,
  EngineMode,
  Settings,
  ActiveEncounter,
  Companion,
  Container,
  CraftingMaterial,
  SummonEntity,
  LoreCard,
  LoreCardType,
} from '@/game/types';

export type { MapNode, MapBlueprint, ActiveDungeonState } from '@/game/mapEngine';

export type { ComicPanelScript, ComicDialogueLine, ComicScriptResponse, ComicTextAnchor } from './comicScript';
export { CAMERA_ANGLE_EXAMPLES, COMIC_TEXT_ANCHORS, normalizeTextAnchor } from './comicScript';

export type {
  PrintFormat,
  PrintFormatSpec,
  PanelsPerPageMode,
  PdfExportOptions,
  BookPagePanel,
  BookPage as PdfBookPage,
} from './pdfExport';
export { PRINT_FORMATS } from './pdfExport';

// ===== Progression types =====

export interface SpellSlot {
  level: number;
  total: number;
  expended: number;
}

export interface AttunementSlot {
  itemId: string;
  itemName: string;
  rarity: import('@/game/types').Rarity;
}

// ===== Combat types =====

export interface Combatant {
  id: string;
  name: string;
  initiative: number;
  hp: number;
  maxHp: number;
  ac: number;
  type: 'player' | 'ally' | 'enemy' | 'boss';
  conditions: string[];
  active: boolean;
}