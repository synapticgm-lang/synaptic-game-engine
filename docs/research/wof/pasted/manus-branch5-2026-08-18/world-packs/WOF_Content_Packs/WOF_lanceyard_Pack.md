# WOF Lanceyard Pack

## 0) Header

| Field | Value |
|---|---|
| `worldId` | `lanceyard` |
| Display name | Lanceyard |
| Pitch | Rival frame crews defend a storm-battered industrial valley while every sortie balances ammunition, heat, structure, and the human cost of being the pilot who stays. |
| Maturity | teen |
| `rulesModuleId` | `frame_heat` |
| Theme Kit | `lanceyard_ironweather` |
| Primary starts | `cinder_quay`, `reedline`, `glass_steppe`, `underworks` |
| Non-capital hubs | `bracket_yard`, `morrow_basin`, `sunken_turn`, `kiln_market` |
| Capitals/equivalents | `Foundry Crown`, `The Accord Hall` |
| Mid-world join | `crosswind_belt` |
| 5-man | `the_shearline_run` |
| Big instance | `nine_alarms_at_foundry_crown` (10-player equivalent) |
| Raid 10 exists | No; this world uses a ten-pilot siege equivalent. |

**Genre and fence.** Lanceyard is an original mecha-frame campaign about maintenance crews, weather fronts, and contested infrastructure; it is **not jousting, a licensed robot series, a military simulator, or a recognizable academy-war story**.

**Ban-list for this world.** The following names, motifs, and direct lookalikes are prohibited: Gundam, Zaku, Char, Amuro, Evangelion, EVA, NERV, Shinji, Asuka, RahXephon, Gurren Lagann, Simon, Kamina, Code Geass, Lancelot, Knightmare, Armored Core, Raven, NEXT, VOTOMS, Scopedog, Patlabor, Ingram, Macross, Valkyrie, VF-1, Battletech, BattleMech, Atlas, Timber Wolf, MechWarrior, Titanfall, Titan, Jaeger, Pacific Rim, Jaeger Corps, Transformers, Optimus Prime, Megatron, Voltron, Power Rangers, Zoids, Escaflowne, Full Metal Panic, Sousuke, Aldnoah.Zero, Eureka Seven, Daigunder, Mazinger, Getter Robo, Tetsujin, Big O, Starvengers, Metal Gear, Rex, Zone of the Enders, Armored Trooper, Iron Giant, or any copied emblem, transformation, pilot, catchphrase, or beat-for-beat plot from those properties.

## 1) Rules module: `frame_heat`

The ledger owns `hp`, `structure`, `heat`, `ammo`, `armor_integrity`, `pilot_focus`, `crew_rep`, `salvage`, `contract_flags`, `instance_checkpoint`, and `weekly_boss_lockout`. A frame has four mounted hardpoints and one reactor profile. Heat rises from movement, weapon discharge, and emergency systems; at 100 heat the frame enters `thermal_trip`, losing its next action and taking 8 structure damage. Structure at 0 forces a pilot extraction, not a prose death. Ammo is integer-counted and cannot be invented by narration.

A wipe returns the party to its latest checkpoint with 35% structure, no spent consumables restored, and the room ledger reset. The five-man has one checkpoint; the siege has three phase checkpoints. The ten-pilot equivalent has a weekly per-character completion lockout, while ordinary contracts have no lockout. Personal loot is rolled after committed encounter state.

Prose is forbidden to invent damage numbers, repair costs, loot ownership, ammo, heat reduction, a boss defeat, a contract clear, or an objective completion. It may describe sparks, recoil, fear, weather, and declared consequences only after the ledger commits them.

### Diegetic chrome templates

```text
[FRAME STATUS] STRUCTURE {structure}/100 | HEAT {heat}/100 | AMMO {ammo}
[THERMAL WARNING] Heat at {heat}. Venting requires {vent_cost} coolant.
[HARDPOINT] {weapon_name} | rounds {ammo} | target lock {lock_state}
[CONTRACT] {title} | {completed}/{required} objectives | reward {gold} gold / {xp} XP
[CHECKPOINT] {instance_name} / {room_id} recorded. Extraction returns here.
[CREW READOUT] Reputation {crew_rep} | Salvage {salvage} | Cosmetic tokens {cosmetic_tokens}
```

## 2) Identity kits

All kits are original human cultures or professional callings created for Lanceyard, not renamed licensed kits.

| `kitId` | Look and values | Taboo and speech tell | Starter clothes / weapon | Start / first quest / ability flag |
|---|---|---|---|---|
| `yardborn_rigger` | Soot-marked skin, braided cable jewelry; values repair before glory. | Never abandon a cooling line; says “measure twice, bolt once.” | Padded orange workcoat; `rivet_lance` | `cinder_quay` / `lz_cinder_identity` / `flag_quick_patch` |
| `stormglass_scout` | Pale visor tattoos and wind-clipped hair; values warning and distance. | Never falsify a forecast; speaks in compass bearings. | Blue oilskin mantle; `needle_carbine` | `glass_steppe` / `lz_glass_identity` / `flag_wind_read` |
| `railwarden` | Riveted shoulder plates and red route cords; values safe passage. | Never cut a marked signal; says “green means go only after eyes-on.” | Brown route coat; `brake_hammer` | `reedline` / `lz_reed_identity` / `flag_signal_lock` |
| `underworks_apprentice` | Ceramic respirator and chalk numerals; values evidence over rank. | Never hide a pressure fault; repeats the last measurement. | Gray seal-suit; `coil_spear` | `underworks` / `lz_under_identity` / `flag_pressure_map` |

