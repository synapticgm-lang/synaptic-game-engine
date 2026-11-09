# Shops and legends

Status: design only. No implementation in this change. Base: main `210e3da114f49b3ea75f78b2e3c05c6809187c93`. Sibling of `docs/superpowers/specs/2026-11-09-room-items-and-heirlooms.md`. No model call, no merge, no deploy.

## One page

Two lists the game does not own today will become facts the writer can name and cannot invent.

Shops. Stock is not a fixed string. It comes from the area. A smith or an herbalist restocks everyday goods as fast as they can make them. A higher-level piece from a higher-level city arrives only as often as a merchant could go and fetch it. A travelling merchant appears only as often as they finish their circuit. The shelf is staples, two or three seeded picks that rotate, and sometimes one rare slot. It refreshes on in-game days. The same world, the same merchant, and the same day always produce the same shelf, so a replay tape can be read again. The current sell list of a merchant who is here goes on the fact sheet. The writer names that list. Buying and selling change it. Anything that can be paid for with real money must also be earnable without paying.

Legends. There is one capped registry per world, split by region. A legend has a public rumour, a hidden truth, an optional real target, a status, and links. People may only retell legends already in the registry. The writer may colour the telling. They may not add a new legend. The engine creates legends when the world, a dungeon, or a quest hook is made, and it can retire ones nobody is using. A legendary item exists only when a legend or a dungeon seeded it. Prose does not mint one.

A tall tale with no hook stays. "I once fought a great beast" is opinion. "The vorpal of Ash Quay is in the cellar" is a claim of a real thing, and it must match a registry entry or be softened.

John's principle: the writer has artistic licence. The game owns the facts. Each rule below says whether it is too strict.

Merging this file to `main` would still publish the client, because Vercel builds production from `main`. The spec has no runtime effect.

## What is true on main

| Claim | Verdict | Where |
|---|---|---|
| NPCs have no personal inventory. | True. `NpcMemory` holds facts, an offer string, and `purchases` (names already sold). It has no `Item[]`. The player's `inventory` is on `GameState`. | `src/game/types.ts:1962` (`NpcMemory`), `:1990` (`purchases`), `:901` (`inventory`). |
| Merchants get a fixed offer, `Health Tonic; Iron Nail; Reed Salve`. | True. The constant is the merchant role's offer. | `src/game/npcMemory.ts:23`, used at `:100`. |
| `merchantStock()` is a fixed catalogue. | True. Every call returns the same SRD tools, adventuring gear, and food. No region, no day, no seed. | `src/game/merchant.ts:107` through `:118`. |
| Neither list is on the fact sheet. | True. A present person is name, role, manner, and manner cause. The offer string is not copied. `buildFactSheet` never reads `state.lorebook`. | `src/game/factSheet.ts:252` through `:260`. `lorebook` is `src/game/types.ts:991`. No use of that field in `factSheet.ts`. |
| Dungeon loot is seeded when the card is built. | True. While the card's rooms are generated, a side chest is pushed with a rarity and a grade. That is the loot. It is not parsed out of prose later. | `src/game/dungeonCard.ts:451` through `:457`, inside the node build that starts at `:418`. |

A second fixed string also exists. `merchantStockFactFor` returns `Sells: Health Tonic; Iron Nail; Reed Salve…` for merchant-like roles (`src/game/manusTopicBanks.ts:111` and `:136`). Roster seeding copies that onto the NPC's fact list (`npcMemory.ts:615`). It is still the same three names, and it is still not the fact sheet's present-person row.

## Shops

The engine owns a stock record per merchant. It is not an NPC inventory and it is not `NpcMemory.offer`.

A row is a name, a quantity, an item level, a rarity, a price in the coin the mode already uses, a source (`staple`, `rotate`, or `import`), and the `worldDay` it was rolled (`src/game/types.ts:1289`).

### What is on the shelf

Research shape John accepted:

- Staples. A short list of area-band goods that belong to this settlement. They are present whenever the quantity is above zero.
- Two or three rotating picks. Chosen from the same band. They change when the day changes.
- One rare slot. Often empty. Filled only when an import is due.

The roll is `hash(worldSeed) xor hash(merchantId) xor worldDay`. The same three inputs always give the same shelf. A replay that still has that seed and that `worldDay` sees the same goods. No model call.

### Local supply

