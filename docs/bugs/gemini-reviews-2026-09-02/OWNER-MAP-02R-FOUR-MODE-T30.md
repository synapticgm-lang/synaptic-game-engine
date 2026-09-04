# Owner map — 4× T30 (`02r` tapes, `02r` critic)

**Not a scorecard.** Gemini book scores stay the only 1–10 / stop-early gate.  
**Real P0** = same class in **≥2 modes**. One-mode CAST tokens are jitter.  
**No deny-lists. No new SNAPSHOT/CRAFT.**  
**Repair stamp:** none — **no 02s**.

Sources: `gemini-01-litrpg-story-02r-reply.md` · `gemini-02-dnd-story-02r-reply.md` · `gemini-03-rpg-story-02r-reply.md` · `gemini-04-pyoa-story-02r-reply.md`  
Paste: `scripts/fate-autoplay/runs/gemini-paste-2026-09-02r-t30/`  
Seed **42 only** on stamp `2026-09-02r` (scene context tail + stale commit).

Correction rule (same as 02q / 02p / 02n / 02l): Gemini defaults to `arcDirector` for legal Fate travel / drought combat. Those are critic misses.

| Class | Modes | Actual owner | Gemini wrong? | Real? | Ship 02s? |
|---|---|---|---|---|---|
| Location “teleport” / vault→street / wall↔market loop | D&D T3 / T11 / T15 / T23 · RPG T19–T23 | **Legal Fate travel** + drought/combat. Same miss as 02q/02p/02n/02l. D&D T3 leave-behind vault then Lowmarket is legal. RPG T19 travel after T18 clear. | **Yes** — `arcDirector` | **NO** (critic) | **NO** |
| Leave-reach + curved blade same beat | D&D T28 only | 02q class recurred on one cell: `You leave Lowmarket behind and reach West Wall` + belt blade + still-Lowmarket crates/fence. Not blade-at-throat. | — | **NO** (one mode) | **NO** |
| Pact-Hunter Skirmisher noun salad | D&D T13+ · RPG T11–18 | `scrubEntityMadLibs` leftover. Readability gate already FAIL on both. | Said `proseWarden` | leftover (2 modes, not a new lock) | **NO** |
| Charter burn-then-back loop | PYOA T12–T31 (T22–T25 recycle) | Lock C + Fate `Use` / ending pads. One mode. Same leftover as 02q. | Said `arcDirector` | **NO** (one mode) | **NO** |
| lastKill stays in `present[]` after clear | LitRPG T20–T31 occupancy | Encounter residual. Wounded skirmisher still talks after T19 clear. **Not** blade-at-throat. One mode. | Partial (gender-swap P1, not occupancy) | **NO** (one mode) | **NO** |
| `the stranger` slot / incoherence | RPG T29–T31 | Crowd / slot leftover. | Said `proseWarden` P0 | leftover / one mode | **NO** |
| `falls in beside` (not clerk) | D&D T4 Scattered Scale · PYOA T26 Wren | Hub-role leftover + legal companion after burn. **Not** 02p clerk invent. | — | leftover | **NO** |
| Scattered Scale as glance / heartbeat / faction token | D&D T4–T8 · RPG · LitRPG T9 | Hub-role leftover. | Partial | leftover, not a new lock | **NO** |
| Wren Holt glue | PYOA T3 / T4 / T20 | Place/name slot. Shipping Wren list is a deny-list. | Said `proseWarden` | weak / PYOA | **NO** (deny-list ban) |
| CAST `Curious` / `Contract` / `Didn` as persons | **none** this seed | Word hits are `didn't` / `just curious` / Contract Hall. | — | **held** (jitter absent) | **NO** |
| Old room as HERE after travel (02r) | **none** | 02r tail + stale commit | — | **held** | **NO** |
| lastKill + blade-at-throat after closed kill (02q) | **none** after closed kill | 02q fact-close | — | **held** | **NO** |
| Invented clerk / stranger clerk (02p) | **none** | 02p occupancy | — | **held** | **NO** |
| LAST PAD labels as narration | none in narration-only | 02n SNAPSHOT drop | — | **held** | **NO** |
| Hangul / `ikuha` / writer-monologue | none | 02o / 02m | — | **held** | **NO** |