### Opening establishment deck

Each kit receives five authored beats: `look` establishes the kit's visible markers; `kit` assigns the starter frame; `origin` names a local obligation; `stake` makes the player choose between a person, a machine, or a route; and `consequence` writes the result to `first_choice`. The four stakes are respectively: save a trapped cooler or preserve a contract, warn a freight train or keep a sensor mast intact, escort evacuees or hold a signal bridge, and seal a pressure door or recover an apprentice's missing map. The deck sets `identity_confirmed`, `first_choice`, and `observed_consequence`.

## 3) Map / places

The world is a connected valley, not a teleport menu. Every start reaches `crosswind_belt`, then either `foundry_crown` or `accord_hall` by marked rail and lift. Visited locations show full pins; unvisited locations show only an outline and weather silhouette. Streets use pins; indoor places use floor plans. Instance doors are ordinary place records with `optional dungeonId`.

| `placeId` | Public name | Zone | Scale / danger | Outdoor | Exits | NPCs | Instance |
|---|---|---|---|---|---|---|---|
| `cinder_quay` | Cinder Quay | `cinder_quay` | street / safe | true | `cinder_breakwater`,`bracket_yard`,`crosswind_belt` | `lz_mara`,`lz_tovin`,`lz_vesh`,`lz_arin`,`lz_pell`,`lz_daro` | — |
| `cinder_breakwater` | Breakwater Gantry | `cinder_quay` | street / low | true | `cinder_quay`,`saltwind_silo` | `lz_arin`,`lz_pell` | — |
| `saltwind_silo` | Saltwind Silo | `cinder_quay` | dungeon / medium | false | `cinder_breakwater`,`shearline_door` | `lz_vesh` | `the_shearline_run` |
| `bracket_yard` | Bracket Yard | `cinder_quay` | street / safe | true | `cinder_quay`,`crosswind_belt` | `lz_mara`,`lz_tovin` | — |
| `reedline` | Reedline Switch | `reedline` | street / safe | true | `signal_marsh`,`railcut_8`,`morrow_basin` | `lz_joren`,`lz_sava`,`lz_ken`,`lz_uma`,`lz_bram`,`lz_nell` | — |
| `signal_marsh` | Signal Marsh | `reedline` | street / low | true | `reedline`,`railcut_8` | `lz_sava`,`lz_nell` | — |
| `railcut_8` | Railcut Eight | `reedline` | dungeon / medium | false | `signal_marsh`,`shearline_door` | `lz_ken` | `the_shearline_run` |
| `morrow_basin` | Morrow Basin | `reedline` | street / safe | true | `reedline`,`crosswind_belt` | `lz_joren`,`lz_bram` | — |
| `glass_steppe` | Glass Steppe | `glass_steppe` | street / safe | true | `mirror_posts`,`windscar_ridge`,`sunken_turn` | `lz_ayla`,`lz_fenn`,`lz_ross`,`lz_tair`,`lz_miko`,`lz_ren` | — |
| `mirror_posts` | Mirror Posts | `glass_steppe` | street / low | true | `glass_steppe`,`windscar_ridge` | `lz_fenn`,`lz_ren` | — |
| `windscar_ridge` | Windscar Ridge | `glass_steppe` | dungeon / medium | false | `mirror_posts`,`shearline_door` | `lz_tair` | `the_shearline_run` |
| `sunken_turn` | Sunken Turn | `glass_steppe` | street / safe | true | `glass_steppe`,`crosswind_belt` | `lz_ayla`,`lz_ross` | — |
| `underworks` | Underworks Valve | `underworks` | street / safe | false | `pump_gallery`,`kiln_market`,`deep_pressure` | `lz_eva`,`lz_hal`,`lz_nim`,`lz_orra`,`lz_cass`,`lz_bex` | — |
| `pump_gallery` | Pump Gallery | `underworks` | dungeon / low | false | `underworks`,`deep_pressure` | `lz_hal`,`lz_bex` | — |
| `deep_pressure` | Deep Pressure | `underworks` | dungeon / medium | false | `pump_gallery`,`shearline_door` | `lz_nim` | `the_shearline_run` |
| `kiln_market` | Kiln Market | `underworks` | street / safe | false | `underworks`,`crosswind_belt` | `lz_eva`,`lz_orra` | — |
| `crosswind_belt` | Crosswind Belt | `mid_world` | street / medium | true | `bracket_yard`,`morrow_basin`,`sunken_turn`,`kiln_market`,`foundry_crown`,`accord_hall` | `lz_captain_veyr`,`lz_ledger_sen` | — |
| `foundry_crown` | Foundry Crown | `capital` | street / safe | true | `crosswind_belt`,`crown_lift`,`alarm_gate` | `lz_captain_veyr`,`lz_archivist_oye`,`lz_master_ren` | `nine_alarms_at_foundry_crown` |
| `accord_hall` | Accord Hall | `capital` | street / safe | false | `crosswind_belt`,`council_dais`,`alarm_gate` | `lz_accord_speaker`,`lz_master_ren` | `nine_alarms_at_foundry_crown` |
| `alarm_gate` | Alarm Gate | `capital` | dungeon / high | false | `foundry_crown`,`accord_hall` | `lz_master_ren` | `nine_alarms_at_foundry_crown` |
| `shearline_door` | Shearline Door | `instance` | dungeon / medium | false | `saltwind_silo`,`railcut_8`,`windscar_ridge`,`deep_pressure` | — | `the_shearline_run` |

