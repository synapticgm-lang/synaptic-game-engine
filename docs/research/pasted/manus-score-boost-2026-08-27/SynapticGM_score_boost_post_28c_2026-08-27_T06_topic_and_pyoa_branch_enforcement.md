# T6 — NPC Topic Exhaustion and PYOA Branch Enforcement

**Priority:** P0  
**Modes:** RPG, DnD, and PYOA  
**Author:** Manus AI

## Shared principle

Dialogue progress and crisis activity are not durable unless they change authoritative state. Both systems therefore use monotonic commitment: an exhausted topic must produce a branch consequence, and a PYOA crisis must lock one mutually exclusive branch. The GM narrates these commits but cannot keep an exhausted topic open or present alternatives disabled by a branch lock.[1]

## Part I — NPC topic FSM

This part defines a monotonic topic lifecycle for RPG and DnD, including concrete Cape District commits and a terminal encounter handoff that cannot reopen Aldous/Oskar dialogue.

### State contract

| State | Meaning | Legal next state | Re-entry rule |
|---|---|---|---|
| `fresh` | Topic is available and has not yielded a substantive exchange | `engaged` | May be entered once per topic version |
| `engaged` | Player can traverse registered information, demand, leverage, or concession edges | `exhausted` or directly `committedBranch` | Repeated wording does not create a fresh edge |
| `exhausted` | No unvisited substantive edge remains, or topic turn/attempt budget is consumed | `committedBranch` | Transitional only; no player-facing loop turn |
| `committedBranch` | A durable consequence, refusal, quest stage, disposition, or encounter handoff is committed | None for the same topic version | Terminal and monotonic; a new topic requires a new topic id/version |

`exhausted` must not persist as a conversational holding state. The same transaction that marks exhaustion selects and commits the registered terminal branch, or uses a deterministic refusal/escalation fallback.

### Topic record

```ts
type TopicState = {
  topicId: string;
  topicVersion: number;
  runId: string;
  npcEntityIds: string[];
  stage: 'fresh' | 'engaged' | 'exhausted' | 'committedBranch';
  visitedEdgeIds: string[];
  substantiveTurnCount: number;
  maxSubstantiveTurns: number;
  relatedEncounterId?: string;
  candidateBranchIds: string[];
  committedBranchId?: string;
  commitmentReceiptId?: string;
};
```

### Transition rules

| From | Trigger | To | Required commit |
|---|---|---|---|
| `fresh` | Player or beat selects a registered topic edge | `engaged` | Record first visited edge and any fact/disposition delta |
| `engaged` | New substantive registered edge | `engaged` | Record visited edge and concrete delta |
| `engaged` | A decisive edge is accepted | `committedBranch` | Commit branch, quest stage, disposition, encounter spawn, or refusal consequence |
| `engaged` | All substantive edges visited or budget reached | `exhausted` then `committedBranch` atomically | Deterministic branch selection; no repeated dialogue turn |
| Any nonterminal topic | Related encounter becomes terminal | `committedBranch` when registry defines a handoff | Commit branch derived from encounter outcome; prohibit dialogue reversion |

A “substantive edge” must change a registered fact, disposition, quest/branch candidate, resource, or encounter state. A paraphrase with no delta is not a new edge and may consume the repetition budget.

### Cape District leverage/feeds commits

The exact product data is not attached, so 29a should implement the following **concrete stage categories** and bind them to the existing Cape District quest/beat ids rather than invent new story prose.

| Registered condition | Required topic/branch commit | Choice effect |
|---|---|---|
| Player presents valid leverage | Commit `leverageAccepted` or registry-defined refusal-with-cost; record leverage consumed/persisted | Remove “present the same leverage” loop; expose consequence edge |
| Player secures a feed/source | Commit `feedSecured`; advance associated quest/relationship stage | Remove repeated “ask for feeds” edge |
| NPC refuses after allowed attempts | Commit `refusalFinal`; apply disposition or escalation delta | Offer leave, confront, alternate source, or registered encounter—not the same question |
| Related threat interrupts | Preserve topic record; run encounter FSM | On clear, commit topic branch from encounter outcome or resume only unvisited substantive edge |

