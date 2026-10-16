# q31-RCN4: stop record leaks at source; gate only on exact travel-record strings (Order RC-N4)

Stamp `2026-10-16x` (from `2026-10-16w`). Play change: the writer packet no longer carries raw quest-step text; the record-readout gate and fact checker flag only exact travel-record strings (leg list / trip time). Client + edge (`infoSheet`, `completedEventPacket`); `gm-turn` redeployed after sync.

## Cause

- `src/game/engineFactGate.ts` `recordReadoutProblem` (~42–51 at parent): `questTitleNamed` + `questStepLeak` word-overlap against open objectives.
- Lap32 G T3: prose restating the player's chip ("Hear the coin offer" → coin / road east) flagged as record readout; repair failed the same gate.
- Source: `infoSheet.openLines` handed `— step: …` objective text; last-resort stitch could dump the journal step onto the page.

## Fix

- Gate / checker: `travelRecordRead` only (shared `TRAVEL_RECORD` patterns). Deleted `questStepLeak` / `questTitleNamed` and helpers.
- Packet: OPEN lists quest name/giver only — no raw step description. Last-resort no longer pastes open-lead step lines.
- Travel leg/time bookkeeping was already stripped for the writer via `writerTravelFact` / `writerEngineResult`.

## Tests

- New: `ttRcN4.test.ts` (coin-offer restatement not flagged; exact travel-leg string flagged; OPEN has no step text).
- Updated: `ttFix2`, `ttFix3`, `playtest29z9iInfoSheet`.

## Replay staging R1–R16

| # | Status |
|---|---|
| R1–R16 | None belong to RC-N4 (record-readout gate / packet step text). |

## Gates

| Gate | Result |
|---|---|
| vitest (non-bank) | 108 failing / 2903. 0 RC-N4-related (stamp/drift + seed94 band; same class as RC-N3's 106/2900). |
| replay bank | 63 failing / 654 (limit 64). |
| tsc (`tsconfig.app.json`) | 552 (limit 552) |
| build | green |

Fix runs: 0 (unit green first pass).

## ruleCount TOTAL

| | files | lines | regex | newRegExp | lists | fns |
|---|---|---|---|---|---|---|
| before | 484 | 162681 | 6914 | 381 | 1188 (6281) | 11720 |
| after | 484 | 162608 | 6907 | 380 | 1187 (6246) | 11699 |

TOTAL did not rise.

## Cut log

`docs/orders/tt-cut-log.md` § q31-RCN4.

## NEXT

- Remaining queue: none for N4. Parked RC-K2 / RC-PY2 stay parked.
