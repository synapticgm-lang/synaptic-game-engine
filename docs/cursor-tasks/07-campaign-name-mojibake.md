# 07 — Campaign-name mojibake: fix the encoding at the source and stop storing the date in the save name

**Phase:** Small fix (Interface Q1)  
**Depends on:** None (avoid files open in 01–06)  
**Who does it:** Cursor, in a fresh chat  

Read `docs/cursor-tasks/00-README.md` and `docs/cursor-tasks/HISTORY.md` first. Its global rules apply here and win over anything in this brief.

## Goal
Save and campaign names show real characters (for example a real dash), because the source encoding is fixed and the date is no longer stored inside the name.

## Background
16 Nov UI review Q1. Not re-produced on 27 Nov. Root cause: a mis-encoded file plus a date baked into the save name. The label builder is not pinned down yet: start by searching src/game/storySave.ts, src/game/campaignSeed.ts, src/components/MainMenu.tsx and src/components/PlayerProfilePanel.tsx, and name the real file in the PR.

**Previous attempts:** none found in HISTORY.md.

## Files you may read
- src/game/storySave.ts
- src/game/campaignSeed.ts
- src/components/MainMenu.tsx
- src/components/PlayerProfilePanel.tsx
- src/components/NewGameModal.tsx

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- the one file that builds the save or campaign label (name it in the PR)
- src/game/storySave.ts (a one-time decoder for old save names; store the date as its own field)
- new: scripts/check-utf8.mjs (fails on invalid UTF-8 or a BOM under src/)
- package.json (add a `check:utf8` script only)
- a small unit test for the decoder

Nothing else, and no new files except those listed.

## Acceptance criteria
- Names render a real dash and no mojibake sequences.
- The date is a separate field shown by the UI.
- Old saves load with names repaired once.
- `npm run check:utf8` passes on the branch.

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, and the targeted tests (`npx vitest run <changed test files>`).
- Real check (Synapticgm or John, after review; Cursor does not run it): a short live game on www.synapticgm.com or the PR's Vercel preview, focused on prose and read by a person: load an old save and start a new one; a person checks both names read correctly on the title menu and save list.

## Forbidden
- A search-and-replace table of bad character sequences (that is a word list). The decoder must be a real re-decode (for example latin1 to UTF-8), applied once.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Auto.

## Branch and PR
- Branch: `cursor/07-campaign-name-mojibake` from the latest `main`.
- PR title: `[07] Campaign-name mojibake: fix the encoding at the source and stop storing the date in the save name`.
- PR body: root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
