# 34 — Shared modal hook, tab strips that fit, staff chrome behind the staff check

**Phase:** Interface quick repairs (any time; avoid files in active briefs)  
**Depends on:** None  
**Who does it:** Cursor, in a fresh chat  

Read `docs/cursor-tasks/00-README.md`, `docs/cursor-tasks/CODING.md`, `docs/cursor-tasks/HISTORY.md` and `docs/cursor-tasks/DUPLICATION.md` first. Their rules apply here and win over anything in this brief.

Method: follow CODING.md (house rules for Cursor, root cause first, test first, verify before "done", one source and no duplication). Check DUPLICATION.md for the copies this brief removes.

## Goal
Escape, focus and dialog roles come from one shared hook; Adventurer and Settings tabs fit without clipping; Debug, build-id and test-account chrome show only for staff.

## Background
UI review Q2, Q3, Q4, Q5. Use the existing staff check, not a new login system. Bigger redesigns (R1, R3–R7) are not in this brief.

**Previous attempts:** none found in HISTORY.md.

## Duplication to remove
DUPLICATION.md D19: one modal hook and one tab strip. Delete the copies.

## Files you may read
- src/components/SettingsModal.tsx
- src/components/DebugModal.tsx
- src/components/Hud.tsx
- src/components/CharacterWindow.tsx
- src/components/qol/
- the file found by searching for the existing staff check

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- new: src/components/useModalShell.ts
- the modal components that adopt it (list them in the PR)
- src/components/SettingsModal.tsx (tab strip)
- src/components/CharacterWindow.tsx (tab strip only)
- src/components/Hud.tsx (staff chrome gate)
- component tests

Nothing else, and no new files except those listed.

## Acceptance criteria
- Escape closes the top modal and returns focus.
- Every tab visible at desktop width.
- No Debug, build id or test banner on a normal account.

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, and the targeted tests (`npx vitest run <changed test files>`).
- Real check (Synapticgm or John, after review; Cursor does not run it): a short live game on www.synapticgm.com or the PR's Vercel preview, focused on prose and read by a person: a person clicks through the live site at desktop and phone width.

## Forbidden
- A second option count or pad in the composer.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Auto.

## Branch and PR
- Branch: `cursor/34-ui-shared-modal-and-tabs` from the latest `main`.
- PR title: `[34] Shared modal hook, tab strips that fit, staff chrome behind the staff check`.
- PR body: "How this differs from earlier attempts", "Duplication removed" (file:symbol, or "none" and why), root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, "Structural decisions" (if any), and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
