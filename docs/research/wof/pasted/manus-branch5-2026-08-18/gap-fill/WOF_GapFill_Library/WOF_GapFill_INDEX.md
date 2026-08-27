# WOF Gap-Fill Index

**Deliverable:** `WOF_GapFill_INDEX.md`  
**Scope:** Quarantined World/Original/Fiction (WOF) typed-data gap fill only.  
**Pack format:** `packFormatVersion: 1`  
**Product label:** solo / private co-op / limited online region.  
**Source baseline:** Ash Compact and Badge Circuit content packs; this index does not rewrite either setting bible.  

> This index inventories the complete WOF gap-fill set for coder ingestion. It contains no production application code, no live SynapticGM import, no map regeneration, and no 3D asset requirement. Housing, auction, vendors, moderation, telemetry, and progression data are generated as quarantined data so later coding gates are unblocked.

## 1. Ingestion order

| Order | File | Format | Ingest first when | Primary dependency | Expected result |
|---:|---|---|---|---|---|
| 1 | `WOF_GapFill_INDEX.md` | Markdown | Every run | None | Manifest, counts, gates, and integrity acceptance record. |
| 2 | `WOF_Rename_Table.md` | Markdown | Before any string import | Locked names and dump corrections | Rejects obsolete dump strings without changing locked IDs. |
| 3 | `WOF_Engine_Schemas.yaml` | YAML | Before all typed content | Engine locks | Establishes shared entities, field types, enums, defaults, ownership, and failure handling. |
| 4 | `WOF_Interactables_Buildings_Housing.yaml` | YAML | After schemas | `PlaceDef`, `InteractableDef`, `PropInstance`, `Deed`, `InteriorGraph` | Provides the shared text-building/object and housing catalog. |
| 5 | `WOF_AshCompact_LockedIds_Typed.yaml` | YAML | After schemas and rename table | Ash Compact locked IDs | Converts the existing Compact baseline into typed places, quests, talks, vendors, drops, interiors, travel, and progression. |
| 6 | `WOF_Rules_Modules.yaml` | YAML | Before instance and combat content | Shared engine schemas | Defines the numeric ledgers and resolution contracts for all WOF theme modules. |
| 7 | `WOF_Vendors_Crafting_Gathering.yaml` | YAML | After places and interactables | Ash Compact typed places and item templates | Adds merchants, personal stock, gathering nodes, recipes, food buffs, repair, banks, and stash rules. |
| 8 | `WOF_Badge_Circuit_Fill.md` | Markdown | After shared schemas and rules | Existing Badge Circuit pack | Fills the only permitted thin pack to primary-start depth without cloning licensed superhero media. |
| 9 | `WOF_Social_Mail_Moderation.md` | Markdown | After schemas | Friends, party, mail, moderation entities | Defines hub speech, emotes, social controls, reports, mail templates, presence, and finder copy. |
| 10 | `WOF_Combat_Instance_Net.md` | Markdown | After rules and schemas | Party, instance, token, receipt, lockout entities | Specifies data/protocol lifecycle, reconnect, disconnect, targeting, loot idempotency, traps, and status effects. |
| 11 | `WOF_Copy_Mail_UI_Errors.md` | Markdown | After social and engine contracts | UI, mail, moderation, accessibility schemas | Supplies player-facing English v1 strings, error codes WOF-E001–WOF-E080, honest store copy, and support macros. |
| 12 | `WOF_Ops_Telemetry_Flags.md` | Markdown | After all core data | Feature flags and telemetry entities | Defines kill switches, flags, 40 telemetry events, capacity assumptions, deletion fields, admin actions, and eval probes. |
| 13 | `WOF_PerWorld_Skin_Deltas.md` | Markdown | Last content layer | Shared catalogs plus 23 world IDs | Applies short per-world public-name and chrome remaps without duplicating maps, quests, or engines. |
| 14 | `WOF_Progression_LiveOps.yaml` | YAML | After Compact typed data | Character, quest, wallet, clock, faction entities | Adds Compact XP, contracts, standing, achievements, collection, festivals, cosmetic login rewards, and cosmetic weather/tide gates. |
| 15 | `WOF_Character_Alts_Safety.yaml` | YAML | After schemas and moderation | Account, character, family, trade, report entities | Defines cosmetic alts, family sharing, name safety, Kid Mode rewrite/skip, scam counters, and no-transfer rules. |
| 16 | `WOF_Lore_Readables.yaml` | YAML | Optional after Compact typed data | Place and item IDs | Adds 40 short Compact notes and plaques; no hidden-quest spoilers. |
| 17 | `WOF_Travel_Taxi_Ferry.yaml` | YAML | Optional after typed places | Place exits and wallet rules | Provides coach/ferry graphs with explicit gold and turn costs. |
| 18 | `WOF_Memorable_Text_Plates.md` | Markdown | Optional presentation layer | Quest and instance state labels | Provides text-only opening, first clear, first death, and true-ending plates. |
| 19 | `WOF_Audio_Cue_List.md` | Markdown | Optional Theme Kit layer | UI and combat event IDs | Lists cue IDs only; it does not contain or generate audio files. |

