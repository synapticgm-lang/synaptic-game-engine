# E9 — Competitive Teardown Deep Dives

**Method:** “How memory actually works” below means only what public documentation says. “Turn 50–200 failure mode” is an **inference**, not a claim that a competitor demonstrably fails. It identifies the structural risks a long campaign creates and the specific SynapticGM proof required to beat them.

## 1. AI Dungeon — Retrieval + Compression With Explicit Context Constraints

### Publicly Documented Mechanism

AI Dungeon says its Memory System combines **Auto Summarization** with a **Memory Bank**. It describes memories as AI-generated summaries of six previous actions/responses, embedded and ranked by relevance to recent action. It describes a running auto-summary updated every 15 actions and says old story text may be removed when it can no longer fit the context. It also says that if edits earlier in an adventure affect the summary, users need to update the Story Summary manually because regenerating historical summaries can be constrained by context/cost. Tier pages make context/memory capacity a paid-variable feature. [1] [2]

| Layer | Publicly described behavior | What is not established by the cited pages |
|---|---|---|
| Recent history | Recent story text is included until context capacity requires trimming. | Exact current token selection for every model/tier or reliability rate. |
| Compressed memory | Groups of six past actions become AI-generated summaries; auto-summary provides overview. | That every detail survives compression or is factually correct. |
| Retrieval | Memory Bank stores/retrieves relevant embedded memories based on a current-action query. | That relevance equals authority or that retrieval has transactional conflict resolution. |
| Manual controls | Story Summary, Plot Essentials, Author’s Note, Story Cards, instructions can be edited/viewed. | Durable downstream re-adjudication after every historic edit. |
| Commercial constraint | Context/memory capacity varies by membership and credits/tier. | Actual per-user cost or margin. |

### Turn 50–200 Failure Modes — Inference

| Risk | Why it is structurally plausible | What it looks like to a player | Evidence status |
|---|---|---|---|
| Compression loss | Six-action memories and periodic summary necessarily represent more text in fewer words. | A minor-but-important item/relationship condition returns wrong. | **INFERENCE**, not a documented defect. |
| Retrieval miss | Relevance ranking uses current action/query; semantically distant but authoritative facts may not rank. | The GM recalls a similar detail but misses the defining constraint. | **INFERENCE**. |
| Historical edit drift | AI Dungeon explicitly says historic edits affecting summary may require manual summary update. [1] | Player corrects early fact; later summary/narration can retain old version until repair. | **PUBLICLY EVIDENCED limitation + inference about later symptom.** |
| Tier-shaped continuity | Memory capacity/context varies by tier. [2] | Long-run coherence can feel linked to capacity, even if user expects core truth for all. | **PUBLICLY EVIDENCED capacity difference; outcome inference.** |

### SynapticGM Counter

| Counter already in claimed stack | Exact counter behavior required | Still missing / must prove |
|---|---|---|
| StateTx + ledger revision | A correction is a higher-authority revision, not an edit asking a later summary to incorporate it. | Correction→save→reload→recap trace; impact handling for dependent facts. |
| SceneManifest | Current scene receives compact canonical facts/obligations from accepted state, with source provenance. | Budget policy that never drops correction/invariant/current critical kit. |
| IntentContract + obligation coverage | Freeform player input has a traceable disposition rather than reliance on model narrative attention. | Compound-action UI/trace and tester comprehension. |
| beatFingerprint/speculative retries | Prevent copy-paste or commit duplication while allowing controlled wording variation. | Immutable outcome/retry policy visible in receipt. |
| HUD Why? + combat receipt | Player sees causal source rather than guessing which memory was retrieved. | No jargon; exact receipt/state reconciliation. |
| **Missing proof** | Retrieval/summaries must be demonstrably unable to override state. | RT39–RT42 and 100-turn trace must pass before comparative claim. |

## 2. Friends & Fables — Context Blocks, Entity/Lore Retrieval, and User Intervention

### Publicly Documented Mechanism

Friends & Fables calls context blocks a shared notepad for player and AI. Its help page says a research agent scans lore, memories, and entities before the GM responds, creates/updates blocks, and prioritizes them under plan-dependent total/soft budgets. It says entities may return full sheets; long-term memories are searched semantically; and this semantic search is less reliable than lore/entities because campaigns may contain hundreds of thousands of similar memories. It allows users to inspect/edit priorities and notes that they may want to edit context when the GM goes in an odd direction. [3]

| Layer | Publicly described behavior | What is not established by cited page |
|---|---|---|
| Context assembly | Automatic blocks from relevant lore/memory/entities, subject to budgets/priorities/expiry. | A global authority hierarchy among all sources. |
| Lore search | Titles/headings help research select portions of lore. | That titles/headings prevent stale/contradictory world facts. |
| Entity state | Searches can use full sheets/stat blocks. | Whether all sheet edits have revision/replay semantics. |
| Long-term memory | Semantic queries; provider acknowledges relative reliability issue. | Exact retrieval metrics or failures for a particular campaign. |
| Player control | Manual block editing/priorities, research toggle. | That ordinary players will find/manage it in an emotional turn. |

### Turn 50–200 Failure Modes — Inference

| Risk | Why it is structurally plausible | Player-visible symptom | Evidence status |
|---|---|---|---|
| Context prioritization miss | Budget pressure idles/expiring/priority blocks, while semantic memory may be less reliable. [3] | A true but low-salience prior detail is omitted during a pivotal scene. | **INFERENCE**. |
| User burden | Documentation gives manual context editing as a remedy. [3] | Player feels responsible for operating the GM’s memory system. | **INFERENCE grounded in public control design.** |
| Similar-memory collision | The provider explicitly describes many similar memory texts. [3] | GM retrieves a near-match from a different incident/character. | **INFERENCE**. |
| “Context = truth” confusion | Context blocks can include lore/memory/entity sources with auto/manual priority. | User cannot distinguish a suggestion/retrieved note from a binding state fact. | **INFERENCE**. |

