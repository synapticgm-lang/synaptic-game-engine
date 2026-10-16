# q32-merge37c

Merged branch `n4fix` (tip `6b26859d`) into `main` with `git merge --no-ff n4fix`. Main was already checked out. No checkout, rebase, reset, stash, or force. The merge commit is `9ea34712`.

This is a play change. A blocked writer page paints this turn's travel record before the look line, and a foe speaks only when its SRD Languages line names a language. Stamp `2026-10-16z15` (was `2026-10-16z14`). `completedEventPacket.ts` and `types.ts` are edge copies, so `gm-turn` is deployed.

Uncommitted edits in `choiceCompiler.ts`, `qualityGovernance.ts`, `pyoaSpine.ts`, and the playtest tests were not staged. The merge did not need those files.

## Cause

`src/game/completedEventPacket.ts` `lastResortStoryBody` (was line 2388). Every non-fight page came from `topicAdvancePool` (the player's words, or `NO_DESCRIPTION_LOOK_LINE`). The turn's travel record was never read, so a rest or a leg came out as "You saw nothing that called for a closer look" or "stayed on On the road".

`src/game/completedEventPacket.ts` `compileRefEnum` (was line 686). Every live foe was class `person`. `src/data/srd/srd521.json` had dropped the Languages line, so nothing could say a beast does not speak.

## Conflicts

`src/game/ttFix37.test.ts` — add/add. Main already had the N4 camp-span test from q32-merge37b. `n4fix` added the same N4 test plus the S1 speech test. Kept both, and added the N3b travel-record page check and the `creature` speaker check.

No other conflicts.

## Fix

`lastResortStoryBody` paints `travelBeatFact` through `lastResortUsable` before the look pool. A town rest with no travel beat still uses the pool.

`srdExtract.mjs` keeps `languages`. `srdMonsters.foeCanSpeak` is true only when that line names a language. Empty, `none`, a dash-only line, or "can't speak" is no speech. A foe with no SRD block speaks only when its kind is humanoid. The first time the foe is handed to the writer, that boolean is stored on `activeEncounter.canSpeak`. Non-speakers use the `creature` ref class (`actor` and `addressed`, not `speaker`).

The edge copy does not load the SRD file. It reads `canSpeak`. The client is the one that sets it from the stat block.

`replaceAll` is not in this tsconfig lib, so the apostrophe fold is `split`/`join`.

## Tests

`src/game/ttFix37.test.ts`: S1 (spider, stalker, and restless dead do not speak; bandits and goblins do; a creature is not a speaker). N3b (the last-resort page is this turn's travel fact). N4 stays.

## ruleCount TOTAL

Clean parent `98ee6d12` is the baseline. `srdMonsters.ts` stays 173 lines, regex 10, newRegExp 0, lists 0. Functions 12 → 10 (`blockById` and the private `mod` arrow are gone; `foeCanSpeak` is the one added). `completedEventPacket.ts` stays 2727 lines, regex 192, newRegExp 1, lists 1 (3), functions 262. The edge packet stays 2727 lines and gains the one-line `canSpeak` reader (functions 262 → 263). `types.ts` stays 2212 lines. The edge `types.ts` stays 2215 lines (`canSpeak` replaces the blank that was removed).

TOTAL functions fall by 1. Lines, regex, newRegExp, and lists do not rise.

## Gates

Run on the shared tree. Replay bank and vitest see the fate-autoplay tapes and the existing uncommitted edits.

| Gate | Result |
|---|---|
| vitest (shared tree) | 108 failing / 2904 passed / 1 pending. q32-merge37b was 108 failing / 2902 passed / 1 pending. The two new passes are N3b and S1. No failure names the speech check or the travel-record page. |
| replay bank | 62 failing / 565 passed / 28 pending (limit 64). Same failing count as q32-merge37b. |
| tsc (`tsconfig.app.json`) | 552 (limit 552). The first run was 553 (`replaceAll`); the split/join fix is the one fix run. |
| build | green |

## Replay staging (R1–R16)

None of R1–R16 is this travel-record page or the Languages class. They stay out of this merge.

- R1 is a road-meeting brief.
- R2–R4 are dungeon-card and motive-line cases.
- R5 stays blocked: no camp tape.
- R6 stays blocked in `replay-case-staging.md` (shop price tape).
- R7 is the self-kill guard.
- R8–R16 are wellbeing flags.

## NEXT

A town rest with no `travelBeat` still falls through to the look pool. The rest receipt has no plain-sentence form yet.

## Ship

Stamp `2026-10-16z15`. Edge copies of `completedEventPacket.ts` and `types.ts` changed, so `gm-turn` is deployed. Live `version.json` is recorded after the production build.
