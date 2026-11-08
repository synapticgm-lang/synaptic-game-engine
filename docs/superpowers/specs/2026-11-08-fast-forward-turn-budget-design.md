# Fast-forward turn budget

**Status: proposal.** Do not implement from this file until it is reviewed. It authorises no gameplay change, no merge, no deploy, and no provider, environment, secret, or billing change. Gemini gameplay stays off. Fireworks stays stopped. Training capture stays off. This spec adds no image generation and no extra model call.

John asked for fast-forward and auto-travel on 8 Nov 2026. No spec was approved, and the feature is not implemented. The behaviour below is **proposed** except where a section says the engine already does it.

Out of scope: mid-visit implementation, friendly NPCs, PYOA book files, pull requests 1 and 2, and any change to prices or keys. A shared allowance-turn sequence may be named here. The files that run a turn stay as they are until a later approved build.

## What the engine already does

**Visited places.** A place record may carry `lastVisitedTurn`. Travel already treats a non-road place with that field set as visited (`travelJourney` filters `places` on `typeof lastVisitedTurn === 'number'` and `isRoadLabel`). `worldMapLayout` also treats `arcStatus` `visited` or `cleared` as seen. This spec's destination rule uses `lastVisitedTurn` only, so a status flag without a visit turn cannot be fast-forwarded to.

**One player action, one leg.** `mapGapBetween(state, from, to)` returns `steps`, `terrain`, and `hoursPerLeg`. `steps === 0` is the same place. `steps === 1` arrives on this action (`goTo`). `steps >= 2` is capped at `MAX_LEGS` (4): the first action calls `startJourney` with `legsDone: 1` and `legsTotal: steps`, and each later onward action calls `stepAlong` until `legsDone >= legsTotal`. So the ordinary travel cost in player actions is `steps`, one action per leg.

**World clock is not the allowance.** Hours per leg at Normal pace are `STEP_HOURS` (0.25) when `steps <= 1`, otherwise `LEG_HOURS`: streets 0.5, road 2, coast 2, forest 3, marsh 3, mountain 4. `hoursAtPace` rescales those hours on a tabletop save from the SRD pace (fast 4 mph, normal 3, slow 2), and never faster than `paceOnGround` allows. Other modes stay Normal. `advanceClock` moves `worldHour` and `worldDay`. `TRAVEL_DAY_HOURS` is 8: `dayIsSpent` is true when the terrain is not streets and today's `roadHoursToday` plus `hoursPerLeg` would pass 8. That is the SRD extended-travel day. It is not a conversion of days into allowance turns. There is no 2-turns-per-day rate in this path.

**Danger stops the march.** `DANGEROUS_TIER` is 3. `canTravelOn` is false when the day is spent, `areaTier >= 3`, the gap is haunted, a road encounter is still open, or fewer than two legs remain. The batch below uses the danger and encounter stops. It still walks the last legs; it does not copy the "two legs remain" stop. `encounterPool` adds undead on haunted ground and monster or villain at tier 3+. `laneBlocked` is true for an open thugs, undead, monster, or villain meeting. `roadEncounterLevel` uses the area level at tier 3+, and otherwise caps at party level + 1. Rare road spawns use `RARE_SPAWN_CHANCE` (0.12). Camp mini-boss chance is `CAMP_MINI_BOSS_CHANCE` (0.5). A meeting check is a d6 per `WATCH_HOURS` (4).

**Hunt, gather, skill.** `huntModeOk` is litrpg only. `gatherModeOk` is `modeUsesEquipLevel`: litrpg and rpg. Tabletop and PYOA do not hunt or gather. A hunt opens an `ActiveEncounter` from the creature's own level; rare and elite scale that encounter. A gather on unsafe ground can open a guard fight (`guardAmbushChance`). Below the node's unlock rank, a gather finds nothing when the roll is at or above `GATHER_BELOW_UNLOCK_CHANCE` (0.5). At or above the rank it takes one unit, plus a bonus unit on a separate roll up to 0.5. A full pouch refuses the take. `settleSkillUse` adds skill XP on a successful litrpg or rpg use and does not keep a character-XP change from that call. Tabletop skill ranks are unchanged by that function. Grey tasks award 0 skill XP (`useXpFor`). Nothing in these resolvers sells a drop for a fixed price.

