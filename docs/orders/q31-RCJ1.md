# q31-RCJ1: blind paired judge; absolute thumbs diagnostic only (Order RC-J1)

Stamp `2026-10-16v` (from `2026-10-16u`). Harness / judge labelling only — live Free player path unchanged. No edge / `gm-turn`.

## Cause

- `scripts/fate-autoplay/autoThumbs.mjs` judge loop (~195–221 at parent): absolute up/down per run, batches of 20, one model, one pass.
- Lap 32 A 2 ups vs B 9 on the same Tabletop pair; C/D 9/10. Each run scored alone, so verdicts rode batch context, not a comparison.

## Fix

- Blind paired judge (`--notes --pair <otherRunDir>`): matched turns side by side as Draft X / Draft Y (no seat names); asked twice with order swapped; keep a thumb only when both asks agree, else unmarked.
- Agreement rate in `report.md` / `thumbs.json`; `PAIR_AGREEMENT_FLOOR` = 0.7; `training_label` only when rate clears the floor.
- Absolute single-run `--notes` kept as diagnostic only (`labelSource: diagnostic`, `training_label: false`).
- `distillCollect` requires `training_label === true` (absolute thumbs never train).

## Tests

- New: `ttRcJ1.test.ts` (blind prompt, swap, agree/disagree, floor).
- Existing: `playtest29z5ProseThumbRubric` still green.

## Replay staging R1–R16

None belong to RC-J1 (judge harness, not play features).

## Gates

| Gate | Result |
|---|---|
| vitest (non-bank) | 106 failing / 2898. 0 RC-J1-related. Under RC-M2's 108 (flake `seed94InfestationClear` allowed; not in this run). |
| replay bank | 64 failing / 654 (limit 64). |
| tsc (`tsconfig.app.json`) | 552 (limit 552). One fix run: collapse `ttRcJ1` import to one line so `@ts-ignore` covers the `.mjs` module (was 553). |
| build | green. |

Fix runs: 1 (tsc import ignore only).

## ruleCount TOTAL

| | files | lines | regex | newRegExp | lists | fns |
|---|---|---|---|---|---|---|
| before | 484 | 162687 | 6914 | 381 | 1188 (6281) | 11720 |
| after | 484 | 162687 | 6914 | 381 | 1188 (6281) | 11720 |

TOTAL unchanged (scripts-only; not in TOTAL roots).

## NEXT

- None for RC-J1. Remaining queue: RC-N3, RC-N4.
- Floor 0.7 is set in code; change only if John wants a different cut.
