# WOF Badge Circuit Fill

> **Purpose.** This is a quarantined WOF content-only fill for `badge_circuit`. It deepens the existing Badge Circuit pack to Ash Compact start-pack depth. It contains original setting data and typed, code-ingestible tables; it is not production application code and must never be imported into live SynapticGM.

## 1. Pack manifest and hard fences

| Field | Value |
|---|---|
| `packFormatVersion` | `1` |
| `worldId` | `badge_circuit` |
| Display name | Badge Circuit |
| Theme Kit | `signalglass_patrol` / Signalglass Patrol |
| Rules module | `hp_check` |
| Maturity | Teen |
| Product label | Solo / private co-op / limited online region |
| Primary start | `northline_market` |
| Start hubs | `civic_hall_north`, `lantern_bridge`, `blue_tile_infirmary`, `copper_yard` |
| Capital hubs | `civic_capital`, `watch_capital` |
| Mid-world join | `junction_hub` |
| Ordinary party | 1–5 players |
| Big-instance party | 10 players, Mid+ only |
| Combat | Instanced, lockstep rounds, declared target, personal loot |
| Overworld | Tier 3 shared hubs; nearby count and race tags only |
| Language | English v1 |

All names, districts, civic procedures, capes, threats, evidence, and artifacts in this file are original. The setting is a neighborhood-scale civic responder drama, not a licensed comic universe, academy franchise, caped multiverse, or real-world emergency-service simulation. The file does not redesign networking, Agones, operations, live clocks, or any production service.

### Locked engine defaults applied here

The code ledger owns dice, HP, resolve, threat, heat, evidence validity, arrest state, rewards, quest progress, lockouts, inventory, and instance completion. The narrator may describe only committed state. Hub story beats cost one turn; tell, party chat, auction browsing, mail, and idle cost zero. A Dungeon Mode A round costs one turn per player. There is no mid-combat fill; disconnect follows the last plan or Hold and can be handled at checkpoint. A wipe returns the party to checkpoint with collected evidence intact. There is no permadeath, corpse run, outcome sale, lockout skip, power pack, gacha, loot box, or combat teleport.

Two wallets remain separate: `gold` pays travel, repairs, and ordinary goods; `cosmetic_tokens` buy only appearance variants, emotes, and badge trim. Personal loot is always used. Weekly per-character per-boss lockout applies. A free player can finish the solo five-man in one sitting; a party of five may use two sessions. Kid Mode uses ten text turns per day, with no public DMs, public trade, voice, or gambling.

## 2. Originality and ban-list

The following strings and close variants are prohibited in public copy, NPC dialogue, generated names, item names, costume names, and case prose:

| # | Forbidden string or motif |
|---:|---|
| 1 | Superman |
| 2 | Batman |
| 3 | Wonder Woman |
| 4 | Spider-Man |
| 5 | Iron Man |
| 6 | Captain America |
| 7 | Thor |
| 8 | Hulk |
| 9 | X-Men |
| 10 | Avengers |
| 11 | Justice League |
| 12 | Fantastic Four |
| 13 | Watchmen |
| 14 | Invincible |
| 15 | The Boys |
| 16 | Hellboy |
| 17 | Spawn |
| 18 | Kick-Ass |
| 19 | Umbrella Academy |
| 20 | My Hero Academia |
| 21 | One-Punch Man |
| 22 | The Incredibles |
| 23 | Hancock |
| 24 | The Mask |
| 25 | V for Vendetta |
| 26 | Dark Horse |
| 27 | Marvel |
| 28 | DC |
| 29 | Gotham |
| 30 | Metropolis |
| 31 | Krypton |
| 32 | Wakanda |
| 33 | Asgard |
| 34 | Xavier |
| 35 | Stark |
| 36 | Wayne |
| 37 | Kent |
| 38 | Parker |
| 39 | Rogers |
| 40 | Amazon warrior |
| 41 | Kryptonian |
| 42 | mutant school |
| 43 | radioactive spider |
| 44 | secret-identity billionaire |
| 45 | infinity stones |
| 46 | recognizable franchise catchphrase |
| 47 | licensed costume or emblem imitation |
| 48 | global superhero team imitation |

The evaluator must reject direct costume, origin, city, team, plot, mascot, catchphrase, or power analogues even when the protected name itself is absent. “Capes” in this pack means locally registered civic responders with practical gear and public obligations; it does not imply a franchise archetype.