The first coding slice is **Reedfen loop + solo five-person instance + nearby presence**. Housing and auction house are later feature gates, but their data files remain part of this run so implementation is not blocked by missing contracts.

## 2. File inventory and row-count contract

Counts below are the minimum ingestible row counts for the completed gap-fill set. YAML counts refer to typed top-level records or explicitly named catalog rows; Markdown counts refer to data rows, templates, cases, checklist entries, or other discrete records. Nested fields are not silently counted as separate files.

| File | Required | Format | Minimum rows / records | Coverage summary | Coder ingest target |
|---|---|---|---:|---|---|
| `WOF_GapFill_INDEX.md` | Yes | Markdown | 25 checklist lines + 19 manifest rows | Complete manifest, order, gates, and integrity checks. | Validate file set before parsing. |
| `WOF_Rename_Table.md` | Yes | Markdown | 10 correction rows + rejected-title rows | Gloam rename, Menagerie slug rename, module slug, big-instance lock, faction/race/type corrections, and Ash quest display aliases. | Normalize strings before ID validation. |
| `WOF_Engine_Schemas.yaml` | Yes | YAML | 75 named schemas | All required account, session, social, economy, world, combat, moderation, family, and manifest schemas. | Generate shared validators and ownership boundaries. |
| `WOF_Rules_Modules.yaml` | Yes | YAML | 13 modules × 8 status effects × 12 verbs × 5 UI templates × 10 probes | Complete numeric module contracts for `hp_check`, `hp_check_floor_flags`, `bond_type`, `ship_board`, `frame_heat`, `score_set`, `steadfast`, `card_lane`, `cozy_tick`, `bond_heart`, `heat_wanted`, `realm_gate`, and `hunt_part`. | Load ledger defaults and deterministic round resolvers. |
| `WOF_Interactables_Buildings_Housing.yaml` | Yes | YAML | 80 interactable verbs + 60 prop templates + 21 building types + 6 Compact plot rows + 80 furniture rows + 7 functional furniture rows + 8 rename families | Shared text-building/object catalog, interiors, housing scarcity, recipes, upkeep, seizure, guests, and per-world labels. | Build one shared interaction and housing engine. |
| `WOF_AshCompact_LockedIds_Typed.yaml` | Yes | YAML | 32 locked places + 1 Divide node + 8 travel nodes + 72 locked quest records + 18–25 beats per start + 14 durable NPC trees + 12 choices per start + 2 capital hubs + 16 capital POIs + 12 board quests + 4 dungeons + 1 three-phase raid | Preserves every locked place, quest, dungeon, race start, and Millstone Hollow 10-man structure while adding only new IDs for gap-fill beats and travel. | Seed Ash Compact content after schema validation. |
| `WOF_Vendors_Crafting_Gathering.yaml` | Yes | YAML | 8 vendor families + 24 Compact gathering nodes + 8 shared pattern nodes + 40 Compact recipes + 20 housing recipes + 8 food buffs + 4 bank-label rows | Personal merchant copies, capitals, repairs, gathering caps, no-brick recipes, food effects, and stash tabs. | Populate economy without shared treasury depletion. |
| `WOF_Badge_Circuit_Fill.md` | Yes | Markdown | 4 starts + 4 patrol hubs + 18 primary quests + 6 full NPC trees + 1 five-person instance + 40+ ban-list terms + 1 Theme Kit row | Original Morrowglass civic patrol content at Ash start depth. | Load as a separate world pack, never merge maps. |
| `WOF_Social_Mail_Moderation.md` | Yes | Markdown | 40 canned lines + 10 per-world remap rows + 25 mail templates + 12 report categories + 10 presence/finder rows | Social, mail, mute/block/report, presence count-and-race pattern, and v2 listing-board schema. | Apply rate limits and privacy-safe copy. |
| `WOF_Combat_Instance_Net.md` | Yes | Markdown | 10 lifecycle states + 10 disconnect cases + 24 status effects + 12 Compact trap/door examples + 10 phone-raid rows | Protocol/data contract only: lockstep rounds, checkpoint wipe, reconnect, receipts, personal loot, and no mid-combat fill. | Implement deterministic state transitions separately from prose. |
| `WOF_Copy_Mail_UI_Errors.md` | Yes | Markdown | 7 HUD rows + 20 empty states + 80 error rows + 15 support macros + 10 push rows + 6 age/accessibility rows | English v1 UI, errors, character creation, death/repair/inn copy, store honesty, ratings, accessibility, and support. | Keep player copy honest and non-licensed. |
| `WOF_Ops_Telemetry_Flags.md` | Yes | Markdown | 20 kill switches + 8 feature-flag rows + 40 telemetry rows + 30 eval probes + 12 admin actions + 6 migration/privacy rows | Operational data only, including speculative capacity numbers, GDPR fields, hashed account telemetry, and pack migration hook. | Wire controls before enabling optional features. |
| `WOF_PerWorld_Skin_Deltas.md` | Yes | Markdown | 23 world rows + 10 remap columns + 23 Kid Mode rows | Housing labels, clock flavor, public names, raid/big-night distinction, two-wallet chrome, and Kid Mode bans for every world. | Apply presentation deltas by `worldId`; do not duplicate engines. |
| `WOF_Progression_LiveOps.yaml` | Yes | YAML | 30 XP rows + 10 contracts + 7 standing ranks + 30 achievements + 3 collection categories + 12 festival rows + 2 cosmetic gates + 1 login-reward policy | Compact-only progression with no rested XP, no paid refresh, local faction trust, and cosmetic-only rewards. | Commit progression in CODE; narrate only afterward. |
| `WOF_Character_Alts_Safety.yaml` | Yes | YAML | 4 slot/default rows + 12 appearance fields + 15 scam counters + 10 Kid filters + 6 family/trade/transfer policies | Cosmetic alts, tutorial skip, names, family share, safety filters, scam signals, and explicit no transfer/world hop. | Enforce safety and ownership in CODE. |
| `WOF_Lore_Readables.yaml` | Optional | YAML | 40 readable rows | Compact notes and plaques, each under 80 words. | Add after place IDs exist. |
| `WOF_Travel_Taxi_Ferry.yaml` | Optional | YAML | 12 coach/ferry edges | Explicit travel costs and turns, with no teleport. | Merge only with validated exits. |
| `WOF_Memorable_Text_Plates.md` | Optional | Markdown | 4 plates | Text-only milestone plates with no image pipeline. | Add to presentation layer. |
| `WOF_Audio_Cue_List.md` | Optional | Markdown | 10 cue rows | Names only for Theme Kit SFX. | Map to an external audio implementation later. |