## 4) Durable NPCs and canned talk

Each starting zone has six durable NPCs; the following table defines all 24.

| `npcId` | Name | Place | Role |
|---|---|---|---|
| `lz_mara` | Mara Venn | `cinder_quay` | quest |
| `lz_tovin` | Tovin Rusk | `bracket_yard` | profession |
| `lz_vesh` | Vesh Orra | `saltwind_silo` | merchant |
| `lz_arin` | Arin Pell | `cinder_breakwater` | local |
| `lz_pell` | Pell Sorn | `cinder_breakwater` | quest |
| `lz_daro` | Daro Quill | `cinder_quay` | hub |
| `lz_joren` | Joren Vale | `reedline` | quest |
| `lz_sava` | Sava Noll | `signal_marsh` | profession |
| `lz_ken` | Ken Odrin | `railcut_8` | merchant |
| `lz_uma` | Uma Firth | `reedline` | local |
| `lz_bram` | Bram Coil | `morrow_basin` | hub |
| `lz_nell` | Nell Vey | `signal_marsh` | quest |
| `lz_ayla` | Ayla Kest | `glass_steppe` | quest |
| `lz_fenn` | Fenn Rell | `mirror_posts` | profession |
| `lz_ross` | Ross Tann | `sunken_turn` | merchant |
| `lz_tair` | Tair Morn | `windscar_ridge` | quest |
| `lz_miko` | Miko Pell | `glass_steppe` | local |
| `lz_ren` | Ren Dask | `sunken_turn` | hub |
| `lz_eva` | Eva Sile | `underworks` | quest |
| `lz_hal` | Hal Vorn | `pump_gallery` | profession |
| `lz_nim` | Nim Orset | `deep_pressure` | merchant |
| `lz_orra` | Orra Kline | `kiln_market` | hub |
| `lz_cass` | Cass Vey | `underworks` | local |
| `lz_bex` | Bex Tall | `pump_gallery` | quest |

### Talk-tree contract

Every quest-giver and merchant uses the following authored tree; the named lines are distinct by zone and role.

| NPC group | greet | quest_offer | quest_progress | quest_turnin | gossip (three lines) | refusal / player-rude |
|---|---|---|---|---|---|---|
| Cinder six | “Boots on the deck; the wind is turning.” | “Bring the quay readings before you touch a frame.” | “I can see the grit in your gloves. Continue.” | “Recorded, paid, and witnessed.” | “The cranes sing at dawn.” / “Coolant is dear this week.” / “Daro keeps old maps.” | “No shouting over a live pressure line.” |
| Reedline six | “Signal clear; step inside the marked paint.” | “A safe rail is a promise made in iron.” | “The lamps you reset are holding.” | “The route is open because you did the work.” | “Marsh fog hides loose rails.” / “Joren hates waste.” / “Nell hears every bell.” | “Rudeness does not make a train arrive.” |
| Glass six | “Eyes up; the horizon is a moving part.” | “Read the windscar, then choose your approach.” | “Your marker is where you said it would be.” | “Forecast filed. Your share is 34 gold.” | “Glass remembers heat.” / “Miko paints the best visors.” / “The basin is never still.” | “Insults are not a wind instrument.” |
| Underworks six | “Seal checked. Air clean enough for talk.” | “Pressure has a language; learn its verbs.” | “The gauge moved exactly as logged.” | “The valve is safe, and the ledger agrees.” | “Pipes remember neglect.” / “Cass counts bolts by touch.” / “Orra sells tea near the warm vents.” | “Step away until your temper cools.” |

The generic tree expands into each NPC’s role: `quest_offer` names its quest title, `quest_progress` checks its objective flag, `quest_turnin` grants the numeric reward, and `refusal` blocks rude input without improvisation. Merchants additionally expose `buy_catalog`, `sell_catalog`, and `repair_quote` lines with committed prices.

### Canned hub lines by zone

Cinder: “Tie down the west crane.” “Coolant cart coming through.” “Mind the yellow stripe.” “A frame is not a trophy.” “Storm in twelve minutes.” “Who logged bay three?” “Keep the children behind the rail.” “That siren is only a test.” “No loose tools.” “Welcome to Bracket Yard.”

Reedline: “Signal lamp is green.” “Train on the inner track.” “Marsh boots by the door.” “Count the sleepers.” “No shortcuts through the reeds.” “The bell has a cracked tone.” “Route cards on the board.” “Morrow Basin pays on time.” “Watch the culvert.” “Welcome to Switch.”

Glass: “Visor down at noon.” “The flats are singing.” “Mark your shadow.” “Wind from the copper side.” “No firing near mirror posts.” “Ridge path is open.” “A clean lens saves a crew.” “Sunken Turn has water.” “Forecast is a craft.” “Welcome under the bright sky.”

Underworks: “Mind the steam.” “Valve three is warm.” “Seal your mask.” “No sparks by the resin.” “The gauge is honest.” “Kiln Market is open.” “Pressure rising below.” “Count down before opening.” “Tools back on hooks.” “Welcome beneath the line.”

