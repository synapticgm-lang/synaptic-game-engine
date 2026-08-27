import assert from "node:assert/strict";
import test from "node:test";

import { firstTideWorld } from "../src/fixtures/first-tide.js";
import { WofInvariantError, applyEvent, replay } from "../src/engine/reducer.js";
import type { EventId, ThreadId } from "../src/models.js";

test("a local chronicle replay advances state without mutating the fixture", () => {
  const result = replay(firstTideWorld, [
    {
      id: "e-tide-001" as EventId,
      kind: "tidelock-advanced",
      summary: "The first brine bell sounds.",
      causedBy: "research fixture",
      payload: { phase: "rising", intensity: 2 },
    },
    {
      id: "e-thread-001" as EventId,
      kind: "thread-advanced",
      summary: "A lantern replies beneath the water.",
      causedBy: "research fixture",
      payload: { threadId: "t-lantern" as ThreadId, pressureDelta: 2, advanceStage: true },
    },
    {
      id: "e-supply-001" as EventId,
      kind: "supply-changed",
      summary: "The party barters for reed-salt.",
      causedBy: "research fixture",
      payload: { delta: -1, reason: "route preparation" },
    },
  ]);

  assert.equal(result.finalState.tidelock.turn, 1);
  assert.equal(result.finalState.tidelock.phase, "rising");
  const lanternThread = result.finalState.threads["t-lantern" as ThreadId];
  assert.ok(lanternThread);
  assert.equal(lanternThread.stage, 1);
  assert.equal(result.finalState.ledger.supplies, 3);
  assert.equal(result.finalState.chronicle.length, 3);
  assert.equal(firstTideWorld.chronicle.length, 0);
});

test("the reducer refuses negative supplies", () => {
  assert.throws(
    () => applyEvent(firstTideWorld, {
      id: "e-supply-underflow" as EventId,
      kind: "supply-changed",
      summary: "An invalid research case.",
      causedBy: "test",
      payload: { delta: -5, reason: "underflow check" },
    }),
    WofInvariantError,
  );
});

test("the reducer refuses duplicate chronicle identifiers", () => {
  const once = applyEvent(firstTideWorld, {
    id: "e-duplicate" as EventId,
    kind: "tidelock-advanced",
    summary: "First record.",
    causedBy: "test",
    payload: { phase: "rising", intensity: 2 },
  });

  assert.throws(
    () => applyEvent(once, {
      id: "e-duplicate" as EventId,
      kind: "tidelock-advanced",
      summary: "Second record.",
      causedBy: "test",
      payload: { phase: "crest", intensity: 3 },
    }),
    WofInvariantError,
  );
});
