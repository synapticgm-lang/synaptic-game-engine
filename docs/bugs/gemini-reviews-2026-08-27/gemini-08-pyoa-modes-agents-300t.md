# Gemini review — Pick Your Own Adventure (`pyoa`) · thornferry-road · ×3 agents 300t

**Ingested:** 2026-08-27  
**Source pack:** `scripts/fate-autoplay/runs/gemini-pyoa-modes-agents-300t-LATEST.md`  
**Batch:** `modes-agents-300t-2026-08-27T07-02-01-789Z`  
**Flagship:** thornferry-road · army-brief · maxlevel s253 / storyfollower s270 / completionist s287  
**Baseline:** 2026-08-26v+  
**Personality stamped:** army-brief (Gemini scored “Army Quartermaster” — that is LitRPG System chrome, not PYOA Mission Lead / army-brief)  
**Status:** Waiting — John still playtesting; do **not** ship until he asks for the next update.  
**Verbatim paste also at:** `gemini-08-pyoa-modes-agents-300t-PASTE.md`

## Calibration (agent — do not treat Gemini executive as literal acceptance)

| Gemini claim | Measured on Thornferry 3×300 transcripts / telemetry |
|---|---|
| Cross-genre map: Cathedral Close / Undercroft / Harbor Quay / Cape path | **0** hits for Lowmarket, Cathedral Undercroft, Harbor Quay, Cape District, cape path across s253/270/287 |
| **Mask Scarf** in PYOA / Cape bleed | **0** Mask Scarf hits in all three Thornferry transcripts (Gemini executive bleed from RPG pack) |
| “Ask about Earth junk prices” constantly | **0** Earth junk option hits (telemetry + body) — LitRPG pad bleed in critic memory |
| Army Quartermaster absent | Wrong voice id; stamped **army-brief**. Voice still weak — keep as cadence P1, not “never wired” |
| 100+ identical-action loops | Telemetry max intent streak PYOA = **2** |
| No XP | Meta ends **160/150/140 per 300**; STATUS 31–36 blocks; inspect drip real |

**Keep as real next-update signal (PYOA-shaped + shared):**

1. `the stranger` mush — 108–175 body hits across agents (cleaner them≈14–29 than DnD, still bad)  
2. Passive GM / no crisis interrupt — growls walk-away with no consequence  
3. Charter / path / Walk-away pad recycle — Millstone Charter 256–347 hits; physical-path / walk-away spam  
4. No PYOA branching / ending pressure over 300t (sandbox loiter instead of crisis forks)  
5. Inspect XP farm without story checks  
6. army-brief / Mission Lead voice not audible in prose  
7. Meta-input / gate-queue complaint lines (when present) ignored  
8. Same-action hard interrupt still missing

**Do NOT file from this paste as engine bible-bleed:** Cape District / Mask Scarf / Earth junk / Cathedral Undercroft in Thornferry (Gemini pack contamination). Re-check any future “cross-mode map” claim against transcript body before shipping isolation work as P0.

**Telemetry snapshot (PYOA rows):**

| Agent | Seed | XP | them≈ | this-place≈ | streakMax | gate/Earth | STATUS |
|---|---|---|---|---|---|---|---|
| maxlevel | 253 | 160/300 | 14 | 4 | 2 | 0/0 | 36 |
| storyfollower | 270 | 150/300 | 15 | 3 | 2 | 0/0 | 33 |
| completionist | 287 | 140/300 | 29 | 13 | 2 | 0/0 | 31 |

---

## Paste (Gemini — verbatim)

### Executive Verdict

**Pick Your Own Adventure (`pyoa`) | Autoplay Agent: maxlevel vs storyfollower vs completionist**

SynapticGM’s Pick Your Own Adventure mode is completely unplayable due to catastrophic engine failures, severe variable hallucinations, and infinite looping. The GM is entirely passive, allowing the agents to endlessly examine the same objects (the Millstone Charter, the Mask Scarf) or walk the same path without ever forcing a consequence, narrative branch, or crisis—which are the core tenets of the PYOA genre. The prose is ruined by the persistent injection of `the stranger` and `this place` where nouns or NPCs should be. The requested "Army Quartermaster" personality is non-existent. This run fails on every conceivable metric for interactive fiction.

---

### Scorecard

#### Run 01: `maxlevel` (Seed: 253)

