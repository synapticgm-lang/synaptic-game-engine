# Path A ship — implementation note (2026-08-29c)

**Stamp:** `2026-08-29c`  
**Bundle:** Free-hook recovery after 29b alt-premades Gemini board (John authorized push + Supabase sync)  
**Prior:** `docs/research/path-a-ship-implementation-2026-08-29b.md`  
**Sources:** `GEMINI-29B-ALT-PREMADES-SYNTHESIS.md` + gemini-21/22/23/24 (+ 13–16 residual)

## Audit — already shipped (29a / 29b)

| Item | Status |
|---|---|
| Encounter Terminal FSM + clear XP/cooldown | Done 29a/29b |
| Free T12 durable delta (ArcDirector) | Done 29b |
| Hard same-action streak≥5 pad interrupt | Done 29b |
| STATUS firewall core | Done 29a/29b |
| Mid writer | **OFF** (unchanged) |
| Free writer | Gemini 2.5 Flash Lite (unchanged) |

## Newly shipped (29c)

| Item | Module | Notes |
|---|---|---|
| **Kill kit→pronoun scrub** | `typedEntityValidator.rewriteInvalidReferences` | Never map they/them/their onto inventory; kit-like names blocked for stranger/mark/panel |
| Travel / Wait loiter force | `beatFingerprint.countLoiterFamilyStreak` + ArcDirector + ChoiceCompiler | Hub ping-pong counts across destinations; ≥4 loiter → forced beat; drop travel/wait pads |
| Drought variety + bible-aware | `arcDirector.droughtSkirmishTable` + hub spawn | No Keep Wraith on Shattered Coast; rotate LitRPG/DnD tables; skip cooldown names |
| RPG/PYOA branch consequence | `pyoaBranchLedger` + `choiceEdge` + `npcTopicFsm` | Wait/Inspect delay lock; risky-fork lock; strip delay pads when locked; tighter dialogue commit |
| Opening pin + clone reject + empty-GM | `openingPin.ts` + situation SNAPSHOT + `qualityGovernance` + `sealedManifest`/`statusFirewall` | Pin Silas/Vessa etc.; early clone reject flag; no `(beat recovered; …)` chrome |
| Vitest | `playtest29cFreeHook.test.ts` | Kit scrub, drought bible, loiter, PYOA lock, opening pin, fallback chrome |
| Stamp | HUD / index.html / `BUILD_STAMP` | `2026-08-29c` |

## Honest uplift vs 29b alone

**Target:** restore readable English (remove kit mush regression) + cut travel/wait Free=NO basin. Portfolio still **~5–6.5/10** until 4×300 re-score; do not claim 8/10.

## Deferred

| Item | Why |
|---|---|
| Mid writer | Explicit reject |
| Second LLM Continuity critic | Cost + non-authoritative |
| Full voice cadence in GM prose | Preserve DnD Dry Wit; deeper voice is P1 |
| Soft-threat resolve timers | Genre-sensitive |

## Verify

```bash
npm test -- src/game/playtest29cFreeHook.test.ts src/game/playtest29aScoreBoost.test.ts src/game/playtest29bOptimise.test.ts src/game/playtest28cManusComplete.test.ts
```

## Redeploy notes

- **Client:** ship HUD stamp `2026-08-29c` (Vite/Vercel).
- **Edge:** sync `situationPacket` via `node scripts/sync-gm-edge-shared.mjs`, then `npx supabase functions deploy gm-turn` (OPENING PIN SNAPSHOT rail). Kit scrub is client-side (`qualityGovernance`); edge deploy keeps SNAPSHOT parity.
