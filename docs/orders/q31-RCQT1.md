# q31-RCQT1: quest step chip label never ticks (Order RC-QT1)

Stamp `2026-10-16t` (from `2026-10-16s`). Play change: picking a chip named like a quest step starts the scene only; the tick needs an engine outcome (place / find / meet / contact favour). Client-only (no edge / `gm-turn`).

## Cause

- `src/game/questTargets.ts` `actionMatchesObjective` (~86–87): `chipKey(action) === chipKey(stepChip(step))` treated the pad label as a find/meet match.
- `src/game/enterInterior.ts` `actionTakesDoorStep` (~51–52): the same equality opened the interior from the step chip alone.
- `src/game/storyRpgProgress.ts` (~274–275): placeless decisions ("Pick an approach", "Commit to the heist night") completed Case the Caravan on pad alone (lap32 F T7–T9); Fake Cargo / Botched Dry-Run could finish without the warehouse place + check.

## Fix

- Deleted chip-equals-step branches in `actionMatchesObjective` and `actionTakesDoorStep` (logged in `tt-cut-log.md`).
- Story RPG: decision chips still offered; place steps still tick at the named place; contact favour still ticks through a person. Chip label alone never completes a step.
- Ticks remain `targetSpot === true` + named/find|meet intent (or contact favour / place presence).

## Tests

- New: `ttRcQt1.test.ts` (Story RPG decision no-tick; warehouse tripwire needs place; door spot never ticks from chip).
- Updated: `mode4.bank.ts`, `modeGap7.bank.ts`, `modeGap8.bank.ts` (ending helpers finish main via engine-complete objectives, not chip ticks).
- Replay staging **R2** added to `tt15features.bank.ts` (s5111 T11/T19 dungeon card chips + no quest-stage on travel arrivals).

## Replay staging R1–R16

| # | Status |
|---|---|
| R2 | **Added** (belongs; tape + feature unblocked). |
| R1, R3–R4 | Not this order (road meeting / motive / revisit). |
| R5 | Blocked: no camp tape. |
| R6 | Blocked: shop not built. |
| R7–R16 | Not this order (safety / wellbeing). |

## Gates

| Gate | Result |
|---|---|
| vitest (non-bank) | 107 failing / 2891. 0 RC-QT1-related. Vs prior ~105: stamp/drift flakes only (`28c`/`30b` length, `29u`, `31i` fallback) — not from this order. |
| replay bank | 64 failing / 654 (limit 64). mode4 / modeGap7 / modeGap8 / tt15features R2 all green. |
| tsc (`tsconfig.app.json`) | 552 (limit 552) |
| build | green |

Fix runs: 0 (unit + bank helpers green after one test-case tighten).

## ruleCount TOTAL

| | files | lines | regex | newRegExp | lists | fns |
|---|---|---|---|---|---|---|
| before | 484 | 162716 | 6916 | 381 | 1188 (6281) | 11721 |
| after | 484 | 162708 | 6914 | 381 | 1188 (6281) | 11720 |

TOTAL did not rise.

## NEXT

- Engine outcome for placeless Story RPG decisions beyond contact favour (check / scene record) when K2 lands.
- Optional: full `replayWhole` of s5111 for R2 card-id continuity (tape-jsonl assert covers chip counts today).
