# Owner map — four-mode T50 (`02k`)

**Not a scorecard.** Gemini book scores stay the only 1–10 / stop-early gate (LitRPG 3 / D&D 2 / RPG 6 / PYOA 4).  
**No 02l.** Repair only shared ledger/compiler P0s (not deny-lists). Nothing here is a one-liner that would invalidate all four scores. No second 4×T50.

Sources: [`gemini-01-litrpg-story-02k-reply.md`](./gemini-01-litrpg-story-02k-reply.md) · [`gemini-02-dnd-story-02k-reply.md`](./gemini-02-dnd-story-02k-reply.md) · [`gemini-03-rpg-story-02k-reply.md`](./gemini-03-rpg-story-02k-reply.md) · [`gemini-04-pyoa-story-02k-reply.md`](./gemini-04-pyoa-story-02k-reply.md)  
Paste: `scripts/fate-autoplay/runs/gemini-paste-2026-09-02k-t50/`  
Runs: LitRPG `2026-09-03T18-46-57-686Z_summoned-pact_cold-system_s42` · D&D `2026-09-03T19-14-42-939Z_summoned-pact_chilled-gm_s42` · RPG `2026-09-03T19-30-52-837Z_summoned-pact_chilled-gm_s42` · PYOA `2026-09-03T19-45-51-142Z_thornferry-road_army-brief_s42`  
Correction rule (same as 02e / 02i): Gemini defaults to `proseWarden` / `arcDirector` / `craft` for CAST / ledger / pad / chrome.

| Mode | Gemini P0 (turn + quote) | Actual code owner | Gemini wrong? | Ship in this repair? |
|---|---|---|---|---|
| LitRPG | T41 “You push against the blue panel… glass shattering… (System) power outage” | Chrome treated as a physical prop. Pick was **Press for leverage** at The Weighing Cup; writer smashed COVER chrome. `chromeAuthority`, not a ledger close. | Partial — Gemini said `proseWarden` | **NO** — leftover chrome / inspect-as-object |
| LitRPG | T22 wounded skirmisher still answers after T19 Leave (“The skirmisher's jaw tightens… ‘You were pulled through because Pellane is losing’”) | Lock C fact-close. T19 left her on her knees; combat receipts stayed 0 so `lastKill` never set. 02k greeter lock is lastKill-only. Flee/leave did not close talk-with-last-foe. | Yes — Gemini said `arcDirector` | **NO** — leftover Lock C (wounded-left, not dead-greeter) |
| LitRPG | T31/32/39 `the stranger` / `the court` token salad | CAST / hook-slot substitution of role abstracts. Same class as Lock B named-only. | Partial — Gemini said `proseWarden` | **NO** — leftover Lock B (not a deny-list) |
| D&D | T5 opening chant/ceiling reset after T1–T4 already at West Wall | Camera stayed West Wall; prose collaged the T0 vault. Anti-repeat / opening authority, not a travel snap. | Yes — Gemini said `arcDirector` | **NO** — leftover collage / opening reprint |
| D&D | T44 crate in Lowmarket after West Wall standoff | **Legal travel.** T43 Fate pick was `Travel toward Lowmarket`. Not a teleport. | **Yes** — Gemini missed T43 travel | **NO** — not a P0 |
| RPG | T50 “This, the scribe” + “Three and Yours lean in” | CAST harvest of deixis / pad tokens (`This` / `Three` / `Yours`) into `named[]`. Lock B. Verbatim in gmText. | Partial — Gemini said `proseWarden` | **NO** — leftover Lock B (deny-list growth forbidden) |
| PYOA | T22/T43 clerk takes the charter again / Pell re-offers after T12 sale | Lock C fact-close. T13 Use-pad correctly found an empty pocket. Dialogue/spine then **re-sold** the same charter. 02f hold-scrub owns kit; unused-fate / sale-replay does not. | Partial — Gemini said `arcDirector` | **NO** — leftover Lock C (charter topic reset) |

Empty ActionBar / no-choice: **did not occur** (200/200 turns had a Fate pick). T1–T2 no empty GM / no EDGE on any cell.

## Did 02k’s lastKill greeter lock hold?

| 02k lock | Four-mode evidence | Hold? |
|---|---|---|
| Dead foe does not rez as living greeter (looks up / nods / mug of ale) | LitRPG 02j P0 (T38–42 Void-Touched Scavenger innkeeper) **not ticketed**. No mug-of-ale lastKill rez this tape | **Yes** on the shipped lastKill class |
| Wounded / fled foe stays closed for talk | LitRPG T19 Leave (on knees) → T22 Ask → she lectures the hook. Receipts 0; `lastKill` idle | **No** — different Lock C slice |
| Harvest will not re-add lastKill to `present[]` | Not the Gemini kill this tape | **Untested / idle** |

02k is **not** “failed, revert.” The shipped lastKill greeter class held. Remaining P0s are Lock B CAST, Lock C wounded-left / charter-replay, chrome-as-object, and one collage reset.

## Leftovers (do not ship 02l)

| Leftover | Modes | Owner hint | Trajectory lock |
|---|---|---|---|
| `This` / `Three` / `Yours` / `the stranger` / `the court` as named CAST | RPG / LitRPG | Harvest + CAST `named[]` | **B** |
| Wounded-left skirmisher still talks | LitRPG | Encounter terminal / leave close, not lastKill | **C** |
| Charter sale replay after T12 (kit lock held at T13) | PYOA | Spine topic / unused-fate | **C** |
| Blue panel smashed as a physical prop + System leak | LitRPG | `chromeAuthority` | chrome leftover |
| Opening vault collage after real travel | D&D | Anti-repeat / opening authority | craft |
| `Whatever` as a person; panel-word splice | PYOA P1 | CAST / chrome | **B** / chrome |
| West Wall ↔ Lowmarket spaced travel | RPG P1 (not P0) | Lock A residual | already Lock A |
| `Argot` invent; gender flip; `Evening` as a name | LitRPG / RPG P1 | craft / CAST | **B** / craft |

Crowd empty-claim invent and mill-landing false-arrival did **not** return as Gemini P0s. Jax is still the Fate `--name`, not invent. Mid writer stays OFF.

**STOP. No 02l. No second 4×T50.**
