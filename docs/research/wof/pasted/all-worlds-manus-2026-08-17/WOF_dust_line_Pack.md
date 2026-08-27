# WOF World Pack: Dust Line

## 0) Header

| Field | Value |
|---|---|
| `worldId` | `dust_line` |
| Display name | Dust Line |
| One-line pitch | A frontier of rail towns, dry riverbeds, and hard bargains where a small crew protects a settlement without becoming its next tyrant. |
| Maturity | Teen |
| `rulesModuleId` | `hp_check` |
| Theme Kit | `dust_line_sunbleached` |
| Genre pattern | Original frontier western adventure about escort work, water rights, rail sabotage, and community trust. |
| Fence | This is **not** a licensed western, not a historical reenactment, and not a retelling of any famous gunslinger, frontier, or train-robbery story. |

**Ban-list.** This world must reject the following licensed or highly recognizable lookalike names and identity markers: Red Dead Redemption, John Marston, Arthur Morgan, Dutch van der Linde, Blackwater, Valentine, Armadillo, Rockstar, Tombstone, Wyatt Earp, Doc Holliday, Billy the Kid, Jesse James, Calamity Jane, Butch Cassidy, Sundance Kid, The Magnificent Seven, The Good the Bad and the Ugly, Clint Eastwood, Sergio Leone, Spaghetti Western, High Noon, Shane, The Searchers, True Grit, Rooster Cogburn, Deadwood, Al Swearengen, Westworld, The Lone Ranger, Tonto, Zorro, Django, Hateful Eight, Unforgiven, Bonanza, Gunsmoke, Rawhide, Yellowstone, Frontierland, Six-shooter, Colt, Winchester, Gatling, Union Pacific, Central Pacific, Pony Express, Wells Fargo, Pinkerton, Texas Ranger, cowboy bebop, Firefly, Serenity, Borderlands, Fallout, Mad Max, The Last of Us, Dune, Arrakis, and any direct imitation of their characters, locations, slogans, costumes, plots, or signature props. These are exclusion terms, not setting content.

All cultures, territories, creatures, and institutions below are original inventions. Any frontier folklore resonance is genre texture only.

## 1) Rules module: `hp_check`

The ledger owns `hp_current`, `hp_max`, `stamina`, `armor_class`, `weapon_condition`, `threat_state`, `quest_state`, `inventory`, `gold`, `cosmetic_tokens`, `place_id`, `checkpoint_id`, `weekly_boss_lockout`, and `divergence_records`. Damage, healing, hit resolution, conditions, rewards, kills, and doors are committed by code before narration. Overworld travel uses shared hubs and private combat rooms; it is not contested open-world PvP.

A wipe returns the party to the latest checkpoint, consumes no quest item, and preserves completed objectives. A five-person room has a weekly per-character boss lockout; personal loot is rolled independently. Party size is 2–5, with a 10-person optional combat skin for the big instance. Friends-first finding and nearby presence use only `nearbyPlayerCount` and visible race/kit labels.

Prose is forbidden from inventing damage numbers, loot, gold, kill confirmation, quest completion, checkpoint creation, boss clearance, or a promised door. It may describe dust, sound, weather, and character emotion only after state is committed. Visible journal objectives remain truthful.

### Diegetic chrome templates

```text
[FIELD LEDGER] HP {hp_current}/{hp_max} | Guard {armor_class} | Condition {weapon_condition}
[TRAIL NOTICE] Route {route_id} | Wind {wind_state} | Threat {threat_state} | Checkpoint {checkpoint_id}
[BOUNTY SLIP] Target {target_id} | Required {count}/{required} | Pay {reward_gold} gold on verified return
[POSSE STATUS] {party_count}/5 present | Private room ready: {instance_id}
[VERDICT STAMP] {quest_id} | {objective_id} recorded | Journal updated
[LOCKBOX] Personal draw: {item_id} | Gold {gold_amount} | Cosmetic tokens unchanged
```

## 2) Identity kits

| Kit ID | Look and values | Taboo / speech tell | Starter clothes and weapon | Map / start / first-hour quest | Ability flag | Originality note |
|---|---|---|---|---|---|---|
| `prairie_surveyor` | Sun-darkened coat, brass measuring chain; values evidence and patience. | Never falsify a boundary; says “measure twice.” | Canvas duster, chalk vest, survey carbine. | `cinder_gulch`; `cinder_gulch`; `survey_the_wash` | `read_ground` | A field-mapper kit, not a named franchise ranger. |
| `rail_guard` | Padded work jacket, red scarf, calm protective stance; values duty and passengers. | Never abandon a wagon; says “eyes on the rear.” | Riveted vest, guard shotgun. | `ironmile`; `ironmile`; `guard_the_switch` | `brace_line` | An original rail escort role, not a famous lawman. |
| `water_runner` | Blue-gray neck cloth, sealed canteens, quick hands; values access and reciprocity. | Never hoard a public cistern; says “share the last cup.” | Oilskin vest, lever bow. | `dry_basin`; `dry_basin`; `mark_the_cistern` | `find_seep` | A community water courier, not a desert nomad copy. |
| `scrapwright` | Patchwork leather, copper goggles worn on the brow; values repair over prestige. | Never strip a working tool; says “nothing is finished.” | Tool apron, rivet pistol. | `red_canyon`; `red_canyon`; `mend_the_windmill` | `field_repair` | A frontier mechanic kit with distinct stakes and language. |

