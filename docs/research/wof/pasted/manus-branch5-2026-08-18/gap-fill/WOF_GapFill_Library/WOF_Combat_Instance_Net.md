# WOF Combat / Instance / Network Contract

**Pack:** `ash_compact` and shared WOF protocol data  
**Format:** Markdown data/protocol specification, `packFormatVersion: 1`  
**Status:** WOF-only, original IP, not production code, and not connected to live SynapticGM.

> This file defines deterministic state and message contracts for solo and private co-op instanced combat. Code commits state first; generated prose may describe only the committed receipt. The product labels remain **solo**, **private co-op**, and **limited online region**—never “MMO.”

## 1. Scope and locked defaults

| Rule | Locked value |
|---|---|
| World model | Tier 3 shared hubs with instanced combat; no contested open-world PvP |
| Ordinary party | 1–5 players; matchmaking is friends-first |
| Raid party | Exactly 10 combatants; Mid+ only; Millstone Hollow remains a 10-person, 3-phase instance |
| Combat model | Lockstep rounds; each player declares one plan, then CODE resolves the round |
| Turn billing | Dungeon Mode A spends 1 turn per player per round; hub story beat spends 1 turn; chat, mail, AH browse, tell, and idle spend 0 |
| Raid billing | Mode C uses even-round billing: rounds 2, 4, 6… charge one turn; no fractional persisted values |
| Fill policy | No mid-combat fill. A replacement can join only at a checkpoint after the departing player is removed |
| Downed/wipe | A player is downed in combat; a full wipe returns everyone to the latest checkpoint, with earned quest progress retained |
| Death model | No permadeath v1 and no corpse run |
| Loot | Personal loot on every grant; no shared roll and no tradeable generated power |
| Lockout | Weekly per-character per-boss lockout; Millstone Hollow also records weekly per-character phase-clear keys |
| Prose boundary | Narration cannot invent damage, HP, ownership, reward amounts, kill counts, boss defeat, faction standing, or cleared rooms |
| Network authority | Instance host service owns revision, plans, dice, HP, status, durability, checkpoints, lockouts, and loot keys |
| Client authority | UI selection only; a client never commits a result |

## 2. Identifier and namespace rules

All identifiers are lowercase `snake_case`, stable within a file, and globally qualified as `{worldId}:{kind}:{slug}` at persistence boundaries. `worldId` is required on every instance, place, character, lockout, and item reference. A new object may not reuse a locked identifier for another meaning.

### 2.1 Locked Ash Compact instance identifiers

| `instanceId` | Public name | Party | Mode | Lockout |
|---|---|---:|---|---|
| `dungeon_lampwood_gate` | Lampwood Gate | 1–5 | A | `boss:dungeon_lampwood_gate` |
| `dungeon_unlit_hollow` | Unlit Hollow | 1–5 | A | `boss:dungeon_unlit_hollow` |
| `dungeon_coil_warehouse` | Coil Warehouse | 1–5 | A | `boss:dungeon_coil_warehouse` |
| `dungeon_anvil_deep` | Anvil Deep | 1–5 | A | `boss:dungeon_anvil_deep` |
| `dungeon_millstone_hollow` | Millstone Hollow / The Millwarden | 10 | C | `phase:dungeon_millstone_hollow:1..3` |

The four ordinary names and the Millstone Hollow title are locked. `Millstone Hollow / The Millwarden` is a 10-man, 3-phase instance and must not be resized or renamed.

## 3. State machines

### 3.1 Instance lifecycle

