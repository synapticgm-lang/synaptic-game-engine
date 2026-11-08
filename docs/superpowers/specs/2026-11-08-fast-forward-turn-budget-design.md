# Fast-forward turn budget

**Status: revised proposal.** Do not implement until this file is reviewed again. It authorises no gameplay change, no merge, no deploy, and no provider, environment, secret, or billing change. Training capture stays off. Fireworks is not selected. Gemini gameplay is not called. This document does not read a live balance, a bill, or a provider price list, and it states no pound or token price.

John asked for fast-forward across visited places and across ordinary work: travel, hunting, gathering, kills, drops, and training through a requested character level as well as a skill level. Each of those is a sequence of the actions the game already resolves. A hunt line is not a free kill. World hours are not allowance turns. There is no two-turns-per-day rate.

**Current** means the code does this today. **Proposed** means the adapter and the server ledger this spec describes. They are not built.

Out of scope: mid-visit implementation, friendly NPCs, edits to PYOA book files, and pull requests 1 and 2. Skipping the batch when `engineMode === 'pyoa'` is a **proposed scope choice**. Authored PYOA books do not spend text turns today (`isAuthoredPyoaBook` in the live send path). That fact does not prove every PYOA save was approved for exclusion. Book files stay untouched either way.

The player does not have to approve a key name, a taxonomy, or a numeric conversion. The request carries the goal, the max, and the presentation. The default presentation is funded story. A receipt-only telling is an optional choice on that same request, not a silent replacement.

## Current travel trace

`commitTravel` (`src/game/travelJourney.ts`) calls `commitTravelStep`.

Not underway, with a destination:

- `goTo` calls `mapGapBetween`. `steps === 0` is the same place and returns unchanged. `steps` for a region path is `min(MAX_LEGS, hops + 1)` with `MAX_LEGS` 4. `hoursPerLeg` is `STEP_HOURS` (0.25) when `steps <= 1`, otherwise `LEG_HOURS`: streets 0.5, road 2, coast 2, forest 3, marsh 3, mountain 4. `hoursAtPace` (`src/game/rules/travelPace.ts`) rescales those hours on a tabletop save (fast 4 mph, normal 3, slow 2) and `paceOnGround` will not go faster than the ground allows. Other modes stay Normal.
- `steps === 1`: `marchHours`, then either `diedOnRoad` or `arrive`, which calls `advanceClock` by `hoursPerLeg`.
- `steps > 1`: `startJourney` sets `legsTotal` to `steps`, `legsDone` to 1, rolls the day, calls `rollStretch` (one meeting check), and `advanceClock` by `hoursPerLeg`. The encounter, if any, is on the journey after this action.

Underway:

- Walk on, travel toward the destination, or the travel-on chip reaches `stepAlong` unless `laneBlocked` (open thugs, undead, monster, or villain) or the push-on confirm owns the turn. `stepAlong` increments `legsDone`, runs `marchHours`, rolls the day, and either `arrive`s when `legsDone >= legsTotal` or calls `rollStretch` again and advances the clock by `hoursPerLeg`.
- `travelOn` loops `stepAlong` until arrival, an event, or 8 stretches, inside **one** player action. The quote in this spec does not use that loop. One fast-forward index is one `goTo` or one `stepAlong`.
- Free text on a quiet road calls `spendExplorationOnRoad`, which adds `STEP_HOURS` and calls `stepAlong` only when the accumulated slices reach `hoursPerLeg`. Look, wait, and inspect stay still-ahead. A fast-forward index does not send loiter text and does not use the slice path.
- `dayIsSpent` is true when the terrain is not streets and `roadHoursToday + hoursPerLeg` would pass `TRAVEL_DAY_HOURS` (8). `canTravelOn` is also false at `areaTier >= 3` (`DANGEROUS_TIER`), on haunted ground, while an encounter is open, or when fewer than two legs remain. `rollRoadEncounter` uses `roadEncounterLevel`: area level at tier 3+, otherwise at most party level + 1. Rare spawns use `RARE_SPAWN_CHANCE` (0.12). A camp can set `miniBoss` from `CAMP_MINI_BOSS_CHANCE` (0.5). Dying or ended play returns unchanged and does not move.