## 3) Map / places

The travel graph is `cinder_gulch -> the_long_grade -> dustmere -> union_of_four -> sagehold` and `ironmile -> the_long_grade`; `dry_basin -> saltglass_road -> dustmere`; `red_canyon -> switchback_pass -> dustmere`. From `dustmere`, `northwatch` and `sagehold` are reached by paid, non-teleport travel. `sagehold` and `northwatch` are the two end-of-start capitals; `the_long_grade` is the mid-world join. Instance doors are place records, not teleport spells.

| Start zone | Hub | POIs (`id`: public name; scale / danger / outdoor; exits; NPCs; door) |
|---|---|---|
| `cinder_gulch` | `ember_post` (Ember Post) | `gulch_gate`: Gate of Cinder; street/safe/outdoor; exits `gulch_switch`, `ember_post`; `mara_voss`, `deputy_ren`; `gulch_switch`: Bent Switch; street/low/outdoor; exits `gulch_gate`, `chalkwash`; `ren`, `mara_voss`; `chalkwash`: Chalkwash Creek; street/low/outdoor; exits `gulch_switch`, `survey_roost`; `talla_reeve`, `jun_ash`; `survey_roost`: Survey Roost; street/safe/outdoor; exits `chalkwash`, `long_grade`; `talla_reeve`; `ember_post`: Ember Post; street/safe/outdoor; exits `gulch_gate`, `freight_yard`; `mara_voss`, `orren`; `freight_yard`: Freight Yard; street/low/outdoor; exits `ember_post`, `switchyard_door`; `orren`, `ren`; `switchyard_door`: Switchyard Door; dungeon/medium/indoor; exits `freight_yard`; `orren`; dungeon `switchyard_sundering`. |
| `ironmile` | `brass_ticket` (Brass Ticket) | `mile_gate`: Ironmile Gate; street/safe/outdoor; exits `brass_ticket`, `old_trestle`; `sela`, `hobb`; `old_trestle`: Old Trestle; street/low/outdoor; exits `mile_gate`, `water_tank`; `sela`, `boone`; `water_tank`: Water Tank 9; street/low/outdoor; exits `old_trestle`, `boiler_shack`; `hobb`; `boiler_shack`: Boiler Shack; dungeon/low/indoor; exits `water_tank`; `hobb`, `ves`; dungeon `boiler_shack_breach`; `brass_ticket`: Brass Ticket; street/safe/outdoor; exits `mile_gate`, `freight_siding`; `sela`, `ves`; `freight_siding`: Freight Siding; street/low/outdoor; exits `brass_ticket`, `long_grade`; `boone`, `sela`; `signal_box`: Signal Box; dungeon/medium/indoor; exits `freight_siding`; `ves`; dungeon `signal_box_lock`. |
| `dry_basin` | `three_cups` (Three Cups) | `basin_welcome`: Basin Welcome; street/safe/outdoor; exits `three_cups`, `cairn_field`; `nima`, `tor`; `cairn_field`: Cairn Field; street/low/outdoor; exits `basin_welcome`, `old_cistern`; `tor`, `nima`; `old_cistern`: Old Cistern; dungeon/low/indoor; exits `cairn_field`; `nima`; dungeon `cistern_below`; `reed_marker`: Reed Marker; street/low/outdoor; exits `cairn_field`, `glass_track`; `tor`, `pax`; `glass_track`: Glass Track; street/low/outdoor; exits `reed_marker`, `dustmere`; `pax`; `three_cups`: Three Cups; street/safe/outdoor; exits `basin_welcome`, `market_shed`; `nima`, `coro`; `market_shed`: Market Shed; street/low/outdoor; exits `three_cups`; `coro`; `salt_scoop`: Salt Scoop; street/medium/outdoor; exits `glass_track`; `pax`, `tor`. |
| `red_canyon` | `copper_roost` (Copper Roost) | `canyon_gate`: Red Canyon Gate; street/safe/outdoor; exits `copper_roost`, `windmill`; `yara`, `fenn`; `windmill`: Broken Windmill; street/low/outdoor; exits `canyon_gate`, `ravine`; `fenn`, `kito`; `ravine`: Red Ravine; street/medium/outdoor; exits `windmill`, `switchback`; `yara`, `kito`; `switchback`: Switchback Pass; street/low/outdoor; exits `ravine`, `dustmere`; `kito`; `copper_roost`: Copper Roost; street/safe/outdoor; exits `canyon_gate`, `ore_shed`; `yara`, `mell`; `ore_shed`: Ore Shed; dungeon/low/indoor; exits `copper_roost`; `mell`; dungeon `ore_shed_collapse`; `rope_bridge`: Rope Bridge; street/medium/outdoor; exits `ravine`, `canyon_gate`; `fenn`; `red_marker`: Red Marker; street/low/outdoor; exits `ore_shed`, `switchback`; `mell`, `kito`. |

