# V9 — Blow-Away Vibe Differentiators

## Scoring method

Each concept receives 1–5 ratings for **Impact**, **Feasibility**, and **Uniqueness**. The priority score is the product of those ratings, adjusted downward if the concept threatens ledger authority, Kid Mode, or active-action pacing. These are **SPECULATIVE** prioritization hypotheses; validate with player tests and engineering estimates. HEART-style measures separate happiness, engagement, adoption, retention, and task success rather than treating session length as delight. [1]

| Rank | Player-visible moment | I | F | U | Score | Ledger hook | Honest claim boundary |
|---:|---|---:|---:|---:|---:|---|---|
| 1 | Correction becomes reality | 5 | 5 | 5 | 125 | Player correction → downstream recompute | “Correct what the game gets wrong.” |
| 2 | Choice receipt changes a relationship | 5 | 4 | 5 | 100 | StateTx relationship delta | “See relationships respond to your choices.” |
| 3 | Ask “why?” and get a direct answer | 5 | 5 | 4 | 100 | StateTx + evidence Q&A | “Inspect why the world changed.” |
| 4 | Fair loss replay | 5 | 4 | 4 | 80 | OutcomeToken timeline | “Review what led to a setback.” |
| 5 | Callback with payoff | 5 | 4 | 4 | 80 | Callback reuse budget | “Your earlier commitments can come back to matter.” |
| 6 | Personality-stable alternate opener | 4 | 5 | 4 | 80 | CampaignContract + profile | “Start with distinct original hooks and voices.” |
| 7 | Witness-aware secrets | 5 | 3 | 5 | 75 | Evidence/witness state | “Ask who knows what happened.” |
| 8 | In-world System receipt | 4 | 5 | 3 | 60 | StateTx rendered as chrome | “The system keeps stakes readable.” |
| 9 | One-click fact provenance | 4 | 4 | 3 | 48 | Source-linked claim | “Inspect what supports a fact.” |
| 10 | Quest blocker answer | 4 | 5 | 2 | 40 | Quest enrich + evidence | “Know why you are blocked without spoilers.” |
| 11 | Map knowledge layers | 4 | 4 | 2 | 32 | Places + evidence | “See what is confirmed, rumored, and unknown.” |
| 12 | Memorable Splash | 4 | 3 | 3 | 36 | Milestone StateTx | “Mark the moments that changed your run.” |
| 13 | Bargain as a recorded promise | 4 | 3 | 3 | 36 | Conditional commitment StateTx | “Deals persist after the conversation.” |
| 14 | No-recycle social response | 3 | 4 | 3 | 36 | Semantic fingerprint | “Conversation moves instead of looping.” |
| 15 | Ambient pause line | 2 | 5 | 2 | 20 | Scene-only flavor | “A little atmosphere between decisions.” |

## Three-turn demos

| Rank | Turn 1 | Turn 2 | Turn 3 | Metric |
|---:|---|---|---|---|
| 1 | Player: “No, the key is brass, not bone.” | Receipt: `Corrected: key material · brass.` | Narration/locks now use brass; inspect shows superseded fact. | Correction applied without restart; false-conflict rate. |
| 2 | Player lets a courier go. | Courier later warns the player of a raid. | Receipt: `Courier trust: changed.` | Player correctly attributes callback to choice. |
| 3 | Player: “Why can’t I enter?” | “State: your dock permit is revoked; observed: guard has your name.” | Player investigates an authorized lead. | Direct-answer satisfaction; follow-up success. |
| 4 | Enemy telegraphs a marked lane. | Player remains; receives burn condition. | Review explains telegraph and altered position. | “Loss felt fair” rating. |
| 5 | Player jokes about a hidden oath. | NPC remembers it only when the oath becomes relevant. | The joke alters a later persuasion option. | Callback recognition; duplicate callback suppression. |
| 6 | Same opener contract, Cold Registrar vs Warm Chronicle. | Both resolve identical action. | Players choose tone without factual divergence. | Blind preference + semantic equivalence. |
| 7 | Player steals a seal. | Q&A distinguishes confirmed witness from suspicion. | An NPC acts only if witness state supports it. | Witness-consistency pass rate. |
| 8 | Player gains a permitted verb. | System notice uses theme chrome. | Action works exactly as described. | Comprehension / notice-dismiss rate. |
| 9 | Player clicks “Why is the stair sealed?” | Provenance shows guard order + StateTx. | Player corrects a claimed date if wrong. | Provenance click-to-resolution time. |
| 10 | Player opens journal. | “Blocked: living witness required.” | Evidence-linked lead appears. | Quest next-action success. |
| 11 | Player opens map. | Confirmed bridge / rumored tunnel distinguished. | Travel reveals only supported discovery. | Knowledge-layer comprehension. |
| 12 | A companion bond crosses a real threshold. | Optional splash celebrates the scene change. | Player returns to action with receipt. | Skip rate; moment recall. |
| 13 | Player offers a map for passage. | NPC counteroffers. | Accepted terms become a pending obligation. | Bargain survival across turns. |
| 14 | Player repeats a joke. | NPC reaction advances instead of replaying. | A changed social state is visible only if real. | Repetition complaint rate. |
| 15 | Player pauses at shop. | One skippable ambient line. | No fact/quest changes without action. | Intrusion rating. |

## Evaluation guardrails

Memorable moments must be evaluated as more than engagement. Narrative research distinguishes **comprehension**—what players believe happened and why—from **appeal**—whether they want to continue. [2] Every differentiator test includes: factual recall, causal attribution, emotional specificity, confusion point, willingness to continue, and whether an accessibility setting altered comprehension.

Build a versioned claims register. A marketing phrase can be used only if its demo is reproducible in the shipped release and its limitation is not hidden by implication. Objective claims require prior substantiation; “remembers everything,” “never breaks continuity,” and “safe for all ages” are prohibited wording. [3]

**COUNSEL:** Public claims, testimonials, Kid Mode language, and comparative advertising require legal review in launch markets.

## References

[1]: https://research.google/pubs/measuring-the-user-experience-on-a-large-scale-user-centered-metrics-for-web-applications/ "Google — HEART Framework"
[2]: https://gamesuserresearch.com/how-to-playtest-your-games-story/ "Games User Research — Story Playtesting"
[3]: https://www.ftc.gov/legal-library/browse/ftc-policy-statement-regarding-advertising-substantiation "FTC — Advertising Substantiation Policy"
