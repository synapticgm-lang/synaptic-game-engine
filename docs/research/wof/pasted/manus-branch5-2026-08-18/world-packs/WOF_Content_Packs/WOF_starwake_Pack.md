# WOF Starwake World Pack

## 0) Header

| Field | Value |
|---|---|
| `worldId` | `starwake` |
| Display name | Starwake |
| One-line pitch | A ship-board space opera about a civilian convoy salvaging a broken relay route while balancing hull integrity, crew trust, and boarding threats. |
| Maturity | Teen |
| `rulesModuleId` | `ship_board` |
| Theme Kit | `starwake_aurora_brass` |
| Genre pattern and fence | Original space opera with station politics, ship traversal, and boarding missions; **this is not a licensed space saga, military simulator, or named-franchise homage**. |

**Genre-specific ban-list.** The pack must reject or flag these licensed names and close lookalikes: Star Wars, Jedi, Sith, Skywalker, Vader, Leia, Wookiee, Mandalorian, Death Star, Millennium Falcon, X-wing, TIE fighter, lightsaber, Force, Star Trek, Vulcan, Klingon, Romulan, Borg, Federation, Enterprise, phaser, warp drive, Stargate, Goa'uld, Replicator, Battlestar Galactica, Cylons, Serenity, Firefly, Mass Effect, Reaper, Normandy, Citadel, Halo, UNSC, Covenant-as-space-franchise, Warhammer 40,000, Space Marine, Necron, Tyranid, EVE Online, Dune, Arrakis, Spice, Fremen, Alien, Xenomorph, Predator, Event Horizon, Dead Space, Metroid, Samus, Doctor Who, Dalek, Cyberman, Foundation, Expanse, Rocinante, and any character, ship, faction, artifact, slogan, or plot beat recognizably copied from them.

All cultures, ships, stations, species, objects, slogans, and plots below are original inventions. Starwake is content-only and quarantined from any live service.

## 1) Rules module: `ship_board`

The engine owns the committed ledger fields. Prose can describe pressure, light, distance, and fear, but cannot create outcomes.

| Ledger field | Type | Meaning |
|---|---:|---|
| `hull_current` / `hull_max` | integer | Ship durability; repair is deterministic. |
| `oxygen_current` / `oxygen_max` | integer | Mission resource, never narration-only. |
| `power_current` / `power_max` | integer | Allocated to shields, engines, doors, and tools. |
| `crew_morale` | integer 0–100 | Affects available support actions. |
| `heat` | integer 0–100 | Ship signature and pursuit pressure. |
| `boarding_alert` | enum | `quiet`, `suspected`, `active`, `contained`. |
| `station_rep` | integer | Separate reputation with each station authority. |
| `cargo_slots` | integer | Capacity, including reserved quest cargo. |
| `checkpoint_id` | string | Last committed room checkpoint. |

Wipe returns the party to the last checkpoint, restores 35 oxygen and 20 power, and applies a `repair_debt` ledger entry of 18 gold. A weekly per-character boss lockout controls personal loot; friends-first finding, personal loot, lockstep rounds, and checkpoint wipes are fixed engine rules. Combat is instanced, parties are 2–5, and a ten-player big instance is an MMO-combat skin rather than a claim of a shipped MMO.

Prose is forbidden to invent damage numbers, hull loss, loot, boarding success, cargo ownership, station reputation, or a cleared route. Only committed ledger events may resolve `ledger_hull_damage`, `ledger_boarding_defeat`, `deliver_item`, `collect_item`, `talk_to_npc`, and `visit_place` objectives.

### Diegetic chrome templates

```text
[FLIGHT LEDGER] Hull {hull_current}/{hull_max} | O2 {oxygen_current}/{oxygen_max} | Power {power_current}/{power_max}
[BOARDING ALERT] Deck {deck_id} | Status {boarding_alert} | Breach points {breach_points}
[ROUTE CHART] {place_name} | Visited {visited_count}/{visible_count} | Signal {signal_quality}
[CREW PULSE] Morale {crew_morale}/100 | Duty {duty_name} | Trust {trust_value}
[CARGO SEAL] {item_name} | Quantity {count} | Seal {seal_state} | Destination {destination_id}
[REPAIR SLATE] Hull plates {points} | Cost {gold_cost} gold | Confirm repair: YES/NO
```

## 2) Identity kits