## 3. Identity kits and opening stake

| `kit_id` | Public identity pattern | Taboo and speech tell | Starter gear | Start / first quest / ability |
|---|---|---|---|---|
| `street_sentinel` | Reflective raincoat, patient, values safe exits. | Never abandon a bystander; “count the doors.” | `padded_coat`, `baton_shield` | `northline_market` / `bc_sentinel_rollcall` / `ability_barrier_arc` |
| `signal_runner` | Bright scarf, restless courier, values speed. | Never forge a distress call; “route is clear.” | `courier_jacket`, `cable_line_launcher` | `glassline_roofways` / `bc_runner_firstline` / `ability_flash_step` |
| `ward_healer` | Ceramic mask and utility sash, values consent. | Never touch an injured stranger unasked; “name the pain.” | `medic_vest`, `pulse_gauntlet` | `canalward_clinics` / `bc_healer_consent` / `ability_mend_field` |
| `civic_analyst` | Modular visor, observant, values proof. | Never publish an unverified accusation; “show me the seam.” | `survey_coat`, `prism_projector` | `foundry_belt` / `bc_analyst_seam` / `ability_trace_lens` |

At character creation, the player records exactly one `first_choice`: `stake_public_safety` (save a trapped courier), `stake_due_process` (preserve a suspect’s evidence), or `stake_fast_capture` (chase the fleeing attacker). The first district trust delta is code-owned: public safety `+2`, due process `+2`, fast capture `+1` public safety and `-1` due process. The narrator cannot change the recorded choice.

## 4. City graph and four patrol hubs

Morrowglass is an original ring city of wet glass, civic tram lines, roof tanks, canal pumps, foundry belts, and public case desks. Places are graph nodes, not meshes. No teleport exists.

| Place ID | Public name | Kind | Danger | Exits |
|---|---|---|---|---|
| `market_square` | Northline Market | street | safe | `old_clock`, `civic_hall_north`, `north_gate` |
| `old_clock` | Old Clock | street | low | `market_square`, `roof_tanks` |
| `tram_depot` | Tram Depot | street | low | `market_square`, `junction_hub` |
| `spice_arcade` | Spice Arcade | interior | low | `market_square` |
| `roof_tanks` | Roof Tanks | street | medium | `old_clock`, `north_gate` |
| `north_gate` | North Gate | street | low | `tram_depot`, `junction_hub` |
| `civic_hall_north` | North Civic Hall | hub | safe | `market_square`, `ledger_room_north` |
| `ledger_room_north` | North Ledger Room | instance door | medium | `civic_hall_north` |
| `glassline_station` | Glassline Station | street | safe | `roofway_east`, `lantern_bridge` |
| `roofway_east` | East Roofway | street | low | `glassline_station`, `antenna_yard` |
| `antenna_yard` | Antenna Yard | street | medium | `roofway_east` |
| `billboard_spine` | Billboard Spine | street | low | `glassline_station` |
| `drainfall_steps` | Drainfall Steps | street | medium | `lantern_bridge` |
| `service_lift` | Service Lift | interior | low | `glassline_station`, `signal_vault` |
| `lantern_bridge` | Lantern Bridge | hub | safe | `glassline_station`, `junction_hub`, `drainfall_steps` |
| `signal_vault` | Signal Vault | instance door | medium | `service_lift` |
| `canal_gate` | Canal Gate | street | safe | `clinic_row`, `underwalk` |
| `clinic_row` | Clinic Row | street | low | `canal_gate`, `pump_house`, `floating_garden` |
| `pump_house` | Pump House | interior | medium | `clinic_row` |
| `floating_garden` | Floating Garden | street | low | `clinic_row`, `quiet_boat` |
| `underwalk` | Underwalk | interior | medium | `canal_gate`, `flood_marker` |
| `flood_marker` | Flood Marker | street | low | `underwalk` |
| `quiet_boat` | Quiet Boat | street | low | `floating_garden` |
| `blue_tile_infirmary` | Blue Tile Infirmary | hub | safe | `clinic_row`, `triage_cellar` |
| `triage_cellar` | Triage Cellar | instance door | medium | `blue_tile_infirmary` |
| `foundry_gate` | Foundry Gate | street | safe | `kiln_lane`, `rail_spur` |
| `kiln_lane` | Kiln Lane | street | low | `foundry_gate`, `slag_viaduct` |
| `slag_viaduct` | Slag Viaduct | street | medium | `kiln_lane`, `cooling_tower` |
| `maker_row` | Maker Row | street | low | `copper_yard`, `scrap_court` |
| `cooling_tower` | Cooling Tower | street | medium | `slag_viaduct` |
| `scrap_court` | Scrap Court | interior | low | `maker_row` |
| `rail_spur` | Rail Spur | street | medium | `foundry_gate`, `junction_hub` |
| `copper_yard` | Copper Yard | hub | safe | `maker_row`, `blueprint_bunker` |
| `blueprint_bunker` | Blueprint Bunker | instance door | medium | `copper_yard` |
| `junction_hub` | Civic Junction | hub | safe | `north_gate`, `lantern_bridge`, `rail_spur`, `civic_capital`, `watch_capital` |
| `civic_capital` | Civic Capital | capital | safe | `junction_hub`, `public_ledger`, `morrowglass_civic_rite` |
| `watch_capital` | Watch Capital | capital | safe | `civic_capital`, `appeal_gallery`, `morrowglass_civic_rite` |
| `public_ledger` | Public Ledger | interior | low | `civic_capital` |
| `appeal_gallery` | Appeal Gallery | interior | low | `watch_capital` |

