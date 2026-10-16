# q31-RCN3: blocking draft one rewrite, else engine-fact fallback (Order RC-N3)

Stamp `2026-10-16w` (from `2026-10-16v`). Play change: an accepted draft with blocking problems (thin, unresolved action, engine result not stated) gets one rewrite; a second miss paints the engine-fact fallback page and logs the miss — never ships the thin draft as-is. Client-only (`writerTurn` / `actionResolution`; not in edge sync). No `gm-turn` redeploy.

## Cause

- `src/game/writerTurn.ts` `runWriterTurnFightOnly` (~605–616 at parent): after `runWriterTurn` accepts, the only rewrite was for an ignored terminal fight; `writerDraftProblems` (Too thin / unresolved / engine result) went to telemetry only (`fateAutoplay` draftProblems).
- Lap32 F T3: draftProblems "Too thin", writerCalls=1, outcome accepted, page = one sentence.

## Fix

- Same rewrite seam: blocking remaining problems trigger exactly one `rewrite` with those problem lines; if still blocking, `lastResortStoryBody` (engine-fact page) + `draftRetry: 'painted'` + logged miss.
- Successful rewrite: `draftRetry: 'retried'`. Fight-omit path unchanged (`fightRetry`).
- RC-R1 alignment: `unresolvedActionReason` no longer requires prose to restate a terminal fight-close (combat log owns it). Flee / parley / rest still must be stated in prose.
- Logged in useGame / fateAutoplay when `draftRetry` fires.

## Tests

- New: `ttRcN3.test.ts` (one Too-thin rewrite; second thin → fallback, never as-is).
- Updated: `ttRcR1` R1-b multi-sentence omit (no thin rewrite).

## Replay staging R1–R16

| # | Status |
|---|---|
| R1–R16 | None belong to RC-N3 (thin-draft rewrite is not a staged tape case). |

## Gates

| Gate | Result |
|---|---|
| vitest (non-bank) | 106 failing / 2900. 0 RC-N3-related (stamp/drift only; flake `seed94InfestationClear` allowed). Same band as RC-J1. |
| replay bank | 64 failing / 654 (limit 64). 0 new vs RC-J1 baseline. |
| tsc (`tsconfig.app.json`) | 552 (limit 552) |
| build | green |

Fix runs: 2 (1: blocking after repairs so answer repair runs first; 2: speech-answer soft miss keeps page, hard miss falls back).

## ruleCount TOTAL

| | files | lines | regex | newRegExp | lists | fns |
|---|---|---|---|---|---|---|
| before | 484 | 162687 | 6914 | 381 | 1188 (6281) | 11720 |
| after | 484 | 162681 | 6914 | 381 | 1188 (6281) | 11720 |

TOTAL did not rise.

## Cut log

`docs/orders/tt-cut-log.md` § q31-RCN3 (no production delete; comment budget trim).

## NEXT

- Remaining queue: RC-N4.
- Optional: when rewrite returns a thicker page that still has only a soft speech miss, prefer that page over the pre-rewrite one.
