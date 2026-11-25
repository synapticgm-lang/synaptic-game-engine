# Engine-only 40-turn playtest — 2026-11-10

Live main `e98c490b`. No model calls, no merge, no deploy. Training capture stayed off (`training_ok: false`, `teacher_model: null`, `calls.jsonl` empty, `transportRetries: 0` on every turn).

The offline path is `fate-autoplay --dry-run`. That flag stubs the writer (`Dry run — stub writer, no GM call`) and still runs the travel commit, the pending-threat fight resolver (`resolveEngineFight`, the same function the live arc director calls), dungeon-card creation, and the scored chip picker. It does **not** call `runArcDirectorBeforeGm`, `resolveShopChip`, or `advanceDungeonCard`. Shop sales, companion `settleCompanions`, and room-to-room dungeon actions therefore could not resolve on this path even if a chip had asked for them. `runFastForward` has no caller outside its unit test, so a fast-travel allowance skip cannot appear as a chip.

The scored picker is the default Fate path (`--pick-mode fate`, profile `random`): four-slot weights, then chip-progress weights. No `--ai-agent-mode`, no `--typed-mix`. Seeds `884211` and `884212` are not in the replay-bank or fixture names. Picks were not scripted. A second seed would not create a fast-forward chip the turn loop never emits, and neither run ever stood on a Buy/Sell or "Ask … to join you" chip, so the picker had nothing to nudge toward.

The stub sentence `The scene held` repeats on purpose. Readability-gate "ignored-action" hits that only complain about that sentence are the mocked writer. They are not scored below. Engine receipts, chips, and the end snapshot are.

Turn numbers below are the transcript / `turns.jsonl` turn ids. The harness counter `turn 1/40` is the first player action; the transcript labels that result Turn 2 because Turn 0 is the stitched opening. Both runs completed 40 player actions (turns 2–41).

## Commands

```bash
npm run fate-autoplay -- --dry-run --turns 40 --seed 884211 \
  --game-mode tabletop --bible cursed-keep --personality chilled-gm \
  --pick-mode fate --out docs/playtests/2026-11-10-engine40

npm run fate-autoplay -- --dry-run --turns 40 --seed 884212 \
  --game-mode litrpg --bible summoned-pact --personality cold-system \
  --pick-mode fate --out docs/playtests/2026-11-10-engine40
```

| Mode | Bible | Voice | Seed | Run dir |
|---|---|---|---|---|
| Tabletop (`dnd`) | `cursed-keep` | `chilled-gm` | 884211 | `2026-11-10T08-57-18-494Z_cursed-keep_chilled-gm_s884211` |
| LitRPG | `summoned-pact` | `cold-system` | 884212 | `2026-11-10T08-57-24-590Z_summoned-pact_cold-system_s884212` |

Creation for tabletop was the seeded pregen: Human Fighter, soldier, standard array, kit A, HP 12, AC 16, 18 GP.

## Tabletop — what the 40 turns did

Jax starts in the Greyhollow Inn on The Lost Survey. Turns 2–7 are Ask / Search / Who are you / Answer Silas Thorne / Review the survey map. Turn 8 travels toward Greyhollow Church and the location becomes the church on leg 1 of 2. Turns 9–17 bounce the inn and the church: Answer, Follow up, Read, Talk, Ask about the lead, Review the map twice. Turn 18 is back on the road to the church and meets a stranger. Turn 19 picks Fight the writhing roots (an Athletics check, no HP change). Turn 20 Walk on arrives at the church. Turns 21–22 use Holy Water and Follow up. Turns 23–27 redirect through a graveyard journey (another stranger, then Walk on into Greyhollow Graveyard) and Make camp. Turns 28–32 study, travel, and fight the roots again beside a traveler. Turn 33 leaves that road for Keep Gate (+2h, a failed look-out roll). Turn 35 Walk on arrives at Keep Gate. Turns 36–41 are inside Keep Gate — Broken Gate: Recover the lost survey journals, Search, Follow up The Lost Survey, Follow up Held in Keep Gate, Use Holy Water.

End snapshot: still level 1, XP 0/300, HP 12/12, 18 GP. The Lost Survey is active and its "Review the crumbling old survey map" objective is still `completed: false`. A second quest, Held in Keep Gate, is active. `activeDungeon` is Keep Gate, standing in Broken Gate (`r0`). The Corridor holds an unopened Bronze chest. The Strongroom holds Rosel Rudd (`status: held`) behind a jailer key that is not in the bag. The Lord's Chamber has a mob and a Silver chest. No companion is recruited. No Buy/Sell chip was ever offered. Mira's Apothecary showed up as a travel chip on turn 40 and was not picked.