The binding requirement is a real state/receipt delta. Labels such as `leverageAccepted` are specification names and must be mapped to current registry terms.

### Aldous/Oskar non-reversion rule

When an Aldous- or Oskar-related encounter reaches `terminal`, a handoff reducer consumes `encounterCleared` once. It selects a topic branch from the terminal outcome and current BeatContract mapping, writes a topic commit, and disables every topic edge invalidated by that result. The old topic cannot return to `fresh` or `engaged` because the GM mentions the NPC again.

| Encounter outcome | Required handoff class |
|---|---|
| `victory` / `defeat` | Commit the registered consequence and NPC availability/disposition |
| `escape` | Commit separation/pursuit state; a future meeting uses a new encounter/topic version |
| `capture` | Commit captivity/authority branch and disable ordinary dialogue pads |
| `parleyResolved` | Commit agreed terms/obligation and disable renegotiating the identical terms |

If no mapping exists, commit `unmappedTerminalFallback` with a safe refusal/separation consequence and quarantine the registry defect. Never reopen dialogue purgatory.

### Topic receipt

```json
{
  "receiptType": "topicBranchCommitted",
  "schemaVersion": 1,
  "receiptId": "rcpt_run-9_topic-cape-feeds_v1_commit",
  "idempotencyKey": "run-9:topic-cape-feeds:v1:terminal",
  "runId": "run-9",
  "seed": "s137",
  "turn": 11,
  "mode": "RPG",
  "topicId": "cape-feeds",
  "topicVersion": 1,
  "npcEntityIds": ["npc-cape-contact"],
  "branchId": "feedSecured",
  "reason": "registered_decisive_edge",
  "committedDeltaHash": "sha256:...",
  "replayHash": "sha256:..."
}
```

## Part II — PYOA Thornferry branch ledger

This part turns Thornferry crisis activity, key-item use, and exhausted delay/help choices into one durable mutually exclusive branch lock.

### Crisis-to-lock contract

A `crisis` receipt identifies the branch group and starts a bounded decision window. It does not itself prove success. By T30 at the latest, and normally within the registered crisis budget, the ledger must atomically commit exactly one branch and emit `branchLocked`. All mutually exclusive sibling branches become disabled in the same transaction.[1]

```ts
type BranchLock = {
  branchGroupId: string;
  lockedBranchId: string;
  disabledBranchIds: string[];
  triggerReceiptIds: string[];
  committedTurn: number;
  committedDeltaHash: string;
  lockVersion: 1;
};
```

### Branch invariants

| ID | Invariant |
|---|---|
| B-I01 | One branch group has at most one active lock version |
| B-I02 | `lockedBranchId` is a member of the crisis branch group |
| B-I03 | Every sibling in the group is listed as disabled unless explicitly nonexclusive in the registry |
| B-I04 | A locked branch is monotonic; later prose or choices cannot switch it |
| B-I05 | Duplicate item use or crisis events return the existing lock and do not duplicate deltas |
| B-I06 | Every crisis receipt at or before T30 has a valid linked `branchLocked` by T30 or the gate fails |
| B-I07 | Same seed, action stream, registry version, and item state reproduce the lock and hashes |
| B-I08 | A receipt from another run/seed cannot satisfy the current run’s gate |

### Millstone Charter item-use transition

Using the Millstone Charter is an accepted action with ledger authority, not a prose hint. The item-use handler validates possession, eligibility, branch group, and current lock before the GM render call.

| Condition | Atomic behavior |
|---|---|
| Valid item, no branch locked | Consume or mark use according to item rules; lock the Charter branch; disable siblings; emit `itemUsed` and `branchLocked`; then narrate |
| Valid item, same branch already locked | Return existing lock idempotently; do not consume again |
| Valid item, conflicting branch locked | Reject structurally and compile consequences of the existing branch; do not let GM imply success |
| Item absent/ineligible | Reject action and compile a legal crisis edge |
| GM render fails after valid use | Preserve lock and show sealed player-safe branch copy |

### Buy time / Call for help exhaustion

The initial default is **two accepted attempts per family**, configurable by crisis template. An attempt changes a clock, resource, helper state, or risk. Rewording the same action does not create a new family or reset the budget.