| State | Enter condition | Allowed transitions | CODE-owned actions | Narration boundary |
|---|---|---|---|---|
| `created` | Valid request and party size | `token_issued`, `abandoned` | Seed instance, copy encounter graph, create revision 0 | Describe door preparation only |
| `token_issued` | Join token issued | `joining`, `abandoned` | Store token hash, expiry, invite scope | May display expiry and party count |
| `joining` | Eligible player presents token | `ready`, `abandoned` | Validate account, character, entitlement, lockout, capacity | May welcome player |
| `ready` | All required players ready or solo start accepted | `round_open`, `abandoned` | Set checkpoint and round 1 | May describe room state from snapshot |
| `round_open` | Previous round committed | `round_submitted`, `hold`, `checkpoint`, `wipe`, `leave` | Accept one plan per active player, reject stale revisions | May show countdown, not outcome |
| `round_submitted` | All active plans received or deadline reached | `round_resolved` | Freeze plans and revision | No new facts may be narrated |
| `round_resolved` | Deterministic resolver completes | `round_open`, `checkpoint`, `wipe`, `leave` | Apply dice, HP, statuses, durability, loot, objective counts | Receipt is the sole source for prose |
| `hold` | Disconnect, logout, or explicit hold | `round_open`, `checkpoint`, `abandoned` | Preserve plan/hold order, apply timeout policy | Say “the party is holding” only |
| `checkpoint` | Room or phase checkpoint committed | `round_open`, `joining`, `leave`, `abandoned` | Persist checkpoint, permit replacement, apply reconnect | May announce checkpoint and earned items |
| `wipe` | All combatants downed | `checkpoint`, `abandoned` | Restore checkpoint HP/STA policy, durability −10% equipped, retain progress | May describe return, not lost loot that was never granted |
| `leave` | Voluntary leave or kick | `checkpoint`, `abandoned` | Remove member; no mid-combat replacement | May explain next legal join point |
| `abandoned` | Owner abandons or expiry reaches zero | terminal | Release non-granted claims and token; preserve no combat result | May state instance closed |

### 3.2 Round sequence

1. The server emits a snapshot with `expectedRevision`, active members, visible targets, legal verbs, and the current room.
2. Each active character submits exactly one `RoundPlan`, or the server creates `HoldOrder` after the deadline. Manual and auto plans have identical turn spend.
3. The resolver validates targets and prerequisites against the snapshot, rolls the seeded deterministic dice, applies effects in initiative order, and writes one `CombatReceipt` per character plus one round receipt.
4. Idempotent loot grants, objective progress, durability, checkpoint changes, and lockout writes commit in one transaction. Only then does the narration layer receive the receipt.

## 4. Typed protocol records

### 4.1 Common envelope

| Field | Type | Required | Rule |
|---|---|---:|---|
| `messageId` | string | yes | UUIDv4; unique for 30 days |
| `worldId` | string | yes | Must be `ash_compact` or an enabled WOF pack |
| `instanceId` | string | yes | Namespaced instance identifier |
| `partyId` | string | yes | One party for ordinary instances; one raid party for Mode C |
| `actorCharacterId` | string | no | Required for actor commands, omitted for system events |
| `expectedRevision` | integer | yes | Non-negative snapshot revision expected by sender |
| `sentAt` | ISO-8601 UTC | yes | Server checks clock skew; client time is advisory |
| `idempotencyKey` | string | yes | Stable across retries; never reused for a different command |
| `payload` | object | yes | Command-specific fields |

### 4.2 Instance and membership records

| Record | Required fields | Constraints |
|---|---|---|
| `Instance` | `instanceId`, `worldId`, `mode`, `state`, `seed`, `partyId`, `roomId`, `checkpointId`, `roundNumber`, `expectedRevision`, `createdAt`, `expiresAt`, `members[]`, `lootPolicy`, `lockoutKeys[]` | `mode=A` permits 1–5; `mode=C` requires 10; `lootPolicy=personal_only` |
| `InstanceToken` | `tokenId`, `instanceId`, `partyId`, `recipientAccountId`, `scope`, `issuedAt`, `expiresAt`, `usedAt?`, `revokedAt?` | Store a hash, not plaintext; scope is `party_member` or `replacement_at_checkpoint` |
| `Party` | `partyId`, `leaderCharacterId`, `memberCharacterIds[]`, `friendsFirst`, `voice=false`, `createdAt` | 2–5 in ordinary co-op; no public global LFG chat |
| `Raid` | `raidId`, `partyId`, `instanceId`, `memberCharacterIds[10]`, `phase`, `phaseClearKeys[]`, `mode=C` | Exactly ten members; Mid+ entitlement required |
| `CharacterLock` | `characterId`, `instanceId`, `bossKey`, `weekKey`, `phase?`, `consumedAt` | Reject duplicate weekly boss/phase grant; wipe does not consume a clear |

