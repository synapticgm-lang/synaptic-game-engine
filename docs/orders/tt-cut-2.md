# tt-cut 2 — the cut

Order: `docs/orders/tt-cut-2-order.md`. Full restore log (every deleted item, old line, old text, why, commit): `docs/orders/tt-cut-log.md`.

Shipped as stamp `2026-10-14s` (live `2026-10-14r` → `s`), commit `DELETION_COMMIT` on `main`. EDGE_LINE LIVE_LINE

One fix run. No laps. No playtests. `humanJudge.mjs` left out on purpose. No replacement rules were added.

## Rule counts (same scanner as tt-consolidate and tt-cut 1: `scripts/ruleCount.mjs`)

| | Lines | Regex literals | `new RegExp` | String lists (items) | Functions |
|---|---|---|---|---|---|
| Before | 8789 | 894 | 91 | 28 (354) | 1065 |
| After | 8618 | 866 | 90 | 23 (292) | 1047 |
| Change | −171 | −28 | −1 | −5 (−62) | −18 |

By file:

| File | Lines | Regex | new RegExp | Lists (items) | Functions |
|---|---|---|---|---|---|
| tokenProse.ts | 1457 → 1411 | 172 → 163 | 38 → 38 | 9 (50) → 6 (35) | 186 → 183 |
| turnCheck.ts | 760 → 740 | 70 → 63 | 9 → 9 | 1 (17) → 0 | 108 → 107 |
| beatCommitGate.ts | 674 → 664 | 142 → 142 | 0 → 0 | 1 (16) → 1 (16) | 45 → 43 |
| fullProseGate.ts (deleted) | 55 → 0 | 3 → 0 | 0 → 0 | 0 → 0 | 8 → 0 |
| scripts/factCheck.mjs | 553 → 552 | 130 → 124 | 18 → 18 | 5 (157) → 5 (157) | 88 → 87 |
| edge completedEventPacket.ts | 2757 → 2718 | 196 → 193 | 2 → 1 | 3 (36) → 2 (6) | 269 → 266 |
| other scanned files | unchanged | | | | |

Outside the scanner's file set: six more dead modules (1,351 lines), three edge copies, three sync-list entries, 554 lines of their stale tests, and three save fields.

## What was deleted (file and count)

Details, old line numbers and old text for each item are in `tt-cut-log.md`.

- **Dead modules (7 files + 3 edge copies):** `socialStakes`, `leverageMechanics`, `encounterStakes`, `fullProseGate`, `folkVoiceExpectations`, `speechActRails`, `claimGrounding`; edge `folkVoiceExpectations`, `speechActRails`, `claimGrounding`; their three names in `sync-gm-edge-shared.mjs`. None had an importer outside its own tests.
- **Their stale tests:** blocks in `ws7Complete` (Wave A, Wave C, the integration flow), `playtest31aWave1Social` (2 describes), `playtest31bWave1Encounter` (B006–B010), `fluidChatEval` (folk voice ×5, speech acts ×1), `playtestDay1Checklist` (full-prose gate), and the claim-grounding asserts in `playtest02nBatch02n`.
- **Never-read fields (3):** `qualityGovernance.lastHubLocation`, `recentXpAwards`, `craftSignals` (type + writes).
- **completedEventPacket (5):** `inventedTitleCaseNotOnAllowlist` (the handed-names list decides this through `inventedCastNamesInProse` / `isSealedCardViolation` and `ledgerNounObey`), its `TITLE_NAME` regex, `SENTENCE_STARTERS` list and `allowlistHas` wrapper, and the unused `ledgerAdvanceBeat`.
- **tokenProse (10):** the unused `TOKEN_PROSE_JSON_SCHEMA` (with its 3 enum lists), the local `escRe` and 2 local `esc` copies, and 6 quote-mask regex copies now read through `engineFactPatterns.narrationOf`.
- **turnCheck (8):** the unused `TURN_CHECK_P0_KINDS` list, the local `esc`, 1 inline escape, and 5 quote-mask copies now read through `escRe` / `narrationOf`.
- **factCheck (6):** the local `esc`, 4 inline escapes, and 1 quote-mask copy now read through `escRe` / `narrationOf`.
- **beatCommitGate (2):** `isFactClosedViolation` (wrapper; tests call `!!factClosedViolationReason`) and `stitchCommitDelta` (deprecated alias of `codedSceneMove`).

**Not deleted, though tt-sweep listed them:**
- `pyoaEndingGates` is live (`mainQuestEnd`, `storyRpgProgress`).
- `turnsSinceLastEncounter` is read by `buildGovernanceSnapshotLines`, which the edge situation packet uses.

**Kept (partial overlap only):** `proseViolatesEventPacket` and its sub-checks, the monologue / director / token-salad / HUD chrome detectors, the charter fact-close regex, and tokenProse's carried / own / find / time-of-day / role-noun / known-name helpers. Each one covers a case the handed-names list, `thisTurnsEventCheck` and the engine records do not. `isVerbatimStallStub` and `isStitchBankFingerprint` are phrase deny-lists for old stitch text. Those three mechanisms don't cover them (only the recycle window does), so they're left for a later step. The writer-side "only destination" keep is in `writerTurn`, which is not one of this order's six files.

## Re-pins

No replay-bank re-pins. Test edits came from two causes, not re-pins of a failing bank row:
- **Deleted modules:** their test blocks went with them (listed above).
- **Deleted aliases:** 15 test files call the real function instead (12 for `factClosedViolationReason`, 3 for `codedSceneMove`).
- **Stamp:** the 24 stamp-pinned `playtest*` files moved `2026-10-14r` → `s`; 255/255 pass.

## Tests (run in the shell; only failures compared)

| Gate | Baseline (tt-cut 1) | After | Limit |
|---|---|---|---|
| Vitest failing | 79 | 80 (79 baseline + 1 load flake) | no new beyond baseline + flakes |
| Replay bank failing | 64 / 628 | 64 (identical set) | ≤ 64 |
| tsc errors | 570 | 552 | ≤ 570 |
| Build | green | green | green |

- **Vitest:** the one new name is `openingHookDecks` "gives Summoned Pact more than the cathedral circle". It failed with `STACK_TRACE_ERROR` (a timeout) while the full suite and the bank ran at the same time. It passes 3 of 3 alone, and nothing in this step touches opening hook decks. No baseline name disappeared.
- **tsc:** fell by 18 because the deleted test blocks carried typing errors. No error names a removed module.
- `scripts/factCheck.mjs` loads under Node with the new imports.

## Commit and stamp

- Commit `DELETION_COMMIT`: the deletions above, `scripts/sync-gm-edge-shared.mjs`, the edited files (`completedEventPacket`, `tokenProse`, `turnCheck`, `beatCommitGate`, `qualityGovernance`, `factCheck.mjs`, edge `completedEventPacket`), the test edits, the stamp files (`index.html`, `public/version.json`, `Hud.tsx`, `runManifest.ts`, 24 pins), `tt-cut-log.md` and this report.
- Stamp `2026-10-14s`.

TT_DONE
