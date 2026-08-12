import type { CampaignArchetype } from './archetypes.ts';
import type { ActiveDungeonState } from './mapEngine.ts';
import type { ComicTextAnchor } from './comicScript.ts';

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

export interface Item {
  id: string;
  name: string;
  rarity: Rarity;
  quantity: number;
  description?: string;
  provenance?: string;
  equipped?: boolean;
  slot?: string;
  itemLevel?: number;
  modifiers?: Partial<Record<AttributeKey, number>>;
  containerCapacity?: number;
  diceNotation?: string;
  itemType?: ItemType;
  baseValue?: number;
}

export type ItemType = 'weapon' | 'armor' | 'consumable' | 'material' | 'container' | 'accessory' | 'quest';
export type StorageType = 'General' | 'Materials Only';
export type ContainerKind = 'physical' | 'magical';

export interface CraftingMaterial {
  id: string;
  name: string;
  rarity: Rarity;
  quantity: number;
  sourceType?: ItemType;
  description?: string;
}

export type AttributeKey = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';

export interface Attributes {
  STR: number;
  DEX: number;
  CON: number;
  INT: number;
  WIS: number;
  CHA: number;
}

export type EntityKind = 'pet' | 'demon' | 'minion' | 'familiar' | 'mount';

export interface SummonEntity {
  id: string;
  name: string;
  kind: EntityKind;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  abilities: string[];
  duration?: string;
  status?: string;
  active: boolean;
}

export type RelationshipStatus = 'Friendly' | 'Hostile' | 'Neutral' | 'Rival' | 'Loyal';

export interface Relationship {
  id: string;
  npcName: string;
  portraitIcon?: string;
  status: RelationshipStatus;
  affinity: number;
  affinityMax: number;
  tier: number;
  bio: string;
  lastInteraction: string;
}

export interface Character {
  name: string;
  level: number;
  xp: number;
  xpToNext: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  sp: number;
  maxSp: number;
  strength?: number;
  attributes: Attributes;
  conditions: string[];
  bio: string;
  appearance: string;
  armorClass?: number;
  entities?: SummonEntity[];
  summons?: SummonEntity[];
}

export interface Companion {
  id: string;
  name: string;
  type: 'party' | 'caretaker' | 'mount' | 'beast';
  role: string;
  hp: number;
  maxHp: number;
  maintenanceCost: string;
  assignment: string;
  notes: string;
}

export interface Container {
  id: string;
  name: string;
  capacity: number;
  used: number;
  modifier: string;
  itemIds: string[];
  storageType?: StorageType;
  kind?: ContainerKind;
  equipped?: boolean;
  slot?: string;
}

export type QuestStatus = 'active' | 'completed' | 'failed' | 'hidden';
export type QuestType = 'main' | 'side' | 'faction';

export interface QuestObjective {
  id: string;
  description: string;
  completed: boolean;
  optional?: boolean;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  status: QuestStatus;
  type: QuestType;
  recommendedLevel?: number;
  location?: string;
  objectives?: QuestObjective[];
  /**
   * When false/undefined, quest is tracked but not spoiled to the player or GM scene focus.
   * Set true after the story/System reveals it, or the player asks about quests.
   */
  revealed?: boolean;
  rewards?: {
    xp?: number;
    gold?: number;
    items?: string[];
  };
}

export interface ShrineEntry {
  id: string;
  name: string;
  type: string;
  description: string;
}

export interface BestiaryEntry {
  id: string;
  name: string;
  threat: string;
  notes: string;
}

export interface RollRecord {
  id: string;
  turn: number;
  raw: string;
}

export type MapTier = 1 | 2 | 3 | 4;

export interface HexCoordinates {
  q: number;
  r: number;
}

export interface Location3D extends HexCoordinates {
  tier: MapTier;
  z: number;
  elevation?: number;
}

export interface TradeCaravan {
  id: string;
  destination: string;
  routeRisk: 'safe' | 'dangerous';
  investment: number;
  expectedReturn: number;
  status: 'active' | 'returning' | 'completed' | 'ambushed';
}

export interface WorldLedger {
  caravans: TradeCaravan[];
  pendingHiddenEvents: string[];
}

export interface ActiveEncounter {
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  armorClass: number;
  strength: number;
  dexterity: number;
  constitution: number;
  xpReward: number;
  goldReward: number;
}