## LitRPG — what the 40 turns did

Contract Hall opening. Turns 2–3 Refuse the offer. Turns 4–5 Accept the offer. Turn 6 Search, and High Chanter Orel Vane warns that Ashknife Cell-Blade is closing. Turn 7 Face the threat wins that fight (HP 24→22, 6 gold, Knuckle Wraps). Turns 8–13 talk, read, and look, with the warning still up. Turn 14 wins against Contract Hall Tough (HP stays 22, 6 gold). Turn 15 travels to Lowmarket on a receipt that still says Lowmarket is ahead. Turns 16–20 talk and look while Integration Rat Pack is the warning. Turn 21 beats the Rat Pack (HP 22→20, 4 gold) and the same turn is a level-up. Turn 22 immediately fights Pact-Hunter Skirmisher (HP 27→9, Pendant, 7 gold). Turn 23 Leave the scene is marked not done and also starts a road leg with a pilgrim asking for food. Turn 24 beats a Wardline Bandit (HP 9→1, Longsword, 7 gold). Turn 25 Rest. Turn 26 Walk on returns to Contract Hall. Turn 27 loses to Ashknife Cell-Blade (HP 1→8). Turns 28–31 read, leave, rest, and Walk on back to Lowmarket, skipping a stranger who wanted help with a load. Turns 32–35 talk at Lowmarket, Leave the scene into West Wall, lose to a Seal-Warden (HP 8→8, took 11), and Rest. Turns 36–39 Leave / Talk / Read / Leave and ping-pong Lowmarket and West Wall. Turn 40 beats West Wall Levy (HP 8→4, 6 gold). Turn 41 reads Orel again while Calamity Remnant is still pending.

End snapshot: level 2, XP 57/187, HP 4/31, gold 36, no class id, no unspent stat points, no named skills, conditions empty. Bag is the starting clothes plus Knuckle Wraps, Pendant, and Longsword. Gold 36 equals the six fight drops (6+6+4+7+7+6). Both quests are still active; "Sign the pact" is still false. Orel Vane is still in `present` at West Wall. Companions empty. No dungeon. No Buy/Sell chip. The Weighing Cup was offered as travel on turns 35 and 37 and was not picked.

## Coverage the brief asked for

| Beat | Tabletop 884211 | LitRPG 884212 |
|---|---|---|
| Travel | Yes. Inn, church, graveyard, Keep Gate, multi-leg roads, Walk on. | Yes. Contract Hall, Lowmarket, West Wall, and the roads between them. |
| Fast-travel skip | No allowance skip. `runFastForward` is not on the turn path. Walk on did skip choice meetings (see P1). | Same. Walk on skipped a pilgrim and a stranger who asked for help. |
| Fight | No resolved encounter. "Fight the writhing roots" rolled Athletics and left HP at 12. | Six resolved fights, two defeats. |
| Shop | No merchant pad. Mira's Apothecary was only a travel chip on turn 40. | No merchant pad. The Weighing Cup was only a travel chip. |
| Companion recruit | No "Ask … to join you" chip. Party empty. | No recruit chip. Orel stayed present across hubs without a recruit. |
| Dungeon | Entered Keep Gate and stopped in Broken Gate. Chest, mob, and captive Rosel Rudd were never offered. | None. |

## P0

### LitRPG — a loss raises HP, and a second loss ignores the damage

Turn 27, Face the threat, defeat by Ashknife Cell-Blade:

> HP: 1 → 8 (dealt 0, took 5)
> You went down; Ashknife Cell-Blade left you there, hurt but alive.

Taking 5 damage from 1 HP produced 8 HP. The end snapshot has no Weakened condition, no `lifelineFiredTurn`, and gold was not dropped, so this is the fight receipt itself.

Turn 34, Face the threat, defeat by Seal-Warden:

> HP: 8 → 8 (dealt 11, took 11)
> You went down; Seal-Warden left you there, hurt but alive.

Eleven damage left HP at 8. `summary.json` records `deathCount: 2`. `playPhase` stayed unset. The run kept offering Face the threat.

Victory lines in the same run do subtract: turn 22 `HP: 27 → 9 (dealt 36, took 18)`, turn 24 `HP: 9 → 1 (dealt 20, took 8)`, turn 40 `HP: 8 → 4 (dealt 22, took 4)`.