Visited places: a non-road place with `typeof lastVisitedTurn === 'number'` is the filter `travelJourney` already uses. `worldMapLayout` also treats `arcStatus` `visited` or `cleared` as seen. This spec's destination rule uses `lastVisitedTurn` only.

## Current hunt, kill, drop, and XP trace

`startHuntFromInput` (`src/game/wildlifeActions.ts`) returns null unless `huntModeOk` (litrpg only), the line is a hunt, opening is complete, no encounter is live or pending, and the place is outdoor wilds. Otherwise it calls `openHunt`, which sets `activeEncounter` from `huntFoe` and returns `fightInput` `Attack <name>`. Rare and elite scale that encounter. An empty stock returns a fact and no fight. It does not itself kill, pay XP, or drop a hide.

`resolveEngineFight` (`src/game/engineFight.ts`) is the fight. `usesRoundCombat` (`src/game/tabletop/roundFight.ts`) is true only for dnd with `character.srd`. On that path one player action is one round, a death save, or a flee or parley check. On litrpg and rpg the same function calls `simulateCombat` and settles the whole exchange inside the one action that attacked.

On victory that settle calls `payEncounterXp`, which calls `applyCharacterXpGain` (`src/game/characterXp.ts`). Wilds table kills can pay 0 when the kill is gray, over the hunt budget, or inside `wildsHuntDeathCooldownUntilTurn`. LitRPG and story RPG gain at most one character level per `applyCharacterXpGain`, with surplus capped. A defeat pays no victory XP, sets the death cooldown, and is not a kill. `applyWildsKillExtras` then spends the stock unit and, for a skinnable non-humanoid, adds one hide. A full pouch refuses the hide. Humanoids drop no hide. The drop is not XP-gated and has no price.

`arcDirector` calls `startHuntFromInput` before the writer on the live turn. The same turn can then attack. That is one allowance charge for spawn plus, when the mode auto-settles, the `simulateCombat` result. It is not a second free kill, and a loss is not a kill.

Gather (`startGatherFromInput`) is litrpg or rpg (`modeUsesEquipLevel`). It can open a guard fight instead of taking a node. Below the unlock rank, a roll at or above `GATHER_BELOW_UNLOCK_CHANCE` (0.5) finds nothing. At or above the rank it takes one unit plus a possible bonus. `settleSkillUse` (`src/game/rules/skillGrowth.ts`) may add skill XP and writes character XP back to the value from before the call. Tabletop and pyoa return immediately. Zero skill XP covers a failed check, a grey task (`useXpFor`), a same-line repeat, and the character-level soft cap (`skillLevelCap`).

Character level and skill level are different bars. A character-level goal is not met by skill XP. A skill-level goal is not met by `payEncounterXp`.

## Current spend and save authorities

- Text: `useGame` calls `spendCapacity('text')` (`src/game/capacityLedger.ts`) once per send after free opening turns and authored PYOA books are excluded. Story-start remaining on the save is spent first. Otherwise the local ledger burns today's tier cap (`textTurnsPerDay`: free 12, mid 20, high 24, admin 24) plus `textAdBonusToday`, then `textPackBalance`. The ledger is `localStorage` key `synapticgm-capacity-ledger`. Its header says it is local until a server TurnLedger ships. `refundCapacity` is a second local write if the turn aborts. Test Lab `hasUnlimitedTextCapacity` does not burn the cap.
- Images: `openRouterService` spends `memorable` or `illustrated` on a different kind. A fast-forward index does not call that path.
- Local save: `saveGame` (`src/game/db.ts`) writes the current save to IndexedDB.
- Cloud save: `syncGameToCloud` (`src/game/cloudSync.ts`) upserts a characters row for the signed-in user and `saveId` after the local save. It can fail on its own. It is not a turn ledger and it does not reserve a balance.
- Nothing here holds one balance across two saves, a batch, and a normal turn at the same time.

## Current writer nesting, for one narrated action

This is the tree a fast-forward index uses when it asks for story. It adds no call beyond the tree.