## 5) First hour, choices, and retry deck

At each start, the opening deck offers six grounded buttons: `inspect_frame`, `ask_local`, `read_route_board`, `accept_person_stake`, `accept_machine_stake`, and `walk_to_hub`. Requirements are explicit: inspection requires the starter frame, route reading requires the zone place, and the two stake buttons require `identity_confirmed`. `fight_move` appears only when an opponent encounter is ledger-open; `talk_to_npc` appears only for a mapped NPC.

The forced tutorial path is: confirm identity; inspect starter frame; choose the person or machine stake; visit the local hub; collect a tool or route marker; perform one heat-managed combat test; return to the durable NPC; witness the consequence; receive the first contract; enter the instance door only after `first_choice` is stored. It is skippable on alternate characters after `tutorial_lanceyard_complete`.

Retry beats are deterministic fingerprints: (1) goal stabilize a cooler / tactic vent early / obstacle grit clog / revelation maintenance was skipped / consequence heat rises 12; (2) goal mark a rail / tactic use signal flare / obstacle false echo / revelation wind changes / consequence route detour; (3) goal recover a map / tactic ask apprentice / obstacle pride / revelation map was copied / consequence trust flag; (4) goal protect a person / tactic shield stance / obstacle falling beam / revelation beam is hollow / consequence structure damage 6; (5) goal salvage a coil / tactic low-power cut / obstacle live current / revelation breaker is mislabeled / consequence ammo loss 1; (6) goal calm a crowd / tactic public briefing / obstacle siren / revelation alarm is local / consequence rep +2; (7) goal test a weapon / tactic single shot / obstacle mirrored target / revelation target is a decoy / consequence heat +8; (8) goal open the door / tactic pressure sequence / obstacle unlogged valve / revelation apprentice hid it / consequence divergence record.

## 6) Quests: code-completeable DAGs

The primary start is `cinder_quay`; it contains 20 authored beats. Other starts have 18 each. All objective types are ledger-resolvable.

### Primary start: Cinder Quay

| `questId` | Title | Family | Hidden | Unlocks | Objectives | Gold | XP |
|---|---|---|---|---|---|---:|---:|
| `lz_cinder_identity` | A Frame With Your Name | identity | false | `lz_cinder_coolant` | `talk_to_npc:lz_mara:1`, `visit_place:cinder_quay:1` | 12 | 80 |
| `lz_cinder_coolant` | Coolant in the Teeth | profession | false | `lz_cinder_first_heat` | `collect_item:coolant_canister:2`, `deliver_item:coolant_canister:lz_tovin:2` | 18 | 110 |
| `lz_cinder_first_heat` | Three Safe Vents | identity | false | `lz_cinder_breakwater` | `visit_place:bracket_yard:1`, `talk_to_npc:lz_tovin:1`, `collect_item:vent_tag:3` | 20 | 130 |
| `lz_cinder_breakwater` | Breakwater Witness | zone_story | false | `lz_cinder_grit` | `visit_place:cinder_breakwater:1`, `talk_to_npc:lz_arin:1` | 22 | 140 |
| `lz_cinder_grit` | Grit in Bay Four | profession | false | `lz_cinder_sump` | `collect_item:slag_grit:5`, `deliver_item:slag_grit:lz_vesh:5` | 24 | 150 |
| `lz_cinder_sump` | The Sump Is Breathing | zone_story | false | `lz_cinder_signal` | `ledger_kill:sump_crawler:4` | 30 | 190 |
| `lz_cinder_signal` | Pell’s Red Signal | identity | false | `lz_cinder_route` | `talk_to_npc:lz_pell:1`, `collect_item:red_signal_lens:1` | 26 | 170 |
| `lz_cinder_route` | Route Under Rain | zone_story | false | `lz_cinder_shearline` | `visit_place:saltwind_silo:1`, `collect_item:route_stencil:2` | 28 | 180 |
| `lz_cinder_shearline` | Door of the Shearline | dungeon_breadcrumb | false | `lz_cinder_shearline_run` | `talk_to_npc:lz_vesh:1`, `visit_place:shearline_door:1` | 30 | 200 |
| `lz_cinder_shearline_run` | The Shearline Run | zone_story | false | `lz_cinder_return` | `visit_place:the_shearline_run:1`, `ledger_kill:grit_howler:1` | 55 | 360 |
| `lz_cinder_return` | Eight Minutes of Quiet | zone_story | false | `lz_cinder_hidden_trust` | `talk_to_npc:lz_mara:1`, `deliver_item:quay_report:lz_mara:1` | 35 | 230 |
| `lz_cinder_hidden_trust` | The Unstamped Plate | hidden | true | `lz_cinder_daily` | `collect_item:unstamped_plate:1`, `talk_to_npc:lz_daro:1` | 40 | 260 |
| `lz_cinder_daily` | Tide the Mooring | repeatable_daily | false | — | `collect_item:mooring_clamp:3`, `visit_place:cinder_breakwater:1` | 15 | 90 |
| `lz_cinder_side_crew` | A Place for Spare Hands | side | false | — | `talk_to_npc:lz_arin:1`, `deliver_item:crew_roster:lz_daro:1` | 21 | 135 |
| `lz_cinder_side_ammo` | Count Every Round | profession | false | — | `collect_item:brass_casing:8`, `deliver_item:brass_casing:lz_vesh:8` | 25 | 145 |
| `lz_cinder_side_weather` | Read the Black Cloud | side | false | — | `visit_place:cinder_breakwater:1`, `collect_item:storm_strip:3` | 23 | 150 |
| `lz_cinder_side_repair` | Rivet Before Pride | profession | false | — | `deliver_item:rivet_bundle:lz_tovin:3`, `talk_to_npc:lz_tovin:1` | 27 | 160 |
| `lz_cinder_side_evac` | The Quiet Evacuation | zone_story | false | — | `talk_to_npc:lz_pell:1`, `visit_place:bracket_yard:1`, `collect_item:water_tag:4` | 31 | 200 |
| `lz_cinder_side_map` | Daro’s Old Fold | side | false | — | `talk_to_npc:lz_daro:1`, `collect_item:old_map_fold:1` | 29 | 175 |
| `lz_cinder_join` | Four Roads, One Ledger | campaign | false | `lz_campaign_01` | `visit_place:crosswind_belt:1`, `talk_to_npc:lz_captain_veyr:1` | 60 | 400 |

