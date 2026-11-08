# Mid-visit quests

**Status: proposed.** Do not implement from this file until it is reviewed.

John approved the goal on 8 Nov 2026, and on the same day approved revising this draft: new quests may appear during a visit, and repeated or unsuitable quests stay rejected. The 27 Oct 2026 module in commit `12d13393` is the rule source. It says a live harvest of writer `<quest-add>` can come later. That hookup is still proposed here. It is not approval of every integration line below. Lines marked **proposed** are not how the code works today.

Out of scope: new people, hook records, traits, a new XP or gold formula, training, capture, writer routing, and deploy. Pull requests 1 and 2 stay separate.

## What already exists

Typed lines and buttons both become the player input of one turn. Live play runs `useGame.ts`. The harness runs `fateAutoplay.ts`. After the writer replies, both parse tags, run the warden, call `applyQuestAddProposals`, and later call `eventsToQuestUpdates` on whatever tags remain.

`applyQuestAddProposals` keeps a `<quest-add>` only when it matches a quest whose id starts with `gen-`, by id or by that quest's giver name. Otherwise it logs `unbound quest` and drops the tag. It does not create a quest.

`eventsToQuestUpdates` will insert a quest from a surviving `<quest-add>`, using the writer's id and an empty objective list. A new accept path must not leave the writer's tag in that list, or the turn would store a second, empty quest.

`evaluateMidVisitProposal` can create a quest and a `quest_reveal` ledger row. Nothing in either turn calls it. Its cap counts stored `mid-` quests, so one old row blocks a later visit. It can store a hook as quest type `main`. It does not place a target. It does not open a visit log. Its genre check runs only when the caller passes `genreTags`. The live tag has no genre field, so that check does not protect live play. This proposal does not pretend that it does.

The parser reads `<quest-add id name type description>`. A missing type is stored as `side` before the gate. That default does not skip the checks below.

Payment for an ordinary quest does not read `rewards.xp`. `sandboxXp.ts` pays when an objective flips to completed (`quest-tick:<quest id>:<objective id>`) and when status flips to completed (`quest-complete:<quest id>`). The amount is `milestoneXp` for `questStep` and `questComplete`, via `engineQuestLevel`. The writer number is ignored. The same quest id does not pay twice. The same giver and task use `questIdentity` and, outside dnd and pyoa, `repeatShare` for a later copy. Gold and item strings on `Quest.rewards` are not paid by that function. Settlement-card loot is a different path and is not reused here.

Completion of a placed target is `findQuestTargets`. The player must be on that room (`targetSpot`) and the action must match `actionMatchesObjective`. A find target is completed by naming it or by a find-class action. Talk does not complete a find. A step with no target cannot complete.

`validateQuestStepRoutes` demands three route families on a generated floor quest. Those routes are not what completes a find target. This proposal does not add three routes that all mean the same search.

`PlaceVisitLog` is opened by `ensurePlaceVisit`, which `timeline.ts` calls. The id is the place record whose name or alias equals `currentLocation`, or else a slug of that location string. A dungeon sets `currentLocation` to `dungeonHereLabel` (`Site — Room`). A room change is a new string, so the current function ends the log and starts another. The log is on `GameState`, so a save keeps it. `leavePlaceVisit` stores a summary on the place and clears the log.

## Approaches

1. **Recommended. Extend the existing gate.** Keep the `gen-` bind. When a tag does not bind, accept or reject one side quest in that same function, then remove the writer's tag so `eventsToQuestUpdates` cannot copy it. Both turn entry points keep the call they already make. No new model call.

2. **New generator.** Invent a quest on arrival with no writer tag. The player can receive a job the reply never offered.

3. **Mixed.** A hidden generator builds the quest and the writer only supplies a title. Two sources can disagree, and the accept rules are still required.

Approach 1 is the proposal.

## Proposed behavior

Handle a `<quest-add>` in this order.

1. If it matches a `gen-` quest by id, or by that quest's giver name, bind it as today. Do not create a `mid-` quest. Do not pay again. The existing `gen-` reward fields and the sandbox pay keys stay as they are.
2. Otherwise try one new side quest, then drop the writer tag either way.
3. On failure, log `unbound quest` as today and leave quests unchanged.

The engine writes the quest. The writer's id, status, completion, and any reward text are not copied.

