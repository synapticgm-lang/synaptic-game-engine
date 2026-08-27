# Implementation Backlog and Evaluation-Harness Gate Additions

This architecture packet defines the ranked implementation backlog and evaluation-harness gate additions for the 29a batch, as derived from the post-28c score boost research [1]. The focus is on moving external scores toward 4.5–6.5/10 by addressing terminal authority, branch locking, and deterministic state transitions.

## 1. Ranked Implementation Backlog

The following table details the ranked implementation backlog, prioritizing P0 items critical for the 29a batch. These items are assigned provisional owner-file responsibilities based on the provided constraints and architecture, without inventing new repository paths.

| ID | Priority | Responsibility / Owner File | Description | Dependencies | Test Names | Rollback & Observability Notes |
|----|----------|-----------------------------|-------------|--------------|------------|--------------------------------|
| IMP-01 | P0 | `EncounterTerminalFsm` | Implement the Encounter Terminal FSM (idle → engaged → resolving → terminal). Must include hard caps for failed flee/parley and max engaged turns. | None | `test_fsm_terminal_states`, `test_fsm_hard_caps` | Rollback: Revert to 28c `encounterSpawn` only. Observability: Log state transitions and hard cap triggers. |
| IMP-02 | P0 | `ChoiceCompiler` | Update ChoiceCompiler to be encounter-aware. Forbid travel, merchant, Earth junk, and generic inspect pads under `activeEncounter`. Remove flee/parley options after threshold. | IMP-01 | `test_choice_compiler_encounter_lock`, `test_choice_compiler_thresholds` | Rollback: Disable encounter-aware logic. Observability: Track forbidden pad suppression events. |
| IMP-03 | P0 | `pyoaBranchLedger` | Enforce PYOA branch ledger locks. Crisis receipts must deterministically lock mutually exclusive branches. Exhausting "Buy time" / "Call for help" must force a fork or overseer escalation. | None | `test_pyoa_branch_lock`, `test_pyoa_exhaustion_fork` | Rollback: Revert to 28c narrative-only branching. Observability: Monitor branch lock events and forced forks. |
| IMP-04 | P0 | `npcTopicFsm` | Implement NPC topic exhaustion to branch commit (fresh → engaged → exhausted → committed branch). Ensure combat terminals do not revert to dialogue purgatory. | IMP-01 | `test_npc_topic_exhaustion`, `test_npc_combat_terminal_no_revert` | Rollback: Revert to 28c dialogue loops. Observability: Log topic exhaustion and branch commit events. |
| IMP-05 | P1 | `STATUS_Formatter` | Implement STATUS prompt leak firewall. Strip specific tags (e.g., `[GM_VOICE]`, `[PYOA]`, `[RenderFallbackUsed]`) from player-facing STATUS, retaining them only in `turns.jsonl` for debugging. | None | `test_status_firewall_strip`, `test_status_firewall_debug_retention` | Rollback: Disable tag stripping. Observability: Log stripped tags. |
| IMP-06 | P1 | `EntityScrubPolicy` | Implement entity scrub scope allowlist policy. Active mobs, inventory items, quest props, named NPCs, and location titles must never be replaced by generic terms. | None | `test_entity_allowlist_enforcement`, `test_entity_scrub_collateral` | Rollback: Revert to 28c scrub behavior. Observability: Track collateral scrub hits. |
| IMP-07 | P1 | `HookContract_T12` | Implement the Free 12-turn hook contract. Define success criteria (level tick, quest stage-2 receipt, resolved encounter, or PYOA branch lock by T12). | IMP-01, IMP-03 | `test_hook_contract_success`, `test_hook_contract_failure` | Rollback: Disable T12 hook evaluation. Observability: Monitor T12 success/failure rates. |

## 2. Evaluation-Harness Gate Additions