## 3. Locked identity and rename policy

The following identifiers are immutable in the Ash Compact typed conversion: `poi_reedfen_square`, `poi_millcross`, `poi_reedfen_marsh`, `poi_reedfen_hall`, `poi_reedfen_pier`, `poi_reedfen_mill`, `poi_reedfen_crossroads`, `poi_reedfen_marsh_edge`, `poi_lampwood_gate`, `poi_wickhaven`, `poi_lampwood_path`, `poi_wickhaven_loft`, `poi_ember_cut`, `poi_watch_lantern`, `poi_unlit_bend`, `poi_hollow_mouth`, `poi_brinewatch_dock`, `poi_coil_pier`, `poi_tidal_flats`, `poi_covenant_hall`, `poi_drying_racks`, `poi_stilt_walk`, `poi_flood_store`, `poi_anvil_gate`, `poi_granite_stair`, `poi_oath_hall`, `poi_ore_siding`, `poi_cut_face`, `poi_slag_run`, `poi_hollow_stair`, `poi_ash_seat`, and `poi_tidehold`.

Locked quest IDs and titles remain unchanged, including `quest_hearthborn_race_1` — **The Hearthborn's Request**, `quest_lanternfolk_race_1` — **Keep the Path Lit**, `quest_saltkin_race_1` — **The Flats Are Wrong**, and `quest_stonevein_race_1` — **The Stair Has a Crack**. New beats use new IDs only. `poi_the_divide` and its road/ferry nodes are additive travel records; they do not replace capitals or start hubs. `Millstone Hollow / The Millwarden` remains a 10-person, three-phase instance.

