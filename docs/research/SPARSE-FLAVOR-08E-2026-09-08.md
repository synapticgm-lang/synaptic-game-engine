# Sparse Flavor 08e (2026-09-08)

**Status:** Feature branch `sparse-flavor-08e`. Not merged to main until John okays after T50.

## Product lock

- Keep all **08d Silent Engine pad/spatial locks** (corpse Talk cull, Travel/Leave mutates HERE, PYOA Accept-ending, Saying Your deny).
- Free Option 2 MUD **receipt path stays**.
- **Sparse flavor:** `SPARSE_FLAVOR=true`, `SILENT_ENGINE=false` — DeepSeek micro-flavor **only** on:
  1. Lethal / lastKill / CLEAR kill
  2. Level up (`Level Up!` receipt)
  3. First turn on a new HERE (arrival / travel / leave)
  4. First Talk with a specific living NPC
- Ultra-lean prompt (one sentence; ledger nouns; fail-closed NONE / chrome-leak gate).
- UI: monospace receipt + italic quote when present (NarrativeView).
- Mid writer OFF.

## Stamp

HUD / BUILD / index.html → `2026-09-08e`

## Vitest

`playtest08eSparseFlavor` (+ 08d pad/spatial still green)

## 4×T50

Harness: `scripts/fate-autoplay/run08eFourModeT50.ts`  
Pastes: `scripts/fate-autoplay/runs/gemini-paste-2026-09-08e-t50/`  
Rubric: `docs/bugs/gemini-reviews-2026-09-02/SCORE-08E-OPTION2-RUBRIC.md`

| Mode | Gate | Flavor quotes | Invent rate | Corpse-talk | Travel / HERE | L2 |
|---|---|---:|---:|---:|---|---|
| LitRPG | **PASS** | 5 | 10% | 0 | 5 / 4 | T12 |
| D&D | **PASS** | 2 | 4% | 0 | 3 / 3 | T22 |
| RPG | **PASS** | 2 | 4% | 0 | 3 / 3 | T13 |
| PYOA | **PASS** | 0 | 0% | 0 | n/a | none |

Invent rate = accepted flavor quotes / mud-receipt turns (gate fail-closed drops invent).
Gemini MUD vibe 3+ is John's manual score later.
