# Entity Scrub-Scope Constitution & STATUS Leak Firewall

## 1. Executive Summary
This architecture packet defines the entity scrub-scope constitution and the STATUS prompt-leak firewall, fulfilling the requirements for the 29a batch [1]. It addresses the root causes of collateral token replacement observed in the 28c batch and establishes deterministic invariants for protecting player-facing text from internal system tags.

## 2. Entity Scrub-Scope Constitution

### 2.1 Root-Cause Hypotheses Constrained by Evidence
The 28c batch introduced collateral token replacements such as `the mark`, `nearby building`, and `the panel`, alongside regressions in RPG pronoun handling (`them` regression from 26 to 52) [1]. The root cause is hypothesized to be an overly aggressive, context-insensitive scrubbing pass that replaces valid narrative entities with generic placeholders. This occurs because the scrubber lacks semantic awareness of bound nouns and active quest props.

### 2.2 Semantic-Role Allowlists & Protected Registries
To prevent collateral scrubbing, the following semantic roles and entities must be strictly allowlisted and never replaced [1]:
- **Active Mobs:** Any hostile or interactive NPC currently engaged in an encounter.
- **Inventory Items:** Items explicitly held by the player or recognized in the current inventory state.
- **Quest Props:** Objects essential to the current quest stage or narrative progression.
- **Named NPCs:** Characters with explicit names registered in the `BeatContract` or narrative state.
- **Location Titles:** Specific names of areas, rooms, or landmarks.

These entities must be registered in a protected registry during the `encounterSpawn` and narrative generation phases.

### 2.3 Pre/Post-GM Order & Validation
The scrubbing pipeline must enforce a strict ordering to ensure semantic integrity:
1. **Pre-GM:** The `typedEntityValidator` identifies and tags all allowlisted entities within the raw GM output.
2. **GM Execution:** The GM processes the narrative, utilizing the tagged entities.
3. **Post-GM:** The `proseWarden` executes the scrub pass, explicitly skipping any tokens tagged by the `typedEntityValidator`.

### 2.4 Collateral-Token Zero Targets
The acceptance metric for this implementation is a strict target of zero hits for collateral tokens (`the mark`, `nearby building`, `the panel`, etc.) in the worst-cell re-runs [1].

## 3. STATUS Prompt-Leak Firewall

### 3.1 Tag Pattern Policy
To prevent internal system tags from leaking into the player-facing STATUS output, a strict tag pattern policy is implemented. The following patterns must be stripped [1]:
- `[GM_VOICE]`
- `[PYOA]`
- `[RenderFallbackUsed]`
- `[Campaign Contract]`

### 3.2 Debug-Only Retention & Player-Safe Fallbacks
Stripped tags must not be discarded entirely; they must be retained exclusively in the `turns.jsonl` log for debugging purposes [1]. In the event of a failure during tag stripping or STATUS generation, a player-safe fallback copy must be presented, ensuring no internal tags are visible.

### 3.3 Normalization
All STATUS outputs must undergo Unicode, case, and spacing normalization to ensure consistent presentation and prevent formatting artifacts caused by tag removal.

## 4. Key Decisions (29a Binding)
- Implement `typedEntityValidator` for pre-GM entity tagging.
- Implement `proseWarden` for post-GM context-aware scrubbing.
- Enforce zero-tolerance policy for collateral token hits.
- Retain stripped tags in `turns.jsonl` only.

## 5. State/Transition Rules
| State | Event | Action | Next State |
|---|---|---|---|
| Raw Output | Pre-GM Pass | `typedEntityValidator` tags entities | Tagged Output |
| Tagged Output | GM Execution | GM processes narrative | GM Processed |
| GM Processed | Post-GM Pass | `proseWarden` scrubs untagged | Final Output |

## 6. Acceptance Tests
- **Test 1:** Verify `typedEntityValidator` correctly identifies all allowlisted entities in a complex narrative string.
- **Test 2:** Verify `proseWarden` successfully scrubs invalid tokens without affecting tagged entities.
- **Test 3:** Confirm zero instances of `the mark`, `nearby building`, or `the panel` in worst-cell outputs.
- **Test 4:** Ensure all defined leak tags are stripped from the final STATUS string.
- **Test 5:** Validate that stripped tags are correctly logged in `turns.jsonl`.

## 7. Open Evidence Requests
- Require detailed logs of the `them` regression instances to refine pronoun handling in the `typedEntityValidator`.

## References
[1] [SynapticGM — POST-28c SCORE BOOST RESEARCH](/home/ubuntu/SynapticGM_score_boost_post_28c_2026-08-27/sources/pasted_content.txt)
