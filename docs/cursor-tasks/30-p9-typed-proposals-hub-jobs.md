# 30 — Writer quest proposals reach the game; hubs offer several side jobs

**Phase:** Phase 9, part A  
**Depends on:** 18, 28  
**Who does it:** Cursor, in a fresh chat  
**Gate:** gm-turn deploy needs John's yes.  

Read `docs/cursor-tasks/00-README.md`, `docs/cursor-tasks/CODING.md`, `docs/cursor-tasks/HISTORY.md` and `docs/cursor-tasks/DUPLICATION.md` first. Their rules apply here and win over anything in this brief.

Method: follow CODING.md (house rules for Cursor, root cause first, test first, verify before "done", one source and no duplication). Check DUPLICATION.md for the copies this brief removes.

## Goal
A typed proposals field from the writer feeds the existing acceptance code; hubs offer several side jobs of different shapes; the main quest is never pushed.

## Background
Side quests appear only when none is open, on an 8-turn spacing, from a fixed rotation (P6, questGenerator.ts ~36, 207). `applyQuestAddProposals` reads `quest-add` events but nothing asks the writer for one. Audit 20 (`NOT_IN_MEDIEVAL`, midVisitProposal.ts ~139-147): proposals carry a tech level checked against the world's genre template; only clear breaks are rejected (16 Oct rule). Quest descriptions are a structured summary (Q7).

**Previous attempts:** see HISTORY.md H16. Your PR must say how this approach differs from those attempts.

## Files you may read
- src/game/questGenerator.ts
- src/game/midVisitProposal.ts
- src/game/writerContract.ts
- src/game/resolveTurn.ts
- src/components/QuestLogModal.tsx

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- src/game/questGenerator.ts
- src/game/midVisitProposal.ts
- src/game/writerContract.ts (proposals field)
- src/components/QuestLogModal.tsx (two-pane layout, structured summary)
- src/game/ttOpt2.test.ts (delete the quest-spacing assertions)
- edge twins only via `npm run sync:gm-edge`

Nothing else, and no new files except those listed.

## Edge twins
If you change a `src/game/` file that has a twin in `supabase/functions/_shared/gm/`, run `npm run sync:gm-edge` and commit the regenerated twin with it. Never hand-edit a twin. The PR must then say "gm-turn deploy needed — John's yes required".

## Acceptance criteria
- No content chosen by turn number.
- Proposals carry a tech level; no word list.
- Hubs show several side jobs.

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, and the targeted tests (`npx vitest run <changed test files>`).
- `npm run check:gm-edge` must print "edge copies match".
- Real check (Synapticgm or John, after review; Cursor does not run it): a short live game on www.synapticgm.com or the PR's Vercel preview, focused on prose and read by a person: ignore the main quest for 40 turns across three hubs, read by a person.

## Forbidden
- Turn-number triggers.
- Genre word lists.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Top model to plan; Auto to edit.

## Branch and PR
- Branch: `cursor/30-p9-typed-proposals-hub-jobs` from the latest `main`.
- PR title: `[30] Writer quest proposals reach the game; hubs offer several side jobs`.
- PR body: "How this differs from earlier attempts", "Duplication removed" (file:symbol, or "none" and why), root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, "Structural decisions" (if any), and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
