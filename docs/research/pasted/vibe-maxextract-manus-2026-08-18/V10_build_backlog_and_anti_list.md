# V10 — Build Backlog and Anti-List

## Sequencing principle

Prioritize mechanisms that make the existing ledger **felt and trusted** before cosmetic variance. A beautiful voice system that can overwrite a correction is not a vibe feature; it is a continuity defect. Prioritization below weights player-visible value, continuity/safety impact, research confidence, engineering effort, operational cost, and failure severity. RICE is a transparent starting model, not a substitute for a safety veto. [1]

| Priority | Item | Extends | Done-when vibe test | Effort |
|---|---|---|---|---|
| P0 | Authoritative correction transaction | StateTx, pinned canon, SceneManifest | Player says “No, X”; affected claim updates in one turn; old claim is visibly superseded; no restart. | M |
| P0 | Semantic/style firewall | GM voice profiles, renderer | Same resolved fixture under all profiles has identical facts, math, permits, and state deltas. | M |
| P0 | Material state receipt | StateTx, OutcomeToken | After a meaningful result, players can name what changed and inspect why. | S |
| P0 | OpenAsk Q&A | SceneManifest, evidence | “Why / who knows / what changed” gets direct, source-labelled answer without mutation. | M |
| P0 | Continuity regression fixtures | beatFingerprint, StateTx | Corrections, inventory, HP, quests, witnesses, and Kid Mode cases fail closed on contradiction. | M |
| P1 | Repair state machine | IntentContract | Ambiguous, unsupported, and contradiction turns use targeted, non-repetitive repair. | M |
| P1 | First-ten-turn HookArc decks | HookArc, CampaignContract | Novices complete core loop, observe a consequence, and choose meaningful direction by turn 10. | M |
| P1 | Check / fair-loss card | OutcomeToken, StateTx | Testers explain why sampled loss occurred without hidden logs. | S–M |
| P1 | Personality picker (simple + expert) | GM profiles, themes | Player can select/alter style while semantic regression remains green. | M |
| P1 | Quest “what-next / why-blocked” enrich | Quest journal | Journal explains current blocker and known leads without spoilers or invented certainty. | S |
| P1 | Callback fingerprint + reuse budget | beatFingerprint, Memorable Moments | No near-duplicate callback; retained callback unlocks a payoff. | M |
| P2 | Witness / knowledge Q&A | Evidence, places, relationships | “Who knows?” distinguishes observed witness, suspicion, and unknown. | M |
| P2 | Inventory provenance + salvage receipt | StateTx, inventory | Player traces meaningful item to source and understands use/cost. | S–M |
| P2 | Map knowledge layers | Places, evidence | Confirmed route, rumor, and unknown remain visually distinct. | M |
| P2 | Event-driven Memorable Splash | Memorable Moments | Splash occurs only after a real threshold, keeps orientation, and is skippable. | M–L |
| P2 | Theme state language / accessibility audit | Theme kits, UI system | Every state cue works in grayscale, large text, mute, and reduced motion. | M |
| P3 | Selective TTS pilot | TTS cosmetics | Opt-in speech improves access/atmosphere without making facts audio-only. | M–L |
| P3 | Ambient pause line wedge | Shops / scenes | One skippable atmosphere line; no implicit quest/fact mutation. | S |

### P0 acceptance suite

| Fixture | Expected result |
|---|---|
| Player corrects an NPC location after a generated error. | Correction wins, visible state diff, current narration recomputes only affected facts. |
| Same scene rendered in all twelve personalities. | Full semantic equivalence; only allowed render attributes differ. |
| Player asks a factual state question mid-scene. | Direct answer, no action mutation, context preserved. |
| High-stakes ambiguous action. | One contrastive clarification or explicit confirmation; no silent assumption. |
| Kid Mode risky action. | Plain-language stakes, stricter confirmation, safe/cancel route, no pressure. |
| Older summary conflicts with StateTx. | Summary labelled derived; StateTx wins. |

## Anti-list

| Looks vibey | Why it fails | Safer replacement |
|---|---|---|
| Every-turn AI comic | Breaks pace, costs money, becomes a crutch for weak state feedback. | Event-driven Memorable Splash after a real threshold. |
| “I hear you” after every line | Ritual acknowledgement makes chat feel less human. | Silent progress; targeted receipt/repair. |
| Style prompt as a game engine | Personality can change facts, math, or permits. | Resolver-before-renderer firewall. |
| Summary as canonical lore | Compression and retrieval can be stale or wrong. | Ledger authority plus labelled derived context. |
| Hidden memory marketed as magic | Players cannot correct it and discover drift too late. | Inspectable, versioned state/provenance. |
| Mid-action help/offers | Breaks tension and violates HookArc pacing. | Queue offers to safe scene breaks. |
| Cosmetic choice flood | Creates false agency and cognitive overload. | Fewer intent-distinct options plus freeform input. |
| Opaque difficulty / surprise loss | Makes challenge feel arbitrary. | Telegraph / check card / fair-loss receipt. |
| Endless ambient banter | Turns setting into a chatbot wallpaper and risks contradiction. | Small, budgeted, skippable atmosphere wedge. |
| Kid Mode as a tiny adult skin | Leaves pressure, ambiguity, and privacy issues intact. | Stricter interaction contract and content defaults. |
| “Remembers everything” marketing | Not credibly substantiable and invites trust failure. | Bounded claim tied to correction, continuity checks, and shipped behavior. |

## Operational metrics

Use a combined quality dashboard: continuity fixture pass rate; correction-to-ledger latency; semantic-drift rate by personality; question answerability; repeated-offer rate; failure fairness; first-hour comprehension; accessibility cue comprehension; and Kid Mode accidental acceptance. Regression testing should use impact analysis for small changes and periodic full suites for runtime/policy changes. [2]

**SPECULATIVE:** Effort estimates are relative planning bands only; they need architecture review and staffing assumptions.  
**COUNSEL:** Any launch sequencing involving Kid Mode, claims, or user-data memory must be independently cleared before release.

## References

[1]: https://www.atlassian.com/agile/product-management/prioritization-framework "Atlassian — Prioritization Frameworks"
[2]: https://www.ibm.com/think/topics/regression-testing "IBM — Regression Testing"
