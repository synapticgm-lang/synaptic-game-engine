# Tone Blind-Taste and Continuity Regression Protocol

**Author:** Manus AI  
**Purpose:** Determine whether players can distinguish intended tone without sacrificing comprehension, respect, agency, or canonical accuracy.

> **Order of operations:** A sample is eligible for taste testing only after it passes render-equivalence, hard-gate, and Kid Mode checks. A charming sample that changes a fact is a failed sample.

## 1. Test questions

The protocol answers four questions. First, does each renderer produce a perceptibly distinct tone while preserving the same authority payload? Second, can players identify the intended target words without seeing the tone label? Third, does the rendering remain trustworthy, respectful, and easy to act on? Fourth, do results hold across engine mode, perspective, severity, and Kid Mode?

NN/g’s tone research supports evaluating content along formal–casual, serious–funny, respectful–irreverent, and matter-of-fact–enthusiastic dimensions and testing interpretation with representative users rather than relying on internal judgment.[1] [2] [3]

## 2. Stimulus construction

| Control | Requirement |
|---|---|
| Canonical input | Use one `authority_input` from `tone_eval_fixtures.json`; do not edit the payload between tone variants. |
| Surface parity | Keep names, numbers, event order, paragraph count band, and choice affordances stable enough that content—not plot novelty—drives preference. |
| Blind label | Show `Sample A/B/C`, never the internal tone ID, personality ID, theme name, or intended adjective. |
| Visual isolation | First round is text-only. A second optional round adds a constant neutral theme. Theme-specific testing is separate. |
| Randomization | Randomize variant order per participant and rotate which tone receives each letter. |
| Perspective | Test second- and third-person cells separately; do not mix perspective inside one comparison. |
| Kid testing | Run only with appropriately recruited participants and guardian/organizational safeguards. **COUNSEL / RESEARCH OPS** defines consent and age requirements. |

## 3. Stage A — deterministic preflight

Every variant must pass these checks before human exposure:

| Gate | Pass condition |
|---|---|
| Canonical hash | `canonicalHash(authorityProjection(render)) === fixture.canonical_sha256`. |
| Number fidelity | All game-state numbers are exact; no unsupported number appears as a timer, probability, distance, damage, or price. |
| Entity and exit subset | Rendered entities and exits are subsets of SceneManifest/SNAPSHOT, except non-entity atmosphere tokens approved by schema. |
| Choice legality | Every displayed action binds to a current `choiceTierRules` permit. Labels do not promise success. |
| Prose warden | All blocking deterministic rules pass; no second LLM critic runs. |
| Kid gate | If tagged, plain-language, no-pressure, no-adult-chrome, non-graphic, and safe-confirmation checks pass. |
| Art independence | The sample remains complete if art is missing or delayed. |

Use Vitest parameterized tests for the repeated fixture matrix and snapshots for reviewed presentation output.[10] [11]

## 4. Stage B — blind participant evaluation

Participants read three renderings of the same scene. They first answer comprehension questions with objective answers, then rate each sample on five-point semantic differentials.

| Measure | Prompt | Success target |
|---|---|---|
| Fact recall | “Where are you, who is present, what changed, and what options remain?” | 100% on critical state facts; investigate any lower result. |
| Formality | Formal 1–5 Casual | Median within one point of target profile. |
| Humor | Serious 1–5 Funny | Median within one point, with forbidden-context jokes scored as automatic failures. |
| Respect | Respectful 1–5 Irreverent | No sample may be perceived as blaming or humiliating the player by more than a small isolated minority; qualitative review required. |
| Energy | Matter-of-fact 1–5 Enthusiastic | Median within one point of target profile. |
| Target words | Select up to five adjectives from a randomized controlled list. | At least two intended words among the top choices and no critical anti-tone word among the top three. |
| Agency | “I understand what I can do next.” | Median ≥4/5. |
| Trust | “I trust the status and consequence information.” | Median ≥4/5. |
| Distinctness | “A, B, and C feel meaningfully different.” | Median ≥4/5 for intended contrast sets. |
| Preference | Forced rank plus free-text reason. | Descriptive, not a universal winner metric. |

The proposed thresholds are **SPECULATIVE product gates**, not published norms. Pilot with a small internal cohort, inspect qualitative failure modes, then commission a power analysis from observed variance before claiming population-level significance.

## 5. Contrast sets

| Set | Tones | Why |
|---|---|---|
| Precision | `litrpg_system_registrar`, `clinical_auditor`, `military_procedural` | Tests whether three factual voices remain distinguishable without jargon inflation. |
| Warmth | `cozy_low_stakes_comfort`, `warm_chronicle`, `bright_field_guide` | Separates comfort, memory, and curiosity. |
| Dark | `grimdark_bleak_consequence`, `gothic_moonlit_dread`, `ashen_archivist` | Separates consequence, atmosphere, and history while holding severity constant. |
| Energy | `pulp_kinetic_adventure`, `street_balladeer`, `pyoa_branching_crisis` | Separates camera motion, oral cadence, and immediate agency. |
| Wit | `dry_wit_deadpan`, `noir_case_file`, `cozy_brutal` | Detects sarcasm drift and player-targeted humor. |
| Wonder | `mythic_portent`, `fae_uncanny_tale`, `kid_plain_stakes` | Tests grandeur, uncanniness, and plain safety without implied new facts. |

## 6. Theme and image pairing test

After text-only tone validity passes, test theme suggestions separately. Ask whether the kit fits the tone and whether participants infer nonexistent story facts from the visual. Any image that causes a majority to report an absent entity, location, faction, reward, or clue fails even if attractive. Do not test baked lettering because it is prohibited by product law.

## 7. Regression cadence and stop rules

Run the deterministic suite on every bank, rail, template, warden, and prompt change. Run a focused blind taste when a tone’s dimensions shift by more than one scale point, a Simple picker label changes, a new high-severity theme pairing is introduced, or a Kid Mode gate changes. Stop rollout on any ledger mismatch, consent ambiguity, hidden cost, recurring player-blame phrase, or false visual fact. Snapshot updates require reviewer approval; CI must not auto-accept changed snapshots.[11]

## 8. Analysis template

Report medians and distributions for ordinal scales, factual error counts, gate failure counts, and the themes from open comments. Do not compress comprehension, trust, and preference into one score. A preferred tone that reduces fact recall does not ship. Segment exploratory results by engine mode, perspective, Kid Mode, and familiarity with RPG conventions; mark small cells as directional.

## References

[1]: https://www.nngroup.com/articles/tone-of-voice-dimensions/ "The Four Dimensions of Tone of Voice — Nielsen Norman Group"
[2]: https://www.nngroup.com/articles/tone-voice-users/ "The Impact of Tone of Voice on Users’ Brand Perception — Nielsen Norman Group"
[3]: https://www.nngroup.com/articles/tone-voice-words/ "Tone-of-Voice Words — Nielsen Norman Group"
[10]: https://vitest.dev/guide/learn/writing-tests.html "Writing Tests — Vitest"
[11]: https://vitest.dev/guide/snapshot "Snapshot — Vitest"