- `callGmDurable` in `useGame` loops `attempt <= TURN_TRANSPORT_MAX_AUTO_RETRIES` (`src/game/errorRepairWarden.ts`, value 2) for timeout, network, empty, unknown, and rate limit.
- Each `callGm` goes through `invokeGmProxy` (`src/game/gmProxy.ts`). A failed fetch retries once. `withRetry` (`src/game/aiServiceShared.ts`) retries up to `MAX_RETRIES` (4) on 429 only, with the cited backoff.
- `gm-turn` (`supabase/functions/gm-turn/index.ts`) calls the same model once at `AI_MAX_OUTPUT_TOKENS` (4096). On an empty, reasoning-only, or cut-off reply it re-asks that same model once at `WRITER_REASK_MAX_TOKENS` (8192). It does not switch model.
- Worst case of completions that can reach the model: 3 transport attempts × 5 `withRetry` entries × 2 fetches × 2 edge completions. A fetch that throws before the edge is not a completion. The reserve covers the worst case and releases what the index did not use.
- Memorable and illustrated calls are not in this tree. Training rows are requested only for the autoplay or test-lab harness (`shouldRequestTrainLog`). This batch does not set that flag. The live writer id is the tier's OpenRouter id in `subscriptionTiers`. This spec does not call `writerGeminiId` and does not choose Fireworks.

Money and token price for that tree are **not measured**. No figure is stated. The calibration gate stays open until a later measured reading. The stop rule does not need that reading: the server will not start an index whose worst-case tree cannot be reserved.

## Approaches

1. **Proposed.** One index is one existing action (`goTo`, `stepAlong`, one hunt-and-settle, one gather, or one round). Charge it once when it commits. Preflight before the charge. Story for that index uses the tree above inside a reserved envelope. Receipt-only is optional on the request.

2. Call `travelOn` or treat one hunt line as a kill without `resolveEngineFight`. That hides legs inside one charge, or grants a kill the resolver did not return.

3. Invent a turns-per-day price or a pound price per leg. The road already has `steps` and `hoursPerLeg`. No measured money price exists here.

Approach 1 is the proposal.

## Player request

The fast-forward control is not the ordinary sentence. The sentence stays on the normal-turn policy below. If the batch cannot start, the sentence is restored the way an out-of-turns send restores the draft.

The request carries:

- One job: travel to a named place, hunt, gather, or train.
- A goal, in the player's words, stored without rewriting its meaning.
- A positive integer max. There is no stored default. No max, no start.
- Presentation: `story` or `receipts`. Omitted means `story`.

Goal meaning, stored on the job:

| Words | Stored meaning |
| --- | --- |
| A character level ("until level 4", "reach level 4") | `characterLevel`, target 4. Met when `character.level` is already at least 4 |
| A named skill level | `skillLevel`, skill id, target. Met when that skill's level is at least the target |
| "10 hides", "reach 10 hides", "until I have 10" | `total`, item or material id, target 10. Met when the current quantity is at least 10 |
| "10 more", "another 10", "gather 10", "collect 10" | `gain`, id, target 10, baseline = quantity at job start. Met when quantity minus baseline is at least 10 |
| "kill 3", "3 kills" | `kills`, target 3. Met when victory count on this job is at least 3 |

The baseline is part of the immutable job. Resume uses it. A total goal that is already true, or a gain target of 0, stops before any charge.

The max is the cap on underlying actions, not a second clock. Travel also quotes world hours. The effective cap is the smaller of the max and the number of actions whose envelopes the account can still reserve.

Opening incomplete: the hunt and gather resolvers already return without a fight. The batch does not start. PYOA mode: the batch does not start, under the disclosed scope choice.

## Travel quote and batch

The quote uses `mapGapBetween` and `hoursAtPace` from the current place to a place with `lastVisitedTurn` set. It states `steps`, terrain, pace, `hoursPerLeg`, allowance actions equal to `steps`, and world hours equal to `steps` times `hoursPerLeg`. It states whether a later leg would hit `dayIsSpent`, `areaTier >= 3`, or haunted ground. Meetings roll per watch, so the quote does not promise a quiet road. A missing visit turn, a road label, an unknown name, or `steps === 0` is rejected before any reserve.

**Proposed** index, after preflight:

