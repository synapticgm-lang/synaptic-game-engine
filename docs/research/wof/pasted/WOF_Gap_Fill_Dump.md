# WOF (World of Fantasy) — Gap Fill Dump

**Date:** August 15, 2026
**Status:** Design research for later-release text RPG. NOT production code. NOT the live game (SynapticGM).
**Purpose:** Fill implementation gaps left by `WOF_Multiplayer_Design_Dump.md`. That file established PartyInstance, EncounterLedger, RaidEncounterScript, RoleFlag, join/loot/wipe rules, and a text-block Millstone Hollow. This file adds BattlePlan, runMode/disconnect, sync payload, housing/business/economy, LLM cost model, and expanded failure modes. Where the prior dump has a schema, this file EXTENDS it rather than replacing it.

---

## IP Check

All names, mechanics, factions, and places below are original to WOF. No licensed settings, races, bosses, or faction names are used. Working names (Ash Compact, Tide Covenant, Hearthborn, Millcross, Reedfen, Ash Seat, Tidehold, Millstone Hollow, Ash Seat, Millwarden) are original placeholders. Patterns referenced from public/citable sources (Evennia combat handler, StoryNexus Place vs Setting, classic auction house/housing models) are cited as methodology, not copied content.

---

## 1) Instance + Combat Schemas (Full Fields, Types, Invariants)

### 1A. PartyInstance — Extended

The prior dump defined PartyInstance with `status`, `joinWindow`, `checkpointRoomId`, etc. Below is the EXTENDED version with fields needed for runMode, disconnect handling, and parallel-party isolation invariants.

```typescript
interface PartyInstance {
  id: string;                              // "instance_abc123"
  dungeonTemplateId: string;               // references DungeonTemplate
  seed: number;                            // per-instance RNG seed; generated at creation; never shared
  partyId: string;                         // references Party
  leaderId: string;                        // party leader (can transfer)
  status: "forming" | "active" | "completed" | "abandoned" | "locked";
  currentRoomId: string | null;            // current node in dungeon graph
  encounterLedgerId: string | null;        // active EncounterLedger if in combat
  checkpointRoomId: string | null;          // last checkpoint reached
  lockoutExpiresAt: number | null;         // epoch ms; player cannot re-enter template until expired
  joinWindow: "open" | "first_combat" | "locked";
  runMode: "manual" | "auto" | null;       // one runMode per instance at a time; null = not in combat
  disconnectPolicy: "hold" | "last_plan";   // derived from runMode: manual→hold, auto→last_plan
  createdAt: number;
  updatedAt: number;
}

// Invariants:
// 1. seed is unique per instance. Two instances of the same template NEVER share a seed.
// 2. runMode is set when combat starts and cannot change mid-encounter.
// 3. joinWindow transitions: open → first_combat (on first EncounterLedger creation) → locked.
//    It can reopen at checkpoint: locked → open (checkpoint join only).
// 4. lockoutExpiresAt is set on boss kill (completion), not on abandon.
// 5. Only leaderId can: pull, call ready-check, set marks, transfer leadership.
```

### 1B. RaidInstance — New

Raids share the PartyInstance pattern but need raid-specific fields.

```typescript
interface RaidInstance {
  id: string;                              // "raid_xyz789"
  raidTemplateId: string;                  // references RaidEncounterScript
  seed: number;                            // per-instance seed
  raidId: string;                          // references Raid (10 players, 2 parties of 5)
  leaderId: string;                        // raid leader
  status: "forming" | "active" | "completed" | "abandoned" | "locked";
  currentPhase: number;                    // 1, 2, 3...
  encounterLedgerId: string | null;
  checkpointPhase: number | null;          // last checkpoint phase reached (1 or 2)
  lockoutExpiresAt: number | null;          // per-character weekly lockout (7 days from kill)
  joinWindow: "open" | "first_combat" | "locked";
  runMode: "manual" | "auto" | null;
  disconnectPolicy: "hold" | "last_plan";
  scheduledStartTime: number | null;       // for scheduled raids (epoch ms)
  createdAt: number;
  updatedAt: number;
}

interface Raid {
  id: string;
  leaderId: string;
  partyIds: string[];                      // exactly 2 parties of 5 = 10 players
  raidSize: 10;
  maxSize: 10;
}

// Invariants:
// 1. raidSize is always 10. No 25/40-player raids. Never.
// 2. lockoutExpiresAt is per-character, per-boss, 7 days from kill timestamp.
// 3. A character on lockout can still enter to help (no loot), but cannot loot that boss.
// 4. checkpointPhase is set at phase transition (phase 1→2 = checkpoint 1, phase 2→3 = checkpoint 2).
// 5. Only leaderId can: pull, call ready-check, set marks, transfer leadership.
```

### 1C. EncounterLedger — Extended

The prior dump defined EncounterLedger with `round`, `phase`, `status`, `combatants`, `roundActions`, `roundResults`, `lootRolls`. Below is the EXTENDED version with runMode, timeout, and disconnect tracking.

```typescript
interface EncounterLedger {
  id: string;
  instanceId: string;                      // PartyInstance or RaidInstance
  roomNodeId: string;                      // where this encounter takes place
  seed: number;                            // from instance seed
  round: number;                           // current round (starts at 1)
  phase: number;                           // for boss encounters (1, 2, 3...)
  status: "active" | "won" | "lost" | "fled" | "paused";

  runMode: "manual" | "auto";              // set at encounter start; cannot change mid-encounter
  roundDeadline: number | null;            // epoch ms; when timeout fires for current round (manual mode)
  roundDeadlineDuration: number;           // 60000 (dungeon) or 45000 (raid) in ms

  combatants: Combatant[];                 // all participants (players + enemies)
  roundActions: RoundAction[];             // actions submitted this round
  roundResults: RoundResult[];             // resolved results this round
  pendingPauseTriggers: PauseTrigger[];    // conditions that force pause in auto mode

  lootRolls: LootRoll[] | null;            // per-player loot (personal loot model)
  lockoutId: string | null;

  createdAt: number;
  updatedAt: number;
}

interface Combatant {
  id: string;                              // player ID or enemy ID
  name: string;
  side: "party" | "enemy";
  hp: number;
  maxHp: number;
  conditions: Condition[];
  isAlive: boolean;
  isDefending: boolean;                    // set when auto-defend (timeout/AFK)
  isDisconnected: boolean;                 // true if player has disconnected
  disconnectRound: number | null;           // round when disconnect happened
  roundsDisconnected: number;               // how many rounds player has been disconnected
  position: "front" | "back";
  roleFlag: RoleFlag | null;                // for raid encounters
  battlePlanId: string | null;              // references BattlePlan (auto mode only)
}

interface PauseTrigger {
  type: "phase_change" | "add_spawn" | "interrupt_window" | "ally_down" | "stop_called";
  round: number;
  description: string;
  resolved: boolean;
}

// Invariants:
// 1. The LLM NEVER writes to EncounterLedger. Code owns all fields.
// 2. roundResults are appended-only. Once written, they cannot be modified.
// 3. hp in combatants is the authoritative source. LLM prose must not contradict it.
// 4. runMode is set at encounter creation and is immutable for that encounter.
// 5. In manual mode, round resolves when: all alive players submit OR roundDeadline fires.
// 6. In auto mode, round resolves when: BattlePlans fill all actions OR pause trigger fires.
```

