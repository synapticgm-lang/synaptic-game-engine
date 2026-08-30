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
  /** Hosted icon gen failed for this item — compact fail on the slot, do not retry-spam. */
  iconFailed?: boolean;
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
  /** This-run presentation (woman / man / non-binary / custom). Account default lives on player profile. */
  gender?: string;
  /** Standing paper-doll portrait for the inventory screen. */
  portraitUrl?: string | null;
  /** Appearance + equipped gear key; regenerate portrait when this changes. */
  portraitKey?: string;
  /** Last portrait attempt for portraitKey failed — compact fail, retry when the look/kit changes. */
  portraitFailed?: boolean;
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

export type PlayPhase = 'live' | 'down' | 'ended';

export type QuestStatus = 'active' | 'completed' | 'failed' | 'hidden';
export type QuestType = 'main' | 'side' | 'faction';
export type QuestUrgency = 'immediate' | 'time-sensitive' | 'flexible' | 'unknown';

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
  /** When true, quest fails if the run ends (permadeath). */
  runScoped?: boolean;
  /** Explicit fail-on-death flag; defaults with runScoped. */
  failOnDeath?: boolean;
  /** Fail reason when status is failed. */
  failReason?: string;
  rewards?: {
    xp?: number;
    gold?: number;
    items?: string[];
  };
  /** Plain-language why this quest exists / what to do next (player journal). */
  whatNext?: string;
  /** Provenance for Simple Why? (bible seed, story beat, System notice). */
  provenance?: string;
  
  // Pack 12 Urgency Tracking
  urgency?: QuestUrgency;
  deadline?: number;  // turn number for urgent reminder
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

/** Faction relationship on the living-world ledger (code-owned; writer narrates, does not invent standings). */
export type FactionStandingLevel =
  | 'hostile'
  | 'unfriendly'
  | 'neutral'
  | 'friendly'
  | 'allied';

export interface FactionStanding {
  id: string;
  name: string;
  standing: FactionStandingLevel;
  influence?: number;
  notes?: string;
}

/** How hard the sandbox hits — prompt tone only; numbers stay on the ledger. */
export type PowerScaling = 'gritty' | 'balanced' | 'overpowered';

export interface WorldLedger {
  clock: WorldClock;
  caravans: TradeCaravan[];
  deals: WorldDeal[];
  holdings: WorldHolding[];
  hostiles: WorldHostile[];
  actors: WorldActor[];
  pendingHiddenEvents: string[];
  /** Named faction standings — empty until the campaign establishes them. */
  factionStandings?: FactionStanding[];
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
  /** 29a Encounter Terminal FSM */
  encounterId?: string;
  phase?: 'engaged' | 'resolving' | 'terminal';
  startedTurn?: number;
  engagedTurnCount?: number;
  failedFleeCount?: number;
  failedParleyCount?: number;
  maxEngagedTurns?: number;
  maxFailedFlee?: number;
  maxFailedParley?: number;
  terminalOutcome?: 'escape' | 'victory' | 'defeat' | 'capture' | 'parleyResolved';
  source?: string;
  forcedSpawnKey?: string;
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
  /** Seed-picked opener from bible.openingHooks (stable for the run). */
  pickedHook?: string;
  /** Player-facing fallback if the writer call fails. */
  pickedHookFallback?: string;
  /** True when this run’s opener has no summoners on page one. */
  aloneArrival?: boolean;
  /** 29c — opening NPC names pinned into scene presence for early turns. */
  pinnedNpcNames?: string[];
  /** Locked why-you’re-here from the hook card (first lock; sceneFacts is live authority). */
  hookLock?: import('./hookLock').HookLock;
}