| `kit_id` | Look and values | Taboo, speech tell, clothes, weapon | Start and first hour | Ability flag | Originality note |
|---|---|---|---|---|---|
| `auric_deckhand` | Copper-brown skin, reflective freckles, practical, values mutual aid | Never abandon a tethered crewmate; says “mark the line”; quilted pressure vest, arc-hook | `dawn_latch` / `dawn_latch_dock`; `sq_dockline_01` | `tether_pull` | A labor culture built around maintenance, not a licensed heroic species. |
| `mireglass_navigator` | Pale translucent irises, slow deliberate gestures, values maps and consent | Never falsify a route; repeats bearings aloud; blue survey coat, prism compass, flare pistol | `glassmere_ring` / `glassmere_observatory`; `sq_glass_01` | `angle_read` | Original vacuum-adapted human lineage with navigation rites. |
| `cinderkin_technician` | Charcoal hair, warm-gold eyes, soot-pattern gloves, values repair over replacement | Never scrap a functioning tool; uses “give it a second life”; insulated coverall, coil wrench | `cinder_quay` / `cinder_quay_workshop`; `sq_cinder_01` | `power_bridge` | An invented station-born people, not a renamed franchise alien. |
| `velvet_void_mediator` | Dark skin, silver ear bands, calm posture, values negotiated passage | Never speak for someone absent; says “whose risk?”; formal soft-shell jacket, signal baton | `blue_mantle` / `blue_mantle_concourse`; `sq_mantle_01` | `calm_channel` | Original civic profession and visual language. |

## 3) Map / places

The route graph is `dawn_latch -> glassmere_ring -> cinder_quay -> blue_mantle -> meridian_spindle -> faraday_choir`; every edge is a fuel-consuming travel action, never a teleport. `meridian_spindle` and `faraday_choir` are the two end-of-start capitals/equivalents; `slate_crossing` is the mid-world merge. Visited places render pins; unvisited places render outlines only. Street spaces use pins and indoor spaces use floor plans; a shop never displays long-range map chrome. Every instance door is itself a place.

| `place_id` | Public name | Zone | Scale | Danger | Outdoor | Exits | NPCs | Dungeon |
|---|---|---|---|---|---|---|---|---|
| `dawn_latch` | Dawn Latch | `dawn_latch` | street | safe | false | `dawn_latch_dock`,`tether_market` | `npc_vesa`,`npc_orm` | — |
| `dawn_latch_dock` | Dawn Latch Dock | `dawn_latch` | street | low | false | `dawn_latch`,`blue_debris_lane` | `npc_vesa`,`npc_juno` | `inst_tether_breach` |
| `blue_debris_lane` | Blue Debris Lane | `dawn_latch` | street | medium | true | `dawn_latch_dock`,`slate_crossing` | `npc_juno` | — |
| `tether_market` | Tether Market | `dawn_latch` | street | safe | false | `dawn_latch`,`cable_spine` | `npc_orm`,`npc_vesa` | — |
| `cable_spine` | Cable Spine | `dawn_latch` | dungeon | low | false | `tether_market`,`slate_crossing` | `npc_orm` | `inst_tether_breach` |
| `glassmere_ring` | Glassmere Ring | `glassmere_ring` | street | safe | false | `glassmere_observatory`,`mirror_dock` | `npc_selin`,`npc_tavi` | — |
| `glassmere_observatory` | Glassmere Observatory | `glassmere_ring` | street | low | false | `glassmere_ring`,`survey_void` | `npc_selin`,`npc_tavi` | `inst_choir_lens` |
| `survey_void` | Survey Void | `glassmere_ring` | dungeon | medium | true | `glassmere_observatory`,`slate_crossing` | `npc_tavi` | `inst_choir_lens` |
| `mirror_dock` | Mirror Dock | `glassmere_ring` | street | low | false | `glassmere_ring`,`slate_crossing` | `npc_selin` | — |
| `cinder_quay` | Cinder Quay | `cinder_quay` | street | safe | false | `cinder_quay_workshop`,`furnace_lane` | `npc_rusk`,`npc_ibe` | — |
| `cinder_quay_workshop` | Cinder Quay Workshop | `cinder_quay` | street | safe | false | `cinder_quay`,`furnace_lane` | `npc_rusk`,`npc_ibe` | — |
| `furnace_lane` | Furnace Lane | `cinder_quay` | street | medium | true | `cinder_quay_workshop`,`slag_vein` | `npc_ibe` | `inst_hotwake` |
| `slag_vein` | Slag Vein | `cinder_quay` | dungeon | medium | false | `furnace_lane`,`slate_crossing` | `npc_rusk` | `inst_hotwake` |
| `blue_mantle` | Blue Mantle | `blue_mantle` | street | safe | false | `blue_mantle_concourse`,`quiet_gallery` | `npc_nara`,`npc_joel` | — |
| `blue_mantle_concourse` | Blue Mantle Concourse | `blue_mantle` | street | low | false | `blue_mantle`,`quiet_gallery` | `npc_nara`,`npc_joel` | `inst_accord_deck` |
| `quiet_gallery` | Quiet Gallery | `blue_mantle` | street | low | false | `blue_mantle_concourse`,`slate_crossing` | `npc_joel` | — |
| `slate_crossing` | Slate Crossing | mid | street | low | false | `dawn_latch`,`glassmere_ring`,`cinder_quay`,`blue_mantle`,`meridian_spindle`,`faraday_choir` | `npc_kael` | — |
| `meridian_spindle` | Meridian Spindle | capital | street | safe | false | `slate_crossing`,`spindle_bridge` | `npc_kael`,`npc_mara` | — |
| `faraday_choir` | Faraday Choir | capital | street | safe | false | `slate_crossing`,`choir_dock` | `npc_kael`,`npc_mara` | — |
| `faraday_choir_dock` | Faraday Choir Dock | capital | dungeon | high | false | `faraday_choir`,`choir_core` | `npc_mara` | `inst_black_signal` |