## 02r scene-context tail + stale commit (confirm)

02q leftover class was: after a real travel, the next beat still writes the **old room as HERE** (vault / Sevenfold / handler-at-the-ring while the ledger is Lowmarket / West Wall / Cup). Also: lastKill steel in the next 1–2 turns; pre-travel vault GM leaking as if T9 continued in T10.

| Check | Hits | Quote / note |
|---|---|---|
| After real travel, next beat writes old room as HERE | **0 / 4 tapes** | D&D T16 / T21 / T24 / T29 write the **new** location (Lowmarket panel; West Wall gate/keep). RPG T20 after T19 travel is Lowmarket panel, not the vault. LitRPG never left Sevenfold in the ledger (no travel to miss). PYOA ledger stays mill landing (spine, not vault→street). |
| Leave-behind + new room | **legal** | D&D T3: “You leave the priests behind… stepping through the vault's broken arch… Lowmarket sprawls before you.” RPG T19: “You turn your back on the broken circle… pavement slopes away… Lowmarket.” |
| lastKill + steel / blade-at-throat / live skirmisher fight in next 1–2 turns | **0** | LitRPG T19 is the clear (`encounter cleared: Pact-Hunter Skirmisher`). T20 is walk-away + wounded voice, no throat recycle. RPG T18 clear → T19 travel talk → T20 panel. |
| Pre-travel vault GM leaking as if T9 continued in T10 after a location change | **0** | No cell has a T9 vault beat committed as T10 HERE on a new ledger location. |

**02r held.**

LitRPG leftover (not the 02r class): T19 clear, occupancy still lists Pact-Hunter Skirmisher through T31; wounded talk continues. One mode. Do not ship.

## 02q one camera / one fight (confirm)

02p LitRPG T17 class was: `You leave The Weighing Cup behind and reach West Wall. The blade bites a hair's width deeper…`

| Check | Hits | Quote / note |
|---|---|---|
| `You leave X and reach Y` + blade/throat/skirmisher/steel on the same beat | **1 / 4 tapes** | D&D T28: “You leave Lowmarket behind and reach West Wall. You push off the crates… a curved blade, worn in easy reach.” Body of the beat is still Lowmarket crates/fence. LitRPG / RPG / PYOA: 0 leave-reach formula. |
| lastKill + blade-at-throat after a **closed** kill | **0** | LitRPG T19–T21: downed body / walk-away / voice. No throat recycle. |
| Travel snap / arrival prepend while encounter or pending is live | **0** | RPG fight T10–T18 stays in-camera; travel is T19 after clear. LitRPG fight never travels. |

**02q missed** on D&D T28 (one cell, not a shared P0). Other three tapes held.

## 02p clerk / closed-scene (confirm)

PYOA s42 mill/inn **may** introduce a clerk once. After leave, the role must not act or take a talk pad on the road.

| Tape | Quote | Invent? |
|---|---|---|
| PYOA T2 | “You picture the clerk… But the street ahead is empty… no clerk, no whispered price” | Off-stage / absent — not an invent |
| PYOA T9+ | “Pell's clerk will want the charter” / “Pell's clerk will be down here by noon” | Off-stage mention after burn |
| D&D T4 | “Scattered Scale falls in beside you at the stairhead” | Hub-role leftover, **not** clerk |
| PYOA T26 | “Wren falls in beside you after a moment” | Legal companion after burn, **not** clerk |
| All four modes | `stranger clerk` | **0 hits** |

**02p clerk held.** 0 `stranger clerk`. 0 mill clerk falling into step as occupancy invent. Phrase `falls in beside` hit twice on non-clerk leftovers — record, do not ship.

## 02s ship

**None.** No shared pipeline P0 (pad / harvest / commit / occupancy) that is new this stamp. Travel-as-teleport is the usual critic miss. Charter loop is PYOA-only. Entity-madlib / Scattered Scale / Wren Holt / `the stranger` are leftovers. D&D T28 leave-reach+blade is one-mode 02q residual.

Candidate lock if John later asks (do **not** implement): D&D T28 leave-reach + steel same beat; Pact-Hunter Skirmisher noun salad (D&D + RPG readability FAIL).

No second 4-run.
