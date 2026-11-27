# 21 — Tabletop: build or import the character before page 1

**Phase:** Phase 5, part A  
**Depends on:** 05  
**Who does it:** Cursor, in a fresh chat  

Read `docs/cursor-tasks/00-README.md`, `docs/cursor-tasks/CODING.md`, `docs/cursor-tasks/HISTORY.md` and `docs/cursor-tasks/DUPLICATION.md` first. Their rules apply here and win over anything in this brief.

Method: follow CODING.md (house rules for Cursor, root cause first, test first, verify before "done", one source and no duplication). Check DUPLICATION.md for the copies this brief removes.

## Goal
Tabletop page 1 is written after the character exists, so a wizard never opens holding a sword.

## Background
Tabletop page 1 is written before the character exists. Rule 6: origin and setup are their own step before turn 1. This brief only reorders creation; the full Setup page is brief 32.

**Previous attempts:** see HISTORY.md H15. Your PR must say how this approach differs from those attempts.

## Files you may read
- src/components/SetupScreen.tsx
- src/components/CharacterBuilderPanel.tsx
- src/components/NewGameModal.tsx
- src/game/liveOpening.ts (tabletop start)
- src/game/useGame.ts (new-game path only)

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- src/components/SetupScreen.tsx
- src/components/NewGameModal.tsx
- src/game/useGame.ts (new-game path only)
- the creation-order tests (rewrite)

Nothing else, and no new files except those listed.

## Acceptance criteria
- The sheet is final before the opening request is sent.
- The opening request includes the sheet's gear.
- Setup buttons never appear among scene buttons.

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, and the targeted tests (`npx vitest run <changed test files>`).
- Real check (Synapticgm or John, after review; Cursor does not run it): a short live game on www.synapticgm.com or the PR's Vercel preview, focused on prose and read by a person: 3 tabletop starts (wizard, fighter, rogue): page 1's gear and class match the sheet.

## Forbidden
- Narrating gear the sheet doesn't hold.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Auto.

## Branch and PR
- Branch: `cursor/21-p5-tabletop-character-first` from the latest `main`.
- PR title: `[21] Tabletop: build or import the character before page 1`.
- PR body: "How this differs from earlier attempts", "Duplication removed" (file:symbol, or "none" and why), root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, "Structural decisions" (if any), and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
