# Synthesis — Gemini Pro T50 P0/P1 owners (2026-09-01)

Run: `scripts/fate-autoplay/runs/2026-09-01T12-09-18-198Z_summoned-pact_cold-system_s42` (seed 42). Spot-check confirmed quotes in paste pack + `turns.jsonl` presence: `Scattered Scale, They, One, Press, …`.

| Sev | Title | Owner (root) | Fix class |
|---|---|---|---|
| P0-A | UI labels / pronouns as NPCs (`They`/`One`/`Press`) | `chromeAuthority` + `narrativeHarvest` + `proseWarden` — block choice-pad tokens from `present[]` / SNAPSHOT; scrub quoted fakes | D ledger |
| P0-B | Entity shapeshift (`Scattered Scale` item→sketch→lunge) | `chromeAuthority` polity/faction lock + `proseWarden` faction-as-loot scrub | D typed entity |
| P0-C | `crowd here here` / `sparse the crowd here` | `crowdAuthority.scrubInventedCrowdSize` — bare `crowd` replace onto already-`here` phrases; idempotent normalize | D warden |
| P0-D | Wall Sergeant dialogue treadmill T43–50 | `npcTopicFsm` case-sensitive `Talk to` miss → topics bind to `Scattered Scale`; choiceCompiler force exit after talk recycle | D compiler / FSM |
| P1 | `You reach The Sevenfold Circle under bombardment` spam | `proseWarden.scrubFalseArrivalWhenHere` only matched *current* loc — harden false arrival to opening/non-here places | D warden |
| P1/P2 | Dead SOCIAL CRISIS STATUS | `arcDirector` mandate without pads + STATUS leak of director chrome — suppress false crisis | Path A |

Mid writer stays OFF. Batch stamp target: HUD `2026-08-31s` / BUILD `2026-08-31k`.
