# SynapticGM Snapshot Evaluation Pack

**Pack prefix:** `SynapticGM_snapshot_eval_pack_2026-08-25`  
**Product-law stamp:** `2026-08-25b`  
**Author:** Manus AI

> **EVIDENCED:** The engine is the source of truth, the LLM is a read-only renderer, the pre-GM hard gate must spend no API call when it blocks, and the post-GM prose warden repairs only contradictory prose. **SPECULATIVE:** This pack encodes those laws as a compact assertion DSL and deterministic rewrite-pattern IDs so Cursor can translate the rows into local Vitest conventions without receiving application code from this pack.

## Contents

| File | Rows or scope | Purpose |
|---|---:|---|
| `scenarios.csv` | 100 | Hard-gate, skip, allow, prose-repair, quest-ledger, snapshot-authority, and chrome fixtures. |
| `good_prose.csv` | 30 | Legal prose that must remain unchanged; this is the principal over-scrub regression corpus. |
| `adversarial_almost_false.csv` | 50 | Polysemy, quotation, metaphor, negation, hypothetical, joke, representation, and true-contradiction boundary cases. |
| `pattern_ids.md` | 18 pattern IDs | Plain-English repair templates, required snapshot fields, fail examples, and leave-alone examples. |
| `coverage.md` | Required checklist | Direct traceability from each required case to fixture IDs. |
| `wiring_note.md` | One-page integration note | Column-to-assert mapping and false-positive cautions for Cursor. |
| `validation_report.json` | Generated report | Deterministic count, schema, enum, JSON, diversity, pattern, and coverage results. |

**EVIDENCED:** The three CSV datasets exceed the requested minimums of 80, 20, and 40 rows. **SPECULATIVE:** `validation_report.json` is included as a review artifact; it is not an engine runtime dependency.

## How to use `scenarios.csv`

Read the CSV with an RFC 4180-compatible parser and parse `setup_snapshot_json` as JSON. Do not split rows or JSON fields with ad hoc comma logic. Each row is independent and should begin from a fresh copy of the parsed snapshot.

| Column | Interpretation |
|---|---|
| `id` | Stable fixture identifier used by test names and `coverage.md`. |
| `class` | Routing label: `A-turn`, `B-opening`, `C-quest`, `D-prose`, or `E-chrome`. |
| `setup_snapshot_json` | Authoritative engine state. It must be treated as immutable input unless the fixture explicitly expects a valid state-changing action. |
| `last_gm_story` | **SPECULATIVE dual-use contract:** prior story context for hard-gate rows; candidate GM renderer prose for rows with a non-`none` warden pattern and all `D-prose` rows. |
| `player_input` | Player draft supplied to action validation. It is intentionally empty in pure `D-prose` rows. |
| `expect_hard_gate` | Expected pre-GM decision: `block`, `allow`, or `skip`. |
| `expect_warden_scrub` | `none` or one exact pattern ID documented in `pattern_ids.md`. |
| `expect_facts_unchanged` | Whether authoritative snapshot and ledger facts must compare equal before and after the tested stage. |
| `fail_symptom` | Human-readable regression caught by the row. |
| `automated_assert` | Semicolon-delimited, implementation-neutral key/value assertion contract. It is data, not TypeScript. |
| `notes` | Evidence label plus fixture rationale and, where useful, LitRPG/story-RPG variation. |

For each row, route the action decision first. A `block` row passes only when validation blocks before any GM API call. An `allow` row passes only when validation does not produce a missing-fact block. A `skip` row passes only when it takes the designated bypass path rather than being misclassified as a missing-fact block.

**EVIDENCED:** Player claims involving a missing item, absent companion, unsupported unique container, or ungrounded Proper Name belong to the hard gate. GM-invented contradictions belong to the prose warden. **SPECULATIVE:** For combined `C-quest` rows, Cursor may execute action validation and prose repair as two assertions inside one fixture, provided a failure reports the stage that failed.

## Assertion DSL

The `automated_assert` cell uses semicolon-delimited clauses such as `gate=block`, `api_calls=0`, `warden_pattern=PW_CROWD_SIZE_OVERSTATE`, or `facts_unchanged=yes`. Split on semicolons, trim whitespace, and interpret the first `=` as the key/value boundary. Inside the `options_include` value, the pipe character separates required option labels.

| Clause | Required interpretation |
|---|---|
| `gate=block|allow|skip` | Exact action-validation decision. |
| `api_calls=0` | No hosted GM request is issued for a blocked draft. |
| `validation_decision_emitted=true` | Validation returned the expected non-blocking decision. |
| `warden_pattern=<id>` | The repair reports or exercises the named deterministic rule. |
| `offending_clause_absent=true` | The contradictory factual clause is absent after repair. |
| `legal_context_preserved=true` | Surrounding lawful prose remains present. |
| `prose_exactly_preserved=true` | A no-scrub control must be byte-for-byte unchanged. |
| `facts_unchanged=yes|no` | Snapshot/ledger facts compare as required by the row. |
| `repair_banner=visible` | Block UI displays a repair banner. |
| `draft_restored=exact` | The original player draft is restored exactly. |
| `options_include=Look around|Check what you carry` | Both repair options are present. |
| `cancel=enabled` | Cancel is available after a block. |
| `text_turn_delta=0` | The blocked attempt spends no text turn. |