export interface GameState {
  /** Save generation. Clients reject anything below CURRENT_SAVE_VERSION. */
  version: number;
  /** Schema repair generation — independent of version gate. */
  saveRepairRevision?: number;
  /** Player was notified about saveRepairRevision (toast once per revision). */
  lastSeenSaveRepairRevision?: number;
  /** Error Repair Warden revision — alone quest / arrival coherence on Continue. */
  errorRepairRevision?: number;
  /** Forward play lock — default live; ended/down batches set on commit. */
  playPhase?: PlayPhase;
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
  /**
   * Full bible snapshot for player-authored custom campaigns (id `player-custom-*`).
   * Catalog lookup cannot find these; opening quests and reconcile use this.
   */
  campaignBibleSnapshot?: import('./campaignBibleTypes').CampaignBible | null;
  /** Short premise injected every turn as Guide Book rails. */
  campaignPremise?: string | null;
  /**
   * Writer-only stamps (e.g. mystery culprit). Never show in player HUD / journal.
   * Keys such as culpritId, culpritName, culpritRole, culpritMotive.
   */
  hiddenStamps?: Record<string, string>;
  /** Genre-native PYOA fork/spine/ending rails. Writer-only. */
  campaignStyleRail?: string | null;
  /**
   * Extra text turns granted once at New Game (hook honeymoon). Spend before daily/pack.
   * Opening covers do not consume these or the daily ledger.
   */
  storyStartTextTurnsRemaining?: number;
  /** Campaign-start interview (where / clothes / folk). Undefined on old saves = already playing. */
  openingEstablishment?: OpeningEstablishment;
  /** After the last establishment answer, generate the real opening scene once. */
  pendingGeneratedOpening?: boolean;
  /** Per-NPC memory ledger. */
  npcMemories?: NpcMemory[];
  /** Bound last-beat scene (crowd, noise, props). Authority over improvisation. */
  sceneFacts?: SceneFacts;
  previousSceneFacts?: SceneFacts;
  /**
   * Monotonic campaign ledger revision. Bumped on every accepted turn commit.
   * Pending proposals carry expectedRevision and must match this to accept.
   */
  ledgerRevision?: number;
  /** Discarded retry drafts — never world truth; debug / Expert continuity only. */
  speculativeTakes?: SpeculativeTake[];
  /** Append-only high-impact world changes (inventory, presence, quests, combat). */
  stateTxLog?: import('./stateTx').StateTx[];
  /** P0.0: Forward-Progress Governor state (Manus #1 priority). */
  progressGovernor?: import('./forwardProgressGovernor').ProgressGovernorState;
  /** P0+P1 quality governance telemetry (2026-08-27w). */
  qualityGovernance?: import('./qualityGovernance').QualityGovernanceState;
  /** Craft-book compiler boosts + last signals (2026-08-31g). */
  craftLedger?: import('./craftBookCompiler').CraftLedger;
  /** Path A ArcDirector — authoritative beat commits (2026-08-28a). */
  arcDirector?: import('./arcDirector').ArcDirectorState;
  /** Immutable run manifest for eval/replay binding. */
  runManifest?: import('./runManifest').RunManifest;
  /** B026 sealed manifest snapshot (pre-GM). */
  sealedManifest?: import('./sealedManifest').SceneManifest;
  /** B007 replay hash chain for eval verifier. */
  replayHashes?: import('./replayHash').ReplayHashRecord[];
  /** B025 PYOA branch ledger — Millstone Charter paths. */
  pyoaBranchLedger?: import('./pyoaBranchLedger').PyoaBranchLedger;
  /** Frozen opening invariants for this run. */
  campaignContract?: import('./campaignContract').CampaignContract | null;
  /** Soft drifts against campaignContract (Expert / continuity). */
  campaignDivergences?: import('./campaignContract').CampaignDivergence[];
  /** Soft-offer / retention stage (identity → choice → consequence). */
  hookArc?: import('./hookArc').HookArcState;
  /** Recent accepted prose fingerprints for retry novelty. */
  recentBeatFingerprints?: string[];
  /** Recent offered choices for deduplication across turns (sliding window). */
  recentChoices?: Array<{ turn: number; choices: string[] }>;
  /** Current location sheet (interactables / exits). */
  locationSheet?: LocationSheet | null;
  /** Sheet for the place just left — injected with current for dual-location memory. */
  previousLocationSheet?: LocationSheet | null;
  /** Pack 12 fog-of-war: locations the player has discovered (place IDs / settlement IDs). */
  discoveredLocations?: string[];
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
  /** Local repair banner — blocks GM until player picks a contrastive option. */
  pendingRepair?: PendingRepair | null;
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
  /** Idempotent keys for off-spine XP banks (discover / quest / non-lethal). */
  sandboxAwardKeys?: string[];
  /** Journal Resume main pin — map chrome highlights this place name. */
  mapFocusPlace?: string | null;
  activeEncounter?: ActiveEncounter | null;
  /**
   * Premade world landmass outline + fogged regions (LitRPG/tabletop/RPG open worlds).
   * null = closed story (typical PYOA) — no continent atlas.
   */
  worldAtlas?: WorldAtlasState | null;
  /** Classic memorable-splash cadence. Absent on old saves = nothing fired yet. */
  memorableMoments?: MemorableMomentState;
  /**
   * Player-supplied tabletop rules for this campaign only.
   * Empty / absent = SynapticGM Tabletop Fantasy core. Never a licensed rulebook we ship.
   */
  customTabletopRules?: string;
  /**
   * Tabletop GM personality for this campaign (`engineMode === 'dnd'`).
   * Prompt voice only — not rules tightness (`gmStrictness`) and not TTS.
   * Persists on the save. Absent on old saves = chilled.
   */
  gmPersonality?: import('./gmVoiceProfile').GmPersonalityId;
  /**
   * LitRPG System personality for this campaign (`engineMode === 'litrpg'`).
   * Prompt voice only — not TTS. Persists on the save.
   * Absent on old saves = Settings `gmVoiceProfileId`, then cold registrar.
   */
  systemPersonality?: import('./gmVoiceProfile').SystemPersonalityId;
  /**
   * Simulationist sandbox power tone. Absent on old saves = balanced (repair hydrates).
   * Prompt only — HP/XP/loot still come from code.
   */
  powerScaling?: PowerScaling;
  /**
   * Current-zone threat tier until the active place/sheet carries `threatTier`.
   * Prefer `locationSheet.threatTier` / place record when set.
   */
  threatTier?: number;
}

