# Encounter-aware ChoiceCompiler Architecture Packet

## 1. Overview

The Encounter-aware ChoiceCompiler addresses the critical gap in the Path A (2026-08-28c) release where players experienced "combat purgatory" and "flee/parley loops" [1]. While the ArcDirector successfully achieved spawn liveness (generating `encounterSpawn` receipts), the system lacked the terminal authority to conclude encounters meaningfully [1]. This packet defines the ChoiceCompiler's rules for filtering and presenting valid player actions during an `activeEncounter`, ensuring that encounters progress toward resolution rather than stagnating in repetitive or nonsensical loops.

## 2. Binding Architectural Decisions (29a)

The following decisions are binding constraints for the 29a implementation batch:

*   **Pad Family Filtering:** During an `activeEncounter`, irrelevant pad families (e.g., travel, merchant, Earth junk, generic inspect) are strictly forbidden [1].
*   **Action Exhaustion:** Flee and parley actions are subject to threshold limits; once exhausted, they are removed from the legal action pool [1].
*   **Registry Integration:** Mode-specific legal combat edges must be sourced directly from the BeatContract registry [1].
*   **Minimum Meaningful Choice:** The compiler must guarantee a minimum number of valid, consequential choices (e.g., attacks, tactical maneuvers) are presented to the player during an encounter.
*   **Fallback Precedence:** If the Game Master (GM) fails mid-encounter, the system must utilize deterministic fallbacks to advance the state [1].
*   **Terminal Synchronization:** The ChoiceCompiler must synchronize with the Encounter Terminal FSM to recognize `encounterCleared` receipts and unlock standard action pools [1].

## 3. Configurable Defaults

While the decisions above are binding, the following parameters are configurable defaults that can be tuned per mode or encounter type:

*   **Flee/Parley Thresholds:** Default maximum attempts for flee or parley before exhaustion (e.g., 2 attempts).
*   **Minimum Choice Count:** Default minimum number of valid choices presented to the player (e.g., 3 choices).
*   **Mode-Specific Weights:** Default weights for prioritizing certain combat edges based on the active mode (LitRPG, DnD, RPG, PYOA).

## 4. Deterministic Invariants

The Encounter-aware ChoiceCompiler enforces the following deterministic invariants:

1.  **Encounter State Lock:** If `activeEncounter` is true, no travel or merchant pad families can be compiled into the choice list.
2.  **Exhaustion Lock:** If `flee_attempts >= max_flee_attempts`, the `flee` action family cannot be compiled.
3.  **Registry Sourcing:** All combat-related action families compiled must have a corresponding, valid entry in the BeatContract registry for the current mode.
4.  **Terminal Unlock:** The `activeEncounter` state can only be set to false upon receipt of an `encounterCleared` payload.

## 5. State and Transition Rules

The ChoiceCompiler operates in tandem with the Encounter Terminal FSM. The following table outlines the rules for compiling choices based on the current encounter state.

| Encounter State | Allowed Pad Families | Forbidden Pad Families | Flee/Parley Status | Registry Sourcing |
| :--- | :--- | :--- | :--- | :--- |
| `idle` | All standard families (travel, merchant, inspect, etc.) | None | N/A | Standard |
| `engaged` | Combat, Tactical, Flee (if < threshold), Parley (if < threshold) | Travel, Merchant, Earth junk, Generic inspect | Tracked per turn | Mode-specific combat edges |
| `resolving` | Terminal choices (e.g., loot, spare, execute) | All standard and combat families | Locked | Terminal edges |
| `terminal` | All standard families | None | Reset | Standard |

## 6. Receipt Payload Examples

The ChoiceCompiler relies on receipts to track state and enforce rules.

### 6.1. encounterSpawn Receipt

This existing receipt initiates the `activeEncounter` state.

```json
{
  "receipt_type": "encounterSpawn",
  "turn": 12,
  "entity_id": "mob_keep_wraith_01",
  "mode": "DnD s69",
  "flee_threshold": 2,
  "parley_threshold": 1
}
```

### 6.2. encounterCleared Receipt

This new receipt terminates the `activeEncounter` state and unlocks standard choices.

```json
{
  "receipt_type": "encounterCleared",
  "turn": 15,
  "entity_id": "mob_keep_wraith_01",
  "outcome": "victory",
  "rewards": ["xp_235", "item_wraith_essence"]
}
```

## 7. CSV-Ready Edge-Matrix Fields

The following fields define the structure for the CSV edge matrix used to configure mode-specific rules.

*   `mode_id`: The identifier for the game mode (e.g., LitRPG, DnD).
*   `encounter_type`: The category of the encounter (e.g., combat, crisis).
*   `allowed_families`: A comma-separated list of permitted action families.
*   `forbidden_families`: A comma-separated list of explicitly forbidden action families.
*   `max_flee_attempts`: Integer value defining the flee exhaustion threshold.
*   `max_parley_attempts`: Integer value defining the parley exhaustion threshold.
*   `min_meaningful_choices`: Integer value defining the minimum required valid choices.
*   `fallback_edge`: The default action family to compile if the primary logic fails.

## 8. Edge Cases and Fallbacks

*   **GM Failure Mid-Encounter:** If the LLM fails to generate valid responses or choices, the ChoiceCompiler will utilize the `fallback_edge` defined in the CSV matrix (e.g., a basic "attack" or "defend" action) to ensure the encounter progresses and the minimum choice count is met [1].
*   **All Meaningful Choices Exhausted:** If all contextual choices (flee, parley, specific tactics) are exhausted or invalid, the compiler must guarantee the `min_meaningful_choices` by pulling from a generic pool of mode-legal basic attacks or defensive maneuvers from the BeatContract registry.

## 9. Acceptance Tests

1.  **Test: Forbidden Pad Exclusion:** Assert that when `activeEncounter` is true, compiling choices with travel or merchant families returns an error or filters them out entirely.
2.  **Test: Flee Exhaustion:** Assert that after `max_flee_attempts` is reached, the `flee` action family is no longer compiled in the choice list.
3.  **Test: Registry Compliance:** Assert that all compiled combat choices during an encounter exist in the BeatContract registry for the active mode.
4.  **Test: Terminal Synchronization:** Assert that receiving an `encounterCleared` receipt sets `activeEncounter` to false and allows standard pad families to be compiled on the subsequent turn.
5.  **Test: Fallback Precedence:** Assert that if the primary choice generation fails, the deterministic fallback edge is successfully compiled.

## 10. Open Evidence Requests

*   What are the exact performance metrics (latency, token usage) for querying the BeatContract registry during an active encounter?
*   Are there any specific encounter types (e.g., boss fights) that require dynamic adjustment of the flee/parley thresholds mid-encounter?

## References

[1] SynapticGM — POST-28c SCORE BOOST RESEARCH, `/home/ubuntu/SynapticGM_score_boost_post_28c_2026-08-27/sources/pasted_content.txt`