**SPECULATIVE:** A local adapter may map these keys to different object paths. It must preserve their semantics and must not weaken exact string checks on player draft restoration or good-prose preservation.

## Pass/fail rules

A scenario row **passes** only when every clause in `automated_assert` is true and all expected enums agree with the returned decision. For `expect_facts_unchanged=yes`, perform a deep equality comparison over every authoritative field supplied by the row, including nested `ledger`, `quest`, `event`, `weather`, or other tracked objects.

A scenario row **fails** if any of the following occurs: a blocked draft causes API spend; an allow or skip is turned into a missing-fact block; a requested warden pattern is not applied; the wrong pattern is applied; legal context is damaged; a no-scrub control changes; a fact differs from the snapshot/ledger; or required chrome is missing after a block.

| Dataset | Passing condition | Failure signal |
|---|---|---|
| `scenarios.csv` | All row enums and all DSL clauses hold. | Any stage contradicts the row contract or mutates protected facts. |
| `good_prose.csv` | Every `must_keep_phrases` token remains verbatim and every `must_not_invent` constraint holds. | Legal prose is removed, normalized, or converted into a new fact. |
| `adversarial_almost_false.csv` | Result equals `correct_expect`. | Keyword-only behavior ignores quotation, metaphor, negation, representation, or explicit contradiction context. |

**EVIDENCED:** Atmosphere, smell, rust, cadence, metaphor, NPC mannerism, and compatible sensory flair are free. **SPECULATIVE:** For false-positive prevention, exact preservation is deliberately stricter than semantic equivalence in the good-prose corpus.

## Test-file routing

| Rows | Test file |
|---|---|
| `A-turn`, `B-opening`, `C-quest` hard-gate/skip portion, and `E-chrome` | `actionValidation.test.ts` |
| `D-prose`, every row whose `expect_warden_scrub` is not `none`, `good_prose.csv`, and warden-oriented adversarial rows | `proseWarden.test.ts` |

The pack names only the two requested test files and intentionally contains no TypeScript implementation.

## Pattern IDs used in `scenarios.csv`

| Pattern ID | Primary authority protected |
|---|---|
| `PW_LAST_CONTAINER_UNGROUNDED` | Props, inventory, and unsupported uniqueness. |
| `PW_CROWD_SIZE_OVERSTATE` | Crowd presence and tracked approximate size. |
| `PW_CROWD_ABSENCE_CONTRADICTION` | Present crowd state. |
| `PW_CROWD_PRESENCE_INVENTION` | Explicit alone arrival and no-crowd state. |
| `PW_STEP_OUTSIDE_WHILE_INDOOR` | Indoor state and unchanged location type. |
| `PW_ENTER_BUILDING_WHILE_OUTDOOR` | Outdoor state and unchanged location type. |
| `PW_UNTRACKED_TIME_SKIP` | Tracked time of day. |
| `PW_EVENT_OVER_RETCON` | Event continuity without time progression. |
| `PW_UNGROUNDED_PAST_RETCON` | Unsupported historical assertions. |
| `PW_TENSION_DROP_CONTRADICTION` | High tracked tension. |
| `PW_LOCATION_AS_SPEAKER` | Location as place, not literal speaker. |
| `PW_EXIT_WHITELIST_VIOLATION` | Exact exit whitelist. |
| `PW_INVENTORY_FACT_CONTRADICTION` | Exact inventory names and possession. |
| `PW_LEDGER_NUMBER_CONTRADICTION` | HP, MP, XP, gold, level, damage, or another supplied number. |
| `PW_PRESENCE_ROSTER_CONTRADICTION` | Present NPC and companion roster. |
| `PW_LOCATION_FACT_CONTRADICTION` | Current location. |
| `PW_WEATHER_FACT_CONTRADICTION` | Tracked weather. |
| `PW_QUEST_FACT_CONTRADICTION` | Quest target, count, status, or objective. |

## Recommended execution order

First run CSV/schema validation, then `actionValidation.test.ts`, then `proseWarden.test.ts`, and finally the good-prose/adversarial regressions. This order distinguishes malformed fixture failures from validator failures and deterministic repair failures.

> **EVIDENCED:** The warden is regex plus deterministic code, not a model, critic, fine-tune, graph database, or multi-agent system. **SPECULATIVE:** Tests should therefore avoid probabilistic thresholds, retries, semantic-judge calls, or any expectation that accepts several materially different factual outcomes.

## References

This pack has no external factual dependencies. Its sole authority is the user-supplied SynapticGM product-law and mission brief stamped `2026-08-25b`.
