# Curriculum restart — dual free MiniMax + Gemini feed (2026-08-30)

**Auth:** John — restart self-test + fix from start; free MiniMax only ($0 / no OpenRouter).

## Two free writers (Gateway rotate on 429)

| Role | Model id |
|---|---|
| Primary | `minimax/minimax-m3-free` |
| Secondary | `minimax/minimax-m2.7-free` |

Source: [Vercel changelog 2026-08-25](https://vercel.com/changelog/minimax-m3-and-m2-7-are-free-on-ai-gateway) — both free via GMI Cloud through ~2026-09-06.

On HTTP 429 / rate_limit:
1. Backoff (existing Batch A/D delays)
2. Flip active free id (GM `withRetry` + outer `callGmWithRetries`; critic `chatCompletion` `alternateModels`)
3. Never OpenRouter paid

Tracked per run in `meta.json` → `writerRotation` (+ `writer.startedModel` / live `writer.model`).

## Gemini feed

| Lens | Body |
|---|---|
| Story | Narration-only export (`story-narration-only.md`); `[engine fallback ×N]` collapsed; briefs tell Gemini not to treat Options as book prose |
| Game | Full pad transcript (Options + STATUS) |

MiniMax dual-critic auto overnight; Gemini packs are morning paste only (no Gemini API).

## Curriculum restart

- From T50 ladder across ready premades (`--ladder 50,100,200,300`)
- Auto-improve allowlisted patches ON
- Mid writer OFF (`STAGNATION_MID_WRITER_ENABLED=false`)
- Detached: `npm run fate-curriculum:detach -- --ladder 50,100,200,300 --writer minimax`
- Code baseline stamped under `scripts/fate-autoplay/runs/_pre-curriculum-backup/` + `curriculum-*/code-baseline.json`

## Stop

Kill the pid in `scripts/fate-autoplay/runs/_detached-logs/curriculum-*.pid` (and any child `node`/`vite-node` curriculumImprove processes).

## Residual risks

- Gateway still rate-limits both free ids; rotation only helps if caps are per-model not per-key.
- Promo ends ~2026-09-06 → free ids error after that.
- Flash Lite / Mid not used on this harness path; quality of m2.7 vs m3 for RPG prose unmeasured.
