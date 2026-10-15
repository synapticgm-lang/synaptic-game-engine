# q31-RCR1: fight-close once, outside prose (Order RC-R1)

Stamp `2026-10-16g` (from `2026-10-16f`). Play change: settled-fight outcome is an engine combat-log / STATUS line, not a prose append. Client + edge (`engineResult`, `completedEventPacket`); `gm-turn` redeployed.

## Cause

- `src/game/beatCommitGate.ts:237-245` `withMissingFightFacts` always appended `terminalOutcomeSentence` unless `prose.includes(outcome)` (exact string).
- Called from `src/game/writerTurn.ts` on every accepted settled-fight path (RC-1).
- The writer already told the kill in other words, so every victory said it twice (lap 28 B T18, C T18, E T15). No article: "Cave Spider went down…".

## Fix

- **Deleted** the outcome term and `prose.includes(outcome)` from `withMissingFightFacts` (forced-attempt + foe-hit gaps stay).
- **Engine combat-log line:** `terminalOutcomeSentence` is attached as `WriterTurnResult.combatLog` with `outcomeShown: 'engine'`, merged into `systemLog` in `useGame` and `fateAutoplay` (STATUS channel, outside prose).
- **Article:** `TerminalFight.foeDisplay` keeps/adds "The …" for the close line.
- **Writer packet:** ENGINE RESULT notes the fight-close is already on the combat log; narrate moment/aftermath, do not restate.
- **turnCheck:** reads `outcomeShown` from the turn record (still credits a settled non-escape fight from the engine result).
- **ruleCount budget:** deleted dead `validateProseAgainstManifest` / `ManifestValidationResult` (no production caller).

## Tests

- New: `ttRcR1.test.ts` (R1-a..d).
- Rewritten: `ttFix14` block 2, `ttFix6` item 5, `s82RootATerminalFight` (outcome not in prose; on combat log once).
- `playtest30bWave3` B027 block removed; `playtest31aHookLock` uses `detectHookContradiction` directly.

## Replay staging R1–R16

None belong to RC-R1 (staging R1 is road-meeting brief; fight-close is not R1–R16). Acceptance R1-e (lap 28 B/C/E) is covered by unit tests above; no new bank case added. Nothing blocked for this order.

## Gates

| Gate | Result |
|---|---|
| vitest (non-bank) | 103 failing / 2807 (same count as q31-LK1). 0 new from this order. Allowed flake `seed94InfestationClear` not in fail list. |
| replay bank | 61 failing / 652 (limit 64). Same count as q31-LK1. |
| tsc (`tsconfig.app.json`) | 546 (limit 552) |
| build | green |

## ruleCount TOTAL

| | lines | regex | newRegExp | lists | fns |
|---|---|---|---|---|---|
| before | 163143 | 6951 | 382 | 1194 (6317) | 11783 |
| after | 163110 | 6949 | 382 | 1194 (6317) | 11782 |

TOTAL did not rise (487 files both times).

## Cut log

`docs/orders/tt-cut-log.md` § q31-RCR1 (3 entries).

## NEXT

- Forced-attempt / foe-hit still use word tests in prose (`beatCarriesForcedAttempt`, `dropsFightRoll`) — same shape as RC-1; out of this order's brief.
- R1-e full lap-28 tape bank pins when those tapes are staged for replay.
