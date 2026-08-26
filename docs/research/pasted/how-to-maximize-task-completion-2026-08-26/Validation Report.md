# Validation Report

**Author:** Manus AI  
**Result:** 38/38 checks passed; 0 failed.

| Check | Result | Detail |
|---|---|---|
| Required files exist | PASS | missing=none |
| Tone catalogue has 19 rows | PASS | rows=19 |
| Tone-to-GM rails has 19 rows | PASS | rows=19 |
| Tone-theme-image matrix has 19 rows | PASS | rows=19 |
| Tone catalogue has no empty required cells | PASS | all cells checked |
| Tone-to-GM rails has no empty required cells | PASS | all cells checked |
| Tone-theme-image matrix has no empty required cells | PASS | all cells checked |
| Tone IDs unique | PASS | unique=19 |
| Primary personality IDs are exact shipped IDs | PASS | all exact |
| Secondary personality IDs are exact shipped IDs or none | PASS | all exact |
| Every catalogue row includes Kid Mode delta | PASS | 19/19 |
| All 22 kit keys appear | PASS | covered=22 missing=[] extra=[] |
| All image rows ban baked lettering | PASS | 19/19 |
| All image rows include Kid rewrite | PASS | 19/19 |
| Choice bank covers 19 tones | PASS | tones=19 |
| Choice bank IDs match rail references | PASS | 19/19 |
| Choice bank covers four modes per tone | PASS | all tone banks checked |
| Choice bank has 760 patterns | PASS | patterns=760 |
| Every choice forbids guaranteed success | PASS | all patterns checked |
| Status bank covers 19 tones | PASS | tones=19 |
| Status bank IDs match rail references | PASS | 19/19 |
| Status bank has six templates per tone | PASS | templates=114 |
| No second LLM in warden | PASS | deterministic-only declared |
| Warden includes core semantic validators | PASS | core validators present |
| At least 24 evaluation fixtures | PASS | fixtures=24 |
| At least three renderings per fixture | PASS | all fixtures checked |
| Fixture metadata counts match | PASS | counts agree |
| Fixture canonical hashes validate | PASS | all hashes valid |
| Every tone appears in fixture renderings | PASS | covered=19 missing=[] |
| Never-lines include YES and NO rows | PASS | Counter({'NO': 209, 'YES': 57}) |
| Never-lines include Kid flags | PASS | rows=266 |
| No empty Markdown sections | PASS | files=15 |
| No licensed-series terms in player-facing banks | PASS | none |
| No living-author clone instructions in player-facing banks | PASS | none |
| No WOF token in deliverables | PASS | none |
| No empty files | PASS | files=29 |
| Unknowns register names missing attachment classes | PASS | all classes named |
| Unknowns register uses INPUT REQUIRED | PASS | count=14 |

## Required self-check

- [x] No WOF
- [x] No living-author clone instructions
- [x] No licensed series banks
- [x] No second Continuity-Warden LLM
- [x] Personality cannot override ledger
- [x] Images: no baked lettering
- [x] All 22 kit keys appear in matrix
- [x] Shipped personality IDs used by exact ID
- [x] Kid Mode deltas present
- [x] Unknowns listed honestly

## Important interpretation

The warden’s internal blocklist may name prohibited IP solely so deterministic validation can reject it. Player-facing banks are scanned separately and contain none of those names. “No second LLM” means the design uses regex, classifiers, and deterministic validators only; documentation may state that prohibition explicitly.
