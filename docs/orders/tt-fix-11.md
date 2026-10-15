# tt-fix-11 — overnight root-cause round (lap 15)

Order: `docs/orders/tt-fix-11-order.md`. Read first: `mode-tt-lap-15.md`, `mode-tt-lap-14.md`, `tt-fix-10.md`, `CURSOR-STANDING-BRIEF.md`. Standing rule: root causes only, no patches, no exceptions added. Deletions are in `docs/orders/tt-cut-log.md` under **tt-fix-11** (restore from `0339063c`).

Commit **`d49c4022`**, stamp **`2026-10-14x`** (after live `2026-10-14w`), pushed to `main`. Edge sync run (`narrativeHarvest.ts` changed; `--check` → "edge copies match"), `gm-turn` deployed, OPTIONS → 200 (boots). Live `https://www.synapticgm.com/version.json` reads `{"hud":"2026-10-14x","build":"2026-10-14x"}`.

## Items picked and why

Lap 15 stopped on six repeats. Playability first: nobody got inside the keep, so there was no dungeon fight, kill or CR XP in any run. Four items, all at shared points (the step tracker, the interior door, the road-meeting pads, the person harvest), plus one dead chip.

| # | Lap 15 | Why |
|---|---|---|
| 1 | N2 (lap 14 N6, second attempt; first was tt-fix-10) — no chip to go inside at Keep Gate | Blocks the whole back half of every cursed-keep spine. |
| 2 | N3 (lap 14 N7, second attempt) — a move step ticks before the step ahead of it | The quest says done what the player never did. |
| 3 | N4 (lap 14 N8, second attempt; tt-fix-10 fixed the attack, not the tail) — "but fail and they attack" on a meeting that cannot fight | The chip promises a roll the engine never makes. |
| 4 | N5 (lap 14 N12, second attempt) — a landmark listed as a person | Talk chips and CAST lines aimed at a stair. |
| 5 | N7 (new) — "Force a path forward" with no engine action | A dead turn the writer has to invent. |

**Skipped:**
- N1 (a sheet field read out as speech) was already targeted by tt-fix-8 and tt-fix-9 and repeats in lap 15 E T13. Per the repeat rule it is written to `docs/orders/needs-john.md` with the evidence, both attempts, options and a recommendation.
- "As Jax" harvested as a person, N8 (camp label and day reset) and N6 (`factCheck.mjs`, harness) are not playability-first. They are noted in needs-john for the next round.

## Cause and fix

### 1. The way into the keep (N2)
- **Cause, part 1:** the inside step (`room: 'inside'`) was only takeable inside, so the tracker never offered its chip at the gate. Any chip the story offered for it was then stripped by `filterInventedContextChoices` as unnarrated, because only the tracker's chip is trusted as an engine chip. That is why it was offered in 1 of 311 gate visits.
- **Cause, part 2:** where the chip did show ("Search the keep for the taken guardsman", runs C, D and F), `enterInterior.objectiveOpensInterior` refused it: an inspect verb with no enter word is not a way in.
- **Fix:**
  - `src/game/tabletopQuestProgress.ts:157` `atStepPlace` returns `'door'` when the player stands at the place outside its rooms. `:170`/`:192` `takeableSteps` marks such a step `door`, so the tracker offers the inside step's chip at the gate (it is now the single producer of that chip).
  - `:236` `tabletopStepIsDoor` reads that mark. `src/game/enterInterior.ts:37` treats it as the way in, whatever the verb.
  - The step ticks only when taken inside. `tabletopQuestProgress.ts:252` skips a step that was the door where the player stood at turn start. `src/game/useGame.ts:2814` now passes `hereAtTurnStart`; the old `hereBeforeMove` was captured after the interior entry. `src/game/fateAutoplay.ts:1206` passes the turn-start place.

### 2. Move steps in order (N3)
- **Cause:** `arrivedMoveStep` ticked any open move step on arrival, so "Follow the cart tracks" ticked at the keep while "Check the mud" was still open (A T12).
- **Fix:** `tabletopQuestProgress.ts:203`: a move step ticks only once every required step before it is done. Talk and look steps stay takeable in any order (the tt-fix-1 rule "doing the gate first does not pay for a talk never had" is kept).