export type RepairSituation = import('./repairEngine').RepairSituation;

export interface PendingRepair {
  id: string;
  situation: RepairSituation;
  playerInput: string;
  message: string;
  options: string[];
  createdAt: number;
}

export type BeautyOfferStatus = 'pending' | 'accepted' | 'dismissed';
export type MemorableOfferKind = 'beauty' | 'ruler-audience' | 'writer-tag';

/** One unlocked memorable plate (Audible-style “you earned this moment”). */
export interface StoryPlate {
  id: string;
  beat: string;
  title: string;
  turn: number;
}

/** Player-offered splash (beauty, ruler audience, or writer milestone tag). */
export interface BeautyMomentOffer {
  kind?: MemorableOfferKind;
  personKey?: string;
  personLabel?: string;
  imagePrompt: string;
  status: BeautyOfferStatus;
}

/** Persisted flags so classic memorable art stays sparse and does not re-fire the opener. */
export interface MemorableMomentState {
  openingSplashFired?: boolean;
  lastSplashTurn?: number;
  sessionSplashCount?: number;
  /** When this sitting's splash count started. Stale sittings reset the cap. */
  sittingStartedAt?: number;
  /** @deprecated First combat is never auto and is never offered on its own. */
  firstCombatSplashFired?: boolean;
  /** @deprecated Ordinary NPC meets no longer auto-splash. Kept for old saves. */
  firstNpcSplashFired?: boolean;
  legendarySplashFired?: boolean;
  deathSplashFired?: boolean;
  /** PYOA true ending plate — once per campaign. Never LitRPG / tabletop / Story RPG. */
  endingSplashFired?: boolean;
  /**
   * Blueprint id of the campaign’s first real dungeon graph (not street).
   * Pinned on first entry so a later dungeon cannot be mistaken for the first.
   */
  firstDungeonBlueprintId?: string;
  /** Once true, no later dungeon final-boss auto-splash — even if detection is messy. */
  firstDungeonBossSplashFired?: boolean;
  /** First-dungeon boss key that auto-splashed. Later dungeons must not auto. */
  dungeonBossSplashKeys?: string[];
  /** Normalized ruler keys already offered or given a first-audience splash. */
  rulerNamesSplashed?: string[];
  /** Normalized person keys already offered a beauty picture. */
  beautyOfferedKeys?: string[];
  lastBeautyOfferTurn?: number;
  /** Unlocked memorable plates — shown on the character Titles tab. */
  storyPlates?: StoryPlate[];
}

export interface WorldAtlasRegionState {
  id: string;
  name: string;
  blurb: string;
  connections: string[];
  tags?: string[];
  revealed: boolean;
}

