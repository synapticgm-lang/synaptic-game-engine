# Dungeon contents, hoard field, and camp rest

**Status: read-only note.** 8 Nov 2026. No generator change, no balance formula, no new treasure table, and no rename rule. `dungeonCard.ts` is not edited here. The same future lane would own it if a later approved gap is built.

The completion plan's J6 asked what the live generator already rolls, whether any hub sets a hoard, and whether camp rest is already a rule. A separate 7 Nov checklist was not in `docs/` at this read. Items from that date that are not the hoard field, the card's foe and chest rolls, or the 2 Nov camp and rest path are **scope unknown**. They are not treated as gaps.

## What the card already rolls

`buildDungeonCard` (`src/game/dungeonCard.ts`) is deterministic from the save seed and the site name. `openDungeonCard` stores the card on the place and reuses it.

The shape comes from `rollLairShape` (`src/game/lairArchetype.ts`). The kind is `explicit.lair`, else `hub.lairArchetype`, else a theme tag, else `any`. A site whose name matches `\bcamp\b` forces the `camp` row and a boss. `siteNeedsFight` can also force a boss. Danger tier is the hub threat, clamped 1–4. It does not copy the visitor's level onto trash (`dungeonVariety` asserts a level-12 visitor still gets trash at `dangerTier`).

`LAIR_BOUNDS` is the seeded band for each kind. The file calls it initial tuning, not a measured balance result. This note does not retune it.

| Kind | Boss | Lieutenant | Ordinary-room foe share | Boss chest grade | Side chest grade | Side chests |
| --- | --- | --- | --- | --- | --- | --- |
| hoard | always | never | 0–0.25 | 3 | 1 | 0–1 |
| mine, sewer | sometimes | sometimes | 0.35–0.8 | 2 | 2 | 0–2 |
| cave, crypt | sometimes | sometimes | 0.1–0.45 | 2 | 2 | 1–2 |
| warehouse, engine, keep, any | sometimes | sometimes | 0–0.4 | 2 | 1 | 1–2 |
| camp | always | never | 1 | 2 | 2 | 1 |

`ordinaryPlacement` puts the lieutenant in one ordinary slot inside that share, then trash in the rest. A shape with no boss still gets at least one side chest.

Theme (`THEMES` in `dungeonCard.ts`) is the first regex hit on hub name plus blurb: crypt, mine, sewer, warehouse, engine, keep, cave, camp, or the default. It supplies room names and the fallback foe and boss names (`Crypt Ghoul` / `Crypt Warden`, and the other rows). Hub encounter cards override those names when `foePool` finds seeds for that hub.

Layout is `generateInterior`: one floor, or two when danger is 3+, the name asks for it, or the seed draws it. Camp theme is one floor. Secrets use `secretChance` 0.6.

Per room, after the shape:

- An ordinary mob slot gets one trash mob at the danger level, tag `combat`.
- The lieutenant, when the shape has a boss room, is one `miniBoss` mob in an ordinary room.
- The room whose role is `boss` gets one mob with role `miniBoss`, level `danger + 1`, node tag `mini_boss`, and one chest. `MobRole` also includes `boss`. This builder does not push role `boss`.
- Side chests, up to `sideChests`, sit on cache, then secret, then ordinary rooms. Grades are `CHEST_GRADE_LABELS`: 1 Bronze, 2 Silver, 3 Gold (`src/game/dungeonSeed.ts`). The hoard row's boss chest is grade 3. The seeded loot object is rarity Common and `qty` equal to the grade. Coin and item rolls happen when a chest is opened, in `lootTableRegistry.ts` (`DND_COINS` uses the in-house hoard table for boss, rare encounter, and gold-chest profiles). That is separate from `lairArchetype`.
- About three in ten ordinary rooms get a perception trap. Cache rooms get a trap. Some rooms get a secret clue. Secret links can open a hidden room.

A mob fraction draw of 0 on a row whose bottom is 0 is a delve with no ordinary foes. The comment on `DungeonCardProfile` calls that a noncombat delve. Camp's share is 1, so a camp-named site is not that draw.

No step seeds a friendly person or a captive. Road camps rename mobs; they do not add a non-mob person.

## Hoard field

`OutdoorHub.lairArchetype` is optional and only `'hoard'` (`src/game/outdoorHubs.ts` and the edge copy `supabase/functions/_shared/gm/outdoorHubs.ts`). No hub object sets it. A site named "Dragon Hoard" or "Dragon's Lair" does not receive a grade-3 chest unless the caller passes `{ lair: 'hoard' }` (`dungeonVariety` expects the name-only cards to have no grade of 3 or more). The generator does not rename a dragon. Nothing in this read approves a dragon rename, and none is proposed.

The hoard bounds can still run when a caller passes `lair: 'hoard'`. Live site open uses `buildDungeonCard(state, hubName)` with no explicit lair (`openDungeonCard`). So a normal visit does not select the hoard row through the hub field.

**Gap that is real:** the hub field is unused. No outdoor site is marked hoard. That does not by itself mean chests, bosses, or themes are missing. Those already roll, as above.

## Camp and rest

`makeCamp` (`src/game/travelJourney.ts`) is the night on a journey. It sets watches (`CAMP_WATCHES`), rolls one meeting check per watch, applies rations and malnutrition on modes that use travel survival, then calls `applyCampRest`. A hostile meeting breaks the rest. `applyCampRest` (`src/game/recoveryRules.ts`) is the SRD rest: long, or short when the house rule is gritty. It does not require a safe hub. The camp theme's room names include Fire Ring and Cook Fire. Those are room labels, not a rest action.

`applyRestHeal` also handles a rest sentence: an outdoor short rest for litrpg and story RPG, and the SRD hub rest. A line that asks for a night's sleep still takes the long rest.

"A campfire still warm beside the path" is one string in `TRAVEL` signs (`src/game/rules/travelDay.ts`). A playtest asserts campfire prose can survive a beat. Neither is a rest rule.

**Present:** road camp as a card, journey camp as watches plus `applyCampRest`, and outdoor or hub rest from a rest sentence. **Not a separate unverified system:** a campfire object that is itself a rest. No 2 Nov document in `docs/` added a further camp rule beyond what these functions do. If that date required something else, it was not in this tree, and it is scope unknown.

## What is not a gap

- Theme-named trash, lieutenant, and a boss-room `miniBoss`, with levels from the site tier.
- Side chests and a boss-room chest, grades from the lair row, contents resolved on open.
- Traps and secret rooms.
- A stored card that survives leave and return.
- Journey camp rest and the outdoor short rest.
- An in-house hoard coin table used by boss and gold-chest profiles.

## What remains

1. No hub sets `lairArchetype: 'hoard'`, so the hoard band is not selected by a site record on a normal visit.
2. The card does not seed friendly people or captives. That absence is the rescue spec's subject, not a second contents formula.
3. Any other 7 Nov contents item that is not stated in this tree is scope unknown.

No balance pass and no generator edit follow from this note.
