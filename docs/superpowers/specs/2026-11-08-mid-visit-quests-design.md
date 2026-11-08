# Mid-visit quests

**Status: proposed.** Do not implement from this file until it is reviewed.

John approved the goal on 8 Nov 2026: new quests may appear during a visit, and repeated or unsuitable quests stay rejected. The 27 Oct 2026 module in commit `12d13393` is the rule source. It was written to be harvested from writer output later. That later hookup was not done. This file proposes the hookup. It is not approval of the integration details below.

Out of scope: new people, hooks as their own records, traits, balance, XP, rewards, training, capture, writer routing, and deploy. Pull requests 1 and 2 stay separate.

## What already exists

Typed lines and buttons both become the player input of one turn. Live play runs `useGame.ts`. The harness runs `fateAutoplay.ts`. After the writer replies, both parse tags, run the warden, then call `applyQuestAddProposals`.

That function keeps a `<quest-add>` only when it matches a quest whose id starts with `gen-`. Otherwise it logs `unbound quest` and drops the tag. It does not create a quest. `structuralEvents.ts` does not create one either. A bound tag is only a note and a faction accept.

`evaluateMidVisitProposal` in `midVisitProposal.ts` does create a quest and a `quest_reveal` ledger row. Nothing in the turn calls it. The tests call it directly.

The helper does not do all of the job:

- The cap counts every `mid-` quest still stored at that place. One stored quest makes the visit log irrelevant, so a later visit does not start a fresh cap.
- Kinds `npc` and `hook` are saved as quest type `main`.
- It does not check `validateQuestStepRoutes`.
- It does not place a target with `placeQuestTarget`.
- It does not call `ensurePlaceVisit`. It only appends to a visit log that is already the same place.
- Writer tags have no genre field. The genre check runs only when the caller passes `genreTags`. It does not read prose.

`PlaceVisitLog` is the visit. `timeline.ts` calls `ensurePlaceVisit`. The log stores `placeId`, `placeName`, `sinceTurn`, and events. It is part of `GameState`, so a save keeps it. `leavePlaceVisit` writes `lastVisitSummary` on the place and clears the log. The next entry to that place starts a new log.

`validateQuestStepRoutes` rejects a non-PYOA step with fewer than three routes, or without a person route, a place route, and the mode's third route. `placeQuestTarget` puts a step's target in a room of the place's dungeon card and sets `target.place` to the card's site name, or the dungeon name when the site name is missing.

## Approaches

1. **Recommended. Extend the existing gate.** Keep the `gen-` bind. When a tag does not bind, build one side quest with the engine and accept or reject it in that same function. `useGame.ts` and `fateAutoplay.ts` keep the one call they already make. No new model call. Buttons and typed input stay on the paths they already use.

2. **New generator.** On arrival, the engine invents a quest with no writer tag. The player can receive a quest the reply never offered, and a real `<quest-add>` can still be dropped. This adds quests the approval did not ask for.

3. **Mixed.** The generator builds a hidden quest and the writer only supplies a title. Two sources can disagree, and the turn still needs the same accept rules. More moving parts, same result as approach 1 when the tag is present.

Approach 1 is the proposal.

## Proposed behavior

A `<quest-add>` is handled in this order.

1. If it matches a `gen-` quest by id, or by the giver name already on that quest, bind it as today. Do not also create a `mid-` quest. Do not pay a second reward.
2. Otherwise treat it as a proposal for one new side quest. `npc` and `hook` on the tag are not records. They do not create a person. The quest type is `side`.
3. If the proposal fails a check below, drop it, append `unbound quest` as today, and leave quests unchanged.

The engine writes the quest. The writer's id, type, status, rewards, and completion are ignored. The title is the tag name, trimmed, at most 80 characters. The summary is the tag description, trimmed, at most 240 characters. The id is `mid-` plus the place key, the turn, and a slug of the title.

The giver is a person already seated in the scene whose name appears in the title or summary. If the text names nobody seated, use one person already seated. If nobody is seated, reject. Do not create a memory or a companion.

The quest place is the active dungeon card's site name when a card is open. Otherwise it is the current visit's `placeName`. The visit used for the cap is the log `ensurePlaceVisit` already builds from the current location. A dungeon room label can therefore be its own visit, because that is what the log does today. This proposal does not add a second visit rule.

The quest has one step. The step's description is the summary. It has three routes of the families `validateQuestStepRoutes` already requires: ask the seated giver, search this place, and the mode's third route. PYOA stays exempt, as that function already is. A step with no target cannot be completed by `actionMatchesObjective`, so three steps with only one target would strand the quest. One step avoids that. If validation fails, reject.

Then `placeQuestTarget` runs for that step. If it does not return a `nodeId`, reject and do not keep the quest. The step can be completed only by the existing find/meet check. The writer cannot complete it in the same tag.

On accept:

- Append the quest to `state.quests` with `status: 'active'` and `revealed: true`.
- Append one `stateTxLog` row, `kind: 'quest_reveal'`, summary `Mid-visit proposal: <title>`.
- Append one current-visit event, text `mid-visit proposal accepted: <title>`, after `ensurePlaceVisit` if the log is missing.
- Set no `rewards`. No XP, items, or standing stake are added by this path.

Reject when any of these is true:

- The title, compared after lowercasing and removing punctuation, matches a quest that is active, completed, or failed.
- The summary contains the name of a completed or failed quest.
- The title or summary contains a `sceneFacts.resolvedCrises` entry.
- This turn, or the current visit log, already accepted that title.
- The current visit already has two accept events.
- No seated giver exists, route validation fails, or the target cannot be placed.

Genre tags are not read from prose. The old tag check remains for a caller that passes `genreTags`, and it still rejects when every supplied tag misses `settingGenreTokens`. Live `<quest-add>` tags do not carry those tags, so that check does not fire on them.

The cap is two accepted proposals on the current `PlaceVisitLog` for that `placeId`. It is not a cap on all quests, and it is not a cap on people. Stored `mid-` rows from an earlier visit do not count. Leaving clears the log, so coming back starts at zero. A save restores the log that was saved. An active quest with the same title is still rejected on the new visit. A finished quest is still rejected.

`shouldAutoCloseDungeon` and the dungeon-card hold in pull request 2 are unchanged by this design.

## Tests to write when implementation is allowed

- A tag that names a `gen-` giver still binds and does not add a `mid-` quest.
- A new tag with a seated giver, a valid place, and a placed target adds one side quest, one `quest_reveal` row, and one visit accept event.
- The same tag twice in one turn adds one quest.
- A completed quest title, a resolved crisis, and an active duplicate are rejected.
- The third accept in the same visit log is rejected. A new log after `leavePlaceVisit` can accept again.
- A completed or failed quest does not consume the cap.
- No seated person, a failed route check, or no `nodeId` rejects and does not leave a quest.
- The quest has no rewards.
- `useGame` and `fateAutoplay` both reach the same function. A button and a typed line are only different inputs to that turn.
- No model call is added.

## Not in this proposal

No new person, hook, trait, reward, XP, balance, training flag, or writer route. No change to pull request 1 or pull request 2. No production deploy.
