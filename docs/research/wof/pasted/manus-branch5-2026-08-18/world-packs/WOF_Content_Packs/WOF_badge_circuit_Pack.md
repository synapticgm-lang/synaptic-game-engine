# WOF World Pack: Badge Circuit

## 0) Header

| Field | Value |
|---|---|
| `worldId` | `badge_circuit` |
| Display name | Badge Circuit |
| Pitch | Licensed patrol crews protect four districts while rival capes, civic fear, and collateral damage test what heroism costs. |
| Maturity | Teen |
| `rulesModuleId` | `hp_check` |
| Theme Kit | Signalglass Patrol |
| Genre fence | Original superhero patrol drama with neighborhood-scale cases; **this is not a licensed comic universe, academy franchise, or caped multiverse.** |

**Ban-list.** Do not use or evoke Superman, Batman, Wonder Woman, Spider-Man, Iron Man, Captain America, Thor, Hulk, X-Men, Avengers, Justice League, Fantastic Four, Watchmen, Invincible, The Boys, Hellboy, Spawn, Kick-Ass, Umbrella Academy, My Hero Academia, One-Punch Man, The Incredibles, Hancock, Kick-Ass, The Mask, V for Vendetta, Dark Horse, Marvel, DC, Gotham, Metropolis, Krypton, Wakanda, Asgard, Xavier, Stark, Wayne, Kent, Parker, Rogers, Amazon warrior, Kryptonian, mutant school, radioactive spider, secret identity billionaire, infinity stones, power armor, or any recognizable catchphrase, costume, origin, city, team, or plot from those properties.

## 1) Rules module

The ledger owns `hp`, `max_hp`, `resolve`, `max_resolve`, `threat`, `heat`, `district_reputation`, `case_flags`, `inventory`, `quest_state`, `checkpoint_id`, and `lockout_until`. It resolves dice, damage, knockouts, evidence collection, arrests, rewards, and instance completion. Prose may describe intent and sensory detail, but may not invent damage values, loot, arrest success, evidence validity, case completion, or rewards.

Wipes return a party to the latest checkpoint with `hp=60% max_hp`, preserve collected evidence, and apply no gold loss. A boss has a weekly per-character lockout; personal loot is rolled after committed completion. Parties contain 1–5 players, with private co-op and instanced combat. Overworld presence exposes only nearby count and race tags.

### Diegetic chrome templates

```text
[BEACON // CASE OPEN] case_id={id} district={district} priority={priority}
[IMPACT CHECK] {actor} -> {target} | move={move} | result={success/fail} | hp_delta={ledger_value}
[THREAT METER] district={district} | public_alarm={0..100} | collateral={0..100}
[EVIDENCE LOCK] item={item_id} | chain={sealed/open} | witness={npc_id}
[WARDEN REPORT] checkpoint={checkpoint_id} | arrests={n} | civilians_safe={n} | payout={gold}
[REPUTATION] district={district} | trust={value} | unlocked={flag}
```

## 2) Identity kits

All kits are original civic responder archetypes, not licensed character kits.

| `kit_id` | Look, values, taboo, speech tell | Clothes / weapon | Start / first quest / flag |
|---|---|---|---|
| `street_sentinel` | Reflective raincoat, patient, values safe exits; taboo: never abandon a bystander; says “count the doors”; padded coat / baton-shield | `northline_market` / `bc_sentinel_rollcall` / `ability_barrier_arc` |
| `signal_runner` | Bright scarf, restless courier, values speed; taboo: never forge a distress call; says “route is clear”; courier jacket / cable-line launcher | `glassline_roofways` / `bc_runner_firstline` / `ability_flash_step` |
| `ward_healer` | Ceramic mask and utility sash, values consent; taboo: never touch an injured stranger unasked; says “name the pain”; medic vest / pulse gauntlet | `canalward_clinics` / `bc_healer_consent` / `ability_mend_field` |
| `civic_analyst` | Modular visor, observant, values proof; taboo: never publish an unverified accusation; says “show me the seam”; survey coat / prism projector | `foundry_belt` / `bc_analyst_seam` / `ability_trace_lens` |

