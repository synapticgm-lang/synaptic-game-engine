# SYNTHESIS — Batch U from post–Batch-T Gemini T50 (seed 42)

**Authorized:** John · **Ship stamp:** HUD `2026-08-31u` / BUILD `2026-08-31m` · **Vitest:** `playtest31uBatchU` · **Mid writer:** OFF

## What Batch T fixed (still kept)

- Deixis / occupancy ban (`Ahead`, `figure N`) in present[] + harvest
- Crowd grammar (`heres`, hunched/bestial crowd)
- Partial travel yo-yo under live encounter
- `stripChoiceList` Ascend/Draw/Intervene/Peer/Give/Maintain

## What Batch T missed (Batch U owners)

| ID | Symptom | Root cause | Batch U fix |
|---|---|---|---|
| **P0-1** | Stitch bank lines as sole beat (T3/9/23/24/27/40) | `stitchCommitDelta` emitted meta director strings; `repairRejectedBeat` committed them | `codedSceneMove` diegetic prose; `isStitchBankFingerprint`; `scrubStitchBankLeaks`; commit reject |
| **P0-2** | Sevenfold false-arrival ~half turns | `enforceCameraOnProse` used stale `cameraLock.label` (opening circle) not travel snap | Arrival prepend only on real location change; hardened `scrubFalseArrivalWhenHere` |
| **P0-3** | Numbered chips in GM body (T6/8/10/17/50/51) | `stripChoiceList` missed quoted dialogue + Descend/Meet | Extended strip + `hasNumberedChoiceLeak` commit reject |
| **P0-4** | Travel ping-pong under standoff | Yo-yo lock only on `liveStakes`, not 2 travel in 5T | `shouldStarveTravelPads` in `choiceCompiler` |
| **P0-1b** | Entity mad-libs (`activity Scattered Scale`, `just Pact-Hunter…`) | Encounter/faction names in preposition slots | `scrubEntityMadLibs` in `proseWarden` |
| **P1** | Fence treadmill T45–47 | Same as talk commit / npcTopicFsm | Deferred unless cheap — partial via travel starvation + coded moves |

## Readability gate (automated)

- **Module:** `src/game/readabilityGate.ts`
- **Wired:** `fateAutoplay` → `summary.json` → `readabilityGate: { pass, p0Count, violations }`
- **Checks:** stitch-leak, false-arrival, choice-leak, travel-streak (log)

## Residual

- Flash Lite can still ignore CRAFT lines
- Full npcTopicFsm fence treadmill not densified (P1)
- Admin Feedback still unmounted
- Rain/Ready/Wait null-delta soft

## Next gate

Re-run T50 seed 42 fate-autoplay + Gemini paste when John asks (`npm run fate-autoplay -- --bible summoned-pact --turns 50 --seed 42`).