**Allowance today.** `capacityLedger` is `localStorage` under `synapticgm-capacity-ledger`. Its header says the ledger is local until a server TurnLedger ships. No server text-turn debit exists. `useGame` spends one text turn after a free opening turn and an authored PYOA book are excluded: story-start remaining first (`storyStartTextTurnsRemaining`), otherwise `spendCapacity('text')` against today's tier cap (`textTurnsPerDay`: free 12, mid 20, high 24, admin 24) plus `textAdBonusToday`, then `textPackBalance`. Test Lab `hasUnlimitedTextCapacity` does not burn the cap. `refundCapacity` runs if that turn aborts before commit. Spend and refund are separate local writes. They are not one transaction with the save. A 429 may retry inside `withRetry` up to `MAX_RETRIES` (4) with multi-second backoff. A network failure retries once inside `invokeGmProxy`. The edge re-asks the same model once. Those calls belong to one normal turn.

**Prose the travel engine already stores.** Each leg returns a `Travel:` receipt and clock note. Hunt and gather return `Wilds:` and `Materials:` receipts plus one fact. No fast-forward narrator exists. On a normal writer turn, `gm-turn` re-asks the same model once after an empty or cut-off reply. That re-ask is not used here.

## Approaches

1. **Recommended. Engine legs and receipts, charged one allowance turn each, paused for danger.** Quote `mapGapBetween` before the batch. Move only to a place with `lastVisitedTurn` set. Spend one allowance turn per leg or activity resolution. Narrate with the receipt that resolver already returns. Stop on the conditions below. Do not call the writer, and do not ship the batch on the local ledger.

2. **Flat rate, such as two turns per day.** The road already prices a leg in `steps` and terrain hours. A flat rate would under-charge a mountain gap and over-charge a street step.

3. **One short model sentence per skipped leg.** A normal turn can already hide an edge re-ask, a network retry, and up to four 429 retries. Multiplying that by `steps` is unbounded hidden work, and no measured token or money cost for that sentence is in the repo. Paid model use needs its own approval. It is not part of this proposal.

Approach 1 is the proposal.

## Player request

A fast-forward request is a separate control from the ordinary sentence. The sentence in the action box stays on the normal turn: one action, one resolution, the existing gates. The control never deletes, rewrites, or drops that sentence. If the batch cannot start, the sentence is put back the way an out-of-turns send already restores the draft.

The control carries one of these jobs, plus a player max:

- Travel to a named destination.
- Hunt, gather, or repeat a skill-bearing use, with a stop goal.

The max is a positive integer the player sets on that request. There is no stored default. A request without a max does not start. That max is the time bound, in allowance turns. Travel also quotes world hours from the legs; it does not add a second hidden clock. The batch stops before the next resolution would pass the allowance remaining. The effective cap is the smaller of the player max and the turns still spendable (story-start remaining, then daily text, then pack). Test Lab still stops at the player max.

Opening covers are not finished: the batch does not start. An authored PYOA book does not spend text turns today; the batch does not start there, so those books cannot become an uncharged loop. Book files are unchanged.

The player confirms the quote, then the batch starts. Cancelling confirm leaves the save and the allowance where they were.

## Travel quote

The quote is computed with the existing functions. It states:

- Destination place id and name, and that `lastVisitedTurn` is set.
- `steps`, terrain, pace, and `hoursPerLeg` after `hoursAtPace`.
- Allowance turns equal to `steps` (one per leg), and world hours equal to `steps` times that `hoursPerLeg`.
- Whether a leg would hit `dayIsSpent`, `areaTier >= 3`, or `haunted` before arrival. Meetings roll per watch, so the quote does not promise a quiet road.

A destination with no `lastVisitedTurn`, a road label, an unknown name, or `steps === 0` is rejected before any charge. The quote does not convert hours into days, and it does not state a turns-per-day price.

## Travel batch

Each leg is one proposed allowance turn:

1. If the next leg would pass the effective cap, stop. The turns already committed stay committed.
2. If `dayIsSpent` would be true, or `areaTier >= 3`, or the gap is haunted, stop before that leg and hand play back. The player uses a normal turn to camp, rest, or face the ground.
3. Resolve that one leg with the existing `goTo` or `stepAlong` rules, including march checks.
4. If the result is death, an open road encounter, a lane block, a rare spawn, or a camp mini-boss, stop and leave that state for a normal turn. The batch does not fight, flee, parley, or pay passage.
5. Append that leg's existing `Travel:` receipt as the beat. No writer call, no image call, no support retry beyond what that single engine resolution already performs, which for this path is none.
6. Commit that turn under the server contract below, then continue.

World time moves only by the hours that leg already adds. The allowance moves by one.

## Hunt, gather, and training

These run at the current place. They do not open a journey. Each resolution is one allowance turn and uses the existing resolver. The receipt is the resolver's receipt. Character level is not sold as a number of fights.

