# T2 — Encounter Terminal FSM Specification

**Priority:** P0  
**Primary modes:** LitRPG and DnD  
**Applies to:** SynapticGM consumer application only  
**Author:** Manus AI

## Purpose and contract

Path 28c proves that an encounter can spawn but does not guarantee that it will terminate. The Encounter Terminal FSM supplies the missing code authority. Its contract is:

> For every accepted `encounterSpawn`, the runtime must eventually commit exactly one terminal outcome and emit exactly one causally linked `encounterCleared`. The GM narrates the committed result; it does not choose or veto that result.

This FSM is the authoritative owner of encounter lifecycle. `ArcDirector` may request a spawn, the ChoiceCompiler may expose legal actions, the rules engine may compute deltas, and the GM may render prose, but none of those components may directly clear or reopen an encounter.[1]

![Encounter Terminal FSM](https://private-us-east-1.manuscdn.com/sessionFile/XwJTc0evRcDVAMojHM3xHC/sandbox/qc4mDONTqxEm9cuzboDakP-images_1787852531531_na1fn_L2hvbWUvdWJ1bnR1L1N5bmFwdGljR01fc2NvcmVfYm9vc3RfcG9zdF8yOGNfMjAyNi0wOC0yNy9yZWxlYXNlL1N5bmFwdGljR01fc2NvcmVfYm9vc3RfcG9zdF8yOGNfMjAyNi0wOC0yN19UMDJfZW5jb3VudGVyX3Rlcm1pbmFsX2ZzbQ.png?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvWHdKVGMwZXZSY0RWQU1vakhNM3hIQy9zYW5kYm94L3FjNG1ET05UcXhFbTljdXpib0Rha1AtaW1hZ2VzXzE3ODc4NTI1MzE1MzFfbmExZm5fTDJodmJXVXZkV0oxYm5SMUwxTjVibUZ3ZEdsalIwMWZjMk52Y21WZlltOXZjM1JmY0c5emRGOHlPR05mTWpBeU5pMHdPQzB5Tnk5eVpXeGxZWE5sTDFONWJtRndkR2xqUjAxZmMyTnZjbVZmWW05dmMzUmZjRzl6ZEY4eU9HTmZNakF5Tmkwd09DMHlOMTlVTURKZlpXNWpiM1Z1ZEdWeVgzUmxjbTFwYm1Gc1gyWnpiUS5wbmciLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3ODk0MzA0MDB9fX1dfQ__&Key-Pair-Id=K2QY5QTL8JSY6C&Signature=MEUCIQDFGk5ZBlDR3UwmxQ-FycVpYpAKaePaZxJjMoPD-UC-RQIgGU0A43Rw-T6qphLUV9MbmODvZ4wSI-PK8dlOfftjo44_)

The editable Mermaid source is included as `SynapticGM_score_boost_post_28c_2026-08-27_T02_encounter_terminal_fsm.mmd`.

## State model

| State | Meaning | Entry invariant | Permitted exit |
|---|---|---|---|
| `idle` | No active encounter exists | `activeEncounterId = null` | Accept a valid spawn and enter `engaged` |
| `engaged` | Player-facing actions can affect an active encounter | One immutable `encounterId`; budgets are initialized; `encounterSpawn` exists | Enter `resolving` on a natural terminal condition, exhausted escape/parley route, max-turn cap, fatal engine condition, or explicit surrender |
| `resolving` | Outcome and world delta are being computed atomically | Choice compilation is closed; no new GM-authored action may mutate encounter state | Commit one terminal outcome and enter `terminal`; on GM/render failure, use deterministic fallback copy without undoing state |
| `terminal` | Outcome and state delta are committed | `terminalOutcome` and `encounterCleared` exist; replay material is sealed | Project post-encounter state, then transition to `idle` without deleting history |

`terminal` is a committed lifecycle state, not a narrative label. The runtime may project `idle` for the next turn, but the terminal record remains immutable in the encounter ledger.

## Canonical state record

The exact repository types must be mapped by engineering, but the runtime record must contain fields equivalent to the following interface.

```ts
type EncounterPhase = 'idle' | 'engaged' | 'resolving' | 'terminal';
type TerminalOutcome =
  | 'escape'
  | 'victory'
  | 'defeat'
  | 'capture'
  | 'parleyResolved';

type EncounterState = {
  encounterId: string;
  runId: string;
  seed: string;
  mode: 'LitRPG' | 'DnD' | 'RPG' | 'PYOA' | string;
  phase: EncounterPhase;
  source: 'arcDirector' | 'player' | 'beatContract' | 'system';
  forcedSpawnKey?: 'Pact-Hunter' | 'Keep Wraith' | string;
  startedTurn: number;
  engagedTurnCount: number;
  failedFleeCount: number;
  failedParleyCount: number;
  maxEngagedTurns: number;
  maxFailedFlee: number;
  maxFailedParley: number;
  participantEntityIds: string[];
  lastAcceptedActionId?: string;
  resolutionReason?: string;
  terminalOutcome?: TerminalOutcome;
  committedDeltaHash?: string;
  replayHash?: string;
  clearedTurn?: number;
  version: 1;
};
```

## Binding decisions versus tunable defaults

| Concern | 29a binding decision | Initial default | Tuning rule |
|---|---|---:|---|
| Failed flee cap | A cap exists; each resolved failure consumes one budget unit; option disappears at cap | LitRPG 2; DnD 2 | Per encounter template, never raised during the encounter |
| Failed parley cap | A cap exists; failed or non-advancing parley consumes one unit; option disappears at cap | LitRPG 1; DnD 2 | Per encounter template, never raised during the encounter |
| Max engaged turns | A cap exists and forces `resolving` | LitRPG 8; DnD 10 | Count accepted player turns after spawn; bosses may use an explicit registry override capped below T50 |
| Resolution render timeout | Rendering cannot block the commit | One render attempt plus sealed fallback | Operational timeout value is environment-specific |
| Active encounters | Only one foreground encounter may be `engaged` or `resolving` | 1 | Additional spawn requests are queued or merged deterministically |
| Clear deadline | Spawn without clear by T50 fails the combat-mode eval gate | T50 | Binding evaluation maximum, not a desired pacing target |

The defaults are deliberately shorter than T50. T50 is a safety/evaluation deadline; it must not become the normal encounter duration.

## Transition table

| From | Event or guard | To | Atomic effects | Narration responsibility |
|---|---|---|---|---|
| `idle` | Valid spawn request and no active encounter | `engaged` | Allocate `encounterId`; freeze participants and caps; emit `encounterSpawn`; set active encounter | Narrate arrival from committed spawn data |
| `idle` | Duplicate spawn idempotency key | `idle` or existing phase | Return existing encounter; emit no duplicate receipt | None |
| `engaged` | Natural victory, defeat, successful escape, accepted surrender, or accepted parley agreement | `resolving` | Freeze choices; set candidate outcome and resolution reason | May render transition, but cannot alter outcome |
| `engaged` | Failed flee reaches cap | `resolving` | Remove flee; select deterministic forced outcome using precedence table | Narrate forced confrontation/capture/escape as committed |
| `engaged` | Failed parley reaches cap | `resolving` | Remove parley; apply hostility/escalation; select outcome or legal combat continuation | Narrate refusal; no renewed parley choice |
| `engaged` | Max engaged turns reached | `resolving` | Invoke deterministic terminal resolver | Narrate resolver output |
| `engaged` | GM output missing, malformed, or non-advancing | `engaged` or `resolving` | Apply legal fallback action; increment non-advancing/turn counters; resolve if cap reached | Use safe fallback copy |
| `resolving` | Rules delta validates | `terminal` | Commit outcome and state delta in one transaction; emit `encounterCleared`; seal replay hash | Render committed delta |
| `resolving` | Narrative render fails | `terminal` | Commit anyway; set `renderFallbackUsed = true`; emit clear once | Use sealed, player-safe terminal template |
| `resolving` | Delta validation fails | `terminal` | Apply deterministic minimal delta for selected outcome; quarantine diagnostic; emit clear once | Use fallback copy |
| `terminal` | Projection completed | `idle` | Clear active pointer; retain immutable terminal ledger; unlock normal choices next turn | Present post-encounter options |

## Terminal outcome resolver

Natural rule results always outrank caps. When a cap or system failure requires forced resolution, the runtime selects an outcome by the following deterministic precedence. The resolver must use only committed state, registry configuration, the seed, and stable tie-breaking—not fresh GM prose.

| Precedence | Guard | Outcome | Minimum committed delta |
|---:|---|---|---|
| 1 | Player and opponent victory/defeat rules already identify a result | `victory` or `defeat` | HP/status, rewards or loss, opponent disposition, quest/beat advancement if configured |
| 2 | A previously accepted escape check succeeded | `escape` | Player location/position changes; pursuer disposition persists if applicable |
| 3 | A previously accepted parley offer satisfies registered terms | `parleyResolved` | Disposition and obligation/concession commit; combat closes |
| 4 | Player explicitly surrendered or a nonlethal captor rule applies | `capture` | Captivity/location/quest consequence commits |
| 5 | Max-turn/system fallback and player has a registered viable retreat edge | `escape` | Retreat cost and location delta commit |
| 6 | Max-turn/system fallback and opponent has decisive advantage | `defeat` or `capture` | Deterministic loss/capture delta commits |
| 7 | Max-turn/system fallback otherwise | `victory` | Minimal victory delta; reward only if registry defines it |

A configured encounter may prohibit an outcome, but it must still register at least one reachable terminal fallback. Misconfigured encounters fail validation before spawn; they must not enter `engaged`.

## Hard-cap semantics

A flee or parley attempt consumes budget only after the rules layer classifies the action. A malformed duplicate request with the same action id is idempotent and consumes nothing. A failed action consumes one unit even if the GM describes it ambiguously. A successful action moves immediately to `resolving`.

When a threshold is reached, the related action family is unavailable on the next compilation. If reaching the threshold also satisfies a forced-resolution rule, the FSM moves to `resolving` in the same transaction, so no additional loop turn is emitted. The max-turn cap is evaluated after applying the current accepted action and before requesting another GM response.

## ArcDirector forced-spawn interaction

`ArcDirector` retains its 28c responsibility for scheduling Pact-Hunter and Keep Wraith spawns.[1] It must call one FSM entry point with an idempotency key derived from run, beat, and forced-spawn identity. It must not write `activeEncounter` directly.

| Condition | Required behavior |
|---|---|
| FSM is `idle` | Accept spawn, emit `encounterSpawn`, enter `engaged` |
| Same forced spawn is already active | Return the existing encounter and emit no second spawn |
| Another foreground encounter is active | Queue the forced spawn by stable priority, or merge only if the BeatContract explicitly defines a composite encounter |
| Previous instance is terminal | A recurrence requires a new registry recurrence key; the old encounter cannot reopen |
| Forced spawn template lacks a fallback outcome | Reject before activation, log configuration fault, and apply a safe non-combat beat rather than create purgatory |

The Pact-Hunter and Keep Wraith tests must prove that ArcDirector cannot repeatedly reassert the spawn after terminal clear.

## Receipt contracts

The receipt pair is the durable proof of lifecycle entry and terminal completion. Both event shapes are versioned, run-scoped, replayable, and causally linked.

### `encounterSpawn`

```json
{
  "receiptType": "encounterSpawn",
  "schemaVersion": 1,
  "receiptId": "rcpt_run-42_enc-7_spawn",
  "idempotencyKey": "run-42:keep-wraith:beat-3",
  "runId": "run-42",
  "seed": "s69",
  "turn": 6,
  "mode": "DnD",
  "encounterId": "enc-7",
  "source": "arcDirector",
  "forcedSpawnKey": "Keep Wraith",
  "participantEntityIds": ["pc", "keep-wraith"],
  "limits": {
    "maxEngagedTurns": 10,
    "maxFailedFlee": 2,
    "maxFailedParley": 2
  },
  "previousReceiptHash": "sha256:...",
  "replayHash": "sha256:..."
}
```

### `encounterCleared`

```json
{
  "receiptType": "encounterCleared",
  "schemaVersion": 1,
  "receiptId": "rcpt_run-42_enc-7_clear",
  "idempotencyKey": "run-42:enc-7:terminal",
  "runId": "run-42",
  "seed": "s69",
  "turn": 13,
  "mode": "DnD",
  "encounterId": "enc-7",
  "spawnReceiptId": "rcpt_run-42_enc-7_spawn",
  "outcome": "parleyResolved",
  "resolutionReason": "registered_terms_satisfied",
  "engagedTurnCount": 7,
  "failedFleeCount": 1,
  "failedParleyCount": 1,
  "committedDelta": {
    "disposition": [{"entityId": "keep-wraith", "state": "stoodDown"}],
    "questStage": [{"questId": "keep", "from": 1, "to": 2}]
  },
  "committedDeltaHash": "sha256:...",
  "renderFallbackUsed": false,
  "previousReceiptHash": "sha256:...",
  "replayHash": "sha256:..."
}
```

Both receipts are append-only. One spawn maps to zero clears only while nonterminal and to exactly one clear after terminal. Duplicate terminal calls return the first clear receipt byte-for-byte.

## Transaction and precedence boundaries

The `resolving → terminal` transition must atomically write the terminal outcome, state delta, `encounterCleared`, active-pointer release intent, and replay material. If the storage layer cannot provide one transaction, use an outbox keyed by `encounterId` and make every consumer idempotent.

Precedence is: **safety/fatal rule → existing natural terminal rule → accepted player action → hard-cap resolver → GM suggestion**. GM text cannot revive a defeated mob, reopen a cleared encounter, change a committed outcome, or present an exhausted flee/parley edge.

## Deterministic fallback copy

If the GM fails before a legal action is classified, the ChoiceCompiler supplies a registry-defined `defend/advance` fallback and the FSM increments the turn. If the GM fails during resolution, state still commits and the renderer uses a player-safe template populated only from the terminal receipt:

> “The encounter ends in **{outcomeLabel}**. {oneSentenceDeltaSummary} Your next options are ready.”

No internal tag, prompt text, stack trace, raw enum, or `[RenderFallbackUsed]` marker may appear. The marker is written only to `turns.jsonl` and receipt diagnostics.

## Lifecycle invariants

| ID | Invariant |
|---|---|
| E-I01 | At most one foreground encounter is `engaged` or `resolving` per run |
| E-I02 | Every `encounterCleared.spawnReceiptId` references one spawn in the same `runId`, `seed`, `mode`, and `encounterId` |
| E-I03 | Exactly one terminal outcome is committed per encounter |
| E-I04 | Terminal state is monotonic; it cannot return to `engaged` |
| E-I05 | Choice compilation is closed during `resolving` |
| E-I06 | The GM may render but may not mutate outcome or committed delta |
| E-I07 | Duplicate action, spawn, and clear idempotency keys do not change counters or emit receipts |
| E-I08 | Same seed, initial state, action stream, and registry version reproduce terminal outcome and receipt hashes |
| E-I09 | A protected participant entity remains addressable by its bound entity id through clear |
| E-I10 | Spawn at or before T50 with no clear by T50 fails the combat-mode resolution gate |

## Edge cases

| Edge case | Required decision |
|---|---|
| Spawn and natural terminal occur in one turn | Emit spawn, then clear in ledger order; both may share a turn but not a receipt id |
| Player disconnects while engaged | Resume from persisted counters; a product-level inactivity policy may resolve later, but replay does not synthesize unrecorded actions |
| Encounter starts after T50 | The `spawnByT50` coverage rule and paired-clear deadline are evaluated separately; late-spawn policy must be explicit in the harness |
| Clear occurs exactly at T50 | Pass the stated “by T50” gate |
| Multiple mobs | One encounter terminal covers the registered group; individual participant states live in the committed delta |
| Parley resolves with continuing pursuit | Current encounter clears as `parleyResolved`; any future encounter requires a new id and beat trigger |
| GM narrates victory while rules select capture | Capture remains authoritative; post-render validator rejects or replaces contradictory prose |
| Save from 28c contains active combat with no FSM record | Migration creates one v1 encounter from the active receipt and initializes conservative remaining budgets; migration is logged and replay-versioned |

## Evaluation and acceptance tests

| Test name | Setup | Assertion |
|---|---|---|
| `encounter_fsm_spawn_is_idempotent` | Reissue same ArcDirector idempotency key | One active encounter and one spawn receipt |
| `encounter_fsm_failed_flee_cap_resolves` | Fail flee to configured cap | Flee removed; same transaction enters `resolving` or commits forced outcome |
| `encounter_fsm_failed_parley_cap_resolves` | Fail parley to cap | Parley removed; no later parley choice; encounter progresses |
| `encounter_fsm_max_turn_cap_clears` | Supply nonterminal legal actions through cap | Exactly one terminal outcome and clear receipt |
| `encounter_fsm_gm_failure_before_action_advances` | Return malformed/empty GM output | Registry fallback applied; no stuck turn |
| `encounter_fsm_gm_failure_during_resolution_commits` | Fail render after delta calculation | State and clear persist; safe fallback shown |
| `encounter_fsm_terminal_is_monotonic` | Attempt to reopen terminal encounter | Mutation rejected; no new spawn/clear |
| `encounter_fsm_pact_hunter_no_respawn_loop` | Clear forced Pact-Hunter, rerun director same beat | Old encounter remains terminal; no duplicate spawn |
| `encounter_fsm_keep_wraith_no_dialogue_revert` | Clear Wraith through parley or combat | NPC/encounter state cannot return to active loop |
| `eval_combat_spawn_without_clear_by_t50_fails` | Spawn and suppress clear through T50 | Hard evaluation failure and quarantine evidence |
| `replay_encounter_receipts_are_stable` | Replay identical seed/actions/registry | Byte-stable normalized receipts and matching replay hash |
| `cross_run_encounter_reference_fails` | Inject receipt from another run | Contamination gate fails before score aggregation |

## Rollout and rollback

Use mode flags for LitRPG and DnD, with deterministic shadow logging before enforcing terminal deltas. Promotion requires the same-seed worst-cell reruns to produce valid paired receipts and no terminal reversion. Rollback may disable new encounter creation under the FSM, but must **not** reinterpret or delete terminal receipts already committed. A rollback that restores spawn-only behavior is acceptable only as an emergency feature rollback, never as a successful 29a outcome.

## References

[1]: ../sources/pasted_content.txt "SynapticGM — POST-28c SCORE BOOST RESEARCH brief"
