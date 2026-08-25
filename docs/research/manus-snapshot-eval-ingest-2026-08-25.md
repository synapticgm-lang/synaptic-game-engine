# Snapshot eval pack — Manus ingest (2026-08-25)

**Original download filename:** `Complete This to Your Max.zip` (copied unchanged)  
**Saved zip:** `docs/research/pasted/snapshot-eval-pack-manus-2026-08-25.zip`  
**SHA256:** `63C070151FB0BB9C8F0405882CE127FEBBCF4FFCD6D629488D485030B039E224`  
**Unpacked:** `docs/research/pasted/snapshot-eval-pack-manus-2026-08-25/`  
**Nested zip unpacked to:** `docs/research/pasted/snapshot-eval-pack-manus-2026-08-25/unpacked/SynapticGM_snapshot_eval_pack_2026-08-25_dist/`  
**Job 1 prompt (verbatim in pack):** `pasted_content.txt`  
**Product-law stamp the pack claims:** `2026-08-25b`  
**LIVE SynapticGM only.** Not under `docs/research/wof/`.

Canonical CSVs are the nested dist copies (larger, matching `validation_report.json`). Outer-folder CSVs are the same rows with slightly tighter JSON quoting.

## Files in the zip

| File | Role |
|---|---|
| `README.md` | How to use CSV, pass/fail, test-file routing, pattern ID list |
| `scenarios.csv` | 100 hard-gate / skip / allow / warden / chrome rows |
| `good_prose.csv` | 30 no-over-scrub controls |
| `adversarial_almost_false.csv` | 50 polysemy / quote / metaphor / skip / true-scrub boundaries |
| `coverage.md` | Required-case → fixture ID matrix |
| `pattern_ids.md` | 18 `PW_*` rewrite templates |
| `wiring_note.md` | Column → assert mapping for Cursor |
| `validation_report.json` | Manus local validator: PASS, 0 errors |
| `scenario_d.csv` / `scenario_e.csv` | Draft fragments (not the 100-row pack) |
| `*.py` | Manus validators (research-only) |
| Duplicate pretty-named `.md` copies | Same text as the required filenames |

## Row counts (nested dist)

| Dataset | Rows | Requested min | Status |
|---|---:|---:|---|
| `scenarios.csv` | 100 | 80+ | Met |
| `good_prose.csv` | 30 | 20+ | Met |
| `adversarial_almost_false.csv` | 50 | 40+ | Met |

`scenarios.csv` class split (from `validation_report.json`): A-turn 22, B-opening 18, C-quest 16, D-prose 28, E-chrome 16. Hard-gate enums: allow 51, block 26, skip 23.

## Deliverable completeness vs Job 1

| Deliverable | Status |
|---|---|
| README.md | Present; CSV usage, pass/fail, `actionValidation.test.ts` / `proseWarden.test.ts` routing, pattern IDs |
| scenarios.csv columns | Exact Job 1 set |
| class / gate / facts enums | `A-turn\|B-opening\|C-quest\|D-prose\|E-chrome`, `block\|allow\|skip`, `yes\|no` |
| `setup_snapshot_json` | Parseable JSON; required SNAPSHOT keys present; extra `ledger` / `quest` / `event` / `weather` on some rows |
| good_prose.csv | Columns match; includes musty oak, rust, metaphor, mannerism, weather texture |
| coverage.md | All required cases cite IDs (last-box, companion, look-around skip, crowd, indoor, time skip, hall-as-speaker, extra door, flair keep) |
| pattern_ids.md | All 18 IDs used in the CSV are documented |
| wiring_note.md | Present; false-positive warnings match 25b flair-free law |
| adversarial_almost_false.csv | Columns match; `allow\|scrub\|skip` |

## Required coverage cases

