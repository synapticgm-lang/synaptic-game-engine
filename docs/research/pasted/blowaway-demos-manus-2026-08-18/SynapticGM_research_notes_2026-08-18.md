# Fresh research notes — SynapticGM proof package

Date: 2026-08-18

## Sources reviewed

1. Song, Zhu, and Callison-Burch, *You Have Thirteen Hours in Which to Solve the Labyrinth: Enhancing AI Game Masters with Function Calling* (arXiv:2409.06949v1, 2024). URL: https://arxiv.org/html/2409.06949v1
   - The abstract characterizes building a consistent and reliable text-game AI GM as challenging because of LLM limitations and GM-role complexity.
   - The introduction states that maintaining consistency/coherence with game state across turns remains challenging, and that an LLM-based GM can go off rails with rules and flow.
   - The paper separates **scene state** (description, NPCs, objects, success/failure conditions) and **player state** (identity, persona, traits, flaws, inventory); it treats state functions as the mechanism that directly updates those state variables.
   - It reports that a no-state configuration may introduce unrelated content (its wording: hallucination) and describes an observed dice-roll deadlock in another configuration. These are study-specific observations, not broad market benchmarks.
   - It reports an experimental human evaluation and unit tests. No results will be generalized to SynapticGM or to unnamed competitors.

2. Gallotta et al., *Large Language Models and Games: A Survey and Roadmap* (arXiv:2402.18659v4, 2024). URL: https://arxiv.org/html/2402.18659v4
   - The survey says foreground NPC dialogue is constrained by narrative scope, role, player action, event tracking, memory capacity, and possible hallucinations (plausible but false statements).
   - It frames LLMs as components in a wider game system, rather than inherently authoritative game-state engines.

3. OpenReview record for *Setting the DC: Tool-Grounded D&D Simulations to Test LLM Agents*. URL: https://openreview.net/forum?id=3Op7kJOvaD
   - The page required browser verification, so no substantive claims from the paper are used.

## Source-use rules for final document

- Cite the two accessible papers only for **qualitative design/failure categories**.
- Do not name an individual product as broken; say “unledgered / prompt-only AI GMs” or “common failure mode.”
- Do not publish comparative rates, “first,” “only,” or superiority claims based on the papers.
- Position the 25 scripts as **acceptance/proof demos**: each must visibly show the precondition, the authoritative ledger event or rejection, and the postcondition.

## Implications for proof design

1. State mutation must be auditable: display a StateTx before/after diff, reason/authority, and receipt ID.
2. Scene permission must be auditable: display SceneManifest membership plus a negative proof for unlisted NPCs/objects.
3. Intent interpretation must be auditable: display the selected IntentContract and the player's protest as an event, not merely a rewritten narration.
4. Combat outcome must be auditable: display inputs, die/roll or resolution basis, HP/resource deltas, and a receipt.
5. Return/reload must be auditable: use a visible session return, then query the same record/ID rather than relying on prose recall.
6. Offer timing must be auditable: display HookArc state and suppress the offer when the hook is closed; show the opening event before revealing the soft offer.

## Citation labels planned

[1] Song et al. (function calling and game-state coherence)
[2] Gallotta et al. (LLM game survey; NPC continuity and hallucinations)

All research above is fresh for this project run.
