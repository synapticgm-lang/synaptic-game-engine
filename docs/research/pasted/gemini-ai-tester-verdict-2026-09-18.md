The automated playtest pipeline completely failed because the AI tester acted like a forgiving JSON parser instead of a human reader. By switching to a cheaper model to save money, the process destroyed the only metric that matters: whether the generated prose is actually a playable, coherent book. DeepSeek generated garbage, and Gemini Flash rubber-stamped it.

Here is exactly what broke, whose fault it is, and what needs to change.

### 1. The Failed Judge and the New Scoring Rubric

Gemini Flash thumbed UP "The name Jax already stood" and repeating "Ilyra Fen and Tekk Reed" stitches because the JSON parsed and the game didn't crash. A human player sees those lines, realizes the game is broken, and quits. The AI tester's prompt fundamentally failed to set a quality floor for the prose itself.

**New Hard Rubric (MUST vote DOWN if):**

* **System text masquerading as story:** Sentences like "They have the name Jax." or "The room waited." are database states, not literature.
* **Looping stitches:** The GM returns the exact same paragraph or fallback text as the previous turn.
* **Narrative clipping:** Combat resolves inside a dialogue beat, bypassing the intended mechanics.
* **Chrome over Content:** The only output is STATUS chrome (XP gained, Quest Unlocked) with no accompanying story paragraph.

### 2. Starving the "Who/Want" Chips

A human player stops asking "Who are you?" once the NPC answers. The AI tester blindly mashed the "Who/Want" chips until T10 timeout simply because the game left them on the screen. The tester must be explicitly instructed to track conversational state: if a question has been answered in the current scene, it must ignore those chips and either select a new action or type a custom response.

### 3. Fault Breakdown: Game vs. Tester vs. Process

* **Process-Bug (John's Fault):** Downgrading the AI tester to Gemini 1.5 Flash to cut costs. If the automated tester is the sole judge of product quality, making the judge stupid means you are flying blind. Calling 17i a "pass" because the fallback telegram text changed slightly—without checking if it was actual Token Prose—is a failure of testing methodology.
* **Tester-Bug (Harness Fault):** The AI ignored the narrative context, looped endlessly on dead chips, failed to flag obvious repetition as nonsense, and awarded 10/10 UP votes to completely stagnant game states.
* **Game-Bug (Pipeline/UI Fault):** The Free/DeepSeek writer repeatedly failed to return Token Prose, dumping the player into barebones stitches. The pad compiler failed to clear "Who/Want" chips after the variables were fulfilled. Combat resolved inside talk beats, meaning the `Auto-resolve combat` button never mounted for the tester to click.

### 4. Next Tester Requirements

* **Model:** Revert immediately to Gemini 1.5 Pro via OpenRouter (or the native web UI). Never run 4×T10 on Flash again. You cannot cost-cut the judge if the judge is determining whether the product works.
* **Strict Pre-Vote Prompting:** Before the AI generates its `turns.jsonl` output, it must evaluate the text specifically as a fiction reader. Instruct it: *"If the GM response reads like a telegram, repeats the previous turn, or resolves combat in a dialogue box, you must vote down and flag 'nonsense_options'."*

### 5. Next Game Fixes (Origin/Main)

* **Name-Lock Beat:** This must generate actual scene prose placing the character in the room with a spoken want. "They have the name Jax." alone is a critical failure.
* **Dynamic Chip Culling:** The pad compiler must remove "Who" and "Want" chips the moment those variables are logged in the game state. Do not rely on the tester (or a human) to ignore dead chips.
* **Kill the Third-Strike Loop:** A third Who/Want attempt must not reprint the identical Fen/Reed text. If the writer fails again, the fallback must force the narrative forward or gracefully reject the question, not loop infinitely.
* **Chrome is not Prose:** STATUS updates (Quest Unlocked: Circle's Price) and XP notifications must overlay a generated story paragraph. They cannot serve as the entire beat.
