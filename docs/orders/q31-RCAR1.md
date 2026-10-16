# q31-RCAR1: "nothing on record" with people present (Order RC-AR1)

Stamp `2026-10-16i` (from `2026-10-16h`). Play change: sheeted townsfolk are backed for answer repair by construction. Client-only (no edge / `gm-turn`).

## Cause

- `src/game/npcSheet.ts` `motiveLinesOf` (~242): read only a saved `motiveLines` copy (else road-meeting group lines).
- `townsfolk.ts` creates memories with a `sheet` but never sets `motiveLines`. `ensureNpcSheet` copied lines on create; `withMotiveLines` patched sheeted people only on load. Presence (sheet) and backing (`motiveLines`) diverged — Piers Thatch / Wenna Merrow on lap-28 F T19 / H T5.
- `writerTurn.ts` `repairMissingAnswer` (~420) then logged `nothing on record for anyone here` while people stood in the REF ENUM.

## Fix

- **One source:** `motiveLinesOf` derives from `memory.sheet.motive` via `motiveLinesFor` whenever a sheet exists; saved `motiveLines` only for authored / roster rows (no sheet).
- **Deleted** (logged in `tt-cut-log.md`): copy-on-create of `motiveLines` in `ensureNpcSheet`; load-time sheet patch in `withMotiveLines`.
- **Bug rename:** `` no backed line for ${names} `` (data-error only once presence implies sheet backing).
- Kept `harvest-npc-*` skip in `backedAnswerFacts` (placeholders are not lines).

## Tests

- New: `ttRcAr1.test.ts` (AR1-a..d + `seedTownsfolkHere` sheet-only).
- Updated: `ttBuildNpcMotive.test.ts` (derive-at-read; no saved copy on generate / sheet load).

## Replay staging R1–R16

None belong to RC-AR1 as a dedicated case. R1’s motive part is Wire-in H / road-meeting groups, not townsfolk sheet backing. F T19 / H T5 tapes are covered as unit fixtures in AR1-a/b, not as bank cases (not in R1–R16). No case added. Blocked for this order: none of R1–R16 are AR1-owned.

## Gates

| Gate | Result |
|---|---|
| vitest (non-bank) | 105 failing / 2847. Vs q31-RCR1 list: +2 load flakes (`phantomFight` turn-back; `playtest27aRepair1` inspect panel) — both **14/14 pass alone**. 0 new real failures. |
| replay bank | 62 failing / 652 (limit 64). |
| tsc (`tsconfig.app.json`) | 547 (limit 552) |
| build | green |

Fix runs: 0 code fix runs (flake confirm only).

## ruleCount TOTAL

| | files | lines | regex | newRegExp | lists | fns |
|---|---|---|---|---|---|---|
| before | 487 | 163096 | 6932 | 382 | 1194 (6317) | 11778 |
| after | 487 | 163095 | 6932 | 382 | 1194 (6317) | 11778 |

TOTAL did not rise.

## NEXT

- Bank property AR1-c over live tapes (export `answerersHere` or assert via packet + `npcMemories` in replay harness) if John wants tape-level coverage beyond the unit fixture.
- OP-1 opener ideas for want-less strangers (m48) — separate from sheeted townsfolk; still in `needs-john.md`.