All dump corrections are recorded in `WOF_Rename_Table.md`. In particular, `Tide Covenant` remains a faction, `Saltkin` remains a race, the four named peoples remain races, and no Saltkin-named fauna is permitted. First-Song's former **Gloam Court Siege** receives a new original public name while retaining its encounter structure. Bonded Menagerie's `saltwind_keeper` receives a new slug and public name. The Isekai rules module uses exactly `hp_check_floor_flags`. Bonded Menagerie treats the five-person Fair as the start big night; Migration Night 10 is Mid+ optional.

## 4. Engine and product gates

Every file assumes one engine with many packs. CODE owns dice, HP, catalogs, quest ticks, loot, gold, lockouts, instance seeds, wallet mutations, trade settlement, and clock catch-up. The LLM may narrate only after committed state and may not invent damage, ownership, rewards, gold, standing, kill counts, room completion, or outcomes. Ordinary parties are 2–5, raid combat skins are 10, combat is instanced and lockstep, loot is personal, wipes return to checkpoints, and there is no mid-combat fill.

The two wallets remain separate: gold and cosmetic tokens. The v1 economy forbids gacha, loot boxes, stat-power cash shop items, lockout skips, catch-rate packs, outcome sales, raid clears, gambling, and guild banks. Character slots are four per world, delete cooldown is seven days, bank/stash is personal with four tabs, and housing guests cannot loot chests. The server clock is a weekly tick with a maximum four-week catch-up and one digest mail; the LLM never mints gold, rent, or sales.

## 5. Twenty-five-line integrity checklist

1. The exact filename is `WOF_GapFill_INDEX.md`.
2. Every mandatory WOF file is listed in the inventory table.
3. Optional files are clearly marked optional and do not replace mandatory files.
4. All YAML deliverables use `packFormatVersion: 1`.
5. Locked Ash Compact place IDs are preserved.
6. Locked Ash Compact quest IDs are preserved.
7. Locked Ash Compact quest titles are preserved.
8. `poi_the_divide` is additive and has no teleport semantics.
9. Start hubs connect through The Divide to the correct faction capital.
10. `Millstone Hollow / The Millwarden` remains 10-person and three-phase.
11. First-Song's Gloam dump title is not used as the final public title.
12. Bonded Menagerie's `saltwind_keeper` slug is not used as the final slug.
13. The Isekai module slug is exactly `hp_check_floor_flags`.
14. `Tide Covenant` is treated as a faction, never a race or region.
15. `Saltkin` is treated as a race, with no Saltkin-named fauna.
16. No ignored dump title is promoted into a world, faction, creature, or product label.
17. No 3D meshes, models, image pipeline, or production assets are required.
18. No live SynapticGM import, save import, or live clock tick is specified.
19. The world model is Tier 3 shared hubs plus instanced combat.
20. Party size is 2–5 for ordinary content and raid size is 10 only where locked.
21. Personal loot and idempotent loot-grant keys are mandatory.
22. Mid-combat fill is disabled; filling occurs only at a checkpoint.
23. Gold and cosmetic tokens remain separate wallets.
24. Kid Mode, privacy-safe presence, no global chat v1, and friends-first finder are retained.
25. Player-facing copy uses only solo, private co-op, or limited online region claims.

## 6. Acceptance statement

The gap-fill set is acceptable when the files above exist under the exact names, all minimum row counts are met, IDs are unique within their namespace, locked names survive conversion, rename corrections are applied only through the rename table, and the checklist passes. The Reedfen loop, a solo five-person instance, and nearby presence are the friends-alpha bar; housing and auction house remain later gates but their typed data must still be present.

**Download every WOF_* file from the file tree.**

[1]: /home/ubuntu/WOF_Content_Packs/WOF_ash_compact_Pack.md "Ash Compact WOF content pack"
[2]: /home/ubuntu/WOF_Content_Packs/WOF_badge_circuit_Pack.md "Badge Circuit WOF content pack"
