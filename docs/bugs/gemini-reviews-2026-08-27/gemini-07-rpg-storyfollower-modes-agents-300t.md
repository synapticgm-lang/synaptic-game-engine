# Gemini review — Story RPG (`rpg`) · cape-district-vigil · storyfollower 300t

**Ingested:** 2026-08-27  
**Source pack:** `scripts/fate-autoplay/runs/gemini-rpg-modes-agents-300t-LATEST.md`  
**Batch:** `modes-agents-300t-2026-08-27T07-02-01-789Z`  
**Run:** `2026-08-27T09-05-33-088Z_cape-district-vigil_chilled-gm_s219` (storyfollower · seed 219)  
**Baseline:** 2026-08-26v+  
**Personality stamped:** chilled-gm (Gemini asked for Friendly Guide / Friendly System — wrong mode chrome)  
**Status:** Waiting — John still playtesting; do **not** ship until he asks for the next update.  
**Verbatim paste also at:** `gemini-07-rpg-storyfollower-modes-agents-300t-PASTE.md`

## Calibration (agent — do not treat Gemini executive as literal acceptance)

| Gemini claim | Measured on cape s219 transcript / telemetry |
|---|---|
| Teleport to **Cathedral Undercroft** / **Lowmarket** (LitRPG map bleed) | **0** hits for `Lowmarket`, `Cathedral Undercroft`, `Harbor Quay` in transcript body |
| **Mask Scarf** is kit invent / cross-contamination | **161** Mask Scarf hits; GM-LOG T99: `Inventory Check: Mask Scarf is equipped` — **legit Cape kit**, not Summoned Pact invent |
| “100+ turn identical loops” | Telemetry `maxPlayerIntentStreak` = **3** (not 100+) |
| Friendly Guide / Friendly System absent | Save is **chilled-gm**; Story RPG Simple default is Friendly Guide — voice still weak, but Gemini scored wrong chrome id |
| Catastrophic `[Location]` Mustache | No player-facing Mustache; mush is **`the stranger`** noun scrub/LLM (283 stranger hits) + choice pads |
| Zero XP / no STATUS | Meta **145/300** XP · Level 1 · **37** STATUS blocks · inspect drip real |

**Keep as real next-update signal (RPG-shaped + shared):**

1. `the stranger` / `this place` / option mush (`Check the stranger`) — stranger≈283 body hits; themWordHits=31  
2. Passive GM / soft vigil — no combat / forced stakes over 300t  
3. Pad recycle — `Walk away / go another direction` ≈255; inspect/surroundings spam  
4. Soft paragraph clones on cape path (drizzle / Mask Scarf listen loops)  
5. Inspect XP farm (5 XP study drip; no Story RPG leverage spine)  
6. Voice cadence weak (chilled / Friendly Guide not audible)  
7. Meta-input ignored when agent complains about pads  
8. Same-action interrupt still prompt-rail only (streak max 3)

**Do NOT file from this paste:** cross-genre map isolation bug for Lowmarket/Cathedral Undercroft (Gemini bleed / misread). Mask Scarf as invented item.

**Telemetry snapshot (improvement-telemetry.json · RPG row s219):**

| Field | Value |
|---|---|
| XP / Level | 145/300 · L1 |
| themWordHits | 31 |
| thisPlaceHits | 5 |
| uncommonThemHits | 1 (telemetry counter; body `[Uncommon] them` ≈0) |
| maxPlayerIntentStreak | 3 |
| gateQueue / earthJunk option hits | 0 / 0 |
| statusBlocks | 37 |
| transportRetryCount | 31 |

---

## Paste (Gemini — verbatim)

### Executive Verdict

**Story RPG (`rpg`) | Autoplay Agent: storyfollower**

SynapticGM’s Story RPG mode is fundamentally broken and fails entirely as an interactive narrative engine. The run is plagued by catastrophic variable rendering bugs (`the stranger`, `this place`), reducing the prose to unreadable, hallucinated nonsense. The GM is entirely passive, trapping the agent in agonizing, 100+ turn loops of meaningless movement (e.g., cape path <-> city) and repetitive inspections ("Walk away / go another direction"). Despite 300 turns of gameplay, there is zero meaningful progression, no NPCs, no narrative stakes, and no sandbox interaction. The requested "Friendly System / Friendly Guide" personality is completely absent, replaced by dry, repetitive, and broken prose. This is a non-functional hallway simulator that would cause immediate player churn.

---

### Scorecard

