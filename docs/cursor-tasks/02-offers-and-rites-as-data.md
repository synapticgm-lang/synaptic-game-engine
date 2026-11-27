# 02 — Offers and rites read from data; delete the offer and rite parsers

**Phase:** Phase 1 (opening slices, part B: concrete offer chips)  
**Depends on:** 01  
**Who does it:** Cursor, in a fresh chat  

Read `docs/cursor-tasks/00-README.md` first. Its global rules apply here and win over anything in this brief.

## Goal
Concrete offer chips: the offer the NPC makes comes from the hook's offer items (with a carryable flag), and rite steps come from data. Delete the English parsers.

## Background
Audit rows 38 (`OFFER_LABEL_SKIP`, openingEstablishment.ts ~1875-1887), 39 (`attachItemsToCast` ACTION_VERB, openingInstance.ts ~506-550), 40 (`OFFER_PLACE_HEAD`, `OFFER_ABSTRACT_HEAD`, `offerHeadNoun`, openingEstablishment.ts ~1795-1818), 43 (rite split on 'and then|and|then', openingRite.ts ~142-143). Absorbs 'Mana Crystal before Register' (beat order is now data). Line numbers are from 16 Nov; find them by name.

## Files you may read
- src/game/openingEstablishment.ts
- src/game/openingInstance.ts
- src/game/openingRite.ts
- src/game/openingOffer.ts
- src/data/campaigns/types.ts
- src/game/openingOffer*.test.ts
- src/game/openingOfferAcceptTurn*.test.ts

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- src/game/openingEstablishment.ts
- src/game/openingInstance.ts
- src/game/openingRite.ts
- src/game/openingOffer.ts
- src/game/openingOffer*.test.ts and src/game/openingOfferAcceptTurn*.test.ts (rewrite as data tests; delete assertions that pin parser output)
- supabase/functions/_shared/gm/openingEstablishment.ts (only via `npm run sync:gm-edge`)

Nothing else, and no new files except those listed.

## Edge twins
If you change a `src/game/` file that has a twin in `supabase/functions/_shared/gm/`, run `npm run sync:gm-edge` and commit the regenerated twin with it. Never hand-edit a twin. The PR must then say "gm-turn deploy needed — John's yes required".

## Acceptance criteria
- The four named parsers are deleted, not wrapped.
- Offer chips name real offer items; only carryable items can be taken.
- Rite steps and beat order come from data.
- Net code goes down.

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, and the targeted tests (`npx vitest run <changed test files>`).
- `npm run check:gm-edge` must print "edge copies match".
- Real check (Synapticgm or John, after review; Cursor does not run it): a short live game on www.synapticgm.com or the PR's Vercel preview, focused on prose and read by a person: 5 new games: the offer chip names the item the NPC actually offers, and beats happen in the card's order.

## Forbidden
- Any replacement word list or regex over offer or rite text.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Auto. Top model only if the same test failure returns after a fix.

## Branch and PR
- Branch: `cursor/02-offers-and-rites-as-data` from the latest `main`.
- PR title: `[02] Offers and rites read from data; delete the offer and rite parsers`.
- PR body: root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
