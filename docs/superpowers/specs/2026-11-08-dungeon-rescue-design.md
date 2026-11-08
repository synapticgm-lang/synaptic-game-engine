# Dungeon people and rescue

**Status: proposal.** Do not implement until this file is reviewed. It authorises no gameplay change, no merge, and no deploy. It does not edit `dungeonCard.ts`. That file stays with the later integration lane, shared with the contents check.

John approved this on 8 Nov 2026: a dungeon may sometimes hold fitting friendly people, including more than one captive and a rescue group. There is no universal cap of one friendly person. Gratitude may follow a rescue. It is not the rescue.

No earlier rescue spec is in `docs/`. This file is the first. It does not reopen M1–M7.

**Current** is what the code does today. **Proposed** is the contract a later build would add. Pull request 5 is a draft. This rescue does not depend on it. A later visit-offer that means "free these people" would have to use this contract. It must not become a find-item quest.

Out of scope: new XP formulas, a universal count of people per save or per room, PYOA book files, training capture, provider changes, and friendly-person work outside a generated dungeon card.

## What exists today

`buildDungeonCard` (`src/game/dungeonCard.ts`) builds one card from the save seed and the site name. `openDungeonCard` stores that card on the place and reopens the stored card. It does not roll a new card on each visit. Rooms receive foes, chests, traps, and secrets. They do not receive a friendly inhabitant or a captive.

A foe is a `hidden.mobs` entry. `mobCountsAsRemaining` (`src/game/dungeonMobLedger.ts`) counts a mob that has not been defeated. `placeRoadCamp` (`src/game/roadCamps.ts`) renames those mobs with `pickPersonName` and records the names on `roadCamp.people`. They remain mobs. Clearing the camp sets every mob defeated. This spec does not reclassify those camp mobs.

`npcStance.ts` treats `roleHint === 'captive'` or sheet job `prisoner` as a captive. A player line whose action kind is `free`, aimed at that present person, writes a stance event `rescued` and can set stance `grateful` and disposition `friendly`. The same file says who they are does not change. Nothing in that path records a release, an escort, or an exit. Talk and a grateful stance leave them where they are.

`seedPresentNpcLifecycles` (`src/game/npcLifecycleFsm.ts`) starts a lifecycle when `roleHint` is a registry role. The captive row in `npcRoleRegistry.ts` describes a hard deadline of `turnOffset` 15. That number is a catalog entry. This spec does not adopt it as a rescue clock. Seeded dungeon people do not set `roleHint` to `captive`, so that catalog deadline does not start.

`recruitedCompanions` and `PARTY_CAP` (`src/game/rules/companions.ts`, cap 1) apply to a recruited companion on a litrpg or story-RPG save. A rescue escort is not a recruit. This spec does not put a freed person into `companions[]` and does not spend that cap.

`sandboxXp` pays `quest-tick:<quest id>:<objective id>` once per objective flip and `quest-complete:<quest id>` once per quest id. `questIdentity` is the giver, or `unknown-giver`, plus the task.

`pickPersonName` (`src/game/personNames.ts`) is the seeded name source road camps already use. `presentNpcRecords` is who is seated. Free text remains a normal player turn. No separate NPC model call is priced today, and this spec adds none. Speech uses the sheet and persona text those people already get when they are present.

Secret rooms stay hidden until the card's existing secret is revealed. A boss room mob uses role `miniBoss`. That remains a foe.

## Who can be seeded

**Proposed.** When a card is first built, one seeded draw may add a `dwell` list on the card. The list is stored with the card. A reload and a later visit read it. They do not roll it again. A card that has no `dwell` list, including every card already saved, has no seeded people. Old cards are not rebuilt.

Two kinds:

- `inhabitant`: a friendly or neutral person. Not a captive. Not a foe. No rescue objective.
- `captive`: a person held in one real room. The rescue quest names them.

Neither kind is written into `hidden.mobs`. Neither counts toward remaining foes. Neither is forced hostile. A friendly or neutral inhabitant stays that disposition. A captive's disposition may be afraid or neutral. Stance `grateful` is allowed after they are out. It is not the status that frees them.