### 1D. BattlePlan — New

BattlePlan is the per-player default action set for auto mode. It tells the resolver what action to take each round unless a pause trigger overrides.

```typescript
interface BattlePlan {
  id: string;                              // "plan_player123_encounter456"
  playerId: string;
  encounterLedgerId: string;               // which encounter this plan is for
  defaults: BattlePlanDefault;             // what to do each round by default
  marks: Record<string, string>;            // target marks: { "mark_1": "enemy_id_abc" }
  phaseOverrides: BattlePlanOverride[];    // per-phase behavior changes
  pauseOn: PauseCondition[];               // conditions that force pause (auto mode)
  valid: boolean;                           // false if plan references dead targets, empty items, etc.
  updatedAt: number;
}

interface BattlePlanDefault {
  action: "attack" | "defend" | "ability" | "use_item";
  targetId: string | null;                 // "mark_1" resolves to marks map, or direct enemy ID
  abilityId: string | null;
  itemId: string | null;
  targetStrategy: "lowest_hp" | "highest_hp" | "marked" | "boss" | null;
  // If targetId is null and targetStrategy is set, resolver picks target by strategy.
  // If both are null, resolver defaults to attack lowest_hp enemy.
}

interface BattlePlanOverride {
  phase: number;                            // applies when EncounterLedger.phase === this
  action: "attack" | "defend" | "ability" | "use_item";
  targetId: string | null;
  abilityId: string | null;
  itemId: string | null;
  condition: "always" | "below_50pct_hp" | "ally_below_30pct_hp" | "interrupt_available" | "cleanse_needed";
  // condition determines whether the override fires this round.
  // If condition is "always", override fires every round of that phase.
  // If condition is "interrupt_available", override fires only when an interrupt window is open.
}

interface PauseCondition {
  type: "phase_change" | "add_spawn" | "interrupt_window" | "ally_down" | "stop";
  description: string;
  // When any of these conditions are met, auto mode pauses and switches to manual for one round.
  // The player can then resume auto or adjust their plan.
}

// Invariants:
// 1. BattlePlan is per-player, per-encounter. It is NOT shared.
// 2. In manual mode, BattlePlan is ignored. Players submit RoundActions directly.
// 3. In auto mode, the resolver reads each player's BattlePlan to fill their RoundAction.
// 4. If BattlePlan.valid is false, the resolver falls back to "defend" for that player.
// 5. pauseOn conditions are checked AFTER resolution, BEFORE next round.
//    If triggered, the next round starts in manual mode (player must re-enable auto).
// 6. Marks in BattlePlan must match marks set by the raid leader.
//    If leader changes marks, BattlePlan marks are NOT auto-updated; player must re-save plan.
// 7. phaseOverrides take priority over defaults when their condition is met.
// 8. If multiple phaseOverrides match, the first in the array wins (order matters).
```

### 1E. RoundAction — Extended

```typescript
interface RoundAction {
  combatantId: string;
  action: "attack" | "defend" | "ability" | "flee" | "use_item";
  targetId: string | null;
  abilityId: string | null;
  itemId: string | null;
  submittedAt: number;                      // epoch ms
  isAutoDefend: boolean;                     // true if system filled due to timeout
  isFromBattlePlan: boolean;                 // true if filled by BattlePlan (auto mode)
  isFromDisconnect: boolean;                // true if filled due to disconnect (hold or last_plan)
}

// In auto mode, isFromBattlePlan = true and isAutoDefend = false (unless plan was invalid).
// In manual mode with timeout, isAutoDefend = true and isFromBattlePlan = false.
// In manual mode with disconnect, isFromDisconnect = true; action = "defend" (hold) or last plan (auto).
```

### 1F. RunMode: Manual vs Auto — Full Rules

| Aspect | Manual Mode | Plan-Auto Mode |
|--------|-------------|----------------|
| **How actions are filled** | Each player submits a RoundAction each round | BattlePlan fills RoundActions automatically |
| **Round resolution** | All alive players submit → server resolves full round → repeat | BattlePlans fill → server resolves → check pause triggers → repeat |
| **Timeout** | 60s (dungeon), 45s (raid). Timeout → auto-defend | No timeout (plan is always ready) |
| **Pause triggers** | N/A (player controls every round) | Phase change, add spawn, interrupt window, ally down, Stop called |
| **When paused** | N/A | Switches to manual for 1 round. Player can re-enable auto or adjust plan. |
| **Stop** | Player types "stop" or clicks Stop button → round resolves, then pauses | Player clicks Stop → current round resolves, then pauses |
| **Disconnect** | Hold: player auto-defends until reconnect or 2-round flee | Last plan: BattlePlan continues filling for that player |
| **One runMode per instance** | Set at encounter start; cannot change mid-encounter | Same |

```
Disconnect behavior decision tree:

IF runMode == "manual":
  → disconnectPolicy = "hold"
  → disconnected player auto-defends each round
  → after 2 rounds of disconnect: auto-flee (removed from combat, placed at entrance/checkpoint)
  → if player reconnects during auto-defend: resumes control next round
  → if player reconnects after auto-flee: placed at entrance/checkpoint, can re-enter if joinWindow allows

IF runMode == "auto":
  → disconnectPolicy = "last_plan"
  → disconnected player's BattlePlan continues filling actions
  → no auto-flee in auto mode (plan keeps them contributing)
  → if player reconnects: resumes control (auto continues unless they pause)
  → if ALL players disconnect in auto mode: encounter pauses, instance persists 30 min (dungeon) / 60 min (raid)
```

### 1G. Join / Wipe / Loot Rules — v1 Decisions

| Rule | v1 Decision | Rationale |
|------|-------------|-----------|
| **Join lock** | `joinWindow: "open"` before first combat. After first combat → `"locked"`. Reopens at checkpoint → `"open"` (checkpoint join only, new player starts at checkpoint). | Prevents bringing fresh players to bypass wipes. Checkpoint joins are fair. |
| **Checkpoint vs entrance** | Wipe → checkpoint reset (not entrance reset). Party returns to last checkpoint. HP restored to full. Cleared rooms stay cleared. Uncleared rooms respawn. | Less punishing than entrance reset, more punishing than no penalty. |
| **Loot model** | **Personal loot** (v1). Each player gets their own loot roll from the loot table. No need-greed, no leader assign. Code rolls per-player. | Eliminates loot-ninja griefing. No inter-player conflict. Each player sees their own drop. |
| **Loot model — future** | Need-greed-pass could be added later (v2) if players want classic MMO feel. Requires trade window and dispute resolution. Not v1. | Personal loot is safe; need-greed adds social texture but risk. |
| **Raid loot** | Personal loot, same as dungeon. Per-character weekly lockout per boss. | Consistent with dungeon model. Lockout prevents farming. |
| **Lockout scope** | Per-character, per-boss (not per-raid). 7 days from kill. Character on lockout can still help (no loot). | Prevents farming without blocking helpful players. |

