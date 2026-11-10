# Engine-only fix rerun — 2026-11-10

Offline dry runs of live main `e98c490b`. No model calls. `calls.jsonl` is empty in every folder. Training capture stayed off.

Evidence of the unfixed engine is PR 27 (`cursor/engine40-playtest-8fc0`). This folder is the rerun after the fixes.

## Commands

```bash
npm run fate-autoplay -- --dry-run --turns 40 --seed 884211 --game-mode tabletop --bible cursed-keep --personality chilled-gm --pick-mode fate --out docs/playtests/2026-11-10-engine40-fix
npm run fate-autoplay -- --dry-run --turns 40 --seed 884213 --game-mode tabletop --bible cursed-keep --personality chilled-gm --pick-mode fate --out docs/playtests/2026-11-10-engine40-fix
npm run fate-autoplay -- --dry-run --turns 40 --seed 884212 --game-mode litrpg --bible summoned-pact --personality cold-system --pick-mode fate --out docs/playtests/2026-11-10-engine40-fix
npm run fate-autoplay -- --dry-run --turns 40 --seed 884214 --game-mode litrpg --bible summoned-pact --personality cold-system --pick-mode fate --out docs/playtests/2026-11-10-engine40-fix
npm run fate-autoplay -- --dry-run --turns 40 --seed 884215 --game-mode rpg --bible salt-road-heist --personality chilled-gm --pick-mode fate --out docs/playtests/2026-11-10-engine40-fix
npm run option-audit -- <run dir>
npm run option-audit -- <run dir> --prose
```

Seeds 884213, 884214, and 884215 are new. The picker is the scored fate picker (`--pick-mode fate`), not an AI player.

`npm test` (`vitest run`): 562 files passed, 4561 tests passed, 8 skipped. The only failure is `playtestOpen6RootCause` (missing OPEN6 snapshot). That is the known baseline.

## Option audit

`npm run option-audit -- <run dir>` reads any fate-autoplay folder that has `turns.jsonl`. It counts declared options and ignores the free-input Say / Do chips. Tabletop should be 3. LitRPG and story RPG should be 4.

Dry-run GM text is the stub `Dry run — stub writer, no GM call`. The default audit does **not** treat that stub as scene prose. An option is grounded when it follows from the engine facts the prose would be built from: `systemLog`, the location in the GM line, and the previous turn's facts. `--prose` switches to sentence citation: each option must share a content word with a sentence of the previous turn's GM text, and the report quotes that sentence. These numbers are the default (engine-fact) mode.

Legal means: no raw place id, no hub slug, not a duplicate, and not a chip the turn checker marked `"…" has no resolver`.

| Run | Mode | Turns | Grounded | Legal | Count violations |
| --- | --- | --- | --- | --- | --- |
| cursed-keep s884211 | tabletop | 40 | 77.1% | 100% | 2 |
| cursed-keep s884213 | tabletop | 40 | 96.7% | 100% | 0 |
| summoned-pact s884212 | LitRPG | 40 | 91.0% | 100% | 5 |
| summoned-pact s884214 | LitRPG | 40 | 86.9% | 100% | 0 |
| salt-road-heist s884215 | story RPG | 40 | 96.6% | 100% | 12 |

Worst examples:

