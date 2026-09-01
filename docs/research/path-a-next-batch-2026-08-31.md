# Path A next batch — 2026-08-31m

**Stamp:** HUD `2026-08-31m` / BUILD `2026-08-31f`  
**Mid writer:** OFF  
**John:** next batch — residual list from 31l / last chat. Ledger-first. No new critic LLM. No WOF.

## Landed

1. **Map left/right** — `graphExitPads` / SNAPSHOT exits / ChoiceCompiler + ChoicePipeline use floor-plan tokens only (named or cardinal). Rooms without coordinates label `the doorway` or stairs, never camera-left/right. Interior pads matching `isCameraRelativePad` drop.

2. **Harder commit gate** — `classifyBeatCommit` (classifier-only): atmosphere-only, missing pointer-card slot, recycle-without-delta. Existing clone retry once, then `repairRejectedBeat` strip-prefix / stitch one concrete. No new CRAFT lines. Wired in `useGame`, `fateAutoplay`, `applyGovernanceToProse`.

3. **Drought without visible foe** — ArcDirector parks `pendingEncounter` + `pendingSpawnPreface` and does **not** set `activeEncounter` until `ensureEncounterSpawnPreface` commits the foe this turn (present[] or prepend). 31h/31f lastKill unchanged.

4. **Numbered `1.` leak** — `stripChoiceList` catches adverb leads (`1. Carefully examine…`) and mid-body numbered offers.

5. **aiTraffic SNAPSHOT gist** — `compactTrafficGist` (location, crowdCount, hook, present, stamp) on GM `LogEntry.snapshotGist` + `logApiLatency` / `callOpeningGm` payload. Never the full prompt.

6. **XP honesty** — `isLookAroundAction` catches `scout the cell` / `get bearings` without possessive. Hear-reason / social XP still skipped on scout/look-around and contradicted why. No new L2 curve.

## Skip (as asked)

- PYOA ending unproven — not invented.
- Admin staff-marks table / 019 SQL — not touched.

## Follow-up (2026-08-31n)

Modest memory widen shipped separately: last **4** log lines × **500** chars. See `path-a-memory-widen-2026-08-31.md`. HUD `2026-08-31n` / BUILD `2026-08-31g`.

## Residuals

- Flash Lite can still ignore two CRAFT lines (prompt-only).
- Map L/R is pad + SNAPSHOT authority; GM prose can still say left/right until the writer obeys the packet.
- Density may still defer drought (no live fight until preface).
- Admin Feedback still unmounted.
- Free retention bands still a product gap.

## Verify

```
npx vitest run src/game/playtest31mNextBatch.test.ts
```

Redeploy when John asks: client + `node scripts/sync-gm-edge-shared.mjs` + `npx supabase functions deploy gm-turn` (packet / combat / pointer gist copies).