### 4.3 Commands and expected revisions

| Command | Required payload | Success event | Stale or duplicate result |
|---|---|---|---|
| `create_instance` | `instanceId`, `mode`, `partyId`, `requestedMembers[]` | `instance_created` | `INSTANCE_ALREADY_EXISTS` if same key has different seed |
| `join_instance` | `tokenId`, `tokenProof`, `characterId` | `member_joined` | `TOKEN_EXPIRED`, `LOCKOUT_ACTIVE`, or `CAPACITY_FULL` |
| `ready_instance` | `ready=true/false` | `member_ready` | `REVISION_MISMATCH` with current snapshot |
| `submit_round_plan` | `roundNumber`, `plan`, `expectedRevision` | `round_plan_accepted` | Same `idempotencyKey` returns original result; changed payload is `IDEMPOTENCY_CONFLICT` |
| `hold_order` | `roundNumber`, `reason`, `expectedRevision` | `hold_accepted` | A hold is a legal plan and spends the same round turn |
| `request_checkpoint_join` | `tokenId`, `characterId`, `checkpointId` | `replacement_joined` | Rejected unless lifecycle is `checkpoint` |
| `leave_instance` | `reason` | `member_left` | Repeated leave is an idempotent success |
| `reconnect_instance` | `characterId`, `lastSeenRevision`, `resumeToken` | `snapshot_replayed` | Replay from last committed revision; no client-side state merge |
| `abandon_instance` | `leaderCharacterId`, `confirmation=true` | `instance_abandoned` | Requires leader or unanimous active-party confirmation |
| `kick_at_checkpoint` | `leaderCharacterId`, `targetCharacterId`, `reasonCode` | `member_kicked` | Only legal in `checkpoint`; cannot kick during resolution |

A command whose `expectedRevision` differs from the committed revision is rejected without side effects. The client must replace its local snapshot and resubmit with a new `messageId` but may retain the same semantic plan idempotency key only when the server confirms no prior commit.

## 5. RoundPlan, HoldOrder, targeting, and threat

```text
RoundPlan:
  planId: string
  characterId: string
  roundNumber: integer >= 1
  expectedRevision: integer >= 0
  verb: attack | guard | heal | cleanse | interact | move | assist | retreat | use_item
  abilityId: string
  targetKind: enemy | ally | self | prop | exit
  targetId: string
  autoPolicy: manual | auto_last_plan | auto_guard | auto_hold
  declaredAt: ISO-8601 UTC
  spendTurns: 1

HoldOrder:
  characterId: string
  roundNumber: integer >= 1
  reason: disconnect | logout | timeout | player_hold
  fallback: guard | hold_position
  spendTurns: 1
```

Targeting is declared before resolution. A target must be visible and legal in the current snapshot; if it becomes invalid, CODE applies the ability’s deterministic fallback (`guard` for defensive plans, `hold_position` otherwise). Threat is intentionally simple: the encounter keeps a `declaredTargetId` per hostile and may switch only when a rule explicitly says `taunt`, `guard_break`, or the current target is unavailable. There is no hidden threat simulation and no prose-based retargeting.

Allowed combat verbs are `attack`, `guard`, `heal`, `cleanse`, `taunt`, `interrupt`, `brace`, `move`, `assist`, `retreat`, `use_item`, and `interact`. `interact` may operate a room prop but never bypasses a locked prerequisite.

## 6. CombatReceipt