### 3. No fail tail on a peaceful meeting (N4)
- **Cause:** `encounterPads` added `withFailCost` ("…but fail and they attack") to every meeting pad, including meetings that cannot force a fight. There is no check behind it.
- **Fix:** `src/game/travelJourney.ts:431`: only a meeting with a fight pad (`fightPad(enc)`) gets the tail. A peaceful camp is simply passed by; a champion camp and the undead keep the tail.

### 4. A route stop is a place (N5)
- **Cause:** `maskPlaceNames` masked hubs and places but not the road's own stops. "Mossy Stair" (two-word Title Case) then passed `isHubContactProperName` and entered `present[]` (D T11–T16, also Split Oak and Woodcutters' Hut).
- **Fix:** `src/game/narrativeHarvest.ts:81` masks every `state.routeStops` name (edge copy synced).

### 5. "Force a path forward" (N7)
- **Cause:** `choicePipeline.sceneSafeFallbacks` pushed the chip whenever the prose named a door, gate, path or rubble, and `isLegalEnginePad` trusted it as an engine pad. No engine action stands behind it: no roll, no exit, no room.
- **Fix:** both are deleted (logged in the cut log). `src/game/choicePipeline.ts:372` loses that one alternative; the push at the old `:709–711` is gone.

## ruleCount (`node scripts/ruleCount.mjs`)

| | lines | regex | newRegExp | lists | fns |
|---|---|---|---|---|---|
| before | 8513 | 862 | 90 | 20 (274) | 1046 |
| after | 8506 | 862 | 90 | 20 (274) | 1045 |

No total rose. The tracker change, the only counted code that grew, is offset by folding five single-use helpers into their one caller (same bodies, logged in the cut log): `chipLegality` `gmBodies`, `cameFrom` and `lastPlayerLine`; `engineFactGate` `openQuests`; and `tokenProse` `keepCleanLines`.

## Tests

- **New:** `src/game/ttFix11.test.ts` (7 tests, one block per item, on real spines):
  - mayor-problem move order;
  - the barred-oak inside chip at the gate survives the invented-context filter and opens the keep;
  - walking in does not tick and taking the chip inside does;
  - a peaceful camp has no fail tail, while a champion camp and the undead keep it;
  - Mossy Stair is harvested as nobody;
  - no "Force a path forward".
- **Updated to the new rule:**
  - `ttFix10` item 5: the inside step ticks when taken inside, not from the gate.
  - `ttFix5` N4: at the gate the ground-floor step is the way in and does not tick (was "no chip at the gate", the N2 cause).
- **Fix runs:** two.
  - Run 1: tsc 552, build green, bank 64, vitest 79 (2 new: the `ttFix1` and `ttFix5` pins above). `ttFix1` pinned the deliberate tt-fix-1 rule, so the order check was narrowed to move steps.
  - Run 2: **vitest 77, same set as the baseline, 0 new**; bank **64 / 628**; tsc **552**; build green.
- **Verification after the ruleCount fold-ins** (no behaviour change): bank 64, build green. Vitest showed two failures outside the baseline, both flakes:
  - `openingEstablishment` "seals kit cover…" is marked in its own source as a known flake (tt-fix-2).
  - `seed94InfestationClear` "…pays 50 XP" also fails on a clean `HEAD` (`0339063c`) worktree: 1 of 8 runs alone there, 1 of 5 alone in this tree. It is a pre-existing random flake, not this round. It is not on the order's known-flake list (only `playtest30iFogOfWar` is), so John may want it added or traced.

## Leftovers

- The step tracker is the only producer of the inside chip. A writer-proposed "go inside" chip that names a different step still goes through the invented-context filter.
- "Force a path forward" is gone, but a writer's free-text "force" action still has no engine roll.
- `docs/orders/needs-john.md` is untracked in git (as in earlier rounds), so it is not in the commit.

TT_DONE