| State | Available edges | Result |
|---|---|---|
| Below both thresholds | `buyTime`, `callForHelp`, decisive forks, eligible item use | Accepted delay/help action updates crisis state |
| One family exhausted | Remove that family; retain unexhausted and decisive edges | No generic filler replacement |
| Both families exhausted | Remove both and compile at least two decisive registered forks if available | Next accepted decisive action locks branch |
| No decisive player edge available at exhaustion | Invoke registered overseer escalation | Escalation deterministically locks its branch and applies cost |
| Max crisis decision turns reached | Force registered fork by stable precedence | Emit branch lock; no further delay turn |

The overseer escalation is deterministic and BeatContract-backed; it is not a random ambush.[1]

### `branchLocked` receipt

```json
{
  "receiptType": "branchLocked",
  "schemaVersion": 1,
  "receiptId": "rcpt_run-11_thornferry-crisis_lock",
  "idempotencyKey": "run-11:thornferry-crisis:v1:lock",
  "runId": "run-11",
  "seed": "s188",
  "turn": 10,
  "mode": "PYOA",
  "branchGroupId": "thornferry-crisis",
  "lockedBranchId": "millstone-charter",
  "disabledBranchIds": ["buy-time-exit", "call-for-help-exit", "overseer-takes-control"],
  "triggerReceiptIds": ["rcpt_run-11_item-millstone-charter_used"],
  "reason": "key_item_committed",
  "committedDeltaHash": "sha256:...",
  "previousReceiptHash": "sha256:...",
  "replayHash": "sha256:..."
}
```

### Crisis receipts before and after lock

Multiple crisis events may be recorded, but they do not create multiple branch groups unless the registry explicitly versions the crisis. After lock, additional crisis narration may update consequences inside the locked branch; it cannot present or reactivate disabled siblings. The three crisis receipts reported for PYOA s188 would therefore either link to one branch group and one lock or expose a configuration error, rather than remain three uncommitted narrative events.[1]

## Cross-system ordering

| Sequence | Event |
|---:|---|
| 1 | Accept player action and validate against current topic/branch/encounter state |
| 2 | Apply NPC topic or PYOA transition structurally |
| 3 | If an encounter is triggered, allocate it through Encounter Terminal FSM |
| 4 | Atomically commit topic/branch delta and receipt when terminal condition is met |
| 5 | Update ChoiceCompiler from committed state |
| 6 | Ask GM to narrate only the committed result |
| 7 | Apply entity and STATUS firewalls to player surfaces |

## Acceptance tests

| Test name | Assertion |
|---|---|
| `topic_fresh_to_engaged_records_edge` | First substantive topic edge changes stage and ledger |
| `topic_exhausted_commits_same_transaction` | No player turn observes a loopable exhausted state |
| `topic_rephrased_question_does_not_reset` | Reworded leverage/feed question does not create a fresh edge |
| `cape_leverage_commits_consequence` | Valid leverage results in durable branch/quest/disposition delta |
| `cape_feed_commits_stage` | Feed acquisition advances the registered stage and removes repeat edge |
| `dnd_terminal_handoff_never_reopens_topic` | Aldous/Oskar-related clear cannot return topic to fresh/engaged |
| `pyoa_crisis_locks_exactly_one_branch` | One lock and disabled siblings commit atomically |
| `pyoa_millstone_charter_use_commits_branch` | Item use changes ledger before narration and is idempotent |
| `pyoa_buy_time_removed_at_threshold` | Exhausted delay family cannot reappear |
| `pyoa_call_help_removed_at_threshold` | Exhausted help family cannot reappear |
| `pyoa_overseer_escalation_is_deterministic` | No decisive edge triggers registered, reproducible escalation |
| `eval_crisis_without_branch_lock_by_t30_fails` | Missing lock produces hard gate failure and quarantine |
| `branch_lock_rejects_cross_run_receipt` | Foreign run/seed receipt cannot satisfy branch gate |

## References

[1]: ../sources/pasted_content.txt "SynapticGM — POST-28c SCORE BOOST RESEARCH brief"
