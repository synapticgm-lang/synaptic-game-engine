# 16 — Autoplay and live-drive call the same resolveTurn

**Phase:** R9, part B  
**Depends on:** 15  
**Who does it:** Cursor, in a fresh chat  

Read `docs/cursor-tasks/00-README.md` and `docs/cursor-tasks/HISTORY.md` first. Its global rules apply here and win over anything in this brief.

## Goal
Delete the turn copies in fateAutoplay.ts and liveDrive.ts; both call resolveTurn.

## Background
Absorbs 'Runner double fight resolve' (the runner is a copy of the turn). Removes audit 28c (`maxTurns: 6` in three copies).

**Previous attempts:** see HISTORY.md H11. Your PR must say how this approach differs from those attempts.

## Files you may read
- src/game/resolveTurn.ts
- src/game/fateAutoplay.ts
- src/game/liveDrive.ts
- scripts/fate-autoplay/run.ts (read only)

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- src/game/fateAutoplay.ts
- src/game/liveDrive.ts
- src/game/resolveTurn.ts (only if a stage needs a hook for the runner)
- permanently skipped or failing suites that covered the old copies (delete)

Nothing else, and no new files except those listed.

## Acceptance criteria
- No turn logic left in fateAutoplay.ts or liveDrive.ts beyond driving input.
- `maxTurns` set in one place.
- Type check and lint pass.

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, and the targeted tests (`npx vitest run <changed test files>`).
- Real check (Synapticgm or John, after review; Cursor does not run it): a short live game on www.synapticgm.com or the PR's Vercel preview, focused on prose and read by a person: Synapticgm plays the same seed in the browser; a person compares it with an autoplay transcript turn by turn. Running autoplay against the live model needs John's OK for the spend.

## Forbidden
- Running fate-autoplay, live-drive or any script that calls OpenRouter from Cursor.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Auto.

## Branch and PR
- Branch: `cursor/16-r9-autoplay-livedrive-share-turn` from the latest `main`.
- PR title: `[16] Autoplay and live-drive call the same resolveTurn`.
- PR body: root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
