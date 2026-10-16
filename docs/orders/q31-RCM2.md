# q31-RCM2: writer kind is the route; seat identity is the model id (Order RC-M2)

Stamp `2026-10-16u` (from `2026-10-16t`). Harness / dataset labelling only — live Free player path unchanged. No edge / `gm-turn` (client `autoplayWriter` + `writerDataset`).

## Cause

- `src/game/autoplayWriter.ts` `resolveFlashLiteAutoplayWriter` (~123): hard-coded `kind: 'flash-lite'` for every OpenRouter model id.
- `resolveAutoplayWriter` then re-stamped the CLI alias (`flash-lite`) over the resolved override, so DeepSeek / GPT seats still wrote `meta.writer.kind = "flash-lite"`.
- `scripts/writerDataset.mjs:84`: `writerId = meta.writer?.kind` — both seats collapsed to `flash-lite` even when `model` differed.

## Fix

- Resolved OpenRouter override `kind` is always the route name `openrouter` (CLI `flash-lite` / `openrouter` still select that path; `gateway` keeps its kind).
- Seat identity is `meta.writer.model`; `datasetWriterId` reads the model (fallback kind only for `default`).
- Folded dead `resolveFlashLiteCritic` into `resolveAutoplayCritic` so ruleCount fns does not rise with `datasetWriterId`.

## Tests

- New: `ttRcM2.test.ts` (kind=openrouter for any model; `--writer flash-lite --writer-model deepseek/…`; two seats → different writerIds; default stays `default`).
- Existing: `playtestAutoImprove.test.ts` still green.

## Replay staging R1–R16

None belong to RC-M2 (writer meta / dataset labelling, not play features). R5 blocked (no camp tape); R6 blocked (shop not built); others owned by other orders.

## Gates

| Gate | Result |
|---|---|
| vitest (non-bank) | 108 failing / 2894. 0 RC-M2-related. +1 vs RC-QT1 ~107 is known flake `seed94InfestationClear` (allowed). Stamp/drift only otherwise. |
| replay bank | 64 failing / 654 (limit 64). |
| tsc (`tsconfig.app.json`) | 552 (limit 552). |
| build | green. |

Fix runs: 0 (unit green; ruleCount trim only).

## ruleCount TOTAL

| | files | lines | regex | newRegExp | lists | fns |
|---|---|---|---|---|---|---|
| before | 484 | 162708 | 6914 | 381 | 1188 (6281) | 11720 |
| after | 484 | 162687 | 6914 | 381 | 1188 (6281) | 11720 |

TOTAL did not rise.

## NEXT

- None for RC-M2. Remaining queue: RC-J1, RC-N3, RC-N4.