- Tabletop s884211 turn 4 offers 2 (`Look around`, `Wait and listen`). `Search the area` has no resolver here, so it is not padded in. Turn 16 offers 2 (`Fight for breath`, `Ask Silas Thorne to stabilise you`) after HP 2 → 0. That is the death-save set: no healing potion was carried, so there is no Drink chip. Turn 5's `Study the clues` and `Use Holy Water (Flask)` do not share a content word with the engine facts on that turn.
- Tabletop s884213 turn 6 `Study the clues` and turn 14 `Face the threat` are legal and ungrounded in the facts. Turn 31 `Make camp` arrives at the destination while a receipt still says that place is ahead.
- LitRPG s884212 turns 3, 4, 35, 36, 37 offer 3 (`Ask what they want`, `Look around`, `Wait and listen`). Turns 11 and 32 `Rest and bind your wounds` have the same arrival mismatch.
- LitRPG s884214 turn 3's `+1 STR / DEX / CON / INT` and turn 2's `Accept the offer` / `Refuse the offer` are legal. The stub facts do not contain those words, so the fact audit marks them ungrounded. The turn itself did spend the point (`Stats: Spent free stat points — +1 STR`) and later chose Sorcerer.
- Story RPG s884215 turn 1 is the origin pad: `Origin: Acolyte`, `Criminal`, `Sage`, `Soldier`, and `Quick start` (5). Turns 17, 26, 30, and 34 offer 2. Turn 38 `Gather herbs and resources nearby` has the arrival mismatch.

## What the reruns did

Tabletop s884211 (Rogue, halfling, criminal). The Lost Survey opens by reviewing the map (turn 4), then escort, then the journals in the keep (turn 20, `Ask Silas Thorne about the lead`). A fight with Shadow Cutthroat shows initiative, rounds, AC, and HP (`HP: 12 → 2`, then `2 → 0` and death saves). Silas's Medicine check brings HP `0 → 1`. Talk is Persuasion, not a STR save. End state is level 1, 1/12 HP, 0 XP, Greyhollow Inn. No raw place ids, no `Follow up:` chips, no writhing-roots chip.

Tabletop s884213 finished 40 turns with 3 options every turn and the same clean chip rules. One arrival mismatch (turn 31, Make camp).

LitRPG s884212 refused the opening offer (`Offer refused`, `offerTaken: refused`). Two lifelines. No fight line raised HP. Five turns offered 3 options instead of 4.

LitRPG s884214 reached level 2 with the line `Level Up! Now level 2 — HP 24 → 31 (max 24 → 31). 1 stat point to spend.`, spent `+1 STR (14 → 15)`, and took Sorcerer. Five lifelines. Fight lines drop HP (`31 → 26`, took 5, and later drops). Option count is 4 on every turn. The scored picker did not choose `Accept the offer`, so the ember-blade is not in the bag.

Story RPG s884215 (salt-road-heist, seed 884215) finished 40 turns. Turn 1 is the five-chip origin pad. Later turns often have 2 or 3 declared options because a filler with no resolver is dropped instead of shown. End level 3. No lifeline on this seed. One arrival mismatch (turn 38, Gather).

Shop chips, recruit chips, and dungeon room / chest / rescue chips did not appear in any of the five scored runs. The dry-run turn does call `resolveShopChip`, `advanceDungeonCard`, and the recruit pad. The picker never stood on a merchant, a friendly recruit, or a dungeon room choice. Keep Gate's dungeon card is created at start (`[dungeon-card] Keep Gate`) and then crowded out.

## Per-bug status

