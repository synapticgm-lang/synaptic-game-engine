# 08 — 'Rogue,.' display bug: find the real cause, then fix it there

**Phase:** Small fix (diagnose first)  
**Depends on:** None  
**Who does it:** Cursor, in a fresh chat  

Read `docs/cursor-tasks/00-README.md`, `docs/cursor-tasks/CODING.md`, `docs/cursor-tasks/HISTORY.md` and `docs/cursor-tasks/DUPLICATION.md` first. Their rules apply here and win over anything in this brief.

Method: follow CODING.md (house rules for Cursor, root cause first, test first, verify before "done", one source and no duplication). Check DUPLICATION.md for the copies this brief removes.

## Goal
Find where 'Rogue,.' (a class or role label followed by stray punctuation) is produced, name the failing layer, and fix it at the source.

## Background
Still listed as open; not re-produced and the root cause was not confirmed on 27 Nov. Likely a label or sentence joined from parts where one part is empty. Diagnose first; if the fix needs files outside the list below, stop and report.

**Previous attempts:** none found in HISTORY.md.

## Files you may read
- search only: `rg -n "Rogue" src/game src/components` and the join or format helpers it leads to
- src/game/rules/characterClass.ts
- src/components/Hud.tsx
- src/components/CharacterSheetView.tsx
- src/game/sceneBlock.ts

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- the one file that builds the broken string (name it in the PR)
- one unit test for that builder

Nothing else, and no new files except those listed.

## Acceptance criteria
- The PR names the failing layer (screen, packet, AI output, or the code that builds the label) with evidence.
- The fix is in the builder (for example joining only non-empty parts), not a regex that strips ',.' afterwards.

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, and the targeted tests (`npx vitest run <changed test files>`).
- Real check (Synapticgm or John, after review; Cursor does not run it): a short live game on www.synapticgm.com or the PR's Vercel preview, focused on prose and read by a person: play a Rogue for 5 turns and open the sheet and HUD; a person checks the label and the prose.

## Forbidden
- A post-hoc punctuation clean-up regex.
- A Rogue-specific branch.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Auto. If one search pass does not find the cause, stop and report what was searched.

## Branch and PR
- Branch: `cursor/08-rogue-comma-display` from the latest `main`.
- PR title: `[08] 'Rogue,.' display bug: find the real cause, then fix it there`.
- PR body: "How this differs from earlier attempts", "Duplication removed" (file:symbol, or "none" and why), root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, "Structural decisions" (if any), and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
