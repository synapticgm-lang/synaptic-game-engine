# Mid-visit quests

**Status: revised proposal.** This file supersedes the find-only draft on pull request 3 (head `c58f7e39`). Do not implement from this file until it is reviewed. It authorises no gameplay change, no merge, and no deploy.

John approved the goal on 8 Nov 2026: a visit may gain a new quest, and a repeated or unsuitable offer stays rejected. The same day he approved revising that draft. This revision is that approval applied to the code that actually completes a quest. Lines marked **proposed** are not how the code works today.

Out of scope: new people, hook records, traits, a new XP or gold formula, training capture, writer routing, provider or billing changes, friendly-NPC and rescue work, fast-forward implementation, and pull requests 1 and 2. PYOA book files stay untouched.

## What this revision changes

The draft stored every unbound offer as a side quest whose single target was the title, placed as a find. A step with no placed target cannot complete, and talk does not complete a find, so that conversion both misstates the offer and is the only completion the draft allowed. Live `<quest-add>` tags have no genre field. `genreOk` returns success when `genreTags` is empty, and no turn calls `evaluateMidVisitProposal`, so that helper does not protect live play.

This revision accepts a new quest only when the offer classifies to one approved non-combat family, the campaign mode allows that family, and an existing engine ticker can finish the task the words actually name. The title stays the journal name. It is never the thing to find.

## Preserved rules

These stay as already specified:

- A `<quest-add>` that matches a `gen-` quest by id, or by that quest's giver name, binds as `applyQuestAddProposals` does today. No `mid-` quest. No second payment.
- The engine writes any new quest. The writer's id, status, completion, and reward text are not copied. The writer tag is removed either way, so `eventsToQuestUpdates` cannot insert a second quest with an empty objective list.
- Payment is the existing `sandboxXp` path: `quest-tick:<quest id>:<objective id>` when an objective flips to completed, and `quest-complete:<quest id>` when status flips to completed, using `milestoneXp` for `questStep` and `questComplete` via `engineQuestLevel`. The writer number on `rewards.xp` is ignored. The same quest id pays once. The same giver and task use `questIdentity`. Outside dnd and pyoa, a later copy uses `repeatShare`. Gold and item strings on `Quest.rewards` are not paid by that function. Settlement-card loot is a different path and is not reused.
- The giver is exactly one NPC already seated in the scene (`presentNpcRecords`), whose full name or full alias appears as its own words in the tag name or description. A shorter token inside a longer word does not count. `isGiverName` also treats either string as containing the other; this accept rule does not. Nobody named, a named person who is not seated, or two seated names: reject. No nearby substitute. No new memory or companion.
- Reject a title that, after lowercasing and removing punctuation, matches a quest that is active, completed, or failed. Reject a summary that contains the name of a completed or failed quest. Reject a title or summary that contains a `sceneFacts.resolvedCrises` entry. Reject a second accept of that title on this turn or this place visit.
- Cap two accepts for one stay at one place. The count is stored on the place visit log on `GameState`, so a reload keeps it. Room-to-room labels inside that place do not reset it. `leavePlaceVisit` clears the log. Coming back starts a new log and the cap is two again. An active duplicate title is still rejected on the new visit. A finished quest is still rejected. Stored `mid-` rows from an older visit do not count. `midVisitAcceptedCount` counts `mid-` rows for the life of the save when any exist, so it is not the cap this revision uses.
- Type `side` only for a new quest. The parser's `<quest-add>` pattern requires a `type` attribute. An empty value is stored as `side` (`questType: (m[3] as QuestType) || 'side'`). An empty type still faces every check here. A tag that omits `type` does not parse and never reaches this gate. `main`, or any other type, that did not bind to a `gen-` quest is rejected.
- The dungeon auto-close hold in pull request 2 is unchanged.

## What can complete a quest today

`QuestTarget.kind` is `item` or `person` only.

`findQuestTargets` ticks an open objective on any active quest when `targetSpot` is exactly here and `actionMatchesObjective` matches:

- An item ticks on a `search` or `observe` intent, or when the action names that object. A talk intent does not tick an item. Naming the quest title does not name the object unless the object text is that title, which this revision refuses to store.
- A person ticks on a `talk` intent that names them. They must be at the spot.
- A step with no target does not tick. Arrival alone does not tick.

`placeQuestTarget` writes a `nodeId` only when the step has `room` and the target has `place`, and a reachable room of that card is neither the entry, the current node, nor a stair. A room word that matches nothing falls through to any such room (`named.length ? named : rooms`). Otherwise the target comes back without a `nodeId`. A missing `nodeId` means the quest is not stored. Explore therefore checks the room name before placement, so a miss is a reject rather than a random room.

`applyQuestRouteOutcome` ticks the open step of `mainSpineQuest` only. That function prefers a spine id, then a known starter id, then `type === 'main'`, then the first visible active quest. A success on any one route completes that step. A failure marks that route and leaves the others.