Tram travel between visited hubs costs `3 gold` and `1 turn`; walking costs `2 turns` per graph edge. `junction_hub` must be visited before either capital. A player binds fast travel at a hub desk for `1 turn` the first time and `0 turns` thereafter from that region board; travel still consumes the listed gold cost.

## 5. Durable NPCs and complete talk trees

| `npc_id` | Name | Place | Role |
|---|---|---|---|
| `marshal_arden` | Marshal Arden Vale | `civic_hall_north` | quest / hub |
| `broker_mira` | Mira Quell | `market_square` | merchant / local |
| `runner_jo` | Jo Vey | `lantern_bridge` | quest / profession |
| `medic_senn` | Senn Orra | `blue_tile_infirmary` | quest / profession |
| `maker_daro` | Daro Flint | `copper_yard` | merchant / profession |
| `witness_ren` | Ren Pell | `junction_hub` | quest / local |

| NPC | `greet` | `quest_offer` | `quest_progress` | `quest_turnin` | Gossip 1 / 2 / 3 | `refusal_rude` |
|---|---|---|---|---|---|---|
| Marshal Arden Vale | “You found the right desk. State your name and keep your hands visible.” | “A local case is open: `{case}`. I can offer the safe route or the fast route; neither is free of consequence.” | “Your report is logged. Bring the marked item or speak to the named witness; a story alone cannot close this case.” | “Evidence accepted. The ledger records the result, and the district will remember how you handled it.” | “Morrowglass has bright windows and dark stairwells.” / “A badge opens a door, not a conscience.” / “Ask who benefits before you ask who shouts.” | “Step back. Insults do not become evidence, and I will not continue this conversation.” |
| Mira Quell | “Mind the awning; it leaks only on important days.” | “Case `{case}` needs a clean receipt trail. I will pay for proof, not rumor.” | “The numbers line up halfway. Bring the missing strip and we can finish honestly.” | “That receipt closes my part of the case. Take the listed pay.” | “Markets remember hands.” / “A cheap shortcut can cost a whole roof.” / “Keep one copy dry.” | “Leave my counter if you cannot speak without threatening someone.” |
| Jo Vey | “Route is clear for three breaths. Use them well.” | “Carry this signal to the bridge and return before the lamps change.” | “The first relay answered. The second still needs a runner.” | “The line held because you carried it, not because you were fastest.” | “Roofs are roads with fewer witnesses.” / “A bell means look up.” / “Never run through a sealed scene.” | “I do not pass messages for bullies.” |
| Senn Orra | “Name the pain before you name the cure.” | “Bring sterile wraps and ask each patient before you help.” | “Two patients consented; one has not answered yet.” | “The care was offered correctly. The ledger records safe treatment.” | “A quiet room can still be busy.” / “Water first, questions second.” / “Masks protect trust as well as lungs.” | “Back away from the cot. Consent is not optional.” |
| Daro Flint | “Copper cools slowly; do not grab what you have not tested.” | “Sort the repair plates and identify the seam that can be reused.” | “The plates are sorted; the bent one still needs a witness mark.” | “Useful work leaves a trace. Here is the agreed payment.” | “Every device has a weak hinge.” / “Heat reveals shortcuts.” / “A maker should label failures.” | “I will not sell tools to someone threatening the workshop.” |
| Ren Pell | “Junction keeps every route, including the ones people regret.” | “Compare the witness accounts for `{case}` without choosing a culprit early.” | “Three accounts share a detail; the timing still conflicts.” | “The comparison is filed. The next desk can act on evidence, not volume.” | “Trams join streets, not opinions.” / “A witness can be mistaken without lying.” / “The city is a chain of small duties.” | “Come back when your accusation has a source.” |

