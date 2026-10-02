/**
 * Seed 93 — plain reader, a real foe name, loot not the killing weapon,
 * the oath step closes, and a hostile lane is not a free Walk on.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { createDefaultSettings, createInitialState } from "./defaults";
import { readerFlags } from "./completedEventPacket";
import { buildInfoSheet, fightLootClause, gearAuthorityLine, weaponInHand } from "./infoSheet";
import { storyChip } from "./choiceRanking";
import { settleOathChoice } from "./questPlay";
import { resolveEngineFight } from "./engineFight";
import { commitTravel, journeyPads, roadFoe } from "./travelJourney";
import type { GameState, RoadEncounter } from "./types";

function roadState(seed: string): GameState {
  const s = createInitialState(undefined, "dnd") as GameState;
  return {
    ...s,
    seed,
    campaignBibleId: "cursed-keep",
    currentLocation: "Greyhollow Inn",
    worldAtlas: null,
    activeEncounter: null,
    journey: null,
    sceneFacts: s.sceneFacts ? { ...s.sceneFacts, pendingEncounter: undefined } : s.sceneFacts,
  };
}

function onGround(enc: Partial<RoadEncounter>): GameState {
  const trip = commitTravel(roadState("ground"), "Travel toward Blackspine Treeline").state;
  const j = trip.journey!;
  return {
    ...trip,
    journey: {
      ...j,
      encounter: { kind: "thugs", level: 2, stretch: j.legsDone, dangerous: false, ...enc },
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("seed 93 writer facts", () => {
  it("new games and cold-system defaults send plain; standard and Kid Mode stay", () => {
    const settings = createDefaultSettings();
    expect(settings.readingLevel).toBe("plain");
    expect(settings.gmVoiceProfileId).toBe("cold-system");
    expect(readerFlags(settings)).toMatchObject({ level: "plain" });
    expect(readerFlags({ ...settings, readingLevel: "standard" }).level).toBe("standard");
    expect(readerFlags({ ...settings, contentMode: "kid", readingLevel: "plain" }).level).toBe("child");
    expect(readerFlags({ ...settings, readingLevel: undefined }).level).toBe("standard");
  });

  it("a road villain is stored under a concrete name, not the chip phrase", () => {
    const enc: RoadEncounter = { kind: "villain", level: 3, stretch: 2, dangerous: true };
    const foe = roadFoe(enc);
    expect(foe.name).not.toMatch(/whoever blocks the way/i);
    expect(foe.name.split(" ").length).toBeGreaterThan(1);
    const s = onGround({ kind: "villain", level: 3, stretch: 2 });
    const pads = journeyPads(s);
    expect(pads).toContain("Face whoever blocks the way");
    expect(pads).toContain("Talk to whoever blocks the way");
    expect(pads).not.toContain("Walk on");
    expect(roadFoe({ kind: "thugs", level: 1, stretch: 1, dangerous: false }).name).toBe("the thugs");
  });

  it("loot from the fight just resolved is not the weapon that won it", () => {
    const bare = roadState("gear");
    bare.inventory = [
      { id: "clothes", name: "clothes", rarity: "Common", quantity: 1, equipped: true, slot: "Body" },
      { id: "axe", name: "Fine Hand Axe", rarity: "Uncommon", quantity: 1, equipped: false, itemType: "weapon" },
    ];
    expect(weaponInHand(bare)).toBe("bare hands");
    expect(gearAuthorityLine(bare)).toMatch(/In hand: bare hands/);
    expect(gearAuthorityLine(bare)).toMatch(/Fine Hand Axe/);
    expect(gearAuthorityLine(bare)).toMatch(/do not strike/);
    expect(fightLootClause("bare hands")).toMatch(/not the weapon that won/);

    const live = commitTravel(onGround({ kind: "thugs" }), "Face the thugs").state;
    let rng = 1;
    vi.spyOn(Math, "random").mockImplementation(() => {
      rng = (rng * 1664525 + 1013904223) % 4294967296;
      return rng / 4294967296;
    });
    const fought = resolveEngineFight(live, "Press the attack");
    expect(fought).toBeTruthy();
    const loot = fought!.receipts.find((r) => r.startsWith("Loot:"));
    if (loot) {
      expect(loot).toMatch(/not the weapon that won/);
      expect(loot).toMatch(/In hand before the blow: bare hands/);
    }
  });

  it("swearing, refusing, or delaying closes the oath step", () => {
    const base = roadState("oath");
    const open = {
      ...base,
      turn: 26,
      quests: [
        {
          id: "sp-quest-1",
          name: "The Circle's Price",
          description: "The pact.",
          status: "active" as const,
          type: "main" as const,
          revealed: true,
          objectives: [
            { id: "a", description: "Hear their reason (or demand it)", completed: true },
            { id: "b", description: "Choose: swear, refuse, or delay", completed: false },
          ],
        },
      ],
      log: [
        { id: "p", turn: 24, role: "player" as const, content: "Choose: swear, refuse, or delay", timestamp: 1 },
      ],
    };
    const settled = settleOathChoice(open);
    const step = settled.quests![0]!.objectives![1]!;
    expect(step.completed).toBe(true);
    expect(buildInfoSheet(settled).open.join("\n")).not.toContain("Choose: swear, refuse, or delay");
    expect(storyChip(settled)).not.toBe("Choose: swear, refuse, or delay");
    expect(settleOathChoice(open, "Refuse the oath").quests![0]!.objectives![1]!.completed).toBe(true);
    expect(settleOathChoice({ ...open, log: [] }, "Search the area").quests![0]!.objectives![1]!.completed).toBe(false);
  });

  it("a hostile meeting blocking the lane is not a free Walk on", () => {
    const blocked = onGround({ kind: "thugs" });
    const pads = journeyPads(blocked);
    expect(pads).not.toContain("Walk on");
    expect(pads).toContain("Face the thugs");
    expect(pads).toContain("Talk your way past the thugs");
    expect(pads.some((p) => p.startsWith("Turn back toward "))).toBe(true);
    const walked = commitTravel(blocked, "Walk on");
    expect(walked.arrived).toBe(false);
    expect(walked.state.currentLocation).toBe(blocked.currentLocation);
    expect(walked.receipt).toMatch(/blocked/);
    const quiet = onGround({});
    quiet.journey = { ...quiet.journey!, encounter: null };
    expect(journeyPads(quiet)).toContain("Walk on");
    const camp = onGround({ kind: "camp" });
    expect(journeyPads(camp)).toContain("Walk on");
  });
});