Opening stake: choose whether to save a trapped courier (`stake_public_safety`), preserve a suspect’s evidence (`stake_due_process`), or chase the fleeing attacker (`stake_fast_capture`); one option is recorded as `first_choice` and changes the first district trust delta.

## 3) Map / places

The city is **Morrowglass**, a ring of four starts connected by the civic tram to `junction_hub`, then to two capitals. Visited places render as pins; unvisited places show outlines only. Streets use pins, interiors use floor plans, and scale never exceeds the room being entered. Instance doors are places.

| Start zone | Hub | POIs (`id`: public name; scale; danger; outdoor; exits) |
|---|---|---|
| `northline_market` | `civic_hall_north` | `market_square`: Northline Market; street; safe; yes; `north_gate`; `old_clock`: Old Clock; street; low; yes; `market_square`; `tram_depot`: Tram Depot; street; low; yes; `junction_hub`; `spice_arcade`: Spice Arcade; street; low; no; `market_square`; `roof_tanks`: Roof Tanks; street; medium; yes; `old_clock`; `north_gate`: North Gate; street; low; yes; `tram_depot`; `ledger_room_north`: Ledger Room; dungeon; medium; no; `civic_hall_north`; `civic_hall_north`: Civic Hall; street; safe; no; `market_square`, `ledger_room_north` |
| `glassline_roofways` | `lantern_bridge` | `glassline_station`: Glassline Station; street; safe; yes; `roofway_east`; `roofway_east`: East Roofway; street; low; yes; `glassline_station`,`antenna_yard`; `antenna_yard`: Antenna Yard; street; medium; yes; `roofway_east`; `billboard_spine`: Billboard Spine; street; low; yes; `glassline_station`; `drainfall_steps`: Drainfall Steps; street; medium; yes; `lantern_bridge`; `service_lift`: Service Lift; street; low; no; `glassline_station`; `signal_vault`: Signal Vault; dungeon; medium; no; `service_lift`; `lantern_bridge`: Lantern Bridge; street; safe; yes; `junction_hub`; `junction_hub` |
| `canalward_clinics` | `blue_tile_infirmary` | `canal_gate`: Canal Gate; street; safe; yes; `clinic_row`; `clinic_row`: Clinic Row; street; low; yes; `canal_gate`,`pump_house`; `pump_house`: Pump House; street; medium; no; `clinic_row`; `floating_garden`: Floating Garden; street; low; yes; `clinic_row`; `underwalk`: Underwalk; street; medium; no; `canal_gate`; `flood_marker`: Flood Marker; street; low; yes; `underwalk`; `quiet_boat`: Quiet Boat; street; low; yes; `floating_garden`; `triage_cellar`: Triage Cellar; dungeon; medium; no; `blue_tile_infirmary`; `blue_tile_infirmary`: Blue Tile Infirmary; street; safe; no; `clinic_row`,`triage_cellar` |
| `foundry_belt` | `copper_yard` | `foundry_gate`: Foundry Gate; street; safe; yes; `kiln_lane`; `kiln_lane`: Kiln Lane; street; low; yes; `foundry_gate`,`slag_viaduct`; `slag_viaduct`: Slag Viaduct; street; medium; yes; `kiln_lane`; `maker_row`: Maker Row; street; low; yes; `copper_yard`; `cooling_tower`: Cooling Tower; street; medium; yes; `slag_viaduct`; `scrap_court`: Scrap Court; street; low; no; `maker_row`; `rail_spur`: Rail Spur; street; medium; yes; `foundry_gate`; `blueprint_bunker`: Blueprint Bunker; dungeon; medium; no; `copper_yard`; `copper_yard`: Copper Yard; street; safe; no; `maker_row`,`blueprint_bunker` |

`junction_hub` joins to `civic_capital` and `watch_capital`; the campaign route is `junction_hub -> civic_capital -> watch_capital`. No teleport exists; tram travel costs 3 gold and requires the previous hub visited. Capitals are end-of-start merge hubs, not starting districts.

## 4) Durable NPCs and canned talk

