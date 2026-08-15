# Research brief — World-class long memory & anti-hallucination for AI LitRPG (single + multiplayer)

**Source:** Gemini (John, 15 Aug 2026 evening). Archived filename keeps `-gemini` because `pack-11-live-gameplay-dump` already exists.  
**Status:** Capture only. **Do not implement.** Second research dump pending — see `HOLD-long-memory-pack11.md`.  
**Playtest:** Collect issues in `.cursor/rules/playtest-notes.mdc` before any next update.

**Date context:** August 2026  
**Output file:** `docs/research/pack-11-long-memory-antihallucination-sp-mp-2026-08.md`  
**Status when done:** Capture for review. Do not implement.  

---

## A) Executive summary

*   **"Best in Class" Memory Defined:** 100% mechanical fidelity combined with >95% narrative consistency over 500+ turns, achieved by rigidly isolating mathematical truth from generative text.
*   **The Golden Rule:** The LLM is a renderer, not a database. It reads state; it never writes state without strict middleware (Warden) validation.
*   **The 5 Non-Negotiable Layers:** (1) Hardcoded Rules/Invariants, (2) Code-Owned Live State, (3) Situation/Timeline Packets, (4) Cascading Summaries, (5) RAG/Vector Retrieval.
*   **Top SP Recommendation (Warden):** Implement a dual-pass pipeline. Pre-check user intent against the Supabase ledger; post-check LLM output against the "forbidden invent" list before rendering.
*   **Top SP Recommendation (Compression):** Avoid full-context sliding windows. Use a 15-turn micro-summary and a 50-turn macro-summary (location arc) to freeze narrative facts into structured JSON.
*   **Top MP Recommendation (Quarantine):** MP must operate on a strict "Shared Ledger, Instanced Narrative" model. The hub state is global; the narrative RAG is strictly scoped to the `party_id` or `session_id`.
*   **What NEVER to do (SP):** Never pass raw, uncompressed chat logs beyond $N$ turns. Never let the LLM roll dice or define item rarity.
*   **What NEVER to do (MP):** Never allow Player A's free-text input to globally mutate an NPC's state without a mechanical code transaction. 
*   **What NEVER to do (Monetization):** Never tier-gate a player's core campaign memory. If selling capacity, sell visual/comic mode generation limits or active character slots, never "amnesia prevention."
*   **Truth Stack Priority:** When a retrieved memory contradicts the live mechanical state, the live state silently overwrites the narrative in the hidden prompt.

---

## B) Failure modes of current AI RPGs

| Failure | Who suffers | Root cause | Player symptom | Prevention pattern |
| :--- | :--- | :--- | :--- | :--- |
| **Invented Items/NPCs** | SP / MP | LLM temperature/creativity ignores empty state arrays. | "A legendary merchant appears in the empty cave." | **Warden Post-check:** Regex/Entity match against authorized entity lists. |
| **Forgotten Promises** | SP | Sliding window context drops NPC dialogue from 20 turns ago. | NPC acts like you just met despite an accepted quest. | **Pins & Active Conditions:** Code-enforced persistent arrays for active quests. |
| **Location Amnesia** | SP | Summarizer model strips environmental keywords to save tokens. | A lava dungeon turns into a standard stone cave. | **Situation Packet:** Hard-pin current and previous location traits in Layer 2. |
| **MP "Host Pays" & Desync** | MP | One client manages the LLM call; others lag or drift. | Player B acts, but the LLM only remembers Player A's action. | **Supabase Sync:** Code-first ledger triggers Mode A shared narration broadcast. |
| **Lore Bleed** | MP / SP Alt | RAG retrieves vectors from a different character's save file. | Sci-fi terms appear in a fantasy run. | **Strict RAG Scoping:** Hard filter vectors by `campaign_id` and `character_id`. |
| **Credit Burn Mid-Fight** | SP / MP | Combat requires multiple LLM round-trips to resolve math. | Player runs out of tokens fighting a rat. | **Code Math:** Combat resolution is 100% code; LLM only generates the final death/hit paragraph. |

---

## C) Competitor / analogue memory architectures

| System / Analogue | Structured State? | Summaries? | RAG? | Who owns combat/math? | MP Model? | Known player complaints |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AI Dungeon (Griffin/Dragon)** | No (mostly text) | Yes (Manager) | Yes | LLM | Shared text box | Heavy hallucination; forgets inventory; combat is arbitrary. |
| **NovelAI (Lorebook)** | Metadata tags | Manual | Yes | User / LLM | N/A | High player burden to maintain Lorebook; no actual mechanics. |
| **Friends & Fables** | Yes | Yes | Partial | LLM + Code | Discord/Host | MP memory desync; "Host pays" token drain; combat token burn. |
| **Hidden Door** | Yes (Graph) | Yes (Engine) | No | Engine | Instanced | Feels rigid/formulaic; lacks LitRPG crunch; highly restricted prose. |
| **MemGPT / Letta (OS Memory)** | Yes (Tiered OS) | Yes (Cascading) | Yes | N/A (Agentic) | N/A | High latency for multi-step retrieval; token expensive for fast RPG turns. |