---

## 2) Toy Raid: Millstone Hollow — Full 3-Phase Script

The prior dump had this as a text block. Below is the same raid as structured TypeScript, matching the RaidEncounterScript interface. All mechanics are original.

```typescript
const millstoneHollowScript: RaidEncounterScript = {
  id: "raid_millstone_hollow",
  name: "Millstone Hollow",
  raidSize: 10,
  bossName: "The Millwarden",
  bossMaxHp: 5000,                           // scaled for 10 players
  enrageRound: 25,                           // if not defeated by round 25, wipe
  lockoutDurationHours: 168,                 // 7 days
  phases: [
    // ─── PHASE 1: "The Grinding" (100% – 67% HP) ───
    {
      id: "phase_1",
      hpPctTrigger: 100,                      // phase 1 starts at full HP
      addSpawns: [
        {
          enemyTemplateId: "enemy_millstone_swarmling",
          count: 2,
          position: "flank",
        },
      ],
      soakCheck: {
        id: "soak_millstone_slam_p1",
        description: "Millstone Slam: 2 players must be in the impact zone or party takes 30 damage",
        minPlayersSoaking: 2,
        damageIfFailed: 30,                   // damage to entire party
        roundInterval: 4,                     // every 4 rounds
      },
      interruptWindow: null,                 // no interrupt in phase 1
      enrageRound: null,
      narrationToken: "PHASE_1_GRINDING",
    },
    // ─── PHASE 2: "The Hollowing" (67% – 33% HP) ───
    {
      id: "phase_2",
      hpPctTrigger: 67,                      // phase 2 starts when boss HP drops below 67%
      addSpawns: [
        {
          enemyTemplateId: "enemy_hollowed_husk",
          count: 3,
          position: "back",                  // attack back-rank players
        },
      ],
      soakCheck: {
        id: "soak_millstone_slam_p2",
        description: "Millstone Slam: 3 players must be in the impact zone or party takes 40 damage",
        minPlayersSoaking: 3,                // increased from 2 in phase 1
        damageIfFailed: 40,
        roundInterval: 4,
      },
      interruptWindow: {
        id: "interrupt_grinding_hymn_p2",
        description: "Grinding Hymn: must be interrupted within 2 rounds or party takes 50 damage",
        abilityName: "Grinding Hymn",
        roundsToInterrupt: 2,
        damageIfNotInterrupted: 50,
        interruptAbilityFlag: "interrupt",
        roundInterval: 3,                    // every 3 rounds
      },
      enrageRound: null,
      narrationToken: "PHASE_2_HOLLOWING",
    },
    // ─── PHASE 3: "The Reckoning" (33% – 0% HP) ───
    {
      id: "phase_3",
      hpPctTrigger: 33,                      // phase 3 starts when boss HP drops below 33%
      addSpawns: [],                         // no more adds in phase 3
      soakCheck: {
        id: "soak_millstone_slam_p3",
        description: "Millstone Slam: 4 players must be in the impact zone or party takes 60 damage",
        minPlayersSoaking: 4,                // increased from 3 in phase 2
        damageIfFailed: 60,
        roundInterval: 2,                    // every 2 rounds (faster)
      },
      interruptWindow: {
        id: "interrupt_grinding_hymn_p3",
        description: "Grinding Hymn: must be interrupted within 2 rounds or party takes 50 damage",
        abilityName: "Grinding Hymn",
        roundsToInterrupt: 2,
        damageIfNotInterrupted: 50,
        interruptAbilityFlag: "interrupt",
        roundInterval: 2,                    // every 2 rounds (faster)
      },
      enrageRound: 25,                        // Final Grind: if not defeated by round 25, wipe
      narrationToken: "PHASE_3_RECKONING",
    },
  ],
};

// Role flags needed for Millstone Hollow:
//   front_tank:    2  (hold boss aggro)
//   back_heal:     2  (heal party, cleanse conditions)
//   soak:          4  (absorb Millstone Slam — 2 in p1, 3 in p2, 4 in p3)
//   interrupt:     2  (interrupt Grinding Hymn in p2 and p3)
//   ranged_dps:    remaining slots
//   melee_dps:     remaining slots
//
// Checkpoints:
//   Phase 1 → Phase 2 transition: checkpoint 1 (all players must be alive; dead can be revived)
//   Phase 2 → Phase 3 transition: checkpoint 2
//
// Enrage:
//   Phase 3: boss damage +50% starting round 20
//   Round 25: if boss not dead, party wipes (Final Grind)
```

### Phase Transition Logic (Code-Owned)

```typescript
// Pseudocode — code owns this, LLM never executes it
function checkPhaseTransition(ledger: EncounterLedger, script: RaidEncounterScript): void {
  const boss = ledger.combatants.find(c => c.side === "enemy" && c.id === script.bossName);
  if (!boss) return;
  const hpPct = (boss.hp / boss.maxHp) * 100;

  for (const phase of script.phases) {
    if (hpPct < phase.hpPctTrigger && ledger.phase < parseInt(phase.id.split("_")[1])) {
      ledger.phase = parseInt(phase.id.split("_")[1]);
      // Fire pause trigger for auto mode
      if (ledger.runMode === "auto") {
        ledger.pendingPauseTriggers.push({
          type: "phase_change",
          round: ledger.round,
          description: `Phase ${ledger.phase} started`,
          resolved: false,
        });
      }
      // Set checkpoint
      if (ledger.instanceId is RaidInstance) {
        raidInstance.checkpointPhase = ledger.phase;
      }
      // Spawn adds
      for (const add of phase.addSpawns) {
        spawnEnemies(ledger, add.enemyTemplateId, add.count, add.position);
      }
      // Queue narration token for LLM (phase-change announcement, 2 sentences max)
      queueNarration(phase.narrationToken, ledger.round);
      break;
    }
  }
}

// Soak check resolution (code-owned)
function resolveSoakCheck(ledger: EncounterLedger, soak: SoakCheck): void {
  const soakingCount = countPlayersInSoakZone(ledger, soak.id);
  if (soakingCount < soak.minPlayersSoaking) {
    // Deal damage to entire party
    for (const c of ledger.combatants) {
      if (c.side === "party" && c.isAlive) {
        c.hp -= soak.damageIfFailed;
        if (c.hp <= 0) { c.hp = 0; c.isAlive = false; }
      }
    }
  }
}

// Interrupt window resolution (code-owned)
function resolveInterruptWindow(ledger: EncounterLedger, iw: InterruptWindow): void {
  const interruptAction = ledger.roundActions.find(
    a => a.action === "ability" && a.abilityId === iw.interruptAbilityFlag
  );
  if (!interruptAction) {
    // Not interrupted — damage party
    for (const c of ledger.combatants) {
      if (c.side === "party" && c.isAlive) {
        c.hp -= iw.damageIfNotInterrupted;
        if (c.hp <= 0) { c.hp = 0; c.isAlive = false; }
      }
    }
  }
  // If interrupted, no damage. Cast is stopped.
}
```