| Area | Score | One-line verdict |
| --- | --- | --- |
| 1. Opening hook & stakes | 2/10 | Starts with an atmospheric setup but immediately deflates into endless wandering. |
| 2. Pace | 1/10 | Severe looping; the agent repeats the exact same actions for dozens of turns. |
| 3. Flow / transitions | 1/10 | Mechanical transit works, but prose completely fails due to broken variables. |
| 4. Option quality | 1/10 | Generates gibberish ("Check the stranger") and endlessly recycles the same options. |
| 5. Agency & consequence | 1/10 | Player meta-inputs are ignored; world state never changes despite actions. |
| 6. Progression (quests) | 1/10 | No active quests, objectives, or narrative spines exist after Turn 1. |
| 7. Progression systems | 2/10 | Tiny trickle of 5 XP for "studying" items, but no meaningful RPG mechanics. |
| 8. Combat / danger | 1/10 | Zero combat. The GM never forces encounters when the player dawdles. |
| 9. Exploration | 1/10 | Mindless ping-ponging along a single, featureless "cape path." |
| 10. NPC / dialogue | 1/10 | NPCs are entirely absent or referred to as "the stranger" due to bugs. |
| 11. Voice consistency | 1/10 | "Friendly Guide" is absent; prose is 100% dry, generic 2nd-person filler. |
| 12. Continuity / consistency | 1/10 | The narrative frequently contradicts itself and forgets established facts. |
| 13. Hallucinations / mush | 1/10 | Constant `the stranger`, `them`, and `this place` errors destroy readability. |
| 14. Invented items / kit lies | 1/10 | Inventory is inconsistent and subject to frequent hallucinations. |
| 15. Invented presence | 1/10 | The system suggests interactions with non-existent entities. |
| 16. English / polish | 1/10 | Poor grammar, broken tags, and clunky sentence structures abound. |
| 17. STATUS / System | 2/10 | Minimal system feedback; mostly limited to "XP Gained" for mundane actions. |
| 18. Long-session durability | 1/10 | The session degenerates into a broken loop almost immediately. |
| 19. Keep playing? | 1/10 | Unplayable and frustrating; a quick churn for any player. |
| 20. Competitive win/loss | Loses completely. | The engine's inability to maintain context, apply the selected voice, or drive a narrative forward makes it a poor alternative to any existing interactive fiction platform. |

---

### Deep Dives

#### A. Progression autopsy

* **Timeline of meaningful beats:**
* Virtually none. The agent wanders the "cape path" and surrounding areas for 300 turns. A "metallic object" (Turn 33) and a "crystal shard" (Turn 88) are found, but neither leads to any plot advancement or significant interaction.

* **`STATUS / System:` lines found:**
* Turn 13 (`XP Gained: 5`), Turn 16 (`XP Gained: 5`), Turn 24 (`XP Gained: 5`), Turn 35 (`XP Gained: 5`), Turn 36 (`XP Gained: 5`), Turn 45 (`XP Gained: 5`), Turn 51 (`XP Gained: 5`), Turn 62 (`XP Gained: 5`), Turn 80 (`XP Gained: 5`), Turn 90 (`XP Gained: 5`), Turn 98 (`[GM ACTION] No item use required... XP Gained: 5`), Turn 99 (`[GM-LOG] Inventory Check: Mask Scarf is equipped...`), Turn 101 (`XP Gained: 5`), Turn 112 (`XP Gained: 5`), Turn 116 (`XP Gained: 5`), Turn 117 (`XP Gained: 5`), Turn 120 (`XP Gained: 5`), Turn 121 (`XP Gained: 5`), Turn 139 (`XP Gained: 5`), Turn 141 (`XP Gained: 5`), Turn 146 (`XP Gained: 5`), Turn 151 (`XP Gained: 5`), Turn 157 (`XP Gained: 5`), Turn 160 (`[Outcome: The player's attempt to listen more intently...]`), Turn 167 (`XP Gained: 5`), Turn 173 (`Bag Contents Inspected... XP Gained: 5`), Turn 178 (`Location: Cathedral Undercroft - Lower Level`), Turn 181 (`XP Gained: 5`), Turn 188 (`XP Gained: 5`), Turn 191 (`XP Gained: 5`), Turn 192 (`XP Gained: 5`), Turn 197 (`XP Gained: 5`), Turn 201 (`Scanning for threats completed...`), Turn 212 (`Inventory... XP Gained: 5`), Turn 213 (`XP Gained: 5`), Turn 267 (`XP Gained: 5`), Turn 274 (`XP Gained: 5`), Turn 287 (`XP Gained: 5`), Turn 291 (`XP Gained: 5`), Turn 296 (`XP Gained: 5`), Turn 298 (`XP Gained: 5`).

