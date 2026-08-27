# Gemini review — labeled DnD storyfollower (likely mispack)

**Ingested:** 2026-08-27  
**Claimed:** Tabletop Fantasy (`dnd`) · storyfollower  
**Likely actual pack:** LitRPG Summoned Pact · cold-system · storyfollower (seed 117) from `gemini-litrpg-modes-agents-300t-LATEST.md`  
**Status:** Waiting — John still playtesting; do **not** ship until he asks for the next update.

## Calibration (agent — critical)

Gemini titled this **DnD / storyfollower**, but the evidence is **Summoned Pact LitRPG**:

| Gemini says | Reality check |
|---|---|
| Tabletop Fantasy / cursed-keep | Hubs cited: **Lowmarket, West Wall, Cinderflow Road, Kitchen Saint Alley, Cathedral Undercroft** = Summoned Pact |
| Meta end Level 1, **221/300 XP** | Matches batch **LitRPG storyfollower s117** (221/300). DnD storyfollower s168 ended **55/300** |
| “Ask about Earth junk prices” top recycle | LitRPG pad bank (DnD telemetry `earthJunkOptionHits=0`) |
| “Walk the battlement” / “Watch the gate queue” | LitRPG alone/hub pads |
| Opening “cracked brass ring” / summoning circle | Summoned Pact opening, not Greyhollow Keep |

Treat this paste as a **second LitRPG storyfollower critic pass** (reinforces gemini-03 / modes×agents LitRPG), **not** as new cursed-keep evidence. For true DnD see `gemini-05-dnd-modes-agents-300t.md`.

**Keep for next-update board (unchanged priorities):** them/stranger/this-place mush, passive GM / no combat, pad recycle (battlement/gate/Earth junk), inspect-XP farm, hard bag lock, Dry Wit/Cold Registrar cadence, meta-input, same-action hard interrupt, quest spine.

---

## Paste (Gemini — verbatim)

### Executive Verdict

**Tabletop Fantasy (`dnd`) | Autoplay Agent: storyfollower**

SynapticGM’s Tabletop Fantasy mode remains fundamentally broken in this run, suffering from identical systemic failures as the `maxlevel` agent run. Catastrophic variable rendering bugs (`them`, `the stranger`, `this place`) destroy the prose and shatter immersion. The engine fails to handle inventory state properly, and the GM is entirely passive, trapping the agent in 100+ turn loops of meaningless movement (e.g., Lowmarket <-> West Wall) and repetitive inspections ("Check the alley for panel-glint"). Despite 300 turns of gameplay, there is zero meaningful progression, no combat, no dice rolls, and no narrative stakes. The requested "Sarcastic Patch / Dry Wit" personality is completely absent. This is a broken hallway simulator, not a Tabletop Fantasy experience.

---

### Scorecard

| Area | Score | One-line verdict |
| --- | --- | --- |
| 1. Opening hook & stakes | 2/10 | Starts with an atmospheric setup but immediately deflates into endless wandering. |
| 2. Pace | 1/10 | Severe looping; the agent repeats the exact same actions for dozens of turns. |
| 3. Flow / transitions | 2/10 | Mechanical transit works, but prose trips over broken `[Location]` variables. |
| 4. Option quality | 1/10 | Generates gibberish ("Check the stranger") and endlessly recycles the same options. |
| 5. Agency & consequence | 1/10 | Player meta-inputs are ignored; world state never changes despite actions. |
| 6. Progression (quests) | 1/10 | No active quests, objectives, or narrative spines exist after Turn 1. |
| 7. Progression systems | 2/10 | Tiny trickle of 5 XP for "studying" items, but no meaningful tabletop mechanics. |
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

---

### Deep Dives

#### A. Progression autopsy

* **Timeline of meaningful beats:**
* Virtually none. The agent explores initial locations (Greyhollow Church, Inn, Keep Gate) but quickly falls into repetitive loops of traveling between these hubs or examining the same objects endlessly.


