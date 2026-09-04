# Synthesis — 4× T30 (`02q` / critic `02q`)

**Ingest:** 2026-09-04 · **Writer:** hosted Free DeepSeek V4 Flash (`--writer default` / gm-turn) · **Agent:** Fate default  
**Seed:** 42 only (four cells, not a 4×4)  
**Stamp at run:** HUD / BUILD `2026-09-02q` (one camera / one fight)  
**Repair stamp:** none — **no 02r**

Gemini story lens = OpenRouter `google/gemini-2.5-pro` (no `--flex`). 4/4 packs ok, 0 failed, 0×429.

## Score table (seed 42)

| Mode | s42 | 02p 4× T30 | 02n 4×4 T30 mean | 02l 2×4 T30 |
|---|---|---|---|---|
| LitRPG | **3** | 3 | 2.25 | 3.00 |
| D&D | **4** | 2 | 2.50 | 3.00 |
| RPG | **6** | 4 | 3.00 | 3.00 |
| PYOA | **3** | 2 | 2.25 | 3.00 |

**Overall mean:** **4.00** (4 cells). 02p 4× T30 was **2.75**. 02n 4×4 T30 was **2.50**. 02l 2×4 T30 was flat **3.00**.

One seed. LitRPG matched 02p (3). D&D +2 vs 02p. RPG +2 vs 02p. PYOA +1 vs 02p. Floor rose above 02l’s flat 3s on D&D and RPG; LitRPG and PYOA stayed at/near the 02l line. Do not treat +1.25 overall as a locked uplift — confirm run, one seed.

## Pipe health

| Cell | Turns | Empties | Timeouts | Retries | EDGE | Hang ≥25m |
|---|---|---|---|---|---|---|
| LitRPG s42 | 30/30 | 0 | 0 | 1 | none | none (~5.7m) |
| D&D s42 | 30/30 | 0 | 0 | 1 | none | none (~5.6m) |
| RPG s42 | 30/30 | 0 | 0 | 2 | none | none (~6.1m) |
| PYOA s42 | 30/30 | 0 | 0 | 1 | none | none (~6.1m) |
| **Job** | **120/120** | **0** | **0** | **5** | **none** | **none** |

T1–T2 clean on every cell. Stayed 2-wide. LitRPG 16:50:45Z; D&D +~132s (16:52:57Z). RPG 16:58:44Z; PYOA +~114s (17:00:38Z). No 3× empty cluster.

Readability FAIL: LitRPG (madlib T2), RPG (madlib T8). D&D PASS. PYOA PASS.

`runManifest.buildStamp` / BUILD in all four metas: `2026-09-02q`.

## Did 02q one-camera / one-fight hold?

**Yes.**

- **0** `You leave X and reach Y` + blade/throat/skirmisher/steel on the same beat across all four narration tapes. 02p LitRPG T17 (`You leave The Weighing Cup behind and reach West Wall. The blade bites a hair's width deeper…`) did not recur.
- D&D has two **legal** leave-reach travel lines and no steel on those beats: “You leave Lowmarket behind and reach West Wall.” / “You leave West Wall behind and reach The Weighing Cup.”
- **0** lastKill + blade-at-throat recycle after a closed kill. LitRPG T19 forearm-across-throat **is** the clear. T20 is the downed body at the chest, not a throat recycle.
- No travel snap / arrival prepend while an encounter or pending was live. LitRPG T9–T19 and RPG T10–T19 stay in-camera; travel picks come after clear.

Leftover (not the 02q class): LitRPG T24 after leave — “But the skirmisher is already there — braced between you and the stalls below… short blade catching the grey morning light.” One-mode lastKill living-rez. Recorded on the owner map. Not shipped.

## Did 02p clerk / closed-scene hold?

**Yes.**

- **0** `stranger clerk` and **0** `falls into step` / `falls in beside` across all four narration tapes.
- PYOA T2 inn-yard intro is the allowed first occupancy: “Pell's clerk is where a man like him always is: half-sheltered in a doorway off the inn yard.”
- After leave (chapel / mill), clerk stays **off-stage** until a county clerk arrives at the mill as burn consequence (T22+). No companion-join on the road.

02p still holds. Book scores moved for other reasons (travel critic-miss + PYOA charter loop + CAST leftovers), not clerk invent.

## Shared P0s → 02r

See [`OWNER-MAP-02Q-FOUR-MODE-T30.md`](./OWNER-MAP-02Q-FOUR-MODE-T30.md).

**02r N.** No shared pipeline P0 (pad / harvest / commit / occupancy). Do not ship.

**Not shipped:** travel-as-teleport / vault→street (Gemini wrong), LitRPG T24 lastKill rez (one mode), PYOA charter rez + clerk-consequence loop, CAST `Curious`/`Contract`/`Didn`, Wren/Jax / Scattered Scale / `the two people here` tokens (deny-list / leftover).

No second 4-run.

## Wall

| Segment | Clock (Z) | Wall |
|---|---|---|
| LitRPG + D&D s42 (2-wide, +132s stagger) | 16:50–16:58 | ~8m |
| RPG start → +114s stagger → PYOA | 16:58–17:06 | ~8m |
| Gemini 4-pack | 17:07–17:15 | ~7.1m |
| Owner map + synthesis | 17:15– | ~10m |
| **Fresh T30s** | 16:50–17:06 | **~16m** |
| **Job (reviews + no 02r)** | 16:50– | **~35m** |

## Commands

```bash
npm run fate-autoplay -- --turns 30 --seed 42 --bible summoned-pact --personality cold-system --engine litrpg --writer default
npm run fate-autoplay -- --turns 30 --seed 42 --bible summoned-pact --personality chilled-gm --engine dnd --writer default
npm run fate-autoplay -- --turns 30 --seed 42 --bible summoned-pact --personality chilled-gm --engine rpg --writer default
npm run fate-autoplay -- --turns 30 --seed 42 --bible thornferry-road --personality army-brief --engine pyoa --writer default
npm run fate-gemini-review -- --dir scripts/fate-autoplay/runs/gemini-paste-2026-09-02q-t30 --stamp 02q
```

Progress: `scripts/fate-autoplay/runs/rrr-4x-t30-02q-status.md`