* **Interpret Meta end Level/XP:** Ends at Level 1, 145/300 XP. The agent is farming tiny amounts of XP through repetitive "inspect" actions. There is no structural progression or reward for actual roleplay.
* **What players miss:** Players miss the core elements of a Story RPG: character interaction, moral choices, sandbox exploration, and narrative leverage. Instead, they get a broken, lonely walk down a dark street.

#### B. Hallucination & invent ledger

| Turn | Type | Evidence quote | Likely owner | Severity | Suggested gate |
| --- | --- | --- | --- | --- | --- |
| 1 | Place | "stretch of the stranger beat" | `proseWarden` | P0 | Catastrophic variable failure (`[Location]`) |
| 3 | Place | "night air in the stranger was thick" | `proseWarden` | P0 | Catastrophic variable failure |
| 15 | Kit | "the stranger feels soft and slightly worn" (Referring to the Mask Scarf) | `proseWarden` | P0 | Catastrophic variable failure (`[Item]`) |
| 18 | Kit | "the stranger feels a bit warmer now" (Referring to the Mask Scarf) | `proseWarden` | P0 | Catastrophic variable failure |
| 21 | Place | "night air in the stranger hangs thick" | `proseWarden` | P0 | Catastrophic variable failure |
| 38 | Place | "turn your back on the stranger downpour... pass a darkened alleyway... a storefront with a flickering neon sign advertising "Lucky 7 the stranger stranger," its light barely piercing the stranger gloom." | `proseWarden` | P0 | Massive variable corruption rendering text unreadable |
| 54 | Option | "Check the stranger." | `choicePad` | P0 | Broken option generation |
| 75 | Place | "air in the stranger night beat hums" | `proseWarden` | P0 | Variable failure |
| 103 | Kit | "the stranger, a simple piece of dark, rough fabric" | `proseWarden` | P0 | Variable failure |
| 176 | Place | "reach Cathedral Undercroft... imposing silhouette of the Cathedral Undercroft" (Agent has somehow teleported to the Fantasy/D&D map in a cyberpunk/vigilante scenario) | `proseWarden` / `bibleContent` | P0 | Severe crossover/hallucination of map locations |
| 208 | Option | "Examine the "Bag" in your inventory." (Agent magically acquired a bag from the fantasy scenario) | `choicePad` / `situationSnapshot` | P1 | Enforce strict inventory JSON; prevent cross-contamination |
| 219 | Place | "You leave Kitchen Saint Alley behind and reach Lowmarket." (Again, fantasy locations in the vigilante scenario). | `proseWarden` / `bibleContent` | P0 | Fix map/node assignments per mode |
| 288 | Option | "the stranger the clothes you're wearing." | `choicePad` | P0 | Broken option grammar/variable |

#### C. Loop / recycle report

* **Top recycled option labels:**
* "Walk away / go another direction" (Appears ~65 times).
* "Inspect the immediate surroundings" (Appears ~40 times).
* "Force a path forward" (Appears ~30 times).
* "Ask what is going on" (Appears ~15 times).

* **Top paragraph clones:**
* "The persistent drizzle slicks the asphalt as you turn your back on the hunched figure beneath the fire escape, resuming your patrol route. Their unmoving form, a silhouette against the grimy brickwork, remains an enigma lost to the shadows and the downpour. You focus on the rhythmic beat of your own footsteps, the hiss of tires on wet streets, and the faint, metallic tang of ozone in the air..." (Repeats almost verbatim for Turns 28-34).
* "The rough weave of the Mask Scarf brushes against your cheek as you pull it further up over your nose and mouth, attempting to sharpen your senses against the encroaching darkness. The damp, earthy air does little to carry distinct sounds, muffling everything into a pervasive hush. You strain your ears, focusing on the subtle shifts in the quiet, but the most prominent sound is your own breath, a ragged counterpoint to the oppressive stillness..." (Repeats almost verbatim for Turns 158-163).

* **Same-action loops:**
* Turns 28-34: Repeating "Inspect the immediate surroundings" / "Examine the metallic object".
* Turns 158-163: Endless scanning and listening on the cape path.
* Turns 176-184: Ping-ponging in the "Cathedral Undercroft" (a hallucinated fantasy location).

