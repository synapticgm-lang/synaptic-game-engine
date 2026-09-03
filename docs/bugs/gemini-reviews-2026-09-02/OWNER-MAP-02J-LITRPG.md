# Owner map — LitRPG only (`02j` review → `02k` repair)

**Not a scorecard.** Gemini book score is the only 1–10 / stop-early gate. No competing Grok score.
**Scope:** LitRPG summoned-pact / cold-system / seed 42 only. D&D / RPG / PYOA not started.

Sources: [`gemini-01-litrpg-story-02j-reply.md`](./gemini-01-litrpg-story-02j-reply.md)  
Paste: `scripts/fate-autoplay/runs/gemini-paste-2026-09-02j-t50/01-LITRPG__story-standalone__gemini-pro-PASTE.md`  
Run: `scripts/fate-autoplay/runs/2026-09-03T17-29-44-603Z_summoned-pact_cold-system_s42`

| Mode | Gemini P0 (turn + quote) | Actual code owner | Gemini wrong? | Ship in this repair? |
|---|---|---|---|---|
| LitRPG | T38–42 kill then “the Void-Touched Scavenger, a stout man… looks up from his mug of ale and nods in greeting.” | Lock C fact-close. `lastKill` stripped `present[]` and 02j scrubbed combat re-engage only. Writer reused the drought-mob name as a living innkeeper. Not Mid-writer. | Yes — Gemini said `arcDirector` | **YES** — `02k` extends `scrubDeadFoeReengage` + commit reject + harvest skip (lastKill-driven, no deny-list) |

P1 leftovers (not shipped):

| Leftover | Owner hint | Why skip |
|---|---|---|
| T16/18/34 `the two people here` + Pact-Hunter Skirmisher splice | `crowdAuthority` occupancy rewrite | P1 craft/occupancy leftover, not the Gemini kill |
| T10→T13 skirmisher gender flip | writer continuity | craft, not ledger |
| T8 priest/handler appear at West Wall T26 | Lock C travel present trim residual | P1; 02j `applyPresentTrimOnTravel` already owns this class |
| T18→T19 bandit jump | writer / scene stitch | craft |

Empty pad: did not occur (50/50 Fate picks). T1–T2 no empty GM. Mid writer OFF.