| Field | Type | Rule |
|---|---|---|
| `receiptId` | string | Unique per character per resolved round |
| `instanceId`, `roundNumber`, `revisionBefore`, `revisionAfter` | string/integer | Revision after is exactly before + 1 for a committed round |
| `characterId`, `abilityId`, `verb`, `targetId` | string | Echo the accepted plan |
| `initiativeRoll`, `attackRoll`, `defenseRoll` | integer | Server-seeded; omit hidden rolls from client if policy requires |
| `hit` | boolean | Resolver result |
| `hpBefore`, `hpDelta`, `hpAfter`, `hpMax` | integer | `hpAfter` clamped to `[0,hpMax]` |
| `statusAdded[]`, `statusRemoved[]` | string[] | Catalog ids only |
| `durabilityDeltas[]` | `{itemId,delta}` | Combat −1% per round on weapon and armor; wipe adds −10% equipped |
| `lootGrantIds[]` | string[] | References committed personal grants only |
| `objectiveDeltas[]` | `{objectiveId,delta}` | Code-owned counters |
| `downed`, `roomCleared`, `checkpointId?` | boolean/string | True only when committed |
| `failureCode?` | enum | `INVALID_TARGET`, `INSUFFICIENT_RESOURCE`, `STATUS_BLOCKED`, `STALE_PLAN`, or `NONE` |
| `narrationFacts[]` | string[] | Whitelisted fact keys, never free-form rewards |

A receipt is immutable. The narration request includes `receiptId`, a redacted fact projection, and the permitted prose template. It never includes an instruction to create missing ledger values.

## 7. Personal loot and idempotency

Every player receives a separate `LootGrant`. A grant is written only after eligibility, lockout, and inventory capacity checks succeed.

```text
LootGrant:
  lootGrantId: string
  idempotencyKey: "{instanceId}:{roundNumber}:{characterId}:{dropTableId}:{slotIndex}"
  characterId: string
  instanceId: string
  sourceRoomId: string
  sourceBossId: string
  itemId: string
  quantity: integer >= 1
  goldAmount: integer >= 0
  cosmeticTokenAmount: integer >= 0
  bindRule: soulbound | tradeable | account_bound
  committedAt: ISO-8601 UTC
```

The same idempotency key can return the original grant, never a second item or gold amount. LLM output cannot mint gold, cosmetic tokens, items, lockout skips, or catch-rate changes. A full inventory sends the item to personal mail only if the item’s bind and mail rules permit it; otherwise the grant is retained in a server-side claim queue with the same key.

## 8. Disconnect, logout, and reconnect matrix

| Case | Detection | During round | At checkpoint | Result |
|---:|---|---|---|---|
| 1 | Mobile background under 30 seconds | Preserve last valid plan | N/A | `HoldOrder` only if plan was not received; reconnect to same revision |
| 2 | Network loss over 30 seconds | Hold for deadline | N/A | Auto-hold; no mid-round replacement |
| 3 | Network loss during resolution | Server finishes frozen plans | N/A | Replay committed receipts; client cannot resubmit |
| 4 | Logout in combat | Immediate `HoldOrder` | N/A | Remains in roster until timeout, then checkpoint kick eligibility |
| 5 | Logout in hub | N/A | N/A | Persist `placeId`, no combat state created |
| 6 | Reconnect before deadline | Revalidate resume token | N/A | Restore plan editor against current snapshot |
| 7 | Reconnect after round commit | Replay from `lastSeenRevision` | N/A | No duplicate spend or loot |
| 8 | Reconnect after wipe | N/A | Allowed | Spawn at checkpoint with wipe durability result |
| 9 | Party leader disconnects | Hold leader slot | At checkpoint | Transfer lead to longest-connected member; no automatic kick in combat |
| 10 | Disconnect exceeds 2 consecutive rounds | Auto-hold each round | Allowed | Leader may kick at checkpoint; replacement token may be issued |

Timeout values are **SPEC: 30 seconds soft reconnect window, 90 seconds round deadline, and two consecutive rounds**; all are data flags, not prose assumptions. A disconnected player never causes another player’s loot to be granted or another player’s combat to be narrated as disconnected.

