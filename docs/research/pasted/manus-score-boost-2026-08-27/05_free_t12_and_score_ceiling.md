# SynapticGM Architecture Packet: Free 12-Turn Hook Contract & Honest Score-Ceiling Model

## 1. Executive Summary & Scope

This packet defines the **Free 12-turn hook contract** (Deliverable T7) and the **Honest score-ceiling model** (Deliverable T9) for the SynapticGM 29a architecture batch. The objective is to resolve the gap between spawn liveness (achieved in 28c) and terminal authority, thereby lifting external Gemini-style evaluation scores from ~1/10 toward 4.5–6.5/10 on worst cells [1]. 

## 2. Free 12-Turn Hook Contract

The Free 12-turn hook contract establishes deterministic invariants for early-game retention. To satisfy the hook, the game must progress past initial spawn states into definitive outcomes.

### 2.1 Success Criteria (T12)

By Turn 12 (T12), the player **must** have obtained at least one of the following success receipts:
*   `levelTick`: Player character advances a level.
*   `questStage2`: A quest advances from its initial stage to stage 2.
*   `encounterCleared`: An active encounter reaches a terminal state (escape, victory, defeat, capture, or parleyResolved).
*   `branchLocked`: A mutually exclusive narrative or choice branch is permanently committed (e.g., PYOA).

### 2.2 Explicit Failure Case (T15)

If an encounter is spawned but remains unresolved, entering a "purgatory" state (e.g., looping flee/parley without resolution) by Turn 15 (T15), this constitutes a definitive **hook NO** failure [1]. Spawn-only liveness is insufficient.

### 2.3 Per-Mode T1–12 Beat Scripts (Pointer Cards)

These pointer cards define the expected beat progression per mode to guarantee a success receipt by T12.

| Mode | Pointer Card Beat Script (T1-T12) | Target Success Receipt by T12 |
| :--- | :--- | :--- |
| **LitRPG** | Spawn -> Introduce UI/Stats -> Trigger Combat -> Resolve Combat (Victory/Defeat) | `encounterCleared` or `levelTick` |
| **DnD** | Spawn -> Dialogue/Parley -> Exhaust Topic -> Combat/Escape | `encounterCleared` |
| **RPG** | Spawn -> Quest Hook -> Exhaust NPC Topic -> Commit Branch | `questStage2` or `branchLocked` |
| **PYOA** | Spawn -> Initial Crisis -> Exhaust Buy Time/Call Help -> Force Fork | `branchLocked` |

### 2.4 Success and Failure Examples

*   **Success Example (LitRPG):** T1-T4: Player explores. T5: `encounterSpawn` (combat). T6-T8: Player engages. T9: Combat concludes with victory; `encounterCleared` receipt generated. T12 condition met.
*   **Failure Example (DnD):** T1-T4: Player explores. T5: `encounterSpawn` (Wraith). T6-T14: Player repeatedly attempts to flee or parley, but the state machine loops without resolving (Wraith flee/parley loop). T15 reached with no terminal outcome; hook fails [1].

## 3. Honest Score-Ceiling Model

This section provides a realistic assessment of achievable Gemini-style scores across architectural batches, addressing why 8/10 is not a one-batch promise [1].

### 3.1 Portfolio Ranges (29a vs 29b vs Three-Batch)

| Batch | Scope & Focus | Expected Score Range | Rationale |
| :--- | :--- | :--- | :--- |
| **29a** | Encounter Terminal FSM, Entity Scrub Scope, ChoiceCompiler locks, STATUS firewall, Branch commits [1]. | 4.5 – 6.5 / 10 | Resolves terminal authority and purgatory loops. Fixes critical regressions (e.g., `the mark` scrub, prompt leaks). Achieves baseline structural integrity but lacks advanced narrative pacing. |
| **29b** | Narrative pacing, advanced NPC memory, dynamic world reactivity. | 6.5 – 7.5 / 10 | Builds on 29a's structural stability to improve the quality of the generated text and context retention over longer sessions. |
| **Three-Batch** | Complex multi-actor interactions, long-term consequence tracking, stylistic refinement. | 7.5 – 8.5 / 10 | Achieves high-tier consistency and narrative depth required for 8/10+ scores. |

### 3.2 Why 8/10 is Not a One-Batch Promise

Reaching an 8/10 average portfolio score requires not just structural correctness (which 29a addresses), but also high-quality, contextually rich narrative generation and long-term coherence. Batch 29a focuses strictly on state machine invariants (Terminal FSM, branch locking) to fix the 1/10 worst-cell failures [1]. It is a foundational fix for game logic, not a holistic upgrade to the LLM's creative output or long-term memory management, which are prerequisites for 8/10.

## 4. Assumptions & Binding Decisions

### 4.1 Binding 29a Decisions (Constraints)
*   No scrub-only batch [1].
*   No prompt-only interrupt [1].
*   No random ambush [1].
*   No second LLM critic path [1].
*   Retain ArcDirector spawn, beat commits, sealed manifest fallback, replay hash, and eval quarantine from 28c [1].

### 4.2 Configurable Defaults
*   Maximum engaged turns before forced terminal state (default: configurable per mode, e.g., 5 turns for PYOA, 10 for LitRPG).
*   Threshold for removing flee/parley options in ChoiceCompiler (default: after 2 failed attempts).

## 5. Edge Cases & Acceptance Tests

*   **Edge Case:** GM fails to narrate mid-encounter.
    *   *Resolution:* Deterministic fallback forces a terminal state (e.g., `escape` or `defeat` depending on HP/stats) to prevent purgatory.
*   **Acceptance Test (Hook Contract):** Run 100 automated seeds per mode. Assert that 100% of runs that reach T12 have at least one valid success receipt (`levelTick`, `questStage2`, `encounterCleared`, `branchLocked`).
*   **Acceptance Test (Purgatory):** Run 100 automated seeds per mode with forced combat spawns at T5. Assert that 0% of runs are still in an active, non-terminal encounter state by T15.

## 6. Open Evidence Requests
*   Require telemetry on the frequency of specific terminal outcomes (escape vs. victory vs. defeat) to tune the Encounter Terminal FSM balance.
*   Require player feedback data on whether forced forks (e.g., after exhausting "Buy time") feel overly restrictive or natural.
