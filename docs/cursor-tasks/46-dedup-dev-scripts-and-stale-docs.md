# 46 — One script per job; archive docs that restate replaced systems

**Phase:** De-dup housekeeping (any time; avoid files in active briefs)  
**Depends on:** None  
**Who does it:** Cursor, in a fresh chat  

Read `docs/cursor-tasks/00-README.md`, `docs/cursor-tasks/CODING.md`, `docs/cursor-tasks/HISTORY.md` and `docs/cursor-tasks/DUPLICATION.md` first. Their rules apply here and win over anything in this brief.

Method: follow CODING.md (house rules for Cursor, root cause first, test first, verify before "done", one source and no duplication). Check DUPLICATION.md for the copies this brief removes.

## Goal
Duplicate dev scripts are merged into one script per job with a parameter, and design docs that describe replaced systems are moved to `docs/archive/` with a one-line "replaced by" header.

## Background
DUPLICATION.md D17 and D18. jscpd found `runLiveDriveFourModeT10.ts` and `runLiveDriveFourModeT20.ts` share 237 lines, and `sim-open7-grind` / `sim-open8-grind` (and the `-pace` pairs) duplicate each other. Docs such as `MASTER-PROMPT-*.md` (3), `WARDEN-*.md` (2), `PACK-12-*.md` (2), `MEMORY-ARCHITECTURE-IMPROVEMENTS.md` and `PHASE-1-IMPLEMENTATION-GUIDE.md` describe systems that were later replaced, so a reader gets two versions of the rules.

**Previous attempts:** none found in HISTORY.md. PYOA scripts (`scripts/pyoa/gen-*`, `*-skeleton*`) also duplicate each other and use Gemini, but PYOA needs John's go: **list them in the PR, don't change them.** Also list any Gemini-calling script outside PYOA for John; don't run any of them. Your PR must say how this approach differs from those attempts.

## Files you may read
- scripts/fate-autoplay/runLiveDriveFourModeT10.ts
- scripts/fate-autoplay/runLiveDriveFourModeT20.ts
- scripts/sim-open7-grind.mjs, scripts/sim-open8-grind.mjs, scripts/sim-open7-pace.mjs, scripts/sim-open8-pace.mjs
- package.json (scripts block)
- the first 20 lines of each doc in docs/*.md

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- the script pairs above (one script with a `--turns` / `--open` parameter; delete the other)
- package.json (point script entries at the merged scripts)
- docs/*.md → docs/archive/ (git mv, plus a one-line header)

Nothing else, and no new files except those listed.

## Acceptance criteria
- No two dev scripts do the same job.
- Every archived doc has a "Replaced by" line naming the current source.
- Nothing is run. These scripts may call paid models.
- Type check and lint pass. `npm run check:gm-edge` prints "edge copies match".

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, `npm run check:gm-edge`, and the targeted tests (`npx vitest run <changed test files>`).
- Real check (Synapticgm or John, after review; Cursor does not run it): none needed (no game code changes). Synapticgm checks the diff.

## Forbidden
- Leaving the old copy next to the new single source, or adding any new copy.
- Running any script, autoplay or live-drive that calls a model.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Auto.

## Branch and PR
- Branch: `cursor/46-dedup-dev-scripts-and-stale-docs` from the latest `main`.
- PR title: `[46] One script per job; archive docs that restate replaced systems`.
- PR body: "How this differs from earlier attempts", "Duplication removed" (file:symbol), root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, "Structural decisions" (if any), and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
