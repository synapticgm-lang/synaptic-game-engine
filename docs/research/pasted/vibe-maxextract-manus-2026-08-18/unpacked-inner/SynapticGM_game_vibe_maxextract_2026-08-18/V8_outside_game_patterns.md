# V8 — Outside Games: Vibe Patterns to Steal

SynapticGM’s opportunity is not to imitate surface aesthetics from adjacent fields. It is to transfer their **operational mechanisms**: a stage production protects continuity through a shared bible; a tabletop session zero negotiates participation; a good queue makes waiting intelligible; a trusted service recognizes the customer without inventing a biography; a good broadcast answers the question asked before adding color.

| Source pattern | Verified mechanism | SynapticGM translation | Guardrail |
|---|---|---|---|
| **Theater / production bible** | A production bible coordinates story, functionality, design, user journeys, timelines, and QA—not just lore. [1] | CampaignContract + pinned canon as stable bible; SceneManifest as scene call sheet; continuity check before render. | Summary is a reference aid, never canon. |
| **Film continuity** | Props, costume, locations, and prior action must remain traceable across scenes. | Entity provenance, state diffs, and “last confirmed” timelines for items/places/NPCs. | Do not expose raw production clutter by default. |
| **TTRPG session zero** | Tone, boundaries, participation, and safety are negotiated before play; safety remains contextual. [2] | Campaign setup for intensity, lines/veils, answer-length, genre expectations, and Kid Mode; accessible pause/revise at safe states. | A settings checklist never replaces ongoing correction. |
| **Theme-park queue** | Waiting affects satisfaction; progress and fairness matter; priority can create second-order unfairness. [3] | Show investigation/travel/generation progress and safe optional inspection during waits. | Optional activity cannot mutate state or become a pressure loop. |
| **CRM recognition** | Prior interaction and current intent can make service more relevant. [4] | Player Context retrieves relevant prior commitments, preferences, companions, and open goals. | Recognition is tentative, not an authoritative personal profile. |
| **Sports broadcast QA** | Strong answers distinguish event facts, rules/tactics, and complex inference. [5] | “What changed?”, “Why can’t I?”, “Who knows?”, “Where did that clue come from?” answer mode with fact/rule/inference labels. | Q&A cannot mutate state absent a valid action/correction. |
| **Museum label / guided exhibit** | Context is delivered beside an object at the moment of relevance. | Evidence inspect, inventory provenance, and map knowledge layers are contextual, not a codex dump. | Do not convert mystery into a tooltip treadmill. |

## A staged scene system

Borrowing from stage management, each SceneManifest should be a compact “call sheet” rather than unstructured prose:

| Field | Player-facing consequence |
|---|---|
| Scene intent | The game knows whether the beat is discovery, negotiation, flight, rest, or confrontation. |
| Cast and positions | Characters do not teleport or forget why they are present. |
| Entry conditions | The scene begins only with ledger-supported circumstances. |
| Sensory tone | Personality can vary presentation without changing state. |
| Active pressures | Time, threat, commitments, and visible constraints remain coherent. |
| Permitted actions | IntentContract can respond fluidly without pretending every action is possible. |
| Exit conditions | A resolution produces a reliable next beat and correct state receipt. |
| Continuity check | Relevant correction, canon, StateTx, evidence, and invention are reconciled in the correct order. |

## Recognition without creepiness

A recognized-player moment should name **a player-authored, context-relevant commitment** rather than imply surveillance. Good: “You asked Mira to guard the north gate; her report is waiting.” Bad: “You always prefer clever characters, so you will like this.” The former is verifiable gameplay history; the latter is an ungrounded profile inference.

Use a small relevance budget at scene start: at most one explicit callback, one unresolved obligation, and one preference-derived presentation adjustment. If any conflicts with a correction or pinned canon, discard it. A player must be able to inspect and clear preference memory separately from campaign facts.

## “They answered the question” answer format

1. **Direct answer:** one sentence in the player’s language.  
2. **Basis:** `Observed`, `Rule/state`, or `Interpretation`.  
3. **Scope:** what is unknown or conditional.  
4. **Next relevance:** only when it concerns the active scene.

Example: *“The gate is closed because the watch recorded your seal as revoked. **State:** dock access suspended. **Unknown:** who changed the record.”* This answer does not bury the question beneath a creative monologue and does not pretend to know the last unknown.

## Queue / latency moments

When travel, investigation, NPC response, or a generation wait occurs, state should remain static until resolution. Offer safe inspections: review known clues, reread a promise, or view the map. Show status without fictionalizing a delay into fake drama. “Waiting” must never be monetized, penalized, or used to push notifications in Kid Mode.

**SPECULATIVE:** The best relevance budget and optional wait activities need prototype testing; some players will prefer uninterrupted fiction.  
**COUNSEL:** Preference-memory retention, consent surfaces, and child privacy settings require formal review.

## References

[1]: https://www.screenaustralia.gov.au/resource/how-to-write-a-transmedia-production-bible/ "Screen Australia — Transmedia Production Bible"
[2]: https://journals.uu.se/IJRP/article/download/993/900 "International Journal of Role-Playing — Consent in Analog Role-Playing Games"
[3]: https://pmc.ncbi.nlm.nih.gov/articles/PMC10362101/ "Analysis of Queue Management in Theme Parks"
[4]: https://www.salesforce.com/marketing/personalization/ "Salesforce — Personalization"
[5]: https://aclanthology.org/2024.naacl-long.283.pdf "SportQA: A Benchmark for Sports Understanding in LLMs"
