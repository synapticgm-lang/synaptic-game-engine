# Gemini Pro - architecture response (2026-09-01)

**Source:** John paste (Gemini Pro) | **Context:** Full RRR meta-prompt (Batches S-X) | **Ingest:** verbatim

---

As Principal Engineer and Narrative Systems Architect, I’ll be blunt: **Your Path A (Batches S through X) is a sunk-cost fallacy.**

You are trying to fix a foundation made of sand by meticulously sweeping the floors. You are treating `google/gemini-2.5-flash-lite`—a lightweight, fast token-predictor—as if it has the zero-shot reasoning capabilities of GPT-4 or Claude 3.5 Sonnet. It does not.

When you feed Flash Lite generic pad labels ("1. Press for leverage"), system recovery strings ("beat needs an exit"), and heuristically harvested pseudo-entities ("the Lowmarket Fence"), it does exactly what a small LLM does: it mashes those tokens together into a hallucinated fever dream. Regex deny-lists will never solve this.

Here is the architectural pivot required to hit your 7–8.5/10 ceiling.

═══════════════════════════════════════

### 1. RANKED SOLUTION PATHS (The Architectural Fixes)

═══════════════════════════════════════

#### Path 1: Authority Inversion (The Engine Drives, The LLM Paints)

* **Mechanism:** The `ArcDirector` and `EncounterTerminalFsm` calculate the exact `CommittedBeat` (Location, NPCs present, Player HP, Enemy HP, valid exits) *before* the LLM is ever called. The LLM prompt becomes a pure rendering instruction: *"Render this state delta in 2nd-person prose. Do not invent entities. Output JSON `{ "narration": "..." }`."*
* **Replaces:** `beatCommitGate` post-hoc validation, `proseWarden`, and all CRAFT prompt instructions (which Flash Lite ignores anyway).
* **Risk:** High (Core loop refactor).
* **Expected Uplift:** Story +5, Vibe +4, Pace +4.
* **Feasibility:** 2 weeks. This is the gold standard.

#### Path 2: Entity Registry Lockdown (Kill Heuristic Harvest)

* **Mechanism:** Completely rip out the Title-Case heuristic in `narrativeHarvest`. If an entity is not explicitly defined in your `NPC_Registry` or `Location_Registry`, it **cannot** enter the `present[]` array.
* **Replaces:** The endless whack-a-mole deny lists (Rasped, Lowmarket Fence, Plunge, Ahead, crowd here).
* **Risk:** Low.
* **Expected Uplift:** Story +4 (instantly stops template collapse).
* **Feasibility:** 2 Days.

#### Path 3: Strict State-Action Masking (Context-Aware Pads)

* **Mechanism:** `ChoiceCompiler` must be fully subjugated to `EncounterTerminalFsm` and `LocationState`. If `state.caught == true`, the *only* pads generated are `[Struggle, Attack, Plead]`. "Travel to West Wall" or "Inspect Stall" are stripped at the engine level before the player (or Fate autoplay) ever sees them.
* **Replaces:** LLM trying to enforce combat logic (and failing), combat purgatory, and absurd narrative whiplash.
* **Risk:** Medium (requires mapping choices to FSM states).
* **Expected Uplift:** Pace +5, Vibe +4.
* **Feasibility:** 4 Days.

#### Path 4: JSON-Schema Enforcement

* **Mechanism:** Force Flash Lite to output structured JSON: `{ "narration": string, "entities_mentioned": string[] }`. Run a strict zod/JSON schema validator on the edge. If it hallucinates UI elements into `narration`, reject and fallback to a diegetic template (not a system error string).
* **Replaces:** The current messy text-parsing and regex scrubbing.
* **Risk:** Low.
* **Expected Uplift:** Story +2, Vibe +2.
* **Feasibility:** 3 Days.

═══════════════════════════════════════

### 2. CRITIQUE OF CURRENT RRR (Why scores are stuck at 1–3)

═══════════════════════════════════════

You are locked in a **downstream heuristic loop**.

1. Flash Lite outputs garbage because it's fed a messy context.
2. Your `narrativeHarvest` script sees a capitalized word in the garbage (e.g., "Lowmarket Fence") and flags it as a `present[]` entity.
3. Next turn, the engine injects "Lowmarket Fence" into the prompt as a valid NPC.
4. Flash Lite writes: *"The Lowmarket Fence lunged at you with a spear."*
5. You write a regex rule to ban "Lowmarket Fence."
6. Next turn, the engine harvests "Rasped" or "Scattered Scale."