Staples are made by producers who live in the settlement: a smith, an herbalist, and the same kind of settled craft role the sheet already gives an NPC. Each producer has a rate: how many of their staple they finish per `worldDay`. The shelf refills by that rate, up to a small cap, so a smith does not mint an infinite pile.

The goods are levelled with the area band from `ensureRegionBands` (`src/game/regionLevels.ts:115`), the same rule as room props. Adjectives do not raise the level.

If the producer is dead or gone, the rate becomes zero. What is on the shelf can still be bought. It does not come back. The writer may describe the empty hook. The engine does not restock it.

### Imports

A higher-level good comes from a higher-band region, not from the local smith. It occupies the rare slot. It is rolled only when enough `worldDay`s have passed for a merchant to travel there and back. The wait is the existing travel time between those regions (the `worldHour` clock already moves by travel, `types.ts:1286`). It is not "next turn".

Quantity is one. When it is bought, the slot stays empty until the next trip would have returned.

### Travelling merchants

A travelling merchant is a separate record with a circuit of hubs. They are present at a hub only on the days the circuit says they have arrived. The gap between visits is the time to walk the circuit, again from travel time, not a fixed every-turn appearance.

Their shelf uses the same seed formula, with their own id. A tape of that day reproduces the cart.

### The fact sheet and the writer

When a merchant is in the room, their current rows are one line on that person's fact-sheet entry: names, quantities, and prices. `placeFeatures` is not the shop. `MERCHANT_OFFER_STOCK` is not the shop.

The writer names only those rows. A good that is not on the line is a missing fact: repair once or remove that name. The smell of the forge, the crowd, the merchant's manner: colour, kept.

Buying decrements the row and adds the item to the player. At zero the row leaves the sheet until the clock refills it. Selling pays the player and does not create a legendary item. A sold area-band good may join the shelf. An heirloom joins the shelf only if the room-items spec's engine transfer already moved it. Speech does not put it up for sale.

### Money

Shops in this design take the game's own coin. They do not take real money.

The rule John stated still binds anything later that does: if an item can be bought with real money, the same item must also be earnable without paying. Paths that count: local production, a dungeon chest seeded at card build, a quest reward, or the travelling cart (the visit is free; the price is in-game coin). No row exists only because someone paid.

**Licence.** Naming only today's shelf is a fact rule. Describing the shop is free. The wait for an import is a fact rule: the writer does not announce a delivery the clock has not made. Not too strict. Stopping a dead smith's restock is a fact. The writer can still talk about the empty stall.

## Legends

One registry on the world, grouped by region. Cap: 12 live legends in a region, 48 live in the world. The archive can be larger. The fact sheet shows at most three.

A legend:

- `id`
- `regionId`
- `publicRumour` — one short sentence the engine wrote. This is what people may say.
- `accuracy` — `truth`, `half`, or `false`, chosen by the seed at creation. The writer does not pick it.
- `hiddenTruth` — one short sentence. Not on the fact sheet until status is `found` or `resolved`.
- `target` — optional, and only if the engine placed one at creation: a dungeon, an item, an NPC, or a place. The id is the real record. The label is the public name.
- `status` — `rumour`, `lead`, `found`, `resolved`, `debunked`
- `links` — other legend ids
- `createdTurn`, `lastToldTurn`

`truth` means the target is real and the rumour is fair. `half` means the target is real and one stored detail is wrong. `false` means there is no findable target; the rumour is a story. A false legend can later be `debunked`. It never grows a target because someone repeated it.

### Who may create one

Only engine events: world generation, building a dungeon card, or opening a quest hook. At most one new legend per dungeon card, and a small seeded handful at world generation. Prose, dialogue, and the fact check do not append to the registry.

A legendary item is created only in those same events: the legend's target is an item, or the dungeon card's loot row is the item (`dungeonCard.ts:452`). The room-items heirloom is not a legend unless this roll also writes a legend row. Speech does not mint either.

### Retirement

A live legend with status `rumour`, no quest pointing at it, and no telling for a long stretch of `worldDay`s leaves the live list. The archive keeps one line. A legend that already placed a dungeon or an item is not deleted; it can go quiet on the sheet and return when a hook links it. The place in the world remains.

### What an NPC may say

Each NPC knows a few legend ids, seeded once with their sheet (the same once-only gate as `ensureNpcSheet`). They do not know the whole registry. The fact sheet lists the public rumours of the people who are here, at most three, and not the hidden truth.