1. Reserve the envelope.
2. Call `goTo` for the first action, or `stepAlong` for a later leg. Do not call `travelOn`.
3. Commit that result, including a death or an encounter `rollStretch` attached.
4. If the result is death, an open encounter, a lane block, a rare spawn, or a camp mini-boss, stop after that commit. The player's next sentence is a normal turn against that state. The spawn is not charged again.

Preflight, before the reserve: goal already met; max already used; envelope cannot be reserved; `playPhase` ended or dying; a push-on confirm or first-fight gate is open; `journey.encounter` is set and `roadMeetingOver` is false; the next leg would make `dayIsSpent` true; `areaTier >= 3`; haunted. Those stops charge nothing. The "fewer than two legs remain" clause of `canTravelOn` is not copied. The last legs still walk unless a stop above applies.

`stepAlong` today will still march a dangerous or haunted leg. The adapter pauses before calling it. That is the difference.

## Hunt, gather, kills, drops, and level

**Proposed.** Character-level training is a sequence of ordinary litrpg hunts, because that is the resolver that pays character XP. It does not run where `huntModeOk` is false. It does not add XP for a travel leg or a gather. Each index that is allowed to settle is one `startHuntFromInput` plus, only for an ordinary foe, one `resolveEngineFight` on the returned `fightInput`. One charge covers that pair, because the live turn already settles `simulateCombat` inside the attack action. A second charge is not taken for the rounds inside `simulateCombat`.

`openHunt` runs once inside the reserved index. `pickHuntTarget` is not called earlier as a free peek, because `ensureWilds` can write state. If that one pick is rare, elite, or above party level + 1, the commit is `activeEncounter` and the charge is one. `resolveEngineFight` is not called. The player fights that foe with normal turns. The same rule applies when gather's guard roll opens a fight: that spawn is the committed action, charged once, and the node is not gathered.

An ordinary settle counts as a kill only when `resolveEngineFight` returns victory. `payEncounterXp` may still pay 0. The level goal checks `character.level` after the commit. One apply raises at most one level on litrpg and rpg. The batch does not grant the missing XP to finish the level. If the next index cannot be reserved, it stops underfunded with the level short. Defeat sets the death cooldown and stops the batch on that committed state.

Drop and inventory goals read `materials` and inventory after `applyWildsKillExtras` or gather. A nothing-roll or a refused pouch still consumes the committed action. A refused pouch stops and hands play back. A kill goal counts victories, not spawns.

Skill-level training repeats a use that `settleSkillUse` already accepts for that skill, one action per index. It stops when the skill level is at least the target, at the max, or when the account cannot reserve the next index. A use that awards 0 skill XP does not by itself cancel a character-level job. On a skill-level job it counts as an action and the job continues until the level, the max, or the funds stop it. It does not invent skill XP. Character XP on that call stays at the pre-call value, as `settleSkillUse` already writes.

Tabletop round combat is not a hunt batch. A character-level request on dnd or pyoa does not start, because no hunt resolver pays that bar here. The request is refused before a charge, not simulated.

## Server ledger

**Proposed. Not implemented.** Local `spendCapacity` plus a later `saveGame` cannot be the authority.

Account spendable text is today's subscription cap, plus ad bonus, plus pack balance, minus every active hold on every save, every batch, and every normal turn. Story-start remaining is reserved on the save it belongs to, so two jobs cannot both take it. Test Lab does not skip the player max. Image kinds are not part of this balance.

One job record is immutable after the player confirms the quote: `jobId`, account id, `saveId`, save revision, quote, max, goal kind, target, baseline quantities, presentation, and the place or skill ids. A later edit is a new job.

Each index:

- Reserve one allowance action and, for `story`, the worst-case completion tree above. For `receipts`, reserve one allowance action and zero model calls.
- The hold stores an owner token and an expiry later than one index of the cited retry delays. Disconnect does not release it.
- Commit requires that token, an unexpired active hold, and a compare-and-swap on the save revision. The outcome record stores the engine receipts, victory or defeat, quantities, level, and the `hashUnit` or `turnRng` key the resolver used. A replay of that index returns the record and does not roll again.
- A cancelled or expired hold cannot commit. A late worker is rejected. The unused reserve returns to the account.
- Resume continues at the first index that has no outcome record.

