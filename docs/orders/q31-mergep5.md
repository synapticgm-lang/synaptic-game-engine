# q31-mergep5

Merged `p-5` (`3482ce01`, parent `8d55da63`, from main `7d3bacaa`) into `main` with `git merge --no-ff p-5`. Main was already checked out. No checkout, rebase, reset, stash, or force. Uncommitted edits in `choiceCompiler.ts`, `qualityGovernance.ts`, `pyoaSpine.ts`, and the playtest tests were not staged. The merge did not need those files, so it was not aborted.

This is a play change (a narration line must not put words in the player's mouth). Stamp `2026-10-16z7` (was `2026-10-16z6`). `tokenProse.ts` is not an edge copy, so `gm-turn` was not deployed.

Branch report: `docs/orders/q31-P5b.md`. Branch `p-5` had no `tt-cut-log` entries of its own. The existing log stays, plus the regex cut below.

## Cause

`classifyTokenLine` (`src/game/tokenProse.ts`, before this merge around the speech-shape check) and `plainLineFactProblem` only blocked the PC as a speech speaker. A narration line could still quote the player (`Jax leaned in. "The name is Jax,"` or `"…," you say`). P-5b adds one check, `lineVoicesPc` (`src/game/tokenProse.ts:672`), read by position in the line.

## Conflicts

None. Git auto-merged `src/game/tokenProse.ts` onto main's current functions (`tokenLineVerdicts`, `plainLineFactProblem`, `classifyTokenLine`, `isFullyClean`, `acceptTokenOrLedgerStory`). `src/game/pcVoice.test.ts` came in clean. They do not overlap the uncommitted tree.

After the merge, the branch's regexes inside `lineVoicesPc` (`split(/\s+/)`, two `new RegExp`, and two `replace` folds) were replaced by the same position walk, so regex and `newRegExp` stay flat. Logged in `docs/orders/tt-cut-log.md`.

## Fix

`lineVoicesPc` (`tokenProse.ts:672`) fails a narration line whose quote's own clause, or the sentence just before it, opens on the PC's first name or on "You"/"you", or whose closing quote is tagged ", you say". A quote the player's own input holds (`packet.playerAction`) passes. `classifyTokenLine` (`tokenProse.ts:800`) returns `pc-voice`. `plainLineFactProblem` (`tokenProse.ts:768`) returns "words put in the player's mouth". The existing single repair request is unchanged. No speech-verb list.

## Tests

`src/game/pcVoice.test.ts` (4) passed.

## ruleCount TOTAL

Clean HEAD before the merge (worktree `.tmp-wt-mergep5b`, removed after): files 487, lines 162785, regex 6901, newRegExp 378, lists 1187 (6246), fns 11738.

This tree after the position walk (worktree `.tmp-wt-mergep5`, removed after): files 487, lines 162857, regex 6901, newRegExp 378, lists 1187 (6246), fns 11743.

regex, newRegExp, and lists match. Lines and functions rise by five: `lineVoicesPc` plus the fold, word, who, and break walks inside it.

## Gates

| Gate | Result |
|---|---|
| vitest | 106 failing / 2859 passed / 1 other. mergeop1's saved run was 108 failing. No pc-voice test failed. `seed94InfestationClear` did not fire. |
| replay bank | 62 failing / 565 passed / 28 other (limit 64). Same as mergeop1. |
| tsc (`tsconfig.app.json`) | 552 (limit 552). No errors in `tokenProse.ts`. |
| build | green. |

## Replay staging (R1–R16)

None of R1–R16 is the pc-voice check. They stay out of this merge.

- R1 is a road-meeting brief (OP-1 / motive lines), not a player quote.
- R2–R4 are dungeon card and motive-line cases.
- R5 stays blocked: no camp tape.
- R6 stays blocked in `replay-case-staging.md` (shop price tape).
- R7 is the self-kill guard (Order S).
- R8–R16 are wellbeing flags, not this gate.

## NEXT

- P-5a and P-5c are on branch `p-5ac`, not this merge.
- A named invented person still fails `capital` until that branch merges.

## Ship

Stamp `2026-10-16z7` is on `main` (`2826f9fc`). No edge file changed, so `gm-turn` was not deployed.

Vercel project `project` built `2826f9fc`. Vercel project `synaptic-game-engine` (the one that serves www) returned `Deployment rate limited — retry in 24 hours` and was not retried. Live `https://www.synapticgm.com/version.json` is still `2026-10-16z6`.

TT_STOP
