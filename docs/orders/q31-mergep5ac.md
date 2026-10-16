# q31-mergep5ac

Merged `p-5ac` (`facdd7bb`, from main `7d3bacaa`) into `main` with `git merge --no-ff p-5ac`. Main was already checked out. No checkout, rebase, reset, stash, or force. Uncommitted edits in `choiceCompiler.ts`, `qualityGovernance.ts`, `pyoaSpine.ts`, and the playtest tests were not staged. The merge did not need those files, so it was not aborted.

This is a play change. The writer may invent a person or a thing that fits the world, and the engine remembers it. A thing that belongs only to another setting is still refused. Stamp `2026-10-16z8` (was `2026-10-16z7`).

Branch reports: `docs/orders/q31-P5a.md`, `docs/orders/q31-P5c.md`. The branch's `tt-cut-log` entries (P-5a/c, P-5d, P-5e) are kept.

John's artistic-licence decision (P-5 design note) is the rule this merge keeps: register a fitting invention, refuse only a clear setting break.

## Cause

`lineNameReason` (`src/game/tokenProse.ts`, before this merge) failed a role person the scene had not handed (`unbound-animate`) and the plain path failed an unhanded carried or found thing. A fitting passer-by, guard, rope, or key was stripped. `classifyTokenLine` / `isFullyClean` on main already take `playerWords` from the p-5 merge (`tokenProse.ts` around the pc-voice check). This branch adds the setting set `world` on the same functions.

## Conflicts

1. **`src/game/tokenProse.ts` — new thing helpers before `lineOpensOnFactLabel`.** Main had no text there. Kept `thingHeads`, `lineHasOutOfWorldThing`, and `introducedThings` from `p-5ac`.
2. **`tokenLineVerdicts`.** Main passed `packet.playerAction`. The branch passed `offSettingWords(state)`. The call now passes both, in that order.
3. **`lineVoicesPc` against the named-person helpers.** Kept main's `lineVoicesPc` (position walk, `playerWords`). Kept the branch's `NAMED_PERSON` grammar, `namedPersonCandidates`, and `introducedNamedPeople`. `lineNameReason` returns only `'capital'`. A named person in a person slot is registered. A name that clashes with someone known, or a name after a preposition or article, still fails, so the atlas stays the place authority.
4. **`classifyTokenLine` and `isFullyClean`.** Both parameters stay: `playerWords`, then `world`. Every call in `acceptTokenOrLedgerStory` passes `packet.playerAction` and `offSettingWords(state)`. `writerIntroductions.test.ts` passes the setting set in the `world` slot.
5. **`src/game/useGame.ts` (commit, ~4703).** Main runs `advanceSceneLedger` then `stampSceneLedger`. The branch replaced that with `registerWriterIntroductions(stampSceneLedger(...))`. Kept the ledger advance and stamp, then registered introductions on that state.
6. **`src/game/fateAutoplay.ts` (same commit, ~2081).** Same resolution as live play.

`docs/orders/tt-cut-log.md`, `types.ts`, and the bank edits auto-merged. No conflict in the uncommitted files.

## Fix

After an accepted beat, `registerWriterIntroductions` (`src/game/writerIntroductions.ts:13`) adds each introduced role or named person to `npcMemories` at the current place and each carried or found thing to `sceneFacts.props`. `offSettingWords` (`src/game/settingVocabulary.ts:85`) refuses a carried or found word that only other settings' bibles use, unless the story's records already hold a crossing (`GameState.crossedOver`, premise `summonIntent`, kit, registered props). `classifyTokenLine` (`src/game/tokenProse.ts:867`) still returns `pc-voice` from `playerWords` and `out-of-world` from `world`. The PC's own-kit check stays.

## Tests

`writerIntroductions.test.ts`, `writerNamedPeople.test.ts`, `writerCrossingPremise.test.ts`, and `pcVoice.test.ts` are in the full run. None of them failed.

## ruleCount TOTAL

Clean HEAD (worktree `.tmp-wt-mergep5ac`, removed after): files 487, lines 162857, regex 6901, newRegExp 378, lists 1187 (6246), fns 11743.

This merge, without the shared tree's other uncommitted edits: files 489, lines 163108, regex 6920, newRegExp 380, lists 1187 (6246), fns 11775.

lists match. Lines, regex, newRegExp, and functions rise with the setting check and the registration helpers (`settingVocabulary.ts`, `writerIntroductions.ts`, and the token-prose grammar). No new word list. `ROLE_NOUNS` stays detection-only, already logged as a later cut.

## Gates

| Gate | Result |
|---|---|
| vitest | 110 failing / 2865 passed / 1 pending. mergep5's saved run was 106 failing. The new introduction and pc-voice tests did not fail. `seed94InfestationClear` did not fire. The four extra names sit on playtest files this order was told not to touch (`playtest02r`, `playtest02z`, `playtest10c`, `playtest31n`). |
| replay bank | 62 failing / 565 passed / 28 pending (limit 64). Same failing count as mergep5. |
| tsc (`tsconfig.app.json`) | 552 (limit 552). No new errors in the merged files. |
| build | green. |

## Replay staging (R1–R16)

None of R1–R16 is the introduction / setting check. They stay out of this merge.

- R1 is a road-meeting brief.
- R2–R4 are dungeon card and motive-line cases.
- R5 stays blocked: no camp tape.
- R6 stays blocked in `replay-case-staging.md` (shop price tape).
- R7 is the self-kill guard.
- R8–R16 are wellbeing flags.

## NEXT

- `ROLE_NOUNS` / `UNBOUND_ANIMATE` are still the detector for who gets registered. The cut log already marks that as a later cut.
- The setting check and the named-person slot are still regexes. A position walk would bring regex and `newRegExp` back to the HEAD totals.
- Bibles still have no era or tech field. The design note's `setting.era/tech` idea is not in this merge.

## Ship

Stamp `2026-10-16z8`. Edge `types.ts` synced (`crossedOver`). `gm-turn` deploy follows because that edge file changed.

TT_DONE
