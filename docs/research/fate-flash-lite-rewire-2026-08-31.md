# Fate Flash Lite rewire (2026-08-31)

**Auth:** John — re-wire Fate curriculum / autoplay / dual-review for OpenRouter `google/gemini-2.5-flash-lite`. Harness only; Mid writer OFF; live Free player writer unchanged.

## Verdict

Optimal T50 feedback set = **1 flagship per mode (4)**. Optional +1–2 LitRPG (`hero-awakening`, `system-integration`) up to 6 for breadth.

## Defaults (after rewire)

| Surface | Default |
|---|---|
| Writer | `flash-lite` → OpenRouter `google/gemini-2.5-flash-lite` |
| Critic / patcher | Same Flash Lite model |
| Curriculum premades | `summoned-pact,cursed-keep,salt-road-heist,thornferry-road` |
| Mid writer | OFF |

## Env

Required for Flash Lite path:

- `OPENROUTER_API_KEY` (preferred; matches edge / `.env.example`)
- also accepts `VITE_OPENROUTER_API_KEY` or `AUTOPLAY_OPENROUTER_API_KEY`

Optional `$0` MiniMax path (`--writer minimax`):

- `AI_GATEWAY_API_KEY` (or `VERCEL_AI_GATEWAY_API_KEY`)
- Gateway free rotate m3 ↔ m2.7 kept; not deleted

## Flags

```text
--writer flash-lite | openrouter | gemini   → OpenRouter Flash Lite (default for curriculum / auto-improve)
--writer minimax                            → Vercel Gateway free MiniMax
--writer default                            → hosted Free via edge gm-turn
--premades id,id,...                        → override flagship filter
```

## Start flagship T50 review→repair (Flash Lite)

```powershell
npm run fate-curriculum:detach -- --ladder 50 --max-iters 3
```

(Equiv. with explicit writer: `--writer flash-lite` or `--writer openrouter`.)

Cost reminder: one clean **4-cell × 50t** pass ≈ **~$0.50–few $** (Flash Lite list ~$0.10/$0.40 per MTok; dual-review + repair iters add).

## Code touchpoints

- `src/game/autoplayWriter.ts` — Flash Lite resolve + critic; MiniMax optional
- `scripts/fate-autoplay/{curriculumImprove,autoImprove,dualReview,run}.ts`
- `src/game/playtestAutoImprove.test.ts`
- `.env.example`, `scripts/fate-autoplay/README.md`

No HUD stamp bump (harness-only).
