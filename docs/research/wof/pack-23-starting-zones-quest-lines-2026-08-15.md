# Pack 23 — Starting zones and quest lines (prep catalog)

**Not live SynapticGM.** Catalog of what `wof/src/packs/zones/` encodes. Code owns objectives, gold, and XP.

Tide Covenant is a **faction**. Saltkin is a **race**. No Saltkin-named creatures.

Capitals Ash Seat and Tidehold exist as unconnected places. No walk from starts yet.

## Hearthborn — Reedfen (Ash Compact)

Hub: Reedfen Square. Starter: cutting knife + Reedfen map. First hour: `quest_hearthborn_race_1`.

| Line | 1 | 2 | 3 (hidden if race) |
|------|---|---|---------------------|
| Race | The Hearthborn's Request — marsh, 3 hatchlings, scale to Elder Mara | Warmth in the Marsh — marsh edge, 1 lurker, talk Mara | The Elder's Trust — 5 heartstone shards to Mara |
| Profession (miller) | Apprentice — 10 marsh grain to Tobin | Journeyman — mill, 5 mill rats, millstone fragment | Master — polished grain + millstone core to Tobin |
| Zone | Trouble at the Pier — pier, talk Watcher Dell | The Lurker's Trail — edge, 3 lurkers, lurker eye | Clearing the Reedfen — Lampwood Gate, Warden, talk Mara |

5-man: Lampwood Gate (Reedfen edge). Local: marsh hatchlings and a stuck mill.

## Lanternfolk — Lampwood (Ash Compact)

Hub: Wickhaven. Starter: oak staff + Lampwood map. First hour: `quest_lanternfolk_race_1`.

| Line | 1 | 2 | 3 |
|------|---|---|---|
| Race | Keep the Path Lit — path, 3 path moths, spent wick to Pathwarden Sila | The Unlit Bend — bend, 1 unlit sprout, talk Sila | Sila's Watch — 5 path glass to Sila |
| Profession (wick) | Apprentice — 8 spent wicks to Cal | Journeyman — loft, 5 wick beetles, 4 fresh wicks | Master — keeper lens to Cal |
| Zone | Lamps Going Out — Ember Cut, talk Guide Brann | Watch-Lantern Dark — watch, 3 shade deer | The Hollow Mouth — mouth, Hollow Keeper, talk Sila |

5-man: Unlit Hollow. Local: lamps going out on the path.

## Saltkin — Brinewatch (Tide Covenant)

Hub: Brinewatch Dock. Starter: iron hatchet + Brinewatch map. First hour: `quest_saltkin_race_1`.

| Line | 1 | 2 | 3 |
|------|---|---|---|
| Race | The Flats Are Wrong — tidal flats, 3 brine eels, eel skin to Tide-reader Nesh | Runners Off the Tide — stilt walk, 1 flat runner, talk Nesh | Nesh's Mark — 5 tide marks to Nesh |
| Profession (fisher) | Apprentice — 8 dried catch to Fisher Pell | Journeyman — drying racks, 5 stilt crabs, coil hook | Master — tide marks + hook to Pell |
| Zone | Water in the Store — Covenant Hall, talk Hall Voice Orin | Leeches on the Stilts — stilts, 3 coil leeches | Clear the Flood Store — store, Warehouse Warden, talk Nesh |

5-man: Coil Warehouse. Creatures: brine eel, stilt crab, tide gnat, flat runner, coil leech, warehouse warden.

## Stonevein — Granite Stair (Tide Covenant)

Hub: Anvil Gate. Starter: stone maul + Granite Stair map. First hour: `quest_stonevein_race_1`.

| Line | 1 | 2 | 3 |
|------|---|---|---|
| Race | The Stair Has a Crack — stair, 3 stair mites, cracked oath-stone to Stair-oath Kell | Cut Face Listening — cut face, 1 ore lurker, talk Kell | Kell's Oath — 5 ore samples to Kell |
| Profession (smith) | Apprentice — 8 slag chips to Smith Vorr | Journeyman — oath hall, 5 slag crawlers, temper bit | Master — ore samples + temper bit to Vorr |
| Zone | Something Grinds Below — ore siding, talk Siding Rusk | Slag Run Echo — slag run, 1 oath echo | The Hollow Stair — hollow, Anvil Warden, talk Kell |

5-man: Anvil Deep. Local: a crack in the stair, not a world-ending vein.

## Checks

`npm run wof:check` — pack validates; each race spawns at its hub and can walk the first exit.