## 9. Plan-auto versus manual

| Property | Manual | Plan-auto |
|---|---|---|
| Selection | Player picks verb, ability, target | Player selects an approved fallback policy |
| Turn spend | 1 per Dungeon Mode A round; even-round Mode C billing | Exactly the same |
| Validation | Snapshot at submit | Snapshot at each round resolution |
| Legal fallback | Guard/hold on invalid target | `auto_last_plan`, `auto_guard`, or `auto_hold` only |
| Loot and lockout | Identical | Identical |
| Narration | Identical receipt-driven path | Identical receipt-driven path |

Auto mode is not a faster or stronger mode and cannot bypass a lockout, room gate, downed state, or inventory rule.

## 10. Raid phone frame

The compact raid frame is a text UI with ten rows. It is a presentation contract, not an image or a production component.

| Row | Content |
|---:|---|
| 1 | `MILLSTONE HOLLOW — PHASE {phase}/3 — ROUND {round}` |
| 2 | `CHECKPOINT {checkpointId} — REV {expectedRevision}` |
| 3 | `PARTY 10/10 — READY {readyCount}/10` |
| 4 | `YOU HP {hpCurrent}/{hpMax} — STATUS {statusShort}` |
| 5 | `TARGET {declaredTargetName} — THREAT {declaredTargetRule}` |
| 6 | `PLAN {manualOrAuto} — {verb} {abilityId}` |
| 7 | `ALLIES {downedCount} downed — next checkpoint rez only` |
| 8 | `LOCKOUT {weekKey} — phase clear {phaseClearState}` |
| 9 | `RECEIPT {receiptIdShort} — loot {lootCount} personal` |
| 10 | `[READY] [CHANGE PLAN] [HOLD] [STOP]` |

**Stop stays put:** Stop/Leave is always visible and never moves because of a chat message, narration, or party reorder. Selecting Stop opens a confirmation; it never silently abandons an instance.

## 11. Downed, rez, checkpoint, and durability

A character with `hp_current=0` is `downed=true` and cannot submit an attack. Allies may protect or continue the round, but no combat resurrection occurs. A downed character returns only when CODE commits a checkpoint transition or a wipe restoration. A checkpoint records `roomId`, `checkpointId`, committed objective counts, granted loot keys, member roster, and revision. Wipe restoration returns players to checkpoint HP/STA policy, keeps earned quest progress, and applies equipped durability −10%. Combat applies weapon and armor durability −1% per resolved round. A broken item has zero stats but remains repairable. Inn rest is free HP/STA recovery in a hub and costs one turn; it does not repair durability.

## 12. Shared status-effect catalog

Durations and magnitudes are ledger values. The narration layer may describe their visible consequence but may not invent values.