## 6. Choice deck and first-hour beats

| Button ID | Label | Requires | Intent kind | Ledger effect |
|---|---|---|---|---|
| `read_badge` | Read the badge | `starter_badge` | talk | opens identity prompt |
| `ask_witness` | Ask the witness | `market_square` visited | talk | creates witness note |
| `secure_exit` | Secure the exit | `ability_barrier_arc` or `ability_mend_field` | protect | resolves barrier action |
| `scan_seam` | Scan the seam | `ability_trace_lens` | investigate | creates evidence candidate |
| `cut_line` | Cut the line | `ability_flash_step` | fight_move | resolves declared target |
| `offer_water` | Offer water | `water_flask` | aid | records consent request |
| `seal_crate` | Seal the crate | `evidence_tag` | collect | seals only if code validates chain |
| `call_marshal` | Call the marshal | `civic_hall_north` visited | report | submits current case state |
| `name_the_route` | Name the safe route | `first_choice` exists | talk | writes route preference |
| `hold_crowd` | Hold the crowd line | `resolve >= 1` | protect | spends resolve on crowd action |
| `mark_exit` | Mark the second exit | `chalk_signal` | investigate | adds map marker |
| `wait_for_consent` | Wait for consent | `ward_healer` kit | aid | no reward until consent flag |

The forced tutorial path is `civic_hall_north → market_square → old_clock → ledger_room_north → civic_hall_north`; its first-instance briefing is skippable after the first character on an account. Retry fingerprints are fixed and code-readable: `save_courier/barrier/jammed_gate/second_exit/market_trust`; `preserve_evidence/scan/rainwash/wax_seal/legal_trust`; `catch_runner/route_cut/loose_sign/decoy/injury_risk`; `calm_crowd/call_names/rumor/missing_child/delay`; `find_source/follow_heat/vent_maze/stolen_battery/alarm`; `protect_clinic/escort/blocked_tram/inside_witness/clinic_trust`; `identify_cape/compare_marks/copied_emblem/forged_badge/case_branch`; `close_case/mediation/revenge_demand/repairable_harm/district_peace`.

## 7. Primary start quest DAG: 18 complete beats

All objectives use code-owned verbs. Rewards are numeric and are granted once by idempotent quest completion key `badge_circuit:{questId}:{characterId}`.

