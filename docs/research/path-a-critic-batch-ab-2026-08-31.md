# Path A critic Batch A+B — 2026-08-31i

**Stamp:** HUD `2026-08-31i` / BUILD `2026-08-31b`  
**Mid writer:** OFF  
**Auth:** John authorized Batch A + Batch B from `scripts/fate-autoplay/runs/morning-review-2026-08-30/FIX-PLAN-from-critics-2026-08-30.md`.

Kills Free MiniMax Summoned Pact book/game P0s: sealed-manifest HUD stubs as story, “the Pellane” person-slot contagion, and Engage/Wait/Status dead pad. No OpenRouter, no WOF, no Free live writer swap.

| Batch | Item | Module(s) | What landed | Residual |
|---|---|---|---|---|
| A | P0-1 / P0-2 fallback-as-story | `sealedManifest`, `useGame`, `fateAutoplay` | Diegetic recovery stitch (no PC/HP/XP in body); encounter narrates live foe HP; ban legacy “something shifts…” / “closes in… ledger still counts”; max 1 consecutive recovery then Class A FAIL | Flash Lite can still empty; first recovery is thin ambient prose |
| A | P2-1 / P2-3 transport | `errorRepairWarden`, `fateAutoplay`, `useGame` | `rate_limit` auto-retry + longer backoff; DNS ENOTFOUND 20s pause; harness aborts cell after 2 DNS fails; failKind labels `rate_limit` / `network_dns` | Gateway still throttles Free MiniMax; critics dual-review 429 (Batch D) |
| B | P0-3 Pellane contagion | `chromeAuthority`, `narrativeScrub`, `typedEntityValidator` | Polity/faction/hub tokens never person slots; REGISTRATION/STATUS chrome protected + polity-label heal; panel/mark never rewrite onto Pellane | Writer can still invent “the Pellane” as prose (scrub heals chrome; harvest filter helps) |
| B | P0-4 / P1-4 dead pad | `choiceEdge`, `choiceCompiler` | No Engage/Change without live encounter (scout/ready instead); Status cooldown + drought skip; Wait dropped under drought/recovery; post-recovery meta verbs filtered | Legal-edge banks can still be thin; Force-a-path still possible from story-grounded `sceneSafeFallbacks` |

**Vitest:** `src/game/playtest31iCriticBatchAB.test.ts` (12)  
**Edge sync:** `chromeAuthority` + `types` / `sceneFacts` via `scripts/sync-gm-edge-shared.mjs` (client pad/sealed/fate owners stay client-side).  
**Redeploy:** Client required. Edge recommended if chromeAuthority twin is live on gm-turn (`npx supabase functions deploy gm-turn` after sync). No OpenRouter keys.

**Out of scope (later batches):** Lowmarket vignette lock (Batch C); stripChoiceList / dual location / XP audit / dual-review critic backoff (Batch D).
