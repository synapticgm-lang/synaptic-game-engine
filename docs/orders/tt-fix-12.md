# tt-fix-12 — overnight root-cause round (lap 16)

Order: `docs/orders/tt-fix-12-order.md`. Read first: `mode-tt-lap-16.md`, `mode-tt-lap-15.md`, `tt-fix-11.md`, `CURSOR-STANDING-BRIEF.md`. Standing rule: root causes only, no patches, no exceptions added. The one deletion is in `docs/orders/tt-cut-log.md` under **tt-fix-12** (restore from `38ce08f0`).

Commit **`bbe5c856`**, stamp **`2026-10-14y`** (after live `2026-10-14x`), pushed to `main`. Edge sync run (`closedScenePerson.ts` changed; `--check` → "edge copies match"), `gm-turn` deployed, OPTIONS → 200 (boots). Live `https://www.synapticgm.com/version.json` reads `{"hud":"2026-10-14y","build":"2026-10-14y"}`.

## Items picked and why

Lap 16 stopped on two repeats. Playability first: what a player sees wrong on STATUS, in the story and in the dungeon. Three items, all at shared points (the STATUS receipt formatter, the writer's people list, the dungeon room's foe spawn).

| # | Lap 16 | Why |
|---|---|---|
| 1 | N1 (part) — a kill that pays nothing shows no reason on STATUS | The player sees a kill, no XP and no word why. |
| 2 | N2 — the packet hands the writer "a traveler" on stretches the engine marks "nobody met" | It licenses every real fact-checker flag this lap (A T5/T19, C T6/T15/T20, D T13): people on the road the engine never put there. |
| 3 | N8 — walking back into the room of a live foe starts no fight | Wrong state: the spider is in the room and the menu offers the quest step and "Find cover" (E T18). |

**Skipped (written to `docs/orders/needs-john.md`):**
- **N3 ("a camp" listed as a person present)** is a repeat of lap 15 N5 / lap 14 N12. tt-fix-11 was its second attempt. Per the repeat rule it is not tried a third time.
- **N4 (the fact checker flags the engine's camp meeting)** is a repeat of lap 15 N6 / lap 14 N13 (harness). It was attempted in tt-fix-6 and tt-fix-10. Not tried a third time.
- **N1, the CR itself:** paying Pale Bat Swarm / Blind Crawler would reverse the tt-fix-3 rule that `DND_DEFAULT_CR` never pays XP. That is John's call, so only the reason line was fixed.
- **N7 (a recover step completes with nothing recovered):** needs a decision on whether quest things are placed in the world, put in the pack, or only told.
- **Not picked, for the next round:**
  - N5 (travel-day hours restart at each journey) and lap 15 N8 (camp label and day reset) need the day's road hours on the game state, reset by any long rest. The clock has no day counter, so this is a new field plus rest hooks.
  - N6 (the gate repaired the packet's own "Old Well") is not traced. The name is on the writer's allowed list, and the run files do not record which check fired.
  - N9 ("Encounter cleared … lost" with the foe still there) is wording.

## Cause and fix

### 1. The "XP: none" reason reaches STATUS (N1)
- **Cause:** `engineFight.payEncounterXp` writes `XP: none (defeated Pale Bat Swarm — no XP: the foe has no challenge rating …)` and the engine record carries it (F T11, T21 `engineFact`). STATUS is built by `arcDirector.formatArcStatusReceipts`, an allowlist of engine line prefixes. It let `XP Gained:` through, but no branch matched `XP:`, so the reason line was dropped. `filterSystemLogForEngine` keeps the line (checked with a probe).
- **Fix:** `src/game/arcDirector.ts:740` — the engine-line prefix regex reads `XP(?: Gained)?`, and the separate `XP Gained:` branch is deleted (cut log). Paid and unpaid XP lines take one path. Paid XP still reaches STATUS as before (B T14 shape).

### 2. The road has no place local (N2)
- **Cause:** `closedScenePerson.storyMinorRoles` gives a place's common local when nobody is named. On a journey, `currentLocation` is "On the road between places", and `PLACE_ROLE_TABLE` maps `road|path|trail|lane` to `traveler`. `writerInfoLayer.formatWriterInfoLayer:174` then prints "Unnamed local who may be about: a traveler (may speak; give no name)" on every quiet stretch. The journey's road meeting (`travelJourney.encounterNote`, "quiet stretch, nobody met on the road") already decides who is on the road. The packet was overriding the engine.
- **Fix:** `src/game/closedScenePerson.ts:108`: no minor role while `isJourneyUnderway(state)`. The journey's meeting stays the only source of people on the road. A named lane or ford with no journey keeps its local. `sceneAllowsRoleIntroduction` reads the same function, so a role-introduction on the road follows too. Edge copy synced.

### 3. A fled-from foe is still in its room (N8)
- **Cause:** `dungeonCard.advanceDungeonCard` spawned a room's foe only when it had never spawned, or when the player typed a fight word. After a flee (E T17 "you fell back into Broken Gate; Cave Spider stayed in Antechamber"), the foe is `spawned: true` and not defeated. "Next unexplored room" walked back into the Antechamber (T18) and nothing started.
- **Fix:** `src/game/dungeonCard.ts:749` adds a `walkedIn` flag that is set when this turn's move enters a room (`:779`). `:887` spawns the room's live foe on `!spawned || walkedIn || fight`. The parked HP carries over (`spawnFoe` reads `hpRemaining`). A player who stays in the room after a flee is not re-attacked every turn.

## ruleCount (`node scripts/ruleCount.mjs`)

| | lines | regex | newRegExp | lists | fns |
|---|---|---|---|---|---|
| before | 8506 | 862 | 90 | 20 (274) | 1045 |
| after | 8506 | 862 | 90 | 20 (274) | 1045 |

No total rose. None of the three changed files is in the counted set. In `arcDirector.ts` itself, one `startsWith` branch was removed and no regex was added.

## Tests

- **New:** `src/game/ttFix12.test.ts`, with 5 tests, one block per item:
  - an unpaid Pale Bat Swarm kill shows "XP: none (…)" through `formatArcStatusReceipts` and `filterSystemLogForEngine`, and a paid Cave Spider kill still shows "XP Gained: 50";
  - a quiet road stretch hands no unnamed local, while a named lane with no journey keeps its traveller;
  - walking back into a parked foe's room in the real barred-oak keep spawns it with its parked HP, and staying put does not.
  The three item tests fail on `38ce08f0` and pass after the fix (checked with a stash).
- **Fix runs: one.**
  - vitest **76** failing of 2711, **0 new** against tt-fix-11's last run (79). The three that passed this time are known flakes: `openingEstablishment` "seals kit cover…", `seed94InfestationClear` "…pays 50 XP" and `playtest27aRepair1` "27b Repair 2 S3".
  - Replay bank **64 / 628**, the same set.
  - tsc **552**, the same as the last ship.
  - Build green.
- **After the stamp bump:** the 24 stamp-pinned test files and `ttFix12` pass. `playtest29uTravelGap` "walking on reaches the far place on a later turn" failed once in that parallel subset run. It passed in the full run and 3 of 3 times alone, so it is a flake, not this round. It is not on the known-flake list.

## Leftovers

- Unpaid engine-made dungeon foes now say why, but still pay nothing until John decides the CR question (needs-john).
- `docs/orders/needs-john.md` is untracked in git (as in earlier rounds), so it is not in the commit.
- Staging was reset once between two shell calls (something else in the tree touched the git index). The commit was re-staged and made in one call. Only this round's files are in `bbe5c856`; `humanJudge.mjs` is not.

TT_DONE
