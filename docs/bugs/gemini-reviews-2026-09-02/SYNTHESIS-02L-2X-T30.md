# Synthesis — 2×4 T30 (`02l` / critic `02l2x`)

**Ingest:** 2026-09-04 · **Writer:** hosted Free DeepSeek V4 Flash (`--writer default` / gm-turn) · **Agent:** Fate default  
**Seeds:** 42, 43 (fresh)  
**Stamp at run:** HUD / BUILD `2026-09-02l`  
**Repair stamp:** `2026-09-02m` (one batch after all 8 reviews)

Gemini story lens = OpenRouter `google/gemini-2.5-pro` (no `--flex`). 8/8 packs ok, 0 failed, 0×429.

## Score table (mode × seed)

| Mode | s42 | s43 | Mode mean | 02k3x T50 mean |
|---|---|---|---|---|
| LitRPG | **3** | **3** | **3.00** | 4.33 |
| D&D | **3** | **3** | **3.00** | 3.00 |
| RPG | **3** | **3** | **3.00** | 3.67 |
| PYOA | **3** | **3** | **3.00** | 3.00 |

**Overall mean:** **3.00** (8 cells). 02k3x T50 overall was **3.50** (4.33 / 3.00 / 3.67 / 3.00).

Flat 3s. D&D and PYOA match the 02k3x T50 means. LitRPG/RPG sit under the 02k3x means (those were lifted by a 6 on one T50 seed). T30 did not raise the floor; it also did not hide the first real P0.

## Pipe health

| Cell | Turns | Empties | Timeouts | Retries | EDGE | Hang ≥25m |
|---|---|---|---|---|---|---|
| LitRPG s42 | 30/30 | 0 | 0 | 2 | none | none (~7.2m) |
| D&D s42 | 30/30 | 0 | 0 | 1 | none | none (~5.0m) |
| RPG s42 | 30/30 | 0 | 0 | 2 | none | none (~5.1m) |
| PYOA s42 | 30/30 | 0 | 0 | 5 | none | none (~6.3m) |
| LitRPG s43 | 30/30 | 0 | 0 | 2 | none | none (~5.5m) |
| D&D s43 | 30/30 | 0 | 0 | 2 | none | none (~4.7m) |
| RPG s43 | 30/30 | 0 | 0 | 1 | none | none (~12.8m, slow mid-cell) |
| PYOA s43 | 30/30 | 0 | 0 | 3 | none | none (~4.8m) |
| **Job** | **240/240** | **0** | **0** | **18** | **none** | **none** |

T1–T2 clean on every cell. 2-wide from ~05:29Z; no 429/EDGE cluster; stayed 2. Readability FAIL only LitRPG s42 (entity-madlib T11).

## First-P0 still ~T15?

**No — earlier.** Shared writer-note P0s landed at **T5 / T6 / T7**. T30 caught them. Gemini also ticketed travel/collage at T10+; those stay critic misses.

## Did 02l hold?

- **Charter sale replay:** partial. s42 sold T8 then **Use charter** T10 replayed the handoff. s43 delivered, no sale replay. Not both seeds.
- **Panel-as-actor:** held. No charge/step/Take-the-panel tickets.
- **Thornferry-as-person:** harvest/CAST held. s43 still personified the place in prose (one seed).

## Shared P0s → 02m

See [`OWNER-MAP-02L-2X-T30.md`](./OWNER-MAP-02L-2X-T30.md). Shipped:

- Writer planning notes never commit (`isWriterMonologueLeak`)

**Not shipped:** travel-as-teleport (Gemini wrong), Use-pad-after-sale (one seed), Thornferry prose personify (one seed), CAST Report/Sign, ending-pad loops.

**02m Y.** No second 8-run.

## Wall

| Segment | Clock (Z) | Wall |
|---|---|---|
| LitRPG/D&D s42 (1-wide) | 05:11–05:24 | ~13m |
| RPG s42 + 2-wide start | 05:24–05:29 | ~5m |
| 2-wide remaining six | 05:29–05:53 | ~24m |
| Gemini 8-pack | 05:55–06:07 | ~12m |
| Owner map + 02m | 06:07– | ~25m |
| **Fresh T30s** | 05:11–05:53 | **~42m** |
| **Job (reviews + 02m)** | 05:11– | **~1.5–2 h** |

## Commands

```bash
npm run fate-autoplay -- --turns 30 --seed 42 --bible summoned-pact --personality cold-system --engine litrpg --writer default
# … 42/43 × four modes (2-wide after RPG s42)
npm run fate-gemini-review -- --dir scripts/fate-autoplay/runs/gemini-paste-2026-09-02l-2x-t30 --stamp 02l2x
```

Progress: `scripts/fate-autoplay/runs/rrr-2x4-t30-status.md`