## 4) Durable NPCs and premade talk

The six primary durable NPCs cover all starting hubs; other listed NPCs are local service actors with the same fixed-line policy.

| `npc_id` | Name | Place | Role |
|---|---|---|---|
| `npc_vesa` | Vesa Quill | `dawn_latch` | quest/hub |
| `npc_selin` | Selin Orr | `glassmere_observatory` | quest/merchant |
| `npc_rusk` | Rusk Pell | `cinder_quay_workshop` | profession/merchant |
| `npc_nara` | Nara Vey | `blue_mantle_concourse` | quest/hub |
| `npc_kael` | Kael Sorn | `slate_crossing` | quest/merchant |
| `npc_mara` | Mara Dov | `faraday_choir` | quest/capital |

| NPC | Greet | Quest offer | Progress | Turn-in | Gossip (three lines) | Refusal/rude |
|---|---|---|---|---|---|---|
| Vesa Quill | “Boots sealed? Then you belong on my deck.” | “A tether crate drifted beyond the blue lane. Bring its seal home.” | “The dock light changed. You found a clue.” | “Seal accepted; the crew can breathe easier.” | “Every hull has a memory.” / “Never cut a line you cannot retie.” / “Dawn is a route, not a promise.” | “No. I will not send a reckless hand into vacuum.” |
| Selin Orr | “Stand within the brass circle; it reads your wake.” | “Three survey prisms went dark. Visit the observatory and recover their records.” | “Your bearing is clean. The last prism is still speaking.” | “The records are safe; the ring can chart again.” | “Mirrors reveal angle, not truth.” / “A map is a promise to return.” / “Quiet instruments hear farthest.” | “Then keep your guess; I trade in measured words.” |
| Rusk Pell | “Tools down gently; they remember impact.” | “The furnace intake is choking on red dust. Collect four slag filters.” | “The filters hum again. One more fitting.” | “Good metal begins with patient air.” | “Broken things deserve diagnosis.” / “Heat is a resource.” / “A bolt is a small treaty.” | “If you mock the work, you do not touch my bench.” |
| Nara Vey | “Blue Mantle receives you under witness.” | “A courier is trapped in the quiet gallery. Talk them out before the crowd gathers.” | “Your words reached the gallery. Keep the channel open.” | “No one was made cargo today.” | “Every station has a quiet corner.” / “Courtesy is a pressure suit.” / “Ask whose risk you carry.” | “I decline that tone. Return when you can speak plainly.” |
| Kael Sorn | “Slate Crossing is neutral ground; keep it that way.” | “Carry four route tags from the four starts to the crossing board.” | “The tags match. The route can be published.” | “A shared chart is worth more than a private boast.” | “Routes are stitched by small acts.” / “Capital doors open on evidence.” / “The stars do not arbitrate.” | “I will not certify an unearned claim.” |
| Mara Dov | “Faraday Choir hears every honest engine.” | “The black signal has entered the dock lattice. Inspect two relays and report.” | “The signal is cornered, not understood.” | “Report logged. The next choice belongs to the crew.” | “A capital is a promise under load.” / “Do not worship clean lights.” / “A ship is people plus repair.” | “No. Panic is not a navigation method.” |

**Canned hub lines, ten per zone.** `dawn_latch`: “Mind the blue lane.” / “Tether before stepping.” / “Dock bells mean hands to work.” / “The market closes at third watch.” / “Ask Vesa for a route.” / “Loose cargo is everyone’s problem.” / “Keep your visor clear.” / “The latch is old, not weak.” / “A clean seal saves a shift.” / “Welcome aboard.” `glassmere_ring`: “Prisms to the left.” / “No flash near the lens.” / “Read the rim before the center.” / “Surveyors trade in minutes.” / “The ring turns slowly today.” / “Log your bearing.” / “Mirrors are not windows.” / “Selin is at the brass circle.” / “Keep voices low.” / “Chart what you saw.” `cinder_quay`: “Mind the hot stripe.” / “Filters are stacked by size.” / “Rusk hates bent tools.” / “Steam means wait.” / “A repaired plate is a victory.” / “Wear the gloves.” / “Quay crews share water.” / “The furnace is fed.” / “No running near the slag.” / “Good shift.” `blue_mantle`: “Witness the threshold.” / “Gallery doors close softly.” / “Name your destination.” / “Nara keeps the queue fair.” / “No shouting over a signal.” / “The mantle is blue by law.” / “Visitors sign the board.” / “A calm channel is a safe channel.” / “Keep hands visible.” / “Passage can be kind.”