The draw fits the card's own rooms.

- A captive is placed only in a generated room whose name already contains a holding token the theme tables actually use: `niche`, `vault`, `locked`, `strong-room`, or `strongroom` (Sealed Niche Row, Offering Vault, Locked Strong-room, Strongroom). If the card has no such room, it has no captives and no rescue quest.
- A room whose name says row or gallery may hold more than one distinct captive. Any other holding room holds one. The count is the seed's pick among the rooms the card already has. There is no new maximum and no rule of one friendly person per dungeon.
- An inhabitant is placed only in an ordinary room that received no mob. If every such room has a foe, the card has no inhabitant. They do not share a foe slot.

Names come from `pickPersonName` and the taken-name set, once, at build. Each person has a stable id from the site, the node, and the index. The same id is the `npcMemories` id when they become present. They are not a new random person on a later turn.

They become present only while the player is in their node and, for a secret room, that secret is already revealed. Until then they exist on the card and are not seated.

## Custody

**Proposed.** Each captive has one status. The card is the authority.

| Status | Meaning |
| --- | --- |
| `held` | In the seeded node. Not free to leave it. |
| `released` | The restraint is open. Still inside the site. Not yet out. |
| `out` | They have left the holding site by the entry, or the player left the site with them in the escort set. |
| `lost` | The player's committed action harmed them (`stance` kind `harmed` aimed at their id). |

`released` and `out` are real before the quest objective flips. A group can have one person `out` while another is still `held`. The person who is `out` is no longer held. Their `npcMemories` location is the entry or the place outside. They are not seated in the holding room.

What does not change status: talk, a thank-you, stance `grateful`, a friendly disposition, naming them, or searching the room.

What opens `held` to `released`, and only at their node, is that captive's matching key or a successful pick of a pickable lock. A failed attempt leaves `held`. It does not complete the quest and it does not pay quest XP or lock-picking XP. The captive is not the key.

## Keys and locks

**Proposed.** John, 8 Nov 2026, 13:31 GMT. The quest defines the keys. A key opens only the restraint the quest matched to it. No key opens every lock.

- Ten prisoners and ten keys: each key is found on its own and is consumed when it releases its one captive. The key must already be an authoritative item, placed by the quest design, before it is used. The writer does not invent it at the moment of the unlock.
- One jailer's key: defeating the jailer boss yields that one key. It stays in the inventory and releases every captive the quest bound to it. It is not consumed by the first use.
- The quest may bind those keys when it is designed. They are not a generic loot roll discovered at the lock. A lock with no matching key path in that design is not allowed. The quest is not an unsolvable lock.

**Proposed.** John, same decision, with the 13:31 exception that follows. Every lock records a required lock-picking skill level. On a pickable lock, a lower skill does not forbid the attempt. A very high lock still accepts a low-skill attempt. John described the extreme mismatch as roughly one in a million. This file does not set the rest of the curve, and it does not claim that today's d20 check already implements that chance. The exact curve is a later calibration. Until then, the rule that stands is that a pickable lock can be attempted.

A success on a very hard pickable lock grants bonus XP to the lock-picking skill, not to character level. John pointed at crafting as the design intent: a hard success advances the skill. The bonus amount is not set here and is not claimed to be a formula already in the crafting code. Failed picks and retries pay neither that bonus nor the quest.

**Proposed.** John, 8 Nov 2026, 13:31 GMT, the exception. Some locks are unpickable. That is a deliberate flag on the quest's lock, used sparingly, not a very high skill requirement. Lock picking cannot be attempted. Athletics or forcing cannot open it either. The only way from `held` to `released` is the matching key. The quest design that sets the flag also provides that key, so the lock is not invented without a way through.

`out` is written when a `released` person is in the escort set and the player takes the entry exit or leaves the site. The escort set is the released people who are present and whom the player's action is leading. That action is the player's turn. It does not grant the NPC a turn and does not call a model for them.

If the player stops leading, or a fight starts and the person is not brought, status returns to `released` at the last node they occupied. That is escort loss. It is not `out` and not `lost`.

