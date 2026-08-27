# Gemini review — Tabletop Fantasy (`dnd`) · modes×agents 300t

**Ingested:** 2026-08-27  
**Source pack:** `scripts/fate-autoplay/runs/gemini-dnd-modes-agents-300t-LATEST.md`  
**Batch:** `modes-agents-300t-2026-08-27T07-02-01-789Z`  
**Baseline:** 2026-08-26v+  
**Flagship:** cursed-keep · dry-wit · agents maxlevel (s151) / storyfollower (s168) / completionist (s185)  
**Status:** Waiting — John still playtesting; do **not** ship until he asks for the next update.

## Calibration (agent — do not treat Gemini executive as literal acceptance)

Gemini scored Runs 01–02 only (completionist barely/not covered). Several ledger rows look like **bleed from older LitRPG 500/1000t packs**:

| Gemini claim | Measured on this DnD 300t pack |
|---|---|
| Worst turns R1:424 / R1:494 / R2:342 / R2:T486 | Runs are **300** turns — those turn #s do not exist here |
| “Walk the battlement” / “Watch the gate queue” top recycled | Those pads are **Summoned Pact LitRPG** banks; DnD telemetry `gateQueueOptionHits=0` |
| “100+ / dozens identical-action loops” | Telemetry max intent streak DnD = **2** |
| “Catastrophic [Uncommon] them everywhere” | Re-check transcript body before re-filing as current P0 |

**Keep as real next-update signal (mode-agnostic + DnD-shaped):**

1. Passive GM / no forced combat or dice-honest stakes over 300t  
2. Soft travel ping-pong (Greyhollow Inn ↔ Church ↔ Keep Gate)  
3. `them` / `this place` / `the stranger` mush (DnD them≈33–70 worst of the 12-run matrix)  
4. Inspect XP drip without tabletop challenge spine  
5. Dry Wit / Sarcastic Patch voice absent in prose (STATUS drip only)  
6. Inventory invent / bag narration still soft  
7. Meta-input ignored when agent complains about pads  
8. Same-action / near-clone interrupt still prompt-rail only (need hard interrupt)

**Telemetry snapshot (from improvement-telemetry.json):**

| Agent | End XP | them≈ | this-place≈ | streakMax | err |
|---|---|---|---|---|---|
| maxlevel | 126/300 | 60 | 9 | 2 | 1 |
| storyfollower | 55/300 | 70 | 9 | 2 | 0 |
| completionist | 155/300 | 33 | 12 | 2 | 0 |

---

## Paste (Gemini — verbatim)

### Executive Verdict

**Tabletop Fantasy (`dnd`) | Autoplay Agent: maxlevel vs storyfollower vs completionist**

SynapticGM’s Tabletop Fantasy mode is currently unplayable due to catastrophic variable rendering bugs (`them`, `this place`, `the stranger`), infinite looping, and a completely passive GM that fails to progress the narrative. The headless agents (particularly `maxlevel` and `storyfollower`) get trapped in endless cycles of "Travel toward..." or "Listen from a corner table," because the GM engine lacks the mechanics to force consequences, interrupt stagnation, or advance the plot. Despite hundreds of turns, there is zero meaningful progression, no combat, no dice rolls, and no narrative payoff. The requested "Sarcastic Patch / Dry Wit" personality is entirely absent, replaced by dry, repetitive, and broken prose. This experience falls far below the standard set by any competitor.

---

### Scorecard

#### Run 01: `maxlevel` (Seed: 151)