/** Premade settlement on the world map (29e). */
export interface WorldAtlasSettlement {
  id: string;
  name: string;
  regionId: string;
  kind: 'city' | 'town' | 'village' | 'shore' | 'landmark' | 'ruin' | 'fort' | 'district';
  biome: string;
  blurb: string;
  aliases?: string[];
  allowsDungeon?: boolean;
  questTags?: string[];
}

export interface WorldAtlasState {
  outlineId: string;
  outlineName: string;
  description: string;
  currentRegionId: string;
  regions: WorldAtlasRegionState[];
  /** Fixed towns/cities/shores — AI must not invent new ones. */
  settlements?: WorldAtlasSettlement[];
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
  /** Revision-scoped job key — stale attaches discarded when mismatched. */
  artJobKey?: string;
  beatRevision?: number;
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
  /** Quiet, skippable offer — only when Memorable is on and the turn describes noteworthy beauty. */
  beautyOffer?: BeautyMomentOffer;
  /** Player-facing plate title for memorable art (not the word Milestone). */
  splashTitle?: string;
  /** Toast line when the plate unlocks (e.g. Achievement unlocked — So it begins). */
  splashToast?: string;
  /** Compact player-facing reason when memorable art failed (never the word Milestone). */
  imageFailMessage?: string;
  /** Prompt used for the memorable plate — kept so a failed opener can retry. */
  splashImagePrompt?: string;
  /**
   * Post-pipeline choice labels the player actually saw after this GM beat
   * (ActionBar pad: filterInventedContextChoices / padChoicesToCount / opening chips).
   * Absent on older saves — transcript omits the Options section.
   */
  offeredChoices?: string[];
  /** Craft-book rule ids compiled for this beat (Debug / Download play). */
  craftApplied?: string[];
}

/** Distinct rule engines chosen at campaign setup. `'dnd'` is tabletop fantasy (saved key). */
export type EngineMode = 'litrpg' | 'dnd' | 'rpg' | 'pyoa';

/** Story RPG and pick-your-own-adventure: no LitRPG HUD, no tabletop dice. */
export function isFictionEngine(mode: EngineMode | undefined): boolean {
  return mode === 'rpg' || mode === 'pyoa';
}
export type DiceAnimationMode = 'static' | 'normal' | 'excited';
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
export type TimeOfDay = 'dawn' | 'morning' | 'midday' | 'afternoon' | 'dusk' | 'evening' | 'night' | 'unknown';
export type Weather = 'clear' | 'rain' | 'storm' | 'snow' | 'fog' | 'cloudy' | 'unknown';
export type TensionLevel = 'combat' | 'danger' | 'tense' | 'calm' | 'unknown';

/** Bound last-beat facts. Prose cannot empty a present crowd without time passing. */
export interface SceneFacts {
  crowd: CrowdPresence;
  noise: SceneNoise;
  present: string[];
  props: string[];
  lastBeat: string;
  updatedTurn: number;
  
  // Pack 12 Extended Tracking
  timeOfDay?: TimeOfDay;
  weather?: Weather;
  indoor?: boolean;
  tension?: TensionLevel;
  /** 29b — turn when exit/flee outdoor authority was committed (blocks snap-back scrub). */
  exitAuthorityTurn?: number;

  /** Targets already searched and established empty (here / debris / exterior / loc:…). */
  searchedEmpty?: string[];
  /** Named containers established empty (box / crate / bag when declared empty). */
  emptyContainers?: string[];
  /**
   * Locked headcount of people here (named + unnamed occupancy).
   * Writer cannot invent a larger or smaller gathering unless someone enters or leaves.
   */
  crowdCount?: number;
  /**
   * Locked why-you’re-here / summon nature (accident vs intended vs bargain vs pawn).
   * Writer cannot reverse it unless the player or a ledger event changes it.
   */
  hookLock?: import('./hookLock').HookLock;
  /**
   * Locked camera (outdoor vs indoor + label). Map/dungeon cannot snap rooms
   * without a player travel/enter commit.
   */
  cameraLock?: import('./travelAuthority').CameraLock;
  /** Last committed player intent family — choice pad follows this, not leftover covers. */
  lastPlayerIntent?: {
    family: 'demand' | 'inspect' | 'flee' | 'name' | 'talk' | 'travel' | 'other';
    text: string;
    turn: number;
  };
  /** Auto-fight / terminal victory — corpse stays until looted or left. */
  lastKill?: import('./combatAuthority').LastKill;
  /**
   * Drought/arc attached an encounter before the foe was narrated.
   * Next combat beat must show this name (preface) before fight prose.
   */
  pendingSpawnPreface?: string;
  /**
   * Consecutive sealed-manifest recovery stitches committed as GM body.
   * Cap at 1 — next empty GM must FAIL (Class A), not another stub.
   */
  engineRecoveryStreak?: number;
  /**
   * Open hub social/argument vignette — locked cast + props until leave/resolve.
   * Drought must not invent a brand-new argument cast each turn.
   */
  openVignette?: import('./vignetteLock').OpenVignette;
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
  