`dustmere` is the mid hub, with `dustmere_station`, `public_scale`, `traveler_yard`, and `promise_board`. `sagehold` is the capital of civic courts and rail offices; `northwatch` is the capital of range patrols and water arbitration. `the_long_grade` contains the physical merge road and a visible fork toward both capitals. Fog-of-war stores `visited=true` only after arrival; unvisited places show an outline, not a claim about enemies. Street maps show pins and exits; indoor maps show a floor plan limited to the room footprint.

## 4) Durable NPCs and canned talk

Each starting zone has six durable NPCs. The table gives identity; the compact talk blocks below provide all required canned lines for every quest-giver and merchant.

| Zone | NPCs |
|---|---|
| `cinder_gulch` | `mara_voss` Mara Voss, hub keeper; `ren_cale` Ren Cale, quest marshal; `talla_reeve` Talla Reeve, surveyor; `jun_ash` Jun Ash, miller; `orren_dale` Orren Dale, merchant; `pike_sorn` Pike Sorn, local. |
| `ironmile` | `sela_quill` Sela Quill, hub keeper; `hobb_rail` Hobb Rail, quest guard; `boone_jar` Boone Jar, signaler; `ves_latch` Ves Latch, merchant; `mira_stone` Mira Stone, mechanic; `calder_nix` Calder Nix, local. |
| `dry_basin` | `nima_sole` Nima Sole, hub keeper; `tor_veil` Tor Veil, quest water steward; `pax_dune` Pax Dune, courier; `coro_melt` Coro Melt, merchant; `lute_ambar` Lute Ambar, mapmaker; `senn_wick` Senn Wick, local. |
| `red_canyon` | `yara_coil` Yara Coil, hub keeper; `fenn_rope` Fenn Rope, quest climber; `kito_bram` Kito Bram, mechanic; `mell_ore` Mell Ore, merchant; `dessa_holt` Dessa Holt, medic; `brin_quo` Brin Quo, local. |

For every quest-giver or merchant, the following deterministic tree is used, with NPC-specific nouns substituted from the table; no improvisation is required.

| NPC IDs | `greet` | `quest_offer` | `quest_progress` | `quest_turnin` | `gossip` (three lines) | `refusal / player-rude` |
|---|---|---|---|---|---|---|
| `ren_cale`, `talla_reeve`, `jun_ash`, `hobb_rail`, `boone_jar`, `mira_stone`, `tor_veil`, `pax_dune`, `lute_ambar`, `fenn_rope`, `kito_bram`, `dessa_holt` | “Boots on the board, traveler.” | “I have a local job: {title}. Will you take its stake?” | “Bring the marked proof; stories do not count.” | “Proof checked. The ledger can pay {reward_gold} gold.” | “The wind changes before the sky does.” / “A neighbor’s promise is worth a stamped page.” / “Ask before crossing a marked line.” | “No. Not while you are threatening people. Return calm, or return never.” |
| `orren_dale`, `ves_latch`, `coro_melt`, `mell_ore` | “Goods are laid out; hands stay honest.” | “I can sell {item_id} for {price_gold} gold.” | “If you bought it, keep the receipt tag.” | “Trade complete. Count it before you leave.” | “Repair beats replacement out here.” / “The best bargain is a safe road.” / “Do not confuse cheap with useful.” | “I will not serve a bully. Step outside and cool your voice.” |
| `mara_voss`, `pike_sorn`, `sela_quill`, `calder_nix`, `nima_sole`, `senn_wick`, `yara_coil`, `brin_quo` | “Welcome to {hub_name}; keep your eyes up.” | “The town needs {local_need}; no badge required to help.” | “I saw you return. Tell me what changed.” | “You carried more than supplies. You carried trust.” | “The road remembers repeated footsteps.” / “A quiet town still has loud problems.” / “The porch is shared space.” | “That is not welcome here. Leave the porch and try again tomorrow.” |

