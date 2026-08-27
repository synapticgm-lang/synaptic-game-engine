# Evidence Classification

## Evidence standard

The supplied packet contains three different evidence levels that should not be conflated: **transcript/telemetry-confirmed**, **plausible but not demonstrated in the packet**, and **contradicted by the packet's own calibration notes**. Product prioritization should rely on the first category; the second should trigger instrumentation or targeted replay; the third should not be used to justify a severity score.

| Claim | Classification | Product interpretation |
|---|---|---|
| Placeholder/entity mush (`the stranger`, `them`, `this place`) | Confirmed, critical | Repeated malformed references destroy readability, trust, scene comprehension, and option grounding. |
| Zero combat or forced danger across 300 turns | Confirmed, critical | The system lacks effective escalation and cannot sustain tabletop/RPG stakes. |
| Options are repeatedly exposed, including Millstone Charter and Walk away | Confirmed, high | This is a **soft/semantic loop**, not necessarily a consecutive identical-action loop. It still harms play. |
| Inspect actions produce repeatable 5 XP | Confirmed, high | The reward function incentivizes non-progress and teaches agents to farm inspection. |
| Requested voices are not perceptible in prose | Confirmed, medium-high | "Wired" is not the same as player-visible. The implementation exists, but the delivered voice is weak. |
| Meta complaints about bad options are ignored | Confirmed, high | The interface has no recovery path when choices are invalid or contextually wrong. |
| No hard repeated-action interrupt | Confirmed architectural gap, high | Prompt-only guidance is insufficient for long-session control. |
| Inventory duplication/morphing | Plausible but not established by supplied calibration | Keep the bag lock, but add ledger-diff telemetry before treating this as a measured P0 defect. |
| No dice rolls in Tabletop Fantasy | Reported but unverified in supplied calibration | Verify separately because this is genre-critical; do not cite it as confirmed yet. |
| "No NPCs" | Overbroad/partly contradicted | The packet also says static NPCs repeat dialogue, which implies NPC presence. The stronger supported claim is **non-reactive NPCs**. |
| 100+ consecutive identical-action loops | Contradicted as stated | Maximum exact intent streaks are 2–3. Repetition exists across a wider window, but the quoted measurement is false. |
| DnD contains LitRPG battlement/gate-queue pads | Contradicted | Telemetry reports zero hits and identifies cross-run contamination. |
| PYOA contains Mask Scarf or Earth-junk-price content | Contradicted | These examples were imported from other modes/runs; Mask Scarf is also a legitimate RPG kit item. |
| Worst turns beyond turn 300 | Contradicted | Invalid citations materially weaken the critic's audit reliability. |
| Voice personalities are "entirely absent" | Overstated in implementation terms, directionally fair in UX terms | The voice rails are connected but not audible enough to affect the player experience. |
| Every 1/10 score is justified | Unsupported blanket calibration | Several core axes deserve 1–2/10, but axes such as English polish, invented presence, and inventory truth need isolated measurements rather than inheriting the overall failure score. |

## Validated product failures

1. **P0 — Entity-reference corruption:** The visible mush is not cosmetic. It blocks the player from identifying actors, targets, possessions, and locations, so it also contaminates agency, option quality, and continuity scores.
2. **P0 — No escalation or danger:** A 300-turn run with no combat/forced encounter is direct evidence that the pacing governor is ineffective.
3. **P0 — Reward misalignment:** Repeatable inspect XP rewards the exact behavior the system is trying to prevent.
4. **P0 — Recycled and context-insensitive options:** High repeated-option exposure makes the world feel static even when exact selected-action streaks remain short.
5. **P0 — No deterministic recovery path:** Meta correction and repeated-action handling cannot be left solely to a language-model prompt.
6. **P1 — Weak goal pressure:** The player receives insufficient objective movement and no reliable narrative spine after the opening.
7. **P1 — Voice is operationally invisible:** Style configuration that cannot be detected in ordinary prose is a failed user-facing feature, even if technically wired.

## Overstatement summary

Gemini's **directional diagnosis is substantially correct** on stagnation, mush, reward misalignment, weak voice, and long-session collapse. Its **forensic reliability is poor**, however, because several examples use impossible turn numbers, contaminated run identities, and cross-genre details. The right response is not to dismiss the critique; it is to keep the validated root causes while discarding unsupported counts and examples.

A defensible calibration is: **1–2/10 is fair for combat/danger, meaningful progression, long-session durability, and keep-playing propensity in these runs**. A universal 1/10 across presence, inventory fidelity, English polish, and all consistency categories is not justified by the evidence supplied. Those axes should be re-scored from clean, correctly labeled runs after instrumentation is tightened.
