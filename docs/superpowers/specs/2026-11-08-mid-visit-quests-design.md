# Mid-visit quests

**Status: revised proposal.** Supersedes the find-only draft and the ticker-renaming revision on this branch. Do not implement until this file is reviewed again. It authorises no gameplay change, no merge, and no deploy.

John approved the goal: during a visit the game may accept a new quest, including investigation, negotiation, exploration, and obstacle work when that work fits the world, and it may still accept a genuine find or meeting. A repeated or unsuitable offer stays rejected. This file is the completion contract for that goal. It is not a first slice that renames those jobs as "search the title" or "talk to the giver."

Lines marked **current** describe the code today. Lines marked **proposed** are the adapter this spec asks a later build to add. Proposed facts are not on the save today.

Out of scope: friendly-NPC and rescue work, fast-forward implementation, training capture, provider or billing changes, and pull requests 1 and 2. PYOA book files stay untouched. Refusing new mid-visit quests when `engineMode === 'pyoa'` is a **proposed scope choice**, disclosed here. It is not evidence that every PYOA feature was approved for exclusion. A later spec can host these contracts on a PYOA save without editing book files first.

## Preserved guards

These stay:

- **Current.** `applyQuestAddProposals` (`src/game/questGenerator.ts`) keeps a `<quest-add>` when its id equals a `gen-` quest id, or when that quest's giver name appears in the id, name, and description blob. The kept tag is rewritten onto that id and **left in the event list**, which is how the current path consumes a bind. This revision does that first and does not also create a `mid-` quest or pay again.
- **Proposed.** Any other result removes the writer tag before `eventsToQuestUpdates` (`src/game/parser.ts`). That function inserts a quest with an empty objective list when a `<quest-add>` with an id and name is still in the list. Removing the tag is what prevents the empty duplicate. A reject stores no quest.
- **Current.** `sandboxXp` (`src/game/sandboxXp.ts`) pays `quest-tick:<quest id>:<objective id>` when an objective flips to completed, and `quest-complete:<quest id>` when status flips to completed, through `milestoneXp` for `questStep` and `questComplete` and `engineQuestLevel`. It ignores `rewards.xp`. The same quest id pays once. `questIdentity` is giver plus task. Outside dnd and pyoa a later copy uses `repeatShare`. Gold and item strings on `Quest.rewards` are not paid there. Settlement-card loot is a different path and is not reused. A social success can separately pay `significantPerson` when `socialCheckSucceeded` is true. That key stays its own pay. The quest tick fires once when the objective flips, and the two keys are not a second copy of each other.
- The giver is exactly one NPC already in `presentNpcRecords` (`src/game/npcRecords.ts`), whose full name or full alias stands as its own words in the tag name or description. A shorter token inside a longer word does not count. **Current** `isGiverName` also matches when either string contains the other as whole words. This accept rule does not. Nobody named, a person who is not seated, or two seated names: reject. No substitute, no new memory, no new companion.
- Reject a normalised title that matches an active, completed, or failed quest. Reject a summary that contains a completed or failed quest's name. Reject a title or summary that contains a `sceneFacts.resolvedCrises` entry. Reject a second accept of the same title on this turn or this place visit.
- Cap two accepts for one stay at one place. The count is one visit-log event per accept on the open log. The log lives on `GameState`, so a reload keeps it. **Current** `ensurePlaceVisit` (`src/game/sceneBlock.ts`) keys off `currentLocation`. A dungeon sets that through `dungeonHereLabel` (`src/game/mapEngine.ts`) as `Site — Room`, so a room change ends the log today. **Proposed:** while a card is open the visit id is the site's place id; otherwise it is the place `placeOf` matches by name or alias. Room labels do not end that visit. `leavePlaceVisit` still clears the log. A return starts a new log and the cap is two again. An older `mid-` row does not consume the new stay. **Current** `midVisitAcceptedCount` counts `mid-` rows for the life of the save when any exist, so the cap does not call it.
- A new quest is type `side`. **Current** the parser requires a `type` attribute; an empty value is stored as `side`. An empty type still faces every check. A tag that omits `type` does not parse. `main`, or any other type, that did not bind to a `gen-` quest is rejected.
- The title may equal the bound object's name. A journal titled after the clue is still accepted when the outcome proof below holds. String equality is not itself the proof, and it is not itself a reject.
- The dungeon auto-close hold in pull request 2 is unchanged.
- No `routes` array is stored. See the route section.