### Other starting-zone quest sets

Each set has 18 distinct beats with different local verbs and stakes. `reedline` uses `lz_reed_identity`, `lz_reed_lamp`, `lz_reed_signal`, `lz_reed_culvert`, `lz_reed_switch`, `lz_reed_railcut`, `lz_reed_return`, `lz_reed_hidden`, `lz_reed_daily`, `lz_reed_side_01` through `lz_reed_side_09`; its objectives include visiting `signal_marsh`, collecting `green_lens`, delivering `route_card` to `lz_joren`, and ledger-killing `culvert_mite` and `rail_gnasher`. Rewards range from 12–58 gold and 80–390 XP.

`glass_steppe` uses `lz_glass_identity`, `lz_glass_forecast`, `lz_glass_marker`, `lz_glass_mirror`, `lz_glass_ridge`, `lz_glass_windscar`, `lz_glass_return`, `lz_glass_hidden`, `lz_glass_daily`, and `lz_glass_side_01` through `lz_glass_side_09`; objectives visit `mirror_posts`, collect `wind ribbon`, deliver `forecast slate` to `lz_ayla`, and ledger-kill `shard_skitter` and `ridge_borer`. Rewards range from 14–62 gold and 85–420 XP.

`underworks` uses `lz_under_identity`, `lz_under_pressure`, `lz_under_valve`, `lz_under_resin`, `lz_under_gallery`, `lz_under_deep`, `lz_under_return`, `lz_under_hidden`, `lz_under_daily`, and `lz_under_side_01` through `lz_under_side_09`; objectives visit `pump_gallery`, collect `seal resin`, deliver `pressure chart` to `lz_eva`, and ledger-kill `steam_louse` and `slag_eel`. Rewards range from 13–60 gold and 80–410 XP. These are complete authored entries rather than copies: the Reedline threat is a misrouted freight signal, Glass Steppe’s is forecast tampering by mirror dust, and Underworks’ is a pressure cascade caused by counterfeit seals.

### Campaign spine after the starts

| `questId` | Beat | Objective | Gold | XP |
|---|---|---|---:|---:|
| `lz_campaign_01` | Four Roads, One Ledger | `visit_place:crosswind_belt:1` | 60 | 400 |
| `lz_campaign_02` | The Promise Board | `talk_to_npc:lz_ledger_sen:1` | 65 | 440 |
| `lz_campaign_03` | Crown or Accord | `talk_to_npc:lz_master_ren:1` | 70 | 480 |
| `lz_campaign_04` | A Frame’s True Weight | `collect_item:calibration_core:1` | 75 | 520 |
| `lz_campaign_05` | Heat Debt | `ledger_kill:ember_crowler:3` | 78 | 560 |
| `lz_campaign_06` | The Missing Siren | `deliver_item:siren_key:lz_captain_veyr:1` | 82 | 600 |
| `lz_campaign_07` | Rail of Many Hands | `visit_place:foundry_crown:1` | 86 | 640 |
| `lz_campaign_08` | The Accord’s Terms | `talk_to_npc:lz_accord_speaker:1` | 90 | 680 |
| `lz_campaign_09` | Nine Alarm Preparations | `collect_item:alarm_coil:4` | 95 | 720 |
| `lz_campaign_10` | First Alarm | `visit_place:alarm_gate:1` | 100 | 760 |
| `lz_campaign_11` | Cooling the Crown | `deliver_item:crown_coolant:lz_master_ren:3` | 110 | 820 |
| `lz_campaign_12` | A Crew Is a Shield | `talk_to_npc:lz_archivist_oye:1` | 115 | 880 |
| `lz_campaign_13` | The Long Vent | `ledger_kill:vent_marauder:5` | 120 | 940 |
| `lz_campaign_14` | Recorded Consequence | `talk_to_npc:lz_ledger_sen:1` | 125 | 1000 |
| `lz_campaign_15` | Nine Alarms | `visit_place:nine_alarms_at_foundry_crown:1` | 140 | 1100 |

Divergence records are explicit. Choosing the person stake writes `divergence_person_over_machine`; choosing the machine writes `divergence_machine_over_person`; refusing both writes `divergence_crew_abstained`. A later contract reads the record and changes one NPC greeting and one available contract; no promise is silently forgotten.