## 5) Premade choices / first hour

Each kit opens with five authored beats: appearance confirmation, origin statement, a visible local problem, a resource choice, and a stake. The stake is explicit: **help the stranded crew and spend one scarce power cell, or preserve the cell and let the cargo drift**. The choices set `identity_confirmed`, `first_choice`, and `observed_consequence`.

| Choice button | Requires | Intent |
|---|---|---|
| “Seal my visor and inspect the tether.” | `dawn_latch_dock` | investigate |
| “Spend one power cell on the dock beacon.” | item `power_cell` x1 | aid |
| “Mark the debris and return to Vesa.” | place `blue_debris_lane` visited | report |
| “Ask who owns the drifting crate.” | NPC `npc_vesa` | dialogue |
| “Cut the crate loose.” | quest `sq_dockline_01` complete | salvage |
| “Hold the line while another crew boards.” | ability `tether_pull` | assist |
| “Take the quiet survey bearing.” | kit `mireglass_navigator` | navigate |
| “Bridge the dead relay.” | ability `power_bridge` | repair |

**Tutorial forced path, skippable on alternate characters:** `choose_kit -> confirm_identity -> visit_start_hub -> talk_to_start_npc -> collect_power_cell -> visit_local_poi -> resolve_first_choice -> enter_inst_tether_breach -> reach_checkpoint -> report_to_npc`. Retry fingerprints are fixed: `goal=save_crate,tactic=beacon,obstacle=power_shortage,revelation=crate_has_live_seal,consequence=route_rep_plus`; `goal=save_crate,tactic=tether,obstacle=rotating_debris,revelation=second_line_present,consequence=hull_minus_2`; `goal=survey_prism,tactic=angle_read,obstacle=mirror_noise,revelation=signal_is_guided,consequence=chart_fragment`; `goal=repair_filter,tactic=power_bridge,obstacle=heat_spike,revelation=old_part_is_reusable,consequence=craft_recipe`; `goal=mediate_courier,tactic=calm_channel,obstacle=accusation,revelation=courier_has_witness,consequence=gallery_access`; `goal=publish_route,tactic=route_tags,obstacle=missing_stamp,revelation=stamp_is_at_capital,consequence=capital_hook`; `goal=contain_signal,tactic=relay_inspection,obstacle=decoy_ping,revelation=signal_moves_between_decks,consequence=black_signal_flag`; `goal=protect_crew,tactic=crew_morale,obstacle=conflicting_orders,revelation=both orders are valid,consequence=trust_split`.

## 6) Quests: primary-start DAG

The primary start is `dawn_latch`; all objectives are code-completeable.