export interface GameState {
  version: number;
  saveId: string;
  storyName: string;
  engineMode: EngineMode;
  campaignArchetype?: CampaignArchetype;
  lastUpdated: number;
  character: Character;
  inventory: Item[];
  containers: Container[];
  materials: CraftingMaterial[];
  companions: Companion[];
  quests: Quest[];
  shrines: ShrineEntry[];
  bestiary: BestiaryEntry[];
  relationships: Relationship[];
  log: LogEntry[];
  rolls: RollRecord[];
  turn: number;
  seed: string;
  pendingImagePrompt?: string[] | null;
  choices?: string[];
  lorebook: LoreCard[];
  /** Append-only factual event timeline (compressed memory). */
  timeline?: TimelineFact[];
  /** Campaign bible id when seeded from GM Library / archetype match. */
  campaignBibleId?: string | null;
  /** Short premise injected every turn as Guide Book rails. */
  campaignPremise?: string | null;
  /** Per-NPC memory ledger. */
  npcMemories?: NpcMemory[];
  /** Current location sheet (interactables / exits). */
  locationSheet?: LocationSheet | null;
  /** AI turn awaiting player accept / edit / reroll. */
  pendingTurn?: PendingTurnProposal | null;
  gold: number;
  gmStrictness: GmStrictness;
  statDisplayMode: StatDisplayMode;
  turnFrameTheme: TurnFrameTheme;
  currentLocation?: string;
  currentCoordinates?: Location3D;
  activeDungeon?: ActiveDungeonState | null;
  worldLedger?: WorldLedger;
  activeEncounter?: ActiveEncounter | null;
}

export interface SaveSlotInfo {
  saveId: string;
  storyName: string;
  characterName: string;
  lastUpdated: number;
  turn: number;
  level: number;
  source: 'local' | 'cloud';
}

export type PanelImageStatus = 'pending' | 'ready' | 'error' | 'failed';
export type MediaKind = 'image' | 'video';
export type LogEntryKind = 'standard' | 'milestone' | 'loot-video';

/** Pre-export editor overrides for a single speech/caption chip on a comic panel. */
export interface ComicOverlayEdit {
  segmentIndex: number;
  /** Normalized X (0–1) of the chip's top-left corner within the panel frame. */
  x?: number;
  /** Normalized Y (0–1) of the chip's top-left corner within the panel frame. */
  y?: number;
  /** Optional replacement text written in Editor Mode before PDF bake. */
  text?: string;
}

export interface ComicPanel {
  imagePrompt: string;
  narrative: string;
  imageUrl?: string | null;
  imageStatus?: PanelImageStatus;
  /** Cinematography framing from the Phase 2 LLM Director script (e.g. "WIDE SHOT"), when this
   *  panel was produced by `generatePanelScript` rather than the GM's inline `<panel>` tags.
   *  Optional/undefined for legacy panels — purely informational, not yet rendered in the UI. */
  cameraAngle?: string;
  /** Preferred negative-space location emitted by the Director; canvas analysis may refine it. */
  textAnchor?: ComicTextAnchor;
  /** User-adjusted bubble positions/text from the pre-export Comic Page Editor. */
  overlayEdits?: ComicOverlayEdit[];
}

export interface LogEntry {
  id: string;
  turn: number;
  role: 'gm' | 'player' | 'system';
  content: string;
  timestamp: number;
  systemLog?: string[];
  panels?: ComicPanel[];
  imageUrls?: string[];
  imageStatus?: PanelImageStatus;
  /** Marks this entry for special layout treatment (full-page illustration, loot-video callout). */
  entryKind?: LogEntryKind;
  mediaKind?: MediaKind;
  videoUrl?: string | null;
  lootItemName?: string;
  lootItemRarity?: Rarity;
}

/** Distinct rule engines chosen at campaign setup. */
export type EngineMode = 'litrpg' | 'dnd' | 'rpg';
export type DiceAnimationMode = 'visual' | 'text';
export type ContentMode = 'kid' | 'adult';
export type GmStrictness = 'forgiving' | 'standard' | 'hardcore';
export type StatDisplayMode = 'inline' | 'tapToReveal';
export type StatVerbosity = 'detailed' | 'core' | 'minimal';
export type StatFrequency = 'every-turn' | 'every-5-turns' | 'end-of-combat';
export type NarrativePerspective = 'first-person' | 'third-person';
export type ViolenceLevel = 'none' | 'mild' | 'graphic';
export type CursingLevel = 'none' | 'mild' | 'strong';

export type MapTriggerMode = 'tactical' | 'immersive';
export type FogRevealThreshold = 'adjacent' | 'current' | 'full';

export type AiProvider = 'gemini' | 'openrouter' | 'openai' | 'anthropic' | 'groq' | 'ollama';

export interface TurnFrameTheme {
  icon: string;
  accentColor: string;
  frameStyle: string;
}

export type KeyStatus = 'untested' | 'validating' | 'valid' | 'invalid';
export type ErrorKind = 'rate-limit' | 'network' | 'generic';
export type LoreCardType = 'npc' | 'location' | 'item' | 'quest' | 'faction' | 'lore';

