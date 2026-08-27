/**
 * World of Fantasy domain contracts.
 *
 * This module is intentionally self-contained. It must not import from any
 * application, service, schema, or state model outside the wof/ namespace.
 */

export type Id<T extends string> = string & { readonly __brand: T };

export type RegionId = Id<"RegionId">;
export type FactionId = Id<"FactionId">;
export type CharacterId = Id<"CharacterId">;
export type ThreadId = Id<"ThreadId">;
export type EventId = Id<"EventId">;
export type RouteId = Id<"RouteId">;
export type OathId = Id<"OathId">;

export type Season = "ashen-spring" | "glass-summer" | "brine-autumn" | "starless-winter";
export type TidelockPhase = "slack" | "rising" | "crest" | "ebb";
export type RegionCondition = "settled" | "strained" | "unbound" | "submerged" | "quarantined";
export type ThreadStatus = "dormant" | "active" | "resolved" | "fractured";
export type FactionDisposition = "allied" | "warm" | "wary" | "hostile" | "at-war";
export type EventKind =
  | "tidelock-advanced"
  | "route-discovered"
  | "route-sealed"
  | "faction-accord-changed"
  | "memory-forged"
  | "oath-sworn"
  | "oath-fulfilled"
  | "oath-broken"
  | "thread-advanced"
  | "supply-changed"
  | "expedition-returned";

export interface LocalizedText {
  readonly title: string;
  readonly body: string;
  readonly tags: readonly string[];
}

export interface WorldLore {
  readonly worldId: string;
  readonly title: string;
  readonly premise: string;
  readonly cosmology: LocalizedText;
  readonly magicAxioms: readonly MagicAxiom[];
  readonly contentVersion: string;
}

export interface MagicAxiom {
  readonly id: string;
  readonly statement: string;
  readonly cost: string;
  readonly observableSign: string;
  readonly prohibitedShortcut: string;
}

export interface Region {
  readonly id: RegionId;
  readonly name: string;
  readonly tier: 1 | 2 | 3 | 4 | 5;
  readonly condition: RegionCondition;
  readonly landmarks: readonly string[];
  readonly tensions: readonly string[];
  readonly unlocksFrom: readonly RegionId[];
  readonly resonance: Record<Resonance, number>;
}

export type Resonance = "ember" | "brine" | "gale" | "root" | "veil";

export interface Faction {
  readonly id: FactionId;
  readonly name: string;
  readonly credo: string;
  readonly method: string;
  readonly publicNeed: string;
  readonly concealedCost: string;
  readonly homeRegionId: RegionId;
}

export interface Character {
  readonly id: CharacterId;
  readonly name: string;
  readonly archetype: string;
  readonly originRegionId: RegionId;
  readonly wounds: number;
  readonly focus: number;
  readonly resonance: Record<Resonance, number>;
  readonly memories: readonly Memory[];
  readonly oathIds: readonly OathId[];
}

export interface Memory {
  readonly id: string;
  readonly eventId: EventId;
  readonly label: string;
  readonly scar: string;
  readonly invokedBy: readonly EventKind[];
}

export interface Oath {
  readonly id: OathId;
  readonly bearerId: CharacterId;
  readonly wording: string;
  readonly beneficiary: string;
  readonly dueByTurn: number | null;
  readonly state: "open" | "kept" | "forfeit";
}

export interface Route {
  readonly id: RouteId;
  readonly fromRegionId: RegionId;
  readonly toRegionId: RegionId;
  readonly requiredPhase: TidelockPhase | null;
  readonly risk: 1 | 2 | 3 | 4 | 5;
  readonly state: "rumoured" | "open" | "sealed";
}

export interface StoryThread {
  readonly id: ThreadId;
  readonly title: string;
  readonly regionId: RegionId;
  readonly pressure: number;
  readonly status: ThreadStatus;
  readonly stage: number;
  readonly maxStage: number;
  readonly stakes: string;
}

export interface FactionRelation {
  readonly factionId: FactionId;
  readonly disposition: FactionDisposition;
  readonly esteem: number;
  readonly debt: number;
  readonly lastChangedAt: number;
}

export interface Tidelock {
  readonly turn: number;
  readonly season: Season;
  readonly phase: TidelockPhase;
  readonly intensity: 1 | 2 | 3 | 4 | 5;
}

export interface ExpeditionLedger {
  readonly supplies: number;
  readonly discoveries: readonly string[];
  readonly unresolvedEventIds: readonly EventId[];
}

export interface ChronicleEntry {
  readonly id: EventId;
  readonly turn: number;
  readonly kind: EventKind;
  readonly summary: string;
  readonly causedBy: string;
  readonly payload: Record<string, unknown>;
}

export interface WorldState {
  readonly schemaVersion: "0.1.0";
  readonly worldId: string;
  readonly tidelock: Tidelock;
  /** Map keys stay serializable strings; each value retains its branded identifier. */
  readonly regions: Readonly<Record<string, Region>>;
  readonly factions: Readonly<Record<string, Faction>>;
  readonly factionRelations: Readonly<Record<string, FactionRelation>>;
  readonly characters: Readonly<Record<string, Character>>;
  readonly oaths: Readonly<Record<string, Oath>>;
  readonly routes: Readonly<Record<string, Route>>;
  readonly threads: Readonly<Record<string, StoryThread>>;
  readonly ledger: ExpeditionLedger;
  readonly chronicle: readonly ChronicleEntry[];
}

export interface EventMeta {
  readonly id: EventId;
  readonly summary: string;
  readonly causedBy: string;
}

export type WorldEvent =
  | (EventMeta & { readonly kind: "tidelock-advanced"; readonly payload: { readonly phase: TidelockPhase; readonly intensity: 1 | 2 | 3 | 4 | 5; readonly season?: Season } })
  | (EventMeta & { readonly kind: "route-discovered"; readonly payload: { readonly route: Route } })
  | (EventMeta & { readonly kind: "route-sealed"; readonly payload: { readonly routeId: RouteId } })
  | (EventMeta & { readonly kind: "faction-accord-changed"; readonly payload: { readonly factionId: FactionId; readonly disposition: FactionDisposition; readonly esteemDelta: number; readonly debtDelta: number } })
  | (EventMeta & { readonly kind: "memory-forged"; readonly payload: { readonly characterId: CharacterId; readonly memory: Memory } })
  | (EventMeta & { readonly kind: "oath-sworn"; readonly payload: { readonly oath: Oath } })
  | (EventMeta & { readonly kind: "oath-fulfilled"; readonly payload: { readonly oathId: OathId } })
  | (EventMeta & { readonly kind: "oath-broken"; readonly payload: { readonly oathId: OathId } })
  | (EventMeta & { readonly kind: "thread-advanced"; readonly payload: { readonly threadId: ThreadId; readonly pressureDelta: number; readonly advanceStage: boolean } })
  | (EventMeta & { readonly kind: "supply-changed"; readonly payload: { readonly delta: number; readonly reason: string } })
  | (EventMeta & { readonly kind: "expedition-returned"; readonly payload: { readonly discoveries: readonly string[] } });

export interface ExperimentManifest {
  readonly id: string;
  readonly title: string;
  readonly hypothesis: string;
  readonly status: "proposed" | "active" | "concluded" | "archived";
  readonly fixturePath: string;
  readonly metrics: readonly MetricDefinition[];
}

export interface MetricDefinition {
  readonly key: string;
  readonly description: string;
  readonly target: string;
}

export interface ReplayResult {
  readonly finalState: WorldState;
  readonly appliedEventIds: readonly EventId[];
  readonly warnings: readonly string[];
}
