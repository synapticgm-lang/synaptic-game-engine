# Post-playtest ledger batch (next update)

**Status:** Spec only — do not ship until John calls the next update.  
**HUD stamp target:** TBD on ship (e.g. `2026-08-XX`).

Ledger-first structural upgrade: code owns numbers; writer owns fiction parameters.

---

## 1. Dynamic traps (`resolveLedgerTrap`)

- Mirror `resolveLedgerCombat` in client `src/game/` before `callGm`.
- Apply HP from seeded `trap.damage` on node ledger:
  - Crit fail / clueless sprung: 100%
  - Ordinary disarm fail: `max(1, floor(trap.damage / 2))`, then `disarmed: true`
  - Success / no contact: 0 HP
- Wire unused `critFailHpRisk` path or replace with ledger apply.
- Seed optional `kind` on traps (`pressure plate`, `tripwire`) for Token D + regex — not `${node.id}_trap`.

## 2. Token D (remote trigger)

- Contact classifier: remote verb + projectile (ambient whitelist OR inventory item) + hazard cue (kind / lootable label / revealed “it”).
- NOT room-wide “any throw in trapped room”.
- Ambient bypass only when armed trap present → 0 HP, hazard spent.
- Real inventory projectile: remove from sheet, park on node via `hidden.looseItems` — not consumed unless future destructive trap kind.

## 3. `hidden.looseItems`

- New array on `NodeHidden` (separate from lootables).
- Retrieval: clickable **Pick Up [Item]** in location panel (same ledger path as typed pickup).

## 4. Ledger-first flee + parked mob blob

- Stealth check in code; success parks wounded stats on node mob (`spawned: true`, `hpRemaining`, `defeated: false`).
- Clear `activeEncounter`; map locked during combat until resolved.
- **`restoreParkedEncounter`** before `spawnRoomEncounter` on re-entry.
- **`remainingDungeonMobs`:** count `(!spawned) + (hpRemaining > 0) + live activeEncounter` — not `spawned === dead`.
- Mob ledger fields: `spawned`, `hpRemaining`, `defeated`.
- Zero-counter milestone token: `[MILESTONE: All dungeon threats neutralized]` when accurate counter hits 0 (narrative only; no auto `<dungeon-exit />`).

## 5. Quest architecture

- **`questHooks`:** code auto `quest-update` on ledger events (boss dead, item destroyed); writer still owns turn-in / `<quest-complete />`.
- **`<quest-fail id="…" objectiveId="…" reason="…" />`** — parser + warden + stateTx.
- **Fail loud → archive:** single modal (mirror `QuestUnlockModal`); batched modal for bulk non-death fails.
- **Death turn:** no quest-fail modals; one system receipt `Active quests closed (N): …`; Failed tab in journal.
- **`uiModalQueue` priority:** death → single fail → batched fail → unlock.
- LeftDrawer: active quests only (`status === 'active'`).
- **`runScoped` / `failOnDeath`:** per quest + engine mode (Void Audience / down-state vs permadeath).

## 6. Death state (`playPhase`)

- `'live' | 'down' | 'ended'`.
- **On true permadeath commit:** sweep `runScoped` quests → failed, `playPhase: 'ended'`, `ledgerRevision++`, **`await persist`**, clear `snapshotRef` + `canRewind`.
- **`'ended'` UI:** read-only archive — full log scroll, memorable plates, journal Failed tab; **epitaph bar** replaces ActionBar (New Game · Export story · Main menu).
- **`'down'`:** temporary knockout — no bulk quest fail; input gated until revive/rest resolves.

## 7. Export bookends

- **Active campaign PDF:** keep front stats (current sheet).
- **`playPhase === 'ended'` PDF:** Cover → chronological log → **Epilogue** (final level/HP, completed vs failed run-scoped quests, death stateTx, memorable plate count). No front stats (avoids “Active Quests: None”). Origin stays in opening log; optional Origin toggle from `campaignContract` for old saves.
- **CBZ:** optional `999-epilogue.jpg` from epilogue vector page.
- Epitaph bar **Export story** calls same export path with `includeEpilogue: true`.

## 8. Save migration (`repairSaveSchema`)

- **Stay on save v2** — idempotent repair on `loadGame` / continue; persist once if dirty.
- Defaults: `playPhase: 'live'` (do not infer ended from HP on old saves).
- Legacy mobs: `spawned && !defeated` → infer `defeated: true`, `hpRemaining: null`.
- `hidden.looseItems: []` on all nodes; normalize dungeon mob ledger.
- Vitest fixtures: v2 JSON → repaired shape.

---

## Explicit non-goals (this batch)

- No escort NPC HP ledger (writer-driven narrative fail only).
- No IndexedDB file lock — ledger semantics only.
- No re-run trap resolution on past turns.
- No auto `<dungeon-exit />` on mob counter zero.

## Key files (touch list)

`ledgerCombat.ts`, `checkMath.ts`, `dungeonPresence.ts`, `dungeonSeed.ts`, `mapEngine.ts`, `parser.ts`, `structuralEvents.ts`, `useGame.ts`, `questGuards.ts`, `pdfExportService.ts`, `cbzExportService.ts`, `CenterPanel.tsx`, `LeftDrawer.tsx`, `QuestLogModal.tsx`, new `QuestFailModal.tsx`, new `saveMigration.ts`, `playtest-notes.mdc`.