---

## D) Proposed SynapticGM "truth stack"

This stack isolates the engine from the narrative. It is compiled top-to-bottom every turn.

*   **Layer 0: Rules + Engine Invariants**
    *   *Contents:* Fundamental LitRPG rules ("Combat relies on AP," "Magic requires Mana").
    *   *Prune Rules:* NEVER PRUNE.
    *   *Owner:* Code (Hardcoded system prompt prefix).
*   **Layer 1: Live Mechanical State**
    *   *Contents:* Current HP, MP, Gold, Inventory, Quest IDs, exact Dungeon Node data.
    *   *Prune Rules:* Only reflects current turn absolute truth.
    *   *Owner:* Code (Supabase Ledger).
*   **Layer 2: Situation Packet**
    *   *Contents:* Location description (current + previous), time of day, active NPCs in the room.
    *   *Prune Rules:* Drops previous location once 2 nodes away.
    *   *Owner:* Code + Narrative tags.
*   **Layer 3: Campaign Summary + PC Personality**
    *   *Contents:* The 50-turn macro summaries and the player's predefined class/attitude.
    *   *Prune Rules:* Overwritten every 50 turns. Old summaries move to Layer 5 (RAG).
    *   *Owner:* Code summarizer cron job.
*   **Layer 4: Active Conditions + Unresolved Consequences**
    *   *Contents:* "Bleeding (2 turns left)", "Guards are actively searching for you."
    *   *Prune Rules:* Pruned immediately when condition expires in code.
    *   *Owner:* Code.
*   **Layer 5: Retrieved Memories**
    *   *Contents:* Top-K semantic matches for current named entities (e.g., retrieving the history of a specific sword).
    *   *Prune Rules:* Dynamically swapped every turn based on intent parsing. Max 3 chunks.
    *   *Owner:* LLM Vector Retrieval (Supabase pgvector).
*   **Layer 6: Pins**
    *   *Contents:* Player-defined sticky notes + System auto-pins ("The King is dead").
    *   *Prune Rules:* Player manually deletes, or System removes upon quest completion. Max 5.
    *   *Owner:* Player / System hybrid.
*   **Layer 7: Outcome Token**
    *   *Contents:* The mechanical result of the current turn's action (e.g., `<Outcome>CRITICAL_SUCCESS: Goblin takes 45 damage and dies</Outcome>`).
    *   *Prune Rules:* Recency-bound (current turn only). LLM must NEVER invert this token.
    *   *Owner:* Code.
*   **Layer 8: Narration Directives**
    *   *Contents:* Tone, style limits ("Do not invent loot," "Keep it under 3 paragraphs").
    *   *Prune Rules:* Never prune.
    *   *Owner:* System Prompt Suffix.

---

## E) Anti-hallucination pipeline (SP)

**The Turn Architecture:**
1.  **Input Mediate:** Player inputs text ("I swing my sword at the Goblin").
2.  **Intent Parsing (Fast LLM/Regex):** Extracts `{action: "attack", target: "Goblin", tool: "sword"}`.
3.  **Code Check:** Engine verifies: Is Goblin here? Is sword equipped? (If fail, return System Error to player immediately, do not waste token on generation).
4.  **Mechanics Resolution:** Code rolls dice, updates Supabase ledger (Goblin HP: 0).
5.  **Outcome Token Generation:** Code outputs `<Outcome>Goblin killed. Loot: 5g.</Outcome>`.
6.  **Prompt Assembly:** Stack Layers 0-8.
7.  **Generation:** LLM writes the prose.
8.  **Warden / Fact-Lock (Post-Check):** Fast regex scan of the output. Did the LLM mention a "Dragon"? Does "Dragon" exist in Layer 1 or 2? If no -> Contradiction Retry.
9.  **Commit:** Save prose to UI, update timeline. (If rendering in the optional comic-strip mode, trigger stable diffusion pipeline based on the *Warden-approved* prose).

**How to stop soft invent:** Use explicit grounding tags in the system prompt: *"You may only name characters, items, or locations explicitly listed in [Layer 1] or [Layer 2]. Do not generate ambient named NPCs."*

---

## F) Long-horizon memory (turn 100–500)

*   **Compression Schedules:**
    *   **Turn 15 (Micro):** Background async task summarizes the last 15 turns into a 3-sentence bullet point. Raw logs are dropped from active context window.
    *   **Turn 50/Location Change (Macro):** Micro-summaries are rolled up into a location arc summary (e.g., "The Goblin Cave Arc"). Micro-summaries are sent to cold storage (vectors).
*   **Semantic Retrieve (Knowledge Graph vs DB):** Avoid a full Knowledge Graph (too complex for indie maintenance). Rely on Supabase relation tables (`Entities`, `Factions`, `Locations`) tagged with metadata. Use standard SQL joins first; fall back to `pgvector` only for unstructured lore.
*   **Player Correction UX:** Implement a diegetic **"System Override"** button. If the LLM hallucinates, the player edits the text directly, and the UI sends a patch request. The system logs this in a "correction ledger" array injected into Layer 8 for the next 5 turns to train the LLM away from the error.

