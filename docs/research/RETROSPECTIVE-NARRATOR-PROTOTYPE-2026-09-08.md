# Retrospective Narrator prototype (2026-09-08a)

**Status:** Live SynapticGM prototype. Not committed / not pushed. `gm-turn` not deployed. No T50 / Fate / Gemini.

**Spec:** Architecture 1 in `NOVEL-ARCHITECTURES-2026-09-07.md`. Built on 02ac systems-first (ArcDirector / registry / graph pads / fast XP).

## What shipped

Code owns facts. After mechanics commit, the writer gets only a Completed Event Packet + last 2 GM beats + a ledger-only noun allowlist. Instruction: narrate this completed event in past tense. No SNAPSHOT/CRAFT essays. No “don’t resurrect” lecture.

## How a turn works

1. Player pad / typed line.
2. Intent classify (existing).
3. ArcDirector + encounter FSM + XP resolve (02ac, still before GM).
4. If an attack zeros HP, `commitClear` attaches `lastKill` in that same commit.
5. `buildCompletedEventPacket` / `prepareRetrospectiveWriterInput` builds immutable facts (actor, verb, target, outcome, HP, loot, XP, witnesses, location, lastKill, mood/phase) and an allowlist from the ledger only.
6. `callGm` receives `formatWriterFacingEvent` — past-tense line + packet + `YOU MAY ONLY MENTION`.
7. `classifyBeatCommit` rejects `proseViolatesEventPacket` (invented Title-Case, living lastKill, instruction voice, numbered lists, loot-too-early / dead-vs-alive).
8. Fail → one retry with a stricter packet → then `assemblePacketStitch` (2–4 past-tense sentences from packet fields). Not the copper / wet-stone vendor bank.

Next pads after a kill: loot the body / leave. Never Talk lastKill.

## Key files

| File | Role |
|---|---|
| `src/game/completedEventPacket.ts` | Packet, allowlist, writer format, violate check, stitch |
| `src/game/useGame.ts` | Attach packet after ArcDirector; GM payload is the event leaf |
| `src/game/fateAutoplay.ts` | Same order: mechanics → packet → GM |
| `src/game/beatContract.ts` | `formatWriterFacingPacket` now wraps the event leaf |
| `src/game/beatCommitGate.ts` | `event-packet` reject + packet stitch repair |
| `src/game/encounterTerminalFsm.ts` | lastKill on victory / HP zero |
| `src/game/graphChoices.ts` | Corpse/leave/loot pads; no Talk lastKill |
| `src/game/playtest08aRetrospectiveNarrator.test.ts` | Unit coverage |

Stamps: HUD / BUILD `2026-09-08a`. Free writer stays `deepseek/deepseek-v4-flash-0731`. Mid writer OFF.

Edge: `completedEventPacket.ts` added to `scripts/sync-gm-edge-shared.mjs`. **Do not deploy** until John asks.

## Leftovers

- No T50 / Fate / Gemini critic this ship.
- Mid writer still OFF.
- Full spatial graph / gender lock still later.
- 02ac T50 gates (combat ≥3 / quest ≥1 / L2 by T25) still waiting.
- Opening GM path still uses `callOpeningGm` (not this packet).
- Packet loot list is empty until a later loot-table owner fills it; premature-loot check is structural (search-the-body while combat live).
