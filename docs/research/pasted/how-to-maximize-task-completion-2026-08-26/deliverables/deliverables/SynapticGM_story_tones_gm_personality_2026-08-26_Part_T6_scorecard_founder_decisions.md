# Part T6 — Scorecard and Founder Decisions

**Author:** Manus AI

The executive scorecard is provided separately as a one-page decision surface. This section records the decisions that preserve product law while maximizing expressive range.

| ID | Decision | Recommendation | Tradeoff | Verdict |
|---|---|---|---|---|
| D1 | Storage model | Store `tone_id` as an additive rendering preset beside existing `systemPersonality` / `gmPersonality`; do not create a new authority-bearing engine. | A separate personality engine may look cleaner but creates migration, precedence, and continuity risk. | RECOMMEND |
| D2 | New Game simplicity | Show four narrator picks and four System picks; move the full catalogue and `theatrical-jester` to Expert/More styles while preserving old saves. | Fewer first-run choices improve clarity but reduce visible novelty. | RECOMMEND |
| D3 | Expert tone breadth | Ship Expert tones only after shared invariant fixtures pass; start with text rails before themed art. | A large catalogue is attractive, but simultaneous prose and art rollout makes failures hard to diagnose. | RECOMMEND |
| D4 | Surprise-me | Use an allowlist conditioned on engineMode, rating, Kid Mode, and scene severity; never randomize banned pairings. | True randomness feels surprising but can produce disrespectful or inaccessible combinations. | RECOMMEND |
| D5 | Art frequency | Keep art asynchronous and sparse; interpret “20%” as a target among already-eligible Free beats, not all turns. | Higher frequency increases perceived value but magnifies cost, repetition, and fact-invention pressure. | RECOMMEND |
| D6 | Template IDs | Do not assign memorable Templates 01–20 until the missing style guide is ingested; ship recipe IDs and semantic layout classes now. | Guessing IDs would look complete but create false implementation confidence. | RECOMMEND |
| D7 | Quality gate | Require canonical-hash equality before tone distinctness and preference testing. | Strict gating can reject attractive prose, but factual trust is the product moat. | RECOMMEND |
| D8 | Commerce and rights | Treat seasonal kit×tone bundles and audio likeness as P2 **COUNSEL** items; never sell safety or Kid protections. | Commerce can fund premium presentation, but rights, refunds, age treatment, and dark patterns need explicit review. | RECOMMEND |

## Cross-check rule

Every recommendation in this pack carries one of four statuses: **VERIFIED** by a public source or live endpoint; **PROVIDED SUMMARY** from the attached task brief; **SPECULATIVE** product design requiring testing; or **COUNSEL** requiring legal/commercial review. Details dependent on absent internal attachments are **INPUT REQUIRED**.

## Final founder call

Approve P0 deterministic rails, status templates, never-lines, and fixtures. Approve P1 design work but block template-ID and COGS commitments until the missing packs are supplied. Keep P2 comic strips, audio, and commerce outside the launch critical path.
