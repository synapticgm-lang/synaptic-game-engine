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
  /** Equipped gear still occupies a slot in this container. */
  containerId?: string;
  itemLevel?: number;
  modifiers?: Partial<Record<AttributeKey, number>>;
  containerCapacity?: number;
  diceNotation?: string;
  itemType?: ItemType;
  baseValue?: number;
  /** Square inventory icon, WoW/BG3 style. */
  iconUrl?: string | null;
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
  /** Standing paper-doll portrait for the inventory screen. */
  portraitUrl?: string | null;
  /** Appearance + equipped gear key; regenerate portrait when this changes. */
  portraitKey?: string;
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
  /** Place name or id reference — prefer resolving tier from Place / locationSheet. */
  location?: string;
  /** Danger tier for the quest site — prefer reading from Place when locationRef exists. */
  dangerTier?: MapTier;
  locationRef?: string;
  objectives?: QuestObjective[];
  /**
   * When false/undefined, quest is tracked but not spoiled to the player or GM scene focus.
   * Set true after the story/System reveals it, or the player asks about quests.
   */
  revealed?: boolean;
  revealedTurn?: number | null;
  activatedTurn?: number | null;
  completedTurn?: number | null;
  /** Min turns between revealed → active (default 1). */
  minTurnsBeforeActive?: number;
  /** Min turns between active → completed (default 1). */
  minTurnsBeforeComplete?: number;
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

export type WorkEthic = 'idle' | 'steady' | 'driven';
export type DealRisk = 'safe' | 'mixed' | 'dangerous';
export type HoldingKind = 'guild' | 'town' | 'shop' | 'camp';
export type HoldingOrder = 'jobs' | 'profit' | 'steal' | 'expand' | 'upgrade' | 'defend';

/** In-game calendar. Advances on player turns — not while the app is closed. */
export interface WorldClock {
  day: number;
  week: number;
}

export interface WorldDeal {
  id: string;
  name: string;
  partnerName: string;
  playerShare: number;
  risk: DealRisk;
  runsPerWeek: number;
  workEthic: WorkEthic;
  active: boolean;
  goldPaid: number;
  lastResolvedWeek: number;
  lastWeekSummary?: string;
}

export interface WorldHolding {
  id: string;
  name: string;
  kind: HoldingKind;
  order: HoldingOrder;
  workEthic: WorkEthic;
  level: number;
  progress: number;
  treasury: number;
  heat: number;
  lastResolvedWeek: number;
  lastSeenTurn: number;
  lastWeekSummary?: string;
}

export interface WorldHostile {
  id: string;
  name: string;
  workEthic: WorkEthic;
  level: number;
  progress: number;
  lastResolvedWeek: number;
  lastWeekSummary?: string;
}

export interface WorldActor {
  id: string;
  name: string;
  workEthic: WorkEthic;
  level: number;
  profession?: string;
  professionLevel: number;
  lastResolvedWeek: number;
  lastSeenTurn: number;
}