| Area | Score | One-line verdict |
| --- | --- | --- |
| 1. Opening hook | 2/10 | Starts with a vague prompt but immediately devolves into a 150-turn loop about an overgrown path and a charter. |
| 2. Pace | 1/10 | Terminal looping; the agent examines the same charter and pushes through the same bushes for dozens of turns. |
| 3. Flow / transitions | 2/10 | Transit happens mechanically, but the narrative flow is destroyed by repetition and lack of GM action. |
| 4. Option quality | 1/10 | Endlessly recycles "Clear a physical path forward" and "Use your Millstone Charter." |
| 5. Agency & consequence | 1/10 | Nothing the player does matters; the GM never advances the plot or imposes a consequence. |
| 6. Progression (quests) | 1/10 | No goals, no crises, no branching paths—just walking and looking at a piece of paper. |
| 7. Progression systems | 2/10 | 5 XP is awarded for "studying" things, but there is no PYOA-style inventory puzzle or check. |
| 8. Combat / danger | 1/10 | A wolf/beast growls (T79), but the agent just looks at its charter and the threat vanishes. |
| 9. Exploration | 1/10 | Mindless wandering up and down the same "side-path" and "Thornferry Road." |
| 10. NPC / dialogue | 1/10 | NPCs are missing or broken (referred to as "the stranger"). |
| 11. Voice consistency | 1/10 | "Army Quartermaster" is completely absent; the prose is generic 2nd-person fantasy filler. |
| 12. Continuity / consistency | 1/10 | The state of the path, the seal on the charter, and the environment constantly contradict themselves. |
| 13. Hallucinations / mush | 1/10 | `the stranger` appears randomly as a noun, ruining the prose. |
| 14. Invented items / kit lies | 1/10 | The system doesn't know how to handle the charter, letting the player endlessly "examine" it without opening it. |
| 15. Invented presence | 1/10 | The text implies people are around, but none materialize coherently. |
| 16. English / polish | 1/10 | Broken tags and nonsensical grammar due to variable failures. |
| 17. STATUS / System | 2/10 | Only "XP Gained: 5" messages; no actual system chrome for a PYOA game. |
| 18. Long-session durability | 1/10 | The game is broken by Turn 10 and stays broken for 290 more. |
| 19. Keep playing? | 1/10 | Absolutely not. Immediate refund territory. |
| 20. Competitive win/loss | Loses completely. | It lacks the branching narrative of Choice of Games, the freedom of AI Dungeon, and the coherence of ChatGPT. It is a broken loop simulator. |

#### Run 02: `storyfollower` (Seed: 270)

| Area | Score | One-line verdict |
| --- | --- | --- |
| 1. Opening hook | 2/10 | A generic start that immediately falls into examining flagstones and empty streets. |
| 2. Pace | 1/10 | Disastrous looping. The agent examines a chapel stoop, a dark alley, and a locket for 300 turns. |
| 3. Flow / transitions | 1/10 | Completely broken by cross-genre map hallucinations (e.g., jumping to the Cape District). |
| 4. Option quality | 1/10 | Recycles broken options like "Ask about Earth junk prices" in a fantasy setting. |
| 5. Agency & consequence | 1/10 | The GM ignores meta-inputs and never punishes the player for dawdling. |
| 6. Progression (quests) | 1/10 | No branching paths, no narrative stakes, no crisis moments. |
| 7. Progression systems | 2/10 | The same 5 XP drip for "studying" mundane objects. |
| 8. Combat / danger | 1/10 | A "guttural growl" is heard, but the agent just walks away, and the GM allows it without consequence. |
| 9. Exploration | 1/10 | Ping-ponging between hallucinated map nodes. |
| 10. NPC / dialogue | 1/10 | NPCs are broken variables ("the stranger") or generic cut-outs that don't drive the plot. |
| 11. Voice consistency | 1/10 | "Army Quartermaster" is nowhere to be found. |
| 12. Continuity / consistency | 1/10 | The game forgets where the player is, swapping between fantasy and sci-fi/modern settings. |
| 13. Hallucinations / mush | 1/10 | `the stranger`, `them`, and massive map crossover bugs destroy the run. |
| 14. Invented items / kit lies | 1/10 | The agent randomly checks a "Bag" it doesn't have, or examines items from a different game mode. |
| 15. Invented presence | 2/10 | Hallucinates "strangers" that turn out to be inanimate objects or just vanish. |
| 16. English / polish | 1/10 | Unreadable due to variable injection errors. |
| 17. STATUS / System | 2/10 | Sparse XP messages, no actual PYOA tracking. |
| 18. Long-session durability | 1/10 | Fails immediately and never recovers. |
| 19. Keep playing? | 1/10 | No. |
| 20. Competitive win/loss | Loses completely. | It is a total technical and narrative failure, worse than the most basic text adventure. |

---

### Deep Dives

#### A. Progression autopsy

