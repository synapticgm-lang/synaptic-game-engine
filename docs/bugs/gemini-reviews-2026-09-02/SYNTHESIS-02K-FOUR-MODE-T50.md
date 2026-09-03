# Synthesis — four-mode T50 (`02k`)

**Ingest:** 2026-09-03 · **Writer:** hosted Free DeepSeek V4 Flash (`--writer default` / gm-turn) · **Agent:** Fate default · **Seed:** 42  
**Stamp:** HUD / BUILD `2026-09-02k` (dead-foe living-rez fact-close)  
**Stop rule:** exactly one 4×T50. Repair only shared ledger/compiler P0s (not deny-lists). No second 4×T50.

Gemini story lens = OpenRouter `google/gemini-2.5-pro` (no `--flex`). Free 12/day hook prompt kept. Gemini is the only 1–10 / stop-early gate. No competing Grok scores.

## Score table vs 02i (last four-mode)

| Mode | Premade | `02i` | `02j` LitRPG-only | `02k` | Δ vs 02i | Readability gate | Free hook |
|---|---|---|---|---|---|---|---|
| LitRPG | Summoned Pact | **3/10** | **3/10** | **3/10** | 0 | FAIL (4 entity-madlib T23/26/27/28) | **MAYBE** (T12 fight yes; quality dies after) |
| D&D | Summoned Pact | **3/10** | — | **2/10** | −1 | FAIL (2 entity-madlib T4/T9) | **NO** (T12 no durable delta; scene jumble) |
| RPG | Summoned Pact | **3/10** | — | **6/10** | +3 | FAIL (1 entity-madlib T13) | **YES** (T12 fight lock) |
| PYOA | Thornferry Road | **3/10** | — | **4/10** | +1 | **PASS** | **YES** (T12 charter sale is a real fork) |

Mean Gemini book score: 02i **3.00** · 02k **3.75**.  
±1 on D&D is same-stamp noise. RPG **+3** is the real move (readable first half; CAST kill is late T50). LitRPG held 3 through 02j→02k — lastKill greeter rez did **not** return as the stop-early.

Sources:

- [`gemini-01-litrpg-story-02k-reply.md`](./gemini-01-litrpg-story-02k-reply.md) · [`gemini-02-dnd-story-02k-reply.md`](./gemini-02-dnd-story-02k-reply.md) · [`gemini-03-rpg-story-02k-reply.md`](./gemini-03-rpg-story-02k-reply.md) · [`gemini-04-pyoa-story-02k-reply.md`](./gemini-04-pyoa-story-02k-reply.md)
- Owner map: [`OWNER-MAP-02K-FOUR-MODE.md`](./OWNER-MAP-02K-FOUR-MODE.md)
- Prior: [`SYNTHESIS-02I-ONE-CYCLE.md`](./SYNTHESIS-02I-ONE-CYCLE.md) · [`OWNER-MAP-02J-LITRPG.md`](./OWNER-MAP-02J-LITRPG.md)

## Did 02k hold?

**LastKill living-greeter rez (the 02j LitRPG P0): held.**  
Gemini did not ticket a dead foe nodding over a mug of ale. 02k’s shipped class did its job.

**Wounded-left talk: did not hold.**  
LitRPG T19 Leave (skirmisher on her knees, receipts 0) → T22 she answers the hook. `lastKill` never wrote. This is the next Lock C slice, not a revert of 02k.

**Charter kit lock: held. Charter topic lock: did not.**  
PYOA T13 Use correctly found an empty pocket after T12 sale. T22/T43 then re-sold / re-offered the same charter in dialogue. 02f hold-scrub owns the bag; unused-fate / spine replay is leftover Lock C.

**D&D T44 “teleport”: Gemini wrong.**  
T43 was `Travel toward Lowmarket`. The crate beat is a legal arrival inspect, not a scene snap.

Empty pad: **none.** 200/200 turns had a Fate pick.

## Pipe health

| Cell | Turns | GM empties | Timeouts | Transport retries | EDGE_FUNCTION_ERROR | Hang ≥25 min |
|---|---|---|---|---|---|---|
| LitRPG | 50/50 | **0** | 0 | 5 | none | none (~28 min, p50 27s) |
| D&D | 50/50 | **0** | 0 | 6 | none | none (~16 min, p50 10s) |
| RPG | 50/50 | **0** | 0 | 1 | none | none (~15 min, p50 15s) |
| PYOA | 50/50 | **0** | 0 | 0 | none | none (~25 min) |
| **Job** | **200/200** | **0** | **0** | **12** | **none** | **none** |

T1–T2 all four cells clean (no empty / no `EDGE_FUNCTION_ERROR`). Gemini 4/4, 0 failed, 0×429.

## Wall times

| Segment | Clock (Z) | Wall |
|---|---|---|
| Ship + deploy | 18:42–18:46 | ~4 min |
| LitRPG | 18:46–19:14 | ~28 min |
| D&D | 19:14–19:30 | ~16 min |
| RPG | 19:30–19:45 | ~15 min |
| PYOA | 19:45–20:11 | ~25 min |
| Paste + Gemini | 20:12–20:20 | ~8 min |
| Owner map + synthesis | 20:20–20:30 | ~10 min |
| **Job** | **18:42–20:30** | **~1 h 48 m** |

## Commands used

```bash
npm run fate-autoplay -- --turns 50 --seed 42 --bible summoned-pact --personality cold-system --engine litrpg --writer default
npm run fate-autoplay -- --turns 50 --seed 42 --bible summoned-pact --personality chilled-gm --engine dnd --writer default
npm run fate-autoplay -- --turns 50 --seed 42 --bible summoned-pact --personality chilled-gm --engine rpg --writer default
npm run fate-autoplay -- --turns 50 --seed 42 --bible thornferry-road --personality army-brief --engine pyoa --writer default
npm run fate-gemini-pastes -- --run-dir <each-run>
npm run fate-gemini-review -- --dir scripts/fate-autoplay/runs/gemini-paste-2026-09-02k-t50 --stamp 02k
```

Progress log: `scripts/fate-autoplay/runs/rrr-4x-t50-status.md`

## Verdict

One 4×T50 ran clean on stamp `2026-09-02k`. Pipe 200/200, 0 empties. 02k lastKill greeter lock **held**. Gemini stop-earlys moved onto Lock B CAST (`This`/`Three`/`Yours`/`the stranger`), Lock C wounded-left talk + charter sale-replay, chrome-as-object, and one opening collage. Scores 3/2/6/4. **No 02l. STOP.**