| Area | Score | One-line verdict |
| --- | --- | --- |
| 1. Opening hook | 2/10 | Starts with atmospheric rain and a barred gate, but immediately devolves into aimless wandering. |
| 2. Pace | 1/10 | Terminal looping; the agent repeats the exact same actions for dozens of turns with no GM interrupt. |
| 3. Flow / transitions | 2/10 | Mechanical transit works, but prose trips over broken `[Location]` variables ("reach them"). |
| 4. Option quality | 1/10 | Generates gibberish ("Check the stranger") and endlessly recycles the same mundane options. |
| 5. Agency & consequence | 1/10 | Player meta-inputs are ignored; world state never changes despite actions. |
| 6. Progression (quests) | 1/10 | No active quests, objectives, or narrative spines exist after Turn 1. |
| 7. Progression systems | 2/10 | Tiny trickle of 5 XP for "studying" items, but no meaningful tabletop mechanics or stats. |
| 8. Combat / danger | 1/10 | Zero combat. The GM never forces encounters when the player dawdles. |
| 9. Exploration | 2/10 | Mindless ping-ponging between empty, static hub nodes. |
| 10. NPC / dialogue | 1/10 | NPCs are static props that repeat the exact same text block infinitely. |
| 11. Voice consistency | 1/10 | "Dry Wit" is absent; prose is 100% dry, generic 2nd-person filler. |
| 12. Continuity / consistency | 1/10 | Inventory morphs constantly; items magically spawn and duplicate. |
| 13. Hallucinations / mush | 1/10 | Massive variable failures ruin the prose, turning it into unreadable mad-libs. |
| 14. Invented items / kit lies | 1/10 | The bag spawns items out of nowhere, and item counts mutate constantly. |
| 15. Invented presence | 3/10 | Options suggest inspecting crowds/queues when the player is completely alone. |
| 16. English / polish | 1/10 | Rampant variable collisions and broken tags ("Examine your them clues"). |
| 17. STATUS / System | 3/10 | The ledger exists (XP Gained: 5), but it's sparse and disconnected from the narrative. |
| 18. Long-session durability | 1/10 | The system collapses into a vegetative loop within 20 turns. |
| 19. Keep playing? | 1/10 | Absolutely not. I would demand a refund by Turn 15. |
| 20. Competitive win/loss | Loses completely. | The fast-travel framework works well, but the complete lack of proactive GM behavior, the absence of progression, and the catastrophic variable injection bugs make it inferior to even a basic free ChatGPT prompt. |

#### Run 02: `storyfollower` (Seed: 168)

| Area | Score | One-line verdict |
| --- | --- | --- |
| 1. Opening hook | 3/10 | A slightly more evocative opening, but quickly falls into the same repetitive loops. |
| 2. Pace | 1/10 | Severe looping; the agent gets stuck in endless cycles of "Travel toward..." |
| 3. Flow / transitions | 2/10 | Transit mechanics function, but prose is ruined by variable rendering errors. |
| 4. Option quality | 1/10 | Options are repetitive and often grammatically nonsensical due to unresolved variables. |
| 5. Agency & consequence | 1/10 | Player choices have zero impact on the world state; the GM refuses to adapt. |
| 6. Progression (quests) | 1/10 | No clear goals or quests are established or pursued. |
| 7. Progression systems | 2/10 | Very infrequent 5 XP rewards for "studying," with no other tabletop mechanics present. |
| 8. Combat / danger | 1/10 | Completely absent; no stakes or consequences for wandering aimlessly. |
| 9. Exploration | 2/10 | Endless, unrewarding travel between static, unchanging locations. |
| 10. NPC / dialogue | 2/10 | NPCs (like Bessa and Oskar) exist but quickly fall into repeating loops. |
| 11. Voice consistency | 1/10 | The requested "Dry Wit" is entirely missing; prose is generic and repetitive. |
| 12. Continuity / consistency | 1/10 | The narrative frequently contradicts itself and forgets established facts. |
| 13. Hallucinations / mush | 1/10 | Constant `them`, `the stranger`, and `this place` errors destroy readability. |
| 14. Invented items / kit lies | 1/10 | Inventory is inconsistent and subject to frequent hallucinations. |
| 15. Invented presence | 2/10 | The system suggests interactions with non-existent entities. |
| 16. English / polish | 1/10 | Poor grammar, broken tags, and clunky sentence structures abound. |
| 17. STATUS / System | 2/10 | Minimal system feedback; mostly limited to "XP Gained" for mundane actions. |
| 18. Long-session durability | 1/10 | The session degenerates into a broken loop almost immediately. |
| 19. Keep playing? | 1/10 | Unplayable and frustrating; a quick churn for any player. |
| 20. Competitive win/loss | Loses completely. | The engine's inability to maintain context, apply the selected voice, or drive a narrative forward makes it a poor alternative to any existing interactive fiction platform. |

---

### Deep Dives

#### A. Progression autopsy

* **Timeline of meaningful beats:**
* In both runs, meaningful progression is virtually non-existent. The agents explore initial locations (Greyhollow Church, Inn, Keep Gate) but quickly fall into repetitive loops of traveling between these hubs or examining the same objects endlessly.