| ID | Public label | Module tags | Default duration | Code effect |
|---|---|---|---:|---|
| `bleed` | Bleed | `hp_check`, `hunt_part` | 2 rounds | −2 HP at round end |
| `slow` | Slow | `hp_check`, `frame_heat` | 1 | Initiative −2 |
| `light_ward` | Light Ward | `hp_check`, `steadfast` | 2 | First darkness-tagged hit −3 |
| `heat_haze` | Heat Haze | `frame_heat`, `lanceyard` | 2 | Frame heat gain +2 |
| `hull_breach` | Hull Breach | `ship_board` | 2 | Ship integrity −3/round |
| `steadfast_break` | Steadfast Break | `steadfast` | 1 | Cannot gain steadfast this round |
| `score_buff` | Score Buff | `score_set`, `circuit_arc` | 2 | Score action +1 |
| `bond_scare` | Bond Scare | `bond_type`, `bond_heart` | 2 | Bond action −1 |
| `wanted` | Wanted | `heat_wanted` | 3 | Patrol threat +1 |
| `exam_focus` | Exam Focus | `hp_check`, `hollow_term` | 2 | Next checked spell +2 |
| `guarded` | Guarded | `hp_check` | 1 | Incoming damage −3 |
| `marked` | Marked | `hp_check` | 2 | Declared target receives +1 hit |
| `silenced` | Silenced | `hp_check` | 1 | Ability verbs blocked; basic attack remains |
| `rooted` | Rooted | `hp_check`, `realm_gate` | 1 | Move verb blocked |
| `dazed` | Dazed | `hp_check` | 1 | Next plan has −2 initiative |
| `poisoned` | Poisoned | `hp_check`, `hunt_part` | 3 | −1 HP/round |
| `soaked` | Soaked | `ship_board`, `hp_check` | 2 | Fire-tagged damage −2; cold-tagged damage +1 |
| `frayed` | Frayed | `steadfast`, `score_set` | 2 | Resolve meter −1 |
| `inspired` | Inspired | `score_set`, `bond_heart` | 2 | One support effect +1 |
| `bond_link` | Bond Link | `bond_type`, `bond_heart` | 2 | Paired action may share 2 HP cost |
| `gate_spark` | Gate Spark | `realm_gate` | 2 | Next gate check +1 |
| `floor_flagged` | Floor Flagged | `hp_check_floor_flags` | 1 | Floor hazard is active and visible |
| `cozy` | Cozy | `cozy_tick` | 3 | Next hub recovery tick +1, combat damage unchanged |
| `heat_wanted` | Heat Wanted | `heat_wanted` | 3 | Encounter escalation counter +1 |

Status stacking is defined per catalog row; unspecified duplicate applications refresh duration up to the listed maximum and do not multiply the effect.

## 13. Instance interactables and hazards

Instance props are ordinary typed interactables. They do not require meshes and cannot be used to bypass a committed gate.

| ID | Locked instance | Type | Requires | Success effect | Failure effect |
|---|---|---|---|---|---|
| `prop_gate_lampwood_seal` | `dungeon_lampwood_gate` | locked door | `key_lampwood_seal` | Opens `room_gate_2` | `floor_flagged` |
| `prop_gate_rope_bridge` | `dungeon_lampwood_gate` | lever | `interact` | Party crosses; room transition | One character `rooted` |
| `prop_gate_moth_latch` | `dungeon_lampwood_gate` | secret exit | `wick_sight` | Reveals checkpoint shortcut | No change |
| `prop_hollow_unlit_sconce` | `dungeon_unlit_hollow` | lightable | `item_wick_oil` | Adds `light_ward` to party | `floor_flagged` |
| `prop_hollow_false_floor` | `dungeon_unlit_hollow` | trap plate | `inspect` | Disarms hazard | −3 HP to actor |
| `prop_hollow_ash_door` | `dungeon_unlit_hollow` | locked door | `key_ash_latch` | Opens archive room | `slow` |
| `prop_coil_water_pump` | `dungeon_coil_warehouse` | pump | `interact` | Clears `soaked` and opens drain | −1 durability tool |
| `prop_coil_crate_lane` | `dungeon_coil_warehouse` | movable cover | `move` | Grants guarded cover for 1 round | `floor_flagged` |
| `prop_coil_tide_hatch` | `dungeon_coil_warehouse` | secret exit | `tide_listening` | Reveals return route | No change |
| `prop_anvil_slag_gate` | `dungeon_anvil_deep` | locked door | `item_cool_rivet` | Opens forge descent | `heat_haze` |
| `prop_anvil_fault_lever` | `dungeon_anvil_deep` | lever | `inspect` | Marks safe stair | Actor `dazed` |
| `prop_anvil_oath_chest` | `dungeon_anvil_deep` | personal chest | `checkpoint` | Opens only personal claim | No shared loot |

Each interaction is a round plan with `verb=interact`, a declared prop target, and one turn spend. A secret exit changes room routing only; it never skips a boss lockout or creates loot.

## 14. Instance-specific encounter skeletons