**Proposed concurrency.** One live job per save. A second job on that save does not start. A job on another save may reserve only what the account has left after holds. A normal sentence preempts an index that has not committed: that hold is released, the sentence is reserved as a normal turn, and the text stays in the log. An index that has already committed stays committed. The sentence then runs at the next save revision. If the account cannot reserve the sentence, the draft is restored and the batch is unchanged. The sentence is not deleted.

Until this ledger exists, the feature stays unshipped. This document does not add the table or a price.

## Presentation

`story`, the default: each committed index may show one GM beat from the writer tree above. Retry attempts are not extra beats. After the last committed index, the log also shows the engine receipts already stored for those indexes. That closing list is not another model call.

`receipts`, optional on the request: no writer call. Each index shows its engine receipt (`Travel:`, `Fight:`, `Wilds:`, `Materials:`). The closing list is those receipts, aggregated in order, still one line of record per index. Allowance is still one action per index, because the action happened. This choice is not the approved telling unless the player selected it.

Either way the log does not grow by the hidden retries, and it does not replace a committed beat with a later summary.

## Shared allowance turn

1. Keep the player's sentence. A fast-forward control is not that sentence.
2. Preflight. Reserve, or restore the draft and stop.
3. Resolve one existing action.
4. On a normal turn, the writer tree may run inside the reserved envelope, and the mid-visit gate may accept one offer. On a `receipts` index, skip the writer and skip that gate. On a `story` index, the writer narrates the engine outcome and does not run the mid-visit gate.
5. Commit under the lease, or reject the late commit.
6. A pause ends the batch. The next sentence is a normal turn.

## Design acceptance tests

- A visited destination quotes `steps` allowance actions and `steps * hoursPerLeg` world hours for that terrain and pace. A street step and a mountain leg do not quote the same hours. Neither quote uses a turns-per-day constant. `travelOn` is not the implementation of that quote.
- A place with no `lastVisitedTurn`, a road label, and the current place do not start and do not reserve.
- Four quiet ordinary legs commit four actions, four clock advances, and four receipts. The leg that rolls an encounter commits once, then pauses. The next typed sentence is a normal turn. That encounter is not charged a second time. A tier-3 gap, haunted ground, an already-open meeting, and a spent road day pause before the call and charge nothing.
- Death on the road stops on the death state after that one commit.
- A litrpg hunt of an ordinary foe charges one action, calls `resolveEngineFight`, and counts a kill only on victory. A defeat counts no kill, pays no victory XP, and stops on the cooldown state. A rare, elite, or above-party foe commits the spawn, charges once, and does not auto-resolve.
- "Until I have 10 hides," with 10 already in the pack, stops before a charge. With 7 in the pack, the baseline is 7 and the job finishes at quantity 10, including hides already owned. "Gather 10 more" from 7 finishes at 17. Resume keeps the baseline. A nothing-roll charges and does not move the count. A full pouch commits the refusal and pauses.
- "Until level 4," with character level 2, continues only while hunts can be reserved. A gray victory that pays 0 does not bump the level and does not get replacement XP. When the next reserve would pass the account balance or the max, the batch stops below 4. Skill XP does not satisfy this goal. A skill-level request does not move character XP.
- Two batches and one normal sentence on the same account cannot reserve more than the spendable balance minus holds. The sentence preempts an uncommitted index and remains in the log. A second job on the same save does not start.
- A dropped connection before commit leaves the hold owned until expiry, then releases it, and no outcome exists. A late commit after cancel or expiry is rejected. A replay of a committed index returns the stored outcome and does not re-roll. Resume continues at the next index without an outcome.
- A `story` index that cannot reserve the worst-case writer tree does not start. A `receipts` index reserves no model call. No image call, training row, Gemini call, or Fireworks route is added.
- A normal turn's mid-visit accept still obeys the visit cap across a room change and a reload.

## Not in this proposal

No new combat math, no invented drop price, no measured money figure, no change to tier prices or keys, and no ship until this ledger is approved and built. Mid-visit code waits on its own spec. PYOA book files stay as they are.