---

## 3) Sync Payload

What each client subscribes to during an active encounter. This is the real-time update payload pushed to every player's client each round.

### 3A. EncounterSyncPayload

```typescript
interface EncounterSyncPayload {
  // ─── Round state ───
  roundId: string;                          // unique per round: "round_encounter456_r3"
  round: number;                            // current round number
  phase: number;                            // current phase (1, 2, 3)
  runMode: "manual" | "auto";
  status: "active" | "won" | "lost" | "fled" | "paused";

  // ─── Ready tracking (manual mode) ───
  ready: ReadyState[];                      // per-player submission status
  timeoutEndsAt: number | null;             // epoch ms when round timeout fires (manual only)

  // ─── HP state (authoritative) ───
  combatants: CombatantSync[];              // simplified combatant state for client display

  // ─── Recap table (code-owned, always rendered) ───
  recap: RoundResultSync[];                 // last round's results as table rows

  // ─── Narration ───
  narrationId: string | null;               // ID of LLM narration for this round (null = no narration)
  narrationText: string | null;            // LLM prose (may arrive late — see Late Prose rule)

  // ─── Pause triggers (auto mode) ───
  pauseReason: string | null;               // why auto paused (e.g., "Phase change")
  isPaused: boolean;

  // ─── Marks ───
  marks: Record<string, string>;             // { "mark_1": "enemy_id_abc", ... }

  // ─── Timestamps ───
  resolvedAt: number;                        // when this round was resolved (epoch ms)
}

interface ReadyState {
  playerId: string;
  playerName: string;
  hasSubmitted: boolean;                    // true if RoundAction submitted this round
  isDisconnected: boolean;
  isAutoDefend: boolean;                     // true if timeout filled defend
}

interface CombatantSync {
  id: string;
  name: string;
  side: "party" | "enemy";
  hp: number;
  maxHp: number;
  isAlive: boolean;
  isDefending: boolean;
  conditions: string[];                     // condition type names only (not full Condition objects)
  position: "front" | "back";
  roleFlag: string | null;                   // flag name for raid encounters
}

interface RoundResultSync {
  combatantName: string;
  targetName: string | null;
  action: string;
  roll: number | null;
  outcome: string;                          // "HIT", "MISS", "CRIT", "DODGE", "HEAL", "BLOCK", "FLEE"
  damage: number | null;
  hpAfter: number;
  killed: boolean;
}
```

### 3B. Late Prose Rule

LLM narration may arrive after the code table has already been pushed to clients. This is expected — the code table is the primary information; prose is flavor.

```typescript
// Late prose payload (pushed separately when LLM finishes)
interface LateNarrationPayload {
  roundId: string;                          // MUST match the round this narration belongs to
  narrationText: string;                    // the LLM prose
  narrationId: string;
}

// Rules:
// 1. Late prose MUST carry roundId. The client appends it to the correct round's display.
// 2. Late prose MUST NOT rewrite HP, combatant state, or recap table.
//    The client renders prose as a read-only append below the code table.
// 3. If prose arrives for a round that has already been superseded by a newer round,
//    the client still displays it (in the correct round's position) but marks it as "[late]".
// 4. The server post-filters prose against the ledger before sending:
//    - No "dead" if HP > 0
//    - No "alive" if HP === 0
//    - No damage numbers (prose must not state specific damage; the table owns numbers)
//    - No HP values (the table owns HP)
// 5. If post-filter fails (prose contradicts ledger), the server discards the prose
//    and sends a fallback: "The round resolves." (generic, no contradiction)
```

### 3C. Subscription Model

```
Client subscribes to:  encounter:{encounterLedgerId}
Server pushes:         EncounterSyncPayload (on round resolution)
                       LateNarrationPayload (when LLM finishes, if applicable)
                       PauseEvent (when auto mode pauses)

Client sends:          RoundAction (manual mode, player submits action)
                       BattlePlanUpdate (auto mode, player updates plan)
                       ResumeAuto (auto mode, player re-enables auto after pause)
                       Stop (either mode, player calls stop)

Unsubscribe:           On encounter end (won/lost/fled) or disconnect.
```

### 3D. What Is NOT in the Sync Payload

| Field | Why It's Excluded |
|-------|-------------------|
| Full Combatant objects (with conditions, disconnectRound, etc.) | Client only needs display fields. Internal tracking stays server-side. |
| LootRolls | Sent only on encounter end, not per-round. |
| Seed | Never sent to client. Client never needs the seed. |
| Lockout info | Sent on encounter end, not per-round. |
| BattlePlan | Per-player, stored server-side. Client sends updates but doesn't receive other players' plans. |

---

## 4) Housing / Business / Background World

The live game (SynapticGM) already has `WorldDeal` (cut, risk, runs/week) and `WorldHolding` (shop/camp/guild/town). This section EXTENDS those schemas for WOF's multiplayer economy. It does not replace them.

### 4A. Server Clock + Catch-Up + Login Mail Digest

**Problem:** WOF is a text MMO. Players go offline for days or weeks. The world keeps running. We need a tick model that advances offline player holdings without generating a "14-week novel" of narration.

#### Recommended Tick Model: Fixed-Interval Server Clock

```typescript
interface ServerClock {
  currentTick: number;                      // monotonically increasing tick counter
  tickIntervalMinutes: number;              // 15 minutes (speculative — adjustable)
  lastTickAt: number;                       // epoch ms of last tick execution
}

// Tick model:
// 1. Server advances world state every 15 minutes (wall clock).
// 2. Each tick: update WorldDeal cooldowns, WorldHolding upkeep, AuctionListing expirations,
//    mail delivery, NPC merchant restocks.
// 3. Offline players' holdings tick passively (upkeep accrues, deals cool down, shops earn).
// 4. NO LLM calls during ticks. Ticks are pure code-owned state mutations.
// 5. On login, player receives a MAIL DIGEST (see below), not real-time narration of past events.
```

#### Catch-Up: Capped Passive Advancement

