# 06 — Delete canned fallback prose; speech rendered once as a typed beat

**Phase:** Phase 2 (no canned text)  
**Depends on:** 05  
**Who does it:** Cursor, in a fresh chat  
**Gate:** gm-turn deploy needs John's yes.  

Read `docs/cursor-tasks/00-README.md`, `docs/cursor-tasks/CODING.md`, `docs/cursor-tasks/HISTORY.md` and `docs/cursor-tasks/DUPLICATION.md` first. Their rules apply here and win over anything in this brief.

Method: follow CODING.md (house rules for Cursor, root cause first, test first, verify before "done", one source and no duplication). Check DUPLICATION.md for the copies this brief removes.

## Goal
Remove the canned prose that covers misses, so every page is live AI prose or an honest Try again. Speech becomes a typed beat rendered once.

## Background
Audit P7 (`STITCH_BANKS`, about 55 lines, and `cardPageParagraph`, completedEventPacket.ts ~1834-2291), P8 (`BANNED_FALLBACK_STUB`, sealedManifest.ts ~162), 37c (empty 'X said' quote removal, writerTurn.ts ~1031). About 19 test files pin canned fallback text.

**Previous attempts:** see HISTORY.md H5, H10. Stitch removal was claimed on 29 Sep (29u) and fallbacks were cut on 28 Sep (28g), yet both are still on main. The PR must show an `rg` for `STITCH_BANKS|cardPageParagraph|BANNED_FALLBACK_STUB|stitchOpening` returning nothing, and must not add a replacement fallback under another name. Your PR must say how this approach differs from those attempts.

## Duplication to remove
DUPLICATION.md D20: `openingStitch.ts` / `STITCH_BANKS` is a second writer beside the live AI. Delete what this brief covers, and leave nothing that can write opening prose except the writer.

## Files you may read
- src/game/completedEventPacket.ts
- src/game/sealedManifest.ts
- src/game/writerTurn.ts
- src/game/liveOpening.ts
- test files found by `rg -l "STITCH_BANKS|cardPageParagraph|BANNED_FALLBACK_STUB" src`

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- src/game/completedEventPacket.ts
- src/game/sealedManifest.ts
- src/game/writerTurn.ts
- only the test files that pin canned text (delete those assertions)
- edge twins only via `npm run sync:gm-edge`

Nothing else, and no new files except those listed.

## Edge twins
If you change a `src/game/` file that has a twin in `supabase/functions/_shared/gm/`, run `npm run sync:gm-edge` and commit the regenerated twin with it. Never hand-edit a twin. The PR must then say "gm-turn deploy needed — John's yes required".

## Acceptance criteria
- STITCH_BANKS, cardPageParagraph and BANNED_FALLBACK_STUB are gone.
- No fixed prose reaches the page on any path.
- Code no longer adds quotes or said-tags.

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, and the targeted tests (`npx vitest run <changed test files>`).
- `npm run check:gm-edge` must print "edge copies match".
- Real check (Synapticgm or John, after review; Cursor does not run it): a short live game on www.synapticgm.com or the PR's Vercel preview, focused on prose and read by a person: 10 openings and 10 turns: no canned line appears and speech is not doubled.

## Forbidden
- Replacing one canned bank with another.
- Rewording a fixed line (that is a phrase patch).
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Auto.

## Branch and PR
- Branch: `cursor/06-remove-canned-opening-text` from the latest `main`.
- PR title: `[06] Delete canned fallback prose; speech rendered once as a typed beat`.
- PR body: "How this differs from earlier attempts", "Duplication removed" (file:symbol, or "none" and why), root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, "Structural decisions" (if any), and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
