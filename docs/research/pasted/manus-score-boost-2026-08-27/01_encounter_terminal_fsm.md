# Encounter Terminal FSM Architecture Packet

## 1. Executive Summary

This packet defines the Encounter Terminal Finite State Machine (FSM) architecture for the SynapticGM consumer application, addressing the critical gap identified in the 2026-08-28c deployment. While the previous iteration successfully achieved spawn liveness, it failed to establish terminal authority, leading to prolonged combat states ("combat purgatory") and unresolved encounters [1]. The new FSM enforces strict state transitions, deterministic fallbacks, and hard caps to ensure encounters reach a terminal state, thereby improving the Gemini evaluation scores from the current ~1/10 baseline [1].

## 2. State Machine Design

The Encounter Terminal FSM governs the lifecycle of an encounter, primarily focusing on LitRPG and DnD modes. It ensures that encounters transition smoothly from initiation to resolution without entering endless loops.

### 2.1 State Definitions

The FSM consists of four primary states:

*   **Idle:** The default state where no active encounter is present. The system is awaiting triggers from the `ArcDirector` or player actions.
*   **Engaged:** The active encounter state. The player is actively interacting with the encounter (e.g., combat, negotiation). This state is subject to hard caps to prevent infinite loops.
*   **Resolving:** A transitional state where the outcome of the encounter is being calculated and finalized.
*   **Terminal:** The final state of the encounter. The outcome is committed to the code, and the GM narrates the result. The FSM then resets to the Idle state.

### 2.2 Transition Rules and Hard Caps

To prevent the "combat purgatory" observed in 28c (e.g., LitRPG s18 T9–300, DnD s69 Wraith flee/parley loop) [1], strict transition rules and hard caps are enforced during the Engaged state.

| Current State | Trigger/Condition | Next State | Action/Commit |
| :--- | :--- | :--- | :--- |
| Idle | `ArcDirector` forced spawn or player trigger | Engaged | Emit `encounterSpawn` receipt |
| Engaged | Player achieves victory/escape | Resolving | Calculate rewards/consequences |
| Engaged | Hard Cap: Failed flee attempts reach limit | Resolving | Force combat or capture |
| Engaged | Hard Cap: Failed parley attempts reach limit | Resolving | Force combat or hostility |
| Engaged | Hard Cap: Max engaged turns reached | Resolving | Force deterministic outcome (e.g., GM intervention, escape) |
| Resolving | Calculations complete | Terminal | Commit code, GM narrates outcome |
| Terminal | Cleanup complete | Idle | Emit `encounterCleared` receipt |

**Configurable Defaults vs. Binding Decisions (29a):**
*   **Binding (29a):** The existence of the four states, the requirement for hard caps, and the mandatory emission of `encounterSpawn` and `encounterCleared` receipts [1].
*   **Configurable Defaults:** The specific numerical limits for failed flee, failed parley, and max engaged turns (e.g., 3 failed flees, 15 max turns) are configurable per mode and encounter type.

## 3. Lifecycle Invariants and Precedence

The FSM must adhere to strict invariants to maintain system stability and deterministic behavior.

*   **Idempotency:** State transitions must be idempotent. Re-evaluating a transition condition should not cause unintended side effects if the state has already changed.
*   **Precedence:** Hard caps take precedence over player choices. If a hard cap is reached, the FSM transitions to Resolving regardless of the player's attempted action.
*   **Single Active Encounter:** Only one encounter can be in the Engaged or Resolving state at any given time.

## 4. Receipts and Payloads

The FSM communicates state changes via receipts. The 29a architecture introduces the `encounterCleared` receipt to complement the existing `encounterSpawn` [1].

**Example `encounterSpawn` Payload:**
```json
{
  "type": "encounterSpawn",
  "encounterId": "enc_12345",
  "source": "ArcDirector",
  "entityId": "Keep Wraith",
  "timestamp": "2026-08-27T10:00:00Z"
}
```

**Example `encounterCleared` Payload:**
```json
{
  "type": "encounterCleared",
  "encounterId": "enc_12345",
  "outcome": "victory",
  "rewards": {"xp": 50, "items": ["Wraith Essence"]},
  "timestamp": "2026-08-27T10:15:00Z"
}
```

## 5. Deterministic Fallback and ArcDirector Interaction

*   **ArcDirector Forced Spawns:** The FSM must seamlessly handle forced spawns from the `ArcDirector` (e.g., Pact-Hunter, Keep Wraith) [1]. These spawns immediately transition the FSM from Idle to Engaged.
*   **Deterministic Fallback:** If the GM fails to narrate or process an action mid-encounter, the FSM relies on a deterministic fallback mechanism. This ensures the encounter progresses based on code commits rather than stalling, preventing the GM from blocking the FSM.

## 6. Edge Cases and Eval Gates

*   **T50 Gate:** The evaluation harness will enforce a strict gate: if an encounter is spawned but not cleared by turn 50 (T50) in combat modes, it is considered a failure [1]. This ensures encounters do not drag on indefinitely.
*   **Edge Case: GM Failure during Resolving:** If the GM fails to narrate the terminal outcome, the FSM must still commit the code changes and emit the `encounterCleared` receipt, using a default fallback narrative.

## 7. Acceptance Tests

1.  **Test Flee Hard Cap:** Initiate an encounter. Attempt to flee repeatedly until the configurable limit is reached. Verify the FSM transitions to Resolving and then Terminal with a forced outcome.
2.  **Test Max Turns Hard Cap:** Initiate an encounter. Perform non-resolving actions until the max engaged turns limit is reached. Verify the FSM transitions to Resolving and Terminal.
3.  **Test Receipt Emission:** Initiate and resolve an encounter. Verify both `encounterSpawn` and `encounterCleared` receipts are emitted with correct payloads.
4.  **Test T50 Gate Failure:** Simulate an encounter that reaches T50 without resolution. Verify the evaluation harness flags it as a failure.

## 8. Open Evidence Requests

*   What are the specific numerical values for the configurable defaults (flee limits, parley limits, max turns) for LitRPG and DnD modes?
*   Are there any specific edge cases regarding the interaction between the FSM and the `ChoiceCompiler` during the Resolving state?

---
**References:**
[1] SynapticGM_score_boost_post_28c_2026-08-27/sources/pasted_content.txt