## P1

### Both modes — the place changes while the travel receipt says you are not there yet

Tabletop turn 8, Travel toward Greyhollow Church. The GM line is `T8 at Greyhollow Church` and the nudge says the road brought you there. The travel receipt says:

> Travel: back streets between Greyhollow Inn and Greyhollow Church — leg 1 of 2 — +30 min, now morning; Greyhollow Church still ahead; quiet stretch, nobody met on the road

Turn 10 does the same snap back to the inn (`Greyhollow Inn still ahead` while the GM line is `T10 at Greyhollow Inn`). From turn 18 on, the first leg correctly stays `On the road between places` until Walk on. The first two journeys and the later ones disagree.

LitRPG turn 15:

> T15 at Lowmarket, you Travel toward Lowmarket.
> Travel: back streets between Contract Hall and Lowmarket — leg 1 of 2 — +30 min, now morning; Lowmarket still ahead; quiet stretch, nobody met on the road
> Nudge: the road brought you to Lowmarket.

Leave the scene is worse. Turn 33:

> T33 at West Wall, you Leave the scene.
> not done: other (unplaced move) (not done: no destination named)
> Travel: back streets between Lowmarket and West Wall — leg 1 of 2 — +30 min, now midday; West Wall still ahead
> Move not done: no destination named.

The action is reported as not done, the clock moves, and the location is already West Wall, which the receipt says is still ahead. The same shape is on LitRPG turns 23, 29, 36, and 39.

### Both modes — choice meetings do not stop the skip, and a lone fight chip names the wrong foe

The brief's rule: a lone mugger or ordinary wildlife is fought and the skip continues; a group, a choice, an elite, or a rare meeting stops the skip. There is no fast-forward chip. The skip that exists is Walk on, and it continues through choice meetings.

Tabletop turn 18, still short of the church:

> chance meeting: a stranger (level 1), on their own errand; wants: to know your business here, 60 ft off

Turn 20 Walk on arrives at the church. The stranger is gone. No talk chip was offered. The fight chip on that road was `Fight the writhing roots` (turns 19, 25, 32). Picking it logged `done: attack` and `FAILURE (Athletics / strike: d20 3 + 5 = 8 vs DC 15)` and left HP at 12/12. The invariant checker marks that chip dead: `"Fight the writhing roots" has no resolver`. Turn 24's stranger "wants: a hand with a heavy load" is likewise skipped by Walk on at turn 27. Turn 31's traveler "wants: company for the next stretch" disappears at turn 33 when the destination changes, replaced by `quiet stretch, nobody met on the road`.

LitRPG turn 23, on the road with a pilgrim who asks for food, then turn 26 Walk on arrives at Contract Hall. Turn 29's stranger who wants help with a load is skipped by Walk on at turn 31. `Fight the writhing roots` is offered on those roads too (turns 25 and 31) and is marked dead.

### LitRPG — the required threat name is the next foe, not the one you just fought

Turn 21:

> Fight: VICTORY vs Integration Rat Pack in 3 rounds.
> Must narrate: High Chanter Orel Vane warns that a secret worth selling will not wait at Lowmarket — Pact-Hunter Skirmisher closes in.

Turn 22 then fights the Skirmisher, and the required fact on that same turn names Void-Touched Scavenger. Turn 27 fights Ashknife Cell-Blade, who was already cleared at turn 7 ("cannot fight on"), while the fact names Contract Hall Tough.

### LitRPG — level 2 has no stat screen, and HP jumps with no heal line

Turn 21's own checker:

> level 1 → 2 changed nothing the player can do (no new skill rank, lock or option)

End state: level 2, XP 57/187, max HP 31, attributes still STR 14 / DEX 12 / CON 14 / INT 12 / WIS 10 / CHA 10, no class, no named skills. `Check System` is on the pad at turns 6, 13, 15, 22, 24, 30, and 40, and the checker says `"Check System" has no resolver`.

The fight line on turn 21 ends at 20 HP (`HP: 22 → 20`). Turn 22 opens at 27:

> HP: 27 → 9 (dealt 36, took 18)

No heal receipt sits between them.

### LitRPG — Accept the offer does not take the blade, and the rite stays unsigned

The opening puts a wrapped ember-blade on the table as a deal. Turns 4 and 5 both pick Accept the offer. The bag at the end is clothes, Knuckle Wraps, Pendant, and Longsword. Opening Rite step "Sign the pact" is still `completed: false`.

