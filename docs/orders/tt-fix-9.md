# tt-fix-9 — report

Order: `docs/orders/tt-fix-9-order.md` (reads `docs/orders/mode-tt-lap-12.md`). Commit `b5f4e88f`, stamp **2026-10-14u** (after live `2026-10-14t`). Pushed to `main`. No edge sync or `gm-turn` deploy: edge code did not change (`node scripts/sync-gm-edge-shared.mjs --check` → "edge copies match"; the edge `stateTx.ts` / `travelJourney.ts` are hand stubs). Live `https://www.synapticgm.com/version.json` reads `{"hud":"2026-10-14u","build":"2026-10-14u"}`. Deletions logged in `docs/orders/tt-cut-log.md` under "tt-fix-9" (restore from `68d01a47`).

This is a play change (stamp bumped, client deployed).

## 1. A finished quest and its Heroic Inspiration never reach STATUS

**Cause.** No shared point turned engine grants into STATUS lines; each feature wrote its own receipt string, and two of them write nothing:
- Tabletop quest-complete pays CR XP only, so `sandboxXp.pay()` writes no note when the amount is 0 (`src/game/sandboxXp.ts:246`). The Tainted Waters completion at T4 (lap 12 run C) produced no line.
- Heroic Inspiration is granted by `rules/houseRules.ts:77-88` `grantEarnedInspiration` from `quest-complete:` / `spine-ending:` award keys, but only inside `withHouseRules` at the start of the next turn (`:91-95`), silently. The sheet already starts with inspiration, so only `inspirationKeys` changed.
- The engine record (`stateTxLog`) had no inspiration or condition rows, and the headless commit (`fateAutoplay.headlessFateTurn`) never called `appendStateTxDiff` at all. The live path dumped every record row as a `Ledger:` line, so grants appeared there only as noise next to non-grant rows.

**Fix.** One shared commit point reports grants from the record.
- `src/game/stateTx.ts:123` the diff records a new condition (`Condition: X`); `:260` it records inspiration (`Heroic Inspiration: yours` / `already held`, with the reason "quest complete" / "ending reached" read from the new `inspirationKeys`).
- `src/game/stateTx.ts:295` `GRANT_KINDS` (quest reveal / complete / fail, item gain, condition, inspiration); `:305` `grantStatusKey`; `:315` `commitTurnRecord(previous, next, shown)`: for tabletop it grants earned inspiration at commit (same `grantEarnedInspiration`, so the start-of-turn call finds nothing new), diffs the record, and returns this turn's grant rows as STATUS lines, skipping any grant a line already shown names. A quest is matched by its whole summary, so a "Quest stage: …" line naming the quest does not hide the completion.
- Callers: live `src/game/useGame.ts:292` import, `:4640-4645` replaces the old `appendStateTxDiff` call and `Ledger:` dump; headless `src/game/fateAutoplay.ts:208` import, `:2072` the same call before the replay hash, lines added to the turn's STATUS.
- `src/game/systemLog.ts:217` core verbosity keeps `Condition:` / `Heroic Inspiration:` lines.
- Removed: the live `Ledger:` dump of every record row (useGame `:4639-4649` at `68d01a47`). Per-feature receipts that do write a line (combat XP, quest XP on modes that pay it) stay; the record dedupes against them rather than repeating.

## 2. Repair errors rose from 1 (lap 11) to 3 (lap 12)

**Cause.** All three came from tt-fix-8's no-backed-line branch in `writerTurn.repairMissingAnswer` (`src/game/writerTurn.ts:418`), which always lands `npcSheet.sheetAnswerLine`. That line was "I'm the <engine role> here at <place>" whatever was asked:
- R2: a want question was answered with the engine role "quest patron".
- R3: a want question got the speaker's job instead of a want.
- R1: a road-meeting stranger with no sheet got an article-less "nothing to tell you" that contradicted the meeting's own want.

**Fix.** The answer answers the question, from the person's own record, and never speaks the engine role.
- `src/game/npcSheet.ts:218` `sheetAnswerLine(state, name, said, playerInput)` classifies the question with the existing `hallTalkTopic`: who → "I'm <name>"; otherwise the sheet `motive` ("I want to …"), else the road meeting's want, else "I'd rather not say". If that line was already said it gives "I have nothing more to tell you". An unnamed speaker is "the <label>".
- `src/game/travelJourney.ts:846` `roadMeetingWant` reads the live meeting's `want` when the speaker is that meeting.
- `src/game/writerTurn.ts:418` passes the player's line.
- `src/game/rules/travelDay.ts` `MEETING_WANT`: two wants reworded so they read as spoken ("word of someone gone missing", "you gone from this stretch").
- Removed: the job/place answer (npcSheet `:220-222` at `68d01a47`).

## ruleCount (`node scripts/ruleCount.mjs`)

| | lines | regex | new RegExp | lists | fns |
|---|---|---|---|---|---|
| before | 8618 | 865 | 90 | 23 (292) | 1049 |
| after | 8618 | 865 | 90 | 23 (292) | 1049 |

No total rose. `writerTurn` stays 692 lines.

## Tests

- New `src/game/ttFix9.test.ts` (8 tests). Item 1: a finished quest gives "Quest complete" plus "Heroic Inspiration: yours (quest complete)"; "already held" when one is held; no repeat next turn; items and conditions reported but not repeated when a line already names them; a quest-stage line does not hide the completion. Item 2: a want question gets the motive and never "quest patron"; who gives the name, then "nothing more"; the road stranger says "I want word of someone gone missing".
- Updated to the new rule: `ttFix8` (Rosel Coyne answers with her motive, not her job).
- Full vitest: 77 failing vs baseline 79 (tt-fix-8 final list, same HEAD). The only name not in the baseline is `playtest30iFogOfWar` "detects locations mentioned in narrative", the known random-outline flake (passed 1 of 4 alone, on code not touched). One fix run.
- Replay bank: 64 failing (baseline 64, same names).
- tsc (`npm run typecheck`): 552 (ceiling 552).
- Build: green.

## Leftover

- Grants the record does not diff (e.g. gold, XP totals) still rely on their own receipts; the record covers quest, item, condition and inspiration grants.
- A speaker with no sheet motive and no live road meeting says "I'd rather not say" rather than inventing a want.

TT_DONE