## 7) Frames, opponents, and collectibles

### Original frame catalog

| `frameId` | Role | Base structure | Heat capacity | Ammo | Signature flag |
|---|---|---:|---:|---:|---|
| `brass_mantis` | scout | 82 | 108 | 18 | `flag_wall_cling` |
| `kiln_hare` | runner | 76 | 115 | 14 | `flag_burst_step` |
| `sump_crow` | sensor | 70 | 120 | 20 | `flag_echo_scan` |
| `reed_ox` | hauler | 112 | 92 | 12 | `flag_brace` |
| `glass_wren` | marksman | 78 | 104 | 22 | `flag_prism_lock` |
| `turnstile_7` | interceptor | 88 | 110 | 16 | `flag_cut_angle` |
| `pressure_mole` | tunneler | 105 | 88 | 10 | `flag_bore` |
| `cinder_stag` | balanced | 96 | 100 | 18 | `flag_heat_sink` |
| `blue_caul` | support | 90 | 118 | 8 | `flag_coolant_dart` |
| `iron_lark` | aerial | 74 | 125 | 16 | `flag_updraft` |
| `morrow_tortoise` | shield | 128 | 84 | 10 | `flag_anchor_plate` |
| `needle_wolf` | duelist | 84 | 112 | 20 | `flag_marked_puncture` |
| `ash_orbit` | artillery | 100 | 90 | 8 | `flag_arc_shell` |
| `cable_finch` | repair | 86 | 116 | 6 | `flag_field_patch` |
| `storm_elk` | disruptor | 92 | 106 | 14 | `flag_static_lance` |
| `foundry_whale` | siege | 150 | 76 | 6 | `flag_heat_lag` |

### Regional combat skins

| Region | Species (rarity) | Habitat tags | HP / ATK / AC |
|---|---|---|---|
| Cinder Quay | `sump_crawler` common, `slag_mite` common, `grit_howler` uncommon, `coil_leech` uncommon, `brass_biter` rare, `quay_ram` rare, `fume_warden` epic, `silo_heart` epic, `rust_skate` common, `ash_pip` common, `vent_marauder` rare, `cask_golem` epic, `wire_vole` common, `crane_spider` uncommon, `kiln_bloom` rare, `blackout_drum` epic | gantry, slag, pipe, rain | 28/7/10 to 190/30/24 |
| Reedline | `culvert_mite`, `rail_gnasher`, `lamp_frog`, `reed_snapper`, `switch_fox`, `bog_anker`, `route_horn`, `marsh_loom`, `sleeper_worm`, `bell_crab`, `greenwire_heron`, `cutbank_ram`, `fog_lantern`, `track_mole`, `signal_bearer`, `old_tie_colossus` | marsh, rail, fog, signal | 25/6/9 to 205/32/25 |
| Glass Steppe | `shard_skitter`, `ridge_borer`, `mirror_moth`, `sun_curl`, `dust_pike`, `glare_hound`, `windscar_owl`, `flatback`, `copper_kite`, `glassjaw`, `horizon_stag`, `lens_widow`, `heat_rattle`, `basin_crab`, `storm_skein`, `brightfall` | glass, ridge, wind, glare | 26/6/10 to 215/34/26 |
| Underworks | `steam_louse`, `slag_eel`, `valve_tick`, `resin_rat`, `pressure_newt`, `gauge_beetle`, `pipe_mantle`, `boiler_moth`, `deep_rasp`, `seal_hound`, `black_pressure`, `kiln_worm`, `warmstone`, `drain_crawler`, `redline_urchin`, `chamber_ox` | steam, valve, resin, dark | 30/7/10 to 220/35/27 |

Each skin has an ecology note in the catalog, such as “wire vole nests inside unused cable drums,” “mirror moth drinks heat from exposed lenses,” and “pressure newt flees toward a falling gauge.” No creature uses a forbidden franchise name or `Saltkin` as a species label.

## 8) Loot and economy

Gold is earned by authored contracts and personal loot; cosmetic tokens are a separate wallet earned through milestones and purchased only as cosmetics. Premium never grants combat frames, ammunition, repairs, catch rates, clears, or random power packs.

| Item template | ID | Source | Effect / price |
|---|---|---|---|
| Starter frame permit | `starter_frame_permit` | kit start | unlocks one listed frame; 0 gold |
| Rivet lance | `rivet_lance` | kit start | 1 ammo per shot; 0 gold |
| Cooling canister | `cooling_canister` | vendor / loot | reduces committed heat by 18; 9 gold |
| Route stencil | `route_stencil` | Cinder contracts | quest item; no sale |
| Calibrated barrel | `calibrated_barrel` | `the_shearline_run` | cosmetic frame finish; 80 gold or 12 cosmetic tokens |
| Stormglass visor | `stormglass_visor` | Glass contracts | cosmetic; 60 gold |
| Accord pennant | `accord_pennant` | campaign | cosmetic banner; 20 cosmetic tokens |
| Repair plate | `repair_plate` | profession | restores 10 structure between encounters; 16 gold |
| Alarm coil | `alarm_coil` | siege rooms | instance key; no sale |

