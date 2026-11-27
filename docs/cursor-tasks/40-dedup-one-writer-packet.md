# 40 — One writer packet built once per turn from committed state

**Phase:** De-dup (after Phase 6)  
**Depends on:** 17, 25, 26  
**Who does it:** Cursor, in a fresh chat  
**Gate:** gm-turn deploy needs John's yes.  

Read `docs/cursor-tasks/00-README.md`, `docs/cursor-tasks/CODING.md`, `docs/cursor-tasks/HISTORY.md` and `docs/cursor-tasks/DUPLICATION.md` first. Their rules apply here and win over anything in this brief.

Method: follow CODING.md (house rules for Cursor, root cause first, test first, verify before "done", one source and no duplication). Check DUPLICATION.md for the copies this brief removes.

## Goal
The writer gets one packet, built once per turn by `resolveTurn` from committed state. The overlapping fact views are deleted or become private helpers of that one builder.

## Background
DUPLICATION.md D6. Each of these was added as "the one sheet" without deleting the last: `factSheet.ts` (M1), `infoSheet.ts` (29z9i diary), `sceneFacts.ts` plus `state.previousSceneFacts`, `sceneBlock.ts` (KNOWN and promise lines), `completedEventPacket.ts`, `campaignMemory.ts` summaries, and `state.locationSheet` plus `previousLocationSheet`. The same fact can reach the writer two or three times in different words, or in one view and not another, which feeds repeats and contradictions (HISTORY H10).

**Previous attempts:** see HISTORY.md H9, H10. Earlier consolidations (M1 fact sheet, 29z9i info sheet) added a new sheet and kept the old ones. This brief deletes the old views. If a view carries a fact no other view has, move the fact, don't keep the view. Your PR must say how this approach differs from those attempts.

## Files you may read
- src/game/resolveTurn.ts (writer-request stage)
- src/game/factSheet.ts
- src/game/infoSheet.ts
- src/game/sceneBlock.ts
- src/game/sceneFacts.ts
- src/game/completedEventPacket.ts (search by symbol; don't read it whole)
- src/game/campaignMemory.ts (search for the summary builders only)
- src/game/types.ts (packet and state types)

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- src/game/resolveTurn.ts (the writer-request stage calls one builder)
- one of the existing files above becomes the builder (pick the one that already holds most of the packet; no new parallel file)
- the other view files (delete, or reduce to private helpers the builder calls)
- src/game/types.ts (remove `previousSceneFacts` / `previousLocationSheet` only if nothing else reads them; otherwise list the readers in the PR)
- their tests (replace with one packet test: same committed state gives the same packet)
- edge twins only via `npm run sync:gm-edge`

Nothing else, and no new files except those listed.

## Acceptance criteria
- One function builds the writer packet, and `rg` shows no other packet or sheet builder on the writer path.
- Each fact appears once in the packet (list the sections in the PR).
- The packet has no prose-matching step: it is built from committed state only.
- The PR lists every deleted view under "Duplication removed".
- Type check and lint pass. `npm run check:gm-edge` prints "edge copies match".

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, `npm run check:gm-edge`, and the targeted tests (`npx vitest run <changed test files>`).
- Real check (Synapticgm or John, after review; Cursor does not run it): a 20-turn game in two modes, with the writer packet logged by the existing debug view. A person checks that the prose doesn't repeat or contradict itself, and that nothing the player was told goes missing.

## Forbidden
- Leaving the old copy next to the new single source, or adding any new copy.
- Running any script, autoplay or live-drive that calls a model.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Top model to plan; Auto to edit.

## Branch and PR
- Branch: `cursor/40-dedup-one-writer-packet` from the latest `main`.
- PR title: `[40] One writer packet built once per turn from committed state`.
- PR body: "How this differs from earlier attempts", "Duplication removed" (file:symbol), root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, "Structural decisions" (if any), and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
