# Path A ship — implementation note (2026-08-29b)

**Stamp:** `2026-08-29b`  
**Bundle:** Post-29a gameplay optimise (John authorized: all high-ROI score-boost + past research)  
**Prior:** `docs/research/path-a-ship-implementation-2026-08-29a.md`  
**Sources:** Manus score-boost T01–T12, score-boost plan P1, recommended ship bundle, BIG CHANGES backlog residuals, Gemini 13–16 P0s

## Audit — already shipped (29a / Path A)

| Item | Status |
|---|---|
| Encounter Terminal FSM | Done 29a |
| Combat pad lock | Done 29a |
| Entity scrub allowlist | Done 29a |
| STATUS firewall (core tags) | Done 29a |
| NPC topic / PYOA branch locks | Done 29a |
| Eval gates (clear@T50, branch@T30, freeT12) | Done 29a (eval-only for T12) |
| ArcDirector / ChoiceCompiler / sealed manifest | Done 28a–28c |
| Social milestone XP (per kind) | Done 28a |
| Mid writer | **OFF** (unchanged) |

## Newly shipped (29b)

| Item | Module | Notes |
|---|---|---|
| Combat HP ledger persistence | `parser.eventsToEncounterUpdate`, `useGame` ledger path | Same-threat GM `<enemy>` cannot heal; FSM fields preserved; ledger HP min-merge |
| Clear STATUS + XP | `encounterTerminalFsm.commitClear` | Victory/parley/escape award `xpReward` slice; STATUS receipt already wired |
| Re-engage cooldown | `encounterCooldownUntil` (12 turns) | Same `forcedSpawnKey` skipped while cooling |
| Free T12 durable delta **enforced** | `freeT12Hook.ts` → ArcDirector | Force quest/crisis/skirmish/leverage beat by T12; shared with evalHarness |
| Voice cadence in STATUS | `voiceCadenceSystem.pickStatusVoiceLine` | Cold Registrar / Dry Wit / Army / Guide asides on clear/XP — **no Mid writer** |
| Spatial exit authority | `sceneFacts.exitAuthorityTurn`, proseWarden | Flee/exit → outdoor; scrub cannot snap back inside |
| Hard streak pad interrupt | `choiceCompiler` | Streak≥5 drops wait/walk_away/inspect; no stall refill |
| Talk XP once-per-node | `socialMilestoneLedger` | Node key blocks talk+listen farm at same loc/target |
| Prompt leak residual | `statusFirewall` | GM_VOICE bare, AUTHORITY VOICE, ARC DIRECTOR, SEALED MANIFEST |
| Edge proseWarden sync | `supabase/.../proseWarden.ts` | `scrubPlaceholderNouns` + `exitNarrated` |
| Vitest | `playtest29bOptimise.test.ts` | 9 cases; 29a stamp assertion relaxed |

## Honest uplift vs 29a alone

**+0.5–1.5** on worst cells if HP reset / Free hook / voice / snap-back were the remaining 1/10 axes — portfolio still **~5–6.5/10**, not 8/10.

## Deferred (with why)

| Item | Why |
|---|---|
| Stagnation Mid writer (Opt 10) | Explicit reject — eloquent mush risk |
| Second LLM critic | Cost + non-authoritative |
| Full 9–10 beat libraries | Research-only content authoring |
| Premium themes / WOF | Out of scope |
| Feature-flag shadow rollout | Still on-by-default |
| Full contamination quarantine pipeline | Eval hooks exist; deeper quarantine needs John INPUT |
| Random ambush timers | Genre-inappropriate without BeatContract |
| Daily milestone alone without Path A | Already partially in 28b; no further without INPUT |

## Verify

```bash
npm test -- src/game/playtest29bOptimise.test.ts src/game/playtest29aScoreBoost.test.ts
```

## Redeploy notes

- **Client:** ship HUD stamp `2026-08-29b` (Vite/Vercel).
- **Edge (recommended):** `npx supabase functions deploy gm-turn` — syncs edge `proseWarden` (`scrubPlaceholderNouns` + exit authority). Live path is still mostly client-side warden; edge sync prevents drift if gm-turn scrubs server-side.
