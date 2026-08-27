# T4 — Encounter-Aware ChoiceCompiler Rules

**Priority:** P0  
**Dependency:** Encounter Terminal FSM state contract  
**Author:** Manus AI

## Compiler contract

The ChoiceCompiler is a projection of legal state transitions, not a prose suggestion generator. During an active encounter it must compile only actions that are legal for the current Encounter Terminal FSM phase, registered for the mode/beat, and capable of changing encounter state or resources. It may not create an escape hatch from the FSM by emitting ordinary exploration pads.[1]

> If `activeEncounter.phase ∈ {engaged, resolving}`, the encounter rules outrank general padding, model-proposed choices, and mode-default exploration choices.

## Rule precedence

| Rank | Rule source | Behavior |
|---:|---|---|
| 1 | Encounter FSM phase and terminal guard | Close choices in `resolving`; unlock ordinary choices only after committed `encounterCleared` |
| 2 | Safety and fatal-state rules | Suppress actions impossible under incapacitation, capture, or other authoritative status |
| 3 | Exhaustion counters | Remove flee/parley once their attempt cap is reached |
| 4 | BeatContract legal-edge registry | Admit only mode- and beat-valid encounter edges |
| 5 | Resource and target validation | Remove choices lacking a legal target, item, spell, resource, or prerequisite |
| 6 | Diversity/minimum-choice policy | Fill from registered consequential fallbacks; never from forbidden pad families |
| 7 | GM/model suggestions | May label or rank already legal actions; cannot legalize an edge |

A choice that fails any higher-ranked guard is excluded even when a model generated persuasive prose for it.

## Action-family rules by phase

| Encounter phase | Allowed families | Conditionally allowed | Forbidden families | Output behavior |
|---|---|---|---|---|
| `idle` | Mode-standard exploration, travel, merchant, inspect, social, quest, item use | BeatContract-dependent actions | None solely due to encounter state | Compile ordinary mode choices |
| `engaged` | `attack`, `defend`, `tactical`, `useEncounterItem`, `assist`, mode-legal `cast/skill`, registered objective interaction | `flee` below cap; `parley` below cap and only when opponent/beat permits; `surrender` when permitted | `travel`, `merchant`, Earth junk, `genericInspect`, unrelated crafting/rest, unrelated NPC topic, filler wait | Compile consequential encounter edges only |
| `resolving` | None as a new player action | A registered post-outcome decision may be rendered only after terminal commit | All ordinary, encounter, flee, and parley families | Return a resolving projection, not selectable choices |
| `terminal` | None from the old encounter | Post-encounter choices are compiled from the next `idle` projection | Every edge carrying the old `encounterId` | Wait for committed clear, then compile new-state choices |

“Earth junk” is the brief’s category for out-of-mode or irrelevant contemporary-object padding. Engineering should map the existing family identifiers to this policy rather than introducing a user-visible label.

## Meaningful-choice invariant

While `engaged`, the compiler should target **three** choices when the registry and state permit, with at least **two distinct consequence families**. This is a tunable presentation default, not permission to invent illegal actions. One legal choice is acceptable when state truly constrains the player; the compiler must report `choiceSetConstrained=true` rather than pad with travel, merchant, generic inspect, or inert dialogue.

Each emitted choice must include:

```ts
type CompiledEncounterChoice = {
  choiceId: string;
  encounterId: string;
  family: string;
  beatEdgeId: string;
  targetEntityIds: string[];
  consumesAttempt?: 'flee' | 'parley';
  expectedTransition:
    | 'remainEngaged'
    | 'mayResolve'
    | 'mustResolve';
  consequenceClass: string;
  idempotencyKey: string;
  displayLabel: string;
};
```

The player-facing `displayLabel` may be GM-polished only after the structural fields are fixed. If the label contradicts the registered edge, use the registry fallback label.

## Flee and parley exhaustion

| Counter condition | Flee behavior | Parley behavior |
|---|---|---|
| Below threshold | Compile only if current encounter registers the edge | Compile only if target disposition and beat register the edge |
| Action selected and succeeds | Stop compilation and enter `resolving` | Stop compilation and enter `resolving` with `parleyResolved` candidate |
| Action selected and fails below threshold | Increment corresponding counter; may compile again next turn | Increment corresponding counter; may compile again only if registry says terms can change |
| Action fails and reaches threshold | Remove immediately; if threshold rule requires escalation, enter `resolving` in same transaction | Remove immediately; apply hostility/escalation; either continue with combat edges or resolve deterministically |
| At or above threshold | Never emit, regardless of GM suggestion | Never emit, regardless of GM suggestion |

