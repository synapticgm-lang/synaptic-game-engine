# tt-fix-13 — overnight root-cause round (lap 17)

Order: `docs/orders/tt-fix-13-order.md`. Read first: `mode-tt-lap-17.md`, `mode-tt-lap-16.md`, `tt-fix-12.md`, `CURSOR-STANDING-BRIEF.md`. Standing rule: root causes only, no patches, no exceptions added. The one deletion is in `docs/orders/tt-cut-log.md` under **tt-fix-13** (restore from `16ef28f5`).

Commit **`2b64ea5e`**, stamp **`2026-10-14z`** (after live `2026-10-14y`), pushed to `main`. Edge sync run (`encounterTerminalFsm.ts` and `narrativeHarvest.ts` changed; `--check` → "edge copies match"), `gm-turn` deployed, OPTIONS → 200 (boots). Live `https://www.synapticgm.com/version.json` reads `{"hud":"2026-10-14z","build":"2026-10-14z"}`.

## Items picked and why

Lap 17 stopped on five repeats. Playability first: what a player sees wrong on STATUS, in the people list and in the story on a quest turn. Three items, all at shared points (the encounter STATUS line, the place mask every harvest reads, the writer's engine result).

| # | Lap 17 | Why |
|---|---|---|
| 1 | N5 — "Encounter cleared: Cave Rat — lost" while the rat is still in the room | Wrong state on STATUS: the player is dying next to the rat, and STATUS says the encounter was cleared. |
| 2 | N6 — a dungeon exit ("Armoury Ruin") listed as a person present | Wrong state: the packet hands the writer "with 1 here", and the people list (talk chips, CAST) holds a room. |
| 3 | N10 (root) — the step the player took never reaches the writer | Prose contradicting the engine: E T19 "Check the mud around the opened graves" ticks, and the writer invents "boot prints leading away" where the step is heavy cart tracks leading uphill. D T16 is the same root: "fruitless search … finding nothing new" as Quest complete fires. |

**Skipped:**
- **Repeats, not tried a third time (written to `docs/orders/needs-john.md`):** N1 ("a camp" listed as a person present; lap 14 N12 round and tt-fix-11 item 4), N2 (the fact checker flags the camp meeting; tt-fix-6 and tt-fix-10), N12 (answer repairs paste the sheet or quest blurb; tt-fix-8 and tt-fix-9, the question is already with John). N4 (recover step with nothing recovered) and N8 (CR for engine-made foes) stay with John.
- **Needs John (written to needs-john):** N7, the "Buy a poultice and leave" chip with no engine action. There is no buy engine in any mode, and 12 hub beats across six bibles carry a buy, sell or trade hint. Building a shop or rewriting the hints is a design call.
- **Not picked, for the next round:** N3 (the travel day restarts at each journey) needs road hours on the game state, and the clock has no day counter. N11 (the rest line dropped at D T19) comes from two gate false positives (`lineHasUnhandedFind` on "found a quiet corner … to rest", `lineHasWrongTimeOfDay` on "afternoon turned towards dusk"); the fix at hand is an exception in each check, which the standing rule forbids. N9 is harness wording, not playability.
- **N10 as written in lap 17** (the gate drops the step's clue at E T4 and T18) is the gate working as designed: at T4 the writer showed the clue before the player looked, and at T18 the writer also had Jax check the mud, a step the player did not pick. The harm is T19, where the player did take the step and the writer had nothing. That is item 3.

## Cause and fix

### 1. A lost or fled fight reads "ended", not "cleared" (N5)
- **Cause:** `encounterTerminalFsm.formatEncounterClearedStatus` writes every terminal outcome as `Encounter cleared: X — <label>`, so a defeat reads "Encounter cleared: Cave Rat — lost" and an escape "… — escaped". The foe is not cleared in either case: the dungeon card keeps it in the room ("Cave Rat is here", B T17–T19).
- **Fix:** `src/game/encounterTerminalFsm.ts:392` — an escape or a defeat reads `Encounter ended: X — escaped / lost`; a win, parley or capture still reads `cleared`. The machine receipt `Encounter cleared: X (defeat)` that `placeThreats`, `dungeonCard` and the tests read is unchanged. `src/game/systemLog.ts:217` (core STATUS) and `:228`, `:234` (one line per foe) read `Encounter (?:cleared|ended):`. `src/game/arcDirector.ts:736` — the two `startsWith('Encounter…')` branches are folded into the engine-line prefix regex (cut log). Edge copy synced.

### 2. The rooms of the dungeon here are places (N6)
- **Cause:** `narrativeHarvest.harvestNarrativePeople` reads people from the prose after `maskPlaceNames` blanks the known place names. The mask knew hubs, their aliases, the save's places and route stops, but not the rooms of the dungeon the player is in. D T15 "the exits Corridor and Armoury Ruin remain" then matched the two-capitalised-words name pattern, and "Armoury Ruin" went into `present[]` (HERE "- Armoury Ruin", "with 1 here", T16–T17).
- **Fix:** `src/game/narrativeHarvest.ts:82` — the mask also blanks `state.activeDungeon.nodes` names. One owner (the dungeon card's own room list), no new name list. Edge copy synced.

### 3. The step the player took is the writer's fact (N10 root, also D T16)
- **Cause:** `tabletopQuestProgress.applyTabletopQuestTurn` returned only `Quest stage: <quest> — <chip>`, a STATUS line that `engineResult.CHROME_RECEIPT` keeps out of the writer's fact, and its chip is cut to the step's head ("Check the mud around the opened graves"). Both `fateAutoplay.ts:1220` and `useGame.ts:2830` also left `tabletopTurn.receipts` out of the `engineResultFact` list (story RPG's receipts were in it). On the turn a tabletop step ticked, the writer's engine fact was empty (E T19 `engineFact: undefined`), so it guessed.
- **Fix:** `src/game/tabletopQuestProgress.ts:23` — `TabletopQuestTurn` gains `facts`; `:269` sets it to the step's own words as the player's act ("You check the mud around the opened graves for heavy cart tracks leading uphill"). `src/game/fateAutoplay.ts:1226` and `src/game/useGame.ts:2836` add `tabletopTurn.facts` to the engine result, so live and fate read the same fact. STATUS is unchanged. A step that did not tick hands nothing.

## ruleCount (`node scripts/ruleCount.mjs`)

| | lines | regex | newRegExp | lists | fns |
|---|---|---|---|---|---|
| before | 8506 | 862 | 90 | 20 (274) | 1045 |
| after | 8506 | 862 | 90 | 20 (274) | 1045 |

No total rose. The only counted file changed is `tabletopQuestProgress.ts`; both edits stay on their existing lines with no regex or function added. In the uncounted `arcDirector.ts`, two `startsWith` branches were removed.

## Tests

- **New:** `src/game/ttFix13.test.ts`, 5 tests:
  - a defeat and an escape read "Encounter ended", a victory still "cleared";
  - STATUS keeps one ended line, also in core verbosity;
  - in the real barred-oak keep, prose naming two exits leaves `present[]` and the harvested people empty;
  - taking "Check the mud around the opened graves" (`ck-spine-mayor-problem`) at the graveyard hands the engine result "You check the mud … cart tracks leading uphill.", with no Quest stage text;
  - a turn that takes no step hands no fact.
  Four fail on `16ef28f5` and pass after the fix (checked with a stash). The no-step guard passes on both, as it should.
- **Fix runs: one.**
  - vitest **78** failing of 2716, **0 new** against tt-fix-12 (76). The two extra are known flakes from the tt-fix-12 list (`playtest27aRepair1` "27b Repair 2 S3", `seed94InfestationClear` "…pays 50 XP"); both pass alone.
  - Replay bank **64 / 628**, the same set.
  - tsc **552**, the same as the last ship.
  - Build green.
- **After the stamp bump:** the 24 stamp-pinned files, `ttFix12` and `ttFix13` pass, except `playtest29uTravelGap` "walking on reaches the far place on a later turn", which failed once in that parallel subset run. That is the same flake tt-fix-12 saw in the same subset: it passed in the full run and 3 of 3 times alone.

## Leftovers

- `docs/orders/needs-john.md` is untracked in git (as in earlier rounds), so it is not in the commit. This round added the lap 17 entry: four repeats still open, the buy-chip decision and the next-round notes.
- Item 3 tells the writer "You recover the lost survey journals" when that step ticks. That fixes the prose contradiction, but no journals are placed or put in the pack until John answers the recover-step question.

TT_DONE
