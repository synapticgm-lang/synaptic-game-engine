# 03 — Per-game names and pronouns from cast data; delete the renamer and name guards

**Phase:** Phase 1 (opening slices, part C: per-game names)  
**Depends on:** 01  
**Who does it:** Cursor, in a fresh chat  

Read `docs/cursor-tasks/00-README.md` first. Its global rules apply here and win over anything in this brief.

## Goal
Names and places change between games because minting fills cast ids, and pronouns come from cast data. Delete the renamer, pronoun reader and catalog-name guard.

## Background
Audit rows 15 (`DURABLE`/`PASSER`, heirlooms.ts ~11-12), 29 (`COMMON_STORY_WORDS`, `PLACE_SUFFIX`, `FACTION_WORDS`, `TITLE_STOP` in liveOpening.ts and openingInstance.ts), 30d (openingWriterNotes.ts lexeme lists), 30e (`GENERIC_HUB_ALIAS`, outdoorHubs.ts), 30f (`extractTitleNames`), 31 (`prosePronounForName`), 32 (openingCatalogGuard.ts hard-coded NPC names), 33b (`applyReplacements` him→her), 33c (`peopleFromWhoHere`, `impliedRoleFromWhoHere`). PR #45's fixed per-race name table is kept (it is real data).

## Files you may read
- src/game/liveOpening.ts
- src/game/openingInstance.ts
- src/game/openingWriterNotes.ts
- src/game/openingCatalogGuard.ts
- src/game/heirlooms.ts
- src/game/outdoorHubs.ts
- src/game/pcNamePicker.ts
- src/game/campaignSeed.ts
- src/data/campaigns/types.ts
- src/game/liveOpening*.test.ts
- src/game/openingInstance*.test.ts
- src/game/edgeCastNames.test.ts

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- src/game/liveOpening.ts
- src/game/openingInstance.ts
- src/game/openingWriterNotes.ts
- src/game/openingCatalogGuard.ts (delete if empty)
- src/game/heirlooms.ts
- src/game/outdoorHubs.ts (hub aliases as data with ids)
- the matching *.test.ts files above (rewrite as data tests)
- edge twins only via `npm run sync:gm-edge`

Nothing else, and no new files except those listed.

## Edge twins
If you change a `src/game/` file that has a twin in `supabase/functions/_shared/gm/`, run `npm run sync:gm-edge` and commit the regenerated twin with it. Never hand-edit a twin. The PR must then say "gm-turn deploy needed — John's yes required".

## Acceptance criteria
- All the listed lists and regexes are gone.
- Cast pronouns and durability are read from data.
- Hub aliases are data with ids.
- Two games from the same campaign get different minted names and places.

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, and the targeted tests (`npx vitest run <changed test files>`).
- `npm run check:gm-edge` must print "edge copies match".
- Real check (Synapticgm or John, after review; Cursor does not run it): a short live game on www.synapticgm.com or the PR's Vercel preview, focused on prose and read by a person: 10 new games across 3 campaigns. A person reads every page 1 and journal: no doubled names, no wrong pronouns, no catalog NPC names, names differ per game.

## Forbidden
- Any new name list, including a 'safe names' list.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Top model to plan (many files), then Auto. If the diff passes about 600 lines, split into 03a (names and places) and 03b (pronouns and catalog guard), one PR each.

## Branch and PR
- Branch: `cursor/03-cast-names-pronouns-as-data` from the latest `main`.
- PR title: `[03] Per-game names and pronouns from cast data; delete the renamer and name guards`.
- PR body: root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