export interface LoreCard {
  id: string;
  name: string;
  type: LoreCardType;
  keywords: string[];
  summary: string;
  visualAnchor?: string;
  lastSeenTurn: number;
}

/** Append-only factual chronicle — no narrative fluff. */
export type TimelineFactKind =
  | 'location'
  | 'combat'
  | 'damage'
  | 'heal'
  | 'item'
  | 'quest'
  | 'npc'
  | 'dungeon'
  | 'discovery'
  | 'other';

export interface TimelineFact {
  id: string;
  turn: number;
  kind: TimelineFactKind;
  text: string;
  at: number;
}

/** Live situation packet rebuilt each turn from structured state. */
export interface SituationPacket {
  location: string;
  coordinates?: string;
  encounter: string;
  dungeon: string;
  presentEntities: string[];
  activeQuests: string[];
  recentFacts: string[];
}

/** Per-NPC memory so knowledge does not bleed across characters. */
export interface NpcMemory {
  npcId: string;
  npcName: string;
  disposition: 'hostile' | 'neutral' | 'friendly' | 'allied' | 'romanced' | 'unknown';
  facts: string[];
  lastSeenTurn: number;
}

/** Location sheet — spatial facts for the current zone. */
export interface LocationInteractable {
  id: string;
  name: string;
  state: string;
}

export interface LocationExit {
  id: string;
  label: string;
  locked?: boolean;
  keyItem?: string;
}

export interface LocationSheet {
  name: string;
  climate?: string;
  timeOfDay?: string;
  interactables: LocationInteractable[];
  exits: LocationExit[];
  presentNpcIds: string[];
}

/**
 * Propose → confirm → commit: AI output held here until the player accepts.
 * `proposedState` is the full next snapshot applied on Accept.
 */
export interface PendingTurnProposal {
  id: string;
  playerAction: string;
  playerEntryId: string;
  narrative: string;
  systemLog: string[];
  choices: string[];
  wardenNotes: string[];
  intentLabel: string;
  deltaSummary: string[];
  comicPanels?: ComicPanel[];
  imagePrompt?: string[] | null;
  turnFrame?: TurnFrameTheme;
  createdAt: number;
  /** Full next GameState if accepted (local-only; stripped from cloud if huge). */
  proposedState?: GameState;
}

export type PostLoginBehavior = 'MAIN_MENU' | 'AUTO_RESUME';
export type BgMode = 'static' | 'adaptive' | 'off';
export type ArtStylePreset =
  | 'classic-book'
  | 'sin-city-noir'
  | 'manga-screentone'
  | 'dark-fantasy-mignola'
  | 'cyberpunk-cel'
  | 'western-pulp'
  | 'watercolor-lush'
  | 'euro-ligne-claire'
  | 'manhwa-webtoon'
  | 'ink-wash-sumi';
export type ColorVariant = 'default' | 'monochrome' | 'color';
export type PanelFrequency = 'minimal' | 'balanced' | 'high';
export type PanelBorderIntensity = 'subtle' | 'bold';
/** Paged = traditional multi-panel pages; webtoon = vertical single-column scroll. */
export type ComicLayoutMode = 'paged' | 'webtoon';
/** Panel / page reading order for comic mode. */
export type ComicReadingDirection = 'ltr' | 'rtl';

export const ART_STYLE_PRESETS: Array<{ value: ArtStylePreset; label: string; description: string; keywords: string }> = [
  { value: 'classic-book', label: 'Classic Book Illustration', description: 'Storybook ink & watercolor wash', keywords: 'classic book illustration, detailed ink line-art, soft muted watercolor washes, storybook aesthetic' },
  { value: 'sin-city-noir', label: 'Sin City Noir', description: 'Stark B&W with crimson accents', keywords: 'sin city noir, stark black and white, deep inks, crimson red accents, high contrast noir' },
  { value: 'manga-screentone', label: 'Manga / Screentone', description: 'Monochrome ink, speed lines, halftone', keywords: 'manga style, monochrome ink, speed lines, halftone screentone shading, japanese manga aesthetic' },
  { value: 'manhwa-webtoon', label: 'Manhwa / Webtoon Color', description: 'Full-color Korean webtoon look', keywords: 'full color manhwa webtoon, clean digital line art, soft cel shading, vertical scroll comic aesthetic' },
  { value: 'dark-fantasy-mignola', label: 'Dark Fantasy / Mignola', description: 'Blocky shadows, gothic palette', keywords: 'dark fantasy mignola style, heavy blocky shadows, muted gothic palette, comic book noir' },
  { value: 'cyberpunk-cel', label: 'Cyberpunk / Cel-Shaded', description: 'Neon highlights, vector line art', keywords: 'cyberpunk cel-shaded, vibrant neon highlights, crisp vector line art, futuristic aesthetic' },
  { value: 'western-pulp', label: 'Western Pulp', description: 'Bold 80s American comic inks', keywords: 'western pulp comic book, bold ink outlines, saturated primary colors, dynamic action poses, classic american comics' },
  { value: 'watercolor-lush', label: 'Lush Watercolor', description: 'Painterly washes, soft edges', keywords: 'lush watercolor comic illustration, soft wet-on-wet washes, delicate ink underdrawing, atmospheric color' },
  { value: 'euro-ligne-claire', label: 'Ligne Claire', description: 'Clear-line European bande dessinée', keywords: 'ligne claire, clear line european comic, even ink contours, flat clean colors, bande dessinee aesthetic' },
  { value: 'ink-wash-sumi', label: 'Sumi Ink Wash', description: 'East Asian brush & wash', keywords: 'sumi-e ink wash, expressive brush strokes, misty negative space, east asian ink painting comic aesthetic' },
];

