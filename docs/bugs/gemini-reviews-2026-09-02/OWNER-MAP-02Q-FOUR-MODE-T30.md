# Owner map — 4× T30 (`02q` tapes, `02q` critic)

**Not a scorecard.** Gemini book scores stay the only 1–10 / stop-early gate.  
**Real P0** = same class in **≥2 modes**. One-mode CAST tokens are jitter.  
**No deny-lists. No new SNAPSHOT/CRAFT.**  
**Repair stamp:** none — **no 02r**.

Sources: `gemini-01-litrpg-story-02q-reply.md` · `gemini-02-dnd-story-02q-reply.md` · `gemini-03-rpg-story-02q-reply.md` · `gemini-04-pyoa-story-02q-reply.md`  
Paste: `scripts/fate-autoplay/runs/gemini-paste-2026-09-02q-t30/`  
Seed **42 only** on stamp `2026-09-02q` (one camera / one fight).

Correction rule (same as 02p / 02n / 02l): Gemini defaults to `arcDirector` for legal Fate travel / drought combat. Those are critic misses.

| Class | Modes | Actual owner | Gemini wrong? | Real? | Ship 02r? |
|---|---|---|---|---|---|
| Location “teleport” / vault→street / wall↔inn blend | LitRPG T10–12 · D&D T9–12 · RPG T10 | **Legal Fate travel** + drought/combat. Same miss as 02p/02n/02l. D&D T1/T7 leave-reach are travel-only (no steel on the beat). | **Yes** — `arcDirector` | **NO** (critic) | **NO** |
| lastKill living-rez after leave | LitRPG T24 only | Encounter residual after T19 clear + T21/T23 travel. Skirmisher braced + short blade on the street — **not** leave-reach+steel, **not** blade-at-throat. | Partial — said `arcDirector` scene-reset | **NO** (one mode) | **NO** |
| CAST harvest of dialogue words (`Curious` / `Contract` / `Didn`) | LitRPG T19–T21 | `narrativeHarvest` leftover. One mode. | Said `proseWarden` | **NO** (one mode / jitter) | **NO** |
| Charter burn-then-back (4×) | PYOA T9 / T11 / T18 / T29 | Lock C + Fate `Use your Millstone Charter` / ending pads. One mode. | Said `arcDirector` | **NO** (one mode) | **NO** |
| Clerk-consequence / walk-away loop | PYOA T22–T27 | `choicePad` / unused-fate ending pads. County clerk at mill is plot, not 02p occupancy invent. One mode. | Said `arcDirector` | **NO** (one mode) | **NO** |
| `the two people here` / `the stranger` / `open the stranger` | LitRPG · D&D T2 · PYOA T15–T18 | Crowd / slot leftover. List growth is a deny-list. | Partial | leftover | **NO** (deny-list ban) |
| Scattered Scale as glance / heartbeat / faction token | LitRPG · D&D T6 · RPG | Hub-role / faction token leftover. | Partial | leftover, not a new lock | **NO** |
| Wren Holt glue | PYOA opening + claim-ground scrub | Place/name slot. Shipping Wren list is a deny-list. | — | weak / PYOA | **NO** (deny-list ban) |
| Leave-reach + steel collage (02q) | **none** | 02q commit / warden | — | **held** | **NO** |
| lastKill + blade-at-throat recycle (02q) | **none** after closed kill | 02q fact-close | — | **held** | **NO** |
| Travel snap / arrival prepend while encounter live (02q) | **none** | 02q travel lock | — | **held** | **NO** |
| Invented clerk / stranger clerk / falls-into-step (02p) | **none** | 02p occupancy | — | **held** | **NO** |
| LAST PAD labels as narration | none in narration-only | 02n SNAPSHOT drop | — | **held** | **NO** |
| Hangul / `ikuha` / writer-monologue | none | 02o / 02m | — | **held** | **NO** |

## 02q one camera / one fight (confirm)

02p LitRPG T17 class was: `You leave The Weighing Cup behind and reach West Wall. The blade bites a hair's width deeper…`

| Check | Hits | Quote / note |
|---|---|---|
| `You leave X and reach Y` + blade/throat/skirmisher/steel on the same beat | **0 / 4 tapes** | D&D only has two **travel-only** leave-reach lines: “You leave Lowmarket behind and reach West Wall.” / “You leave West Wall behind and reach The Weighing Cup.” No steel on those beats. LitRPG / RPG / PYOA: 0 leave-reach formula. |
| lastKill + blade-at-throat after a **closed** kill | **0** | LitRPG T19 forearm-across-throat **is** the clear (`Encounter cleared: Pact-Hunter Skirmisher`). T20 is the downed body under a knee at the chest — no blade-at-throat. RPG T16–T18 hits a limp body; breath “ragged in your throat” is the PC, not a recycle. |
| Travel snap / arrival prepend while encounter or pending is live | **0** | LitRPG fight T9–T19 has no travel pick. RPG fight T10–T19 stays on the street. D&D Cup fight clears before later Lowmarket / West Wall travel. |

**02q held.**

LitRPG T24 leftover (not the 02q class): after T19 clear + T21 Cup + T23 travel back — “But the skirmisher is already there — braced between you and the stalls below… short blade catching the grey morning light.” Living-rez after leave. One mode. Do not ship.

## 02p clerk / closed-scene (confirm)

PYOA s42 mill/inn **may** introduce a clerk once. After leave, the role must not act or take a talk pad on the road.

| Tape | Quote | Invent? |
|---|---|---|
| PYOA T2 (inn yard — first intro allowed) | “Pell's clerk is where a man like him always is: half-sheltered in a doorway off the inn yard… ‘The magistrate's compliments,’ he murmurs” | **Legal** mill/inn intro |
| PYOA T3+ (leave to chapel / mill) | “Pell's clerk will soon find the landing empty of answers” / “Pell's clerk will raise hell when he hears it's ash” | Off-stage mention |
| PYOA T22–T27 | County clerk in livery arrives at the **mill** after the burn | Plot consequence at mill, not road companion-join |
| All four modes | `stranger clerk` / `falls into step` / `falls in beside` | **0 hits** |

**02p held.** No mill clerk falling into step after leave. No glued `stranger clerk`.

## 02r ship

**None.** No shared pipeline P0 (pad / harvest / commit / occupancy). Travel-as-teleport is the usual critic miss. Charter rez + clerk-consequence loop are PYOA-only. CAST `Curious`/`Contract`/`Didn`, Scattered Scale, and Wren Holt are deny-list / leftover, not a new lock.

Candidate lock if John later asks (do **not** implement): LitRPG T24 lastKill living-rez after leave — one mode this seed.

No second 4-run.