### SynapticGM Counter

| Counter already in claimed stack | Exact counter behavior required | Still missing / must prove |
|---|---|---|
| Product-law authority order | State authority is explicit: correction and canonical state defeat evidence. | Player-facing language that explains result without exposing internals. |
| CampaignContract / IntroductionPermit | New lore/entity/backstory remains provisional or contracted, not silently imported from prompt evidence. | RT05/58 UI and author/player approval semantics. |
| StateTx / kit HUD | Inventory, condition, quest, relation, and location come from accepted ledger entries. | Test schema coverage and a Now surface understandable in 3 seconds. |
| Why?/provenance | Marker and outcome show source/why. | Users must locate it without manual “context management.” |
| Leak scanner | Prevents developer vocabulary from becoming visible. | Cover every fallback/error/render path. |
| **Missing proof** | If retrieval is used, it needs tenant/filter/poison defenses and audit. | RT39–RT42 green, source conflict visible in logs. |

## 3. Hidden Door — Structured Game Engine + Authored Combinatorial Narrative

### Publicly Documented Mechanism

Hidden Door’s FAQ describes an interactive storytelling game combining human-authored, structured plot beats, tropes, rules, player choices, characters, and a “game engine layer” that stores each character, item, or location and its state. It says difficult actions can involve dice and light stats; worlds use cards for characters, places, and things; content ratings/warnings can be configured; and the product uses multiple programmatic/ML/LLM tasks in a turn. [4]

| Layer | Publicly described behavior | What is not established by cited page |
|---|---|---|
| Structured state | Character/item/location state is stored by game engine. | State revision, player correction rank, event-sourcing, or reload guarantees. |
| Narrative control | Authored plot beats/tropes/rules and world cards shape output. | Freeform invention boundaries or permit path. |
| Fairness | Difficult actions roll dice/light stats; stakes/constraints exist. | Player-visible receipt, deterministic reconciliation, or all rules detail. |
| Safety | PG-13 baseline, mature labels, warnings, configurable maturity content. | Child-directed legal posture or Kid Mode-specific data/ads control. |
| Business model | Free plan says unlimited stories/turns and defined world/chat limits. [5] | Actual cost/abuse strategy. |

### Turn 50–200 Failure Modes — Inference

| Risk | Why it is structurally plausible | Player-visible symptom | Evidence status |
|---|---|---|---|
| Short-arc vs campaign mismatch | FAQ frames a story as 1–3 scenes even though more stories may be played. [4] | A player seeking a 100-turn personal campaign may experience episodic reset/continuity boundaries. | **INFERENCE**, not a claim of failure. |
| Authored-space limitation | Strong authored beats/cards/rules constrain possibilities by design. | Player’s surprising freeform invention has fewer legal continuations than in an open sandbox. | **INFERENCE**. |
| Opaque structured state | Engine state can be correct but invisible. | Player knows something changed but cannot tell why/where it is recorded. | **INFERENCE**. |
| Card/deck focus | Collectible/world-card progression can center world exploration more than a single personal ledger. | Choice feels like unlock progression rather than an enduring causal biography. | **INFERENCE**. |

### SynapticGM Counter

| Counter already in claimed stack | Exact counter behavior required | Still missing / must prove |
|---|---|---|
| Single-player ledger chain | Long-running player-specific facts and corrections remain central, not episodic card state. | 100/500-turn trace and return-session test. |
| IntentContract + open soft offers | Player can act outside an authored-looking hook while the GM preserves constraints. | RT19–RT23 and filmed “ignored hook.” |
| IntroductionPermit | Lets player introduce a plausible new contact/item with declared provisional status. | UX must be smoother than a world-authoring workflow. |
| Combat receipt | Explain rolls/stats/consequences in human language. | RT51–RT52 pass and testers articulate fairness. |
| Kid filters + kills | Safety is mode/policy/ops-aware. | Must not claim child legal status without counsel. |
| **Missing proof** | Strong structured competitors set a UX quality bar. | SynapticGM needs a readable, beautiful “Now/Changed/Why?” surface, not only a better trace. |

## Comparative Lesson

AI Dungeon demonstrates an open storytelling product making memory/cost tradeoffs visible; Friends & Fables demonstrates rich retrieval/context control and the burden it can put on users; Hidden Door demonstrates the value of structured state and authored constraints. SynapticGM’s counter is viable only if it combines **their seriousness about structure** with a player-friendly authority model: correct it once, see it stay true, and see the cause of consequences. No public documentation reviewed establishes that any competitor lacks this entirely; the audit instead identifies a focused standard SynapticGM can prove.

## References

[1]: https://help.aidungeon.com/faq/the-memory-system "AI Dungeon — All About the Memory System (accessed 2026-08-18)"
[2]: https://help.aidungeon.com/memberships-benefits "AI Dungeon — Memberships & Benefits (accessed 2026-08-18)"
[3]: https://help.fables.gg/articles/8560008-working-context-blocks "Friends & Fables — Working Context Blocks (accessed 2026-08-18)"
[4]: https://www.hiddendoor.co/help/faq "Hidden Door — FAQ (accessed 2026-08-18)"
[5]: https://www.hiddendoor.co/pricing "Hidden Door — Pricing (accessed 2026-08-18)"

[Back to project index](../README.md)
