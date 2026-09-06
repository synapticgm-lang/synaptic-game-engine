# Synthesis — 02x vs 02w (4× T50 story lens)

**Ingest:** 2026-09-06 · **Stamps:** `2026-09-02w` (Lock A) → `2026-09-02x` (Locks B+C+D)  
**Writer:** hosted Free via gm-turn · Fate default · seed 42  
**Gemini:** story / book lens only. John numbered gems 1–4 in paste order (not pack order).

Paste packs: `scripts/fate-autoplay/runs/gemini-paste-2026-09-02x-t50/`  
02w source: conversation gems + `STRATEGIC-PLAN-02W-POST-MORTEM.md`

## Mode map (02x John gems ≠ pack numbers)

| John gem | Mode | Paste pack | Stop-early | Book | pass |
|---|---|---|---|---|---|
| 1 | PYOA | `04-PYOA` | T25 / abandon T30 | 2 | false |
| 2 | RPG | `03-RPG` | T17 / drop T22 | 2 | false |
| 3 | D&D | `02-DND` | T10 | 2 | false |
| 4 | LitRPG | `01-LITRPG` | T14 | 2 | false |

02w John gems *were* pack order: 1 LitRPG / 2 D&D / 3 RPG / 4 PYOA. All 2/10, pass=false.

## Score / error volume

| | 02w | 02x |
|---|---|---|
| LitRPG | 2 | 2 |
| D&D | 2 | 2 |
| RPG | 2 | 2 |
| PYOA | 2 | 2 |
| Mean | **2.00** | **2.00** |
| Fail | 4/4 | 4/4 |
| JSON P0 tickets | **10** (3+2+2+3) | **9** (2+2+3+2) |

**Did error amount improve?** No. Same four fails at 2/10. P0 ticket count 10→9 is critic jitter, not a hold. PYOA stop moved later (T9→T25) because `the stranger` glue is gone; score still 2 because charter rez + UI-as-NPC.

## What 02x held (02w P0s that did not return as P0)

Honest holds — same-mode situation existed:

- `(N/N HP)` — 02w D&D T12 P0 + LitRPG T16 P1. 02x D&D still had live steel; Gemini did not ticket HP.
- `RECORD n` / `[the sign]` — 02w RPG T9 / T51. 02x RPG ran to T51; those shapes not ticketed.
- `the stranger` splice — 02w PYOA P0. 02x PYOA clean of that token.
- `SNAPSHOT Location` — 02w PYOA P1. Not ticketed on 02x PYOA.
- Chrome-only HUD beat — 02w LitRPG T16 P1. Not ticketed on 02x LitRPG.

Absence is not a hold where the tape never reached the situation. Exact rock-strike recycle (02w RPG T14–17) did not return, but 02x RPG never ran that fight.

## What 02x missed / new

| Lock | 02w | 02x | Verdict |
|---|---|---|---|
| C charter | PYOA burned 3× | PYOA T17 ash → T30 intact → T33 burn | **Miss.** Same class. `charterUses ≥ 3` never saw the first prose burn. |
| D instruction-voice | planner notes / HP / RECORD | RPG T45 “Skip the comma… In no more than 120 words… Do not narrate” | **Partial.** Old chrome held; new imperative-craft shape slipped. |
| B CAST named-only | roles / stranger | `So I'm` / `No` / `Her` / `So I'll` / `We` / `Smart` as people | **Miss, new shape.** Dialogue / UI / pronoun harvest. |
| Slot-glue | `the stranger` | LitRPG `The Sevenfold` (`take The Sevenfold hands`) | **Same class, new token.** |
| Camera | stair/circle, chapel→mill | D&D priest/handler → West Wall; tavern ambush → sergeant snap | **Leftover.** Not shipped. |
| Loops | rock-strike, keep/scale, vendor stub | Wren T23–28; grain-chest; sergeant name-and-business | **P1 leftover.** |

Also new (not a lock we claimed): D&D T31 `→ NYX_NARRATIVE_STREAM`; LitRPG same chest opened 3× with different contents.

## Locks-worked verdict

Partial chrome hold. **No score uplift. Error volume not improved** (still 4× fail @ 2/10). Failure *shape* moved from HP / SNAPSHOT / stranger to UI-as-NPC + Sevenfold splice + still-open facts.

Strategic plan expected 4–5/10 after 02x. Actual: **2/10**.

## Next batch (structural; no deny-list; no SNAPSHOT/CRAFT fat)

1. UI / choice / planner fragments are **never-CAST / never-present** (shape: `So I'll`, `We:`, trailing `:` speaker labels, bare `Her` / `No` as names).
2. Slot-glue on **locked place titles** (Sevenfold Circle) the way stranger / deixis already is — not a Sevenfold deny token.
3. Charter fact-close on **prose burn**, not only `charterUses >= 3`.
4. Widen instruction-voice for imperative craft (“in no more than N words”, “do not narrate”, “skip the comma”).
5. Camera / occupancy stays a later lock unless John asks.
