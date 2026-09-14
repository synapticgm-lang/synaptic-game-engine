# Writer obeys ledger 13c (2026-09-13)

**Status:** Shipped as the **fallback** when 14a Token Prose JSON is unusable. Stamp at ship was `2026-09-13c`; live stamp moved to `2026-09-14a`. Mid writer OFF. No SNAPSHOT/CRAFT pile. No Continuity-Warden LLM.

## Product lock

John rejected the 13b honest tradeoff (always-`callGm` *or* no invented names). 13c keeps **both**: the writer is always called after page 1, and the accept path **rewrites** off-list nouns instead of swapping the beat for a two-line bank.

## What 13b already locked

After `sceneWritten`, `shouldStitchOpeningContinue` is false (hall / cover-continue / sign-read no longer skip `callGm`). `shouldUseSilentMudTurn` is always false. Look / Wait / inspect / talk / act / combat all hit the writer.

Empty or timeout last-resort is last good GM or the page-1 card paragraph + STATUS — never `Dust hung` / `Whatever you tried had already happened`. Page 1 authored stitch stays. STATUS chrome and pads stay code.

## What 13c adds

| Lock | Owner |
|---|---|
| Accept path rewrites novel First Last / Title+Name off the mention list (card role, or drop that sentence) | `ledgerNounObey.obeyLedgerNouns` |
| CAST cannot become a permit (“Lene is a permit”) | `scrubCastAsPermit` |
| Living lastKill cannot talk | same accept path + `isDeadFoeReopenedAsLiving` |
| Instruction / numbered lists still reject, then one retry | existing `beatCommitGate` |
| Empty after scrub → last good GM / page-1 paragraph | `acceptObeyedStoryBody` + `lastResortStoryBody` |
| Harvest occupancy ⊆ ledger allowlist (hall-talk T2 cannot persist Orel Vane) | `compileNounAllowlist` + `narrativeHarvest` |
| Writer packet `YOU MAY ONLY MENTION` from the ledger | `formatWriterFacingEvent` |

Keep the rest of the AI paragraph. Do not swap the whole beat for a drought bank when one name is off-list.

## Stamp

HUD / BUILD / `index.html` / `version.json` → `2026-09-13c` at ship. Current tree is `2026-09-14a`.

## Vitest

`playtest13cWriterObeysLedger`

## Holes 13c cannot close (Opus)

These stay honest leftovers. 14a Token Prose is the attempt to close them; 13c remains the fallback when JSON is unusable.

1. **Unbound animate roles.** Freeform “a chanter” / “a vendor” is not a First Last, so the 13c name scrub will not drop it.
2. **Type error — person as prop.** “Archivist Lene is a permit” is a known rewrite. A novel person-as-object slip that is not that pattern can still glue.
3. **Glued prose after delete.** Dropping a name mid-sentence can leave a torn clause. 13c prefers dropping the whole dirty sentence when a presence verb is attached; leftover glue is still possible.

DeepSeek may still invent; we strip or retry, then keep the scrubbed sentences. Combat receipts ≥3 and a full outdoor zone map are out of scope.

## 14a relationship

14a asks the writer for JSON `{ refs, lines }` with `@tN` tokens. Code paints ledger display strings. If the model returns **non-JSON / unparseable**, the accept path **falls through to 13c** (freeform + noun scrub), still `callGm` text — not a two-line bank, never Dust-hung.

`compileRefEnum` / `compileNounAllowlist` stay the single source of this-turn ids.
