# Room items and heirlooms

Status: design only. No implementation in this change. Base: main `210e3da114f49b3ea75f78b2e3c05c6809187c93`. No model call, no merge, no deploy. This file does not change the fact-gate draft or any other open pull request.

## One page

The writer may dress a room. The game decides which of those objects are real.

Today a desk, a sword on the wall, or a suit of armour in the corner is flavour. Nothing is saved. A player who sneaks back and steals "the sword" is handed a new Common item made from the words they typed, whether or not that sword was ever there. The other way around is also open: the writer can call a rusty blade legendary, and the only block is a name check on an item-gain event, not on the scenery itself.

John's rule, 9 Nov 09:27 GMT:

- An object the writer describes in a room becomes a thing in that place. The player can leave and come back and steal it, if it was takeable.
- Item level normally follows the area. That is not a hard cap. A retired high-level adventurer who is now a sheriff in a low-level town can still own the weapon from his past.

The game stores the object. The writer does not mint it by an adjective. Speech can boast about a great sword. Boasting does not create one.

Promotion runs only on narration the fact check has already kept, and only when that check is already running. It does not add a word list and it does not add a model call. The checker returns a few object tags on spans it is already reading. The engine accepts, levels, and files them. If the check is off, nothing is promoted. An unchecked sentence does not become loot.

Fixed things (a desk, armour on a stand) stay in the room. Loose or hung weapons, tools, and coins can be taken. Taking works only when that prop, or a seeded item, already exists. Success removes it from the place and puts it in the inventory at the area's level and rarity. Words like legendary or vorpal do not raise either number.

An heirloom is the exception. A durable NPC can roll one, once, from the save seed and their id. About one in twelve. At most one in a settlement. The reason is one of four engine phrases: retired from a higher band, family relic, war trophy, temple charge. The item is on that NPC's fact-sheet row, guarded while they are in the room, and moves only when the engine records a transfer. Roster NPCs keep the signature item they were authored with, and do not roll a second one.

Shops (local production and travel-time stock) and the legends sheet are out of this spec. They are named so they are not quietly built here.

Merging this file to `main` would still publish the client, because Vercel builds production from `main`. The spec has no runtime effect. Do not merge it until the text is accepted.

## What is true on main

Checked at `210e3da1`. The reviewer's names match the code except one: there is no `carryPropsAcrossTravel`. The travel move is `movePropsWithPlace`.

| Claim | Verdict | Where |
|---|---|---|
| Described scenery is never stored. `introducedThings` has no production caller. | True. The function returns thing heads from a line. The only call is a test. | `src/game/tokenProse.ts:498`. Caller: `src/game/writerIntroductions.test.ts:30`. The comment at `tokenProse.ts:497` says a line's things are "to register as scene props". Nothing registers them. |
| `cardPlacedProps` runs only for opening cards. | True. It collects "a/an … sits/hangs/lies/rests/waits/stands/leans" from the opening page. The only call fills `compileOpeningCard`. | `src/game/openingEstablishment.ts:1610` and `:1667`. |
| Steal mints a Common item from the typed words and does not require the object to exist. | True. `extractStealItem` returns the typed target, or a regex grab, or the fallback word `purse` (`stealParley.ts:215`). `resolveStealAttempt` pushes `{ name: item, rarity: 'Common' }` on success (`:286`). It then drops a scene prop only when the prop string equals that name (`:292`). A miss still creates the item. | `src/game/stealParley.ts:202` and `:234`. |
| `SceneFacts.props` / `propsPlace` and `PlaceRecord.props` persist across travel. | True, under the name `movePropsWithPlace`. On a real location change it parks non-window props on the old `PlaceRecord.props` and loads the new place's list into `sceneFacts.props`. | `src/game/presentAuthority.ts:334`, called from `applyPresentTrimOnTravel` at `:392`. Fields: `SceneFacts.props` `src/game/types.ts:1808`, `propsPlace` `:1884`, `PlaceRecord.props` `:2306`. |
| `placeFeatures` shows up to six props. | True. It slices `sceneFacts.props` to six, plus the packet's focus noun. | `src/game/factSheet.ts:212`, slice at `:214`. |
| The warden blocks unseeded legendary names. | True for an `item-gain` event, not for scenery prose. Below level 8, an unseeded name matching legendary / vorpal / holy avenger and the rest of that pattern is blocked (`warden.ts:103`). Below level 5, epic is blocked too (`:112`). Prose that mentions those words is noted (`:220`) and is not deleted by that block. | `src/game/warden.ts:103`, `:112`, `:220`. |
| Area bands come from `ensureRegionBands`. | True. Each region gets `low`/`high` on `state.regionLevelBands`. | `src/game/regionLevels.ts:115`. The field is `src/game/types.ts:1232`. |
| `isGuardedQuestItem` guards a held item. | True, narrowly. It blocks the steal only when a living encounter or a guardian/keeper memory exists, and the needle sits in the props or an open quest. It does not know an owner, a fixed flag, or an heirloom. | `src/game/stealParley.ts:183`. |
| NPC traits are seeded once. | True. The file header says the sheet is picked once on first meet (`npcSheet.ts:3`). `ensureNpcSheet` returns the state unchanged when `memory.sheet` is already set (`:203`). Authored roster people never get a generated sheet (`:3` and the `isAuthored` return at `:201`). | `src/game/npcSheet.ts:3`, `:193`, `:201`, `:203`. |