**Canned hub lines, ten per zone.** `cinder_gulch`: “Shade is a public resource.” / “Mark your canteen.” / “The switch rattled at dawn.” / “Miller Jun is short on clean grain.” / “Survey chalk means a promise.” / “Ember Post closes its gate at dusk.” / “No firing across the creek.” / “A fair measure keeps a town standing.” / “The long grade is open.” / “Ask Ren before pursuing a wanted rider.” `ironmile`: “Train bell means clear the crossing.” / “Tank 9 is rationed.” / “Signal flags are not decoration.” / “Keep sparks away from dry ties.” / “Sela records every passenger.” / “The trestle has one safe plank.” / “Boone needs a new lens.” / “The siding is private after sunset.” / “Repair crews eat first.” / “No one rides the roof.” `dry_basin`: “Three cups means three shares.” / “The cistern lid stays sealed.” / “Glass track cuts boot leather.” / “Pax knows the shortest path.” / “Water claims need witnesses.” / “Do not disturb cairns.” / “Nima weighs every barrel.” / “The market opens at first light.” / “A dry promise is still a promise.” / “Northwatch hears formal petitions.” `red_canyon`: “Rope is checked twice.” / “Copper Roost buys clean ore.” / “Windmill parts are scarce.” / “Fenn hates a loose knot.” / “Dessa keeps the infirmary bright.” / “The ravine echoes names.” / “Do not climb alone.” / “Kito can make a tool from scrap.” / “The switchback is public.” / “Yara serves stew until the pot is empty.”

## 5) Premade choices / first hour

Each kit opens with five authored beats: the player sees the local shortage, chooses a first obligation, accepts a tangible stake, witnesses a consequence, and records `identity_confirmed`, `first_choice`, and `observed_consequence`. The stake is always one of: lose a paid escort deposit, spend a scarce water seal, expose a neighbor to a fine, or risk a tool needed for tomorrow’s work.

| Kit | Opening choice deck (buttons) |
|---|---|
| `prairie_surveyor` | `take_the_boundary_job` (requires `survey_chain`, intent `accept_stake`); `protect_the_creek_marker` (place `chalkwash`, `defend_public_access`); `spend_deposit_on_medicine` (item `medicine_wrap`, `sacrifice_gold`); `ask_who_benefits` (talk `ren_cale`, `gather_evidence`); `walk_to_the_switch` (place `gulch_switch`, `inspect`). |
| `rail_guard` | `brace_the_rear_car` (place `freight_siding`, `defend`); `use_the_last_signal_flare` (item `signal_flare`, `accept_cost`); `question_the_conductor` (talk `sela_quill`, `ask`); `escort_the_water_tank` (place `water_tank`, `protect`); `leave_the_train_for_town` (place `brass_ticket`, `prioritize_people`). |
| `water_runner` | `seal_the_public_cistern` (item `cistern_seal`, `repair`); `share_your_canteen` (item `full_canteen`, `pay_stake`); `mark_a_new_seep` (place `reed_marker`, `survey`); `question_the_barrel_broker` (talk `coro_melt`, `negotiate`); `run_for_three_cups` (place `three_cups`, `deliver`). |
| `scrapwright` | `spend_the_bearing` (item `copper_bearing`, `repair`); `hold_the_windmill` (place `windmill`, `defend`); `ask_dessa_for_bandage` (talk `dessa_holt`, `trade`); `salvage_without_stripping` (place `ore_shed`, `collect`); `show_kito_the_sketch` (talk `kito_bram`, `craft`). |

Tutorial forced path, skippable on alternate characters: `arrive_at_start` -> `talk_to_hub_keeper` -> `visit_local_need` -> `collect_marked_proof` -> `fight_first_threat` -> `return_to_quest_npc` -> `spend_reward_or_save` -> `choose_long_grade_route`. Retry fingerprints are fixed: `water_shortage / negotiate / rationed gate / learn the ledger seal / lose one travel hour`; `switch jam / repair / bent lever / discover sabotage / train delayed`; `boundary dispute / inspect / forged marker / see second ink / trust reduced`; `ore collapse / rescue / unstable beam / hear a second tunnel / checkpoint moved`; `night riders / defend / low lantern / recognize town mark / ally injured`; `merchant fraud / compare / false weight / find stamped counterweight / price rises`; `missing child / track / dry wash / find boot print / route revealed`; `public hearing / testify / hostile crowd / produce physical proof / faction stance recorded`.

## 6) Quests: primary-start DAG (`cinder_gulch`)

All objectives are executable types. `rewardGold` and `rewardXp` are numeric.

