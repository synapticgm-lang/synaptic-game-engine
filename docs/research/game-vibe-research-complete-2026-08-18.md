# V11 — Research-Complete Checklist

## Definition of “done enough to code”

Research is complete enough to code when a concept has a defined player promise, authority-safe input/output contract, failure behavior, acceptance test, accessibility baseline, and an identified owner. It is **not** complete because a compelling example exists. The ledger is the hard boundary: no design may allow retrieval, summary, personality, or visual treatment to override player correction, pinned canon, StateTx, SceneManifest, or supported evidence.

| Workstream | Done enough to code | Still needs content writing | Still needs counsel / policy |
|---|---|---|---|
| Correction transaction | Yes: authority resolver, downstream recompute, receipt, supersession UI, fixture set. | Exact in-world error/repair templates by personality. | Data retention and correction-history visibility. |
| State receipts | Yes: event taxonomy, schema, compact/expanded views, dismiss/accessibility rules. | Engine-specific phrasing and theme copy. | None beyond accessibility standards. |
| OpenAsk Q&A | Yes: question taxonomy, source labels, mutation prohibition, direct-answer format. | Factual response templates and glossary. | Sensitive-content and privacy answer boundaries. |
| Personality firewall | Yes: two-stage pipeline, profile schema, equivalence regression suite. | Profile examples, notice copy, idiom exclusions. | Mature-content and protected-style policy. |
| HookArc first hour | Yes: beat skeletons, trigger gates, telemetry questions. | Original opener scenes, NPC dialogue, setting assets. | Content-rating / intensity review. |
| Check/fair-loss UI | Yes: card fields, visibility rules, outcome receipt, review. | Flavor variants by engine/theme. | Gambling-like presentation and youth suitability. |
| Quest/map/inventory enrich | Yes: fields, provenance, uncertainty labels, inspect behavior. | Item/place/quest content and themes. | Economy, pricing, and child-facing scarcity language. |
| Memorable Splash | Yes: eligibility, skip/accessibility, state-first trigger, frequency cap. | Original art direction and asset prompts. | Depiction and age-rating review. |
| TTS pilot | Yes: opt-in model, text equivalence, control layout, pilot metrics. | Voice direction and scripts. | Voice rights, privacy, accessibility, cost governance. |
| Kid Mode | Partially: stricter interaction defaults, cue rules, no-ad policy, test cases. | Age-appropriate language library. | **Required**: age assurance, privacy, jurisdictional obligations, content policy. |
| Marketing claims | No public use until evidence register exists. | Benefit copy and demo scripts. | **Required**: substantiation and comparative-claim review. |

## Build-ready specification checklist

- [x] Authority order has been embedded as an invariant in every design section.
- [x] Retrieval and summaries are explicitly labelled advisory and non-authoritative.
- [x] Personality is defined as a post-resolution renderer with semantic invariants.
- [x] Four engine modes have non-negotiable failure lines.
- [x] Kid Mode differences are interaction-contract differences, not a cosmetic downscale.
- [x] First-hour beat sheets exist for two original opener shapes.
- [x] System, tabletop, and PYOA chrome have visibility and honesty rules.
- [x] Combat, quest, inventory, and map receipts map to existing modules.
- [x] Fifteen differentiators are ranked with demos, metrics, and claim boundaries.
- [x] Backlog uses done-when tests rather than feature names alone.
- [ ] Product team must supply current API/schema details for exact field mapping and engineering estimates.
- [ ] Playtests must validate wording, pacing, cue density, and Kid Mode comprehension.
- [ ] Counsel must approve public claims and age/privacy/content controls.

## Required artifacts before implementation merge

| Artifact | Minimum content | Gate |
|---|---|---|
| Authority invariant tests | Conflict cases for all six authority levels and derived summary/RAG inputs. | P0 merge blocker. |
| Scene fixture corpus | At least correction, refusal, ambiguity, joke, bargain, open ask, fair loss, callback, and Kid Mode cases per engine. | P0 merge blocker. |
| Profile contract | Allowed mutable fields, prohibited changes, copy examples, equivalence test. | P0 merge blocker. |
| Receipt design tokens | Semantic labels, visual/audio redundancy, reduced-motion and screen-reader behavior. | P1 merge blocker. |
| HookArc content pack | Original opening beats, permitted verbs, contextual teaching points, state hooks. | P1 readiness. |
| Playtest protocol | Recruitment, comprehension questions, success metrics, stopping criteria. | Pilot gate. |
| Claims register | Claim, exact demo/version, test evidence, limitations, owner, review date. | Public launch blocker. |
| Kid Mode review packet | Defaults, prohibited patterns, data flows, tests, escalation routes. | Kid Mode launch blocker. |

## Self-check

| Constraint | Result | Evidence in package |
|---|---|---|
| No WOF / “world-out-of-facts” drift | Pass: every recommendation requires source labels and authority order. | V1, V2, V6, V10. |
| No RAG-as-truth | Pass: retrieval/summaries are advisory only. | Executive scorecard, V1, V2, V3, V8. |
| Personality cannot override ledger | Pass: resolver-before-renderer and equivalence testing required. | V3, V10. |
| No licensed series names in player-facing content | Pass: original hook/preset examples only. | V1, V3, V4. |
| No every-turn comic | Pass: event-driven Memorable Splash policy. | V4, V5, V9, V10. |
| No mid-action soft offers | Pass: safe-beat policy throughout. | V1, V2, V4, V7. |
| Kid Mode stricter; no Kid ads | Pass: explicit interaction and notification constraints. | V1, V2, V7, V10. |

## Validation plan

Run two weekly review loops. **Continuity review** replays canonical fixtures under current resolver, retrieval candidates, and all personality profiles; any authority violation fails closed. **Vibe review** runs blinded scene comparisons and moderated playtests that ask players what happened, what changed because of them, what they believe is true, and whether they felt answered. Narrative appeal must be measured alongside comprehension; engagement metrics alone can conceal confusion or pressure. [1]

**SPECULATIVE:** Initial fixture counts, weekly cadence, and pass thresholds should reflect release risk and system change rate.  
**COUNSEL:** This document identifies topics for review, not legal advice. Requirements for child-directed features, data retention, content moderation, marketing, and regional launch vary by jurisdiction.

## References

[1]: https://gamesuserresearch.com/how-to-run-a-games-user-research-playtest/ "Games User Research — How to Run a Playtest"
[2]: https://www.ftc.gov/business-guidance/advertising-marketing "FTC — Advertising and Marketing"
[3]: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/ "UK ICO — Age Appropriate Design Code"