Props that do persist are strings. They have no owner, no fixed flag, no level, and no turn. Opening-card props are the only writer sentences that become those strings, and only at the start of a run.

## Principle

The writer has artistic licence over the story. The game owns the facts.

A sentence may be vivid about a desk. The desk becomes stealable only after the game has filed it. A sentence may be vivid about a vorpal sword. The sword's level is the area's, unless the sheet already lists an heirloom. Licence covers the telling. It does not cover the inventory.

Each rule below ends with whether that line is too strict.

## 1. Promotion

After a narration span is kept, physical objects tied to the current place are saved on that place.

A saved prop has:

- `label` — the noun phrase as written, with rarity adjectives stripped (`legendary`, `vorpal`, and the warden's existing high-tier words). The words may remain in the published sentence. They are not part of the item name.
- `owner` — `place`, or the id of a present NPC when the sentence puts the object on that person ("the sheriff's sword", "in her hand").
- `fixed` — true or false.
- `takeable` — the opposite of fixed, stored explicitly so a later reader does not guess.
- `level` — see section 4.
- `rarity` — see section 4.
- `turn` — the turn it was filed.
- `kind` — `furniture`, `armour`, `weapon`, `tool`, `coin`, or `other`.

Defaults, from the tag the checker returns, not from a new word list in the engine:

- Furniture, and armour that is mounted, standing, or worn as a fixture: `fixed`.
- A weapon that is loose or hung, a tool, or coins: `takeable`.
- `other`, when the tag is unsure: `fixed`. A thing the game is not sure it can pick up is not loot.

### How the object is extracted

The engine does not grow a list of nouns. `introducedThings` stays a test helper. `cardPlacedProps` stays on the opening card.

The batched fact check, the one that already reads candidate spans, returns object tags beside its keep/remove verdict:

```
{ "n": 2, "verdict": "keep", "objects": [
  { "label": "old rusty sword", "kind": "weapon", "mount": "hung", "owner": "place" }
]}
```

`mount` is `fixed`, `hung`, or `loose`. The engine maps `kind` + `mount` to `fixed` / `takeable` using the defaults above. A tag is accepted only when:

- the span was narration, not speech,
- the span was kept,
- the label's words appear in that span,
- the place is the current place.

Speech tags are ignored. A boast is not a prop. A tag that fails a check is dropped, not repaired into a different object.

Cost: a few tokens on the check the turn is already paying for when a candidate exists. No second call. A turn with no candidates promotes nothing. The check flag off promotes nothing. That is fail-closed: unseen prose does not fill the room with stealable goods.

This spec does not build that check. On this commit the check does not exist. Promotion waits until the check is in the game. A word-list extractor is not the stand-in.

**Licence.** The writer still describes the room. The game files only what survived the check. Too strict only if the check is off for a long time, because then no new prop is born. That is the safer failure. It is not a style ban.

## 2. Persistence, cap, and the place file

`movePropsWithPlace` already parks props on the place when the player leaves and reloads them on return (`presentAuthority.ts:334`). The change is the record, not a new travel path.

- While the player is here, `sceneFacts.props` is the open list for this place, and `propsPlace` stays the place key.
- On leave, the structured list is written to `PlaceRecord.props` (the field at `types.ts:2306`, widened from `string[]` in a compatible way). `sceneFacts` keeps only system-window labels, as it does now.
- On return, the place file is copied back into `sceneFacts`.

The fact sheet stays small. `placeFeatures` keeps its six-line cap (`factSheet.ts:214`). Those six are the newest takeable props, then fixed props if there is room. The writer sees six. The player does not need the rest until they name one.

The place file holds the full list, opened when the player is in that place or names a thing there (a return steal, a search). It is not pasted into every packet. That matches the scene ledger John already asked for: the current place is in hand, older detail stays on the place and is not recited every turn (`docs/orders/queued-fix-orders.md` on the leapfrog, the dungeon card as the pattern that stays on the place).

Cap on the place file: 24 structured props. Past that, the oldest `other` and takeable props that were never taken, searched, or mentioned by the player fold into one summary line on the place card ("other small things along the wall"). The summary is not takeable. A search of that summary can reopen one prop, engine-side, still at the area band. Fixed furniture is not folded. Heirlooms are not on this list; they live on the NPC.

**Licence.** Capping the sheet at six limits what the writer is handed, not what they may say about the six. Folding unread clutter is a memory rule, not a style rule. Not too strict. A player who cared about the twenty-fifth rusty nail can still search the summary.

## 3. Stealing and taking

`resolveStealAttempt` may grant an item only when the name matches:

- a `takeable` prop in the current place, or
- an item the engine already seeded (dungeon loot, a quest prop, an heirloom the engine has transferred).

The `purse` fallback in `extractStealItem` (`stealParley.ts:215`) goes away. No match means the attempt fails and the inventory does not grow. The check can still be rolled and failed in public; it does not conjure the object.

Fixed props cannot be taken. The receipt says the thing is part of the room. No item is created.

A prop whose `owner` is a present NPC is a crime. Success removes the prop and adds the item, and sets noticed, or a notice the owner can act on later. `isGuardedQuestItem` (`stealParley.ts:183`) remains for a living guardian and a quest needle. An owned prop uses the same "not silent" outcome even when no one is flagged guardian.

Success deletes that prop from `sceneFacts` and from `PlaceRecord.props`, then pushes an `Item` whose level and rarity came from the prop, not from the typed adjective.

**Licence.** Refusing a steal of a thing that was never filed is the game owning the fact. The writer may still narrate the attempt and the refusal. Not too strict. Refusing to drag a desk away is the default John asked for. A later engine action can unfix a prop. This spec does not add that action.

## 4. Level and rarity follow the area

`ensureRegionBands` (`regionLevels.ts:115`) is the source. The prop's level is a seeded roll inside that region's `low`..`high` (`types.ts:1232`), seed `state.seed + place id + label`. Rarity follows the same band: low band Common, mid Uncommon or Rare, high Rare or Epic. The table is fixed in the engine. It does not read the sentence.

Adjectives never raise level or rarity. `legendary`, `vorpal`, `holy avenger`, and the other words in the warden pattern (`warden.ts:106`) are stripped from the stored label. The warden block stays as a backstop on `item-gain` events. It is not asked to police scenery sentences.

This closes the scenery-loot exploit: a player cannot be given a Legendary weapon because the writer, or the player, used that word about a sword that was only scenery.

**Licence.** The sentence may still say the sword looks famous. The item does not become famous. That is the point of the rule. Not too strict. The heirloom path below is the deliberate way a famous weapon exists.

## 5. Heirloom exception

A high-level weapon in a low-level town exists only as an heirloom the engine rolled, not as a sentence.

Eligible: a generated NPC with a durable role (sheriff, priest, veteran, retired adventurer, and the same kind of settled job already on the sheet). Not a passer-by. Not an authored roster NPC.

Roll, once, inside `ensureNpcSheet` when the sheet is first saved (`npcSheet.ts:203` is the gate that already refuses a second pick):

- `hash(state.seed + npcId) % 12 === 0` — about one in twelve.
- The settlement (`PlaceRecord.parentHub`, or the place itself when it is the hub) has no heirloom yet. At most one.
- The reason is one of: `retired-higher-band`, `family-relic`, `war-trophy`, `temple-charge`. The roll picks the reason. The text is engine-owned.
- The item's level is the higher band the reason names (a retired adventurer: the far region's band; a temple charge: one band above this area, still inside `WORLD` max). Rarity follows that level, not an adjective.
- The row sits on the NPC memory next to the sheet. `placeFeatures` / the NPC's fact-sheet line names it. While that NPC is present, the item is guarded the way `isGuardedQuestItem` guards a quest prop.
- It changes hands only through an engine-recorded transfer (a gift the beat grants, a theft that beats the guard, a death and a loot the engine commits). Speech does not transfer it.

