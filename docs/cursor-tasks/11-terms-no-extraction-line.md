# 11 — Terms: no-extraction line for bought assets

**Phase:** Legal copy (small)  
**Depends on:** None  
**Who does it:** Cursor, in a fresh chat  
**Gate:** Parked until a bought asset pack is actually used, unless John says add it now.  

Read `docs/cursor-tasks/00-README.md` and `docs/cursor-tasks/HISTORY.md` first. Its global rules apply here and win over anything in this brief.

## Goal
The game's terms say players may not extract, download or redistribute bundled art and interface assets, so licences such as GameDev Market's are honoured.

## Background
GDM and similar licences require that bought assets are never exposed as a download, and ban raw-file resale, logos, NFTs and AI training. Terms live in docs/legal/terms-of-service.md and are served through src/legal/legalDocs.ts. The legal pages still carry draft placeholders (legal entity, postal address): do not fill those in; that is John's call. Nothing has been bought yet.

**Previous attempts:** none found in HISTORY.md.

## Files you may read
- docs/legal/terms-of-service.md
- src/legal/legalDocs.ts
- src/components/LegalPage.tsx

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- docs/legal/terms-of-service.md (add one short clause)
- src/legal/legalDocs.ts (only if the terms text is duplicated there; keep one source of truth)

Nothing else, and no new files except those listed.

## Acceptance criteria
- One plain clause: game art, interface and other bundled assets are licensed for use inside the game only, and may not be extracted, copied, redistributed, or used to train AI.
- No other legal text changed.

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, and the targeted tests (`npx vitest run <changed test files>`).
- Real check (Synapticgm or John, after review; Cursor does not run it): a short live game on www.synapticgm.com or the PR's Vercel preview, focused on prose and read by a person: open the Terms page; a person reads the clause.

## Forbidden
- Filling in the legal entity or address placeholders.
- Any other legal change.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Auto.

## Branch and PR
- Branch: `cursor/11-terms-no-extraction-line` from the latest `main`.
- PR title: `[11] Terms: no-extraction line for bought assets`.
- PR body: root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