  // WS-7 Wave 1: Social Context
  socialContext?: {
    /** Active crisis (if any) */
    crisisId?: string;
    crisisName?: string;
    
    /** Committed stakes */
    stakes?: {
      gain: string;
      loss: string;
      owner: string;
      deadline?: number;
    };
    
    /** Available leverage assets */
    leverage?: Array<{
      type: string;
      targetNpc: string;
      exhausted: boolean;
    }>;
    
    /** NPC relationships (visible to GM for tone/reaction) */
    relationships?: Array<{
      npcName: string;
      trust: number;
      disposition: string;
    }>;
  };
}

export type NpcMood = 'friendly' | 'angry' | 'scared' | 'sad' | 'cautious' | 'neutral' | 'unknown';

/** Per-NPC memory so knowledge does not bleed across characters. */
export interface NpcMemory {
  npcId: string;
  npcName: string;
  disposition: 'hostile' | 'neutral' | 'friendly' | 'allied' | 'romanced' | 'unknown';
  facts: string[];
  lastSeenTurn: number;
  /** Pack 6 short relationship texture for prompts. */
  relationshipSummary?: string;
  
  // Pack 12 Mood Tracking
  currentMood?: NpcMood;
  lastMoodChange?: number;
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
  /**
   * Simulationist zone threat (vs player level). Prefer this over GameState.threatTier
   * when the sheet knows the zone; falls back to dangerTier / GameState.threatTier in prompts.
   */
  threatTier?: number;
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
  /** Durable zone threat when the place registry owns it. */
  threatTier?: number;
  mapScale?: MapScale;
  dungeonRef?: string | null;
  arcSummary?: string;
  arcStatus?: 'open' | 'visited' | 'cleared' | 'closed';
  lastVisitedTurn?: number;
  /** 29e — biome for quest-site fitness */
  biome?: string;
  settlementKind?: string;
  regionId?: string;
  /** True if seeded from premade world map (not GM invent). */
  mapCanonical?: boolean;
  allowsDungeon?: boolean;
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
  /** Importance score 0-1 (Pack 12 - memory weighting). */
  importance?: number;
  /** Semantic embedding for retrieval (Pack 12 - 384d vector). */
  embedding?: number[];
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
  /** Chapter summaries (20-turn blocks, Pack 12). */
  chapterSummaries?: ChapterSummary[];
  /** Arc summaries (100-turn blocks, Pack 12). */
  arcSummaries?: ArcSummary[];
  pins: MemoryPin[];
  consequences?: ConsequenceThread[];
  lastCampaignSummaryTurn?: number;
  lastTurnSummaryTurn?: number;
  /** Last turn a chapter summary was created (Pack 12). */
  lastChapterSummaryTurn?: number;
}

export interface ChapterSummary {
  id: string;
  turnRange: [number, number];
  keyEvents: string[];
  questProgress: string;
  npcsIntroduced: string[];
  locationsMapped: string[];
  createdTurn: number;
}

export interface ArcSummary {
  id: string;
  turnRange: [number, number];
  summary: string;
  majorMilestones: string[];
  createdTurn: number;
}

/**
 * Speculative GM drafts and pending turn proposals.
 * `proposedState` is the full next snapshot applied on Accept when expectedRevision matches.
 */