* **`STATUS / System:` lines found:**
* Turn 10 (`Location: road leading away from a ruined empty circle outside the west wall`), Turn 13 (`Result: Detected faint rhythmic thumping sound beneath wind.`), Turn 15 (`XP Gained: 5`), Turn 16 (`Inventory check complete. No tools found. XP Gained: 5`), Turn 24 (`XP Gained: 5`), Turn 39 (`Action failed: item not in inventory.`), Turn 54 (`<item-gain name="Smooth Stone" rarity="Common" qty="1" />`), Turn 55 (`XP Gained: 5`), Turn 58 (`XP Gained: 5`), Turn 67 (`XP Gained: 5`), Turn 68 (`XP Gained: 5`), Turn 70 (`XP Gained: 5`), Turn 71 (`XP Gained: 5`), Turn 77 (`XP Gained: 5`), Turn 80 (`XP Gained: 5`), Turn 90 (`Examined Item: Tarnished Locket XP Gained: 5`), Turn 93 (`XP Gained: 5`), Turn 104 (`XP Gained: 5`), Turn 105 (`Action failed: item not in inventory.`), Turn 107 (`XP Gained: 5`), Turn 108 (`Attempted to pry open crate. Action failed due to lack of leverage/immovable object.`), Turn 116 (`XP Gained: 5`), Turn 117 (`XP Gained: 5`), Turn 120 (`XP Gained: 5`), Turn 123 (`XP Gained: 5`), Turn 125 (`Item Used: Obsidian Marker x1 (to Bag)`), Turn 133 (`XP Gained: 5`), Turn 141 (`XP Gained: 5`), Turn 146 (`XP Gained: 5`), Turn 152 (`XP Gained: 5`), Turn 157 (`XP Gained: 5`), Turn 163 (`XP Gained: 5`), Turn 173 (`Bag Contents Inspected... XP Gained: 5`), Turn 178 (`Location: Cathedral Undercroft - Lower Level`), Turn 181 (`XP Gained: 5`), Turn 188 (`XP Gained: 5`), Turn 191 (`XP Gained: 5`), Turn 192 (`XP Gained: 5`), Turn 197 (`XP Gained: 5`), Turn 201 (`Scanning for threats completed...`), Turn 212 (`Inventory... XP Gained: 5`), Turn 213 (`XP Gained: 5`), Turn 251 (`XP Gained: 5`), Turn 267 (`XP Gained: 5`), Turn 275 (`XP Gained: 5`), Turn 276 (`XP Gained: 5`), Turn 294 (`NPC Response...`), Turn 295 (`Bag Search Complete.`), Turn 296 (`XP Gained: 5`), Turn 298 (`XP Gained: 5`).


* **Interpret Meta end Level/XP:** Ends at Level 1, 221/300 XP. As with the previous run, this is incredibly stingy and pathological. The GM is awarding 5 XP purely for the "inspect" action, encouraging the agent to sit in a corner and examine its bag dozens of times rather than engaging with the world or facing danger.
* **What players miss:** Players miss actual quests, combat, skill checks (the core of Tabletop Fantasy), and meaningful world interaction. This feels like a broken inventory management simulator.

#### B. Hallucination & invent ledger

