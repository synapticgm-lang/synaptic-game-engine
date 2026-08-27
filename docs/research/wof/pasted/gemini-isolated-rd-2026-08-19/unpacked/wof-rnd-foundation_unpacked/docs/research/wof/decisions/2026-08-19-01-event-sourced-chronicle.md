# WOF Design Decision Record

**Record ID:** `2026-08-19-01-event-sourced-chronicle`  
**Status:** Accepted  
**Date:** `2026-08-19`  
**Owner:** Manus AI  
**Related question:** `WOF-RQ-01`  
**Related playtest:** `Pending`

## Decision statement

WOF will use an immutable world snapshot plus append-only chronicle events as its initial research-state model.

## Context and problem

The research program needs a state model that exposes why a world changed, supports short replayable experiments, and can be deleted without migration work. A purely mutable fixture would make it harder to compare runs or identify the decision that produced a narrative consequence. An event-sourced chronicle keeps the state model small while giving playtests a shared language for reviewing change.

| Affected WOF artifact | Current condition | Proposed change | Reversible? |
| --- | --- | --- | --- |
| `wof/src/models.ts` | Baseline contracts created. | Make `WorldEvent` and `ChronicleEntry` canonical mutation records. | Yes |
| `wof/src/engine/reducer.ts` | Baseline reducer created. | Apply events to immutable snapshots and append chronicle entries. | Yes |
| `wof/src/fixtures/first-tide.ts` | Disposable sample world created. | Use it as a replay test input. | Yes |

## Options considered

| Option | Advantages | Risks and costs | Evidence status |
| --- | --- | --- | --- |
| A. Immutable snapshot plus chronicle events | Auditable outcomes, replayable sequences, narrow mutation boundary. | Requires explicit event design and invariant maintenance. | Initial local replay validated. |
| B. Direct mutable world object | Quick to write at small scale. | Cause of a state change is easier to lose; replay is less disciplined. | Not selected for baseline. |
| C. Do nothing | Avoids early architecture commitments. | Prevents a meaningful engine prototype and test loop. | Rejected. |

## Decision and rationale

Option A is accepted as the initial WOF baseline. The reducer currently replays a compact sequence, records all three events, preserves the source fixture, and rejects duplicate event identifiers and invalid supply underflow. This is sufficient evidence for the narrow claim that the model supports isolated technical experiments. It does not establish that every future WOF mechanic should be event-sourced; any exception must be tested explicitly.

## Consequences and follow-up

| Consequence | Owner | Next action | Evidence required |
| --- | --- | --- | --- |
| New mechanics must name their event surface. | WOF contributor | Add event, reducer case, invariant, fixture, and test together. | Passing local replay and a linked playtest record. |
| Content must leave a visible consequence. | WOF contributor | Link lore outcomes to memory, oath, route, thread, relation, or ledger changes. | Chronicle review confirms explanation of change. |
| State complexity must remain bounded. | WOF contributor | Reject ambient mutation and undocumented generator side effects. | Isolation and type checks remain clean. |

## Isolation review

| Check | Result | Notes |
| --- | --- | --- |
| All changed artifacts remain in `wof/` or `docs/research/wof/`. | Pass | Baseline artifacts are WOF-local. |
| No protected source, backend, save, prompt, or deployment artifact was imported. | Pass | The namespace guard passes. |
| The decision introduces no external database, service, or deployment dependency. | Pass | The reducer performs no I/O. |
| The change can be archived or removed without external migration work. | Pass | Fixtures and docs are self-contained. |

## Decision log

| Date | Status | Note |
| --- | --- | --- |
| 2026-08-19 | Proposed | Baseline question registered. |
| 2026-08-19 | Accepted | Local isolation, type, and replay checks passed. |