| Bug | Status | Test |
| --- | --- | --- |
| A defeat must not raise HP. Damage taken lowers HP. At 0 HP the existing lifeline (LitRPG / story RPG) or death saves (tabletop) apply. | Fixed. Fight lines in these runs never print a higher HP than they started at. A lost road fight still prints `lost the fight to thugs` while death saves are open. | `playtestEngine40Fix` "a defeat never raises HP"; `s81RootBLostRoadFight` |
| The level-up HP jump is stated on the level-up line, with the LitRPG stat point. | Fixed. s884214 turn shows `HP 24 → 31` and `1 stat point to spend`, then `+1 STR`. | `playtestEngine40Fix` "the level-up note names the HP change"; `rules/spells.test.ts`; `rootGSystemOneAuthor` |
| Location and the travel receipt agree. A failed Leave does not invent a move. | Partial. The turn a journey starts no longer auto-walks the last leg. Wait, Look, Search, Flee, and Face no longer auto-walk. Make camp, Rest, and Gather still can: s884213 T31, s884212 T11 and T32, s884215 T38. The stall walker is what `playtestT10RPGLOOP` requires so a quiet road does not loop-stop. | `playtestT10RPGLOOP` |
| A choice meeting stops the fast-travel skip. Lone mugger or wildlife does not. "Fight the writhing roots" is not offered unless the foe is roots. | Skip-ahead is offered only when `canSkipAheadTo` is true (the place was visited and the stretch has a cost). Fast-forward already stops on a choice, group, elite, or rare meeting. A normal Walk on still steps; blocking every Walk on made arrival impossible (`playtest29wRoadEncounters`, `ttBuildRoadmeet`). No roots chip in these runs. | `playtestEngine40Fix` (unvisited Keep Gate is not a Skip chip); `fastForward.ts` `stopsSkip` |
| The threat fact names the foe just fought. A cleared catalog foe does not return. | Catalog pick skips `clearedFoeNames`. Road templates such as Pact-Hunter Skirmisher still reuse one label. | `playtestEngine40Fix` "a cleared foe name is not picked again" |
| Level-up grants a stat point and a class choice. Check System is a real chip. Accepting the offer grants the card's items and sets the pact flag. | Stat and class chips showed on s884214 and were spent. Check System is kind `system`. `applyOpeningOfferChoice` grants the items. These seeds refused the offer or looked around, so the ember-blade was not granted in the transcripts. | `openingOffer.ts`; s884214 turns 3–4 |
| NPCs stay in their own place. The road nudge names the real place. | Non-companions are not copied onto every hub. The nudge still names wherever the stall walker arrived, including the four mismatch turns above. | director stall guard |
| Reviewing the survey map completes that step. Follow up resolves or is not offered. Dungeon rooms can offer advance, chest, and rescue. | The map step completed on s884211 turn 4, then escort, then the journals. `Follow up:` is dropped (it was a persuasion restatement). Dungeon rescue chips exist on the card; the scored pad did not show them. | `playtestEngine40Fix` drops Follow up; `dungeonCard` `Free ${name}` |
| No raw place ids on chips. | No `place_` or `*-hub-*` labels in these runs. Hub ids map to display names. | `playerOptions` `displayChip` |
| Talk is Charisma / Persuasion. Search is not a speech event. A used consumable decrements. | s884211 talk lines are Persuasion. Search facts in the test have no speech event. Use-item still decrements a named consumable. Some travel turns still also roll a General check (s884211 has 3). | `playtestEngine40Fix` who-are-you and search |
| No doubled talk name. LitRPG can roll without an SRD sheet. The opening sheet lists the bag. Tabletop XP only where a rule pays it. | Doubled "Silas Thorne to Silas Thorne" is gone. LitRPG checks roll when attributes exist. The sheet test includes Holy Water. Tabletop XP stayed 0/ the track in both cursed-keep runs; no monster-XP receipt was paid. | `playtestEngine40Fix` |
| Dry-run reaches the arc director, shop, dungeon advance, recruit pad, and fast-forward, stub writer only. | Wired in `headlessFateTurn` before the stub. The scored runs exercised fast-travel only when the destination was already visited. Shop, recruit, and dungeon choices were not picked. | `fateAutoplay.ts` dry-run block |

## Tabletop against reference practice

Sources, with no invented quotations:

- System Reference Document 5.2.1, Wizards of the Coast LLC, CC-BY-4.0, https://www.dndbeyond.com/srd. The engine cites that document for level-up HP (`src/game/rules/advancement.ts`), the combat turn (`src/game/tabletop/combatChips.ts`), and death saves (`src/game/rules/recoveryConfig.ts`, `src/game/tabletop/roundFight.ts`).
- In-repo quest spine for Cursed Keep, `docs/research/pasted/tabletop-quest-spines-2026-09-17.md`, spine `ck-spine-scholars-folly` (The Lost Survey): Silas wants an escort to the keep, the first objective is reviewing the survey map, then the hill path, then the journal. No actual-play transcript was fetched. The comparison uses those two sources.