A non-advancing parley repeat counts as a failed attempt when it produces no new registered term, disposition delta, topic-stage change, or terminal candidate. Rewording the same request does not reset the budget.

## Mode-specific legal edges

The attached CSV is the initial 29a policy matrix. It identifies required edge families and defaults without pretending to know the repository’s exact edge ids. Engineering must bind each `registry_edge_requirement` to existing or newly registered BeatContract entries.

| Mode | Encounter emphasis | Required legal edges | Terminal pressure |
|---|---|---|---|
| LitRPG | Tactical combat with visible state/progression | Attack/skill, defend, item/tactic, conditional flee/parley | Shorter max engaged default; terminal may emit XP/quest delta only when registry authorizes it |
| DnD | Rules-facing combat plus negotiation | Attack/action, defend/help, spell/feature/item, conditional flee/parley/surrender | Wraith and similar threats cannot reoffer exhausted flee/parley |
| RPG | Consequence and social leverage | Confront, protect/assist, use leverage/quest prop, conditional disengage/commit terms | Encounter clear must hand off to committed NPC topic/quest branch |
| PYOA | Crisis fork rather than freeform combat padding | Commit branch, use key item, accept cost, overseer escalation | Crisis edges must culminate in `branchLocked`, not indefinite “buy time” |

## Deterministic fallback

If the model returns no valid choices or all suggestions are filtered, fallback selection uses this order:

1. Registered `mustResolve` edge whose guards are satisfied.
2. Registered defensive/tactical edge that advances an encounter clock or resource.
3. Registered basic mode action against a valid target.
4. FSM deterministic resolution when max-turn or exhaustion guard is reached.

The fallback must come from the current BeatContract registry. A global “inspect surroundings,” merchant visit, travel, random ambush, or unregistered generic attack is not an acceptable fallback.

## Terminal synchronization

`activeEncounter` remains true until the FSM’s atomic terminal commit emits `encounterCleared`. GM prose such as “the fight is over” is not sufficient. Conversely, once a valid clear is committed, the compiler may not emit any choice bound to the old encounter id. The next turn projects post-encounter state and compiles from `idle`.

The receipt consumer must be idempotent. Duplicate delivery of the same `encounterCleared.receiptId` produces no extra unlock, reward, or choice-set regeneration side effect.

## Choice telemetry

Each compilation records a run-scoped debug event with the FSM phase, considered edge ids, rejection reasons, exhaustion counters, selected fallbacks, and final choice ids. Player output contains only labels. Recommended rejection enums include `forbiddenDuringEncounter`, `attemptExhausted`, `missingRegistryEdge`, `guardFailed`, `invalidTarget`, `resourceUnavailable`, `staleEncounterId`, and `resolvingClosed`.

## Acceptance tests

| Test name | Assertion |
|---|---|
| `choice_encounter_forbids_travel` | No travel edge appears while engaged |
| `choice_encounter_forbids_merchant` | No merchant edge appears while engaged |
| `choice_encounter_forbids_earth_junk` | No out-of-mode Earth-junk edge appears while engaged |
| `choice_encounter_forbids_generic_inspect` | Generic inspect is suppressed; registered objective interaction remains possible |
| `choice_flee_removed_at_threshold` | Flee is absent at cap and cannot be restored by GM text |
| `choice_parley_removed_at_threshold` | Parley is absent at cap; repeated rephrasing does not reset counter |
| `choice_edges_are_registered_for_mode_and_beat` | Every output edge resolves to a current BeatContract entry |
| `choice_resolving_has_no_selectable_action` | No new action is accepted while terminal commit is pending |
| `choice_clear_unlocks_next_turn_only` | Old encounter edges vanish and ordinary choices return after committed clear |
| `choice_invalid_model_output_uses_registered_fallback` | Fallback advances state without forbidden padding |
| `choice_constrained_set_does_not_pad` | A true one-choice state reports constrained rather than inventing filler |
| `choice_replay_is_stable` | Same state, registry version, seed, and counters produce the same structural choices |

## References

[1]: ../sources/pasted_content.txt "SynapticGM — POST-28c SCORE BOOST RESEARCH brief"