| Case | Fixture IDs | Pack expect |
|---|---|---|
| Last box, empty inventory | `A009` | block |
| Last box in GM prose, empty props | `D001` | `PW_LAST_CONTAINER_UNGROUNDED` |
| Box exists as prop | `A017`, `D019`, `E011` | allow / no false scrub |
| Talk to name from last GM line | `A013`, `A014`, `C004`, `E008` | allow |
| Invent companion | `A005`, `A006`, `E006`, `E015` | block |
| Use/draw sword not in inventory | `A001`, `A003`, `E004` | block |
| Look-around skip | `A018`, `B005`, `E001` | skip |
| Opening name/look/kit | `A019`, `B001`–`B003`, `E009` | skip |
| Layout doors/windows | `A020`, `B004`, `E003` | skip |
| Info or option | `A021`, `B007`, `B008`, `C008`, `E010` | skip |
| Hundred people vs small crowdSize | `D002`, `D023` | scrub |
| Empty/all-alone vs crowd=present | `D003`, `D024` | scrub |
| Invent crowd, aloneArrival + crowd=none | `D004` | scrub (warden, not gate) |
| Step outside while indoor | `D005` | scrub |
| Hours later / festival-over | `D007`, `D008`, `D025` | scrub |
| Hall answers | `D011` | scrub |
| Extra door vs two-exit whitelist | `D012` | `PW_EXIT_WHITELIST_VIOLATION` |
| Gold/stat vs ledger | `D014`, `C006`, `C007`, `C012` | `PW_LEDGER_NUMBER_CONTRADICTION` |
| Flair-only legal facts | `G001`, `G002`, `G005`, `D020` | keep |

## Quality / contamination

- **CSV parseable:** yes (RFC 4180 quoted JSON). Nested dist is the copy to trust.
- **Enums:** match Job 1. Adversarial `correct_expect` is `allow|scrub|skip`.
- **Contamination:** none found (no WOF races, no hybrid-climate / cassette, no licensed series names). The Job 1 prompt itself mentions WOF only as a ban. Original place names (Lantern Square, Ash Orchard) are not WOF working names.
- **Kid-safe:** PG-13 fantasy; no sexual content.
- **Pack-internal bugs (do not treat as live regressions):**
  - `C011` fail_symptom says “wolf pelts” but `last_gm_story` does not.
  - `C015` expects last-chest scrub but story is “You search the area for clues.”
  - `C012` fail_symptom says level 10; story is a gold line.
- **Over-scrub vs 25b product law:** `G003` (“sounds like a hundred hands”) is a legal simile; live `scrubInventedCrowdSize` will rewrite `hundred hands`. Do not loosen the warden from this row; keep it deferred.
- **Live-code gaps vs pack (Phase 2 / mismatch, not wired):**
  - Hard gate does not treat “hand over the ruby/ears” or “my dog” / “the knight” as companion.
  - “What are my options?” without `or` / panel language is not a live skip.
  - `PW_EXIT_*`, `PW_LEDGER_*`, `PW_QUEST_*`, `PW_INVENTORY_*`, `PW_PRESENCE_*`, `PW_LOCATION_FACT_*`, `PW_WEATHER_*`, festival-over / was-not-always-so are not in `applyProseWarden`.
  - E-chrome banner / cancel / draft-restore / `api_calls=0` need UI/proxy tests.

## Tests wired (this ingest)

Do **not** dump all 100 LLM rows into production warden logic.

- `src/game/fixtures/snapshotEvalPack.subset.ts` — 44 highest-confidence rows that live `validateActionHard` / `shouldSkipHardGate` / `applyProseWarden` can assert.
- `src/game/fixtures/snapshotEvalPack.subset.csv` — id/suite/expect index for CI (does not depend on OneDrive research paths).
- `src/game/snapshotEvalPack.test.ts` — gate block/allow/skip, warden scrubs, flair keep. Phase 2 rows are commented + `describe.skip`.

## Next for Cursor

Wait for John before: (1) implementing missing `PW_*` repairs, (2) widening companion/item verbs to match Manus, (3) wiring chrome/UI asserts, (4) dumping the remaining ~136 research rows into vitest. Optional later: more live-matching rows from `good_prose.csv` / adversarial `allow` after G003-style over-scrub review.
