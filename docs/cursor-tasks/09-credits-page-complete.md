# 09 — Credits page lists every source, including Transformers.js

**Phase:** Side track (credits)  
**Depends on:** None  
**Who does it:** Cursor, in a fresh chat  

Read `docs/cursor-tasks/00-README.md` first. Its global rules apply here and win over anything in this brief.

## Goal
The in-game credits page lists every third-party library, model and asset source with its licence. Anything with an unconfirmed licence is listed for John, not guessed.

## Background
A credits page exists (src/components/CreditsPage.tsx, data in src/legal/credits.ts). Transformers.js and other sources are missing. From 8 Nov: five npm package grant texts open, 24 asset archives unmapped. The free tabletop library's credits are on the bot box, not in the repo; it is not wired into the game yet, so it is not credited here.

## Files you may read
- src/legal/credits.ts
- src/components/CreditsPage.tsx
- package.json
- public/ (folder names only; do not open binaries)

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- src/legal/credits.ts
- src/components/CreditsPage.tsx (only if a new field must be shown)
- new: docs/legal/credits-unconfirmed.md (list for John)

Nothing else, and no new files except those listed.

## Acceptance criteria
- Every runtime dependency in package.json `dependencies` and every bundled model or asset pack has an entry with licence and link.
- Unconfirmed items are in docs/legal/credits-unconfirmed.md, not guessed.

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, and the targeted tests (`npx vitest run <changed test files>`).
- Real check (Synapticgm or John, after review; Cursor does not run it): a short live game on www.synapticgm.com or the PR's Vercel preview, focused on prose and read by a person: open the credits page; a person checks it renders and the links work.

## Forbidden
- Guessing a licence.
- The phrase 'Dungeons & Dragons' anywhere.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Auto.

## Branch and PR
- Branch: `cursor/09-credits-page-complete` from the latest `main`.
- PR title: `[09] Credits page lists every source, including Transformers.js`.
- PR body: root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