| `npc_id` | Name | Place | Role |
|---|---|---|---|
| `marshal_arden` | Marshal Arden Vale | `civic_hall_north` | quest/hub |
| `broker_mira` | Mira Quell | `market_square` | merchant/local |
| `runner_jo` | Jo Vey | `lantern_bridge` | quest/profession |
| `medic_senn` | Senn Orra | `blue_tile_infirmary` | quest/profession |
| `maker_daro` | Daro Flint | `copper_yard` | merchant/profession |
| `witness_ren` | Ren Pell | `junction_hub` | quest/local |

For each NPC, the following full talk tree is canonical; replace `{npc}` with the speaker and `{case}` with the active case id.

| Node | Canned line |
|---|---|
| greet | “You found the right desk. State your name and keep your hands visible.” |
| quest_offer | “A local case is open: `{case}`. I can offer the safe route or the fast route; neither is free of consequence.” |
| quest_progress | “Your report is logged. Bring the marked item or speak to the named witness; a story alone cannot close this case.” |
| quest_turnin | “Evidence accepted. The ledger records the result, and the district will remember how you handled it.” |
| gossip 1 | “Morrowglass has bright windows and dark stairwells.” |
| gossip 2 | “A badge opens a door, not a conscience.” |
| gossip 3 | “Ask who benefits before you ask who shouts.” |
| refusal_rude | “Step back. Insults do not become evidence, and I will not continue this conversation.” |

Zone hub emotes, used without stranger chat, are: “Umbrellas up.” “Clear the curb.” “Patrol bell, one ring.” “Civic tram arriving.” “Keep the lane open.” “Witnesses to the blue line.” “No crowding the scene.” “Badge check complete.” “Breathe, then decide.” “Night shift holds.”

## 5) Premade choices / first hour

Each kit uses four authored beats: kit-specific visual check, origin question, a stake choice, and a consequence scene. `identity_confirmed` is written after the kit check; `first_choice` stores the stake; `observed_consequence` writes after the district reacts. Tutorial forced path: `civic_hall_north -> market_square -> old_clock -> ledger_room_north -> civic_hall_north`, then a skippable first-instance briefing.

Choice buttons are inventory-aware: `read_badge` (requires `starter_badge`, talk), `ask_witness` (requires `market_square`, talk), `secure_exit` (requires `ability_barrier_arc` or `ability_mend_field`, protect), `scan_seam` (requires `ability_trace_lens`, investigate), `cut_line` (requires `ability_flash_step`, fight move), `offer_water` (requires `water_flask`, aid), `seal_crate` (requires `evidence_tag`, collect), `call_marshal` (requires `civic_hall_north` visited, report). No button claims an outcome before the ledger resolves it.

Retry fingerprints are fixed: `{goal:save_courier,tactic:barrier,obstacle:jammed_gate,revelation:second_exit,consequence:market_trust}`; `{goal:preserve_evidence,tactic:scan,obstacle:rainwash,revelation:wax seal,consequence:legal_trust}`; `{goal:catch_runner,tactic:route_cut,obstacle:loose_sign,revelation:decoy,consequence:injury_risk}`; `{goal:calm_crowd,tactic:call_names,obstacle:rumor,revelation:missing_child,consequence:delay}`; `{goal:find_source,tactic:follow_heat,obstacle:vent maze,revelation:stolen battery,consequence:alarm}`; `{goal:protect_clinic,tactic:escort,obstacle:blocked tram,revelation:inside witness,consequence:clinic_trust}`; `{goal:identify_cape,tactic:compare marks,obstacle:copied emblem,revelation:forged badge,consequence:case_branch}`; `{goal:close_case,tactic:mediation,obstacle:revenge demand,revelation:repairable harm,consequence:district_peace}`.

## 6) Quests: primary-start DAG

The primary start is `northline_market`; its 18 authored beats are:

