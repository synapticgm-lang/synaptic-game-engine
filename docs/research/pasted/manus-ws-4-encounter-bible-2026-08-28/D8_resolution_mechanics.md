# D8 — Resolution Mechanics Specification

The authoritative interfaces and reference algorithms are in [`D8_resolution_mechanics.ts`](./D8_resolution_mechanics.ts). The implementation follows a **deterministic-core, generative-flavor** architecture: code validates the action, advances ledgers, commits a terminal state, and generates a receipt before the GM narrates.

## Resolution Transaction

| Step | Operation | Rejection condition |
| --- | --- | --- |
| 1 | Load the frozen template version, encounter seed, and current ledger. | Snapshot or template is unavailable. |
| 2 | Validate action ID, requirements, route, leverage, and lock state. | Action is illegal, locked, already consumed, or the encounter is terminal. |
| 3 | Resolve seeded randomness when the mechanic requires it. | DC, AC, die range, or seed is invalid. |
| 4 | Build typed state deltas without mutating prose state. | The result contains no delta and is not terminal. |
| 5 | Apply deltas atomically and clamp HP/clocks to legal ranges. | A target ledger entry does not exist or the operation is invalid. |
| 6 | Evaluate terminal conditions before offering another action. | A filled terminal clock is left active. |
| 7 | Append a hash-chained event with before/after snapshots. | The accepted event leaves the hash unchanged. |
| 8 | Emit an idempotent aftermath receipt after terminal resolution. | Fewer than two receipt types or duplicate commit key. |

## D20 Checks

The implementation follows the official sequence: roll one d20; roll two and keep the higher or lower for advantage/disadvantage; add the relevant ability modifier, proficiency when applicable, and circumstantial modifiers; then compare the total with the DC. Equaling or exceeding the DC succeeds.[1]

```text
result = keptD20 + abilityModifier + proficiencyIfApplicable + circumstantialModifier
success = result >= DC
```

The resolver limits DC to the official typical 5–30 range. It does not treat a natural 1 or natural 20 as automatic failure/success for ordinary ability checks; templates can add a mode-specific rule only if the game’s ruleset explicitly requires one.

A check is exposed only when success and meaningful failure are both possible. A failure must change the mechanism, route, danger clock, resource, opportunity, or legality before another roll can be offered.

## Combat HP and Damage

```text
rawDamage = (attackerPower + skillBonus + seededVariance − defenderDefense) × multiplier
damage = max(minimumDamage, floor(rawDamage))
newHP = clamp(oldHP − damage, 0, maximumHP)
active = newHP > 0
```

An attack first resolves its d20/accuracy check. A hit writes damage to the HP ledger. When a target reaches zero, the resolver immediately commits the corresponding terminal or phase state before narration. A miss still produces a defined cost, opportunity shift, danger tick, or resource change so the event cannot be empty.

| Combat guard | Rule |
| --- | --- |
| HP persistence | Every damage event stores old HP, damage, and new HP through the event’s before/after hashes. |
| Zero-HP finality | An inactive actor cannot be targeted or narrated as fighting unless a separate, explicit revival mutation occurs. |
| Turn bound | `maxTurns` is 3–12 in the supplied libraries; the global schema allows 1–30. |
| Bound behavior | The template declares defeat, costly escape, enemy withdrawal, or another terminal state. Active combat is forbidden. |
| Partial success | Damage or objective progress remains applied while a separate cost is added. |

## Flee Resolution

Flee uses opposed progress and danger clocks. The route is a first-class object with availability and lock state.

| Roll result | Mandatory mutations | Terminal test |
| --- | --- | --- |
| Success | Advance `escape`; apply stamina, item, or positional cost. | If escape fills, commit `fled`. |
| Failure | Advance `cornered`; apply cost; lock or alter the current route. | If cornered fills, commit `defeat`. |
| Both clocks fill | Preserve escape but apply the declared severe cost. | Commit `partial` or `fled`, never remain active. |
| Turn bound | Apply the template’s forced terminal. | Always terminal. |

This structure makes “flee” mechanically real and prevents a failed attempt from returning the same choice in the same state.