Roster NPCs (`isAuthored`, `npcSheet.ts:201`) do not roll. They keep the signature item their data already lists, if any. One. No second famous sword.

A line of dialogue about a great sword does not create a prop and does not create an heirloom. Section 1 drops speech tags.

**Licence.** The writer may boast, threaten, and lie. The sheet either lists the heirloom or it does not. One in twelve and one per settlement keeps a low-level town from filling with retired legends. Not too strict: the sheriff John described is exactly the case the roll exists for. A town with no roll simply has no such weapon, and the writer is not punished for not mentioning one.

## 6. The writer and a high-level item

The writer may describe a high-level item only when that item is already on the fact sheet (an heirloom row, or a prop whose stored level is above this area because it was carried in from somewhere else by an engine transfer).

Any other narration that puts a high-tier name on an object is a wrong fact: repair once or remove that span. The same rule as any other fact that is not on the sheet. Adjectives of glory on an ordinary area-band prop are colour around a true object; they are not a level change. The stored item stays at the band. The published sentence may keep the colour if the checker marks the object as the filed prop. It may not introduce a second, stronger item.

Until the fact check is in the game, this section does not add a prose word list. The warden's `item-gain` block remains the only runtime backstop, and it does not see scenery. That gap is accepted until the check ships. This spec does not close it with a new list.

