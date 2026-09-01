# Path A Batch F — 2026-09-01 SP residuals after E

**Stamp:** HUD `2026-08-31q` / BUILD `2026-08-31i`  
**Mid writer:** OFF  
**John:** deal with remaining P0s now (manual = intentional agent ship, not overnight auto-improve).  
**Scope:** Summoned Pact residuals after Batch E. CK / Salt / Thornferry Gemini = Batch G (not this ship).

## Landed (P0)

1. **Same-room essay HARD** — `detectSameRoomEssayHard` + commit gate reason `same-room-essay` for inspect/wait/scout atmosphere recycle without delta; strip+stitch (beyond E pad interrupt).

2. **Drought invent residual** — `scrubDroughtSpawnInvent` rewrites “breaks from debris” / rubble eruptions / unsupported wall-phase geometry after preface (`ensureEncounterSpawnPreface`).

3. **CRAFT ignore harden** — `proseIgnoresCraft` + `applyGovernanceToProse` reject/stitch when specific CRAFT lines applied but prose ignores; signals boost collage/atmosphere. Mid writer stays OFF.

4. **Parley success → ledger resolve** — pre-GM parks `phase: resolving`; `settleParleyAfterProse` clears with `parleyResolved` + XP on diegetic success cues; refuse still increments fail and keeps combat (E). `opts.parleySucceeded` supported.

## Residuals

- CK / Salt / Thornferry Gemini still awaited → **Batch G**.
- Flash Lite can still ignore CRAFT after one stitch/retry.
- Admin Feedback still unmounted; XP / registration Waiting unchanged.

## Verify

```
npx vitest run src/game/playtest31qBatchF.test.ts
```

Redeploy: client + `node scripts/sync-gm-edge-shared.mjs` + `npx supabase functions deploy gm-turn`.