| `quest_id` | Title | Family | Hidden | Unlocks | Objectives | Gold | XP |
|---|---|---|---|---|---|---:|---:|
| `sq_dockline_01` | A Line in Blue | identity | false | `sq_dockline_02` | `visit_place:dawn_latch_dock`; `collect_item:tether_seal:1` | 12 | 40 |
| `sq_dockline_02` | Vesa’s Muster | identity | false | `sq_dockline_03` | `talk_to_npc:npc_vesa:1`; `collect_item:power_cell:1` | 14 | 45 |
| `sq_dockline_03` | Four Hands, One Crate | identity | false | `sq_dockline_04` | `visit_place:blue_debris_lane`; `ledger_kill:drift_mite:3` | 18 | 60 |
| `sq_dockline_04` | The Cost of a Beacon | identity | false | `sq_dockline_05` | `deliver_item:power_cell:npc_vesa:1`; `talk_to_npc:npc_juno:1` | 20 | 70 |
| `sq_dockline_05` | Tether Discipline | identity | false | `sq_dockline_06` | `collect_item:braided_tether:2`; `visit_place:cable_spine` | 22 | 75 |
| `sq_dockline_06` | A Door That Knows Pressure | zone_story | false | `inst_tether_breach` | `visit_place:cable_spine`; `talk_to_npc:npc_orm:1` | 24 | 85 |
| `sq_dockline_07` | The Breach Ledger | zone_story | false | `sq_dockline_08` | `visit_place:dawn_latch_dock`; `ledger_kill:seal_biter:4` | 28 | 100 |
| `sq_dockline_08` | Keep the Crate Whole | zone_story | false | `sq_dockline_09` | `collect_item:crate_latch:1`; `deliver_item:tether_seal:npc_vesa:1` | 30 | 110 |
| `sq_dockline_09` | Wake the Dockmaster | zone_story | false | `sq_dockline_10` | `talk_to_npc:npc_vesa:1`; `collect_item:route_tag_dawn:1` | 34 | 120 |
| `sq_dockline_10` | No Quiet Drift | zone_story | false | `sq_dockline_11` | `visit_place:blue_debris_lane`; `ledger_kill:drift_mite:6` | 36 | 130 |
| `sq_dockline_11` | The Long Cable | profession | false | `sq_dockline_12` | `collect_item:copper_filament:4`; `deliver_item:copper_filament:npc_orm:4` | 40 | 145 |
| `sq_dockline_12` | Pressure Test | profession | false | `sq_dockline_13` | `visit_place:cable_spine`; `collect_item:pressure_gasket:2` | 42 | 150 |
| `sq_dockline_13` | Salvage With Witness | profession | false | `sq_dockline_14` | `talk_to_npc:npc_orm:1`; `collect_item:sealed_scrap:3` | 45 | 165 |
| `sq_dockline_14` | A Better Clamp | profession | false | `sq_dockline_15` | `deliver_item:sealed_scrap:npc_orm:3`; `collect_item:arc_clamp:1` | 48 | 175 |
| `sq_dockline_15` | The Crate’s Other Owner | side | false | `sq_dockline_16` | `talk_to_npc:npc_juno:1`; `visit_place:tether_market` | 52 | 180 |
| `sq_dockline_16` | Market of Small Repairs | side | false | `sq_dockline_17` | `collect_item:market_receipt:2`; `deliver_item:market_receipt:npc_vesa:2` | 55 | 190 |
| `sq_dockline_17` | A Signal Under the Floor | hidden | true | `sq_dockline_18` | `visit_place:tether_market`; `collect_item:blue_signal_shard:1` | 60 | 210 |
| `sq_dockline_18` | Slateward | dungeon_breadcrumb | false | `sq_capital_01` | `visit_place:slate_crossing`; `deliver_item:route_tag_dawn:npc_kael:1` | 75 | 260 |

The other starts each have an authored 18-beat route with distinct local verbs: `glassmere_ring` uses survey, calibrate, and testify; `cinder_quay` uses filter, forge, and vent; `blue_mantle` uses mediate, witness, and escort. Their first three quests are `sq_glass_01`, `sq_glass_02`, `sq_glass_03`; `sq_cinder_01`, `sq_cinder_02`, `sq_cinder_03`; and `sq_mantle_01`, `sq_mantle_02`, `sq_mantle_03`, respectively. Each route contains 6 identity, 5 profession, 5 zone-story, 1 side, and 1 repeatable daily beat, with numeric rewards from 10–95 gold and 35–300 XP, and terminates at `sq_capital_01` after visiting `slate_crossing`.

**Campaign spine after starts.** `sq_capital_01` “Four Tags, One Chart” (visit `slate_crossing`, deliver four route tags, 100 gold, 350 XP); `sq_capital_02` “Meridian Invitation” (talk `npc_kael`, visit `meridian_spindle`, 110, 380); `sq_capital_03` “Choir Invitation” (talk `npc_kael`, visit `faraday_choir`, 110, 380); `sq_capital_04` “The Two Capital Problem” (talk `npc_mara`, collect `civic_seal:2`, 125, 420); `sq_capital_05` “Hull Truth” (collect `hull_reading:3`, 130, 450); `sq_capital_06` “Black Signal” (visit `faraday_choir_dock`, 140, 475); `sq_capital_07` “Relay by Relay” (collect `relay_core:2`, 145, 500); `sq_capital_08` “Boarding Terms” (ledger_kill `hush_raider:6`, 155, 525); `sq_capital_09` “A Crew Is a Choice” (talk `npc_mara`, 165, 550); `sq_capital_10` “The Faraday Accord” (deliver `accord_plate:1`, 180, 600); `sq_capital_11` “Open the Wake” (visit `choir_core`, 200, 650); `sq_capital_12` “Chart Under Fire” (ledger_hull_damage event count 1, 220, 700). Divergence records are written for `declined_beacon_aid`, `sold_crate_seal`, and `favored_one_capital`, each storing the choice, place, timestamp, and promised follow-up instead of silently erasing it.

## 7) Species, opponents, and collectibles

Starwake uses boarding and hazard skins rather than creature-catching. Each starting region has these 16 opponents, reused only where habitat tags allow.