export interface WorldLedger {
  clock: WorldClock;
  caravans: TradeCaravan[];
  deals: WorldDeal[];
  holdings: WorldHolding[];
  hostiles: WorldHostile[];
  actors: WorldActor[];
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

export interface OpeningEstablishment {
  pending: Array<{
    id: string;
    kind: 'name' | 'location' | 'appearance' | 'kit' | 'identity' | 'species';
    question: string;
    suggestions?: string[];
    style?: 'inworld' | 'system';
    required?: boolean;
  }>;
  answers: Record<string, string>;
  complete: boolean;
  registrar?: {
    voice: 'system' | 'inworld';
    label: string;
    startLine: string;
  };
  /** Setup fields the player declined (e.g. appearance). */
  declinedFields?: string[];
  /** First page already written — do not run a second registrar opening. */
  sceneWritten?: boolean;
  mode?: 'scene' | 'weave';
}

export interface GameState {
  /** Save generation. Clients reject anything below CURRENT_SAVE_VERSION. */
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
  /**
   * Writer-only stamps (e.g. mystery culprit). Never show in player HUD / journal.
   * Keys such as culpritId, culpritName, culpritRole, culpritMotive.
   */
  hiddenStamps?: Record<string, string>;
  /** Genre-native PYOA fork/spine/ending rails. Writer-only. */
  campaignStyleRail?: string | null;
  /** Campaign-start interview (where / clothes / folk). Undefined on old saves = already playing. */
  openingEstablishment?: OpeningEstablishment;
  /** After the last establishment answer, generate the real opening scene once. */
  pendingGeneratedOpening?: boolean;
  /** Per-NPC memory ledger. */
  npcMemories?: NpcMemory[];
  /** Bound last-beat scene (crowd, noise, props). Authority over improvisation. */
  sceneFacts?: SceneFacts;
  /** Current location sheet (interactables / exits). */
  locationSheet?: LocationSheet | null;
  /** Sheet for the place just left — injected with current for dual-location memory. */
  previousLocationSheet?: LocationSheet | null;
  /** Pack 1 pity: consecutive non-Epic+ chests per danger tier. */
  lootPity?: LootPityState;
  /** Pack 3 first-session beat sheet. */
  tutorialProgress?: TutorialProgress;
  /** Pack 4/5 Place registry — name/tier/arc authority. */
  places?: PlaceRecord[];
  /** Pack 6 long-campaign compressed memory. */
  campaignMemory?: CampaignMemoryState;
  /**
   * Progressive status reveal: minimal until rest/level/boss unlocks full.
   * Mirrors tutorialProgress.fullStatusUnlocked for UI.
   */
  statusReveal?: 'minimal' | 'core' | 'full';
  /** Diegetic content rewrite awaiting Proceed / cancel (Pack 7). */
  pendingContentRewrite?: { rewritten: string; message: string; original: string } | null;
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
export type EngineMode = 'litrpg' | 'dnd' | 'rpg' | 'pyoa';

/** Story RPG and pick-your-own-adventure: no LitRPG HUD, no 5e dice. */
export function isFictionEngine(mode: EngineMode | undefined): boolean {
  return mode === 'rpg' || mode === 'pyoa';
}
export type DiceAnimationMode = 'visual' | 'text';
export type ContentMode = 'kid' | 'adult';
export type GmStrictness = 'forgiving' | 'standard' | 'hardcore';
export type StatDisplayMode = 'inline' | 'tapToReveal';
export type StatVerbosity = 'detailed' | 'core' | 'minimal';
export type StatFrequency = 'every-turn' | 'every-5-turns' | 'end-of-combat';
export type NarrativePerspective = 'first-person' | 'second-person' | 'third-person';
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
  /** When false/undefined, this is GM-only background — do not treat the title as a place the player has visited. */
  revealed?: boolean;
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
  | 'world'
  | 'scene'
  | 'other';

export type CrowdPresence = 'present' | 'sparse' | 'none' | 'unknown';
export type SceneNoise = 'shouting' | 'voices' | 'quiet' | 'unknown';

/** Bound last-beat facts. Prose cannot empty a present crowd without time passing. */
export interface SceneFacts {
  crowd: CrowdPresence;
  noise: SceneNoise;
  present: string[];
  props: string[];
  lastBeat: string;
  updatedTurn: number;
}

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
  /** Pack 6 short relationship texture for prompts. */
  relationshipSummary?: string;
}

/** Location sheet — spatial facts for the current zone. */
export type MapScale = 'district' | 'street' | 'interior' | 'dungeon';

export interface LocationInteractable {
  id: string;
  name: string;
  state: string;
  kind?: 'chest' | 'door' | 'hazard' | 'secret' | 'prop';
  /** Player-visible; hidden loot/trap truth lives on MapNode.hidden. */
  revealed?: boolean;
  lootableId?: string;
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
  /** Dungeon/site danger T1–T4 — single authority for System/journal (not map scale). */
  dangerTier?: MapTier;
  /** Which map view this place uses. */
  mapScale?: MapScale;
  interactables: LocationInteractable[];
  exits: LocationExit[];
  presentNpcIds: string[];
}

/** Per-tier dry-chest counts for Epic+ pity (Pack 1). */
export interface LootPityState {
  byTier: Partial<Record<1 | 2 | 3 | 4, number>>;
}

/** Durable Place record (Pack 4/5) — single authority for name + tiers. */
export interface PlaceRecord {
  id: string;
  name: string;
  loreName?: string;
  aliases?: string[];
  dangerTier?: MapTier;
  mapScale?: MapScale;
  dungeonRef?: string | null;
  arcSummary?: string;
  arcStatus?: 'open' | 'visited' | 'cleared' | 'closed';
  lastVisitedTurn?: number;
}

export interface TutorialProgress {
  completed: Partial<
    Record<
      | 'awakening'
      | 'lookAround'
      | 'firstThreat'
      | 'stickyFail'
      | 'firstLoot'
      | 'firstQuest'
      | 'firstRest'
      | 'firstBoss',
      boolean
    >
  >;
  firstChestUncommonBiasPending: boolean;
  fullStatusUnlocked: boolean;
  stickyFailScheduled: boolean;
}

export interface TurnSummary {
  id: string;
  turn: number;
  text: string;
}

export interface MemoryPin {
  id: string;
  kind: 'auto' | 'player' | 'quest';
  label: string;
  text: string;
  createdTurn: number;
  archived?: boolean;
}

export interface ConsequenceThread {
  id: string;
  text: string;
  createdTurn: number;
  unresolved: boolean;
}

export interface CampaignMemoryState {
  campaignSummary?: string | null;
  personalitySummary?: string | null;
  turnSummaries?: TurnSummary[];
  pins: MemoryPin[];
  consequences?: ConsequenceThread[];
  lastCampaignSummaryTurn?: number;
  lastTurnSummaryTurn?: number;
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
  /** Pack 7 base rating. Kid Mode forces pg13 behavior. */
  maturityTier: 'pg13' | 'mature';
  sexualContent: boolean;
  substanceUse: boolean;
  darkThemes: 'none' | 'implied' | 'explored';
  /**
   * When true, rating rewrites pause for diegetic confirm ("System interprets…").
   * When false, rewrite applies automatically with a System note.
   */
  confirmContentRewrites: boolean;
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
  /** Active UI theme cosmetic id (e.g. theme.neon-protocol). */
  uiThemeId: string;
  /** Active font pack id. */
  fontPackId: string;
  /** Active dice cosmetic id. */
  diceCosmeticId: string;
  /** Active TTS voice pack id (when premium voices ship). */
  voicePackId: string;
  /** Active turn-frame cosmetic id. */
  turnFrameCosmeticId: string;
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