## What the engine can prove today

**Current.** `QuestTarget.kind` is only `item` or `person` (`src/game/types.ts`). `findQuestTargets` (`src/game/questTargets.ts`) ticks an open objective on any active quest when `targetSpot` is exactly here and `actionMatchesObjective` matches. An item ticks on intent `search` or `observe`, or when the action names that object. A talk intent does not tick an item. A person ticks on a `talk` intent that names them. A step with no target does not tick. Arrival does not tick.

**Current.** `placeQuestTarget` writes a `nodeId` only when the step has `room` and the target has `place`, into a reachable room that is not the entry, the current node, or a stair. A room word that matches nothing falls through to any such room. That fallback is an arbitrary relocation. This adapter does not call it for a thing that already has a place, and it does not call it to invent a home for a noun the world does not have.

**Current.** `applyQuestRouteOutcome` ticks only the open step of `mainSpineQuest` (`src/game/questRoutes.ts`, `src/game/questPlay.ts`). One successful route completes that step. `validateQuestStepRoutes` requires three families for a generated floor quest in dnd, litrpg, and rpg, and returns no errors for pyoa. `questGenerator` calls it before keeping a `gen-` quest. Those routes are redundant ways to reveal one lead.

**Current.** `resolveEngineFight` (`src/game/engineFight.ts`) can record a successful parley: the foe "accepted terms and stood down," and `payEncounterXp` may run for that resolution. `useGame` sets `socialCheckSucceeded` when a check is a success, was not skipped, and the attribute is CHA. `runPlayerCheck` (`src/game/checkMath.ts`) is the check resolver. `taskRung` and `ladderDc` (`src/game/rules/exploration.ts`) supply DCs for `lock` and `athletics`. None of these flip a quest objective today.

**Current.** `settingGenreTokens` (`src/game/midVisitProposal.ts`) derives tokens from `campaignBibleId` and `engineMode`: the mode id plus `fantasy`, `litrpg`, `medieval`, `tabletop`, `story`, `pyoa`, `modern`, `scifi` when the bible id matches. `genreOk` returns success when `genreTags` is empty. The live tag has no genre field. No turn calls `evaluateMidVisitProposal`.

There is no technology ladder and no per-noun origin tag in those sources. Where this spec cannot decide compatibility from the tokens plus the nouns already on the save and the campaign bible, the offer fails closed as `genre-unknown`.

## Three route families

The three families are required when the floor generator builds a `gen-` quest in dnd, litrpg, or rpg. They are not applicable to a mid-visit quest. That quest is one task with one outcome. Copying person, place, and study labels onto it would not perform the outcome, and if the new quest were the only visible active quest, `mainSpineQuest` could fall through to it and one route success would complete the step. This revision stores no routes. Gen-bind is unchanged.

## Approaches

1. **Proposed, and the one this file specifies.** Keep the `gen-` bind. Otherwise accept one side quest only with an outcome contract below: a typed proposal, a bind to records the world already has, and a completion event that records that outcome. No new model call. No writer genre attribute.

2. Accept every unbound title as a hidden item. The journal then asserts a search the offer may not have made.

3. Ask another model to name the family. The turn does not spend that call today, and the engine would still need the same proof.

Approach 1 is the proposal. It is the whole approved set, not a staged rename.

## Proposed proposal record

The writer tag stays `id`, `name`, `type`, `description`. The engine, not the writer, builds this record. It is not implemented.

- `family`: `investigate`, `explore`, `negotiate`, `obstacle`, `find`, or `meet`.
- `outcome`: the claim stored at accept (what becomes true).
- `binds`: ids of people, objects, and places that already exist on the save or are named by the campaign bible. Empty when the noun cannot be bound.
- `requires`: capability ids entailed by the nouns, from the source of truth below.

The title is the tag name, trimmed, at most 80 characters. The summary is the description, trimmed, at most 240 characters. The id starts with `mid-`, then the place id, the turn, and a slug of the title.

## Source of truth for setting compatibility

**Proposed.** Compatibility is decided in this order. No step is "the mode allows the family."

