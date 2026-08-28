# WS-4 Research Notes

## Source findings

### D&D Beyond Basic Rules — Playing the Game

Source: https://www.dndbeyond.com/sources/dnd/br-2024/playing-the-game

The official free rules frame play as a repeated cycle in which the DM describes a situation, players decide what their characters do, and rules plus narration determine results. The page defines D20 Tests as ability checks, saving throws, and attack rolls; the result is resolved against a target number such as a Difficulty Class or Armor Class. This supports a DnD encounter contract that declares test type, modifier, DC/AC, and success/failure effects before the roll, then records the result.

### Blades in the Dark SRD — Setting Position & Effect

Source: https://bladesinthedark.com/setting-position-effect

The SRD states that the GM sets position and effect together after the player selects an approach. Risk and expected effect are independent variables. Its examples explicitly compare fighting, escaping, terrain advantages, surprise, and scale. This supports WS-4’s stakes packet: each declared approach should expose risk, expected effect, and bounded consequences before resolution instead of offering decorative choices.

## Design implications retained

1. Treat every player-facing choice as a resolvable contract: prerequisites, chance or deterministic condition, success output, failure/partial output, and maximum duration.
2. Keep the deterministic state transition authoritative; permit the GM to vary only prose, imagery, and dialogue around the committed outcome.
3. Expose distinct escape and negotiation mechanics whenever those options are displayed.
4. Record post-resolution changes in an append-only receipt so later turns can prove that HP, resources, faction state, quest state, or location state changed.

## Pending evidence topics

- Progress clocks and explicit consequences for social/crisis encounters.
- Official or established interactive-fiction guidance for meaningful exclusive choices, delayed payoffs, and branch convergence.
- Combat readability and telegraphing principles from game design sources.
- Encounter pacing/density as a product target rather than a copied universal rule.

### Blades in the Dark SRD — Consequences & Harm

Source: https://bladesinthedark.com/consequences-harm

The SRD defines concrete consequence categories: reduced effect, complication, lost opportunity, worse position, and harm. Complications can tick an alert/suspicion clock or alter faction status, while harm is explicitly recorded. It also states that a complication should not negate a successful result. WS-4 therefore needs typed consequence receipts and monotonic outcome rules: a success-with-cost must preserve the promised success while applying a separate cost.

### Blades in the Dark SRD — Progress Clocks

Source: https://bladesinthedark.com/progress-clocks

The SRD recommends 4-, 6-, and 8-segment clocks for increasingly complex obstacles; simple obstacles resolve in one roll. Danger clocks complete into a concrete event. Racing clocks provide mutually intelligible terminal states, including mixed outcomes if both complete simultaneously. Linked clocks model layered threats, mission clocks model deadlines, and faction clocks propagate world-state change. WS-4 should use bounded clocks for complex social/crisis encounters, require a terminal transition when a clock fills, and disallow indefinitely repeating an unchanged approach.

## Additional retained implications

5. Partial success must preserve the success component; costs are additive state changes rather than retroactive cancellation.
6. Multi-turn encounters require a declared segment budget and a terminal result at completion.
7. Repeated actions must either advance success, advance danger, consume a resource, or become invalid; no choice may return an identical state indefinitely.
8. Separate progress and danger clocks make flee, chase, negotiation, and deadline pressure auditable.

### sub-Q — The Branch and the Merge

Source: https://sub-q.com/making-interactive-fiction-the-branch-and-the-merge/

The article identifies branch-and-bottleneck and hub-and-spoke as practical structures for containing combinatorial growth while retaining responsiveness. It emphasizes holding persistent state, delayed branching, dynamic callbacks, and accumulated choice variables so choices remain visible after branches merge. WS-4’s PYOA crises should therefore write exclusive facts immediately, schedule at least one later callback, and use convergence only after preserving branch-specific state.

### Game Developer — The Art and Science of Pacing and Sequencing Combat Encounters

Source: https://www.gamedeveloper.com/design/the-art-and-science-of-pacing-and-sequencing-combat-encounters

The article treats pacing and sequencing as design guided by an explicit combat plan and by variation in encounter intensity rather than a universal formula. This supports using density bands, role mix, recovery windows, and anti-repeat constraints instead of a single fixed encounter frequency. WS-4’s numeric density values should be labeled product defaults to validate and tune through telemetry, not external truths.

## Additional retained implications

9. PYOA convergence is valid only when earlier choices remain addressable through flags, counters, callbacks, relationship deltas, or ending eligibility.
10. Every fork needs an immediate exclusive fact plus a delayed payoff contract; otherwise it is theater branching.
11. Encounter-density values are operational hypotheses with target bands and evaluation gates, not genre laws.
12. Pacing governance should vary intensity and encounter role while enforcing upper and lower drought bounds.

### Game Developer — Enemy Attacks and Telegraphing

Source attempted: https://www.gamedeveloper.com/design/enemy-attacks-and-telegraphing

The page did not expose usable article text in the browser extraction, so no design claim in the final report will depend on it.

### The Level Design Book — Encounter

Source: https://book.leveldesignbook.com/process/combat/encounter

The chapter argues that encounter design should communicate clear cause and effect. It recommends giving players an opportunity to survey an arena, predict threats, and form an escape plan. Ambushes are treated as valid but cautioned against excessive difficulty because forced trial-and-error can feel unfair. Boss or set-piece vistas act as explicit preparation warnings. It also recommends a small, focused enemy palette in most encounters for readability. WS-4 should therefore support multi-channel telegraphs, require at least one escape cue before commitment for non-surprise encounters, cap untelegraphed ambush severity, and limit simultaneous enemy-role complexity.

## Additional retained implications

13. Telegraphs should transmit actionable information: source, location, likely intent, response window, and at least one viable preparation or avoidance action.
14. The 20% ambush allowance is not permission for opaque lethality; surprise templates need lower opening severity, environmental suspicion cues, or a post-trigger reaction window.
15. Encounter readability improves when a template limits active enemy roles and exposes causal links between player action and state change.

### D&D Beyond Basic Rules — Verified exact mechanics

The official rules specify: roll 1d20; apply advantage/disadvantage by rolling two dice and keeping the higher/lower; add the relevant ability modifier, proficiency if relevant, and circumstantial modifiers; then compare the total with a target. Equaling or exceeding the target succeeds. Ability checks and saving throws use a DC; attack rolls use AC. Typical ability-check DCs are 5 very easy, 10 easy, 15 medium, 20 hard, 25 very hard, and 30 nearly impossible. Ability checks are appropriate when both success and meaningful failure are possible and the outcome is narratively interesting. Social interaction combines roleplay and, when needed, an Influence check; an NPC’s wants, fears, goals, and attitude matter. Surprise imposes disadvantage on initiative rather than erasing the surprised combatant’s ability to participate indefinitely.

## Additional retained implications

16. DnD templates will default to the official six-step contract: declare approach and ability/skill, set DC, determine advantage/disadvantage, roll d20, add modifiers, commit success/failure state.
17. Do not roll when failure is not meaningful or the result is already certain.
18. Social DCs must be gated by plausible leverage and NPC attitude; a high roll cannot make an impossible concession valid.
19. Ambush surprise affects initiative/opening position but must not become a non-interactive stun loop.
