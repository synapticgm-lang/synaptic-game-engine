# q31-RCHF1: fate picks the System box chip outside the offered list (Order RC-HF1)

Stamp `2026-10-16j` (from `2026-10-16i`). Play change: System / origin prompt chips join the one offered list; Fate no longer forces them. Client-only (no edge / `gm-turn`).

## Cause

- `src/game/fateAutoplay.ts` `headlessFateTurn` (~1085–1090 at parent): `systemPad = systemPromptPad(...)?.chips ?? originPad(state)`; when set, Fate picked from that list only and ignored `resolveOfferedChoices(state)`.
- Lap 28 C T19–T21: offered pads were travel/talk/rest, but Fate still picked `Open the Bronze Reward Box` three times (System row was a second chip source with priority).

## Fix

- **`resolveOfferedChoices` / `commitOfferedPad`** (`playTranscript.ts`): System (class / stats / boxes) or Story RPG origin chips fold into every offered list (no second Fate source).
- **`engineChips`**: origin pads join builder membership with System chips (RC-K1 bind).
- **Delete** Fate’s `systemPad` branch and its unused pad imports (logged in `tt-cut-log.md`).
- **ActionBar**: heading rows paint chips from the offered list; main amber row drops those prompt chips so they are not shown twice. Fate’s Pick uses the full offered list (uniform weights; UI does not block other actions while a class offer is open).

## Tests

- New: `ttRcHf1.test.ts` (HF1-a..c).
- Updated: `modeGap2.bank.ts` class-offer expectation cites RC-HF1 (class chips now in the offered list).

## Replay staging R1–R16

None belong to RC-HF1 (R1–R4 road/dungeon/motive; R5 camp blocked no tape; R6 shop blocked; R7–R16 safety). No case added. Lap 28 C mash covered by HF1 unit tests.

## Gates

| Gate | Result |
|---|---|
| vitest (non-bank) | 105 failing / 2817 (same count as q31-RCAR1). 0 new from this order. |
| replay bank | 64 failing / 652 (limit 64). |
| tsc (`tsconfig.app.json`) | 547 (limit 552) |
| build | green |

Fix runs: 0 (unit HF1 green on first run; modeGap2 expectation updated with the order).

## ruleCount TOTAL

| | files | lines | regex | newRegExp | lists | fns |
|---|---|---|---|---|---|---|
| before | 487 | 163095 | 6932 | 382 | 1194 (6317) | 11778 |
| after | 487 | 163095 | 6932 | 382 | 1194 (6317) | 11778 |

TOTAL did not rise.

## NEXT

- Optional: add lap-28 C T19–T21 as a replay bank assert once a bank seat wants the live tape mash check.