| Reference practice | This run (s884211) | Gap |
| --- | --- | --- |
| The GM frames the scene, the player declares, the check uses the matching ability, and the outcome follows. | Talk is Persuasion (d20 + CHA vs DC 10). Search is Investigation. The map review completes the first Lost Survey step. | Some travel declarations still also roll a General check. |
| Time moves across exploration, talk, and combat. | The run walks, talks to Silas and Father Aldous, and fights. | Long stretches repeat "presses their agenda" because the stub writer restates the beat. |
| Combat has initiative, rounds, the foe, and HP. | Turn 14 rolls initiative. Later rounds name the scimitar, AC, and `HP: 12 → 2` then `2 → 0`. | A disengage that does not change HP is "no progress" and can loop-stop a fight. s884213 survived that; an earlier seed did not. |
| A dungeon is room by room: doors, traps, treasure, prisoners. | Keep Gate's card is created. The pad the player saw was travel and talk. | Room, chest, and `Free …` chips did not reach the 3-slot pad. |
| A hook names who wants what, a first step, and a payoff. | Lost Survey: review the map, escort, recover the journals. Father Aldous's charge also advanced. | The journal step is named. The run ends at the inn, not holding the journal. |
| NPCs react in character. | Silas and Father Aldous stay addressable and the checks name them. | The stub cannot show character. The engine fact is a persuasion result plus a repeated agenda line. |
| Rest and resources. | Holy Water is on the sheet. Dying offers Medicine and a death save, not a look around. | No short or long rest procedure showed up. XP stayed 0. |
| Each chip is something a player would declare. | 100% legal. 38 of 40 turns have 3 options. The two short turns are a resolver gap and the death-save pair. | `Study the clues` and `Use Holy Water` on turn 5 are not grounded in that turn's facts. |

P1: stall on Make camp / Rest / Gather can still put you at the destination while a receipt says it is ahead. Dungeon room, chest, and rescue chips do not survive the 3-slot cap. Travel still sometimes rolls a General check.

P2: tabletop XP stays 0 after quest steps. No rest procedure. The stub repeats the NPC agenda so the session does not yet read as table talk.

## LitRPG, lightly

A system game shows a system line, a stat spend, a class choice, and a fight that changes HP. s884214 does that: level-up HP, one stat point, `+1 STR`, Sorcerer, and fight lines that only drop HP. Check System is a real chip. The opening offer was not accepted on these seeds. Template foes (Pact-Hunter Skirmisher) can appear again after a clear. That is listed below as a proposal.

## Proposals (not built)

- Session zero (origin backgrounds plus Quick start) is its own screen, not a 4-option scene turn.
- A death-save turn stays the SRD set (death save, a present ally's Medicine, a healing potion). It is shorter than 3 when no potion is carried. Do not pad it with Look around.
- The stall walker should advance a leg that does not arrive. Rest, Make camp, and Gather should not finish the trip. Today those three still produce the receipt/location split, because `playtestT10RPGLOOP` needs the stall nudge.
- Give road fights an instance name, or a longer cooldown, so "Pact-Hunter Skirmisher" does not read as the same person coming back. Unique catalog names already stay cleared.
- Stop rolling a General check on a declaration that is already Travel, Skip, or Walk on.
- Pay tabletop XP only from the SRD award the bible actually uses, and show that number. These runs stayed at 0.
- Keep dungeon, shop, and recruit chips ahead of generic Look / Wait when that scene is live, so a 3- or 4-slot cap cannot hide the chest, the rescue, the counter, or the recruit.

## Verdict

Not ready for a paid 25-turn prose run. The HP, check, place-id, follow-up, and level-up lines are fixed and covered by tests. The option audit is clean on legality (100%) and not clean on count: short pads and the origin pad remain, on purpose, where a filler would have been a dead chip. Four turns still arrive while a receipt says the place is ahead. A prose model would write that contradiction.
