# Cursor Wiring Note

**Target files:** `actionValidation.test.ts`, `proseWarden.test.ts`  
**Fixture authority:** SynapticGM product-law stamp `2026-08-25b`

> **EVIDENCED:** The engine-owned snapshot and ledger are authoritative; the LLM is a read-only renderer. The hard gate is pre-GM and must avoid API spend when it blocks. The prose warden is deterministic regex-and-code repair after GM generation. **SPECULATIVE:** The adapter guidance below names observable contracts rather than internal functions so it can fit the repository’s existing interfaces.

## Load and normalize

Load `scenarios.csv` with an RFC 4180 parser. Parse `setup_snapshot_json` with a strict JSON parser and deep-clone the result before invoking the subject under test. Treat CSV strings as data; do not evaluate `automated_assert` as source code. Instead, split that field on semicolons, trim each clause, and split each clause on its first equals sign.

| CSV field | Test role |
|---|---|
| `id` | Stable test-case name and failure prefix. |
| `class` | Suite routing and reporting only; it must not change product behavior. |
| `setup_snapshot_json` | Immutable authoritative input and expected fact baseline. |
| `last_gm_story` | Prior story beat for validation rows; candidate GM prose for every `D-prose` row and any row with a non-`none` warden pattern. |
| `player_input` | Player draft passed to action validation. Pure prose rows may leave it empty. |
| `expect_hard_gate` | Exact decision: `block`, `allow`, or `skip`. |
| `expect_warden_scrub` | Exact repair ID, or `none`. |
| `expect_facts_unchanged` | Whether all supplied snapshot and nested ledger facts must deep-equal the baseline. |
| `fail_symptom` | Failure message context; never use it to determine behavior. |
| `automated_assert` | Declarative checks to map to repository observables. |
| `notes` | Human rationale; never branch behavior on it. |

**SPECULATIVE:** If the production return type uses different labels, add a single adapter that normalizes it to `block|allow|skip`. Do not special-case individual fixture IDs inside product code or the adapter.

## `actionValidation.test.ts`

Route `A-turn`, `B-opening`, `C-quest`, and `E-chrome` rows through action validation. Assert the normalized decision equals `expect_hard_gate`. For `block`, spy on the hosted GM request boundary and require zero calls, and enforce **no text-turn spend**. Also deep-compare every authoritative snapshot field before and after validation.

For `E-chrome` block rows, map the DSL tokens as follows:

| Token | Required check |
|---|---|
| `api_calls=0` | Hosted GM boundary was never called. |
| `text_turn_delta=0` | Text-turn counter before and after is equal. |
| `repair_banner=visible` | Repair banner is present and visible. |
| `draft_restored=exact` | Input control value equals the original `player_input` exactly, including punctuation and casing. |
| `options_include=Look around|Check what you carry` | Both option labels exist; ordering is not material. |
| `cancel=enabled` | Cancel control exists and is enabled. |

An `allow` row must not be converted into a missing-fact block. A `skip` row must take the skip path rather than the missing-fact path. **EVIDENCED:** Look-around, room examination, opening covers, layout asks, and informational/options/panel asks are skipped entirely by the hard gate. **SPECULATIVE:** Whether a skip later invokes a non-validator information flow is outside this fixture’s assertion unless the repository already exposes that observable.

## `proseWarden.test.ts`

Route every `D-prose` row and every scenario with `expect_warden_scrub != none` through the deterministic prose warden. Pass the parsed snapshot plus `last_gm_story` as candidate renderer prose. Require the reported or matched rule to equal `expect_warden_scrub`.

For a positive scrub, assert the contradictory clause is gone, the authoritative fact equals the supplied snapshot or ledger, and lawful surrounding text remains. For `none`, require exact input/output prose equality. Do not accept a whole-turn rejection as a successful repair.

Load `good_prose.csv` into the same suite. Parse `snapshot_json`, run each `prose` cell through the warden, and require each `must_keep_phrases` token, split on the literal delimiter ` || `, to remain verbatim. Interpret `must_not_invent` as declarative fact constraints; adapt each phrase to the repository’s snapshot comparison helper rather than searching those English words in output.

Load warden-oriented `adversarial_almost_false.csv` rows as classifier/repair boundary checks. `allow` means leave the sentence unchanged; `scrub` means repair the explicitly grounded contradiction; `skip` is an action-validation classification and belongs in the validation suite.

## Deep fact comparison

Compare every field supplied by the fixture, including nested `ledger`, `quest`, `event`, `weather`, or encounter data. Do not fill omitted optional fields with invented defaults during the equality assertion. Arrays representing exact named facts, including `exits`, `inventory`, `present`, and `companions`, should preserve their supplied strings. **SPECULATIVE:** If production ordering is not contractual, compare these arrays as multisets only after confirming the repository already treats their order as irrelevant.

## False-positive warnings

> **EVIDENCED:** Atmosphere is free. Smell, rust, cadence, metaphor, NPC mannerism, and compatible weather texture are not factual violations.

Regex must be context-bounded. Do not scrub merely because a sentence contains `box`, `last`, `empty`, `outside`, `hours`, `safe`, `crowd`, `door`, `window`, `hall`, or `street`.

| Boundary | Required caution |
|---|---|
| Poetry and metaphor | Preserve explicit similes, “seems” personification, emotional loneliness, hyperbole, and sensory texture. |
| NPC statements | A lie, guess, boast, quotation, or uncertainty is character speech, not engine fact. Do not silently promote it to ledger truth or scrub it as narrator truth. |
| Player jokes and hypotheticals | Jokes, negation, conditional clauses, future intent, and counterfactuals do not assert current world state. |
| Representation context | Words on signs, maps, murals, paintings, book titles, labels, and UI controls do not establish physical props, people, exits, or locations. |
| Polysemy | Theatre box, text box, check box, lunchbox, safe as a noun, `Last` as a surname, and companion as a title/label require grammatical context. |

Use `good_prose.csv` and the 41 `allow` adversarial rows as mandatory regression tests after any regex change. A repair that fixes a positive row but damages one of these controls is a failure.

## Failure reporting

Prefix failures with fixture `id`, `class`, expected gate, and expected pattern. Report the first failed DSL clause, the pre/post prose diff for warden cases, and the first changed authoritative JSON path for fact mutations. This keeps one faulty repair from appearing as an opaque full-suite failure.

## References

This note derives exclusively from the user-supplied product law and the local fixture contracts in this pack; it has no external dependencies.