| `id` | Title / family | Objectives | Unlock | Gold / XP |
|---|---|---|---|---:|
| `bc_sentinel_rollcall` | Roll Call at Dawn / identity | `talk_to_npc:marshal_arden:1` | `bc_badge_test` | 8 / 25 |
| `bc_badge_test` | The Brass Mark / identity | `collect_item:starter_badge:1` | `bc_market_alarm` | 10 / 30 |
| `bc_market_alarm` | Three Bells / zone_story | `visit_place:market_square:1`,`talk_to_npc:broker_mira:1` | `bc_courier_choice` | 12 / 35 |
| `bc_courier_choice` | A Door Left Open / zone_story | `visit_place:old_clock:1` | `bc_rooftop_trace` | 12 / 35 |
| `bc_rooftop_trace` | Chalk on Copper / zone_story | `collect_item:chalk_signal:2`,`visit_place:roof_tanks:1` | `bc_witness_round` | 15 / 45 |
| `bc_witness_round` | Names in the Rain / identity | `talk_to_npc:witness_ren:1`,`talk_to_npc:broker_mira:1` | `bc_first_patrol` | 15 / 45 |
| `bc_first_patrol` | Hold the Line / zone_story | `ledger_kill:street_scrapper:3` | `bc_sealed_crate` | 18 / 55 |
| `bc_sealed_crate` | No Loose Proof / zone_story | `collect_item:evidence_tag:1`,`deliver_item:sealed_battery:1` | `bc_mira_debt` | 18 / 55 |
| `bc_mira_debt` | The Honest Price / side | `talk_to_npc:broker_mira:1`,`deliver_item:receipt_strip:1` | `bc_market_repair` | 14 / 40 |
| `bc_market_repair` | Patch the Stall / profession | `collect_item:canopy_cloth:3`,`talk_to_npc:broker_mira:1` | `bc_route_lesson` | 16 / 45 |
| `bc_route_lesson` | Read the Footfall / profession | `visit_place:old_clock:1`,`collect_item:chalk_signal:1` | `bc_daily_watch` | 16 / 45 |
| `bc_daily_watch` | Bell Before Rain / repeatable_daily | `ledger_kill:rain_runner:2`,`visit_place:market_square:1` | `bc_ledger_room` | 10 / 30 |
| `bc_ledger_room` | Room of Quiet Names / dungeon_breadcrumb | `visit_place:ledger_room_north:1`,`collect_item:case_seal:1` | `bc_counterfeit_thread` | 22 / 65 |
| `bc_counterfeit_thread` | The Copyist’s Thread / zone_story | `talk_to_npc:marshal_arden:1`,`collect_item:forged_badge:1` | `bc_tram_decision` | 24 / 70 |
| `bc_tram_decision` | Northbound / divergence | `visit_place:north_gate:1` | `bc_junction_call` | 20 / 60 |
| `bc_junction_call` | Four Lines Meet / campaign | `visit_place:junction_hub:1`,`talk_to_npc:witness_ren:1` | `bc_civic_capital` | 25 / 75 |
| `bc_civic_capital` | The Public Ledger / campaign | `visit_place:civic_capital:1`,`deliver_item:case_seal:1` | `bc_watch_trial` | 30 / 90 |
| `bc_watch_trial` | A Badge Under Glass / campaign | `ledger_kill:glass_mimic:1`,`visit_place:watch_capital:1` | none | 40 / 120 |

A second-start overview provides 18–20 beats per zone: `glassline_roofways` has signal relay, roof rescue, antenna sabotage, courier apprenticeship, vault breadcrumb, daily blackout, and 12 named follow-ups; `canalward_clinics` has consent checks, pump repairs, evacuation drills, triage craft, cellar breadcrumb, and 12 named follow-ups; `foundry_belt` has blueprint theft, cooling failures, maker apprenticeship, rail safety, bunker breadcrumb, daily spark watch, and 12 named follow-ups. Their first quests are `bc_runner_firstline`, `bc_healer_consent`, and `bc_analyst_seam`; each uses the same objective schema but distinct local threats and rewards from 8–42 gold and 25–125 XP.

Divergence records are explicit: walking away from the courier writes `walkaway_courier_delay`; exposing a forged badge publicly writes `walkaway_public_accusation`; choosing mediation over capture writes `walkaway_repair_first`. Each record changes later dialogue and never silently erases the promise.

## 7) Species / opponents / collectibles

These are original combat skins, not branded creatures. Each row is `speciesId | rarity | habitatTags | baseHp | baseAtk | ac`.

