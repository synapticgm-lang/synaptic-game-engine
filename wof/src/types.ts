/** WOF types. Isolated from live SynapticGM. */

export type WorldId = 'ash_compact';
export type RulesModuleId = 'hp_check';
export type FactionId = 'ash_compact' | 'tide_covenant';
export type RaceId = 'hearthborn' | 'lanternfolk' | 'saltkin' | 'stonevein';
export type MapScale = 'street' | 'dungeon';
export type DangerTier = 'safe' | 'low' | 'medium';
export type RunMode = 'manual' | 'plan_auto';
export type SubTier = 'free' | 'mid' | 'high';

export interface PlaceDef {
  id: string;
  name: string;
  zoneId: string;
  mapScale: MapScale;
  dangerTier: DangerTier;
  outdoor: boolean;
  exits: string[];
  npcIds: string[];
  dungeonId?: string;
}

export interface NpcDef {
  id: string;
  name: string;
  placeId: string;
  role: 'quest' | 'profession' | 'hub' | 'merchant' | 'local';
  durable: true;
}

export interface SpeciesTemplate {
  id: string;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic';
  habitatTags: string[];
  baseHp: number;
  baseAtk: number;
  ac: number;
}

export interface ItemTemplate {
  id: string;
  name: string;
  category: 'weapon' | 'armor' | 'consumable' | 'tool' | 'key' | 'material';
  goldValue: number;
  repairCostPerPoint: number;
}

export interface QuestObjective {
  id: string;
  kind: 'visit_place' | 'ledger_kill' | 'deliver_item' | 'talk_to_npc' | 'collect_item';
  placeId?: string;
  speciesId?: string;
  count?: number;
  itemId?: string;
  npcId?: string;
}

export interface QuestDef {
  id: string;
  title: string;
  family: 'race' | 'profession' | 'zone_story';
  hidden: boolean;
  unlocksQuestId: string | null;
  objectives: QuestObjective[];
  rewardGold: number;
  rewardXp: number;
}

export interface DungeonRoomDef {
  id: string;
  name: string;
  describeBeforeCreature: true;
  encounter: { speciesId: string; count: number; elite?: boolean }[] | null;
  isBoss: boolean;
  isCheckpoint: boolean;
  exits: string[];
}

export interface DungeonDef {
  id: string;
  name: string;
  entrancePlaceId: string;
  soloable: true;
  rooms: DungeonRoomDef[];
}

export interface RaceKit {
  id: RaceId;
  name: string;
  factionId: FactionId;
  startingPlaceId: string;
  starterWeaponId: string;
  starterMapId: string;
  firstHourQuestId: string;
  abilityFlag: string;
}

export interface ZoneSlice {
  places: PlaceDef[];
  npcs: NpcDef[];
  species: SpeciesTemplate[];
  items: ItemTemplate[];
  quests: QuestDef[];
  dungeons: DungeonDef[];
}

export interface WorldPack {
  id: WorldId;
  name: string;
  rulesModuleId: RulesModuleId;
  maturity: 'pg13';
  factions: { id: FactionId; name: string }[];
  races: RaceKit[];
  places: PlaceDef[];
  npcs: NpcDef[];
  species: SpeciesTemplate[];
  items: ItemTemplate[];
  quests: QuestDef[];
  dungeons: DungeonDef[];
  firstHourQuestId: string;
  banList: string[];
}

export interface Combatant {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  ac: number;
  downed: boolean;
  isPlayer: boolean;
}

export interface EncounterLedger {
  instanceId: string;
  dungeonId: string;
  roomId: string;
  roundId: number;
  runMode: RunMode;
  combatants: Combatant[];
  clearedRoomIds: string[];
  checkpointRoomId: string;
  joinLocked: boolean;
}

export interface RoundOutcomeToken {
  roundId: number;
  hits: { actorId: string; targetId: string; hit: boolean; damage: number; targetHpAfter: number; killed: boolean }[];
  wiped: boolean;
}

export interface QuestProgress {
  questId: string;
  objectiveIndex: number;
  counts: Record<string, number>;
  rewarded: boolean;
}

export interface TurnLedger {
  accountId: string;
  dayUtc: string;
  spent: number;
  cap: number;
}

export type TurnReason =
  | 'hub_beat'
  | 'lockstep_round'
  | 'inn_rest'
  | 'idle_presence'
  | 'tell'
  | 'ah_browse'
  | 'mail_read'
  | 'combat_choice';

export interface InventoryItem {
  templateId: string;
  durability: number;
  equipped: boolean;
}

export interface CharacterState {
  id: string;
  accountId: string;
  worldId: WorldId;
  name: string;
  raceId: RaceId;
  placeId: string;
  hp: number;
  maxHp: number;
  sta: number;
  maxSta: number;
  gold: number;
  xp: number;
  inventory: InventoryItem[];
  quests: QuestProgress[];
  firstHour: FirstHourFlags;
  visitedPlaceIds: string[];
}

export interface FirstHourFlags {
  hasSpawned: boolean;
  hasSeenProse: boolean;
  hasAcceptedFirstQuest: boolean;
  hasCompletedFirstCombat: boolean;
  hasSeenJournalTick: boolean;
  hasSeenSystemWindow: boolean;
  hasSeenOtherPlayers: boolean;
  hasSafeLoggedOut: boolean;
}

export interface SanitizedNearbySpeech {
  nearbyPlayerCount: number;
  nearbyPlayerRaces: RaceId[];
}

export interface GmPromptSlice {
  placeName: string;
  placeId: string;
  activeQuestTitles: string[];
  nearby: SanitizedNearbySpeech;
  playerAction: string;
  outcomeToken: RoundOutcomeToken | null;
}

/** Pack 15 — MP memory scoping (prep only; not live SGM). */
export type MemoryScopeType = 'global' | 'instance' | 'hub' | 'party' | 'player';

export interface MemoryScope {
  scopeType: MemoryScopeType;
  scopeId: string;
}

export type MemoryEntryKind =
  | 'episodic'
  | 'pin'
  | 'campaign'
  | 'consequence'
  | 'hub_atmosphere'
  | 'instance_beat';

export interface ScopedMemoryEntry {
  id: string;
  scope: MemoryScope;
  kind: MemoryEntryKind;
  text: string;
  createdTurn: number;
  unresolved?: boolean;
  /** Owning player for player-scoped entries; null for shared scopes. */
  playerId: string | null;
}

export interface MpPromptContext {
  playerId: string;
  partyId: string | null;
  instanceId: string | null;
  hubPlaceId: string | null;
}

export interface AccountEntitlement {
  accountId: string;
  subscriptionTier: SubTier;
  worldUnlocks: WorldId[];
  kidMode: boolean;
}

export const FREE_TURN_CAP = 15;
export const KID_TURN_CAP = 10;
export const MID_TURN_CAP = 50;