The writer may rephrase a rumour that is on the sheet. They may not introduce a new legend, a new lost city, or a new named weapon.

### How the fact gate treats the speech

This is the line that must not strangle a tall tale.

- A boast or an opinion with no new hook stays. "I once fought a great beast." "I think the road is cursed." No new proper place, no new item name. The span is kept. It is not required to match the registry. `I think Mira is down on the quay` is this kind of line when the quay is not being filed as a new legend: it is an opinion, kept, and it does not create a place or an item.
- A retelling of a public rumour that is on the sheet stays, including colour, fear, and a lie the engine already marked `false` or `half`.
- A specific claim of a real thing to find — a named sword, a named ruin, a dungeon, a person who holds it — must match a registry target's label or a sheet row. If it does not, the span is repaired once down to a boast with the hook removed, or removed if the repair still names the unregistered thing. It is not added to the registry.

Narration that the player has found the legendary item is allowed only after the engine has set the legend to `found` or `resolved` and granted the item (loot or transfer). Until then it is a wrong fact.

**Licence.** Colouring a known rumour is the writer's job. Inventing a fourth lost kingdom is the game's job, and the cap says no. The boast exception is what keeps this from being too strict. Without it, every yarn would need a registry row. With it, only a claim that points at a findable thing is policed.

## Ties

- Room props stay room props. They are not shop rows and not legends.
- An heirloom stays on the NPC until an engine transfer. The shop does not list it by itself. A legend does not spawn it by being told.
- Dungeon chests stay the card's seeded loot. A legend may point at one of those chests. It may not replace the seed with a sentence.
- The fact sheet gains two small blocks when they apply: `Sells:` for a merchant who is here, and up to three `Rumour:` lines. Both are facts. Both are short.

## Tests, when this is built

- The same seed, merchant, and `worldDay` always yield the same shelf. The next day changes the rotating picks and not the staple names.
- A smith's rate refills a staple. A dead smith does not.
- An import slot stays empty until the travel-time gap has elapsed, then holds one higher-band item.
- A travelling merchant is absent on the days the circuit says they are elsewhere.
- Buying removes quantity. At zero the name leaves the fact sheet. Selling does not create a legendary item.
- The writer sheet for a present merchant lists the rows. A sentence that names a good off the list is repaired or removed. A sentence about the shop with no new good is kept.
- No stock row is reachable only by real-money payment.
- A dungeon card creates at most one legend, and the chest loot exists without anyone describing it.
- An NPC line that retells a sheet rumour is kept. A boast with no hook is kept. A named ruin that is not in the registry is softened or removed, and the registry does not grow.
- Hidden truth is absent from the packet until status is `found` or `resolved`.
- A retired rumour is off the sheet. Its dungeon, if it had one, is still there.

Old saves: merchants whose `offer` is the three-name string get a stock record on the next day boundary, rolled from seed and id, not a permanent copy of Health Tonic, Iron Nail, and Reed Salve. `lorebook` cards are not legends. They are not deleted. They are not copied into the registry by this migration. New legends start empty except what world gen and the next dungeon card add. Replay tapes are not backfilled: stock and legends are computed from seed and `worldDay` when a turn is new, not by rereading old prose.

## Is each rule too strict?

| Rule | Artistic licence | Too strict? |
|---|---|---|
| Shelf from area, day, and seed | The writer describes today's goods. They do not invent tomorrow's. | No. |
| Local rate, and no restock without a producer | The empty stall can still be told. | No. |
| Import waits on travel time | A delivery the clock has not earned is a false fact. | No. |
| Circuit for travelling merchants | They can be anticipated. They cannot be in two towns on the same day. | No. |
| Writer names only current stock | Shop colour is free. Wrong goods are not. | No. |
| Paid items must be earnable free | This is not a prose rule. | No. |
| Capped registry, engine-only creation | Yarns stay. New findable legends do not come from a sentence. | No. The boast exception is required; without it this would be too strict. |
| Accuracy set by the engine | The writer can sound sure. The sheet already decided if the story is fair. | No. |
| Legendary items only from a seed | Same as the heirloom rule. A sentence does not forge one. | No. |
| Specific findable claim must match the registry | A hook that leads the player somewhere is a fact. A boast is not. | No, because boasts are kept. |