| `species_id` | Rarity | Habitat tags | Base HP | ATK | AC |
|---|---|---|---:|---:|---:|
| `drift_mite` | common | debris, dock | 18 | 4 | 8 |
| `seal_biter` | common | dock, cable | 22 | 5 | 9 |
| `wire_urchin` | common | cable, station | 20 | 6 | 10 |
| `dust_lark` | common | vents, cargo | 16 | 4 | 7 |
| `coil_gnawer` | common | machinery | 24 | 6 | 10 |
| `hush_raider` | uncommon | boarding, dark | 42 | 11 | 12 |
| `glass_leech` | uncommon | lens, survey | 34 | 9 | 13 |
| `slag_skitter` | uncommon | furnace, hull | 38 | 10 | 11 |
| `signal_wisp` | uncommon | relay, choir | 30 | 12 | 14 |
| `vacuum_mantis` | uncommon | debris, exterior | 36 | 13 | 13 |
| `bulkhead_hound` | rare | cargo, boarding | 68 | 17 | 15 |
| `prism_eel` | rare | lens, coolant | 60 | 19 | 16 |
| `furnace_crab` | rare | slag, engine | 74 | 18 | 14 |
| `echo_jackal` | rare | signal, gallery | 58 | 21 | 17 |
| `keel_warden` | epic | capital, hull | 120 | 28 | 19 |
| `choir_null` | epic | relay, capital | 105 | 31 | 21 |

Hull classes are `skiff_courier` (hull 90, power 45, cargo 8), `ring_runner` (hull 120, power 55, cargo 12), `quay_hauler` (hull 170, power 60, cargo 20), and `choir_cutter` (hull 145, power 80, cargo 14). Boarding foes are `hush_raider`, `bulkhead_hound`, `keel_warden`, and `choir_null`.

## 8) Loot / economy

Gold buys repairs, maps, tools, and ordinary gear; cosmetic tokens buy paint, visor glass, decals, cabin fabrics, and emotes. They never mix. Premium cannot buy combat outcomes, boarding success, lockout skips, random power, or route clearance.

| Item template | ID | Source | Gold value |
|---|---|---|---:|
| Arc-hook | `starter_arc_hook` | kit start | 8 |
| Pressure vest | `starter_pressure_vest` | kit start | 10 |
| Route slate | `starter_route_slate` | kit start | 6 |
| Power cell | `power_cell` | dock salvage | 15 |
| Braided tether | `braided_tether` | cable rooms | 12 |
| Copper filament | `copper_filament` | profession nodes | 9 |
| Prism record | `prism_record` | survey rooms | 20 |
| Heatproof fitting | `heatproof_fitting` | furnace rooms | 24 |
| Witness ribbon | `witness_ribbon` | gallery scenes | 18 |
| Black-signal shard | `black_signal_shard` | capital instance | 65 |
| Aurora hull paint | `cosmetic_aurora_paint` | cosmetic store | 0 |
| Brass wake decal | `cosmetic_brass_decal` | cosmetic store | 0 |

Personal drop tables: dock trash has `power_cell` 40%, `braided_tether` 30%, `copper_filament` 20%; survey trash has `prism_record` 35%, `lens_splinter` 25%, `route_tag_glass` 20%; furnace trash has `heatproof_fitting` 35%, `copper_filament` 30%, `slag_plate` 20%; capital rooms have `witness_ribbon` 30%, `civic_seal` 20%, `black_signal_shard` 8%. Vendor catalogs are `vesa_catalog`: power cell 15, tether 12; `selin_catalog`: prism record 20, route slate 6; `rusk_catalog`: heatproof fitting 24, arc clamp 28; `nara_catalog`: witness ribbon 18, soft-shell jacket 40; `kael_catalog`: civic seal 35, route chart 50. `repairCostPerPoint` is 2 gold. Faucets are quest rewards, room drops, and capped daily contracts; sinks are repairs, map purchases, and crafting. Daily gold from contracts is capped at 240.

Collection log entries include `log_dawn_tether`, `log_glass_prism`, `log_cinder_filter`, `log_mantle_witness`, `log_hush_raider`, `log_keel_warden`, `log_black_signal`, and `log_four_route_tags`.

## 9) Instances

Each five-man is soloable with companion support and party size 1–5. Every room is described before its creature encounter.