| Quest ID | Title | Family | Objectives | Unlock | Reward gold / XP |
|---|---|---|---|---|---:|
| `bc_sentinel_rollcall` | Roll Call at Dawn | identity | `talk_to_npc:marshal_arden:1` | `bc_badge_test` | 8 / 25 |
| `bc_badge_test` | The Brass Mark | identity | `collect_item:starter_badge:1` | `bc_market_alarm` | 10 / 30 |
| `bc_market_alarm` | Three Bells | zone_story | `visit_place:market_square:1`, `talk_to_npc:broker_mira:1` | `bc_courier_choice` | 12 / 35 |
| `bc_courier_choice` | A Door Left Open | zone_story | `visit_place:old_clock:1` | `bc_rooftop_trace` | 12 / 35 |
| `bc_rooftop_trace` | Chalk on Copper | zone_story | `collect_item:chalk_signal:2`, `visit_place:roof_tanks:1` | `bc_witness_round` | 15 / 45 |
| `bc_witness_round` | Names in the Rain | identity | `talk_to_npc:witness_ren:1`, `talk_to_npc:broker_mira:1` | `bc_first_patrol` | 15 / 45 |
| `bc_first_patrol` | Hold the Line | zone_story | `ledger_kill:street_scrapper:3` | `bc_sealed_crate` | 18 / 55 |
| `bc_sealed_crate` | No Loose Proof | zone_story | `collect_item:evidence_tag:1`, `deliver_item:sealed_battery:1` | `bc_mira_debt` | 18 / 55 |
| `bc_mira_debt` | The Honest Price | side | `talk_to_npc:broker_mira:1`, `deliver_item:receipt_strip:1` | `bc_market_repair` | 14 / 40 |
| `bc_market_repair` | Patch the Stall | profession | `collect_item:canopy_cloth:3`, `talk_to_npc:broker_mira:1` | `bc_route_lesson` | 16 / 45 |
| `bc_route_lesson` | Read the Footfall | profession | `visit_place:old_clock:1`, `collect_item:chalk_signal:1` | `bc_daily_watch` | 16 / 45 |
| `bc_daily_watch` | Bell Before Rain | repeatable_daily | `ledger_kill:rain_runner:2`, `visit_place:market_square:1` | `bc_ledger_room` | 10 / 30 |
| `bc_ledger_room` | Room of Quiet Names | dungeon_breadcrumb | `visit_place:ledger_room_north:1`, `collect_item:case_seal:1` | `bc_counterfeit_thread` | 22 / 65 |
| `bc_counterfeit_thread` | The Copyist’s Thread | zone_story | `talk_to_npc:marshal_arden:1`, `collect_item:forged_badge:1` | `bc_tram_decision` | 24 / 70 |
| `bc_tram_decision` | Northbound | divergence | `visit_place:north_gate:1` | `bc_junction_call` | 20 / 60 |
| `bc_junction_call` | Four Lines Meet | campaign | `visit_place:junction_hub:1`, `talk_to_npc:witness_ren:1` | `bc_civic_capital` | 25 / 75 |
| `bc_civic_capital` | The Public Ledger | campaign | `visit_place:civic_capital:1`, `deliver_item:case_seal:1` | `bc_watch_trial` | 30 / 90 |
| `bc_watch_trial` | A Badge Under Glass | campaign | `ledger_kill:glass_mimic:1`, `visit_place:watch_capital:1` | none | 40 / 120 |

Divergence records are persistent: `walkaway_courier_delay`, `walkaway_public_accusation`, and `walkaway_repair_first`. They alter later dialogue and district trust but never erase a promise, item, or completed objective. The other three starts use the same schema with distinct local threats and 18–20 beats each; their first IDs remain `bc_runner_firstline`, `bc_healer_consent`, and `bc_analyst_seam`.

## 8. Opponent roster and personal loot

| Species ID | Rarity | Habitat | Base HP | Attack | AC |
|---|---|---|---:|---:|---:|
| `street_scrapper` | common | market, metal | 30 | 7 | 11 |
| `rain_runner` | common | roof, rain | 24 | 8 | 10 |
| `chalk_crawler` | uncommon | alley, wall | 42 | 10 | 12 |
| `crate_husher` | uncommon | warehouse | 48 | 9 | 13 |
| `glass_mimic` | rare | ledger, glass | 75 | 14 | 15 |
| `bell_wraith` | epic | clock, night | 110 | 19 | 17 |
| `wire_gull` | common | roof, wire | 28 | 7 | 10 |
| `spark_mite` | common | antenna | 22 | 9 | 9 |
| `sign_leech` | uncommon | billboard | 44 | 11 | 12 |
| `lift_stalker` | uncommon | service | 52 | 10 | 13 |
| `relay_hound` | rare | vault, signal | 82 | 15 | 16 |
| `skyline_warden` | epic | bridge, wind | 120 | 20 | 18 |
| `silt_skater` | common | canal, silt | 26 | 7 | 10 |
| `pipe_nipper` | common | pump | 32 | 8 | 11 |
| `reed_lurker` | uncommon | garden, reed | 46 | 10 | 12 |
| `valve_brute` | uncommon | pump, iron | 58 | 12 | 14 |
| `floodglass` | rare | cellar, water | 88 | 15 | 16 |
| `blue_tidebeast` | epic | canal, night | 125 | 20 | 18 |
| `cinder_moth` | common | kiln, ash | 25 | 8 | 9 |
| `bolt_ratchet` | common | scrap | 34 | 8 | 11 |
| `slag_hopper` | uncommon | viaduct | 50 | 11 | 13 |
| `kilnback` | uncommon | kiln, stone | 62 | 12 | 14 |
| `forge_echo` | rare | bunker, metal | 92 | 16 | 16 |
| `rail_colossus` | epic | rail, iron | 135 | 21 | 19 |

