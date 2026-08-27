# SynapticGM Executive Vibe Scorecard

**Project:** Game Vibe / Feel / Personality / “It Heard Me”  
**Prepared:** 18 August 2026  
**Status:** Implementation omnibus — fresh research synthesis  
**Decision rule:** **Player correction → pinned canon → StateTx → SceneManifest → evidence → invention.** No summary or retrieval layer is authoritative for kit, roster, quests, HP, or other ledger facts.

## Executive decision

SynapticGM should compete on **proved consequence**, not on a vague claim that an AI “remembers everything.” Comparable AI roleplay products already market open-ended play, persistent worlds, memories, and generated storytelling. Their documented approaches commonly depend on bounded context, summaries, retrieved memories, or authored world objects; AI Dungeon explicitly documents the limitations and fallibility of summary-based memory. [1] [2] SynapticGM’s defensible wedge is to make the game’s authoritative state **inspectable, correctable, and visibly consequential** while preserving fluid natural-language play.

> **Vibe thesis:** The player should never need to choose between expressive roleplay and reliable game truth. They speak naturally; the game answers the actual speech; the ledger proves what changed; the fiction makes the proof feel native to the world.

| Scorecard dimension | Ship standard | Visible player proof | Primary metric | Launch risk |
|---|---|---|---|---|
| **It heard me** | Every material ask, refusal, correction, or joke receives a context-appropriate response or receipt. | A compact “accepted / clarified / changed” cue and direct answer. | Correction-to-ledger latency; unresolved open asks. | High if chat feels templated. |
| **It remembered** | Durable facts survive long campaigns through the ledger, not prose recall. | Inspectable state history, sources, and correction supersession. | Continuity fixture pass rate; player recall accuracy. | Critical if summaries can overwrite truth. |
| **Consequences feel fair** | Losses and blocks have a legible cause, readable aftermath, and viable next action. | Telegraphs, check cards, state deltas, and aftermath. | “I knew why” rating; avoidable-loss rate. | High in combat/checks. |
| **System feels in-world** | Chrome is diegetic where helpful and explicit where truth matters. | Distinct narrator, character, and system surfaces. | Chrome comprehension; style/ledger separation errors. | Medium if theatrics obscure facts. |
| **Every run feels different** | Opener family and personality alter delivery and staging, never facts or math. | Different hook, cadence, notices, and early stakes. | Blind preference; semantic-equivalence regression. | High if style changes outcomes. |
| **Fluid, not menu-only** | Natural-language speech can protest, bargain, joke, challenge, and correct. | Speech consequences plus targeted repair when necessary. | Freeform-input success; repair turns. | High if “pocket search” stubs recur. |
| **Kid Mode is genuinely stricter** | Plain language, stronger certainty cues, no ads, no pressure, safer confirmation. | Clear stakes and easy undo; no dark patterns. | Accidental acceptance; cue comprehension. | Critical for trust and suitability. |

## Recommended product posture

The visual and narrative system should work as a **two-stage pipeline**. First, a deterministic resolver derives the authorized outcome from the authority order and emits StateTx/SceneManifest changes. Second, a personality renderer changes only diction, cadence, chrome templates, and scene framing. This separation is the decisive technical contract: a more dramatic narrator cannot turn a missed roll into success, turn evidence into canon, or revive a superseded fact. Persona and factual consistency are separate evaluation problems in dialogue systems. [3]

The interaction contract should favor **progress with repair**, rather than ritual acknowledgements. Conversation research treats repair as selective: normal dialogue progresses without constant proof of understanding, while high-stakes ambiguity or a detected mismatch merits a targeted clarification, confirmation, or correction path. [4] Compact receipts give system-status visibility while preserving pace; users also need a plainly marked exit, undo, and recoverable error handling. [5]

## Release gates

| Gate | Must be true before broad release | Owner |
|---|---|---|
| Ledger integrity | 100% of canonical fixtures preserve the authority order across all personality presets. | Runtime / QA |
| Correction behavior | A correction lands in one interaction and visibly supersedes affected lower-authority claims. | Conversation UX |
| First-hour proof | New players complete an action, see a consequence, and recognize a state change within ten turns. | Onboarding |
| Fairness | Players can explain the cause of sampled failure/check outcomes without reading hidden logs. | Systems UX |
| Kid Mode | No adult chrome, ads, pressure loops, opaque high-stakes actions, or unsafe freeform escalation. | Safety / UX |
| Claim substantiation | Marketing demonstrations match versioned evidence; no “remembers everything” or “never breaks.” | Product / Counsel |

## Research boundaries

**VERIFIED:** Comparable-product public claims, accessible memory documentation, conversational repair guidance, accessibility standards, and product-evaluation practices were reviewed. [1] [2] [4] [5] [6]  
**SPECULATIVE:** Exact cue wording, timing, and first-ten-turn beats require SynapticGM playtests.  
**COUNSEL:** Claims about Kid Mode, safety, and advertising should be reviewed against applicable jurisdictions before public launch. The FTC requires objective advertising claims to be truthful, non-deceptive, and appropriately substantiated. [7]

## References

[1]: https://help.aidungeon.com/faq/the-memory-system "AI Dungeon — All About the Memory System"
[2]: https://www.summonworlds.com/ "Summon Worlds — Worldbuilding and Roleplay"
[3]: https://aclanthology.org/2021.eacl-main.44/ "Improving Factual Consistency Between a Response and Persona Facts"
[4]: https://pmc.ncbi.nlm.nih.gov/articles/PMC6849777/ "Repair: The Interface Between Interaction and Cognition"
[5]: https://www.nngroup.com/articles/ten-usability-heuristics/ "NN/g — 10 Usability Heuristics"
[6]: https://gamesuserresearch.com/how-to-playtest-your-games-story/ "Games User Research — How to Playtest Your Game’s Story"
[7]: https://www.ftc.gov/business-guidance/advertising-marketing "FTC — Advertising and Marketing"