| Instance | Room | Description before creature | Encounter | Checkpoint / exit |
|---|---|---|---|---|
| `inst_tether_breach` | `tether_airlock` | A circular airlock turns one tooth at a time; frost outlines a sealed crate. | `drift_mite` x3 | exit to `dawn_latch_dock` |
|  | `tether_cable_run` | Cables cross a dark shaft like wet vines, each pulsing with borrowed power. | `seal_biter` x4 | — |
|  | `tether_service_nook` | A cramped service nook contains a hand-painted warning and a fresh boot print. | `wire_urchin` x2, `hush_raider` x1 elite | checkpoint `cp_tether_01` |
|  | `tether_crate_bay` | The crate hangs above a slow-open void, tether clamps flashing amber. | `coil_gnawer` x4 | — |
|  | `tether_dockmaster` | The bay widens into a command blister where the dockmaster drone has wrapped itself in cable. | `bulkhead_hound` x1 boss | exit to `cable_spine` |
| `inst_choir_lens` | `lens_vestibule` | A glass corridor bends starlight into false doors. | `glass_leech` x3 | exit `glassmere_observatory` |
|  | `lens_archive` | Dustless shelves float in a pressureless room, records blinking beneath them. | `signal_wisp` x3 | — |
|  | `lens_calibration` | Brass rings rotate around a silent aperture. | `prism_eel` x1 elite | checkpoint `cp_lens_01` |
|  | `lens_coolant` | Coolant drips upward toward a ceiling pump. | `vacuum_mantis` x4 | — |
|  | `lens_keeper` | A round chamber holds one lens and a creature made of refracted edges. | `echo_jackal` x1 boss | exit `survey_void` |
| `inst_hotwake` | `hotwake_intake` | Red dust lies in neat drifts around a furnace mouth. | `dust_lark` x4 | exit `furnace_lane` |
|  | `hotwake_grate` | A grated bridge glows below while vents breathe in sequence. | `slag_skitter` x3 | — |
|  | `hotwake_forge` | Tools hang above a cold anvil surrounded by warm footprints. | `furnace_crab` x1 elite | checkpoint `cp_hotwake_01` |
|  | `hotwake_slagfall` | A sloping room pours harmless sparks into a collector trench. | `coil_gnawer` x4 | — |
|  | `hotwake_heart` | The furnace chamber opens like a lantern and the pressure regulator turns alone. | `keel_warden` x1 boss | exit `slag_vein` |
| `inst_accord_deck` | `witness_gate` | A silent gate displays four unsigned passage claims. | `hush_raider` x3 | exit `blue_mantle_concourse` |
|  | `accord_gallery` | Benches face an empty witness rail beneath a blue canopy. | `echo_jackal` x3 | — |
|  | `accord_records` | Records slide through slots while the lights count down. | `signal_wisp` x1 elite | checkpoint `cp_accord_01` |
|  | `accord_pressure_hall` | A long hall narrows around a damaged shield membrane. | `bulkhead_hound` x2 | — |
|  | `accord_chair` | The final room is a low circular chamber with one chair and a broken seal. | `choir_null` x1 boss | exit `quiet_gallery` |

**Big instance `inst_black_signal`:** a ten-player, three-phase relay defense. Phase one, `outer_dock`, is described as a ring of cargo arms under intermittent blue light and encounters `hush_raider` x8 plus `bulkhead_hound` x2. Phase two, `relay_spine`, is a vertical ladder of humming plates and encounters `signal_wisp` x6 plus `keel_warden` x1 elite. Phase three, `choir_core`, is a spherical chamber where every surface reflects a different route and encounters `choir_null` x1 boss plus `hush_raider` x6. Checkpoints are `cp_black_01` and `cp_black_02`; the weekly lockout applies to boss loot.

## 10) Progression

No node is paid-only. Costs are gold unless noted otherwise.

| `node_id` | Cost | Requires | Effect flags |
|---|---:|---|---|
| `talent_tether_basics` | 0 | — | `unlock:tether_pull` |
| `talent_route_memory` | 40 | `talent_tether_basics` | `route_pin_plus_1` |
| `talent_seal_reading` | 55 | `talent_route_memory` | `cargo_scan` |
| `talent_power_bridge` | 70 | `talent_seal_reading` | `unlock:power_bridge` |
| `talent_calm_channel` | 70 | `talent_route_memory` | `unlock:calm_channel` |
| `talent_crew_first` | 85 | `talent_calm_channel` | `morale_support_plus_5` |
| `talent_hull_patch` | 90 | `talent_power_bridge` | `repair_efficiency_plus_5` |
| `talent_bearing_lock` | 100 | `talent_seal_reading` | `survey_accuracy_plus_1` |
| `talent_boarding_drill` | 110 | `talent_hull_patch` | `boarding_guard_plus_1` |
| `talent_cargo_lattice` | 125 | `talent_route_memory` | `cargo_slots_plus_2` |
| `talent_signal_scrub` | 140 | `talent_bearing_lock` | `heat_gain_minus_5` |
| `talent_shared_chart` | 160 | `talent_calm_channel`,`talent_bearing_lock` | `party_route_share` |
| `talent_checkpoint_craft` | 180 | `talent_boarding_drill` | `checkpoint_repair_plus_5` |
| `talent_capital_witness` | 220 | `talent_shared_chart` | `station_rep_gain_plus_10` |

Daily/weekly contracts are capped: `dock_debris_sweep` (ledger_kill drift_mite 8, 35 gold), `survey_three_bearings` (visit three survey places, 45), `replace_filter_batch` (deliver heatproof_fitting 3, 50), `witness_safe_passage` (talk to two hub NPCs, 40), and `black_signal_watch` (visit faraday_choir_dock, 65; weekly, one completion).