export interface Settings {
  ttsEnabled: boolean;
  sttEnabled: boolean;
  diceAnimation: DiceAnimationMode;
  contentMode: ContentMode;
  kidModeLocked: boolean;
  contentPin: string | null;
  geminiApiKey: string;
  openrouterApiKey: string;
  aiProvider: AiProvider;
  customModelId: string;
  baseUrl: string;
  imageProvider: 'gemini' | 'custom';
  imageBaseUrl: string;
  imageApiKey: string;
  imageEndpointType: 'openai' | 'automatic1111' | 'comfyui';
  imageModel: string;
  /** Pluggable video-generation backend for loot_video moments. 'none' until a provider is configured. */
  videoProvider: 'none' | 'custom';
  videoBaseUrl: string;
  videoApiKey: string;
  videoModel: string;
  postLoginBehavior: PostLoginBehavior;
  visualMode: 'comic' | 'classic';
  /**
   * Classic Text mode only: when true, still generate clean splash art for memorable
   * moments (milestones / first kills / legendary drops). Routine panels stay off.
   */
  classicMemorableImages: boolean;
  /** Comic mode page packing vs vertical webtoon scroll. Locked for active sessions. */
  comicLayout: ComicLayoutMode;
  /** Comic reading order (LTR Western / RTL manga). Locked for active sessions. */
  comicReadingDirection: ComicReadingDirection;
  bgMode: BgMode;
  bgOpacity: number;
  artStylePreset: ArtStylePreset;
  colorVariant: ColorVariant;
  panelFrequency: PanelFrequency;
  halftoneOverlay: boolean;
  sfxPopups: boolean;
  speechBubbles: boolean;
  panelBorderIntensity: PanelBorderIntensity;
  gmStrictness: GmStrictness;
  statDisplayMode: StatDisplayMode;
  statVerbosity: StatVerbosity;
  statFrequency: StatFrequency;
  perspective: NarrativePerspective;
  violenceLevel: ViolenceLevel;
  cursingLevel: CursingLevel;
  romanceSubplots: boolean;
  haremContent: boolean;
  statScreensEnabled: boolean;
  dndMode: boolean;
  mapTriggerMode: MapTriggerMode;
  fogRevealThreshold: FogRevealThreshold;
  combatFrequency: number;
  socialRoleplay: number;
  worldBuilding: number;
  strictEncumbrance: boolean;
  /**
   * When true (default), AI turns are proposed for Accept / Edit / Reroll
   * before World State Ledger commits.
   */
  requireTurnConfirm: boolean;
  secretDeathSaves: boolean;
  cleaveMechanics: boolean;
  flankingAdvantage: boolean;
}

export const DEFAULT_TURN_FRAME: TurnFrameTheme = {
  icon: '🎲',
  accentColor: 'cyan-400',
  frameStyle: 'minimal-holo',
};

export interface GoogleUser {
  credential: string;
  name?: string;
  email?: string;
  picture?: string;
  birthDate?: string;
  isGuest?: boolean;
}

export const RARITY_COLORS: Record<Rarity, string> = {
  Common: '#9ca3af',
  Uncommon: '#22c55e',
  Rare: '#3b82f6',
  Epic: '#a855f7',
  Legendary: '#f59e0b',
};

export type ProfessionType = 'Blacksmithing' | 'Tailoring' | 'Enchanting' | 'Leatherworking' | 'Engineering';

export interface ProfessionSkill {
  type: ProfessionType;
  level: number;
  maxLevel: number;
}

export interface SalvageRequirement {
  profession: ProfessionType;
  minLevel: number;
  reason: string;
}
