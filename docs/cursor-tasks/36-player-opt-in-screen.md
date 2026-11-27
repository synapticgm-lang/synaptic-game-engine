# 36 — Player opt-in screen for training capture, default OFF

**Phase:** Before other players (training)  
**Depends on:** None  
**Who does it:** Cursor, in a fresh chat  
**Gate:** Switching on other-player capture needs John's yes.  

Read `docs/cursor-tasks/00-README.md`, `docs/cursor-tasks/CODING.md`, `docs/cursor-tasks/HISTORY.md` and `docs/cursor-tasks/DUPLICATION.md` first. Their rules apply here and win over anything in this brief.

Method: follow CODING.md (house rules for Cursor, root cause first, test first, verify before "done", one source and no duplication). Check DUPLICATION.md for the copies this brief removes.

## Goal
A clear player-facing opt-in for training capture that defaults OFF; other players are captured only after an explicit yes.

## Background
PR #47 limits capture to founder, staff and test accounts while PLAYER_CAPTURE_ENABLED is unset (table gm_turn_captures, migration 025). Strip credentials, personal information and provider reasoning. PYOA is excluded from training.

**Previous attempts:** none found in HISTORY.md.

## Files you may read
- supabase/migrations/025_gm_turn_captures.sql
- supabase/functions/gm-turn/index.ts (capture section only)
- src/components/SettingsModal.tsx
- src/components/SupportAccountPanel.tsx

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- src/components/SettingsModal.tsx (account section: opt-in toggle)
- new: supabase/migrations/0NN_capture_opt_in.sql (next free number)
- supabase/functions/gm-turn/index.ts (honour the opt-in)
- tests

Nothing else, and no new files except those listed.

## Acceptance criteria
- Default OFF for every non-staff account.
- Turning it off stops capture at once.
- PYOA is never captured.

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, and the targeted tests (`npx vitest run <changed test files>`).
- Real check (Synapticgm or John, after review; Cursor does not run it): a short live game on www.synapticgm.com or the PR's Vercel preview, focused on prose and read by a person: with a normal test account: the toggle is off by default and no capture row appears.

## Forbidden
- Setting PLAYER_CAPTURE_ENABLED.
- Defaulting to on.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Auto.

## Branch and PR
- Branch: `cursor/36-player-opt-in-screen` from the latest `main`.
- PR title: `[36] Player opt-in screen for training capture, default OFF`.
- PR body: "How this differs from earlier attempts", "Duplication removed" (file:symbol, or "none" and why), root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, "Structural decisions" (if any), and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
