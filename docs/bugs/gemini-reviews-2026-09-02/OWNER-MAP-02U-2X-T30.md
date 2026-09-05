# Owner map — 2×4 T30 (`02u` tapes)

**Not a scorecard.** Gemini book scores stay the only 1–10 / stop-early gate.
**Real P0** = same class in **both seeds of one mode** or **≥2 modes**. One-seed CAST / travel teleports are jitter or critic miss.
**No deny-lists. No new SNAPSHOT/CRAFT.**
**Repair stamp:** none — **no 02v / 02w**. Confirm run only.

Sources: `gemini-01`…`gemini-08-*-story-02u-reply.md` (story lens, flex, 8/8 ok)
Paste: `scripts/fate-autoplay/runs/gemini-paste-2026-09-02u-2x-t30/`
Tapes: `scripts/fate-autoplay/runs/_02u-2x-t30/`
Seeds **42** + **43** on stamp `2026-09-02u` (nobody-inflection salad). All 8 `meta.json` `build=2026-09-02u`.

Correction rule (same as 02t / 02r / 02q / 02l): Gemini defaults to `arcDirector` for legal Fate travel. Ignore that class.

## Salad hold (02u ship)

**Hold: YES.** 0 `no oneed` / `the no ones` / `no oneked` on 8 tapes.

Related leftover (not the hold string): D&D **s43** T3–T9 still writes crowd as `a no one` / `the no one` (`a no one trading at once`, `legs of the no one`). Legal `no one tends it` (T14) stays. One mode.

## Story scores (Gemini 2.5 Pro, flex, story lens only)

| Mode | s42 | s43 | Mean |
|---|---|---|---|
| LitRPG | 4 | 3 | **3.50** |
| D&D | 2 | 3 | **2.50** |
| RPG | 2 | 3 | **2.50** |
| PYOA | 2 | 3 | **2.50** |
| **Overall** | **2.50** | **3.00** | **2.75** |

All 8 stop-early. Free hook: 1 YES / 3 MAYBE / 3 NO / 1 omitted (D&D s42 reply skipped the hook line).
02t 2× T30 overall was **2.63**. Do not treat 02u as a score regression.

## Cells

| Seq | Mode | Seed | Turns | Errors | Timeouts | Book | Stop | Hook |
|---|---|---|---|---|---|---|---|---|
| 01 | LitRPG | s42 | 30 | 0 | 0 | 4 | T6/T8 | MAYBE |
| 02 | D&D | s42 | 30 | 0 | 0 | 2 | T13/T18 | — |
| 03 | RPG | s42 | 30 | 1 | 0 | 2 | T7 | NO |
| 04 | PYOA | s42 | 30 | 0 | 0 | 2 | T4 | NO |
| 05 | LitRPG | s43 | 30 | 0 | 0 | 3 | T16 | YES |
| 06 | D&D | s43 | 30 | 0 | 0 | 3 | T19 | MAYBE |
| 07 | RPG | s43 | 30 | 0 | 0 | 3 | T15 | NO |
| 08 | PYOA | s43 | 30 | 0 | 0 | 3 | T17 | MAYBE |

## Gate table

| Class | Seeds / modes | Actual owner | Gemini wrong? | Real? | Ship 02v? |
|---|---|---|---|---|---|
| Location “teleport” / leave-reach then old room / mill reenter | LitRPG s43 T3 · RPG s43 T3–T4 · PYOA mill/Dusk hops | **Legal Fate travel** + inspect pads. Same miss as 02t/02r. | **Yes** — `arcDirector` | **NO** (critic) | **NO** |
| Writer planning notes committed as story | LitRPG **s42 T8** · D&D **s42 T18** · RPG **s42 T8** | `isWriterMonologueLeak` residual (02m). Confirmed in `gmText`. s43: **0**. | Owner `proseWarden`/`craft` | **YES** (3 modes) | **NO** (confirm; no 02v) |
| Fight recycle / lastKill still talking or re-fought | LitRPG s43 T16–T22 · D&D s43 T17 then T22 · RPG s42 T16–T21 · RPG s43 T11–T22 | Encounter / lastKill fact-close leftover (02k/02q). | Said `arcDirector` | **YES** (≥2 modes + both RPG seeds) | **NO** |
| Companion name as object/slot (`take the Wren Holt` / `push the Dusk lane`) | PYOA **s42** · PYOA **s43** | Slot glue residual (02t). | Said `proseWarden` | **YES** (both PYOA seeds) | **NO** |
| `no oneed` / `the no ones` / `no oneked` | **none** | 02u `isTokenSaladLeak` + `scrubNobodyInflection` | — | **held** | **NO** |
| Crowd `the no one` / `a no one` (not inflected) | D&D s43 T3–T9 | 02f empty-claims leftover. Legal `no one else` / `no one tends` stay. | Said `proseWarden` | leftover (one mode) | **NO** |
| Token salad `clickaire` / `blinkasian` / `flinchaiser` / `face Jew` | D&D s42 T13/T18 · RPG s42 T7/T8 | `isTokenSaladLeak` leftover. | Said `proseWarden` | leftover (2 modes, s42 only) | **NO** |
| Scattered Scale as place then person | D&D s42 T3–T9 | Hub-role madlib leftover. | Said `proseWarden` | leftover (one seed) | **NO** |
| `the stranger` / `the stranger the stranger` panel | LitRPG s43 T8 · RPG s43 T27 | 02t slotGlue residual. Not both seeds of one mode. | — | leftover | **NO** |
| Charter-as-person / `Charter looks up` | **none** this 8 | 02t | — | **held** | **NO** |
| Leave-reach + steel same beat (02s) | **none** | 02s stamp refuse | — | **held** | **NO** |

## Writer monologue (tape-checked)

| Tape | Turn | Quote |
|---|---|---|
| LitRPG s42 | T8 | `--- This is a good in-character answer. It gives Jax the facts… Nice. I should present this cleanly and wait for Jax to choose.` |
| D&D s42 | T18 | `Hmm. Under the above tiers and instructions, and per my typing obligations for Turn 3 + 4, I must pick one concrete beat… Let me re-read Pact-Hunter Skirmisher.` |
| RPG s42 | T8 | `The narrative tension is maybe 3/10 right now… if I want TENSION, I would bring the bell or louder rain` |
| All s43 | — | **0** planning-note hits |

Gemini also tagged LitRPG s42 T6. Tape T6 has **no** planning tokens — T8 is the hit.

## 02v ship

**None.** Confirm run. Do not implement 02v or 02w.

Candidate if John later asks (do **not** implement now): writer-monologue commit reject residual (3 modes, s42). Fight recycle / companion-slot are older leftovers.

No second 8-run.
