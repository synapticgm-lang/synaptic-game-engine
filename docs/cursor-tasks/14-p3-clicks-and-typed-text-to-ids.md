# 14 — Clicks and typed text resolve to action and item ids, not phrases

**Phase:** Phase 3, part C  
**Depends on:** 12, 13  
**Who does it:** Cursor, in a fresh chat  
**Gate:** gm-turn deploy needs John's yes.  

Read `docs/cursor-tasks/00-README.md` and `docs/cursor-tasks/HISTORY.md` first. Its global rules apply here and win over anything in this brief.

## Goal
A click sends its action id. Typed free text resolves to action and item ids. Delete the phrase recognisers.

## Background
Audit 34 (`CLASSIC_REFUSE`, `OFFER_NOUN`, `TIGHT_ACCEPT_PHRASE` in openingOfferRecognize.ts; openingEstablishment.ts ~1084), 28b (`CONSUMABLE` regex, typedFreeText.ts ~116), P10 (`classifyVerb`, completedEventPacket.ts ~342). Rule 8: free text always, including speech in fights.

**Previous attempts:** see HISTORY.md H2. Same history as brief 12: label matching survived beside action ids since 15 Oct. The PR lists every recogniser deleted, with `rg` proof. Your PR must say how this approach differs from those attempts.

## Files you may read
- src/game/openingOfferRecognize.ts
- src/game/typedFreeText.ts
- src/game/intentParser.ts
- src/game/completedEventPacket.ts (classifyVerb only)
- src/game/finalOptions.ts
- src/game/useGame.ts (click handler only)

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- src/game/openingOfferRecognize.ts (delete)
- src/game/typedFreeText.ts
- src/game/completedEventPacket.ts (packet uses the action id)
- src/game/useGame.ts (click handler only)
- the recognition tests (rewrite as id tests)
- edge twins only via `npm run sync:gm-edge`

Nothing else, and no new files except those listed.

## Edge twins
If you change a `src/game/` file that has a twin in `supabase/functions/_shared/gm/`, run `npm run sync:gm-edge` and commit the regenerated twin with it. Never hand-edit a twin. The PR must then say "gm-turn deploy needed — John's yes required".

## Acceptance criteria
- A click never goes through text matching.
- Typed text maps to ids using the engine's own action and item lists from state, not an English word list.
- classifyVerb is gone; the packet uses the action id.

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, and the targeted tests (`npx vitest run <changed test files>`).
- `npm run check:gm-edge` must print "edge copies match".
- Real check (Synapticgm or John, after review; Cursor does not run it): a short live game on www.synapticgm.com or the PR's Vercel preview, focused on prose and read by a person: 20 turns per mode with at least 5 typed actions each, including one line of speech in a fight: the engine did what was typed.

## Forbidden
- A synonym or verb list to classify typed text.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Top model to plan the typed-text design; Auto to edit.

## Branch and PR
- Branch: `cursor/14-p3-clicks-and-typed-text-to-ids` from the latest `main`.
- PR title: `[14] Clicks and typed text resolve to action and item ids, not phrases`.
- PR body: root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
