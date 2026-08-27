# NPC Topic Exhaustion and PYOA Thornferry Ledger Enforcement

## 1. Overview

This architecture packet defines the engineering specifications for NPC topic exhaustion and PYOA (Pick Your Own Adventure) branch ledger enforcement, addressing the specific requirements of the 29a batch [1]. The goal is to eliminate dialogue purgatory, enforce mutually exclusive branch locks, and ensure that encounters transition correctly without reverting to previous states.

## 2. NPC Topic Exhaustion (RPG + DnD)

To prevent players from being trapped in dialogue loops, the NPC topic system transitions through a deterministic Finite State Machine (FSM).

### 2.1 FSM Stages

The NPC interaction FSM consists of four primary stages [1]:

| Stage | Description | Transition Condition |
|-------|-------------|----------------------|
| **Fresh** | The initial state when a topic is first introduced. | Player selects the topic or NPC initiates it. |
| **Engaged** | The active state where the player and NPC are discussing the topic. | Player continues the dialogue tree. |
| **Exhausted** | The topic has been fully explored, and no new information is available. | All critical nodes in the dialogue tree are visited, or max turns reached. |
| **Committed Branch** | The final state where the dialogue outcome is locked into the game state. | Topic reaches the Exhausted state. |

### 2.2 Cape District Leverage/Feeds

For the Cape District leverage/feeds scenario, the system must enforce concrete stage commits [1]. Once the player acquires the necessary leverage or feed information, the topic transitions immediately to the **Committed Branch** state, preventing further redundant inquiries.

### 2.3 Aldous/Oskar Combat Terminal Reversion

In DnD scenarios involving Aldous or Oskar, a critical issue occurs where post-combat states revert to dialogue purgatory [1]. To resolve this, the system must enforce a non-reversion policy. Once an encounter reaches a terminal state (e.g., victory, defeat, escape), the associated NPC topics must automatically transition to the **Committed Branch** state, bypassing the Fresh or Engaged states.

## 3. PYOA Branch Ledger Enforcement (Thornferry)

The PYOA branch ledger must enforce strict mutually exclusive paths, ensuring that player choices have permanent consequences.

### 3.1 Crisis to BranchLocked Semantics

When a crisis receipt is generated, it must immediately lock the associated mutually exclusive branch [1]. This ensures that players cannot backtrack or exploit alternative paths once a crisis has been resolved.

### 3.2 Millstone Charter Item Use

The use of the Millstone Charter item must trigger a branch stage commit, rather than merely generating narrative text [1]. The item use must be recorded in the branch ledger, locking the corresponding narrative path.

### 3.3 Buy Time / Call for Help Exhaustion

Repeated use of "Buy time" or "Call for help" actions must lead to exhaustion [1]. Once the exhaustion threshold is reached, the system must force a narrative fork or escalate the situation via overseer intervention. This prevents players from infinitely delaying encounters.

## 4. Edge Cases and Acceptance Tests

### 4.1 Edge Cases

- **Interrupted Dialogue:** If a dialogue is interrupted by a forced encounter, the topic state must be preserved and evaluated upon encounter resolution.
- **Simultaneous Item Use:** If multiple items are used simultaneously, the ledger must process them sequentially, enforcing branch locks based on the first processed item.

### 4.2 Acceptance Tests (T30)

The following T30 tests must pass to validate the implementation:

1. **Crisis Branch Lock:** Verify that a crisis receipt results in a `branchLocked` state within 30 turns [1].
2. **Exhaustion Escalation:** Verify that exceeding the "Buy time" threshold triggers a forced fork or overseer escalation.
3. **Non-Reversion:** Verify that post-combat NPC interactions do not revert to the "Fresh" state.

## 5. Open Evidence Requests

- **Threshold Tuning:** Determine the optimal number of turns for "Buy time" exhaustion before forced escalation.
- **Ledger Persistence:** Verify the serialization format for the `pyoaBranchLedger` to ensure compatibility with existing save states.

## References

[1] SynapticGM_score_boost_post_28c_2026-08-27, "POST-28c SCORE BOOST RESEARCH," /home/ubuntu/SynapticGM_score_boost_post_28c_2026-08-27/sources/pasted_content.txt.