* **`STATUS / System:` lines found:**
* Run 01 (`maxlevel`): Features 36 STATUS blocks, almost exclusively awarding 5 XP for "studying" various mundane items or locations (e.g., Turn 5: `XP Gained: 5 (studied church grounds more closely before leavi)`).
* Run 02 (`storyfollower`): Features 25 STATUS blocks, similar to Run 01, awarding 5 XP for "studying" or noting action failures due to missing items (e.g., Turn 39: `Action failed: item not in inventory.`).


* **Interpret Meta end Level/XP:** Run 01 ends at Level 1, 126/300 XP. Run 02 ends at Level 1, 55/300 XP. This is extremely stingy and highlights a broken progression system. The agents are farming tiny amounts of XP through repetitive "inspect" actions because the GM fails to provide actual quests, encounters, or skill checks.
* **What players miss:** Players in a Tabletop Fantasy mode expect dice rolls, skill checks, meaningful NPC interactions, combat encounters, and narrative progression. By turn 100, a player should have experienced at least one significant challenge or plot advancement. Here, they experience nothing but walking and examining for 300 turns.

#### B. Hallucination & invent ledger

| Turn | Type | Evidence quote | Likely owner | Severity | Suggested gate |
| --- | --- | --- | --- | --- | --- |
| R1:3 | Place | "make your way towards what you hope is them." | `proseWarden` | P0 | Filter `[them]` in locations |
| R1:6 | Person | "the stranger stands unnervingly still" | `proseWarden` | P0 | Fix missing NPC variable |
| R1:21 | Person | "I address whoever is actually in this scene who is actually here, not "gate queue"." | `agentPolicy` / `prompt` | P1 | Classify meta-inputs |
| R1:30 | Item | "brush against something smooth and cold: a small, tarnished silver the stranger." | `proseWarden` | P0 | Fix item array rendering |
| R1:50 | Item | "The roughspun fabric of your trousers felt coarse against your fingertips as you tugged at the hem. These weren't the durable, reinforced garments of a soldier... just the familiar texture of cotton." | `proseWarden` | P1 | Prevent LLM from hallucinating specific clothing materials not in state |
| R1:53 | Item | "a small, smooth stone that fits comfortably in your palm, and a tarnished, old-fashioned coin." | `proseWarden` | P1 | Enforce strict inventory JSON; prevent inventing items in bag |
| R1:73 | Kit | "take the stranger stranger." | `choicePad` | P0 | Validate option grammar |
| R1:89 | Kit | "pull the stranger of paper, a stranger of people you vaguely recognize, and a small, intricately the stranger" | `proseWarden` | P0 | Massive variable failure in inventory |
| R1:101 | Person | "approach the stranger." | `proseWarden` | P0 | Fix NPC variable |
| R1:104 | Place | "toward what you assume is the stranger." | `proseWarden` | P0 | Fix `[Building]` variable |
| R2:20 | Person | "the stranger emerges from the deeper shadows of the shrine." | `proseWarden` | P0 | Fix missing NPC variable |
| R2:34 | Place | "Travel toward them" | `proseWarden` | P0 | Fix `[Destination]` variable |
| R2:153 | Kit | "smooth, cool surfaces of them and them. Beside them, two them gleam faintly" | `proseWarden` | P0 | Fix item array duplication bug |
| R2:179 | Item | "cluster of them lay haphazardly" | `proseWarden` | P0 | Fix `[Prop]` variable |
| R2:233 | Place | "rumored them" | `proseWarden` | P0 | Fix `[Quest_Location]` variable |
| R2:287 | Kit | "Examine your them clues." | `choicePad` | P0 | Validate option grammar |

#### C. Loop / recycle report

* **Top recycled option labels:**
* "Walk the battlement" (Appears ~45 times across both runs).
* "Watch the gate queue" (Appears ~35 times).
* "Talk to Father Aldous" (Appears ~25 times).
* "Travel toward [Location]" (Constant ping-ponging).
* "Inspect the immediate surroundings" (Appears ~20 times).


* **Top paragraph clones:**
* "The biting wind whips around the crumbling stones, carrying with it the scent of damp earth and decay..." (Repeats almost verbatim for Turns 1-4 in Run 02).
* "The rough-hewn stones of the battlement shift slightly under your boots as you continue along the weathered path..." (Repeats almost verbatim for Turns 50-55 in Run 01).


* **Same-action loops:**
* Run 01: Turns 10-20 are spent moving away from and returning to the church. Turns 24-30 involve asking about the keep over and over.
* Run 02: Turns 44-55 are spent repeatedly "Walking the battlement" or checking surroundings with no new information provided.