| Turn | Type | Evidence quote | Likely owner | Severity | Suggested gate |
| --- | --- | --- | --- | --- | --- |
| 4 | Place | "broken remnants of the summoning circle" (Wait, wasn't this a "cracked brass ring"? The text is confused about the opening location). | `proseWarden` | P1 | Ensure location descriptions match initial state |
| 10 | Place | "You leave a ruined empty circle outside the west wall behind and reach Lowmarket." | `proseWarden` | P1 | Smooth transitions between disparate locations |
| 14 | Item | "Examine the stranger overturned cart for anything useful." | `choicePad` | P0 | Fix item array rendering/variable replacement |
| 17 | Place | "distant silhouette of the stranger." | `proseWarden` | P0 | Fix `[Building]` or `[NPC]` variable |
| 20 | Person | "you approach a stranger, open the stranger." | `proseWarden` | P0 | Catastrophic variable failure |
| 38 | Action | "I'm lost, and looking for shelter." (Agent hallucinates intent based on previous loop) | `agentPolicy` | P1 | Adjust agent policy to prioritize novel actions |
| 53 | Kit | "a small, smooth stone that fits comfortably in your palm, and a tarnished, old-fashioned coin." | `proseWarden` | P1 | Enforce strict inventory JSON; prevent inventing items in bag |
| 89 | Kit | "pull the stranger of paper, a stranger of people you vaguely recognize, and a small, intricately the stranger" | `proseWarden` | P0 | Massive variable failure in inventory |
| 104 | Place | "turn your steps toward what you assume is the stranger." | `proseWarden` | P0 | Fix `[Building]` variable |
| 111 | Place | "imposing, grey stone walls of what can only be the stranger." | `proseWarden` | P0 | Fix `[Building]` variable |
| 172 | Kit | "Check your bag for anything useful." (Agent repeats this endlessly) | `agentPolicy` | P1 | Add repetition penalty to agent choices |
| 230 | Option | "Ask about Earth junk prices" (Appears constantly, completely out of context for Tabletop Fantasy). | `choicePad` | P0 | Validate option context against game mode/bible |
| 284 | Person | "A hunched figure... 'You mean trinkets from the stranger?'" | `proseWarden` | P0 | Fix NPC variable |

#### C. Loop / recycle report

* **Top recycled option labels:**
* "Walk the battlement" (Appears ~40 times).
* "Watch the gate queue" (Appears ~35 times).
* "Ask about Earth junk prices" (Appears ~30 times).
* "Map the first undercroft door" (Appears ~25 times).
* "Check the alley for panel-glint" (Appears ~20 times).


* **Top paragraph clones:**
* "The biting wind whips around the crumbling stones, carrying with it the scent of damp earth and decay..." (Repeats almost verbatim for Turns 1-4).
* "The rough-hewn stones of the battlement shift slightly under your boots as you continue along the weathered path..." (Repeats almost verbatim for Turns 240-242).


* **Same-action loops:**
* Turns 1-4: Endless scanning/listening at the ruined circle.
* Turns 25-36: "Walk the battlement" loop.
* Turns 167-169: "Continue walking down Cinderflow Road" loop.
* Turns 191-193: "Check the alley for panel-glint" loop.


* **Travel ping-pong hubs:** Lowmarket <-> West Wall <-> Cinderflow Road <-> Kitchen Saint Alley.

#### D. Best 10 & worst 10 turns

* **Best 10:** T0, T5, T6, T24, T40, T54, T107, T118, T123, T151. (These turns feature actual interaction with the environment, puzzle solving, or attempts at narrative progression).
* **Worst 10:** T14, T20, T89, T104, T111, T172, T191, T230, T284, T289. (The absolute peaks of variable failures, missing tools, and nonsensical "Earth junk" options in a fantasy setting).

#### E. Priority fix board

1. **P0: Catastrophic variable rendering (`them`, `this place`, `stranger`).** → `proseWarden` / `prompt` → The text renders actual nouns instead of broken variables.
2. **P0: Infinite action/paragraph loops.** → `proseWarden` / `prompt` → The engine rejects any GM output that is >80% identical to the previous turn and forces a reroll.
3. **P0: Option deduplication and context filtering.** → `choicePad` → Options like "Walk the battlement" or "Ask about Earth junk prices" must be contextually appropriate and cannot appear repeatedly.
4. **P1: Strict Inventory State.** → `situationSnapshot` / `prompt` → The LLM cannot narrate the contents of the bag or duplicate items; inventory must be handled via strict JSON parsing.
5. **P1: Threat Decay / Anti-loitering Warden.** → `proseWarden` / `agentPolicy` → If the player chooses the same passive action 3 times in a row, spawn a hostile interrupt event.
6. **P1: Context-aware option generation.** → `choicePad` → Options involving NPCs ("Watch the gate queue") are only generated if the `visible_entities` array confirms they are present.
7. **P2: Meta/Adversarial Input Handling.** → `prompt` / `agentPolicy` → If the player types "I address whoever is actually in this scene", the GM acknowledges the meta-input directly.
8. **P2: 'Sarcastic Patch / Dry Wit' voice enforcement.** → `prompt` / `proseWarden` → The GM appends a dry, sarcastic system observation to the end of every location transition or failed action.

#### F. Keep / cut / rewrite for **Sarcastic Patch / Dry Wit**

*(Note: As the requested voice was completely absent, these rewrites demonstrate how to apply it).*

* **Keep 1:** "The gate is barred. They still let you in because the rain left you no choice." (T0 - Good setup).
* **Keep 2:** "A faint, almost imperceptible warmth begins to emanate from within your pocket, a subtle pulse that quickens your own heartbeat." (T55).
* **Keep 3:** "The brittle parchment crackles as you carefully unroll it, revealing faded ink that spells out a short, cryptic message." (T273).
* **Cut 1:** "The rough, uneven stones of the battlement shift slightly under your worn shoes..." (Cut entirely; it's a multi-turn loop).
* **Cut 2:** "Examine the stranger overturned cart for anything useful." (Cut; broken English/variable).
* **Cut 3:** "Check your them that might be useful." (Cut; broken variable).
* **Rewrite 1:** "You leave Palace Approach behind and reach Cinderflow Road." -> `[Log Entry]: Transit complete. Welcome to Cinderflow Road. Try not to choke on the soot.`
* **Rewrite 2:** "The moment hangs — try again. [GM empty/fail (unknown)]" -> `[System Error]: Well, that was awkward. Reality seems to be taking a coffee break. Try doing something that actually works.`
* **Rewrite 3:** "I address whoever is actually in this scene who is actually here, not "gate queue". My words stay: Watch the gate queue" -> `[System Alert]: Subject is yelling at ghosts again. Let's try picking an option that exists in this dimension.`

#### G. Confidence & blind spots

* **Blind spots:** I cannot see the actual UI panels, inventory screens, or how the `STATUS / System:` lines were formatted for the user. I can only evaluate what is in the text dump.
* **Newer baseline:** A newer baseline might have improved the `them` variable bug, which is the single biggest issue in these runs.
* **Blame split:** 85% Engine/Prompt, 15% Agent. The agents fall into safe loops, but the GM engine utterly fails to interrupt those loops, provide a coherent world state, or apply the requested personality.
* **Game Mode Confirmation:** I scored this strictly against Tabletop Fantasy (`dnd`) expectations, focusing on narrative progression, environmental interaction, and stakes, rather than LitRPG XP farming.

`REVIEW_COMPLETE`