| ID | Title | Family | Hidden | Unlock | Objectives | Gold | XP |
|---|---|---|---|---|---|---:|---:|
| `survey_the_wash` | Measure the Wash | identity | false | — | `visit_place:chalkwash`; `collect_item:survey_mark:1` | 12 | 30 |
| `claim_the_chain` | A Tool With Teeth | identity | false | `survey_the_wash` | `talk_to_npc:talla_reeve:1`; `deliver_item:survey_chain:1` | 15 | 35 |
| `ink_on_stone` | The Second Ink | identity | false | `claim_the_chain` | `collect_item:forged_boundary_slip:1`; `talk_to_npc:ren_cale:1` | 18 | 45 |
| `millers_first_sack` | Clean Grain, Clean Measure | profession | false | — | `talk_to_npc:jun_ash:1`; `collect_item:clean_grain_sack:2` | 10 | 25 |
| `mend_the_sieve` | Sieve Wire | profession | false | `millers_first_sack` | `collect_item:sieve_wire:3`; `deliver_item:grain_sieve:1` | 16 | 40 |
| `three_bolts` | Three Reliable Bolts | profession | false | `mend_the_sieve` | `collect_item:mill_bolt:3`; `talk_to_npc:jun_ash:1` | 22 | 55 |
| `guard_the_creek` | Keep the Water Public | zone_story | false | `ink_on_stone` | `visit_place:chalkwash`; `ledger_kill:creek_scavenger:4`; `talk_to_npc:mara_voss:1` | 25 | 60 |
| `switchyard_sundering_breadcrumb` | A Spark Under Freight | dungeon | false | `guard_the_creek` | `visit_place:freight_yard`; `collect_item:burnt_switch_pin:1` | 20 | 50 |
| `survey_the_sundering` | Switchyard Sundering | zone_story | false | `switchyard_sundering_breadcrumb` | `visit_place:switchyard_door`; `ledger_kill:ironjaw_raider:6`; `deliver_item:rail_key:1` | 40 | 100 |
| `the_deposit_stays` | No Free Escort | identity | false | `claim_the_chain` | `talk_to_npc:ren_cale:1`; `deliver_item:escort_receipt:1` | 14 | 32 |
| `jun_and_the_jackdaw` | A Bird in the Flour | side | false | `millers_first_sack` | `ledger_kill:flour_jackdaw:3`; `collect_item:lost_scoop:1` | 13 | 28 |
| `porch_witness` | Three Witnesses | side | false | `guard_the_creek` | `talk_to_npc:pike_sorn:1`; `talk_to_npc:orren_dale:1`; `talk_to_npc:talla_reeve:1` | 21 | 52 |
| `hidden_trust_cinder` | The Unmarked Favor | hidden | true | `porch_witness` | `deliver_item:unmarked_water_seal:1`; `talk_to_npc:mara_voss:1` | 30 | 75 |
| `daily_clear_track` | Clear the Track | repeatable_daily | false | `guard_the_creek` | `ledger_kill:dust_mite:5`; `collect_item:track_stone:2` | 8 | 18 |
| `daily_check_canteens` | Count the Canteens | repeatable_daily | false | `millers_first_sack` | `visit_place:ember_post`; `talk_to_npc:jun_ash:1` | 7 | 16 |
| `long_grade_letter` | A Letter for the Grade | extra | false | `survey_the_sundering` | `deliver_item:sealed_rail_letter:1`; `visit_place:long_grade` | 28 | 70 |
| `four_marks_on_a_map` | Four Marks | zone_story | false | `long_grade_letter` | `visit_place:gulch_switch`; `visit_place:chalkwash`; `visit_place:freight_yard`; `collect_item:four_mark_map:1` | 35 | 85 |
| `cinder_gulch_departure` | Leave a Door Unbarred | zone_story | false | `four_marks_on_a_map` | `talk_to_npc:mara_voss:1`; `visit_place:long_grade` | 50 | 120 |

The campaign spine then continues: `grade_ledger` (visit `dustmere_station`, talk `ren_cale`, 60 gold, 140 XP); `two_capital_seals` (deliver `northwatch_seal` and `sagehold_seal`, 75, 180); `public_scale_hearing` (talk `scale_clerk`, collect `witness_bundle`, 90, 210); `the_long_route` (visit `public_scale`, `traveler_yard`, 100, 240); `range_or_rail` (choose `northwatch` or `sagehold`, 110, 260); `first_promise_board` (talk `promise_board_clerk`, 120, 280); `dryline_manifest` (collect `manifest_page:3`, 130, 310); `freight_without_fear` (ledger_kill `line_breaker:8`, 145, 350); `the_arbitration_fire` (visit `arbitration_hall`, deliver `charter_copy`, 160, 390); `dustmere_stands` (talk `dustmere_council`, 175, 420); `capital_contract` (deliver `crew_seal`, 200, 500); `first_northwatch_or_sagehold_case` (complete one capital instance, 250, 650). Each is a distinct DAG node with the previous node as `unlocksQuestId`.

Divergence records are written, never silently forgotten: `backed_the_creek` if the player spends the deposit to protect public water; `backed_the_rail` if they preserve the freight schedule over the hearing; `withheld_testimony` if they refuse to present forged-ink evidence. Each record changes one NPC greeting and one capital contract prerequisite.

## 7) Species / opponents / collectibles

The following are original combat skins; `baseHp`, `baseAtk`, and `ac` are ledger values.

