# Ledger architecture map + acceptance-test matrix

**Date:** 2026-08-19  
**Status:** Living doc — update when slices ship or invariants change.  
**Related:** `post-playtest-ledger-batch-2026-08-19.md`, inspection report (2026-08-19).

---

## 1. Architecture map

### 1.1 Runtime layers

```
Browser (React/Vite)
├── UI — CenterPanel, drawers, DungeonMapModal, modals
├── useGame.ts — turn orchestrator (pre-GM ledger → callGm → post-commit persist)
├── parser.ts + structuralEvents.ts — writer XML tags → domain events
├── ledgerCombat.ts — deterministic combat + flee (pre-GM)
├── dungeonMobLedger.ts + saveMigration.ts — node mob blob + save repair
├── db.ts — IndexedDB load/save (repair on load)
└── cloudSync.ts — Supabase game_saves mirror

Supabase Edge Functions
├── gm-turn — shared GM prompt, wardens, factLocks, remainingDungeonMobs
├── generate-image — hosted art
└── entitlements / Stripe webhooks — server-authoritative credits (P4)
```

### 1.2 Authoritative ownership

| Domain | Canonical store | Ephemeral / mirror |
|---|---|---|
| Node traps, loot, mobs | `activeDungeon.nodes[].hidden` | GM prose |
| Parked wounded mob | `hidden.mobs[].hpRemaining` + `spawned: true` | — |
| Live combat | `activeEncounter` | Cleared on flee success or kill |
| Inventory | `GameState.inventory` | Container occupancy sync |
| Quests | `GameState.quests` | Writer tags today; hooks Slice 4 |
| Turn history | `GameState.log` + `stateTxLog` | — |
| Play lock | `playPhase` | Slice 5 UI |
| User credits | Supabase entitlements | Client capacity mirror |

**Rule:** The AI GM call receives a snapshot *after* deterministic ledger transitions. Code owns numbers; writer owns fiction.

### 1.3 Save contract (two-layer versioning)

| Field | Purpose |
|---|---|
| `version: 2` | Hard gate — playtest wipe (`CURRENT_SAVE_VERSION`) |
| `saveRepairRevision: N` | Soft idempotent repair (`CURRENT_SAVE_REPAIR_REVISION`) |
| `lastSeenSaveRepairRevision?` | One-time semantic repair toast |
| `playPhase?: 'live' \| 'down' \| 'ended'` | Forward play lock (Slice 5) |
| `hidden.mobs[]` | `{ spawned, defeated?, hpRemaining? }` |
| `hidden.looseItems?` | Floor projectiles (Slice 3) |

Bump **`saveRepairRevision`** when repair rules change. Bump **`version`** only on incompatible wipes.

### 1.4 Inspection phase alignment

| Phase | Status (2026-08-19) |
|---|---|
| P0 Codebase discovery | **Done** — this doc |
| P1 State contract + repair | **Slice 0 shipped** (`fc5f272`) |
| P2 Deterministic backlog | **Slices 1–5 shipped** (`2026-08-19ag`) |
| P3 UX failure/archive | **Slice 5 shipped** — epitaph bar + export epilogue |
| P4 Entitlements staging | Foundation only — not launch-ready |
| P5–P7 Image / economics / launch | Deferred |

---

## 2. Engineering invariants

| ID | Invariant | Owner |
|---|---|---|
| I1 | Ledger trap/combat/flee runs **before** `callGm` | `useGame` |
| I2 | Node ledger is canonical for mob HP blobs | `dungeonMobLedger` |
| I3 | `remainingDungeonMobs` uses `mobCountsAsRemaining`, not `!spawned` | `dungeonPresence` |
| I4 | Map movement blocked while `activeEncounter.hp > 0` | `useGame` + map UI |
| I5 | Flee success parks HP on node; clears encounter | `resolveLedgerFlee` |
| I6 | `repairSaveSchema` idempotent; legacy `spawned` → `defeated` | `saveMigration` |
| I7 | Rewind disabled after successful commit | `useGame` |
| I8 | Entitlements server-authoritative (P4 gate) | Supabase |