| Start | Species roster |
|---|---|
| Northline | `street_scrapper|common|market,metal|30|7|11`; `rain_runner|common|roof,rain|24|8|10`; `chalk_crawler|uncommon|alley,wall|42|10|12`; `crate_husher|uncommon|warehouse|48|9|13`; `glass_mimic|rare|ledger,glass|75|14|15`; `bell_wraith|epic|clock,night|110|19|17` |
| Glassline | `wire_gull|common|roof,wire|28|7|10`; `spark_mite|common|antenna|22|9|9`; `sign_leech|uncommon|billboard|44|11|12`; `lift_stalker|uncommon|service|52|10|13`; `relay_hound|rare|vault,signal|82|15|16`; `skyline_warden|epic|bridge,wind|120|20|18` |
| Canalward | `silt_skater|common|canal,silt|26|7|10`; `pipe_nipper|common|pump|32|8|11`; `reed_lurker|uncommon|garden,reed|46|10|12`; `valve_brute|uncommon|pump,iron|58|12|14`; `floodglass|rare|cellar,water|88|15|16`; `blue_tidebeast|epic|canal,night|125|20|18` |
| Foundry | `cinder_moth|common|kiln,ash|25|8|9`; `bolt_ratchet|common|scrap|34|8|11`; `slag_hopper|uncommon|viaduct|50|11|13`; `kilnback|uncommon|kiln,stone|62|12|14`; `forge_echo|rare|bunker,metal|92|16|16`; `rail_colossus|epic|rail,iron|135|21|19` |

Collectibles include `chalk_signal`, `evidence_tag`, `receipt_strip`, `sealed_battery`, `case_seal`, `forged_badge`, and cosmetics `raincoat_citrine`, `visor_matte`, `scarf_civic_blue`.

## 8) Loot / economy

Gold pays travel, repairs, and ordinary vendor goods; cosmetic tokens buy only appearance variants and emotes. Starter items are `starter_badge`, `padded_coat`, `baton_shield`, and `city_pin_map`. Profession outputs are `canopy_cloth`, `signal_wire`, `sterile_wrap`, and `coolant_brick`. Dungeon drops are `quiet_lens`, `hinge_guard`, `sealed_battery`, and `glassproof_case`; none increase combat power beyond ledger-approved item tiers.

| Source | Personal loot table |
|---|---|
| Street species | 60% scrap, 25% cloth, 12% evidence tag, 3% cosmetic dye |
| Room elites | 45% repair part, 35% case seal, 15% quiet lens, 5% cosmetic |
| Boss | 50% district badge trim, 30% 24 gold, 15% title mark, 5% rare emote |

Vendors sell `padded_coat` 18g, `baton_shield` 22g, `water_flask` 3g, `evidence_tag` 4g, `city_pin_map` 6g, and cosmetic `raincoat_citrine` for 12 cosmetic tokens. Repair cost is `repairCostPerPoint=1` gold, with a 75-gold daily repair cap. Gold faucets are quests, safe arrests, and profession deliveries; sinks are travel, repairs, and evidence supplies. Daily earning cap is 180 gold. Collection log entries record species, case seals, district badges, and discovered POIs.

## 9) Instances

### Five-man equivalent: `ledger_room_north`

| Room | Describe before creature | Encounter / exits |
|---|---|---|
| `lr_receiving_hall` | A tiled intake hall holds rainwater in numbered grooves; every door has a waxed case slot. | `street_scrapper x3`; exits `lr_archive_steps` |
| `lr_archive_steps` | Narrow stairs descend between shelves whose labels have been scraped away. | `chalk_crawler x2`; exits `lr_seal_checkpoint` |
| `lr_seal_checkpoint` | A brass desk and a blue lamp mark the checkpoint; sealed evidence rests behind a shutter. | Elite `crate_husher x1`; checkpoint; exits `lr_false_corridor` |
| `lr_false_corridor` | The corridor repeats in mirrored glass, making the party’s own badges look counterfeit. | `glass_mimic x2`; exits `lr_clock_chamber` |
| `lr_clock_chamber` | A circular chamber surrounds a stopped civic clock; loose paper turns without wind. | Boss `bell_wraith x1`; exits `civic_hall_north` |

Wipe returns to `lr_seal_checkpoint`; completion grants personal loot and 28 gold.

### Big instance: `morrowglass_civic_rite`

