# Pack 11 — Long Memory & Anti-Hallucination for AI LitRPG (SP + MP)

**Date:** August 2026  
**Source:** Second research dump (John, research docs folder, 15 Aug 2026 evening)  
**Status:** Capture for review. **Do not implement** until John opens the next update after playtest.  
**Companion:** Gemini dump — `pack-11-long-memory-antihallucination-sp-mp-2026-08-gemini.md`  
**Hold:** `HOLD-long-memory-pack11.md`  
**WOF:** §G multiplayer memory also copied to `wof/pack-15-mp-memory-from-pack11-2026-08-15.md`  
**Product:** SynapticGM — single-player AI LitRPG / System-apocalypse first; optional later multiplayer (WOF-style hubs + instanced party/raid) quarantined as a later design track.
**Method:** Systems-first. Primary sources: papers (2024–2026), engineering blogs, competitor documentation, Steam/Reddit failure modes. Licensed game names appear as cited SOURCES only; no licensed content is used as SynapticGM content.

---

## A) Executive Summary (15 Bullets)

1. **"Best in class" memory** means: the player can reference any promise, NPC, or consequence from turn 5 at turn 300, and the GM's prose is consistent with the ledger — without the player needing to re-state it, pin it, or pay for a higher tier.
2. **Code-owns-truth is the single largest anti-hallucination advantage SynapticGM has.** No competitor with "LLM is the game engine" can match a system where dice, HP, loot, quests, and room graphs are never in the LLM's control.
3. **Five non-negotiable layers** (detailed in §D): (0) Rules & engine invariants, (1) Live mechanical state, (2) Situation packet, (3) Compressed narrative memory, (4) Retrieved episodic memories. Everything else is optimization on top of these.
4. **Anti-hallucination is pre-check + post-check, not "hope the model is good."** Code validates intent before the LLM sees it; the Warden validates output after. The LLM is sandboxed between two code gates.
5. **Summaries must be lossy by design, but some facts are lossless.** NPC names, unresolved promises, player-pinned facts, and quest state must survive any compression pass. Everything else may be compressed, paraphrased, or dropped.
6. **Retrieval (semantic search) is the right tool for turn 100+, but only as a supplement to structured state.** RAG without a mechanical ledger is how AI Dungeon and NovelAI lose facts. RAG on top of a ledger is how we keep them.
7. **Knowledge graphs are worth it for NPC–Place–Quest edges**, but not as a general-purpose memory. A lightweight graph (< 500 nodes for a 300-turn campaign) is cheap to maintain and query.
8. **The biggest SP failure mode is "soft invent":** the LLM names a chest, NPC, or shop that doesn't exist in state. Prevention: claim-grounding (only narrate entities present in the situation packet or outcome token).
9. **The biggest MP failure mode is "private-to-public leak":** Player A's solo scene becomes world fact for Player B. Prevention: memory scoping by instance/hub/party/player ID.
10. **F&F's "host pays" model is the cautionary tale for MP.** Per-player LLM budget (already locked) is the correct answer. Memory tiers that gate the player's own story are predatory and must be avoided.
11. **Never tier-gate memory quality.** Capacity (turns/day, pins, TTS) is the subscription lever. The free player's GM must remember as well as the paid player's GM for the turns they play.
12. **Context window size is not the solution.** 128K+ context windows exist, but filling them with raw chat history is slow, expensive, and still hallucinates. Structured + compressed + retrieved beats raw-stuffing at every metric.
13. **Evaluation must be automated + continuous.** Golden scripts with planted facts, scored by contradiction rate, invent rate, and forgotten-pin rate — run on every model swap.
14. **MP memory is a later track.** This pack designs the data model but does NOT recommend shipping MP in the live SynapticGM client. The SP memory hardening ships first.
15. **The top 3 backlog items are:** (a) claim-grounding in the writer prompt, (b) compression scheduler with lossless-fact protection, (c) automated eval harness with golden scripts.

---

## B) Failure Modes of Current AI RPGs (Evidence Table)

| # | Failure | Who Suffers | Root Cause | Player Symptom | Prevention Pattern |
|---|---------|-------------|-----------|----------------|-------------------|
| 1 | **Invented items** | AI Dungeon, NovelAI, F&F | LLM generates loot, chests, or items not in any state. No inventory ledger owns truth. | "I opened the chest and found a Blade of Infinite Stars. Next turn, it's gone from my inventory." | Code-owned inventory. LLM may narrate "you find a blade" only if code has already rolled it and placed it in inventory. Claim-grounding: only narrate entities in the situation packet. |
| 2 | **Invented NPCs** | AI Dungeon, F&F, generic RAG RPGs | LLM generates a named character with no backing record. The NPC is inconsistent or forgotten next turn. | "The shopkeeper Helena gave me a quest. Next session, no one named Helena exists." | NPC registry (code-owned). LLM may only name NPCs present in the situation packet. New NPCs are created by code (event triggers), not by the LLM. |
| 3 | **Forgotten promises** | All competitors at turn 50+ | Promise made in early prose is outside the context window. No structured record of unresolved commitments. | "The blacksmith said he'd repair my sword by dawn. 20 turns later, no mention." | Unresolved-consequence ledger (Layer 4 in §D). Promises are structured events with a resolution flag. Retrieved into context until resolved. |
| 4 | **Location amnesia** | AI Dungeon (World Info keyword miss), NovelAI (lorebook out of context) | Location details stored as keyword-triggered text. Keywords don't fire, details vanish. | "The tavern had a broken chandelier. I come back — the chandelier is fine." | Dual location sheet (current + previous place) with structured fields. Place state persists in code, not in prose history. |
| 5 | **Quest contradiction** | F&F (lower tiers), AI Dungeon | Quest state tracked in prose summaries, not structured data. Summaries paraphrase incorrectly. LLM narrates a quest as complete when it isn't, or vice versa. | "The GM says I completed the escort quest. I didn't. The NPC is still waiting." | Quest state is code-owned (DAG with objective flags). The LLM receives the current quest state as a structured token, not as a summary it wrote. |
| 6 | **Combat state drift** | F&F (combat mid-rework, 2026), Hidden Door (dice behind scenes) | LLM tracks HP/damage in prose. Over multiple rounds, totals drift. Player takes "12 damage" three times from a creature that should have died. | "I've hit the goblin five times and it's still standing. How much HP does it have?" | Code owns all combat math. The LLM receives an outcome token (HIT/MISS/CRIT + enemy HP%) and narrates the result. It never calculates damage or tracks HP. |
| 7 | **MP "host pays"** | Friends & Fables | Host's subscription pays for all players' LLM calls. Combat burns credits 2–3x faster. Host exhausts budget mid-session. | "We were in the boss fight and the host ran out of credits. Session over." (DreamGen review, DungeonsDeep review, Aug 2026) | Per-player LLM budget (already locked for WOF). Each player's turns are metered independently. No single player's budget can end the group session. |
| 8 | **Memory desync in MP** | F&F (reported on lower tiers) | Retrieval-based memory with tier-gated context size. Lower-tier players lose details that higher-tier players retain. Same session, different memories. | "The DM remembers what happened to you but not to me. I'm on the free tier." (Reddit sentiment, 2025–2026) | Never tier-gate memory quality. All players in a session see the same mechanical truth. Capacity (turns/day) is the subscription lever, not memory fidelity. |
| 9 | **Credit burn mid-fight** | F&F, AI Dungeon (credit model) | Combat requires more LLM calls per unit of play (one per round vs one per scene). Players exhaust credits during the most exciting content. | "I can explore for an hour, but one combat drains half my credits." (DungeonsDeep F&F review, 2026) | Turn-based budgeting (not credit-based). A lockstep combat round costs 1 turn, same as a hub beat. Combat is not penalized. (WOF already locks this.) |
| 10 | **Lore bleed across characters** | AI Dungeon, NovelAI (shared lorebook across stories) | Global lorebook entries leak between unrelated adventures. Character A's backstory appears in Character B's story. | "My new character somehow knows about the dragon from my old campaign." | Per-character memory isolation. Each character has its own PlayerMemory store. Lorebook (if used) is scoped per character, not per account. |
| 11 | **Tier-gated memory of the player's own story** | F&F (lower tiers have less retrieval), AI Dungeon (free tier has smaller context) | Business model ties memory quality to subscription tier. Free players' stories are literally dumber. | "I upgraded my sub and suddenly the GM remembered things from 10 sessions ago. It was always there — I just wasn't paying enough." | Memory quality is never tiered. Free and paid players get the same retrieval, the same compression, the same claim-grounding. Only capacity (turns/day, pins) scales with the subscription. |
| 12 | **Summary-overwrites-fact** | AI Dungeon (summarization bug, Oct 2024 Reddit report) | Auto-summarizer appends raw text instead of summarizing. Or summarizer loses a critical detail (name, promise, item). Summary becomes the source of truth and the fact is gone. | "The AI summarized 'met the blacksmith Torin' as 'visited a shop.' Now Torin doesn't exist." | Summaries are LOSSY for prose style but LOSSLESS for structured facts. Before summarizing, extract named entities, promises, and quest references into the structured ledger. The summary augments the ledger; it never replaces it. |
| 13 | **Locality hallucination** | SynapticGM (Jax playtest, 15 Aug 2026) | No locality contract. Writer US-defaulted a UK street (civilian pistol on pavement). | "A woman screams as her pistol jams mid-reload. On a street in Lincoln, England." | LocalityToken (§1 of SGM_Remaining_Live_Holes_Dump). Code-derived, injected every turn. Warden post-filter rejects firearms in no-carry zones. |
| 14 | **Soft invent (places)** | SynapticGM (Jax playtest) | extractNamedPlaces scraped noun phrases ("Chaos," "Eye Level") and promoted them to map pins. Writer then narrated "the Eye Level store." | "My map has pins called 'Disbelief' and 'Your Palm.' I entered 'Eye Level' and it became a shop." | Place-harvest allowlist + denylist (§2 of SGM_Remaining_Live_Holes_Dump). Claim-grounding: writer may only reference places present in the Place record or situation packet. |