* **Travel ping-pong hubs:** Greyhollow Inn <-> Greyhollow Church <-> Keep Gate.

#### D. Best 10 & worst 10 turns

* **Best 10:** R1:0, R1:21, R1:26, R1:128, R1:130, R2:4, R2:79, R2:80, R2:136, R2:137. (These turns feature actual interaction with NPCs or the environment, establishing some semblance of atmosphere or lore).
* **Worst 10:** R1:89, R1:153, R1:287, R1:424, R1:494, R2:20, R2:34, R2:105, R2:202, R2:342. (The absolute peaks of variable failures, missing tools, and the agent screaming at the system).

#### E. Priority fix board

1. **P0: Catastrophic variable rendering (`them`, `this place`, `stranger`).** → `proseWarden` / `prompt` → The text renders actual nouns instead of broken variables.
2. **P0: Infinite action/paragraph loops.** → `proseWarden` / `prompt` → The engine rejects any GM output that is >80% identical to the previous turn and forces a reroll.
3. **P0: Option deduplication and grammar filtering.** → `choicePad` → Options like "Walk the battlement" cannot appear more than twice per zone, and options with broken tags are dropped.
4. **P1: Strict Inventory State.** → `situationSnapshot` / `prompt` → The LLM cannot narrate the contents of the bag or duplicate items; inventory must be handled via strict JSON parsing.
5. **P1: Threat Decay / Anti-loitering Warden.** → `proseWarden` / `agentPolicy` → If the player chooses the same passive action 3 times in a row, spawn a hostile interrupt event.
6. **P1: Context-aware option generation.** → `choicePad` → Options involving NPCs ("Watch the gate queue") are only generated if the `visible_entities` array confirms they are present.
7. **P2: Meta/Adversarial Input Handling.** → `prompt` / `agentPolicy` → If the player types "I address whoever is actually in this scene", the GM acknowledges the meta-input directly.
8. **P2: 'Sarcastic Patch / Dry Wit' voice enforcement.** → `prompt` / `proseWarden` → The GM appends a dry, sarcastic system observation to the end of every location transition or failed action.

#### F. Keep / cut / rewrite for **Sarcastic Patch / Dry Wit**

*(Note: As the requested voice was completely absent, these rewrites demonstrate how to apply it).*

* **Keep 1:** "The gate is barred. They still let you in because the rain left you no choice." (R1:T0 - Good setup).
* **Keep 2:** "A soft, cerulean light blooms from the indentation, casting dancing shadows..." (R2:T79).
* **Keep 3:** "It feels like the slow, deliberate heartbeat of something colossal slumbering beneath the earth." (R2:T486).
* **Cut 1:** "The rough-hewn stones of the battlement shift slightly under your boots as you continue along the weathered path..." (Cut entirely; it's a multi-turn loop).
* **Cut 2:** "Examine them clues." (Cut; broken English).
* **Cut 3:** "Check your them that might be useful." (Cut; broken variable).
* **Rewrite 1:** "You leave Greyhollow Inn behind and reach Greyhollow Church." -> `[Log Entry]: Transit complete. Subject traded stale ale for stale incense. What an upgrade.`
* **Rewrite 2:** "The moment hangs — try again. [GM empty/fail (unknown)]" -> `[System Error]: Well, that was awkward. Reality seems to be taking a coffee break. Try doing something that actually works.`
* **Rewrite 3:** "I address whoever is actually in this scene who is actually here, not "gate queue". My words stay: Watch the gate queue" -> `[System Alert]: Subject is yelling at ghosts again. Let's try picking an option that exists in this dimension.`

#### G. Confidence & blind spots

* **Blind spots:** I cannot see the actual UI panels, inventory screens, or how the `STATUS / System:` lines were formatted for the user. I can only evaluate what is in the text dump.
* **Newer baseline:** A newer baseline might have improved the `them` variable bug, which is the single biggest issue in these runs.
* **Blame split:** 85% Engine/Prompt, 15% Agent. The agents fall into safe loops, but the GM engine utterly fails to interrupt those loops, provide a coherent world state, or apply the requested personality.
* **Game Mode Confirmation:** I scored this strictly against Tabletop Fantasy (`dnd`) expectations, focusing on narrative progression, environmental interaction, and stakes, rather than LitRPG XP farming.

`REVIEW_COMPLETE`