---

## 3. Acceptance-test matrix

**Legend:** ✅ covered by vitest · 🎮 manual playtest · ⏳ future slice

### 3.1 Save repair (Slice 0)

| ID | Setup | Action | After commit | After reload | Status |
|---|---|---|---|---|---|
| R01 | Legacy mob `spawned:true`, no `defeated` | Continue | `defeated:true`; toast once | Idempotent | ✅ |
| R02 | Old save, HP=0 | Continue | `playPhase:'live'` | Same | ✅ |
| R03 | Already at `saveRepairRevision` | Continue | No dirty; toast if unseen | — | ✅ |

### 3.2 Mob ledger (Slice 1)

| ID | Setup | Action | Expected | Status |
|---|---|---|---|---|
| M01 | Active encounter in dungeon | Ledger kill | Node mob `defeated`; counter −1 | ✅ |
| M02 | Mob `defeated:true` in room | Spawn/scout | Next unspawned spawns; no duplicate | ✅ |
| M03 | Mob `hpRemaining:5` on node | Re-enter | `restoreParkedEncounter` → same HP | ✅ |
| M04 | Live encounter + parked same name | Counter | Deduped — not double-counted | ✅ |

### 3.3 Flee + map lock (Slice 2)

| ID | Setup | Action | Expected | Status |
|---|---|---|---|---|
| F01 | Combat active, Stealth success | Flee | `hpRemaining` on node; encounter cleared | ✅ |
| F02 | Combat active | Tap map adjacent room | Blocked + toast | ✅ |
| F03 | Combat active | Stealth fail | Damage taken; encounter persists | ✅ |
| F04 | Fled mob parked 5 HP | Leave + return | Same 5 HP encounter | ✅ 🎮 |
| F05 | Combat active | Typed "go to X" / move intent | Blocked before GM | ✅ |
| F06 | Last mob fled/killed | Counter = 0 | `[MILESTONE: All dungeon threats neutralized]` receipt | ✅ |

### 3.4 Traps + Token D (Slice 3)

| ID | Setup | Action | Expected | Status |
|---|---|---|---|---|
| T01 | Armed trap | Fail disarm | HP delta pre-GM; trap spent | ✅ |
| D01 | Armed trap + throw rock | Token D | 0 HP; no inventory consume | ✅ |
| L01 | Trap parks dagger | Pick up UI | Item in inventory | ✅ |

### 3.5 Quest fail (Slice 4)

| ID | Setup | Action | Expected | Status |
|---|---|---|---|---|
| Q01 | Active run-scoped quest | `<quest-fail>` | Modal + Failed tab | ✅ |
| Q02 | Permadeath turn | HP→0 commit | Receipt only; quests failed | ✅ |

### 3.6 Death / archive (Slice 5)

| ID | Setup | Action | Expected | Status |
|---|---|---|---|---|
| E01 | `playPhase:'ended'` | Type action | Input blocked; epitaph bar | ✅ |
| E02 | Ended run | Export PDF | Log + Epilogue; no front stats | ✅ |

---

## 4. Vitest fixture corpus (target)

```
src/game/saveMigration.test.ts      — R01–R03
src/game/dungeonMobLedger.test.ts   — M01–M04, F01, F03–F04
src/game/ledgerFlee.test.ts         — F01, F03
src/game/ledgerSlice345.test.ts     — T01, D01, L01, Q01–Q02, E01
```

Playtest script (manual): F02, F04, F05 on production build with HUD stamp.

---

## 5. Recommended build order (remaining)

1. **P4** — Stripe staging, webhook idempotency, entitlement audit trail  
6. **P6** — telemetry: save repair, flee/trap/death funnel, paid-turn delivery  

---

## 6. Definition of ready (per inspection)

Before **live billing:** server-side entitlement issuance, verified webhooks, audit trail, quota-reset rules, cost attribution telemetry.

Before **soft launch:** R01–F06 + E01–E02 pass; playable onboarding; feedback channel; save-failure monitoring.