### LitRPG — Orel Vane is in every hub, and the nudge names the wrong town

He answers at Contract Hall, Lowmarket, and West Wall. The end snapshot still lists him in `present` at West Wall. No recruit chip was offered, and `companions` is empty. From turn 26 (Contract Hall) the nudge is still `the road brought you to Lowmarket`. Tabletop has the same stuck nudge from turn 18 through turn 41: `Nudge: the road brought you to Greyhollow Inn`, including while standing in Keep Gate — Broken Gate.

### Tabletop — the quest button, the map review, and the dungeon do not move

"Review the crumbling old survey map" was picked at turns 7, 16, and 17. The objective text is that same review. The end snapshot still has `completed: false`. `Follow up: The Lost Survey` is offered on most turns from 6 through 41 and the checker flags it dead (`no resolver`) every time it is on the pad. Turn 36 `Recover the lost survey journals` is logged as `done: rest` with a Survival check. Turn 39 `Follow up: Held in Keep Gate` is also dead. Rosel Rudd is still `held` in the Strongroom. The pad inside Broken Gate offers travel back to Greyhollow and the dead follow-up. It never offers the Corridor, the Bronze chest, the Silver chest, the mob in the Lord's Chamber, or a rescue.

### Both modes — a raw place id is offered as a destination

Tabletop turns 4 and 6:

> Travel toward place_greyhollow-at-the-inn

The checker: `"Travel toward place_greyhollow-at-the-inn" names a destination the travel engine cannot reach from here` and `has no resolver`.

LitRPG turn 4:

> Travel toward place_the-sevenfold-circle-under-valespire-cathedral

Same pair of failures.

### Tabletop — a general STR check is the roll for talk, map, holy water, and waiting

Who are you (turn 4): `SUCCESS (General check: d20 16 + 5 = 21 vs DC 15)`. Review the map (turn 7): `FAILURE (General check: d20 1 + 5 = 6 vs DC 15)`. Use Holy Water (turn 21): `FAILURE (General check: d20 9 + 5 = 14 vs DC 15)`. The +5 is the Fighter's STR save bonus. Investigation on Search correctly uses INT −1 (`d20 12 + -1 = 11`). Make camp uses `Survival: d20 11 + 2 = 13 vs DC 10`. Survival is not on the printed skill list (the sheet's Wisdom skills are Animal Handling, Insight, and Medicine at +3). A successful Use Holy Water at turn 41 (`d20 17 + 5 = 22 vs DC 15`) leaves Holy Water (Flask) at quantity 1.

Search the area also opens speech: turn 3 logs `done: search` and `Speech event: you address the people here. NPC reaction slot open for the innkeep` on the same action.

## P2

- Talk and answer lines double the name: `done: other Silas Thorne to Silas Thorne`, `done: talk High Chanter Orel Vane to High Chanter Orel Vane`.
- LitRPG Look, Search, Read, and Rest log `Attempt noted (…); no built character sheet to resolve a check`, so those actions have no roll.
- The opening tabletop sheet lists the Fighter kit and 18 GP and omits Holy Water, the Tavern Lodging Token, and the Minor Healing Draughts. Those items are in the end bag at their starting counts, so this is a sheet omission.
- Tabletop XP stays 0/300. Nothing in the run paid XP, because the only fight chip never started an encounter.
- The stub GM line is one sentence plus a pasted "Must narrate" fact. That is the dry-run writer. A paid prose run would replace the sentence and would still be handed the contradictory facts above.

## Verdict

**Tabletop is not ready for a paid 25-turn prose run.** Travel, a dungeon entry, and the main quest all ran, and they disagree with themselves: the first journeys arrive while the receipt says the town is still ahead, Walk on skips choice meetings, the survey objective never completes, and Keep Gate's chest, mob, and captive are invisible to the buttons. A writer would be asked to narrate that.

**LitRPG is not ready for a paid 25-turn prose run.** Fights, gold, and victory HP do add up, and that part can be narrated. Two defeats do not: HP goes 1→8 after "took 5", and 8→8 after "took 11". Level 2 arrives with no class, no stat spend, and no working Check System, and the HP total jumps 20→27 with no heal line. The offer never hands over the blade. The threat fact names a different foe from the fight that just ended.

Shop stock, a companion recruit, and a fast-travel allowance skip were not exercised. The first two never put a chip on the pad. The third is not called from a turn. Those gaps are not evidence that the systems work.