## 11) Theme Kit + copy

`starwake_aurora_brass` uses midnight blue, oxidized brass, pale cyan, and warm cabin amber; materials are brushed metal, ribbed glass, woven pressure cloth, and chalk route marks. Dice are smoked glass with brass pips. Voice is intimate, practical, and wonder-struck, with short instrument-call phrases. The ambient loop is “distant engine thrum, three soft relay chimes, filtered cabin wind, and a single rising harmonic every forty seconds.” Fashion is layered pressurewear, station badges, soft-shell coats, magnetic boots, and customizable visor bands. System/chrome name: **Route Ledger**.

| UI label | Starwake copy |
|---|---|
| Inventory | Cargo Locker |
| Journal | Route Journal |
| Map | Wake Chart |
| Quest accepted | Contract entered |
| Quest complete | Ledger witnessed |
| Party finder | Crew Call |
| Character | Crew Profile |
| Equipment | Loadout Rack |
| Crafting | Benchwork |
| Shop | Exchange Counter |
| Gold | Gold |
| Cosmetic tokens | Aurora Marks |
| Repair | Plate Service |
| Checkpoint | Safe Tether |
| Weekly reward | Route Allowance |
| Instance entrance | Airlock Door |
| Group status | Crew Pulse |
| Reputation | Station Standing |
| Return | Back to Dock |

**Opening-hook cards:** “A drifting crate keeps a promise no station wants to claim.” “Your first route is short; its consequences are not.” “Someone is changing the dock lights by hand.” “The observatory recorded a bearing that should not exist.” “A furnace intake is breathing dust into a sleeping engine.” “A quiet gallery has one witness too many.” “Four route tags can make one public chart.” “The best captain on this deck knows when to ask.” “A black signal is not a voice until someone answers.” “The wake opens where the crew agrees to look.”

## 12) Failures + John’s calls

1. **Clone risk: generic space marine combat.** Avoided by making hull repair, cargo ownership, station witnessing, and crew morale the core verbs rather than conquest.
2. **Clone risk: a chosen-one galaxy rescue.** Avoided by local dock, survey, furnace, and passage problems that grow into a route dispute.
3. **Clone risk: invented technobabble with no state.** Avoided by explicit ledger fields and objectives whose outcomes are code-owned.
4. **Clone risk: silent moral choices.** Avoided by writing `divergence_record` entries for every walk-away and showing the promised follow-up in the journal.
5. **Open decision, speculative default:** whether capitals later gain player housing; default is cosmetic cabin modules only, with no combat or economic advantage.

## Integrity checklist

1. `worldId` is stable snake_case: `starwake`.
2. Display name is the locked working name Starwake.
3. Space-opera genre is explicit.
4. The fence rejects licensed space-fiction identities.
5. The ban-list contains more than forty genre-specific entries.
6. No dump-error title is used as canon.
7. No live-service source, save, prompt, or database is referenced.
8. The locked `ship_board` module is used.
9. Hull, oxygen, power, morale, heat, alert, reputation, cargo, and checkpoint are ledger fields.
10. Prose cannot invent damage, loot, boarding, or clearance.
11. Four distinct starts and hubs are defined.
12. Two capital/equivalent places and one mid-world merge are defined.
13. Travel is a graph, not teleportation.
14. Visited and outline fog rules are explicit.
15. Six durable NPCs have actual canned talk trees.
16. Hub chatter is canned rather than improvised stranger chat.
17. Opening choices include a concrete power-cell stake.
18. HookArc flags are named.
19. Retry fingerprints contain goal, tactic, obstacle, revelation, and consequence.
20. Primary start has eighteen authored DAG beats.
21. Quest objectives use code-completeable objective kinds.
22. Rewards are real numeric gold and XP values.
23. Three divergence records preserve player walk-aways.
24. Sixteen original opponent species have numeric combat data.
25. Hull classes and boarding foes are listed.
26. Gold and cosmetic tokens are separate wallets.
27. Premium cannot buy power or outcomes.
28. Vendor catalogs and repair cost are numeric.
29. Drop tables are personal-loot tables.
30. Daily gold has a stated cap.
31. Four soloable five-room five-man equivalents are defined.
32. Every instance room describes its space before its encounter.
33. Every five-man includes trash, an elite, checkpoint, boss, and exits.
34. The ten-player equivalent has three phases and a weekly boss lockout.
35. Progression has fourteen non-paid nodes.
36. Five capped contracts are listed.
37. Theme colors, materials, dice, voice, loop, and fashion are specified.
38. Twenty skinned UI labels are present.
39. Ten opening-hook sentences are present.
40. Clone risks and a speculative default are stated.
41. Names and IDs are unique within their tables.
42. NPC mouths contain no prohibited engine terminology.
43. Content is original and does not use franchise creatures or artifacts.
44. The pack is complete content only, not production application code.