The following JSON Schema defines the evaluation-harness gate additions for resolution, branch, and hook gates. These additions are critical for ensuring that the 29a batch achieves terminal authority and branch locking.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "EvalHarnessGates_29a",
  "type": "object",
  "properties": {
    "resolution_gate": {
      "type": "object",
      "properties": {
        "encounter_cleared": {
          "type": "boolean",
          "description": "Must be true if an encounter was spawned and is now resolved."
        },
        "terminal_state": {
          "type": "string",
          "enum": ["escape", "victory", "defeat", "capture", "parleyResolved"],
          "description": "The final state of the encounter FSM."
        },
        "max_turns_exceeded": {
          "type": "boolean",
          "description": "True if the encounter exceeded the maximum allowed engaged turns."
        }
      },
      "required": ["encounter_cleared", "terminal_state", "max_turns_exceeded"]
    },
    "branch_gate": {
      "type": "object",
      "properties": {
        "branch_locked": {
          "type": "boolean",
          "description": "Must be true if a crisis receipt was issued."
        },
        "mutually_exclusive_paths_disabled": {
          "type": "boolean",
          "description": "True if alternative paths are locked out after a branch commit."
        }
      },
      "required": ["branch_locked", "mutually_exclusive_paths_disabled"]
    },
    "hook_gate": {
      "type": "object",
      "properties": {
        "t12_success_criteria_met": {
          "type": "boolean",
          "description": "True if at least one of: level tick, quest stage-2 receipt, resolved encounter, or PYOA branch lock occurred by T12."
        },
        "purgatory_detected": {
          "type": "boolean",
          "description": "True if spawn-only combat enters purgatory by T15."
        }
      },
      "required": ["t12_success_criteria_met", "purgatory_detected"]
    }
  },
  "required": ["resolution_gate", "branch_gate", "hook_gate"]
}
```

### 2.1 Deterministic Invariants and Rules

The evaluation harness enforces the following deterministic invariants:

1.  **Encounter Resolution:** If `encounterSpawn` is logged, `encounterCleared` MUST be logged before T50 on combat modes, or the resolution gate fails.
2.  **Branch Locking:** If a `crisis` receipt is logged, `branchLocked` MUST be true by T30, or the branch gate fails.
3.  **Hook Success:** By T12, the player MUST have one of: level tick, quest stage-2 receipt, resolved encounter, or PYOA branch lock. If none are present, the hook gate fails.
4.  **Purgatory Prevention:** Spawn-only combat that enters purgatory by T15 results in an immediate hook gate failure.

### 2.2 Quarantine Compatibility and Replay-Hash Requirements

The new evaluation gates are fully compatible with the existing 28c eval quarantine system. Any run failing the new `resolution_gate`, `branch_gate`, or `hook_gate` will be quarantined for review.

The replay hash mechanism from 28c is retained. All state transitions, receipts, and branch locks must be deterministically reproducible using the same seed and replay hash. The evaluation harness will verify this by re-running quarantined sessions and comparing the resulting state and telemetry.

### 2.3 Cross-Run Bleed Detection

The evaluation harness will include specific checks to detect Gemini cross-run bleed, as noted in the 28c telemetry analysis. This involves scanning the `turns.jsonl` for entities, states, or prompts that leaked from previous sessions or different modes (e.g., RPG regression to LitRPG logic).

## 3. Explicit Non-Goals

The following are explicitly rejected for the 29a batch and are not goals of this architecture packet:

*   Scrub-only batch solutions.
*   Prompt-only interrupt solutions.
*   Random ambushes.
*   Implementation of a second LLM critic path.
*   Defaulting to a stronger Free model.
*   Stagnation Mid writer before the terminal FSM is implemented.

## 4. Open Evidence Requests

*   **Score Ceiling Model:** Clarification is needed on whether a 6/10 portfolio average is achievable in one batch (29a) versus an 8/10 average requiring subsequent batches (29b, three-batch).
*   **Collateral Scrub Metrics:** Specific target hits (aiming for 0) for collateral tokens per worst cell need to be defined for the acceptance metrics.

## References

[1] SynapticGM — POST-28c SCORE BOOST RESEARCH, `SynapticGM_score_boost_post_28c_2026-08-27/sources/pasted_content.txt`.
