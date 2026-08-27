# V6 — Combat, Quest, Inventory, and Map Feel Receipts

## Scope

This part does **not** redesign the engines. It defines how existing resolution outputs become readable, fair, and emotionally legible. Each receipt is derived from existing authorized modules: `OutcomeToken`, `StateTx`, quest-journal enrichment, `places`, `SceneManifest`, and evidence. A receipt is an explanation of a committed change, not a new source of truth.

## Combat: telegraph → loss → aftermath

Combat feel succeeds when a player can answer three questions: **What threatened me? What did I do? What changed?** Telegraphing—pre-attack delay, motion, sound, text, or another readable cue—converts damage from surprise into a decision problem. [1]

| Beat | Required player-facing content | Existing hook | Anti-pattern |
|---|---|---|---|
| Telegraph | Threat, target/area, timing window, known counterplay or uncertainty. | SceneManifest + `OutcomeToken: pending`. | Damage with no preceding legible cue. |
| Commit | Player intent, relevant resource/risk, and protected interpretation. | IntentContract + pre-StateTx. | Recasting defense as attack. |
| Resolve | Success/failure/partial result and reason available at this knowledge level. | OutcomeToken + StateTx. | “It didn’t work” with no causal signal. |
| Aftermath | HP/condition/position changes, what remains dangerous, next safe decision. | StateTx + SceneManifest. | Hiding a status change in flavor prose. |
| Review | Inspectable timeline of threat, action, result, and correction. | StateTx history. | Treating a player challenge as an argument with the model. |

**Fair loss receipt:** `The ash-spike struck because you remained in the marked lane after its warning flare. Condition changed: burned. The eastern shutter is still within reach.` This is not a promise that any loss is avoidable; it is an explanation of the available causal path.

## Quest: what-next and why-blocked without spoilers

A quest journal should not pretend it knows the story’s future. It answers the player’s present question with **confirmed objective**, **known blocker**, **available leads**, and **unknowns**.

| Journal field | Meaning | Source limit |
|---|---|---|
| Current promise | What the player agreed to do. | StateTx / accepted contract. |
| Why blocked | Present condition preventing direct progress. | SceneManifest / evidence / StateTx. |
| Known lead | A location, person, or action grounded in evidence. | Evidence only; label uncertainty. |
| World pressure | Time, risk, rival, or resource condition currently true. | StateTx / manifest. |
| Unknown | Acknowledged gap; not a generated theory. | No authority claim. |

Example: **“Reach the observatory.”** *Blocked:* `The north stair is sealed.` *Known lead:* `The archivist saw a maintenance route, but has not shared it.` *Unknown:* `Who sealed the stair.` This avoids both spoiler text and empty “continue quest” labels.

## Inventory and salvage: game, not chores

Inventory should communicate **identity, provenance, use, cost, and change**. Stable names and icons support recognition rather than recall; accessible text hierarchy and non-color-only distinctions protect comprehension. [2] [3]

| Receipt moment | Player benefit | Module mapping |
|---|---|---|
| Acquisition | “What is it and why does it matter?” | StateTx item add + evidence source. |
| Transformation | “What changed about it?” | StateTx item update, provenance retained. |
| Use / depletion | “What did it solve and what did it cost?” | OutcomeToken → StateTx delta. |
| Salvage | “What choice am I making?” | IntentContract + irreversible-cost confirmation when warranted. |
| Recall | “Where did this come from?” | Item provenance / linked places / relevant quest. |

Do not turn every object into a card wall. Surface a one-line use signal in scene; reserve genealogy, tags, and provenance for inspect.

## Place knowledge vs map geometry

Maps should make **discovery feel like knowledge earned**, not geometry automatically filled. Separate:

| Layer | Player-facing treatment | Authority |
|---|---|---|
| Geometry | Known routes, verified exits, distance/time where rules allow. | Places + StateTx. |
| Place knowledge | Rumors, observed conditions, who/what matters here. | Evidence, clearly labelled. |
| Discovery | New place unlocked because player arrived, learned, or earned access. | StateTx / SceneManifest. |
| Inference | Possible connection or theory. | Invention; visually distinct. |

A map pin may say `Old canal — route confirmed` while a nearby halo says `Rumored service door — unverified`. This lets the world remain surprising without withholding what the player has already earned.

## Design receipts at a glance

| System | Default receipt | Expanded inspect | Vibe outcome |
|---|---|---|---|
| Combat | Threat/result/aftermath. | Timeline and modifiers. | “I lost fairly.” |
| Quest | What now / why blocked. | Evidence chain and commitments. | “I know how to move.” |
| Inventory | Meaningful add/remove/use. | Provenance and linked quests. | “This is part of my run.” |
| Map | Discovery and current constraints. | Knowledge layers and route basis. | “I earned this understanding.” |

**SPECULATIVE:** Receipt density should respond to player expertise and reading preference, but the underlying facts must remain accessible. Test directness, spoilers, and combat fairness by engine.  
**COUNSEL:** Any monetization or scarcity mechanic attached to inventory, salvage, or map access requires separate fairness and child-safety review.

## References

[1]: https://www.gamedeveloper.com/design/enemy-attacks-and-telegraphing "Game Developer — Enemy Attacks and Telegraphing"
[2]: https://www.nngroup.com/articles/ten-usability-heuristics/ "NN/g — 10 Usability Heuristics"
[3]: https://gameaccessibilityguidelines.com/full-list/ "Game Accessibility Guidelines"
[4]: https://www.w3.org/WAI/WCAG22/quickref/ "W3C — WCAG 2.2 Quick Reference"
