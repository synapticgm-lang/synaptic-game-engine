# 15 — Extract one resolveTurn with typed stages; live play calls it

**Phase:** R9 (own phase, alongside Phase 3), part A  
**Depends on:** None to start; land after 12 or rebase on it  
**Who does it:** Cursor, in a fresh chat  

Read `docs/cursor-tasks/00-README.md` and `docs/cursor-tasks/HISTORY.md` first. Its global rules apply here and win over anything in this brief.

## Goal
Move the turn out of the 1,500+ line `sendAction` in useGame.ts into one `resolveTurn` with typed stages. Live play calls it. No behaviour change.

## Background
John agreed on 27 Nov that R9 is its own phase beside Phase 3. The turn is copied in fateAutoplay.ts and liveDrive.ts, so fixes are made three times (for example `maxTurns: 6` at useGame.ts ~3001 and fateAutoplay.ts ~1652, 1930). This brief is a pure extraction for the live path.

**Previous attempts:** see HISTORY.md H11. Fixes were repeatedly made in one copy of the turn only (for example `maxTurns: 6` in three places, and the runner's double fight resolve). Your PR must say how this approach differs from those attempts.

## Files you may read
- src/game/useGame.ts
- src/game/fateAutoplay.ts (read only, to see which stages it repeats)
- src/game/liveDrive.ts (read only)
- src/game/types.ts (state types)

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- new: src/game/resolveTurn.ts
- src/game/useGame.ts (sendAction calls resolveTurn)
- new: src/game/resolveTurn.test.ts (stage wiring only)

Nothing else, and no new files except those listed.

## Acceptance criteria
- sendAction becomes a thin caller.
- Stages are typed (intent, rules, state commit, writer request, fact check, options).
- No behaviour change; type check and lint pass.

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, and the targeted tests (`npx vitest run <changed test files>`).
- Real check (Synapticgm or John, after review; Cursor does not run it): a short live game on www.synapticgm.com or the PR's Vercel preview, focused on prose and read by a person: play one seed for 15 turns before and after; a person compares the two transcripts (prose quality, option counts).

## Forbidden
- Fixing bugs in this PR (note them for later briefs).
- Leaving the old sendAction body next to the new one.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Top model to plan the stages; Auto for the move.

## Branch and PR
- Branch: `cursor/15-r9-resolveturn-live` from the latest `main`.
- PR title: `[15] Extract one resolveTurn with typed stages; live play calls it`.
- PR body: root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