| Start | Species entries (`id` / rarity / habitat / HP / ATK / AC) |
|---|---|
| `cinder_gulch` | `dust_mite` common / wash / 18 / 4 / 10; `flour_jackdaw` common / mill / 22 / 5 / 11; `creek_scavenger` common / creek / 28 / 6 / 12; `cinder_crawler` common / kiln / 32 / 7 / 12; `chalkhorn_goat` common / slope / 35 / 7 / 13; `tinback_turtle` uncommon / creek / 48 / 8 / 14; `silt_mole` uncommon / bank / 44 / 9 / 13; `lantern_wasp` uncommon / scrub / 38 / 11 / 14; `ironjaw_raider` uncommon / freight / 62 / 12 / 15; `red-vein_bandit` uncommon / yard / 70 / 13 / 15; `wash_warden` rare / creek / 95 / 16 / 17; `ashmane_stag` rare / ridge / 88 / 15 / 17; `bellhide_brute` rare / quarry / 110 / 18 / 16; `chalkglass_serpent` epic / wash / 150 / 23 / 19; `switchyard_keeper` epic / dungeon / 190 / 25 / 20; `the_sundered_engine` epic / dungeon / 240 / 29 / 21. |
| `ironmile` | `tie_nibbler` common / rail / 20 / 5 / 11; `steam_moth` common / boiler / 24 / 6 / 11; `tank_leech` common / tank / 30 / 6 / 12; `copper_crow` common / siding / 32 / 7 / 12; `track_hare` common / embankment / 36 / 7 / 13; `brassback_beetle` uncommon / trestle / 50 / 9 / 14; `signal_urchin` uncommon / box / 46 / 10 / 14; `coalspit_lizard` uncommon / boiler / 58 / 11 / 15; `rail_splinterer` uncommon / track / 68 / 13 / 15; `hushmask_thief` uncommon / siding / 72 / 14 / 16; `trestle_owl` rare / trestle / 96 / 16 / 18; `boiler_crowned` rare / boiler / 120 / 18 / 17; `redflag_hound` rare / yard / 105 / 19 / 18; `bellline_wraith` epic / signal / 160 / 24 / 20; `milebreaker` epic / dungeon / 215 / 28 / 21; `the_last_conductor` epic / dungeon / 260 / 31 / 22. |
| `dry_basin` | `cup_cricket` common / market / 16 / 4 / 10; `salt_skimper` common / flats / 25 / 6 / 11; `cairn_mouse` common / cairn / 21 / 5 / 11; `glasswing_fly` common / glass track / 27 / 7 / 12; `barrel_snout` common / cistern / 34 / 7 / 12; `seep_frog` uncommon / seep / 42 / 8 / 13; `sunscale_skink` uncommon / marker / 45 / 9 / 14; `drybell_beetle` uncommon / flats / 51 / 10 / 14; `waterline_thief` uncommon / market / 66 / 13 / 15; `cairn_knocker` uncommon / field / 75 / 12 / 16; `mirrorjackal` rare / glass / 100 / 17 / 17; `cistern_mother` rare / cistern / 125 / 18 / 18; `redtongue_viper` rare / flats / 108 / 20 / 18; `glass_burrower` epic / track / 170 / 25 / 20; `the_empty_barrel` epic / dungeon / 220 / 27 / 21; `saltwind_colossus` epic / flats / 280 / 32 / 22. |
| `red_canyon` | `rope_rat` common / shed / 18 / 5 / 10; `copper_midge` common / ore / 23 / 6 / 11; `windmill_marten` common / mill / 29 / 6 / 12; `ravine_skitter` common / ravine / 34 / 8 / 12; `ore_chewer` common / shed / 39 / 8 / 13; `knotback_lizard` uncommon / rope / 48 / 9 / 14; `canyon_kite` uncommon / cliff / 52 / 10 / 15; `rusthorn_ram` uncommon / pass / 64 / 12 / 15; `ore_saboteur` uncommon / shed / 70 / 14 / 16; `bridge_gnawer` uncommon / bridge / 78 / 13 / 16; `redglass_vulture` rare / cliff / 92 / 17 / 18; `copperhide_bull` rare / canyon / 130 / 18 / 17; `windmill_walker` rare / mill / 118 / 20 / 18; `ropeburn_titan` epic / bridge / 175 / 25 / 20; `the_collapsed_foreman` epic / dungeon / 230 / 29 / 21; `canyon_heart` epic / ravine / 290 / 33 / 22. |

Collectibles use stable IDs: `survey_mark`, `burnt_switch_pin`, `grain_sieve`, `track_stone`, `cairn_rubbing`, `copper_bearing`, `northwatch_seal`, `sagehold_seal`, `four_mark_map`, `old_rail_token`, `windmill_blade_shard`, `public_water_stamp`.

## 8) Loot / economy

Gold is the only gameplay wallet. Cosmetic tokens are a separate wallet and never purchase weapons, catch chance, damage, repairs, or lockout skips. Starter templates are `survey_carbine`, `guard_shotgun`, `lever_bow`, `rivet_pistol`, `canvas_duster`, `rail_padded_vest`, `sealed_canteen`, and `chalk_map`. Profession outputs are `clean_grain_sack`, `mill_bolt`, `signal_lens`, `cistern_seal`, `rope_splice`, and `copper_bearing`. Dungeon drops are `switch_key_teeth`, `boiler_lens`, `glass_cistern_plug`, and `canyon_anchor`; cosmetic-only drops are `red_scarf_dye`, `brass_spur_ornament`, `dustveil_hatband`, and `copper_roost_badge`.

