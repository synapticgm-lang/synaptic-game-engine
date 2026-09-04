# Synthesis — 4× T30 (`02r` / critic `02r`)

**Ingest:** 2026-09-04 · **Writer:** hosted Free DeepSeek V4 Flash (`--writer default` / gm-turn) · **Agent:** Fate default  
**Seed:** 42 only (four cells, not a 4×4)  
**Stamp at run:** HUD / BUILD `2026-09-02r` (scene context tail + stale commit)  
**Repair stamp:** none — **no 02s**

Gemini story lens = OpenRouter `google/gemini-2.5-pro` (no `--flex`). 4/4 packs ok, 0 failed, 0×429.

## Score table (seed 42)

| Mode | s42 | 02q 4× T30 | 02p 4× T30 | 02n 4×4 T30 mean | 02l 2×4 T30 |
|---|---|---|---|---|---|
| LitRPG | **7** | 3 | 3 | 2.25 | 3.00 |
| D&D | **3** | 4 | 2 | 2.50 | 3.00 |
| RPG | **5** | 6 | 4 | 3.00 | 3.00 |
| PYOA | **4** | 3 | 2 | 2.25 | 3.00 |

**Overall mean:** **4.75** (4 cells). 02q 4× T30 was **4.00**. 02p 4× T30 was **2.75**. 02n 4×4 T30 was **2.50**. 02l 2×4 T30 was flat **3.00**.

One seed. LitRPG +4 vs 02q (this cell never left Sevenfold — no travel collage). D&D −1. RPG −1. PYOA +1. Do not treat +0.75 overall as a locked uplift — confirm run, one seed.

## Pipe health

| Cell | Turns | Empties | Timeouts | Retries | EDGE | Hang ≥25m |
|---|---|---|---|---|---|---|
| LitRPG s42 | 30/30 | 0 | 0 | 2 | none | none (~7.2m) |
| D&D s42 | 30/30 | 0 | 0 | 2 | none | none (~8.3m) |
| RPG s42 | 30/30 | 0 | 0 | 2 | none | none (~6.2m) |
| PYOA s42 | 30/30 | 0 | 0 | 3 | none | none (~8.2m) |
| **Job** | **120/120** | **0** | **0** | **9** | **none** | **none** |

T1–T2 clean on every cell. Stayed 2-wide. LitRPG 18:53:57Z; D&D +~138s (18:56:15Z). RPG 19:05:28Z; PYOA +~131s (19:07:39Z). No 3× empty cluster.

Readability FAIL: LitRPG (madlib T9 / T29), D&D (madlib T2 / T4 / T5), RPG (madlib T3 / T16 / T21). PYOA PASS.

`runManifest.buildStamp` / BUILD in all four metas: `2026-09-02r`. Snapshot `stamp` on turns: `2026-09-02r`.

## Did 02r tail + stale commit hold?

**Yes.**

- **0** post-travel beats write the **old room as HERE** (vault / Sevenfold / handler-at-the-ring while the ledger is Lowmarket / West Wall / Cup).
- D&D after real travel: T16 Lowmarket panel; T21 West Wall gate; T24 Lowmarket street; T29 West Wall keep. Camera matches the ledger.
- RPG T19 travel after T18 clear → T20 is Lowmarket panel, not a vault continuation. T23 West Wall; T30 Weighing Cup inn.
- Leave-behind + new room is **legal**. D&D T3: “You leave the priests behind… stepping through the vault's broken arch… Lowmarket sprawls before you.”
- **0** lastKill + blade-at-throat / live steel fight in the next 1–2 turns after a closed kill. LitRPG T19 is the clear; T20 is walk-away + wounded voice.
- **0** pre-travel vault GM leaking as if T9 continued in T10 on a new location.

Leftover (not the 02r class): LitRPG occupancy still lists Pact-Hunter Skirmisher after T19 clear. One mode. Recorded on the owner map. Not shipped.

## Did 02q one-camera / one-fight hold?

**Missed** on one cell.

- D&D T28: “You leave Lowmarket behind and reach West Wall. You push off the crates… a curved blade, worn in easy reach.” Leave-reach + steel on the same beat; body still Lowmarket crates/fence. **1 hit.**
- LitRPG / RPG / PYOA: **0** leave-reach formula.
- **0** lastKill + blade-at-throat recycle after a closed kill (02q fact-close still holds).
- No travel snap while an encounter was live. RPG fight T10–T18 stays in-camera; travel is T19 after clear.

One-mode miss. Not a shared P0. Not shipped.

## Did 02p clerk / closed-scene hold?

**Yes** (clerk invent).

- **0** `stranger clerk` across all four narration tapes.
- PYOA T2 pictures a clerk then finds the street empty — no occupancy invent.
- After the burn, clerk is **off-stage** (“Pell's clerk will be down here by noon”).
- Phrase `falls in beside` hit twice, **not** clerk: D&D T4 “Scattered Scale falls in beside you at the stairhead”; PYOA T26 “Wren falls in beside you after a moment.” Leftover / legal companion. Not 02p occupancy invent.

02p clerk still holds. Book scores moved for other reasons (D&D word-salad + travel critic-miss + PYOA charter loop + RPG `the stranger`).

## Shared P0s → 02s

See [`OWNER-MAP-02R-FOUR-MODE-T30.md`](./OWNER-MAP-02R-FOUR-MODE-T30.md).

**02s N.** No shared pipeline P0 (pad / harvest / commit / occupancy). Do not ship.

**Not shipped:** travel-as-teleport / vault→street (Gemini wrong), D&D T28 leave-reach+blade (one mode), PYOA charter loop, Pact-Hunter Skirmisher noun salad (leftover), `the stranger`, Scattered Scale, Wren Holt glue, LitRPG lastKill occupancy after clear. CAST `Curious` / `Contract` / `Didn` as persons did **not** recur this seed.

No second 4-run.

## Wall

| Segment | Clock (Z) | Wall |
|---|---|---|
| LitRPG + D&D s42 (2-wide, +138s stagger) | 18:53–19:04 | ~11m |
| RPG start → +131s stagger → PYOA | 19:05–19:15 | ~10m |
| Gemini 4-pack | 19:17–19:24 | ~7.0m |
| Owner map + synthesis | 19:24– | ~10m |
| **Fresh T30s** | 18:53–19:15 | **~22m** |
| **Job (reviews + no 02s)** | 18:53– | **~40m** |

## Commands

```bash
npm run fate-autoplay -- --turns 30 --seed 42 --bible summoned-pact --personality cold-system --engine litrpg --writer default
npm run fate-autoplay -- --turns 30 --seed 42 --bible summoned-pact --personality chilled-gm --engine dnd --writer default
npm run fate-autoplay -- --turns 30 --seed 42 --bible summoned-pact --personality chilled-gm --engine rpg --writer default
npm run fate-autoplay -- --turns 30 --seed 42 --bible thornferry-road --personality army-brief --engine pyoa --writer default
npm run fate-gemini-review -- --dir scripts/fate-autoplay/runs/gemini-paste-2026-09-02r-t30 --stamp 02r
```

Progress: `scripts/fate-autoplay/runs/rrr-4x-t30-02r-status.md`
