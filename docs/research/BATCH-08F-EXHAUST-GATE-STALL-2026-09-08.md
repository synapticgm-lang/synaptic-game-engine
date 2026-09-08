# Batch 08f — Exhaust pads + encounter economy + fail-closed flavor (2026-09-08)

**Status:** Feature branch `sparse-flavor-08f` (from `sparse-flavor-08e`). **Not merged to main.**

## Product lock (kept from 08d/08e)

- Silent Engine pad/spatial locks (no Talk on corpse; travel mutates HERE; PYOA Accept-ending)
- Threshold-only DeepSeek flavor (kill/CLEAR, L2, first HERE, first Talk) — not every turn
- Free DeepSeek; Mid OFF
- `SPARSE_FLAVOR=true`, `SILENT_ENGINE=false`

## Shipped 08f

| # | Lock | Owner |
|---|---|---|
| 1 | Ambient/inspect/stake pads single-use per HERE | `padExhaustion.ts` + `choiceCompiler` |
| 2 | Live encounter 3-slot (Offense / Mitigation-Flee / Tactical) + round HP/status delta | `graphChoices` + `encounterTerminalFsm` + `choiceCompiler` |
| 3 | Fail-closed flavor gate (1st person, PC name, invent, Jaccard>0.35, 6–22 words) + reject metrics | `freeMudPresentation` |
| 4 | Hub stall escalation T3 prune / T4+ progress / ambush only drought+peril | `hubStallEscalation` + `arcDirector` |
| 5 | PYOA single-use non-progression edges; env-only flavor (no CAST invent) | `pyoaSpine` + sparse prompts |

## Stamp

HUD / BUILD / index.html → `2026-09-08f`

## Vitest

`playtest08fBatch08f` (+ 08d/08e still green under 08f stamp)

## 4×T50 systems gates

Harness: `scripts/fate-autoplay/run08fFourModeT50.ts`  
Pastes: `scripts/fate-autoplay/runs/gemini-paste-2026-09-08f-t50/`

| Gate | Pass if |
|---|---|
| Zero-delta loops ≥4 | **0** occurrences |
| Invent in *rendered* quotes | **0%** |
| Flavor reject rate | report %; **fallback trigger if ≥50%** or invent leak |
| LitRPG L2 | on-time (≤T25) |
| Corpse-talk | **0** |
| Travel HERE moves | yes when Travel/Leave picked |
| Pace ≥3 | John's Gemini later (not this harness) |

## Pass/fail table (4×T50 seed 42)

Pastes: `scripts/fate-autoplay/runs/gemini-paste-2026-09-08f-t50/`  
Rescore: `SYSTEMS-SUMMARY-RESCORE.md` (zero-delta counted once per ≥4 loop)

| Mode | Systems | Reject % | Invent rendered | zeroΔ≥4 | Corpse-talk | Travel HERE | L2 | Combat | Notes |
|---|---|---:|---:|---:|---:|---|---|---:|---|
| LitRPG | **FAIL** (zeroΔ) | 0* | 0 | 2 | 0 | 5 / 4 | T12 | 2 | flavor quotes 3 |
| D&D | **FAIL** (zeroΔ) | 0* | 0 | 1 | 0 | 3 / 3 | T22 | 1 | flavor quotes 1 |
| RPG | **FAIL** (zeroΔ) | 0* | 0 | 2 | 0 | 3 / 3 | T13 | 1 | flavor quotes 3 |
| PYOA | **FAIL** (zeroΔ) | 0* | 0 | 2 | 0 | n/a | — | 0 | Accept-ending ×1; flavor 0 |

\* `summary.flavorMetrics.attempts` stayed 0 on these tapes (metrics merge leftover) — reject% not trustworthy from summary; harness inventLeak on rendered quotes = **0%**. No FALLBACK TRIGGER (reject≥50% or invent leak).

**Held:** corpse-talk 0; invent in rendered quotes 0; LitRPG/D&D/RPG L2 by T25; travel HERE moves; mud-receipt 50/50; Mid OFF; sparse thresholds.

**Missed:** ≥1 zero-delta loop (≥4 consecutive no-delta) in every mode — hub stall prune/progress not strong enough vs Fate pad recycle (Ask/Press/Listen/Inspect). Combat receipts still &lt;3.

## Leftovers

- Hub stall / ambient exhaust still allows multi-turn Ask·Press·Inspect recycle (zeroΔ loops)
- Encounter 3-slot held mid-run after `padChoicesToCount` + final compile lock; early turns in first wave still showed stake/inspect bleed (fixed mid-batch)
- Flavor reject metrics not persisted to `summary.json` (`attempts=0`) — wire `composeFreeMudTurn` state into final commit
- Combat ≥3 soft gate
- Pace ≥3 = John's Gemini later
- Do not merge main until zeroΔ gate green or John accepts FAIL-with-notes