| Source | Personal-drop table |
|---|---|
| `switchyard_sundering` trash | 60% `track_stone` x1, 25% `burnt_switch_pin` x1, 15% `old_rail_token` x1 |
| `switchyard_keeper` elite | 45% `switch_key_teeth`, 35% `survey_mark`, 20% `dustveil_hatband` |
| `the_sundered_engine` boss | 50% `engine_gear_fragment`, 30% `public_water_stamp`, 20% `cinder_badge` |
| `boiler_shack_breach` boss | 55% `boiler_lens`, 25% `signal_lens`, 20% `brass_spur_ornament` |
| `cistern_below` boss | 55% `glass_cistern_plug`, 25% `cistern_seal`, 20% `waterline_sash` |
| `ore_shed_collapse` boss | 55% `canyon_anchor`, 25% `copper_bearing`, 20% `copper_roost_badge` |

Vendors sell starter repairs and supplies for 3–28 gold, profession materials for 4–19 gold, and cosmetics for 20–90 gold. `repairCostPerPoint=2` gold, capped at 40 gold per item per visit. Faucets are quest rewards, verified bounties, profession orders, and instance personal drops. Sinks are repairs, travel fares of 5–18 gold, food of 2 gold, and map stamping of 6 gold. A character may earn at most 220 quest/bounty gold from repeatable daily contracts per day; cosmetics have a 120-token weekly earn cap. Collection log entries cover all 64 regional species, 12 landmarks, 8 profession outputs, 10 cosmetics, and 4 dungeon bosses.

## 9) Instances

### Soloable five-person equivalent: `switchyard_sundering`

It is soloable with companion support and balanced for 2–5 players. Room descriptions always precede creature resolution.

| Room | Description before creature | Trash | Elite / checkpoint / boss | Exits |
|---|---|---|---|---|
| `switchyard_gate` | A rainless yard of leaning rails; a dead signal lamp clicks in the heat. | `dust_mite` x4 | none | `switchyard_cablewalk` |
| `switchyard_cablewalk` | Copper cables cross a trench under warped boards; every step rings. | `ironjaw_raider` x3 | `signal_urchin` x1 elite | `switchyard_locker` |
| `switchyard_locker` | A narrow locker room smells of oil and old paper; a red route card is nailed to the wall. | `red-vein_bandit` x3 | checkpoint `switchyard_cp_1` | `engine_bay` |
| `engine_bay` | The engine bay is a cathedral of broken pistons, with one hot line pulsing behind a grate. | `rail_splinterer` x4 | `switchyard_keeper` x1 elite | `sundered_platform` |
| `sundered_platform` | The final platform hangs over a dry cut; the engine’s cracked bell moves though nobody pulls it. | `ironjaw_raider` x2 | boss `the_sundered_engine` x1 | `long_grade_exit` |

### Big instance: `dryline_charter_siege`

This optional 10-person combat skin has three phases: **Phase 1, Paper and Powder** in the freight archive; **Phase 2, The Public Scale** in the civic yard; **Phase 3, Open Gate** at the Dustmere water gate. It is a local charter dispute, not an apocalypse. Rooms are `archive_receiving`, `sealed_manifest`, `scale_ring`, `gatehouse_roof`, and `public_gate`. Bosses are `charter_breaker` (phase 1), `scale_bailiff` (phase 2), and `gate_captain_vesk` (phase 3). Each phase has a checkpoint, personal loot, and a weekly lockout. Wipe returns to the current phase checkpoint. The noncombat alternative is a five-person public arbitration instance with `score_set` testimony checks and no boss loot.

## 10) Progression

No node is pay-to-unlock. The `trail_license` tree has 16 nodes.

| ID | Cost | Requires | Effect flags |
|---|---:|---|---|
| `steady_draw` | 0 | — | `weapon_accuracy_1` |
| `canteen_wrap` | 1 | `steady_draw` | `travel_recovery_1` |
| `field_measure` | 1 | `steady_draw` | `survey_reveal_1` |
| `brace_line` | 2 | `canteen_wrap` | `guard_stance_1` |
| `clean_reload` | 2 | `steady_draw` | `reload_stamina_1` |
| `public_stamp` | 2 | `field_measure` | `water_contract_access` |
| `repair_under_fire` | 3 | `brace_line` | `repair_action_1` |
| `long_sight` | 3 | `clean_reload` | `range_accuracy_2` |
| `witness_order` | 3 | `public_stamp` | `hearing_choice_1` |
| `hardpan_stride` | 4 | `field_measure` | `travel_fare_minus_1` |
| `shared_cover` | 4 | `brace_line` | `party_guard_1` |
| `marked_weakness` | 4 | `long_sight` | `elite_scan_1` |
| `honest_scale` | 5 | `witness_order` | `reward_audit_1` |
| `dustproof_kit` | 5 | `repair_under_fire` | `condition_loss_minus_1` |
| `line_hold` | 6 | `shared_cover` | `checkpoint_stability_1` |
| `charter_voice` | 7 | `honest_scale` | `capital_contract_plus_1` |