```typescript
interface CatchUpConfig {
  maxTicksCatchUp: number;                  // 672 = 7 days × 96 ticks/day at 15-min intervals
  // If player is offline > 7 days, catch-up caps at 7 days worth of ticks.
  // Beyond 7 days, holdings are frozen (no further accrual, no further upkeep).
  // This prevents gold explosion from long AFK and prevents 14-week debt spirals.
}

// Catch-up rules:
// 1. On login, server calculates ticks since last login: (now - lastSeenAt) / tickIntervalMinutes.
// 2. Applies min(elapsedTicks, maxTicksCatchUp) ticks of passive advancement.
// 3. Passive advancement includes:
//    - WorldHolding upkeep accrual (gold cost per tick)
//    - WorldDeal cooldown reduction (if any deals were on cooldown)
//    - Player shop passive income (if shop has stock and is open)
//    - AuctionListing expiration checks
// 4. Passive advancement does NOT include:
//    - LLM narration of any kind
//    - Random events (events only fire while player is online)
//    - NPC interactions
// 5. Results are summarized in a Mail Digest (see below).
```

#### Login Mail Digest

```typescript
interface MailDigest {
  playerId: string;
  digestEntries: MailDigestEntry[];
  generatedAt: number;
}

interface MailDigestEntry {
  type: "upkeep_paid" | "upkeep_overdue" | "shop_income" | "deal_completed" | "deal_expired"
      | "auction_won" | "auction_lost" | "auction_expired" | "auction_outbid"
      | "deed_seized" | "guest_visit";
  placeId: string | null;                   // which holding this relates to
  amount: number | null;                    // gold gained/lost
  itemIds: string[] | null;                 // items gained
  timestamp: number;                         // when this happened (epoch ms)
  summary: string;                          // one-line plain-text summary (code-generated, NOT LLM)
  // Example: "Upkeep of 50g paid for Reedfen Camp (tick 4820)."
  // Example: "Your auction listing for 'Iron Ore x10' expired unsold."
  // Example: "Deed for Millcross Shop seized after 2 weeks of unpaid upkeep."
}

// Rules:
// 1. Mail Digest is code-generated, NOT LLM-narrated. One-line plain text per entry.
// 2. Digest is capped at 50 entries. If more than 50 events happened, entries are merged:
//    "Upkeep paid for Reedfen Camp (7 ticks)" instead of 7 separate entries.
// 3. Player sees digest on login. They can dismiss it or keep it as mail.
// 4. NO 14-week novel. The digest is a bulleted list, not prose.
// 5. Digest entries older than 30 days are auto-archived (not shown on login, but searchable).
```

### 4B. Deed — Buy vs Build, Upkeep, Guests, Seize

```typescript
interface Deed {
  id: string;                               // "deed_player123_reedfen_camp"
  playerId: string;                         // owner
  placeId: string;                          // where the holding is located (town/hub node)
  holdingType: "shop" | "camp" | "guild_hall" | "house" | "farm";
  acquisition: "bought" | "built";          // bought from NPC market or built on open land
  purchasePrice: number | null;             // gold paid if bought
  buildCost: number | null;                 // gold + materials paid if built
  buildProgressTicks: number | null;         // if building, ticks remaining until complete
  interiorInstanceId: string | null;        // references a personal interior instance (player's private space)
  upkeepPerTick: number;                    // gold cost per tick (15 min)
  upkeepBalance: number;                    // prepaid upkeep gold; decremented each tick
  weeksUnpaid: number;                       // consecutive weeks with upkeepBalance <= 0
  seizeAfterWeeks: number;                  // 2 (after 2 weeks unpaid, deed is seized)
  guestPolicy: "friends_only" | "public";   // v1: friends_only only; public later
  guestList: string[];                      // player IDs who can enter (friends)
  createdAt: number;
  seizedAt: number | null;                  // if seized, when
}

// Invariants:
// 1. guestPolicy is "friends_only" in v1. No public housing entry. (Reduces griefing risk.)
// 2. Guests can visit but cannot steal chests in v1. (No chest-steal v1.)
//    Guest permissions: enter interior, view, talk. Cannot open chests, take items, or modify.
// 3. Upkeep is prepaid. Player deposits gold into upkeepBalance.
//    Each tick, upkeepPerTick is deducted. If balance hits 0, weeksUnpaid increments.
//    After seizeAfterWeeks (2) consecutive weeks unpaid, deed is seized (ownership reverts to NPC market).
// 4. Seized deeds can be re-purchased by anyone (including the original owner) at market price.
// 5. interiorInstanceId is a personal copy — only the owner and their guests can enter.
//    It is NOT a shared hub. It is instanced like a dungeon but peaceful.
// 6. "Bought" deeds are purchased from NPC market (fixed supply per town).
//    "Built" deeds require open land + materials + build time (ticks).
//    v1: only "bought" is implemented. "Built" is v2.
```

### 4C. Personal-Copy Merchant Deals

**Problem:** 100 players must not drain one NPC treasury. If the blacksmith in Millcross has 500g and 100 players all sell loot to that blacksmith, the treasury is drained and no one else can sell.

**Solution:** Each player gets a personal copy of the merchant deal. The NPC's treasury is per-player, not shared.

```typescript
interface PersonalMerchantDeal {
  id: string;                               // "deal_player123_millcross_blacksmith"
  playerId: string;                         // whose deal this is
  npcId: string;                            // which NPC merchant
  placeId: string;                          // which town
  dealType: "buy" | "sell";                 // NPC buys from player, or NPC sells to player
  itemId: string;                           // what item
  pricePerUnit: number;                     // gold per unit
  stockAvailable: number;                   // how many the NPC will buy/sell (per-player)
  stockRefreshTicks: number;                // ticks until stock refreshes
  refreshAmount: number;                    // how much stock refills per refresh
  cut: number;                              // percentage the NPC takes (0-100)
  risk: number;                             // percentage chance the deal goes bad (0-100)
  runsPerWeek: number;                      // how many times per week this deal can be used
  runsUsedThisWeek: number;
  lastResetAt: number;                       // weekly reset timestamp
}

// Invariants:
// 1. Each player has their own PersonalMerchantDeal instance per NPC.
//    Player A selling to the blacksmith does NOT affect Player B's deal with the same blacksmith.
// 2. stockAvailable is per-player. If Player A buys all 10 iron ore, Player B still has their own 10.
// 3. runsPerWeek limits how many times a player can use a deal per week (prevents infinite farming).
// 4. cut is the NPC's markup (for sell-to-player) or markdown (for buy-from-player).
//    Example: NPC sells iron ore at 10g with 20% cut → player pays 12g.
//    Example: NPC buys wolf pelts at 8g with 20% cut → player gets 6.4g.
// 5. risk is the chance the deal goes bad (item is counterfeit, NPC refuses, etc.).
//    If risk fires, the deal fails and the run is consumed. Code rolls the dice, not LLM.
// 6. This extends WorldDeal from the live game. The live game's WorldDeal is the template;
//    PersonalMerchantDeal is the per-player instance.
```

### 4D. Player Shop Stock