| Source | Personal loot roll |
|---|---|
| Street species | 60% `scrap`, 25% `canopy_cloth`, 12% `evidence_tag`, 3% cosmetic dye |
| Room elite | 45% repair part, 35% `case_seal`, 15% `quiet_lens`, 5% cosmetic |
| Five-man boss | 50% district badge trim, 30% 24 gold, 15% title mark, 5% rare emote |

Collection entries are created for every species, case seal, district badge, and discovered place. A loot grant is keyed by `instanceId:roundRevision:characterId:lootTableId` and is idempotent.

## 9. Five-person instance: North Ledger Room

`ledger_room_north` is the single start-depth five-man equivalent. It supports party size 1–5, one weekly per-character boss lockout, personal loot, lockstep rounds, checkpoint wipe recovery, and no mid-combat fill.

| Room ID | Pre-encounter description | Encounter | Checkpoint | Exits |
|---|---|---|---|---|
| `lr_receiving_hall` | Tiled intake grooves collect rainwater; each door has a waxed case slot. | `street_scrapper ×3` | no | `lr_archive_steps` |
| `lr_archive_steps` | Narrow stairs descend between shelves with scraped labels. | `chalk_crawler ×2` | no | `lr_seal_checkpoint` |
| `lr_seal_checkpoint` | A brass desk and blue lamp mark the safe desk. | `crate_husher ×1` elite | yes | `lr_false_corridor` |
| `lr_false_corridor` | Mirrored glass makes the party’s own badges appear counterfeit. | `glass_mimic ×2` | no | `lr_clock_chamber` |
| `lr_clock_chamber` | A stopped civic clock surrounds loose paper turning without wind. | `bell_wraith ×1` boss | no | `civic_hall_north` |

A wipe returns all players to `lr_seal_checkpoint`, sets HP to `60% max_hp`, preserves evidence, applies no gold loss, and reduces equipped durability by 10%. Completion grants `28 gold` plus personal loot and writes `case_complete:ledger_room_north`. The room’s trap examples are `wax_tripwire` (marks a case), `false_door` (returns to the previous room), `ink_sump` (slows one round), `hinge_alarm` (raises threat), and `sealed_shutter` (opens only after evidence validation).

## 10. Numeric progression and contracts

| Talent node | Cost | Requires | Effect flag |
|---|---:|---|---|
| `steady_grip` | 1 | — | `move_baton_guard` |
| `barrier_arc` | 1 | `steady_grip` | `ability_barrier_arc` |
| `route_memory` | 2 | — | `travel_discount_1` |
| `flash_step` | 2 | `route_memory` | `ability_flash_step` |
| `consent_call` | 1 | — | `ability_mend_field` |
| `field_mend` | 2 | `consent_call` | `heal_action` |
| `trace_lens` | 1 | — | `ability_trace_lens` |
| `seam_compare` | 2 | `trace_lens` | `evidence_bonus` |
| `crowd_voice` | 2 | `consent_call` | `deescalate_action` |
| `quiet_entry` | 2 | `route_memory` | `stealth_entry` |
| `case_chain` | 3 | `seam_compare` | `evidence_chain` |
| `district_oath` | 4 | `case_chain`, `crowd_voice` | `capital_access` |

No talent node accepts cosmetic tokens. Contract caps are `northline_safe_route` 3/day, `glassline_power_check` 2/day, `canalward_supply_run` 2/day, `foundry_coolant_watch` 2/day, and `civic_rite_briefing` 1/week. Daily earning cap is `180 gold`; repair cost is `1 gold` per durability point with a `75 gold` daily repair cap. Vendor prices are `padded_coat 18g`, `baton_shield 22g`, `water_flask 3g`, `evidence_tag 4g`, `city_pin_map 6g`; `raincoat_citrine` costs `12 cosmetic_tokens`.

## 11. Theme Kit row: Signalglass Patrol

