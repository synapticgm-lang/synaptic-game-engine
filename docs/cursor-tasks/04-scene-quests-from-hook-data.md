# 04 — Opening scene quests come from the hook's beats, not text

**Phase:** Phase 1 (opening slices, part D: scene quests)  
**Depends on:** 01, 02  
**Who does it:** Cursor, in a fresh chat  

Read `docs/cursor-tasks/00-README.md`, `docs/cursor-tasks/CODING.md`, `docs/cursor-tasks/HISTORY.md` and `docs/cursor-tasks/DUPLICATION.md` first. Their rules apply here and win over anything in this brief.

Method: follow CODING.md (house rules for Cursor, root cause first, test first, verify before "done", one source and no duplication). Check DUPLICATION.md for the copies this brief removes.

## Goal
The opening quest(s) are built from the hook's typed beats and cast and place ids, so they adapt to the story and name real people and places in this game.

## Background
Opening quests are derived from card text. Rule 2: quests adapt to the story. Rule 3: names and places change per game. Side-quest spacing (P6) is Phase 9 work (brief 30), not this brief.

**Previous attempts:** see HISTORY.md H7, H8, H16. Your PR must say how this approach differs from those attempts.

## Files you may read
- src/game/openingInstance.ts
- src/game/questGenerator.ts (opening path only)
- src/game/openingEstablishment.ts (quest section)
- src/data/campaigns/types.ts
- src/components/QuestLogModal.tsx

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- src/game/openingInstance.ts
- src/game/openingEstablishment.ts (quest section only)
- the tests that cover the opening quest (rewrite as data tests)
- edge twins only via `npm run sync:gm-edge`

Nothing else, and no new files except those listed.

## Edge twins
If you change a `src/game/` file that has a twin in `supabase/functions/_shared/gm/`, run `npm run sync:gm-edge` and commit the regenerated twin with it. Never hand-edit a twin. The PR must then say "gm-turn deploy needed — John's yes required".

## Acceptance criteria
- The opening quest title and summary reference minted cast and place ids rendered to names.
- No quest text is parsed from English.
- The Quest Journal shows a structured summary, never a mid-word cut.

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, and the targeted tests (`npx vitest run <changed test files>`).
- `npm run check:gm-edge` must print "edge copies match".
- Real check (Synapticgm or John, after review; Cursor does not run it): a short live game on www.synapticgm.com or the PR's Vercel preview, focused on prose and read by a person: 5 new games: the opening quest names the right person and place for that game and matches what page 1 said.

## Forbidden
- Turn-number triggers.
- A fixed quest sentence.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Auto.

## Branch and PR
- Branch: `cursor/04-scene-quests-from-hook-data` from the latest `main`.
- PR title: `[04] Opening scene quests come from the hook's beats, not text`.
- PR body: "How this differs from earlier attempts", "Duplication removed" (file:symbol, or "none" and why), root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, "Structural decisions" (if any), and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
