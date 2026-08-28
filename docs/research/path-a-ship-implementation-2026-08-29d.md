# Path A ship — implementation note (2026-08-29d)

**Stamp:** `2026-08-29d`  
**Bundle:** Gemini-calibrated prompt diet + prose license + soft stakes (John authorized from architecture/Gemini plan chat)  
**Prior:** `docs/research/path-a-ship-implementation-2026-08-29c.md`  
**Sources:** Chat plan R1–R10 + `GEMINI-29B-ALT-PREMADES-SYNTHESIS.md` / `GEMINI-28C-VS-27W-SYNTHESIS.md` calibration

## Shipped (29d)

| Item | Module | Notes |
|---|---|---|
| **Prompt diet** | `situationPacket.formatSceneSnapshotForPrompt` | One AUTHORITY + PROSE LICENSE; drop duplicate STAGNATION INTERRUPT / VOICE CHECK; skip FPG mandate when ArcDirector already owns interrupt; quest pressure only if not already in governance |
| **Voice in STORY BODY** | `voiceCadenceSystem.formatVoiceCadenceDirective` | Short directive; personality colors prose not STATUS-only; warm = honest stakes (no plot armor) |
| **Stop stranger→merchant invent** | `proseWarden.scrubStrangerArtifact` | Replace only with present named NPC or alone→panel; never keyword-scan invent merchant/guard |
| **Unearned victory scrub** | `proseWarden.scrubUnearnedVictory` | Soften auto-win language when no live/recently cleared encounter; wired in useGame / warden / fateAutoplay |
| **RPG soft stakes + soft-threat timer** | `arcDirector.forceLivenessBeat` | RPG leverage/demand by T12; softThreatOpenedTurn + resolve after 6 turns |
| **Free failover** | `writerPolicy` + `gmProxy` | Flash Lite empty/timeout → `meta-llama/llama-3.1-8b-instruct` once (never Mid) |
| **Kit scrub hold** | `typedEntityValidator` | 29c kit→pronoun kill kept; mark/panel only when real speaker |
| **Vitest** | `playtest29dGeminiCalibrated.test.ts` | Stamp, failover, PROSE LICENSE, stranger, victory, RPG liveness |
| **Stamp** | HUD / index.html / `BUILD_STAMP` | `2026-08-29d` |
| **Mid writer** | `writerPolicy` | **OFF** unchanged |

## Explicitly not shipped

| Item | Why |
|---|---|
| Mid writer / Continuity-Warden LLM | Gemini + Manus reject |
| Full closed-world pregen | Hybrid banks remain; harden hate surfaces only |
| pgvector lore SSOT | Deferred cost |
| New scrub wave mapping pronouns→kit | 29b regression |

## Verify

```bash
npm test -- src/game/playtest29dGeminiCalibrated.test.ts src/game/playtest29cFreeHook.test.ts src/game/playtest29bOptimise.test.ts src/game/playtest26uQualityGates.test.ts
node scripts/sync-gm-edge-shared.mjs
npx supabase functions deploy gm-turn
```

## Redeploy

- **Client:** HUD stamp `2026-08-29d`
- **Edge:** sync shared GM then deploy `gm-turn` (SNAPSHOT PROSE LICENSE parity)

## Next gate

Re-run alt-premades **4×300** under stamp `2026-08-29d` + Gemini re-score. Do not claim portfolio 8/10 until scored.
