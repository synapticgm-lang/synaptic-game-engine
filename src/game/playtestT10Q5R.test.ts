import { describe, expect, it } from "vitest";
import type { GameState, NpcMemory, PlaceRecord } from "./types";
import { isEmptyRoomPersonSlot } from "./chromeAuthority";
import { peopleHere } from "./scenePresence";
import { presentNpcRecords } from "./npcRecords";
import { ensureNpcSheet } from "./npcSheet";
import { collectSceneAffordances, sceneAffordances } from "./sceneAffordances";
import { harvestCrowdIntoSceneFacts } from "./crowdAuthority";
import { seat, setPresentList } from "./presentAuthority";

function mem(over: Partial<NpcMemory> & { npcName: string }): NpcMemory {
  return {
    npcId: over.npcId ?? over.npcName.toLowerCase().replace(/\s+/g, "-"),
    disposition: "neutral",
    facts: [],
    lastSeenTurn: 0,
    ...over,
  } as NpcMemory;
}

function base(over: Partial<GameState> = {}): GameState {
  return {
    character: { name: "Jax", level: 1, xp: 0, hp: 20, maxHp: 20, attributes: {} },
    log: [],
    inventory: [],
    quests: [],
    places: [
      {
        id: "harbor-fence",
        name: "Harbor Fence",
        sceneLedger: {
          openedTurn: 200,
          said: [],
          promises: [],
          threats: [],
          clues: [],
          asked: [],
          present: ["Nobody"],
          described: [],
          spot: "",
        },
      } as PlaceRecord,
    ],
    npcMemories: [],
    turn: 204,
    engineMode: "rpg",
    campaignBibleId: "salt-road-heist",
    currentLocation: "Harbor Fence",
    journey: null,
    activeEncounter: null,
    sceneFacts: {
      crowd: "sparse",
      noise: "unknown",
      present: ["Nobody"],
      props: [],
      lastBeat: "",
      crowdCount: 1,
      updatedTurn: 204,
      anonymousRoles: [],
    },
    ...over,
  } as GameState;
}

describe("T10Q5R no Nobody / empty-name chips", () => {
  it("empty-room subjects are empty-room person slots", () => {
    expect(isEmptyRoomPersonSlot("Nobody")).toBe(true);
    expect(isEmptyRoomPersonSlot("no one")).toBe(true);
    expect(isEmptyRoomPersonSlot("")).toBe(true);
    expect(isEmptyRoomPersonSlot("Yara Flint")).toBe(false);
    expect(isEmptyRoomPersonSlot("clerk")).toBe(false);
  });

  it("sceneLedger present Nobody does not invent role:nobody for chips", () => {
    const s = base();
    expect(presentNpcRecords(s).some((m) => /nobody/i.test(m.npcName))).toBe(false);
    expect(peopleHere(s)).not.toContain("Nobody");
    const pads = [
      ...collectSceneAffordances(s).map((a) => a.label),
      ...sceneAffordances(s),
    ];
    expect(pads.some((l) => /Nobody/i.test(l))).toBe(false);
    expect(pads.some((l) => /^Talk to\s*$/i.test(l))).toBe(false);
  });

  it("ensureNpcSheet refuses Nobody (no town-nobody courier)", () => {
    const next = ensureNpcSheet(base({ sceneFacts: { ...base().sceneFacts!, present: [] } }), "Nobody");
    expect(next.npcMemories?.some((m) => /nobody/i.test(m.npcName))).toBe(false);
  });

  it("seat / setPresentList drop empty-room subjects", () => {
    let s = base({ sceneFacts: { ...base().sceneFacts!, present: [] } });
    s = seat(s, "Nobody");
    expect(s.sceneFacts?.present ?? []).not.toContain("Nobody");
    s = setPresentList(s, ["Nobody", "Yara Flint"]);
    expect(s.sceneFacts?.present).toEqual(["Yara Flint"]);
  });

  it("empty prose does not keep a Nobody present token via mentionsName", () => {
    const prose =
      "Jax waved the fish. Nobody answered, because no fishmonger stood at the fence. No one was there to answer.";
    const facts = harvestCrowdIntoSceneFacts(
      {
        crowd: "sparse",
        noise: "unknown",
        present: ["Nobody"],
        props: [],
        lastBeat: "",
        updatedTurn: 203,
        crowdCount: 1,
      },
      prose,
      204,
    );
    expect(facts.present ?? []).not.toContain("Nobody");
  });

  it("real clerk anonymous role still synthesizes", () => {
    const s = base({
      places: [{ id: "harbor-fence", name: "Harbor Fence" } as PlaceRecord],
      sceneFacts: {
        crowd: "sparse",
        noise: "unknown",
        present: [],
        props: [],
        lastBeat: "",
        updatedTurn: 204,
        anonymousRoles: ["clerk"],
      },
    });
    expect(presentNpcRecords(s).some((m) => /clerk/i.test(m.npcName))).toBe(true);
  });
});