This 10-player equivalent is a citywide three-phase public safety operation, not a raid clone. Phase 1 `street_grid` stabilizes four alarm boxes; Phase 2 `witness_square` protects civilians while the evidence chain is audited; Phase 3 `signal_spire` confronts the organizer, `the_ink_captain`, whose attacks create false reports rather than world-ending destruction. Each phase has a checkpoint; failure returns the party to the phase checkpoint. Completion grants the civic title `case_complete` and cosmetic tokens, never power.

## 10) Progression

| Node | Cost | Requires | Effect flags |
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
| `district_oath` | 4 | `case_chain`,`crowd_voice` | `capital_access` |

No node is purchasable with cosmetic tokens. Capped contracts are: `northline_safe_route` (3 cases/day), `glassline_power_check` (2/day), `canalward_supply_run` (2/day), `foundry_coolant_watch` (2/day), and `civic_rite_briefing` (1/week).

## 11) Theme Kit + copy

Signalglass Patrol uses smoked navy, emergency amber, rain-silver, and clinic teal; materials are brushed badge metal, wet glass, chalk, and rubberized canvas. Dice are translucent amber with dark pips. Voice is restrained, humane, and procedural, with distant tram bells and one ambient loop: **“Rain on the Civic Span,”** a 74 BPM pulse of droplets, relay clicks, and low brass. Fashion is practical jackets, reflective piping, utility sashes, and removable badge plates.

UI labels: `Inventory=Kit Bag`; `Journal=Casebook`; `Map=District Board`; `Party=Patrol`; `Quest=Open Cases`; `Health=Condition`; `Gold=City Pay`; `Cosmetic Tokens=Trim Marks`; `Settings=Badge Desk`; `Fast Travel=Tram Route`; `Dungeon=Case Door`; `Boss=Priority Subject`; `Loot=Recovered Items`; `Craft=Workshop`; `Repair=Service Bench`; `Daily=Shift Board`; `Reputation=Public Trust`; `Tutorial=First Patrol`; `Checkpoint=Safe Desk`; `Collection=Evidence Wall`; `Exit=Return to Street`.

New Game card hooks: “The first bell rings before sunrise.” “A badge is a promise with witnesses.” “Someone is copying the city’s symbols.” “Four districts, one fragile chain of trust.” “Save the crowd or catch the culprit.” “Rain makes every footprint temporary.” “Your first case is small enough to matter.” “Proof can be heavier than a punch.” “The tram leaves when your report is filed.” “Morrowglass is watching what you choose.”

## 12) Failures + John’s calls

1. **Clone risk:** flamboyant capes could become a generic comic brawl; avoided through local cases, evidence chains, civic tradeoffs, and no famous power analogues.
2. **Clone risk:** a school or global super-team would flatten the premise; default is a working patrol network with four districts and two civic capitals.
3. **Clone risk:** power escalation could become spectacle; speculative default is capped neighborhood stakes and cosmetic prestige at the big instance.
4. **Clone risk:** procedural language could feel cold; durable NPCs use humane canned dialogue and every opening choice includes a personal stake.
5. **Open decision:** exact district count beyond the four starts is non-blocking; default is four starts plus two capitals and the junction hub.

**Integrity checklist:**

1. `worldId` is stable snake_case.
2. Display name is Badge Circuit.
3. Rules module is `hp_check`.
4. Genre is superhero patrol, not a licensed universe.
5. Ban-list contains more than 40 protected names and motifs.
6. No dump-error title is used as canon.
7. No live-service or platform references appear in-world.
8. Four starting zones are present.
9. Each start has a hub and six to eight POIs.
10. Two capitals and a mid-world join are defined.
11. Travel is graph-based and non-teleporting.
12. Six durable NPCs have roles and full canned talk nodes.
13. Hub chatter is canned, not stranger improvisation.
14. Opening choices include a stake.
15. HookArc flags are explicit.
16. Objectives use code-completeable verbs.
17. Primary start has 18 quest beats.
18. Rewards are numeric gold and XP.
19. Divergence records are explicit.
20. Species, loot, instance, progression, UI, hooks, and clone-risk calls are included.

No external references were used; this is original content.
