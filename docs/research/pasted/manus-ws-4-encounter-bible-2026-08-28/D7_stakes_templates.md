# D7 — Stakes Clarity Templates

The authoritative catalog is [`D7_stakes_templates.json`](./D7_stakes_templates.json). A stakes packet is a **pre-resolution promise**: if the interface displays an outcome, the engine must be capable of committing it exactly as described.

## Stakes Packet

| Section | Player-facing content | Engine content |
| --- | --- | --- |
| Situation | Threat, demand, hazard, or decision | Encounter ID, template version, world snapshot |
| Opposition intent | What the opposing force will do if unopposed | Fallback transition and deadline |
| Commit point | What action begins or locks the conflict | Trigger event and cancellation policy |
| Approaches | Named actions with method and requirements | Resolver ID, legality predicate, seeded RNG inputs |
| Outcomes | Success, partial, failure, and timeout changes | Ordered ledger mutations and terminal test |
| Receipt preview | Reward/cost categories, not necessarily exact random item | Required receipt types and loot-table reference |

## Clarity Rules

A label must use a **verb plus object or purpose**. “Act,” “Continue,” and “Try again” are invalid. “Break the ward with Arcana,” “Flee through the service hatch,” and “Spend Mara’s statement to expose Vale” are valid because they describe a method and a target.

Probability must be honest. DnD actions expose the check, DC/AC, modifier source, and advantage/disadvantage. LitRPG actions expose tier, objective, route or concession requirements, and resource costs. RPG leverage states both its value and whether it will be consumed or discredited. PYOA forks state the exclusive fact, lockout, delayed payoff, and ending path.

## Combat Example

> **Glassback Basilisk — Elite-Boss**  
> Objective: reduce Core HP from 90 to 0 after breaking 2 mirror plates. Maximum duration: 12 turns. At the bound, the chamber collapses; if the service hatch is marked, the party escapes with one injury and no boss loot; otherwise the encounter resolves as defeat.
>
> | Choice | Success | Failure or cost |
> | --- | --- | --- |
> | **Fight: shatter a mirror plate** | Deal resolved damage; at 0 plate HP, expose the core and gain 1 stagger turn | Reflected magic can damage the caster; spent resources remain spent |
> | **Flee: service hatch** | End combat at the drainage gallery; lose 1 carried relic and record `fled` | If unmarked, spend one turn locating it while Collapse advances 2 segments |
> | **Negotiate: offer the Sun Lens** | If the basilisk is sapient and below 35% HP, end combat under a truce; lose the Lens and gain Archive access | Before threshold, the action is shown as unavailable with the reason; after rejection, the Lens offer is discredited |
> | **Accept defeat** | End combat immediately; wake in the collector’s pens and open an escape quest | Lose unbound currency and take the `fractured` condition |

Every option changes state and can terminate. “Flee” is not prose attached to another attack round.

## DnD Check Example

> **Disable the pendulum blades.** Make a DC 15 Dexterity check using thieves’ tools. Add Dexterity and proficiency if proficient with thieves’ tools. You have advantage if the clockwork pin was recovered; you have disadvantage while the corridor is flooded.
>
> **Success:** the blades lock, the hazard ends, the east route opens, and the dungeon ledger records `pendulum_blades: disarmed`.  
> **Failure:** the mechanism advances one sweep, forcing a DC 14 Dexterity saving throw for half damage; the access panel bends shut, so this exact tools approach cannot be repeated. The player may jam the blades physically, retreat, or take the flooded bypass.

The official D&D procedure compares a d20 plus modifiers with a target number, and the rules recommend rolling when both success and meaningful failure are possible.[1]

## Partial-Success Example

> **Outcome: success with cost.** You corner the courier and recover the coded manifest. During the struggle, she rings the dock bell: the manifest enters inventory and the quest advances, while the Watch Alert clock gains two segments.

The recovered manifest is not removed by the complication. This follows the principle that a consequence should not negate the successful part of a mixed result.[2]

## RPG Leverage Example

> **Spend Mara’s signed statement to expose Captain Vale.** Leverage 3/3; the document is authentic and addresses Vale’s secret payoff. On success, Vale withdraws the arrest order, Watch standing changes by −1, Mill Guild standing changes by +1, and the confrontation ends as `negotiated`. On refusal, the statement becomes public anyway, Vale orders the river gate closed, and the evidence is consumed; repeating this demand is impossible.

Leverage has four required properties: **provenance**, **relevance**, **value**, and **consumption rule**. Generic topic mentions are not leverage.

| Property | Question | Invalid example |
| --- | --- | --- |
| Provenance | Where did the leverage come from? | “I know things.” |
| Relevance | Why can it change this actor’s decision? | Threatening a clerk with unrelated gossip |
| Value | How much progress does it buy? | Unlimited automatic success |
| Consumption | What prevents infinite reuse? | Repeating the same accusation forever |

## Withdrawal Example

> **Withdraw and concede the night market.** The confrontation ends now. The player preserves Mara’s statement, loses temporary access to the night market, changes Dock Union standing by −1, and schedules a recovery opportunity at dawn. The same confrontation cannot immediately respawn because its major-conflict cooldown is 15 turns.

Withdrawal is a valid terminal outcome, not a request that the GM may ignore.

## PYOA Fork Example

> **Keep the Millstone Charter.** Set `charter_holder = player`; lock `baron_holds_charter`; schedule `flood_levy_hearing.player_evidence`; add eligibility for `ending.free_mills`. Immediate cost: Baron standing −2.
>
> **Surrender the Millstone Charter.** Set `charter_holder = baron`; lock `player_holds_charter`; schedule `flood_levy_hearing.no_original`; add eligibility for `ending.pardoned_village`. Immediate benefit: village amnesty; immediate cost: public arbitration becomes unavailable.

The paths may converge at the flood season, but the hearing text, available evidence, faction reaction, and endings remain branch-sensitive. State persistence and delayed callbacks are established techniques for keeping merged interactive narratives responsive.[3]

## Resolver Guard

```ts
function assertDisplayable(approach: Approach, state: WorldState): void {
  if (!resolverRegistry.has(approach.method)) throw new Error("Missing resolver");
  if (!approach.onSuccess?.stateChanges.length) throw new Error("No success delta");
  if (!approach.onFailure?.stateChanges.length) throw new Error("No failure delta");
  if (!retryChangesState(approach)) throw new Error("Unchanged retry possible");
  if (!requirementsAreExplainable(approach.requirements, state)) {
    throw new Error("Hidden legality requirement");
  }
}
```

## References

[1]: https://www.dndbeyond.com/sources/dnd/br-2024/playing-the-game "D&D Beyond Basic Rules: Playing the Game"
[2]: https://bladesinthedark.com/consequences-harm "Blades in the Dark SRD: Consequences & Harm"
[3]: https://sub-q.com/making-interactive-fiction-the-branch-and-the-merge/ "Making Interactive Fiction: The Branch and the Merge"