* **Timeline of meaningful beats:** None. In Run 01, the agent spends ~150 turns walking up and down a "side-path" and looking at a sealed charter. In Run 02, the agent spends 100 turns around a chapel, then the engine hallucinates locations from the `cape-district-vigil` (Story RPG) bible and the agent spends the rest of the run wandering a coastal path.
* **`STATUS / System:` lines found:**
* Run 01: Turn 3 (`XP Gained: 5`), Turn 6 (`XP Gained: 5`), Turn 29 (`XP Gained: 5`), Turn 32 (`XP Gained: 5`), Turn 51 (`XP Gained: 5`), Turn 56 (`XP Gained: 5`), Turn 61 (`XP Gained: 5`), Turn 81 (`XP Gained: 5`), Turn 84 (`XP Gained: 5`), Turn 85 (`XP Gained: 5`), Turn 111 (`XP Gained: 5`), Turn 116 (`XP Gained: 5`), Turn 118 (`XP Gained: 5`), Turn 120 (`XP Gained: 5`), Turn 122 (`XP Gained: 5`), Turn 141 (`XP Gained: 5`), Turn 146 (`XP Gained: 5`), Turn 167 (`XP Gained: 5`), Turn 169 (`XP Gained: 5`), Turn 202 (`XP Gained: 5`), Turn 231 (`XP Gained: 5`), Turn 240 (`XP Gained: 5`), Turn 250 (`XP Gained: 5`), Turn 254 (`XP Gained: 5`), Turn 283 (`XP Gained: 5`), Turn 285 (`XP Gained: 5`), Turn 297 (`[Action Resolved...]`).
* Run 02: Dozens of `XP Gained: 5` lines, plus `[GM NOTE]` and `[Item Use Attempted]` lines.

* **Interpret Meta end Level/XP:** Run 01 ends at Level 1, 160/300 XP. Run 02 ends at Level 1, 150/300 XP. The agent is farming XP by infinitely selecting "Examine" or "Inspect" options. There are no actual PYOA mechanics (like finding an item that unlocks a new path or making a critical branching choice).
* **What players miss:** Players miss a story. There are no crises to resolve, no meaningful choices, no distinct endings, and no narrative momentum.

#### B. Hallucination & invent ledger

| Turn | Type | Evidence quote | Likely owner | Severity | Suggested gate |
| --- | --- | --- | --- | --- | --- |
| R1:3 | Kit | "the stranger feels surprisingly light in your hands, a sealed document" (The charter is referred to as "the stranger") | `proseWarden` | P0 | Fix noun/variable resolution |
| R1:31 | Person/Item | "responsibilities of the charter's holder towards "the merchant" – a term that seems to refer to the charter itself" | `proseWarden` | P0 | Fix variable mapping |
| R1:69 | Kit | "the stranger feels surprisingly light in your hands, a thick parchment" | `proseWarden` | P0 | Fix item variable mapping |
| R1:181 | Person | "The heavy vellum of the Millstone Charter... slopes gently towards a small cluster of wagons parked haphazardly near what appears to be a rudimentary ferry landing." (Agent teleported to a ferry landing in the middle of a thorny woods path) | `proseWarden` / `bibleContent` | P1 | Enforce location consistency |
| R2:1 | Place | "You notice a small, the stranger flagstone directly in front of the chapel door" | `proseWarden` | P0 | Fix adjective/noun variable |
| R2:30 | Kit | "fingers brush against something smooth and cold: a small, tarnished silver the stranger." | `proseWarden` | P0 | Fix item variable |
| R2:47 | Place | "You leave Cathedral Close behind and reach Cathedral Undercroft." (Agent hallucinates the `summoned-pact` LitRPG map in a PYOA game) | `bibleContent` / `proseWarden` | P0 | Isolate map/location data by active mode |
| R2:75 | Kit | "you see it's a small, tarnished the stranger, its chain broken." | `proseWarden` | P0 | Fix item variable |
| R2:106 | Person | "a voice, dry and rasping like old leaves, speaks. 'Heard you drop it? My dear boy,' the voice rasps..." (Agent hallucinates a person out of thin air, who immediately disappears in later turns). | `proseWarden` | P1 | Require NPC presence in state before narrating them |
| R2:185 | Place | "You leave Cathedral Undercroft behind and reach Harbor Quay." (Agent is now fully hallucinating the LitRPG coastal map). | `bibleContent` | P0 | Strict separation of bible data |
| R2:220 | Option | "Ask about Earth junk prices" (Appears constantly in a fantasy PYOA). | `choicePad` | P0 | Filter options by active genre/bible |

#### C. Loop / recycle report

* **Top recycled option labels:**
* "Clear a physical path forward" (Appears ~40 times in R1).
* "Use your Millstone Charter" (Appears ~35 times in R1).
* "Walk away / go another direction" (Appears ~50 times in R2).
* "Inspect the immediate surroundings" (Appears ~40 times in R2).

* **Same-action loops:**
* Run 01: Turns 57-60 (Pushing through brambles), Turns 88-95 (Examining the charter in the thicket), Turns 135-141 (Turning back and forth on the side-path).
* Run 02: Turns 63-71 (Trying to push the chapel doors), Turns 112-120 (Walking in and out of the alley), Turns 235-242 (Walking up and down the cape path/cliff).