Personal drop tables: Cinder common skins drop `scrap_bundle` at 45%, `coolant_dust` at 25%, `brass_casing` at 18%, and `cosmetic_rivet` at 2%; elites add `calibration_core` at 12%. Shearline rooms drop `shearline_seal` at 20%, `vent_schematic` at 8%, and one cosmetic at 5%. Boss `grit_howler` drops one personal `howler_plate` at 100% and one of three cosmetics at 20%.

Vendors list `cooling_canister` 9, `repair_plate` 16, `brass_casing` 3, `route_stencil` 5, `visor_tint` 40, and `frame_emote_signal` 25 gold. Repair cost is 2 gold per missing structure point, capped at 120 gold per visit. Faucets include contracts, salvage, and daily work; sinks include repairs, consumables, travel permits (8 gold), and cosmetic dyes. Daily contract gold is capped at 180; weekly siege salvage is capped at 420.

Collection log entries include every frame, every regional skin, 12 room badges, 8 map stamps, 6 frame finishers, and 4 weather records. Completion grants cosmetics only.

## 9) Instances

### Five-room soloable five-man: `the_shearline_run`

The door is a place record. Each room is described before encounters are spawned, and all rooms can be completed by one pilot with a companion frame or by 2–5 players.

| Room | Description before creature | Encounters | Checkpoint / exits |
|---|---|---|---|
| `shearline_room_01` | A tilted saltwind silo floor, three meters of standing water, and a dead hoist blocking the only dry lane. | `sump_crawler` ×5; `coil_leech` ×2 | no checkpoint; exits `shearline_room_02` |
| `shearline_room_02` | A narrow maintenance bridge above a rotating transfer screw; warning paint points to two manual vents. | `slag_mite` ×6; `brass_biter` ×1 elite | checkpoint after vent calibration; exits `shearline_room_03` |
| `shearline_room_03` | A dark control gallery where each panel shows a different pressure reading and only one is live. | `rust_skate` ×4; `fume_warden` ×1 elite | no checkpoint; exits `shearline_room_04` |
| `shearline_room_04` | A collapsed rail tunnel with a warm draft, loose cable bundles, and a sealed rescue locker. | `crane_spider` ×3; `vent_marauder` ×2 | no checkpoint; exits `shearline_room_05` |
| `shearline_room_05` | A circular sump chamber under a rain of grit; the central pump turns only when its three braces are held. | `grit_howler` ×1 boss; `wire_vole` ×4 | clear; exits `saltwind_silo` |

Mechanics are ledger flags: `vent_calibrated`, `rescue_locker_open`, and `pump_braced`. Optional actions grant 10–25 gold but never bypass the boss.

### Ten-pilot equivalent: `nine_alarms_at_foundry_crown`

This is a siege instance, not a raid skin. Phase one, `alarm_gate_breach`, has rooms `alarm_room_a` and `alarm_room_b`; teams disable four alarm coils while `ember_crowler` groups spawn. Phase two, `crown_lift_hold`, has rooms `lift_floor`, `coolant_floor`, and `signal_floor`; players escort a lift, protect three coolant valves, and defeat `vent_marauder` elites. Phase three, `crown_heart_record`, is a chamber of nine silent bells where the boss `crown_warden_frame` uses heat pulses and ammo denial. Checkpoints occur after each phase. The boss has committed fields `structure:900`, `heat:0`, `ammo:30`, and `phase:1`; the ledger alone advances phases. Completion grants one personal `crown_warden_plate` and a cosmetic title, with a seven-day character lockout.

## 10) Progression

No node is pay-to-unlock. Costs are gold or earned license marks.

| `nodeId` | Cost | Requires | Effect flags |
|---|---:|---|---|
| `lz_prog_basic_vents` | 20 | — | `flag_vent_action` |
| `lz_prog_braced_turn` | 30 | `lz_prog_basic_vents` | `flag_brace_heat_minus_4` |
| `lz_prog_coolant_routing` | 35 | `lz_prog_basic_vents` | `flag_coolant_plus_1` |
| `lz_prog_ammo_log` | 40 | — | `flag_ammo_ui_detail` |
| `lz_prog_quick_reload` | 55 | `lz_prog_ammo_log` | `flag_reload_action` |
| `lz_prog_safe_burst` | 60 | `lz_prog_quick_reload` | `flag_burst_heat_minus_6` |
| `lz_prog_structure_mesh` | 45 | — | `flag_structure_plus_8` |
| `lz_prog_patch_arm` | 65 | `lz_prog_structure_mesh` | `flag_field_patch` |
| `lz_prog_emergency_seal` | 80 | `lz_prog_patch_arm` | `flag_extract_at_5_structure` |
| `lz_prog_sensor_sweep` | 50 | — | `flag_echo_scan` |
| `lz_prog_weather_lock` | 70 | `lz_prog_sensor_sweep` | `flag_wind_penalty_minus_10` |
| `lz_prog_puncture_read` | 90 | `lz_prog_weather_lock` | `flag_weakpoint_outline` |
| `lz_prog_frame_license_two` | 100 | `lz_prog_safe_burst`,`lz_prog_patch_arm` | `flag_second_frame_license` |
| `lz_prog_siege_protocol` | 140 | `lz_prog_puncture_read`,`lz_prog_emergency_seal` | `flag_siege_contracts` |