`validateQuestStepRoutes` requires three routes and three families (person or contact or standing; place or object; and the mode third: study or check, skill or system, contact or standing) for dnd, litrpg, and rpg. PYOA returns no errors. `questGenerator` calls it before keeping a `gen-` floor quest. Those routes are how a generated floor quest offers redundant ways to reveal one lead. They are not three different jobs.

`tabletopStepKind` classifies main-spine wording as talk, look, or move, and `stepTarget` still stores an item or a person. It is not a separate investigation engine.

`QuestStrategyId` (`deliver`, `defeat`, `recover`, `investigate`, `protect`) labels OPT-2 floor templates chosen from a patron's `DoranMotivation`. It does not parse a writer tag.

`resolveParleyAttempt` and road-meeting parley settle a fight or a passage. They do not flip a quest objective. `advanceNpcTopicExhaustion` can flip a main objective that has no target after three topics with that giver. It is not a side-quest completer. `settingGenreTokens` derives tokens from `campaignBibleId` and `engineMode` (`fantasy`, `litrpg`, `medieval`, `tabletop`, `story`, `pyoa`, `modern`, `scifi`, plus the mode id). Nothing in the live tag gate reads them.

Task checks exist on the DC ladder (`TaskKind` includes `lock`, `athletics`, `search`, `social-minor`, `social-risky`). A passed check does not flip a quest objective.

## Three route families

The three families are required when the floor generator builds a `gen-` quest in dnd, litrpg, or rpg, because that quest is a lead with redundant discovery routes. They are not applicable on this accept path. A mid-visit quest is one offered task with one live ticker. Copying person, place, and study routes onto that task would add three labels for a completion those labels do not perform. If the new side quest were the only visible active quest, `mainSpineQuest` would fall through to it, and one route success would complete the step. This revision stores no `routes` array.

PYOA validation already skips the three-family rule. This revision does not add routes there either.

## Approaches

1. **Recommended. Classify inside the existing gate, and fail closed.** Keep the `gen-` bind. Otherwise accept one side quest only with a live binding below, then drop the writer tag. No new model call. No writer genre attribute.

2. **Keep the title-as-find draft.** Every unbound title becomes a hidden item. The journal then names a search the offer may not have made, and negotiation, exploration, and obstacle offers still have no matching completion.

3. **Ask another model which family fits.** That spends a call the turn does not spend today, and the engine would still need the same binding or the quest could not be finished.

Approach 1 is the proposal.

## Mode check

This is the genre check. It uses `settingGenreTokens` and `engineMode`. It does not scan the prose for setting words, and it does not read a genre attribute the tag does not have.

- `engineMode === 'pyoa'`, or a token set whose mode token is `pyoa`: reject `genre`. No new mid-visit quest is added on a PYOA save. Book files are unchanged.
- `dnd`, `litrpg`, and `rpg`: the four families below are in mode. A task that classifies to none of them is `unsupported-task`, which is the unfit offer.
- `modern` or `scifi` added beside `litrpg` (system-integration and similar bibles) does not by itself reject a family the mode allows.

## Task family

After the `gen-` bind fails, classify the description with a closed verb table. The title is not classified.

| Family | Closed verbs | Live binding |
| --- | --- | --- |
| investigate | investigate, study, examine, inspect, identify, uncover, learn, search for, look for | One object phrase in the description, different from the normalised title. Placed with `placeQuestTarget` (`room` `inside`, or a card room whose name contains a room word from the description). Target kind `item`. Completes only under the item rules of `findQuestTargets`. |
| explore | explore, scout, survey, map, or search when a reachable room name is in the description | The same item ticker, and the room word must match a reachable non-entry room. No match: reject `no-completion`. The object phrase must still differ from the title. |
| negotiate | negotiate, bargain, persuade, convince, ask, speak with, talk to, parley | Live only for a speak-with-giver task: target kind `person`, name the seated giver, completes under the person rules of `findQuestTargets`. |
| obstacle | unblock, force, pick, climb, clear, get past, when the object is a barrier, lock, rubble, or blocked way | No live binding. |

A description that matches none of these verbs is `unsupported-task`. Defeat, deliver, recover, protect, escort, and kill stay in that reject. They are floor-template strategies or combat, and this path has no ticker that finishes them.

Assign one family. Search or examine with a reachable room name, and an object phrase that is not the title, is explore only. Search or examine with an object and no room name is investigate only. A description that still matches two families after that assignment, such as a concession verb together with a clue object, is `unsupported-task`. The player is not given a guess.

## Accept

Handle `<quest-add>` in this order.