/** A GM draft that was generated but not accepted as world truth. */
export interface SpeculativeTake {
  id: string;
  turnPlanned: number;
  expectedRevision: number;
  playerAction: string;
  narrative: string;
  reason: 'resolution-retry-discarded' | 'obligation-retry-discarded' | 'pending-discarded' | 'reroll-discarded';
  createdAt: number;
}

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
  /** Ledger revision this proposal was planned against. */
  expectedRevision?: number;
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
  { value: 'classic-book', label: 'Classic Book Illustration', description: 'Ink & watercolor, one scene (not a picture of a book)', keywords: 'ink-and-watercolor illustration, detailed ink line-art, soft muted watercolor washes, single scene filling the frame' },
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
  /** Browser speechSynthesis voiceURI. Empty = auto (en-US / en-GB / first English). */
  ttsVoiceURI: string;
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
   * Website only: player opted into Bring Your Own Key (own text/image APIs).
   * Requires byokDisclaimerAccepted. Ignored on store builds and Kid Mode.
   */
  byokModeEnabled: boolean;
  /** Player accepted the BYOK responsibility disclaimer. */
  byokDisclaimerAccepted: boolean;
  /**
   * When true, rating rewrites pause for diegetic confirm ("System interprets…").
   * When false, rewrite applies automatically with a System note.
   */
  confirmContentRewrites: boolean;
  /** Legacy unused slot — text keys live on openrouterApiKey. Kept so old saves merge cleanly. */
  geminiApiKey: string;
  /** Admin BYOK OpenRouter (or compatible) text key. Required on Admin — no hosted fallback. */
  openrouterApiKey: string;
  /** Admin BYOK Flux / BFL image key. Used when imageProvider is `flux-direct`. */
  fluxApiKey: string;
  aiProvider: AiProvider;
  customModelId: string;
  baseUrl: string;
  /**
   * Image backend:
   * - `flux` = Flux via OpenRouter (current launch path; same tier model map as direct)
   * - `flux-direct` = BFL api.bfl.ai (later; needs fluxApiKey)
   * - `custom` = self-host OpenAI-compat / A1111 / Comfy
   * - `gemini` = legacy alias → OpenRouter Flux path
   */
  imageProvider: 'flux' | 'flux-direct' | 'gemini' | 'custom';
  imageBaseUrl: string;
  imageApiKey: string;
  imageEndpointType: 'openai' | 'automatic1111' | 'comfyui';
  imageModel: string;
  /**
   * Account subscription tier (free / mid / high).
   * Local until billing; drives writer model + capacity caps.
   */
  subscriptionTier: 'free' | 'mid' | 'high' | 'admin';
  /** Pluggable video-generation backend for loot_video moments. 'none' until a provider is configured. */
  videoProvider: 'none' | 'custom';
  videoBaseUrl: string;
  videoApiKey: string;
  videoModel: string;
  postLoginBehavior: PostLoginBehavior;
  visualMode: 'comic' | 'classic';
  /**
   * Classic Text mode only: when true, generate clean splash art for memorable
   * moments (opening, death, and the first dungeon’s final boss auto; other
   * book-worthy beats are tap-yes). Off until the player opts in. Routine panels stay off.
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
  /** GM/System narrative voice profile (prompt tone). Separate from TTS cosmetics. */
  gmVoiceProfileId?: import('./gmVoiceProfile').GmVoiceProfileId;
  violenceLevel: ViolenceLevel;
  cursingLevel: CursingLevel;
  romanceSubplots: boolean;
  haremContent: boolean;
  statScreensEnabled: boolean;
  /** Tabletop chat formatting (boxed read-aloud). Saved as `dndMode`. */
  dndMode: boolean;
  mapTriggerMode: MapTriggerMode;
  fogRevealThreshold: FogRevealThreshold;
  combatFrequency: number;
  /**
   * Combat pacing for turn economy (all engine modes):
   * - `full` = round-by-round player control (more turns)
   * - `auto` = Auto Fight resolves encounters in ~1–2 turns
   */
  combatResolveMode: 'full' | 'auto';
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
  /** When true, skip post-commit sentence reveal and show full GM prose immediately. */
  preferFullResponse?: boolean;
  /**
   * When true, show Pack 12 opening quick-response chip banks (name/look/kit/location).
   * Default false — free-text opening; player types in the box.
   */
  fastSetupChips?: boolean;
}

export const DEFAULT_TURN_FRAME: TurnFrameTheme = {
  icon: '🎲',
  accentColor: 'cyan-400',
  frameStyle: 'minimal-holo',
};

export interface GoogleUser {
  /** Supabase auth user id — quote this as Support ID when emailing support. */
  id?: string;
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