## Parley and Leverage

Parley validates threshold facts before consuming named leverage. The leverage must have provenance, a numeric or categorical value, relevance to the opposition, and a one-use rule.

```text
eligible = leverage.available >= cost
        && every(thresholdFact == true)
        && approach.notLocked

on acceptance: consume leverage → apply concession → commit negotiated
on refusal: consume/discredit leverage → apply danger/fallback → lock approach if nonterminal
```

A negotiation roll cannot compel an impossible concession. If a threshold is unmet, the resolver rejects the action without consuming a turn and the UI states the missing condition.

## Progress/Danger Clock Resolution

Complex social, chase, deadline, and skill challenges use paired clocks. Progress clocks make ongoing effort and impending trouble visible; racing clocks provide definite outcomes when one side fills.[2]

| State | Result |
| --- | --- |
| Success clock fills first | Apply success outcome and commit its terminal state. |
| Danger clock fills first | Apply fallback consequence and commit defeat/withdrawal/escalation. |
| Both fill together | Preserve the promised success, add the partial cost, and commit `partial`. |
| Neither fills | Persist all ticks/costs and offer a changed next state. |

The implementation treats an exact-target d20 result as an optional mixed success for clock actions. Projects may substitute a different mixed-result rule, but they must retain success preservation and terminal guarantees.

## PYOA Crisis Resolution

A crisis fork is an atomic commit, not an extended negotiation. A valid option writes five durable classes of state:

| State class | Example |
| --- | --- |
| Exclusive choice | `choice-group:charter-holder = keep-charter` |
| Positive fact | `player-holds-charter = true` |
| Opposed lock | `fact:baron-holds-charter = locked` |
| Delayed callback | `hearing.player-evidence = unlocked` |
| Ending eligibility | `ending.free-mills = true` |

The convergence record stores `preserve-flags = true`. A later common scene may share topology and prose structure, but it must query the fork facts to vary evidence, relationships, available actions, and ending gates. Persistent state and delayed callbacks allow branches to merge without erasing consequences.[3]

## Forced Terminal Closure

`enforceTurnBound` executes only when `turn >= maxTurns` and the encounter is not already terminal. Every template supplies an outcome with at least one state delta and a terminal state.

| Family | Permitted forced terminal |
| --- | --- |
| Combat | Defeat with fail-forward, costly escape, enemy withdrawal, timed draw |
| Trap/hazard | Trigger once and become spent, seal route and open detour, force escape with injury |
| Social | Opponent executes declared fallback; evidence remains consumed/discredited |
| PYOA | Deadline/default branch writes facts, callback, convergence state, and ending eligibility |

The GM cannot postpone, reinterpret, or silently reopen a forced terminal.

## Event and Receipt Integrity

Every accepted action appends an event whose `beforeHash` must equal the previous event’s `afterHash`. The aftermath commit key combines encounter ID, terminal state, and template version. Reapplying the same receipt is rejected.

| Integrity gate | Assertion |
| --- | --- |
| Event usefulness | Before/after hash changes or a terminal state is committed. |
| Ledger range | HP remains within 0…maximum; clocks within 0…segments. |
| Terminal consistency | `terminal=true` implies a valid `terminalState`. |
| Turn bound | Turn count cannot continue beyond forced closure. |
| Receipt minimum | At least two distinct receipt types. |
| Idempotency | Each commit key is applied once. |

## GM Boundary

The situation packet delivered to the GM contains the committed event, terminal state, receipt preview, actor identities, biome/site facts, and prohibited contradictions. The GM may choose metaphor, dialogue, action choreography, and emotional framing. It must not change dice, damage, HP, clocks, route legality, faction deltas, item ownership, quest ticks, terminality, or the identity of the encounter.

## References

[1]: https://www.dndbeyond.com/sources/dnd/br-2024/playing-the-game "D&D Beyond Basic Rules: Playing the Game"
[2]: https://bladesinthedark.com/progress-clocks "Blades in the Dark SRD: Progress Clocks"
[3]: https://sub-q.com/making-interactive-fiction-the-branch-and-the-merge/ "Making Interactive Fiction: The Branch and the Merge"