**Licence.** Telling the writer they cannot invent a second holy avenger is a fact rule. It is the same rule as not inventing a dead man walking. Not too strict.

## 7. Shops and legends

Deferred. Not designed here.

- Shops. John's local-production and travel-time stock is a different change. `merchantStock` (`src/game/merchant.ts:107`) stays as it is. A room prop is not shop stock. Selling an heirloom to a shop is out of scope.
- Legends. A legend sheet, if it is built later, may record that a story is told. It does not create a prop or an heirloom. Section 5 already says speech does not create the sword.

**Licence.** Leaving these out is scope, not a new restriction on prose.

## 8. Tests, old saves, tapes

Tests, when this is built:

- A kept narration span with an object tag files a prop. A speech span with the same words does not.
- Furniture and mounted armour are fixed. A hung sword and a coin are takeable.
- Leave and return: the prop is on `PlaceRecord` while away, and back in `sceneFacts` on return. The fact sheet shows at most six.
- The twenty-fifth unread takeable prop becomes part of the summary and is not granted by steal.
- Steal of a missing name grants nothing. The `purse` fallback is gone.
- Steal of a fixed prop grants nothing.
- Steal of a takeable prop removes it and adds an item at the area band. The words "legendary vorpal" on that prop do not change level or rarity.
- An owned prop, owner present, is noticed on a successful take.
- Heirloom: the same seed and npc id always agree. Changing the id or moving to a settlement that already has one does not add a second. Roster NPCs do not roll.
- While the owner is present, steal does not move the heirloom unless the guard check is the engine's transfer. After an engine transfer, the new holder is on the sheet.
- A high-level description with no sheet row is removed or repaired. A description of the filed heirloom is kept.
- Apostrophes and boasts do not file props.

Old saves:

- A `string` in `PlaceRecord.props` or `sceneFacts.props` is read as `{ label, owner: 'place', fixed: false, takeable: true, level: this area's band, turn: 0 }`. Takeable is the conservative read of today's string list, which steal already treats as a name to remove. Fixed is not inferred from old strings, because the old string does not say.
- No heirloom is added to an NPC who already has `memory.sheet`. `ensureNpcSheet` will not run the roll for them. New people only.
- Levels on migrated strings use the current area band, never a raised rarity from the label's adjectives.

Replay tapes:

- Do not walk old `gmText` or `writerRaw` and file props. Those runs already finished. Backfill would invent stealable goods the player never had.
- A tape replayed for reading stays a reading. Promotion runs on new turns only.

**Licence.** Not promoting history is so the new fact does not rewrite old games. Not too strict.

## 9. Is each rule too strict?

| Rule | Artistic licence | Too strict? |
|---|---|---|
| File only kept narration, via checker tags | The sentence can still be vivid. The object is filed after it is kept. | No. Fail-closed when the check is off is the strict part, and it is the one that blocks fake loot. |
| Furniture and mounted armour fixed | The writer can still call the desk enormous. The player cannot pocket it by default. | No. John set this default. |
| Six lines on the sheet, 24 on the place, then a summary | The writer is handed six, not a catalogue. | No. |
| Steal only what exists | The attempt can still be told. The item appears only if it was real. | No. |
| Area band, adjectives ignored | The sword can look old and famous in the sentence. The numbers stay the area's. | No. |
| Heirloom roll, one in twelve, one per settlement, four reasons | Boasting stays legal. The weapon exists only when the roll said so. | No. A town without a roll is an ordinary town. |
| Roster NPCs keep their signature item only | Their authored gear stays the fact. | No. |
| High-level description only from the sheet | Same as any other missing fact. | No. |
| Shops and legends deferred | No new prose ban. | No. |
| No backfill from old tapes | Old text is not re-interpreted as inventory. | No. |

## What this spec will not do

- No new noun list, verb list, or rarity-adjective list in the engine.
- No second model call. Tags ride the fact check the turn already makes, once that check exists.
- No heirloom from dialogue.
- No shop-stock redesign and no legend sheet.
- No edit to the fact-gate draft in this change. The tag field is specified here so that draft can grow it later, in its own change.