Leaving the site while someone is still `held` or `released` leaves them on the stored card. Coming back finds the same people in the same rooms. A reload does the same. The player's death uses the existing death rules. It does not roll the card again and does not free or kill the captives by itself.

`lost` closes that person. They cannot later become `out`. The quest fails, with no success pay, only when every bound captive is `lost`. If at least one is `out` and every other bound captive is `out` or `lost`, the objective flips once and the quest completes. Nobody left `held` or `released` is ignored.

## The rescue quest

**Proposed.** If the card seeded one or more captives, it also stores one quest. One id: `card-rescue:` plus the site id. Type `side`. One objective. The objective names every captive id. It has no `QuestTarget`. `findQuestTargets` does not tick it. The objective flips to completed when every bound captive is `out` or `lost` and at least one is `out`. Status then becomes `completed`.

`sandboxXp` then pays one `quest-tick` for that objective and one `quest-complete` for that quest id. It does not pay once per person. A second quest for the same group is not created. Giver may be empty. `questIdentity` then uses `unknown-giver`. That is still one pay.

The quest is not a find-item task. The journal text is that these named people are held in the named rooms. Searching a room does not complete it. A grateful line does not complete it.

If the holding room is still secret, the quest stays active and the people are not present. Finding a different object does not stand in for them.

An inhabitant never adds a rescue objective.

## Speech and orders

A present dweller can be spoken to with the player's normal sentence. That sentence stays a normal turn. Their reply uses the existing sheet and persona path. This spec adds no model call and no NPC price.

An order the engine already resolves — recruit, or a companion already in a fight — remains that one player action. A spoken order that is only talk does not release, escort, or spend a second turn. Escort and a lock attempt are player actions and consume the player's turn. The NPC does not act on a free turn.

## Acceptance tests

- A new card whose rooms include a sealed niche and a vault can seed two distinct captives, one quest, and no mob entries for them. A card with no holding-room name seeds no captive and no rescue quest.
- An ordinary room with no mob can seed an inhabitant. They are not hostile and not a remaining foe. A room that already has a trash mob does not also receive them.
- Reopening the site and reloading the save return the same ids, rooms, and statuses. No new person appears on a later turn.
- Talk, and a grateful stance, leave a captive `held`. A failed pick leaves `held` and pays no quest XP and no lock-picking XP. A successful pick of that captive's pickable lock sets `released` and does not by itself complete the quest.
- A quest for ten prisoners binds ten keys. Each is found on its own. Using one consumes it and releases only its captive. Another captive's key does not open that lock.
- A quest to defeat the jailer binds one jailer key. After that boss is defeated, the key is in the inventory, and using it releases each bound captive without being consumed.
- A pickable lock with a high required skill still accepts a low-skill attempt. This file does not state a full probability curve. The extreme mismatch John named is roughly one in a million, and that figure is not claimed to be today's d20.
- A success on a very hard pickable lock grants bonus XP to lock picking only. The amount is not set here. Character XP does not move because of that bonus.
- An unpickable lock accepts no pick and no athletics or forcing attempt. Only its matching key opens it. The quest that flags it also provides that key. Unpickable locks are sparse quest choices, not the default high lock.
- Leading that `released` person out the entry sets `out`. With a second captive still `held`, the quest stays active and pays nothing yet. When the second is also `out`, the objective flips once and the quest id pays once.
- Searching the niche, or naming the captive, does not complete the quest and does not create an item target.
- Leaving before anyone is `released`, then returning, finds them `held` in the same rooms.
- Stopping an escort returns that person to `released` at the last node. They are not `out`.
- A committed harm against a captive sets `lost`. If every captive is `lost`, the quest fails and pays nothing. If one is `lost` and the others are `out`, the quest completes once and pays once.
- A secret holding room does not seat its captive until the existing secret is revealed.
- A card saved with no `dwell` list gains none when opened.
- Road-camp mobs stay mobs. `PARTY_CAP` is unchanged. No book file changes.

## Not in this proposal

No new count cap, no new XP table, no 15-turn rescue clock, no edit to the generator in this change, and no dependence on the unapproved fast-forward or mid-visit drafts. Pull request 5 remains a separate review.