1. Collect nouns from the description that name a person, object, place, or device. Ignore the title except as a name that may match a bind.
2. Bind each noun to an existing record: a seated or located NPC, an inventory or scene object, a place or dungeon node, or a name already on the campaign bible. A noun with no record is unbound.
3. Read `settingGenreTokens`. The entailment table below is the proposed source of truth for what those tokens already mean. It is not a writer taxonomy.
4. If a bound record exists, the world already contains that thing. The offer is compatible with the setting on that point.
5. If a noun is unbound and the entailment table says the token set does not include that capability, reject `genre`.
6. If a noun is unbound and the table does not mention that capability, reject `genre-unknown`. Do not guess.
7. Family eligibility never overrides step 5 or 6.

Entailment, proposed from the tokens the helper already emits:

| Token set | Already entailed without a matching world noun | Not entailed unless a save or bible noun already names it |
| --- | --- | --- |
| `medieval` or `tabletop`, and neither `modern` nor `scifi` | speech, places, roads, locks, barriers, written clues, study, animals | powered device, firearm, spacecraft, motor vehicle |
| `modern` or `scifi` or `litrpg` present | the row above, and a powered device or firearm or vehicle is not rejected by token alone | still requires a bind or a bible noun; a floating noun with no record is `no-binding` |
| mode token `pyoa` | no new mid-visit contract on this proposal | the whole offer is `genre` under the disclosed scope choice |

A fantasy investigate task about a radio, on a tabletop save whose tokens are `dnd`, `fantasy`, `medieval`, `tabletop`, with no radio in items, places, props, or the bible, is `genre`. The family being investigate does not save it.

## Outcome contracts

Each accepted quest stores one objective and one outcome record. The objective completes only when that record is written. The writer cannot write it. `findQuestTargets` remains the proof only for `find` and `meet`.