```typescript
interface PlayerShopStock {
  id: string;                               // "stock_player123_reedfen_shop"
  playerId: string;                         // shop owner
  placeId: string;                          // which town the shop is in
  shopDeedId: string;                       // references Deed
  listings: ShopListing[];                  // items the player is selling
  isOpen: boolean;                          // shop is open for business
  lastRestockAt: number;
}

interface ShopListing {
  listingId: string;
  itemId: string;                           // item ID (references ItemTemplate)
  quantity: number;                         // how many in stock
  pricePerUnit: number;                     // gold per unit (player sets this)
  createdAt: number;
}

// Invariants:
// 1. Player shop stock is item IDs, not free-text item names.
//    The item must exist in the player's inventory (code-owned).
// 2. When a buyer purchases from a player shop:
//    - Buyer pays pricePerUnit × quantity (gold transferred from buyer to seller).
//    - Items are removed from seller's shop stock and added to buyer's inventory.
//    - Code owns this transaction. LLM does not participate.
// 3. Player can set any price. Market dynamics emerge from player pricing.
// 4. Shop must be open (isOpen = true) for purchases to work.
// 5. If shop owner is offline, shop still operates (passive income during catch-up ticks).
//    Sales during offline ticks are summarized in the Mail Digest.
```

### 4E. AuctionListing — Region AH, Escrow, Tax, Expire, Mail

**v1 Decision: Buyout-only (no bids).** Bids add complexity (bid wars, sniping, bid cancellation). Buyout-only is simpler and sufficient for v1.

```typescript
interface AuctionListing {
  id: string;                               // "auction_abc123"
  sellerId: string;                         // player who listed
  region: "ash_seat" | "tidehold";          // which auction house
  itemId: string;                           // item being sold
  quantity: number;                          // how many units
  buyoutPricePerUnit: number;               // gold per unit (buyout-only in v1)
  bidPricePerUnit: number | null;            // null in v1 (no bids)
  isBid: boolean;                            // false in v1 (buyout-only)
  escrowItemId: string;                     // item held in escrow until sale or expiry
  escrowQuantity: number;                   // quantity held in escrow
  taxRate: number;                          // percentage (e.g., 5 = 5%)
  taxAmount: number;                        // tax = (buyoutPrice × quantity × taxRate / 100)
  expiresAt: number;                        // epoch ms; default 72 hours from listing
  status: "active" | "sold" | "expired" | "cancelled";
  buyerId: string | null;                   // set on purchase
  soldAt: number | null;
  createdAt: number;
}

// Invariants:
// 1. ESCROW IS MANDATORY. When a player lists an auction:
//    - Items are removed from player's inventory and held in escrow.
//    - Items are returned if listing expires or is cancelled.
//    - Without escrow, a player could sell the same item twice (to buyer AND on AH). [See Failure Mode 5]
// 2. Tax is deducted from the sale proceeds, not added to the buyer's cost.
//    Buyer pays buyoutPrice × quantity. Seller receives (buyoutPrice × quantity) - taxAmount.
// 3. Region AH: Ash Seat and Tidehold are separate auction houses.
//    Items listed in Ash Seat are only visible/buyable in Ash Seat.
//    This creates regional market variation (speculative — may unify in v2 if players dislike it).
// 4. Buyout-only in v1. No bids. Player sets a price, buyer pays it or doesn't.
// 5. Expiry: 72 hours default. Expired listings return items to seller via mail.
// 6. Mail on sale: "Your auction of 'Iron Ore x10' sold for 100g (95g after 5% tax)."
// 7. Mail on expiry: "Your auction of 'Iron Ore x10' expired unsold. Items returned."
// 8. Mail is code-generated, NOT LLM-narrated.
// 9. Buyer's gold is transferred immediately on purchase. No pending period.
// 10. Seller receives gold via mail (can claim from mail inbox).
//     This prevents gold-duping exploits from concurrent purchases.
```

### 4F. What Is Background (Digest) vs On-Screen

| Activity | Background (Digest) | On-Screen (Real-time) |
|----------|--------------------|-----------------------|
| **Upkeep payment** | Yes — mail digest entry: "Upkeep of 50g paid for Reedfen Camp" | No |
| **Shop income** | Yes — mail digest entry: "Shop earned 120g (7 sales while offline)" | Player sees shop UI when visiting their shop |
| **Deal cooldown** | Yes — mail digest entry if a deal completed/expired while offline | Player sees deal UI when talking to NPC |
| **Auction sale** | Yes — mail digest entry: "Auction sold: Iron Ore x10 for 100g" | Player sees auction UI when at AH |
| **Auction expiry** | Yes — mail digest entry: "Auction expired: items returned" | Player sees auction UI when at AH |
| **Deed seizure** | Yes — mail digest entry: "Deed seized: Millcross Shop (2 weeks unpaid)" | Player sees seizure notice on login (prominent) |
| **Guest visit** | Yes — mail digest entry: "Kael visited your Reedfen Camp" | No (unless owner is online and in the same interior) |
| **Random events** | No — events only fire while player is online | Yes — player sees event narration in real-time |
| **NPC interactions** | No — NPCs only respond while player is talking to them | Yes — player sees dialogue in real-time |
| **Combat** | No — combat only happens in instances while player is online | Yes — player sees combat UI in real-time |

**Rule of thumb:** If it can be expressed as a number change (gold, stock, cooldown), it's background. If it requires narration (events, dialogue, combat), it's on-screen.

---

## 5) Who Hosts / Who Pays LLM

### Options Table

| Option | Description | Pros | Cons | Verdict |
|--------|-------------|------|------|---------|
| **A: Authoritative server, per-player turn budget** | Server owns all ledgers. Each player has a per-session LLM token budget (e.g., 50k tokens/day free, more for subscribers). Server makes LLM calls on behalf of players. | No cheating. Cost is predictable per player. Free players are bounded. Server controls quality. | Server bears all LLM cost. Heavy users can burn through budget fast. | **RECOMMENDED.** |
| **B: Authoritative server, host-pays-all** | Server owns ledgers. In multiplayer, the party leader's (host's) token budget covers ALL players' LLM calls. | Simple cost model for joiners — friends play "free" under host. | Host is penalized for inviting friends (burns their budget faster). Combat burns 2-3x more tokens than narrative (per Friends & Fables data). Host may stop inviting to save budget. This is the Friends & Fables model, and its downside is documented: hosts complain about cost. | **Do NOT use as default.** Could offer as optional mode later, but not default. |
| **C: Host-player ledger, host-pays** | Party leader's client owns the ledger AND pays for LLM calls. Other clients sync to host. | No server cost. Lower latency. | Host can cheat (modify HP, loot). Host disconnect = ledger lost. This violates "code owns truth." | **NEVER.** Same verdict as prior dump. |
| **D: Authoritative server, shared party pool** | Server owns ledgers. In multiplayer, LLM cost comes from a shared pool funded by all party members (each contributes tokens). | Fair — everyone chips in. No single player bears the full cost. | Complex to implement. What if one player runs out? Does the party get cut off? | **Later (v2).** Interesting but adds complexity. v1 uses Option A. |

