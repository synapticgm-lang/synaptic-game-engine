# 33 — Remove setup-in-chat: stitched hall talk and name harvesting

**Phase:** Phase 10, part B  
**Depends on:** 32  
**Who does it:** Cursor, in a fresh chat  

Read `docs/cursor-tasks/00-README.md` first. Its global rules apply here and win over anything in this brief.

## Goal
Delete the chat-based setup after page 1.

## Background
Audit 30 (`stitchOpeningContinue` canned hall talk, openingStitch.ts ~283, useGame.ts ~2563-2565), 45 (`ACTION_FUNCTION_WORD` name harvest, openingEstablishment.ts ~2512-2525).

## Files you may read
- src/game/openingStitch.ts
- src/game/openingEstablishment.ts (name-harvest section)
- src/game/useGame.ts (call sites)
- package.json (scripts only)

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- src/game/openingStitch.ts (delete)
- src/game/openingEstablishment.ts
- src/game/useGame.ts (call sites only)
- package.json (remove opening-stitch-* scripts whose targets are deleted)
- tests that pin the post-page-1 origin row and setup chips (delete)
- edge twins only via `npm run sync:gm-edge`

Nothing else, and no new files except those listed.

## Edge twins
If you change a `src/game/` file that has a twin in `supabase/functions/_shared/gm/`, run `npm run sync:gm-edge` and commit the regenerated twin with it. Never hand-edit a twin. The PR must then say "gm-turn deploy needed — John's yes required".

## Acceptance criteria
- No setup question inside the story loop.
- No name parsed out of chat.

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, and the targeted tests (`npx vitest run <changed test files>`).
- `npm run check:gm-edge` must print "edge copies match".
- Real check (Synapticgm or John, after review; Cursor does not run it): a short live game on www.synapticgm.com or the PR's Vercel preview, focused on prose and read by a person: 5 new games: page 1 starts in the story and honours the setup answers.

## Forbidden
- Parsing a name out of chat.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Auto.

## Branch and PR
- Branch: `cursor/33-p10-remove-chat-setup` from the latest `main`.
- PR title: `[33] Remove setup-in-chat: stitched hall talk and name harvesting`.
- PR body: root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