* **Travel ping-pong hubs:** The agent bounces between "the stranger" (broken location), the cape path, and hallucinated fantasy locations (Cathedral Undercroft, Lowmarket).

#### D. Best 10 & worst 10 turns

* **Best 10:** T0, T3, T8, T32, T36, T45, T80, T88, T106, T107. (These turns feature actual interaction with the environment, finding objects, or attempting to set a scene, though often marred by variable bugs).
* **Worst 10:** T18, T38, T89, T103, T158, T176, T208, T219, T238, T288. (The absolute peaks of variable failures, missing tools, infinite paragraph loops, and bizarre cross-genre map hallucinations).

#### E. Priority fix board

1. **P0: Catastrophic variable rendering (`the stranger`, `them`, `this place`).** → `proseWarden` / `prompt` → The text renders actual nouns instead of broken variables.
2. **P0: Cross-Genre Map Hallucinations.** → `bibleContent` / `situationSnapshot` → The engine must not load locations from the fantasy bible (Lowmarket, Cathedral) into the sci-fi/vigilante bible.
3. **P0: Infinite action/paragraph loops.** → `proseWarden` / `prompt` → The engine rejects any GM output that is >80% identical to the previous turn and forces a reroll.
4. **P0: Option deduplication and grammar filtering.** → `choicePad` → Options like "Walk away / go another direction" cannot appear more than twice per zone, and options with broken tags are dropped.
5. **P1: Strict Inventory State.** → `situationSnapshot` / `prompt` → The LLM cannot narrate the contents of a "Bag" it doesn't possess; inventory must be handled via strict JSON parsing.
6. **P1: Threat Decay / Anti-loitering Warden.** → `proseWarden` / `agentPolicy` → If the player chooses the same passive action 3 times in a row, spawn a hostile interrupt event.
7. **P1: Context-aware option generation.** → `choicePad` → Options involving NPCs or specific items are only generated if the state array confirms they are present.
8. **P2: 'Friendly System' voice enforcement.** → `prompt` / `proseWarden` → The GM appends a warm, helpful system observation to the end of every location transition or failed action.

#### F. Keep / cut / rewrite for **Friendly System / Friendly Guide**

*(Note: As the requested voice was completely absent, these rewrites demonstrate how to apply it).*

* **Keep 1:** "The gate is barred. They still let you in because the rain left you no choice." (T0 - Good setup, though contextually confusing given the map hallucinations).
* **Keep 2:** "The article’s tone is one of growing unease, suggesting these acts are more than simple petty crime..." (T80).
* **Keep 3:** "The distant rumble of freight trucks on the main thoroughfares, the closer, sharper whine of hover-scooters zipping through side streets..." (T107).
* **Cut 1:** "The persistent drizzle slicks the asphalt as you turn your back on the hunched figure beneath the fire escape, resuming your patrol route..." (Cut entirely; it's a multi-turn loop).
* **Cut 2:** "the stranger the clothes you're wearing." (Cut; broken English/variable).
* **Cut 3:** "You leave Cathedral Undercroft behind and reach Harbor Quay." (Cut; map hallucination).
* **Rewrite 1:** "Walk away / go another direction" -> `[Guide Note]: Looks like a dead end. Let's backtrack and see if we missed a clue on the main street.`
* **Rewrite 2:** "The moment hangs — try again. [GM empty/fail (unknown)]" -> `[System Hiccup]: Oops, my connection to the district feed dropped for a second. Let's try that action again!`
* **Rewrite 3:** "the stranger feels soft and slightly worn against your fingertips." -> `[Analysis Complete]: That's your Mask Scarf. Good for keeping the smog out and your identity hidden. Always a solid choice on this beat.`

#### G. Confidence & blind spots

* **Blind spots:** I cannot see the actual UI panels, inventory screens, or how the `STATUS / System:` lines were formatted for the user. I can only evaluate what is in the text dump.
* **Newer baseline:** A newer baseline might have improved the `the stranger` variable bug, which ruins this entire run.
* **Blame split:** 90% Engine/Prompt, 10% Agent. The agent is looping because the engine is feeding it broken options ("Walk away"), hallucinating map locations, and failing to provide any narrative momentum.
* **Game Mode Confirmation:** I scored this strictly against Story RPG (`rpg`) expectations, focusing on narrative progression, environmental interaction, and sandbox mechanics. It failed completely.

`REVIEW_COMPLETE` make a note of this ill keep playing and will raise any other issuse before doing the next update