# 12 — Options carry a legal engine action id; the writer words them

**Phase:** Phase 3, part A  
**Depends on:** 05, 06  
**Who does it:** Cursor, in a fresh chat  
**Gate:** gm-turn deploy needs John's yes.  

Read `docs/cursor-tasks/00-README.md`, `docs/cursor-tasks/CODING.md`, `docs/cursor-tasks/HISTORY.md` and `docs/cursor-tasks/DUPLICATION.md` first. Their rules apply here and win over anything in this brief.

Method: follow CODING.md (house rules for Cursor, root cause first, test first, verify before "done", one source and no duplication). Check DUPLICATION.md for the copies this brief removes.

## Goal
Each option shown is a pair: a legal engine action id plus the writer's wording. Engine chips no longer overwrite the writer's options.

## Background
Options are plain strings and clicks are recognised by phrase. Audit G8 (`CHOICE_TIER_PROMPT_RULES`, choiceTierRules.ts, 9 NEVER rules), 30b (`chipFollowsProse`, `OPTION_STOP`, `INSPECT_VERBS`), 30c (`fallbackOpeningPads`), 34b (`properNamesInOption`). Open question: does the writer see the exact words the player typed? (completedEventPacket.ts ~1680 blanks the PLAYER line.) Report what you find; do not change it here.

**Previous attempts:** see HISTORY.md H1, H2, H10. Action ids already exist (q37-C1b `actionId` repeat suppression, 17 Oct; q31-RC3 'chips recognised by their builder and resolved action', 15 Oct), but the phrase recognisers were never deleted and #34 added new ones. Build on the existing `actionId`: no second id field. Delete the recognisers in this PR. T10ECHO (31 Oct) blanked the player's typed words from the packet. Report whether that is why replies miss what the player said, but don't change it here. Your PR must say how this approach differs from those attempts.

## Duplication to remove
DUPLICATION.md D5: options get ids here, and the count stays with brief 13. Don't add any new cap, floor or `slice(0, N)`.

## Files you may read
- src/game/playerOptions.ts
- src/game/choicePipeline.ts
- src/game/choiceCompiler.ts
- src/game/choiceTierRules.ts
- src/game/systemPrompt.ts
- src/game/liveOpening.ts (option section)
- src/game/chipLegality.ts
- src/game/types.ts (option types only)
- src/game/writerTurn.ts

Open nothing else. If you need another file, stop and name it and why.

## Files you may change
- src/game/types.ts (option type: actionId plus label)
- src/game/playerOptions.ts
- src/game/choicePipeline.ts
- src/game/choiceTierRules.ts (delete)
- src/game/systemPrompt.ts (drop the tier rules; ask for options against the given legal action ids)
- src/game/liveOpening.ts (option section only)
- tests for the option type
- edge twins only via `npm run sync:gm-edge`

Nothing else, and no new files except those listed.

## Edge twins
If you change a `src/game/` file that has a twin in `supabase/functions/_shared/gm/`, run `npm run sync:gm-edge` and commit the regenerated twin with it. Never hand-edit a twin. The PR must then say "gm-turn deploy needed — John's yes required".

## Acceptance criteria
- Every displayed option has an actionId the engine says is legal now.
- CHOICE_TIER_PROMPT_RULES, fallbackOpeningPads and the listed recognisers are deleted.
- The writer's wording is kept when its action id is legal.

## How to verify
- Sanity only, not proof: `npm run typecheck`, `npm run lint`, and the targeted tests (`npx vitest run <changed test files>`).
- `npm run check:gm-edge` must print "edge copies match".
- Real check (Synapticgm or John, after review; Cursor does not run it): a short live game on www.synapticgm.com or the PR's Vercel preview, focused on prose and read by a person: 20 turns per mode (LitRPG, RPG, tabletop): options name what is on the page, at most one filler.

## Forbidden
- Matching option text to decide what it does.
- Adding prompt rules instead of ids.
- Anything the global rules forbid (word lists, timers, canned text, Fireworks, Gemini, secrets, spend, merging, deploying).

## Suggested model
Top model to plan; Auto to edit. If large, split into 12a (types and pipeline) and 12b (prompt and opening).

## Branch and PR
- Branch: `cursor/12-p3-options-on-action-ids` from the latest `main`.
- PR title: `[12] Options carry a legal engine action id; the writer words them`.
- PR body: "How this differs from earlier attempts", "Duplication removed" (file:symbol, or "none" and why), root cause and failing layer, files changed, what was deleted, sanity results, what the live check should look at, "Structural decisions" (if any), and "gm-turn deploy needed" if `supabase/functions/` changed.
- One PR for this brief only. Do not merge. Do not deploy.
