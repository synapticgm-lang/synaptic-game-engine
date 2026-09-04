# Synthesis — 4×4 T30 (`02n` / critic `02n4x`)

**Ingest:** 2026-09-04 · **Writer:** hosted Free DeepSeek V4 Flash (`--writer default` / gm-turn) · **Agent:** Fate default  
**Seeds:** 42, 43, 44, 45  
**Stamp at run:** HUD / BUILD `2026-09-02n` (packet diet)  
**Repair stamp:** `2026-09-02o` (one batch after all 16 reviews)

Gemini story lens = OpenRouter `google/gemini-2.5-pro` (no `--flex`). 16/16 packs ok, 0 failed, 0×429.

## Score table (mode × seed)

| Mode | s42 | s43 | s44 | s45 | Mode mean | 02l 2×4 T30 | 02k3x T50 |
|---|---|---|---|---|---|---|---|
| LitRPG | **2** | **2** | **3** | **2** | **2.25** | 3.00 | 4.33 |
| D&D | **2** | **2** | **2** | **4** | **2.50** | 3.00 | 3.00 |
| RPG | **3** | **4** | **2** | **3** | **3.00** | 3.00 | 3.67 |
| PYOA | **2** | **3** | **2** | **2** | **2.25** | 3.00 | 3.00 |

**Overall mean:** **2.50** (16 cells). 02l 2×4 T30 was flat **3.00**. 02k3x T50 was **3.50** (4.33 / 3.00 / 3.67 / 3.00).

Packet diet did **not** raise the book floor. RPG matched 02l (3.00). LitRPG/D&D/PYOA sat under both baselines. One D&D 4 and one RPG 4 are seed jitter, not a mode ceiling.

## Pipe health

| Cell | Turns | Empties | Timeouts | Retries | EDGE | Hang ≥25m |
|---|---|---|---|---|---|---|
| LitRPG s42 | 30/30 | 0 | 0 | 2 | none | none (~18.3m) |
| D&D s42 | 30/30 | 3 | 0 | 16 | none | none (~68m, slow empties) |
| RPG s42 | 30/30 | 2 | 0 | 15 | none | none (~72m) |
| PYOA s42 | 30/30 | 1 | 0 | 14 | none | none (~50m) |
| LitRPG s43 | 30/30 | 1 | 0 | 5 | none | none (~36.5m) |
| D&D s43 | 30/30 | 1 | 0 | 6 | none | none (~25m) |
| RPG s43 | 30/30 | 1 | 0 | 8 | none | none (~29m) |
| PYOA s43 | 30/30 | 0 | 0 | 6 | none | none (~17m) |
| LitRPG s44 | 30/30 | 0 | 0 | 3 | none | none (~16m) |
| D&D s44 | 30/30 | 0 | 0 | 2 | none | none (~7.6m) |
| RPG s44 | 30/30 | 0 | 0 | 2 | none | none (~7.3m) |
| PYOA s44 | 30/30 | 0 | 0 | 5 | none | none (~6.3m) |
| LitRPG s45 | 30/30 | 0 | 0 | 1 | none | none (~6.4m) |
| D&D s45 | 30/30 | 0 | 0 | 1 | none | none (~6.7m) |
| RPG s45 | 30/30 | 0 | 0 | 3 | none | none (~5.3m) |
| PYOA s45 | 30/30 | 0 | 0 | 1 | none | none (~6.6m) |
| **Job** | **480/480** | **9** | **0** | **90** | **none** | **none** |

T1–T2 clean on every cell (no skip). Dropped to 1-wide after D&D s42’s third empty; resumed 2-wide after RPG s42. Later cells ran ~6–8 min as estimated.

Readability FAIL: LitRPG s42 (madlib T12/T19), RPG s42 (madlib T4), D&D s43 (madlib T17).

## Packet-diet verdict

| Fear | Held? |
|---|---|
| LAST PAD chip dump narrated as story | **Yes — helped.** Narration-only packs had **0** `Ask a direct question` / `Press for leverage` / `Wait and watch` hits. |
| Token salad from prompt fat | **No.** Salad that committed was extract/commit (Hangul log dump, `ikuha`), not SNAPSHOT lectures. |
| Clerk invent after license delete | **No.** PYOA s42/s43/s44 still wrote mill/stranger clerk. License drop ≠ pipeline block. |

Diet did not buy book-score points. It did stop pad-label echo.

## Shared P0s → 02o

See [`OWNER-MAP-02N-4X-T30.md`](./OWNER-MAP-02N-4X-T30.md). Shipped:

- Hangul + Thai empty-GM on the live accept path
- Token-salad commit: `Consulting the FULL` / exact-XML / `ikuha`

**Not shipped:** writer-monologue variant (one seed), Chapel/Wren, Purposeful, clerk, travel-as-teleport, ending-pad.

**02o Y.** No second 16-run.

## Wall

| Segment | Clock (Z) | Wall |
|---|---|---|
| T30 16 cells (2-wide; 1-wide during empty cluster) | 06:39–10:17 | **~3h 38m** |
| Gemini 16-pack | 10:19–10:45 | ~27m |
| Owner map + 02o | 10:45– | ~25m |
| **Fresh T30s** | 06:39–10:17 | **~3h 38m** |
| **Job (reviews + 02o)** | 06:39– | **~4.5 h** |

Slower than the 1.5–3h estimate because D&D/RPG s42 stacked ~7-minute empty retries. After the cluster, cells matched ~6–8 min.

## Commands

```bash
npm run fate-autoplay -- --turns 30 --seed 42 --bible summoned-pact --personality cold-system --engine litrpg --writer default
# … 42/43/44/45 × four modes (2-wide; 1-wide after 3× empty)
npm run fate-gemini-review -- --dir scripts/fate-autoplay/runs/gemini-paste-2026-09-02n-4x-t30 --stamp 02n4x
```

Progress: `scripts/fate-autoplay/runs/rrr-4x4-t30-status.md`
