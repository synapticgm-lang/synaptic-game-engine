# Synthesis — 4× T30 (`02p` / critic `02p`)

**Ingest:** 2026-09-04 · **Writer:** hosted Free DeepSeek V4 Flash (`--writer default` / gm-turn) · **Agent:** Fate default  
**Seed:** 42 only (four cells, not a 4×4)  
**Stamp at run:** HUD / BUILD `2026-09-02p` (closed-scene person)  
**Repair stamp:** none — **no 02q**

Gemini story lens = OpenRouter `google/gemini-2.5-pro` (no `--flex`). 4/4 packs ok, 0 failed, 0×429.

## Score table (seed 42)

| Mode | s42 | 02n 4×4 T30 mean | 02l 2×4 T30 |
|---|---|---|---|
| LitRPG | **3** | 2.25 | 3.00 |
| D&D | **2** | 2.50 | 3.00 |
| RPG | **4** | 3.00 | 3.00 |
| PYOA | **2** | 2.25 | 3.00 |

**Overall mean:** **2.75** (4 cells). 02n 4×4 T30 was **2.50**. 02l 2×4 T30 was flat **3.00**.

One seed. LitRPG +1 vs 02n s42 (was 2). RPG +1 vs 02n s42 (was 3). D&D matched 02n s42 (2). PYOA matched 02n s42 (2). Floor did not rise to 02l’s flat 3s. RPG 4 is the only cell above 02l.

## Pipe health

| Cell | Turns | Empties | Timeouts | Retries | EDGE | Hang ≥25m |
|---|---|---|---|---|---|---|
| LitRPG s42 | 30/30 | 0 | 0 | 2 | none | none (~12.0m) |
| D&D s42 | 30/30 | 0 | 0 | 2 | none | none (~12.0m) |
| RPG s42 | 30/30 | 0 | 0 | 0 | none | none (~7.3m) |
| PYOA s42 | 30/30 | 0 | 0 | 3 | none | none (~10.7m) |
| **Job** | **120/120** | **0** | **0** | **7** | **none** | **none** |

T1–T2 clean on every cell. Stayed 2-wide. First pair launched ~2s apart (before stagger rule; not killed). RPG started 15:31:53Z; PYOA +~122s (15:33:55Z). No 3× empty cluster.

Readability FAIL: LitRPG (false-arrival T15, madlib T19), D&D (madlib T2), RPG (madlib T2). PYOA PASS.

## Did 02p clerk / closed-scene hold?

**Yes.**

- **0** `stranger clerk` and **0** `falls into step` / `falls in beside` across all four narration tapes.
- PYOA T3 mill/inn intro is the allowed first occupancy: “the clerk's eyes flick to the charter… Pell's clerk keeps his table at the back of the ferry inn.”
- After leave (T15+), clerk stays **off-stage** (“Pell's clerk counts the days”; “he'll be here by noon”). No companion-join on the road. No Talk/Ask clerk pad inventing a person who is not here.

02p did what it claimed. Book scores did not move because the remaining Gemini P0s are travel collage (critic miss), one-mode charter rez, and leftover madlib tokens.

## Shared P0s → 02q

See [`OWNER-MAP-02P-FOUR-MODE-T30.md`](./OWNER-MAP-02P-FOUR-MODE-T30.md).

**02q N.** No shared pipeline P0 (pad / harvest / commit / occupancy). Do not ship.

**Not shipped:** travel-as-teleport (Gemini wrong), skirmisher recycle, PYOA charter rez, PYOA walk-away loop, RPG premise flip, Wren/Jax / Scattered Scale tokens (deny-list / leftover).

No second 4-run.

## Wall

| Segment | Clock (Z) | Wall |
|---|---|---|
| LitRPG + D&D s42 (2-wide, pre-stagger pair) | 15:19–15:31 | ~12m |
| RPG start → +122s stagger → PYOA | 15:31–15:44 | ~13m |
| Gemini 4-pack | 15:46–15:53 | ~7.5m |
| Owner map + synthesis | 15:53– | ~15m |
| **Fresh T30s** | 15:19–15:44 | **~25m** |
| **Job (reviews + no 02q)** | 15:19– | **~50m** |

## Commands

```bash
npm run fate-autoplay -- --turns 30 --seed 42 --bible summoned-pact --personality cold-system --engine litrpg --writer default
npm run fate-autoplay -- --turns 30 --seed 42 --bible summoned-pact --personality chilled-gm --engine dnd --writer default
npm run fate-autoplay -- --turns 30 --seed 42 --bible summoned-pact --personality chilled-gm --engine rpg --writer default
npm run fate-autoplay -- --turns 30 --seed 42 --bible thornferry-road --personality army-brief --engine pyoa --writer default
npm run fate-gemini-review -- --dir scripts/fate-autoplay/runs/gemini-paste-2026-09-02p-t30 --stamp 02p
```

Progress: `scripts/fate-autoplay/runs/rrr-4x-t30-02p-status.md`
