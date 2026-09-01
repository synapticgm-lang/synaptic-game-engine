# SYNTHESIS — Batch X from post–Batch-W Gemini T50 (seed 42)

**Authorized:** John · **Ship stamp:** HUD `2026-08-31x` / BUILD `2026-08-31p` · **Vitest:** `playtest31xBatchX` · **Mid writer:** OFF

## What Batch W fixed (still kept)

- Stall contact / Scattered Scale partial mad-lib scrub
- Stitch bank fingerprint reject + codedSceneMove diegetic banks
- Flee fail → `caught`; travel starve under live encounter
- Abstract Press/Ask partial starve

## What Batch W missed (Batch X owners)

| ID | Symptom | Root cause | Batch X fix |
|---|---|---|---|
| **P0-1** | "lunged Lowmarket Fence" / "a Lowmarket Fence, greyish stones" | Location+role compounds promoted to verb/preposition/object slots | `isHubRoleCompoundToken` + `detectHubRoleMadlib`; extended `scrubEntityMadLibs`; `typedEntityValidator.hubRoleMadlibCount`; readabilityGate entity-madlib |
| **P0-2** | "1. Turn to the Lowmarket Fence…", quest Stage 2 in prose, spawn push log in story | Numbered chip + journal stage + spawn preface in GM body | `stripChoiceList` Turn-to; `scrubUiQuestVerbs` + `hasQuestTrackerLeak`; spawn → STATUS via `spawnReceipt`; `scrubCombatSpawnLog`; commit reject |
| **P0-3** | Caught T11-13 → inspect stall; T17 clear without fight | Caught lock incomplete; max_engaged cleared on talk/loiter | Caught pad lock (no stall/fence/travel); max_engaged only on fight/flee/parley; no escape on clock |
| **P0-4** | Press/Ask/Listen/Leave still dominate | Abstract starve required ≥1 prior use | Ban abstract trio + Leave whenever named NPC in present[] or live fight |
| **P1** | Dual-location, Sergeant loop, face slip, scrap." | Residual prose/pad | dual-location scrub kept; npcTopic force; pronoun slip; stray fragment scrub |

## Readability gate

Extended: Lowmarket Fence mad-lib, quest stage in prose, spawn log in body; opening vault hook **not** stitch-leak (authored GM contract).

## Residual

- Flash Lite can still invent novel hub compounds before scrub list grows
- Free hook still product gap until next T50
- Admin Feedback still unmounted
- Check Status may still need dedicated STATUS-only beat

## Next gate

Re-run T50 seed 42 fate-autoplay + Gemini paste when ready.