### Recommendation: Option A (Authoritative Server, Per-Player Turn Budget)

**Why:**
- Server owns the ledger. No cheating. This is non-negotiable (locked decision).
- Each player has their own token budget. Their multiplayer participation costs from their own budget, not the host's.
- In manual mode (Mode A narration), the server makes 1 LLM call per round for the shared paragraph. The cost of that call is split equally among all participants' budgets (or charged to the instance's shared budget, funded by all participants).
- In auto mode (Mode C for raids), there are almost no LLM calls mid-combat (only phase changes + end). Cost is negligible.
- Free players get a daily token budget. Subscribers get more. This matches the monetization research: "pay for more, not for better."

**Why NOT Option B (host-pays-all) as default:**
- Friends & Fables uses this model. The documented downside: hosts complain that combat burns credits 2-3x faster than narrative, and inviting friends depletes their budget. This discourages the social behavior (inviting friends) that the game needs to grow.
- If WOF uses host-pays-all, party leaders will be reluctant to invite casual friends because every invite costs the leader tokens. This kills organic growth.
- Option A (per-player budget) means inviting a friend costs the inviter nothing extra — the friend's participation draws from the friend's own budget.

**Cost Splitting in Multiplayer (Option A):**

| LLM Call Type | Who Pays |
|---------------|----------|
| Shared paragraph (Mode A, dungeon) | Cost split equally among all party members' budgets |
| Phase-change announcement (raid) | Cost split equally among all raid members' budgets |
| Encounter-end narration | Cost split equally among all participants |
| Hub per-player narration | Each player pays from their own budget |
| Personal interior (housing) narration | Owner pays from their own budget |

**Speculation marker:** The exact token budget numbers (free daily allowance, subscriber allowance) need tuning based on actual LLM costs at launch. The model (per-player, server-authoritative) is the recommendation; the numbers are speculative.

---

## 6) Failure Modes + John's Remaining Calls

### 6A. Expanded Failure Modes

The prior dump had 12 failure modes. Below are the ADDITIONAL ones introduced by the gap-fill schemas (housing, economy, auto mode, sync). Numbered 13+ to avoid collision.