**Giver.** Exactly one NPC already seated in the scene, whose full name or full alias appears as its own words in the tag name or description. A shorter word inside a longer word does not count. Seated means `presentNpcRecords` already lists them. If the text names nobody, reject. If it names someone who is not seated, reject. If it names two seated people, reject. Do not pick a nearby person to fill the gap. Do not create a memory or a companion.

**What the quest is.** Type `side` only. A missing type is already stored as `side` by the parser, and it still has to pass every check here. `main`, or any other type, does not become a side quest. If it did not bind to a `gen-` quest, reject it. The title is the tag name, trimmed, at most 80 characters. The summary is the tag description, trimmed, at most 240 characters. The id starts with `mid-`, then the place id, the turn, and a slug of the title.

**Place and target.** The place is the open dungeon card's site name, or the current place record's name when no card is open. One objective. Its target is one find in a real room of that place's card, placed by `placeQuestTarget`. The target name is the title, not a separate writer item. If `placeQuestTarget` does not return a `nodeId`, reject and do not keep the quest. The objective is complete only when `findQuestTargets` says so. No person route, place route, and study route are added, because those would not be three different completions.

**Suitability without a genre tag and without another model call.** Reject when:

- The giver check fails.
- The type is not the stored `side` value and the tag did not bind to a `gen-` quest.
- The title, compared after lowercasing and removing punctuation, matches a quest that is active, completed, or failed.
- The summary contains the name of a completed or failed quest.
- The title or summary contains a `sceneFacts.resolvedCrises` entry.
- This turn or this place visit already accepted that title.
- This place visit already has two accepts.
- The current place has no card room for `placeQuestTarget`.

Do not scan prose for a genre word list. The old `genreTags` helper stays unused on this path, because live tags do not carry those tags. A proposal that fails the list above is the unsuitable offer.

**Rewards.** Do not write `rewards.xp`, gold, or items from the tag. Do not invent an amount. When the objective later flips to completed, and when the quest status flips to completed, `sandboxXp` pays through the keys and the `milestoneXp` amounts it already uses for any other quest. The same quest id pays once. A later quest with the same `questIdentity` (giver plus task) uses the existing repeat share outside dnd and pyoa. That is the ordinary pay path. It is not a new unpaid quest class, and it is not a new formula.

**Ledger.** On accept, append the quest with `status: 'active'` and `revealed: true`, and append one `stateTxLog` row, `kind: 'quest_reveal'`, summary `Mid-visit proposal: <title>`.

**Visit cap. Proposed, because today's log splits on the room label.** A visit is one stay at one place. The place id is the dungeon site's place id while a card is open, and otherwise the place record matched by `placeOf` (name or alias). While that place id is unchanged, room-to-room labels do not end the visit and do not reset the count. `ensurePlaceVisit` is given that place id, not the `Site — Room` string, for as long as the card or the place record stays the same. Leaving that place still runs `leavePlaceVisit`, which clears the log. Coming back starts a new log, `sinceTurn` is the entry turn, and the cap is two again. The log remains on the save, so a reload keeps the same count. Stored `mid-` quests from an older visit do not count. This is not two quests for the whole world, not two people, and not a lifetime cap. An active duplicate title is still rejected on the new visit. A finished quest is still rejected.

The dungeon auto-close hold in pull request 2 is unchanged.

## Tests to write when implementation is allowed

- A tag that names a `gen-` giver still binds, adds no `mid-` quest, and does not pay a second time.
- A tag that names exactly one seated person, at a place whose card can take a target, adds one side quest, one placed `nodeId`, one `quest_reveal` row, and one visit accept.
- The quest has one objective and no route list. `rewards.xp` is absent. Completing the objective pays through the existing `quest-tick` and `quest-complete` keys once.
- The same tag twice in one turn adds one quest.
- No named giver, a named person who is not seated, and two named seated people are rejected. No memory is created.
- A completed or failed title, a resolved crisis, and an active duplicate are rejected.
- `type="main"` that does not bind is rejected. A missing type still faces the giver, place, and cap checks.
- The third accept in the same place stay is rejected. Moving from one room to another in that site does not raise the cap. After `leavePlaceVisit`, a new stay can accept again. A reload keeps the count.
- No `nodeId` rejects and leaves no quest.
- `eventsToQuestUpdates` does not also insert the writer's id.
- `useGame` and `fateAutoplay` both use this gate. No model call is added.

## Not in this proposal

No new person, hook, trait, XP table, training flag, or writer route. No change to pull request 1 or pull request 2. No production deploy.
