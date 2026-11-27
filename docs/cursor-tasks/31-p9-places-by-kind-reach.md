# 31 — Places carry a kind and role; map template by kind; shops, recruiting and dungeons reachable

**Phase:** Phase 9, part B  
**Depends on:** 30  
**Who does it:** Cursor, in a fresh chat  

Read `docs/cursor-tasks/00-README.md` and `docs/cursor-tasks/HISTORY.md` first. Its global rules apply here and win over anything in this brief.

## Goal
Places and rooms carry kind and role; map templates are chosen by kind (naval decks for ships, one template per building type); world outlines declare a setting; shops, recruiting and dungeons are reachable, with a Trade control in every mode when a merchant is here.

## Background
Audit 19 (`HOLDING`/`MANY`, dungeonRescue.ts ~20-21), 36 (`ABOARD`, `LAND_PLACE_NAME`, vesselPlace.ts ~13, placeTemplates.ts ~467). Absorbs 'Shop/recruit/dungeon reach'. Q6: `pickWorldOutline` must not hash a LitRPG seed onto a modern map. Travel terrain costs are designed but not approved as a separate build: leave them out. Open for John: System store or NPC merchant for LitRPG and RPG — do not decide it.

**Previous attempts:** see HISTORY.md H13. Your PR must say how this approach differs from those attempts.

## Files you may read
- src/game/vesselPlace.ts
- src/game/placeTemplates.ts
- src/game/dungeonRescue.ts
- src/components/MerchantWindow.tsx
- src/components/WorldMapModal.tsx
- src/components/DungeonMapModal.tsx
- src/data/worldOutlines.ts
- src/game/worldAtlas.ts

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- src/game/vesselPlace.ts
- src/game/placeTemplates.ts
- src/game/dungeonRescue.ts
- src/data/worldOutlines.ts (pickWorldOutline: outlines declare a setting)
- src/game/worldAtlas.ts
- src/components/MerchantWindow.tsx (Trade reach only)
- related tests
- edge twins only via `npm run sync:gm-edge`

Nothing else, and no new files except those listed.

## Edge twins
If you change a `src/game/` file that has a twin in `supabase/functions/_shared/gm/`, run `npm run sync:gm-edge` and commit the regenerated twin with it. Never hand-edit a twin. The PR must then say "gm-turn deploy needed — John's yes required".

## Acceptance criteria
- Place kind is a field; nothing detects a kind from a name.
- Ships get deck plans.
- Shops, recruiting and dungeons are reachable in all modes.

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, and the targeted tests (`npx vitest run <changed test files>`).
- `npm run check:gm-edge` must print "edge copies match".
- Real check (Synapticgm or John, after review; Cursor does not run it): a short live game on www.synapticgm.com or the PR's Vercel preview, focused on prose and read by a person: board a ship and check the deck plan; visit a shop, recruit, and enter a dungeon in each mode.

## Forbidden
- Detecting a place kind from its name.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Top model to plan; Auto to edit. If large, put shop/recruit/dungeon reach in its own PR (31b).

## Branch and PR
- Branch: `cursor/31-p9-places-by-kind-reach` from the latest `main`.
- PR title: `[31] Places carry a kind and role; map template by kind; shops, recruiting and dungeons reachable`.
- PR body: root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