| Job | Who | Stop |
| --- | --- | --- |
| Hunt | litrpg, outdoors, opening complete, no live encounter | After N engine kills the player named, or when a named drop's quantity has increased by Y, or at the effective cap. Pause before resolving a rare, elite, or guard ambush, and when the creature's level is above party level + 1. An empty hunt ("nothing to hunt") stops. |
| Gather | litrpg or rpg, same outdoor gates | When the named material's quantity has increased by Y, or at the effective cap. A nothing-found roll still spends the turn. A full pouch, empty node, or guard fight stops and hands play back. |
| Training | litrpg or rpg named skill, through `settleSkillUse` on a use that already grants that skill | When that skill's level reaches X, or at the effective cap. If the use awards 0 skill XP, stop on that turn and say the use is not raising the skill. Zero covers a failed check, a grey task (`useXpFor`), a same-line repeat, and the character-level soft cap (`skillLevelCap`). `settleSkillUse` writes character XP back to the value from before the call. |

Tabletop and PYOA reject hunt, gather, and this training job. A route's ordinary meetings are not a kill quota. "Route kills" means the hunt job's kill count, at the place the player already stands, not combat auto-resolved along the road.

No job promises a drop, a hide, a gold amount, or a fights-per-level price. Quantity Y is checked on the materials or inventory after the resolver returns. If the resolver did not add the named thing, the turn still counts and the goal is still unmet.

Hunt and gather do not add `LEG_HOURS`. This spec does not invent hours for them. Their quote is allowance turns up to the effective cap, plus the goal.

## Server budget

**Proposed. Not implemented.** The local ledger cannot be the authority for a batch: a crash after `spendCapacity` and before the save can drop a turn or charge it twice on retry, and `refundCapacity` is a second local write.

The later build needs a server turn ledger with no new price and no new secret:

- One batch id. Idempotency key `saveId:batchId:index`.
- Before each index, reserve one turn if story-start, then daily text, then pack, can spare it. Otherwise stop.
- Commit writes the saved game and the charge in one transaction. A replay of the same key returns that save and does not charge again.
- A disconnect after reserve and before commit releases the reserve. A disconnect after commit keeps the charge and the save. Resume continues at the next index.
- The client shows the same remaining turns the server reports. Test Lab's unlimited flag does not skip the player max.

Until that ledger is approved and built, this feature stays unshipped. This document does not add the table.

Money and token cost per fast-forward turn are unknown. The repo records allowance counts and model ids. It does not record a measured cost for a skipped leg. This proposal adds no model call, so it adds no new token spend. A later request for narrated prose would need its own measured budget and a separate yes.

## Shared allowance turn

The same sequence covers a normal turn and one fast-forward index:

1. Keep the player's sentence. A fast-forward control is not that sentence.
2. Charge one allowance turn only when the resolution commits, under the server key above. Today's local spend-then-refund remains the behaviour of a normal turn until that ledger exists.
3. Resolve the engine once.
4. On a normal turn, the writer may run inside the existing retry ceiling, and the mid-visit gate may accept one offer. On a fast-forward index, skip the writer and skip that gate.
5. A pause ends the batch. The next sentence is step 1 of a normal turn.

## Design acceptance tests

- A destination with `lastVisitedTurn` set quotes `steps` allowance turns and `steps * hoursPerLeg` world hours for that terrain and pace. A street step and a mountain leg do not quote the same hours. Neither quote uses a turns-per-day constant.
- A place with no `lastVisitedTurn`, a road label, and the current place (`steps === 0`) do not start and do not charge.
- A four-leg road commits four allowance turns if nothing interrupts, each with its `Travel:` receipt, and the world clock advances by four times that leg's hours.
- The leg that would pass eight road hours, a tier-3 gap, haunted ground, or an open meeting stops the batch first. The player's next typed sentence resolves as a normal turn against that state.
- Death on the road stops the batch on the death state.
- Hunt on litrpg pauses on rare, elite, and above party+1, and stops at N kills, at quantity Y, or at the max, whichever comes first. A gather nothing-roll spends one turn and does not increment Y. Tabletop and PYOA reject the job.
- Training stops when the named skill reaches X, at the max, or on the first use that awards 0 skill XP. Character XP from that skill call stays unchanged.
- Two deliveries of the same `saveId:batchId:index` leave one charge and one save. A dropped connection before commit leaves no charge. A dropped connection after commit resumes at the next index without charging the committed index again.
- The batch stops when the next index would exceed story-start, then the daily cap and pack. It does not start a turn it cannot pay.
- An ordinary typed sentence during a pause is still in the log as the player's action. A refused batch restores the draft.
- No writer call, image call, training row, or provider setting changes.

## Not in this proposal

No model narration, no new combat AI, no invented drop price, no change to tier prices or keys, and no implementation until this file and the server-ledger gate are approved. Mid-visit code waits on its own spec.
