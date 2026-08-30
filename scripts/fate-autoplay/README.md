# Fate autoplay

Headless **Fate's Pick** runs for smoke / continuity review / optional StoryForge SFT ingest.

Folder: `scripts/fate-autoplay/`  
Outputs: `scripts/fate-autoplay/runs/<timestamp>_<bible>_<personality>_s<seed>/`

| File | Purpose |
|---|---|
| `transcript.md` | Human-readable GM → Options → player (same as in-app Download transcript) |
| `turns.jsonl` | One JSON object per turn — training/review gold |
| `summary.json` | Error counts, p50/p95 latency, issue turns |
| `meta.json` | Run config + capacity note |

**Not** auto-trained into the live GM. Good for review + offline ingest only.

---

## Concurrent play (John)

**YES — you can play [synapticgm.com](https://synapticgm.com) while autoplay runs.**

- Separate browser session / save from the Node harness.
- Autoplay uses a **process-local Test Lab unlimited** flag (`enableAutoplayTestLab`) — it does **not** write your browser Test Lab settings and should **not** burn your Free player text turns.
- Do **not** point both at the same save file.
- Caveat: if somehow both shared a client capacity ledger without Test Lab, Free caps could collide — autoplay bypasses that via Test Lab override. Prefer leaving browser Test Lab as you normally use it; autoplay does not need your device flag.
- Hosted gm-turn spend still costs OpenRouter on the server for autoplay turns (ops cost), independent of your Free week-cap UI.

---

## How to run

```bash
# Single Summoned Pact / Cold Registrar, 20 turns
npm run fate-autoplay -- --turns 20 --seed 1 --bible summoned-pact --personality cold-system

# John's 40 plan (10 LitRPG + 10 tabletop + 10 RPG + 10 PYOA)
npm run fate-autoplay -- --matrix-40 --turns 20 --seed 1

# Dry-run smoke (no GM / no secrets)
npm run fate-autoplay -- --dry-run --matrix-40 --turns 2 --matrix-limit 2

# Full Launch cartesian (large — see budget below)
npm run fate-autoplay -- --matrix --turns 20 --matrix-limit 5
```

Requires `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in `.env` / `.env.local` for live GM (same as the app). Without them the CLI exits with the exact command + ETA (does not fail silently).

Progress for matrix batches: `scripts/fate-autoplay/runs/matrix-progress-<timestamp>.log`

---

## MiniMax writer + dual review + auto-improve + curriculum

```bash
# GM turns via MiniMax (AI_GATEWAY_API_KEY → free m3; else OpenRouter paid minimax/minimax-m3)
npm run fate-autoplay -- --writer minimax --turns 20 --seed 1

# After a run: MiniMax + Gemini Pro × (standalone story | game vibe/pace)
npm run fate-dual-review -- --run-dir scripts/fate-autoplay/runs/<dir>

# Single-bible closed loop
npm run fate-auto-improve -- --turns 8 --max-iters 2 --writer minimax

# Every ready premade × escalating turns (50→100→200→300). Advances ladder only when ALL are smooth.
npm run fate-curriculum -- --ladder 50,100,200,300 --max-iters 3 --writer minimax

# Same, detached (survives Cursor chat teardown)
npm run fate-curriculum:detach -- --ladder 50,100,200,300 --writer minimax
```

Curriculum stop rule: if any premade still has P0 tickets after `--max-iters` at tier N, **do not** raise turns — fix/allowlist that cell first.

Auto-improve / curriculum **will** edit allowlisted `src/game/*` files without asking. Rails:
- allowlist only (`autoImproveAllowlist.ts`)
- vitest gate + git checkout revert on fail
- **never** commits, pushes, WOF / auth / billing / edge secrets
- Mid writer stays OFF

Add `AI_GATEWAY_API_KEY` to `.env` for free Vercel MiniMax (promo ends ~2026-09-06). **Required** — OpenRouter fallback is off so the harness stays $0.

Gemini Pro: dual-review writes `*__gemini-pro-PASTE.md` for morning paste — **never** called via OpenRouter.

## Free-tier limits (autoplay only)

- `enableAutoplayTestLab()` in `src/game/testLab.ts` forces `isTestLabEnabled()` for **this Node process only**.
- `capacityLedger` already no-ops spend when Test Lab is on — Free week-cap / text-turn limits do not stop the run.
- Production players are unchanged. No shop/UI change required for autoplay.

---

## Answers John asked

### Is 20 turns enough?

**Smoke / early continuity:** yes — options pad, opening→first beats, wardens, STATUS.  
**Mid-game FO3 hubs / factions:** no — recommend **20 smoke + 50–100 deeper**; optional overnight **200+** on one bible.

### How many 20-turn runs in 12h?

Free hosted ≈ **45–75s/turn** → one 20-turn run ≈ **15–25 min**.  
Sequential in 12h ≈ **30–45 runs** (~600–900 turns). Timeouts/retries lower that.

### All choices / combos?

**Not** an exhaustive choice tree (exponential — infeasible).

Matrix = **game mode × premade × narrator**, each run distinct Fate playthrough:

| Mode | Premades (blank skipped) | Launch narrators |
|---|---|---|
| litrpg | 10 ready | 5 System (Simple 4 + Cozy Brutal) |
| dnd | 6 ready | 4 GM (Simple) |
| rpg | 12 ready | 4 GM |
| pyoa | 10 ready | 4 GM |

**`--matrix-40`:** 10 runs per mode (40 total). Every premade once when ≤10; DND extras cycle narrator/seed; RPG has 12 → first 10 included, 2 deferred (listed in plan JSON).

**ETA matrix-40 @ N=20:** ~**6–10 hours** sequential (45–75s/turn). If overnight is tight, use `--turns 15` (~4.5–7.5 h).

**Full cartesian** (`--matrix`): ~162+ combos — many tens of hours; use `--matrix-limit` or stick to `--matrix-40`.

---

## JSONL turn schema (ingest)

Each line:

```json
{
  "turn": 3,
  "startedAt": "…",
  "endedAt": "…",
  "durationMs": 52000,
  "bibleId": "summoned-pact",
  "personalityId": "cold-system",
  "seed": 1,
  "fatePick": "Look around",
  "offeredChoices": ["…", "…"],
  "playerInput": "Look around",
  "gmText": "…",
  "systemLog": ["…"],
  "error": null,
  "failKind": null,
  "transportRetries": 0,
  "repairNote": null
}
```

---

## Stamp

Product hook: Test Lab autoplay override + shared `pickFateChoice` → **2026-08-26q**.
