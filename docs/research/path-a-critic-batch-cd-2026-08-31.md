# Path A critic Batch C+D — 2026-08-31j

**Stamp:** HUD `2026-08-31j` / BUILD `2026-08-31c`  
**Mid writer:** OFF  
**Auth:** John authorized complete remaining patches (Batch C + D) from `scripts/fate-autoplay/runs/morning-review-2026-08-30/FIX-PLAN-from-critics-2026-08-30.md`, then commit / push / sync.

Closes Lowmarket social treadmill + polish/tooling residuals after Batch A+B. No OpenRouter, no WOF, no Free live writer swap.

| Batch | Item | Module(s) | What landed | Residual |
|---|---|---|---|---|
| C | P0-5 vignette lock | `vignetteLock`, `sceneFacts`, `hubEncounters`, `choiceCompiler`, `situationPacket`, `useGame`, `fateAutoplay` | `sceneFacts.openVignette` locks cast/props/stakes on hub social/vendor arrival + argument harvest; SNAPSHOT + HUB VIGNETTE LOCK binding; pads filter invent-stranger talk; clear on hub leave | Writer can still invent a new name in prose before harvest; drought combat foes still rotate (combat ≠ social vignette) |
| D | P1-1 option leak | `parser.stripChoiceList` | Slip/head/travel verbs + inline numbered + markdown bullet leaks (T13 `1. Slip toward…`) | Novel menu shapes without verbs may remain |
| D | P1-2 dual location | `proseWarden.scrubDualLocationOpenings` | One camera per beat under fail path; `At OtherPlace` demoted when currentLocation locked | Honest travel (`exitNarrated`) skips scrub |
| D | P1-6 prose-only Gemini | `playTranscript` + `writeGeminiPastes` / `dualReview` / fate export | `story-narration-only.md`; story lens Narration-only; collapse `[engine fallback ×N]`; game lens keeps full Options/STATUS | Morning paste still manual for Gemini Pro |
| D | P2-2 dual-review resilience | `chatCompletion`, `dualReview`, `curriculumImprove`, `autoImprove` | 429/DNS backoff; per-lens try/catch; pastes always write; `review-deferred` does not poison ladder / p0=-1 | Gateway may still fail all critic calls — morning paste queue |

**Vitest:** `src/game/playtest31jCriticBatchCD.test.ts`  
**Edge sync:** `vignetteLock` + `types` / `sceneFacts` / `situationPacket` via `scripts/sync-gm-edge-shared.mjs`  
**Redeploy:** Client required. Edge recommended after sync (`npx supabase functions deploy gm-turn`). No `generate-image` change.

**Out of scope (not in John C+D list):** P1-3 XP audit, P1-5 opening registration bury — still Waiting.