| # | Failure Mode | How It Happens | How WOF Prevents It |
|---|-------------|---------------|---------------------|
| 13 | **LLM inverted kill (expanded)** | LLM narrates "the Millwarden crumbles" but ledger shows boss at 1500/5000 HP. | Post-filter checks prose against ledger before sending to client. If prose says "dead" but HP > 0, prose is discarded and replaced with "The round resolves." Code table is always rendered first and is authoritative. |
| 14 | **Auto-run through interrupt window** | Player in auto mode has BattlePlan set to "attack boss" every round. Grinding Hymn cast starts. BattlePlan doesn't include an interrupt override. Auto mode keeps attacking. Party takes 50 damage. | `pauseOn: [{ type: "interrupt_window" }]` is a default pause condition. When an interrupt window opens, auto mode pauses and switches to manual for 1 round. Player must manually interrupt or adjust their plan. This is the default — players can opt out by removing the pause condition, but the default protects them. |
| 15 | **Gold explosion on AFK catch-up** | Player goes offline for 14 weeks. Their shop has stock and is open. 14 weeks × 96 ticks/week × 5g/tick = 6,720g passive income. Inflation. | Catch-up is capped at 7 days (maxTicksCatchUp = 672). Beyond 7 days, holdings are frozen — no further income, no further upkeep. This caps passive income at ~480g (7 days × 96 ticks × 5g). Also, shop stock depletes as items sell; an unattended shop will run out of stock and stop earning. |
| 16 | **One miller drained** | 100 players all sell wolf pelts to the Millcross blacksmith. Blacksmith's shared treasury hits 0. No one else can sell. | PersonalMerchantDeal is per-player. Each player has their own stock and treasury instance with the NPC. Player A selling 50 pelts does not affect Player B's deal. The NPC's "treasury" is effectively infinite because it's per-player. |
| 17 | **AH without escrow** | Player lists Iron Ore x10 on AH for 100g. Before it sells, player trades the same Iron Ore x10 to a friend. Buyer purchases from AH. Player has sold the same items twice. | Escrow is mandatory. When listing, items are removed from inventory and held in escrow. They cannot be traded, equipped, or used while in escrow. On sale, items go from escrow to buyer. On expiry/cancel, items return from escrow to seller. |
| 18 | **Hub combat merge (expanded)** | Two strangers in the same hub Place both attack → merged into one combat. | Hub Places do not have encounter triggers. Combat only happens in instanced dungeons/raids. Hub NPCs are `essential` (unkillable, only defeated). No collision in text. Multiple players can interact with the same NPC simultaneously without merging. |
| 19 | **Licensed names** | Someone names their character "Arthas" or names their shop "Hogwarts Supplies." | Name filter checks against a licensed-names blocklist (same pipeline as SynapticGM's content moderation). Blocked names are rejected with "This name is not available." Player must choose another. |
| 20 | **Deed seized while player is online** | Player's upkeep balance hits 0. Weeks unpaid = 2. Deed is seized while player is actively in their house. | Seizure only happens during tick processing. If player is online and in the interior, seizure is deferred until player exits. On exit, if weeksUnpaid >= seizeAfterWeeks, deed is seized and player is returned to the hub with a mail notice. |
| 21 | **Auction snipe/bid war (v1 mitigation)** | In a bid system, player waits until last second to bid. Other player bids back. Cycle continues. | v1 is buyout-only. No bids. No sniping possible. If bids are added in v2, implement anti-snipe (auction extends 5 min if bid placed in last 60s). |
| 22 | **Sync payload leaks seed** | Client receives the instance seed in the sync payload. Client reconstructs the entire dungeon layout, enemy composition, and loot table. | Seed is NEVER in the sync payload. The client only receives: round, phase, combatant display state, recap table, narration. The seed stays server-side. |
| 23 | **Late prose overwrites HP** | LLM narration arrives late and contains "the goblin, now at 3 HP, staggers." Client renders this and overwrites the code table's HP value. | Late prose is rendered as read-only append below the code table. The client is instructed to never parse prose for numbers. Post-filter strips any numeric values from prose before sending. If prose contains digits, they are masked. |
| 24 | **BattlePlan targets dead enemy** | Player's BattlePlan has `targetId: "enemy_abc"`. Enemy abc died in round 2. Auto mode continues trying to attack a dead enemy. | BattlePlan.valid is checked each round. If targetId references a dead/absent enemy, valid = false. Resolver falls back to "defend" for that player. Player is notified: "Your BattlePlan target is no longer available. Update your plan." |
| 25 | **Two parties merge in hub** | Two parties are in the same hub. One party pulls a dungeon. The other party is accidentally pulled in. | Dungeons are instanced per-party. Pulling creates a PartyInstance with a unique seed. Only party members can enter. The other party in the hub sees nothing — they are not in the instance. Hub Places have no encounter triggers. |

### 6B. John's Remaining Calls (Max 8, Excluding Locked List)

These are decisions that the design team cannot make — they require John's product/business judgment.

| # | Decision | Options | Tradeoff |
|---|----------|---------|----------|
| 1 | **Tick interval length** | 15 min vs 30 min vs 60 min | Shorter = more responsive world but more server load. Longer = cheaper but less granular. 15 min is speculative default. |
| 2 | **Catch-up cap duration** | 7 days vs 14 days vs 30 days | Shorter = less gold inflation but punishes long absences (vacation, deployment). Longer = more generous but higher inflation risk. 7 days is speculative default. |
| 3 | **Auction house region model** | Separate AHs (Ash Seat / Tidehold) vs unified AH | Separate = regional market variation, travel incentive. Unified = simpler, more liquid market. v1 is separate (speculative). |
| 4 | **Housing guest policy v1** | Friends-only (locked) vs public from start | Friends-only is safe. Public enables social discovery but increases griefing risk (unwanted visitors, harassment in private spaces). Locked decision says friends-only for v1. |
| 5 | **Player shop tax rate** | 0% vs 5% vs 10% vs progressive | Tax is a gold sink (fights inflation). 0% = no sink. 10% = meaningful sink but may discourage trading. 5% is speculative default. |
| 6 | **Upkeep seize threshold** | 2 weeks vs 3 weeks vs 4 weeks | Shorter = deeds recycle faster (more market liquidity). Longer = more forgiving for casual players. 2 weeks is speculative default. |
| 7 | **Raid narration mode (revisited)** | Mode C (no LLM mid-combat, phase announcements only) vs Mode A (one paragraph per round) | Locked decision says "recommend A or C, mark as John's later call." This is that call. C is cheaper and more tactical. A is more narrative (~14¢/raid at GPT-4o). Could ship C and upgrade to A based on player feedback. |
| 8 | **Token budget: free daily allowance** | 20k vs 50k vs 100k tokens/day for free players | Lower = tighter free tier (more conversion to paid). Higher = more generous free tier (better retention, less revenue). Needs tuning based on actual LLM costs at launch. All numbers speculative. |

---

## Sources

| Source | URL | Date Accessed | What Was Used |
|--------|-----|--------------|---------------|
| Evennia Turn-Based Combat System (2.x docs) | https://www.evennia.com/docs/2.x/Howtos/Turn-based-Combat-System.html | Aug 15, 2026 | CombatHandler pattern, simultaneous resolve, timeout → defend, join/flee mechanics |
| Evennia Turnbattle Contrib (latest) | https://www.evennia.com/docs/latest/Contribs/Contrib-Turnbattle.html | Aug 15, 2026 | Initiative roll, turn-based framework, shared handler |
| Evennia EvaAdventure turnbased combat (source) | https://www.evennia.com/docs/2.x/api/evennia.contrib.tutorials.evadventure.combat_turnbased.html | Aug 15, 2026 | "All combatants sharing the same combat handler" — shared-handler pattern |
| Friends & Fables Review 2026 (DungeonsDeep) | https://dungeonsdeep.ai/blog/friends-and-fables-review-2026 | Aug 15, 2026 | Host-pays-all model downside, combat burns credits 2-3x faster, LLM owns math failures |
| AI Realm vs Friends and Fables (DungeonsDeep) | https://dungeonsdeep.ai/blog/ai-realm-vs-friends-and-fables | Aug 15, 2026 | "Friends play free under host" model, turn-sharing in multiplayer |
| StoryNexus Place vs Setting (Failbetter Games / Sunless Sea design) | https://www.failbettergames.com/ | Aug 15, 2026 | Place (location node) vs Setting (narrative context) distinction — pattern for hub/instance separation |
| Classic MMO Auction House patterns (WoW-style AH as methodology) | N/A (public game design pattern) | Aug 15, 2026 | Escrow model, buyout vs bid, tax, expiry, mail delivery — as methodology, not copied implementation |
| Classic MMO Housing patterns (UO/FFXIV housing as methodology) | N/A (public game design pattern) | Aug 15, 2026 | Deed ownership, upkeep, guest access, personal interior instance — as methodology |
| LLM Token Cost Calculator (Optimal) | https://getoptimal.ai/token-spend-calculator | Aug 15, 2026 | GPT-4o Mini ($0.15/$0.60 per M), GPT-4o ($2.50/$10 per M) pricing |
| Existing project file: WOF_Multiplayer_Design_Dump.md | (project file) | Aug 15, 2026 | PartyInstance, EncounterLedger, RaidEncounterScript, RoleFlag, join/loot/wipe rules, Millstone Hollow text block |
| Existing project file: AI_RPG_Research_Intel_and_Summary.md | (project file) | Aug 15, 2026 | Friends & Fables host-pays-all downside, code-owns-truth principle |
| Existing project file: AI_RPG_Technical_UX_Research_Report.md | (project file) | Aug 15, 2026 | SynapticGM architecture (code owns dice/HP/loot/seed), Hidden Door card-based state |
| Existing project file: docs/research/pack-09-monetization-cosmetics-audio-iap-2026-08.md | (project file) | Aug 15, 2026 | Monetization principles (sell capacity/cosmetics, never outcomes), subscription tier model, token budget concept |

---

## Speculation Markers

The following items are speculative (not based on tested data or locked decisions):

1. **Tick interval of 15 minutes** — speculative default. Could be 30 or 60 min. Needs server load testing.
2. **Catch-up cap of 7 days** — speculative default. Needs tuning based on player retention data.
3. **Auction house as separate regions (Ash Seat / Tidehold)** — speculative. Could be unified. John's call.
4. **Tax rate of 5%** — speculative default. Needs economic simulation.
5. **Seize threshold of 2 weeks** — speculative default. Needs player feedback.
6. **Token budget numbers (20k/50k/100k)** — all speculative. Need actual LLM cost data at launch.
7. **PersonalMerchantDeal as per-player copy** — pattern is sound but the exact stock/refresh numbers need economic tuning.
8. **BattlePlan pause conditions as defaults** — the default set (phase_change, add_spawn, interrupt_window, ally_down, stop) is a recommendation. Players who want full auto with no pauses could disable them, but this risks auto-running through mechanics. Defaulting to safe pauses is speculative but conservative.
9. **Cost splitting (equal split among party members)** — simple but may not be fair if one player triggers more LLM calls (e.g., their action is more complex to narrate). Equal split is a v1 simplification.

---

**End of Gap Fill Dump. This file, combined with `WOF_Multiplayer_Design_Dump.md`, provides complete implementation-ready schemas for WOF's multiplayer, combat, raid, housing, economy, and LLM cost model.**
