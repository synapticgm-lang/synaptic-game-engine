# 39 — Edge twins: generated only, no hand stubs, drift fails the build

**Phase:** De-dup (after R9 part C)  
**Depends on:** 17  
**Who does it:** Cursor, in a fresh chat  
**Gate:** gm-turn deploy needs John's yes.  

Read `docs/cursor-tasks/00-README.md`, `docs/cursor-tasks/CODING.md`, `docs/cursor-tasks/HISTORY.md` and `docs/cursor-tasks/DUPLICATION.md` first. Their rules apply here and win over anything in this brief.

Method: follow CODING.md (house rules for Cursor, root cause first, test first, verify before "done", one source and no duplication). Check DUPLICATION.md for the copies this brief removes.

Method: follow CODING.md (house rules for Cursor, root cause first, test first, verify before "done", one source and no duplication). Check DUPLICATION.md for the copies this brief removes.

## Goal
Every file under `supabase/functions/_shared/gm/` is generated from `src/` by `npm run sync:gm-edge`. The 16 hand-written edge stubs are gone, and a drifted or hand-edited twin fails `npm run build`.

## Background
DUPLICATION.md D3, D4 and D16. The generator already exists and `check:gm-edge` passes, but (a) 16 edge files are hand-written stubs that the generator skips (`HAND_STUB_HEADER` and `FORCE_SYNC_FROM_SRC` in the script), so they are a second implementation of `openingEstablishment`, `travelJourney`, `placeNames`, `talkEnvelope`, `spokenAnswer`, `skillGates`, `litrpgSystemWindow`, `settlementQuestCards`, `tokenProse`, `exhaustionCurve`, `pyoaDelayedConsequences`, `hookArc`, `semanticMemory`, `forwardProgressGovernor`, `repairEngine` and `qualityGovernance`; and (b) nothing enforces the check, because the repo has no CI workflow and `prepush` runs only `codemap`. The 27 Oct BOOT_ERROR (stale edge `stateTx.ts`) is the cost of this.

**Previous attempts:** see HISTORY.md H11. Never hand-edit twins. Stubs were the workaround for client-only import trees, and this brief removes the workaround instead of adding another. Your PR must say how this approach differs from those attempts.

## Files you may read
- scripts/sync-gm-edge-shared.mjs
- package.json
- supabase/functions/_shared/gm/README.md
- the 16 stub files under supabase/functions/_shared/gm/ (named above)
- the matching src/game files: search by the exported symbols the edge needs; don't read them whole

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- new small modules under src/game/ holding only the pure parts the edge needs (one per stub group; name them for what they do, never `*Edge*` or `*Stub*`)
- the matching src/game files (import from the new module instead of defining the code; no behaviour change)
- scripts/sync-gm-edge-shared.mjs (delete `HAND_STUB_HEADER`, the stub preference and `FORCE_SYNC_FROM_SRC` once unused)
- package.json (add `"prebuild": "npm run check:gm-edge"`)
- supabase/functions/_shared/gm/ (only via `npm run sync:gm-edge`; delete the stubs)

Nothing else, and no new files except those listed.

## Acceptance criteria
- `rg -l "Edge stub|edge stub|Edge type stub|Runtime helpers stay client-only" supabase/functions/_shared/gm` returns only README.md, or nothing.
- The script has no hand-stub path.
- `npm run build` fails when a twin is hand-edited (show it: edit one twin, run build, see it fail, revert).
- The PR lists the twin file count and line count before and after.
- If the work would pass ~600 changed lines, split it by stub group into 39a, 39b and so on, one PR each.
- Type check and lint pass. `npm run check:gm-edge` prints "edge copies match".

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, `npm run check:gm-edge`, and the targeted tests (`npx vitest run <changed test files>`).
- Real check (Synapticgm or John, after review; Cursor does not run it): one 15-turn game in each mode on the preview after the gm-turn deploy (John's yes): the prose reads right and the option counts are exact. Watch the opening and travel turns, which used stubbed modules.

## Forbidden
- Leaving the old copy next to the new single source, or adding any new copy.
- Running any script, autoplay or live-drive that calls a model.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Top model to plan the module split; Auto for the moves.

## Branch and PR
- Branch: `cursor/39-dedup-edge-twins-generated-only` from the latest `main`.
- PR title: `[39] Edge twins: generated only, no hand stubs, drift fails the build`.
- PR body: "How this differs from earlier attempts", "Duplication removed" (file:symbol), root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, "Structural decisions" (if any), and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