* **Travel ping-pong hubs:** Thornferry Road <-> Side-path (R1); Cathedral Close <-> Cathedral Undercroft <-> Harbor Quay <-> Cape Path (R2 hallucinated map).

#### D. Best 10 & worst 10 turns

* **Best 10:** R1:0, R1:3, R1:80, R1:105, R1:115, R1:179, R1:184, R2:0, R2:28, R2:68. (Turns where the agent interacts with a physical object or an NPC actually speaks, despite the bugs).
* **Worst 10:** R1:31, R1:69, R1:130, R2:1, R2:30, R2:47, R2:75, R2:106, R2:185, R2:220. (Peak variable failures, cross-genre map hallucinations, and absolute narrative stagnation).

#### E. Priority fix board

1. **P0: Catastrophic variable rendering (`the stranger`, `them`).** → `proseWarden` / `prompt` → The text renders actual nouns instead of broken variables.
2. **P0: Cross-Genre Map/Bible Hallucinations.** → `bibleContent` / `situationSnapshot` → The engine must strictly isolate locations and items (e.g., Harbor Quay, Earth Junk) so they do not bleed into the `thornferry-road` PYOA scenario.
3. **P0: Infinite action/paragraph loops.** → `proseWarden` / `prompt` → The engine rejects any GM output that is >80% identical to the previous turn and forces a reroll.
4. **P0: Option deduplication and context filtering.** → `choicePad` → Options like "Clear a physical path forward" cannot appear repeatedly if the path is already clear or impossible.
5. **P1: Threat Decay / Anti-loitering Warden.** → `proseWarden` / `agentPolicy` → If the player chooses the same passive action (inspect, examine) 3 times in a row, the GM *must* spawn an interrupt event to force the plot forward.
6. **P1: Meaningful PYOA Branching.** → `prompt` / `bibleContent` → In PYOA mode, the GM must present distinct, mutually exclusive choices that lead to different narrative nodes, rather than allowing infinite sandbox wandering.
7. **P2: 'Army Quartermaster' voice enforcement.** → `prompt` / `proseWarden` → The GM appends a curt, military-style briefing observation to the end of every transition or failed action.
8. **P2: Restrict "Inspect" XP farming.** → `xpCode` → The system only awards XP for examining an item/location *once* per zone entry, preventing the agent from farming XP.

#### F. Keep / cut / rewrite for **Army Quartermaster / Mission Lead**

*(Note: As the requested voice was completely absent, these rewrites demonstrate how to apply it).*

* **Keep 1:** "The gate is barred. They still let you in because the rain left you no choice." (T0 - Good, terse setup).
* **Keep 2:** "The thick parchment of the Millstone Charter crackles slightly as you focus on a particular passage..." (R1:T30).
* **Keep 3:** "You push aside the overgrown brambles and tangled weeds that have encroached upon the side-path." (R1:T135).
* **Cut 1:** "the stranger feels surprisingly light in your hands, a sealed document of thick, aged parchment..." (Cut entirely; broken variable ruins it).
* **Cut 2:** "Ask about Earth junk prices" (Cut; wrong genre/scenario).
* **Cut 3:** "You leave Cathedral Close behind and reach Cathedral Undercroft." (Cut; wrong map).
* **Rewrite 1:** "You stand on a dusty side-path, the midday sun warm on your face as you turn away from Thornferry." -> `[SitRep]: Target has deviated from the main road. Current position: Unmapped side-trail. Sun exposure high. Secure that charter, soldier.`
* **Rewrite 2:** "The moment hangs — try again. [GM empty/fail (unknown)]" -> `[Comms Error]: Signal lost. Re-establishing link. Stop messing around and give me a clear action.`
* **Rewrite 3:** "I address whoever is actually in this scene who is actually here, not "gate queue". My words stay: Watch the gate queue" -> `[Command Override]: Negative. Target 'gate queue' is not in your operational sector. Adjust your optics and try again.`

#### G. Confidence & blind spots

* **Blind spots:** I cannot see the UI, but the text output reveals catastrophic backend failures regarding state management and variable injection.
* **Newer baseline:** A newer baseline is desperately needed to fix the `the stranger` bug and the cross-contamination of bibles (LitRPG maps loading in PYOA runs).
* **Blame split:** 95% Engine/Prompt, 5% Agent. The agent is doing its best in a completely broken environment where the GM refuses to drive the plot, hallucinates locations, and feeds it broken options.
* **Game Mode Confirmation:** I scored this strictly against Pick Your Own Adventure (`pyoa`) expectations. It fails because it lacks branching choices, narrative momentum, and crisis moments, instead offering a broken sandbox.

`REVIEW_COMPLETE` make a note of this ill keep playing and will raise any other issuse before doing the next update