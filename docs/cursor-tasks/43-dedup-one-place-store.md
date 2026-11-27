# 43 — One place store keyed by place id

**Phase:** De-dup (before brief 31)  
**Depends on:** 40  
**Who does it:** Cursor, in a fresh chat  
**Gate:** gm-turn deploy needs John's yes.  

Read `docs/cursor-tasks/00-README.md`, `docs/cursor-tasks/CODING.md`, `docs/cursor-tasks/HISTORY.md` and `docs/cursor-tasks/DUPLICATION.md` first. Their rules apply here and win over anything in this brief.

Method: follow CODING.md (house rules for Cursor, root cause first, test first, verify before "done", one source and no duplication). Check DUPLICATION.md for the copies this brief removes.

## Goal
Every place the player can know or reach lives in one store keyed by place id. The other place lists are deleted or become readers.

## Background
DUPLICATION.md D10. Today: `state.places` (`PlaceRecord`), `placeRegistry.ts` ("one registration entry"), `placeAuthority.ts`, `worldMapAuthority.ts`, `locationMemory.ts`, `state.discoveredLocations`, `state.townsfolkPlaces`, `state.locationSheet`, the hub lists (`hubsForBible*`) and the location half of `entityRegistry.ts`. Brief 31 adds kind and role to places, so it must land on one store, not five.

**Previous attempts:** see HISTORY.md H13. Travel and place bugs were fixed per list. This brief makes one list. Your PR must say how this approach differs from those attempts.

## Files you may read
- src/game/types.ts (place-related state types)
- src/game/placeRegistry.ts
- src/game/placeAuthority.ts
- src/game/worldMapAuthority.ts
- src/game/locationMemory.ts
- src/game/entityRegistry.ts (location part)
- src/game/outdoorHubs.ts (search `hubsForBible`)

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- src/game/placeRegistry.ts (the store)
- the other files above (delete, or reduce to readers)
- src/game/types.ts (remove `discoveredLocations` and `townsfolkPlaces` once they're derived from the store)
- the existing save-load migration (name the file in your plan)
- their tests
- edge twins only via `npm run sync:gm-edge`

Nothing else, and no new files except those listed.

## Acceptance criteria
- One place type and one store.
- `discoveredLocations` and `townsfolkPlaces` are derived, not stored.
- Old saves load.
- The PR lists the deleted lists.
- Type check and lint pass. `npm run check:gm-edge` prints "edge copies match".

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, `npm run check:gm-edge`, and the targeted tests (`npx vitest run <changed test files>`).
- Real check (Synapticgm or John, after review; Cursor does not run it): a 20-turn game with travel between at least three places. A person checks that the map, exits and prose agree on where the player is and where they can go.

## Forbidden
- Leaving the old copy next to the new single source, or adding any new copy.
- Running any script, autoplay or live-drive that calls a model.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Top model to plan; Auto to edit.

## Branch and PR
- Branch: `cursor/43-dedup-one-place-store` from the latest `main`.
- PR title: `[43] One place store keyed by place id`.
- PR body: "How this differs from earlier attempts", "Duplication removed" (file:symbol), root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, "Structural decisions" (if any), and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