---

## G) Multiplayer memory (Quarantined / Later Track)

*Documented for future data modeling. Do not implement in current client sprint.*

*   **Data Model:** Separate the `World_Ledger` (global) from the `Narrative_Log` (per party/instance).
*   **Mode A (Shared Paragraph):** For hub towns and standard exploration, Player A and Player B share a `Party_ID`. The engine waits for both inputs (or a timeout), resolves mechanics, and generates ONE shared response block. This drastically reduces token costs and prevents memory desync.
*   **Preventing Memory Bleed:** RAG queries must strictly enforce `WHERE party_id = current_party OR is_global_lore = true`. 
*   **Contradiction Authority:** Free text from Player A cannot override Player B. If inputs conflict ("I kill the merchant" vs "I heal the merchant"), Code checks agility stats. The fastest player's intent becomes the Outcome Token. The LLM narrates the struggle.
*   **Cost Management:** Avoid the "Host Pays" model. Dedicate token consumption to the instance level. If utilizing cloud sync via Vercel/Supabase, tally compute against the `Party_ID` budget.

---

## H) Evaluation: How we know we're better

Propose an automated test harness to run locally via Cursor before pushing major prompts to Vercel:

1.  **Golden Scripts (Automated):** 20-50 turn predefined input sequences.
2.  **Planted Facts:** Hardcode a bizarre fact in Turn 2 (e.g., "The sky is green neon"). Ask about the sky in Turn 45. 
3.  **Forbidden Invent Checklist:** Run a script that attempts to open "a random chest." Score whether the Warden successfully blocks the LLM from inventing the loot inside.
4.  **Metrics:**
    *   **Contradiction %:** Target < 2%.
    *   **Invent % (Hallucination):** Target < 5%.
    *   **Forgotten Pin %:** Target 0% (Code should guarantee this).
    *   **$/100 Turns:** Target under $0.50 (using optimized mini models for routing/summarizing, larger models for final prose).

---

## I) Cost & context budget (SP focus)

| Layer | Max Tokens | Pruning Priority (1 = Prune First) |
| :--- | :--- | :--- |
| **Active Turn Chat** | 500 | 1 (Compress after 15 turns) |
| **Layer 5 (RAG)** | 600 | 2 (Drop lowest relevance vectors) |
| **Layer 3 (Summaries)** | 800 | 3 (Drop oldest micro-summaries) |
| **Layer 2 (Situation)** | 300 | 4 (Drop previous room details) |
| **Layer 6 (Pins)** | 200 | NEVER PRUNE |
| **Layer 1 (State/Outcome)** | 400 | NEVER PRUNE |
| **Layer 0/8 (Rules/Directives)**| 500 | NEVER PRUNE |
| **Total Target Budget** | **~3,300** | Highly efficient; compatible with fast, cheap LLMs. |

---

## J) SynapticGM backlog (Ordered)

1.  **[Data]** Schema update: Separate `WorldState` tables from `NarrativeLog` in Supabase.
2.  **[Engine]** Implement JSON Outcome Tokens output from the combat/mechanics engine.
3.  **[Prompting]** Rebuild the System Prompt to strictly ingest Layers 0, 1, 2, and 7.
4.  **[Validation]** Build the "Warden" post-generation regex scanner to catch unauthorized entities.
5.  **[Memory]** Implement the Turn 15 micro-summary background cron job (Node.js).
6.  **[Memory]** Implement Layer 6 "Pins" UI and data array.
7.  **[Memory]** Implement Layer 4 "Active Conditions" data array linked to turn counters.
8.  **[UX]** Add diegetic "System Override" correction feature for players to edit LLM hallucinations.
9.  **[Eval]** Build the Golden Script automated test harness for Cursor/local testing.
10. **[RAG]** Set up `pgvector` in Supabase for Layer 5 retrieved memories.
11. **[RAG]** Implement intent-parser to trigger vector retrieval only when named entities are mentioned.
12. **[MP-Prep]** Add `party_id` and `session_id` columns to all state and log tables (Quarantined prep).
13. **[MP-Prep]** Draft Mode A shared-paragraph websocket broadcaster (Do not hook up to UI yet).

---

## K) Sources & analogues

*   *MemGPT: Towards LLMs as Operating Systems* (Packer et al., 2024) - Basis for tiered memory architecture and aggressive summarization.
*   *Friends & Fables post-mortems / Reddit sentiment (2025)* - Identifies the fatal flaws of LLM-driven mechanics, token burn on combat, and the "host pays" multiplayer friction.
*   *Hidden Door Architecture Docs (2024-2025)* - Reference for engine-first graph states overriding LLM generation. 
*   *Supabase Vector / RAG documentation (2026)* - Guidelines on efficient metadata filtering (`party_id` limits) prior to cosine similarity searches to prevent lore bleed. 
