# World of Fantasy (WOF)

**World of Fantasy** is an experimental fantasy-simulation research sandbox. It exists only inside `wof/` and is documented only inside `docs/research/wof/`. It is not an extension, migration target, compatibility layer, or staging surface for any production system.

> **Isolation rule:** WOF source code, schemas, fixtures, prompts, world saves, and research records must be authored and retained in the WOF namespace. WOF must not import from, write to, mirror, or depend on `src/`, `supabase/`, production deployment configuration, or any external game-engine namespace.

| Area | WOF location | Permitted responsibility | Explicitly excluded |
| --- | --- | --- | --- |
| Engine kernel | `wof/src/engine/` | Deterministic event application, invariant checks, seed control | Shared runtime packages and production services |
| Domain types | `wof/src/models.ts` | WOF-only TypeScript contracts | Imported production types or database models |
| Schema artifacts | `wof/data/schemas/` | Portable JSON Schema validation contracts | Database DDL, ORM migrations, edge functions |
| Fixtures and saves | `wof/src/fixtures/` | Disposable sample worlds and replay inputs | User or production saves |
| Tests | `wof/tests/` | Local replay and isolation checks | Production CI or deployment stages |
| Research record | `docs/research/wof/` | Decisions, hypotheses, playtests, and retired concepts | Operational documentation for other systems |

## Engine premise: the Tidelock Chronicle

WOF investigates **event-sourced expedition play** rather than long-lived character-sheet play. A world advances through a sequence of immutable *chronicle events*. Each event changes a small, auditable part of the world state, then passes through invariants that prevent contradictory fiction. The resulting design question is whether a fantasy campaign can deliver deep continuity while retaining short, replayable research loops.

The player experience is organized around the **Tidelock**: an unstable magical rhythm that opens routes, changes regional conditions, and creates temporary bargains among factions. Characters are not only collections of statistics. They carry **memories**, **oaths**, and **resonances** that alter what an event means in context.

| Design pillar | WOF experiment | Technical implication |
| --- | --- | --- |
| Event ownership | Every meaningful outcome becomes a named chronicle event. | Reducer input is an explicit `WorldEvent` union. |
| Bounded consequence | Each event alters limited state surfaces and has visible costs. | Domain invariants reject impossible resource, trust, and route states. |
| Reproducible uncertainty | A supplied seed makes experimental playthroughs replayable. | Random selection stays behind a WOF-owned seed interface. |
| Content portability | Lore packages can be swapped without changing the kernel. | Content uses localized JSON Schema documents. |
| Archive-first R&D | Any experiment may be frozen or discarded without integration pressure. | Every research artifact carries status and decision links. |

## Operating workflow

A contributor begins with an entry in `docs/research/wof/decisions/`, places a hypothesis in a playtest record, creates a fixture under `wof/src/fixtures/`, and runs the local test suite. A successful result may remain a WOF concept; it is never promoted by copying it into a live system. See `docs/research/wof/ROADMAP.md` for the three-phase decision gate.

## Local commands

After installing project dependencies within this directory, run:

```bash
cd wof
pnpm install
pnpm test
pnpm typecheck
pnpm run verify:isolation
```

The commands validate only WOF-owned files. `verify:isolation` fails if tracked WOF files reference protected namespace paths.

## Architecture map

```text
content package + seed
          │
          ▼
  event proposal / choice
          │
          ▼
chronicle reducer ──► invariant gate ──► next world snapshot
          │                                  │
          └──────────── replay log ◄─────────┘

research fixtures ──► local tests ──► decision / playtest record
```

The detailed design is maintained in [`docs/research/wof/ENGINE_BLUEPRINT.md`](../docs/research/wof/ENGINE_BLUEPRINT.md). 
