# 13 — One final function returns exactly 4 / 4 / 3 options

**Phase:** Phase 3, part B  
**Depends on:** 12  
**Who does it:** Cursor, in a fresh chat  
**Gate:** gm-turn deploy needs John's yes.  

Read `docs/cursor-tasks/00-README.md` and `docs/cursor-tasks/HISTORY.md` first. Its global rules apply here and win over anything in this brief.

## Goal
One function returns exactly 4 options for LitRPG and RPG and 3 for tabletop. Every other count, cap, floor and pad is deleted.

## Background
The count is set in at least five places: fourSlotPads.ts; playerOptions.ts (`declaredCap`, `FILLER_LABELS`, `isProtectedOption`); openingEstablishment.ts ~279 and openingWriterNotes.ts ~14-15 (`dnd ? 3 : 4`); caps of 6 and floors of 3 in choiceCompiler.ts and choiceRanking.ts; `padChoicesToCount` in choicePipeline.ts ~1362. Audit 28, 37, 43b, P11. Exceptions (death saves, first-fight choice, a road with a waiting threat) are John's decision: add a typed exceptions hook with none enabled and list candidates in the PR. Absorbs 'Short pads', the camp off-pad loop (with 19) and 'Hero Awakening name button crowded out' (the name moves to Setup in 32).

**Previous attempts:** see HISTORY.md H1, H3. FOURSLOT 1–6 (2–3 Nov) tried 'always four slots' by adding a sixth layer (`fourSlotPads.ts`) and filling gaps with filler, streak caps and starve rules. It ended MISS. This brief differs only if it deletes the other count owners and every slot is a legal, scene-grounded action from brief 12. No invented or dead chips (absent people, unvisited places), no filler-label pool, no streak counter. Your PR must say how this approach differs from those attempts.

## Files you may read
- src/game/fourSlotPads.ts
- src/game/playerOptions.ts
- src/game/choiceCompiler.ts
- src/game/choiceRanking.ts
- src/game/choicePipeline.ts
- src/game/openingEstablishment.ts (count lines only)
- src/game/openingWriterNotes.ts (count lines only)
- src/components/CenterPanel.tsx (composer)

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- new: src/game/finalOptions.ts (the one function)
- src/game/fourSlotPads.ts
- src/game/playerOptions.ts
- src/game/choiceCompiler.ts
- src/game/choiceRanking.ts
- src/game/choicePipeline.ts
- src/game/openingEstablishment.ts
- src/game/openingWriterNotes.ts
- the `fourSlot*` and `padChoicesToCount` test files (replace with one property test plus id tests)
- edge twins only via `npm run sync:gm-edge`

Nothing else, and no new files except those listed.

## Edge twins
If you change a `src/game/` file that has a twin in `supabase/functions/_shared/gm/`, run `npm run sync:gm-edge` and commit the regenerated twin with it. Never hand-edit a twin. The PR must then say "gm-turn deploy needed — John's yes required".

## Acceptance criteria
- `rg -n "dnd \? 3 : 4|padChoicesToCount|declaredCap|FILLER_LABELS|GENERIC_FILLER_PAD" src` returns nothing.
- One property test: for any state, final options are 4 (LitRPG, RPG) or 3 (tabletop).
- The composer shows only these options plus the free-text input.

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, and the targeted tests (`npx vitest run <changed test files>`).
- `npm run check:gm-edge` must print "edge copies match".
- Real check (Synapticgm or John, after review; Cursor does not run it): a short live game on www.synapticgm.com or the PR's Vercel preview, focused on prose and read by a person: 20 turns per mode: exactly 4/4/3 on every normal turn, and the options make sense.

## Forbidden
- Any count or priority logic outside finalOptions.ts.
- Keeping old pad tests green with special cases.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Top model to plan; Auto to edit.

## Branch and PR
- Branch: `cursor/13-p3-one-433-function` from the latest `main`.
- PR title: `[13] One final function returns exactly 4 / 4 / 3 options`.
- PR body: root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
