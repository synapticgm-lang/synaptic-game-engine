# q31-ECA: companion approval (Order E-CA / Spec E-CA)

Stamp `2026-10-16m` (from `2026-10-16l`). Play change: Story RPG / LitRPG companion approval scores from **parsed intent + engine outcome**, not stance wording. Tabletop unchanged (`companionsAllowed` still rpg|litrpg only). Client-only (`rules/companions` + `arcDirector`); no edge sync / no gm-turn behaviour change.

## Cause

- **`src/game/rules/companions.ts` `approvalEvent` (~:206 at parent):** decided from `detectStanceTreatment(input)` + companion/other name substring + `/\b(?:steal|rob)\b/i`. That is wording, not a settled consequence. Same line could score harm or kind from verbs alone; a failed attempt with no engine outcome still moved trust.

## Fix

- `ApprovalOutcome` / `ApprovalInput`: `parsePlayerIntent` + engine fields `harmed` / `helped` / `takenFrom` / `wonFight` / `fightFoes`.
- First-match map (Spec E-CA): harmCompanion → harmOther → kindCompanion → kindOther → foughtTogether; `targetsSelf` and empty outcome score nothing; a won fight vs a fight foe is foughtTogether, not harmOther.
- `settleCompanions` takes `opts.outcome` (keeps `wonFight` shorthand). `settleApproval` / `APPROVAL_SHIFT` / camp talk unchanged.
- `arcDirector`: passes `{ wonFight, fightFoes }` from the Fight: VICTORY receipt (victory clears `foeAfter`).
- modeGap6 harm/kind cases pass explicit outcomes (word-matched asserts retired).
- New `ttEcaCompanionApproval.test.ts`: same wording / different outcomes, converse, targetsSelf, takenFrom, wonFight.
- ruleCount budget: trimmed comment padding in `optionDiversityContract.ts` (behaviour unchanged). Stance path logged in `tt-cut-log.md`.

## Tests

- `ttEcaCompanionApproval.test.ts` 4/4 green.
- `modeGap6.bank.ts` 11/11 green.

## Replay staging (R1–R16)

| Case | Status |
|---|---|
| R1–R16 | Do not belong to E-CA (companion approval is covered by modeGap6). **Not added.** |

## Gates

| Gate | Result |
|---|---|
| vitest (non-bank) | 104 failing / 2865 (vs O1C 103). 0 new from E-CA; extras are known flakes (`meetCountVisits` s73, `openingHookDecks`, `playtest30iFogOfWar`). `ttEcaCompanionApproval` passed. Allowed flake `seed94InfestationClear` not in fails. |
| replay bank | 64 failing / 652 (limit 64). |
| tsc (`tsconfig.app.json`) | 551 (limit 552) |
| build | green |

Fix runs: 0 (gates green first pass after unit + modeGap6).

## ruleCount TOTAL

| | files | lines | regex | newRegExp | lists | fns |
|---|---|---|---|---|---|---|
| before (q31-O1C) | 485 | 162935 | 6927 | 381 | 1191 (6302) | 11728 |
| after | 485 | 162899 | 6927 | 381 | 1191 (6302) | 11728 |

TOTAL did not rise (lines down; regex / lists / fns flat).

## Ship

Commit `c7eafe4a`, pushed; client stamp only (no edge files / no gm-turn). Live `www.synapticgm.com/version.json` = `2026-10-16m`.

## NEXT

- Live path still only feeds `wonFight` + `fightFoes` from `arcDirector`. Wire `harmed` / `helped` / `takenFrom` from existing engine settlements (companion HP from player attack, heal/give, steal provenance) so approval moves without test-injected outcomes.
- Optional: companion value tags from the brief (Spec E-CA uses fixed `APPROVAL_SHIFT` events only — no tag table yet).
