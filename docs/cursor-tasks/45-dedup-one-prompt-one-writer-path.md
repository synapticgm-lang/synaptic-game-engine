# 45 — One system-prompt builder and one writer call path

**Phase:** De-dup (after Phase 8 part A)  
**Depends on:** 17, 28  
**Who does it:** Cursor, in a fresh chat  
**Gate:** gm-turn deploy needs John's yes.  

Read `docs/cursor-tasks/00-README.md`, `docs/cursor-tasks/CODING.md`, `docs/cursor-tasks/HISTORY.md` and `docs/cursor-tasks/DUPLICATION.md` first. Their rules apply here and win over anything in this brief.

Method: follow CODING.md (house rules for Cursor, root cause first, test first, verify before "done", one source and no duplication). Check DUPLICATION.md for the copies this brief removes.

## Goal
The game has one system-prompt builder, one context-prompt builder and one path that calls the writer model.

## Background
DUPLICATION.md D12 and D13. `systemPrompt.ts:buildSystemPrompt` and `masterPrompt.ts:buildMasterPrompt` are two builders, and masterPrompt re-exports its builder as `buildSystemPrompt`, so two different functions share one name. `masterPrompt.ts` also re-exports `buildContextPrompt` from `systemPrompt.ts`. `fateAutoplay.ts ~1332` builds the context prompt from both the client and the edge copy. Separately, `aiService.direct.ts` (`callGmDirect`, `callRepairDirect`, `callCheckDirect`) builds the prompt and calls the model from the browser, while `gm-turn/index.ts` does the same on the server.

**Previous attempts:** see HISTORY.md H6. Two call paths meant retries and re-asks lived in one path and not the other. **First step is report-only:** find who calls `aiService.direct.ts` in live play (for example a bring-your-own-key setting). If players use it, keep it as a thin transport that sends the same typed request as brief 17. Don't delete a player feature without John's yes. Your PR must say how this approach differs from those attempts.

## Files you may read
- src/game/systemPrompt.ts
- src/game/masterPrompt.ts
- src/game/aiService.direct.ts
- supabase/functions/gm-turn/index.ts (prompt and call section)
- src/game/fateAutoplay.ts (search `buildContextPrompt`)

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- src/game/masterPrompt.ts and src/game/systemPrompt.ts (merge into one module; delete the other)
- src/game/aiService.direct.ts (delete its own prompt building; transport only, or delete if unused and John agrees)
- the importers of the deleted names (rename imports only)
- their tests
- edge twins only via `npm run sync:gm-edge`

Nothing else, and no new files except those listed.

## Acceptance criteria
- One exported `buildSystemPrompt` and one `buildContextPrompt` in the repo.
- No browser code builds a writer prompt except through that module.
- The PR states who used the direct path and what happened to it.
- Type check and lint pass. `npm run check:gm-edge` prints "edge copies match".

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, `npm run check:gm-edge`, and the targeted tests (`npx vitest run <changed test files>`).
- Real check (Synapticgm or John, after review; Cursor does not run it): a 15-turn game in each mode. A person checks that the prose and tone haven't changed, and that the options are exact.

## Forbidden
- Leaving the old copy next to the new single source, or adding any new copy.
- Running any script, autoplay or live-drive that calls a model.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Top model to plan; Auto to edit.

## Branch and PR
- Branch: `cursor/45-dedup-one-prompt-one-writer-path` from the latest `main`.
- PR title: `[45] One system-prompt builder and one writer call path`.
- PR body: "How this differs from earlier attempts", "Duplication removed" (file:symbol), root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, "Structural decisions" (if any), and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