---

## C) Competitor / Analogue Memory Architectures

| System | Structured State? | Summaries? | RAG / Retrieval? | Who Owns Combat Math? | MP Model? | Known Player Complaints |
|--------|-------------------|-----------|-----------------|----------------------|-----------|------------------------|
| **AI Dungeon** (Latitude, 2020–present) | Partial. "Story Cards" are keyword-triggered text blocks (World Info pattern). No structured inventory or quest ledger. Plot Essentials (formerly Memory) is a user-edited text block. | Yes. Auto-summarization of recent actions into "Memories." Reported broken (Oct 2024 Reddit): appends raw text instead of summarizing, maxing out memory budget. | Yes. Memories are retrieved by relevance. But retrieval operates on unstructured summaries — garbage in, garbage out. | **The LLM.** Dice exist but are bolted on. The LLM can narrate contradictory outcomes. No authoritative HP ledger. | Single-player only (multiplayer experiments abandoned). | Memory summarization broken (2024). Forgotten characters, invented items, contradictory quests. Free tier has smaller context = worse memory. Keyword WI is brittle (fires on wrong triggers or not at all). |
| **NovelAI** (Anlatan, 2021–present) | No. Lorebook entries are unstructured text triggered by keywords. No game state, no inventory, no HP — NovelAI is a writing tool, not a game engine. | No auto-summarization. User manually writes "Memory" (persistent context block) and "Author's Note" (injected near the end of context). | Lorebook entries are keyword-triggered (not semantic retrieval). Context is 8,192 tokens at Opus tier. Everything outside that window is invisible unless a lorebook entry fires. | **N/A.** NovelAI is not a game. No combat math. Users who build RPGs on NovelAI must track everything manually. | Single-player only. | 8K context is tiny for long stories. Lorebook management is manual and tedious. No auto-summarization means users must maintain their own memory. Excellent prose quality but zero game-state awareness. |
| **Friends & Fables** (Side Quest Labs, 2023–present) | Partial. "Franz" AI has a worldbuilding suite with FK relationships (entities, locations, factions). Retrieval-based auto-memories every ~5 turns. But combat math is handled by the LLM (mid-rework as of 2026). | Yes. Auto-memories generated every ~5 turns. Retrieval-based: relevant memories pulled into context. Quality reported to degrade on lower tiers (less retrieval budget). | Yes. Semantic retrieval of memories. Quality is tier-gated: higher tiers retrieve more memories, giving better continuity. | **The LLM** (currently). Combat is mid-rework. The model "occasionally fumbles basic dice procedure" (DungeonsDeep review, 2026). No authoritative HP ledger. | Yes — real-time multiplayer (2–6 players). Host pays for all players. @mentions for player-specific actions. | Host-pays credit model (combat burns 2–3x). Memory drift on long campaigns, worse on lower tiers. Combat reliability issues. Complex UI. Tier-gated memory = pay to remember your own story. |
| **Hidden Door** (2023–present) | Yes (strongest competitor here). Card-based state system: characters, locations, items are structured cards with attributes. Dice rolls are behind the scenes. Dictionary-based content filtering. | Implicit in the card system. Cards accumulate and serve as structured memory. | Cards function as a structured retrieval system. Relevant cards are surfaced based on the current scene. | **Code** (dice behind the scenes). Hidden Door has the closest architecture to SynapticGM's code-owns-truth model. But it's less transparent (player doesn't see dice). | Yes — social/multiplayer sessions. Publisher-licensed worlds (Wizard of Oz, Pride and Prejudice — public domain; The Crow — licensed). Subscription-tiered world access. | Less RPG-mechanical depth (no visible character sheet, no tactical combat). Relies on publisher partnerships for content. Card system can feel constrained. Limited character customization. |
| **MemGPT / Letta** (UC Berkeley BAIR → Letta Inc., 2023–present) | N/A (framework, not a game). Provides a tiered memory architecture: working context (main context window), recall storage (searchable conversation history), archival storage (long-term vector DB). | Yes. The LLM itself manages memory: decides what to save, what to search, what to evict. "Virtual context management" inspired by OS memory hierarchy. | Yes. Archival storage uses embedding-based retrieval. The LLM issues search queries to its own memory. | N/A (not a game). | N/A (agent framework). | Research influence is high (23K+ GitHub stars). Production adoption is unclear. Self-managed memory is elegant but risky for games: the LLM deciding what to remember is exactly the problem (it might forget the quest). Apache 2.0 license. |
| **"The Manager" pattern** (academic: survey of LLM memory management, 2024–2025) | Varies. The pattern uses a "manager" agent that maintains a structured knowledge base, separate from the "actor" agent that generates text. | Yes. The manager summarizes and organizes memories. The actor reads from the organized store. | Yes. The manager retrieves relevant memories for the actor. | N/A (general pattern). | N/A. | Academic pattern, not shipped product. Adds latency (two-agent calls). But the separation of "rememberer" and "narrator" is exactly what SynapticGM already does (code = manager, LLM = actor). |
| **GraphRAG / knowledge-graph memory** (Microsoft Research, 2024; various academic, 2024–2026) | Yes. Entities and relationships stored as a graph. Queries traverse edges to retrieve relevant context. | Yes. Community summaries generated from graph clusters. | Yes. Graph traversal + vector retrieval hybrid. | N/A (general purpose). | N/A. | Higher indexing cost than flat RAG. Graph construction requires entity extraction from every turn. Quality depends on extraction accuracy. For games: potentially excellent for NPC–Place–Quest edges, overkill for general prose memory. |

### Key Takeaways

1. **Hidden Door is the closest competitor architecturally** (structured cards = code-owned state). But it lacks tactical depth and transparent mechanics.
2. **F&F has the strongest MP implementation** but suffers from LLM-owns-combat and host-pays.
3. **AI Dungeon and NovelAI are cautionary tales**: unstructured memory + LLM-as-engine = hallucination at scale.
4. **MemGPT's tiered architecture is influential** but self-managed memory (LLM decides what to remember) is dangerous for games where mechanical facts must survive.
5. **GraphRAG is promising for NPC/Place/Quest edges** but needs to be lightweight (< 500 nodes) to be practical for an indie studio.

---

## D) Proposed SynapticGM "Truth Stack" (Product Differentiator)

### Overview

Eight layers, ordered by priority (Layer 0 is never pruned, Layer 7 is pruned first). Each layer has: contents, max size, write trigger, read trigger, prune rule, owner.

The stack is assembled into the writer prompt from top (Layer 0) to bottom (Layer 7). When the total exceeds the context budget, layers are truncated from the bottom up — Layer 7 first, then 6, etc. Layers 0–2 are NEVER pruned.

### Layer Definitions

```typescript
interface TruthLayer {
  layer: number;                            // 0–7, lower = higher priority
  name: string;
  contents: string;
  maxTokens: number;
  writeTrigger: string;
  readTrigger: string;
  pruneRule: string;
  owner: "code" | "llm" | "hybrid";
  prunable: boolean;
}
```

| Layer | Name | Contents | Max Tokens | Write Trigger | Read Trigger | Prune Rule | Owner | Prunable? |
|-------|------|----------|-----------|---------------|-------------|-----------|-------|----------|
| **0** | **Rules & engine invariants** | Engine mode (litrpg/dnd/rpg), genre constraints, LocalityToken, perspective setting, Kid Mode flags, claim-grounding instructions, "never invent" directives. | 300 | Session start; setting change; locality change. | Every turn. | **Never prune.** | Code | No |
| **1** | **Live mechanical state** | HP, STA, inventory (short names only), equipped items, active conditions, gold, XP, level, quest objectives (current step only), encounter state (if in combat: combatants, HP%, round#), dungeon node (if in instance: room index, fog state, cleared rooms). | 400 | Every code-state change (damage, loot, quest advance, room change). | Every turn. | **Never prune.** Stale entries (completed quests, sold items) are removed by code, not by LLM or summarizer. | Code | No |
| **2** | **Situation packet** | Current Place (name, description, exits, NPCs present, danger tier, time of day), previous Place (name only, 1 line), weather, visible entities (max 10 from catalog). | 400 | Place change; entity spawn/despawn; weather change. | Every turn. | **Never prune** the current Place. Previous Place is 1 line max. If entity list exceeds 10, prioritize: interacting > visible > habitat match. | Code | No |
| **3** | **Campaign summary + PC personality** | Auto-compressed campaign arc (major events, turning points, named NPCs met, factions encountered). PC personality notes (player-authored or auto-extracted: speech style, stated goals, notable choices). | 300 | Every 50 turns (campaign summary refresh). PC personality: on player edit or after significant choice. | Every turn. | Older campaign summaries are replaced by newer ones. PC personality is append-only (max 5 bullet points). | Hybrid (code triggers; LLM generates summary with fact-extraction guardrails). | Summary is replaced, not pruned. PC notes are capped at 5. |
| **4** | **Active conditions + unresolved consequences** | Structured list of: unresolved promises (NPC said they'd do X), active effects (poison, buff, curse), pending timers (dawn, 3 turns, next rest), open threads (the locked door, the missing key, the betrayal hint). | 200 | When a promise/condition/timer is created or resolved. | Every turn. | Resolved items are removed immediately. Unresolved items persist until resolved or explicitly abandoned (player says "forget it" or 100 turns pass without reference — speculative). | Code (structured events with resolution flags). | Only resolved items are removed. Unresolved items are never pruned. |
| **5** | **Retrieved episodic memories** | Top-k relevant memories from the episodic store (semantic search). Each memory is a 1–3 sentence summary of a past event, tagged with turn number, Place, and NPCs involved. | 200 | N/A (read-only layer; memories are written to the episodic store, not to this layer). | Every turn: code queries the episodic store with the current situation (Place, NPCs present, player intent) and retrieves top-k (k=3–5, speculative). | Oldest retrieved memories are replaced each turn by newly relevant ones. The episodic store itself is never pruned (it grows with the campaign). | Hybrid (code retrieves; LLM wrote the original summaries during compression). | Layer is rebuilt every turn from retrieval results. |
| **6** | **Player pins** | Player-pinned facts (max 3–5 pins). Auto-pins (code-selected: e.g., current quest giver's name, last significant NPC interaction). | 100 | Player pins: on player action ("pin this"). Auto-pins: on quest accept, significant NPC interaction. | Every turn. | Player pins: removed only by the player. Auto-pins: removed when the associated quest/NPC interaction is resolved. Max total pins: 5 (speculative). | Hybrid (player pins are player-owned; auto-pins are code-owned). | Player pins: never auto-pruned. Auto-pins: pruned on resolution. |
| **7** | **Outcome token + narration directives** | The current turn's outcome token (HIT/MISS/CRIT/EXAMINE/DIALOGUE/etc.), beat-fidelity contract ("your prose MUST name the object"), and any one-turn-only directives (e.g., "this is the first turn in a new Place — describe the environment before any creature"). | 100 | Every turn (rebuilt fresh). | This turn only. | **Discarded after this turn.** The outcome token is ephemeral. | Code | Discarded every turn (not "pruned" — just not carried forward). |

### Total Budget

| Layers | Tokens | Prunable? |
|--------|--------|----------|
| 0–2 (invariants + state + situation) | ~1,100 | No |
| 3–6 (summary + conditions + retrieved + pins) | ~800 | Yes (in order 6→5→3) |
| 7 (outcome token) | ~100 | Ephemeral |
| **Total memory layers** | **~2,000** | |
| Player input | ~200 | No |
| System prompt (rules, not counted in memory) | ~300 | No |
| **Total prompt** | **~2,500** | |

### Failure If Missing

| Layer | What Breaks If Missing |
|-------|----------------------|
| 0 | Writer ignores engine mode, invents firearms, uses wrong perspective, violates Kid Mode. |
| 1 | Writer invents HP, grants loot not in inventory, narrates a completed quest as active. |
| 2 | Writer doesn't know where the player is. Describes the wrong room, wrong NPCs, wrong exits. |
| 3 | Writer loses the campaign arc. At turn 200, it's a new story. PC personality is inconsistent. |
| 4 | Promises are forgotten. The blacksmith never repairs the sword. Poison wears off without narration. |
| 5 | Player references "that merchant in Reedfen" and the writer has no idea. Long-term continuity breaks. |
| 6 | Player pinned "I promised to avenge my brother" and the writer ignores it. Player feels unheard. |
| 7 | Writer doesn't know this turn's outcome. Narrates a hit as a miss, or ignores the beat entirely. |

---

## E) Anti-Hallucination Pipeline (SP)

### End-to-End Turn Map

```
Player input
    ↓
[1] INPUT MEDIATION (code)
    - Intent classification: attack / examine / talk / move / freetext
    - Protest/insult detection (not an action — re-prompt)
    - "Talk to [NPC]" → validate NPC is in the situation packet
    - "Use [item]" → validate item is in inventory
    - If validation fails: diegetic rejection ("You don't have that" / "No one by that name is here")
    ↓
[2] CODE CHECK (pre-LLM)
    - Dice rolls, damage calc, HP update, loot roll, quest objective check
    - Room graph traversal (if moving)
    - Encounter spawn (if danger tier triggers)
    - All mechanical truth resolved HERE, before the LLM is called
    ↓
[3] OUTCOME TOKEN (code → LLM)
    - HIT 6 / MISS / CRIT / EXAMINE { targetHint } / DIALOGUE { npcId } / MOVE { newPlaceId }
    - Enemy HP% (not raw HP — the LLM describes "badly wounded," not "12 HP")
    - Player HP% / STA%
    - Beat-fidelity contract ("your prose MUST name the object" / "describe the new room before any creature")
    ↓
[4] PROMPT ASSEMBLY (code)
    - Build the truth stack: layers 0–7 assembled in order
    - Truncate from bottom if over budget
    - Inject LocalityToken, perspective, claim-grounding directive
    ↓
[5] WRITER CALL (LLM — 1 call)
    - 2–6 sentences. This turn's camera. Unique every turn.
    - Max 1 empty-body retry. No third call.
    ↓
[6] WARDEN (code — post-check)
    - Banned-name filter (Stormwind, Hogwarts, etc.)
    - Perspective enforcement (second person → regex check → cheap rewrite if violated)
    - Claim-grounding check: every named entity in the prose must be in the situation packet or outcome token.
      If the writer names an NPC, item, or place NOT in the packet → STRIP the name, replace with a generic
      ("a figure" / "something" / "a building"), OR reject and retry once.
    - Fact-lock: if outcome = MISS, prose must not contain "hits" / "strikes" / "connects."
      If outcome = HIT, prose must not contain "misses" / "dodges" / "avoids."
    - HP-lock: if enemy HP > 0, prose must not contain "dies" / "crumples" / "falls lifeless."
    - Dedup: rolling 3-turn buffer rejects >80% sentence overlap.
    - Locality: if LocalityToken = no_civilian_carry, reject "pistol" / "handgun" / "revolver."
    ↓
[7] COMMIT (code)
    - Structured events extracted from the committed prose:
      - New named entities → NPC registry (if code-validated, not if LLM-invented)
      - Promises / consequences → Layer 4 (unresolved conditions)
      - Place descriptions → Place record update
    - Turn summary written to episodic store (1–2 sentences: what happened, who was involved, where)
    - System chrome generated (only if ledger changed)
    - Choices generated from committed beat (code, not LLM)
    - Snapshot persisted to cloud (before images)
    ↓
[8] IMAGES (async, after text box unlocks)
    - Panel script derived from outcome token + prose length (code, not Director LLM)
    - Image prompts built from visual consistency block (code)
    - Sequential generation, non-blocking
```

### Pre-Check vs Post-Check

| Check | Pre (before LLM) | Post (after LLM) | Rationale |
|-------|------------------|-------------------|-----------|
| **Item in inventory** | ✓ | — | Don't waste an LLM call on an impossible action. |
| **NPC in scene** | ✓ | — | Same. |
| **Place exists** | ✓ | — | Same. |
| **Combat math** | ✓ | — | Code resolves dice before the LLM writes. |
| **Banned names** | — | ✓ | LLM might generate any name. Catch after. |
| **Fact-lock (HIT/MISS)** | — | ✓ | LLM must narrate the outcome, so check its narration. |
| **Claim-grounding** | — | ✓ | LLM might invent entities. Catch after. |
| **Perspective** | — | ✓ | LLM might slip. Catch after. |
| **Locality** | — | ✓ | LLM might US-default. Catch after. |
| **Dedup** | — | ✓ | Can only check after prose exists. |

### When to Retry vs System-Correct

| Problem | Retry LLM? | System-Correct? | Notes |
|---------|-----------|-----------------|-------|
| Empty body | Retry once | Diegetic fallback after 1 retry | "The moment blurs. Try again." |
| Wrong perspective (3rd person) | No | Cheap rewrite (regex + small model, <1s) | Not worth a full retry. |
| Banned name in prose | No | Strip and replace | "Stormwind" → "the distant city" |
| Invented NPC name | No | Strip and replace with generic | "Helena" → "a shopkeeper" (if Helena not in NPC registry) |
| Fact-lock violation (narrates MISS as HIT) | Retry once | Fallback prose if retry also fails | "The round resolves." |
| Dedup (stock phrase repeated) | No | Cheap rewrite to replace the repeated sentence | Not worth a full retry. |
| Locality violation (pistol in UK) | No | Strip the weapon reference | Replace "her pistol jams" → "she stumbles back" |

### How to Stop Soft Invent Without Killing Creativity

```
CLAIM-GROUNDING DIRECTIVE (injected in Layer 0):

"You may describe the environment, atmosphere, sounds, smells, and weather freely.
 You may describe the player's sensations and emotions freely.
 You MUST NOT name or introduce:
   - Any person/NPC not listed in NPCS_PRESENT
   - Any item not listed in VISIBLE_ITEMS or PLAYER_INVENTORY
   - Any place/shop/building not listed in CURRENT_PLACE or KNOWN_PLACES
 You MAY reference unnamed background figures ('a passerby,' 'someone across the street')
   but you must NOT give them a name, a speaking line, or an item.
 You MAY describe environmental details (a broken window, a flickering light)
   but you must NOT create a named location from them."

This preserves atmospheric creativity (the writer can describe a dripping ceiling,
a distant siren, the smell of rain) while preventing mechanical invention
(no named NPCs, items, or places that don't exist in state).
```

---

## F) Long-Horizon Memory (Turn 100–500)

### Compression Schedules

```typescript
interface CompressionSchedule {
  turnSummary: {
    frequency: number;                      // every N turns
    maxLength: number;                      // tokens per summary
    losslessFacts: LosslessFact[];          // extracted before compression
  };
  locationArcSummary: {
    trigger: "place_change";                // on leaving a Place
    maxLength: number;
    losslessFacts: LosslessFact[];
  };
  campaignSummary: {
    frequency: number;                      // every M turns (M >> N)
    maxLength: number;
    replaces: "previous_campaign_summary";
  };
}

type LosslessFact =
  | "npc_name_introduced"                   // NPC names must survive compression
  | "promise_made"                          // unresolved promises must survive
  | "quest_accepted_or_advanced"            // quest state changes must survive
  | "item_given_or_received"               // significant item transfers must survive
  | "player_pinned_fact"                    // player-pinned facts must survive
  | "pc_personality_note"                   // personality notes must survive
  | "death_or_major_consequence";           // deaths, betrayals, major events must survive
```

#### Recommended Schedule

| Level | Trigger | Max Length | Lossless Extraction | Store |
|-------|---------|-----------|--------------------|----|
| **Turn summary** | Every 5 turns (speculative) | 60 tokens (~2 sentences) | NPC names, items, quest refs | Episodic store (permanent, searchable) |
| **Location arc summary** | On leaving a Place (any Place, not just dungeons) | 100 tokens (~4 sentences) | NPCs met, quests advanced, items found, promises made, map pins | Episodic store (tagged with Place ID) |
| **Campaign summary** | Every 50 turns | 200 tokens (~8 sentences) | Major events, turning points, faction shifts, PC choices | Layer 3 (replaces previous summary) |

#### Quality Criteria for Summaries

```
A summary is GOOD if:
1. All lossless facts are present (NPC names, quest refs, items, promises).
2. The summary is coherent as a standalone paragraph (not sentence fragments).
3. The summary preserves CAUSE and EFFECT ("because X happened, Y changed").
4. The summary does NOT include: prose style, atmospheric description, or dialogue verbatim.
   It's a plot summary, not a prose excerpt.

A summary is BAD if:
1. It loses a named NPC ("met the blacksmith" → "visited a shop").
2. It inverts a fact ("completed the quest" when the quest is still active).
3. It merges two NPCs into one.
4. It's so compressed that it's meaningless ("things happened").

Quality gate: after the LLM generates a summary, code checks:
  - Do all NPC names from the source turns appear in the summary?
  - Do all quest IDs referenced in the source turns appear in the summary?
  - Do all unresolved promises from the source turns appear in the summary?
  If any are missing: re-prompt ONCE with "Your summary is missing: [X]. Include it."
  If still missing: code appends the missing facts as structured bullet points
  below the summary. Not pretty, but lossless.
```

### Semantic Retrieval

```
For turn 100+, the episodic store contains 20+ turn summaries and 5+ location arc summaries.
Not all can fit in Layer 5 (200 tokens, 3–5 memories). Retrieval selects the most relevant.

RECOMMENDED APPROACH: keyword + tag first, semantic embedding second.

Step 1: TAG FILTER
  - Query: current Place ID, NPCs present, active quest IDs, player intent keywords.
  - Filter episodic store to entries matching ANY tag.
  - This is fast (SQL/index lookup) and costs zero LLM tokens.

Step 2: SEMANTIC RE-RANK (if tag filter returns > k results)
  - Embed the current situation (Place + intent + NPCs) as a vector.
  - Rank tag-filtered results by cosine similarity.
  - Return top-k (k=3–5).

WHY NOT EMBEDDING-ONLY:
  - Embedding search alone misses structured connections (NPC X was met at Place Y during Quest Z).
  - Tag filtering catches these connections cheaply.
  - Embedding re-ranking catches thematic connections ("this feels similar to when...").
  - Hybrid > either alone.

EMBEDDING VENDOR (speculative, v1):
  - Use the same LLM provider's embedding model (if available) to avoid a second vendor.
  - Embedding dimension: 256–512 is sufficient for < 1000 entries.
  - Cost: negligible (~$0.0001 per embedding at 2026 rates). The episodic store for a 500-turn
    campaign has ~100 entries. Embedding all of them costs < $0.01 total.
  - Latency: < 100ms for a top-k search over 100 entries. Not a bottleneck.
```

### Knowledge Graph: Worth It?

```
RECOMMENDATION: Yes, but lightweight.

A knowledge graph stores NPC–Place–Quest edges:
  - "Torin (blacksmith) is located at Market Square"
  - "Torin gave Quest: Repair the Blade"
  - "Quest: Repair the Blade requires Item: Broken Blade"
  - "Player has Item: Broken Blade in inventory"

Graph queries answer: "Who is at Market Square?" "What quests involve Torin?"
"Where did I get the Broken Blade?"

For an indie studio:
  - Do NOT build a full Neo4j deployment.
  - Use a simple adjacency list or edge table in the existing database.
  - Nodes: NPCs, Places, Quests, Items. Max ~500 nodes for a 300-turn campaign.
  - Edges: "located_at", "gave_quest", "requires_item", "has_item", "met_at", "promised".
  - Query: 1–2 hop traversal from the current context. Fast. Cheap.
  - Maintenance: code adds edges on structured events (NPC introduced, quest accepted, item given).
    The LLM does NOT maintain the graph.

SCHEMA:
```

```typescript
interface KnowledgeEdge {
  sourceType: "npc" | "place" | "quest" | "item" | "player";
  sourceId: string;
  edgeType: "located_at" | "gave_quest" | "requires_item" | "has_item" |
            "met_at" | "promised" | "sold_by" | "dropped_by" | "leads_to";
  targetType: "npc" | "place" | "quest" | "item" | "player";
  targetId: string;
  turnCreated: number;
  resolved: boolean;                        // for promises, quests
}
```

```
Cost: trivial (< 500 rows in a table). Query: < 10ms. Maintenance: code-only.
Value: high for NPC/Place/Quest retrieval. Low for atmospheric/prose memory.
Use the graph for structured recall ("who was at the tavern?"), not for prose style.
```

### Player Correction UX (Diegetic)

```
When the player notices the GM misremembered something:

Player types: "No, the blacksmith's name was Torin, not Tomas."

Code classifies this as: intent_type: "correction"
Code checks the NPC registry:
  - If "Torin" exists → update context, re-prompt writer with corrected fact.
  - If "Torin" does not exist but "Tomas" does → ask: "Did you mean Tomas, the blacksmith
    at Market Square? Or is Torin someone else?"
  - If neither exists → create NPC "Torin" with the player's description.

Diegetic response: "You're right — Torin. The name comes back to you clearly now."
The correction is persisted as a structured fact (NPC registry update + pin update).
It is NOT just a prose line that will be forgotten.

The System chrome shows: "Correction noted: Torin (blacksmith, Market Square)."
This does NOT count as a "sticky failure" or a System line. It is a correction acknowledgment.
```

### Save Size / Cloud Sync

```
For a 500-turn campaign:
  - Mechanical state (HP, inventory, quests, conditions): ~2 KB JSON
  - Situation packet (Places, NPCs): ~5 KB JSON
  - Episodic store (100 summaries × 100 tokens × ~4 chars/token): ~40 KB text
  - Knowledge graph (500 edges × ~100 bytes): ~50 KB
  - Player pins (5 × ~100 bytes): ~0.5 KB
  - Campaign summary: ~1 KB
  - PC personality notes: ~0.5 KB
  TOTAL: ~100 KB per character save.

This is tiny. Cloud sync is trivial. Saves can be stored in any key-value store
or relational database. No special infrastructure needed.

Sync policy:
  - Auto-save after every committed turn (Layer 7 committed → persist all layers).
  - Conflict resolution: last-write-wins (single-player, no conflicts possible).
  - MP (later): server-authoritative state. No client-side saves. No sync conflicts.
```

---

## G) Multiplayer Memory (Later Track — Quarantined)

### Design Principles

1. **Single shared world ledger.** Mechanical truth (HP, inventory, quest state, room graph) is stored once on the server. All players see the same truth.
2. **Per-player narrative memory stores.** Each player has their own episodic memories, pins, and PC personality notes. Player A's private scene (a solo conversation with an NPC) is stored in Player A's memory only.
3. **Memory scoping.** Every memory entry is tagged with a scope:

```typescript
interface MemoryScope {
  scopeType: "global" | "instance" | "hub" | "party" | "player";
  scopeId: string;
  // global: visible to all players in the world (rare — major world events only).
  // instance: visible to all players in this instance (dungeon room descriptions, boss encounters).
  // hub: visible to all players in this hub Place (hub atmosphere, NPC dialogue in the hub).
  // party: visible to all players in this party (party-specific events, shared combat).
  // player: visible to this player only (solo conversations, personal thoughts, private quests).
}
```

### Preventing Private-to-Public Leak

```
When Player A has a private conversation with an NPC:
  - The conversation is stored in Player A's memory (scope: player).
  - The NPC's state may change (e.g., NPC is now "friendly to Player A").
    This state change is stored on the NPC record (code-owned, world state).
  - When Player B talks to the same NPC, the NPC's state is visible
    (the NPC is friendly to Player A), but the CONTENT of Player A's conversation
    is NOT in Player B's context.
  - Player B's writer prompt includes: "This NPC is friendly to another player"
    (if relevant), but NOT the transcript of Player A's conversation.

Rule: narrative content (prose, dialogue, descriptions) is scoped.
      Mechanical state (NPC disposition, quest flags) is shared.
      The shared ledger stores FACTS. Per-player memory stores PROSE.
```

### Authority When Two Players Contradict in Free Text

```
Scenario: Player A types "I set the tavern on fire." Player B types "I'm sitting peacefully in the tavern."

Resolution: CODE AUTHORITY.
  1. Player A's action goes through intent classification.
  2. "Set the tavern on fire" → intent: "environmental_action" → code check:
     Does Player A have a fire source? Is the tavern flammable? Is this allowed by the rules module?
  3. If code approves: the tavern is on fire (mechanical state). ALL players in the hub see it.
  4. Player B's "sitting peacefully" is overridden by mechanical reality.
     Player B's writer prompt includes: "The tavern is on fire. [outcome token: FIRE_STARTED]"
  5. Player B's writer narrates accordingly.

The LLM does NOT arbitrate between players. Code does.
Free text from Player A is mediated through the same intent → code check → outcome token pipeline.
If code rejects ("you don't have a fire source"), the tavern is not on fire.
Player A's writer narrates: "You look for something to start a fire, but nothing's at hand."
```

### Memory Retrieve Scoped by Context

```
When assembling the writer prompt for Player X in Instance Y:

Layer 0 (Rules): same for all players (engine mode, world rules).
Layer 1 (Mechanical state): Player X's own HP, inventory, conditions.
  + shared instance state (encounter ledger, room state, all combatants).
Layer 2 (Situation packet): shared instance Place + NPCs.
Layer 3 (Campaign summary): Player X's own campaign summary.
Layer 4 (Conditions): Player X's own unresolved conditions
  + shared instance conditions (boss phase, environmental effects).
Layer 5 (Retrieved memories): from Player X's own episodic store,
  PLUS from instance memory (shared combat events, shared dialogue).
  Scoped: player_memory(X) + instance_memory(Y) + party_memory(X.partyId).
  NOT: player_memory(other players) or hub_memory from a hub they're not in.
Layer 6 (Pins): Player X's own pins.
Layer 7 (Outcome token): Player X's own action outcome (or shared round outcome in Mode C).
```

### Cost: Who Pays Tokens

```
Mode A (personalized narration, 5-man):
  - 1 writer call per player per round.
  - Each player's prompt is assembled independently (their own truth stack).
  - Each player pays 1 turn from their own TurnLedger.
  - Prompt size: ~2,500 tokens per player (same as SP).
  - Total LLM cost per round: 5 × 2,500 = 12,500 input tokens + 5 × ~500 output = ~15,000 tokens.

Mode C (shared narration, 10-man raid):
  - 1 writer call per round (shared).
  - The shared prompt includes: instance state + ALL 10 players' last actions (summarized).
  - Prompt size: ~3,500 tokens (larger because 10 players' actions are summarized).
  - Output: ~800 tokens (one paragraph covering 10 players).
  - Total LLM cost per round: ~4,300 tokens.
  - Per-player cost: ~430 tokens (vs ~3,000 for Mode A). Dramatically cheaper.

Memory size scaling with N players:
  - Mechanical state: O(N) — each player has their own HP/inventory. Trivial.
  - Episodic store: O(N × T) — each player has T turn summaries. At 100 turns × 10 players = 1000 entries.
    Still tiny (<400 KB). Retrieval is scoped to one player's store + shared instance memory.
  - Knowledge graph: O(N × E) — edges grow with players. But most edges are shared (NPCs, Places, Quests).
    Player-specific edges (met NPC at turn X) scale linearly. At 500 shared + 50 per player × 10 = 1000 edges. Trivial.
  - Prompt assembly: per-player. Does NOT scale with N (each player's prompt is independent).
```

### Lessons from F&F

| F&F Pattern | Copy? | Avoid? | WOF/SGM Pick |
|------------|-------|--------|-------------|
| Auto-memories every ~5 turns | Copy (already doing this as Pack 6 turn summaries) | — | Turn summary every 5 turns. |
| Retrieval-based memory | Copy | Avoid tier-gating retrieval quality | Same retrieval for all tiers. Capacity (turns/day) is the lever. |
| Host pays for the table | — | Avoid | Per-player LLM budget. Each player pays their own turns. |
| @mentions for player-specific actions | Copy (useful for MP) | — | Mention system for directing actions to specific players (v2). |
| Combat burns credits faster | — | Avoid | Combat round costs 1 turn, same as a hub beat. No penalty. |
| Tier-gated memory (lower tier = less retrieval) | — | Avoid (predatory) | Memory quality is never tiered. |
| Worldbuilding suite with FK relationships | Copy (this is the knowledge graph) | — | Knowledge graph (NPC–Place–Quest edges). |

### Recommended MP Memory Diagram

```
                    ┌──────────────────────────────┐
                    │     SERVER (authoritative)     │
                    │                                │
                    │  ┌──────────────────────────┐  │
                    │  │   SHARED WORLD LEDGER     │  │
                    │  │  (HP, inventory, quests,   │  │
                    │  │   encounter state, room    │  │
                    │  │   graph, NPC registry,     │  │
                    │  │   knowledge graph)          │  │
                    │  └──────────┬───────────────┘  │
                    │             │                   │
                    │   ┌─────────┴──────────┐        │
                    │   │                    │        │
                    │  ┌▼──────────┐  ┌──────▼─────┐ │
                    │  │ INSTANCE  │  │   HUB      │ │
                    │  │ MEMORY    │  │   MEMORY   │ │
                    │  │ (per-inst │  │  (per-hub  │ │
                    │  │  combat,  │  │   atmos,   │ │
                    │  │  room     │  │   NPC      │ │
                    │  │  prose)   │  │   state)   │ │
                    │  └───────┬──┘  └──────┬─────┘ │
                    │          │             │        │
                    └──────────┼─────────────┼────────┘
                               │             │
              ┌────────────────┼─────────────┼────────────────┐
              │                │             │                │
     ┌────────▼──────┐ ┌──────▼───────┐     │    ┌───────────▼──────┐
     │ PLAYER A      │ │ PLAYER B     │     │    │ PLAYER C         │
     │ MEMORY        │ │ MEMORY       │     │    │ MEMORY           │
     │ ┌───────────┐ │ │ ┌──────────┐ │     │    │ ┌──────────────┐ │
     │ │ Episodic  │ │ │ │ Episodic │ │     │    │ │ Episodic     │ │
     │ │ store     │ │ │ │ store    │ │     │    │ │ store        │ │
     │ ├───────────┤ │ │ ├──────────┤ │     │    │ ├──────────────┤ │
     │ │ Campaign  │ │ │ │ Campaign │ │     │    │ │ Campaign     │ │
     │ │ summary   │ │ │ │ summary  │ │     │    │ │ summary      │ │
     │ ├───────────┤ │ │ ├──────────┤ │     │    │ ├──────────────┤ │
     │ │ PC notes  │ │ │ │ PC notes │ │     │    │ │ PC notes     │ │
     │ ├───────────┤ │ │ ├──────────┤ │     │    │ ├──────────────┤ │
     │ │ Pins      │ │ │ │ Pins     │ │     │    │ │ Pins         │ │
     │ └───────────┘ │ │ └──────────┘ │     │    │ └──────────────┘ │
     └───────────────┘ └──────────────┘     │    └─────────────────┘
                                            │
                              ┌──────────────▼───────────────┐
                              │       PROMPT ASSEMBLY         │
                              │  (per-player, per-turn)       │
                              │                               │
                              │  Layer 0: Rules (shared)      │
                              │  Layer 1: Player X state      │
                              │         + instance state      │
                              │  Layer 2: Situation (shared)  │
                              │  Layer 3: Player X campaign   │
                              │  Layer 4: Player X conditions │
                              │         + instance conditions │
                              │  Layer 5: Retrieved from:     │
                              │    player_memory(X)           │
                              │    + instance_memory          │
                              │    + party_memory             │
                              │  Layer 6: Player X pins       │
                              │  Layer 7: Outcome token       │
                              └───────────────────────────────┘
```

---

## H) Evaluation: How We Know We're Better

### Test Harness

```typescript
interface EvalHarness {
  goldenScripts: GoldenScript[];
  forbiddenInventChecklist: ForbiddenInventItem[];
  longRunSoak: LongRunConfig;
  mpScenario: MpTestConfig;
  metrics: EvalMetrics;
}

interface GoldenScript {
  scriptId: string;
  turns: number;                            // 20–50 turns
  plantedFacts: PlantedFact[];
  // A golden script is a pre-authored sequence of player inputs + expected facts.
  // At each checkpoint turn, the harness queries the GM about a planted fact.
  // If the GM contradicts the fact → contradiction scored.
  // If the GM invents something not in state → invent scored.
}

interface PlantedFact {
  turnPlanted: number;
  factType: "npc_name" | "item_given" | "promise_made" | "place_visited" | "quest_state" | "player_choice";
  factContent: string;                      // "Blacksmith Torin is at Market Square"
  checkTurns: number[];                     // turns where the fact is queried (e.g., [15, 30, 45])
  expectedPresent: boolean;                 // true = fact should still be remembered
}

interface ForbiddenInventItem {
  category: "item" | "npc" | "place" | "tier" | "spell" | "ability";
  description: string;
  // Example: { category: "item", description: "Any item not in the player's inventory or visible items list" }
  // Example: { category: "npc", description: "Any named NPC not in the NPC registry or situation packet" }
  // Example: { category: "tier", description: "Any tier/rarity not assigned by code" }
}

interface LongRunConfig {
  turns: number;                            // 100–300
  autoJudge: boolean;                       // auto-check contradictions per turn
  humanSpotCheck: number;                   // every N turns, a human reads the output (e.g., every 25)
  plantedFacts: PlantedFact[];              // 10–20 facts planted across the run
}

interface MpTestConfig {
  players: 2;
  sharedHubFact: PlantedFact;              // a fact visible to both players
  privateFact: PlantedFact;                 // a fact visible to Player A only
  leakageCheck: number;                     // turn at which Player B is queried about Player A's private fact
  // Expected: Player B does NOT know Player A's private fact.
}

interface EvalMetrics {
  contradictionRate: number;                // % of planted-fact checks where the GM contradicts
  inventRate: number;                       // % of turns where the GM invents a forbidden entity
  forgottenPinRate: number;                 // % of pinned facts that the GM fails to reference when relevant
  costPer100Turns: number;                  // $ cost for 100 turns (LLM + embedding + retrieval)
  latencyP50: number;                       // median turn latency (ms)
  latencyP95: number;                       // 95th percentile turn latency (ms)
  mpLeakageRate: number;                    // % of private facts that leak to the wrong player
}
```

### Golden Script Example (20 Turns)

```
Turn 1:  Player names character "Kael" and is placed on Market Street.
Turn 3:  Player meets blacksmith "Torin" at Market Square. (Planted fact: NPC Torin, Market Square.)
Turn 5:  Torin promises to repair Kael's knife by dawn. (Planted fact: promise, resolve by turn 15.)
Turn 7:  Player fights a Hatchling. Kills it. Loots a Scale. (Planted fact: item Scale in inventory.)
Turn 10: Player meets a stranger at the crossroads. (NPC "Dell" introduced by code.)
Turn 12: CHECK: "Who was the blacksmith I met?" → Expected: "Torin, at Market Square."
Turn 14: CHECK: "Is my knife repaired?" → Expected: "Not yet — Torin said by dawn."
Turn 16: CHECK: "What did I loot from the hatchling?" → Expected: "A scale" (or Reedfen Scale).
Turn 18: INVENT CHECK: Does the GM mention any NPC not in registry? Any item not in inventory?
Turn 20: CHECK: "Where is Torin?" → Expected: "Market Square."
```

### Target Metrics (Speculative)

| Metric | Current (Estimated) | Target (Post-Pack-11) | Best-in-Class |
|--------|--------------------|-----------------------|---------------|
| Contradiction rate | 10–15% (speculative) | < 3% | < 1% |
| Invent rate | 15–20% (speculative) | < 5% | < 2% |
| Forgotten pin rate | 20%+ (speculative) | < 5% | < 2% |
| Cost per 100 turns | $0.30–0.80 (speculative) | $0.20–0.50 | $0.10–0.30 |
| Latency P50 | 5–8s | 3–6s | 2–4s |
| Latency P95 | 15–30s | 8–15s | 5–10s |
| MP leakage rate | N/A (no MP) | < 1% | 0% |

---

## I) Cost & Context Budget

### SP Token Budget (Per Turn)

| Component | Tokens | Notes |
|-----------|--------|-------|
| System prompt (rules, engine mode) | ~300 | Fixed. Not counted in memory budget. |
| Layer 0 (rules + locality + directives) | ~300 | Fixed per session. |
| Layer 1 (mechanical state) | ~400 | Varies with inventory size / combat. |
| Layer 2 (situation packet) | ~400 | Varies with entity count. |
| Layer 3 (campaign summary) | ~300 | Replaced every 50 turns. |
| Layer 4 (conditions) | ~200 | Varies. Low outside combat. |
| Layer 5 (retrieved memories) | ~200 | 3–5 memories × 40–60 tokens each. |
| Layer 6 (pins) | ~100 | 3–5 pins × 20–30 tokens each. |
| Layer 7 (outcome token) | ~100 | Ephemeral. |
| Player input | ~200 | Varies. |
| **Total input** | **~2,500** | |
| Writer output | ~300–500 | 2–6 sentences. |
| **Total per turn** | **~2,800–3,000** | |

### 5-Man Mode A Budget (Per Round)

| Component | Tokens per Player | Total (5 players) |
|-----------|------------------|-------------------|
| Input (per-player prompt) | ~2,500 | 12,500 |
| Output (per-player narration) | ~400 | 2,000 |
| **Total per round** | ~2,900 | **~14,500** |

### 10-Man Raid Mode C Budget (Per Round)

| Component | Tokens | Notes |
|-----------|--------|-------|
| Shared input (instance state + all 10 actions summarized) | ~3,500 | One prompt, not 10. |
| Shared output (one paragraph) | ~800 | Covers all 10 players. |
| **Total per round** | **~4,300** | vs ~29,000 for Mode A with 10 players. |

### Prune Order (When Over Budget)

```
If total prompt exceeds the context budget:

1. First: truncate Layer 5 (retrieved memories) — reduce k from 5 to 3 to 1.
2. Second: truncate Layer 6 (pins) — reduce to 3 pins, then 1.
3. Third: truncate Layer 3 (campaign summary) — compress to 150 tokens, then 100.
4. Fourth: truncate Layer 4 (conditions) — keep only active combat conditions, drop pending timers.
5. NEVER truncate: Layer 0 (rules), Layer 1 (mechanical state), Layer 2 (situation), Layer 7 (outcome token).

If after all truncation the prompt still exceeds budget:
  - This means the mechanical state itself is too large (huge inventory, many conditions).
  - Compress inventory to equipped items + last 5 acquired items.
  - Compress conditions to the 3 most recent.
  - This should never happen in normal play (inventory < 30 items, conditions < 10).
```

### What Never to Prune

| Layer | Why Never Prune |
|-------|----------------|
| 0 (Rules) | Without rules, the writer ignores engine mode, locality, perspective, claim-grounding. Every turn breaks. |
| 1 (Mechanical state) | Without HP/inventory/quests, the writer invents everything. Hallucination city. |
| 2 (Situation) | Without Place/NPCs/exits, the writer doesn't know where the player is. Location amnesia. |
| 7 (Outcome token) | Without the outcome, the writer doesn't know what happened this turn. Narrates the wrong result. |

---

## J) SynapticGM Backlog (15 Implementable Items)

### SP Memory Hardening (Ship First)

| # | Item | Priority | Depends On | Effort (Speculative) |
|---|------|----------|-----------|---------------------|
| 1 | **Claim-grounding directive in Layer 0** — writer may only narrate entities in the situation packet or outcome token. Warden strips invented names. | P0 | Nothing | Small (prompt change + warden regex) |
| 2 | **Lossless-fact extraction before compression** — before any summary is generated, extract NPC names, quest refs, items, promises into structured fields. Quality gate checks extraction. | P0 | Existing summary pipeline | Medium (extraction logic + quality gate) |
| 3 | **Compression scheduler** — turn summary every 5 turns, location arc on Place change, campaign summary every 50 turns. Schedule replaces ad-hoc Pack 6 timing. | P0 | #2 | Medium |
| 4 | **Unresolved-consequence ledger (Layer 4)** — structured list of promises, timers, pending effects. Code creates entries; code resolves them. Entries persist in prompt until resolved. | P1 | Nothing | Medium |
| 5 | **Episodic store with tag + semantic retrieval** — tag-filtered, embedding-reranked top-k memory retrieval for Layer 5. | P1 | #3 (summaries populate the store) | Medium (embedding integration) |
| 6 | **Knowledge graph (lightweight)** — NPC–Place–Quest edge table. Code writes edges on structured events. 1–2 hop retrieval for Layer 2/5 enrichment. | P1 | Nothing | Small (database table + query) |
| 7 | **Place-harvest allowlist + denylist** — filter map pins (already designed in SGM_Remaining_Live_Holes_Dump §2). | P0 | Nothing | Small |
| 8 | **LocalityToken injection** — code-derived, injected every turn (already designed in SGM_Remaining_Live_Holes_Dump §1). | P0 | Nothing | Small |
| 9 | **Opening kit split + portrait trigger** — garment parsing + portrait on name+1 garment (already designed in SGM_Remaining_Live_Holes_Dump §3). | P0 | Nothing | Medium |
| 10 | **Turn efficiency cuts** — remove Director + choice-regen from happy path; 1 retry max; overlay timeout + cancel (already designed in SGM_Remaining_Live_Holes_Dump §4). | P0 | Nothing | Medium |

### MP-Ready Data Model (Quarantined — Design Only, Do Not Ship in Live Client)

| # | Item | Priority | Depends On | Effort |
|---|------|----------|-----------|--------|
| 11 | **MemoryScope schema** — tag every memory entry with scope (global/instance/hub/party/player). Design only. | P2 | #5 | Small (schema) |
| 12 | **Per-player prompt assembly** — prompt builder that scopes retrieval to player + instance + party memories. Design only. | P2 | #11 | Medium (design) |
| 13 | **Shared world ledger separation** — separate mechanical state (shared) from narrative memory (per-player). Design only. | P2 | #11 | Medium (design) |

### Eval Harness

| # | Item | Priority | Depends On | Effort |
|---|------|----------|-----------|--------|
| 14 | **Golden script runner** — 5 scripts (20–50 turns each) with planted facts. Automated contradiction + invent scoring. Runs on every model swap. | P1 | #1, #3 | Medium |
| 15 | **Long-run soak** — 1 script (100+ turns) with 10–20 planted facts. Auto-judge + human spot-check every 25 turns. Monthly run. | P2 | #14 | Medium |

### Priority Legend

- **P0:** Ship in the next build cycle. These are live bugs (Jax playtest) or critical anti-hallucination gaps.
- **P1:** Ship within 2 build cycles. These harden long-term memory and enable evaluation.
- **P2:** Design only. Do not implement until MP track is greenlit.

---

## K) Sources

| Source | URL / Reference | Access Date | What Was Used |
|--------|----------------|-------------|---------------|
| **MemGPT paper** — Packer et al., "MemGPT: Towards LLMs as Operating Systems" | arXiv:2310.08560 | Aug 2026 | Tiered memory architecture (working/recall/archival), virtual context management, self-managed memory. Influential but risky for games (LLM deciding what to remember). |
| **Letta (MemGPT framework)** | https://www.letta.com / https://github.com/letta-ai/letta | Aug 2026 | Apache 2.0 framework. 23K+ GitHub stars. Production adoption unclear. Tiered memory API. |
| **AI Dungeon Memory System FAQ** | https://help.aidungeon.com/faq/the-memory-system | Aug 2026 | Memory = AI-generated summaries of actions. Retrieved by relevance. Story Cards = keyword-triggered World Info. Plot Essentials = user-edited persistent context. |
| **AI Dungeon memory complaints** (Reddit, r/AIDungeon) | https://www.reddit.com/r/AIDungeon/comments/1pfvfdr/ | Aug 2026 | "Summarization is broken, just appends immediate information, no actual summarization." Memory maxes out quickly. Oct 2024. |
| **"Why AI Dungeon Keeps Forgetting Your Story"** (TavernBound) | https://tavernbound.com/blog/why-ai-dungeon-forgets-your-story | Aug 2026 | Context window limitations, World Info keyword brittleness, lack of structured state. |
| **Friends & Fables review** (DungeonsDeep, 2026) | https://dungeonsdeep.ai/blog/friends-and-fables-review-2026 | Aug 2026 | Combat reliability issues, memory drift on long campaigns, credit economy friction, host-pays model, tier-gated memory. |
| **Friends & Fables review** (DreamGen, 2026) | https://dreamgen.com/blog/articles/friends-and-fables-review | Aug 2026 | Host pays for the whole table, combat burns credits 2–3x, memory issues on lower tiers. |
| **NovelAI Lorebook documentation** | https://docs.novelai.net/en/text/lorebook | Aug 2026 | Keyword-triggered lorebook entries, context placement, key-relative insertion. 8K context at Opus tier. No auto-summarization. |
| **NovelAI review** (ShakespeareAI, 2026) | https://shakespeareai.net/blog/novelai-review-2026 | Aug 2026 | 8K context window limitations. Transparent memory management. Lorebook is manual. Great prose, no game-state awareness. |
| **Hidden Door** (The Verge, GamesBeat) | https://www.theverge.com/games/757816/hidden-door-early-access-ai-story, https://gamesbeat.com/hidden-door-launches-social-role-playing-platform-with-ai | Aug 2026 | Card-based state system, dice behind the scenes, dictionary-based filtering, publisher-licensed worlds. Closest to code-owns-truth among competitors. |
| **GraphRAG** — Microsoft Research | https://www.microsoft.com/en-us/research/blog/graphrag-unlocking-llm-discovery-on-narrative-private-data-by-using-graphs/ | Aug 2026 | Graph-based retrieval for narrative data. Community summaries from graph clusters. Higher indexing cost, better factual recall. |
| **"Reducing Hallucination in Structured Outputs via RAG"** (ResearchGate, 2024) | https://www.researchgate.net/publication/382629296 | Aug 2026 | RAG as anti-hallucination for structured outputs. Grounding LLM in external knowledge sources. |
| **"Combining NER and RAG to Spot Hallucinations"** (SemEval 2025) | https://aclanthology.org/2025.semeval-1.160.pdf | Aug 2026 | NER-based entity detection + RAG retrieval to identify hallucinated entities. Relevant to claim-grounding. |
| **Dynamic Retrieval Augmentation based on Hallucination Detection (DRAD)** (Su et al., 2024) | Cited in SemEval 2025 paper | Aug 2026 | Real-time hallucination detection during generation + self-correction from external knowledge. |
| **Jax playtest session** (internal) | SynapticGM, 15 Aug 2026, UK setting | Aug 2026 | 10 bugs: locality (pistol on UK street), place harvest (Eye Level, Chaos), kit split (full utterance on every card), portrait pending, registrar loop, stock phrases, false system line, hung overlay, perspective slip. |
| **Existing project files** | SGM_Live_Gameplay_Dump.md, SGM_Remaining_Live_Holes_Dump.md, SGM_Visual_And_Tabletop_Dump.md, WOF_GoLive_Systems_Dump.md, WOF_RemainingHoles_Dump.md, docs/research/pack-09-monetization-cosmetics-audio-iap-2026-08.md | Aug 2026 | Situation packet, 4-store memory, Pack 6 summaries, outcome tokens, Warden, turn shape, turn accounting, Mode A/C cost, claim-grounding, LocalityToken. |

### Speculation Markers

1. **Turn summary every 5 turns** — speculative. Could be 3 or 10 depending on quality.
2. **Campaign summary every 50 turns** — speculative. Carried from prior dumps.
3. **Episodic store retrieval k=3–5** — speculative. Depends on budget and quality testing.
4. **Knowledge graph < 500 nodes for 300 turns** — speculative. Depends on NPC/quest density.
5. **Embedding dimension 256–512** — speculative. Depends on provider.
6. **Compression quality gate "re-prompt ONCE"** — speculative. May need a different strategy.
7. **Unresolved consequence timeout (100 turns)** — speculative. May need player confirmation.
8. **Contradiction rate targets (< 3%)** — speculative. No baseline measurement yet.
9. **Cost per 100 turns ($0.20–0.50)** — speculative. Depends on model and token prices.
10. **Latency P50 3–6s** — speculative. Depends on model and infrastructure.
11. **Mode C prompt size ~3,500 tokens** — speculative. Depends on action summary compression.
12. **Tag + semantic hybrid retrieval** — speculative. May find tag-only is sufficient for < 200 entries.
13. **Player correction UX** — speculative. Diegetic approach needs UX testing.
14. **Max 5 pins** — carried from prior dumps, still speculative.
15. **Save size ~100 KB per 500-turn character** — speculative. Could be 50–200 KB.

---

**End of Pack 11. This document provides the architecture for making SynapticGM the least-hallucinating, longest-remembering AI RPG — for single-player campaigns (turn 80–500+) and a credible multiplayer design (quarantined for later). The backlog is ordered: SP memory hardening first, then MP-ready data model (still quarantined), then eval harness. No implementation code. No licensed content. Ready for engineering review.**