1. Bind a `gen-` match as today. Stop.
2. Drop the writer tag from the list `eventsToQuestUpdates` will see.
3. Reject unless the mode check and the family table both pass, the giver rule passes, the type is the stored `side` value, the duplicate and resolved-crisis guards pass, and this place visit has fewer than two accepts.
4. Build one objective for the live binding. Investigate and explore store the object phrase as `QuestTarget.name`, never the title. Negotiate stores the giver. Require a `nodeId` for an item. A person target has no `nodeId`; the giver must already be seated, which is the spot. Reject `no-completion` when the binding cannot be built, and leave quests unchanged. Log `unbound quest` as today.
5. On accept, append the quest with `status: 'active'`, `type: 'side'`, `revealed: true`, one objective, no `routes`, no `rewards` copied from the tag. Append one visit-log event on that place id; the cap counts those events on the open log. Append one `stateTxLog` row, `kind: 'quest_reveal'`, summary `Mid-visit proposal: <title>`. The id starts with `mid-`, then the place id, the turn, and a slug of the title. The title is the tag name, trimmed, at most 80 characters. The summary is the tag description, trimmed, at most 240 characters.

The place is the open dungeon card's site name, or the current place record's name when no card is open. The visit id for the cap is that site's place id while a card is open, and otherwise the place record `placeOf` matches by name or alias. **Proposed, because `ensurePlaceVisit` currently keys off `currentLocation`.** A dungeon sets that string through `dungeonHereLabel` (`Site — Room`), so a room change ends the log today. While the place id is unchanged, room labels do not end the visit. Leaving still runs `leavePlaceVisit`.

## Fail closed

| Offer | Result |
| --- | --- |
| Title used as the only noun | `no-completion`. The quest is not stored. |
| Investigate or explore with no card room that can take the object | `no-completion`. |
| Negotiate that demands a concession, a price, an agreement, or a fact change | Family `negotiate`, result `no-completion`. Speaking with the giver is the only live negotiate binding. |
| Obstacle | Family `obstacle`, result `no-completion`. |
| Combat, delivery, recovery, escort, or any other job | `unsupported-task`. |
| PYOA mode | `genre`. |
| Giver, type, duplicate, crisis, or cap failure | Reject, quests unchanged. |

A rejection logs `unbound quest` and does not create a memory, a target, or a quest.

## Proposed schemas

These wires do not exist. They are excluded from the accept set until a later written approval. This revision does not ask for that approval by implementing them.

**Concession.** `objective.completion = { kind: 'speak-success', person }` where `person` is the one seated giver. Completes when the existing parley or social-check resolver reports success against that person. Success writes the objective complete. It does not move gold or mint an item. `socialCheckSucceeded` can already pay `significantPerson` through a different `sandboxXp` key; that pay stays on its own key and is not this quest's reward.

**Obstacle.** `objective.completion = { kind: 'check', task: 'lock' | 'athletics', nodeId }`. Completes when the player is on that room and the existing DC ladder (`taskRung` and `ladderDc` for that `TaskKind`) records a success. A failure leaves the objective open. No gold and no item are created.

Until those approvals, the matching offers stay rejected under Fail closed.

## Shared allowance turn

A normal turn keeps the player's sentence, charges one allowance turn under the rules in the fast-forward spec, resolves the engine once (including `findQuestTargets`), then runs this gate on the writer tag. A fast-forward batch does not call the writer and does not run this gate. When a batch pauses, the next player sentence is a normal turn and can accept one offer under this spec.

## Design acceptance tests

- A tag that names a `gen-` giver still binds, adds no `mid-` quest, and does not pay a second time.
- "Examine the cellar mark" from exactly one seated giver, at a place whose card can take a target, adds one side quest. The target name is the mark, the title is unchanged, `nodeId` is set, `routes` is absent, `rewards.xp` is absent, and one `quest_reveal` row and one visit accept are stored. Searching or naming the mark on that room completes it. Talk does not. `sandboxXp` pays the existing tick and complete keys once.
- "Explore the cellar" with a distinct object and a reachable room whose name contains that room word uses the same item ticker on that room.
- "Speak with <giver>" completes when the player talks to that seated giver, and does not complete on a search.
- "Persuade <giver> to cut the toll", "clear the rubble", "kill the wolf", and a title that is the only noun are rejected. No quest remains.
- A PYOA save rejects the tag with `genre`.
- No named giver, a person who is not seated, and two seated names are rejected. No memory is created.
- A completed or failed title, a resolved crisis, and an active duplicate are rejected.
- The same tag twice in one turn adds one quest.
- `type="main"` that does not bind is rejected. An empty type still faces the giver, place, and cap checks. A tag the parser does not match adds nothing.
- The third accept in the same place stay is rejected. Moving from one room to another in that site does not raise the cap. After `leavePlaceVisit`, a new stay can accept again. A reload keeps the count. An older `mid-` row does not consume the new stay.
- No `nodeId` on an item binding rejects and leaves no quest.
- `eventsToQuestUpdates` does not insert the writer's id.
- The live turn and the harness turn both use this gate. No model call is added.

## Not in this proposal

No new person, hook, trait, XP table, training flag, or writer route. No change to pull request 1 or pull request 2. No production deploy. No edit to PYOA books. The concession and obstacle schemas wait for their own written yes.