**The LLM is currently the planner, the referee, and the narrator.** Flash Lite does not have the parameter count to juggle quest logic, combat HP tracking, and spatial continuity while writing prose. By relying on `beatCommitGate` to reject bad LLM turns, you are using compute to test random permutations until one passes, rather than forcing the engine to generate a valid state first.

═══════════════════════════════════════

### 3. ANTI-PATTERNS TO STOP IMMEDIATELY

═══════════════════════════════════════

* **STOP passing literal Option UI labels into the context window.** If the button is "1. Plunge into the thick of the Lowmarket crowd", do not pass that string. Pass `INTENT_CROWD_ENTER`. Flash Lite will literally regurgitate "1. Plunge into..." if you give it the string.
* **STOP the Title-Case `narrativeHarvest` heuristic.** It is the root cause of 90% of your P0 template collapses. If it's not in a predefined JSON registry, it doesn't exist.
* **STOP injecting meta/recovery strings into the prompt context.** When the commit gate fails, injecting "Nothing shifts until you leave" poisons the LLM's prose buffer. Use pre-written, diegetic template sentences for fallbacks (e.g., *"The dust settles, but your path forward remains blocked."*).
* **STOP writing CRAFT instructions.** Flash Lite ignores them. It does not understand "Do not invent entities." You must enforce this with schema validation and strict context limiting.

═══════════════════════════════════════

### 4. THE ONE HIGHEST-LEVERAGE CHANGE

═══════════════════════════════════════

If you only have bandwidth for one fix, implement **Hypothesis E (Combat FSM owns pads) combined with Hypothesis B (Harvest freeze).**

Lock the choice pads so the Fate picker *cannot* choose "Travel" while pinned by a Skirmisher, and lock the `present[]` array to a hardcoded registry so the LLM cannot hallucinate "Rasped" into a person. This immediately stops spatial teleportation, combat consequence erasure, and noun-verb template collapse. It turns a 1/10 into a 5/10 overnight.

═══════════════════════════════════════

### 5. 2-WEEK EXECUTION PLAN

═══════════════════════════════════════

**Milestone 1: Stop the Hallucination Loop (Days 1-4)**

* *Action:* Delete Title-Case heuristic in `narrativeHarvest`. Hardcode an immutable `NPC/Location Registry`.
* *Action:* Strip exact UI strings from LLM context. Pass enums/intents only.
* *Gate:* Fate T20 automated run passes `readabilityGate` with ZERO entity template collapses (No "Lowmarket Fence lunged").

**Milestone 2: State-Lock Combat & Travel (Days 5-8)**

* *Action:* Subjugate `ChoiceCompiler` to `EncounterTerminalFsm`. If `caught`, `travel` and `inspect` pads are strictly `disabled=true`.
* *Action:* Attack/Flee resolutions update Ledger HP/State *before* GM is called.
* *Gate:* T30 Fate run. If Flee fails -> caught -> next turn only offers Combat pads.

**Milestone 3: The Renderer Pivot (Days 9-14)**

* *Action:* Implement Hypothesis A & C. `ArcDirector` builds `CommittedBeat` JSON. Flash Lite prompted solely to render the delta in JSON format.
* *Action:* Replace meta-recovery strings with diegetic fallback templates.
* *Gate:* T50 Fate run hits >6/10 on Vibe and Pace. Free-hook reads as YES.

═══════════════════════════════════════

### 6. MANUS CONTRAST: WHERE WE WENT WRONG

═══════════════════════════════════════

In the Manus "ledger-first experience management" research, the core philosophy is **State dictates Text**.

SynapticGM implemented the *vocabulary* of Manus (`BeatContract`, `IntentContract`) but kept the *architecture* of an AI Dungeon clone. We used the ledger to *suggest* rules to the LLM (via CRAFT instructions), hoping the LLM would enforce the game state.

**The fix:** The LLM is a blind painter. The Engine must draw the lines. The Engine tells the LLM: *"You are in a 5x5 room. An Orc is here. The Orc took 5 damage. The player is bleeding."* The LLM's ONLY job is to color that in with adjectives. If the LLM tries to add a goblin, the JSON schema validator rejects it.

Throw away Batch Y and Z. Stop scrubbing. Rebuild the frame.
