# 32 — One Character Setup page before turn 1 in every mode

**Phase:** Phase 10, part A  
**Depends on:** 03, 05, 21  
**Who does it:** Cursor, in a fresh chat  

Read `docs/cursor-tasks/00-README.md`, `docs/cursor-tasks/CODING.md`, `docs/cursor-tasks/HISTORY.md` and `docs/cursor-tasks/DUPLICATION.md` first. Their rules apply here and win over anything in this brief.

Method: follow CODING.md (house rules for Cursor, root cause first, test first, verify before "done", one source and no duplication). Check DUPLICATION.md for the copies this brief removes.

## Goal
One setup page before turn 1: 4–5 core questions, each with a one-tap pick and an optional Expand, plus Quick start and 'Use my saved character'. Structured answers are applied once.

## Background
Rule 6 and the 14 Nov opening setup study. UI review R2, Q13, Q14: Quick Start includes a Character / Origin step; step labels come from the real step list; a typed campaign name is not overwritten; a GM Library click opens this setup with that bible; premade strictness matches the story's difficulty badge. Absorbs 'Hero Awakening name button'. Single save versus several saves is John's open decision: do not build a multi-save list.

**Previous attempts:** see HISTORY.md H15, H5, H7. Setup was mixed into the story loop. AIPSETUP (19 Oct) was one of the reverted merges. Your PR must say how this approach differs from those attempts.

## Files you may read
- src/components/SetupScreen.tsx
- src/components/NewGameModal.tsx
- src/components/SessionZeroPanel.tsx
- src/components/GMLibrary.tsx
- src/components/CharacterBuilderPanel.tsx
- src/game/playerProfile.ts
- src/game/pcNamePicker.ts

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- src/components/SetupScreen.tsx
- src/components/NewGameModal.tsx
- src/components/GMLibrary.tsx (click opens setup)
- src/game/playerProfile.ts (usual self keeps the saved setup)
- component tests

Nothing else, and no new files except those listed.

## Acceptance criteria
- Setup happens before turn 1 in every mode; setup buttons never mix with scene buttons.
- Quick start and saved character work.
- Step labels never skip (no '1 → 3').

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, and the targeted tests (`npx vitest run <changed test files>`).
- Real check (Synapticgm or John, after review; Cursor does not run it): a short live game on www.synapticgm.com or the PR's Vercel preview, focused on prose and read by a person: games of System Integration, Summoned Pact, Hero Awakening, one tabletop and one RPG, read by a person. PYOA: only check it still starts; do not change PYOA prose.

## Forbidden
- A second new-game flow.
- Touching PYOA prose.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Top model to plan; Auto to edit.

## Branch and PR
- Branch: `cursor/32-p10-character-setup-page` from the latest `main`.
- PR title: `[32] One Character Setup page before turn 1 in every mode`.
- PR body: "How this differs from earlier attempts", "Duplication removed" (file:symbol, or "none" and why), root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, "Structural decisions" (if any), and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
