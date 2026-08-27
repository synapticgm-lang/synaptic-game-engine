import type { CharacterId, FactionId, RegionId, ThreadId, WorldState } from "../models.js";

const regions = {
  "r-hushmere": {
    id: "r-hushmere" as RegionId,
    name: "Hushmere",
    tier: 1,
    condition: "settled",
    landmarks: ["The reed-bell causeway", "The drowned observatory"],
    tensions: ["The tide has begun to answer old names."],
    unlocksFrom: [],
    resonance: { ember: 0, brine: 3, gale: 1, root: 2, veil: 2 },
  },
  "r-cinder-spine": {
    id: "r-cinder-spine" as RegionId,
    name: "The Cinder Spine",
    tier: 2,
    condition: "strained",
    landmarks: ["The rope-forges", "The eastward kiln"],
    tensions: ["A furnace is burning without fuel."],
    unlocksFrom: ["r-hushmere" as RegionId],
    resonance: { ember: 4, brine: 0, gale: 2, root: 1, veil: 1 },
  },
} as const;

const factions = {
  "f-keepers": {
    id: "f-keepers" as FactionId,
    name: "Keepers of the Last Lantern",
    credo: "What is witnessed may be mourned; what is hidden will return hungry.",
    method: "They preserve dangerous accounts in sung testimony.",
    publicNeed: "They need guides for a sealed observatory.",
    concealedCost: "Their archives bind each witness to one unspeakable memory.",
    homeRegionId: "r-hushmere" as RegionId,
  },
  "f-ashwrights": {
    id: "f-ashwrights" as FactionId,
    name: "Ashwright Compact",
    credo: "A made thing deserves a maker who accepts its consequences.",
    method: "They forge tools from cooled magical failures.",
    publicNeed: "They need brine-glass to quiet the eastern kiln.",
    concealedCost: "Each tool remembers the disaster from which it was made.",
    homeRegionId: "r-cinder-spine" as RegionId,
  },
} as const;

/** A minimal, expendable snapshot for reducer and replay research. */
export const firstTideWorld: WorldState = {
  schemaVersion: "0.1.0",
  worldId: "wof-first-tide",
  tidelock: { turn: 0, season: "ashen-spring", phase: "slack", intensity: 1 },
  regions,
  factions,
  factionRelations: {
    "f-keepers": { factionId: "f-keepers" as FactionId, disposition: "warm", esteem: 2, debt: 0, lastChangedAt: 0 },
    "f-ashwrights": { factionId: "f-ashwrights" as FactionId, disposition: "wary", esteem: 0, debt: 1, lastChangedAt: 0 },
  },
  characters: {
    "c-iren": {
      id: "c-iren" as CharacterId,
      name: "Iren Voss",
      archetype: "Witness-binder",
      originRegionId: "r-hushmere" as RegionId,
      wounds: 0,
      focus: 3,
      resonance: { ember: 0, brine: 2, gale: 1, root: 1, veil: 3 },
      memories: [],
      oathIds: [],
    },
  },
  oaths: {},
  routes: {},
  threads: {
    "t-lantern": {
      id: "t-lantern" as ThreadId,
      title: "The Observatory That Listens",
      regionId: "r-hushmere" as RegionId,
      pressure: 2,
      status: "dormant",
      stage: 0,
      maxStage: 3,
      stakes: "The causeway will flood permanently if its name is spoken incorrectly.",
    },
  },
  ledger: { supplies: 4, discoveries: [], unresolvedEventIds: [] },
  chronicle: [],
};