| Family | When it is this family | Bind | Authoritative outcome | What does not complete it |
| --- | --- | --- | --- | --- |
| find | The task is to recover or locate a named object, and nothing else must become true | That object, where it already is. A node it already has is the spot. A place it already has, with no node, is the spot only while the player is at that place. `placeQuestTarget` is not called, so a missed room word cannot move it. No place and no node is `no-binding` | **Current** item rules of `findQuestTargets` at that spot. **Proposed** outcome `{ kind: 'found', objectId, nodeId, turn }` written in the same step | A search somewhere else. Naming the title when the object name was not what was said. Any new room chosen for it |
| meet | The task is to speak with a named person, and no concession is required | That existing person. They must already be seated, or already have a location. They are not created and not moved | **Current** person rules of `findQuestTargets`. **Proposed** outcome `{ kind: 'met', personId, turn }` | A search. Talking to someone else |
| investigate | The task is to learn a stated claim from a source | The existing person, object, or place the description names as the source. The claim must already be text on that record (an NPC fact, the object's text, or the place text). A question with no such text is `no-binding` | **Proposed.** The player takes the source's existing action at its real spot: search or observe on an object or place, talk on a person, or a `search` check from `runPlayerCheck` when the task is study. The adapter writes `{ kind: 'learned', claim, sourceId, turn }` and the claim is that pre-existing text, not a sentence composed at accept | Any search of a different source. Naming the object without being at its spot. A glance that is treated as discovering a fact the source did not hold. The writer saying the answer in prose |
| explore | The task is to survey a named place or room | That place or reachable node, already on the card or map | **Proposed.** The player is on that node or place and the action is search or observe. Arrival alone does not write the record. Outcome `{ kind: 'surveyed', placeId, nodeId, turn }` | A random room. A find of an stand-in item. Leaving the site |
| negotiate | The task states a concession: an agreement, a price refused, a way opened, terms accepted | The one seated giver, who is the counterparty. The concession text is stored at accept | **Proposed.** `resolveEngineFight` records a successful parley against that person, or `runPlayerCheck` records a CHA success against them (the same success `useGame` already passes as `socialCheckSucceeded`). The adapter writes `{ kind: 'concession', personId, terms, turn }`. Terms are the stored concession. They do not move gold, mint an item, or create a person | Talk with no successful check. A parley against someone else. A concession that needs new gold, a new item, or a new person (`no-mint`) |
| obstacle | The task is to clear a named barrier, lock, or blocked way | That existing feature at its real node | **Proposed.** The player is on that node and `runPlayerCheck` succeeds for `lock` (pick) or `athletics` (force, climb, clear), using `taskRung` and `ladderDc`. Outcome `{ kind: 'cleared', nodeId, task, turn }`. A failed check leaves the objective open | A search. A check in another room. Relocating the barrier |

A description that still matches two families after this assignment is `unsupported-task`. Search or examine of a place, with no separate claim to learn, is explore. Search or examine of a source in order to learn a claim is investigate. A concession verb together with a second claim is two tasks and is rejected.

Defeat, deliver, recover, protect, escort, and kill are `unsupported-task` on this path. They are floor-template strategies or combat. This visit does not acquire them by disguising them as a find.

## Accept order

1. Gen-bind as today. Leave the rewritten tag in the list. Stop.
2. Remove the writer tag from the list `eventsToQuestUpdates` will see.
3. Build the proposal record. Reject, log `unbound quest`, and leave quests unchanged when the giver, type, duplicate, crisis, cap, mode choice, entailment, or bind fails, or when the family is `unsupported-task`, or when negotiate would mint.
4. On accept, append the side quest `active` and `revealed`, one objective, the outcome slot empty, no `routes`, no rewards copied from the tag. Append one visit-log event on the place id. Append one `stateTxLog` row, `kind: 'quest_reveal'`, summary `Mid-visit proposal: <title>`.

The place is the open dungeon card's site name, or the current place record's name when no card is open.

## Shared allowance turn

A normal turn keeps the player's sentence and takes one account reservation under the fast-forward spec before it commits. This gate runs only on that committed normal turn, after engine resolution, and only if the writer tag is still the one this turn produced. A fast-forward index does not run this gate. When a batch pauses, the next sentence is a normal turn and may accept one offer.

## Design acceptance tests

- A tag that names a `gen-` giver still binds, adds no `mid-` quest, does not pay a second time, and the rewritten tag is the one `eventsToQuestUpdates` sees.
- "Examine the cellar mark and learn what it records," with the mark already in a real room, the record already holding the text, and one seated giver, stores family `investigate` and completes only when the player searches or studies that mark there. The outcome claim is the text the mark already held. Searching the door does not complete it. A mark with no text is `no-binding`. The title may be "The cellar mark" without being rejected and without being the proof.
- "Survey the cellar," with a reachable room whose name is that cellar, completes only on a search or observe while standing in that room. A different room does not complete it. No object is created to stand in for the room.
- "Persuade <giver> to open the side door," with that giver seated and the door already on the card, completes only after a successful parley or CHA check against that giver, and the outcome terms are the stored concession. Talk alone does not complete it. No gold and no item are created. `significantPerson` and the quest tick are not the same key paid twice for one flip.
- "Pick the lock on the cellar door," with that door on a real node, completes only after a successful `lock` check on that node. A failed check leaves it open. A search does not complete it.
- "Find the cellar mark," with the mark already placed, completes under the current item ticker at that node and writes `found`. The mark is not moved to another room.
- "Speak with <giver>" completes under the current person ticker and writes `met`. A search does not.
- "Learn how the radio works," family investigate, valid giver, on a tabletop save with medieval tokens and no radio noun on the save or bible, is rejected `genre`. No quest remains.
- "Learn the harbour code," with no person, object, or place on the save or bible that can be the source, is `genre-unknown` or `no-binding`. No quest remains.
- "Persuade <giver> to hand over 50 gold" is `no-mint`.
- "Kill the wolf" is `unsupported-task`.
- A PYOA-mode save is rejected `genre` under the disclosed scope choice. No book file changes.
- No named giver, a person who is not seated, and two seated names are rejected. No memory is created.
- A completed or failed title, a resolved crisis, and an active duplicate are rejected.
- The same tag twice in one turn adds one quest.
- `type="main"` that does not bind is rejected. An empty type still faces every check. A tag the parser does not match adds nothing.
- The third accept in the same place stay is rejected. Moving from one room to another in that site does not raise the cap. A reload keeps the count. After `leavePlaceVisit`, a new stay can accept again. An older `mid-` row does not consume the new stay.
- `eventsToQuestUpdates` does not insert the writer's id on a reject or a new accept.
- The live turn and the harness turn both use this gate. No model call is added.

## Not in this proposal

No new person, hook, trait, XP table, training flag, or writer route. No change to pull request 1 or 2. No production deploy. No edit to PYOA books. No decorative route triple.