| Instance | Rooms | Checkpoints | Boss/phase rule | Personal clear condition |
|---|---:|---|---|---|
| `dungeon_lampwood_gate` | 4 | `cp_gate_entry`, `cp_gate_bridge` | The Gate Warden becomes targetable after two seal props are resolved | `boss_gate_warden` defeated and room receipt committed |
| `dungeon_unlit_hollow` | 5 | `cp_hollow_sconce`, `cp_hollow_archive` | The Hollow Listener gains `light_ward` vulnerability after three lit sconces | `boss_hollow_listener` defeated |
| `dungeon_coil_warehouse` | 4 | `cp_coil_dock`, `cp_coil_pump` | The Brine Hoarder loses cover after pump success | `boss_brine_hoarder` defeated |
| `dungeon_anvil_deep` | 5 | `cp_anvil_gate`, `cp_anvil_fault` | The Faultbound Smith can be damaged after the safe stair is marked | `boss_faultbound_smith` defeated |
| `dungeon_millstone_hollow` | 9 | `cp_mill_phase_1`, `cp_mill_phase_2`, `cp_mill_phase_3` | Three phases; ten players; phase clear is committed separately | `boss_the_millwarden` phase 3 defeated |

## 15. Kick, lead, and replacement policy

The leader may transfer leadership at any safe state. A kick requires a reason code (`disconnect`, `abusive_text`, `afk_timeout`, `voluntary_request`) and is legal only in `ready`, `checkpoint`, or `hold` after the current round has resolved. A kicked player keeps already committed personal loot and quest progress but cannot rejoin the same active instance unless the leader issues a new checkpoint token and the kick reason is `disconnect` or `voluntary_request`. No player can be kicked to alter a loot roll.

A replacement inherits no prior plan, loot, or lockout credit. It begins at the checkpoint, receives the current snapshot, and can earn only future grants. Raid replacement is permitted at checkpoints only and cannot violate the exact ten-member requirement during a resolved round.

## 16. Security, failure modes, and observability

| Failure | Server response | Client response | Telemetry event |
|---|---|---|---|
| Revision mismatch | Reject with current snapshot; no side effects | Replace snapshot and show “The room changed; review your plan.” | `instance_revision_rejected` |
| Duplicate command | Return original result by idempotency key | Do not double-animate or double-spend | `command_duplicate_replayed` |
| Loot transaction retry | Return original `LootGrant` | Show one claim | `loot_grant_replayed` |
| Invalid target | Apply deterministic fallback or failure code | Show legal targets | `combat_invalid_target` |
| Resolver timeout | Keep instance in `hold`; do not mint results | Show “Resolving safely; your place is held.” | `resolver_timeout` |
| Client reconnect mismatch | Replay committed revisions | Rebuild UI from server snapshot | `reconnect_replay` |
| Unauthorized token | Reject and revoke token after 3 failures | Show generic join failure | `token_rejected` |
| LLM-provided invented reward | Drop narration request and alert evaluator | Show committed receipt only | `narration_fact_violation` |
| Cross-world id collision | Reject persistence write | Ask for pack refresh | `namespace_collision` |
| Live import attempt | Block by environment boundary | Show WOF-only unavailable message | `live_import_blocked` |

No telemetry event contains raw prose, private chat, child data, or an un-hashed account identifier. Account references are salted hashes.

## 17. Compact chrome templates

| Template ID | Text |
|---|---|
| `combat_hud` | `[COMPACT LEDGER] HP {hp_current}/{hp_max} | ARMOR {armor_class} | CHECKPOINT {checkpoint_id}` |
| `party_hud` | `[INSTANCE DOOR] {instance_name} | party {party_count}/{party_max} | checkpoint {checkpoint_id}` |
| `round_ready` | `Round {round}: choose a move, guard, help, or hold. The result is settled after everyone is ready.` |
| `receipt_summary` | `Receipt {receipt_id}: {verb} {target_name} | HP {hp_delta} | statuses {status_count} | personal claims {loot_count}` |
| `checkpoint_notice` | `Checkpoint secured: {checkpoint_id}. A safe replacement may join here.` |
| `hold_notice` | `The party is holding position. No new combatant can join until a checkpoint.` |
| `downed_notice` | `{character_name} is downed. Recovery is available at the next committed checkpoint.` |
| `wipe_notice` | `The party returns to {checkpoint_id}. Progress already recorded remains recorded.` |
| `lockout_notice` | `{boss_name} is unavailable for this character until {week_key}.` |
| `personal_loot` | `[LOCKER] Personal claim: {item_name} | source {room_id} | status {claim_status}` |