Daily/weekly contracts are capped: `daily_cinder_coolers` (collect 5 `coolant_dust`, 24 gold), `daily_signal_checks` (visit 3 signal POIs, 26 gold), `daily_clean_shots` (ledger_kill 4 skins with ammo remaining, 30 gold), `weekly_shearline` (clear the 5-man, 90 gold and 20 marks), and `weekly_alarm_record` (complete one siege phase, 120 gold and 35 marks).

## 11) Theme Kit and copy

The palette is furnace orange, storm blue, wet graphite, chalk white, and warning yellow. Materials are brushed steel, ceramic insulation, oilskin, braided cable, and rain-glossed glass. Dice are heavy gunmetal with white engraved numerals and one orange heat pip. The voice is practical, restrained, and humane: alarms are crisp, pilots speak over wind, and victories end with maintenance sounds. The ambient loop is **“Rain on the Gantry”**, a 92-second pattern of roof rain, distant hydraulic knocks, low transformer hum, and one three-note warning chime. Fashion defaults are patched flight coats, utility harnesses, visor scarves, route cords, and weatherproof boots.

### UI labels

| Generic label | Lanceyard label |
|---|---|
| Inventory | Locker |
| Journal | Contract Ledger |
| Map | Route Board |
| Character | Pilot Sheet |
| Equipment | Hardpoints |
| Skills | Frame Licenses |
| Party | Crew Roster |
| Quest accepted | Contract stamped |
| Quest complete | Contract witnessed |
| Health | Structure |
| Mana/resource | Heat |
| Ammo | Rounds |
| Fast travel | Marked rail |
| Dungeon | Instance door |
| Boss | Anchor frame |
| Loot | Personal salvage |
| Currency | Gold |
| Premium currency | Cosmetic tokens |
| Settings | Instrument panel |
| Tutorial | First sortie |

### New Game hook cards

1. “Your frame wakes beneath a roof of rain, and the coolant gauge is already lying.”
2. “A red signal burns across the marsh; someone chose the wrong train to stop.”
3. “The glass flats remember every shot, but not who fired first.”
4. “Under the market, a valve knocks three times and then goes quiet.”
5. “You can save the trapped cooler or preserve the contract that bought it.”
6. “The valley does not need a hero; it needs a pilot who logs the damage.”
7. “Four routes meet in Crosswind, and each crew claims the safest one.”
8. “Nine alarms wait in the Crown, but the first one is inside your own reactor.”
9. “A frame is metal until a person decides what it is for.”
10. “Sign your name, check your heat, and take the road that still has witnesses.”

## 12) Failures and John’s calls

| Clone risk | Avoidance call |
|---|---|
| It feels like a licensed transforming robot show. | Frames do not transform, combine, or use named hero archetypes; identity comes from maintenance, routes, and heat decisions. |
| It becomes jousting with metal horses. | No tournament lance pageantry; the lance is a tool-class hardpoint used in industrial weather and siege work. |
| It becomes a generic military academy. | There is no academy, chosen-one syllabus, or rank ladder; crews learn through local contracts and recorded consequences. |
| Heat is only a cosmetic meter. | Heat changes available actions, creates deterministic thermal trips, and competes with ammo and structure. |
| The siege becomes a conventional raid. | `nine_alarms_at_foundry_crown` is a ten-pilot infrastructure emergency with phase checkpoints and valve/alarm objectives. |

**Speculative default.** The default political resolution is a negotiated shared maintenance charter between Foundry Crown and Accord Hall; if later testing shows a stronger factional route is needed, the contract DAG can branch after `lz_campaign_08` without changing the locked frame rules.

## Integrity checklist

1. `worldId` is `lanceyard`.
2. File name is `WOF_lanceyard_Pack.md`.
3. Sections 0–12 are present.
4. Rules module is `frame_heat`.
5. Maturity is teen.
6. Four primary starts are defined.
7. Each start has a non-capital hub.
8. Capitals and mid-world join are defined.
9. The travel graph has no teleport shortcut.
10. All presented IDs are lowercase snake_case.
11. Quest rewards are numeric gold and XP.
12. Quest objectives use code-owned objective verbs.
13. Primary start has 20 authored quest beats.
14. Campaign spine has 15 authored beats.
15. Divergence records are explicit.
16. Six durable NPCs are defined per start.
17. Full canned talk categories are supplied for each NPC group.
18. The five-room instance describes each room before encounters.
19. The five-man is soloable by the stated companion-frame rule.
20. The ten-pilot equivalent has three committed phases.
21. The frame catalog contains 16 original frames.
22. Each starting region lists 16 original combat skins.
23. No `Saltkin`-named creature is used.
24. Two wallets remain separate.
25. Premium excludes power, clears, ammo, repairs, and catch-like advantages.
26. Repair costs and daily caps are numeric.
27. Progression has 14 earned nodes.
28. Daily and weekly contracts are capped.
29. UI copy is Lanceyard-specific.
30. NPC dialogue contains no engine or live-service terminology.
31. The world is not jousting.
32. The world is not a licensed mecha resemblance.
33. Forbidden franchise names are confined to the ban-list and are not canon.
34. No excluded dump title is used as a canon place, faction, or creature.
35. There are no live-service references.
36. There are no production app instructions.
37. There are no placeholders or TBD entries.
38. Stakes appear in opening choices.
39. Fog behavior distinguishes visited pins from outlines.
40. Every major claim is internal content specification, not external factual research.