| Field | Value |
|---|---|
| `themeKitId` | `signalglass_patrol` |
| Palette | smoked navy, emergency amber, rain-silver, clinic teal |
| Material language | brushed badge metal, wet glass, chalk, rubberized canvas |
| Ambient loop | `audio_signalglass_rain_civic_span` — “Rain on the Civic Span,” 74 BPM |
| Combat/UI cues | `sfx_badge_click`, `sfx_tram_bell`, `sfx_case_seal`, `sfx_safe_desk`, `sfx_wipe_return` |
| Fashion | practical jackets, reflective piping, utility sashes, removable badge plates |
| Dice treatment | translucent amber with dark pips |
| UI overrides | Inventory→Kit Bag; Journal→Casebook; Map→District Board; Party→Patrol; Quest→Open Cases; Health→Condition; Gold→City Pay; Cosmetic Tokens→Trim Marks; Dungeon→Case Door; Boss→Priority Subject; Loot→Recovered Items; Repair→Service Bench; Daily→Shift Board; Reputation→Public Trust; Checkpoint→Safe Desk |
| New Game hooks | “The first bell rings before sunrise.” / “A badge is a promise with witnesses.” / “Someone is copying the city’s symbols.” |

The kit includes one ambient loop and combat/UI SFX only. Additional music is cosmetic shop content and never grants power.

## 12. Validation and ingest notes

| Check | Required result |
|---|---|
| IDs | Unique within this fill; namespace is `badge_circuit:{kind}:{slug}` when persisted. |
| Narration | No invented damage, evidence validity, arrests, rewards, ownership, or completion. |
| Economy | Numeric gold, XP, prices, caps, and turn costs are present. |
| Combat | Instanced, lockstep, personal loot, checkpoint wipe, no mid-combat fill. |
| Social | Friends-first finder; nearby presence is count and race tags only; no global chat v1. |
| Monetization | Two wallets; no outcome sale, power packs, loot boxes, gacha, or lockout skips. |
| IP | Original names and civic responder patterns; 48-item ban-list enforced. |
| Safety | Teen content; no sexual content, gambling, or graphic gore; Kid Mode restrictions apply. |
| Deployment | Quarantined WOF file only; no live SynapticGM import, save transfer, or live clock tick. |

**Ingest order:** validate the manifest and ban-list, register places and exits, register NPCs and talk nodes, register item and species IDs, register quest DAG and rewards, register talent and contract caps, then register the five-man instance and Theme Kit overrides. The fill is complete when all references resolve and the idempotent reward key passes duplicate-grant tests.

## 13. Integrity checklist

1. `worldId` is stable as `badge_circuit`.
2. Display name remains Badge Circuit.
3. Rules module remains `hp_check`.
4. The city and civic responders are original.
5. The ban-list contains more than 40 protected names and motifs.
6. No licensed title, costume, emblem, origin, city, team, or plot is used.
7. Four starting districts are present.
8. Each starting district has a hub and complete POI exits.
9. `junction_hub`, `civic_capital`, and `watch_capital` are explicit.
10. Travel is graph-based and non-teleporting.
11. Six durable NPCs have full required talk nodes.
12. Choice buttons separate talk, protect, investigate, aid, collect, and fight intents.
13. The primary start has exactly 18 complete beats.
14. Objective verbs are code-completable.
15. Gold and XP rewards are numeric.
16. Divergence records are persistent and explicit.
17. Species and opponent stats are numeric.
18. Loot is personal and idempotent.
19. The five-man has five rooms and a checkpoint.
20. Wipe returns to checkpoint and does not cause permadeath.
21. Weekly per-character boss lockout is retained.
22. No mid-combat party fill exists.
23. Two wallets remain separate.
24. Cosmetic content never grants combat power.
25. Theme Kit has one ambient loop and UI/SFX overrides.
26. No production app code appears.
27. No live SynapticGM import or live clock operation appears.
28. No world novel, map rewrite, or unrelated pack is generated.
29. Honest labels are solo, private co-op, and limited online region.
30. All output is original WOF-only data and is ready for quarantined ingestion.

## References

[1]: /home/ubuntu/WOF_Content_Packs/WOF_badge_circuit_Pack.md "Existing quarantined Badge Circuit content pack"
[2]: /home/ubuntu/WOF_Content_Packs/WOF_ash_compact_Pack.md "Existing quarantined Ash Compact content pack and depth baseline"
[3]: /home/ubuntu/upload/pasted_content_16.txt "WOF typed-data gap-fill specification"