## 18. Evaluation probes

| Input | Expected ledger result |
|---|---|
| Submit plan with revision 3 while server is revision 4 | Reject `REVISION_MISMATCH`; no turn spend |
| Retry accepted plan with same idempotency key | Return one original receipt |
| Two players target same enemy | Both plans resolve in initiative order against declared target |
| Target dies before second plan | Second plan uses deterministic fallback, never retargets by prose |
| Player disconnects before submit | `HoldOrder`; round still resolves at deadline |
| Player disconnects during resolution | Frozen plans complete once; reconnect replays receipt |
| Entire party reaches HP 0 | Wipe to last checkpoint, retain committed objective progress |
| Player leaves during round | Leave queued; removal occurs after resolution or at checkpoint |
| Leader kicks at checkpoint | Target removed; future replacement token allowed |
| Replacement joins in middle of room | Reject until checkpoint |
| Loot retry after network failure | Same `lootGrantId`, one inventory mutation |
| Full inventory on personal drop | Mail or claim queue according to bind rule; no deletion |
| Raid round 1 | No Mode C turn charge under even-round billing |
| Raid round 2 | One integer turn charge per eligible character |
| Broken weapon used | Weapon contributes zero stats; receipt records no repair side effect |
| Inn rest from instance | Reject; rest only at hub place |
| Logout in hub | Persist `placeId`; no instance token created |
| Logout in combat | Hold order; no automatic defeat |
| Downed ally receives rez ability plan | Reject rez in combat; allow only checkpoint restoration |
| Locked door without prerequisite | `INSUFFICIENT_RESOURCE`; no room transition |
| Secret exit interaction | Change route only; no boss or lockout bypass |
| Narration says “you earned 50 gold” when receipt says 0 | Block narration and emit `narration_fact_violation` |
| Client sends live SynapticGM save import | Reject at boundary; no WOF state mutation |
| Party size 6 for ordinary dungeon | Reject `CAPACITY_FULL` |
| Millstone party size 5 | Reject; Millstone requires exactly 10 |
| Same character enters same boss twice in week after clear | Reject `LOCKOUT_ACTIVE` |
| Wipe before boss clear | No boss lockout consumed |
| Player opens mail between rounds | 0 combat turn, but no change to active combat snapshot |

## 19. Implementation acceptance checklist

| Check | Required result |
|---|---|
| Determinism | Same seed, snapshot, and accepted plans produce byte-equivalent ledger result |
| Revision safety | Every mutation checks `expectedRevision` and increments exactly once |
| Idempotency | Retries cannot duplicate turns, loot, gold, tokens, durability, or lockouts |
| Personal loot | Every grant is character-scoped and independently claimable |
| No mid-combat fill | Replacement is rejected outside checkpoint lifecycle |
| Raid size | Millstone Hollow remains exactly 10 players and 3 phases |
| Lockouts | Weekly per-character boss and phase keys are committed only on clear |
| Narrative safety | Narrator receives receipts/facts, not authority over results |
| IP safety | All names and mechanics are WOF-original; no licensed terms or cloned products |
| Live boundary | No live SynapticGM imports, clocks, source paths, or production app code |
| Wallet separation | Gold and cosmetic tokens remain distinct and never substitute for power |
| Commercial safety | No gacha, outcome sales, lockout skips, catch-rate packs, or power packs |

## References

[1]: /home/ubuntu/upload/pasted_content_16.txt "WOF typed-data gap-fill specification"
[2]: /home/ubuntu/WOF_Content_Packs/WOF_ash_compact_Pack.md "Ash Compact factual baseline pack"