Daily/weekly contracts are capped: `clear_track_marks` (5 dust mites, 8 gold); `deliver_clean_water` (2 seals to a hub, 10 gold); `inspect_switches` (3 rail POIs, 12 gold); `witness_a_small_claim` (talk to 2 NPCs, 9 gold); `weekly_charter_run` (complete one big-instance phase, 35 gold and 12 cosmetic tokens).

## 11) Theme Kit + copy

`dust_line_sunbleached` uses sun-bleached cream, oxidized copper, faded indigo, sage-gray, and warning red; materials are canvas, stamped tin, dry wood, and worn brass. Dice appear as weighted bone-colored cubes with inked route marks. Voice is intimate, dry, observant, and never melodramatic. The ambient loop is **“Wire Singing at Sundown”**: wind through a loose telegraph line, distant rail creak, one muted porch chime, and a low hand drum every sixteen bars. Default fashion is practical dusters, neck cloths, patched vests, work gloves, and personal color accents.

| UI label | Dust Line copy |
|---|---|
| Inventory | Saddlebag |
| Journal | Field Ledger |
| Map | Route Sheet |
| Quest accepted | Job Taken |
| Quest complete | Proof Stamped |
| Fast travel | Paid Passage |
| Party | Trail Crew |
| Instance finder | Private Room Board |
| Boss lockout | Weekly Claim Seal |
| Gold | Coin |
| Cosmetic tokens | Stitch Marks |
| Equipment | Working Kit |
| Talents | Trail Licenses |
| Collection | Route Almanac |
| Settings | Camp Tools |
| New game | Pick a First Road |
| Respawn | Wake at Checkpoint |
| Leave instance | Step Back Outside |
| Nearby players | Faces Nearby |

**Opening-hook sentences for New Game cards:** “A boundary line can start a feud.” “The train is late because somebody wanted it late.” “A public cup is never just a cup.” “The windmill still turns when the town has stopped hoping.” “You are paid to carry proof, not rumors.” “Every road has an owner until someone asks who granted it.” “The safest camp is the one that remembers your name.” “A broken switch can choose a town’s future.” “One witness can change the price of water.” “Leave the gate kinder than you found it.”

## 12) Failures + John’s calls

| Clone risk | Avoidance call |
|---|---|
| Feels like a famous revenge western | Make the core loop civic repair, evidence, water access, and negotiated travel; violence is one tool, not the identity. |
| Feels like a generic cowboy sandbox | Use route ledgers, public scales, profession work, physical boundary proof, and four distinct local economies. |
| Rail sabotage becomes a copied train-heist plot | The switchyard instance is about restoring a public route and identifying forged charter marks, not stealing a train. |
| “Frontier” becomes an excuse for conquest | The player records consent, witnesses, and divergence; contracts can empower or restrain institutions. |
| Open decisions become blocking | Default: the first campaign favors public access while preserving a rail route; speculative capital contract variants may be added later. |

### Integrity checklist

1. `worldId` is `dust_line`.
2. Display name is Dust Line.
3. Rules module is `hp_check`.
4. Maturity is teen.
5. Four starts are present.
6. Each start has a noncapital hub.
7. Each start lists eight POIs.
8. A mid-world join is defined.
9. Two capitals are defined.
10. Travel is graph-based and non-teleport.
11. Fog distinguishes visited from outline.
12. Indoor maps use floor-plan scope.
13. Six durable NPCs exist per start.
14. Quest-giver and merchant talk trees are canned.
15. Ten hub lines exist per zone.
16. Opening choices include a stake.
17. HookArc flags are specified.
18. Retry fingerprints are authored.
19. The primary start has 18 quest beats.
20. Quest objectives use code-owned objective types.
21. Quest rewards are numeric.
22. A campaign spine follows the start DAG.
23. Divergence records are explicit.
24. Four species tables contain 16 entries each.
25. No Saltkin-named creature appears.
26. Loot is personal and numerical.
27. Gold and cosmetic tokens are separate.
28. Repair cost is specified.
29. Daily and weekly caps are specified.
30. A five-room soloable five-person instance exists.
31. Room descriptions precede encounters.
32. Elite, checkpoint, boss, and exits are explicit.
33. A three-phase big instance exists.
34. Progression has 16 nonpremium nodes.
35. Five capped contracts exist.
36. Theme colors, materials, dice, voice, loop, and fashion are specified.
37. Twenty skinned UI labels are supplied.
38. Ten New Game hooks are supplied.
39. Clone risks and avoidance calls are limited to five.
40. Dump-error names are not used as canon.
41. Licensed franchise names appear only in the ban-list as exclusion terms.
42. No live-service, save, prompt, or database references are present.
43. No production app code is included.
44. All cultures and places are original inventions.
45. Prose cannot invent ledger outcomes.
